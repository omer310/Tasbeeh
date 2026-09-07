# Android preview

Work branch: `codex/android-preview-revamp`. Remote `main` stays on the confirmed V4 baseline until approval.

## Build and install

Sign into the Expo account with access to project `0871aeac-9dd1-4614-b6e6-7614e6b8cade`, then run:

```sh
npm ci
npm run preview:android
```

The `preview` profile produces an internally distributed APK with the JavaScript bundle included, on the isolated `preview` update channel. It does not need Metro or a development server. Native Azan support requires a new APK; an OTA update cannot add it. The existing app identity and signing setup are preserved.

During preparation, the local Expo account `floreo_dev` could not read the existing project. EAS returned `Entity not authorized`; no build was submitted. The app's project ID has deliberately been preserved.

## Prayer alert behavior

Android uses the local Expo module in `modules/prayer-alarm`. It registers precise, device-owned alarms using `setExactAndAllowWhileIdle`, persists their schedule, and restores future alarms after reboot, app replacement, or exact-alarm access being granted. A media playback foreground service plays the selected full recording, with a visible notification and Stop Azan action. No JavaScript timer, network call, or running Metro session is needed at prayer time.

The prayer screen displays missing notification/alarm permission, muted settings, and the scheduled horizon. Schedules cover up to 30 days from the cached monthly calendars and refresh when the app opens/resumes and through an OS-managed background task. Reopen the app periodically to extend the horizon. A missed alarm more than ten minutes late produces a silent reminder rather than playing an old Azan.

Silent mode, Do Not Disturb, notification volume zero, a disabled Azan channel, and Android force-stop can prevent audio. The app respects these settings. Swiping away the app is different from Android Settings → Force stop: Android blocks alarms after force-stop until the app is opened again. Manufacturer battery restrictions can also affect delivery.

On iOS, local notifications retain the bundled sound clips of at most 29 seconds and the notification limit. Full native scheduled playback in this change targets Android.

## Device acceptance checks

1. Install the new preview APK and choose a location. Allow notifications and Alarms & reminders using the prayer-screen setup action.
2. Open a prayer, select an Azan, then tap **Test with screen locked (15 seconds)**. Lock the screen. Confirm the chosen recording plays and **Stop Azan** stops it.
3. Repeat with the app swiped out of recents, then after a device restart. Check a real scheduled prayer too. Keep notification volume audible and DND off for these tests.
4. Change one prayer to another recording; test it. Test Silent and None separately. Verify optional reminders and the global alert switch.
5. Open once online, then reopen offline: today’s cached prayer times should remain visible. Change city/method and verify the prior location’s schedule is replaced.
6. Quran: compare Mushaf, Flowing, and Ayah cards on the same page; change font size and translation visibility; reopen and check persistence.
7. Duas: daily essentials, category/search navigation, favorites and notes; custom Duas remain saved when unfavorited.
8. Toggle dark mode with Calendar and Duas already opened. Check calendar event dialogs and the black Qibla compass markings on the pale dial.

Native Kotlin compilation and locked-device delivery remain unverified until an Android build can run. This machine has no Android SDK/JDK configured. JS bundle/export checks do not prove native alarm delivery.

## Checks completed for this revision

- 21 Node tests passed: time-zone/DST scheduling, elapsed prayers, independent reminders, failed schedule replacement, partial calendar failures, cache identity, saved-Dua preservation, and complete Quran page/text mapping.
- Production JavaScript exports succeeded for Android, iOS, and web. Expo Doctor passed all 20 enabled checks; the documented app-config-sync check remains disabled. Dependency alignment passed.
- Lint: zero errors, 100 warnings, primarily legacy effects/unused code and disabled-compiler migration diagnostics.
- Browser: all three Quran views, correct page 2 translations, reading preferences across reload, daily essentials/search, favorite save/reload/removal, Azan selection without the removed-audio-method error, prayer times, and Calendar light/dark transitions. No browser errors in the test session.
- Android autolinking resolves `expo.modules.prayeralarm.PrayerAlarmModule`; prebuild regeneration preserves its source and resources. This is configuration validation, not a compiled APK or device playback test.
