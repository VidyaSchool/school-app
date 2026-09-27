package com.vidyaschool.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.core.view.WindowCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.auth.provider.GoogleAuthProvider
import com.vidyaschool.app.auth.provider.GitHubAuthProvider
import com.vidyaschool.app.auth.repository.AuthRepositoryImpl
import com.vidyaschool.app.auth.viewmodel.AuthViewModel
import com.vidyaschool.app.ui.screens.LoginScreen
import com.vidyaschool.app.ui.screens.SignupScreen
import com.vidyaschool.app.ui.screens.StudentScreen
import com.vidyaschool.app.ui.screens.WelcomeScreen
import com.vidyaschool.app.ui.screens.TeacherScreen
import com.vidyaschool.app.ui.screens.AccountsScreen
import com.vidyaschool.app.ui.screens.LibraryHubScreen
import com.vidyaschool.app.ui.screens.AdminScreen
import com.vidyaschool.app.ui.screens.LibrarianScreen
import com.vidyaschool.app.ui.screens.FeeReceiptScreen
import com.vidyaschool.app.ui.screens.AcademicMarksScreen
import com.vidyaschool.app.ui.theme.VidyaSchoolTheme
import com.vidyaschool.app.ui.components.RainBackgroundEffect
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier

import com.razorpay.PaymentResultWithDataListener
import com.razorpay.PaymentData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.VerifyPaymentRequest
import com.vidyaschool.app.api.PayFeesRequest
import com.vidyaschool.app.api.UpdateChecker
import com.vidyaschool.app.api.UpdateInfo
import android.net.Uri
import androidx.compose.ui.unit.dp
import com.google.android.gms.ads.MobileAds
import android.content.Context
import androidx.lifecycle.lifecycleScope

private fun Context.findActivity(): MainActivity? {
    var ctx = this
    while (ctx is android.content.ContextWrapper) {
        if (ctx is MainActivity) return ctx
        ctx = ctx.baseContext
    }
    return null
}

class MainActivity : AppCompatActivity(), PaymentResultWithDataListener {
    private lateinit var viewModel: AuthViewModel
    private lateinit var sessionManager: SessionManager

