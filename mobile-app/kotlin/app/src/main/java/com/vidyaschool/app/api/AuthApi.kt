package com.vidyaschool.app.api

import com.google.gson.annotations.SerializedName
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Header
import retrofit2.http.Streaming
import retrofit2.http.DELETE

data class StudentNote(
    val id: String,
    @SerializedName("teacher_id") val teacherId: String? = null,
    val title: String? = null,
    val content: String? = null,
    val color: String? = null,
    @SerializedName("class") val targetClass: String? = null,
    val section: String? = null,
    val subject: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("updated_at") val updatedAt: String? = null,
    @SerializedName("teacher_name") val teacherName: String? = null,
    @SerializedName("pdf_url") val pdfUrl: String? = null
)

data class StudentNotesResponse(
    val notes: List<StudentNote>? = null
)

data class SessionItem(
    val id: String,
    val token: String,
    @SerializedName("ip_address") val ipAddress: String? = null,
    @SerializedName("user_agent") val userAgent: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("expires_at") val expiresAt: String? = null,
    @SerializedName("is_current") val isCurrent: Boolean = false
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class SignupRequest(
    val email: String,
    val password: String,
    val name: String,
    val role: String = "student"
)

data class SignupResponse(
    val user: User?,
    val token: String?,
    val message: String?
)

data class LoginResponse(
    val user: User?,
    val token: String?,
    val session: Session?,
    val message: String?
)

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val role: String?,
    val image: String? = null
)

data class Session(
    val token: String,
    val expiresAt: String
)

data class UserRoleResponse(
    val role: String,
    val name: String?,
    val image: String? = null,
    @SerializedName("student_class") val studentClass: String? = null
)

data class CreateSessionRequest(
    val email: String
)

data class CreateSessionResponse(
    val success: Boolean,
    val session: SessionDetails?
)

data class SessionDetails(
    val id: String,
    val token: String,
    val expiresAt: String
)

data class VerifySessionResponse(
    val valid: Boolean,
    val role: String?,
    val name: String?,
    val image: String?,
    @SerializedName("student_class") val studentClass: String? = null,
    val username: String? = null
)

data class UpdateSliderImagesResponse(
    val success: Boolean,
    val images: List<SliderImage>
)

data class SliderImage(
    val id: Int,
    val url: String,
    val title: String,
    val enabled: Boolean,
    @SerializedName("target_audience") val targetAudience: String = "all",
    @SerializedName("target_classes") val targetClasses: String = "all"
)

data class TeacherCalendarEvent(
    val id: String? = null,
    val title: String,
    val time: String,
    val room: String? = null
)

data class TeacherCalendarResponse(
    @SerializedName("todayDateStr") val todayDateStr: String? = null,
    @SerializedName("todayEvents") val todayEvents: List<TeacherCalendarEvent>? = null,
    @SerializedName("tomorrowEvents") val tomorrowEvents: List<TeacherCalendarEvent>? = null
)

data class FeeInstallment(
    val id: String,
    @SerializedName("user_id") val userId: String,
    val month: String,
    val year: String,
    val amount: Double,
    @SerializedName("due_date") val dueDate: String?,
    val status: String,
    @SerializedName("paid_date") val paidDate: String?,
    @SerializedName("receipt_no") val receiptNo: String?,
    @SerializedName("payment_method") val paymentMethod: String?,
    @SerializedName("qr_data_url") val qrDataUrl: String?
)

data class PayFeesRequest(
    @SerializedName("installment_ids") val installmentIds: List<String>,
    @SerializedName("payment_method") val paymentMethod: String? = "Card / Online"
)

data class PayFeesResponse(
    val success: Boolean,
    @SerializedName("receipt_no") val receiptNo: String?,
    @SerializedName("paid_date") val paidDate: String?
)

data class CreateOrderRequest(
    @SerializedName("installment_ids") val installmentIds: List<String>,
    val amount: Int,
    val receipt: String? = null
)

data class CreateOrderResponse(
    @SerializedName("order_id") val orderId: String?,
    val amount: Int?,
    val currency: String?,
    val receipt: String?,
    @SerializedName("installment_ids") val installmentIds: List<String>?,
    @SerializedName("key_id") val keyId: String?,
    @SerializedName("mock_payment") val mockPayment: Boolean? = false
)

