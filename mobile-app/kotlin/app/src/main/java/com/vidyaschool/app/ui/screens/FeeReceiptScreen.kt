package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.api.RetrofitClient

@Composable
fun FeeReceiptScreen(receiptNo: String, onBack: () -> Unit) {
    var receipt by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(receiptNo) {
        try {
            val response = RetrofitClient.authApi.verifyReceipt(receiptNo)
            if (response.isSuccessful) receipt = response.body()
            else error = "Receipt not found"
        } catch (e: Exception) {
            error = "Failed to load receipt"
        } finally {
            isLoading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
    ) {
        // Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) { Text("← Back") }
            Spacer(modifier = Modifier.weight(1f))
            Text("Fee Receipt", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(modifier = Modifier.weight(1f))
            Spacer(modifier = Modifier.width(64.dp))
        }

        when {
            isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("❌", fontSize = 40.sp)
                    Text(error ?: "Error", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold)
                    Text("This receipt link is invalid or does not exist.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
            }
            receipt != null -> {
                val r = receipt!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Verified banner
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF10B981).copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFF10B981).copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("✅", fontSize = 22.sp)
                        Column {
                            Text("Payment Verified", fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontSize = 15.sp)
                            Text("VIDYA School — Official Fee Receipt", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        }
                    }

                    // Receipt details card
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            listOf(
                                "Receipt No." to r["receipt_no"],
                                "Student Name" to r["student_name"],
                                "Admission No." to (r["admission_number"] ?: "N/A"),
                                "Class" to buildString {
                                    val cls = r["class"] as? String
                                    val sec = r["section"] as? String
                                    if (cls != null) {
                                        append(if (cls == "Nursery" || cls == "KG") cls else "Class $cls")
                                        if (!sec.isNullOrEmpty()) append(" - $sec")
                                    } else append("N/A")
                                },
                                "Month" to "${r["month"]} ${r["year"]}",
                                "Amount Paid" to "₹${(r["amount"] as? Number)?.toInt()?.let { "%,d".format(it) } ?: r["amount"]}",
                                "Paid On" to (r["paid_date"] as? String ?: "—"),
                                "Payment Mode" to (r["payment_method"] as? String ?: "—"),
                            ).forEach { (label, value) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    Text(value?.toString() ?: "—", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                                }
                                if (label != "Payment Mode") HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                            }
                        }
                    }

                    // Footer note
                    Text(
                        "This receipt has been verified against the VIDYA School database. No physical signature required.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                }
            }
        }
    }
}
