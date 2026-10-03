package com.vidyaschool.app.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Size
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.core.SurfaceOrientedMeteringPointFactory
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.view.ViewGroup
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import coil.compose.AsyncImage
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import com.vidyaschool.app.R
import com.vidyaschool.app.api.*
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.ui.components.CustomTextField
import com.vidyaschool.app.ui.shadcn.Badge
import com.vidyaschool.app.ui.shadcn.BadgeVariant
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Request
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARIAN ISSUE BOOK DRAWER (BOTTOM-SHEET DRAWER VIEW WITH SMOOTH ANIMATION)
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibrarianIssueBookDrawer(
    sessionManager: SessionManager,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit = {}
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        scrimColor = Color.Black.copy(alpha = 0.5f),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 12.dp, bottom = 6.dp)
                    .width(42.dp)
                    .height(5.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
            )
        },
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f)
        ) {
            LibrarianIssueBookContent(
                sessionManager = sessionManager,
                isDrawer = true,
                onClose = onDismiss,
                onSuccess = onSuccess
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE SCREEN WRAPPER (FOR BACKWARD COMPATIBILITY)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun LibrarianIssueBookScreen(
    sessionManager: SessionManager,
    onNotificationClick: () -> Unit = {},
    onBackClick: () -> Unit = {}
) {
    LibrarianIssueBookContent(
        sessionManager = sessionManager,
        isDrawer = false,
        onClose = onBackClick,
        onNotificationClick = onNotificationClick
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ISSUE BOOK CONTENT (AUTO-FIND USER, NO FIND BUTTON, BARCODE SCANNER)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun LibrarianIssueBookContent(
    sessionManager: SessionManager,
    isDrawer: Boolean = false,
    onClose: () -> Unit = {},
    onNotificationClick: () -> Unit = {},
    onSuccess: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current
    val sessionToken = sessionManager.getSessionToken()
    val authHeader = remember(sessionToken) { if (!sessionToken.isNullOrEmpty()) "Bearer $sessionToken" else "" }

    // ── Student Search & State ─────────────────────────────────────────────────
    var studentInput by remember { mutableStateOf("") }
    var isSearchingStudent by remember { mutableStateOf(false) }
    var resolvedStudent by remember { mutableStateOf<ResolvedBorrowerUser?>(null) }
    var studentErrorMessage by remember { mutableStateOf<String?>(null) }

    // ── Auto-Find User: Debounced automatic lookup on input change (No Find Button) ─
    LaunchedEffect(studentInput, authHeader) {
        val clean = studentInput.trim()
        if (clean.length < 2) {
            resolvedStudent = null
            studentErrorMessage = null
            isSearchingStudent = false
            return@LaunchedEffect
        }

        delay(400) // Debounce typing
        isSearchingStudent = true
        studentErrorMessage = null

        try {
            val res = withContext(Dispatchers.IO) {
                RetrofitClient.authApi.resolveBorrower(authHeader, clean)
            }
            if (res.isSuccessful && res.body()?.found == true) {
                resolvedStudent = res.body()?.user
                studentErrorMessage = null
            } else {
                resolvedStudent = null
                studentErrorMessage = "No student found matching \"$clean\". Verify admission #, username, or email."
            }
        } catch (e: Exception) {
            studentErrorMessage = "Network error: ${e.message}"
        } finally {
            isSearchingStudent = false
        }
    }

    // ── Book State ─────────────────────────────────────────────────────────────
    var isScannerOpen by remember { mutableStateOf(false) }
    var scannedIsbn by remember { mutableStateOf("") }
    var manualIsbnInput by remember { mutableStateOf("") }
    var showManualIsbnField by remember { mutableStateOf(false) }
    var isSearchingBook by remember { mutableStateOf(false) }
    var resolvedBook by remember { mutableStateOf<LibraryBookItem?>(null) }
    var resolvedBookCoverUrl by remember { mutableStateOf<String?>(null) }
    var bookErrorMessage by remember { mutableStateOf<String?>(null) }

    // ── Loan Configuration ─────────────────────────────────────────────────────
    var loanDays by remember { mutableIntStateOf(14) }
    var isSubmittingIssue by remember { mutableStateOf(false) }
    var issueSuccessReceipt by remember { mutableStateOf<String?>(null) }

    // ── Book Lookup Logic (Backend + Google Books / OpenLibrary Fallback) ──────
    fun lookupBook(isbnToLookup: String) {
        val clean = isbnToLookup.replace(Regex("[^0-9X]", RegexOption.IGNORE_CASE), "").uppercase()
        if (clean.length < 8) {
            bookErrorMessage = "Please enter a valid 10 or 13-digit ISBN"
            return
        }
        isSearchingBook = true
        bookErrorMessage = null
        resolvedBook = null
        resolvedBookCoverUrl = null

        scope.launch {
            try {
                // 1. Try Backend ISBN Lookup
                val res = withContext(Dispatchers.IO) {
                    try {
                        RetrofitClient.authApi.lookupBookByIsbn(authHeader, clean)
                    } catch (e: Exception) {
                        null
                    }
                }

                if (res != null && res.isSuccessful && res.body()?.found == true) {
                    val body = res.body()!!
                    resolvedBook = body.book
                    resolvedBookCoverUrl = body.coverUrl ?: body.book?.coverUrl
                } else {
                    // 2. Try Catalog Search on backend
                    val catalogRes = withContext(Dispatchers.IO) {
                        try {
                            RetrofitClient.authApi.getLibrarianBooks(authHeader, clean)
                        } catch (e: Exception) {
                            null
                        }
                    }
                    val matchedCatalogBook = catalogRes?.body()?.firstOrNull { it.isbn.equals(clean, ignoreCase = true) }

                    if (matchedCatalogBook != null) {
                        resolvedBook = matchedCatalogBook
                        resolvedBookCoverUrl = matchedCatalogBook.coverUrl
                    } else {
                        // 3. Fallback: Public Google Books API
                        val directResult = withContext(Dispatchers.IO) {
                            try {
                                val gUrl = "https://www.googleapis.com/books/v1/volumes?q=isbn:$clean"
                                val req = Request.Builder().url(gUrl).build()
                                val response = RetrofitClient.okHttpClient.newCall(req).execute()
                                val jsonStr = response.body?.string() ?: ""
                                val json = JSONObject(jsonStr)
                                if (json.optInt("totalItems", 0) > 0) {
                                    val item = json.getJSONArray("items").getJSONObject(0)
                                    val vol = item.getJSONObject("volumeInfo")
                                    val title = vol.optString("title", "Unknown Title")
                                    val authorsArr = vol.optJSONArray("authors")
                                    val author = if (authorsArr != null && authorsArr.length() > 0) {
                                        val list = mutableListOf<String>()
                                        for (i in 0 until authorsArr.length()) list.add(authorsArr.getString(i))
                                        list.joinToString(", ")
                                    } else "Unknown Author"
                                    val catArr = vol.optJSONArray("categories")
                                    val category = if (catArr != null && catArr.length() > 0) catArr.getString(0) else "General"
                                    val imgLinks = vol.optJSONObject("imageLinks")
                                    val cover = imgLinks?.optString("thumbnail")?.replace("http://", "https://")

                                    LibraryBookItem(
                                        id = clean,
                                        title = title,
                                        author = author,
                                        isbn = clean,
                                        category = category,
                                        quantity = 1,
                                        availableQuantity = 1,
                                        coverUrl = cover
                                    ) to cover
                                } else null
                            } catch (_: Exception) {
                                null
                            }
                        }

                        if (directResult != null) {
                            resolvedBook = directResult.first
                            resolvedBookCoverUrl = directResult.second
                        } else {
                            bookErrorMessage = "Could not find book with ISBN $clean. Please verify the barcode."
                        }
                    }
                }
            } catch (e: Exception) {
                bookErrorMessage = "Error looking up book: ${e.message}"
            } finally {
                isSearchingBook = false
            }
        }
    }

    // ── Issue Book Action ──────────────────────────────────────────────────────
    fun executeIssue() {
        val student = resolvedStudent
        val book = resolvedBook
        if (student == null) {
            Toast.makeText(context, "Please enter a student identifier first", Toast.LENGTH_SHORT).show()
            return
        }
        if (book == null) {
            Toast.makeText(context, "Please scan or lookup a book first", Toast.LENGTH_SHORT).show()
            return
        }

        val studentIdentifier = student.admissionNumber?.ifBlank { null }
            ?: student.username?.ifBlank { null }
            ?: student.email

        val bookIdToIssue = book.id.ifBlank { book.isbn }

        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, loanDays)
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val dueDateIso = isoFormat.format(cal.time)

        isSubmittingIssue = true
        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.issueBook(
                        authHeader,
                        IssueBookRequest(
                            studentIdentifier = studentIdentifier,
                            bookId = bookIdToIssue,
                            dueDate = dueDateIso
                        )
                    )
                }
                if (res.isSuccessful) {
                    val issueId = res.body()?.get("id")?.toString() ?: "ISS-${System.currentTimeMillis() % 100000}"
                    issueSuccessReceipt = issueId
                    Toast.makeText(context, "Book issued successfully!", Toast.LENGTH_LONG).show()
                    onSuccess()
                } else {
                    val err = res.errorBody()?.string() ?: "Failed to issue book (Status: ${res.code()})"
                    Toast.makeText(context, "Error: $err", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isSubmittingIssue = false
            }
        }
    }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .imePadding()
                .then(
                    if (isDrawer) {
                        Modifier.padding(bottom = 16.dp)
                    } else {
                        Modifier
                            .navigationBarsPadding()
                            .padding(bottom = 28.dp)
                    }
                )
        ) {
            // ── Top Header / Drawer Navigation ─────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = if (isDrawer) 8.dp else 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Issue Book",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                if (!isDrawer) {
                    IconButton(
                        onClick = onClose,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // ── Main Content Container ─────────────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {

                // ── SUCCESS RECEIPT CARD ───────────────────────────────────────
                if (issueSuccessReceipt != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color(0xFF064E3B).copy(alpha = 0.12f)
                        ),
                        border = BorderStroke(1.5.dp, Color(0xFF10B981).copy(alpha = 0.4f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981).copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = Color(0xFF10B981),
                                    modifier = Modifier.size(30.dp)
                                )
                            }

                            Text(
                                "Book Issued Successfully!",
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            Text(
                                "Receipt #: $issueSuccessReceipt",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )

                            HorizontalDivider(
                                modifier = Modifier.padding(vertical = 4.dp),
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Student:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(resolvedStudent?.name ?: "Student", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Book:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(resolvedBook?.title ?: "Book", fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Loan Duration:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text("$loanDays Days", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        // Reset book, keep student
                                        resolvedBook = null
                                        scannedIsbn = ""
                                        manualIsbnInput = ""
                                        issueSuccessReceipt = null
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Issue Next Book", fontSize = 12.sp)
                                }

                                Button(
                                    onClick = {
                                        // Complete reset
                                        resolvedStudent = null
                                        resolvedBook = null
                                        studentInput = ""
                                        scannedIsbn = ""
                                        manualIsbnInput = ""
                                        issueSuccessReceipt = null
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("New Student", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }

                // ── SEARCH FIELD TO AUTO-FIND USER (NO FIND BUTTON) ─────────────
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Full-width search input matching login form design (no card border, no find student text)
                    CustomTextField(
                        value = studentInput,
                        onValueChange = {
                            studentInput = it
                            studentErrorMessage = null
                        },
                        placeholder = "search by username, email, admission number",
                            trailingIcon = if (isSearchingStudent) {
                                {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            } else if (studentInput.isNotEmpty()) {
                                {
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .clickable {
                                                studentInput = ""
                                                resolvedStudent = null
                                                studentErrorMessage = null
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.Clear,
                                            contentDescription = "Clear",
                                            modifier = Modifier.size(16.dp),
                                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                }
                            } else null,
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Error message if not found
                        if (studentErrorMessage != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f))
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    studentErrorMessage ?: "",
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 12.sp,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // ── Auto-Resolved Student Card ─────────────────────────────
                        AnimatedVisibility(
                            visible = resolvedStudent != null,
                            enter = fadeIn() + expandVertically(),
                            exit = fadeOut() + shrinkVertically()
                        ) {
                            resolvedStudent?.let { st ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surface
                                    ),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(46.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    Brush.linearGradient(
                                                        listOf(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.secondary)
                                                    )
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                st.name.take(1).uppercase(),
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 18.sp
                                            )
                                        }

                                        Column(
                                            modifier = Modifier.weight(1f),
                                            verticalArrangement = Arrangement.spacedBy(2.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(st.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1)
                                                Badge(
                                                    text = if (st.canBorrow) "Eligible" else "Limit Reached",
                                                    variant = if (st.canBorrow) BadgeVariant.SUCCESS else BadgeVariant.DESTRUCTIVE
                                                )
                                            }

                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                if (!st.admissionNumber.isNullOrBlank()) {
                                                    Text(
                                                        "Adm: ${st.admissionNumber}",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.primary,
                                                        fontWeight = FontWeight.SemiBold
                                                    )
                                                }
                                                if (!st.studentClass.isNullOrBlank()) {
                                                    Text(
                                                        "Class ${st.studentClass}${if (!st.section.isNullOrBlank()) "-${st.section}" else ""}",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                                    )
                                                }
                                            }

                                            Text(
                                                st.email.ifBlank { "@${st.username ?: ""}" },
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )

                                            Text(
                                                "Active Loans: ${st.activeLoansCount}/5" + (if (st.overdueLoansCount > 0) " • ${st.overdueLoansCount} Overdue!" else ""),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = if (st.overdueLoansCount > 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                // ── STEP 2: SCAN BOOK BARCODE (CAMERA SCANNER DIALOG) ───────────
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Book Barcode / ISBN", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                            if (resolvedBook != null) {
                                TextButton(
                                    onClick = {
                                        resolvedBook = null
                                        scannedIsbn = ""
                                        manualIsbnInput = ""
                                        bookErrorMessage = null
                                    },
                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                ) {
                                    Text("Rescan", fontSize = 12.sp)
                                }
                            }
                        }

                        if (resolvedBook == null) {
                            // Primary Scan Barcode Button
                            Button(
                                onClick = { isScannerOpen = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Icon(
                                        Icons.Default.QrCodeScanner,
                                        contentDescription = "Scan Barcode",
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        "Scan Book Barcode (ISBN)",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center
                            ) {
                                TextButton(onClick = { showManualIsbnField = !showManualIsbnField }) {
                                    Text(
                                        if (showManualIsbnField) "Hide Manual Entry" else "Or enter ISBN manually",
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            AnimatedVisibility(visible = showManualIsbnField) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    CustomTextField(
                                        value = manualIsbnInput,
                                        onValueChange = { manualIsbnInput = it },
                                        placeholder = "e.g. 9780132350884",
                                        trailingIcon = if (manualIsbnInput.isNotEmpty()) {
                                            {
                                                Box(
                                                    modifier = Modifier
                                                        .size(20.dp)
                                                        .clickable { manualIsbnInput = "" },
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        Icons.Default.Clear,
                                                        contentDescription = "Clear",
                                                        modifier = Modifier.size(16.dp),
                                                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                                    )
                                                }
                                            }
                                        } else null,
                                        modifier = Modifier.weight(1f),
                                        keyboardOptions = KeyboardOptions(
                                            keyboardType = KeyboardType.Number,
                                            imeAction = ImeAction.Search
                                        ),
                                        keyboardActions = KeyboardActions(
                                            onSearch = {
                                                focusManager.clearFocus()
                                                lookupBook(manualIsbnInput)
                                            }
                                        )
                                    )

                                    Button(
                                        onClick = { lookupBook(manualIsbnInput) },
                                        enabled = !isSearchingBook && manualIsbnInput.trim().isNotEmpty(),
                                        modifier = Modifier.height(44.dp),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text("Lookup", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }

                            if (isSearchingBook) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 10.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text("Fetching book details...", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                }
                            }

                            if (bookErrorMessage != null) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f))
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                                    Text(
                                        bookErrorMessage ?: "",
                                        color = MaterialTheme.colorScheme.error,
                                        fontSize = 12.sp,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        } else {
                            // ── Display Found Book Card ──────────────────────────
                            val bk = resolvedBook!!
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surface
                                ),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    if (!resolvedBookCoverUrl.isNullOrBlank()) {
                                        AsyncImage(
                                            model = resolvedBookCoverUrl,
                                            contentDescription = bk.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .width(52.dp)
                                                .height(74.dp)
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Color.Gray.copy(alpha = 0.2f))
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .width(52.dp)
                                                .height(74.dp)
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.AutoMirrored.Filled.MenuBook,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(26.dp)
                                            )
                                        }
                                    }

                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        Text(
                                            bk.title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )

                                        Text(
                                            "By ${bk.author}",
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )

                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                "ISBN: ${bk.isbn}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = MaterialTheme.colorScheme.primary
                                            )

                                            Badge(
                                                text = if (bk.actualAvailable > 0) "${bk.actualAvailable} Available" else "Out of Stock",
                                                variant = if (bk.actualAvailable > 0) BadgeVariant.SUCCESS else BadgeVariant.DESTRUCTIVE
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                // ── STEP 3: LOAN DURATION & CONFIRM ISSUE ──────────────────────
                if (resolvedStudent != null && resolvedBook != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text("Loan Duration", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                listOf(7 to "7 Days", 14 to "14 Days", 30 to "30 Days").forEach { (days, label) ->
                                    val isSelected = loanDays == days
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { loanDays = days },
                                        label = {
                                            Text(
                                                label,
                                                fontSize = 11.sp,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                }
                            }

                            // Due date display preview
                            val returnDateDisplay = remember(loanDays) {
                                val cal = Calendar.getInstance()
                                cal.add(Calendar.DAY_OF_YEAR, loanDays)
                                SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(cal.time)
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.DateRange, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                                    Text("Return Due Date:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                }
                                Text(returnDateDisplay, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                            }

                            Button(
                                onClick = { executeIssue() },
                                enabled = !isSubmittingIssue && (resolvedBook?.actualAvailable ?: 0) > 0,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (isSubmittingIssue) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(18.dp),
                                        color = MaterialTheme.colorScheme.onPrimary,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Issuing Book...", fontWeight = FontWeight.Bold)
                                } else {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(painter = painterResource(id = R.drawable.ic_custom_issue_book), contentDescription = null, modifier = Modifier.size(18.dp))
                                        Text("Confirm & Issue Book", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ── BARCODE SCANNER DIALOG (QR & 1D ISBN BARCODE SCANNER) ─────────────────
    if (isScannerOpen) {
        BarcodeScannerDialog(
            onDismiss = { isScannerOpen = false },
            onBarcodeScanned = { code ->
                isScannerOpen = false
                scannedIsbn = code
                manualIsbnInput = code
                lookupBook(code)
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BARCODE SCANNER DIALOG (GOOGLE ML KIT + TAP-TO-FOCUS + ZOOM CONTROLS)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun BarcodeScannerDialog(
    onDismiss: () -> Unit,
    onBarcodeScanned: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
        if (!granted) {
            Toast.makeText(context, "Camera permission is required to scan book barcodes", Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    var isTorchEnabled by remember { mutableStateOf(false) }
    var currentZoom by remember { mutableFloatStateOf(1f) }
    var cameraInstance by remember { mutableStateOf<Camera?>(null) }
    var hasHandledCode by remember { mutableStateOf(false) }

    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }
    val barcodeAnalyzer = remember {
        BookBarcodeAnalyzer { rawResult ->
            if (!hasHandledCode) {
                hasHandledCode = true
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                        vibratorManager?.defaultVibrator?.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                        vibrator?.vibrate(120)
                    }
                } catch (_: Exception) {}

                ContextCompat.getMainExecutor(context).execute {
                    onBarcodeScanned(rawResult)
                }
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            barcodeAnalyzer.close()
            cameraExecutor.shutdown()
        }
    }

    // Scanning laser line animation
    val infiniteTransition = rememberInfiniteTransition(label = "laser")
    val laserOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserOffset"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        val dialogWindow = (LocalView.current.parent as? DialogWindowProvider)?.window
        SideEffect {
            dialogWindow?.let { window ->
                window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                window.setDimAmount(0f)
                window.setBackgroundDrawableResource(android.R.color.transparent)
                WindowCompat.setDecorFitsSystemWindows(window, false)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            if (!hasCameraPermission) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        Icons.Default.CameraAlt,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Camera Permission Required",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Please grant camera access to scan ISBN barcodes from books.",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Grant Permission")
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = Color.White)
                    }
                }
            } else {
                // Live CameraX Preview with Tap-to-Focus
                AndroidView(
                    factory = { ctx ->
                        val previewView = PreviewView(ctx).apply {
                            scaleType = PreviewView.ScaleType.FILL_CENTER
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                        }

                        // Tap to focus on preview
                        previewView.setOnTouchListener { view, event ->
                            if (event.action == android.view.MotionEvent.ACTION_UP) {
                                val cam = cameraInstance
                                if (cam != null && view.width > 0 && view.height > 0) {
                                    val factory = SurfaceOrientedMeteringPointFactory(view.width.toFloat(), view.height.toFloat())
                                    val point = factory.createPoint(event.x, event.y)
                                    val action = FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF or FocusMeteringAction.FLAG_AE)
                                        .setAutoCancelDuration(3, TimeUnit.SECONDS)
                                        .build()
                                    cam.cameraControl.startFocusAndMetering(action)
                                }
                                view.performClick()
                                return@setOnTouchListener true
                            }
                            true
                        }

                        val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                        cameraProviderFuture.addListener({
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }
                            val analyzer = ImageAnalysis.Builder()
                                .setTargetResolution(Size(1280, 720))
                                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                .build()
                                .also { ia ->
                                    ia.setAnalyzer(cameraExecutor, barcodeAnalyzer)
                                }
                            try {
                                cameraProvider.unbindAll()
                                val cam = cameraProvider.bindToLifecycle(
                                    lifecycleOwner,
                                    CameraSelector.DEFAULT_BACK_CAMERA,
                                    preview,
                                    analyzer
                                )
                                cameraInstance = cam

                                // Trigger autofocus at center of frame
                                previewView.post {
                                    try {
                                        if (previewView.width > 0 && previewView.height > 0) {
                                            val factory = SurfaceOrientedMeteringPointFactory(
                                                previewView.width.toFloat(),
                                                previewView.height.toFloat()
                                            )
                                            val centerPoint = factory.createPoint(
                                                previewView.width / 2f,
                                                previewView.height / 2f
                                            )
                                            val action = FocusMeteringAction.Builder(centerPoint, FocusMeteringAction.FLAG_AF or FocusMeteringAction.FLAG_AE)
                                                .setAutoCancelDuration(3, TimeUnit.SECONDS)
                                                .build()
                                            cam.cameraControl.startFocusAndMetering(action)
                                        }
                                    } catch (_: Exception) {}
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("BarcodeScanner", "Camera binding failed: ${e.message}")
                            }
                        }, ContextCompat.getMainExecutor(ctx))
                        previewView
                    },
                    modifier = Modifier.fillMaxSize(),
                    onRelease = {
                        try {
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                            cameraProviderFuture.addListener({
                                cameraProviderFuture.get().unbindAll()
                            }, ContextCompat.getMainExecutor(context))
                        } catch (_: Exception) {}
                    }
                )

                // Dark Translucent Mask with Viewfinder Reticle
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Top Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f))
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                        }

                        Text(
                            "Scan Book Barcode",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )

                        IconButton(
                            onClick = {
                                isTorchEnabled = !isTorchEnabled
                                cameraInstance?.cameraControl?.enableTorch(isTorchEnabled)
                            },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f))
                        ) {
                            Icon(
                                if (isTorchEnabled) Icons.Default.FlashOn else Icons.Default.FlashOff,
                                contentDescription = "Toggle Torch",
                                tint = if (isTorchEnabled) Color.Yellow else Color.White
                            )
                        }
                    }

                    // Center Viewfinder Reticle Box & Zoom Controls
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(width = 300.dp, height = 180.dp)
                                .border(2.dp, Color.White, RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            // Animated Simple Horizontal Laser Line
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(2.dp)
                                        .graphicsLayer {
                                            translationY = 174.dp.toPx() * laserOffset
                                        }
                                        .background(Color.White)
                                )
                            }
                        }

                        // Zoom selector pills (1x, 1.5x, 2x)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            listOf(1.0f to "1x", 1.5f to "1.5x", 2.0f to "2x").forEach { (zoomLevel, label) ->
                                val isSelected = currentZoom == zoomLevel
                                Box(
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(
                                            if (isSelected) MaterialTheme.colorScheme.primary else Color.Black.copy(alpha = 0.65f)
                                        )
                                        .border(
                                            1.dp,
                                            if (isSelected) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.35f),
                                            CircleShape
                                        )
                                        .clickable {
                                            currentZoom = zoomLevel
                                            cameraInstance?.cameraControl?.setZoomRatio(zoomLevel)
                                        }
                                        .padding(horizontal = 14.dp, vertical = 6.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        color = if (isSelected) MaterialTheme.colorScheme.onPrimary else Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }

                    // Bottom Instruction Banner
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color.Black.copy(alpha = 0.65f))
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                "Align the book's ISBN barcode inside the box • Tap screen to focus",
                                color = Color.White,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE ML KIT + ZXING FALLBACK BARCODE ANALYZER FOR BOOKS (ISBN / EAN / QR)
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalGetImage::class)
private class BookBarcodeAnalyzer(
    private val onResult: (String) -> Unit
) : ImageAnalysis.Analyzer {

    // Configure ML Kit for standard 1D book barcodes (ISBN / EAN-13, EAN-8, UPC, Code 128, Code 39) + QR
    private val scannerOptions = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(
            Barcode.FORMAT_EAN_13,
            Barcode.FORMAT_EAN_8,
            Barcode.FORMAT_UPC_A,
            Barcode.FORMAT_UPC_E,
            Barcode.FORMAT_CODE_128,
            Barcode.FORMAT_CODE_39,
            Barcode.FORMAT_CODE_93,
            Barcode.FORMAT_ITF,
            Barcode.FORMAT_CODABAR,
            Barcode.FORMAT_QR_CODE,
            Barcode.FORMAT_DATA_MATRIX
        )
        .build()

    private val mlKitScanner = BarcodeScanning.getClient(scannerOptions)

    // Secondary ZXing fallback reader with multi-format support
    private val zxingReader = MultiFormatReader().apply {
        val formats = listOf(
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.QR_CODE
        )
        setHints(
            mapOf(
                DecodeHintType.POSSIBLE_FORMATS to formats,
                DecodeHintType.TRY_HARDER to java.lang.Boolean.TRUE
            )
        )
    }

    @Volatile
    private var isDone = false

    fun close() {
        try {
            mlKitScanner.close()
        } catch (_: Exception) {}
    }

    override fun analyze(imageProxy: androidx.camera.core.ImageProxy) {
        if (isDone) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            mlKitScanner.process(inputImage)
                .addOnSuccessListener { barcodes ->
                    if (!isDone && barcodes.isNotEmpty()) {
                        val rawValue = barcodes.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue
                        if (!rawValue.isNullOrBlank()) {
                            isDone = true
                            onResult(rawValue)
                        }
                    }
                }
                .addOnFailureListener {
                    // Fall back to next frame if ML Kit fails
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            // Stride-safe fallback for devices where mediaImage is unavailable
            try {
                val planes = imageProxy.planes
                if (planes.isNotEmpty()) {
                    val plane = planes[0]
                    val buffer = plane.buffer
                    val rowStride = plane.rowStride
                    val pixelStride = plane.pixelStride
                    val width = imageProxy.width
                    val height = imageProxy.height

                    val data = if (rowStride == width && pixelStride == 1) {
                        val bytes = ByteArray(buffer.remaining())
                        buffer.get(bytes)
                        bytes
                    } else {
                        val out = ByteArray(width * height)
                        var outOffset = 0
                        val rowBuf = ByteArray(rowStride)
                        for (r in 0 until height) {
                            buffer.position(r * rowStride)
                            if (pixelStride == 1) {
                                buffer.get(out, outOffset, width)
                                outOffset += width
                            } else {
                                buffer.get(rowBuf, 0, rowStride)
                                for (c in 0 until width) {
                                    out[outOffset++] = rowBuf[c * pixelStride]
                                }
                            }
                        }
                        out
                    }

                    val source = PlanarYUVLuminanceSource(
                        data, width, height, 0, 0, width, height, false
                    )
                    var result: Result? = null
                    try {
                        result = zxingReader.decodeWithState(BinaryBitmap(HybridBinarizer(source)))
                    } catch (_: NotFoundException) {
                        if (source.isRotateSupported) {
                            try {
                                result = zxingReader.decodeWithState(BinaryBitmap(HybridBinarizer(source.rotateCounterClockwise())))
                            } catch (_: NotFoundException) {}
                        }
                    }

                    if (result != null && result.text.isNotBlank() && !isDone) {
                        isDone = true
                        onResult(result.text)
                    }
                }
            } catch (_: Exception) {
            } finally {
                imageProxy.close()
            }
        }
    }
}
