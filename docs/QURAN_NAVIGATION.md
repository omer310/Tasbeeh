# Quran navigation

The Surah title and library list button open one spring-animated picker with
three visible scrolling columns: Juz, Surah and Ayah, following Omar's supplied
reference. Choosing Juz sets its starting Surah/ayah; choosing Surah starts at
ayah 1; choosing another ayah updates the Juz. All 30 Juz, 114 Surahs and each
reading's native ayahs are available. Scroll/tap changes a draft; only Done
navigates. Dismissal leaves the reading position unchanged. This replaces the
separate Surah/Juz tabs. Page entry remains under reading options and accepts
Arabic/Persian numerals. The reading-mode selector is unchanged.

Wheels use fixed-size virtualized rows, native-driven perspective/rotation,
scale and opacity for a curved wheel effect. Native snapping and animated linked
changes roll the columns into place; the Ayah wheel stays mounted when its range
changes. User row crossings produce throttled, light selection haptics; linked
updates and initialization stay quiet. Reduced motion disables the added rolling
and perspective effects. First layout aligns immediately without a long sweep. Surah gets the wider column; names can wrap. Row height
follows font
scale, and the viewport is bounded for small/landscape screens. Each column is
an accessible adjustable control. Done is guarded while a wheel is moving.
Settling without momentum, late momentum callbacks, taps during coasting and
linked-column resets are handled by `createWheelInteraction`; stale gestures
cannot override the new choice. Ordinary list measurement does not recenter a
wheel. The shared sheet's drag handle and anchored spring motion are retained.

`juz-starts.json` is a small generated index; opening the picker does not load
114 Duri chapter modules. Selecting a destination resolves its native ayah,
canonical saved-position reference and the active edition's printed page. Text
layouts use their existing text-page numbering. The header determines Juz from
the current ayah and these section boundaries, rather than the first Hafs ayah
on a page. Jumps stop old playback, clear the old word selection and highlight
the destination until manual movement/selection or new playback. Native reader
position is saved alongside the canonical key: Duri 1:6 and 1:7 both map to
canonical 1:7, so the canonical key alone cannot restore either exact choice.
Old preferences still work; mismatched/stale native positions fall back safely.
Flowing text starts a paragraph at the jump's ayah. Short Surahs keep the chosen
visible ayah as the current position until the reader interacts or audio follows.

## Sources and boundaries

Hafs starts use the bundled page-map metadata. Duri starts use the original
KFGQPC DouriData v2.0 section metadata and division marks, already pinned and
attributed in [Quran audio sources](QURAN_AUDIO.md#native-duri-text-and-interactive-mushaf).
These are not interchangeable ayah numbers: for example, native Duri Juz 4
begins at 3:91 (Lan tanalu), and Juz 7 at 5:85 (Wa idha sami'u).

Two coarse `jozz` changes begin before the actual division on a shared page.
The generated index explicitly starts Duri Juz 11 at 9:95 (Ya'tadhirun, the
division mark on printed page 202), and Juz 26 at 46:1 (Al-Ahqaf, partway down
printed page 502). The previous page contains native 9:93–94; page 502 begins
with the end of Al-Jathiyah, which remains Juz 25. Source artwork and ayah
regions from the [pinned publisher vector repository](https://github.com/quran-ws/quran-svg/tree/b4155f07e4aea087d2c458069acff9f7c7e749f6/mushafs/douri/kfqc/svg)
were inspected alongside the Unicode metadata. The
[Quran Center DouriLists table](https://github.com/quran-center/quran-meta/blob/a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9/src/lists/DouriLists.ts)
was compared but is not imported: several entries reuse Surah/ayah numbers that
do not identify the same Duri passage in this app's text edition.

Rebuild with `node scripts/build-juz-starts.cjs`. Regression coverage verifies
all 60 starts, round trips through native/canonical references, actual printed
region membership, Surah starts in both editions, shared-page boundaries,
page input validation, linked columns, native split references and scroll races.
All 145 tests pass; touched-source lint has no errors and Babel transforms pass.
Phone rendering, gestures and jump/scroll acceptance
remain subject to Omar's build/device-testing hold.
