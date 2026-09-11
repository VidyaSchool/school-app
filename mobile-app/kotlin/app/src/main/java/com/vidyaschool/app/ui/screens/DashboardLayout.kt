package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import android.content.Context
import android.app.DownloadManager
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.geometry.Offset
import androidx.compose.foundation.isSystemInDarkTheme
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.viewinterop.AndroidView
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.draw.shadow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.auth.BiometricHelper
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.api.UpdateChecker
import com.vidyaschool.app.api.UpdateInfo
import com.vidyaschool.app.ui.components.CustomTextField
import com.vidyaschool.app.ui.components.RainBackgroundEffect
import com.vidyaschool.app.ui.shadcn.Input
import com.vidyaschool.app.ui.shadcn.Select
import com.vidyaschool.app.ui.shadcn.SelectOption
import coil.compose.AsyncImage
import com.vidyaschool.app.api.FeeInstallment
import com.vidyaschool.app.api.NoticeResponse
import com.vidyaschool.app.api.NotificationHistoryItem
import com.vidyaschool.app.api.PayFeesRequest
import com.vidyaschool.app.api.PayFeesResponse
import com.vidyaschool.app.api.SearchUserResponse
import com.vidyaschool.app.api.SearchBackendResponse
import com.vidyaschool.app.api.UserProfileData
import com.vidyaschool.app.api.SessionItem
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
import androidx.compose.ui.graphics.vector.ImageVector
import io.socket.client.IO
import io.socket.client.Socket
import com.google.gson.Gson
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.UnfoldMore
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.AccountBalance

val LocalMenuClickHandler = staticCompositionLocalOf<(() -> Unit)?> { null }

@Composable
fun DashboardHeader(
    title: String,
    subtitle: String,
    onNotificationClick: () -> Unit,
    hasUnreadNotifications: Boolean = false,
    modifier: Modifier = Modifier,
    isDarkHeader: Boolean = false
) {
    val menuClick = LocalMenuClickHandler.current
    val contentColor = if (isDarkHeader) Color.White else MaterialTheme.colorScheme.onBackground
    val borderAlpha = if (isDarkHeader) 0.25f else 0.15f
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IconButton(
                onClick = { menuClick?.invoke() },
                modifier = Modifier
                    .size(36.dp)
                    .border(
                        1.dp,
                        contentColor.copy(alpha = borderAlpha),
                        shape = CircleShape
                    )
                    .clip(CircleShape)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_menu),
                    contentDescription = "Menu",
                    modifier = Modifier.size(18.dp),
                    tint = contentColor
                )
            }

            Column {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = contentColor
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = contentColor.copy(alpha = 0.65f)
                )
            }
        }

        IconButton(
            onClick = onNotificationClick,
            modifier = Modifier
                .size(36.dp)
                .border(
                    1.dp,
                    contentColor.copy(alpha = borderAlpha),
                    shape = CircleShape
                )
                .clip(CircleShape)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_notification),
                    contentDescription = "Notifications",
                    modifier = Modifier.size(18.dp),
                    tint = contentColor
                )
                if (hasUnreadNotifications) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(x = 3.dp, y = (-2).dp)
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF3B82F6))
                            .border(1.5.dp, if (isDarkHeader) Color.Black else MaterialTheme.colorScheme.background, CircleShape)
                    )
                }
            }
        }
    }
}

