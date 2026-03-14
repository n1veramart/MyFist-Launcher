package com.myfist.launcher.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle

private val MyFistDarkColors = darkColorScheme(
    background = androidx.compose.ui.graphics.Color.Black,
    surface = androidx.compose.ui.graphics.Color.Black,
)

private val MyFistLightColors = lightColorScheme(
    background = androidx.compose.ui.graphics.Color(0xFF0A0A0A),
    surface = androidx.compose.ui.graphics.Color(0xFF0A0A0A),
)

@Composable
fun MyFistTheme(content: @Composable () -> Unit) {
    val mode by ThemeManager.themeMode.collectAsStateWithLifecycle()
    val darkTheme = when (mode) {
        ThemeMode.DAY -> false
        ThemeMode.NIGHT -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }

    MaterialTheme(
        colorScheme = if (darkTheme) MyFistDarkColors else MyFistLightColors,
        content = content,
    )
}
