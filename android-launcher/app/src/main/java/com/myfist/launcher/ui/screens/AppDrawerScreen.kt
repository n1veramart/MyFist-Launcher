package com.myfist.launcher.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.myfist.launcher.data.AppInfo
import com.myfist.launcher.viewmodel.AppDrawerViewModel

@Composable
fun AppDrawerRoute(
    viewModel: AppDrawerViewModel,
    onAppClick: (AppInfo) -> Unit,
) {
    val apps by viewModel.apps.collectAsStateWithLifecycle()
    val query by viewModel.query.collectAsStateWithLifecycle()

    AppDrawerScreen(
        apps = apps,
        query = query,
        onQueryChange = viewModel::onSearchChanged,
        onAppClick = onAppClick,
    )
}

@Composable
fun AppDrawerScreen(
    apps: List<AppInfo>,
    query: String,
    onQueryChange: (String) -> Unit,
    onAppClick: (AppInfo) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(12.dp),
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Search apps") },
            singleLine = true,
        )

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 92.dp),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(apps, key = { "${it.packageName}:${it.activityName}" }) { app ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onAppClick(app) },
                ) {
                    Text(
                        text = app.label,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}
