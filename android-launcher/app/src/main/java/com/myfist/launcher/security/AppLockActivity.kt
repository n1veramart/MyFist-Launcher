package com.myfist.launcher.security

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat

class AppLockActivity : ComponentActivity() {

    private val authenticators =
        BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.DEVICE_CREDENTIAL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        promptUnlock()
    }

    private fun promptUnlock() {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock app")
            .setSubtitle("Authenticate to continue")
            .setAllowedAuthenticators(authenticators)
            .build()

        val prompt = BiometricPrompt(
            this,
            ContextCompat.getMainExecutor(this),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    setResult(RESULT_OK)
                    finish()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    setResult(RESULT_CANCELED)
                    finish()
                }
            },
        )

        prompt.authenticate(promptInfo)
    }
}