data class VerifyPaymentRequest(
    @SerializedName("order_id") val orderId: String,
    @SerializedName("payment_id") val paymentId: String,
    val signature: String,
    @SerializedName("installment_ids") val installmentIds: List<String>,
    @SerializedName("payment_method") val paymentMethod: String = "Razorpay"
)

interface AuthApi {
    @POST("api/auth/sign-in/email")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/sign-up/email")
    suspend fun signup(@Body request: SignupRequest): Response<SignupResponse>

    @GET("api/public/user-role/{email}")
    suspend fun getUserRole(@Path("email") email: String): Response<UserRoleResponse>

    @POST("api/public/create-session")
    suspend fun createSession(@Body request: CreateSessionRequest): Response<CreateSessionResponse>

    @GET("api/public/verify-session/{token}")
    suspend fun verifySession(@Path("token") token: String): Response<VerifySessionResponse>

    @GET("api/slider/images")
    suspend fun getSliderImages(
        @Query("role") role: String,
        @Query("student_class") studentClass: String? = null
    ): Response<List<SliderImage>>

    @POST("api/admin/slider-images")
    suspend fun updateSliderImages(@Body request: List<SliderImage>): Response<UpdateSliderImagesResponse>

    @GET("api/fees")
    suspend fun getMyFees(
        @Header("Authorization") authHeader: String
    ): Response<List<FeeInstallment>>

    @GET("api/fees/receipt/{receiptNo}")
    suspend fun verifyReceipt(
        @Path("receiptNo") receiptNo: String
    ): Response<Map<String, Any?>>

    @POST("api/fees/pay")
    suspend fun payFees(
        @Header("Authorization") authHeader: String,
        @Body request: PayFeesRequest
    ): Response<PayFeesResponse>

    @POST("api/create-order")
    suspend fun createOrder(
        @Header("Authorization") authHeader: String,
        @Body request: CreateOrderRequest
    ): Response<CreateOrderResponse>

    @POST("api/verify-payment")
    suspend fun verifyPayment(
        @Header("Authorization") authHeader: String,
        @Body request: VerifyPaymentRequest
    ): Response<PayFeesResponse>

    @GET("api/student/marks")
    suspend fun getStudentMarks(
        @Header("Authorization") authHeader: String
    ): Response<Map<String, StudentExamResult>>

    @GET("api/users/search")
    suspend fun searchUsers(
        @Header("Authorization") authHeader: String,
        @Query("q") query: String?
    ): Response<List<SearchUserResponse>>

    @GET("api/search")
    suspend fun searchBackend(
        @Query("q") query: String?,
        @Query("role") role: String?,
        @Query("username") username: String?
    ): Response<List<SearchBackendResponse>>

    @GET("api/search/markdown")
    suspend fun getDocMarkdown(
        @Query("path") path: String
    ): Response<DocMarkdownResponse>

    @PATCH("api/profile")
    suspend fun updateProfile(
        @Header("Authorization") authHeader: String,
        @Body request: ProfileUpdateRequest
    ): Response<Map<String, Any?>>

    @GET("api/profile")
    suspend fun getProfile(
        @Header("Authorization") authHeader: String,
        @Query("section") section: String? = null
    ): Response<ProfileResponse>

    @GET("api/sessions/active")
    suspend fun getActiveSessions(
        @Header("Authorization") authHeader: String
    ): Response<List<SessionItem>>

    @DELETE("api/sessions/revoke/{sessionId}")
    suspend fun revokeSession(
        @Header("Authorization") authHeader: String,
        @Path("sessionId") sessionId: String
    ): Response<Map<String, Any?>>

    @POST("api/sessions/revoke-others")
    suspend fun revokeOtherSessions(
        @Header("Authorization") authHeader: String
    ): Response<Map<String, Any?>>

    @GET("api/onboarding/status")
    suspend fun getOnboardingStatus(
        @Header("Authorization") authHeader: String
    ): Response<OnboardingStatusResponse>

