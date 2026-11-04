package ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.shared.auth.SharedAuthViewModel
import com.vidyaschool.shared.auth.SharedAuthState
import com.vidyaschool.shared.models.LoginRequest
import com.vidyaschool.shared.models.CreateSessionRequest
import com.vidyaschool.shared.models.DeviceCodeResponse
import com.vidyaschool.shared.network.ApiClient
import ui.components.CustomTextField
import ui.components.PrimaryButton
import ui.components.SecondaryButton
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.awt.Desktop
import java.net.URI

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LoginScreen(
    viewModel: SharedAuthViewModel,
    onBackClick: () -> Unit,
    onLoginSuccess: (String, String, String?, String, String?, String?, String?) -> Unit,
    onSignupClick: () -> Unit = {},
    showToast: (String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var loginMethod by remember { mutableStateOf("browser") } // "browser" or "password"

    // Device Auth state
    var deviceAuthData by remember { mutableStateOf<DeviceCodeResponse?>(null) }
    var isRequestingDeviceCode by remember { mutableStateOf(false) }
    var isPollingDevice by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val authState by viewModel.authState.collectAsState()
    val apiClient = remember { ApiClient() }
    val clipboardManager = LocalClipboardManager.current

    // Helper to open browser safely on Desktop
    val openBrowser: (String) -> Unit = { url ->
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI(url))
            } else {
                showToast("Open URL: $url")
            }
        } catch (e: Exception) {
            showToast("Failed to open browser: ${e.message}")
        }
    }

    // Function to start Browser Login Flow
    val startBrowserLogin: () -> Unit = {
        isRequestingDeviceCode = true
        scope.launch {
            try {
                val response = apiClient.getDeviceCode()
                deviceAuthData = response
                isPollingDevice = true

                // Open browser automatically
                openBrowser(response.verificationUri)
                showToast("Opening browser for authorization...")

                // Start polling loop
                while (isPollingDevice) {
                    delay((response.interval * 1000).toLong())
                    try {
                        val pollResult = apiClient.pollDeviceStatus(response.deviceToken)
                        if (pollResult.status == "approved") {
                            isPollingDevice = false
                            val token = pollResult.sessionToken
                            val u = pollResult.user

                            if (token != null && u != null) {
                                var role = u.role ?: "student"
                                var avatarUrl = u.image
                                var studentClass = u.`class`

                                try {
                                    val roleResp = apiClient.getUserRole(u.email ?: "")
                                    role = roleResp.role
                                    avatarUrl = roleResp.image ?: avatarUrl
                                    studentClass = roleResp.studentClass ?: studentClass
                                } catch (_: Exception) {}

                                showToast("Device Authorized! Welcome, ${u.name ?: u.email}")
                                onLoginSuccess(
                                    "Browser",
                                    u.email ?: "",
                                    u.name,
                                    role,
                                    avatarUrl,
                                    token,
                                    studentClass
                                )
                            }
                            break
                        } else if (pollResult.status == "expired") {
                            isPollingDevice = false
                            deviceAuthData = null
                            showToast("Login session expired. Please try again.")
                            break
                        }
                    } catch (e: Exception) {
                        // Keep polling silently on transient network errors
                    }
                }
            } catch (e: Exception) {
                showToast("Failed to initiate browser login: ${e.message}")
            } finally {
                isRequestingDeviceCode = false
            }
        }
    }

    // Handle traditional email/password login
    val handlePasswordLogin: () -> Unit = {
        if (email.isBlank() || password.isBlank()) {
            showToast("Please enter email and password")
        } else {
            isLoading = true
            scope.launch {
                try {
                    val response = apiClient.login(LoginRequest(email, password))
                    var sessionToken = response.token ?: response.session?.token
                    val user = response.user

                    if (user != null) {
                        if (sessionToken.isNullOrEmpty()) {
                            try {
                                val sessResp = apiClient.createSession(CreateSessionRequest(user.email))
                                if (sessResp.success) {
                                    sessionToken = sessResp.session?.token
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }

                        var role = user.role ?: "student"
                        var avatarUrl = user.image
                        var studentClass: String? = null

                        try {
                            val roleResponse = apiClient.getUserRole(user.email)
                            role = roleResponse.role
                            avatarUrl = roleResponse.image ?: avatarUrl
                            studentClass = roleResponse.studentClass
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }

                        showToast("Login successful!")
                        onLoginSuccess("Email", user.email, user.name, role, avatarUrl, sessionToken, studentClass)
                    } else {
                        showToast(response.message ?: "Login failed")
                    }
                } catch (e: Exception) {
                    showToast("Network error: ${e.message}")
                } finally {
                    isLoading = false
                }
            }
        }
    }

    val handleSocialMock: (String) -> Unit = { provider ->
        isLoading = true
        scope.launch {
            try {
                val mockEmail = if (provider == "Google") "work.ankit.mail@gmail.com" else "student@vidya.com"
                val mockName = if (provider == "Google") "Ankit (Google)" else "Student (GitHub)"
                val mockAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb"

                viewModel.createSocialSession(
                    email = mockEmail,
                    name = mockName,
                    avatarUrl = mockAvatar,
                    provider = provider.lowercase()
                )
            } catch (e: Exception) {
                showToast("Social login failed: ${e.message}")
            } finally {
                isLoading = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF09090B)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .width(440.dp)
                .clip(RoundedCornerShape(20.dp))
                .border(1.dp, Color(0xFF27272A), RoundedCornerShape(20.dp))
                .background(Color(0xFF18181B))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Logo & Title
            Text(
                text = "VIDYA School",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )
            Text(
                text = "Secure Desktop Authentication",
                fontSize = 13.sp,
                color = Color(0xFFA1A1AA),
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            // Method Selector Pills
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF09090B))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { loginMethod = "browser" },
                    modifier = Modifier.weight(1f).height(36.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (loginMethod == "browser") Color(0xFF27272A) else Color.Transparent,
                        contentColor = if (loginMethod == "browser") Color.White else Color(0xFFA1A1AA)
                    )
                ) {
                    Text("Browser Login", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }

                Button(
                    onClick = { loginMethod = "password" },
                    modifier = Modifier.weight(1f).height(36.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (loginMethod == "password") Color(0xFF27272A) else Color.Transparent,
                        contentColor = if (loginMethod == "password") Color.White else Color(0xFFA1A1AA)
                    )
                ) {
                    Text("Password", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            AnimatedContent(targetState = loginMethod) { method ->
                if (method == "browser") {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (deviceAuthData == null) {
                            // Initial state - Click to start Browser Auth
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .border(1.dp, Color(0xFF27272A), RoundedCornerShape(14.dp))
                                    .background(Color(0xFF09090B))
                                    .padding(20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "🌐 Browser Single Sign-On",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Log in securely using your browser without sharing passwords with the app.",
                                        fontSize = 12.sp,
                                        color = Color(0xFFA1A1AA),
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(top = 6.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            PrimaryButton(
                                text = if (isRequestingDeviceCode) "Generating Code..." else "Login via Browser",
                                onClick = startBrowserLogin,
                                loading = isRequestingDeviceCode,
                                modifier = Modifier.fillMaxWidth().height(44.dp)
                            )
                        } else {
                            // Active Device Code Pairing Box
                            val auth = deviceAuthData!!
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "CONFIRM CODE ON WEB",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF10B981),
                                    letterSpacing = 1.2.sp
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                // Pair Code Display Box
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(Color(0xFF09090B))
                                        .border(1.dp, Color(0xFF10B981).copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                                        .padding(vertical = 18.dp, horizontal = 16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        Text(
                                            text = auth.userCode,
                                            fontSize = 32.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontFamily = FontFamily.Monospace,
                                            color = Color(0xFF10B981),
                                            letterSpacing = 4.sp
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    SecondaryButton(
                                        text = "Copy Code",
                                        onClick = {
                                            clipboardManager.setText(AnnotatedString(auth.userCode))
                                            showToast("Code ${auth.userCode} copied!")
                                        },
                                        modifier = Modifier.weight(1f).height(36.dp)
                                    )

                                    SecondaryButton(
                                        text = "Re-open Link",
                                        onClick = { openBrowser(auth.verificationUri) },
                                        modifier = Modifier.weight(1f).height(36.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(14.dp),
                                        color = Color(0xFF10B981),
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Waiting for web approval...",
                                        fontSize = 12.sp,
                                        color = Color(0xFFA1A1AA)
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                TextButton(
                                    onClick = {
                                        isPollingDevice = false
                                        deviceAuthData = null
                                    }
                                ) {
                                    Text("Cancel", fontSize = 12.sp, color = Color(0xFFEF4444))
                                }
                            }
                        }
                    }
                } else {
                    // Password Login Option
                    Column(modifier = Modifier.fillMaxWidth()) {
                        CustomTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = "Email",
                            placeholder = "e.g. you@school.edu",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        CustomTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = "Password",
                            placeholder = "Enter your password",
                            isPassword = true,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        PrimaryButton(
                            text = "Login",
                            onClick = handlePasswordLogin,
                            loading = isLoading || authState is SharedAuthState.Loading,
                            modifier = Modifier.fillMaxWidth().height(44.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Social Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Divider(modifier = Modifier.weight(1f), color = Color(0xFF27272A))
                Text(
                    text = "OR",
                    fontSize = 11.sp,
                    color = Color(0xFF71717A),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )
                Divider(modifier = Modifier.weight(1f), color = Color(0xFF27272A))
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SecondaryButton(
                    text = "Google",
                    onClick = { handleSocialMock("Google") },
                    loading = isLoading,
                    modifier = Modifier.weight(1f).height(38.dp)
                )
                SecondaryButton(
                    text = "GitHub",
                    onClick = { handleSocialMock("GitHub") },
                    loading = isLoading,
                    modifier = Modifier.weight(1f).height(38.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val signupText = buildAnnotatedString {
                append("Don't have an account? ")
                pushStringAnnotation(tag = "signup", annotation = "signup")
                withStyle(SpanStyle(color = Color.White, textDecoration = TextDecoration.Underline, fontWeight = FontWeight.SemiBold)) {
                    append("Create Account")
                }
                pop()
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSignupClick() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = signupText,
                    fontSize = 12.sp,
                    color = Color(0xFF71717A)
                )
            }
        }
    }
}
