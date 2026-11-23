import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple

import httpx
from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.database import get_db
from models import WeatherCache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weather", tags=["weather"])

# ── Configuration & Cost Minimization Constants ──────────────────────────────
# Plus-minus tolerance in degrees (0.05 degrees ~ 5.5 km / 3.4 miles)
# Weather conditions are uniform within this radius.
LAT_LON_DELTA = 0.05

# Cache duration: 30 minutes before refreshing
CACHE_TTL_MINUTES = 30

# In-memory single-flight lock map to prevent concurrent duplicate API calls
_locks: Dict[str, asyncio.Lock] = {}
_global_lock = asyncio.Lock()

# In-memory fast cache (key -> (timestamp, data_dict))
_memory_cache: Dict[str, tuple[datetime, Dict[str, Any]]] = {}

# Stats tracking
_stats = {
    "total_requests": 0,
    "cache_hits": 0,
    "api_calls_weatherstack": 0,
    "api_calls_open_meteo": 0,
    "api_errors": 0,
    "fallbacks_served": 0,
}

# WMO Weather Code mapping for Open-Meteo
WMO_WEATHER_MAP: Dict[int, Tuple[str, str]] = {
    0: ("Clear sky", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png"),
    1: ("Mainly clear", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"),
    2: ("Partly cloudy", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"),
    3: ("Overcast", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0004_black_low_cloud.png"),
    45: ("Fog", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0006_mist.png"),
    48: ("Depositing rime fog", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0006_mist.png"),
    51: ("Light Drizzle", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0009_light_rain_showers.png"),
    53: ("Moderate Drizzle", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0010_heavy_rain_showers.png"),
    55: ("Dense Drizzle", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0010_heavy_rain_showers.png"),
    56: ("Light Freezing Drizzle", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0011_light_snow_showers.png"),
    57: ("Dense Freezing Drizzle", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0012_heavy_snow_showers.png"),
    61: ("Slight Rain", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0009_light_rain_showers.png"),
    63: ("Moderate Rain", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0010_heavy_rain_showers.png"),
    65: ("Heavy Rain", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0018_cloudy_with_heavy_rain.png"),
    66: ("Light Freezing Rain", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0011_light_snow_showers.png"),
    67: ("Heavy Freezing Rain", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0012_heavy_snow_showers.png"),
    71: ("Slight Snow", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0011_light_snow_showers.png"),
    73: ("Moderate Snow", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0012_heavy_snow_showers.png"),
    75: ("Heavy Snow", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0012_heavy_snow_showers.png"),
    77: ("Snow grains", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0011_light_snow_showers.png"),
    80: ("Light Rain Showers", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0009_light_rain_showers.png"),
    81: ("Moderate Rain Showers", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0010_heavy_rain_showers.png"),
    82: ("Violent Rain Showers", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0018_cloudy_with_heavy_rain.png"),
    85: ("Slight Snow Showers", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0011_light_snow_showers.png"),
    86: ("Heavy Snow Showers", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0012_heavy_snow_showers.png"),
    95: ("Thunderstorm", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0016_thundery_showers.png"),
    96: ("Thunderstorm with Hail", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0016_thundery_showers.png"),
    99: ("Heavy Thunderstorm with Hail", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0016_thundery_showers.png"),
}


def degrees_to_cardinal(deg: Optional[float]) -> str:
    if deg is None:
        return "N"
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    val = int((deg / 22.5) + 0.5)
    return directions[val % 16]


class WeatherLocation(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    localtime: Optional[str] = None


class WeatherCurrent(BaseModel):
    temperature: Optional[float] = None
    feelslike: Optional[float] = None
    weather_code: Optional[int] = None
    weather_descriptions: List[str] = []
    weather_icons: List[str] = []
    wind_speed: Optional[float] = None
    wind_dir: Optional[str] = None
    humidity: Optional[int] = None
    uv_index: Optional[int] = None
    visibility: Optional[float] = None
    pressure: Optional[int] = None
    precip: Optional[float] = None
    is_day: Optional[str] = "yes"


class WeatherResponse(BaseModel):
    success: bool = True
    location: Optional[WeatherLocation] = None
    current: Optional[WeatherCurrent] = None
    cached: bool = False
    cost_saved: bool = False
    is_fallback: bool = False
    cache_type: Optional[str] = None
    cached_at: Optional[str] = None
    message: Optional[str] = None


def get_grid_key(lat: float, lon: float) -> str:
    """Snaps latitude & longitude to the nearest plus-minus grid coordinate."""
    grid_lat = round(round(lat / LAT_LON_DELTA) * LAT_LON_DELTA, 3)
    grid_lon = round(round(lon / LAT_LON_DELTA) * LAT_LON_DELTA, 3)
    return f"grid:{grid_lat}:{grid_lon}"


def build_fallback_response(
    city: str = "New Delhi",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    message: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates a realistic default fallback weather payload so UI remains functional."""
    _stats["fallbacks_served"] += 1
    return {
        "success": True,
        "location": {
            "name": city.title() if city else "School Campus",
            "region": "Delhi" if "delhi" in (city or "").lower() else "Local",
            "country": "India",
            "lat": lat if lat is not None else 28.6139,
            "lon": lon if lon is not None else 77.2090,
            "localtime": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        },
        "current": {
            "temperature": 28.0,
            "feelslike": 30.0,
            "weather_code": 113,
            "weather_descriptions": ["Sunny & Pleasant"],
            "weather_icons": [
                "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
            ],
            "wind_speed": 10.0,
            "wind_dir": "NW",
            "humidity": 48,
            "uv_index": 5,
            "visibility": 8.0,
            "pressure": 1012,
            "precip": 0.0,
            "is_day": "yes",
        },
        "cached": False,
        "cost_saved": True,
        "is_fallback": True,
        "cache_type": "fallback",
        "cached_at": datetime.utcnow().isoformat(),
        "message": message or "Using default weather data",
    }


def entity_to_response_dict(entity: WeatherCache, cache_type: str = "db") -> Dict[str, Any]:
    """Converts a WeatherCache database record into a clean response dictionary."""
    try:
        descriptions = json.loads(entity.weather_descriptions or "[]")
    except Exception:
        descriptions = [entity.weather_descriptions] if entity.weather_descriptions else []

    try:
        icons = json.loads(entity.weather_icons or "[]")
    except Exception:
        icons = [entity.weather_icons] if entity.weather_icons else []

    return {
        "success": True,
        "location": {
            "name": entity.city_name,
            "region": entity.region,
            "country": entity.country,
            "lat": entity.lat,
            "lon": entity.lon,
            "localtime": entity.updated_at.strftime("%Y-%m-%d %H:%M"),
        },
        "current": {
            "temperature": entity.temperature,
            "feelslike": entity.feelslike,
            "weather_code": entity.weather_code,
            "weather_descriptions": descriptions,
            "weather_icons": icons,
            "wind_speed": entity.wind_speed,
            "wind_dir": entity.wind_dir,
            "humidity": entity.humidity,
            "uv_index": entity.uv_index,
            "visibility": entity.visibility,
            "pressure": entity.pressure,
            "precip": entity.precip,
            "is_day": entity.is_day or "yes",
        },
        "cached": True,
        "cost_saved": True,
        "is_fallback": False,
        "cache_type": cache_type,
        "cached_at": entity.updated_at.isoformat(),
    }


async def get_or_create_lock(key: str) -> asyncio.Lock:
    async with _global_lock:
        if key not in _locks:
            _locks[key] = asyncio.Lock()
        return _locks[key]


async def fetch_from_open_meteo(
    lat: float,
    lon: float,
    city_name: str = "Local",
    region: str = "",
    country: str = "India"
) -> Optional[Dict[str, Any]]:
    """
    Fetches real-time weather from Open-Meteo (100% Free, Public Domain, No API Key required).
    """
    _stats["api_calls_open_meteo"] += 1
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m",
        "hourly": "visibility,uv_index",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                logger.warning(f"Open-Meteo returned status {resp.status_code}")
                return None
            data = resp.json()

        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 25.0))
        feelslike = float(current.get("apparent_temperature", temp))
        wmo_code = int(current.get("weather_code", 0))
        desc, icon = WMO_WEATHER_MAP.get(wmo_code, ("Clear sky", "https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png"))
        humidity = int(current.get("relative_humidity_2m", 50))
        wind_spd = float(current.get("wind_speed_10m", 10.0))
        wind_dir = degrees_to_cardinal(current.get("wind_direction_10m"))
        pressure = int(current.get("surface_pressure", 1012))
        precip = float(current.get("precipitation", 0.0))
        is_day = "yes" if current.get("is_day", 1) == 1 else "no"

        # Extract current hour visibility and UV index if available
        hourly = data.get("hourly", {})
        vis_list = hourly.get("visibility", [])
        uv_list = hourly.get("uv_index", [])
        visibility = round(float(vis_list[0]) / 1000.0, 1) if vis_list else 10.0
        uv_index = int(round(uv_list[0])) if uv_list else (5 if is_day == "yes" else 0)

        return {
            "lat": lat,
            "lon": lon,
            "city_name": city_name,
            "region": region,
            "country": country,
            "temperature": temp,
            "feelslike": feelslike,
            "weather_code": wmo_code,
            "weather_descriptions": [desc],
            "weather_icons": [icon],
            "wind_speed": wind_spd,
            "wind_dir": wind_dir,
            "humidity": humidity,
            "uv_index": uv_index,
            "visibility": visibility,
            "pressure": pressure,
            "precip": precip,
            "is_day": is_day,
            "raw_data": data,
        }
    except Exception as e:
        logger.error(f"Failed to fetch from Open-Meteo: {e}")
        return None


async def geocode_city_open_meteo(city: str) -> Optional[Tuple[float, float, str, str, str]]:
    """Geocodes a city name to latitude/longitude using Open-Meteo geocoding service."""
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": city, "count": 1, "language": "en", "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    first = results[0]
                    return (
                        float(first.get("latitude")),
                        float(first.get("longitude")),
                        first.get("name", city.title()),
                        first.get("admin1", ""),
                        first.get("country", "India"),
                    )
    except Exception as e:
        logger.warning(f"Geocoding failed for city '{city}': {e}")
    return None


@router.get("/current", response_model=WeatherResponse)
async def get_current_weather(
    lat: Optional[float] = Query(None, description="Latitude (e.g. 28.6139)"),
    lon: Optional[float] = Query(None, description="Longitude (e.g. 77.2090)"),
    city: Optional[str] = Query(None, description="City name (e.g. New Delhi)"),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    Fetches the current weather status with a cost-minimization plus-minus caching strategy.
    
    1. Coordinates Snapping & Plus-Minus Search (±0.05° ~ 5.5 km):
       - Coordinates within ±0.05° match the same cached weather grid.
    2. 30-Minute Time-To-Live (TTL):
       - Weather updates are cached for 30 minutes in database & memory.
    3. Dual-Provider with Free Fallback:
       - Uses Weatherstack if WEATHER_API key is set.
       - Automatically uses Open-Meteo (100% Free, zero key required) if no key is provided or on rate limits.
    """
    _stats["total_requests"] += 1
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=CACHE_TTL_MINUTES)

    # 1. Determine Cache Query Key & Spatial Grid
    is_geo = lat is not None and lon is not None
    if is_geo:
        cache_key = get_grid_key(lat, lon)
        api_query = f"{lat},{lon}"
    elif city and city.strip():
        norm_city = city.strip().lower()
        cache_key = f"city:{norm_city}"
        api_query = city.strip()
    else:
        default_city = "New Delhi"
        cache_key = f"city:{default_city.lower()}"
        api_query = default_city

    # 2. Check Fast In-Memory Cache
    if cache_key in _memory_cache:
        cached_time, cached_data = _memory_cache[cache_key]
        if cached_time >= cutoff:
            _stats["cache_hits"] += 1
            result = dict(cached_data)
            result["cached"] = True
            result["cost_saved"] = True
            result["cache_type"] = "memory"
            return result

    # 3. Check Database Cache with Plus-Minus Logic
    # 3a. Exact / Grid query_key lookup
    db_cache: Optional[WeatherCache] = db.exec(
        select(WeatherCache)
        .where(WeatherCache.query_key == cache_key)
        .where(WeatherCache.updated_at >= cutoff)
        .order_by(WeatherCache.updated_at.desc())
    ).first()

    # 3b. Plus-Minus Spatial Proximity Search for Geocoordinates
    if not db_cache and is_geo:
        proximity_candidates = db.exec(
            select(WeatherCache)
            .where(WeatherCache.lat != None)
            .where(WeatherCache.lon != None)
            .where(WeatherCache.updated_at >= cutoff)
            .order_by(WeatherCache.updated_at.desc())
        ).all()

        for cand in proximity_candidates:
            if cand.lat is not None and cand.lon is not None:
                if abs(cand.lat - lat) <= LAT_LON_DELTA and abs(cand.lon - lon) <= LAT_LON_DELTA:
                    db_cache = cand
                    break

    if db_cache:
        _stats["cache_hits"] += 1
        resp = entity_to_response_dict(db_cache, cache_type="geo_proximity" if is_geo else "db")
        _memory_cache[cache_key] = (db_cache.updated_at, resp)
        return resp

    # 4. Cache Miss -> Lock and Fetch from Provider
    lock = await get_or_create_lock(cache_key)
    async with lock:
        # Double-check in-memory cache after acquiring lock
        if cache_key in _memory_cache:
            cached_time, cached_data = _memory_cache[cache_key]
            if cached_time >= cutoff:
                _stats["cache_hits"] += 1
                result = dict(cached_data)
                result["cached"] = True
                result["cost_saved"] = True
                result["cache_type"] = "memory"
                return result

        api_key = (
            os.getenv("WEATHER_API")
            or os.getenv("WEATHERSTACK_API_KEY")
            or ""
        ).strip()

        weather_parsed: Optional[Dict[str, Any]] = None
        provider_name = "fallback"

        # 5. Try Weatherstack if API key is present
        if api_key:
            _stats["api_calls_weatherstack"] += 1
            weatherstack_base_url = os.getenv("WEATHERSTACK_BASE_URL", "http://api.weatherstack.com/current")
            params = {
                "access_key": api_key,
                "query": api_query,
                "units": "m",
            }
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(weatherstack_base_url, params=params)
                    data = resp.json()

                if "error" not in data and data.get("success") is not False and "current" in data:
                    loc_data = data.get("location", {})
                    curr_data = data.get("current", {})
                    res_lat = float(loc_data.get("lat")) if loc_data.get("lat") is not None else lat
                    res_lon = float(loc_data.get("lon")) if loc_data.get("lon") is not None else lon

                    weather_parsed = {
                        "lat": res_lat,
                        "lon": res_lon,
                        "city_name": loc_data.get("name") or city or "Local",
                        "region": loc_data.get("region"),
                        "country": loc_data.get("country"),
                        "temperature": float(curr_data.get("temperature", 0.0)),
                        "feelslike": float(curr_data.get("feelslike", curr_data.get("temperature", 0.0))),
                        "weather_code": int(curr_data.get("weather_code", 0)),
                        "weather_descriptions": curr_data.get("weather_descriptions", []),
                        "weather_icons": curr_data.get("weather_icons", []),
                        "wind_speed": float(curr_data.get("wind_speed", 0.0)),
                        "wind_dir": curr_data.get("wind_dir"),
                        "humidity": int(curr_data.get("humidity", 0)),
                        "uv_index": int(curr_data.get("uv_index", 0)),
                        "visibility": float(curr_data.get("visibility", 0.0)),
                        "pressure": int(curr_data.get("pressure", 0)),
                        "precip": float(curr_data.get("precip", 0.0)),
                        "is_day": curr_data.get("is_day", "yes"),
                        "raw_data": data,
                    }
                    provider_name = "weatherstack"
                else:
                    logger.warning(f"Weatherstack failed, falling back to Open-Meteo: {data.get('error')}")
            except Exception as ex:
                logger.warning(f"Weatherstack exception, falling back to Open-Meteo: {ex}")

        # 6. If no Weatherstack or Weatherstack failed, use Open-Meteo (Free Live Weather)
        if not weather_parsed:
            target_lat = lat
            target_lon = lon
            target_city = city or "New Delhi"
            target_region = ""
            target_country = "India"

            if target_lat is None or target_lon is None:
                # Geocode city with Open-Meteo
                geo = await geocode_city_open_meteo(target_city)
                if geo:
                    target_lat, target_lon, target_city, target_region, target_country = geo
                else:
                    # Default coordinates for New Delhi
                    target_lat, target_lon = 28.6139, 77.2090
                    target_city = target_city or "New Delhi"

            om_result = await fetch_from_open_meteo(
                lat=target_lat,
                lon=target_lon,
                city_name=target_city,
                region=target_region,
                country=target_country,
            )
            if om_result:
                weather_parsed = om_result
                provider_name = "open_meteo"

        # 7. If both providers failed, fallback to stale DB cache or static fallback
        if not weather_parsed:
            _stats["api_errors"] += 1
            stale = db.exec(
                select(WeatherCache)
                .where(WeatherCache.query_key == cache_key)
                .order_by(WeatherCache.updated_at.desc())
            ).first()
            if stale:
                res = entity_to_response_dict(stale, cache_type="stale_db")
                res["message"] = "Served from stale cache"
                return res

            return build_fallback_response(
                city=city or "New Delhi",
                lat=lat,
                lon=lon,
                message="Using default weather data",
            )

        # 8. Save/Update record in Database and In-Memory Cache
        existing_record = db.exec(
            select(WeatherCache).where(WeatherCache.query_key == cache_key)
        ).first()

        if existing_record:
            existing_record.lat = weather_parsed["lat"]
            existing_record.lon = weather_parsed["lon"]
            existing_record.city_name = weather_parsed["city_name"]
            existing_record.region = weather_parsed["region"]
            existing_record.country = weather_parsed["country"]
            existing_record.temperature = weather_parsed["temperature"]
            existing_record.feelslike = weather_parsed["feelslike"]
            existing_record.weather_code = weather_parsed["weather_code"]
            existing_record.weather_descriptions = json.dumps(weather_parsed["weather_descriptions"])
            existing_record.weather_icons = json.dumps(weather_parsed["weather_icons"])
            existing_record.wind_speed = weather_parsed["wind_speed"]
            existing_record.wind_dir = weather_parsed["wind_dir"]
            existing_record.humidity = weather_parsed["humidity"]
            existing_record.uv_index = weather_parsed["uv_index"]
            existing_record.visibility = weather_parsed["visibility"]
            existing_record.pressure = weather_parsed["pressure"]
            existing_record.precip = weather_parsed["precip"]
            existing_record.is_day = weather_parsed["is_day"]
            existing_record.raw_response = json.dumps(weather_parsed.get("raw_data", {}))
            existing_record.updated_at = now
            db.add(existing_record)
            target_record = existing_record
        else:
            new_record = WeatherCache(
                query_key=cache_key,
                lat=weather_parsed["lat"],
                lon=weather_parsed["lon"],
                city_name=weather_parsed["city_name"],
                region=weather_parsed["region"],
                country=weather_parsed["country"],
                temperature=weather_parsed["temperature"],
                feelslike=weather_parsed["feelslike"],
                weather_code=weather_parsed["weather_code"],
                weather_descriptions=json.dumps(weather_parsed["weather_descriptions"]),
                weather_icons=json.dumps(weather_parsed["weather_icons"]),
                wind_speed=weather_parsed["wind_speed"],
                wind_dir=weather_parsed["wind_dir"],
                humidity=weather_parsed["humidity"],
                uv_index=weather_parsed["uv_index"],
                visibility=weather_parsed["visibility"],
                pressure=weather_parsed["pressure"],
                precip=weather_parsed["precip"],
                is_day=weather_parsed["is_day"],
                raw_response=json.dumps(weather_parsed.get("raw_data", {})),
                created_at=now,
                updated_at=now,
            )
            db.add(new_record)
            target_record = new_record

        db.commit()
        db.refresh(target_record)

        final_response = entity_to_response_dict(target_record, cache_type=f"live_{provider_name}")
        final_response["cached"] = False
        final_response["cost_saved"] = provider_name == "open_meteo"

        _memory_cache[cache_key] = (now, final_response)
        return final_response


@router.get("/stats")
def get_weather_cache_stats(db: Session = Depends(get_db)):
    """Observability endpoint to monitor cache efficiency and cost savings."""
    total_db_entries = len(db.exec(select(WeatherCache)).all())
    hit_rate = (
        round((_stats["cache_hits"] / _stats["total_requests"]) * 100, 2)
        if _stats["total_requests"] > 0
        else 0.0
    )
    return {
        "metrics": _stats,
        "cache_hit_rate_pct": hit_rate,
        "total_cached_locations_in_db": total_db_entries,
        "memory_cached_keys": len(_memory_cache),
        "lat_lon_grid_delta_degrees": LAT_LON_DELTA,
        "cache_ttl_minutes": CACHE_TTL_MINUTES,
    }
