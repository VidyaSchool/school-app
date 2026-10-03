package com.vidyaschool.app.ui.shadcn

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import com.vidyaschool.app.ui.theme.isAppDark
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class BadgeVariant {
    DEFAULT,
    SECONDARY,
    OUTLINE,
    DESTRUCTIVE,
    SUCCESS
}

/**
 * shadcn/ui-inspired Badge component for Jetpack Compose (pill rounded-full)
 */
@Composable
fun Badge(
    text: String,
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.DEFAULT,
    shape: Shape = CircleShape,
    showDot: Boolean = false,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    val isDark = isAppDark()

    val (bgColor, textColor, borderColor) = when (variant) {
        BadgeVariant.DEFAULT -> Triple(
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF09090B),
            if (isDark) Color(0xFF09090B) else Color(0xFFFAFAFA),
            Color.Transparent
        )
        BadgeVariant.SECONDARY -> Triple(
            if (isDark) Color(0xFF27272A) else Color(0xFFF4F4F5),
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF18181B),
            Color.Transparent
        )
        BadgeVariant.OUTLINE -> Triple(
            Color.Transparent,
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF09090B),
            if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
        )
        BadgeVariant.DESTRUCTIVE -> Triple(
            if (isDark) Color(0xFFEF4444).copy(alpha = 0.18f) else Color(0xFFEF4444).copy(alpha = 0.10f),
            if (isDark) Color(0xFFF87171) else Color(0xFFDC2626),
            if (isDark) Color(0xFFEF4444).copy(alpha = 0.30f) else Color(0xFFEF4444).copy(alpha = 0.25f)
        )
        BadgeVariant.SUCCESS -> Triple(
            if (isDark) Color(0xFF10B981).copy(alpha = 0.18f) else Color(0xFF10B981).copy(alpha = 0.12f),
            if (isDark) Color(0xFF34D399) else Color(0xFF047857),
            if (isDark) Color(0xFF10B981).copy(alpha = 0.30f) else Color(0xFF10B981).copy(alpha = 0.25f)
        )
    }

    Row(
        modifier = modifier
            .clip(shape)
            .background(bgColor)
            .then(
                if (borderColor != Color.Transparent)
                    Modifier.border(1.dp, borderColor, shape)
                else Modifier
            )
            .padding(horizontal = 8.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        if (showDot) {
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(textColor)
            )
        }
        leadingIcon?.invoke()
        Text(
            text = text,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = textColor,
            letterSpacing = 0.1.sp
        )
    }
}
