package com.vidyaschool.app.ui.screens

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.SliderImage
import com.vidyaschool.app.api.TeacherCalendarEvent
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.ui.components.SliderSkeleton
import kotlinx.coroutines.delay

// ─────────────────────────────────────────────────────────────────────────────
// Colour palette matching web teacher-calendar-widget
// ─────────────────────────────────────────────────────────────────────────────
private val CalendarBg       = Color(0xFF1A1A1A)
private val CalendarBorder   = Color(0xFFFFFFFF).copy(alpha = 0.06f)
private val TodayAccent      = Color(0xFFD7D842)   // yellow – today event
private val TodayBg          = Color(0xFF242416)   // yellow-tinted bg for today card
private val TodayBorder      = Color(0xFFD7D842).copy(alpha = 0.20f)
private val TodayDateRed     = Color(0xFFFF5A52)   // date label colour
private val TomorrowGray     = Color(0xFF8A8A8A)   // "TOMORROW" label
private val Purple           = Color(0xFF9D38FF)   // tomorrow event 1
private val OrangeRed        = Color(0xFFFF7A5A)   // tomorrow event 2
private val SurfaceHover     = Color(0xFFFFFFFF).copy(alpha = 0.03f)

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer for the calendar while loading
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun CalendarSkeleton() {
    val transition = rememberInfiniteTransition(label = "cal_shimmer")
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
        colors = listOf(Color(0xFF2A2A2A), Color(0xFF3A3A3A), Color(0xFF2A2A2A)),
        start = Offset(shimmerX - 300f, 0f),
        end   = Offset(shimmerX, 0f)
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(CalendarBg)
            .padding(20.dp)
    ) {
        Column {
            // header skeleton
            Box(modifier = Modifier.width(100.dp).height(14.dp).clip(RoundedCornerShape(7.dp)).background(shimmerBrush))
            Spacer(modifier = Modifier.height(16.dp))
            // today date label
            Box(modifier = Modifier.width(130.dp).height(10.dp).clip(RoundedCornerShape(5.dp)).background(shimmerBrush))
            Spacer(modifier = Modifier.height(10.dp))
            // today event card
            Box(modifier = Modifier.fillMaxWidth().height(42.dp).clip(RoundedCornerShape(14.dp)).background(shimmerBrush))
            Spacer(modifier = Modifier.height(20.dp))
            // tomorrow label
            Box(modifier = Modifier.width(90.dp).height(10.dp).clip(RoundedCornerShape(5.dp)).background(shimmerBrush))
            Spacer(modifier = Modifier.height(10.dp))
            // tomorrow rows
            Box(modifier = Modifier.fillMaxWidth().height(40.dp).clip(RoundedCornerShape(12.dp)).background(shimmerBrush))
            Spacer(modifier = Modifier.height(6.dp))
            Box(modifier = Modifier.fillMaxWidth().height(40.dp).clip(RoundedCornerShape(12.dp)).background(shimmerBrush))
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
    rowBg: Color = Color.Transparent,
    rowBorder: Color? = null,
    cornerRadius: Int = 12,
    height: Int = 40,
    horizontalPadding: Int = 10
) {
    val baseModifier = Modifier
        .fillMaxWidth()
        .height(height.dp)
        .clip(RoundedCornerShape(cornerRadius.dp))
        .background(rowBg)

    val styledModifier = if (rowBorder != null) {
        baseModifier.then(
            Modifier.background(
                rowBg,
                shape = RoundedCornerShape(cornerRadius.dp)
            )
        )
    } else baseModifier

    // Use a Surface so we can apply border stroke cleanly
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
                    color = accentColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = time,
                color = accentColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TeacherCalendarWidget – mirrors the web component exactly
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TeacherCalendarWidget(
    todayDateStr: String,
    todayEvents: List<TeacherCalendarEvent>,
    tomorrowEvents: List<TeacherCalendarEvent>
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = CalendarBg,
        border = androidx.compose.foundation.BorderStroke(0.8.dp, CalendarBorder),
        shadowElevation = 12.dp
    ) {
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp)) {

            // ── Header ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Calendar",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.3).sp
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
                                .background(Color(0xFF8A8A8A))
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── TODAY section ────────────────────────────────────────────────
            Text(
                text = todayDateStr.uppercase(),
                color = TodayDateRed,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )
            Spacer(modifier = Modifier.height(10.dp))

            if (todayEvents.isEmpty()) {
                Text(
                    text = "No classes scheduled today",
                    color = Color(0xFF8A8A8A),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            } else {
                todayEvents.take(4).forEach { ev ->
                    EventRow(
                        title        = ev.title,
                        time         = ev.time,
                        accentColor  = TodayAccent,
                        rowBg        = TodayBg,
                        rowBorder    = TodayBorder,
                        cornerRadius = 14,
                        height       = 42,
                        horizontalPadding = 14
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── TOMORROW section ─────────────────────────────────────────────
            Text(
                text = "TOMORROW",
                color = TomorrowGray,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (tomorrowEvents.isEmpty()) {
                Text(
                    text = "No classes scheduled tomorrow",
                    color = Color(0xFF8A8A8A),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            } else {
                val accentColors = remember { listOf(Purple, OrangeRed, TodayAccent, Purple) }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    tomorrowEvents.take(4).forEachIndexed { idx, ev ->
                        EventRow(
                            title       = ev.title,
                            time        = ev.time,
                            accentColor = accentColors[idx % accentColors.size],
                            rowBg       = Color.Transparent
                        )
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

    // ── Slider state ──────────────────────────────────────────────────────
    var sliderImages    by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }

    // ── Calendar state ────────────────────────────────────────────────────
    var calendarLoading  by remember { mutableStateOf(true) }
    var todayDateStr     by remember { mutableStateOf("TODAY") }
    var todayEvents      by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }
    var tomorrowEvents   by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }

    LaunchedEffect(Unit) {
        // Fetch slider images
        isLoadingSlider = true
        try {
            val response = RetrofitClient.authApi.getSliderImages(role = "teacher")
            if (response.isSuccessful) {
                sliderImages = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Failed to fetch slider images: ${e.message}")
        } finally {
            isLoadingSlider = false
        }
    }

    LaunchedEffect(sessionToken) {
        // Fetch calendar events directly from Python backend (api.vidyaschool.com)
        // using Bearer token — same auth as all other API calls
        calendarLoading = true
        try {
            if (!sessionToken.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getTeacherCalendar("Bearer $sessionToken")
                if (res.isSuccessful) {
                    val data = res.body()
                    data?.todayDateStr?.let { todayDateStr = it }
                    data?.todayEvents?.let   { todayEvents    = it }
                    data?.tomorrowEvents?.let { tomorrowEvents = it }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Calendar fetch error: ${e.message}")
        } finally {
            calendarLoading = false
        }
    }

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
        val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerAlpha"
        )
        val headerSlide by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerSlide"
        )

        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(bottom = 24.dp)
            ) {
                DashboardHeader(
                    title = "Dashboard",
                    subtitle = "Welcome, ${name.ifEmpty { "Teacher" }}",
                    onNotificationClick = onNotificationClick,
                    hasUnreadNotifications = hasUnread
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                ) {
                    // ── Image Slider ───────────────────────────────────────
                    if (isLoadingSlider) {
                        SliderSkeleton(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                    } else {
                        val enabledImages = sliderImages.filter { it.enabled }
                        if (enabledImages.isNotEmpty()) {
                            ImageSlider(
                                images = enabledImages,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                        }
                    }

                    // ── Calendar Widget (below slider) ─────────────────────
                    if (calendarLoading) {
                        CalendarSkeleton()
                    } else {
                        TeacherCalendarWidget(
                            todayDateStr   = todayDateStr,
                            todayEvents    = todayEvents,
                            tomorrowEvents = tomorrowEvents
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
                    onNotificationClick = onNotificationClick
                )
            }
        }
    }
}
