package com.vidyaschool.app.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.ui.graphics.graphicsLayer
import kotlinx.coroutines.Job
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import kotlin.math.abs
import com.vidyaschool.app.ui.components.CustomTextField
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import com.vidyaschool.app.ui.theme.isAppDark
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.ScrollState
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
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

// ── In-Memory Cache for Instant 0ms Loading & Offline Performance ───────
internal object LibrarianDataCache {
    var cachedBooks: List<LibraryBookItem> = emptyList()
    var cachedBorrowings: List<LibrarianBorrowingItem> = emptyList()
    var lastFetchTime: Long = 0L
    private const val CACHE_TTL_MS = 120_000L // 2 minutes warm cache

    fun isCacheValid(): Boolean =
        cachedBooks.isNotEmpty() && (System.currentTimeMillis() - lastFetchTime < CACHE_TTL_MS)

    fun updateBooks(newBooks: List<LibraryBookItem>) {
        cachedBooks = newBooks
        lastFetchTime = System.currentTimeMillis()
    }

    fun updateBorrowings(newBorrowings: List<LibrarianBorrowingItem>) {
        cachedBorrowings = newBorrowings
        lastFetchTime = System.currentTimeMillis()
    }
}

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
    var selectedSection by remember { mutableIntStateOf(0) } // 0: Overview, 1: Borrowings, 2: ISBN Tool
    val sectionTitles = listOf("Overview", "Circulation", "ISBN Lookup")

    // ── Data states (Instant 0ms UI with Cache) ──────────────────────────────
    var books by remember { mutableStateOf(LibrarianDataCache.cachedBooks) }
    var borrowings by remember { mutableStateOf(LibrarianDataCache.cachedBorrowings) }
    var isLoadingBooks by remember { mutableStateOf(LibrarianDataCache.cachedBooks.isEmpty()) }
    var isLoadingBorrowings by remember { mutableStateOf(LibrarianDataCache.cachedBorrowings.isEmpty()) }

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
    fun fetchBooks(query: String? = null, isBackground: Boolean = false) {
        if (authHeader.isEmpty()) return
        scope.launch {
            if (!isBackground && books.isEmpty()) {
                isLoadingBooks = true
            }
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.getLibrarianBooks(authHeader, query?.takeIf { it.isNotBlank() })
                }
                if (res.isSuccessful) {
                    val newBooks = res.body() ?: emptyList()
                    books = newBooks
                    LibrarianDataCache.updateBooks(newBooks)
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

    fun fetchBorrowings(isBackground: Boolean = false) {
        if (authHeader.isEmpty()) return
        scope.launch {
            if (!isBackground && borrowings.isEmpty()) {
                isLoadingBorrowings = true
            }
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.getLibrarianBorrowings(authHeader)
                }
                if (res.isSuccessful) {
                    val newBorrowings = res.body() ?: emptyList()
                    borrowings = newBorrowings
                    LibrarianDataCache.updateBorrowings(newBorrowings)
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

    fun refreshAll(isBackground: Boolean = false) {
        fetchBooks(bookSearchQuery, isBackground)
        fetchBorrowings(isBackground)
    }

    LaunchedEffect(authHeader) {
        if (authHeader.isNotEmpty()) {
            if (LibrarianDataCache.isCacheValid()) {
                refreshAll(isBackground = true)
            } else {
                refreshAll(isBackground = false)
            }
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
        onLogout = onLogout,
        booksContent = { onNotifClick, hasUnreadNotif ->
            LibrarianBooksScreen(
                books = books,
                isLoading = isLoadingBooks,
                searchQuery = bookSearchQuery,
                onSearchChange = {
                    bookSearchQuery = it
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
                onRefresh = ::refreshAll,
                onNotificationClick = onNotifClick,
                hasUnreadNotifications = hasUnreadNotif
            )
        }
    ) { onNotificationClick, hasUnread ->
        val tabSwitcher = LocalTabSwitcher.current
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

        Box(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
        ) {
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

                Spacer(modifier = Modifier.height(10.dp))

                // ── Segmented Section Bar with Shifting Pill Background ───────
                val isDark = isAppDark()

                // Tight padding & compact sizing
                val tabSpacing = 3.dp
                val containerPadding = 3.dp
                val containerShape = RoundedCornerShape(12.dp)
                val pillShape = RoundedCornerShape(9.dp)
                val tabHeight = 36.dp

                // Colors: Gray shared container & black shifting button pill
                val containerBg = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
                val pillBg = Color(0xFF000000)

                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .clip(containerShape)
                        .background(containerBg)
                        .padding(containerPadding)
                ) {
                    val tabCount = sectionTitles.size
                    val totalAvailableWidth = maxWidth
                    val tabWidth = (totalAvailableWidth - (tabSpacing * (tabCount - 1))) / tabCount

                    val indicatorOffset by animateDpAsState(
                        targetValue = (tabWidth + tabSpacing) * selectedSection,
                        animationSpec = spring(
                            dampingRatio = 0.8f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        label = "tabIndicatorOffset"
                    )

                    // 1. Black Shifting Pill Background
                    Box(
                        modifier = Modifier
                            .offset(x = indicatorOffset)
                            .width(tabWidth)
                            .height(tabHeight)
                            .shadow(elevation = 2.dp, shape = pillShape)
                            .background(pillBg, pillShape)
                    )

                    // 2. Interactive Tab Buttons on Top
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(tabHeight),
                        horizontalArrangement = Arrangement.spacedBy(tabSpacing),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        sectionTitles.forEachIndexed { idx, title ->
                            val isSelected = selectedSection == idx
                            val targetTextColor = if (isSelected) {
                                Color.White
                            } else {
                                if (isDark) Color.White.copy(alpha = 0.6f) else Color(0xFF71717A)
                            }
                            val textColor by animateColorAsState(
                                targetValue = targetTextColor,
                                animationSpec = tween(180),
                                label = "tabTextColor_$idx"
                            )

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(pillShape)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) {
                                        selectedSection = idx
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.5.dp)
                                ) {
                                    val iconRes = when (idx) {
                                        0 -> R.drawable.ic_custom_overview
                                        1 -> R.drawable.ic_custom_circulation
                                        2 -> R.drawable.ic_custom_isbn
                                        else -> null
                                    }
                                    if (iconRes != null) {
                                        Icon(
                                            painter = painterResource(id = iconRes),
                                            contentDescription = null,
                                            tint = textColor,
                                            modifier = Modifier.size(13.dp)
                                        )
                                    }
                                    Text(
                                        text = title,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = textColor,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

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
                        onNavigateToCatalog = { tabSwitcher?.invoke("books") },
                        onNavigateToIsbnTool = { selectedSection = 2 },
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

                    2 -> LibrarianIsbnLookupSection(
                        authHeader = authHeader,
                        scrollState = scrollState,
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
        LibrarianIssueBookDrawer(
            sessionManager = sessionManager,
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
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Metrics Grid (2x2)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Total Catalog",
                    value = "$totalCatalog",
                    iconRes = R.drawable.ic_custom_books,
                    accentColor = Color(0xFF3B82F6),
                    onClick = onNavigateToCatalog
                )
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Active Loans",
                    value = "$activeIssues",
                    iconRes = R.drawable.ic_custom_active_loans,
                    accentColor = Color(0xFF6366F1),
                    onClick = onNavigateToCirculation
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Overdue Books",
                    value = "$overdueIssues",
                    iconRes = R.drawable.ic_custom_overdue,
                    accentColor = Color(0xFFEF4444),
                    onClick = onNavigateToCirculation
                )
                MetricKpiCard(
                    modifier = Modifier.weight(1f),
                    title = "Active Borrowers",
                    value = "$totalMembers",
                    iconRes = R.drawable.ic_custom_active_borrowers,
                    accentColor = Color(0xFF10B981),
                    onClick = onNavigateToCirculation
                )
            }
        }

        // Recent Borrowings Section (List table width: screen width with slight margin from x)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
            ),
            border = null
        ) {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 14.dp)) {
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

                RecentCirculationList(
                    recentBorrowings = recentBorrowings,
                    onItemClick = onNavigateToCirculation
                )
            }
        }
    }
}

@Composable
private fun RecentCirculationList(
    recentBorrowings: List<LibrarianBorrowingItem>,
    onItemClick: () -> Unit
) {
    val isDark = isAppDark()
    val grayColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
    val dividerColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)

    if (recentBorrowings.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No recent circulation records",
                fontSize = 12.sp,
                color = grayColor
            )
        }
    } else {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            recentBorrowings.forEachIndexed { index, item ->
                key(item.id) {
                    val isReturned = item.status.equals("returned", ignoreCase = true)
                    val isOverdue = item.status.equals("overdue", ignoreCase = true)

                    val (overviewBg, overviewTint, overviewIcon) = when {
                        isReturned -> Triple(
                            Color(0xFF10B981).copy(alpha = 0.12f),
                            Color(0xFF10B981),
                            R.drawable.ic_custom_check_circle
                        )
                        isOverdue -> Triple(
                            Color(0xFFEF4444).copy(alpha = 0.12f),
                            Color(0xFFEF4444),
                            R.drawable.ic_custom_overdue
                        )
                        else -> Triple(
                            if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7),
                            if (isDark) Color(0xFFE4E4E7) else Color(0xFF52525B),
                            R.drawable.ic_custom_books
                        )
                    }

                    val studentDetail = item.studentName.ifBlank { "Student" }
                    val classParts = listOfNotNull(
                        item.studentClass?.takeIf { it.isNotBlank() },
                        item.studentSection?.takeIf { it.isNotBlank() }
                    ).joinToString("-")

                    val dueDateText = formatTableDate(item.dueDate)

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onItemClick() }
                            .padding(vertical = 8.dp, horizontal = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Left side squircle status icon
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(9.dp))
                                .background(overviewBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = overviewIcon),
                                contentDescription = null,
                                tint = overviewTint,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Right side content
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            // Top row: Book title and status badge
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = item.bookTitle.ifBlank { "Untitled Book" },
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier
                                        .weight(1f, fill = false)
                                        .padding(end = 6.dp)
                                )

                                if (isOverdue) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Color(0xFFEF4444).copy(alpha = 0.12f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "Overdue",
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFFEF4444)
                                        )
                                    }
                                } else if (isReturned) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Color(0xFF10B981).copy(alpha = 0.12f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "Returned",
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFF10B981)
                                        )
                                    }
                                } else {
                                    Text(
                                        text = "Due $dueDateText",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Normal,
                                        color = grayColor
                                    )
                                }
                            }

                            // Bottom row: student name & class
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = studentDetail,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Normal,
                                    color = grayColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                if (classParts.isNotBlank()) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7))
                                            .padding(horizontal = 4.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = classParts,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (index < recentBorrowings.lastIndex) {
                        HorizontalDivider(
                            thickness = 0.8.dp,
                            color = dividerColor.copy(alpha = 0.6f),
                            modifier = Modifier.padding(start = 50.dp)
                        )
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

    val isDark = isAppDark()
    val dividerColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Search Input (Full Width with 14.dp margin, Round Full)
        Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp)) {
            CustomTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                placeholder = "Search by student or book...",
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (isDark) Color(0xFF1C1C20) else Color(0xFFF4F4F6), CircleShape),
                shape = CircleShape,
                leadingIcon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_custom_search),
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear",
                            modifier = Modifier
                                .size(18.dp)
                                .clickable { onSearchChange("") },
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            )
        }

        // Status Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp)
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val chipSelectedBg = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
            val chipSelectedBorder = if (isDark) Color(0xFF3F3F46) else Color(0xFFD4D4D8)
            val chipUnselectedBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)

            listOf(
                Triple("all", "All Loans", borrowings.size),
                Triple("active", "Active", borrowings.count { it.status.equals("active", ignoreCase = true) }),
                Triple("overdue", "Overdue", borrowings.count { it.status.equals("overdue", ignoreCase = true) }),
                Triple("returned", "Returned", borrowings.count { it.status.equals("returned", ignoreCase = true) })
            ).forEach { (key, title, count) ->
                val isSelected = statusFilter == key
                val circleBg = if (isSelected) {
                    if (isDark) Color(0xFF18181B) else Color.White
                } else {
                    if (isDark) Color(0xFF27272A) else Color(0xFFF4F4F5)
                }
                val circleTextColor = if (isSelected) {
                    if (isDark) Color.White else Color(0xFF18181B)
                } else {
                    if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
                }

                FilterChip(
                    selected = isSelected,
                    onClick = { onStatusFilterChange(key) },
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = Color.Transparent,
                        labelColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A),
                        selectedContainerColor = chipSelectedBg,
                        selectedLabelColor = if (isDark) Color.White else Color(0xFF18181B)
                    ),
                    border = BorderStroke(1.dp, if (isSelected) chipSelectedBorder else chipUnselectedBorder),
                    label = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = title,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                            Box(
                                modifier = Modifier
                                    .height(20.dp)
                                    .defaultMinSize(minWidth = 20.dp)
                                    .clip(CircleShape)
                                    .background(circleBg)
                                    .padding(horizontal = 5.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = count.toString(),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = circleTextColor,
                                    textAlign = TextAlign.Center,
                                    lineHeight = 11.sp
                                )
                            }
                        }
                    },
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
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                ),
                border = null
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
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ),
                border = null
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    filteredBorrowings.forEachIndexed { index, item ->
                        key(item.id) {
                            BorrowingItemCard(
                                item = item,
                                onReturn = { onBorrowingAction(item.id, "return") },
                                onRenew = { onBorrowingAction(item.id, "renew") }
                            )

                            if (index < filteredBorrowings.lastIndex) {
                                HorizontalDivider(
                                    thickness = 0.8.dp,
                                    color = dividerColor.copy(alpha = 0.6f),
                                    modifier = Modifier.padding(start = 54.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BOOKS SCREEN (ACCESSED FROM BOTTOM BAR)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun LibrarianBooksScreen(
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
    onRefresh: () -> Unit,
    onNotificationClick: () -> Unit = {},
    hasUnreadNotifications: Boolean = false
) {
    val scrollState = rememberScrollState()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = tween(220),
        label = "booksHeaderAlpha"
    )
    val headerSlide by animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = tween(220),
        label = "booksHeaderSlide"
    )

    val isDark = isAppDark()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .statusBarsPadding()
                .padding(bottom = 80.dp)
        ) {
            DashboardHeader(
                title = "Books",
                subtitle = "${books.size} books in library catalog",
                onNotificationClick = onNotificationClick,
                hasUnreadNotifications = hasUnreadNotifications
            )

            Spacer(modifier = Modifier.height(14.dp))

            LibrarianBooksCatalogSection(
                books = books,
                isLoading = isLoading,
                searchQuery = searchQuery,
                onSearchChange = onSearchChange,
                selectedCategory = selectedCategory,
                onCategoryChange = onCategoryChange,
                categories = categories,
                onOpenAddBook = onOpenAddBook,
                onEditBook = onEditBook,
                onDeleteBook = onDeleteBook,
                onRefresh = onRefresh
            )
        }

        // Fixed Add Book Button at Bottom Right (Just above the bottom bar)
        FloatingActionButton(
            onClick = onOpenAddBook,
            shape = CircleShape,
            containerColor = if (isDark) Color(0xFFFAFAFA) else Color(0xFF18181B),
            contentColor = if (isDark) Color(0xFF18181B) else Color.White,
            elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 6.dp),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 16.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 0.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Book",
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "Add Book",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        if (headerAlpha > 0f) {
            DashboardStickyHeader(
                title = "Books",
                headerAlpha = headerAlpha,
                headerSlide = headerSlide,
                onNotificationClick = onNotificationClick
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK CATALOG COMPONENT
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
    val filteredBooks = remember(books, selectedCategory, searchQuery) {
        books.filter { book ->
            val matchesCategory = if (selectedCategory == "All") true
            else book.category.equals(selectedCategory, ignoreCase = true)

            val matchesQuery = searchQuery.isBlank() ||
                    book.title.contains(searchQuery, ignoreCase = true) ||
                    book.author.contains(searchQuery, ignoreCase = true) ||
                    book.isbn.contains(searchQuery, ignoreCase = true) ||
                    (book.location?.contains(searchQuery, ignoreCase = true) == true)

            matchesCategory && matchesQuery
        }
    }

    val isDark = isAppDark()
    val dividerColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Search Input (Full Width with 14.dp margin, Round Full)
        Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp)) {
            CustomTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                placeholder = "Search catalog by title, author, ISBN...",
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (isDark) Color(0xFF1C1C20) else Color(0xFFF4F4F6), CircleShape),
                shape = CircleShape,
                leadingIcon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_custom_search),
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear",
                            modifier = Modifier
                                .size(18.dp)
                                .clickable { onSearchChange("") },
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            )
        }

        // Category Filter Chips (Same styling as circulation tab)
        if (categories.size > 1) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val chipSelectedBg = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
                val chipSelectedBorder = if (isDark) Color(0xFF3F3F46) else Color(0xFFD4D4D8)
                val chipUnselectedBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)

                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    val count = if (cat == "All") books.size else books.count { it.category.equals(cat, ignoreCase = true) }

                    val circleBg = if (isSelected) {
                        if (isDark) Color(0xFF18181B) else Color.White
                    } else {
                        if (isDark) Color(0xFF27272A) else Color(0xFFF4F4F5)
                    }
                    val circleTextColor = if (isSelected) {
                        if (isDark) Color.White else Color(0xFF18181B)
                    } else {
                        if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
                    }

                    FilterChip(
                        selected = isSelected,
                        onClick = { onCategoryChange(cat) },
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = Color.Transparent,
                            labelColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A),
                            selectedContainerColor = chipSelectedBg,
                            selectedLabelColor = if (isDark) Color.White else Color(0xFF18181B)
                        ),
                        border = BorderStroke(1.dp, if (isSelected) chipSelectedBorder else chipUnselectedBorder),
                        label = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = cat,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                                Box(
                                    modifier = Modifier
                                        .height(20.dp)
                                        .defaultMinSize(minWidth = 20.dp)
                                        .clip(CircleShape)
                                        .background(circleBg)
                                        .padding(horizontal = 5.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = count.toString(),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = circleTextColor,
                                        textAlign = TextAlign.Center,
                                        lineHeight = 11.sp
                                    )
                                }
                            }
                        },
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }

        // Catalog List / Empty State (Same table card container as circulation table)
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
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                ),
                border = null
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
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ),
                border = null
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    filteredBooks.forEachIndexed { index, book ->
                        key(book.id) {
                            BookCatalogItemCard(
                                book = book,
                                onEdit = { onEditBook(book) },
                                onDelete = { onDeleteBook(book) }
                            )

                            if (index < filteredBooks.lastIndex) {
                                HorizontalDivider(
                                    thickness = 0.8.dp,
                                    color = dividerColor.copy(alpha = 0.6f),
                                    modifier = Modifier.padding(start = 42.dp)
                                )
                            }
                        }
                    }
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
    scrollState: ScrollState,
    onBookAddedOrFound: () -> Unit,
    onIssueThisBook: (String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isbnInput by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var lookupResult by remember { mutableStateOf<BookLookupResponse?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isScannerOpen by remember { mutableStateOf(false) }
    var showManualIsbnField by remember { mutableStateOf(false) }

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

    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val targetMinHeight = if (showManualIsbnField) 0.dp else (screenHeight - 240.dp).coerceAtLeast(340.dp)
    val minCenterHeight by animateDpAsState(
        targetValue = targetMinHeight,
        animationSpec = tween(280),
        label = "minCenterHeight"
    )
    val topPadding by animateDpAsState(
        targetValue = if (showManualIsbnField) 16.dp else 0.dp,
        animationSpec = tween(280),
        label = "topPadding"
    )
    val contentAlignment = if (showManualIsbnField) Alignment.TopCenter else Alignment.Center

    LaunchedEffect(showManualIsbnField) {
        if (showManualIsbnField) {
            delay(100)
            scrollState.animateScrollTo(0)
        }
    }

    if (lookupResult == null) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = minCenterHeight)
                .padding(horizontal = 24.dp)
                .padding(top = topPadding),
            contentAlignment = contentAlignment
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 320.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Primary Scan Barcode Button (same as used in issue book drawer)
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
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = "Scan Barcode",
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = "Scan Book Barcode (ISBN)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Enter ISBN Manually Button
                TextButton(onClick = { showManualIsbnField = !showManualIsbnField }) {
                    Text(
                        text = if (showManualIsbnField) "Hide Manual Entry" else "Or enter ISBN manually",
                        fontSize = 12.sp
                    )
                }

                AnimatedVisibility(visible = showManualIsbnField) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CustomTextField(
                                value = isbnInput,
                                onValueChange = {
                                    isbnInput = it
                                    errorMessage = null
                                },
                                placeholder = "e.g. 9780132350884",
                                trailingIcon = if (isbnInput.isNotEmpty()) {
                                    {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "Clear",
                                            modifier = Modifier
                                                .size(18.dp)
                                                .clickable { isbnInput = "" },
                                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                } else null,
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Number,
                                    imeAction = ImeAction.Search
                                ),
                                keyboardActions = KeyboardActions(
                                    onSearch = { performLookup(isbnInput) }
                                )
                            )

                            Button(
                                onClick = { performLookup(isbnInput) },
                                enabled = !isSearching && isbnInput.trim().isNotEmpty(),
                                modifier = Modifier.height(44.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Lookup", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                if (isSearching) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Searching Redis & OpenLibrary...",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
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
            }
        }
    } else {
        // Result Card View
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Book Details",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    TextButton(
                        onClick = {
                            lookupResult = null
                            isbnInput = ""
                            errorMessage = null
                        }
                    ) {
                        Text("Clear", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            lookupResult = null
                            isbnInput = ""
                            errorMessage = null
                            isScannerOpen = true
                        },
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Scan Next", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

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

            OutlinedButton(
                onClick = {
                    lookupResult = null
                    isbnInput = ""
                    errorMessage = null
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Scan / Lookup Another Book", fontSize = 13.sp)
            }
        }
    }

    if (isScannerOpen) {
        BarcodeScannerDialog(
            onDismiss = { isScannerOpen = false },
            onBarcodeScanned = { code ->
                isScannerOpen = false
                isbnInput = code
                performLookup(code)
            }
        )
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
    iconRes: Int,
    accentColor: Color,
    onClick: () -> Unit
) {
    val isDark = isAppDark()
    val cardBg = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)

    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardBg
        ),
        border = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp)
                .heightIn(min = 78.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Icon at top left
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(accentColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = iconRes),
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Bottom row: Title at bottom left, Count at bottom right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .padding(end = 4.dp),
                    lineHeight = 14.sp
                )
                Text(
                    text = value,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Normal,
                    color = MaterialTheme.colorScheme.onSurface,
                    lineHeight = 22.sp
                )
            }
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

    val isDark = isAppDark()
    val grayColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)

    val (statusBg, statusTint, statusIcon) = when {
        isReturned -> Triple(
            Color(0xFF10B981).copy(alpha = 0.12f),
            Color(0xFF10B981),
            R.drawable.ic_custom_check_circle
        )
        isOverdue -> Triple(
            Color(0xFFEF4444).copy(alpha = 0.12f),
            Color(0xFFEF4444),
            R.drawable.ic_custom_overdue
        )
        else -> Triple(
            if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7),
            if (isDark) Color(0xFFE4E4E7) else Color(0xFF52525B),
            R.drawable.ic_custom_books
        )
    }

    val studentDetail = item.studentName.ifBlank { "Student" }
    val classParts = listOfNotNull(
        item.studentClass?.takeIf { it.isNotBlank() },
        item.studentSection?.takeIf { it.isNotBlank() }
    ).joinToString("-")

    val dueDateText = formatTableDate(item.dueDate)

    // Expand/collapse state for action buttons (hidden until tapped)
    var isExpanded by remember { mutableStateOf(false) }

    // Drag / Swipe states
    val coroutineScope = rememberCoroutineScope()
    val haptic = LocalHapticFeedback.current
    val density = LocalDensity.current

    var offsetX by remember { mutableFloatStateOf(0f) }
    var animJob by remember { mutableStateOf<Job?>(null) }
    var hasTriggeredHaptic by remember { mutableStateOf(false) }

    val thresholdPx = with(density) { 68.dp.toPx() }
    val maxDragPx = with(density) { 108.dp.toPx() }

    val canRenew = isActive && item.renewalsCount < 3 && !isReturned
    val canReturn = !isReturned

    val draggableState = rememberDraggableState { delta ->
        val current = offsetX
        val effectiveDelta = if (abs(current) > thresholdPx) delta * 0.45f else delta
        val newOffset = (current + effectiveDelta).coerceIn(
            if (canRenew) -maxDragPx else 0f,
            if (canReturn) maxDragPx else 0f
        )
        offsetX = newOffset

        if (!hasTriggeredHaptic) {
            if ((newOffset >= thresholdPx && canReturn) || (newOffset <= -thresholdPx && canRenew)) {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                hasTriggeredHaptic = true
            }
        } else {
            if (abs(newOffset) < thresholdPx * 0.8f) {
                hasTriggeredHaptic = false
            }
        }
    }

    // Blend seamlessly with the table container
    val cardBg = if (isDark) Color(0xFF141416) else Color(0xFFF7F7F9)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
    ) {
        // Background swipe action indicators
        if (!isReturned) {
            val isDraggingRight = offsetX > 0f
            val pullProgress = (abs(offsetX) / thresholdPx).coerceIn(0.5f, 1f)

            Box(
                modifier = Modifier
                    .matchParentSize()
                    .graphicsLayer {
                        alpha = if (abs(offsetX) > 2f) 1f else 0f
                    }
                    .background(
                        if (isDraggingRight) Color(0xFF059669) else Color(0xFF2563EB),
                        RoundedCornerShape(10.dp)
                    )
                    .padding(horizontal = 14.dp),
                contentAlignment = if (isDraggingRight) Alignment.CenterStart else Alignment.CenterEnd
            ) {
                Row(
                    modifier = Modifier.graphicsLayer {
                        scaleX = pullProgress
                        scaleY = pullProgress
                        alpha = pullProgress
                    },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (isDraggingRight) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_custom_check_circle),
                            contentDescription = "Return",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Return",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    } else {
                        Text(
                            text = "Renew",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Icon(
                            painter = painterResource(id = R.drawable.ic_custom_circulation),
                            contentDescription = "Renew",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // Foreground sliding card
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer {
                    translationX = offsetX
                }
                .background(cardBg, RoundedCornerShape(10.dp))
                .draggable(
                    state = draggableState,
                    orientation = Orientation.Horizontal,
                    enabled = !isReturned && (canReturn || canRenew),
                    onDragStarted = {
                        animJob?.cancel()
                        animJob = null
                        hasTriggeredHaptic = false
                    },
                    onDragStopped = { velocity ->
                        val finalOffset = offsetX
                        val reachedRight = (finalOffset >= thresholdPx || (velocity > 600f && finalOffset > 20f)) && canReturn
                        val reachedLeft = (finalOffset <= -thresholdPx || (velocity < -600f && finalOffset < -20f)) && canRenew

                        if (reachedRight) {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            onReturn()
                        } else if (reachedLeft) {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            onRenew()
                        }

                        hasTriggeredHaptic = false
                        animJob = coroutineScope.launch {
                            Animatable(finalOffset).animateTo(
                                targetValue = 0f,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            ) {
                                offsetX = value
                            }
                        }
                    }
                )
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    if (!isReturned) {
                        isExpanded = !isExpanded
                    }
                }
                .padding(vertical = 10.dp, horizontal = 6.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Left side status squircle icon
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(statusBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = statusIcon),
                    contentDescription = null,
                    tint = statusTint,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Right side content
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                // Row 1: Book Title & Status Pill / Due Date
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.bookTitle.ifBlank { "Untitled Book" },
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .weight(1f, fill = false)
                            .padding(end = 6.dp)
                    )

                    if (isOverdue) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFEF4444).copy(alpha = 0.12f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "Overdue",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFEF4444)
                            )
                        }
                    } else if (isReturned) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF10B981).copy(alpha = 0.12f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "Returned",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF10B981)
                            )
                        }
                    } else {
                        Text(
                            text = "Due $dueDateText",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Normal,
                            color = grayColor
                        )
                    }
                }

                // Row 2: Student details & Class badge & Animated Expand Chevron
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Text(
                            text = studentDetail,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Normal,
                            color = grayColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        if (classParts.isNotBlank()) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = classParts,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
                                )
                            }
                        }
                    }

                    if (!isReturned) {
                        val rotation by animateFloatAsState(
                            targetValue = if (isExpanded) 180f else 0f,
                            label = "chevronRotation"
                        )
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowDown,
                            contentDescription = if (isExpanded) "Collapse" else "Expand",
                            tint = grayColor.copy(alpha = 0.6f),
                            modifier = Modifier
                                .size(16.dp)
                                .graphicsLayer { rotationZ = rotation }
                        )
                    }
                }

                // Actions row (Renew / Return) revealed only when tapped / expanded
                AnimatedVisibility(
                    visible = isExpanded && !isReturned,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp, bottom = 2.dp)
                    ) {
                        HorizontalDivider(
                            thickness = 0.6.dp,
                            color = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { /* prevent collapsing when clicking buttons row */ },
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (isActive && item.renewalsCount < 3) {
                                OutlinedButton(
                                    onClick = onRenew,
                                    modifier = Modifier.height(32.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    border = BorderStroke(1.dp, if (isDark) Color(0xFF3F3F46) else Color(0xFFD4D4D8))
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_custom_circulation),
                                        contentDescription = null,
                                        modifier = Modifier.size(13.dp),
                                        tint = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(
                                        text = "Renew (${item.renewalsCount}/3)",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }

                            Button(
                                onClick = onReturn,
                                modifier = Modifier.height(32.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isOverdue) Color(0xFFEF4444) else if (isDark) Color(0xFFFAFAFA) else Color(0xFF18181B),
                                    contentColor = if (isOverdue) Color.White else if (isDark) Color(0xFF18181B) else Color.White
                                )
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_check_circle),
                                    contentDescription = null,
                                    modifier = Modifier.size(13.dp),
                                    tint = if (isOverdue) Color.White else if (isDark) Color(0xFF18181B) else Color.White
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = "Return Book",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
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
    val isDark = isAppDark()
    val grayColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
    var menuExpanded by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp, horizontal = 2.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Left side book cover or icon
        val cover = book.coverUrl
        if (!cover.isNullOrEmpty()) {
            AsyncImage(
                model = cover,
                contentDescription = "Cover",
                modifier = Modifier
                    .padding(top = 2.dp)
                    .width(28.dp)
                    .height(38.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentScale = ContentScale.Crop
            )
        } else {
            Icon(
                painter = painterResource(id = R.drawable.ic_custom_books),
                contentDescription = "Book",
                tint = if (book.actualAvailable > 0) MaterialTheme.colorScheme.primary else grayColor,
                modifier = Modifier
                    .padding(top = 2.dp)
                    .size(28.dp)
            )
        }

        // Center column details
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            // Top row: Author & Category, and Available copies at right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val authorCategory = buildString {
                    if (book.author.isNotBlank()) append(book.author)
                    if (book.category.isNotBlank()) {
                        if (isNotEmpty()) append(" • ")
                        append(book.category)
                    }
                }.ifBlank { "General" }

                Text(
                    text = authorCategory,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Normal,
                    color = grayColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .padding(end = 8.dp)
                )

                Text(
                    text = "${book.actualAvailable}/${book.quantity} Avail",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (book.actualAvailable > 0) Color(0xFF10B981) else Color(0xFFEF4444),
                    maxLines = 1
                )
            }

            // Book Title in semi-bold
            Text(
                text = book.title.ifBlank { "Untitled Book" },
                fontSize = 13.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Bottom row: ISBN & Shelf location
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (book.isbn.isNotBlank()) {
                    Text(
                        text = "ISBN: ${book.isbn}",
                        fontSize = 11.sp,
                        color = grayColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (!book.location.isNullOrBlank()) {
                    if (book.isbn.isNotBlank()) {
                        Text(
                            text = "•",
                            fontSize = 11.sp,
                            color = grayColor.copy(alpha = 0.6f)
                        )
                    }
                    Text(
                        text = "Shelf: ${book.location}",
                        fontSize = 11.sp,
                        color = grayColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // Three dots action button with Edit and Delete
        Box {
            IconButton(
                onClick = { menuExpanded = true },
                modifier = Modifier
                    .size(28.dp)
                    .padding(top = 0.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Actions",
                    tint = grayColor,
                    modifier = Modifier.size(18.dp)
                )
            }

            DropdownMenu(
                expanded = menuExpanded,
                onDismissRequest = { menuExpanded = false },
                modifier = Modifier.background(MaterialTheme.colorScheme.surface)
            ) {
                DropdownMenuItem(
                    text = { Text("Edit Book", fontSize = 13.sp) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    onClick = {
                        menuExpanded = false
                        onEdit()
                    }
                )

                DropdownMenuItem(
                    text = {
                        Text(
                            "Delete",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.error
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    onClick = {
                        menuExpanded = false
                        onDelete()
                    }
                )
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
    var isScannerOpen by remember { mutableStateOf(false) }
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
                            trailingIcon = {
                                IconButton(onClick = { isScannerOpen = true }) {
                                    Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan Barcode", tint = MaterialTheme.colorScheme.primary)
                                }
                            },
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

    if (isScannerOpen) {
        BarcodeScannerDialog(
            onDismiss = { isScannerOpen = false },
            onBarcodeScanned = { code ->
                isScannerOpen = false
                customIsbnInput = code
                isUsingCustomIsbn = true
            }
        )
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

private fun formatTableDate(rawIso: String?): String {
    if (rawIso.isNullOrBlank()) return "—"
    return try {
        val clean = rawIso.replace("Z", "").split(".")[0]
        val parser = if (clean.contains("T")) {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        } else {
            SimpleDateFormat("yyyy-MM-dd", Locale.US)
        }
        val date = parser.parse(clean)
        val formatter = SimpleDateFormat("MMM d", Locale.US)
        if (date != null) formatter.format(date) else rawIso.take(10)
    } catch (e: Exception) {
        try {
            val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(rawIso.take(10))
            if (date != null) SimpleDateFormat("MMM d", Locale.US).format(date) else rawIso.take(10)
        } catch (_: Exception) {
            rawIso.take(10)
        }
    }
}
