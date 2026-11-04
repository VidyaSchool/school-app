package ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ui.components.BottomDrawer
import ui.components.PrimaryButton
import ui.components.SecondaryButton

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onCreateAccountClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 300.dp),
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
            PrimaryButton(
                text = "Login",
                onClick = onLoginClick,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            SecondaryButton(
                text = "Create Account",
                onClick = onCreateAccountClick,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            val annotatedString = buildAnnotatedString {
                append("By continuing, you agree to our ")
                pushStringAnnotation(tag = "terms", annotation = "terms")
                withStyle(
                    style = SpanStyle(
                        textDecoration = TextDecoration.Underline,
                        fontWeight = FontWeight.Medium
                    )
                ) {
                    append("Terms & Conditions")
                }
                pop()
                append(" and ")
                pushStringAnnotation(tag = "privacy", annotation = "privacy")
                withStyle(
                    style = SpanStyle(
                        textDecoration = TextDecoration.Underline,
                        fontWeight = FontWeight.Medium
                    )
                ) {
                    append("Privacy Policy")
                }
                pop()
                append(".")
            }

            Text(
                text = annotatedString,
                fontSize = 12.sp,
                color = Color(0xFF71717A),
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
