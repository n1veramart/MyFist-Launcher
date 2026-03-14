# MyFist Launcher (Android skeleton)

This module contains the core launcher framework scaffold using Jetpack Compose + StateFlow.

## Implemented foundation
- Launcher registration (`HOME`, `DEFAULT`) with `singleTask` `MainActivity`.
- Repository + ViewModel pipeline for launchable app discovery.
- Compose app drawer screen with search + `LazyVerticalGrid`.
- App lock shell (`UsageStatsManager` monitor + `BiometricPrompt` activity).
- Minimalist black-first theming with runtime `ThemeManager`.
- Live wallpaper service scaffold for local media rendering.

## Next steps
1. Add Gradle module wiring and dependencies (`compose`, `lifecycle-runtime-compose`, `biometric`).
2. Replace app grid text-only cells with icon + label composables.
3. Back restricted-app and wallpaper source state with persistent storage.
4. Add user flows for granting Usage Access and selecting wallpaper media URIs.
