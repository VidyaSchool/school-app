package com.vidyaschool.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.R
import com.vidyaschool.app.ui.components.BottomDrawer
import com.vidyaschool.app.ui.components.PrimaryButton
import com.vidyaschool.app.ui.components.SecondaryButton

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onCreateAccountClick: () -> Unit
) {
    val context = LocalContext.current
    val infiniteTransition = rememberInfiniteTransition(label = "globe")
    val rotationCw by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(90000, easing = LinearEasing), RepeatMode.Restart),
        label = "cw"
    )
    val rotationCcw by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(tween(90000, easing = LinearEasing), RepeatMode.Restart),
        label = "ccw"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Top-left globe (clockwise)
        Icon(
            painter = painterResource(R.drawable.ic_globe_backdrop),
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.22f),
            modifier = Modifier
                .size(350.dp)
                .offset(x = (-60).dp, y = (-60).dp)
                .graphicsLayer { rotationZ = rotationCw }
        )
        // Bottom-right globe (anticlockwise)
        Icon(
            painter = painterResource(R.drawable.ic_globe_backdrop),
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.18f),
            modifier = Modifier
                .size(220.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 30.dp, y = (-270).dp)
                .graphicsLayer { rotationZ = rotationCcw }
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.55f)
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
                withStyle(style = SpanStyle(textDecoration = TextDecoration.Underline, fontWeight = FontWeight.Medium)) {
                    append("Terms & Conditions")
                }
                pop()
                append(" and ")
                pushStringAnnotation(tag = "privacy", annotation = "privacy")
                withStyle(style = SpanStyle(textDecoration = TextDecoration.Underline, fontWeight = FontWeight.Medium)) {
                    append("Privacy Policy")
                }
                pop()
                append(".")
            }

            ClickableText(
                text = annotatedString,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 12.sp,
                    color = Color(0xFF71717A),
                    textAlign = TextAlign.Center
                ),
                modifier = Modifier.fillMaxWidth(),
                onClick = { offset ->
                    annotatedString.getStringAnnotations("terms", offset, offset).firstOrNull()?.let {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://vidyaschool.vercel.app/docs/terms-of-service")))
                    }
                    annotatedString.getStringAnnotations("privacy", offset, offset).firstOrNull()?.let {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://vidyaschool.vercel.app/docs/privacy-policy")))
                    }
                }
            )
        }
    }
}
