# Printed Mushaf with selectable ayahs

The active Mushaf uses published page outlines, preserving calligraphy, spacing
and line breaks. It does not shape/reflow Arabic with Amiri or fit estimated word
widths into rows. Omar rejected that earlier approximation on 2026-09-19 and
clarified that the printed appearance matters, not the PNG file format.

## Research and selected source

- [QUL's QPC V2 page fonts](https://qul.tarteel.ai/resources/font/249) encode
  handwritten words as glyphs, with one font per page. This is a viable Hafs
  word-selection approach, but does not establish a matching Duri edition.
- [Quran.ws SVG Mushafs](https://github.com/quran-ws/quran-svg) provide publisher
  vector artwork and explicit ayah polygons for both Hafs and Duri. This is the
  selected source: King Fahd Complex editions, repository revision
  `b4155f07e4aea087d2c458069acff9f7c7e749f6`. All 1,208 downloaded files are
  checked against their Git blob hashes before packaging.
- [Polygon format](https://github.com/quran-ws/quran-svg/blob/b4155f07e4aea087d2c458069acff9f7c7e749f6/docs/FORMAT.md):
  the source places Duri hit regions underneath its ink, and opening pages have
  unusual origins. Our independent overlay sits above noninteractive artwork;
  both layers share the same SVG viewport and scale. Opening-page viewports
  include the measured ink and polygons without the source's excessive margins.

These are published printed editions, not pixel-identical copies of the old
PNGs. No glyph path or letter is rewritten. Only non-white ink inherits theme
color; the opening-page viewport is cropped without moving its contents.

## Interaction and performance

Hold an ayah for 450 ms to open explicit listening actions. Short taps do not
select or play. Movement beyond eight screen points cancels the hold; page swipes
can take over. The active ayah is highlighted. The listening panel now offers
individual matching-reader words: choose one, then explicitly play it. Direct
word holding and synchronized **word** highlighting remain in Flowing text and
Ayah by ayah; the printed dataset supplies **ayah**, not word, touch regions.

The three-page pager retains whole-page fit. Each page now has a fixed slot
relative to the session origin; its slot and shared motion are composed in the
native animation graph. Transferring the active page after a swipe never rebases
page positions or resets the animation to zero. This removes the source of a
mixed frame in the old layout-plus-reset handoff. Scenes clip their own ink and
keep a viewport-sized native layout box for touch testing. Jumps, size changes
and disposal invalidate older animation completions. Tests cover frame geometry,
consecutive/reverse turns, boundaries and interruptions; phone acceptance of the
reported overlap remains pending. Mushaf zoom
buttons and the scaled/pannable surface were removed after Omar clarified that
he wanted letter resizing, not enlargement of a fixed printed page. Actual
font resizing remains in Flowing text and Ayah by ayah. Manual page movement
pauses following; Back to recitation finds the correct edition page. A Duri ayah
spanning two pages stays on the current page if it contains the passage; no
within-ayah page timing is invented.

The audio bar shares a 56-point footer with the page arrows below the ink. Tap
its arrow or summary to expand the same card upward: all seven readers and the
skip, stop and follow controls are immediately available in a scrollable area
bounded by the reader viewport. It expands over the page without resizing it.
Tap outside, Back or the arrow to collapse the options; audio is unaffected.
The card now animates its dimensions with a consistently inset circular play
button. Its top handle can be tapped, dragged or flicked in either direction;
short drags spring back. The same handle replaces X dismissal in the shared
half-page sheets. See [panel behavior and verification](SHEET_INTERACTIONS.md).
There is no headphone-only state or playback/reader modal. The separate sheet
for a deliberately held word/ayah still supplies word-only/ayah/continuous actions.
Errors are indicated in the bar and explained in its expanded options. Text
modes reserve 64 points in scroll padding and follow calculations so the final
words clear the bar. Primary targets are at least 48 points; reader rows are at
least 56 points. Text modes retain +/- for actual Arabic font size.

Each page is a compressed, bundled Expo asset. The 1,208 archives total about
186.3 MB (two complete editions). They stay outside the JavaScript bundle and
do not fetch publisher pages at runtime in an installed offline build. Expo's
development server still serves assets during development. The page service
deduplicates loads and keeps at most five decoded XML strings; the pager retains
three pages. Memoized calligraphy is independent of the changing highlight layer.

## Edition bridge

The printed Duri edition has 6,218 numbered ayahs; the existing KFGQPC Unicode
Duri v2.0 text/audio routing has 6,217. The difference is Al-Mulk: printed 9
ends at `نذير`, and printed 10 begins `فكذبنا`. Together they match Unicode ayah
9. Printed 11–31 map to Unicode 10–30. This was checked against the printed
pages 562–564 and the existing word routes.

Both regions of printed 9–10 select/highlight the complete shared passage and
the sheet labels it **67:9–10 / Play these two ayahs**. Other Al-Mulk labels use
their printed number while the audio controller retains its native reference.
No timestamp is guessed and no Hafs page is relabeled as Duri.

## Reproduction and checks

1. `python scripts/fetch-mushaf-vectors.py` downloads the pinned sources.
2. `python scripts/prepare-mushaf-vectors.py` creates per-page ZIPs, metadata,
   static catalogs, indexes and SHA-256 asset manifest.
3. `npm test` checks all archive hashes/decoding, complete reader-reference
   coverage, viewport/overlay bounds, and phone/tablet/landscape transforms.
4. `npm run check:quran:metro` resolves/hashes all 3,556 generated Quran modules
   and 1,208 vector assets using Metro, without a bundle/export/APK.

At the inline-player/text-scroll correction: 96 regression tests pass, including
fit, typography invalidation, true Surah edges and bounded/cancelled seeking. Sampled source renders were inspected in the prior vector-page pass;
all generated paths/transforms retain the publisher geometry. Native touch,
accessibility, frame rate, audio and visual acceptance remain unverified under
Omar's existing build/device-testing hold.

## Rights

The page artwork belongs to King Fahd Glorious Quran Printing Complex. The
repository's polygon/metadata contribution uses CC BY 4.0, with attribution waived
inside products. These rights are separate from this app's code. See the copied
[publisher/source notice](licenses/QURAN_VECTOR_NOTICE.md) and
[repository license](licenses/QURAN_VECTOR_LICENSE.md). The previously cached
CC0 notice belongs to an older repository revision and is not the license relied
on for this import.
