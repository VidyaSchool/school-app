package ui.screens

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
import com.vidyaschool.shared.network.ApiClient
import io.ktor.client.call.body
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonPrimitive

@Composable
fun FeeReceiptScreen(receiptNo: String, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    val apiClient = remember { ApiClient() }
    var receipt by remember { mutableStateOf<Map<String, JsonElement>?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(receiptNo) {
        scope.launch {
            try {
                val response = apiClient.verifyReceipt(receiptNo)
                if (response.status.value in 200..299) {
                    receipt = response.body()
                } else {
                    error = "Receipt not found"
                }
            } catch (e: Exception) {
                error = "Failed to load receipt"
            } finally {
                isLoading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
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
                fun getString(key: String): String {
                    val el = r[key] ?: return "—"
                    return el.jsonPrimitive.content
                }
                
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
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

                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            val amountVal = r["amount"]?.jsonPrimitive?.content ?: "0"
                            val formattedAmount = try {
                                val intAmount = amountVal.toDouble().toInt()
                                "₹%,d".format(intAmount)
                            } catch (e: Exception) {
                                "₹$amountVal"
                            }
                            
                            listOf(
                                "Receipt No." to getString("receipt_no"),
                                "Student Name" to getString("student_name"),
                                "Admission No." to (r["admission_number"]?.jsonPrimitive?.content ?: "N/A"),
                                "Class" to buildString {
                                    val cls = r["class"]?.jsonPrimitive?.content
                                    val sec = r["section"]?.jsonPrimitive?.content
                                    if (!cls.isNullOrBlank()) {
                                        append(if (cls == "Nursery" || cls == "KG") cls else "Class $cls")
                                        if (!sec.isNullOrBlank()) append(" - $sec")
                                    } else append("N/A")
                                },
                                "Month" to "${getString("month")} ${getString("year")}",
                                "Amount Paid" to formattedAmount,
                                "Paid On" to (r["paid_date"]?.jsonPrimitive?.content ?: "—"),
                                "Payment Mode" to (r["payment_method"]?.jsonPrimitive?.content ?: "—"),
                            ).forEach { (label, value) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                                }
                                if (label != "Payment Mode") Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                            }
                        }
                    }

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
