# Expanded Azan library

Source changes prepared 2026-09-10; a new Android APK and user listening acceptance are still required. The library contains eight Azan recordings plus Long beep, system default, Silent, Vibrate and None.

| Recording | Source |
| --- | --- |
| Nureyn Mohammad | Existing `assets/adhan.mp3` and native `prayer_adhan.mp3` |
| Sudan | Existing user-supplied `assets/Sudanese Athan.mp3`, copied to `prayer_sudan.mp3`; performer identity is unverified, so the UI does not invent a name |
| Madina | Existing bundled recording |
| Makka | Existing bundled recording |
| Mishary Alafasy | [Kiwifu/adhan-mp3 collection](https://github.com/Kiwifu/adhan-mp3) |
| Abdulbasit | Same collection |
| Al-Aqsa | Same collection |
| Turkey | Same collection |

The collection describes its recordings as free for Islamic application use. This is the publisher's usage statement. Exact download URLs, byte sizes and SHA-256 hashes are retained in [the source manifest](../assets/licenses/adhan-sources.json). Country/performer labels follow its filenames; Sudan is identified only by the supplied asset name. No additional recording is claimed to be Noreen without evidence.

All five additions passed full MP3 decoding with ffmpeg. Their durations are approximately 191.7 seconds (Sudan), 240.8 (Alafasy), 244.9 (Abdulbasit), 151.7 (Al-Aqsa) and 178.4 (Turkey). The matching notification WAV clips are 29 seconds, mono, 22,050 Hz; these are distinct from full Android foreground-service playback. Generated clips live in `assets/notifications` and are listed in `app.json`; native full recordings live in the local prayer-alarm module's raw resources.

The native audio library version and Expo runtime version changed with the new resources. Older APKs reject new sound/Vibrate scheduling before replacing a working schedule. Existing stored preference names remain stable. Android DND mode uses alarm volume only when explicitly enabled and when the system allows alarms. Silent and Vibrate keep their notification-channel behavior. Hardware volume reduction and the foreground Volume Down key stop active Azan; actual manufacturer/locked-screen behavior awaits device verification.

“Remind me” is a separate advance notification, including when the main Azan is None. It uses the default reminder channel, not the selected full Azan. The settings sheet reads the earliest future reminder from the native stored schedule. Source tests cover all five intervals; real notification delivery still depends on permissions and phone settings.
