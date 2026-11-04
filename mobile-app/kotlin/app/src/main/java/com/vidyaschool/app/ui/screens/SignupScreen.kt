package com.vidyaschool.app.ui.screens

import android.widget.Toast
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
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.SignupRequest
import com.vidyaschool.app.ui.components.BottomDrawer
import com.vidyaschool.app.ui.components.CustomTextField
import com.vidyaschool.app.ui.components.PrimaryButton
import com.vidyaschool.app.ui.shadcn.Select
import com.vidyaschool.app.ui.shadcn.SelectOption
import kotlinx.coroutines.launch

private val ROLE_OPTIONS = listOf(
    SelectOption("student", "Student"),
    SelectOption("teacher", "Teacher"),
    SelectOption("accounts", "Accounts"),
    SelectOption("admin", "Admin")
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SignupScreen(
    onBackClick: () -> Unit,
    onSignupSuccess: () -> Unit,
    onLoginClick: () -> Unit = {}
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("student") }
    var isLoading by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val handleSignup: () -> Unit = {
        when {
            name.isBlank() || email.isBlank() || password.isBlank() ->
                Toast.makeText(context, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            password != confirmPassword ->
                Toast.makeText(context, "Passwords do not match", Toast.LENGTH_SHORT).show()
            password.length < 8 ->
                Toast.makeText(context, "Password must be at least 8 characters", Toast.LENGTH_SHORT).show()
            else -> {
                isLoading = true
                scope.launch {
                    try {
                        val response = RetrofitClient.frontendApi.signup(
                            SignupRequest(email = email, password = password, name = name, role = role)
                        )
                        if (response.isSuccessful) {
                            Toast.makeText(context, "Account created! Please log in.", Toast.LENGTH_SHORT).show()
                            onSignupSuccess()
                        } else {
                            Toast.makeText(
                                context,
                                response.body()?.message ?: "Signup failed",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    } finally {
                        isLoading = false
                    }
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
                .padding(bottom = 550.dp)
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
                    text = "Create account",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                CustomTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = "Full Name",
                    placeholder = "e.g. Ravi Kumar",
                    modifier = Modifier.padding(bottom = 12.dp)
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
                    placeholder = "Min. 8 characters",
                    isPassword = true,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                CustomTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = "Confirm Password",
                    placeholder = "Re-enter your password",
                    isPassword = true,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Select(
                    selectedValue = role,
                    onValueChange = { role = it },
                    options = ROLE_OPTIONS,
                    label = "Preferred Role",
                    placeholder = "Select role",
                    modifier = Modifier.padding(bottom = 20.dp)
                )

                PrimaryButton(
                    text = "Create Account",
                    onClick = handleSignup,
                    loading = isLoading,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                val annotatedString = buildAnnotatedString {
                    append("Already have an account? ")
                    pushStringAnnotation(tag = "login", annotation = "login")
                    withStyle(
                        style = SpanStyle(
                            textDecoration = TextDecoration.Underline,
                            fontWeight = FontWeight.Medium
                        )
                    ) {
                        append("Sign In")
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
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    onClick = { offset ->
                        annotatedString.getStringAnnotations("login", offset, offset)
                            .firstOrNull()?.let { onLoginClick() }
                    }
                )
            }
        }
    }
}
