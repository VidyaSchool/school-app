package com.vidyaschool.app.api

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

data class UpdateInfo(
    val versionName: String,
    val downloadUrl: String
)

private data class GitHubRelease(
    @SerializedName("tag_name") val tagName: String,
    @SerializedName("assets") val assets: List<GitHubAsset>?
)

private data class GitHubAsset(
    @SerializedName("name") val name: String,
    @SerializedName("browser_download_url") val browserDownloadUrl: String
)

object UpdateChecker {
    val updateInfoState = androidx.compose.runtime.mutableStateOf<UpdateInfo?>(null)
    val isDownloadingState = androidx.compose.runtime.mutableStateOf(false)
    val downloadProgressState = androidx.compose.runtime.mutableStateOf(0f)

    private val client = RetrofitClient.okHttpClient
    private val gson = Gson()

    suspend fun checkForUpdates(context: Context): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            val currentVersion = pInfo.versionName ?: "1.0.0"

            val request = Request.Builder()
                .url("https://api.github.com/repos/VidyaSchool/school-app/releases/latest")
                .header("User-Agent", "Vidyaschool-App")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val bodyString = response.body?.string() ?: return@withContext null
                val release = gson.fromJson(bodyString, GitHubRelease::class.java) ?: return@withContext null

                val latestVersion = release.tagName
                val apkAsset = release.assets?.firstOrNull { it.name.endsWith(".apk") } ?: return@withContext null

                if (isNewerVersion(currentVersion, latestVersion)) {
                    return@withContext UpdateInfo(
                        versionName = latestVersion,
                        downloadUrl = apkAsset.browserDownloadUrl
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    suspend fun downloadApk(
        context: Context,
        url: String,
        onProgress: (Float) -> Unit
    ): Uri? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body ?: return@withContext null
                val contentLength = body.contentLength()

                val destinationFile = File(context.cacheDir, "update.apk")
                if (destinationFile.exists()) {
                    destinationFile.delete()
                }

                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalBytesRead = 0L

                body.byteStream().use { inputStream ->
                    FileOutputStream(destinationFile).use { outputStream ->
                        while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                            outputStream.write(buffer, 0, bytesRead)
                            totalBytesRead += bytesRead
                            if (contentLength > 0) {
                                val progress = totalBytesRead.toFloat() / contentLength
                                onProgress(progress)
                            }
                        }
                    }
                }

                return@withContext FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    destinationFile
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    fun installApk(context: Context, apkUri: Uri) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            context.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun isNewerVersion(current: String, latest: String): Boolean {
        val currClean = current.trim().removePrefix("v").split(".")
        val lateClean = latest.trim().removePrefix("v").split(".")
        val maxLen = maxOf(currClean.size, lateClean.size)
        for (i in 0 until maxLen) {
            val currVal = currClean.getOrNull(i)?.toIntOrNull() ?: 0
            val lateVal = lateClean.getOrNull(i)?.toIntOrNull() ?: 0
            if (lateVal > currVal) return true
            if (currVal > lateVal) return false
        }
        return false
    }
}
