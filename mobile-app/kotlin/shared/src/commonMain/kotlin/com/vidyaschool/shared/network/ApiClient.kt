package com.vidyaschool.shared.network

import com.vidyaschool.shared.models.*

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.plugins.logging.SIMPLE
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * Shared Ktor HTTP client wrapping all VidyaSchool API calls.
 *
 * Two base URLs mirror the existing RetrofitClient:
 *   - [BACKEND_URL]  → https://api.vidyaschool.com  (primary backend)
 *   - [FRONTEND_URL] → https://vidyaschool.vercel.app (frontend/public routes)
 *
 * All methods return the raw deserialized response body. Callers should handle
 * exceptions (e.g. [io.ktor.client.plugins.ResponseException]) to surface
 * network/HTTP errors to the UI layer.
 */
class ApiClient {

    companion object {
        const val BACKEND_URL = "https://api.vidyaschool.com"
        const val FRONTEND_URL = "https://vidyaschool.vercel.app"
    }

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    val httpClient: HttpClient = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }
        install(Logging) {
            logger = Logger.SIMPLE
            level = LogLevel.INFO
        }
    }

    // -----------------------------------------------------------------------
    // Auth
    // -----------------------------------------------------------------------

    suspend fun login(request: LoginRequest): LoginResponse =
        httpClient.post("$FRONTEND_URL/api/auth/sign-in/email") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    suspend fun signup(request: SignupRequest): SignupResponse =
        httpClient.post("$FRONTEND_URL/api/auth/sign-up/email") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    // -----------------------------------------------------------------------
    // Session
    // -----------------------------------------------------------------------

    suspend fun getUserRole(email: String): UserRoleResponse =
        httpClient.get("$BACKEND_URL/api/public/user-role/$email").body()

    suspend fun createSession(request: CreateSessionRequest): CreateSessionResponse =
        httpClient.post("$BACKEND_URL/api/public/create-session") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    suspend fun verifySession(token: String): VerifySessionResponse =
        httpClient.get("$BACKEND_URL/api/public/verify-session/$token").body()

    // -----------------------------------------------------------------------
    // Slider
    // -----------------------------------------------------------------------

    suspend fun getSliderImages(role: String, studentClass: String? = null): List<SliderImage> =
        httpClient.get("$BACKEND_URL/api/slider/images") {
            parameter("role", role)
            if (studentClass != null) parameter("student_class", studentClass)
        }.body()

    suspend fun updateSliderImages(images: List<SliderImage>): UpdateSliderImagesResponse =
        httpClient.post("$BACKEND_URL/api/admin/slider-images") {
            contentType(ContentType.Application.Json)
            setBody(images)
        }.body()

    // -----------------------------------------------------------------------
    // Fees
    // -----------------------------------------------------------------------

    suspend fun getMyFees(authToken: String): List<FeeInstallment> =
        httpClient.get("$BACKEND_URL/api/fees") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun payFees(authToken: String, request: PayFeesRequest): PayFeesResponse =
        httpClient.post("$BACKEND_URL/api/fees/pay") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    suspend fun createOrder(authToken: String, request: CreateOrderRequest): CreateOrderResponse =
        httpClient.post("$BACKEND_URL/api/create-order") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    suspend fun verifyPayment(authToken: String, request: VerifyPaymentRequest): PayFeesResponse =
        httpClient.post("$BACKEND_URL/api/verify-payment") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()

    /** Returns raw receipt JSON as a Map. */
    suspend fun verifyReceipt(receiptNo: String): HttpResponse =
        httpClient.get("$BACKEND_URL/api/fees/receipt/$receiptNo")

    // -----------------------------------------------------------------------
    // Users / Search
    // -----------------------------------------------------------------------

    suspend fun searchUsers(authToken: String, query: String?): List<SearchUserResponse> =
        httpClient.get("$BACKEND_URL/api/users/search") {
            header("Authorization", "Bearer $authToken")
            if (query != null) parameter("q", query)
        }.body()

    suspend fun searchBackend(
        query: String?,
        role: String?,
        username: String?
    ): List<SearchBackendResponse> =
        httpClient.get("$BACKEND_URL/api/search") {
            if (query != null) parameter("q", query)
            if (role != null) parameter("role", role)
            if (username != null) parameter("username", username)
        }.body()

    suspend fun getDocMarkdown(path: String): DocMarkdownResponse =
        httpClient.get("$BACKEND_URL/api/search/markdown") {
            parameter("path", path)
        }.body()

    // -----------------------------------------------------------------------
    // Profile
    // -----------------------------------------------------------------------

    suspend fun getProfile(authToken: String): ProfileResponse =
        httpClient.get("$BACKEND_URL/api/profile") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun updateProfile(authToken: String, request: ProfileUpdateRequest): HttpResponse =
        httpClient.patch("$BACKEND_URL/api/profile") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }

    // -----------------------------------------------------------------------
    // Onboarding
    // -----------------------------------------------------------------------

    suspend fun getOnboardingStatus(authToken: String): OnboardingStatusResponse =
        httpClient.get("$BACKEND_URL/api/onboarding/status") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun submitOnboarding(authToken: String, request: OnboardingSubmitRequest): HttpResponse =
        httpClient.post("$BACKEND_URL/api/onboarding") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }

    // -----------------------------------------------------------------------
    // Library / Borrowings
    // -----------------------------------------------------------------------

    suspend fun getStudentBorrowings(authToken: String): List<StudentBorrowingResponse> =
        httpClient.get("$BACKEND_URL/api/student/borrowings") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun renewBook(authToken: String, request: StudentRenewRequest): HttpResponse =
        httpClient.patch("$BACKEND_URL/api/student/borrowings") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(request)
        }

    // -----------------------------------------------------------------------
    // Notices
    // -----------------------------------------------------------------------

    suspend fun getNotices(authToken: String): List<NoticeResponse> =
        httpClient.get("$BACKEND_URL/api/notices") {
            header("Authorization", "Bearer $authToken")
        }.body()

    // -----------------------------------------------------------------------
    // Student Dashboard & Academics
    // -----------------------------------------------------------------------

    suspend fun getTopPerformers(authToken: String): LeaderboardResponse =
        httpClient.get("$BACKEND_URL/api/student/leaderboard") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun getStudentMarks(authToken: String): Map<String, com.vidyaschool.shared.models.StudentExamResult> =
        httpClient.get("$BACKEND_URL/api/student/marks") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun getStudentCalendar(authToken: String): com.vidyaschool.shared.models.TeacherCalendarResponse =
        httpClient.get("$BACKEND_URL/api/student/calendar") {
            header("Authorization", "Bearer $authToken")
        }.body()

    suspend fun getStudentNotes(authToken: String): com.vidyaschool.shared.models.StudentNotesResponse =
        httpClient.get("$BACKEND_URL/api/student/notes") {
            header("Authorization", "Bearer $authToken")
        }.body()


    // -----------------------------------------------------------------------
    // FCM / Notifications
    // -----------------------------------------------------------------------

    suspend fun registerFcmToken(authToken: String, token: String): HttpResponse =
        httpClient.post("$BACKEND_URL/api/notifications/register-token") {
            header("Authorization", "Bearer $authToken")
            contentType(ContentType.Application.Json)
            setBody(mapOf("token" to token))
        }

    suspend fun getNotificationHistory(
        authToken: String,
        days: Int = 30
    ): List<NotificationHistoryItem> =
        httpClient.get("$BACKEND_URL/api/notifications/history") {
            header("Authorization", "Bearer $authToken")
            parameter("days", days)
        }.body()

    // -----------------------------------------------------------------------
    // Device Code Auth (Browser Login)
    // -----------------------------------------------------------------------

    suspend fun getDeviceCode(): DeviceCodeResponse =
        httpClient.post("$BACKEND_URL/api/auth/device/code").body()

    suspend fun pollDeviceStatus(deviceToken: String): DevicePollResponse =
        httpClient.post("$BACKEND_URL/api/auth/device/poll") {
            contentType(ContentType.Application.Json)
            setBody(DevicePollRequest(deviceToken))
        }.body()
}
