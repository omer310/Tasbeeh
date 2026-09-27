# Quran audio sources and validation

Implemented in source on 2026-09-10 with panel/word-picker follow-ups on 2026-09-19; not built, installed, or tested in the app. Omar's existing build/device-testing hold remains in effect. See [ROADMAP](ROADMAP.md).

## Playback and controls

All three reading layouts support listening. The active Mushaf now uses published vector pages: hold an ayah, then choose a word in its listening panel. In the two text layouts, hold a word directly. Both offer **Play this word**, **Play from this ayah** (through the Surah), and **Play this ayah only**. A short tap neither selects nor plays; native selection/copy is disabled. Native long-press cancellation protects scrolling/swiping. Ayah cards also retain an explicit actions button and accessibility long-press actions. Word clips are available only where a complete, isolated source interval exists; group timings and missing intervals are not guessed.

The persistent player offers reader selection, Play/Pause, previous/next ayah and Stop. Loading appears immediately and Stop can cancel it. The main Play button cannot accidentally cancel a pending load through repeated tapping. **Back to recitation** appears after manual scrolling. Following locates the spoken line inside a paragraph, rather than assuming an entire multi-ayah group is visible. The last spoken word is retained for scrolling during pauses while its visible highlight clears. The printed Mushaf follows whole ayahs/pages at whole-page fit; the earlier reflowed Mushaf and zoom surface were superseded. Its compact player expands in place with a spring handle and consistently rounded play button. See [current panel behavior](SHEET_INTERACTIONS.md). Short viewports use readable scrolling; landscape uses a compact player. Source geometry checks cover widths 280–800 and short landscape viewports; native layout/gestures remain unverified.

Explicit Surah navigation, layout changes, backgrounding, screen exit or another audio preview stop playback. Manual Mushaf page browsing keeps listening active and suspends following. Reader selection is saved and does not start sound. Stored reading references/bookmarks retain the existing canonical page convention and convert to the selected reader's text references.

All seven timing catalogs are local, split into 798 lazy chapter modules. Original compact catalogs remain as source audit inputs. Local maps and neighboring text pages prepare during idle time; the current text scene mounts before its neighbors. Noreen/Alzain retain one native Surah player when skipping or choosing words. The five individual-MP3 readers advance automatically and cache one ayah ahead. Failed caches fall back to streaming. First audio still depends on the host/connection; this is not a complete offline audio download feature. No device latency or gapless-audio claim is made.

Word highlighting and clip boundaries follow native position updates at 50 ms. Millisecond-valued source timestamps do not establish acoustic millisecond accuracy. Original valid intervals are preserved; adjacent source tokens that make one Duri word can be combined without inventing an internal cut.

### App research informing the design

