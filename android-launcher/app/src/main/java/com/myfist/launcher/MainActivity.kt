package com.myfist.launcher

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.myfist.launcher.data.AppInfo
import com.myfist.launcher.domain.AppRepository
import com.myfist.launcher.ui.screens.AppDrawerRoute
import com.myfist.launcher.ui.theme.MyFistTheme
import com.myfist.launcher.viewmodel.AppDrawerViewModel

class MainActivity : ComponentActivity() {

    private val appDrawerViewModel: AppDrawerViewModel by viewModels {
        AppDrawerViewModel.Factory(
            repository = AppRepository(applicationContext),
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyFistTheme {
                AppDrawerRoute(
                    viewModel = appDrawerViewModel,
                    onAppClick = ::launchApp,
                )
            }
        }
    }

    private fun launchApp(appInfo: AppInfo) {
        val launchIntent = Intent().apply {
            setClassName(appInfo.packageName, appInfo.activityName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { startActivity(launchIntent) }
    }
}
