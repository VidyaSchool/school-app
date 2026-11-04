package com.vidyaschool.app.ui.screens

import com.vidyaschool.app.R
import android.content.Intent
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.imeNestedScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.api.LoginRequest
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.auth.model.AuthProvider
import com.vidyaschool.app.auth.provider.GitHubAuthProvider
import com.vidyaschool.app.auth.provider.GoogleAuthProvider
import com.vidyaschool.app.auth.repository.AuthRepositoryImpl
import com.vidyaschool.app.auth.viewmodel.AuthState
import com.vidyaschool.app.auth.viewmodel.AuthViewModel
import com.vidyaschool.app.ui.components.BottomDrawer
import com.vidyaschool.app.ui.components.CustomTextField
import com.vidyaschool.app.ui.components.PrimaryButton
import com.vidyaschool.app.ui.components.SecondaryButton
import kotlinx.coroutines.launch

import com.vidyaschool.app.api.CreateSessionRequest

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onBackClick: () -> Unit,
    onLoginSuccess: (String, String, String?, String, String?, String?, String?) -> Unit,
    onSignupClick: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    val authState by viewModel.authState.collectAsState()
    
    // Google OAuth activity launcher
    val googleLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        viewModel.handleGoogleCallback(result.data)
    }
    
    // GitHub OAuth activity launcher
    val githubLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        result.data?.let { intent ->
            viewModel.handleGitHubCallback(intent)
        }
    }
    
    // Handle auth state changes
    LaunchedEffect(authState) {
        android.util.Log.d("LoginScreen", "Auth state changed: $authState")
        when (authState) {
            is AuthState.Success -> {
                val result = (authState as AuthState.Success).result
                android.util.Log.d("LoginScreen", "Success: provider=${result.provider.name}, email=${result.userInfo.email}")
                
                // Fetch the user role from the backend
                scope.launch {
                    var role = "student"
                    var apiAvatarUrl: String? = result.userInfo.avatarUrl
                    var studentClass: String? = null
                    try {
                        val roleResponse = RetrofitClient.authApi.getUserRole(result.userInfo.email)
                        if (roleResponse.isSuccessful) {
                            role = roleResponse.body()?.role ?: "student"
                            apiAvatarUrl = roleResponse.body()?.image ?: result.userInfo.avatarUrl
                            studentClass = roleResponse.body()?.studentClass
                        } else {
                            // Local fallback for quick testing before deploying backend changes
                            role = when (result.userInfo.email) {
                                "work.ankit.mail@gmail.com" -> "admin"
                                "admin@vidya.com" -> "admin"
                                "teacher@vidya.com" -> "teacher"
                                "accounts@vidya.com" -> "accounts"
                                else -> "student"
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("LoginScreen", "Failed to fetch user role: ${e.message}")
                        // Local fallback for quick testing before deploying backend changes
                        role = when (result.userInfo.email) {
                            "work.ankit.mail@gmail.com" -> "admin"
                            "admin@vidya.com" -> "admin"
                            "teacher@vidya.com" -> "teacher"
                            "accounts@vidya.com" -> "accounts"
                            else -> "student"
                        }
                    }
                    
                    // Register session in the database
                    var sessionToken: String? = null
                    try {
                        val sessionResponse = RetrofitClient.authApi.createSession(
                            CreateSessionRequest(result.userInfo.email)
                        )
                        if (sessionResponse.isSuccessful && sessionResponse.body()?.success == true) {
                            sessionToken = sessionResponse.body()?.session?.token
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("LoginScreen", "Failed to create session: ${e.message}")
                    }
                    
                    Toast.makeText(
                        context,
                        "Signed in with ${result.provider.name}",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    onLoginSuccess(
                        result.provider.name,
                        result.userInfo.email,
                        result.userInfo.name,
                        role,
                        apiAvatarUrl,
                        sessionToken,
                        studentClass
                    )
                    viewModel.resetState()
                }
            }
            is AuthState.Error -> {
                android.util.Log.e("LoginScreen", "Error: ${(authState as AuthState.Error).message}")
                Toast.makeText(context, (authState as AuthState.Error).message, Toast.LENGTH_LONG).show()
                viewModel.resetState()
            }
            is AuthState.Loading -> {
                android.util.Log.d("LoginScreen", "Loading...")
            }
            else -> {
                android.util.Log.d("LoginScreen", "Idle state")
            }
        }
    }

    val handleLogin: () -> Unit = {
        if (email.isBlank() || password.isBlank()) {
            Toast.makeText(context, "Please enter email and password", Toast.LENGTH_SHORT).show()
        } else {
            isLoading = true
            scope.launch {
                try {
                    val response = RetrofitClient.frontendApi.login(
                        LoginRequest(email, password)
                    )
                    
                    if (response.isSuccessful) {
                        val user = response.body()?.user
                        // Better Auth returns token at top level, not inside session
                        var sessionToken = response.body()?.token ?: response.body()?.session?.token
                        if (sessionToken.isNullOrEmpty()) {
                            try {
                                val sessResp = RetrofitClient.authApi.createSession(
                                    CreateSessionRequest(user?.email ?: email)
                                )
                                if (sessResp.isSuccessful && sessResp.body()?.success == true) {
                                    sessionToken = sessResp.body()?.session?.token
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("LoginScreen", "Failed to create session: ${e.message}")
                            }
                        }
                        
                        var role = user?.role ?: "student"
                        var avatarUrl = user?.image
                        var studentClass: String? = null
                        
                        try {
                            val roleResponse = RetrofitClient.authApi.getUserRole(user?.email ?: email)
                            if (roleResponse.isSuccessful) {
                                role = roleResponse.body()?.role ?: role
                                avatarUrl = roleResponse.body()?.image ?: avatarUrl
                                studentClass = roleResponse.body()?.studentClass
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("LoginScreen", "Failed to fetch user role: ${e.message}")
                        }
                        
                        Toast.makeText(context, "Login successful!", Toast.LENGTH_SHORT).show()
                        onLoginSuccess("Email", user?.email ?: email, user?.name, role, avatarUrl, sessionToken, studentClass)
                    } else {
                        Toast.makeText(
                            context,
                            response.body()?.message ?: "Login failed",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(
                        context,
                        "Network error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                } finally {
                    isLoading = false
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 450.dp)
                .systemBarsPadding(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "VIDYA School",
                fontSize = 28.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }

        BottomDrawer(
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            val scrollState = rememberScrollState()
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
                    .imeNestedScroll()
            ) {
                Text(
                    text = "Welcome back",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

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
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                TextButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        text = "Forgot password?",
                        style = MaterialTheme.typography.bodySmall.copy(
                            textDecoration = TextDecoration.Underline
                        )
                    )
                }

                PrimaryButton(
                    text = "Login",
                    onClick = handleLogin,
                    loading = isLoading,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f))
                    Text(
                        text = "OR",
                        fontSize = 12.sp,
                        color = Color(0xFF71717A),
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f))
                }

                SecondaryButton(
                    text = "Continue with Google",
                    onClick = { viewModel.signInWithGoogle(context, googleLauncher) },
                    loading = authState is AuthState.Loading,
                    iconRes = R.drawable.ic_google_logo,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                SecondaryButton(
                    text = "Continue with GitHub",
                    onClick = { viewModel.signInWithGitHub(context, githubLauncher) },
                    loading = authState is AuthState.Loading,
                    iconRes = R.drawable.ic_github_logo,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                val annotatedString = buildAnnotatedString {
                    append("Don't have an account? ")
                    pushStringAnnotation(tag = "signup", annotation = "signup")
                    withStyle(
                        style = SpanStyle(
                            textDecoration = TextDecoration.Underline,
                            fontWeight = FontWeight.Medium
                        )
                    ) {
                        append("Create Account")
                    }
                    pop()
                }

                androidx.compose.foundation.text.ClickableText(
                    text = annotatedString,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = 12.sp,
                        color = Color(0xFF71717A),
                        textAlign = TextAlign.Center
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { offset ->
                        annotatedString.getStringAnnotations("signup", offset, offset)
                            .firstOrNull()?.let { onSignupClick() }
                    }
                )
            }
        }
    }
}
