package com.vidyaschool.app.ui.screens

import android.graphics.Paint
 import android.graphics.Typeface
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Shader
import android.graphics.PorterDuff
import androidx.compose.ui.graphics.Paint as ComposePaint
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.draw.clip
import androidx.compose.ui.zIndex
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.luminance
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.vidyaschool.app.api.TeacherCalendarEvent
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.TopPerformerItem
import com.vidyaschool.app.api.WeatherResponse
import com.vidyaschool.app.ui.components.SliderSkeleton
import com.vidyaschool.app.ui.components.RainBackgroundEffect
import androidx.compose.ui.zIndex
import com.vidyaschool.app.api.SliderImage
import coil.compose.AsyncImage
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import kotlinx.coroutines.delay
import androidx.compose.ui.platform.LocalContext
import com.vidyaschool.app.auth.SessionManager
import kotlinx.coroutines.launch
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.LoadAdError

@Composable
fun isStudentAppInDarkTheme(): Boolean {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val isSurfaceDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f
    return when (sessionManager.getThemeMode()) {
        "light" -> false
        "dark" -> true
        else -> isSurfaceDark
    }
}

@Composable
fun StudentScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    studentClass: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onShowLibrary: () -> Unit = {},
    onShowAcademicPerformance: () -> Unit = {},
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = sessionManager.getSessionToken()

    var currentStudentClass by remember { mutableStateOf(studentClass) }
    var studentCity by remember { mutableStateOf<String?>(null) }
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }
    var showOnboarding by remember { mutableStateOf(false) }
    var isCheckingOnboarding by remember { mutableStateOf(true) }

    LaunchedEffect(sessionToken) {
        isCheckingOnboarding = true
        if (sessionToken.isNullOrEmpty()) {
            isCheckingOnboarding = false
            return@LaunchedEffect
        }
        try {
            val response = RetrofitClient.authApi.getProfile("Bearer $sessionToken")
            if (response.isSuccessful) {
                val profile = response.body()?.profile
                val completed = profile?.onboardingCompleted == true && !profile.username.isNullOrBlank()
                showOnboarding = !completed
                profile?.`class`?.takeIf { it.isNotBlank() }?.let { currentStudentClass = it }
                profile?.city?.takeIf { it.isNotBlank() }?.let { studentCity = it }
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentScreen", "Failed to check onboarding: ${e.message}")
        } finally {
            isCheckingOnboarding = false
        }
    }
    
    LaunchedEffect(currentStudentClass) {
        isLoadingSlider = true
        try {
            val response = RetrofitClient.authApi.getSliderImages(
                role = "student",
                studentClass = currentStudentClass.takeIf { it.isNotBlank() }
            )
            if (response.isSuccessful && response.body() != null) {
                sliderImages = response.body()!!
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentScreen", "Failed to fetch slider images: ${e.message}")
        } finally {
            isLoadingSlider = false
        }
    }

    var weatherResponse by remember { mutableStateOf<WeatherResponse?>(null) }
    var isWeatherLoading by remember { mutableStateOf(false) }

    // Fetch live weather data from Backend API using GPS coordinates or city
    LaunchedEffect(studentCity) {
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

            val cityQuery = if (userLat == null || userLon == null) (studentCity?.ifBlank { "auto" } ?: "auto") else null
            val res = RetrofitClient.authApi.getCurrentWeather(
                lat = userLat,
                lon = userLon,
                city = cityQuery
            )
            if (res.isSuccessful && res.body() != null) {
                weatherResponse = res.body()
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentWeather", "Failed to fetch weather: ${e.message}")
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
    
    Box(modifier = Modifier.fillMaxSize()) {
    DashboardLayout(
        role = "student",
        provider = provider,
        email = email,
        name = name,
        avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
        themeMode = themeMode,
        onThemeChange = onThemeChange,
        onLogout = onLogout,
        onShowLibrary = onShowLibrary
    ) { onNotificationClick, hasUnread ->
        val scrollState = rememberScrollState()
        val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
        val headerAlpha by animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerAlpha"
        )
        val headerSlide by animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = androidx.compose.animation.core.tween(220),
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
                            subtitle = "Welcome, ${name.ifEmpty { "Student" }}",
                            onNotificationClick = onNotificationClick,
                            hasUnreadNotifications = hasUnread,
                            isDarkHeader = if (isRaining) isStudentAppInDarkTheme() else false
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
                                StudentDashboardCarousel(
                                    images = enabledImages,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(185.dp)
                                )
                            }
                        }

                        // Slight margin below the slider button where rain drops end & splash
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    AcademicPerformanceCard(onGraphClick = onShowAcademicPerformance)
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    StudentTimetableSection()
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    LibraryBooksSection(onShowMore = onShowLibrary)
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

        if (!isCheckingOnboarding && showOnboarding && !sessionToken.isNullOrEmpty()) {
            StudentOnboardingDrawer(
                email = email,
                sessionToken = sessionToken,
                onComplete = { username, newClass ->
                    sessionManager.updateOnboardingData(username, newClass)
                    if (!newClass.isNullOrEmpty()) {
                        currentStudentClass = newClass
                    }
                    showOnboarding = false
                }
            )
        }
    }
}

// ── AdMob Banner Ad Composable ──────────────────────────────────────────────
@Composable
fun AdmobBannerAd() {
    val context = LocalContext.current
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()

    // Sponsor chip colours from theme
    val sponsoredBg = if (isDark)
        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
    else
        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f)
    val labelColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f)

    // Pre-compute ad width in dp (screen width minus 32dp horizontal padding)
    val dm = context.resources.displayMetrics
    val adWidthDp = ((dm.widthPixels - 2 * 16 * dm.density) / dm.density).toInt()

    // Resolve theme colours to native Android ints before entering AndroidView
    val bgColor  = if (isDark) android.graphics.Color.parseColor("#1C1C1E")
                   else        android.graphics.Color.parseColor("#F2F2F7")
    val strokeColor = if (isDark) android.graphics.Color.argb(40, 255, 255, 255)
                      else        android.graphics.Color.argb(40, 0, 0, 0)

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.End
    ) {
        // "Sponsored" label
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(sponsoredBg)
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(
                text = "Sponsored",
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                color = labelColor
            )
        }
        Spacer(modifier = Modifier.height(4.dp))

        // Single native AndroidView — FrameLayout wraps AdView so that
        // rounded corners + border are applied natively (Compose clip does
        // NOT clip child AndroidViews, but a native GradientDrawable does).
        AndroidView(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            factory = { ctx ->
                // Outer container with rounded background + stroke border
                val cornerPx  = (16 * dm.density + 0.5f)
                val strokePx  = (1  * dm.density + 0.5f)

                val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
                    shape         = android.graphics.drawable.GradientDrawable.RECTANGLE
                    cornerRadius  = cornerPx
                    setColor(bgColor)
                    setStroke(strokePx.toInt(), strokeColor)
                }

                val container = android.widget.FrameLayout(ctx).apply {
                    background = bgDrawable
                    clipToOutline = true          // clips child AdView to rounded rect
                    outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
                }

                val adView = AdView(ctx).apply {
                    setAdSize(
                        AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(
                            ctx, adWidthDp
                        )
                    )
                    adUnitId = "ca-app-pub-3830257435719634/8526041010"
                    adListener = object : AdListener() {
                        override fun onAdLoaded() {
                            android.util.Log.d("AdmobBanner", "✅ Ad loaded successfully")
                        }
                        override fun onAdFailedToLoad(err: LoadAdError) {
                            android.util.Log.e("AdmobBanner", "❌ Ad failed: code=${err.code} msg=${err.message}")
                        }
                    }
                    loadAd(AdRequest.Builder().build())
                }

                container.addView(
                    adView,
                    android.widget.FrameLayout.LayoutParams(
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                        android.widget.FrameLayout.LayoutParams.WRAP_CONTENT
                    )
                )
                container
            },
            onRelease = { container ->
                // Destroy AdView to prevent memory leaks
                val adView = (container as? android.widget.FrameLayout)?.getChildAt(0) as? AdView
                adView?.destroy()
            }
        )
    }
}

