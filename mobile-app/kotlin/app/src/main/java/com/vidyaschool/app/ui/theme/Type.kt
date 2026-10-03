package com.vidyaschool.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import com.vidyaschool.app.R

val ClarityCityFontFamily = FontFamily(
    Font(R.font.clarity_city_light, FontWeight.Light),
    Font(R.font.clarity_city_regular, FontWeight.Normal),
    Font(R.font.clarity_city_medium, FontWeight.Medium),
    Font(R.font.clarity_city_semibold, FontWeight.SemiBold),
    Font(R.font.clarity_city_bold, FontWeight.Bold),
    Font(R.font.clarity_city_extrabold, FontWeight.ExtraBold),
    Font(R.font.clarity_city_black, FontWeight.Black),
    Font(R.font.clarity_city_italic, FontWeight.Normal, FontStyle.Italic),
    Font(R.font.clarity_city_medium_italic, FontWeight.Medium, FontStyle.Italic),
    Font(R.font.clarity_city_semibold_italic, FontWeight.SemiBold, FontStyle.Italic),
    Font(R.font.clarity_city_bold_italic, FontWeight.Bold, FontStyle.Italic)
)

// Backward-compatible alias
val NunitoFontFamily = ClarityCityFontFamily

private val defaultTypography = Typography()

val AppTypography = Typography(
    displayLarge = defaultTypography.displayLarge.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Bold),
    displayMedium = defaultTypography.displayMedium.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Bold),
    displaySmall = defaultTypography.displaySmall.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    headlineLarge = defaultTypography.headlineLarge.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Bold),
    headlineMedium = defaultTypography.headlineMedium.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    headlineSmall = defaultTypography.headlineSmall.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    titleLarge = defaultTypography.titleLarge.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    titleMedium = defaultTypography.titleMedium.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    titleSmall = defaultTypography.titleSmall.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Medium),
    bodyLarge = defaultTypography.bodyLarge.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Medium),
    bodyMedium = defaultTypography.bodyMedium.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Medium),
    bodySmall = defaultTypography.bodySmall.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Medium),
    labelLarge = defaultTypography.labelLarge.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    labelMedium = defaultTypography.labelMedium.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.SemiBold),
    labelSmall = defaultTypography.labelSmall.copy(fontFamily = ClarityCityFontFamily, fontWeight = FontWeight.Medium)
)

