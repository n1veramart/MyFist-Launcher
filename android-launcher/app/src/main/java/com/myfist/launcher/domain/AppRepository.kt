package com.myfist.launcher.domain

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import com.myfist.launcher.data.AppInfo
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.text.Collator
import java.util.Locale

class AppRepository(
    private val context: Context,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) {
    private val _apps = MutableStateFlow<List<AppInfo>>(emptyList())
    val apps: StateFlow<List<AppInfo>> = _apps.asStateFlow()

    suspend fun refreshApps() = withContext(ioDispatcher) {
        val packageManager = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val collator = Collator.getInstance(Locale.getDefault())

        val loaded = packageManager
            .queryIntentActivities(intent, PackageManager.MATCH_ALL)
            .map { resolveInfo ->
                val activityInfo = resolveInfo.activityInfo
                AppInfo(
                    packageName = activityInfo.packageName,
                    activityName = activityInfo.name,
                    label = resolveInfo.loadLabel(packageManager)?.toString().orEmpty(),
                    icon = resolveInfo.loadIcon(packageManager),
                )
            }
            .sortedWith { left, right -> collator.compare(left.label, right.label) }

        _apps.value = loaded
    }
}