    @POST("api/onboarding")
    suspend fun submitOnboarding(
        @Header("Authorization") authHeader: String,
        @Body request: OnboardingSubmitRequest
    ): Response<Map<String, Any?>>

    @GET("api/student/borrowings")
    suspend fun getStudentBorrowings(
        @Header("Authorization") authHeader: String
    ): Response<List<StudentBorrowingResponse>>

    @PATCH("api/student/borrowings")
    suspend fun renewBook(
        @Header("Authorization") authHeader: String,
        @Body request: StudentRenewRequest
    ): Response<Map<String, Any?>>

    @GET("api/notices")
    suspend fun getNotices(
        @Header("Authorization") authHeader: String
    ): Response<List<NoticeResponse>>

    @POST("api/notifications/register-token")
    suspend fun registerFcmToken(
        @Header("Authorization") authHeader: String,
        @Body request: Map<String, String>
    ): Response<Map<String, Any>>

    @GET("api/notifications/history")
    suspend fun getNotificationHistory(
        @Header("Authorization") authHeader: String,
        @Query("days") days: Int = 30
    ): Response<List<NotificationHistoryItem>>

    @GET("api/student/leaderboard")
    suspend fun getTopPerformers(
        @Header("Authorization") authHeader: String
    ): Response<LeaderboardResponse>

    @GET("api/student/notes")
    suspend fun getStudentNotes(
        @Header("Authorization") authHeader: String
    ): Response<StudentNotesResponse>

    @GET("teacher/calendar")
    suspend fun getTeacherCalendar(
        @Header("Authorization") authHeader: String
    ): Response<TeacherCalendarResponse>
    // Note: called on authApi (api.vidyaschool.com) — teacher router prefix is /teacher (no /api prefix)

    @GET("api/student/calendar")
    suspend fun getStudentCalendar(
        @Header("Authorization") authHeader: String
    ): Response<TeacherCalendarResponse>

    @GET("api/chats")
    suspend fun getUserChats(
        @Header("Authorization") authHeader: String
    ): Response<List<ChatItem>>

    @GET("api/chats/{chatId}")
    suspend fun getChatDetails(
        @Header("Authorization") authHeader: String,
        @Path("chatId") chatId: String
    ): Response<ChatDetailsResponse>

    @Streaming
    @POST("api/chats")
    suspend fun initChat(
        @Header("Authorization") authHeader: String,
        @Body request: InitChatRequest
    ): Response<ResponseBody>

    @Streaming
    @POST("api/chats/{chatId}")
    suspend fun sendChatMessage(
        @Header("Authorization") authHeader: String,
        @Path("chatId") chatId: String,
        @Body request: SendChatMessageRequest
    ): Response<ResponseBody>

    // ── QR Code Login ──────────────────────────────────────────────────────

    @POST("api/auth/qr/generate")
    suspend fun generateQRToken(): Response<QRGenerateResponse>

    @POST("api/auth/qr/confirm")
    suspend fun confirmQRToken(
        @Header("Authorization") authHeader: String,
        @Body request: QRConfirmRequest
    ): Response<Map<String, Any>>

    @GET("api/auth/qr/status/{qrToken}")
    suspend fun pollQRStatus(
        @Path("qrToken") qrToken: String
    ): Response<QRStatusResponse>

    // ── Document Management Endpoints ────────────────────────────────────────

    @GET("api/documents")
    suspend fun getDocuments(
        @Header("Authorization") authHeader: String
    ): Response<List<UserDocumentItem>>

    @retrofit2.http.Multipart
    @POST("api/documents")
    suspend fun uploadDocumentFile(
        @Header("Authorization") authHeader: String,
        @retrofit2.http.Part file: okhttp3.MultipartBody.Part,
        @retrofit2.http.Part docType: okhttp3.MultipartBody.Part,
        @retrofit2.http.Part docName: okhttp3.MultipartBody.Part
    ): Response<Map<String, Any>>

    @DELETE("api/documents")
    suspend fun deleteDocument(
        @Header("Authorization") authHeader: String,
        @Query("docType") docType: String
    ): Response<ResponseBody>