    // Pending Razorpay payment state
    var pendingInstallmentId: String = ""
    var pendingOrderId: String = ""
    var pendingIsMock: Boolean = false
    var onPaymentDone: (() -> Unit)? = null
    var onPaymentFailed: ((String) -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        
        // Clean up any downloaded update APKs on startup
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val updateApk = java.io.File(cacheDir, "update.apk")
                if (updateApk.exists()) {
                    updateApk.delete()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        sessionManager = SessionManager(this)
        val isSplashFinished = androidx.compose.runtime.mutableStateOf(false)
        
        val googleProvider = GoogleAuthProvider(webClientId = "841705301007-pv1r9dtukce7jg9ag6aa8ogi4f7aveon.apps.googleusercontent.com")
        val githubProvider = GitHubAuthProvider(
            clientId = "Ov23liiWAPanaeBfTfnw",
            redirectUri = "com.vidyaschool.app:/oauth/github/callback"
        )
        val authRepository = AuthRepositoryImpl(googleProvider, githubProvider)
        viewModel = AuthViewModel(authRepository)
        
        intent?.let { handleIntent(it) }
        com.razorpay.Checkout.preload(applicationContext)

        // Initialize Google Mobile Ads SDK with test device registered
        val testDeviceIds = listOf("A29A804BA4F321157D8E1B3D5661D8AC")
        val configuration = com.google.android.gms.ads.RequestConfiguration.Builder()
            .setTestDeviceIds(testDeviceIds)
            .build()
        MobileAds.setRequestConfiguration(configuration)
        MobileAds.initialize(this) {}

        // Request POST_NOTIFICATIONS permission for Android 13+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        if (sessionManager.isLoggedIn()) {
            retrieveAndRegisterFcmToken()
        }

        val themeMode = sessionManager.getThemeMode()
        val isDarkTheme = when (themeMode) {
            "light" -> false
            "dark" -> true
            else -> {
                val currentNightMode = resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK
                currentNightMode == android.content.res.Configuration.UI_MODE_NIGHT_YES
            }
        }
        val statusBarStyle = if (isDarkTheme) {
            SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        } else {
            SystemBarStyle.light(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT
            )
        }

        // Fade out splash screen
        splashScreen.setOnExitAnimationListener { provider ->
            // Apply edge-to-edge immediately at the start of exit animation to prevent layout jump
            enableEdgeToEdge(
                statusBarStyle = statusBarStyle,
                navigationBarStyle = statusBarStyle
            )
            WindowCompat.setDecorFitsSystemWindows(window, false)

            val fadeOut = android.animation.ObjectAnimator.ofFloat(provider.view, android.view.View.ALPHA, 1f, 0f)
            fadeOut.duration = 400
            fadeOut.addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    provider.remove()
                    isSplashFinished.value = true
                    // Re-apply edge-to-edge settings once splash screen is removed to ensure consistency
                    enableEdgeToEdge(
                        statusBarStyle = statusBarStyle,
                        navigationBarStyle = statusBarStyle
                    )
                    WindowCompat.setDecorFitsSystemWindows(window, false)
                }
            })
            fadeOut.start()
        }

        enableEdgeToEdge(
            statusBarStyle = statusBarStyle,
            navigationBarStyle = statusBarStyle
        )
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            @Suppress("UNUSED_VARIABLE")
            val finished = isSplashFinished.value
            VidyaSchoolApp(viewModel, sessionManager)
        }
    }

    fun retrieveAndRegisterFcmToken() {
        val sessionToken = sessionManager.getSessionToken()
        if (sessionToken.isNullOrEmpty()) return

        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    android.util.Log.w("FCM", "Fetching FCM registration token failed", task.exception)
                    return@addOnCompleteListener
                }
                val token = task.result ?: return@addOnCompleteListener
                android.util.Log.d("FCM", "Current FCM token: $token")
                
                lifecycleScope.launch(Dispatchers.IO) {
                    try {
                        val response = RetrofitClient.authApi.registerFcmToken(
                            authHeader = "Bearer $sessionToken",
                            request = mapOf("token" to token)
                        )
                        if (response.isSuccessful) {
                            android.util.Log.d("FCM", "FCM token registered successfully on server.")
                        }
                    } catch (e: java.lang.Exception) {
                        android.util.Log.e("FCM", "Error sending FCM token to server: ${e.message}")
                    }
                }
            }
        } catch (e: java.lang.Exception) {
            android.util.Log.e("FCM", "Firebase messaging not available or initialized: ${e.message}")
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    var pendingReceiptNo: String? = null

    private fun handleIntent(intent: Intent) {
        val uri = intent.data
        if (uri != null) {
            when {
                uri.scheme == "com.vidyaschool.app" -> viewModel.handleGitHubCallback(intent)
                uri.scheme == "https" && uri.host == "vidyaschool.vercel.app" && uri.path?.startsWith("/fee/payment/") == true -> {
                    pendingReceiptNo = uri.lastPathSegment
                }
            }
        }
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        val paymentId = razorpayPaymentId ?: paymentData?.paymentId ?: return
        val signature = paymentData?.signature ?: ""
        if (pendingInstallmentId.isEmpty()) return
        val installmentId = pendingInstallmentId
        val orderId = pendingOrderId
        val isMock = pendingIsMock
        pendingInstallmentId = ""; pendingOrderId = ""; pendingIsMock = false
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val token = sessionManager.getSessionToken() ?: return@launch
                if (isMock) {
                    // No real order_id — just mark paid directly
                    RetrofitClient.authApi.payFees(
                        authHeader = "Bearer $token",
                        request = PayFeesRequest(installmentIds = listOf(installmentId), paymentMethod = "Razorpay")
                    )
                } else {
                    RetrofitClient.authApi.verifyPayment(
                        authHeader = "Bearer $token",
                        request = VerifyPaymentRequest(
                            orderId = orderId,
                            paymentId = paymentId,
                            signature = signature,
                            installmentIds = listOf(installmentId)
                        )
                    )
                }
            } catch (e: Exception) {
                android.util.Log.e("Razorpay", "Post-payment failed: ${e.message}")
            } finally {
                onPaymentDone?.invoke()
                onPaymentDone = null
            }
        }
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        pendingInstallmentId = ""
        pendingOrderId = ""
        pendingIsMock = false
        val message = when (code) {
            0 -> "Payment cancelled"
            1 -> "Payment failed. Please try again."
            2 -> "Network error. Check your connection."
            else -> "Payment failed. Please try again."
        }
        onPaymentFailed?.invoke(message)
        onPaymentFailed = null
        onPaymentDone = null
    }
}

