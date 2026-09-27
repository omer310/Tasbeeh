# Decisions

### Offer attributed Tafsir from the shared ayah menu — 2026-09-23

- **Decision:** Hold an ayah in Mushaf, flowing text or ayah-by-ayah mode, then choose Read Tafsir. Use the same sheet, with a visible source selector and a remembered choice. Start with Ibn Kathir (abridged) in English or Al-Sa’di in Arabic; also offer English Ma’arif al-Qur’an and Arabic Ibn Kathir/Al-Muyassar.
- **Why:** Omar requested explanations in every mode and clarified that users should be able to choose a Tafsir intuitively. Each explanation retains its published wording and links to Quran.com. Duri references use every matching Hafs passage from the existing word routes, with the numbering difference labeled.
- **Tradeoff:** First reads need the public Quran.com endpoint. A bounded local cache supports recent offline reads; failures provide Retry and a source link. No generated commentary or embedded API credentials. The public endpoint works at verification time; the newer authenticated Quran Foundation API would require a backend if this endpoint stops serving public requests. See [implementation and sources](QURAN_TAFSIR.md).
- **Status:** Source implemented. All 161 tests pass, including every native verse mapping, grouped explanations, caching and preference persistence. Five live source requests return correctly identified content. Native interactions and appearance await Omar's review under the existing build/device hold.

### Put the next-prayer countdown over time-specific mosque art — 2026-09-23