    @retrofit2.http.Multipart
    @POST("api/chats/upload")
    suspend fun uploadChatFile(
        @Header("Authorization") authHeader: String,
        @retrofit2.http.Part file: okhttp3.MultipartBody.Part
    ): Response<ChatFileUploadResponse>

    // ── Weather Endpoints ──────────────────────────────────────────────────

    @GET("api/weather/current")
    suspend fun getCurrentWeather(
        @Query("lat") lat: Double? = null,
        @Query("lon") lon: Double? = null,
        @Query("city") city: String? = null
    ): Response<WeatherResponse>
}

data class ChatFileUploadResponse(
    val filename: String? = null,
    val type: String? = null,
    val s3_url: String? = null,
    val data_url: String? = null,
    val content: String? = null
)

data class InitChatRequest(
    val uuid: String,
    val message: String,
    val title: String = "AI Teaching Assistant",
    val use_thinking: Boolean = true,
    val attachment_data_url: String? = null,
    val attachment_mime: String? = null
)

data class SendChatMessageRequest(
    val message: String,
    val title: String = "AI Teaching Assistant",
    val use_thinking: Boolean = true,
    val attachment_data_url: String? = null,
    val attachment_mime: String? = null
)

data class ChatItem(
    val id: String,
    val title: String? = null,
    val createdAt: String? = null
)

data class BackendChatMessage(
    val role: String? = null,
    val content: String? = null,
    val createdAt: String? = null
)

data class ChatDetailsResponse(
    val id: String? = null,
    val title: String? = null,
    val messages: List<BackendChatMessage>? = null
)

data class NotificationHistoryItem(
    val id: String? = null,
    val title: String? = null,
    val body: String? = null,
    @SerializedName(value = "created_at", alternate = ["createdAt"]) val createdAt: String? = null
)

data class LeaderboardResponse(
    @SerializedName("class") val className: String? = null,
    val section: String? = null,
    val leaderboard: List<TopPerformerItem>? = null,
    @SerializedName("current_student_rank") val currentStudentRank: Int? = null
)

data class TopPerformerItem(
    val id: String? = null,
    val name: String? = null,
    // API returns "image" field
    @SerializedName(value = "image", alternate = ["avatarUrl", "avatar_url"]) val avatarUrl: String? = null,
    // API returns "class" and "section" separately
    @SerializedName("class") val studentClass: String? = null,
    val section: String? = null,
    // API returns "average" (percentage score)
    @SerializedName(value = "average", alternate = ["percentage"]) val percentage: Double? = null,
    val rank: Int? = null,
    val username: String? = null,
    val examsCount: Int? = null
)

data class SearchUserResponse(
    val name: String,
    val username: String,
    val role: String
)

data class ProfileResponse(
    val user: User,
    val profile: UserProfileData?
)

data class UserProfileData(
    val id: String?,
    @SerializedName("user_id") val userId: String?,
    val admissionNumber: String?,
    val username: String?,
    val phoneNumber: String?,
    val parentName: String?,
    val parentPhone: String?,
    val parentEmail: String?,
    val address: String?,
    val city: String?,
    val state: String?,
    val pincode: String?,
    val `class`: String?,
    val section: String?,
    val secondaryRole: String?,
    val transportMode: String?,
    val onboardingCompleted: Boolean?,
    val classSectionLastUpdated: String?,
    val classSectionChanges: String?
)

data class ProfileUpdateRequest(
    val username: String? = null,
    val phoneNumber: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    val parentName: String? = null,
    val parentPhone: String? = null,
    val parentEmail: String? = null,
    @SerializedName("class") val class_: String? = null,
    val section: String? = null
)

data class OnboardingStatusResponse(
    @SerializedName("onboardingCompleted") val onboardingCompleted: Boolean
)

data class OnboardingSubmitRequest(
    val admissionNumber: String? = null,
    val username: String,
    val phoneNumber: String? = null,
    val parentName: String? = null,
    val parentPhone: String? = null,
    val parentEmail: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    @SerializedName("class") val class_: String? = null,
    val section: String? = null,
    @SerializedName("transportMode") val transportMode: String? = null
)

data class StudentBorrowingResponse(
    val id: String,
    val bookId: String,
    val issueDate: String,
    val dueDate: String,
    val returnDate: String?,
    val renewalsCount: Int,
    val status: String,
    val title: String,
    val author: String,
    val isbn: String
)

