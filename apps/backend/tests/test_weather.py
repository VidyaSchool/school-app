import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.routes.weather import router as weather_router, get_grid_key, build_fallback_response, LAT_LON_DELTA
from models import WeatherCache
from app.core.database import get_db

# Create an in-memory SQLite database for testing with thread-safe StaticPool
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SQLModel.metadata.create_all(test_engine)

def get_test_db():
    with Session(test_engine) as session:
        yield session

test_app = FastAPI()
test_app.include_router(weather_router)
test_app.dependency_overrides[get_db] = get_test_db
client = TestClient(test_app)


def test_grid_key_snapping():
    # Test that nearby coordinates (within 0.05 degrees) snap to the same grid key
    key1 = get_grid_key(28.6139, 77.2090)
    key2 = get_grid_key(28.6145, 77.2095)
    key3 = get_grid_key(28.6200, 77.2100)

    assert key1 == key2
    assert key1.startswith("grid:")


def test_fallback_response_structure():
    fallback = build_fallback_response(city="Mumbai", lat=19.0760, lon=72.8777)
    assert fallback["success"] is True
    assert fallback["is_fallback"] is True
    assert fallback["location"]["name"] == "Mumbai"
    assert fallback["current"]["temperature"] is not None
    assert fallback["current"]["weather_descriptions"]


def test_weather_endpoint_fallback_without_api_key():
    # Without WEATHER_API key set, should return valid fallback response with 200 OK
    response = client.get("/api/weather/current?city=Jaipur")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "location" in data
    assert "current" in data
    assert data["location"]["name"] == "Jaipur"


def test_weather_endpoint_plus_minus_cache_hit():
    # Insert a cached entry in test db
    with Session(test_engine) as session:
        cache_entry = WeatherCache(
            query_key="grid:28.6:77.2",
            lat=28.6139,
            lon=77.2090,
            city_name="New Delhi",
            region="Delhi",
            country="India",
            temperature=31.5,
            feelslike=34.0,
            weather_descriptions='["Sunny"]',
            weather_icons='["https://example.com/sun.png"]',
            wind_speed=14.0,
            humidity=50,
            updated_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        session.add(cache_entry)
        session.commit()

    # Query with slightly different coordinates within plus-minus tolerance
    # (lat diff = 0.005 <= 0.05, lon diff = 0.005 <= 0.05)
    response = client.get("/api/weather/current?lat=28.6189&lon=77.2140")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cached"] is True
    assert data["cost_saved"] is True
    assert data["location"]["name"] == "New Delhi"
    assert data["current"]["temperature"] == 31.5


def test_weather_stats_endpoint():
    response = client.get("/api/weather/stats")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "cache_hit_rate_pct" in data
    assert data["lat_lon_grid_delta_degrees"] == LAT_LON_DELTA