@Composable
fun VidyaSchoolApp(viewModel: AuthViewModel, sessionManager: SessionManager) {
    var themeMode by remember { mutableStateOf(sessionManager.getThemeMode()) }
    val isDarkTheme = when (themeMode) {
        "light" -> false
        "dark" -> true
        else -> isSystemInDarkTheme()
    }
    val context = androidx.compose.ui.platform.LocalContext.current

    androidx.compose.runtime.LaunchedEffect(Unit) {
        UpdateChecker.updateInfoState.value = UpdateChecker.checkForUpdates(context)
    }

    VidyaSchoolTheme(darkTheme = isDarkTheme) {
        val navController = rememberNavController()

        // Location permission request for accurate weather tracking
        val locationPermissionLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
            val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            if (fineGranted || coarseGranted) {
                android.util.Log.d("LocationPermission", "Location permission granted by user")
            }
        }

        androidx.compose.runtime.LaunchedEffect(Unit) {
            val hasFine = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            val hasCoarse = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasFine && !hasCoarse) {
                locationPermissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                )
            }
        }

        val startDestination = if (sessionManager.isLoggedIn()) {
            val role = sessionManager.getRole() ?: "student"
            when (role.lowercase()) {
                "admin" -> "admin"
                "teacher" -> "teacher"
                "accounts", "account" -> "accounts"
                "librarian" -> "librarian"
                else -> "student"
            }
        } else {
            "welcome"
        }

        // Handle deep link receipt after nav is ready
        androidx.compose.runtime.LaunchedEffect(Unit) {
            val activity = context.findActivity()
            val receiptNo = activity?.pendingReceiptNo
            if (!receiptNo.isNullOrEmpty()) {
                activity.pendingReceiptNo = null
                navController.navigate("feeReceipt/$receiptNo")
            }
        }

        NavHost(navController = navController, startDestination = startDestination) {
            composable("welcome") {
                WelcomeScreen(
                    onLoginClick = { navController.navigate("login") },
                    onCreateAccountClick = { navController.navigate("signup") }
                )
            }
            composable("signup") {
                SignupScreen(
                    onBackClick = { navController.popBackStack() },
                    onSignupSuccess = {
                        navController.navigate("login") {
                            popUpTo("signup") { inclusive = true }
                        }
                    },
                    onLoginClick = {
                        navController.navigate("login") {
                            popUpTo("signup") { inclusive = true }
                        }
                    }
                )
            }
            composable("login") {
                LoginScreen(
                    viewModel = viewModel,
                    onBackClick = { navController.popBackStack() },
                    onSignupClick = { navController.navigate("signup") },
                    onLoginSuccess = { provider, email, name, role, avatarUrl, sessionToken, studentClass ->
                        sessionManager.saveSession(provider, email, name, role, avatarUrl, sessionToken, studentClass)
                        context.findActivity()?.retrieveAndRegisterFcmToken()
                        val destination = when (role.lowercase()) {
                            "admin" -> "admin"
                            "teacher" -> "teacher"
                            "accounts", "account" -> "accounts"
                            "librarian" -> "librarian"
                            else -> "student"
                        }
                        navController.navigate(destination) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("student") {
                StudentScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    studentClass = sessionManager.getStudentClass() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onShowLibrary = { navController.navigate("library") },
                    onShowAcademicPerformance = { navController.navigate("academicMarks") },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("academicMarks") {
                AcademicMarksScreen(onBack = { navController.popBackStack() })
            }
            composable("library") {
                LibraryHubScreen(onBack = { navController.popBackStack() })
            }
            composable("teacher") {
                TeacherScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("accounts") {
                AccountsScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("admin") {
                AdminScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("librarian") {
                LibrarianScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("feeReceipt/{receiptNo}") { backStackEntry ->
                val receiptNo = backStackEntry.arguments?.getString("receiptNo") ?: ""
                FeeReceiptScreen(receiptNo = receiptNo, onBack = { navController.popBackStack() })
            }
        }

    }
}