@Composable
fun LibraryBooksSection(onShowMore: () -> Unit = {}) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = sessionManager.getSessionToken()

    val allBooks = remember { mutableStateListOf<com.vidyaschool.app.api.StudentBorrowingResponse>() }
    var isLoading by remember { mutableStateOf(false) }

    fun loadBooks() {
        if (!sessionToken.isNullOrEmpty()) {
            isLoading = true
            scope.launch {
                try {
                    val res = RetrofitClient.authApi.getStudentBorrowings("Bearer $sessionToken")
                    if (res.isSuccessful) {
                        allBooks.clear()
                        res.body()?.let { allBooks.addAll(it) }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("LibraryBooksSection", "Error fetching books: ${e.message}")
                } finally {
                    isLoading = false
                }
            }
        }
    }

    LaunchedEffect(sessionToken) {
        loadBooks()
    }

    val preview = allBooks.take(3)
    val hasMore = allBooks.size > 3
    val border = MaterialTheme.colorScheme.outline
    val onSurface = MaterialTheme.colorScheme.onSurface

    fun formatIsoDate(isoStr: String): String {
        return try {
            val parts = isoStr.split("T")[0].split("-")
            val year = parts[0]
            val monthNum = parts[1].toInt()
            val day = parts[2].toInt()
            val month = when (monthNum) {
                1 -> "Jan"
                2 -> "Feb"
                3 -> "Mar"
                4 -> "Apr"
                5 -> "May"
                6 -> "Jun"
                7 -> "Jul"
                8 -> "Aug"
                9 -> "Sep"
                10 -> "Oct"
                11 -> "Nov"
                12 -> "Dec"
                else -> "Month"
            }
            "$month $day, $year"
        } catch (e: Exception) {
            isoStr
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Library Books", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = onSurface)
                Text("Issued books & renewals", fontSize = 12.sp, color = onSurface.copy(alpha = 0.45f))
            }
            if (hasMore) {
                Text(
                    text = "View all →",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.clickable(
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                        indication = null
                    ) { onShowMore() }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading && allBooks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            }
        } else if (allBooks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, border, RoundedCornerShape(12.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No books currently issued", fontSize = 13.sp, color = onSurface.copy(alpha = 0.5f))
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .border(
                        width = 1.dp,
                        brush = Brush.verticalGradient(
                            0.0f to border,
                            0.65f to border,
                            1.0f to Color.Transparent
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
            ) {
                Column {
                    preview.forEachIndexed { idx, book ->
                        val renewalsLeft = 3 - book.renewalsCount
                        if (idx == preview.lastIndex && hasMore) {
                            Box(modifier = Modifier
                                .fillMaxWidth()
                                .drawBehind {
                                    val gradientBrush = Brush.horizontalGradient(
                                        0.0f to androidx.compose.ui.graphics.Color.Transparent,
                                        0.15f to border,
                                        0.85f to border,
                                        1.0f to androidx.compose.ui.graphics.Color.Transparent
                                    )
                                    drawRect(
                                        brush = gradientBrush,
                                        topLeft = androidx.compose.ui.geometry.Offset(0f, 0f),
                                        size = androidx.compose.ui.geometry.Size(size.width, 1.dp.toPx())
                                    )
                                }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 14.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(onSurface.copy(alpha = 0.06f))
                                            .border(1.dp, border, RoundedCornerShape(8.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = book.title.firstOrNull()?.toString() ?: "",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = onSurface
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(book.title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = onSurface)
                                        Text(book.author, fontSize = 11.sp, color = onSurface.copy(alpha = 0.45f))
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Text(
                                                text = "Due ${formatIsoDate(book.dueDate)}",
                                                fontSize = 10.sp,
                                                color = if (renewalsLeft == 0) onSurface else onSurface.copy(alpha = 0.45f)
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                                repeat(3) { i ->
                                                    Box(
                                                        modifier = Modifier
                                                            .size(width = 10.dp, height = 3.dp)
                                                            .clip(RoundedCornerShape(2.dp))
                                                            .background(
                                                                if (i < book.renewalsCount) onSurface.copy(alpha = 0.15f)
                                                                else onSurface.copy(alpha = 0.7f)
                                                            )
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    if (renewalsLeft > 0) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .border(1.dp, border, RoundedCornerShape(8.dp))
                                                .clickable(
                                                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                                    indication = null
                                                ) {
                                                    scope.launch {
                                                        try {
                                                            val res = RetrofitClient.authApi.renewBook("Bearer $sessionToken", com.vidyaschool.app.api.StudentRenewRequest(id = book.id))
                                                            if (res.isSuccessful) {
                                                                android.widget.Toast.makeText(context, "Book renewed successfully", android.widget.Toast.LENGTH_SHORT).show()
                                                                loadBooks()
                                                            } else {
                                                                android.widget.Toast.makeText(context, "Failed to renew book", android.widget.Toast.LENGTH_SHORT).show()
                                                            }
                                                        } catch (e: Exception) {
                                                            android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                                        }
                                                    }
                                                }
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text("Renew", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface)
                                        }
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(onSurface.copy(alpha = 0.06f))
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text("Max", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface.copy(alpha = 0.35f))
                                        }
                                    }
                                }

                                // Half-gradient overlay + Show More button directly on the item
                                Box(
                                    modifier = Modifier
                                        .matchParentSize()
                                        .background(
                                            Brush.verticalGradient(
                                                colors = listOf(
                                                    Color.Transparent,
                                                    MaterialTheme.colorScheme.background.copy(alpha = 0.85f),
                                                    MaterialTheme.colorScheme.background
                                                )
                                            )
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surface)
                                            .border(1.dp, border, RoundedCornerShape(8.dp))
                                            .clickable(
                                                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                                indication = null
                                            ) { onShowMore() }
                                            .padding(horizontal = 18.dp, vertical = 8.dp)
                                    ) {
                                        Text(
                                            text = "Show ${allBooks.size - 3} more books",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = onSurface
                                        )
                                    }
                                }
                            }
                        } else {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(onSurface.copy(alpha = 0.06f))
                                        .border(1.dp, border, RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = book.title.firstOrNull()?.toString() ?: "",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = onSurface
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(book.title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = onSurface)
                                    Text(book.author, fontSize = 11.sp, color = onSurface.copy(alpha = 0.45f))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(
                                            text = "Due ${formatIsoDate(book.dueDate)}",
                                            fontSize = 10.sp,
                                            color = if (renewalsLeft == 0) onSurface else onSurface.copy(alpha = 0.45f)
                                        )
                                        Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                            repeat(3) { i ->
                                                Box(
                                                    modifier = Modifier
                                                        .size(width = 10.dp, height = 3.dp)
                                                        .clip(RoundedCornerShape(2.dp))
                                                        .background(
                                                            if (i < book.renewalsCount) onSurface.copy(alpha = 0.15f)
                                                            else onSurface.copy(alpha = 0.7f)
                                                        )
                                                )
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                if (renewalsLeft > 0) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .border(1.dp, border, RoundedCornerShape(8.dp))
                                            .clickable(
                                                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                                indication = null
                                            ) {
                                                scope.launch {
                                                    try {
                                                        val res = RetrofitClient.authApi.renewBook("Bearer $sessionToken", com.vidyaschool.app.api.StudentRenewRequest(id = book.id))
                                                        if (res.isSuccessful) {
                                                            android.widget.Toast.makeText(context, "Book renewed successfully", android.widget.Toast.LENGTH_SHORT).show()
                                                            loadBooks()
                                                        } else {
                                                            android.widget.Toast.makeText(context, "Failed to renew book", android.widget.Toast.LENGTH_SHORT).show()
                                                        }
                                                    } catch (e: Exception) {
                                                        android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                            .padding(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("Renew", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface)
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(onSurface.copy(alpha = 0.06f))
                                            .padding(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("Max", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface.copy(alpha = 0.35f))
                                    }
                                }
                            }
                        }

                        if (idx < preview.lastIndex) {
                            HorizontalDivider(color = border.copy(alpha = 0.4f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AcademicPerformanceCard(
    modifier: Modifier = Modifier,
    onGraphClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val tabs = listOf("Performance", "Subject", "Attendance")
    var selectedTab by remember { mutableStateOf(0) }

    var realData by remember { mutableStateOf<List<Float>>(emptyList()) }
    var realLabels by remember { mutableStateOf<List<String>>(emptyList()) }
    var isLoadingMarks by remember { mutableStateOf(false) }

    // Fetch real marks from FastAPI backend for Performance tab
    LaunchedEffect(Unit) {
        val token = sessionManager.getSessionToken()
        if (!token.isNullOrEmpty()) {
            isLoadingMarks = true
            try {
                val response = RetrofitClient.authApi.getStudentMarks("Bearer $token")
                if (response.isSuccessful && response.body() != null) {
                    val examMap = response.body()!!
                    val dataList = mutableListOf<Float>()
                    val labelList = mutableListOf<String>()

                    examMap.values.forEach { examResult ->
                        val subjects = examResult.subjects ?: emptyList()
                        if (subjects.isNotEmpty()) {
                            val totalPct = subjects.map { s ->
                                val sc = s.score ?: 0f
                                val mx = if ((s.maxScore ?: 100f) > 0f) s.maxScore!! else 100f
                                (sc / mx) * 100f
                            }.sum()
                            val avgPct = totalPct / subjects.size
                            dataList.add(avgPct)
                            labelList.add(examResult.termName ?: "Exam")
                        }
                    }

                    if (dataList.isNotEmpty()) {
                        realData = dataList
                        realLabels = labelList
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("AcademicPerformance", "Failed to fetch student marks: ${e.message}")
            } finally {
                isLoadingMarks = false
            }
        }
    }

    Column(modifier = modifier.fillMaxWidth()) {
        // Section Header matching other dashboard sections
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "Academic Performance",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "School Highlights & Analytics",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        ) {
            Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 14.dp)) {
                // Graph content
                when (selectedTab) {
                    0 -> {
                        val chartData = if (realData.isNotEmpty()) realData else listOf(65f, 80f, 75f, 90f, 85f, 95f)
                        val chartLabels = if (realLabels.isNotEmpty()) realLabels else listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun")
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { onGraphClick() }
                        ) {
                            AcademicPerformanceChart(
                                data = chartData,
                                labels = chartLabels,
                                modifier = Modifier.fillMaxWidth().height(195.dp)
                            )
                        }
                    }
                    1 -> SubjectBarChart(
                        data = listOf(72f, 68f, 85f, 78f, 91f, 88f),
                        labels = listOf("Math", "Sci", "Eng", "His", "Geo", "Art"),
                        modifier = Modifier.fillMaxWidth().height(195.dp)
                    )
                    2 -> AttendancePieChart(
                        present = 82f,
                        absent = 10f,
                        modifier = Modifier.fillMaxWidth().height(195.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Shadcn-style tab strip with sliding animation
                val pillColor = Color(0xFF000000)
                var stripWidth by remember { mutableStateOf(0) }
                var stripHeight by remember { mutableStateOf(0) }
                val pillOffsetX by animateIntAsState(
                    targetValue = if (stripWidth > 0) stripWidth / tabs.size * selectedTab else 0,
                    animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
                    label = "tabSlide"
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        .padding(3.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .onSizeChanged { stripWidth = it.width; stripHeight = it.height }
                    ) {
                        tabs.forEachIndexed { index, title ->
                            val selected = selectedTab == index
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable(
                                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                        indication = null
                                    ) { selectedTab = index }
                                    .padding(vertical = 3.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = title,
                                    fontSize = 11.sp,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (selected) Color(0xFFFFFFFF)
                                            else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                        }
                    }

                    // Animated pill drawn after Row so size is known, but visually behind via zIndex
                    if (stripWidth > 0 && stripHeight > 0) {
                        val density = androidx.compose.ui.platform.LocalDensity.current
                        val pillW = with(density) { (stripWidth / tabs.size).toDp() }
                        val pillH = with(density) { stripHeight.toDp() }
                        val offsetDp = with(density) { pillOffsetX.toDp() }
                        Box(
                            modifier = Modifier
                                .offset(x = offsetDp)
                                .width(pillW)
                                .height(pillH)
                                .clip(RoundedCornerShape(6.dp))
                                .background(pillColor)
                                .zIndex(-1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SubjectBarChart(
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    // Theme-aware opacity steps instead of hue colors
    val barAlphas = listOf(1f, 0.8f, 0.65f, 0.5f, 0.38f, 0.25f)
    val density = androidx.compose.ui.platform.LocalDensity.current
    val textPx = with(density) { 10.sp.toPx() }
    val paint = remember(textColor, textPx) {
        Paint().apply {
            color = textColor.toArgb()
            textSize = textPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }

    Canvas(modifier = modifier) {
        val w = size.width; val h = size.height
        val pL = 8f; val pR = 8f; val pT = 12f; val pB = 28f
        val cW = w - pL - pR; val cH = h - pT - pB

        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, androidx.compose.ui.geometry.Offset(pL, y),
                androidx.compose.ui.geometry.Offset(w - pR, y), strokeWidth = 1f)
        }

        val slotW = cW / data.size
        val barW = slotW * 0.42f

        data.forEachIndexed { i, value ->
            val barH = cH * (value / 100f)
            val cx = pL + i * slotW + slotW / 2f
            val left = cx - barW / 2f
            val top = pT + cH - barH; val bottom = pT + cH
            val r = barW / 2.5f
            val alpha = barAlphas[i % barAlphas.size]

            drawRoundRect(
                color = primaryColor.copy(alpha = 0.08f),
                topLeft = androidx.compose.ui.geometry.Offset(left, pT),
                size = androidx.compose.ui.geometry.Size(barW, cH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
            drawRoundRect(
                color = primaryColor.copy(alpha = alpha),
                topLeft = androidx.compose.ui.geometry.Offset(left, top),
                size = androidx.compose.ui.geometry.Size(barW, barH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
        }

        drawIntoCanvas { canvas ->
            labels.forEachIndexed { i, label ->
                canvas.nativeCanvas.drawText(label, pL + i * slotW + slotW / 2f, h - 10f, paint)
            }
        }
    }
}

@Composable
fun AttendancePieChart(
    present: Float,
    absent: Float,
    modifier: Modifier = Modifier
) {
    val onSurface    = MaterialTheme.colorScheme.onSurface
    val trackColor   = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    // Theme-aware: primary=solid, 60%, 30% opacity for 3 segments
    val presentColor = onSurface
    val absentColor  = onSurface.copy(alpha = 0.55f)
    val leaveColor   = onSurface.copy(alpha = 0.25f)
    val leave        = 100f - present - absent

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.weight(1f).fillMaxHeight(),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sz = minOf(size.width, size.height)
                val cx = size.width / 2f; val cy = size.height / 2f
                val outerR = sz / 2f * 0.78f
                val strokeW = outerR * 0.30f
                val r = outerR - strokeW / 2f
                val arcSz = androidx.compose.ui.geometry.Size(r * 2, r * 2)
                val tl = androidx.compose.ui.geometry.Offset(cx - r, cy - r)
                val gap = 3f
                val total = present + absent + leave
                val pSweep = 360f * (present / total)
                val aSweep = 360f * (absent  / total)
                val lSweep = 360f * (leave   / total)

                drawArc(trackColor, 0f, 360f, false, style = Stroke(strokeW), topLeft = tl, size = arcSz)
                drawArc(presentColor, -90f, pSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
                drawArc(absentColor, -90f + pSweep + gap, aSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
                drawArc(leaveColor, -90f + pSweep + aSweep + gap * 2, lSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${present.toInt()}%", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = onSurface)
                Text("Present", fontSize = 10.sp, color = onSurface.copy(alpha = 0.45f))
            }
        }

        Column(
            modifier = Modifier.padding(start = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            listOf(
                Triple(presentColor, "Present", "${present.toInt()}%"),
                Triple(absentColor,  "Absent",  "${absent.toInt()}%"),
                Triple(leaveColor,   "Leave",   "${leave.toInt()}%")
            ).forEach { (color, label, value) ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(color))
                    Column {
                        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface)
                        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = onSurface)
                    }
                }
            }
        }
    }
}

@Composable
fun StudentDashboardCarousel(
    images: List<SliderImage>,
    modifier: Modifier = Modifier
) {
    val isDark = isStudentAppInDarkTheme()

    val defaultSliderImages = remember {
        listOf(
            SliderImage(
                id = 1,
                title = "Welcome to VIDYA School",
                url = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop",
                enabled = true
            ),
            SliderImage(
                id = 2,
                title = "Academic Excellence & Growth",
                url = "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
                enabled = true
            )
        )
    }

    val effectiveImages = if (images.isNotEmpty()) images else defaultSliderImages
    val totalPages = effectiveImages.size + 1
    val pagerState = rememberPagerState(pageCount = { totalPages })

    // Auto-scroll loop — pauses when app is in background to save CPU/battery
    val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
    val isResumed = remember { mutableStateOf(true) }
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            isResumed.value = event == androidx.lifecycle.Lifecycle.Event.ON_RESUME
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(pagerState, totalPages) {
        if (totalPages > 1) {
            while (true) {
                delay(5000L)
                if (isResumed.value && !pagerState.isScrollInProgress) {
                    try {
                        val targetPage = (pagerState.currentPage + 1) % totalPages
                        pagerState.animateScrollToPage(targetPage)
                    } catch (e: Exception) {
                        // ignore gesture cancellation to keep the loop active
                    }
                }
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            if (page < effectiveImages.size) {
                // Slides 0 until N-1: Image Banners
                val img = effectiveImages[page]
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isDark) Color(0xFF18181B) else Color(0xFFF4F4F5))
                ) {
                    AsyncImage(
                        model = img.url,
                        contentDescription = img.title,
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )

                    // Dark bottom gradient overlay
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.75f)),
                                    startY = 100f
                                )
                            )
                    )

                    // Image title text overlay
                    if (!img.title.isNullOrEmpty()) {
                        Text(
                            text = img.title,
                            color = Color.White,
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(horizontal = 16.dp, vertical = 14.dp)
                        )
                    }
                }
            } else {
                // Last Slide: Top Performers Leaderboard
                LeaderboardSlideContent(
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // Progress dot indicators
        if (totalPages > 1) {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 14.dp, bottom = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val isLeaderboardActive = pagerState.currentPage == effectiveImages.size
                repeat(totalPages) { index ->
                    val active = pagerState.currentPage == index
                    val dotColor = if (isLeaderboardActive) {
                        if (active) {
                            if (isDark) Color(0xFFF4F4F5) else Color(0xFF18181B)
                        } else {
                            if (isDark) Color(0xFF3F3F46) else Color(0xFFD4D4D8)
                        }
                    } else {
                        if (active) Color.White else Color.White.copy(alpha = 0.40f)
                    }

                    Box(
                        modifier = Modifier
                            .size(if (active) 12.dp else 5.dp, 5.dp)
                            .clip(CircleShape)
                            .background(dotColor)
                    )
                }
            }
        }
    }
}

@Composable
fun ImageSlider(
    images: List<SliderImage>,
    modifier: Modifier = Modifier
) {
    StudentDashboardCarousel(images = images, modifier = modifier)
}

@Composable
fun AcademicPerformanceChart(
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
    val valueColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
    val surfaceColor = MaterialTheme.colorScheme.surface
    val density = androidx.compose.ui.platform.LocalDensity.current
    val textPx = with(density) { 10.sp.toPx() }
    val labelPaint = remember(textColor, textPx) {
        Paint().apply {
            color = textColor.toArgb()
            textSize = textPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pL = 12f; val pR = 12f; val pT = 24f; val pB = 30f
        val cW = w - pL - pR
        val cH = h - pT - pB

        // Grid lines
        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(
                gridColor,
                androidx.compose.ui.geometry.Offset(pL, y),
                androidx.compose.ui.geometry.Offset(w - pR, y),
                strokeWidth = 1f
            )
        }

        if (data.isNotEmpty()) {
            val points = data.indices.map { i ->
                val x = if (data.size > 1) pL + cW * (i.toFloat() / (data.size - 1)) else w / 2f
                val clampedVal = data[i].coerceIn(0f, 100f)
                val y = pT + cH * (1f - clampedVal / 100f)
                androidx.compose.ui.geometry.Offset(x, y)
            }

            if (points.size > 1) {
                val strokePath = Path().apply {
                    moveTo(points.first().x, points.first().y)
                    for (i in 1 until points.size) {
                        val p = points[i - 1]; val c = points[i]
                        val cx1 = p.x + (c.x - p.x) / 2f
                        cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                    }
                }

                // Gradient fill below path
                val fillPath = Path().apply {
                    addPath(strokePath)
                    lineTo(points.last().x, pT + cH)
                    lineTo(points.first().x, pT + cH)
                    close()
                }
                drawPath(
                    fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(primaryColor.copy(alpha = 0.22f), Color.Transparent),
                        startY = points.minOf { it.y }, endY = pT + cH
                    )
                )

                // Line stroke
                drawPath(
                    strokePath,
                    brush = Brush.linearGradient(
                        colors = listOf(secondaryColor.copy(alpha = 0.8f), primaryColor),
                        start = androidx.compose.ui.geometry.Offset(pL, 0f),
                        end = androidx.compose.ui.geometry.Offset(w - pR, 0f)
                    ),
                    style = Stroke(width = 2.5.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
                )
            }

            drawIntoCanvas { canvas ->
                points.forEachIndexed { i, pt ->
                    // Draw outer glow and inner point circle
                    drawCircle(primaryColor.copy(alpha = 0.25f), radius = 8.dp.toPx(), center = pt)
                    drawCircle(primaryColor, radius = 4.dp.toPx(), center = pt)
                    drawCircle(surfaceColor, radius = 2.dp.toPx(), center = pt)

                    // Formatted label below node (smart truncation to prevent overlap)
                    val rawLabel = labels.getOrNull(i) ?: "P${i + 1}"
                    val cleanLabel = if (rawLabel.length > 7) {
                        rawLabel.take(6) + "…"
                    } else rawLabel

                    canvas.nativeCanvas.drawText(cleanLabel, pt.x, h - 6f, labelPaint)
                }
            }
        }
    }
}
@Composable
fun LeaderboardSlideContent(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val isDark = isStudentAppInDarkTheme()

    // 1. Initialize state with cached data if available
    val cachedPerformers = remember { sessionManager.getCachedTopPerformers() }
    var topPerformers by remember { mutableStateOf<List<TopPerformerItem>>(cachedPerformers) }
    var isLoading by remember { mutableStateOf(cachedPerformers.isEmpty()) }

    val defaultPerformers = remember {
        listOf(
            TopPerformerItem(id = "1", name = "Aarav Sharma", studentClass = "10", section = "A", percentage = 98.6, rank = 1, avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav"),
            TopPerformerItem(id = "2", name = "Ananya Roy",   studentClass = "12", section = "B", percentage = 97.4, rank = 2, avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya"),
            TopPerformerItem(id = "3", name = "Rohan Verma",  studentClass = "9",  section = "C", percentage = 96.8, rank = 3, avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan")
        )
    }

    LaunchedEffect(Unit) {
        try {
            val token = sessionManager.getSessionToken()
            if (token.isNullOrEmpty()) {
                if (topPerformers.isEmpty()) {
                    topPerformers = defaultPerformers
                }
                isLoading = false
                return@LaunchedEffect
            }
            val response = RetrofitClient.authApi.getTopPerformers("Bearer $token")
            val fetched = response.body()?.leaderboard
            if (response.isSuccessful && !fetched.isNullOrEmpty()) {
                sessionManager.saveTopPerformers(fetched)
                topPerformers = fetched
            } else {
                if (topPerformers.isEmpty()) {
                    topPerformers = defaultPerformers
                }
            }
        } catch (e: Exception) {
            if (topPerformers.isEmpty()) {
                topPerformers = defaultPerformers
            }
        } finally {
            isLoading = false
        }
    }

    val displayList = if (topPerformers.isNotEmpty()) topPerformers.take(3) else defaultPerformers
    val rank1 = displayList.find { it.rank == 1 } ?: displayList.getOrNull(0)
    val rank2 = displayList.find { it.rank == 2 } ?: displayList.getOrNull(1)
    val rank3 = displayList.find { it.rank == 3 } ?: displayList.getOrNull(2)

    val podiumOrdered = listOfNotNull(rank2, rank1, rank3)

    // Bento styling for leaderboard slide
    val outerBgColor = if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF)
    val outerBorderColor = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
    val headerTextColor = if (isDark) Color(0xFFF4F4F5) else Color(0xFF18181B)
    val subtitleTextColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)

    Box(
        modifier = modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(18.dp))
            .background(outerBgColor)
            .border(1.dp, outerBorderColor, RoundedCornerShape(18.dp))
            .padding(top = 10.dp, bottom = 8.dp, start = 12.dp, end = 12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(
                                if (isDark) Color(0xFF33270A) else Color(0xFFFEF3C7)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_medal_star),
                            contentDescription = null,
                            tint = if (isDark) Color(0xFFFFD700) else Color(0xFFD97706),
                            modifier = Modifier.size(12.dp)
                        )
                    }

                    Text(
                        text = "Leaderboard",
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = headerTextColor
                    )
                }

                Text(
                    text = "Top Performers",
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Medium,
                    color = subtitleTextColor
                )
            }

            // Podium Row (2nd, 1st, 3rd)
            if (isLoading) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    repeat(3) { index ->
                        val heightFraction = when (index) {
                            1 -> 1.0f
                            0 -> 0.88f
                            else -> 0.85f
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(heightFraction)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isDark) Color.White.copy(alpha = 0.05f)
                                    else Color(0xFFF4F4F5)
                                )
                        )
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    podiumOrdered.forEach { item ->
                        TopPerformerPodiumCard(
                            item = item,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TopPerformersBanner(
    modifier: Modifier = Modifier
) {
    LeaderboardSlideContent(modifier = modifier)
}

@Composable
fun TopPerformerPodiumCard(
    item: TopPerformerItem,
    modifier: Modifier = Modifier
) {
    val isDark = isStudentAppInDarkTheme()
    val rank = item.rank ?: 1
    val isFirst = rank == 1
    val isSecond = rank == 2

    // Calibrated heights to comfortably fit inside the 185.dp slider
    val cardHeight = when {
        isFirst -> 130.dp
        isSecond -> 116.dp
        else -> 112.dp
    }

    val avatarSize = if (isFirst) 34.dp else 28.dp
    val ringSize = avatarSize + 4.dp

    val rankRingGradient = when {
        isFirst -> listOf(Color(0xFFFFD700), Color(0xFFF59E0B))
        isSecond -> if (isDark) listOf(Color(0xFFCBD5E1), Color(0xFF64748B)) else listOf(Color(0xFF94A3B8), Color(0xFFCBD5E1))
        else -> listOf(Color(0xFFFB923C), Color(0xFFEA580C))
    }

    // Card background color optimized for light and dark themes
    val cardBg = if (isDark) {
        when {
            isFirst -> Color(0xFF221B12)
            isSecond -> Color(0xFF1B2028)
            else -> Color(0xFF221714)
        }
    } else {
        when {
            isFirst -> Color(0xFFFEFCE8)
            isSecond -> Color(0xFFF8FAFC)
            else -> Color(0xFFFFF7ED)
        }
    }

    // Card border stroke
    val cardBorderColor = if (isDark) {
        when {
            isFirst -> Color(0xFFFFD700).copy(alpha = 0.70f)
            isSecond -> Color(0xFF475569)
            else -> Color(0xFF9A3412).copy(alpha = 0.65f)
        }
    } else {
        when {
            isFirst -> Color(0xFFEAB308).copy(alpha = 0.55f)
            isSecond -> Color(0xFFE2E8F0)
            else -> Color(0xFFFDBA74).copy(alpha = 0.60f)
        }
    }

    // Score badge pill styling
    val badgeBg = if (isDark) {
        when {
            isFirst -> Brush.horizontalGradient(listOf(Color(0xFFFFD700), Color(0xFFF59E0B)))
            isSecond -> Brush.horizontalGradient(listOf(Color(0xFF334155), Color(0xFF334155)))
            else -> Brush.horizontalGradient(listOf(Color(0xFF431407), Color(0xFF431407)))
        }
    } else {
        when {
            isFirst -> Brush.horizontalGradient(listOf(Color(0xFFFEF08A), Color(0xFFFDE047)))
            isSecond -> Brush.horizontalGradient(listOf(Color(0xFFF1F5F9), Color(0xFFF1F5F9)))
            else -> Brush.horizontalGradient(listOf(Color(0xFFFFEDD5), Color(0xFFFFEDD5)))
        }
    }

    val badgeTextColor = if (isDark) {
        when {
            isFirst -> Color(0xFF1E1000)
            isSecond -> Color(0xFFF8FAFC)
            else -> Color(0xFFFFEDD5)
        }
    } else {
        when {
            isFirst -> Color(0xFF854D0E)
            isSecond -> Color(0xFF334155)
            else -> Color(0xFF9A3412)
        }
    }

    val nameColor = if (isDark) Color(0xFFF4F4F5) else Color(0xFF0F172A)
    val classColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)

    Box(
        modifier = modifier
            .height(cardHeight)
            .zIndex(if (isFirst) 2f else 1f)
            .clip(RoundedCornerShape(14.dp))
            .background(cardBg)
            .border(
                width = if (isFirst) 1.2.dp else 1.dp,
                color = cardBorderColor,
                shape = RoundedCornerShape(14.dp)
            )
            .padding(horizontal = 4.dp, vertical = 6.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Section: Avatar with Rank Ring
            Box(
                modifier = Modifier.padding(top = 1.dp),
                contentAlignment = Alignment.Center
            ) {
                if (isFirst) {
                    Box(
                        modifier = Modifier
                            .size(ringSize + 4.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFFD700).copy(alpha = if (isDark) 0.15f else 0.20f))
                    )
                }

                Box(
                    modifier = Modifier
                        .size(ringSize)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(rankRingGradient)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(avatarSize)
                            .clip(CircleShape)
                            .background(if (isDark) Color(0xFF18181B) else Color.White),
                        contentAlignment = Alignment.Center
                    ) {
                        val avatar = item.avatarUrl
                        if (!avatar.isNullOrEmpty()) {
                            AsyncImage(
                                model = avatar,
                                contentDescription = item.name,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape),
                                contentScale = androidx.compose.ui.layout.ContentScale.Crop
                            )
                        } else {
                            Text(
                                text = (item.name?.take(1) ?: "S").uppercase(),
                                fontWeight = FontWeight.Bold,
                                fontSize = if (isFirst) 14.sp else 12.sp,
                                color = if (isDark) Color.White else Color(0xFF18181B)
                            )
                        }
                    }
                }
            }

            // Middle Section: Name & Class/Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = item.name ?: "Student",
                    fontSize = if (isFirst) 10.5.sp else 9.5.sp,
                    fontWeight = if (isFirst) FontWeight.Bold else FontWeight.SemiBold,
                    color = nameColor,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                val classSec = buildString {
                    if (!item.studentClass.isNullOrEmpty()) append("Class ${item.studentClass}")
                    if (!item.section.isNullOrEmpty()) append("-${item.section}")
                }
                if (classSec.isNotEmpty()) {
                    Text(
                        text = classSec,
                        fontSize = 8.sp,
                        color = classColor,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }

            // Bottom Section: Score Percentage Badge (Guaranteed No Crop)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(badgeBg)
                    .padding(horizontal = 4.dp, vertical = 2.5.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = String.format(java.util.Locale.US, "%.1f%%", item.percentage ?: 0.0),
                    fontSize = if (isFirst) 10.sp else 9.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = badgeTextColor,
                    maxLines = 1,
                    softWrap = false,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun TopPerformerCard(
    item: TopPerformerItem,
    isMiddle: Boolean = false,
    avatarOverflow: androidx.compose.ui.unit.Dp = 0.dp,
    bannerAvatarOverflow: androidx.compose.ui.unit.Dp = 32.dp,
    cardHeight: androidx.compose.ui.unit.Dp = 108.dp,
    modifier: Modifier = Modifier
) {
    TopPerformerPodiumCard(item = item, modifier = modifier)
}

// ─────────────────────────────────────────────────────────────────────────────
// Student Timetable / Daily Schedule (Matching Teacher Dashboard with Light & Dark Mode)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun StudentTimetableSkeleton(isDark: Boolean, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "student_cal_shimmer")
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
        start = androidx.compose.ui.geometry.Offset(shimmerX - 300f, 0f),
        end   = androidx.compose.ui.geometry.Offset(shimmerX, 0f)
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Column {
            Text(
                text = "Timetable",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Daily Schedule & Classes",
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

@Composable
private fun StudentEventRow(
    title: String,
    time: String,
    barColor: Color,
    textColor: Color,
    timeColor: Color = textColor,
    rowBg: Color = Color.Transparent,
    rowBorder: Color? = null,
    cornerRadius: Int = 12,
    height: Int = 42,
    horizontalPadding: Int = 12
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
                Box(
                    modifier = Modifier
                        .width(3.5.dp)
                        .height(16.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(barColor)
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

@Composable
fun StudentTimetableSection(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isDark = isStudentAppInDarkTheme()
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = remember { sessionManager.getSessionToken() }

    var todayDateStr by remember { mutableStateOf("TODAY, SCHEDULE") }
    var todayEvents by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }
    var tomorrowEvents by remember { mutableStateOf<List<TeacherCalendarEvent>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    // Color tokens dynamically tuned for Light and Dark modes
    val cardBg = if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF)
    val cardBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
    val todayDateRed = if (isDark) Color(0xFFFF5A52) else Color(0xFFE11D48)
    val tomorrowGray = if (isDark) Color(0xFF8A8A8A) else Color(0xFF71717A)
    val emptyTextColor = if (isDark) Color(0xFF8A8A8A) else Color(0xFF71717A)

    // Today row theme tokens
    val todayBarColor = if (isDark) Color(0xFFD7D842) else Color(0xFFEAB308)
    val todayTextColor = if (isDark) Color(0xFFD7D842) else Color(0xFF854D0E)
    val todayRowBg = if (isDark) Color(0xFF242416) else Color(0xFFFEFCE8)
    val todayRowBorder = if (isDark) Color(0xFFD7D842).copy(alpha = 0.22f) else Color(0xFFEAB308).copy(alpha = 0.35f)

    // Tomorrow row theme tokens
    val tomorrowAccentBars = if (isDark) {
        listOf(Color(0xFFC084FC), Color(0xFFFF7A5A), Color(0xFFD7D842), Color(0xFF60A5FA))
    } else {
        listOf(Color(0xFF8B5CF6), Color(0xFFEA580C), Color(0xFFCA8A04), Color(0xFF2563EB))
    }
    val tomorrowRowBg = if (isDark) Color.Transparent else Color(0xFFF8FAFC)
    val tomorrowRowBorder = if (isDark) null else Color(0xFFE2E8F0)
    val tomorrowTextColor = if (isDark) Color(0xFFE4E4E7) else Color(0xFF1E293B)
    val tomorrowTimeColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)

    LaunchedEffect(Unit) {
        try {
            if (!sessionToken.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getStudentCalendar("Bearer $sessionToken")
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()
                    body?.todayDateStr?.let { todayDateStr = it }
                    todayEvents = body?.todayEvents ?: emptyList()
                    tomorrowEvents = body?.tomorrowEvents ?: emptyList()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentTimetable", "Error fetching real student calendar: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    if (isLoading) {
        StudentTimetableSkeleton(isDark = isDark, modifier = modifier)
    } else {
        Column(modifier = modifier.fillMaxWidth()) {
            Column {
                Text(
                    text = "Timetable",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Daily Schedule & Classes",
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
                    // TODAY Section
                    Text(
                        text = todayDateStr.uppercase(),
                        color = todayDateRed,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.1.sp
                    )
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
                            StudentEventRow(
                                title        = ev.title,
                                time         = ev.time,
                                barColor     = todayBarColor,
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

                    // TOMORROW Section
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
                                StudentEventRow(
                                    title       = ev.title,
                                    time        = ev.time,
                                    barColor    = barColor,
                                    textColor   = if (isDark) barColor else tomorrowTextColor,
                                    timeColor   = if (isDark) barColor else tomorrowTimeColor,
                                    rowBg       = tomorrowRowBg,
                                    rowBorder   = tomorrowRowBorder
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
