package com.myfist.launcher.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.myfist.launcher.data.AppInfo
import com.myfist.launcher.domain.AppRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AppDrawerViewModel(
    private val repository: AppRepository,
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query

    val apps: StateFlow<List<AppInfo>> = combine(repository.apps, _query) { allApps, searchQuery ->
        if (searchQuery.isBlank()) {
            allApps
        } else {
            allApps.filter { it.label.contains(searchQuery, ignoreCase = true) }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
        initialValue = emptyList(),
    )

    init {
        refresh()
    }

    fun onSearchChanged(newValue: String) {
        _query.value = newValue
    }

    fun refresh() {
        viewModelScope.launch { repository.refreshApps() }
    }

    class Factory(
        private val repository: AppRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AppDrawerViewModel(repository) as T
        }
    }
}
