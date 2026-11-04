package com.vidyaschool.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.airbnb.lottie.compose.*
import com.vidyaschool.app.api.FeeInstallment
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

// ── Draws zigzag teeth along a horizontal line ──────────────────────────────
// fillGreen = true  → green triangles pointing DOWN into the white area (top strip)
// fillGreen = false → white triangles pointing UP into the green area (bottom strip)
private fun DrawScope.drawZigzag(
    greenColor: Color,
    whiteColor: Color,
    toothWidthPx: Float
) {
    val w = size.width
    val h = size.height

    // White background for bottom area
    drawRect(color = whiteColor)

    // Green top area with smooth curved/rounded teeth along the bottom edge
    val topPath = Path().apply {
        moveTo(0f, 0f)
        lineTo(w, 0f)
        lineTo(w, h / 2f)

        var x = w
        while (x > -toothWidthPx) {
            val nextX1 = x - toothWidthPx / 2f
            val nextX2 = x - toothWidthPx

            // Curved valley (rounded tip pointing down)
            cubicTo(
                x - toothWidthPx / 4f, h / 2f,
                x - toothWidthPx / 4f, h,
                nextX1, h
            )
            // Curved peak (rounded tip pointing up)
            cubicTo(
                x - 3f * toothWidthPx / 4f, h,
                x - 3f * toothWidthPx / 4f, h / 2f,
                nextX2, h / 2f
            )

            x = nextX2
        }

        lineTo(0f, 0f)
        close()
    }
    drawPath(topPath, greenColor)
}

// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun PaymentSuccessScreen(
    installment: FeeInstallment,
    studentName: String,
    admissionNo: String,
    onDone: () -> Unit,
    onGoHome: () -> Unit
) {
    val green       = Color(0xFF10B981)
    val greenDark   = Color(0xFF059669)
    val surfaceColor = MaterialTheme.colorScheme.surface
    val onSurface   = MaterialTheme.colorScheme.onSurface
    val outlineVar  = MaterialTheme.colorScheme.outlineVariant

    // Entrance slide-up
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { delay(80); visible = true }

    // Lottie
    val composition by rememberLottieComposition(LottieCompositionSpec.Asset("payment_success.json"))
    val progress by animateLottieCompositionAsState(
        composition  = composition,
        iterations   = 1,
        isPlaying    = visible,
        speed        = 1.2f
    )

    val formattedDate = remember(installment.paidDate) {
        try {
            val i = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val o = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
            o.format(i.parse(installment.paidDate ?: "") ?: Date())
        } catch (e: Exception) { installment.paidDate ?: "—" }
    }

    val amount = "₹%,d".format(installment.amount.toInt())

    val rows = remember(installment, studentName, admissionNo, formattedDate, amount) {
        listOf(
            "Student"      to studentName,
            "Admission No" to admissionNo.ifBlank { "—" },
            "Month"        to "${installment.month} ${installment.year}",
            "Amount Paid"  to amount,
            "Paid On"      to formattedDate,
            "Method"       to (installment.paymentMethod ?: "Razorpay"),
            "Receipt No."  to (installment.receiptNo ?: "—"),
            "Status"       to "Verified ✓"
        )
    }

    AnimatedVisibility(
        visible = visible,
        enter   = slideInVertically(initialOffsetY = { it },
                    animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy,
                                          stiffness   = Spring.StiffnessMedium)) + fadeIn()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {

            // ── GREEN TOP HALF ────────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.42f)               // ~42% of screen height
                    .background(
                        Brush.verticalGradient(listOf(green, greenDark))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .padding(horizontal = 24.dp)
                ) {
                    // Lottie tick inside frosted circle
                    Box(
                        modifier = Modifier
                            .size(110.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f)),
                        contentAlignment = Alignment.Center
                    ) {
                        LottieAnimation(
                            composition = composition,
                            progress    = { progress },
                            modifier    = Modifier.size(88.dp)
                        )
                    }

                    Spacer(Modifier.height(18.dp))

                    Text(
                        "Payment Successful!",
                        fontSize     = 24.sp,
                        fontWeight   = FontWeight.ExtraBold,
                        color        = Color.White
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        amount,
                        fontSize      = 42.sp,
                        fontWeight    = FontWeight.Black,
                        color         = Color.White,
                        letterSpacing = (-1.5).sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${installment.month} ${installment.year}",
                        fontSize   = 14.sp,
                        color      = Color.White.copy(alpha = 0.75f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // ── ZIGZAG SEPARATOR ─────────────────────────────────────────────
            // The Canvas draws interleaved green+white teeth — no border, pure shape
            val density = LocalDensity.current
            val toothW = with(density) { 22.dp.toPx() }   // width of one tooth

            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp)              // 2 × toothHeight
            ) {
                drawZigzag(
                    greenColor   = green,
                    whiteColor   = surfaceColor,
                    toothWidthPx = toothW
                )
            }

            // ── WHITE BOTTOM HALF ─────────────────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.58f)
                    .background(surfaceColor)
                    .verticalScroll(rememberScrollState())
                    .navigationBarsPadding()
                    .padding(horizontal = 24.dp)
            ) {
                Spacer(Modifier.height(16.dp))

                // Section label
                Text(
                    "RECEIPT DETAILS",
                    fontSize      = 10.sp,
                    fontWeight    = FontWeight.Bold,
                    color         = green,
                    letterSpacing = 2.sp
                )

                Spacer(Modifier.height(14.dp))

                // All detail rows
                rows.forEachIndexed { idx, (label, value) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 11.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment     = Alignment.CenterVertically
                    ) {
                        Text(
                            label,
                            fontSize = 13.sp,
                            color    = onSurface.copy(alpha = 0.5f),
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            value,
                            fontSize   = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color      = when (label) {
                                "Amount Paid" -> greenDark
                                "Status"      -> green
                                else          -> onSurface
                            },
                            textAlign  = TextAlign.End,
                            modifier   = Modifier.weight(1.2f)
                        )
                    }
                    if (idx < rows.lastIndex) {
                        HorizontalDivider(
                            color     = outlineVar.copy(alpha = 0.35f),
                            thickness = 0.6.dp
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                Text(
                    "Verified by VIDYA School · No physical signature required",
                    fontSize  = 10.sp,
                    color     = onSurface.copy(alpha = 0.3f),
                    textAlign = TextAlign.Center,
                    modifier  = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(24.dp))

                // ── Buttons ───────────────────────────────────────────────────
                Row(
                    modifier              = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick  = onGoHome,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.outlinedButtonColors(contentColor = green),
                        border   = androidx.compose.foundation.BorderStroke(1.5.dp, green.copy(alpha = 0.5f))
                    ) {
                        Icon(Icons.Rounded.Home, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Home", fontWeight = FontWeight.SemiBold)
                    }
                    Button(
                        onClick  = onDone,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = green)
                    ) {
                        Text("Done", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }

                Spacer(Modifier.height(16.dp))
            }
        }
    }
}
