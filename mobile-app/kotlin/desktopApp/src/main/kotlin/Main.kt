import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import com.vidyaschool.shared.auth.SharedAuthViewModel
import com.vidyaschool.shared.auth.SharedAuthState
import com.vidyaschool.shared.session.SessionStorage
import ui.theme.VidyaSchoolTheme
import ui.screens.*
import kotlinx.coroutines.delay

fun main() = application {
    val windowState = rememberWindowState(width = 960.dp, height = 720.dp)
    
    val sessionStorage = remember { SessionStorage() }
    val sharedViewModel = remember { SharedAuthViewModel(sessionStorage) }
    
    val authState by sharedViewModel.authState.collectAsState()
    val currentUser by sharedViewModel.currentUser.collectAsState()
    
    var currentScreen by remember { mutableStateOf("loading") }
    var pendingReceiptNo by remember { mutableStateOf("") }
    
    // Custom Toast overlay system for Desktop
    var toastMessage by remember { mutableStateOf<String?>(null) }
    val showToast: (String) -> Unit = { msg ->
        toastMessage = msg
    }
    
    LaunchedEffect(toastMessage) {
        if (toastMessage != null) {
            delay(3000)
            toastMessage = null
        }
    }
    
    // Check session on startup
    LaunchedEffect(Unit) {
        sharedViewModel.checkSession()
    }
    
    LaunchedEffect(authState) {
        when (val state = authState) {
            is SharedAuthState.Loading -> {
                currentScreen = "loading"
            }
            is SharedAuthState.LoggedIn -> {
                val role = state.user.role.lowercase()
                currentScreen = when (role) {
                    "admin" -> "admin"
                    "teacher" -> "teacher"
                    "accounts", "account" -> "accounts"
                    "librarian" -> "librarian"
                    else -> "student"
                }
            }
            is SharedAuthState.LoggedOut -> {
                currentScreen = "welcome"
            }
            is SharedAuthState.Error -> {
                showToast(state.message)
                currentScreen = "welcome"
            }
            else -> {
                if (sessionStorage.isLoggedIn()) {
                    val role = sessionStorage.getRole()?.lowercase() ?: "student"
                    currentScreen = when (role) {
                        "admin" -> "admin"
                        "teacher" -> "teacher"
                        "accounts", "account" -> "accounts"
                        "librarian" -> "librarian"
                        else -> "student"
                    }
                } else {
                    currentScreen = "welcome"
                }
            }
        }
    }
    
    Window(
        onCloseRequest = ::exitApplication,
        state = windowState,
        title = "VidyaSchool Desktop Manager"
    ) {
        VidyaSchoolTheme {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
            ) {
                // Navigation Router
                when (currentScreen) {
                    "loading" -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    
                    "welcome" -> {
                        WelcomeScreen(
                            onLoginClick = { currentScreen = "login" },
                            onCreateAccountClick = { currentScreen = "signup" }
                        )
                    }
                    
                    "signup" -> {
                        SignupScreen(
                            onBackClick = { currentScreen = "welcome" },
                            onSignupSuccess = { currentScreen = "login" },
                            showToast = showToast
                        )
                    }
                    
                    "login" -> {
                        LoginScreen(
                            viewModel = sharedViewModel,
                            onBackClick = { currentScreen = "welcome" },
                            onLoginSuccess = { provider, email, name, role, avatarUrl, sessionToken, studentClass ->
                                sessionStorage.saveSession(provider, email, name, role, avatarUrl, sessionToken, studentClass, null)
                                val dest = when (role.lowercase()) {
                                    "admin" -> "admin"
                                    "teacher" -> "teacher"
                                    "accounts", "account" -> "accounts"
                                    "librarian" -> "librarian"
                                    else -> "student"
                                }
                                currentScreen = dest
                            },
                            onSignupClick = { currentScreen = "signup" },
                            showToast = showToast
                        )
                    }
                    
                    "student" -> {
                        val user = currentUser
                        StudentScreen(
                            provider = user?.provider ?: sessionStorage.getProvider() ?: "",
                            email = user?.email ?: sessionStorage.getEmail() ?: "",
                            name = user?.name ?: sessionStorage.getName() ?: "Student",
                            avatarUrl = user?.avatarUrl ?: sessionStorage.getAvatarUrl() ?: "",
                            studentClass = user?.studentClass ?: sessionStorage.getStudentClass() ?: "",
                            themeMode = sessionStorage.getThemeMode(),
                            onThemeChange = { mode ->
                                sessionStorage.setThemeMode(mode)
                                showToast("Theme changed to $mode")
                            },
                            onShowLibrary = { currentScreen = "library" },
                            onLogout = {
                                sharedViewModel.logout()
                                currentScreen = "welcome"
                            },
                            showToast = showToast
                        )
                    }
                    
                    "library" -> {
                        LibraryHubScreen(
                            onBack = { currentScreen = "student" },
                            showToast = showToast
                        )
                    }
                    
                    "teacher" -> {
                        val user = currentUser
                        TeacherScreen(
                            provider = user?.provider ?: sessionStorage.getProvider() ?: "",
                            email = user?.email ?: sessionStorage.getEmail() ?: "",
                            name = user?.name ?: sessionStorage.getName() ?: "Teacher",
                            avatarUrl = user?.avatarUrl ?: sessionStorage.getAvatarUrl() ?: "",
                            themeMode = sessionStorage.getThemeMode(),
                            onThemeChange = { mode ->
                                sessionStorage.setThemeMode(mode)
                                showToast("Theme changed to $mode")
                            },
                            onLogout = {
                                sharedViewModel.logout()
                                currentScreen = "welcome"
                            },
                            showToast = showToast
                        )
                    }
                    
                    "accounts" -> {
                        val user = currentUser
                        AccountsScreen(
                            provider = user?.provider ?: sessionStorage.getProvider() ?: "",
                            email = user?.email ?: sessionStorage.getEmail() ?: "",
                            name = user?.name ?: sessionStorage.getName() ?: "Accounts Officer",
                            avatarUrl = user?.avatarUrl ?: sessionStorage.getAvatarUrl() ?: "",
                            themeMode = sessionStorage.getThemeMode(),
                            onThemeChange = { mode ->
                                sessionStorage.setThemeMode(mode)
                                showToast("Theme changed to $mode")
                            },
                            onLogout = {
                                sharedViewModel.logout()
                                currentScreen = "welcome"
                            },
                            showToast = showToast
                        )
                    }
                    
                    "admin" -> {
                        val user = currentUser
                        AdminScreen(
                            provider = user?.provider ?: sessionStorage.getProvider() ?: "",
                            email = user?.email ?: sessionStorage.getEmail() ?: "",
                            name = user?.name ?: sessionStorage.getName() ?: "Administrator",
                            avatarUrl = user?.avatarUrl ?: sessionStorage.getAvatarUrl() ?: "",
                            themeMode = sessionStorage.getThemeMode(),
                            onThemeChange = { mode ->
                                sessionStorage.setThemeMode(mode)
                                showToast("Theme changed to $mode")
                            },
                            onLogout = {
                                sharedViewModel.logout()
                                currentScreen = "welcome"
                            },
                            showToast = showToast
                        )
                    }
                    
                    "librarian" -> {
                        val user = currentUser
                        LibrarianScreen(
                            provider = user?.provider ?: sessionStorage.getProvider() ?: "",
                            email = user?.email ?: sessionStorage.getEmail() ?: "",
                            name = user?.name ?: sessionStorage.getName() ?: "Librarian",
                            avatarUrl = user?.avatarUrl ?: sessionStorage.getAvatarUrl() ?: "",
                            themeMode = sessionStorage.getThemeMode(),
                            onThemeChange = { mode ->
                                sessionStorage.setThemeMode(mode)
                                showToast("Theme changed to $mode")
                            },
                            onLogout = {
                                sharedViewModel.logout()
                                currentScreen = "welcome"
                            },
                            showToast = showToast
                        )
                    }
                    
                    "feeReceipt" -> {
                        FeeReceiptScreen(
                            receiptNo = pendingReceiptNo,
                            onBack = { currentScreen = "student" }
                        )
                    }
                }
                
                // Floating Toast Notification Overlay (Shadcn-like custom banner)
                toastMessage?.let { msg ->
                    Card(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 32.dp)
                            .wrapContentWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.inverseSurface,
                            contentColor = MaterialTheme.colorScheme.inverseOnSurface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                    ) {
                        Text(
                            text = msg,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