@Composable
fun DashboardStickyHeader(
    title: String,
    headerAlpha: Float,
    headerSlide: Float,
    onNotificationClick: () -> Unit,
    hasUnreadNotifications: Boolean = false,
    modifier: Modifier = Modifier
) {
    val menuClick = LocalMenuClickHandler.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer { alpha = headerAlpha; translationY = headerSlide }
            .background(MaterialTheme.colorScheme.background)
    ) {
        Spacer(modifier = Modifier.windowInsetsTopHeight(androidx.compose.foundation.layout.WindowInsets.statusBars))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = { menuClick?.invoke() },
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                    .clip(CircleShape)
            ) {
                Icon(painter = painterResource(id = R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
            }
            Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            IconButton(
                onClick = onNotificationClick,
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                    .clip(CircleShape)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(painter = painterResource(id = R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    if (hasUnreadNotifications) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = 3.dp, y = (-2).dp)
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF3B82F6))
                                .border(1.5.dp, MaterialTheme.colorScheme.background, CircleShape)
                        )
                    }
                }
            }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardLayout(
    role: String,
    provider: String,
    email: String,
    name: String,
    avatarUrl: String? = null,
    themeMode: String = "system",
    onThemeChange: (String) -> Unit,
    onLogout: () -> Unit,
    onShowLibrary: (() -> Unit)? = null,
    homeContent: @Composable (onNotificationClick: () -> Unit, hasUnreadNotifications: Boolean) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    
    val updateInfo by UpdateChecker.updateInfoState
    var isDownloading by UpdateChecker.isDownloadingState
    var downloadProgress by UpdateChecker.downloadProgressState
    
    val currentRole = remember { mutableStateOf(role) }
    val currentName = remember { mutableStateOf(name) }
    val currentAvatarUrl = remember { mutableStateOf(avatarUrl) }
    val currentUsername = remember { mutableStateOf(sessionManager.getUsername() ?: "") }
    
    var selectedTab by remember { mutableStateOf("home") }
    var activeDocPath by remember { mutableStateOf<String?>(null) }
    var activeDocFallback by remember { mutableStateOf<String?>(null) }
    var showSearchDialog by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var hasUnreadNotifications by remember { mutableStateOf(false) }
    var showComplaintDialog by remember { mutableStateOf(false) }
    var showAiDialog by remember { mutableStateOf(false) }
    var showAgentScreen by remember { mutableStateOf(false) }
    var selectedChatId by remember { mutableStateOf<String?>(null) }
    var userChats by remember { mutableStateOf<List<com.vidyaschool.app.api.ChatItem>>(emptyList()) }
    var userChatsLoaded by remember { mutableStateOf(false) }
    var sidebarNotes by remember { mutableStateOf<List<ParsedNote>>(emptyList()) }
    var sidebarNotesLoading by remember { mutableStateOf(false) }
    var selectedSidebarNote by remember { mutableStateOf<ParsedNote?>(null) }
    var sidebarNotesSubject by remember { mutableStateOf("All") }
    var sidebarSessionsCount by remember { mutableStateOf<Int?>(null) }
    var paymentSuccessInstallment by remember { mutableStateOf<FeeInstallment?>(null) }
    var showQRLogin by remember { mutableStateOf(false) }
    var biometricError by remember { mutableStateOf<String?>(null) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    
    // Check initial notification history on launch to set unread badge dot
    LaunchedEffect(Unit) {
        try {
            val token = sessionManager.getSessionToken()
            if (!token.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getNotificationHistory("Bearer $token", 30)
                if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                    hasUnreadNotifications = true
                }
            }
        } catch (e: Exception) { }
    }

    // Fetch user recent chats when sidebar opens
    LaunchedEffect(drawerState.isOpen) {
        if (drawerState.isOpen && !userChatsLoaded) {
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val res = RetrofitClient.authApi.getUserChats("Bearer $token")
                    if (res.isSuccessful && res.body() != null) {
                        userChats = res.body()!!
                        userChatsLoaded = true
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("Sidebar", "Fetch user chats failed: ${e.message}")
            }
        }
    }

    // Handle system Back button press: go 1 step back instead of exiting app
    val isBackEnabled = selectedSidebarNote != null ||
            drawerState.isOpen ||
            activeDocPath != null ||
            showNotifications ||
            showComplaintDialog ||
            showAiDialog ||
            showAgentScreen ||
            showQRLogin ||
            showSearchDialog ||
            selectedTab != "home"

    BackHandler(enabled = isBackEnabled) {
        when {
            showSearchDialog -> showSearchDialog = false
            selectedSidebarNote != null -> selectedSidebarNote = null
            drawerState.isOpen -> scope.launch { drawerState.close() }
            activeDocPath != null -> activeDocPath = null
            showNotifications -> showNotifications = false
            showComplaintDialog -> showComplaintDialog = false
            showAiDialog -> showAiDialog = false
            showAgentScreen -> showAgentScreen = false
            showQRLogin -> showQRLogin = false
            selectedTab != "home" -> selectedTab = "home"
            else -> {}
        }
    }

    val triggerRefresh: () -> Unit = {
        isRefreshing = true
        scope.launch {
            try {
                val sessionToken = sessionManager.getSessionToken()
                var sessionVerified = false
                
                if (!sessionToken.isNullOrEmpty()) {
                    try {
                        val verifyResponse = RetrofitClient.authApi.verifySession(sessionToken)
                        if (verifyResponse.isSuccessful) {
                            val verifyBody = verifyResponse.body()
                            if (verifyBody != null) {
                                sessionVerified = true
                                if (verifyBody.valid) {
                                    currentRole.value = verifyBody.role ?: currentRole.value
                                    currentName.value = verifyBody.name ?: currentName.value
                                    currentAvatarUrl.value = verifyBody.image ?: currentAvatarUrl.value
                                    currentUsername.value = verifyBody.username ?: currentUsername.value
                                    sessionManager.saveSession(
                                        provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, verifyBody.studentClass, currentUsername.value
                                    )
                                } else {
                                    // Session is not explicitly verified, fallback to user role check
                                    sessionVerified = false
                                }
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("DashboardLayout", "Verify session failed: ${e.message}")
                    }
                }
                
                if (!sessionVerified) {
                    val response = RetrofitClient.authApi.getUserRole(email)
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body != null) {
                            currentRole.value = body.role
                            currentName.value = body.name ?: currentName.value
                            currentAvatarUrl.value = body.image ?: currentAvatarUrl.value
                            sessionManager.saveSession(
                                provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, body.studentClass, currentUsername.value
                            )
                        }
                    } else {
                        // Local fallback for quick testing before deploying backend changes
                        val localRole = when (email) {
                            "work.ankit.mail@gmail.com" -> "admin"
                            "admin@vidya.com" -> "admin"
                            "teacher@vidya.com" -> "teacher"
                            "accounts@vidya.com" -> "accounts"
                            else -> currentRole.value
                        }
                        currentRole.value = localRole
                        sessionManager.saveSession(
                            provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, sessionManager.getStudentClass(), currentUsername.value
                        )
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("DashboardLayout", "Refresh failed: ${e.message}")
            } finally {
                isRefreshing = false
            }
        }
    }
    
    val currentUserId = remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val sessionToken = sessionManager.getSessionToken()
        if (!sessionToken.isNullOrEmpty()) {
            try {
                val profileResponse = RetrofitClient.authApi.getProfile("Bearer $sessionToken")
                if (profileResponse.isSuccessful && profileResponse.body() != null) {
                    val user = profileResponse.body()!!.user
                    currentUserId.value = user.id
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Fetch notes and active sessions for sidebar whenever drawer opens
    LaunchedEffect(drawerState.currentValue) {
        if (drawerState.currentValue == DrawerValue.Open) {
            val token = sessionManager.getSessionToken()
            if (!token.isNullOrEmpty()) {
                if (currentRole.value.equals("student", ignoreCase = true) && sidebarNotes.isEmpty() && !sidebarNotesLoading) {
                    sidebarNotesLoading = true
                    try {
                        val res = RetrofitClient.authApi.getStudentNotes("Bearer $token")
                        if (res.isSuccessful) {
                            sidebarNotes = (res.body()?.notes ?: emptyList()).map { parseNoteContent(it) }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("Sidebar", "Notes fetch failed: ${e.message}")
                    } finally {
                        sidebarNotesLoading = false
                    }
                }
                try {
                    val sRes = RetrofitClient.authApi.getActiveSessions("Bearer $token")
                    if (sRes.isSuccessful && sRes.body() != null) {
                        sidebarSessionsCount = sRes.body()!!.size
                    }
                } catch (e: Exception) {
                    android.util.Log.e("Sidebar", "Sessions count fetch failed: ${e.message}")
                }
            }
        }
    }

    LaunchedEffect(currentUserId.value) {
        val userId = currentUserId.value
        if (userId.isEmpty()) return@LaunchedEffect
        
        val userRole = sessionManager.getRole() ?: "student"
        
        var globalSocket: io.socket.client.Socket? = null
        try {
            val opts = IO.Options().apply {
                transports = arrayOf("websocket")
                forceNew = false
                callFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
                webSocketFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
            }
            globalSocket = IO.socket("https://api.vidyaschool.com", opts)
            
            globalSocket.on(Socket.EVENT_CONNECT) {
                val joinData = org.json.JSONObject().apply {
                    put("userId", userId)
                    put("name", currentName.value)
                    put("role", userRole)
                }
                globalSocket?.emit("join", joinData)
                android.util.Log.d("NotificationSocket", "Joined with userId: $userId")
            }
            
            globalSocket.on("notification") { args ->
                hasUnreadNotifications = true
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val title = obj.optString("title", "New Notification")
                        val body = obj.optString("body", "")
                        com.vidyaschool.app.MyFirebaseMessagingService.showNotification(context, title, body)
                    }
                }
            }
            
            globalSocket.connect()
            kotlinx.coroutines.awaitCancellation()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            globalSocket?.disconnect()
            globalSocket?.off()
            globalSocket = null
        }
    }

    CompositionLocalProvider(LocalMenuClickHandler provides { scope.launch { drawerState.open() } }) {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = MaterialTheme.colorScheme.background,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .clickable {
                                    scope.launch { drawerState.close() }
                                    selectedTab = "profile"
                                }
                                .padding(horizontal = 4.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                        // Avatar with green online dot
                        Box(modifier = Modifier.size(38.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(9.dp))
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (!avatarUrl.isNullOrEmpty()) {
                                    AsyncImage(
                                        model = avatarUrl,
                                        contentDescription = "Avatar",
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .clip(RoundedCornerShape(9.dp))
                                    )
                                } else {
                                    Text(
                                        text = (name.takeIf { it.isNotBlank() } ?: "U").take(1).uppercase(),
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                            // Green online indicator dot
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .align(Alignment.BottomEnd)
                                    .border(2.dp, MaterialTheme.colorScheme.background, CircleShape)
                                    .clip(CircleShape)
                                    .background(Color(0xFF22C55E))
                            )
                        }

                        Spacer(modifier = Modifier.width(9.dp))

                        Text(
                            text = name.ifEmpty { "User" },
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onBackground,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.widthIn(max = 160.dp)
                        )

                        Spacer(modifier = Modifier.width(6.dp))

                        Icon(
                            imageVector = Icons.Default.UnfoldMore,
                            contentDescription = "Go to profile",
                            modifier = Modifier.size(15.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                        )
                        } // end inner user card Row

                        IconButton(
                            onClick = { scope.launch { drawerState.close() } },
                            modifier = Modifier
                                .size(32.dp)
                                .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Menu",
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    } // end outer SpaceBetween Row

                    // Nav item helper (defined here so it's in scope for both scroll section AND footer)
                    @Composable
                    fun DrawerLink(
                        label: String,
                        icon: ImageVector? = null,
                        iconRes: Int? = null,
                        tab: String? = null,
                        badge: String? = null,
                        isDestructive: Boolean = false,
                        onClick: (() -> Unit)? = null
                    ) {
                        val isSelected = tab != null && selectedTab == tab
                        val textColor = when {
                            isDestructive -> MaterialTheme.colorScheme.error
                            isSelected -> MaterialTheme.colorScheme.onBackground
                            else -> MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 3.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isSelected) MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f)
                                    else Color.Transparent
                                )
                                .clickable {
                                    scope.launch { drawerState.close() }
                                    if (tab != null) selectedTab = tab
                                    onClick?.invoke()
                                }
                                .padding(horizontal = 12.dp)
                                .height(42.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            if (iconRes != null) {
                                Icon(
                                    painter = painterResource(id = iconRes),
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp),
                                    tint = textColor
                                )
                            } else if (icon != null) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp),
                                    tint = textColor
                                )
                            }
                            Text(
                                text = label,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = textColor,
                                modifier = Modifier.weight(1f)
                            )
                            if (badge != null) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF3B82F6)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = badge,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                        style = androidx.compose.ui.text.TextStyle(
                                            platformStyle = androidx.compose.ui.text.PlatformTextStyle(
                                                includeFontPadding = false
                                            ),
                                            lineHeight = 10.sp
                                        )
                                    )
                                }
                            }
                        }
                    }

                    // Scrollable middle section
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState())
                    ) {



                    // ── Inline Notes section (student only) ──────────────────────
                    if (currentRole.value.equals("student", ignoreCase = true)) {
                        val noteAccent: @Composable (String) -> Color = { tag ->
                            when (tag) {
                                "yellow" -> Color(0xFFF59E0B)
                                "blue"   -> Color(0xFF38BDF8)
                                "green"  -> Color(0xFF34D399)
                                "pink"   -> Color(0xFFF472B6)
                                "purple" -> Color(0xFFA78BFA)
                                else     -> MaterialTheme.colorScheme.primary
                            }
                        }

                        val sidebarSubjects = remember(sidebarNotes) {
                            val s = linkedSetOf("All")
                            sidebarNotes.forEach { s.add(it.subject) }
                            s.toList()
                        }
                        val sidebarFiltered = remember(sidebarNotes, sidebarNotesSubject) {
                            if (sidebarNotesSubject == "All") sidebarNotes
                            else sidebarNotes.filter { it.subject.equals(sidebarNotesSubject, ignoreCase = true) }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Section header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_notes),
                                    contentDescription = null,
                                    modifier = Modifier.size(15.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Notes",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.55f),
                                    letterSpacing = 0.5.sp
                                )
                            }
                            if (sidebarNotes.isNotEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF3B82F6)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${sidebarNotes.size}",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                        style = androidx.compose.ui.text.TextStyle(
                                            platformStyle = androidx.compose.ui.text.PlatformTextStyle(
                                                includeFontPadding = false
                                            ),
                                            lineHeight = 10.sp
                                        )
                                    )
                                }
                            }
                        }

                        // Subject filter pills (only if multiple subjects)
                        if (!sidebarNotesLoading && sidebarSubjects.size > 1) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState())
                                    .padding(start = 16.dp, end = 16.dp, bottom = 6.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                sidebarSubjects.forEach { sub ->
                                    val sel = sub == sidebarNotesSubject
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(
                                                if (sel) MaterialTheme.colorScheme.primary
                                                else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.07f)
                                            )
                                            .clickable(
                                                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                                indication = null
                                            ) { sidebarNotesSubject = sub }
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = sub,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = if (sel) MaterialTheme.colorScheme.onPrimary
                                                    else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.65f)
                                        )
                                    }
                                }
                            }
                        }

                        // Notes list
                        when {
                            sidebarNotesLoading -> {
                                // Horizontal skeleton shimmer
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                        .padding(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    repeat(3) {
                                        Box(
                                            modifier = Modifier
                                                .width(170.dp)
                                                .height(124.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f))
                                        )
                                    }
                                }
                            }
                            sidebarFiltered.isEmpty() -> {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "No notes yet",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.35f)
                                    )
                                }
                            }
                            else -> {
                                // Horizontal scrollable cards — no scrollbar
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(
                                            state = rememberScrollState(),
                                            enabled = true
                                        )
                                        .padding(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    sidebarFiltered.forEach { note ->
                                        val accent = noteAccent(note.color)
                                        Column(
                                            modifier = Modifier
                                                .width(170.dp)
                                                .height(124.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f))
                                                .clickable(
                                                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                                    indication = null
                                                ) {
                                                    scope.launch { drawerState.close() }
                                                    selectedSidebarNote = note
                                                }
                                                .padding(10.dp)
                                        ) {
                                            // Subject badge + accent dot
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(6.dp)
                                                        .clip(CircleShape)
                                                        .background(accent)
                                                )
                                                Text(
                                                    text = note.subject,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = accent,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            // Title
                                            Text(
                                                text = note.title,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = MaterialTheme.colorScheme.onBackground,
                                                maxLines = 2,
                                                overflow = TextOverflow.Ellipsis,
                                                lineHeight = 14.sp
                                            )
                                            Spacer(modifier = Modifier.weight(1f))
                                            // Teacher + timestamp
                                            Text(
                                                text = note.teacherName,
                                                fontSize = 9.sp,
                                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = note.timestamp,
                                                fontSize = 9.sp,
                                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp),
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.06f)
                        )
                    }
                    // ─────────────────────────────────────────────────────────────

                    if (!currentRole.value.equals("student", ignoreCase = true)) {
                        DrawerLink(
                            label = "Agent",
                            iconRes = R.drawable.ic_custom_ai
                        ) {
                            scope.launch { drawerState.close() }
                            showAgentScreen = true
                        }
                    }

                    DrawerLink(
                        label = "File a Complaint",
                        iconRes = R.drawable.ic_custom_complaint
                    ) {
                        showComplaintDialog = true
                    }

                    // ── QR Code Login (above Manage Sessions) ─────────────────────────────
                    DrawerLink(
                        label = "QR Code Login",
                        iconRes = R.drawable.ic_custom_qr_code
                    ) {
                        scope.launch { drawerState.close() }
                        val activity = context as? androidx.fragment.app.FragmentActivity
                        if (activity != null && BiometricHelper.isAvailable(activity)) {
                            BiometricHelper.showPrompt(
                                activity  = activity,
                                title     = "QR Login — Verify Identity",
                                subtitle  = "Use fingerprint or face to open the QR scanner",
                                onSuccess = { showQRLogin = true },
                                onFailure = { reason -> biometricError = reason }
                            )
                        } else {
                            // No biometric hardware / enrollment — open directly
                            showQRLogin = true
                        }
                    }

                    DrawerLink(
                        label = "Manage Sessions",
                        iconRes = R.drawable.ic_custom_sessions,
                        tab = "sessions",
                        badge = sidebarSessionsCount?.toString()
                    )

                    // ── Recent Agent Chats from Backend ────────────────────────────
                    if (userChats.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.06f)
                        )

                        Text(
                            text = "RECENT CHATS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                            modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
                        )

                        userChats.take(5).forEach { chat ->
                            DrawerLink(
                                label = chat.title?.ifEmpty { "Previous Chat" } ?: "Previous Chat",
                                iconRes = R.drawable.ic_custom_chat_round
                            ) {
                                scope.launch { drawerState.close() }
                                selectedChatId = chat.id
                                showAgentScreen = true
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    } // end scrollable middle Column

                    // Quick Search Bar in sidebar footer (placed in spot of removed Log Out button)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(60.dp)
                            .padding(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 14.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f))
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                            .clickable {
                                scope.launch { drawerState.close() }
                                showSearchDialog = true
                            }
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Start
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_search),
                                    contentDescription = "Search",
                                    modifier = Modifier.size(22.dp),
                                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.65f)
                                )
                                Text(
                                    text = "Quick Search",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Normal,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }
            }
        ) {
            Scaffold(
        topBar = {
            if (activeDocPath != null) {
                Column(
                    modifier = Modifier.background(MaterialTheme.colorScheme.background)
                ) {
                    Spacer(modifier = Modifier.windowInsetsTopHeight(WindowInsets.statusBars))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { activeDocPath = null }
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Documentation",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
                }
            }
        },
        bottomBar = {
            val isKeyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
            val navBarInsets = if (isKeyboardVisible) {
                WindowInsets(0.dp)
            } else {
                NavigationBarDefaults.windowInsets
            }
            Column(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.background)
                    .windowInsetsPadding(navBarInsets)
            ) {
                updateInfo?.let { info ->
                    val updateApk = remember(info) { java.io.File(context.cacheDir, "update.apk") }
                    var isApkDownloaded by remember(info) { mutableStateOf(updateApk.exists() && updateApk.length() > 0) }

                    UpdateBanner(
                        updateInfo = info,
                        isDownloading = isDownloading,
                        downloadProgress = downloadProgress,
                        isDownloaded = isApkDownloaded,
                        onUpdateClick = {
                            try {
                                val canInstall = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                    context.packageManager.canRequestPackageInstalls()
                                } else {
                                    true
                                }
                                if (!canInstall) {
                                    try {
                                        val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                                            data = Uri.parse("package:${context.packageName}")
                                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        }
                                        context.startActivity(intent)
                                        android.widget.Toast.makeText(context, "Please enable 'Install unknown apps' to update.", android.widget.Toast.LENGTH_LONG).show()
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                        android.widget.Toast.makeText(context, "Error opening settings: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    if (isApkDownloaded && updateApk.exists()) {
                                        try {
                                            val apkUri = androidx.core.content.FileProvider.getUriForFile(
                                                context,
                                                "${context.packageName}.fileprovider",
                                                updateApk
                                            )
                                            UpdateChecker.installApk(context, apkUri)
                                            UpdateChecker.updateInfoState.value = null
                                        } catch (e: Exception) {
                                            e.printStackTrace()
                                            android.widget.Toast.makeText(context, "Failed to launch installer: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        isDownloading = true
                                        downloadProgress = 0f
                                        scope.launch {
                                            try {
                                                val apkUri = UpdateChecker.downloadApk(context, info.downloadUrl) { progress ->
                                                    downloadProgress = progress
                                                }
                                                isDownloading = false
                                                if (apkUri != null) {
                                                    isApkDownloaded = true
                                                    UpdateChecker.installApk(context, apkUri)
                                                } else {
                                                    android.widget.Toast.makeText(context, "Failed to download update.", android.widget.Toast.LENGTH_SHORT).show()
                                                }
                                            } catch (e: Exception) {
                                                isDownloading = false
                                                e.printStackTrace()
                                                android.widget.Toast.makeText(context, "Download error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                            } finally {
                                                UpdateChecker.updateInfoState.value = null
                                            }
                                        }
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                                android.widget.Toast.makeText(context, "An error occurred: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                            }
                        },
                        onDismissClick = {
                            UpdateChecker.updateInfoState.value = null
                        }
                    )
                }
                if (selectedTab != "community" && activeDocPath == null) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.background,
                        tonalElevation = 0.dp,
                        windowInsets = WindowInsets(0.dp),
                        modifier = Modifier.height(62.dp)
                    ) {
                        val navItemColors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            indicatorColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                        )
                        NavigationBarItem(
                            selected = selectedTab == "home",
                            onClick = { selectedTab = "home" },
                            label = { Text("Home", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                            icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_home), contentDescription = "Home", modifier = Modifier.size(22.dp)) },
                            colors = navItemColors
                        )
                        NavigationBarItem(
                            selected = selectedTab == "notice",
                            onClick = { selectedTab = "notice" },
                            label = { Text("Notice", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                            icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_notice), contentDescription = "Notice", modifier = Modifier.size(22.dp)) },
                            colors = navItemColors
                        )
                        if (currentRole.value.equals("student", ignoreCase = true)) {
                            NavigationBarItem(
                                selected = selectedTab == "fees",
                                onClick = { selectedTab = "fees" },
                                label = { Text("Pay Fees", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                                icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_pay_fees), contentDescription = "Pay Fees", modifier = Modifier.size(22.dp)) },
                                colors = navItemColors
                            )
                        } else {
                            NavigationBarItem(
                                selected = selectedTab == "community",
                                onClick = { selectedTab = "community" },
                                label = { Text("Community", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                                icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_community), contentDescription = "Community", modifier = Modifier.size(22.dp)) },
                                colors = navItemColors
                            )
                        }
                        if (currentRole.value.equals("student", ignoreCase = true)) {
                            NavigationBarItem(
                                selected = selectedTab == "courses",
                                onClick = { selectedTab = "courses" },
                                label = { Text("Courses", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                                icon = { Icon(painter = painterResource(id = R.drawable.ic_courses), contentDescription = "Courses", modifier = Modifier.size(22.dp)) },
                                colors = navItemColors
                            )
                        } else {
                            NavigationBarItem(
                                selected = selectedTab == "search",
                                onClick = { selectedTab = "search" },
                                label = { Text("Search", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                                icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_search), contentDescription = "Search", modifier = Modifier.size(22.dp)) },
                                colors = navItemColors
                            )
                        }
                        NavigationBarItem(
                            selected = selectedTab == "profile",
                            onClick = { selectedTab = "profile" },
                            label = { Text("Profile", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                            icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_profile), contentDescription = "Profile", modifier = Modifier.size(22.dp)) },
                            colors = navItemColors
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            if (activeDocPath != null) {
                DocViewerScreen(
                    path = activeDocPath!!,
                    fallbackContent = activeDocFallback,
                    onBack = { activeDocPath = null }
                )
            } else {
                when (selectedTab) {
                    "home" -> {
                        PullToRefreshBox(
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            homeContent({ showNotifications = true }, hasUnreadNotifications)
                        }
                    }
                    "notice" -> {
                        NoticeTabContent(
                            sessionManager = sessionManager,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onNotificationClick = { showNotifications = true }
                        )
                    }
                    "community" -> {
                        CommunityTabContent(
                            role = currentRole.value,
                            sessionManager = sessionManager,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onBackClick = { selectedTab = "home" }
                        )
                    }
                    "fees" -> {
                        FeesTabContent(
                            sessionManager = sessionManager,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onNotificationClick = { showNotifications = true },
                            onPaymentSuccess = { inst ->
                                paymentSuccessInstallment = inst
                            }
                        )
                    }
                    "courses" -> {
                        CoursesTabContent()
                    }
                    "search" -> {
                        SearchTabContent(
                            sessionManager = sessionManager,
                            onTabSelect = { tab -> selectedTab = tab },
                            onDocSelect = { path, fallback -> activeDocPath = path; activeDocFallback = fallback },
                            onShowLibrary = onShowLibrary,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh
                        )
                    }
                    "profile" -> {
                        ProfileTabContent(
                            sessionManager = sessionManager,
                            role = currentRole.value,
                            provider = provider,
                            email = email,
                            name = currentName.value,
                            avatarUrl = currentAvatarUrl.value,
                            username = currentUsername.value,
                            onUpdateUsername = { newUsername ->
                                currentUsername.value = newUsername
                                val token = sessionManager.getSessionToken()
                                val studentClass = sessionManager.getStudentClass()
                                sessionManager.saveSession(
                                    provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, token, studentClass, newUsername
                                )
                            },
                            themeMode = themeMode,
                            onThemeChange = onThemeChange,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onLogout = onLogout,
                            onNotificationClick = { showNotifications = true }
                        )
                    }
                    "sessions" -> {
                        SessionsTabContent(
                            sessionManager = sessionManager,
                            onNotificationClick = { showNotifications = true }
                        )
                    }
                }
            }
        }
    }
    }

    if (showNotifications) {
        hasUnreadNotifications = false
        NotificationDrawer(
            sessionManager = sessionManager,
            onDismiss = { showNotifications = false }
        )
    }

    if (showAiDialog) {
        TeacherAIDialog(onDismiss = { showAiDialog = false })
    }

    if (showAgentScreen) {
        AgentScreen(
            teacherName = currentName.value.ifEmpty { "Teacher" },
            chatId = selectedChatId,
            sessionToken = sessionManager.getSessionToken(),
            onBack = {
                showAgentScreen = false
                selectedChatId = null
            }
        )
    }

    // ── QR Code Login drawer bottom sheet ───────────────────────────────────
    if (showQRLogin) {
        QRLoginDrawer(
            onDismiss = { showQRLogin = false }
        )
    }

    // ── Biometric error snackbar ─────────────────────────────────────────────
    if (biometricError != null) {
        LaunchedEffect(biometricError) {
            kotlinx.coroutines.delay(3000)
            biometricError = null
        }
        Box(
            modifier = androidx.compose.ui.Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            androidx.compose.material3.Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                shadowElevation = 8.dp,
                modifier = androidx.compose.ui.Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = androidx.compose.ui.Modifier
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        modifier = androidx.compose.ui.Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = biometricError ?: "",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = androidx.compose.ui.Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = { biometricError = null },
                        modifier = androidx.compose.ui.Modifier.size(20.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            modifier = androidx.compose.ui.Modifier.size(14.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }
    }

    // Note detail screen (opened in new full screen when note is clicked)
    if (selectedSidebarNote != null) {
        NoteDetailScreen(
            note = selectedSidebarNote!!,
            onBack = { selectedSidebarNote = null }
        )
    }

    if (paymentSuccessInstallment != null) {
        PaymentSuccessScreen(
            installment = paymentSuccessInstallment!!,
            studentName = currentName.value.ifEmpty { currentUsername.value },
            admissionNo = "",
            onDone = { paymentSuccessInstallment = null },
            onGoHome = {
                paymentSuccessInstallment = null
                selectedTab = "home"
            }
        )
    }

    if (showComplaintDialog) {
        var complaintTitle by remember { mutableStateOf("") }
        var complaintDesc by remember { mutableStateOf("") }
        var selectedDepartment by remember { mutableStateOf("principal") }
        val departments = listOf(
            SelectOption("principal", "Principal Office"),
            SelectOption("it_support", "IT Support"),
            SelectOption("coordinator", "Academic Coordinator")
        )

        AlertDialog(
            onDismissRequest = { showComplaintDialog = false },
            title = {
                Text(
                    text = "File a Complaint",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Select(
                        selectedValue = selectedDepartment,
                        onValueChange = { selectedDepartment = it },
                        options = departments,
                        label = "Select Department",
                        modifier = Modifier.fillMaxWidth()
                    )

                    Column {
                        Text(
                            text = "Title",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 13.sp),
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        Input(
                            value = complaintTitle,
                            onValueChange = { complaintTitle = it },
                            placeholder = "Summarize the issue...",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Column {
                        Text(
                            text = "Details",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 13.sp),
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        Input(
                            value = complaintDesc,
                            onValueChange = { complaintDesc = it },
                            placeholder = "Describe the issue in detail...",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (complaintTitle.isNotBlank() && complaintDesc.isNotBlank()) {
                            showComplaintDialog = false
                            android.widget.Toast.makeText(context, "Complaint submitted successfully! Ticket ID: CMP-${(1000..9999).random()}", android.widget.Toast.LENGTH_LONG).show()
                        } else {
                            android.widget.Toast.makeText(context, "Please fill in all fields", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showComplaintDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showSearchDialog) {
        QuickSearchDialog(
            sessionManager = sessionManager,
            onTabSelect = { tab ->
                selectedTab = tab
                showSearchDialog = false
            },
            onDocSelect = { docPath, fallback ->
                activeDocPath = docPath
                activeDocFallback = fallback
                showSearchDialog = false
            },
            onDismiss = { showSearchDialog = false }
        )
    }

}
}

@Composable
fun SessionsTabContent(
    sessionManager: SessionManager,
    onNotificationClick: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerAlpha"
    )
    val headerSlide by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerSlide"
    )

    val currentProvider = remember { sessionManager.getProvider() ?: "Email Login" }
    val currentEmail = remember { sessionManager.getEmail() ?: "unknown" }
    val currentUsername = remember { sessionManager.getUsername() ?: "unknown" }

    var sessionsList by remember { mutableStateOf<List<SessionItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var isRevokingAll by remember { mutableStateOf(false) }
    var revokingSessionId by remember { mutableStateOf<String?>(null) }

    fun loadSessions() {
        scope.launch {
            isLoading = true
            errorMsg = null
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.getActiveSessions("Bearer $token")
                    if (response.isSuccessful && response.body() != null) {
                        sessionsList = response.body()!!
                    } else {
                        errorMsg = "Failed to load sessions from server"
                    }
                } else {
                    errorMsg = "No active session token"
                }
            } catch (e: Exception) {
                errorMsg = e.message ?: "Could not connect to backend"
            } finally {
                isLoading = false
            }
        }
    }

    fun revokeSingleSession(sessionId: String) {
        scope.launch {
            revokingSessionId = sessionId
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.revokeSession("Bearer $token", sessionId)
                    if (response.isSuccessful) {
                        android.widget.Toast.makeText(context, "Session revoked successfully!", android.widget.Toast.LENGTH_SHORT).show()
                        loadSessions()
                    } else {
                        android.widget.Toast.makeText(context, "Failed to revoke session", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            } finally {
                revokingSessionId = null
            }
        }
    }

    fun revokeAllOthers() {
        scope.launch {
            isRevokingAll = true
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.revokeOtherSessions("Bearer $token")
                    if (response.isSuccessful) {
                        android.widget.Toast.makeText(context, "All other sessions revoked!", android.widget.Toast.LENGTH_SHORT).show()
                        loadSessions()
                    } else {
                        android.widget.Toast.makeText(context, "Failed to revoke other sessions", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            } finally {
                isRevokingAll = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadSessions()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .statusBarsPadding()
                .padding(bottom = 24.dp)
        ) {
            DashboardHeader(
                title = "Manage Sessions",
                subtitle = "Active account session instances",
                onNotificationClick = onNotificationClick
            )

            Spacer(modifier = Modifier.height(12.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Active session instances connected to your school account.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                    }
                } else if (errorMsg != null) {
                    Text(
                        text = errorMsg!!,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }

                // If DB sessions list is available:
                val currentSession = sessionsList.find { it.isCurrent }
                val otherSessions = sessionsList.filter { !it.isCurrent }

                // 1. Current Active Device Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(Color(0xFF22C55E), CircleShape)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Current Device",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Provider: $currentProvider",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                        Text(
                            text = "User: $currentEmail (@$currentUsername)",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                        if (currentSession != null) {
                            if (!currentSession.ipAddress.isNullOrEmpty()) {
                                Text(
                                    text = "IP: ${currentSession.ipAddress}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            if (!currentSession.userAgent.isNullOrEmpty()) {
                                Text(
                                    text = "Device / Agent: ${currentSession.userAgent}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }

                // 2. Other Active Sessions (real database session instances)
                if (otherSessions.isNotEmpty()) {
                    Text(
                        text = "Other Devices & Sessions (${otherSessions.size})",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    otherSessions.forEach { session ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = session.userAgent ?: "Web / App Session",
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "IP: ${session.ipAddress ?: "Unknown"}",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                    if (!session.createdAt.isNullOrEmpty()) {
                                        Text(
                                            text = "Created: ${session.createdAt.take(10)}",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Button(
                                    onClick = { revokeSingleSession(session.id) },
                                    enabled = revokingSessionId != session.id,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.errorContainer,
                                        contentColor = MaterialTheme.colorScheme.onErrorContainer
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    if (revokingSessionId == session.id) {
                                        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Revoke", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                } else if (!isLoading && errorMsg == null) {
                    Text(
                        text = "No other active sessions found on server.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = { revokeAllOthers() },
                    enabled = otherSessions.isNotEmpty() && !isRevokingAll,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    if (isRevokingAll) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Revoke All Other Sessions", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        if (headerAlpha > 0f) {
            DashboardStickyHeader(
                title = "Manage Sessions",
                headerAlpha = headerAlpha,
                headerSlide = headerSlide,
                onNotificationClick = onNotificationClick
            )
        }
    }
}

@Composable
fun CoursesTabContent() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(
                        androidx.compose.ui.graphics.Brush.linearGradient(
                            listOf(Color(0xFF6366F1), Color(0xFFA855F7))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_courses),
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(42.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Courses",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Coming Soon",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchTabContent(
    sessionManager: SessionManager,
    onTabSelect: (String) -> Unit,
    onDocSelect: (String, String) -> Unit,
    onShowLibrary: (() -> Unit)?,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<SearchUserResponse>>(emptyList()) }
    var backendSearchResults by remember { mutableStateOf<List<SearchBackendResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var activeFilter by remember { mutableStateOf("All") }
    var selectedDoc by remember { mutableStateOf<HelpDoc?>(null) }
    var selectedUserDetail by remember { mutableStateOf<SearchUserResponse?>(null) }

    val role = remember { sessionManager.getRole() ?: "student" }

    // Pages configuration based on user role
    val pages = remember(role) {
        buildList {
            add(SearchPageItem("Home Dashboard", "home", "Access stats, slider updates & shortcuts", Icons.Default.Home))
            add(SearchPageItem("Notice Board", "notice", "Read school announcements and notice feed", Icons.Default.Info))
            if (role.equals("student", ignoreCase = true)) {
                add(SearchPageItem("Pay Fees Online", "fees", "Manage dues, verify receipts & pay via Razorpay", Icons.Default.Info))
                if (onShowLibrary != null) {
                    add(SearchPageItem("Library Hub", "library", "Browse catalog, issue details & manage book returns", Icons.Default.Info, isExternal = true, externalAction = onShowLibrary))
                }
            } else {
                add(SearchPageItem("Community Hub", "community", "Post updates, interact & discuss academic topics", Icons.Default.Share))
            }
            add(SearchPageItem("My Profile Settings", "profile", "Control theme preferences & view session logs", Icons.Default.Person))
        }
    }

    // Debounced query execution to backend
    LaunchedEffect(searchQuery) {
        if (searchQuery.isBlank()) {
            searchResults = emptyList()
            backendSearchResults = emptyList()
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        try {
            val token = sessionManager.getSessionToken() ?: ""
            val authHeader = "Bearer $token"
            val username = sessionManager.getUsername() ?: ""

            val response = RetrofitClient.authApi.searchUsers(authHeader, searchQuery)
            if (response.isSuccessful) {
                searchResults = response.body() ?: emptyList()
            }

            val backendResponse = RetrofitClient.authApi.searchBackend(searchQuery, role, username)
            if (backendResponse.isSuccessful) {
                backendSearchResults = backendResponse.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("SearchTab", "Backend search error: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    val filteredPages = remember(searchQuery, backendSearchResults, pages) {
        if (searchQuery.isBlank()) {
            pages
        } else {
            backendSearchResults
                .filter { !it.url.contains("/docs/") && !it.url.contains("privacy-policy") && !it.url.contains("terms-of-service") }
                .map { item ->
                    val tabKey = when {
                        item.url.contains("/student/fees", ignoreCase = true) || item.url.endsWith("/fees", ignoreCase = true) -> "fees"
                        item.url.contains("/student/notice", ignoreCase = true) || item.url.endsWith("/notice", ignoreCase = true) -> "notice"
                        item.url.contains("/community", ignoreCase = true) -> "community"
                        item.url.contains("/student/library", ignoreCase = true) || item.url.endsWith("/library", ignoreCase = true) -> "library"
                        item.url.contains("/student/profile", ignoreCase = true) || item.url.endsWith("/profile", ignoreCase = true) -> "profile"
                        item.url.contains("/student/", ignoreCase = true) || item.url.endsWith("/student", ignoreCase = true) -> "home"
                        else -> "home"
                    }
                    val icon = when {
                        item.url.contains("/fees", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/library", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/community", ignoreCase = true) -> Icons.Default.Share
                        item.url.contains("/notice", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/profile", ignoreCase = true) -> Icons.Default.Person
                        else -> Icons.Default.Home
                    }
                    val isExternal = tabKey == "library"
                    SearchPageItem(
                        name = item.title,
                        tabKey = tabKey,
                        description = item.content,
                        icon = icon,
                        isExternal = isExternal,
                        externalAction = if (isExternal) onShowLibrary else null
                    )
                }
        }
    }

    val filteredDocs = remember(searchQuery, backendSearchResults) {
        if (searchQuery.isBlank()) {
            helpDocs
        } else {
            backendSearchResults
                .filter { it.url.contains("/docs/") || it.url.contains("privacy-policy") || it.url.contains("terms-of-service") }
                .map { item ->
                    HelpDoc(
                        title = item.title,
                        category = if (item.url.contains("privacy-policy") || item.url.contains("terms-of-service")) "Legal" else "Docs",
                        content = item.content,
                        url = item.url
                    )
                }
        }
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
        ) {
            // Search Header container matching Web App CustomSearchDialog UI
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 4.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f))
                    .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 11.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_custom_search),
                            contentDescription = "Search",
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.65f)
                        )
                        Box(modifier = Modifier.weight(1f)) {
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = "Quick Search",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f)
                                )
                            }
                            androidx.compose.foundation.text.BasicTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onBackground
                                ),
                                cursorBrush = androidx.compose.ui.graphics.SolidColor(if (isSystemInDarkTheme()) Color.White else Color.Black),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }

                    if (searchQuery.isNotEmpty()) {
                        IconButton(
                            onClick = { searchQuery = "" },
                            modifier = Modifier.size(20.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Clear",
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.07f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "⌘F",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f)
                            )
                        }
                    }
                }
            }

            if (isLoading) {
                Text(
                    text = "Searching in pages & docs...",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF3B82F6),
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Shadcn filter tabs/pills
            val isDark = isSystemInDarkTheme()
            val selectedBg = if (isDark) Color.White else Color.Black
            val selectedText = if (isDark) Color.Black else Color.White
            val unselectedBg = Color.Transparent
            val unselectedBorder = if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.08f)
            val unselectedText = if (isDark) Color.White.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.6f)

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Pages", "Users", "Docs").forEach { filter ->
                    val isSelected = activeFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) selectedBg else unselectedBg)
                            .border(
                                1.dp,
                                if (isSelected) Color.Transparent else unselectedBorder,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { activeFilter = filter }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = filter,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) selectedText else unselectedText
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(strokeWidth = 2.5.dp, modifier = Modifier.size(36.dp))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 20.dp)
                ) {
                    // 1. Pages Section
                    if (activeFilter == "All" || activeFilter == "Pages") {
                        if (filteredPages.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Pages & Features")
                            }
                            items(filteredPages.size) { idx ->
                                val item = filteredPages[idx]
                                SearchResultRow(
                                    title = item.name,
                                    subtitle = item.description,
                                    icon = item.icon,
                                    category = "Page",
                                    onClick = {
                                        if (item.isExternal) {
                                            item.externalAction?.invoke()
                                        } else {
                                            onTabSelect(item.tabKey)
                                        }
                                    }
                                )
                            }
                        }
                    }

                    // 2. Users Section (Backend results)
                    if (activeFilter == "All" || activeFilter == "Users") {
                        if (searchResults.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Users (${searchResults.size})")
                            }
                            items(searchResults.size) { idx ->
                                val user = searchResults[idx]
                                SearchResultRow(
                                    title = user.name,
                                    subtitle = "@${user.username}",
                                    icon = Icons.Default.Person,
                                    category = user.role.uppercase(),
                                    onClick = { selectedUserDetail = user }
                                )
                            }
                        } else if (searchQuery.isNotEmpty() && activeFilter == "Users") {
                            item {
                                Text(
                                    text = "No matching users found in school database",
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                                    fontSize = 14.sp,
                                    modifier = Modifier.padding(vertical = 12.dp)
                                )
                            }
                        }
                    }

                    // 3. Documentation Section
                    if (activeFilter == "All" || activeFilter == "Docs") {
                        if (filteredDocs.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Documentation & Help")
                            }
                            items(filteredDocs.size) { idx ->
                                val doc = filteredDocs[idx]
                                SearchResultRow(
                                    title = doc.title,
                                    subtitle = doc.content,
                                    icon = Icons.Default.Info,
                                    category = doc.category,
                                    onClick = {
                                        val targetUrl = doc.url ?: when (doc.title) {
                                            "Library Policies & Fines" -> "/docs/student/library"
                                            "Late Fee Structure & Penalty" -> "/docs/student/fees"
                                            "How to Post in Community" -> "/docs/student/complaints"
                                            "Contacting Accounts Office" -> "/docs/student/fees"
                                            "Student ID Card Reissue Policy" -> "/docs/student/onboarding"
                                            else -> "/docs/student/onboarding"
                                        }
                                        onDocSelect(targetUrl, doc.content)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Help Doc overlay dialog (Shadcn styling)
    if (selectedDoc != null) {
        val doc = selectedDoc!!
        AlertDialog(
            onDismissRequest = { selectedDoc = null },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
            containerColor = MaterialTheme.colorScheme.background,
            title = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(doc.title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                        Box(
                            modifier = Modifier
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(doc.category.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                }
            },
            text = {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    Text(
                        doc.content,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        lineHeight = 22.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedDoc = null },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp)
                ) {
                    Text("Done", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // User details details dialog
    if (selectedUserDetail != null) {
        val user = selectedUserDetail!!
        AlertDialog(
            onDismissRequest = { selectedUserDetail = null },
            modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
            containerColor = MaterialTheme.colorScheme.background,
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(user.name.firstOrNull()?.uppercase() ?: "?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(user.name, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("@${user.username}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Institution Role", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text(user.role.uppercase(), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Session Authority", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text("Verified Member", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF10B981))
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedUserDetail = null },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Close", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}

@Composable
fun SearchGroupHeader(title: String) {
    Text(
        text = title.uppercase(),
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
        modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
    )
}

@Composable
fun SearchResultRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    category: String,
    onClick: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (subtitle.isNotEmpty()) {
                Text(
                    text = subtitle,
                    fontSize = 11.5.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Box(
            modifier = Modifier
                .border(
                    1.dp,
                    if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.08f),
                    RoundedCornerShape(4.dp)
                )
                .background(
                    if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.03f),
                    RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(
                text = category.uppercase(),
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileTabContent(
    sessionManager: SessionManager,
    role: String,
    provider: String,
    email: String,
    name: String,
    avatarUrl: String?,
    username: String,
    onUpdateUsername: (String) -> Unit,
    themeMode: String,
    onThemeChange: (String) -> Unit,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onNotificationClick: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    var isEditing by remember { mutableStateOf(false) }
    var tempUsername by remember { mutableStateOf(username) }

    var activeSection by remember { mutableStateOf<String?>(null) }
    var userProfile by remember { mutableStateOf<UserProfileData?>(null) }
    var isLoadingProfile by remember { mutableStateOf(false) }
    var isLoadingSection by remember { mutableStateOf(false) }
    var showUserAccountDrawer by remember { mutableStateOf(false) }
    var showAvatarUploadDrawer by remember { mutableStateOf(false) }

    // Editable state fields
    var editPhoneNumber by remember { mutableStateOf("") }
    var editAddress by remember { mutableStateOf("") }
    var editCity by remember { mutableStateOf("") }
    var editState by remember { mutableStateOf("") }
    var editPincode by remember { mutableStateOf("") }
    
    var editParentName by remember { mutableStateOf("") }
    var editParentPhone by remember { mutableStateOf("") }
    var editParentEmail by remember { mutableStateOf("") }

    // Document Upload Manager state
    var userDocuments by remember { mutableStateOf<Map<String, com.vidyaschool.app.api.UserDocumentItem>>(emptyMap()) }
    var isDocumentsLoading by remember { mutableStateOf(false) }
    var activeUploadSlotType by remember { mutableStateOf<String?>(null) }
    var activeUploadSlotTitle by remember { mutableStateOf<String?>(null) }
    var previewDocUrl by remember { mutableStateOf<String?>(null) }
    var previewDocName by remember { mutableStateOf<String?>(null) }

    fun fetchDocumentsList() {
        coroutineScope.launch {
            isDocumentsLoading = true
            try {
                val token = sessionManager.getSessionToken() ?: ""
                var res = RetrofitClient.frontendApi.getDocuments("Bearer $token")
                if (!res.isSuccessful || res.body() == null) {
                    res = RetrofitClient.authApi.getDocuments("Bearer $token")
                }
                if (res.isSuccessful && res.body() != null) {
                    userDocuments = res.body()!!.associateBy { it.docType }
                }
            } catch (e: Exception) {
                android.util.Log.e("ProfileTab", "Error fetching documents: ${e.message}")
            } finally {
                isDocumentsLoading = false
            }
        }
    }

    fun uploadDocumentUri(uri: Uri, docType: String, docName: String) {
        coroutineScope.launch {
            isDocumentsLoading = true
            try {
                val token = sessionManager.getSessionToken() ?: ""
                val contentResolver = context.contentResolver
                val mimeType = contentResolver.getType(uri) ?: "application/pdf"
                
                var fileName = "$docType.pdf"
                val cursor = contentResolver.query(uri, null, null, null, null)
                cursor?.use {
                    if (it.moveToFirst()) {
                        val nameIdx = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (nameIdx >= 0) {
                            fileName = it.getString(nameIdx) ?: fileName
                        }
                    }
                }

                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                if (bytes == null || bytes.isEmpty()) {
                    android.widget.Toast.makeText(context, "Could not read file", android.widget.Toast.LENGTH_SHORT).show()
                    isDocumentsLoading = false
                    return@launch
                }

                if (bytes.size > 10 * 1024 * 1024) {
                    android.widget.Toast.makeText(context, "File size must be under 10MB", android.widget.Toast.LENGTH_SHORT).show()
                    isDocumentsLoading = false
                    return@launch
                }

                val mediaType = mimeType.toMediaTypeOrNull()
                val requestFile = bytes.toRequestBody(mediaType)
                val bodyPart = MultipartBody.Part.createFormData("file", fileName, requestFile)
                val docTypePart = MultipartBody.Part.createFormData("docType", docType)
                val docNamePart = MultipartBody.Part.createFormData("docName", docName)

                var res = RetrofitClient.frontendApi.uploadDocumentFile("Bearer $token", bodyPart, docTypePart, docNamePart)
                if (!res.isSuccessful) {
                    res = RetrofitClient.authApi.uploadDocumentFile("Bearer $token", bodyPart, docTypePart, docNamePart)
                }
                if (res.isSuccessful) {
                    android.widget.Toast.makeText(context, "$docName uploaded successfully!", android.widget.Toast.LENGTH_SHORT).show()
                    fetchDocumentsList()
                } else {
                    val errBody = res.errorBody()?.string() ?: ""
                    android.util.Log.e("ProfileTab", "Upload failed (${res.code()}): $errBody")
                    android.widget.Toast.makeText(context, "Upload failed: ${res.message()}", android.widget.Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Upload error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            } finally {
                isDocumentsLoading = false
            }
        }
    }

    fun deleteDocumentItem(docType: String, docName: String) {
        coroutineScope.launch {
            isDocumentsLoading = true
            try {
                val token = sessionManager.getSessionToken() ?: ""
                var res = RetrofitClient.frontendApi.deleteDocument("Bearer $token", docType)
                if (!res.isSuccessful) {
                    res = RetrofitClient.authApi.deleteDocument("Bearer $token", docType)
                }
                if (res.isSuccessful) {
                    android.widget.Toast.makeText(context, "$docName removed", android.widget.Toast.LENGTH_SHORT).show()
                    fetchDocumentsList()
                } else {
                    android.widget.Toast.makeText(context, "Failed to delete document", android.widget.Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Delete error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            } finally {
                isDocumentsLoading = false
            }
        }
    }

    val documentPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null && activeUploadSlotType != null && activeUploadSlotTitle != null) {
            uploadDocumentUri(uri, activeUploadSlotType!!, activeUploadSlotTitle!!)
        }
    }
    
    var editClass by remember { mutableStateOf("") }
    var editSection by remember { mutableStateOf("") }

    LaunchedEffect(username) {
        tempUsername = username
    }

    fun fetchSectionProfile(sec: String) {
        coroutineScope.launch {
            isLoadingSection = true
            try {
                val token = sessionManager.getSessionToken() ?: ""
                val res = RetrofitClient.authApi.getProfile("Bearer $token", section = sec)
                if (res.isSuccessful && res.body() != null) {
                    val profileData = res.body()?.profile
                    userProfile = profileData
                    if (profileData != null) {
                        when (sec) {
                            "personal" -> {
                                tempUsername = profileData.username ?: username
                                editPhoneNumber = profileData.phoneNumber ?: ""
                                editClass = profileData.`class` ?: ""
                                editSection = profileData.section ?: ""
                            }
                            "parent" -> {
                                editParentName = profileData.parentName ?: ""
                                editParentPhone = profileData.parentPhone ?: ""
                                editParentEmail = profileData.parentEmail ?: ""
                            }
                            "address" -> {
                                editAddress = profileData.address ?: ""
                                editCity = profileData.city ?: ""
                                editState = profileData.state ?: ""
                                editPincode = profileData.pincode ?: ""
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("ProfileTab", "Error fetching section profile: ${e.message}")
            } finally {
                isLoadingSection = false
            }
        }
    }

    fun saveSectionSettings(sec: String) {
        coroutineScope.launch {
            try {
                val token = sessionManager.getSessionToken() ?: ""
                val req = com.vidyaschool.app.api.ProfileUpdateRequest(
                    username = if (sec == "personal") tempUsername else null,
                    phoneNumber = if (sec == "personal") editPhoneNumber else null,
                    address = if (sec == "address") editAddress else null,
                    city = if (sec == "address") editCity else null,
                    state = if (sec == "address") editState else null,
                    pincode = if (sec == "address") editPincode else null,
                    parentName = if (sec == "parent" && role.equals("student", ignoreCase = true)) editParentName else null,
                    parentPhone = if (sec == "parent" && role.equals("student", ignoreCase = true)) editParentPhone else null,
                    parentEmail = if (sec == "parent" && role.equals("student", ignoreCase = true)) editParentEmail else null,
                    class_ = if (sec == "personal") editClass.takeIf { it.isNotEmpty() && it != "none" } else null,
                    section = if (sec == "personal") editSection.takeIf { it.isNotEmpty() && it != "none" } else null
                )
                val res = RetrofitClient.authApi.updateProfile("Bearer $token", req)
                if (res.isSuccessful) {
                    android.widget.Toast.makeText(context, "Saved successfully!", android.widget.Toast.LENGTH_SHORT).show()
                    if (sec == "personal" && tempUsername.isNotEmpty()) {
                        onUpdateUsername(tempUsername)
                    }
                    activeSection = null
                } else {
                    android.widget.Toast.makeText(context, "Failed to update section", android.widget.Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun openSection(sec: String) {
        activeSection = sec
        if (sec in listOf("personal", "parent", "address")) {
            fetchSectionProfile(sec)
        } else if (sec == "documents") {
            fetchDocumentsList()
        }
    }

    LaunchedEffect(Unit) {
        fetchSectionProfile("personal")
    }

    LaunchedEffect(isRefreshing) {
        if (isRefreshing) {
            fetchSectionProfile("personal")
        }
    }

    val scrollState = rememberScrollState()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerAlpha"
    )
    val headerSlide by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerSlide"
    )

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                DashboardHeader(
                    title = "My Profile",
                    subtitle = "${role.lowercase().replaceFirstChar { it.uppercase() }} Account Settings",
                    onNotificationClick = onNotificationClick
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                // Top Profile User Info: Transparent Column (No BG Card), Bigger Square Avatar & Green Status Dot
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Square Avatar (116dp Big with 22dp Rounded Border & Green Status Indicator)
                    Box(
                        modifier = Modifier
                            .size(116.dp)
                            .clickable { showAvatarUploadDrawer = true }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(RoundedCornerShape(22.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!avatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = avatarUrl,
                                    contentDescription = "Avatar",
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(MaterialTheme.colorScheme.primary),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = name.firstOrNull()?.uppercase() ?: "?",
                                        fontSize = 40.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                }
                            }
                        }

                        // Green Dot in Bottom Right Corner of Avatar
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .align(Alignment.BottomEnd)
                                .offset(x = 4.dp, y = 4.dp)
                                .background(Color(0xFF22C55E), CircleShape)
                                .border(2.5.dp, MaterialTheme.colorScheme.background, CircleShape)
                        )
                    }

                    // Student Name just below Avatar with Expand Combobox Button on right (Matching Button Text Style: 14sp Medium)
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { showUserAccountDrawer = true }
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Icon(
                            painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_chevrons_up_down),
                            contentDescription = "Expand Account Info",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                    }
                }

                Text(
                    text = "ACCOUNT & DETAILS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                )

                // Option Buttons List using Solar vector icons matching Sidebar style
                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_user,
                    title = "Personal Details",
                    onClick = { openSection("personal") }
                )

                if (role.equals("student", ignoreCase = true)) {
                    ProfileOptionRow(
                        iconRes = com.vidyaschool.app.R.drawable.ic_solar_parent,
                        title = "Parent / Guardian Details",
                        onClick = { openSection("parent") }
                    )
                }

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_address,
                    title = "Address Details",
                    onClick = { openSection("address") }
                )

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_document,
                    title = "Documents",
                    onClick = { openSection("documents") }
                )

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_appearance,
                    title = "Appearance",
                    onClick = { openSection("appearance") }
                )

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_trash,
                    title = "Clear App Cache",
                    onClick = {
                        try {
                            context.cacheDir.deleteRecursively()
                            android.widget.Toast.makeText(context, "App cache cleared successfully!", android.widget.Toast.LENGTH_SHORT).show()
                        } catch (e: Exception) {
                            android.widget.Toast.makeText(context, "Cache cleared", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                )

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_info,
                    title = "Version & Build",
                    onClick = { openSection("version") }
                )

                ProfileOptionRow(
                    iconRes = com.vidyaschool.app.R.drawable.ic_solar_logout,
                    title = "Log Out",
                    isDanger = true,
                    onClick = onLogout
                )
                }
            }
        }

    // Expandable Bottom Sheet Drawer for Details
    if (activeSection != null) {
        val sec = activeSection!!
        val sheetState = rememberModalBottomSheetState(
            skipPartiallyExpanded = false
        )
        val drawerScrollState = rememberScrollState()

        // Expand to full screen when user scrolls inside the drawer
        LaunchedEffect(drawerScrollState) {
            snapshotFlow { drawerScrollState.value > 0 }
                .collect { hasScrolled ->
                    if (hasScrolled && sheetState.currentValue != SheetValue.Expanded) {
                        sheetState.expand()
                    }
                }
        }

        val isExpanded = sheetState.currentValue == SheetValue.Expanded || sheetState.targetValue == SheetValue.Expanded
        val dragHandleAlpha by animateFloatAsState(
            targetValue = if (isExpanded) 0f else 1f,
            animationSpec = tween(durationMillis = 300),
            label = "dragHandleAlpha"
        )
        val topPaddingDp by animateDpAsState(
            targetValue = if (isExpanded) 52.dp else 12.dp,
            animationSpec = tween(durationMillis = 300),
            label = "topPaddingDp"
        )

        ModalBottomSheet(
            onDismissRequest = { activeSection = null },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            scrimColor = Color.Black.copy(alpha = 0.5f),
            dragHandle = {
                if (dragHandleAlpha > 0.01f) {
                    Box(modifier = Modifier.graphicsLayer { alpha = dragHandleAlpha }) {
                        BottomSheetDefaults.DragHandle()
                    }
                }
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight()
                    .padding(
                        start = 20.dp,
                        end = 20.dp,
                        top = topPaddingDp,
                        bottom = 8.dp
                    )
            ) {
                // Drawer Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = when (sec) {
                            "personal" -> "Personal Details"
                            "parent" -> "Parent Details"
                            "address" -> "Address Details"
                            "documents" -> "Documents"
                            "appearance" -> "Appearance"
                            "version" -> "App Version & Info"
                            else -> "Details"
                        },
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (sec in listOf("personal", "parent", "address")) {
                        Button(
                            onClick = {
                                saveSectionSettings(sec)
                                coroutineScope.launch { sheetState.hide() }.invokeOnCompletion {
                                    activeSection = null
                                }
                            },
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp),
                            modifier = Modifier.height(30.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text("Save", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (isLoadingSection) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.5.dp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .verticalScroll(drawerScrollState),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        when (sec) {
                            "personal" -> {
                                Input(value = tempUsername, onValueChange = { tempUsername = it }, label = "Username", placeholder = "e.g. jondoe")
                                Input(value = editPhoneNumber, onValueChange = { editPhoneNumber = it }, label = "Phone Number", placeholder = "e.g. 9876543210")
                                Select(
                                    selectedValue = editClass.ifBlank { "none" },
                                    onValueChange = { editClass = it },
                                    options = listOf(SelectOption("none", "Not assigned")) +
                                            listOf("Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12").map { c ->
                                                SelectOption(value = c, label = if (c == "Nursery" || c == "KG") c else "Class $c")
                                            },
                                    label = "Class", placeholder = "Select class"
                                )
                                Select(
                                    selectedValue = editSection.ifBlank { "none" },
                                    onValueChange = { editSection = it },
                                    options = listOf(SelectOption("none", "Not assigned")) + listOf("A", "B", "C", "D", "E", "F").map { SelectOption(it, it) },
                                    label = "Section", placeholder = "Select section"
                                )
                            }
                            "parent" -> {
                                Input(value = editParentName, onValueChange = { editParentName = it }, label = "Parent Name", placeholder = "e.g. Rajesh Kumar")
                                Input(value = editParentPhone, onValueChange = { editParentPhone = it }, label = "Parent Phone", placeholder = "e.g. 9876543210")
                                Input(value = editParentEmail, onValueChange = { editParentEmail = it }, label = "Parent Email", placeholder = "e.g. parent@email.com")
                            }
                            "address" -> {
                                Input(value = editAddress, onValueChange = { editAddress = it }, label = "Street Address", placeholder = "e.g. 42 MG Road")
                                Input(value = editCity, onValueChange = { editCity = it }, label = "City", placeholder = "e.g. Delhi")
                                Input(value = editState, onValueChange = { editState = it }, label = "State", placeholder = "e.g. Delhi")
                                Input(value = editPincode, onValueChange = { editPincode = it }, label = "Pincode", placeholder = "e.g. 110001")
                            }
                             "documents" -> {
                                data class DocSlot(
                                    val type: String,
                                    val title: String,
                                    val description: String,
                                    val required: Boolean
                                )

                                val slots = listOf(
                                    DocSlot("10th_certificate", "10th Certificate", "Class 10th passing certificate or official board marksheet (PDF or Image)", true),
                                    DocSlot("student_aadhar", "Student Aadhar Card", "Student's Aadhaar identification card front & back scan (PDF or Image)", true),
                                    DocSlot("parent_aadhar", "Parent Aadhar Card", "Father/Mother/Guardian Aadhaar identification card scan (PDF or Image)", true),
                                    DocSlot("birth_certificate", "Birth Certificate", "Official municipal birth registration certificate (PDF or Image)", true),
                                    DocSlot("parent_pan", "Parent PAN Card", "Father/Mother/Guardian Permanent Account Number (PAN) card (PDF or Image)", false)
                                )

                                val uploadedCount = slots.count { slot ->
                                    userDocuments.containsKey(slot.type) ||
                                    (slot.type == "10th_certificate" && (userDocuments.containsKey("marksheet_10") || userDocuments.containsKey("10th_marksheet"))) ||
                                    (slot.type == "student_aadhar" && userDocuments.containsKey("aadhar"))
                                }
                                val totalCount = slots.size
                                val progressFraction = uploadedCount.toFloat() / totalCount

                                // Summary Card
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), RoundedCornerShape(14.dp)),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Required Profile Documents",
                                                    fontSize = 15.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                                Text(
                                                    text = "Upload clear PDF documents or scanned images (JPEG, PNG up to 10MB).",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                                                )
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .background(
                                                        if (uploadedCount == totalCount) Color(0xFF22C55E).copy(alpha = 0.15f)
                                                        else MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                                        RoundedCornerShape(100.dp)
                                                    )
                                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = "$uploadedCount of $totalCount Uploaded",
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (uploadedCount == totalCount) Color(0xFF22C55E) else MaterialTheme.colorScheme.primary
                                                )
                                            }
                                        }

                                        // Progress Bar
                                        LinearProgressIndicator(
                                            progress = { progressFraction },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(6.dp)
                                                .clip(RoundedCornerShape(100.dp)),
                                            color = MaterialTheme.colorScheme.primary,
                                            trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Document Slots List
                                slots.forEach { slot ->
                                    val uploadedDoc = userDocuments[slot.type]
                                        ?: if (slot.type == "10th_certificate") (userDocuments["marksheet_10"] ?: userDocuments["10th_marksheet"])
                                        else if (slot.type == "student_aadhar") (userDocuments["aadhar"] ?: userDocuments["student_aadhar"])
                                        else null

                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .border(
                                                1.dp,
                                                if (uploadedDoc != null) Color(0xFF22C55E).copy(alpha = 0.4f)
                                                else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f),
                                                RoundedCornerShape(14.dp)
                                            ),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(16.dp),
                                            verticalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            // Title + Required/Uploaded Badge Row
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.Top
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(36.dp)
                                                            .background(
                                                                if (uploadedDoc != null) Color(0xFF22C55E).copy(alpha = 0.12f)
                                                                else MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                                                RoundedCornerShape(10.dp)
                                                            ),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Icon(
                                                            painter = painterResource(
                                                                id = if (uploadedDoc != null) com.vidyaschool.app.R.drawable.ic_solar_check_circle
                                                                else com.vidyaschool.app.R.drawable.ic_solar_document
                                                            ),
                                                            contentDescription = null,
                                                            modifier = Modifier.size(20.dp),
                                                            tint = if (uploadedDoc != null) Color(0xFF22C55E) else MaterialTheme.colorScheme.primary
                                                        )
                                                    }

                                                    Column {
                                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                            Text(
                                                                text = slot.title,
                                                                fontSize = 14.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = MaterialTheme.colorScheme.onSurface
                                                            )
                                                            if (slot.required) {
                                                                Box(
                                                                    modifier = Modifier
                                                                        .background(MaterialTheme.colorScheme.error.copy(alpha = 0.12f), RoundedCornerShape(4.dp))
                                                                        .padding(horizontal = 6.dp, vertical = 1.dp)
                                                                ) {
                                                                    Text(
                                                                        text = "Required",
                                                                        fontSize = 9.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = MaterialTheme.colorScheme.error
                                                                    )
                                                                }
                                                            }
                                                        }
                                                        Text(
                                                            text = slot.description,
                                                            fontSize = 11.sp,
                                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                                            maxLines = 2
                                                        )
                                                    }
                                                }

                                                Box(
                                                    modifier = Modifier
                                                        .background(
                                                            if (uploadedDoc != null) Color(0xFF22C55E).copy(alpha = 0.15f)
                                                            else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
                                                            RoundedCornerShape(6.dp)
                                                        )
                                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                                ) {
                                                    Text(
                                                        text = if (uploadedDoc != null) "Uploaded ✓" else "Pending",
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (uploadedDoc != null) Color(0xFF22C55E) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                                    )
                                                }
                                            }

                                            // If Uploaded: File Details & Action Buttons
                                            if (uploadedDoc != null) {
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.04f), RoundedCornerShape(10.dp))
                                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = uploadedDoc.fileName ?: "${slot.title}.pdf",
                                                            fontSize = 12.sp,
                                                            fontWeight = FontWeight.SemiBold,
                                                            color = MaterialTheme.colorScheme.onSurface,
                                                            maxLines = 1,
                                                            overflow = TextOverflow.Ellipsis
                                                        )
                                                        Text(
                                                            text = if (uploadedDoc.fileType?.contains("pdf", ignoreCase = true) == true) "PDF Document" else "Image File",
                                                            fontSize = 10.sp,
                                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f)
                                                        )
                                                    }

                                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                        // View / Preview Button
                                                        if (!uploadedDoc.fileUrl.isNullOrEmpty()) {
                                                            IconButton(
                                                                onClick = {
                                                                    previewDocUrl = uploadedDoc.fileUrl
                                                                    previewDocName = slot.title
                                                                },
                                                                modifier = Modifier.size(32.dp)
                                                            ) {
                                                                Icon(
                                                                    painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_info),
                                                                    contentDescription = "View",
                                                                    modifier = Modifier.size(16.dp),
                                                                    tint = MaterialTheme.colorScheme.primary
                                                                )
                                                            }
                                                        }

                                                        // Replace Button
                                                        IconButton(
                                                            onClick = {
                                                                activeUploadSlotType = slot.type
                                                                activeUploadSlotTitle = slot.title
                                                                documentPickerLauncher.launch("*/*")
                                                            },
                                                            modifier = Modifier.size(32.dp)
                                                        ) {
                                                            Icon(
                                                                imageVector = Icons.Default.Edit,
                                                                contentDescription = "Replace",
                                                                modifier = Modifier.size(16.dp),
                                                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                                            )
                                                        }

                                                        // Delete Button
                                                        IconButton(
                                                            onClick = {
                                                                deleteDocumentItem(slot.type, slot.title)
                                                            },
                                                            modifier = Modifier.size(32.dp)
                                                        ) {
                                                            Icon(
                                                                painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_trash),
                                                                contentDescription = "Delete",
                                                                modifier = Modifier.size(16.dp),
                                                                tint = MaterialTheme.colorScheme.error
                                                            )
                                                        }
                                                    }
                                                }
                                            } else {
                                                // Upload Button
                                                OutlinedButton(
                                                    onClick = {
                                                        activeUploadSlotType = slot.type
                                                        activeUploadSlotTitle = slot.title
                                                        documentPickerLauncher.launch("*/*")
                                                    },
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(44.dp),
                                                    shape = RoundedCornerShape(10.dp),
                                                    colors = ButtonDefaults.outlinedButtonColors(
                                                        contentColor = MaterialTheme.colorScheme.primary
                                                    )
                                                ) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                    ) {
                                                        Icon(
                                                            painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_gallery),
                                                            contentDescription = null,
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                        Text(
                                                            text = "Upload ${slot.title}",
                                                            fontSize = 12.sp,
                                                            fontWeight = FontWeight.SemiBold
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            "appearance" -> {
                                Text("Select Theme", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                listOf("system" to "System Default", "light" to "Light Mode", "dark" to "Dark Mode").forEach { (valKey, label) ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (themeMode == valKey) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface)
                                            .border(1.dp, if (themeMode == valKey) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                            .clickable { onThemeChange(valKey) }
                                            .padding(16.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                                        if (themeMode == valKey) {
                                            Icon(
                                                painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_check_circle),
                                                contentDescription = "Selected",
                                                modifier = Modifier.size(20.dp),
                                                tint = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                }
                            }
                            "version" -> {
                                ProfileDetailRow(label = "App Name", value = "VidyaSchool Portal")
                                ProfileDetailRow(label = "Version", value = "2.4.0")
                                ProfileDetailRow(label = "Build Number", value = "42")
                                ProfileDetailRow(label = "Environment", value = "Production")
                                ProfileDetailRow(label = "Status", value = "Up to date ✓")
                            }
                        }
                    }
                }
            }
        }
    }

    // Account Info Drawer when clicking Name
    if (showUserAccountDrawer) {
        val accountSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showUserAccountDrawer = false },
            sheetState = accountSheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            scrimColor = Color.Black.copy(alpha = 0.5f),
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Account Information",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                ProfileDetailRow(label = "Name", value = name.ifEmpty { "N/A" })
                ProfileDetailRow(label = "Role", value = role.uppercase())
                ProfileDetailRow(label = "Email", value = email.ifEmpty { "N/A" })
                ProfileDetailRow(label = "Provider", value = provider.ifEmpty { "Email/Password" })
            }
        }
    }

    // Avatar Image Upload Drawer
    if (showAvatarUploadDrawer) {
        val avatarSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showAvatarUploadDrawer = false },
            sheetState = avatarSheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            scrimColor = Color.Black.copy(alpha = 0.5f),
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Update Profile Picture",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Button 1: Take a Pic
                    OutlinedButton(
                        onClick = {
                            showAvatarUploadDrawer = false
                            android.widget.Toast.makeText(context, "Opening Camera...", android.widget.Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_camera),
                                contentDescription = "Take a Pic",
                                modifier = Modifier.size(22.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Take a Pic",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    // Button 2: Upload from Gallery
                    Button(
                        onClick = {
                            showAvatarUploadDrawer = false
                            android.widget.Toast.makeText(context, "Opening Gallery...", android.widget.Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_gallery),
                                contentDescription = "Upload from Gallery",
                                modifier = Modifier.size(22.dp),
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                            Text(
                                text = "Upload from Gallery",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                    }
                }
            }
        }
    }

    // Document Preview Dialog Modal
    if (previewDocUrl != null) {
        androidx.compose.ui.window.Dialog(
            onDismissRequest = { previewDocUrl = null },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = previewDocName ?: "Document Preview",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        IconButton(onClick = { previewDocUrl = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onSurface)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surface),
                        contentAlignment = Alignment.Center
                    ) {
                        if (previewDocUrl!!.endsWith(".pdf", ignoreCase = true) || previewDocUrl!!.contains(".pdf", ignoreCase = true)) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = com.vidyaschool.app.R.drawable.ic_solar_document),
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "PDF Document",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Button(
                                    onClick = {
                                        try {
                                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(previewDocUrl))
                                            context.startActivity(intent)
                                        } catch (e: Exception) {
                                            android.widget.Toast.makeText(context, "Cannot open PDF viewer", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Open PDF File", fontSize = 13.sp)
                                }
                            }
                        } else {
                            AsyncImage(
                                model = previewDocUrl,
                                contentDescription = "Document Preview",
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            }
        }
    }

    if (headerAlpha > 0f) {
        DashboardStickyHeader(
            title = "My Profile",
            headerAlpha = headerAlpha,
            headerSlide = headerSlide,
            onNotificationClick = onNotificationClick
        )
    }
}
}

@Composable
fun ProfileOptionRow(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    iconRes: Int? = null,
    subtitle: String? = null,
    badgeText: String? = null,
    isDanger: Boolean = false,
    onClick: () -> Unit
) {
    val textColor = when {
        isDanger -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.onBackground.copy(alpha = 0.75f)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 2.dp, vertical = 2.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 12.dp)
            .height(44.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        if (iconRes != null) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = title,
                modifier = Modifier.size(18.dp),
                tint = textColor
            )
        } else if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                modifier = Modifier.size(18.dp),
                tint = textColor
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = textColor
            )
            if (!subtitle.isNullOrEmpty()) {
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        if (badgeText != null) {
            Box(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f), RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = badgeText,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = "Open",
            modifier = Modifier.size(18.dp),
            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f)
        )
    }
}

// Search local page item model
data class SearchPageItem(
    val name: String,
    val tabKey: String,
    val description: String,
    val icon: ImageVector,
    val isExternal: Boolean = false,
    val externalAction: (() -> Unit)? = null
)

// Help Document model
data class HelpDoc(
    val title: String,
    val category: String,
    val content: String,
    val url: String? = null
)

val helpDocs = listOf(
    HelpDoc(
        title = "Library Policies & Fines",
        category = "Library",
        content = "1. Books can be issued for a maximum of 14 days.\n2. A fine of $0.50 per day will be charged for late returns.\n3. Damaged or lost books must be replaced or paid for at double the cost.\n4. Silent study rules must be maintained in the library at all times.",
        url = "/docs/student/library"
    ),
    HelpDoc(
        title = "Late Fee Structure & Penalty",
        category = "Finance",
        content = "1. Monthly school fees must be paid by the 5th of each month.\n2. A grace period is extended until the 10th of the month.\n3. Payments made after the 10th will incur a late fee penalty of 5% of the pending amount.\n4. Continuous non-payment for 2 months may lead to suspension of access.",
        url = "/docs/student/fees"
    ),
    HelpDoc(
        title = "How to Post in Community",
        category = "Social",
        content = "1. Only authorized users and teachers can create posts.\n2. Posts must comply with the school code of conduct.\n3. Spamming or abusive content is strictly prohibited and will result in disciplinary action.\n4. Keep posts relevant to academic discussions, announcements, and events.",
        url = "/docs/student/complaints"
    ),
    HelpDoc(
        title = "Contacting Accounts Office",
        category = "Finance",
        content = "1. Operating hours: Monday to Friday, 9:00 AM to 3:00 PM.\n2. Email inquiries can be sent to billing@vidyaschool.edu.\n3. Phone support is available at extension 104 during school hours.\n4. In-person meetings require prior scheduling via the portal.",
        url = "/docs/student/fees"
    ),
    HelpDoc(
        title = "Student ID Card Reissue Policy",
        category = "General",
        content = "1. Lost ID cards must be reported immediately to the administration office.\n2. A replacement ID card can be issued upon paying a fee of $10.\n3. Processing time for a new card is 2 business days.\n4. Students must carry their ID card at all times while on school premises.",
        url = "/docs/student/onboarding"
    )
)

@Composable
fun ProfileDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoticeTabContent(
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onNotificationClick: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var notices by remember { mutableStateOf<List<NoticeResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var loadError by remember { mutableStateOf<String?>(null) }

    val role = remember { sessionManager.getRole() ?: "student" }

    val fetchNotices: () -> Unit = {
        isLoading = true
        loadError = null
        scope.launch {
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.getNotices("Bearer $token")
                    if (response.isSuccessful) {
                        notices = response.body() ?: emptyList()
                    } else {
                        loadError = "Failed to load notices"
                    }
                } else {
                    loadError = "Please sign in to view notices"
                }
            } catch (e: Exception) {
                android.util.Log.e("NoticeTabContent", "Error: ${e.message}")
                loadError = e.message ?: "Failed to load notices"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchNotices() }
    LaunchedEffect(isRefreshing) { if (isRefreshing) fetchNotices() }

    PullToRefreshBox(
        isRefreshing = isRefreshing || isLoading,
        onRefresh = { onRefresh(); fetchNotices() },
        modifier = Modifier.fillMaxSize()
    ) {
        val lazyListState = rememberLazyListState()
        val headerCollapsed by remember { derivedStateOf { lazyListState.firstVisibleItemIndex > 0 || lazyListState.firstVisibleItemScrollOffset > 100 } }
        val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerAlpha"
        )
        val headerSlide by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerSlide"
        )

        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                state = lazyListState,
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 0.dp, bottom = 24.dp)
            ) {
                item {
                    DashboardHeader(
                        title = "Notice Board",
                        subtitle = "${role.lowercase().replaceFirstChar { it.uppercase() }} Notice Board",
                        onNotificationClick = onNotificationClick
                    )
                }

                // 2. Load Error item
                loadError?.let { error ->
                    item {
                        Text(
                            text = error,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
                        )
                    }
                }

                // 3. Notices content
                if (notices.isEmpty() && !isLoading && loadError == null) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .padding(horizontal = 24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No notices yet",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                } else {
                    items(notices.size) { index ->
                        val notice = notices[index]
                        val badgeLabel = when {
                            notice.isUrgent -> "Urgent"
                            notice.category.isNotBlank() -> notice.category
                            else -> "Notice"
                        }
                        val badgeColor = if (notice.isUrgent) {
                            MaterialTheme.colorScheme.error
                        } else {
                            MaterialTheme.colorScheme.primary
                        }
                        val formattedDate = notice.createdAt.take(10)

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .background(
                                                color = badgeColor.copy(alpha = 0.15f),
                                                shape = RoundedCornerShape(8.dp)
                                            )
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = badgeLabel,
                                            color = badgeColor,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Text(
                                        text = formattedDate,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                                notice.senderName?.takeIf { it.isNotBlank() }?.let { sender ->
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "By $sender",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = notice.title,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = notice.content,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }
            }

            if (headerAlpha > 0f) {
                DashboardStickyHeader(
                    title = "Notice Board",
                    headerAlpha = headerAlpha,
                    headerSlide = headerSlide,
                    onNotificationClick = onNotificationClick
                )
            }
        }
    }
}

data class CommunityMsg(
    val id: String,
    val userId: String,
    val name: String,
    val role: String,
    val content: String,
    val timestamp: String,
    val image: String? = null,
    val replyTo: ReplyToMsg? = null
)

data class ReplyToMsg(
    val id: String,
    val name: String,
    val content: String
)

data class CommunityTypingUser(
    val userId: String,
    val name: String
)

@Composable
fun BouncingDotsAnimation() {
    val dots = listOf(
        remember { Animatable(0f) },
        remember { Animatable(0f) },
        remember { Animatable(0f) }
    )
    
    dots.forEachIndexed { index, animatable ->
        LaunchedEffect(animatable) {
            delay(index * 150L)
            animatable.animateTo(
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(durationMillis = 450, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                )
            )
        }
    }
    
    Row(
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        dots.forEach { animatable ->
            val yOffset = -6.dp * animatable.value
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .graphicsLayer {
                        translationY = yOffset.toPx()
                    }
                    .background(MaterialTheme.colorScheme.primary, CircleShape)
            )
        }
    }
}

fun formatTimestamp(isoString: String): String {
    return try {
        val parts = isoString.split("T")
        if (parts.size == 2) {
            val datePart = parts[0]
            val timePart = parts[1].substring(0, 5) // "12:58"
            val todayDate = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
            if (datePart == todayDate) {
                "Today at $timePart"
            } else {
                "$datePart at $timePart"
            }
        } else {
            isoString
        }
    } catch (e: Exception) {
        isoString
    }
}

fun parseIsoTimestamp(isoString: String): Long {
    return try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val cleanIso = isoString.split(".")[0].replace("Z", "")
        format.parse(cleanIso)?.time ?: 0L
    } catch (e: Exception) {
        0L
    }
}

@Composable
fun TeacherAIDialog(
    onDismiss: () -> Unit
) {
    var promptText by remember { mutableStateOf("") }
    var aiResponse by remember { mutableStateOf<String?>(null) }
    var isGenerating by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val quickPrompts = listOf(
        "Generate 5 Math Quiz Questions",
        "Create Lesson Plan for Physics",
        "Draft Announcement for Parents",
        "Class Activity Ideas for Tomorrow"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_ai),
                    contentDescription = "Agent Assistant",
                    tint = Color(0xFF8B5CF6),
                    modifier = Modifier.size(26.dp)
                )
                Text(
                    text = "AI Teaching Agent",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Ask your AI Agent to help prepare lesson plans, draft announcements, or create quiz questions.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                // Quick Prompt Chips
                Text(
                    text = "Quick Prompts:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(quickPrompts) { prompt ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                            modifier = Modifier.clickable {
                                promptText = prompt
                            }
                        ) {
                            Text(
                                text = prompt,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Prompt Input
                com.vidyaschool.app.ui.shadcn.Input(
                    value = promptText,
                    onValueChange = { promptText = it },
                    placeholder = "Type your prompt here...",
                    modifier = Modifier.fillMaxWidth()
                )

                if (isGenerating) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = Color(0xFF8B5CF6)
                        )
                        Text(
                            text = "Agent is thinking...",
                            fontSize = 13.sp,
                            color = Color(0xFF8B5CF6)
                        )
                    }
                }

                if (aiResponse != null) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF1E1E24),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF8B5CF6).copy(alpha = 0.3f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 180.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(12.dp)
                                .verticalScroll(rememberScrollState())
                        ) {
                            Text(
                                text = aiResponse!!,
                                fontSize = 13.sp,
                                color = Color.White,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (promptText.isNotBlank()) {
                        isGenerating = true
                        aiResponse = null
                        scope.launch {
                            delay(1200)
                            isGenerating = false
                            aiResponse = "🤖 Agent Response for: \"${promptText}\"\n\n1. Overview: Key learning objectives for your class.\n2. Key Topics: Core concepts and practical exercises.\n3. Summary Note: Ready for students."
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6))
            ) {
                Text("Ask Agent", color = Color.White)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityTabContent(
    role: String,
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var currentUser by remember { mutableStateOf<com.vidyaschool.app.api.User?>(null) }
    var isConnected by remember { mutableStateOf(false) }
    val messages = remember { mutableStateListOf<CommunityMsg>() }
    var socket by remember { mutableStateOf<Socket?>(null) }
    val lazyListState = rememberLazyListState()
    
    var inputText by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<CommunityMsg?>(null) }
    var editingMessage by remember { mutableStateOf<CommunityMsg?>(null) }
    var onlineCount by remember { mutableStateOf(1) }
    val typingUsers = remember { mutableStateListOf<CommunityTypingUser>() }

    LaunchedEffect(inputText) {
        if (inputText.trim().isEmpty()) {
            socket?.let { s ->
                if (isConnected) {
                    val data = org.json.JSONObject().apply {
                        put("isTyping", false)
                    }
                    s.emit("typing", data)
                }
            }
            return@LaunchedEffect
        }
        
        socket?.let { s ->
            if (isConnected) {
                val data = org.json.JSONObject().apply {
                    put("isTyping", true)
                }
                s.emit("typing", data)
            }
        }
        
        delay(2500)
        socket?.let { s ->
            if (isConnected) {
                val data = org.json.JSONObject().apply {
                    put("isTyping", false)
                }
                s.emit("typing", data)
            }
        }
    }
    
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            lazyListState.scrollToItem(messages.size - 1)
        }
    }

    val imeBottom = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(imeBottom) {
        if (imeBottom > 0 && messages.isNotEmpty()) {
            lazyListState.scrollToItem(messages.size - 1)
        }
    }
    
    val token = remember { sessionManager.getSessionToken() ?: "" }

    LaunchedEffect(token) {
        if (token.isNotEmpty()) {
            try {
                val res = RetrofitClient.authApi.getProfile("Bearer $token")
                if (res.isSuccessful && res.body() != null) {
                    currentUser = res.body()?.user
                }
            } catch (e: Exception) {
                android.util.Log.e("CommunityTab", "Fetch profile failed: ${e.message}")
            }
        }
    }

    LaunchedEffect(currentUser) {
        val user = currentUser ?: return@LaunchedEffect
        var socketInstance: io.socket.client.Socket? = null
        try {
            val opts = IO.Options().apply {
                transports = arrayOf("websocket")
                forceNew = false
                callFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
                webSocketFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
            }
            socketInstance = IO.socket("https://api.vidyaschool.com", opts)

            socketInstance.on(Socket.EVENT_CONNECT) {
                android.util.Log.d("CommunityTab", "Socket connected successfully!")
                coroutineScope.launch {
                    isConnected = true
                }
                val joinData = org.json.JSONObject().apply {
                    put("userId", user.id)
                    put("name", user.name ?: user.email)
                    put("role", user.role ?: "student")
                    put("image", user.image)
                }
                socketInstance.emit("join", joinData)
            }

            socketInstance.on(Socket.EVENT_CONNECT_ERROR) { args ->
                android.util.Log.e("CommunityTab", "Socket connection error event: ${args.getOrNull(0)}")
            }

            socketInstance.on(Socket.EVENT_DISCONNECT) {
                android.util.Log.d("CommunityTab", "Socket disconnected!")
                coroutineScope.launch {
                    isConnected = false
                    typingUsers.clear()
                }
            }

            socketInstance.on("online_users") { args ->
                if (args != null && args.isNotEmpty()) {
                    val usersArray = args[0] as? org.json.JSONArray
                    if (usersArray != null) {
                        val activeUserIds = mutableSetOf<String>()
                        for (i in 0 until usersArray.length()) {
                            val userObj = usersArray.optJSONObject(i)
                            if (userObj != null) {
                                activeUserIds.add(userObj.optString("userId"))
                            }
                        }
                        coroutineScope.launch {
                            onlineCount = usersArray.length()
                            typingUsers.removeAll { it.userId !in activeUserIds }
                        }
                    }
                }
            }

            socketInstance.on("user_typing") { args ->
                if (args != null && args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val typingUserId = obj.optString("userId")
                        val typingUserName = obj.optString("name")
                        val isTyping = obj.optBoolean("isTyping", false)
                        
                        coroutineScope.launch {
                            val user = currentUser
                            if (user != null && typingUserId != user.id) {
                                if (isTyping) {
                                    if (typingUsers.none { it.userId == typingUserId }) {
                                        typingUsers.add(CommunityTypingUser(typingUserId, typingUserName))
                                    }
                                } else {
                                    typingUsers.removeAll { it.userId == typingUserId }
                                }
                            }
                        }
                    }
                }
            }

            socketInstance.on("recent_messages") { args ->
                android.util.Log.d("CommunityTab", "recent_messages event received, args size = ${args?.size}")
                if (args != null && args.isNotEmpty()) {
                    val data = args[0] as? org.json.JSONObject
                    if (data != null) {
                        val messagesArray = data.optJSONArray("messages")
                        if (messagesArray != null) {
                            val list = mutableListOf<CommunityMsg>()
                            val gson = Gson()
                            try {
                                for (i in 0 until messagesArray.length()) {
                                    val obj = messagesArray.getJSONObject(i)
                                    val msg = gson.fromJson(obj.toString(), CommunityMsg::class.java)
                                    list.add(msg)
                                }
                                android.util.Log.d("CommunityTab", "Successfully parsed ${list.size} recent messages")
                                coroutineScope.launch {
                                    messages.clear()
                                    messages.addAll(list)
                                    if (messages.isNotEmpty()) {
                                        lazyListState.animateScrollToItem(messages.size - 1)
                                    }
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("CommunityTab", "Error parsing recent messages: ${e.message}", e)
                            }
                        }
                    }
                }
            }

            socketInstance.on("new_message") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val gson = Gson()
                        val msg = gson.fromJson(obj.toString(), CommunityMsg::class.java)
                        coroutineScope.launch {
                            messages.add(msg)
                            lazyListState.animateScrollToItem(messages.size - 1)
                        }
                    }
                }
            }

            socketInstance.on("message_edited") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val msgId = obj.optString("id")
                        val content = obj.optString("content")
                        coroutineScope.launch {
                            val index = messages.indexOfFirst { it.id == msgId }
                            if (index != -1) {
                                messages[index] = messages[index].copy(content = content)
                            }
                        }
                    }
                }
            }

            socketInstance.on("message_deleted") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val msgId = obj.optString("id")
                        coroutineScope.launch {
                            messages.removeAll { it.id == msgId }
                        }
                    }
                }
            }

            socketInstance.connect()
            socket = socketInstance

            kotlinx.coroutines.awaitCancellation()
        } catch (e: Exception) {
            android.util.Log.e("CommunityTab", "Socket connection error: ${e.message}")
        } finally {
            android.util.Log.d("CommunityTab", "Cleaning up socket...")
            socketInstance?.disconnect()
            socketInstance?.off()
            socket = null
        }
    }

    val onSendMessage = {
        val s = socket
        if (s != null && isConnected && inputText.trim().isNotEmpty()) {
            val data = org.json.JSONObject().apply {
                put("content", inputText)
                val rep = replyingTo
                if (rep != null) {
                    val repObj = org.json.JSONObject().apply {
                        put("id", rep.id)
                        put("name", rep.name)
                        put("content", rep.content)
                    }
                    put("replyTo", repObj)
                }
            }
            s.emit("send_message", data)
            inputText = ""
            replyingTo = null
        }
    }

    val onEditMessage = { msgId: String, content: String ->
        val s = socket
        if (s != null && isConnected && content.trim().isNotEmpty()) {
            val data = org.json.JSONObject().apply {
                put("messageId", msgId)
                put("content", content)
            }
            s.emit("edit_message", data)
            editingMessage = null
            inputText = ""
        }
    }

    val onDeleteMessage = { msgId: String ->
        val s = socket
        if (s != null && isConnected) {
            val data = org.json.JSONObject().apply {
                put("messageId", msgId)
            }
            s.emit("delete_message", data)
        }
    }

    LaunchedEffect(editingMessage) {
        val edit = editingMessage
        if (edit != null) {
            inputText = edit.content
        } else {
            inputText = ""
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .size(36.dp)
                        .border(
                            1.dp,
                            MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f),
                            shape = CircleShape
                        )
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }

                Column {
                    Text(
                        text = "Community Hub",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "$onlineCount ${if (onlineCount == 1) "user" else "users"} online",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isConnected) Color(0xFF10B981) else Color(0xFFEF4444))
                )
                Text(
                    text = if (isConnected) "Live" else "Offline",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isConnected) Color(0xFF10B981) else Color(0xFFEF4444)
                )
            }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))

        // Chat list area & floating input bar
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .imePadding()
        ) {
            if (messages.isEmpty() && !isConnected) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Connecting to #community...",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }
                }
            } else {
                LazyColumn(
                    state = lazyListState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(messages.size) { index ->
                        val msg = messages[index]
                        val isMe = currentUser != null && msg.userId == currentUser?.id

                        val isGrouped = index > 0 &&
                                messages[index - 1].userId == msg.userId &&
                                (parseIsoTimestamp(msg.timestamp) - parseIsoTimestamp(messages[index - 1].timestamp)) < 300000 &&
                                msg.replyTo == null

                        CommunityMessageItem(
                            msg = msg,
                            isGrouped = isGrouped,
                            isMe = isMe,
                            onReply = { replyingTo = msg },
                            onEdit = { editingMessage = msg },
                            onDelete = { onDeleteMessage(msg.id) }
                        )
                    }
                }
            }

            // Bottom gradient overlay to fade out messages behind the floating input card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .align(Alignment.BottomCenter)
                    .background(
                        brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                MaterialTheme.colorScheme.background.copy(alpha = 0.7f),
                                MaterialTheme.colorScheme.background
                            )
                        )
                    )
            )

            // Floating Input bar Card
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
                    .navigationBarsPadding(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(
                    defaultElevation = 8.dp
                ),
                border = androidx.compose.foundation.BorderStroke(
                    width = 1.dp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp, vertical = 4.dp)
                ) {
                    // Reply Preview Banner
                    val rep = replyingTo
                    if (rep != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_community),
                                    contentDescription = "Reply",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Replying to @${rep.name}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "\"${rep.content}\"",
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                            IconButton(
                                onClick = { replyingTo = null },
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cancel",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Edit Preview Banner
                    val edit = editingMessage
                    if (edit != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "Edit",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Editing message...",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            IconButton(
                                onClick = { editingMessage = null },
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cancel",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    // Input Row (ChatGPT style: borderless, padded, filled circular send button)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 6.dp, end = 6.dp, top = 4.dp, bottom = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                android.widget.Toast.makeText(context, "Coming Soon!", android.widget.Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Add",
                                modifier = Modifier.size(22.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }

                        // Text field Box (centered start vertical alignment)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (inputText.isEmpty()) {
                                Text(
                                    text = "Message #community",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                    fontSize = 15.sp,
                                    modifier = Modifier.align(Alignment.CenterStart)
                                )
                            }
                            androidx.compose.foundation.text.BasicTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .align(Alignment.CenterStart),
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontSize = 15.sp
                                ),
                                maxLines = 5,
                                cursorBrush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.onSurface),
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    capitalization = androidx.compose.ui.text.input.KeyboardCapitalization.Sentences,
                                    autoCorrect = true
                                )
                            )
                        }

                        val isSendEnabled = isConnected && inputText.trim().isNotEmpty()
                        val sendButtonBg = if (isSendEnabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
                        val sendButtonTint = if (isSendEnabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)

                        IconButton(
                            onClick = {
                                if (editingMessage != null) {
                                    onEditMessage(editingMessage!!.id, inputText)
                                } else {
                                    onSendMessage()
                                }
                            },
                            enabled = isSendEnabled,
                            modifier = Modifier
                                .size(36.dp)
                                .background(sendButtonBg, CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_arrow_up),
                                contentDescription = "Send",
                                modifier = Modifier.size(18.dp),
                                tint = sendButtonTint
                            )
                        }
                    }
                }
            }

            // Typing Indicator
            androidx.compose.animation.AnimatedVisibility(
                visible = typingUsers.isNotEmpty(),
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it }),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 24.dp, bottom = 96.dp)
            ) {
                Row(
                    modifier = Modifier
                        .background(
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    BouncingDotsAnimation()
                    
                    val text = when (typingUsers.size) {
                        1 -> "${typingUsers[0].name} is typing..."
                        2 -> "${typingUsers[0].name} and ${typingUsers[1].name} are typing..."
                        else -> "Several people are typing..."
                    }
                    Text(
                        text = text,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Scroll to bottom button
            val showScrollToBottomButton by remember {
                derivedStateOf {
                    val layoutInfo = lazyListState.layoutInfo
                    val totalItems = layoutInfo.totalItemsCount
                    if (totalItems == 0) {
                        false
                    } else {
                        val lastVisibleItem = lazyListState.layoutInfo.visibleItemsInfo.lastOrNull()
                        lastVisibleItem == null || lastVisibleItem.index < totalItems - 3
                    }
                }
            }

            androidx.compose.animation.AnimatedVisibility(
                visible = showScrollToBottomButton,
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it }),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 24.dp, bottom = 96.dp)
            ) {
                FloatingActionButton(
                    onClick = {
                        coroutineScope.launch {
                            if (messages.isNotEmpty()) {
                                if (lazyListState.firstVisibleItemIndex < messages.size - 15) {
                                    lazyListState.scrollToItem(messages.size - 10)
                                }
                                lazyListState.animateScrollToItem(messages.size - 1)
                            }
                        }
                    },
                    containerColor = if (isSystemInDarkTheme()) Color.White else Color.Black,
                    contentColor = if (isSystemInDarkTheme()) Color.Black else Color.White,
                    shape = CircleShape,
                    modifier = Modifier
                        .size(40.dp)
                        .border(
                            width = 1.dp,
                            color = (if (isSystemInDarkTheme()) Color.White else Color.Black).copy(alpha = 0.15f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Scroll to bottom",
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CommunityMessageItem(
    msg: CommunityMsg,
    isGrouped: Boolean,
    isMe: Boolean,
    onReply: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    
    val roleColor = when (msg.role.lowercase()) {
        "admin" -> Color(0xFFE11D48)
        "teacher", "librarian" -> Color(0xFF2563EB)
        "account" -> Color(0xFF059669)
        else -> MaterialTheme.colorScheme.onBackground
    }

    val roleBg = when (msg.role.lowercase()) {
        "admin" -> Color(0xFFFFE4E6)
        "teacher", "librarian" -> Color(0xFFDBEAFE)
        "account" -> Color(0xFFD1FAE5)
        else -> Color(0xFFF1F5F9)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .combinedClickable(
                onLongClick = { showMenu = true },
                onClick = { onReply() }
            )
            .padding(horizontal = 8.dp, vertical = if (isGrouped) 2.dp else 6.dp)
    ) {
        DropdownMenu(
            expanded = showMenu,
            onDismissRequest = { showMenu = false }
        ) {
            DropdownMenuItem(
                text = { Text("Reply") },
                onClick = {
                    onReply()
                    showMenu = false
                },
                leadingIcon = { Icon(Icons.Default.Share, contentDescription = "Reply", modifier = Modifier.size(16.dp)) }
            )
            if (isMe) {
                DropdownMenuItem(
                    text = { Text("Edit") },
                    onClick = {
                        onEdit()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp)) }
                )
                DropdownMenuItem(
                    text = { Text("Delete", color = Color.Red) },
                    onClick = {
                        onDelete()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp), tint = Color.Red) }
                )
            }
        }

        if (msg.replyTo != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 28.dp, bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_community),
                    contentDescription = "Reply",
                    modifier = Modifier.size(10.dp),
                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
                Text(
                    text = "@${msg.replyTo.name}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
                Text(
                    text = msg.replyTo.content,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            }
        }

        if (isGrouped) {
            Row(
                modifier = Modifier.fillMaxWidth()
            ) {
                Spacer(modifier = Modifier.width(44.dp))
                Text(
                    text = msg.content,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (!msg.image.isNullOrEmpty()) {
                    AsyncImage(
                        model = msg.image,
                        contentDescription = "Avatar",
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(
                                when (msg.role.lowercase()) {
                                    "admin" -> Color(0xFFF43F5E)
                                    "teacher", "librarian" -> Color(0xFF3B82F6)
                                    "account" -> Color(0xFF10B981)
                                    else -> Color(0xFF64748B)
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (msg.name.isNotEmpty()) msg.name.take(1).uppercase() else "?",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = msg.name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = roleColor
                        )



                        Text(
                            text = formatTimestamp(msg.timestamp),
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                    }

                    Text(
                        text = msg.content,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeesTabContent(
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onNotificationClick: () -> Unit = {},
    onPaymentSuccess: (FeeInstallment) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var installments by remember { mutableStateOf<List<FeeInstallment>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isProcessingPayment by remember { mutableStateOf<String?>(null) }
    var paymentError by remember { mutableStateOf<String?>(null) }
    val studentName = remember { sessionManager.getUsername() ?: "Student" }

    val fetchFees: () -> Unit = {
        isLoading = true
        scope.launch {
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.getMyFees("Bearer $token")
                    if (response.isSuccessful) installments = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                android.util.Log.e("FeesTabContent", "Error: ${e.message}")
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchFees() }
    LaunchedEffect(isRefreshing) { if (isRefreshing) fetchFees() }

    val handlePayFee: (FeeInstallment) -> Unit = { inst ->
        isProcessingPayment = inst.id
        scope.launch {
            try {
                val token = sessionManager.getSessionToken() ?: run {
                    isProcessingPayment = null
                    android.widget.Toast.makeText(context, "Session expired, please log in again", android.widget.Toast.LENGTH_SHORT).show()
                    return@launch
                }
                val amountPaise = (inst.amount * 100).toInt()
                val orderResp = RetrofitClient.authApi.createOrder(
                    authHeader = "Bearer $token",
                    request = com.vidyaschool.app.api.CreateOrderRequest(
                        installmentIds = listOf(inst.id),
                        amount = amountPaise
                    )
                )
                if (!orderResp.isSuccessful || orderResp.body() == null) {
                    val errorBody = orderResp.errorBody()?.string()
                    android.util.Log.e("FeesTabContent", "Create order failed: code=${orderResp.code()} body=$errorBody")
                    android.widget.Toast.makeText(context, "Order creation failed: ${orderResp.message()}", android.widget.Toast.LENGTH_SHORT).show()
                    isProcessingPayment = null
                    return@launch
                }
                val order = orderResp.body()!!

                if (order.mockPayment == true) {
                    android.widget.Toast.makeText(context, "Simulating mock payment...", android.widget.Toast.LENGTH_SHORT).show()
                    val payResp = RetrofitClient.authApi.payFees(
                        authHeader = "Bearer $token",
                        request = PayFeesRequest(
                            installmentIds = order.installmentIds ?: listOf(inst.id),
                            paymentMethod = "Razorpay (Mock)"
                        )
                    )
                    if (payResp.isSuccessful && payResp.body()?.success == true) {
                        android.widget.Toast.makeText(context, "Mock payment successful!", android.widget.Toast.LENGTH_SHORT).show()
                        fetchFees()
                        onPaymentSuccess(inst.copy(status = "paid", paidDate = payResp.body()?.paidDate ?: "Today", receiptNo = payResp.body()?.receiptNo ?: "RCP-MOCK"))
                    } else {
                        android.widget.Toast.makeText(context, "Mock payment failed", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    isProcessingPayment = null
                    return@launch
                }

                val activity = context as? com.vidyaschool.app.MainActivity ?: run {
                    isProcessingPayment = null
                    android.widget.Toast.makeText(context, "Activity context error", android.widget.Toast.LENGTH_SHORT).show()
                    return@launch
                }
                activity.pendingInstallmentId = inst.id
                activity.pendingOrderId = order.orderId ?: ""
                activity.pendingIsMock = order.mockPayment == true
                val paidInst = inst
                activity.onPaymentDone = {
                    isProcessingPayment = null
                    // Refresh fees then notify parent to show full-screen success screen
                    scope.launch {
                        fetchFees()
                        kotlinx.coroutines.delay(600)
                        val updated = installments.find { it.id == paidInst.id } ?: paidInst
                        onPaymentSuccess(updated)
                    }
                }
                activity.onPaymentFailed = { msg ->
                    isProcessingPayment = null
                    paymentError = msg
                }
                val checkout = com.razorpay.Checkout()
                checkout.setKeyID(order.keyId ?: "")
                val options = org.json.JSONObject().apply {
                    put("name", "Vidya School")
                    put("description", "Fee: ${inst.month} ${inst.year}")
                    put("amount", order.amount)
                    put("currency", order.currency ?: "INR")
                    if (order.mockPayment != true && !order.orderId.isNullOrEmpty()) {
                        put("order_id", order.orderId)
                    }
                    put("prefill", org.json.JSONObject().apply {
                        put("email", sessionManager.getEmail() ?: "")
                        put("contact", "9999999999")
                    })
                    put("theme", org.json.JSONObject().apply { put("color", "#6750A4") })
                    put("modal", org.json.JSONObject().apply {
                        put("confirm_close", false)
                        put("animation", false)
                    })
                }
                checkout.open(activity, options)
                isProcessingPayment = null
            } catch (e: Exception) {
                android.util.Log.e("FeesTabContent", "Error during payment init: ${e.message}", e)
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                isProcessingPayment = null
            }
        }
    }

    val scrollState = rememberScrollState()
    val unpaidInstallments = installments.filter { it.status != "paid" }
    val totalOutstanding = unpaidInstallments.sumOf { it.amount }
    val isDark = isSystemInDarkTheme()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(220), label = "feeHeaderAlpha"
    )
    val headerSlide by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = androidx.compose.animation.core.tween(220), label = "feeHeaderSlide"
    )

    val menuClick = LocalMenuClickHandler.current

    Box(modifier = Modifier.fillMaxSize()) {
    PullToRefreshBox(
        isRefreshing = isRefreshing || isLoading,
        onRefresh = { onRefresh(); fetchFees() },
        modifier = Modifier.fillMaxSize()
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                // Home-style header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        IconButton(
                            onClick = { menuClick?.invoke() },
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                        }
                        Column {
                            Text("Pay Fees", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                            Text("Student Portal", fontSize = 12.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
                        }
                    }
                    IconButton(
                        onClick = onNotificationClick,
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Error banner
                if (paymentError != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.errorContainer)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(paymentError!!, fontSize = 13.sp, color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.weight(1f))
                        IconButton(onClick = { paymentError = null }, modifier = Modifier.size(18.dp)) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.size(14.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                // Summary card — primary in light, gray+border in dark
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .then(
                            if (isDark) Modifier.border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
                            else Modifier
                        )
                        .background(
                            if (isDark) MaterialTheme.colorScheme.surfaceVariant
                            else MaterialTheme.colorScheme.primary
                        )
                        .padding(20.dp)
                ) {
                    val contentColor = if (isDark) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onPrimary
                    Column {
                        Text("Outstanding Balance", fontSize = 12.sp, color = contentColor.copy(alpha = 0.6f), fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("₹${"%,d".format(totalOutstanding.toInt())}", fontSize = 34.sp, fontWeight = FontWeight.Bold, color = contentColor)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            if (unpaidInstallments.isEmpty() && installments.isNotEmpty()) "All fees paid ✓"
                            else "${unpaidInstallments.size} month${if (unpaidInstallments.size != 1) "s" else ""} pending",
                            fontSize = 12.sp, color = contentColor.copy(alpha = 0.55f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Section label
                Text("Installments", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f), letterSpacing = 0.8.sp)
                Spacer(modifier = Modifier.height(10.dp))

            // Skeleton
            if (isLoading && installments.isEmpty()) {
                repeat(4) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.width(100.dp).height(14.dp).clip(RoundedCornerShape(4.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))
                            Box(modifier = Modifier.width(70.dp).height(11.dp).clip(RoundedCornerShape(4.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)))
                        }
                        Box(modifier = Modifier.width(56.dp).height(30.dp).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                }
            } else if (!isLoading && installments.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp), contentAlignment = Alignment.Center) {
                    Text("No records found", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                }
            }

            // Installment rows
            installments.forEachIndexed { index, inst ->
                val isPaid = inst.status == "paid"
                val isOverdue = inst.status == "overdue"
                val isProcessing = isProcessingPayment == inst.id

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left: month + meta
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(inst.month, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                            if (isOverdue) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(MaterialTheme.colorScheme.error.copy(alpha = 0.12f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Overdue", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            if (isPaid && !inst.receiptNo.isNullOrEmpty()) inst.receiptNo!!
                            else "₹${"%,d".format(inst.amount.toInt())}",
                            fontSize = 12.sp,
                            color = if (isPaid) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                            fontFamily = if (isPaid) androidx.compose.ui.text.font.FontFamily.Monospace else androidx.compose.ui.text.font.FontFamily.Default
                        )
                    }

                    // Right: action
                    if (isPaid) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            if (!inst.receiptNo.isNullOrEmpty()) {
                                IconButton(
                                    onClick = {
                                        val url = "https://vidyaschool.vercel.app/fee/payment/${inst.receiptNo}"
                                        val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(android.content.Intent.EXTRA_TEXT, url)
                                        }
                                        context.startActivity(android.content.Intent.createChooser(intent, "Share Receipt"))
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "Share", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), modifier = Modifier.size(15.dp))
                                }
                            }
                            Text("Paid", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF10B981))
                        }
                    } else {
                        Button(
                            onClick = { handlePayFee(inst) },
                            enabled = !isProcessing && isProcessingPayment == null,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
                            ),
                            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 0.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            if (isProcessing)
                                CircularProgressIndicator(modifier = Modifier.size(14.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                            else
                                Text("Pay", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (index < installments.lastIndex) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                }
            }
        } // end Column

        // Sticky collapsed header
        if (headerAlpha > 0f) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = headerAlpha; translationY = headerSlide }
                    .background(MaterialTheme.colorScheme.background)
            ) {
                Spacer(modifier = Modifier.windowInsetsTopHeight(androidx.compose.foundation.layout.WindowInsets.statusBars))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = { menuClick?.invoke() },
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                    Text("Pay Fees", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                    IconButton(
                        onClick = onNotificationClick,
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
            }
        }
    } // end Box (inner)
  } // end PullToRefreshBox
    } // end outer Box
}

// ──────────────────────────────────────────────────────────────────
// Notes Drawer  (Student sidebar → "Notes")
// Mirrors the web frontend's StudentNotes component fetch pattern:
//   1. Try /api/student/notes on the backend
//   2. Display notes as horizontal scrollable cards with subject pills
// ──────────────────────────────────────────────────────────────────

private fun timeAgoNotes(dateStr: String?): String {
    if (dateStr.isNullOrBlank()) return "recently"
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = sdf.parse(dateStr) ?: return "recently"
        val diff = System.currentTimeMillis() - date.time
        val m = (diff / 60000).toInt()
        when {
            m < 1  -> "just now"
            m < 60 -> "${m}m ago"
            m < 1440 -> "${m / 60}h ago"
            m < 2880 -> "yesterday"
            else -> "${m / 1440}d ago"
        }
    } catch (e: Exception) { "recently" }
}

private data class NotePageItem(
    val pageNum: Int,
    val content: String
)

private data class ParsedNote(
    val id: String,
    val subject: String,
    val title: String,
    val bullets: List<String>,
    val body: String,
    val pages: List<NotePageItem>,
    val rawContent: String,
    val teacherName: String,
    val timestamp: String,
    val color: String,
    val className: String?,
    val sectionName: String?,
    val pdfUrl: String? = null
)

private fun parseNoteContent(note: com.vidyaschool.app.api.StudentNote): ParsedNote {
    var bullets = mutableListOf<String>()
    var body = ""
    val content = note.content ?: ""
    val pageItems = mutableListOf<NotePageItem>()

    if (content.startsWith("{")) {
        try {
            val json = org.json.JSONObject(content)
            val pagesArr = json.optJSONArray("pages")
            val allTexts = mutableListOf<String>()
            if (pagesArr != null && pagesArr.length() > 0) {
                for (i in 0 until pagesArr.length()) {
                    val pageObj = pagesArr.optJSONObject(i) ?: continue
                    val textsArr = pageObj.optJSONArray("texts") ?: continue
                    val pageLines = mutableListOf<String>()
                    for (j in 0 until textsArr.length()) {
                        val txt = textsArr.optJSONObject(j)?.optString("text") ?: continue
                        txt.split("\n").filter { it.isNotBlank() }.forEach { 
                            pageLines.add(it.trim()) 
                            allTexts.add(it.trim())
                        }
                    }
                    if (pageLines.isNotEmpty()) {
                        pageItems.add(NotePageItem(pageNum = i + 1, content = pageLines.joinToString("\n")))
                    }
                }
            }
            val previewTexts = allTexts.filter { !it.startsWith("--- Page") }
            val bulletLines = previewTexts.filter { it.startsWith("•") || it.startsWith("-") || it.startsWith("*") || it.matches(Regex("^\\d+\\..*")) }
            if (bulletLines.isNotEmpty()) {
                bullets = bulletLines.take(3).map { it.replace(Regex("^[•\\-*\\s]+|^\\d+\\.\\s*"), "").trim() }.toMutableList()
                body = previewTexts.filter { it !in bulletLines }.joinToString(" ")
            } else {
                bullets = previewTexts.filter { it.length < 60 }.take(3).toMutableList()
                body = previewTexts.filter { it !in bullets }.joinToString(" ")
            }
        } catch (e: Exception) { body = content }
    } else if (content.isNotBlank()) {
        val lines = content.split("\n").map { it.trim() }.filter { it.isNotBlank() }
        val bulletLines = lines.filter { it.startsWith("•") || it.startsWith("-") || it.startsWith("*") || it.matches(Regex("^\\d+\\..*")) }
        if (bulletLines.isNotEmpty()) {
            bullets = bulletLines.take(3).map { it.replace(Regex("^[•\\-*\\s]+|^\\d+\\.\\s*"), "").trim() }.toMutableList()
            body = lines.filter { it !in bulletLines }.joinToString(" ")
        } else {
            bullets = lines.take(2).toMutableList()
            body = lines.drop(2).joinToString(" ")
        }
    }

    if (pageItems.isEmpty()) {
        val raw = if (content.isNotBlank()) content else body
        pageItems.add(NotePageItem(pageNum = 1, content = raw))
    }

    if (bullets.isEmpty()) bullets = mutableListOf("No text highlights", "Tap to view full content")
    if (body.isBlank()) body = "Tap to view note content."
    if (body.length > 100) body = body.substring(0, 97) + "..."

    return ParsedNote(
        id = note.id,
        subject = note.subject?.ifBlank { "General" } ?: "General",
        title = note.title?.ifBlank { "Untitled Note" } ?: "Untitled Note",
        bullets = bullets,
        body = body,
        pages = pageItems,
        rawContent = content,
        teacherName = note.teacherName?.ifBlank { "Unknown Teacher" } ?: "Unknown Teacher",
        timestamp = timeAgoNotes(note.updatedAt ?: note.createdAt),
        color = note.color ?: "default",
        className = note.targetClass,
        sectionName = note.section,
        pdfUrl = note.pdfUrl
    )
}

private @Composable
fun NoteMarkdownMathView(
    markdownContent: String,
    modifier: Modifier = Modifier
) {
    val encodedContent = remember(markdownContent) {
        try {
            java.net.URLEncoder.encode(markdownContent, "UTF-8").replace("+", "%20")
        } catch (e: Exception) { "" }
    }

    val htmlData = remember(encodedContent) {
        """
        <!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 14px;
            margin: 0;
            color: #334155;
            background-color: transparent;
            font-size: 14px;
            line-height: 1.6;
          }
          @media (prefers-color-scheme: dark) {
            body {
              color: #cbd5e1;
            }
          }
          h1, h2, h3, h4 { margin-top: 1em; margin-bottom: 0.4em; font-weight: 700; color: inherit; }
          h1 { font-size: 1.4em; }
          h2 { font-size: 1.2em; }
          p { margin-bottom: 0.8em; }
          code { background: rgba(148, 163, 184, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
          pre { background: rgba(148, 163, 184, 0.15); padding: 12px; border-radius: 8px; overflow-x: auto; }
          blockquote { border-left: 4px solid #38bdf8; padding-left: 12px; margin-left: 0; opacity: 0.8; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid rgba(148, 163, 184, 0.3); padding: 8px 10px; text-align: left; font-size: 0.9em; }
          th { background: rgba(148, 163, 184, 0.15); }
          ul, ol { padding-left: 20px; }
          .mjx-chtml { overflow-x: auto; max-width: 100%; }
        </style>
        </head>
        <body>
        <div id="content"></div>
        <script>
          try {
            const raw = decodeURIComponent("$encodedContent");
            document.getElementById('content').innerHTML = typeof marked !== 'undefined' ? marked.parse(raw) : raw;
            if (window.MathJax && MathJax.typesetPromise) {
              MathJax.typesetPromise();
            }
          } catch(e) {
            document.getElementById('content').innerText = "$encodedContent";
          }
        </script>
        </body>
        </html>
        """.trimIndent()
    }

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                )
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                setBackgroundColor(0)
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL("https://localhost", htmlData, "text/html", "UTF-8", null)
        },
        modifier = modifier
    )
}

@Composable
private fun PdfPageItem(
    imageBitmap: ImageBitmap,
    pageIndex: Int,
    onZoomChanged: (Float) -> Unit,
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val transformState = rememberTransformableState { zoomChange, panChange, _ ->
        val newScale = (scale * zoomChange).coerceIn(1f, 4f)
        scale = newScale
        if (newScale > 1f) {
            offset += panChange
        } else {
            offset = Offset.Zero
        }
        onZoomChanged(newScale)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .transformable(state = transformState)
            .then(
                if (scale > 1f) {
                    Modifier.pointerInput(pageIndex, scale) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            val newScale = (scale * zoom).coerceIn(1f, 4f)
                            scale = newScale
                            if (newScale > 1f) {
                                offset += pan
                            } else {
                                offset = Offset.Zero
                            }
                            onZoomChanged(newScale)
                        }
                    }
                } else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Image(
            bitmap = imageBitmap,
            contentDescription = "Page ${pageIndex + 1}",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    translationX = offset.x
                    translationY = offset.y
                }
                .fillMaxSize()
        )
    }
}

private @Composable
fun NativePdfViewer(
    pdfUrl: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var pdfBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()

    LaunchedEffect(pdfUrl) {
        isLoading = true
        errorMessage = null
        withContext(Dispatchers.IO) {
            try {
                val url = java.net.URL(pdfUrl)
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                connection.connect()

                if (connection.responseCode != 200) {
                    throw Exception("Server returned HTTP ${connection.responseCode}")
                }

                val cacheFile = File(context.cacheDir, "pdf_note_${Math.abs(pdfUrl.hashCode())}.pdf")
                connection.inputStream.use { input ->
                    FileOutputStream(cacheFile).use { output ->
                        input.copyTo(output)
                    }
                }

                val pfd = ParcelFileDescriptor.open(cacheFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = android.graphics.pdf.PdfRenderer(pfd)
                val bitmaps = mutableListOf<Bitmap>()

                for (i in 0 until renderer.pageCount) {
                    val page = renderer.openPage(i)
                    val width = page.width * 2
                    val height = page.height * 2

                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val canvas = android.graphics.Canvas(bitmap)
                    canvas.drawColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmaps.add(bitmap)
                    page.close()
                }

                renderer.close()
                pfd.close()

                withContext(Dispatchers.Main) {
                    pdfBitmaps = bitmaps
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorMessage = e.message ?: "Failed to load PDF"
                    isLoading = false
                }
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.size(36.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Rendering Native PDF Pages...",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                )
            }
        } else if (errorMessage != null || pdfBitmaps.isEmpty()) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Unable to load PDF pages",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = errorMessage ?: "No rendered pages found",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(pdfUrl))
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            android.widget.Toast.makeText(context, "No PDF viewer app available", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.onBackground,
                        contentColor = MaterialTheme.colorScheme.background
                    )
                ) {
                    Text("Open PDF Externally")
                }
            }
        } else {
            val firstVisibleIndex by remember {
                derivedStateOf { listState.firstVisibleItemIndex }
            }

            val imageBitmaps = remember(pdfBitmaps) {
                pdfBitmaps.map { it.asImageBitmap() }
            }

            val pageZoomMap = remember(pdfBitmaps.size) {
                mutableStateMapOf<Int, Float>()
            }
            val activeZoom = pageZoomMap[firstVisibleIndex] ?: 1.0f

            Box(modifier = Modifier.fillMaxSize()) {
                LazyRow(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    items(imageBitmaps.size) { index ->
                        Box(
                            modifier = Modifier
                                .fillParentMaxWidth()
                                .fillMaxHeight(),
                            contentAlignment = Alignment.Center
                        ) {
                            PdfPageItem(
                                imageBitmap = imageBitmaps[index],
                                pageIndex = index,
                                onZoomChanged = { pageZoomMap[index] = it }
                            )
                        }
                    }
                }

                val coroutineScope = rememberCoroutineScope()

                // Floating Controls Bar (Theme Matched: Black & White)
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 20.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.95f))
                        .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.15f), RoundedCornerShape(24.dp))
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (imageBitmaps.size > 1) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Prev Page Button
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                                    .clickable(enabled = firstVisibleIndex > 0) {
                                        coroutineScope.launch {
                                            listState.animateScrollToItem(firstVisibleIndex - 1)
                                        }
                                    }
                                    .padding(horizontal = 8.dp, vertical = 2.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "‹",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (firstVisibleIndex > 0) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                )
                            }

                            Text(
                                text = "Page ${firstVisibleIndex + 1} / ${imageBitmaps.size}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            // Next Page Button
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                                    .clickable(enabled = firstVisibleIndex < imageBitmaps.size - 1) {
                                        coroutineScope.launch {
                                            listState.animateScrollToItem(firstVisibleIndex + 1)
                                        }
                                    }
                                    .padding(horizontal = 8.dp, vertical = 2.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "›",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (firstVisibleIndex < imageBitmaps.size - 1) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .height(14.dp)
                                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.25f))
                        )
                    }

                    // Active Zoom Indicator
                    Box(
                        modifier = Modifier.padding(horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${(activeZoom * 100).toInt()}%",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

private @Composable
fun NoteDetailScreen(
    note: ParsedNote,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val rawPdfUrl = note.pdfUrl
    val fullPdfUrl = remember(rawPdfUrl) {
        if (rawPdfUrl.isNullOrBlank()) ""
        else if (rawPdfUrl.startsWith("http://") || rawPdfUrl.startsWith("https://")) rawPdfUrl
        else "https://vidyaschool.vercel.app${if (rawPdfUrl.startsWith("/")) "" else "/"}$rawPdfUrl"
    }

    var selectedPageIdx by remember { mutableIntStateOf(0) }

    val accent = when (note.color) {
        "yellow" -> Color(0xFFF59E0B)
        "blue"   -> Color(0xFF38BDF8)
        "green"  -> Color(0xFF34D399)
        "pink"   -> Color(0xFFF472B6)
        "purple" -> Color(0xFFA78BFA)
        else     -> MaterialTheme.colorScheme.primary
    }

    val currentContent = remember(selectedPageIdx, note) {
        if (note.pages.isNotEmpty() && selectedPageIdx in note.pages.indices) {
            note.pages[selectedPageIdx].content
        } else {
            note.rawContent.ifBlank { note.body }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // Full Screen Top Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    Text(
                        text = "Note Details",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (fullPdfUrl.isNotBlank()) {
                        Button(
                            onClick = {
                                try {
                                    val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                                    val request = DownloadManager.Request(Uri.parse(fullPdfUrl))
                                        .setTitle("${note.title}.pdf")
                                        .setDescription("Downloading note PDF...")
                                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                        .setAllowedOverMetered(true)
                                        .setAllowedOverRoaming(true)
                                    downloadManager.enqueue(request)
                                    android.widget.Toast.makeText(context, "Downloading PDF...", android.widget.Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    try {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fullPdfUrl))
                                        context.startActivity(intent)
                                    } catch (ex: Exception) {
                                        android.widget.Toast.makeText(context, "Unable to download PDF", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.onBackground,
                                contentColor = MaterialTheme.colorScheme.background
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Share,
                                    contentDescription = "Download PDF",
                                    modifier = Modifier.size(13.dp),
                                    tint = MaterialTheme.colorScheme.background
                                )
                                Text(
                                    text = "Download PDF",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.background
                                )
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(accent.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = note.subject,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = accent
                            )
                        }
                    }
                    if (!note.className.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Class ${note.className}${if (!note.sectionName.isNullOrBlank()) "-${note.sectionName}" else ""}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))

            if (fullPdfUrl.isNotBlank()) {
                NativePdfViewer(
                    pdfUrl = fullPdfUrl,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    // Title
                    Text(
                        text = note.title,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    // Author & date info
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(13.dp),
                            tint = accent
                        )
                        Text(
                            text = "Published by ${note.teacherName}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                        )
                        Text(
                            text = " • ${note.timestamp}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Page Selector Chips if multiple pages
                    if (note.pages.size > 1) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState())
                                .padding(bottom = 10.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            note.pages.forEachIndexed { idx, page ->
                                val isSel = idx == selectedPageIdx
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isSel) accent else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f)
                                        )
                                        .clickable { selectedPageIdx = idx }
                                        .padding(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = "Page ${page.pageNum}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSel) Color.White else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
                                    )
                                }
                            }
                        }
                    }

                    // Full Screen Markdown + MathJax Renderer container
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.03f))
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                    ) {
                        NoteMarkdownMathView(
                            markdownContent = currentContent,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesDrawer(
    sessionManager: SessionManager,
    onDismiss: () -> Unit
) {

    var notes by remember { mutableStateOf<List<ParsedNote>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedSubject by remember { mutableStateOf("All") }
    var selectedNote by remember { mutableStateOf<ParsedNote?>(null) }

    // Color accent per note colour tag (mirrors web COLOR_MAP)
    val accentColor: @Composable (String) -> Color = { tag ->
        when (tag) {
            "yellow" -> Color(0xFFF59E0B)
            "blue"   -> Color(0xFF38BDF8)
            "green"  -> Color(0xFF34D399)
            "pink"   -> Color(0xFFF472B6)
            "purple" -> Color(0xFFA78BFA)
            else     -> MaterialTheme.colorScheme.primary
        }
    }

    // Fetch notes from backend (same logic as web frontend)
    LaunchedEffect(Unit) {
        try {
            val token = sessionManager.getSessionToken()
            if (!token.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getStudentNotes("Bearer $token")
                if (res.isSuccessful) {
                    val raw = res.body()?.notes ?: emptyList()
                    notes = raw.map { parseNoteContent(it) }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("NotesDrawer", "Failed to load notes: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    val subjects = remember(notes) {
        val set = linkedSetOf("All")
        notes.forEach { set.add(it.subject) }
        set.toList()
    }
    val filtered = remember(notes, selectedSubject) {
        if (selectedSubject == "All") notes else notes.filter { it.subject.equals(selectedSubject, ignoreCase = true) }
    }

    // Overlay + bottom sheet
    Box(
        modifier = androidx.compose.ui.Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.52f))
            .clickable(
                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                indication = null
            ) { onDismiss() }
    ) {
        Box(
            modifier = androidx.compose.ui.Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .fillMaxHeight(0.82f)
                .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                .background(MaterialTheme.colorScheme.background)
                .clickable(
                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                    indication = null
                ) { /* prevent dismiss */ }
        ) {
            Column(modifier = androidx.compose.ui.Modifier.fillMaxSize()) {
                // Handle + Header
                Box(
                    modifier = androidx.compose.ui.Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = androidx.compose.ui.Modifier
                            .width(40.dp)
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.18f))
                    )
                }

                Row(
                    modifier = androidx.compose.ui.Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(
                            imageVector = Icons.Default.Book,
                            contentDescription = null,
                            modifier = androidx.compose.ui.Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Notes",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        if (notes.isNotEmpty()) {
                            Text(
                                "(${notes.size})",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f)
                            )
                        }
                    }
                    IconButton(
                        onClick = onDismiss,
                        modifier = androidx.compose.ui.Modifier
                            .size(30.dp)
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            modifier = androidx.compose.ui.Modifier.size(15.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.07f))

                // Subject filter pills
                if (!isLoading && subjects.size > 1) {
                    androidx.compose.foundation.lazy.LazyRow(
                        modifier = androidx.compose.ui.Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(subjects.size) { idx ->
                            val sub = subjects[idx]
                            val selected = sub == selectedSubject
                            Box(
                                modifier = androidx.compose.ui.Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(
                                        if (selected) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.07f)
                                    )
                                    .clickable(
                                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                        indication = null
                                    ) { selectedSubject = sub }
                                    .padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = sub,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (selected) MaterialTheme.colorScheme.onPrimary
                                            else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f))
                }

                // Content area
                when {
                    isLoading -> {
                        // Shimmer skeleton — 3 cards
                        androidx.compose.foundation.lazy.LazyRow(
                            modifier = androidx.compose.ui.Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(3) {
                                Box(
                                    modifier = androidx.compose.ui.Modifier
                                        .width(260.dp)
                                        .height(170.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.06f))
                                )
                            }
                        }
                    }
                    filtered.isEmpty() -> {
                        Box(
                            modifier = androidx.compose.ui.Modifier
                                .fillMaxWidth()
                                .padding(top = 48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.Book,
                                    contentDescription = null,
                                    modifier = androidx.compose.ui.Modifier.size(40.dp),
                                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.2f)
                                )
                                Spacer(modifier = androidx.compose.ui.Modifier.height(8.dp))
                                Text(
                                    "No notes found",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Text(
                                    "Your teachers haven't posted any notes yet.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                                    modifier = androidx.compose.ui.Modifier.padding(top = 4.dp)
                                )
                            }
                        }
                    }
                    else -> {
                        // Horizontal scrollable note cards (mirrors web horizontal card list)
                        androidx.compose.foundation.lazy.LazyRow(
                            modifier = androidx.compose.ui.Modifier
                                .fillMaxWidth()
                                .padding(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filtered.size) { idx ->
                                val note = filtered[idx]
                                val accent = accentColor(note.color)
                                Box(
                                    modifier = androidx.compose.ui.Modifier
                                        .width(265.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                        .border(
                                            width = 1.dp,
                                            color = accent.copy(alpha = 0.25f),
                                            shape = RoundedCornerShape(16.dp)
                                        )
                                        .clickable(
                                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                            indication = null
                                        ) { selectedNote = note }
                                ) {
                                    Column(
                                        modifier = androidx.compose.ui.Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp)
                                    ) {
                                        // Top: subject badge + timestamp
                                        Row(
                                            modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Box(
                                                modifier = androidx.compose.ui.Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(accent.copy(alpha = 0.13f))
                                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                                            ) {
                                                Text(
                                                    text = note.subject,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = accent,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                            Text(
                                                text = note.timestamp,
                                                fontSize = 10.sp,
                                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f)
                                            )
                                        }

                                        Spacer(modifier = androidx.compose.ui.Modifier.height(8.dp))

                                        // Title
                                        Text(
                                            text = note.title,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )

                                        Spacer(modifier = androidx.compose.ui.Modifier.height(8.dp))

                                        // Bullet highlights
                                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            note.bullets.forEach { bullet ->
                                                Row(
                                                    verticalAlignment = Alignment.Top,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Box(
                                                        modifier = androidx.compose.ui.Modifier
                                                            .padding(top = 5.dp)
                                                            .size(5.dp)
                                                            .clip(CircleShape)
                                                            .background(accent.copy(alpha = 0.65f))
                                                    )
                                                    Text(
                                                        text = bullet,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.75f),
                                                        maxLines = 2,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            }
                                        }

                                        Spacer(modifier = androidx.compose.ui.Modifier.height(10.dp))

                                        HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                                        Spacer(modifier = androidx.compose.ui.Modifier.height(8.dp))

                                        // Footer: Teacher + Class badge
                                        Row(
                                            modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                                modifier = androidx.compose.ui.Modifier.weight(1f)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Person,
                                                    contentDescription = null,
                                                    modifier = androidx.compose.ui.Modifier.size(11.dp),
                                                    tint = accent
                                                )
                                                Text(
                                                    text = note.teacherName,
                                                    fontSize = 10.sp,
                                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.55f),
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                            if (!note.className.isNullOrBlank()) {
                                                Box(
                                                    modifier = androidx.compose.ui.Modifier
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.07f))
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(
                                                        text = "Class ${note.className}${if (!note.sectionName.isNullOrBlank()) "-${note.sectionName}" else ""}",
                                                        fontSize = 9.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Note detail dialog
    selectedNote?.let { note ->
        val accent = accentColor(note.color)
        AlertDialog(
            onDismissRequest = { selectedNote = null },
            title = {
                Column {
                    Box(
                        modifier = androidx.compose.ui.Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(accent.copy(alpha = 0.13f))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(note.subject, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = accent)
                    }
                    Spacer(modifier = androidx.compose.ui.Modifier.height(6.dp))
                    Text(note.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = androidx.compose.ui.Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(imageVector = Icons.Default.Person, contentDescription = null, modifier = androidx.compose.ui.Modifier.size(12.dp), tint = accent)
                        Text("By ${note.teacherName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text("• ${note.timestamp}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f))
                    }
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Key highlights
                    Box(
                        modifier = androidx.compose.ui.Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(accent.copy(alpha = 0.08f))
                            .border(1.dp, accent.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text("KEY HIGHLIGHTS", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = accent,
                                modifier = androidx.compose.ui.Modifier.padding(bottom = 6.dp))
                            note.bullets.forEach { bullet ->
                                Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = androidx.compose.ui.Modifier.padding(bottom = 4.dp)) {
                                    Box(modifier = androidx.compose.ui.Modifier.padding(top = 5.dp).size(5.dp).clip(CircleShape).background(accent))
                                    Text(bullet, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f))
                                }
                            }
                        }
                    }
                    // Note body
                    Box(
                        modifier = androidx.compose.ui.Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f))
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Text(note.body, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f))
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { selectedNote = null }) { Text("Close") }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun NotificationDrawer(
    sessionManager: SessionManager,
    onDismiss: () -> Unit
) {
    var notifications by remember { mutableStateOf<List<NotificationHistoryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val token = sessionManager.getSessionToken()
            if (!token.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getNotificationHistory("Bearer $token", 30)
                if (res.isSuccessful) {
                    notifications = res.body() ?: emptyList()
                } else {
                    errorMsg = "Failed to load notifications"
                }
            }
        } catch (e: Exception) {
            errorMsg = "Could not load notifications"
        } finally {
            isLoading = false
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 12.dp, bottom = 4.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
            )
        }
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.6f)
                .navigationBarsPadding(),
            contentPadding = PaddingValues(horizontal = 24.dp)
        ) {
            stickyHeader {
                Column(modifier = Modifier.background(MaterialTheme.colorScheme.surface)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Notifications",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Last 30 days",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(32.dp)
                                .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            when {
                isLoading -> {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                        }
                    }
                }
                errorMsg != null -> {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            Text(errorMsg!!, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        }
                    }
                }
                notifications.isEmpty() -> {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(painter = painterResource(id = R.drawable.ic_custom_notification), contentDescription = null, modifier = Modifier.size(32.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                                Text("No notifications in the last 30 days", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                            }
                        }
                    }
                }
                else -> {
                    items(notifications.size) { idx ->
                        val notif = notifications[idx]
                        val rawDate = notif.createdAt ?: ""
                        val dateLabel = try {
                            if (rawDate.isNotEmpty()) {
                                val datePart = rawDate.split("T").firstOrNull() ?: rawDate
                                val parts = datePart.split("-")
                                if (parts.size >= 3) {
                                    val monthNum = parts[1].toIntOrNull() ?: 0
                                    val day = parts[2].toIntOrNull() ?: 0
                                    val monthStr = when (monthNum) {
                                        1 -> "Jan"; 2 -> "Feb"; 3 -> "Mar"; 4 -> "Apr"
                                        5 -> "May"; 6 -> "Jun"; 7 -> "Jul"; 8 -> "Aug"
                                        9 -> "Sep"; 10 -> "Oct"; 11 -> "Nov"; 12 -> "Dec"
                                        else -> ""
                                    }
                                    if (monthStr.isNotEmpty()) "$monthStr $day, ${parts[0]}" else datePart
                                } else datePart
                            } else ""
                        } catch (e: Exception) { rawDate.take(10) }

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_notification),
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = notif.title.orEmpty(),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                val bodyText = notif.body.orEmpty()
                                if (bodyText.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = bodyText,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                                        lineHeight = 18.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = dateLabel,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                )
                            }
                        }
                        if (idx < notifications.lastIndex) {
                            HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f))
                        }
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
fun UpdateBanner(
    updateInfo: UpdateInfo,
    isDownloading: Boolean,
    downloadProgress: Float,
    isDownloaded: Boolean,
    onUpdateClick: () -> Unit,
    onDismissClick: () -> Unit
) {
    androidx.compose.material3.Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
        ),
        tonalElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (isDownloading) "Downloading Update" else "New Version Available",
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isDownloading) {
                            "Installing version ${updateInfo.versionName}..."
                        } else {
                            "Version ${updateInfo.versionName} is ready to install."
                        },
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (!isDownloading) {
                    Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
                    ) {
                        // Dismiss/Later button (Shadcn Outline variant)
                        androidx.compose.material3.OutlinedButton(
                            onClick = onDismissClick,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                        ) {
                            Text("Later", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        // Update Now button (Shadcn Primary variant)
                        androidx.compose.material3.Button(
                            onClick = onUpdateClick,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.onSurface,
                                contentColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Text(
                                text = if (isDownloaded) "Install" else "Update",
                                fontSize = 12.sp,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            if (isDownloading) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    androidx.compose.material3.LinearProgressIndicator(
                        progress = { downloadProgress },
                        modifier = Modifier
                            .weight(1f)
                            .height(6.dp),
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round,
                        color = MaterialTheme.colorScheme.onSurface,
                        trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                    )
                    Text(
                        text = "${(downloadProgress * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

fun parseMarkdownToAnnotatedString(
    text: String,
    primaryColor: androidx.compose.ui.graphics.Color
): androidx.compose.ui.text.AnnotatedString {
    return androidx.compose.ui.text.buildAnnotatedString {
        var i = 0
        while (i < text.length) {
            when {
                text.startsWith("**", i) -> {
                    val end = text.indexOf("**", i + 2)
                    if (end != -1) {
                        pushStyle(androidx.compose.ui.text.SpanStyle(fontWeight = androidx.compose.ui.text.font.FontWeight.Bold))
                        append(text.substring(i + 2, end))
                        pop()
                        i = end + 2
                    } else {
                        append("**")
                        i += 2
                    }
                }
                text.startsWith("*", i) -> {
                    val end = text.indexOf("*", i + 1)
                    if (end != -1 && end > i + 1) {
                        pushStyle(androidx.compose.ui.text.SpanStyle(fontStyle = androidx.compose.ui.text.font.FontStyle.Italic))
                        append(text.substring(i + 1, end))
                        pop()
                        i = end + 1
                    } else {
                        append("*")
                        i += 1
                    }
                }
                text.startsWith("`", i) -> {
                    val end = text.indexOf("`", i + 1)
                    if (end != -1) {
                        pushStyle(
                            androidx.compose.ui.text.SpanStyle(
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                background = primaryColor.copy(alpha = 0.1f),
                                color = primaryColor
                            )
                        )
                        append(text.substring(i + 1, end))
                        pop()
                        i = end + 1
                    } else {
                        append("`")
                        i += 1
                    }
                }
                text.startsWith("[", i) -> {
                    val closeBracket = text.indexOf("]", i + 1)
                    if (closeBracket != -1) {
                        val openParen = closeBracket + 1
                        if (openParen < text.length && text[openParen] == '(') {
                            val closeParen = text.indexOf(")", openParen + 1)
                            if (closeParen != -1) {
                                val linkText = text.substring(i + 1, closeBracket)
                                pushStyle(
                                    androidx.compose.ui.text.SpanStyle(
                                        color = primaryColor,
                                        textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline
                                    )
                                )
                                append(linkText)
                                pop()
                                i = closeParen + 1
                            } else {
                                append("[")
                                i += 1
                            }
                        } else {
                            append("[")
                            i += 1
                        }
                    } else {
                        append("[")
                        i += 1
                    }
                }
                else -> {
                    append(text[i])
                    i++
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocViewerScreen(
    path: String,
    fallbackContent: String? = null,
    onBack: () -> Unit
) {
    var title by remember { mutableStateOf("Documentation") }
    var markdown by remember { mutableStateOf(fallbackContent ?: "") }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(path) {
        isLoading = true
        errorMsg = null
        
        val cleanPath = when {
            path.contains("vercel.app") -> "/" + path.split("vercel.app/").last().trim('/')
            else -> "/" + path.trim('/')
        }
        
        val localContent = localDocMarkdowns[cleanPath]
        if (localContent != null) {
            val titleLine = localContent.split("\n").firstOrNull() ?: "# Documentation"
            title = titleLine.replace("#", "").trim()
            markdown = localContent
            isLoading = false
            return@LaunchedEffect
        }
        
        try {
            val response = RetrofitClient.authApi.getDocMarkdown(cleanPath)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                title = body.title
                markdown = body.markdown
            } else {
                if (fallbackContent.isNullOrBlank()) {
                    errorMsg = "Failed to load document content: ${response.code()}"
                } else {
                    markdown = fallbackContent
                }
            }
        } catch (e: Exception) {
            if (fallbackContent.isNullOrBlank()) {
                errorMsg = "Connection failed: ${e.localizedMessage}"
            } else {
                markdown = fallbackContent
            }
        } finally {
            isLoading = false
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        title, 
                        fontSize = 18.sp, 
                        fontWeight = FontWeight.Bold, 
                        maxLines = 1, 
                        overflow = TextOverflow.Ellipsis
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(strokeWidth = 2.5.dp, modifier = Modifier.size(36.dp))
                }
            } else if (errorMsg != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(errorMsg!!, color = MaterialTheme.colorScheme.error, fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onBack) {
                        Text("Go Back")
                    }
                }
            } else {
                val scrollState = rememberScrollState()
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val lines = markdown.split("\n")
                    lines.forEach { line ->
                        val trimmed = line.trim()
                        val primaryColor = MaterialTheme.colorScheme.primary
                        when {
                            trimmed.startsWith("# ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = primaryColor,
                                    modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
                                )
                            }
                            trimmed.startsWith("## ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(3), primaryColor),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.padding(top = 8.dp, bottom = 2.dp)
                                )
                            }
                            trimmed.startsWith("### ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(4), primaryColor),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(top = 4.dp, bottom = 1.dp)
                                )
                            }
                            trimmed.startsWith("> ") -> {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .width(3.dp)
                                            .height(16.dp)
                                            .background(primaryColor, RoundedCornerShape(1.5.dp))
                                            .align(Alignment.CenterVertically)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.75f),
                                        lineHeight = 18.sp,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                            trimmed.startsWith("- ") || trimmed.startsWith("* ") -> {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(start = 8.dp).padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "•",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = primaryColor
                                    )
                                    Text(
                                        text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                            trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. ") || trimmed.startsWith("4. ") || trimmed.startsWith("5. ") || trimmed.startsWith("6. ") -> {
                                val dotIndex = trimmed.indexOf(". ")
                                val num = trimmed.substring(0, dotIndex + 1)
                                val text = trimmed.substring(dotIndex + 2)
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(start = 8.dp).padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = num,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = primaryColor
                                    )
                                    Text(
                                        text = parseMarkdownToAnnotatedString(text, primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                            trimmed.isEmpty() -> {
                                Spacer(modifier = Modifier.height(6.dp))
                            }
                            else -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed, primaryColor),
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f),
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

val localDocMarkdowns = mapOf(
    "/docs/auth/signup" to """# Account Registration (Signup)
Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.

## Step-by-Step Guide

### 01. Select preferred Role
Choose between 'Student' or 'Teacher' when creating your profile. Students are registered directly on submission, whereas Teachers are queued for manual administrative verification before portal activation.

### 02. Email & Credentials
Provide your full name, institutional email address, and select a secure password. Ensure institutional emails are typed correctly to receive verification links.

### 03. Social Logins (Alternative)
Alternatively, click Google or GitHub icons to link and sign in directly using OAuth social login channels. This automatically verifies your email profile.""",

    "/docs/auth/login" to """# Portal Login Streams
Walkthrough on signing into the dashboard and accessing your designated workspace controls.

## Details

### 1. Credential Login
Input your registered email address and password on the login screen. Click Sign In to verify credentials.

### 2. Automatic Dashboard Redirects
Upon successful authentication, the gateway redirects you to your corresponding dashboard layout:
- **Students**: Redirected to `/student/[username]` dashboard.
- **Teachers**: Redirected to `/teacher/[username]` workspace.
- **Accounts Clerks**: Redirected to `/accounts/[username]` control panels.
- **Administrators**: Redirected to `/admin/[username]` command center.""",

    "/docs/auth/approval" to """# Verification & Educator Approvals
Understand the email verification cycle and administrative approval flows for teachers.

## Details

### 1. Email Verification links
Upon creating an account, an automated email verification link is transmitted. Clicking this link verifies your profile status, enabling dashboard onboarding.

### 2. Educator/Teacher Approval Waiting Room
For security, new teacher registrations are placed in a 'pending' state. Teachers will be redirected to the Waiting Room page and cannot access classroom tools. Once an Administrator audits and approves the teacher request, access is instantly granted.""",

    "/docs/student/onboarding" to """# Student Profile Onboarding
Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.

## Step-by-Step Guide

### 01. Admission Number & Phone Registration
Input your official school-assigned admission key (e.g. 2024/STU/102). This matches your registration with the central registrar database. Submit your primary mobile number to register for automated text alert streams.

### 02. Assigned Class Bracket & Section Setup
Select your active grade level and sections. This configures your dashboard feeds, class homework journals, and examination calendars. Double-check this selection as class assignments can only be changed by administrators.

### 03. Mode of Commute selection
Choose between 'Walking' and 'School Transport'. Selecting School Transport links your profile to transit logs and school bus schedules. Walkers are tracked for perimeter checkouts only.

### 04. Parent / Guardian Contact Information
Submit parent names, emergency phone numbers, and optional email IDs. This is required for fee-due notices, progress report card sign-offs, and critical school announcements.

### 05. Mailing Address Verification
Provide street address, state, city, and a valid 6-digit postal pincode. This is verified against municipal zones for school transport routing setups.

## Additional Details

### Why is onboarding mandatory?
Without completed onboarding records, the database locks student dashboard access. Complete profile registration resolves database tags, allowing instant ledger views, report card releases, and message boards logs.

### Troubleshooting common errors
If the screen reports 'Admission number already exists', it means another profile is registered with those details. Contact the administration helpdesk to reset credentials. Ensure your pincode contains exactly 6 digits.""",

    "/docs/student/fees" to """# Fees Ledger & Online Payments
Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.

## Details

### 1. Auditing the Fees Ledger
Navigate to the Fees section of your sidebar. The ledger details all generated monthly fee installments, itemized by basic tuition, transport surcharge, and activity fees. Outstanding items are categorized as 'Pending' or 'Overdue' (past payment deadline), while settled items are marked as 'Paid'.

### 2. Executing Online Payments
Click the Pay Now button next to any unpaid installment. This launches the secure Razorpay Checkout overlay. You can process transactions using credit/debit cards, NetBanking, mobile wallets, or instant UPI (Google Pay, PhonePe, Paytm). Confirmations are processed in real-time, instantly marking installments as Paid.

### 3. Downloading Official Receipts
Once paid, click the 'PDF Receipt' action next to the installment. This generates a digitally signed PDF invoice showing receipt numbers, transaction reference IDs, and payment stamps. Keep these for tax clearance audits.

### 4. Scholarship Concessions & Waivers
If you are on EWS, Merit-based, or Sports scholarships, concessions are applied directly to the installment amount. Check the 'Applied Waiver' lines on the card detail drawers. Contact the accountant's desk if waivers are missing.""",

    "/docs/student/marks" to """# Academic Marks & Performance Sheets
Detailed view of your test results, subject aggregates, term percentages, and grade cards.

## Details

### 1. Navigating Grades
The Marks portal compiles all test sheets published by teachers. Select terms (Term 1, Mid-Term, Term 2) or filter by specific subjects (Mathematics, Physics, English) using the filter dropdown cards.

### 2. Weighted Grading System
Your final subject percentages are calculated using weighted grades: Assignments contribute 20% to the subject grade, Mid-Terms contribute 30%, and Term Finals contribute 50%. The cumulative GPA is auto-generated upon term final score submissions.

### 3. Accessing Remarks & Sign-offs
Check teacher comments on assignment lines. Report cards require parent sign-off parameters, which are tracked on the profile dashboard sheets.""",

    "/docs/student/library" to """# Library Catalog & Borrowing Tracker
Manage issued books, verify return deadlines, avoid late fines, and search library collections.

## Details

### 1. Borrowed Books Ledger
The library card lists all active books issued to your student card. Each item lists the library barcode, book title, checkout date, and return deadline. Items past deadlines are flagged with high-visibility overdue warnings.

### 2. Fine Calculation Surcharges
Overdue books accumulate library fines at a rate of ₹10 per day. Accumulated fines are added to the next student fees ledger installment automatically. Prompt returns avoid these charges.

### 3. Catalog Search
Search the digital catalog by title, author, or genre to check current shelf availability before visiting the library desk.""",

    "/docs/student/complaints" to """# Filing a Complaint & Support Tickets
Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.

## Details

### 1. Launching a Ticket
Click the File a Complaint button in the sidebar. This opens the complaint submission modal, which bypasses general inbox channels to route issues directly to designated staff.

### 2. Recipient Routing Options
Select the appropriate destination for your issue:
- **Teacher**: For classroom, syllabus, or peer concerns.
- **Tech Support (Admin)**: For portal issues, password resets, or device bugs.
- **Principal / Vice-Principal (Admin)**: For serious escalations or infrastructural reports.

### 3. Tagging Users
Use the 'Tag People' field to reference specific users. Start typing '@' to search and tag students or teachers. Tagged users will receive a copy of the ticket in their portal notifications.

### 4. Tracking Resolutions
Upon submission, the portal outputs a success toast with a unique reference number (e.g., CMP-77169). Use this ID to track updates with support clerks.""",

    "/docs/teacher/roster" to """# Class Roster & Student Profiles
Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.

## Details

### 1. Roster Auditing
Access the Class section of your dashboard. The roster grid lists all assigned class students, including admission codes, registered emails, and onboarding statuses (Completed vs Pending).

### 2. Filtering & Contact Cards
Use search bars to filter by student name. Clicking a student row opens their contact card, listing parent names, emergency phone numbers, and commute modes (Walking vs Transport). This is critical for organizing school bus routes or coordinating parent updates.""",

    "/docs/teacher/grading" to """# Marks Submission & Grading Management
Learn how to record student test scores, batch-submit term exams, and publish grades.

## Details

### 1. Entering Grades
Navigate to your assigned subjects page. Select the target class and exam type (Assignment, Midterm, or Final Exam). The grid updates to show input fields for each student.

### 2. Score Ranges & Validation
Input numeric scores within the designated max limits (e.g. 0-100). The form checks inputs in real-time, preventing input of values exceeding max limits or negative scores.

### 3. Grade Publishing
Review the filled grades and click Submit. Published scores update student report cards instantly and trigger GPA/average percentage recalculations.""",

    "/docs/teacher/notices" to """# Publishing Notices & Announcements
Broadcast class updates, homework tasks, or exam announcements directly to student portals.

## Details

### 1. Creating an Announcement
Open the Notices tab and click New Announcement. Draft your notice, add titles, select target classes (e.g. Class 10-A, Class 9-B), and attach optional files.

### 2. Broadcast Delivery
Clicking Publish instantly pushes the notice to the target student notice board streams. Important notices can be flagged as urgent to display warning flags on student log screens.""",

    "/docs/teacher/escalations" to """# Leave Requests & Supplies Procurements
How to submit official leaves or supply orders directly to administration.

## Details

### 1. Supply Orders
Request classroom materials (supplies, books, lab assets) through the requests panel. Input item names, quantities, and justification reasons. Admin reviews requests in real-time.

### 2. Submitting Leave Requests
Select the leave option, choose date ranges, input reason descriptions, and submit. Status fields update to Approved or Rejected as admin reviews the request.""",

    "/docs/teacher/complaints" to """# Educator Support & Complaint Tickets
Log infrastructural issues or coordinate reports directly with coordinators or IT support.

## Details

### 1. Submitting Support Requests
Use the File a Complaint button in the sidebar. Select Academic Coordinator, Principal, or IT Support, fill in titles, tag users, and describe your request. CMP reference numbers are issued for all submissions.""",

    "/docs/privacy-policy" to """# Privacy Policy
This Privacy Policy details how VidyaSchool and BlazeNeuro collect, process, safeguard, and govern personal data for students, guardians, educators, and administrators across web and mobile platforms.

## 1. Scope & Data Fiduciary Details
Applies to all users across web, Android, iOS, and API interfaces. We process records strictly for educational delivery in compliance with FERPA, COPPA, and DPDP frameworks. We do not sell or monetize student data.

## 2. Information We Collect
- **Identity & Profile**: Legal names, emails, credentials, admission numbers, class/section allocations.
- **Guardian Coordinates**: Parent/guardian contact numbers, emergency addresses, bus route preferences.
- **Academic Records**: Attendance registers, exam marks, gradebooks, report cards, teacher remarks.
- **Financial Logs**: Fee ledgers, transaction references, payment status flags (Razorpay tokenized).
- **Study Materials**: Notes, drawings, syllabus PDFs, complaint tickets.
- **Technical & Session Data**: IP addresses, user-agents, session tokens (`better-auth.session_token`), FCM tokens.

## 3. Purposes & Legal Bases
- Administering student onboarding, attendance, report cards, and digital fee processing.
- Dispatching emergency alerts, attendance notifications, and payment receipts via WebPush, SMS, and email.
- Enforcing Role-Based Access Control (RBAC) and securing multi-device sessions.

## 4. Children's Privacy, FERPA & Parental Consent
School institutions warrant valid parental/guardian consent upon registering student accounts. Minors are never subjected to behavioral profiling, commercial data mining, or targeted advertising.

## 5. Data Sharing & Subprocessors
We do not sell student data. Data is processed through vetted infrastructure partners (Neon PostgreSQL, Vercel, Razorpay, Firebase FCM, AWS S3/Cloudinary, Resend) under strict confidentiality agreements.

## 6. Cookies & Session Management
Strictly necessary session tokens are used to maintain authenticated states. Users can inspect and remotely revoke active device sessions via the Active Sessions security console.

## 7. Data Retention & Security
Records are retained for the duration of student enrollment plus statutory institutional auditing periods (5-7 years). All transmissions are encrypted via HTTPS/TLS 1.3, with AES-256 encryption at rest.

## 8. Your Legal Rights & Grievance Contact
Parents and students retain rights of access, rectification, portability, and session revocation.
For privacy inquiries or grievance redressal, contact our Data Protection Officer at `privacy@vidyaschool.com` or `legal@blazeneuro.com`.""",

    "/docs/terms-of-service" to """# Terms of Service
These Terms of Service regulate access and use of the VidyaSchool digital portal, mobile applications, APIs, student information systems, fee collection interfaces, and associated services operated by VidyaSchool and BlazeNeuro.

## 1. Binding Agreement & Acceptance of Terms
By registering an account, verifying onboarding forms, authenticating sessions, processing fee transactions, or using any portal services, you agree to be legally bound by these Terms and our Privacy Policy. If you disagree with any portion of these Terms, portal access must be discontinued immediately.

## 2. Eligibility & Minor Consent
Students under the age of majority may only use the Platform under the consent, supervision, and financial responsibility of their parent, legal guardian, or authorized educational institution under applicable student data protection laws (FERPA, COPPA, DPDP).

## 3. Accounts, Authentication & Security
Users must provide true, complete, and verifiable admission information. Sharing login credentials or multi-session tokens is prohibited. Users are solely responsible for maintaining credential secrecy and immediately revoking compromised sessions via the Active Sessions dashboard.

## 4. Role-Specific Obligations & Academic Integrity
- **Students**: Academic honesty, non-tampering with marks or attendance, respectful conduct in chat boards.
- **Teachers & Librarians**: Accuracy and integrity of gradebooks, examination registers, lecture notes, and library catalog records. Mandatory administrative verification before account activation.
- **Accountants & Administrators**: Strict compliance with fee structures, audit standards, discount waivers, and user privilege delegations.

## 5. Fees, Gateway Transactions & Refund Policy
Tuition fee processing utilizes licensed third-party gateways (Razorpay, UPI). Digital receipts generated by the accountant portal serve as official settlement proof. VidyaSchool is a technology intermediary; all fee disputes, waivers, and refund policies are governed strictly by the respective educational institution.

## 6. Acceptable Use & Prohibited Conduct
Zero tolerance for security probing, denial-of-service attacks, reverse engineering, automated data scraping, malicious file uploads, cheating/fraud, or defamatory, harassing, and obscene communications.

## 7. Intellectual Property & User Content
VidyaSchool and BlazeNeuro retain all rights and titles to proprietary software, UI, logos, and shaders. Users retain ownership of uploaded study notes while granting VidyaSchool a royalty-free license to host, format, and display such materials for educational delivery.

## 8. AI-Assisted Educational Tools Disclaimer
AI Page Builder, formula helpers, and quiz generators are provided strictly as supplemental study aids on an "AS-IS" basis. VidyaSchool disclaims all warranties regarding the factual correctness or curriculum compliance of AI outputs.

## 9. Electronic Communications & Push Alerts
Users consent to receiving operational and transactional alerts via WebPush, FCM, SMS, and email. Carrier delays or device notification failures do not constitute service liability.

## 10. Third-Party Infrastructure
The Platform relies on third-party cloud infrastructure (Razorpay, Neon Database, Cloudinary/S3, Firebase, Vercel). VidyaSchool is not liable for upstream vendor outages.

## 11. Suspension & Account Termination
We reserve the right to suspend or terminate accounts that breach portal rules, violate academic guidelines, or post false information without prior notice.

## 12. Disclaimer of Warranties
The Platform is provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind, express or implied.

## 13. Limitation of Liability
In no event shall VidyaSchool or BlazeNeuro be liable for indirect, incidental, punitive, or consequential damages. Maximum aggregate liability is strictly capped at fees actually paid in the preceding three months or $100 USD.

## 14. Indemnification
Users agree to defend, indemnify, and hold harmless VidyaSchool and BlazeNeuro from legal claims arising out of user misuse, breach of terms, or law violations.

## 15. Governing Law & Dispute Resolution
Governed by the substantive laws of India. Unresolved disputes shall be settled through mandatory good-faith negotiation followed by binding individual arbitration in Bengaluru, Karnataka, India.

## 16. General Provisions & Legal Contact
For legal inquiries, contact the Legal & Compliance Cell at `legal@blazeneuro.com` or `support@vidyaschool.com`."""
)

@Composable
fun QuickSearchDialog(
    sessionManager: SessionManager,
    onTabSelect: (String) -> Unit,
    onDocSelect: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<SearchUserResponse>>(emptyList()) }
    var backendSearchResults by remember { mutableStateOf<List<SearchBackendResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var selectedUserDetail by remember { mutableStateOf<SearchUserResponse?>(null) }
    val focusRequester = remember { androidx.compose.ui.focus.FocusRequester() }

    val role = remember { sessionManager.getRole() ?: "student" }
    val isDark = isSystemInDarkTheme()
    val surfaceColor = MaterialTheme.colorScheme.surface
    val onSurface = MaterialTheme.colorScheme.onSurface

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(query) {
        if (query.isBlank()) {
            searchResults = emptyList()
            backendSearchResults = emptyList()
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        try {
            val token = sessionManager.getSessionToken() ?: ""
            val authHeader = "Bearer $token"
            val username = sessionManager.getUsername() ?: ""

            val response = RetrofitClient.authApi.searchUsers(authHeader, query)
            if (response.isSuccessful) {
                searchResults = response.body() ?: emptyList()
            }

            val backendResponse = RetrofitClient.authApi.searchBackend(query, role, username)
            if (backendResponse.isSuccessful) {
                backendSearchResults = backendResponse.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("QuickSearch", "Search error: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    val filteredPages = remember(query, backendSearchResults) {
        if (query.isBlank()) emptyList()
        else backendSearchResults.filter { !it.url.contains("/docs/") && !it.url.contains("privacy-policy") && !it.url.contains("terms-of-service") }
    }

    val filteredDocs = remember(query, backendSearchResults) {
        if (query.isBlank()) emptyList()
        else backendSearchResults.filter { it.url.contains("/docs/") || it.url.contains("privacy-policy") || it.url.contains("terms-of-service") }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable { onDismiss() },
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 32.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(surfaceColor)
                    .border(1.dp, onSurface.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                    .clickable(enabled = false) {}
                    .padding(16.dp)
            ) {
                // Input header - clean input box without ESC badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_custom_search),
                        contentDescription = "Search",
                        modifier = Modifier.size(20.dp),
                        tint = onSurface.copy(alpha = 0.6f)
                    )
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                        if (query.isEmpty()) {
                            Text(
                                "Search pages, users, docs…",
                                fontSize = 15.sp,
                                color = onSurface.copy(alpha = 0.38f)
                            )
                        }
                        androidx.compose.foundation.text.BasicTextField(
                            value = query,
                            onValueChange = { query = it },
                            textStyle = androidx.compose.ui.text.TextStyle(
                                fontSize = 15.sp,
                                color = onSurface,
                                fontWeight = FontWeight.Normal
                            ),
                            cursorBrush = androidx.compose.ui.graphics.SolidColor(if (isDark) Color.White else Color.Black),
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(focusRequester)
                        )
                    }
                    if (query.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(onSurface.copy(alpha = 0.08f))
                                .clickable { query = "" },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Clear",
                                modifier = Modifier.size(14.dp),
                                tint = onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }

                if (isLoading) {
                    Spacer(modifier = Modifier.height(16.dp))
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth().height(2.dp), color = MaterialTheme.colorScheme.primary)
                }

                if (query.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = onSurface.copy(alpha = 0.08f))
                    Spacer(modifier = Modifier.height(12.dp))

                    LazyColumn(
                        modifier = Modifier.heightIn(max = 400.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (filteredPages.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Pages & Features")
                            }
                            items(filteredPages.size) { idx ->
                                val item = filteredPages[idx]
                                val tabKey = when {
                                    item.url.contains("/fees", ignoreCase = true) -> "fees"
                                    item.url.contains("/notice", ignoreCase = true) -> "notice"
                                    item.url.contains("/community", ignoreCase = true) -> "community"
                                    item.url.contains("/library", ignoreCase = true) -> "library"
                                    item.url.contains("/profile", ignoreCase = true) -> "profile"
                                    else -> "home"
                                }
                                SearchResultRow(
                                    title = item.title,
                                    subtitle = item.content,
                                    icon = Icons.Default.Home,
                                    category = "Page",
                                    onClick = {
                                        onTabSelect(tabKey)
                                    }
                                )
                            }
                        }

                        if (searchResults.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Users (${searchResults.size})")
                            }
                            items(searchResults.size) { idx ->
                                val user = searchResults[idx]
                                SearchResultRow(
                                    title = user.name,
                                    subtitle = "@${user.username}",
                                    icon = Icons.Default.Person,
                                    category = user.role.uppercase(),
                                    onClick = { selectedUserDetail = user }
                                )
                            }
                        }

                        if (filteredDocs.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Documentation")
                            }
                            items(filteredDocs.size) { idx ->
                                val doc = filteredDocs[idx]
                                SearchResultRow(
                                    title = doc.title,
                                    subtitle = doc.content,
                                    icon = Icons.Default.Info,
                                    category = "Doc",
                                    onClick = {
                                        onDocSelect(doc.url, doc.content)
                                    }
                                )
                            }
                        }

                        if (filteredPages.isEmpty() && searchResults.isEmpty() && filteredDocs.isEmpty() && !isLoading) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "No results found for \"$query\"",
                                        fontSize = 14.sp,
                                        color = onSurface.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (selectedUserDetail != null) {
        val user = selectedUserDetail!!
        AlertDialog(
            onDismissRequest = { selectedUserDetail = null },
            modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
            containerColor = MaterialTheme.colorScheme.background,
            title = {
                Text(user.name, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Role: ${user.role.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.ROOT) else it.toString() }}", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("Username: @${user.username}", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedUserDetail = null },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Close", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}




