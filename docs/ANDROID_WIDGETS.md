# Android home screen widgets

Two independent widgets are implemented in `modules/home-widgets`. Omar reports the installed preview works and accepts the Dua widget. His three reference screenshots request a more useful prayer timetable across sizes, beyond the earlier resize fix. The dashboard redesign below is source-verified and still needs his next preview-build review. No iOS widget is included.

## Next prayer

The prayer widget starts at 4 × 2 and resizes horizontally and vertically down to 100 × 48 dp; exact cell counts depend on the launcher. A green gradient, warm gold next-prayer highlight and sunrise icon have separate prayer-only resources. Small cards prioritize prayer/time and short wide strips add the countdown beside them. At 210 × 112 effective dp, the widget shows today's five prayers, Hijri date, sunrise and a countdown footer. At 232 dp tall it adds a prominent next-prayer/countdown section; at 260 dp it also shows Gregorian date and location. Narrow tall sizes (125–209 dp wide, at least 310 dp tall) switch to five vertical rows. Large fonts reduce secondary detail before squeezing the timetable. Weighted schedule sections and full-size roots use the allocated area.

Android 12+ receives RemoteViews for the launcher's exact size list. Older/custom launchers use portrait/landscape width and height ranges. Resize callbacks pass their new options directly into rendering; ordinary schedule/appearance updates read each widget's own dimensions. `PrayerWidgetSize.java` holds the source-testable size policy. `npm run check:widget-size` runs standalone JVM checks for compact/strip/grid/agenda sizes, boundaries, full-content height budgets and font scaling; it builds no Android APK or emulator.

Tapping opens Prayer Times. A native Chronometer provides the countdown when the app has exact-alarm access and the size has room; otherwise the widget shows the scheduled time. Adding a widget requests no extra permission. Boundary alarms use the existing permission, falling back to inexact Android delivery when unavailable; Android may delay that fallback transition.

The app mirrors accepted prayer-cache results into native private storage. Timestamps use the calculation location's timezone, calculation rules and minute adjustments, independently of Adhan being on or off. Tomorrow uses tomorrow's timetable. Expired data or a gap longer than 36 hours displays a refresh action instead of extrapolating old times. The widget continues through cached days while the app is closed. Opening the app refreshes an expired schedule or changed travel location; widgets have no separate network/location worker.

The version-1 snapshot retains the future-only `entries` queue and adds up to 94 daily records containing all five prayers, sunrise, Hijri labels and location-timezone midnight bounds. Past prayers remain in today's table. Only the exact next timestamp is highlighted, so after Isha tomorrow's Fajr is counted down without highlighting today's elapsed Fajr. Missing individual times show a dash and missing sunrise is hidden. Hijri labels use the same `moment-hijri` conversion as the Calendar's local fallback; native widgets do not fetch Calendar API refinements. Older snapshots gracefully render the next-prayer card until opening the app supplies daily records.

Native alarms update at the earlier of the next prayer and the current location's midnight, so the date/table changes before Fajr even while the app is closed. The launcher runs the countdown. Boot, clock/timezone changes, app replacement and restored exact-alarm access reschedule updates. Android's 30-minute provider refresh supplies a fallback. Removing the last prayer widget cancels its boundary alarm.

## My Duas

The separate 3 × 3 reader shows complete Arabic text, source reference and repetition count without opening the app. The reading area scrolls; resizing gives it more space. Select 1–4 occasions from the searchable offline catalogue. Shortcuts switch directly to an occasion; previous/next move through its invocations and the other selections. All variants remain intact. Each widget stores its selection and reading position independently. One occasion hides the shortcut strip.

Leaving home, Entering home, Entering the mosque and Before sleep are preselected. The settings button edits that widget. The optional open arrow launches the exact displayed invocation in the app, on cold or repeated openings; ordinary reading controls stay inside the widget. Both UI languages show bundled Arabic content; this version does not add native English translations.

The native catalogue is generated from `data/hisnDuas.json` and short labels in `utils/duaDiscovery.js`. Run `npm run sync:widget-duas` after changing either. Content tests compare all 302 invocations with their canonical source. Android 12+ uses inline RemoteViews collections; Android 7–11 uses a RemoteViewsService.

## Adding and integration

Settings → Home screen widgets offers separate add actions and labeled layout previews. Android's widget picker lists **Next prayer** and **My Duas** independently. Dua pinning opens selection before system confirmation; cancelling leaves other widgets unchanged. Each successful pin receives its selection snapshot. Unsupported in-app pinning falls back to launcher instructions. Native widgets follow saved language and light/dark/system appearance on refresh.

Expo autolinks the local Android module, resources and manifest. Runtime is `57.0.20-widgets-3` in app.json and Android strings. The dashboard changes require a new Android APK. Open the updated app once to synchronize full-day data. If a launcher retains old widget bounds after upgrading, remove and re-add only the prayer widget. The preview command is `eas build --platform android --profile preview`.

## Verification and remaining acceptance

The original pass had 152 passing source tests. The dashboard pass has 23 passing widget/prayer regressions covering complete-day retention, sunrise, Isha/midnight, DST and timezone/month rollover. Standalone JVM checks sweep dimensions/font scales and budget every header, footer and table line. The prayer layout type-checks against Android 36 with compile-only fixtures for sibling helpers; AAPT2 compiles all widget XML resources. XML references, Settings JSX transformation and touched-JavaScript lint pass. The Dua renderer is byte-for-byte equivalent to the pre-redesign source. These checks do not establish a full Android APK build or launcher rendering; no app/emulator was launched.

For the next user preview, verify shrinking and expanding the prayer widget, short-wide/tall-narrow layouts, font scaling, both languages/themes, multiple prayer widgets at different sizes, and preserved size after a prayer transition or restart. The accepted Dua widget is unchanged. The earlier lifecycle checks remain specific unverified cases: exact/inexact prayer boundaries, reboot/timezone changes, offline expiry and restore; general user acceptance does not claim every case was exercised.

Implementation references: [flexible layouts](https://developer.android.com/develop/ui/views/appwidgets/layouts), [configuration](https://developer.android.com/develop/ui/views/appwidgets/configuration), [pinning](https://developer.android.com/develop/ui/views/appwidgets/discoverability), [RemoteViews](https://developer.android.com/reference/android/widget/RemoteViews).
