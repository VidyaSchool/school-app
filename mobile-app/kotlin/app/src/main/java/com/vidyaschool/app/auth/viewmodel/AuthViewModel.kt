package com.vidyaschool.app.auth.viewmodel

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vidyaschool.app.auth.model.AuthResult
import com.vidyaschool.app.auth.repository.AuthRepositoryImpl
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val repository: AuthRepositoryImpl
) : ViewModel() {
    
    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
    
    fun signInWithGoogle(context: Context, activityLauncher: ActivityResultLauncher<Intent>) {
        viewModelScope.launch {
            android.util.Log.d("AuthViewModel", "signInWithGoogle called")
            _authState.value = AuthState.Loading
            val result = repository.signInWithGoogle(context, activityLauncher)
            android.util.Log.d("AuthViewModel", "Google result: $result")
            _authState.value = when (result) {
                is AuthResult.Success -> AuthState.Success(result)
                is AuthResult.Error -> AuthState.Error(result.message)
                AuthResult.Cancelled -> AuthState.Idle
            }
        }
    }
    
    fun handleGoogleCallback(intent: Intent?) {
        repository.handleGoogleCallback(intent) { result ->
            _authState.value = when (result) {
                is AuthResult.Success -> AuthState.Success(result)
                is AuthResult.Error -> AuthState.Error(result.message)
                AuthResult.Cancelled -> AuthState.Idle
            }
        }
    }
    
    fun signInWithGitHub(context: Context, activityLauncher: ActivityResultLauncher<Intent>) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.signInWithGitHub(context, activityLauncher)
            _authState.value = when (result) {
                is AuthResult.Success -> AuthState.Success(result)
                is AuthResult.Error -> AuthState.Error(result.message)
                AuthResult.Cancelled -> AuthState.Idle
            }
        }
    }
    
    fun handleGitHubCallback(intent: Intent, backendUrl: String = "https://api.vidyaschool.com/api/auth/github/exchange") {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.handleGitHubCallback(intent, backendUrl)
            _authState.value = when (result) {
                is AuthResult.Success -> AuthState.Success(result)
                is AuthResult.Error -> AuthState.Error(result.message)
                AuthResult.Cancelled -> AuthState.Idle
            }
        }
    }
    
    fun resetState() {
        _authState.value = AuthState.Idle
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val result: AuthResult.Success) : AuthState()
    data class Error(val message: String) : AuthState()
}
