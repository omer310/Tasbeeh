# Manarat Al-Muslim

The app uses the user-confirmed `Pre-Final-Desgin-V4` design. `main` was restored to V4 commit `fe3b32dd` before this SDK upgrade. The V4 and V5 branches remain available as historical versions.

## Development

**September 7 review hold:** Do not create another build or run agent app tests until Omar reviews the follow-up source changes. Existing EAS APKs predate those changes. See [current review work](docs/ROADMAP.md).

Use Node.js 22.13 or newer. With nvm, run `nvm use`, then:

```sh
npm ci
npm run web
npm start
```

The project targets Expo SDK 57 / React Native 0.86.3 / React 19.2.3. Expo-managed native libraries use the SDK's compatible versions. Babel 7, ESLint 9 and TypeScript 6 stay within the supported ranges of Expo's Babel and ESLint plugins. The app source remains JavaScript.

## Validation

```sh
npm test
npm run lint
npm run check:dependencies
npm run doctor
npx expo export --platform all
```

The notification tests cover elapsed prayers, next-day schedules, silent/disabled alerts, reminders, time parsing, selected-city time zones, daylight saving and bundled sounds. Legacy React Compiler migration diagnostics remain warnings; React Compiler is explicitly disabled until the existing screens are migrated. Legacy unused code, effect dependencies and compiler migration diagnostics remain warnings; the enabled lint rules must report zero errors.

## Native projects

Android native sources are checked in and have been regenerated for SDK 57. iOS is generated locally and ignored by Git. After changing app configuration or native dependencies, regenerate **both** before building:

```sh
npx expo prebuild --clean
npm run android
npm run ios
```

Do not keep manual native edits that are absent from app configuration or a config plugin: `prebuild --clean` replaces the native directories. Expo Doctor's generic app-config-sync warning is disabled for this documented workflow; regeneration and inspection of the resulting native configuration are required instead. The original local iOS backup remains in `.local-backups/ios-before-sdk-57`.

For a connected Android phone, run `npm run android -- --device`. Local debug builds install as **Manarat Al-Muslim Dev** (`com.manaratalmuslim.dev`) alongside the existing app, with separate data. The Android development config plugin preserves this setup across prebuild. Release and preview builds retain `com.manaratalmuslim`. If invoking Expo directly, use `npx expo run:android --device --app-id com.manaratalmuslim.dev` so it launches the development package.

For reliable USB development, stop any previous Metro process and run `npm run android:usb` (or `npm run android:usb -- SM_S928U1` for this Samsung). This advertises `127.0.0.1` for the bundle, images, fonts and audio; Expo forwards its chosen port through `adb reverse`. Keep USB connected while using the development server. A phone can load a bundle over USB but still fail asset downloads if Metro advertises an unreachable Wi-Fi address. Production builds bundle these assets and do not need Metro.

`INSTALL_FAILED_UPDATE_INCOMPATIBLE` means the installed package and new APK have different signing certificates. Use the separate development build above to retain the existing installation and its saved data. The Gradle hard-link copy warnings are unrelated to this installation error.

SDK 57 requires Xcode 26.4+ for iOS. The initial upgrade validation used a Mac with Xcode 26.3, so iOS device builds remain outstanding. Android debug and standalone release builds were verified on the connected Samsung on 2026-09-07. Scheduled playback, notification modes and Stop results are recorded in [Android preview verification](docs/ANDROID_PREVIEW.md#verification).

## Upgrade behavior

- The app retains V4's overall aesthetic. The Quran now separates its library from reading and places Mushaf, flowing text and ayah-by-ayah options in a dedicated sheet. Saved Duas load before persistence starts, and duplicate startup writes have been removed.
- Audio previews use `expo-audio`; Android uses a local native alarm/playback module for full scheduled Azan, while iOS uses typed notification date triggers. `expo-background-task` periodically refreshes upcoming schedules. Its timing is controlled by the OS, so it is not used to play an Adhan at an exact moment.
- Notification sound clips are at most 29 seconds for iOS compatibility. Full original Adhan recordings are used for Android scheduled playback and in-app previews. Allow notifications and, where required by Android, exact-alarm access when testing on a device.
- The browser supports visual and interaction testing, including manual city/country prayer times. Native compass sensing, scheduled notifications and background delivery require a device.
- App identity, the Expo project ID and update URL are preserved. The native runtime is `57.0.20-adhan-1`, configured in both `app.json` and Android resources; increment it with native changes to prevent incompatible updates. See [the runtime decision](docs/DECISIONS.md#an-explicit-runtime-for-the-native-android-release--2026-09-07). The square launcher icon is copied from V4's existing Android launcher asset.

The dependency audit has no high or critical findings. One unpatched upstream `decode-uri-component` advisory accounts for seven moderate entries in the dependency tree. The UUID advisory in Xcode-project tooling is resolved with a scoped compatible override; native project parsing and UUID generation are checked.

Upgrade references: [Expo SDK 57](https://expo.dev/changelog/sdk-57), [SDK compatibility and build requirements](https://docs.expo.dev/versions/latest/), [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Background tasks](https://docs.expo.dev/versions/latest/sdk/background-task/).

## Android preview revamp

See [preview setup and device checks](docs/ANDROID_PREVIEW.md) and [Quran display research](docs/QURAN_DISPLAY_RESEARCH.md). The preview includes three offline Quran views, daily essentials and a unified saved-Duas store, cache-first prayer loading with independent notification errors, and shared navigation/app dark-mode colors. Native module sources live outside the generated native project and survive prebuild.

The initial September 7 usability pass added the compact prayer page, direct reading/saving and refreshed tabs. Its 39 regression tests and Samsung checks covered that earlier interface and standalone scheduled Android alerts; iOS hardware checks remain outstanding.

The subsequent source revision restores paired dates and a segmented countdown, follows device appearance, uses right-next Mushaf swipes and whole-Surah scrolling, adds the [complete Hisn catalogue and timed Athkar](docs/HISN_CONTENT.md), and refines calibration, Dua forms/search, Arabic Calendar sizing and themed icons. It removes product testing controls and uses a half-height prayer-preference sheet. These changes are awaiting Omar's testing and have not been built. Source syntax/import checks and lint inspection report no errors; compiler migration/style warnings remain.