- **Decision:** Keep the live countdown centered on the prayer home card. Draw a restrained mosque silhouette and abstract light in code for each next prayer: Fajr has a predawn glow, Dhuhr a high sun, Asr a lower side sun, Maghrib a sun at the lower edge, and Isha a crescent. Each has light and dark colors.
- **Why:** Omar accepted the minimalist mosque direction and asked that the sun's position reflect the prayer instead of remaining centered. The earlier curves-only mockup remains a design option, not the selected implementation.
- **Tradeoff:** The motif changes when the next prayer changes; it does not calculate or continuously animate the astronomical sun position. A compact vector card keeps the five prayer rows visible and leaves the countdown as real text.
- **Screenshot correction:** Omar's phone showed the artwork in normal layout flow, pushing the timer outside the card. React Native 0.86 no longer exports the `absoluteFillObject` helper used by the first implementation. A native `View` with `StyleSheet.absoluteFill` now holds the artwork edge-to-edge, while a separate padded foreground centers the text. The regression check uses the installed native StyleSheet API and covers all five prayers, both themes and all three card heights; phone recheck remains open.
- **Proportion follow-up:** Omar confirms the background/countdown alignment now works. He finds the mosque squashed. Its dome, walls and minaret are now taller, and a separate SVG with uniform scaling preserves their proportions while the landscape fills the card. The revised silhouette still needs phone acceptance.
- **Status:** Settled source direction; 156 automated tests, JSX parsing and touched-file lint pass. Phone appearance and compact-layout acceptance remain open under the existing preview-build hold. See [system behavior](SYSTEM.md#prayer-times-and-alerts) and [remaining review](ROADMAP.md).

### Keep the whole prayer day useful across widget sizes — 2026-09-20

- **Decision:** Use Omar's three screenshots as inspiration for a responsive prayer dashboard: five daily prayer times, highlighted next prayer, sunrise and Hijri date; larger views add a prominent countdown, Gregorian date and location. Narrow tall widgets become a vertical agenda. Start at 4 × 2 while retaining the 100 × 48 dp resize minimum. Use prayer-only green gradients and gold accents.
- **Why:** Omar wants useful information to survive resizing, with more visual polish than the original single countdown. The future-only queue cannot provide today's full timetable, so the snapshot now also carries daily records and refreshes at the location's midnight.
- **Tradeoff:** Keep the existing next-prayer meaning instead of inventing prayer-end rules. Hijri dates follow the Calendar's local conversion, not its optional API refinement. Source compatibility with older saved snapshots remains. Dua appearance and behavior are unchanged.
- **Status:** Settled source implementation; 23 widget/prayer regressions, JVM size/content budgets, isolated Kotlin type-check, AAPT2 resource compilation and JS checks pass. A new preview install and Omar's launcher review remain open. See [details](ANDROID_WIDGETS.md).

### Make prayer widget content follow its launcher size — 2026-09-19

- **Decision (settled):** Lower prayer resize bounds to 100 × 48 dp, preserve the default 2 × 2 size, and render from each instance’s Android size options. Small rows prioritize prayer/time, wide strips place the countdown alongside, and spacious cards enlarge type and add upcoming prayers. Large fonts reduce secondary detail. Android 12+ receives exact-size RemoteViews; older/custom launchers receive orientation-specific fallbacks.
- **Why:** Omar reports the preview works and accepts the Dua widget, but says prayer cannot shrink or use added space. Its previous minimum height equalled its default, and every resize reused identical fixed content. The resize flag alone did not address either issue.
- **Status:** Source and standalone JVM size checks pass; this native follow-up still needs a new preview APK and Omar’s resize review. Dua rendering stays unchanged. See [behavior and verification](ANDROID_WIDGETS.md) and [remaining review](ROADMAP.md).

### Separate Android prayer and in-widget Dua reading — 2026-09-19

- **Decision (settled):** Two native providers distributed through the app: prayer uses accepted cached calculations; Dua uses existing Hisn content and reads directly inside the widget. Omar explicitly clarified separate widgets and full in-widget Dua display.
- **Why:** Native launcher views work without JavaScript running. Scrollable collections retain complete Arabic; per-instance storage allows distinct selections. No new network service, location polling or religious text is introduced.
- **Tradeoff:** Live countdown requires existing exact-alarm access for its transition; otherwise display the absolute prayer date/time with Android's delayed fallback refresh. Expired caches and travel location updates require opening the app. Native Dua translations are outside this first version.
- **Status:** Source implemented/checked; native compilation and phone acceptance await the prior hold being lifted. See [behavior](ANDROID_WIDGETS.md) and [roadmap](ROADMAP.md).

### Keep Mushaf coordinates stable and surface everyday Duas — 2026-09-19

- **Decision:** Keep each printed page in a fixed session-relative slot and animate a shared position; ownership changes do not reset the completed slide. Add rolling, curved Juz/Surah/Ayah columns and light user-driven haptics, retaining native ranges and gesture cancellation guards.
- **Why:** Omar reports a Mushaf-only overlap/flash and abrupt linked wheel changes. The old Mushaf handoff changed layout positions separately from resetting its animated translation; fixed slots remove that mixed-frame opportunity. Viewport-sized scene boxes preserve native hit testing after many turns.
- **Duas:** Add twelve direct Everyday shortcuts, with six initially visible, while preserving all nine topics. Topics now offer searchable named occasions and Arabic previews, plus Read the whole category. Source text/IDs, variants, saved items and timed Athkar are preserved. Occasion selection waits for the shared spring sheet to finish closing before opening the reader.
- **Settings:** Correct the footer to Manarat al-Muslim / منارة المسلم. Use the same validated prayer save service from both entry points, including failure recovery and app language. General Settings keeps app-wide controls; speculative extra switches are not commitments.
- **Status:** Source implemented; 145 automated regressions pass. Native animation feel, touch/scroll behavior and user acceptance remain pending under the existing build/device-testing hold. See [navigation](QURAN_NAVIGATION.md), [Mushaf](QURAN_VECTOR_PAGES.md) and [Dua content](HISN_CONTENT.md).

### Use linked Quran wheels and a full prayer-settings page — 2026-09-19

- **Decision:** Replace Surah/Juz tabs with three linked scroll wheels (Juz, Surah, Ayah) and one explicit Done button, matching Omar's supplied reference. Move prayer calculation settings from the half-screen sheet into a full-screen page with Back, scrollable fields and a fixed Save button. Country/method selection stays inside that page.
- **Why:** Omar wants to choose a specific ayah together with its Surah/Juz, and now finds the prayer-settings sheet too short. This supersedes the earlier half-screen requirement for calculation settings only; compact prayer sound/reminder options retain their sheet.
- **Behavior:** Picking Juz selects its start, picking Surah selects ayah 1, and picking Ayah updates Juz. Scroll choices do not navigate until Done. Exact native positions are retained when multiple Duri ayahs share a canonical reference. Details and sources are in [navigation](QURAN_NAVIGATION.md).
- **Status:** Settled source implementation. All 134 regression tests and source transforms pass; touched-source lint has zero errors. Calculation, persistence, scheduling and failure-recovery paths remain connected and tested. Prior live API checks remain valid; full-page/wheel native appearance, scroll feel and device delivery are not newly verified under the existing hold.

### Share calendar dates, make prayer saves explicit, and navigate by native Juz — 2026-09-19

- **Decision:** Calendar highlights and upcoming countdowns read the same calendar rows. Prayer settings use the shared spring panel at half the portrait viewport, with scrollable fields and a fixed Save button. Fetch replacement prayer times before saving changed calculation/location settings or rescheduling alerts; leave failed edits open for retry. Display-only edits save offline. Add Surah/Juz/page tabs to Quran navigation using matching-reader references.
- **Why:** Omar wants important days visible in the grid, countdowns, functional prayer settings and direct Juz navigation. He explicitly scratched the suggestion to relocate the Quran mode control, so that stays in place. His latest feedback accepts the shared animation direction.
- **Details:** Cache identity includes method zero, Asr/high-latitude rules, custom angles and six minute offsets. Juz lookup uses a small generated index; Duri metadata needs explicit shared-page corrections rather than copied Hafs numbering. See [navigation evidence](QURAN_NAVIGATION.md).
- **Status:** Settled implementation; 121 source regressions pass and live public API calls confirm changed prayer parameters. Visual/native settings, countdown-resume and navigation acceptance remain open under the existing build/device-testing hold.

### Keep listening controls off the printed page — 2026-09-19

- **Decision:** Keep one compact playback bar. Its arrow or summary expands the same floating card upward, immediately showing all seven reader choices alongside skip, stop and following. Outside tap, Back or the arrow closes only those options. The page does not resize; no playback/reader modal or headphone-only state remains.
- **Why:** Omar explicitly rejected the extra compact-icon state and separate half sheets: he wants controls integrated with the existing player. This corrects the earlier interpretation of “hideable.”
- **Accepted follow-up:** Omar likes the inline direction. Give the circular play button equal insets, keep its size fixed while the card animates open/closed, and use a shared draggable line instead of X controls. Tap or deliberately drag/flick either way to dismiss; small drags spring back. Shared sheets finish dismissal before notifying their parent, and interrupted animations cannot close a reopened panel.
- **Motion correction:** Omar explicitly approves expansion and enveloping dismissal, but rejects the whole player's dip/rebound. Keep its bottom edge fixed and let handle movement change the reveal height; on dismissal continue straight to compact without restoring the open height first. Extend the same spring reveal to all shared half-page panels, replacing fades and whole-panel translation. Preserve full content layout inside the clipped reveal to avoid per-frame list/text reflow. This supersedes the short-travel/fade entrance and translated-handle motion from the previous pass.
- **Mushaf word choice:** Hold an ayah, select one of its matching Hafs/Duri words in the listening panel, then explicitly play that word. This supplies individual-word listening without claiming nonexistent word polygons on the printed artwork. Existing missing/grouped-timing guards remain. See [panel behavior and checks](SHEET_INTERACTIONS.md).
- **Text sizing:** Mushaf remains at whole-page fit. Remove its zoom buttons and pan/zoom surface because scaling the printed page does not enlarge and reflow its letters. Keep true font-size controls in Flowing text and Ayah by ayah. Pinch zoom was mentioned as a possible alternative, not accepted as a separate feature.
- **Scroll correction:** Reset native list measurements when typography or width changes, anchored to the current ayah. Memoize text rows, only request React layout updates for the followed row, bound seek retries per target, and require a visible measured first/last row before capturing a Surah pull. Ordinary scrolling must not trigger a parent spring. Keep positioning work hidden until its anchor is ready and warm neighboring Surahs with smaller render windows.
- **Status:** Source regression fixes pass all 106 tests, touched-source lint has zero errors, and the previous Metro check resolves all Quran assets (unchanged in the motion pass). Native glitch reproduction/resolution, corrected drag motion and shared-panel behavior still await Omar's review under the build/device-testing hold. See [scroll investigation](QURAN_TEXT_SCROLL.md) and [page behavior](QURAN_VECTOR_PAGES.md#interaction-and-performance).

### Preserve published Mushaf calligraphy with vector ayah regions — 2026-09-19

- **Decision:** Replace the native-text Mushaf approximation with 604 published SVG pages per edition (Hafs and Duri), compressed as offline assets with a separate hold-to-select ayah layer. Preserve word controls in the two text layouts.
- **Why:** Omar explicitly rejected the reflowed appearance and clarified that PNGs are optional; the familiar printed layout is required. QPC page fonts are viable for Hafs, but the selected SVG collection supplies corresponding Duri artwork and ayah regions too.
- **Trade-offs:** The source supports ayah-level selection/following, not verified word positions. The two complete editions add about 186.3 MB of compressed artwork; decoded pages are bounded to five, with three retained by the pager. Printed Duri Al-Mulk 9–10 share one Unicode/audio passage and are labeled/played together; later Al-Mulk numbers are translated explicitly.
- **Status:** Omar approves the published-page approach; subsequent feedback requests integrated player options and removes Mushaf zoom (above). Source, corpus and Metro checks pass; native long holds, accessibility and performance still require review under the existing testing hold. This supersedes only the native-text Mushaf part of the September 10 decision. See [source, format, rights and limits](QURAN_VECTOR_PAGES.md).

### Matching Duri text, deliberate word playback and interactive pages — 2026-09-10

- **Decision:** Noreen uses KFGQPC DouriData v2.0's 6,217 native ayahs and matching unmodified font; other readers retain Hafs. Map source-audio references at word boundaries. Preserve canonical bookmark storage. Offer long-hold word/ayah actions in text layouts. The native-text Mushaf choice was rejected and superseded by the 2026-09-19 vector-page decision above.
- **Why:** Omar reports that Duri audio over Hafs text, one-word selection, following and first-touch latency remain unsatisfactory. A font swap alone cannot resolve changed words/ayah boundaries. Duri page rows are explicitly adapted to the existing page template; they are not a printed-edition facsimile.
- **Interaction:** Replace Follow toggling with Back to recitation after manual scrolling. Follow actual text lines/pages and preserve scrolling position through silent intervals. Reject unsupported individual-word cuts. Separate immediate settings feedback from saved-preference hydration and heavy layout updates; mount adjacent Surahs after idle time and load timing data by chapter.
- **Status:** Source/unit/data/font-metric checks pass. Acoustic timing, native text rendering, gesture cancellation, and perceived first-tap performance still require Omar's acceptance after the existing build/device-testing hold is lifted. Supersedes the earlier decision to display Hafs for Noreen. [Sources and limitations](QURAN_AUDIO.md).

### Continuous listening and recoverable ayah playback — 2026-09-10

- **Decision:** Default to listening through the end of the Surah. Hold text to select an ayah, then explicitly choose continuous or single-ayah playback. Keep the mini player visible with pause, skip, stop, reader selection and Follow. Short text taps stay inert; manual scrolling pauses automatic following.
- **Why:** Omar found the one-ayah-at-a-time picker slow and unintuitive. Quran for Android/iOS research supports continuous listening and ayah actions. Bundle the two Sudanese timing catalogues to remove metadata fetching from Play, retain a Surah player for Sudanese readers, and prefetch the next individual recording for the others.
- **Recovery:** Accept a valid repeated boundary even if another copy is corrupt. Bracket damaged ayahs using neighboring valid timestamps; separate Noreen 42:1/42:2 at a measured silence. These are playback bounds, not word timing repairs. All seven readers pass structural playback checks for 6,236 ayahs each, including the previously blocked 31. Preserve missing-highlight notices and the Duri/Hafs distinction.
- **Status:** Source and regression/data checks pass; acoustic boundaries, word accuracy, touch behavior and on-device speed remain open for review under the existing build/device-testing hold. See [evidence and research](QURAN_AUDIO.md).

### Immediate selections, guarded Quran timings and optional alarm audio — 2026-09-10

- **Decision:** Update settings before persistence/scheduling, serialize storage and coalesce refreshes. Remove outgoing sheet touch interception. Use distinct intentional audio controls in text Quran layouts. Add seven reciters, including Alzain and the specifically requested Noreen Duri recording.
- **Sources:** Pin the Sudanese .opus/.pb pairs from the requested Hugging Face dataset. Use quran-align and matching EveryAyah encodings for five other readers after finding bad Surah 7 metadata in their Hugging Face folders. Keep the displayed Hafs text unchanged and label Duri explicitly. Suppress unsupported highlights. The later continuous-listening decision above adds explicit playback-boundary recovery; it does not synthesize word offsets. See [coverage and sources](QURAN_AUDIO.md).
- **Alarm policy:** Add an opt-in alarm audio route governed by Android's DND alarm exception. Keep default notification behavior, add Vibrate, and silence active playback on volume reduction/Stop. Never change system volume or global DND. Read back the queued advance-reminder time.
- **Status:** Source implemented and regression/data checks passed. Acoustic synchronization, UI smoothness, Opus support, DND delivery and hardware controls still require user/device acceptance. The previous build/testing hold remains. Complete word timing coverage is open because upstream metadata contain gaps.

### Reveal a prepared prayer home and reduce tab-switch work — 2026-09-07

- **Decision:** Load app settings and bundled fonts concurrently. Mount the prayer screen beneath a splash overlay and fade the overlay after the screen renders today's cached/fetched times or a recoverable error. Use the shared local/cached Hijri calendar immediately. Prepare other tabs one at a time during idle periods after home is ready; freeze visited inactive screens and skip the prayer countdown when its tab is hidden.
- **Why:** The old splash ended before prayer loading began and added a fixed 1.2-second wait. Returning to Prayer Times also repeated GPS, calendar requests and alarm scheduling on every tab visit. Ordinary revisits now reuse a recent result for five minutes; changed calculation/location settings, missing current-day data and app background/resume still refresh.
- **Trade-off:** First-time data fetching still depends on location/network availability; bounded failures reveal recovery controls instead of trapping the user on the splash. Idle preloading spends memory earlier to reduce first-visit mounting work. Device performance must be assessed in the preview APK because development mode adds overhead.
- **Status:** Open for Omar's device review. Source parsing/import checks and lint only; no build or app tests were run. See [startup behavior](SYSTEM.md#startup-and-tab-responsiveness) and [remaining review](ROADMAP.md).

### Keep Surah text mounted throughout vertical transitions — 2026-09-07

- **Decision:** Keep the current and adjacent Surah lists in one vertical pager. Prepare the next beginning and previous end offscreen; move both lists together and preserve the incoming list when committing its chapter/verse. Explicit picker jumps still start a new reading session. Disable selection in Quran, Dua and Hadith reading text, while retaining editable inputs and bookmark controls.
- **Why:** Removing the old list before the new one rendered caused a white flash. Position-restoration retries could then jump after manual scrolling. Readiness gates the slide, and restoration stops once its anchor is visible or the user starts interacting. The user explicitly rejected incidental text highlighting.
- **Follow-up correction:** Omar reports a remaining flash/rebound after the slide and rejects permanent gesture instructions. Keep native animation coordinates anchored to the session origin without recentering on chapter commit, and reject stale events from the outgoing chapter. Replace both instruction cards with a small transient arrow whose stem and tip form during the pull; its fade is independent of the completed page slide. Existing React Native animation primitives suffice; no new dependency is needed.
- **Mushaf:** Resolve the swipe axis before PanResponder's Grant callback, which receives reset distances. Preserve physical right-next/left-previous navigation and use the surrounding theme background instead of cream.
- **Status:** Omar confirmed the Surah animation and transient cue work as intended. His sole follow-up correction is applied in source: next points down and previous points up. Indicator lint passes; no additional build or device tests were run. Other reader/interface acceptance remains in [ROADMAP](ROADMAP.md).

### Match Hadith and Charity illustrations to the onboarding set — 2026-09-07

- **Decision:** At Omar's request, replace the old Hadith/Calendar collage and Charity night scene with new built-in generated illustrations. Use the original welcome, Quran and Tasbeeh art as references for flat shapes, warm skin/cream, muted teal and gold. Keep the tour order, wording and charity dedication unchanged; preserve both original files on disk.
- **Why:** Omar finds these two originals inconsistent with the rest of the set. This supersedes the earlier instruction to display all six original pictures, specifically for these two pages.
- **Status:** New images are bundled and connected in source; source parsing, local imports and touched-file lint pass. User visual review is pending. No build or app testing. See [asset provenance and prompts](../assets/onboarding/README.md).

### Preserve the original illustrated onboarding — 2026-09-07

- **Decision:** Restore all six original PNGs and their original sequence. Keep a separate language page, horizontal swiping, progress dots and Next/Enter. Put location choices with Prayer Times and add a notification page immediately after it. The existing charity dedication stays last.
- **Why:** Omar explicitly values the original graphics and workflow; the icon-only replacement removed a part of the design he wanted preserved. Theme colors belong to surrounding UI, without recoloring the pictures.
- **New artwork:** Built-in image generation used the original pictures as style references for language and notifications. Original files remain unchanged. See [generation prompts and assets](../assets/onboarding/README.md).
- **Status:** Source implemented; source parsing/import checks and onboarding lint pass. App appearance and flow await Omar's review; no build or app testing was run.

### Islamic icons, direct reading and separate collection progress — 2026-09-07

- **Decision:** Replace the earlier Lucide selection with the MIT [Hugeicons free rounded stroke family](https://github.com/hugeicons/hugeicons), using its Islamic symbols and retaining tab labels. Keep the Kaaba black/gold independently of theme; preserve the compass geometry.
- **Reading and layout:** Fit prayer rows into the available area above navigation. Keep three Mushaf pages mounted and expose an in-reader Surah picker. Native simultaneous handlers measure top/bottom pulls only after the list reaches a boundary. Group Dua occasions into nine topics. Calendar uses immediate local/cached dates with background updates.
- **Collections and sheets:** Store collection rounds separately from standalone Tasbih goals/counts. Include editable presets and custom sequences. Shared sheets use a clear backdrop and a spring header gesture; Adhan stays half-height. A clear backdrop satisfies the requested removal of dimming without introducing a native blur dependency.
- **Status:** Source implemented; parsing/local import review and lint found no errors. Warnings remain. No build or app testing was run; user acceptance is open in [ROADMAP](ROADMAP.md).

### User review before another build — 2026-09-07

- **Decision:** Hold all new APK builds, exports and agent device tests. Omar owns testing of the revised interface. EAS version 6 had already finished when the hold arrived; it contains the prior pass only.
- **Why:** Omar explicitly requested testing the app himself before another build.
- **Status:** Settled until Omar changes the instruction. Follow-up changes remain open in [ROADMAP](ROADMAP.md).

### Restore familiar prayer structure and continuous reading — 2026-09-07

- **Decision:** Keep the green palette, restore location above paired Gregorian/Hijri dates, and show a segmented next-prayer countdown without a duplicate clock time. Adhan choices occupy half the screen; remove product testing controls. Preserve the approved Settings and Tasbih chooser designs.
- **Reading:** Omar's latest direction supersedes the earlier gesture request: Mushaf right-next/left-previous. Text modes cover a whole Surah, followed by a pull-up transition. Default appearance follows the system, with optional overrides.
- **Status:** Source implemented, awaiting user review.

### Complete source catalogue with separate timed sequences — 2026-09-07

- **Decision:** Bundle the MIT Arabic Hisn collection, preserve its references/repetitions, and map every entry in the 132-chapter developer catalogue. Cache English meanings from the developer API; supply original renderings for split passages where a combined translation would be misleading. See [content provenance](HISN_CONTENT.md).
- **Why:** The previous eight-category subset omitted most occasions. Morning and evening need independent daily counters and an uninterrupted sequence.
- **Status:** Catalogue reconciled; app behavior awaits user testing.

### Preserve compass artwork and use one navigation icon family — 2026-09-07

- **Decision:** Use the official [Lucide](https://lucide.dev/) SVGs with retained ISC/MIT notices. Change icons only. Reuse the existing compass artwork with separate north/Kaaba transforms and dark filtering. Calibration responds to sensor accuracy, with an animated movement guide and a real completion condition.
- **Why:** The user requested coherent themed icons, the existing compass appearance, and calibration based on actual need. The old fixed compass offset only approximately matched the current location.
- **Status:** Historical icon choice, superseded by the Islamic Hugeicons family above. Calibration and independent bearing behavior remain pending user acceptance.

### An explicit runtime for the native Android release — 2026-09-07

- **Decision:** Use `57.0.20-adhan-1` in Expo config and the native runtime string. Increment it whenever native modules, native dependencies, configuration plugins or native behavior change. JavaScript-only changes may reuse it after compatibility checks.
- **Why:** EAS modifies signing/version configuration in this checked-in native Android project after fingerprint calculation; two build logs showed a `bareNativeDir` mismatch during Configure expo-updates. A dependency's self-modifying manifest created an additional fingerprint difference. The explicit runtime isolates this SDK/native-alarm release from older installed binaries without disabling runtime compatibility checks.
- **Alternatives:** Broadly ignoring native source in fingerprints would hide meaningful native changes. The previous automatic fingerprint policy can return after reproducibility is established for the native EAS workflow.
- **Status:** Settled for this native release. See [Android preview](ANDROID_PREVIEW.md).

### Direct reading and unobtrusive setup — 2026-09-07

- **Decision:** Keep notification permissions in onboarding and Settings; prayer home is for times and a tappable named location. Show complete Mushaf pages at the default scale and use left-next/right-previous swipes. Dua categories open directly to their text, with bookmarking and optional notes; Tasbih selection owns a separate touch region from the counter.
- **Why:** The user reported clipped last rows/pages, unnecessary setup banners, repeated navigation, and a counter area intercepting selector touches.
- **Status:** Historical first-pass decision. Physical Samsung checks passed for that pass; the subsequent right-next gesture and prayer-layout corrections above supersede its affected details.

### Separate Android development installation — 2026-09-07

- **Decision:** Local Android debug builds use `com.manaratalmuslim.dev` and the launcher name “Manarat Al-Muslim Dev,” applied by an Expo config plugin. Release and preview builds retain their existing identity.
- **Why:** The connected phone rejected the locally signed APK with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`; a separate package preserves the installed app and its data.
- **Alternatives:** Replacing the existing app requires its signing key, or uninstalling it and losing local data. Neither is necessary for local development.
- **Status:** Settled. Development data is separate from the existing installation. See the native-project instructions in [README](../README.md#native-projects).

### Cancellable previews and bounded prayer loading — 2026-09-07

- **Decision:** One preview session owns its pending asset request and native player. Stop invalidates pending work, pauses playback and releases the Expo shared object. Preview downloads and native loading have time limits and user-visible errors. Scheduled Azan remains the native alarm service's responsibility.
- **Why:** Removing an Expo player from the module alone did not reliably stop audible playback; a late asset download could also start a preview after Stop. Font assets are preloaded with recoverable startup errors to prevent lazy icon loads producing unhandled rejections.
- **Prayer loading:** Hidden settings never request location. Visible requests share a bounded location operation and prefer a recent fix; today's calendar is shown without waiting for adjacent months. A manual city chooser remains accessible while loading. Custom angles and high-latitude selections are included in API requests and cache identity.
- **Development:** USB runs advertise loopback for every asset URL. The Samsung could reach the bundle through USB while the old LAN host failed fonts, sounds and images. Use the `android:usb` command documented in README.

### Separate Quran browsing from reading — 2026-09-07

- **Decision:** Use a library with Continue reading, searchable surahs and bookmarks; keep the reading screen focused on the page. A dedicated sheet describes the three layouts and shows controls relevant to the chosen layout. Switching layouts preserves the page and preferences.
- **Why:** Library navigation, mode choices and page controls competed for space in the previous screen. After the user's fit correction, Mushaf fits both available width and height and can be enlarged. Image failures offer retry or offline flowing text.
- **Insets:** Shared tab wrappers own safe-area padding. Inner screens do not add it a second time; Calendar uses its own scrolling container. This removes the white band while keeping content below the system status bar.
