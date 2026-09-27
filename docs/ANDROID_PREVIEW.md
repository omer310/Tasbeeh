# Android preview

**Current status (2026-09-23):** Preview version 13 was installed and cold-launched on Omar's Samsung while resolving his reported installation failure. This targeted troubleshooting supersedes the earlier hold for installation/startup checks; wider feature acceptance remains with Omar. See [the recovery evidence below](#preview-13-installation-recovery--2026-09-23) and [ROADMAP](ROADMAP.md).

## Preview 13 installation recovery — 2026-09-23

[EAS build ce355ebe](https://expo.dev/accounts/omer310/projects/TasbeehApp/builds/ce355ebe-6ef4-40c5-bc86-6fd381915880) finished successfully with version code 13. Android rejected the phone's downloaded APK before launch with `INSTALL_PARSE_FAILED_NO_CERTIFICATES` (-103): `APK Signature Scheme v2: SHA-256 digest of contents did not verify`.

A fresh download of the exact same EAS artifact had the same byte count (377,663,785), but different contents:

| Copy | SHA-256 | Android apksigner result |
| --- | --- | --- |
| Rejected phone download | `3a76b9fca5c71fa3546d1f429c28328bb6415e44207ff6a14c599ad269082faa` | V2 content digest mismatch |
| Fresh EAS download | `a6c84fe0470806e3b4caa459acb67d1fbc1089172680f35b3ac8e296255d08d0` | Verifies using V2 |

Installing the verified APK with `adb install -r --no-streaming` succeeded. Package `com.manaratalmuslim` reports version code 13; a cold launch returned `Status: ok`, React Native logged `Running "main"`, and the language/onboarding screen rendered. No startup exception appeared in that process's AndroidRuntime/ReactNativeJS logs. No app source change, rebuild, re-signing, uninstall or data clearing was required by this recovery. The precise cause of the altered download is unknown.

For this exact integrity error, obtain a fresh artifact and verify it with Android SDK `apksigner verify --verbose` before retrying installation. Do not re-sign a damaged APK. These checks establish installation and initial startup only; Tafsir, Dua artwork and other feature acceptance remain separate.

## Build and install

```sh
npm ci
npm run preview:android
```

The EAS `preview` profile creates an internally distributed APK with bundled JavaScript, Quran pages, fonts and audio. It uses the `preview` update channel and the existing `com.manaratalmuslim` package and remote signing credentials. A new APK is required for native alarm changes. Account `omer310` has access to the existing Expo project.

This checked-in native project uses runtime `57.0.20-widgets-3` in both `app.json` and Android's `expo_runtime_version` string. Increment both when changing native dependencies, modules, plugins or native behavior. The explicit runtime avoids EAS fingerprint mismatches caused by its signing/version injection. See [the decision](DECISIONS.md#an-explicit-runtime-for-the-native-android-release--2026-09-07). `.easignore` excludes local Gradle caches and build outputs.

For a local standalone test alongside an existing installation, configure the Android SDK and JDK, then run from `android`:

```sh
gradlew :app:assembleRelease -PmanaratStandalonePreview=true -PreactNativeArchitectures=arm64-v8a --max-workers=2
```

This produces a locally signed release APK with package `com.manaratalmuslim.dev`. Install `android/app/build/outputs/apk/release/app-release.apk`. Use the **release** variant: Expo's debug libraries can still open the development launcher even when the debug app includes a JS bundle. Local debug builds remain available through `npm run android:usb`.

## Prayer alert behavior

Onboarding introduces notification permission. Settings → Adhan & notifications manages the global switch, Android Alarms & reminders permission, volume/channel status, each prayer's sound, and optional advance reminders. Prayer home has no setup banner; tapping a prayer opens its sound choices.

Android uses the local module in `modules/prayer-alarm`. It persists exact AlarmManager alarms and restores future alarms after reboot, replacement, or exact-alarm permission being granted. A foreground service plays the selected full recording with a visible **Stop Azan** action. No running Metro server, JavaScript timer, or network call is needed when the alarm fires.

- **Adhan:** Plays the selected bundled recording.
- **Default notification sound:** Uses the phone's notification sound channel.
- **Long beep:** Plays the bundled beep.
- **Silent:** Displays an alert without sound.
- **None:** Disables that prayer's main alert. A separately selected advance reminder remains independent.

Schedules extend up to 30 days, refreshed on app opening/resume and through an OS-managed background task. Reopen periodically to extend the horizon. A delivery more than ten minutes late skips audio. Audio respects vibrate/silent mode, DND, channel settings and notification volume. Android Settings → Force stop blocks alarms until the app is opened again.

iOS uses bundled notification sound clips limited to 29 seconds; full scheduled recordings in this implementation target Android.

## Verification

The following results describe the earlier September 7 pass. They do **not** cover the later prayer layout, system appearance, continuous Surah flow, Hisn catalogue/counters, calibration or icon revisions. The follow-up received source parsing, import checks and lint inspection only; app testing belongs to Omar.

- 39 Node tests pass, covering audio cancellation, failed schedule replacement, time zones/DST, None/Silent, reminders, calendar loading, Quran completeness/swipes, saved Duas, location labels, calendar navigation, Hadith matching and offline alert cancellation.
- Production exports pass for Android, iOS and web. Lint reports zero errors and 17 Qibla warnings.
- Samsung SM_S928U1: complete prayer page, named automatic location, full Mushaf fit, both swipe directions, full-card dhikr selection, direct Dua reading/saving, themed Calendar, real Hadith search and English/Arabic language switching verified.
- A locally signed standalone release passed a cold launch with the Metro USB connection removed. The following scheduled tests ran on the Samsung on September 7; these exercise the same receiver/service used by real prayer alarms.

| Choice | Device result |
| --- | --- |
| Nureyn | Native `prayer_adhan` playback started; notification Stop stopped it. |
| Madina | Native `prayer_madinah` playback started after the screen entered doze. The user also confirmed audible scheduled Madina playback and Stop in the earlier development build. |
| Makka | Native `prayer_makkah` playback started with the app in the background; notification Stop stopped it. |
| Long beep | Native `prayer_beep` playback started and completed automatically. |
| Default | Delivered on `prayer-reminders-v1`; Android recorded the system notification sound and `isNoisy=true`. |
| Silent | Delivered on `prayer-silent-v1`; Android recorded no sound, no vibration and `isNoisy=false`. |
| None | Fajr's 30 alarms were removed, leaving 120 other prayer alerts. Restoring Madina restored 150. |

The test prayer and phone Vibrate mode were restored. The original app installation was preserved. EAS preview version 5 built successfully and its signing certificate matches the original installation. [Version 6](https://expo.dev/accounts/omer310/projects/TasbeehApp/builds/dbf89c0f-2544-4638-be8e-dadb8c2bb016) finished with the previous source pass; the follow-up revisions remain unbuilt. See [ROADMAP](ROADMAP.md).

## Device acceptance

Omar owns further device acceptance. The user interface now provides sound previews and real prayer preferences; temporary scheduled-test controls and diagnostic text were removed. Previous device evidence covers short scheduled delivery. Reboot restoration, a real prayer boundary and a longer offline interval were not observed in the previous session.

For source review without rebuilding, use the existing development client and Metro. The local backup `.expo/dev-client-before-preview.apk` is available in this workspace. At handoff the Samsung was disconnected, so its standalone `.dev` package could not be replaced with this existing client. The original production package remains separate.
