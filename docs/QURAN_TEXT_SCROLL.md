# Text reader scrolling correction — 2026-09-19

Omar reports repeated visual glitches while scrolling after changing layout or
increasing Arabic text to 44. A reload or another layout change clears the state.
The following source defects were identified; the phone symptom has not been
reproduced by the agent under the existing build/device-testing hold.

- **Stale heights:** one FlatList instance retained offscreen row measurements
  after font changes. Its list identity now includes font size, layout, width,
  translation, riwayah and system font scale. Remounting only the text list
  starts fresh measurements at the current ayah; Surah animation coordinates
  remain anchored to the existing pager session. Prepared neighboring pages are
  qualified by that same identity.
- **Measurement redraws:** every cell/text layout incremented React state,
  rerendering the entire Surah with fresh render callbacks. Rows are now memoized;
  ordinary measurements stay in refs and text lines are measured only for the
  followed row. That row coalesces follow recalculation to one animation frame.
- **False ends:** the Surah gesture relied solely on estimated content height,
  which changes while variable-height rows mount. A pull now requires the actual
  first/last row to be visible; next also needs its measured bottom and the true
  scroll boundary. Normal scrolling no longer starts a parent return spring.
- **Seeking loops:** layout callbacks reset the audio retry count. Retry budgets
  now belong to a target and remain exhausted until cancellation or a new target.
  Manual scrolling cancels pending retries, including late timers. Initial
  positioning remains hidden until its ayah is ready, preventing a visible tour
  through intermediate rows.
- **Rendering budget:** active lists render six rows per batch with a seven-screen
  window; inactive neighbors prepare two at a time in a one-screen window.

The installed React Native 0.86.3 `ViewabilityHelper` requires a measured cell
zero before it reports any visible items. Keep the initial rows mounted before
seeking a saved or previous-Surah endpoint; setting a nonzero `initialScrollIndex`
without providing exact item layouts would bypass this prerequisite. No fixed or
guessed `getItemLayout` is supplied for variable-length Arabic ayahs.

The approach also follows React Native's guidance on
[memoized rows and list batching](https://reactnative.dev/docs/optimizing-flatlist-configuration)
and [variable-height FlatList behavior](https://reactnative.dev/docs/flatlist).
The local installed implementation is the authority for the cell-zero constraint.

All 96 Node source/data tests pass, including new cases for typography identity,
false end detection, legitimate boundaries, exhausted retry budgets and manual
cancellation. Metro resolves all 3,556 Quran data modules and 1,208 assets.
Touched-source lint has no errors; existing effect/ref migration warnings remain.
These checks do not establish frame rate or native gesture behavior. Acceptance
requires repeated layout changes, text sizes 24–44, scrolling mid-Surah and at
both ends, saved positions, playback follow/interrupt, both riwayahs and small
screens. See [remaining work](ROADMAP.md).
