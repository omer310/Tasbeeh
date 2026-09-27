# Panel handles and Quran player

Source follow-up, 2026-09-19. Omar explicitly likes the player's expansion and
enveloping dismissal. He rejects the whole bar dipping/rebounding during a drag,
and requests the same opening/closing style for every half-page panel. Source
now anchors each reveal at the bottom. The corrected motion awaits his review;
the existing build, export, install, launch and device-QA hold remains in force.

## Behavior

The Quran player retains a circular 48-point play button inside a 56-point rounded
bar. Equal insets keep the button concentric with the card corner in both states.
The rounded shadow sits outside a separate clipping surface, avoiding Android's
old clipped-elevation artifact. Width and height animate together on Reanimated's
UI runtime; the footer and button retain their size as options open upward. The
footer stays at the same vertical position during handle dragging and dismissal.
Dragging changes only the reveal: a completed dismissal continues directly from
the current height to the compact bar, with no separate translation or rebound.
The Quran reading viewport does not resize. All seven readers stay in this card.

The expanded player and shared `BottomSheet` use `SheetHandle`: a small visual
line inside a 44-point touch area. Tap the handle to close; drag down to reduce
its revealed height, or back up to restore it. Short releases restore the open
height; a deliberate drag or flick in either direction closes toward the bottom.
Grabbing during a spring resumes from its current reveal. Horizontal motion and small
tap jitter do not capture a drag. Only the handle owns this gesture, leaving
sliders, inputs and scrolling lists to handle their own touches. The half-page
panels have no separate X. Outside tap and Android Back also dismiss.

Shared sheets use the player's spring configuration to reveal upward and fold
back down. They have no entrance/exit fade or whole-panel translation. A clipped
frame changes height while the content keeps its full measured layout, so text,
lists and inputs do not reflow on each animation frame. Auto-height panels measure
their header and scroll content before opening; fixed/percentage panels resolve
against the available viewport, never against the changing reveal. Long lists,
wrapped titles, rotation and keyboard-constrained viewports remain bounded.

Sheets animate before notifying their parent of handle/back dismissal;
external `visible=false` also retains them briefly for exit. Interrupted exits
are invalidated on reopening/unmount so old completion callbacks cannot close a
new panel. Native Modal readiness and measured size gate the initial reveal, so
the opening animation does not run while Android is still creating its window.
System reduced-motion preference skips reveal animation. The backdrop stays transparent.

These changes reach language, reading-layout, Surah/jump, held-ayah actions,
Adhan/reminder, Tasbih, Dua, Hadith and compass option sheets through their shared
component. Full-screen navigation and item-delete buttons are separate controls.

## Word choice in printed Mushaf

Hold a printed ayah, choose a word in the listening sheet, then explicitly press
**Play this word**. Word choice itself never starts playback. The choices use
the selected reader's exact text and character ranges, including native Duri
and the joined printed Al-Mulk 9–10 passage. A bounded, scrollable word area
keeps long ayahs usable; the existing clip guard disables words with missing or
grouped timing. Switching selection cannot reuse another word's ready status.

The printed source still supplies ayah polygons only. This is a word picker
within its ayah actions, not invented word hitboxes on the artwork. On-page
highlighting remains at ayah level. See [vector source](QURAN_VECTOR_PAGES.md)
and [timing limitations](QURAN_AUDIO.md).

## Verification

- All 106 Node tests pass, including interrupted drag origins, bounded reveal,
  content/viewport sizing, bidirectional dismiss thresholds, word-picker callbacks
  for Hafs/Duri and joined-passage word ranges.
- Touched-source ESLint: zero errors; one React Compiler migration warning concerns
  sheet presence state. Expo/Babel transforms both changed panel components.
- The previous Metro check resolved/hashed 3,556 Quran modules and 1,208 page
  assets. This motion-only follow-up changes no Quran data or asset imports.
- Native animation smoothness, RTL appearance, screen-reader traversal, gesture
  interruption and small-screen/large-font interaction still need device review.

The motion APIs were checked against installed Reanimated 4.5.1 and Worklets
0.10.1 declarations. The previous [shadow reference](https://reactnative.dev/docs/shadow-props)
still applies to the player's separate rounded shadow surface.
