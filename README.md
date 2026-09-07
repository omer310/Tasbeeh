# Manarat Al-Muslim

The app uses the user-confirmed `Pre-Final-Desgin-V4` design. `main` was restored to V4 commit `fe3b32dd` before this SDK upgrade. The V4 and V5 branches remain available as historical versions.

## Development

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

SDK 57 requires Xcode 26.4+ for iOS. This Mac currently has Xcode 26.3 and no Android SDK configured, so device binary builds and device-level notification/background playback tests remain outstanding. Production JavaScript bundles for all three platforms and native project generation can be checked without those toolchains.

## Upgrade behavior

- V4's Duas, Quran, Tasbeeh, calendar, Qibla and settings screens are retained. Saved Duas load before persistence starts, and duplicate startup writes have been removed.
- Audio previews use `expo-audio`; Android uses a local native alarm/playback module for full scheduled Azan, while iOS uses typed notification date triggers. `expo-background-task` periodically refreshes upcoming schedules. Its timing is controlled by the OS, so it is not used to play an Adhan at an exact moment.
- Notification sound clips are at most 29 seconds for iOS compatibility. Full original Adhan recordings are used for Android scheduled playback and in-app previews. Allow notifications and, where required by Android, exact-alarm access when testing on a device.
- The browser supports visual and interaction testing, including manual city/country prayer times. Native compass sensing, scheduled notifications and background delivery require a device.
- App identity, the Expo project ID and update URL are preserved. Runtime versioning now uses a native fingerprint so older SDK binaries cannot receive incompatible updates. The square launcher icon is copied from V4's existing Android launcher asset.

The dependency audit has no high or critical findings. One unpatched upstream `decode-uri-component` advisory accounts for seven moderate entries in the dependency tree. The UUID advisory in Xcode-project tooling is resolved with a scoped compatible override; native project parsing and UUID generation are checked.

Upgrade references: [Expo SDK 57](https://expo.dev/changelog/sdk-57), [SDK compatibility and build requirements](https://docs.expo.dev/versions/latest/), [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Background tasks](https://docs.expo.dev/versions/latest/sdk/background-task/).

## Android preview revamp

See [preview setup and device checks](docs/ANDROID_PREVIEW.md) and [Quran display research](docs/QURAN_DISPLAY_RESEARCH.md). The preview includes three offline Quran views, daily essentials and a unified saved-Duas store, cache-first prayer loading with independent notification errors, and shared navigation/app dark-mode colors. Native module sources live outside the generated native project and survive prebuild.
