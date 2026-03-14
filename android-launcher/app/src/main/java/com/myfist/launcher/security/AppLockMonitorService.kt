package com.myfist.launcher.security

import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Intent
import android.os.IBinder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Polls foreground app transitions with UsageStatsManager and launches [AppLockActivity]
 * when a restricted package is detected.
 */
class AppLockMonitorService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val restrictedPackages = setOf<String>() // TODO: Back with DataStore/Room policy.

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        serviceScope.launch {
            while (isActive) {
                checkForegroundPackage()?.let { packageName ->
                    if (packageName in restrictedPackages) {
                        val lockIntent = Intent(this@AppLockMonitorService, AppLockActivity::class.java)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        startActivity(lockIntent)
                    }
                }
                delay(350)
            }
        }
        return START_STICKY
    }

    private fun checkForegroundPackage(): String? {
        val usageStatsManager = getSystemService(UsageStatsManager::class.java)
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 5_000
        val events = usageStatsManager.queryEvents(startTime, endTime)

        var lastForegroundPackage: String? = null
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                lastForegroundPackage = event.packageName
            }
        }
        return lastForegroundPackage
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