data class StudentRenewRequest(
    val id: String
)

data class NoticeResponse(
    val id: String,
    val title: String,
    val content: String,
    val category: String,
    @SerializedName("isUrgent") val isUrgent: Boolean = false,
    @SerializedName("senderId") val senderId: String? = null,
    @SerializedName("targetRole") val targetRole: String? = null,
    @SerializedName("targetClass") val targetClass: String? = null,
    @SerializedName("targetSection") val targetSection: String? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("senderName") val senderName: String? = null
)

data class SearchBackendResponse(
    val id: String,
    val title: String,
    val content: String,
    val url: String
)

data class DocMarkdownResponse(
    val title: String,
    val markdown: String
)

data class StudentSubjectMark(
    val code: String? = null,
    val subject: String? = null,
    val teacher: String? = null,
    val score: Float? = 0f,
    val maxScore: Float? = 100f,
    val classAverage: Float? = 0f,
    val grade: String? = null,
    val status: String? = null
)

data class StudentExamResult(
    val termName: String? = null,
    val gpa: String? = null,
    val subjects: List<StudentSubjectMark>? = null
)

data class UserDocumentItem(
    val id: String? = null,
    @SerializedName(value = "docType", alternate = ["doc_type"]) val docType: String,
    @SerializedName(value = "docName", alternate = ["doc_name"]) val docName: String? = null,
    @SerializedName(value = "fileUrl", alternate = ["file_url"]) val fileUrl: String? = null,
    @SerializedName(value = "fileName", alternate = ["file_name"]) val fileName: String? = null,
    @SerializedName(value = "fileType", alternate = ["file_type"]) val fileType: String? = null,
    @SerializedName(value = "fileSize", alternate = ["file_size"]) val fileSize: Long? = null,
    val status: String? = "Uploaded"
)

data class ConfirmDocumentUploadRequest(
    val action: String = "confirm_upload",
    val docType: String,
    val docName: String,
    val fileUrl: String,
    val fileName: String,
    val fileType: String,
    val fileSize: Long
)

// ── QR Login models ─────────────────────────────────────────────────────────

data class QRGenerateResponse(
    @SerializedName("qr_token") val qrToken: String,
    @SerializedName("expires_in") val expiresIn: Int = 180
)

data class QRConfirmRequest(
    @SerializedName("qr_token") val qrToken: String
)

data class QRStatusResponse(
    val status: String,                        // "pending" | "confirmed" | "expired"
    @SerializedName("session_token") val sessionToken: String? = null,
    val user: Map<String, Any?>? = null
)

// ── Weather Data Models ───────────────────────────────────────────────────

data class WeatherLocation(
    val name: String? = null,
    val region: String? = null,
    val country: String? = null,
    val lat: Double? = null,
    val lon: Double? = null,
    val localtime: String? = null
)

data class WeatherCurrent(
    val temperature: Double? = null,
    @SerializedName("feelslike") val feelsLike: Double? = null,
    @SerializedName("weather_code") val weatherCode: Int? = null,
    @SerializedName("weather_descriptions") val weatherDescriptions: List<String>? = null,
    @SerializedName("weather_icons") val weatherIcons: List<String>? = null,
    @SerializedName("wind_speed") val windSpeed: Double? = null,
    @SerializedName("wind_dir") val windDir: String? = null,
    val humidity: Int? = null,
    @SerializedName("uv_index") val uvIndex: Int? = null,
    val visibility: Double? = null,
    val pressure: Int? = null,
    val precip: Double? = null,
    @SerializedName("is_day") val isDay: String? = null
)

data class WeatherResponse(
    val success: Boolean = true,
    val location: WeatherLocation? = null,
    val current: WeatherCurrent? = null,
    val cached: Boolean = false,
    @SerializedName("cost_saved") val costSaved: Boolean = false,
    @SerializedName("is_fallback") val isFallback: Boolean = false,
    @SerializedName("cache_type") val cacheType: String? = null,
    @SerializedName("cached_at") val cachedAt: String? = null,
    val message: String? = null
)