[Quran.com's word/audio settings update](https://quran.com/en/product-updates/simplifying-word-by-word-and-audio-settings) groups individual-word reading/listening options together. [Greentech's Al Quran](https://gtaf.org/apps/quran/) offers word audio and recitation controls. [Quran for Android](https://quran.com/apps) advertises continuous audio; [Quran for iOS release notes](https://github.com/quran/quran-ios/releases) discuss playback ranges and ayah actions. This implementation combines continuous playback with Omar's requested deliberate hold, followed by a clear word/ayah choice. Research used source documentation, without launching another app.

## Sudanese recordings

[Noreen Siddiq (Duri an Abu Amr) and Alzain Mohammad Ahmad (Murattal)](https://huggingface.co/datasets/zaibihassan/Quranic-Recitation-Data) use matching .opus and .pb files, pinned to repository revision `70ea7051fdaa8ad6ad5388127f877b40c8b9ec1a`. Each reader has 114 audio/timing pairs. The dataset card declares Apache-2.0. We stream the hosted recordings and bundle compact JSON derived from their protobuf timings, retaining the original word indices, zero/backwards ranges and millisecond values. The accompanying [Apache license](../assets/licenses/quran-recitation-data-LICENSE.txt) and [attribution/change notice](../assets/licenses/quran-recitation-data-NOTICE.txt) are included. This is the publisher's license statement, not an independent rights determination. Run `node scripts/prepare-sudanese-timings.cjs --check` to compare all bundled entries, including basmala records, with the pinned protobuf cache; omit `--check` to regenerate.

Noreen now displays **Duri an Abu Amr text and native numbering** in every layout; the other six readers retain Hafs. The prior warning about Duri audio over Hafs text is superseded. The ordinary Noreen Murattal and Muhammad Abdul-Kareem folders were not offered as synchronized recordings because their sampled folders lacked matching `.pb` data.

### Native Duri text and interactive Mushaf

The text is King Fahd Complex DouriData v2.0 as mirrored by [Quran Center](https://github.com/quran-center/quran-meta/blob/a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9/examples/data-check/data/DouriData_v2-0.json), pinned to `a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9`. This edition numbers **6,217** ayahs. It must not be mixed with other Duri editions using different counts. Original verse bodies and the source's separate ayah medallions are preserved. Arabic normalization is used only to align references, never to rewrite displayed text. The original JSON SHA-256 is `3ebae16badd0b1a20e6da0952557e234abb97041d752706245d0660fa48e5f51`.

[QUL's matching QPC Douri font](https://qul.tarteel.ai/resources/font/qpc-douri-font) is bundled unchanged as `QuranDuri.ttf`, SHA-256 `3a862f8e4ba9b7fd024e2b74981026eb5a901cb292e2b43766795112a35a6b45`. Its embedded EULA permits free use/copy/distribution with conditions; it is not an MIT font. See the [font license](../assets/licenses/quran-duri-font-LICENSE.txt), [Quran Center license](../assets/licenses/quran-meta-LICENSE.txt), and [source notice](../assets/licenses/quran-reader-NOTICE.md).

HF timing keys use the 6,236-ayah reference convention. Word routes map them to the native Duri edition: Duri 1:1 corresponds to the canonical 1:2; Duri 2:1 joins canonical 2:1–2; Duri 42:1 joins canonical 42:1–3. Canonical 1:7 splits into Duri 1:6–7. Changing readers converts references instead of blindly retaining the ayah number. Noreen 14:1 briefly begins the next native ayah and then repeats earlier words: continuous playback follows the original sequence of timed cues, while isolated ayah playback selects a complete uninterrupted occurrence. English ayah translations remain available with Hafs; they are not falsely attached to different Duri boundaries.

The superseded native-text Mushaf prototype used real Arabic words with page/line membership derived from [mushaf-layout](https://github.com/zonetecde/mushaf-layout/tree/72116ce4d405d67823804f0eed795c1e6409b4af), not pixel hitboxes over PNGs. The original PNGs remain on disk but are no longer the reader surface. Offline HarfBuzz font advances size the rows; text is live, themed, selectable only by a deliberate hold, and highlighted by the audio routes. **Duri pages are explicitly labeled “adapted pages”**: Duri text/numbering follows the existing 604-page navigation template. This is not a facsimile of a printed Duri edition. Original Duri source-page values are retained as metadata, not misrepresented as the app's page numbers.

Reproduce sources with `python scripts/fetch-reader-inputs.py`. Install analysis-only `uharfbuzz==0.56.1` into `.local-backups/quran-font-tools`, then run `python scripts/prepare-reader-text.py --check` (omit `--check` to regenerate). Generation reads canonical text through Node, checks every shaped word for missing glyphs, and emits 114 Duri text modules, 1,208 page modules and chapter word/page lookups. `node scripts/prepare-quran-chapter-timings.cjs --check` verifies all lazy timing modules. `node scripts/audit-reader-mapping.cjs` records the current reader-reference audit in [QURAN_READER_AUDIT.json](QURAN_READER_AUDIT.json).

## Other readers

Alafasy, Husary, Minshawi, Abdulbasit and Sudais use [quran-align's 2016-11-24 release](https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24) with the exact [EveryAyah](https://everyayah.com/data/) encodings named by that release. Their compact bundled data retain the original segment tuples, including exclusive ending word indices. See [release README](../assets/licenses/quran-align-README.txt) and [CC BY 4.0 license](../assets/licenses/quran-align-LICENSE.txt). Data attribution: Collin Fair / quran-align. The Sudais archive entry begins with a 154,139-byte diagnostic log; only that non-JSON prefix was removed before parsing the data.

The Hugging Face files for these five readers were not used: inspection found incorrect Surah 7 word counts across much of the chapter. Swapping timing metadata onto a different recording would be wrong, so both audio and timing source were changed together.

## Guardrails and audit

`node scripts/verify-quran-audio.cjs` checks all 43,652 canonical source-reader/ayah pairs, the five EveryAyah directory indexes, and audio headers for surahs 1, 2 and 114 per reader. It does not listen to recordings or launch the app. `--offline` uses cached Sudanese metadata and skips remote catalog/stream checks. The latest [machine-readable report](QURAN_AUDIO_AUDIT.json) records exact affected ayahs and source checks.

Arabic remains character-for-character unchanged. Highlight spans follow existing word boundaries; an alternate vocative/ha-prefix segmentation is used only when its count matches the recording metadata. Internal thin spaces are not treated as word breaks. Count agreement is a structural check, not proof that every acoustic word aligns. A mismatch suppresses the ayah's word highlights. Invalid/missing internal timestamps clear highlights for those gaps and show an incomplete-highlighting notice. For damaged first/last word timing, separate playback bounds can bracket the ayah using neighboring valid verse boundaries. These bounds do not become word highlights. A boundary still rejects playback if it cannot be recovered. Independent ayah MP3s remain playable when highlights are incomplete.

| Reader | Playable source-reference ayahs / 6,236 | Structurally complete timing maps | Partial highlighting | Unusable ayah boundaries |
| --- | ---: | ---: | ---: | ---: |
| noreen | 6236 | 6131 | 105 | 0 |
| alzain | 6236 | 6212 | 24 | 0 |
| alafasy | 6236 | 6202 | 34 | 0 |
| husary | 6236 | 6210 | 26 | 0 |
| minshawi | 6236 | 6194 | 42 | 0 |
| abdulbasit | 6236 | 6195 | 41 | 0 |
| sudais | 6236 | 6199 | 37 | 0 |

The table above retains the source-reference audit. In the current UI Noreen has **6,217 playable native Duri ayahs, 104 with partial highlighting**. Across the seven current reader editions there are 43,633 ayahs and 308 partial maps. 77,119 of Noreen’s 77,425 displayed words have structurally isolated clip intervals; the remaining 306 keep whole-ayah playback. These are structural counts, not listening validation.

All sampled streams returned valid audio headers and all five EveryAyah indexes contain their 6,236 required ayah files. Noreen has 124 invalid word ranges, including zero-duration chapter-opening letters; Alzain has two invalid ranges. The guards are deliberate. The repository's “production-ready” description is not treated as a guarantee.

### Recovery of the previously blocked ayahs

The previous report's **29 Noreen and 2 Alzain** ayahs now pass the playback-boundary checks with their original readers. This restores a source path for playing them, not verified acoustic or word-timing precision.

- Noreen 9:71 already has a valid repeated final-word timestamp. The old guard rejected the entire ayah because another copy was invalid; it now accepts the valid boundary while retaining the partial-highlighting notice.
- The other 28 Noreen ayahs have zero-duration records. Surrounding valid ayah/basmala timestamps bracket their playback. Where no preceding basmala record exists, a first ayah can start at the beginning of the file, including any opening silence/basmala.
- Consecutive untimed ayahs 42:1 and 42:2 require an additional separator. The exact pinned 042.opus recording has a band-limited detected pause from **9.736396–10.225021 seconds**. Its midpoint, **9.981 seconds**, divides their playback ranges. This is waveform-derived and requires listening review; it is not a claimed exact word boundary.
- Alzain 9:125 and 65:1 extend through their invalid final-word records to the next valid ayah start. The stronger guard also found ten additional Alzain ayahs with missing boundary-word coverage; those now use neighboring bounds too. All 40 recovered bounds appear in the audit report.

The Noreen Surah 42 evidence file has SHA-256 `e6e92501ef66c317266d8f5baff4291c6b85d06264d60fa33938a3873bee6e74`. Reproduce its pause check with ffmpeg, using the pinned source: `-i 042.opus -t 20 -af highpass=f=160,lowpass=f=3000,silencedetect=noise=-30dB:d=0.2 -f null -`. Raw timing JSON remains unchanged. All 43,652 reader/ayah pairs have playable structural boundaries, while 309 ayahs across readers have some incomplete word highlighting.

Before release, verify actual playback/seek precision and word highlighting on the target phone, especially Noreen Duri, long surahs, repeated words, pauses, chapter-opening letters, layout changes, interruption, and network recovery. Ogg/Opus container support also needs iOS validation before iOS acceptance. Complete word-level coverage remains open where the upstream data are damaged or incompatible.

## Source checks at handoff

### Metro resolution follow-up (2026-09-10)

Omar reported that Metro could not resolve `word-pages/hafs/81.json`. The file and all 1,208 page JSONs were present and parseable. A fresh Metro dependency graph resolved and hashed all **2,348** generated Quran modules. The development server restarted independently during inspection; its next Android bundle completed successfully with 4,430 modules at 22:21:34 local time. The attempted guarded server restart stopped without changing any process because the original PID had already exited. No agent APK build, installation or app launch occurred.

Metro's block list now excludes `.local-backups`, whose downloaded datasets and analysis libraries are not app inputs. Run `npm run check:quran:metro` to exercise Metro's real resolver and file hashing, rather than only checking files through Node. This makes no bundle or APK. After bulk generation of new modules, restart the existing development server with `npx expo start --dev-client --clear` if its file index is stale.

All 87 Node regression tests pass, including continuous progression, one-player Surah seeking, single-ayah boundaries, pause/skip, late loading/seek races, interruption and the recovered boundaries. The earlier online catalogue/stream-header audit passed for all seven readers. This follow-up reran the offline source audit and verified the bundled Sudanese catalogues against all cached protobuf entries; the current source report is marked offline. Touched JavaScript lint has zero errors; React Compiler migration warnings remain. Native Duri references, all page word routes, conservative word clipping, repeated passages, paragraph following, preference hydration races and narrow/landscape geometry have additional regression coverage. No APK, app launch, physical-device test, native compilation, measured on-device latency or auditory synchronization check was performed.

### Printed Mushaf follow-up (2026-09-19)

The active Mushaf now uses published Hafs/Duri vector pages with ayah-level holding, highlighting and following. Individual word actions are also available by choosing a word inside the held-ayah panel; direct word holding/highlights remain in the text layouts. The printed artwork has no verified word polygons. Printed Duri Al-Mulk has an additional verse boundary and is explicitly mapped to the existing native-text/audio references; the combined 9–10 passage is labeled as two printed ayahs. Timing data and existing partial-word limits are unchanged. All 90 regression tests pass; Metro resolves 3,556 generated Quran modules and 1,208 vector page assets. These are source/data checks, not native touch, audio or frame-rate acceptance. See [vector page details](QURAN_VECTOR_PAGES.md).
