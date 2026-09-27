package com.vidyaschool.app.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.vidyaschool.app.api.*
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.ui.shadcn.Badge
import com.vidyaschool.app.ui.shadcn.BadgeVariant
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun LibrarianScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = sessionManager.getSessionToken()
    val authHeader = remember(sessionToken) { if (!sessionToken.isNullOrEmpty()) "Bearer $sessionToken" else "" }

    // ── Main UI state ─────────────────────────────────────────────────────────
    var selectedSection by remember { mutableIntStateOf(0) } // 0: Overview, 1: Borrowings, 2: Books, 3: ISBN Tool
    val sectionTitles = listOf("Overview", "Circulation", "Catalog", "ISBN Lookup")

    // ── Data states ───────────────────────────────────────────────────────────
    var books by remember { mutableStateOf<List<LibraryBookItem>>(emptyList()) }
    var borrowings by remember { mutableStateOf<List<LibrarianBorrowingItem>>(emptyList()) }
    var isLoadingBooks by remember { mutableStateOf(false) }
    var isLoadingBorrowings by remember { mutableStateOf(false) }

    // ── Filter & Search states ───────────────────────────────────────────────
    var bookSearchQuery by remember { mutableStateOf("") }
    var bookCategoryFilter by remember { mutableStateOf("All") }
    var borrowingSearchQuery by remember { mutableStateOf("") }
    var borrowingStatusFilter by remember { mutableStateOf("all") } // all, active, overdue, returned

    // ── Dialog states ────────────────────────────────────────────────────────
    var isIssueDialogOpen by remember { mutableStateOf(false) }
    var isBookFormOpen by remember { mutableStateOf(false) }
    var editingBook by remember { mutableStateOf<LibraryBookItem?>(null) }
    var bookToDelete by remember { mutableStateOf<LibraryBookItem?>(null) }

    // ── Fetchers ─────────────────────────────────────────────────────────────
    fun fetchBooks(query: String? = null) {
        if (authHeader.isEmpty()) return
        scope.launch {
            isLoadingBooks = true
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.getLibrarianBooks(authHeader, query?.takeIf { it.isNotBlank() })
                }
                if (res.isSuccessful) {
                    books = res.body() ?: emptyList()
                } else {
                    android.util.Log.e("LibrarianScreen", "Fetch books failed: ${res.code()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("LibrarianScreen", "Error loading books: ${e.message}")
            } finally {
                isLoadingBooks = false
            }
        }
    }

    fun fetchBorrowings() {
        if (authHeader.isEmpty()) return
        scope.launch {
            isLoadingBorrowings = true
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.getLibrarianBorrowings(authHeader)
                }
                if (res.isSuccessful) {
                    borrowings = res.body() ?: emptyList()
                } else {
                    android.util.Log.e("LibrarianScreen", "Fetch borrowings failed: ${res.code()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("LibrarianScreen", "Error loading borrowings: ${e.message}")
            } finally {
                isLoadingBorrowings = false
            }
        }
    }

    fun refreshAll() {
        fetchBooks(bookSearchQuery)
        fetchBorrowings()
    }

    LaunchedEffect(authHeader) {
        if (authHeader.isNotEmpty()) {
            refreshAll()
        }
    }

    // ── Borrowing Actions (Return / Renew) ───────────────────────────────────
    fun handleBorrowingAction(borrowingId: String, action: String) {
        if (authHeader.isEmpty()) return
        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.borrowingAction(authHeader, BorrowingActionRequest(borrowingId, action))
                }
                if (res.isSuccessful) {
                    val msg = if (action == "return") "Book returned successfully!" else "Loan renewed for 14 days!"
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    refreshAll()
                } else {
                    val err = res.errorBody()?.string() ?: "Action failed"
                    Toast.makeText(context, "Error: $err", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── Computed Statistics ──────────────────────────────────────────────────
    val totalCatalogQuantity = remember(books) { books.sumOf { it.quantity } }
    val totalAvailableCopies = remember(books) { books.sumOf { it.actualAvailable } }
    val activeIssuesCount = remember(borrowings) { borrowings.count { it.status.equals("active", ignoreCase = true) } }
    val overdueIssuesCount = remember(borrowings) { borrowings.count { it.status.equals("overdue", ignoreCase = true) } }
    val uniqueBorrowersCount = remember(borrowings) { borrowings.map { it.userId }.distinct().size }

    val distinctCategories = remember(books) {
        listOf("All") + books.map { it.category }.filter { it.isNotBlank() }.distinct().sorted()
    }

    DashboardLayout(
        role = "librarian",
        provider = provider,
        email = email,
        name = name,
        avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
        themeMode = themeMode,
        onThemeChange = onThemeChange,
        onLogout = onLogout
    ) { onNotificationClick, hasUnread ->
        val scrollState = rememberScrollState()
        val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
        val headerAlpha by animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = tween(220),
            label = "headerAlpha"
        )
        val headerSlide by animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = tween(220),
            label = "headerSlide"
        )

        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(bottom = 80.dp)
            ) {
                DashboardHeader(
                    title = "Library Control",
                    subtitle = "Welcome, ${name.ifEmpty { "Librarian" }}",
                    onNotificationClick = onNotificationClick,
                    hasUnreadNotifications = hasUnread
                )

                Spacer(modifier = Modifier.height(14.dp))

                // ── Segmented Section Bar ─────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    sectionTitles.forEachIndexed { idx, title ->
                        val isSelected = selectedSection == idx
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isSelected) MaterialTheme.colorScheme.primary
                                    else Color.Transparent
                                )
                                .clickable { selectedSection = idx }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = title,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary
                                else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // ── Section Contents ──────────────────────────────────────────
                when (selectedSection) {
                    0 -> LibrarianOverviewSection(
                        totalCatalog = totalCatalogQuantity,
                        availableCopies = totalAvailableCopies,
                        activeIssues = activeIssuesCount,
                        overdueIssues = overdueIssuesCount,
                        totalMembers = uniqueBorrowersCount,
                        recentBorrowings = borrowings.take(5),
                        onOpenIssueDialog = { isIssueDialogOpen = true },
                        onOpenAddBook = {
                            editingBook = null
                            isBookFormOpen = true
                        },
                        onNavigateToCirculation = { selectedSection = 1 },
                        onNavigateToCatalog = { selectedSection = 2 },
                        onNavigateToIsbnTool = { selectedSection = 3 },
                        onBorrowingAction = ::handleBorrowingAction,
                        onRefresh = ::refreshAll
                    )

                    1 -> LibrarianBorrowingsSection(
                        borrowings = borrowings,
                        isLoading = isLoadingBorrowings,
                        searchQuery = borrowingSearchQuery,
                        onSearchChange = { borrowingSearchQuery = it },
                        statusFilter = borrowingStatusFilter,
                        onStatusFilterChange = { borrowingStatusFilter = it },
                        onOpenIssueDialog = { isIssueDialogOpen = true },
                        onBorrowingAction = ::handleBorrowingAction,
                        onRefresh = ::fetchBorrowings
                    )

                    2 -> LibrarianBooksCatalogSection(
                        books = books,
                        isLoading = isLoadingBooks,
                        searchQuery = bookSearchQuery,
                        onSearchChange = {
                            bookSearchQuery = it
                            fetchBooks(it)
                        },
                        selectedCategory = bookCategoryFilter,
                        onCategoryChange = { bookCategoryFilter = it },
                        categories = distinctCategories,
                        onOpenAddBook = {
                            editingBook = null
                            isBookFormOpen = true
                        },
                        onEditBook = { book ->
                            editingBook = book
                            isBookFormOpen = true
                        },
                        onDeleteBook = { book ->
                            bookToDelete = book
                        },
                        onRefresh = { fetchBooks(bookSearchQuery) }
                    )

                    3 -> LibrarianIsbnLookupSection(
                        authHeader = authHeader,
                        onBookAddedOrFound = {
                            refreshAll()
                        },
                        onIssueThisBook = { bookId ->
                            isIssueDialogOpen = true
                        }
                    )
                }
            }

            if (headerAlpha > 0f) {
                DashboardStickyHeader(
                    title = "Library Control",
                    headerAlpha = headerAlpha,
                    headerSlide = headerSlide,
                    onNotificationClick = onNotificationClick
                )
            }
        }
    }

    // ── Dialogs ───────────────────────────────────────────────────────────────
    if (isIssueDialogOpen) {
        IssueBookDialog(
            authHeader = authHeader,
            books = books.filter { it.actualAvailable > 0 },
            onDismiss = { isIssueDialogOpen = false },
            onSuccess = {
                isIssueDialogOpen = false
                refreshAll()
            }
        )
    }

    if (isBookFormOpen) {
        BookFormDialog(
            authHeader = authHeader,
            editingBook = editingBook,
            categories = distinctCategories.filter { it != "All" },
            onDismiss = { isBookFormOpen = false },
            onSuccess = {
                isBookFormOpen = false
                refreshAll()
            }
        )
    }

    if (bookToDelete != null) {
        val book = bookToDelete!!
        AlertDialog(
            onDismissRequest = { bookToDelete = null },
            icon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Delete Book from Catalog", fontWeight = FontWeight.Bold) },
            text = {
                Text("Are you sure you want to remove \"${book.title}\" (ISBN: ${book.isbn}) from the library catalog? This action will also invalidate cached records.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            try {
                                val res = withContext(Dispatchers.IO) {
                                    RetrofitClient.authApi.deleteBook(authHeader, DeleteBookRequest(book.id))
                                }
                                if (res.isSuccessful) {
                                    Toast.makeText(context, "Book removed from catalog", Toast.LENGTH_SHORT).show()
                                    bookToDelete = null
                                    refreshAll()
                                } else {
                                    Toast.makeText(context, "Failed to delete book", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.onError)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { bookToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW SECTION
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LibrarianOverviewSection(
    totalCatalog: Int,
    availableCopies: Int,
    activeIssues: Int,
    overdueIssues: Int,
    totalMembers: Int,
    recentBorrowings: List<LibrarianBorrowingItem>,
    onOpenIssueDialog: () -> Unit,
    onOpenAddBook: () -> Unit,
    onNavigateToCirculation: () -> Unit,
    onNavigateToCatalog: () -> Unit,
    onNavigateToIsbnTool: () -> Unit,
    onBorrowingAction: (String, String) -> Unit,
    onRefresh: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick Action Shortcuts Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = onOpenIssueDialog,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Issue Book", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }

            OutlinedButton(
                onClick = onOpenAddBook,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.LibraryAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Add Book", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        // Metrics Grid (2x2)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Total Catalog",
                    value = "$totalCatalog",
                    subtitle = "$availableCopies available",
                    icon = Icons.Default.Book,
                    accentColor = Color(0xFF3B82F6),
                    onClick = onNavigateToCatalog
                )
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Active Loans",
                    value = "$activeIssues",
                    subtitle = "Currently borrowed",
                    icon = Icons.Default.AssignmentReturn,
                    accentColor = Color(0xFF6366F1),
                    onClick = onNavigateToCirculation
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Overdue Books",
                    value = "$overdueIssues",
                    subtitle = if (overdueIssues > 0) "Immediate attention" else "All clear",
                    icon = Icons.Default.WarningAmber,
                    accentColor = if (overdueIssues > 0) Color(0xFFEF4444) else Color(0xFF10B981),
                    onClick = onNavigateToCirculation
                )
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Active Borrowers",
                    value = "$totalMembers",
                    subtitle = "Students & faculty",
                    icon = Icons.Default.PeopleOutline,
                    accentColor = Color(0xFF10B981),
                    onClick = onNavigateToCirculation
                )
            }
        }

        // Quick ISBN Auto-Lookup Banner
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onNavigateToIsbnTool() },
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f)
            ),
            border = CardDefaults.outlinedCardBorder()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    Column {
                        Text("Smart OpenLibrary Scanner", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Redis cached ISBN lookup with auto-DB persistence", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f))
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
            }
        }

        // Recent Borrowings Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
            ),
            border = CardDefaults.outlinedCardBorder()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Recent Circulation Activity", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Latest checkouts & returns", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                    TextButton(onClick = onNavigateToCirculation) {
                        Text("View All", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (recentBorrowings.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No borrowing records found", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        recentBorrowings.forEach { item ->
                            BorrowingItemCard(
                                item = item,
                                onReturn = { onBorrowingAction(item.id, "return") },
                                onRenew = { onBorrowingAction(item.id, "renew") },
                                compact = true
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CIRCULATION / BORROWINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LibrarianBorrowingsSection(
    borrowings: List<LibrarianBorrowingItem>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    statusFilter: String,
    onStatusFilterChange: (String) -> Unit,
    onOpenIssueDialog: () -> Unit,
    onBorrowingAction: (String, String) -> Unit,
    onRefresh: () -> Unit
) {
    val filteredBorrowings = remember(borrowings, searchQuery, statusFilter) {
        borrowings.filter { item ->
            val matchesStatus = when (statusFilter) {
                "active" -> item.status.equals("active", ignoreCase = true)
                "overdue" -> item.status.equals("overdue", ignoreCase = true)
                "returned" -> item.status.equals("returned", ignoreCase = true)
                else -> true
            }
            val matchesQuery = searchQuery.isBlank() ||
                    item.studentName.contains(searchQuery, ignoreCase = true) ||
                    item.bookTitle.contains(searchQuery, ignoreCase = true) ||
                    item.bookIsbn.contains(searchQuery, ignoreCase = true) ||
                    (item.studentUsername?.contains(searchQuery, ignoreCase = true) == true) ||
                    item.studentEmail.contains(searchQuery, ignoreCase = true)

            matchesStatus && matchesQuery
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Search & New Issue Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier
                    .weight(1f)
                    .height(50.dp),
                placeholder = { Text("Search by student or book...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Button(
                onClick = onOpenIssueDialog,
                modifier = Modifier.height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Issue", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        // Status Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(
                "all" to "All Loans (${borrowings.size})",
                "active" to "Active (${borrowings.count { it.status.equals("active", ignoreCase = true) }})",
                "overdue" to "Overdue (${borrowings.count { it.status.equals("overdue", ignoreCase = true) }})",
                "returned" to "Returned (${borrowings.count { it.status.equals("returned", ignoreCase = true) }})"
            ).forEach { (key, label) ->
                val isSelected = statusFilter == key
                FilterChip(
                    selected = isSelected,
                    onClick = { onStatusFilterChange(key) },
                    label = { Text(label, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                    shape = RoundedCornerShape(10.dp)
                )
            }
        }

        // List / Empty State
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 40.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.size(32.dp))
            }
        } else if (filteredBorrowings.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Inbox,
                        contentDescription = null,
                        modifier = Modifier.size(44.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("No borrowings found", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text("No records match your selected filter.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                filteredBorrowings.forEach { item ->
                    BorrowingItemCard(
                        item = item,
                        onReturn = { onBorrowingAction(item.id, "return") },
                        onRenew = { onBorrowingAction(item.id, "renew") },
                        compact = false
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BOOK CATALOG SECTION
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LibrarianBooksCatalogSection(
    books: List<LibraryBookItem>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    selectedCategory: String,
    onCategoryChange: (String) -> Unit,
    categories: List<String>,
    onOpenAddBook: () -> Unit,
    onEditBook: (LibraryBookItem) -> Unit,
    onDeleteBook: (LibraryBookItem) -> Unit,
    onRefresh: () -> Unit
) {
    val filteredBooks = remember(books, selectedCategory) {
        if (selectedCategory == "All") books
        else books.filter { it.category.equals(selectedCategory, ignoreCase = true) }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Search & Add Book Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier
                    .weight(1f)
                    .height(50.dp),
                placeholder = { Text("Search catalog by title, ISBN, author...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Button(
                onClick = onOpenAddBook,
                modifier = Modifier.height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        // Category Filter Chips
        if (categories.size > 1) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    FilterChip(
                        selected = isSelected,
                        onClick = { onCategoryChange(cat) },
                        label = { Text(cat, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }

        // Catalog List
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 40.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.size(32.dp))
            }
        } else if (filteredBooks.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Book,
                        contentDescription = null,
                        modifier = Modifier.size(44.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("No books found", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text("Try a different search term or add a new book.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                filteredBooks.forEach { book ->
                    BookCatalogItemCard(
                        book = book,
                        onEdit = { onEditBook(book) },
                        onDelete = { onDeleteBook(book) }
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SMART ISBN LOOKUP TOOL SECTION (Redis Cache + OpenLibrary Integration)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LibrarianIsbnLookupSection(
    authHeader: String,
    onBookAddedOrFound: () -> Unit,
    onIssueThisBook: (String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isbnInput by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var lookupResult by remember { mutableStateOf<BookLookupResponse?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun performLookup(isbn: String) {
        val clean = isbn.replace(Regex("[^0-9X]", RegexOption.IGNORE_CASE), "").uppercase()
        if (clean.length < 8) {
            errorMessage = "Please enter a valid 10 or 13-digit ISBN"
            return
        }
        errorMessage = null
        isSearching = true
        lookupResult = null

        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.lookupBookByIsbn(authHeader, clean)
                }
                if (res.isSuccessful) {
                    val body = res.body()
                    if (body != null && body.found) {
                        lookupResult = body
                        onBookAddedOrFound()
                        val src = when (body.source) {
                            "redis_cache" -> "Found in Redis Cache (Instant)"
                            "database" -> "Found in Library Database"
                            "openlibrary" -> "Fetched from OpenLibrary & Saved to DB"
                            else -> "Book record resolved"
                        }
                        Toast.makeText(context, src, Toast.LENGTH_SHORT).show()
                    } else {
                        errorMessage = body?.message ?: "No book found for ISBN $clean"
                    }
                } else {
                    errorMessage = "Lookup failed with HTTP code ${res.code()}"
                }
            } catch (e: Exception) {
                errorMessage = "Network error: ${e.message}"
            } finally {
                isSearching = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
            ),
            border = CardDefaults.outlinedCardBorder()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    }
                    Column {
                        Text("OpenLibrary ISBN Scanner", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("3-Layer Lookup: Redis Cache -> DB -> OpenLibrary API", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = isbnInput,
                    onValueChange = {
                        isbnInput = it
                        errorMessage = null
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Enter ISBN-10 or ISBN-13") },
                    placeholder = { Text("e.g. 9780140328721 or 9780439708180") },
                    leadingIcon = { Icon(Icons.Default.QrCode, contentDescription = null) },
                    trailingIcon = {
                        if (isbnInput.isNotEmpty()) {
                            IconButton(onClick = { isbnInput = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { performLookup(isbnInput) }),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { performLookup(isbnInput) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isSearching && isbnInput.isNotBlank()
                ) {
                    if (isSearching) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Searching Redis & OpenLibrary...")
                    } else {
                        Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Lookup & Auto-Save", fontWeight = FontWeight.SemiBold)
                    }
                }

                // Quick test suggestions
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Sample:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    listOf("9780140328721", "9780439708180").forEach { sample ->
                        SuggestionChip(
                            onClick = {
                                isbnInput = sample
                                performLookup(sample)
                            },
                            label = { Text(sample, fontSize = 10.sp) },
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }
            }
        }

        // Error Banner
        if (errorMessage != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.6f))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                    Text(errorMessage ?: "", fontSize = 12.sp, color = MaterialTheme.colorScheme.onErrorContainer)
                }
            }
        }

        // Result Card
        if (lookupResult != null && lookupResult?.book != null) {
            val book = lookupResult!!.book!!
            val sourceText = when (lookupResult?.source) {
                "redis_cache" -> "⚡ Redis Cache Hit"
                "database" -> "📚 Library Catalog DB"
                "openlibrary" -> "🌐 OpenLibrary (Auto-Saved to DB)"
                else -> "Record Found"
            }
            val sourceVariant = when (lookupResult?.source) {
                "redis_cache" -> BadgeVariant.SUCCESS
                "openlibrary" -> BadgeVariant.DEFAULT
                else -> BadgeVariant.SECONDARY
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Badge(text = sourceText, variant = sourceVariant)
                        if (lookupResult?.autoRegistered == true) {
                            Badge(text = "Auto-Persisted", variant = BadgeVariant.OUTLINE)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        val cover = lookupResult?.coverUrl ?: book.coverUrl
                        if (!cover.isNullOrEmpty()) {
                            AsyncImage(
                                model = cover,
                                contentDescription = "Book cover",
                                modifier = Modifier
                                    .width(70.dp)
                                    .height(100.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .width(70.dp)
                                    .height(100.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Book, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                            }
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(book.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("By ${book.author}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                            Text("ISBN: ${book.isbn}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Badge(text = book.category, variant = BadgeVariant.SECONDARY)
                                Badge(text = "${book.actualAvailable}/${book.quantity} Available", variant = if (book.actualAvailable > 0) BadgeVariant.SUCCESS else BadgeVariant.DESTRUCTIVE)
                            }
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Shelf: ${book.location ?: "Main Library"}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )

                        Button(
                            onClick = { onIssueThisBook(book.id) },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Issue Book", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE CARDS & COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun MetricKpiCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        ),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title.uppercase(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    letterSpacing = 0.8.sp
                )
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(16.dp))
                }
            }

            Text(
                text = value,
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = subtitle,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun BorrowingItemCard(
    item: LibrarianBorrowingItem,
    onReturn: () -> Unit,
    onRenew: () -> Unit,
    compact: Boolean = false
) {
    val isOverdue = item.status.equals("overdue", ignoreCase = true)
    val isReturned = item.status.equals("returned", ignoreCase = true)
    val isActive = item.status.equals("active", ignoreCase = true)

    val badgeVariant = when {
        isReturned -> BadgeVariant.SUCCESS
        isOverdue -> BadgeVariant.DESTRUCTIVE
        else -> BadgeVariant.DEFAULT
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isOverdue) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.15f)
            else MaterialTheme.colorScheme.surface
        ),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.bookTitle,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Borrower: ${item.studentName}" +
                                (item.studentClass?.let { " • Class $it" } ?: "") +
                                (item.studentSection?.let { "-$it" } ?: ""),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                    )
                }
                Badge(text = item.status.uppercase(), variant = badgeVariant)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Due: ${formatDateString(item.dueDate)}",
                        fontSize = 11.sp,
                        fontWeight = if (isOverdue) FontWeight.Bold else FontWeight.Normal,
                        color = if (isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    if (item.renewalsCount > 0) {
                        Text(
                            text = "Renewed: ${item.renewalsCount}/3 times",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                if (!isReturned) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (isActive && item.renewalsCount < 3) {
                            OutlinedButton(
                                onClick = onRenew,
                                modifier = Modifier.height(32.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Renew", fontSize = 11.sp)
                            }
                        }

                        Button(
                            onClick = onReturn,
                            modifier = Modifier.height(32.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("Return", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BookCatalogItemCard(
    book: LibraryBookItem,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MenuBook,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(book.title, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("By ${book.author}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), maxLines = 1)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("ISBN: ${book.isbn}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text("•", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                    Text(book.location ?: "Shelf A", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
                Spacer(modifier = Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Badge(text = book.category, variant = BadgeVariant.SECONDARY)
                    Badge(
                        text = "${book.actualAvailable}/${book.quantity} copies",
                        variant = if (book.actualAvailable > 0) BadgeVariant.SUCCESS else BadgeVariant.DESTRUCTIVE
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOG: ISSUE BOOK (with Smart Borrower Resolver)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun IssueBookDialog(
    authHeader: String,
    books: List<LibraryBookItem>,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var studentIdentifier by remember { mutableStateOf("") }
    var isResolvingUser by remember { mutableStateOf(false) }
    var resolvedUser by remember { mutableStateOf<ResolvedBorrowerUser?>(null) }
    var resolveError by remember { mutableStateOf<String?>(null) }

    var selectedBookId by remember { mutableStateOf(books.firstOrNull()?.id ?: "") }
    var customIsbnInput by remember { mutableStateOf("") }
    var isUsingCustomIsbn by remember { mutableStateOf(books.isEmpty()) }
    var loanDays by remember { mutableIntStateOf(14) }
    var isSubmitting by remember { mutableStateOf(false) }

    // Debounced student resolver
    LaunchedEffect(studentIdentifier) {
        val clean = studentIdentifier.trim()
        if (clean.length < 2) {
            resolvedUser = null
            resolveError = null
            return@LaunchedEffect
        }
        delay(400)
        isResolvingUser = true
        resolveError = null
        try {
            val res = withContext(Dispatchers.IO) {
                RetrofitClient.authApi.resolveBorrower(authHeader, clean)
            }
            if (res.isSuccessful && res.body()?.found == true) {
                resolvedUser = res.body()?.user
            } else {
                resolvedUser = null
                resolveError = "No borrower found with this identifier"
            }
        } catch (e: Exception) {
            resolveError = e.message
        } finally {
            isResolvingUser = false
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Issue Library Book", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(18.dp))
                    }
                }

                // 1. Student Identifier Field
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("1. Borrower Identifier", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = studentIdentifier,
                        onValueChange = { studentIdentifier = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Admission #, username, or email", fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.PersonSearch, contentDescription = null) },
                        trailingIcon = {
                            if (isResolvingUser) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Borrower Resolved Card / Warning
                if (resolvedUser != null) {
                    val u = resolvedUser!!
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (u.canBorrow) MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
                            else MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(u.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Badge(
                                    text = if (u.canBorrow) "Eligible" else "Quota Full / Overdue",
                                    variant = if (u.canBorrow) BadgeVariant.SUCCESS else BadgeVariant.DESTRUCTIVE
                                )
                            }
                            Text(
                                "Role: ${u.role} • Active Loans: ${u.activeLoansCount}/5" +
                                        (if (u.overdueLoansCount > 0) " • ${u.overdueLoansCount} Overdue!" else ""),
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                } else if (resolveError != null) {
                    Text(resolveError ?: "", fontSize = 11.sp, color = MaterialTheme.colorScheme.error)
                }

                // 2. Book Selection
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("2. Select Book", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        TextButton(
                            onClick = { isUsingCustomIsbn = !isUsingCustomIsbn },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(if (isUsingCustomIsbn) "Pick Catalog" else "Enter ISBN", fontSize = 11.sp)
                        }
                    }

                    if (isUsingCustomIsbn || books.isEmpty()) {
                        OutlinedTextField(
                            value = customIsbnInput,
                            onValueChange = { customIsbnInput = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Enter Book ISBN or ID", fontSize = 12.sp) },
                            leadingIcon = { Icon(Icons.Default.QrCode, contentDescription = null) },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    } else {
                        // Dropdown selection of available books
                        var expanded by remember { mutableStateOf(false) }
                        val currentBook = books.find { it.id == selectedBookId } ?: books.firstOrNull()

                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedCard(
                                onClick = { expanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(currentBook?.title ?: "Select a book", fontWeight = FontWeight.Medium, fontSize = 13.sp, maxLines = 1)
                                        Text("${currentBook?.actualAvailable ?: 0} copies in stock", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                    }
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                }
                            }

                            DropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false },
                                modifier = Modifier.fillMaxWidth(0.75f)
                            ) {
                                books.forEach { bk ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(bk.title, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                                Text("ISBN: ${bk.isbn} • ${bk.actualAvailable} available", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                            }
                                        },
                                        onClick = {
                                            selectedBookId = bk.id
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                // 3. Due Date Duration Selector
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("3. Loan Duration", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(7 to "7 Days", 14 to "14 Days", 30 to "30 Days").forEach { (days, label) ->
                            val isSelected = loanDays == days
                            FilterChip(
                                selected = isSelected,
                                onClick = { loanDays = days },
                                label = { Text(label, fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Submit Button
                Button(
                    onClick = {
                        val bookIdToIssue = if (isUsingCustomIsbn) customIsbnInput.trim() else selectedBookId
                        if (studentIdentifier.isBlank()) {
                            Toast.makeText(context, "Please enter student identifier", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (bookIdToIssue.isBlank()) {
                            Toast.makeText(context, "Please select or enter a book", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        // Compute dueDate ISO
                        val cal = Calendar.getInstance()
                        cal.add(Calendar.DAY_OF_YEAR, loanDays)
                        val isoFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
                        val dueDateIso = isoFormatter.format(cal.time)

                        isSubmitting = true
                        scope.launch {
                            try {
                                val res = withContext(Dispatchers.IO) {
                                    RetrofitClient.authApi.issueBook(
                                        authHeader,
                                        IssueBookRequest(
                                            studentIdentifier = studentIdentifier.trim(),
                                            bookId = bookIdToIssue,
                                            dueDate = dueDateIso
                                        )
                                    )
                                }
                                if (res.isSuccessful) {
                                    Toast.makeText(context, "Book issued successfully!", Toast.LENGTH_SHORT).show()
                                    onSuccess()
                                } else {
                                    val err = res.errorBody()?.string() ?: "Failed to issue book"
                                    Toast.makeText(context, "Error: $err", Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isSubmitting
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                    } else {
                        Text("Confirm & Issue Book", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOG: ADD / EDIT BOOK (with OpenLibrary ISBN Auto-Population)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun BookFormDialog(
    authHeader: String,
    editingBook: LibraryBookItem?,
    categories: List<String>,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val isEdit = editingBook != null

    var title by remember { mutableStateOf(editingBook?.title ?: "") }
    var author by remember { mutableStateOf(editingBook?.author ?: "") }
    var isbn by remember { mutableStateOf(editingBook?.isbn ?: "") }
    var category by remember { mutableStateOf(editingBook?.category ?: "General") }
    var quantity by remember { mutableStateOf(editingBook?.quantity?.toString() ?: "1") }
    var location by remember { mutableStateOf(editingBook?.location ?: "Main Library") }

    var isLookingUpIsbn by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }

    fun lookupAndAutofill(targetIsbn: String) {
        val clean = targetIsbn.replace(Regex("[^0-9X]", RegexOption.IGNORE_CASE), "").uppercase()
        if (clean.length < 8) {
            Toast.makeText(context, "Enter a valid 10/13-digit ISBN first", Toast.LENGTH_SHORT).show()
            return
        }
        isLookingUpIsbn = true
        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.lookupBookByIsbn(authHeader, clean)
                }
                if (res.isSuccessful && res.body()?.found == true) {
                    val b = res.body()?.book
                    if (b != null) {
                        title = b.title
                        author = b.author
                        category = b.category
                        Toast.makeText(context, "Autofilled from OpenLibrary / Cache!", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(context, "No match found for this ISBN", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Autofill error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLookingUpIsbn = false
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(if (isEdit) "Edit Book Details" else "Add New Book", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(18.dp))
                    }
                }

                // ISBN field with instant OpenLibrary Autofill button
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("ISBN Code", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = isbn,
                            onValueChange = { isbn = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("e.g. 9780140328721", fontSize = 12.sp) },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                        Button(
                            onClick = { lookupAndAutofill(isbn) },
                            modifier = Modifier.height(52.dp),
                            shape = RoundedCornerShape(10.dp),
                            enabled = !isLookingUpIsbn && isbn.isNotBlank()
                        ) {
                            if (isLookingUpIsbn) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                            } else {
                                Text("Autofill", fontSize = 11.sp)
                            }
                        }
                    }
                }

                // Title
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Book Title", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Book title", fontSize = 12.sp) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Author
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Author(s)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = author,
                        onValueChange = { author = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Author name", fontSize = 12.sp) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Category & Quantity Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Category", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        OutlinedTextField(
                            value = category,
                            onValueChange = { category = it },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Quantity", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        OutlinedTextField(
                            value = quantity,
                            onValueChange = { quantity = it },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                }

                // Shelf Location
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Shelf / Storage Location", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = location,
                        onValueChange = { location = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g. Shelf B-4, Floor 2", fontSize = 12.sp) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Submit Button
                Button(
                    onClick = {
                        val qtyInt = quantity.toIntOrNull() ?: 1
                        if (title.isBlank() || author.isBlank() || isbn.isBlank()) {
                            Toast.makeText(context, "Please fill in title, author, and ISBN", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        isSaving = true
                        scope.launch {
                            try {
                                val res = withContext(Dispatchers.IO) {
                                    if (isEdit) {
                                        RetrofitClient.authApi.updateBook(
                                            authHeader,
                                            UpdateBookRequest(
                                                id = editingBook!!.id,
                                                title = title.trim(),
                                                author = author.trim(),
                                                isbn = isbn.trim(),
                                                category = category.trim(),
                                                quantity = qtyInt,
                                                location = location.trim().takeIf { it.isNotBlank() }
                                            )
                                        )
                                    } else {
                                        RetrofitClient.authApi.createBook(
                                            authHeader,
                                            CreateBookRequest(
                                                title = title.trim(),
                                                author = author.trim(),
                                                isbn = isbn.trim(),
                                                category = category.trim(),
                                                quantity = qtyInt,
                                                location = location.trim().takeIf { it.isNotBlank() }
                                            )
                                        )
                                    }
                                }

                                if (res.isSuccessful) {
                                    Toast.makeText(context, if (isEdit) "Book updated!" else "Book added to catalog!", Toast.LENGTH_SHORT).show()
                                    onSuccess()
                                } else {
                                    val err = res.errorBody()?.string() ?: "Failed to save book"
                                    Toast.makeText(context, "Error: $err", Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isSaving = false
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                    } else {
                        Text(if (isEdit) "Update Book Record" else "Save to Catalog", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE FORMATTING HELPER
// ─────────────────────────────────────────────────────────────────────────────
private fun formatDateString(rawIso: String?): String {
    if (rawIso.isNullOrBlank()) return "N/A"
    return try {
        val clean = rawIso.replace("Z", "").split(".")[0]
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        val date = parser.parse(clean)
        val formatter = SimpleDateFormat("MMM d, yyyy", Locale.US)
        if (date != null) formatter.format(date) else rawIso.take(10)
    } catch (e: Exception) {
        rawIso.take(10)
    }
}
