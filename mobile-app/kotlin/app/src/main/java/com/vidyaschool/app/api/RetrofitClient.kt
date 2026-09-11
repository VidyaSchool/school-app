package com.vidyaschool.app.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "https://api.vidyaschool.com/"
    private const val FRONTEND_URL = "https://vidyaschool.vercel.app/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (com.vidyaschool.app.BuildConfig.DEBUG) HttpLoggingInterceptor.Level.HEADERS
                else HttpLoggingInterceptor.Level.NONE
    }

    private val baseHttpClient = OkHttpClient.Builder()
        .connectionPool(okhttp3.ConnectionPool(5, 5, TimeUnit.MINUTES))
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(loggingInterceptor)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("User-Agent", "VidyaSchool Android App v1.0")
                .build()
            chain.proceed(request)
        }
        .build()

    val okHttpClient: OkHttpClient = baseHttpClient

    val socketOkHttpClient: OkHttpClient = baseHttpClient.newBuilder()
        .pingInterval(25, TimeUnit.SECONDS)
        .build()

    val streamingOkHttpClient: OkHttpClient = baseHttpClient.newBuilder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("Accept", "text/event-stream")
                .build()
            chain.proceed(request)
        }
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val streamingRetrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(streamingOkHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val frontendRetrofit = Retrofit.Builder()
        .baseUrl(FRONTEND_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
    val streamingAuthApi: AuthApi = streamingRetrofit.create(AuthApi::class.java)
    val frontendApi: AuthApi = frontendRetrofit.create(AuthApi::class.java)
}
