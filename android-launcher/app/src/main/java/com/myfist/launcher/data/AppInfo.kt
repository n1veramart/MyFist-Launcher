package com.myfist.launcher.data

import android.graphics.drawable.Drawable

/**
 * Immutable UI/domain model for launchable apps.
 */
data class AppInfo(
    val packageName: String,
    val activityName: String,
    val label: String,
    val icon: Drawable? = null,
)
