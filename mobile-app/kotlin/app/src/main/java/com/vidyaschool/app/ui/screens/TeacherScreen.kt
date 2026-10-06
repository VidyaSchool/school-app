package com.vidyaschool.app.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.SliderImage
import com.vidyaschool.app.api.TeacherCalendarEvent
import com.vidyaschool.app.api.WeatherResponse
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.ui.components.RainBackgroundEffect
import com.vidyaschool.app.ui.components.SliderSkeleton

@Composable
fun isTeacherAppInDarkTheme(): Boolean {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val isSurfaceDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f
    return when (sessionManager.getThemeMode()) {
        "light" -> false
        "dark" -> true
        else -> isSurfaceDark
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer for the calendar while loading (matches StudentTimetableSkeleton)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun CalendarSkeleton(
    isDark: Boolean = isTeacherAppInDarkTheme(),
    modifier: Modifier = Modifier
) {
    val transition = rememberInfiniteTransition(label = "teacher_cal_shimmer")
    val shimmerX by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerX"
    )
    val shimmerBrush = Brush.linearGradient(
        colors = if (isDark) {
            listOf(Color(0xFF27272A), Color(0xFF3F3F46), Color(0xFF27272A))
        } else {
            listOf(Color(0xFFF4F4F5), Color(0xFFE4E4E7), Color(0xFFF4F4F5))
        },
        start = Offset(shimmerX - 300f, 0f),
        end   = Offset(shimmerX, 0f)
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Column {
            Text(
                text = "Schedule",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Daily Classes & Events",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF))
                .border(
                    1.dp,
                    if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7),
                    RoundedCornerShape(20.dp)
                )
                .padding(18.dp)
        ) {
            Column {
                Box(modifier = Modifier.width(130.dp).height(10.dp).clip(RoundedCornerShape(5.dp)).background(shimmerBrush))
                Spacer(modifier = Modifier.height(10.dp))
                Box(modifier = Modifier.fillMaxWidth().height(42.dp).clip(RoundedCornerShape(12.dp)).background(shimmerBrush))
                Spacer(modifier = Modifier.height(18.dp))
                Box(modifier = Modifier.width(90.dp).height(10.dp).clip(RoundedCornerShape(5.dp)).background(shimmerBrush))
                Spacer(modifier = Modifier.height(10.dp))
                Box(modifier = Modifier.fillMaxWidth().height(40.dp).clip(RoundedCornerShape(12.dp)).background(shimmerBrush))
                Spacer(modifier = Modifier.height(6.dp))
                Box(modifier = Modifier.fillMaxWidth().height(40.dp).clip(RoundedCornerShape(12.dp)).background(shimmerBrush))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single event row (pill accent + title + time)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun EventRow(
    title: String,
    time: String,
    accentColor: Color,
    textColor: Color = accentColor,
    timeColor: Color = textColor,
    rowBg: Color = Color.Transparent,
    rowBorder: Color? = null,
    cornerRadius: Int = 12,
    height: Int = 40,
    horizontalPadding: Int = 10
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(height.dp),
        shape = RoundedCornerShape(cornerRadius.dp),
        color = rowBg,
        border = rowBorder?.let { androidx.compose.foundation.BorderStroke(0.8.dp, it) }
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = horizontalPadding.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f, fill = false),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Colour pill
                Box(
                    modifier = Modifier
                        .width(3.5.dp)
                        .height(16.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(accentColor)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = title,
                    color = textColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = time,
                color = timeColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TeacherCalendarWidget – theme adaptive and matches Student styling
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TeacherCalendarWidget(
    todayDateStr: String,
    todayEvents: List<TeacherCalendarEvent>,
    tomorrowEvents: List<TeacherCalendarEvent>,
    isDark: Boolean = isTeacherAppInDarkTheme(),
    modifier: Modifier = Modifier
) {
    val cardBg = if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF)
    val cardBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
    val todayDateRed = if (isDark) Color(0xFFFF5A52) else Color(0xFFE11D48)
    val tomorrowGray = if (isDark) Color(0xFF8A8A8A) else Color(0xFF71717A)
    val emptyTextColor = if (isDark) Color(0xFF8A8A8A) else Color(0xFF71717A)

    val todayBarColor = if (isDark) Color(0xFFD7D842) else Color(0xFFEAB308)
    val todayTextColor = if (isDark) Color(0xFFD7D842) else Color(0xFF854D0E)
    val todayRowBg = if (isDark) Color(0xFF242416) else Color(0xFFFEFCE8)
    val todayRowBorder = if (isDark) Color(0xFFD7D842).copy(alpha = 0.22f) else Color(0xFFEAB308).copy(alpha = 0.35f)

    val tomorrowAccentBars = if (isDark) {
        listOf(Color(0xFFC084FC), Color(0xFFFF7A5A), Color(0xFFD7D842), Color(0xFF60A5FA))
    } else {
        listOf(Color(0xFF8B5CF6), Color(0xFFEA580C), Color(0xFFCA8A04), Color(0xFF2563EB))
    }
    val tomorrowRowBg = if (isDark) Color.Transparent else Color(0xFFF8FAFC)
    val tomorrowRowBorder = if (isDark) null else Color(0xFFE2E8F0)
    val tomorrowTextColor = if (isDark) Color(0xFFE4E4E7) else Color(0xFF1E293B)
    val tomorrowTimeColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)

    Column(modifier = modifier.fillMaxWidth()) {
        Column {
            Text(
                text = "Schedule",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Daily Classes & Events",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = cardBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder),
            shadowElevation = if (isDark) 0.dp else 1.dp
        ) {
            Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp)) {
                // ── Header row with 3 dots ───────────────────────────────────
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = todayDateStr.uppercase(),
                        color = todayDateRed,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.1.sp
                    )
                    // Three-dot icon placeholder
                    Column(
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        repeat(3) {
                            Box(
                                modifier = Modifier
                                    .size(3.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(tomorrowGray)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(9.dp))

                if (todayEvents.isEmpty()) {
                    Text(
                        text = "No classes scheduled today",
                        color = emptyTextColor,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                } else {
                    todayEvents.take(4).forEach { ev ->
                        EventRow(
                            title        = ev.title,
                            time         = ev.time,
                            accentColor  = todayBarColor,
                            textColor    = todayTextColor,
                            timeColor    = todayTextColor,
                            rowBg        = todayRowBg,
                            rowBorder    = todayRowBorder,
                            cornerRadius = 12,
                            height       = 42,
                            horizontalPadding = 12
                        )
                        Spacer(modifier = Modifier.height(5.dp))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // ── TOMORROW section ─────────────────────────────────────────────
                Text(
                    text = "TOMORROW",
                    color = tomorrowGray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                if (tomorrowEvents.isEmpty()) {
                    Text(
                        text = "No classes scheduled tomorrow",
                        color = emptyTextColor,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        tomorrowEvents.take(4).forEachIndexed { idx, ev ->
                            val barColor = tomorrowAccentBars[idx % tomorrowAccentBars.size]
                            EventRow(
                                title       = ev.title,
                                time        = ev.time,
                                accentColor = barColor,
                                textColor   = if (isDark) barColor else tomorrowTextColor,
                                timeColor   = if (isDark) barColor else tomorrowTimeColor,
                                rowBg       = tomorrowRowBg,
                                rowBorder   = tomorrowRowBorder,
                                cornerRadius = 12,
                                height       = 40,
                                horizontalPadding = 10
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TeacherScreen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TeacherScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val sessionToken   = sessionManager.getSessionToken()

    var teacherCity by remember { mutableStateOf<String?>(null) }

    // Fetch profile to resolve city for weather
    LaunchedEffect(sessionToken) {
        if (sessionToken.isNullOrEmpty()) return@LaunchedEffect
        try {
            val response = RetrofitClient.authApi.getProfile("Bearer $sessionToken")
            if (response.isSuccessful) {
                val profile = response.body()?.profile
                profile?.city?.takeIf { it.isNotBlank() }?.let { teacherCity = it }
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Failed to fetch teacher profile: ${e.message}")
        }
    }

    // ── Slider state ──────────────────────────────────────────────────────
    var sliderImages    by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        isLoadingSlider = true
        try {
            val response = RetrofitClient.authApi.getSliderImages(role = "teacher")
            if (response.isSuccessful && response.body() != null) {
                sliderImages = response.body()!!
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Failed to fetch slider images: ${e.message}")
        } finally {
            isLoadingSlider = false
        }
    }

    // ── Calendar state ────────────────────────────────────────────────────
    var calendarLoading  by remember { mutableStateOf(true) }
    var todayDateStr     by remember { mutableStateOf("TODAY, SCHEDULE") }
    var todayEvents      by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }
    var tomorrowEvents   by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }

    LaunchedEffect(sessionToken) {
        calendarLoading = true
        try {
            if (!sessionToken.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getTeacherCalendar("Bearer $sessionToken")
                if (res.isSuccessful && res.body() != null) {
                    val data = res.body()
                    data?.todayDateStr?.let { todayDateStr = it }
                    todayEvents    = data?.todayEvents ?: emptyList()
                    tomorrowEvents = data?.tomorrowEvents ?: emptyList()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Calendar fetch error: ${e.message}")
        } finally {
            calendarLoading = false
        }
    }

    // ── Weather & Rain state matching StudentScreen ───────────────────────
    var weatherResponse by remember { mutableStateOf<WeatherResponse?>(null) }
    var isWeatherLoading by remember { mutableStateOf(false) }

    LaunchedEffect(teacherCity) {
        isWeatherLoading = true
        try {
            var userLat: Double? = null
            var userLon: Double? = null

            try {
                val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (hasFine || hasCoarse) {
                    val locManager = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
                    val lastLoc = locManager?.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                        ?: locManager?.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                        ?: locManager?.getLastKnownLocation(android.location.LocationManager.PASSIVE_PROVIDER)
                    if (lastLoc != null) {
                        userLat = lastLoc.latitude
                        userLon = lastLoc.longitude
                    }
                }
            } catch (e: Exception) {
                // Location access error fallback
            }

            val cityQuery = if (userLat == null || userLon == null) (teacherCity?.ifBlank { "auto" } ?: "auto") else null
            val res = RetrofitClient.authApi.getCurrentWeather(
                lat = userLat,
                lon = userLon,
                city = cityQuery
            )
            if (res.isSuccessful && res.body() != null) {
                weatherResponse = res.body()
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherWeather", "Failed to fetch weather: ${e.message}")
        } finally {
            isWeatherLoading = false
        }
    }

    val weatherCurrent = weatherResponse?.current
    val weatherDesc = weatherCurrent?.weatherDescriptions?.firstOrNull() ?: ""

    // Condition check: Show rain animation ONLY when weather indicates rain
    val isRaining = remember(weatherResponse) {
        if (weatherResponse == null) {
            false
        } else {
            val code = weatherCurrent?.weatherCode
            val isCodeRain = code != null && (code in 51..67 || code in 80..82 || code in 95..99)
            val allDesc = weatherCurrent?.weatherDescriptions?.joinToString(" ")?.lowercase() ?: ""
            val isTextRain = allDesc.contains("rain") || allDesc.contains("drizzle") ||
                    allDesc.contains("shower") || allDesc.contains("thunder") ||
                    allDesc.contains("storm") || allDesc.contains("downpour") ||
                    allDesc.contains("monsoon") || allDesc.contains("sprinkle") ||
                    allDesc.contains("precip")
            isCodeRain || isTextRain
        }
    }

    val isLightningCondition = remember(weatherResponse) {
        val code = weatherCurrent?.weatherCode
        val isCodeThunder = code != null && (code in 95..99)
        val allDesc = weatherCurrent?.weatherDescriptions?.joinToString(" ")?.lowercase() ?: ""
        isCodeThunder || allDesc.contains("thunder") || allDesc.contains("storm") || allDesc.contains("heavy")
    }

    val isDark = isTeacherAppInDarkTheme()

    DashboardLayout(
        role = "teacher",
        provider = provider,
        email = email,
        name = name,
        avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
        themeMode = themeMode,
        onThemeChange = onThemeChange,
        onLogout = onLogout
    ) { onNotificationClick, hasUnread ->
        val scrollState = rememberScrollState()
        val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
        val headerAlpha by animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = tween(220),
            label = "headerAlpha"
        )
        val headerSlide by animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = tween(220),
            label = "headerSlide"
        )

        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(bottom = 24.dp)
            ) {
                // Header & Carousel container with Rain animation - ONLY rendered when it is raining!
                Box(modifier = Modifier.fillMaxWidth()) {
                    if (isRaining) {
                        RainBackgroundEffect(
                            modifier = Modifier
                                .matchParentSize()
                                .zIndex(-1f),
                            weatherCondition = weatherDesc,
                            enableSplashes = true,
                            enableLightning = isLightningCondition
                        )
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                    ) {
                        DashboardHeader(
                            title = "Dashboard",
                            subtitle = "Welcome, ${name.ifEmpty { "Teacher" }}",
                            onNotificationClick = onNotificationClick,
                            hasUnreadNotifications = hasUnread,
                            isDarkHeader = if (isRaining) isDark else false
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp)
                        ) {
                            if (isLoadingSlider) {
                                SliderSkeleton(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(185.dp)
                                )
                            } else {
                                val enabledImages = sliderImages.filter { it.enabled }
                                ImageSlider(
                                    images = enabledImages,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(185.dp)
                                )
                            }
                        }

                        // Margin below slider where raindrops splash
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    // ── Calendar Widget (below slider) ─────────────────────
                    if (calendarLoading) {
                        CalendarSkeleton(isDark = isDark)
                    } else {
                        TeacherCalendarWidget(
                            todayDateStr   = todayDateStr,
                            todayEvents    = todayEvents,
                            tomorrowEvents = tomorrowEvents,
                            isDark         = isDark
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }

            if (headerAlpha > 0f) {
                DashboardStickyHeader(
                    title = "Dashboard",
                    headerAlpha = headerAlpha,
                    headerSlide = headerSlide,
                    onNotificationClick = onNotificationClick,
                    hasUnreadNotifications = hasUnread
                )
            }
        }
    }
}
