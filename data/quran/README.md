# Quran reader data and attribution

`quran-en.json` is the unmodified Quran JSON 3.1.2 distribution by Risan Bagja Pradana, downloaded 2026-09-07 from https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_en.json.

- Project: https://github.com/risan/quran-json
- Arabic Uthmani text: The Noble Qur’an Encyclopedia, https://quranenc.com/en/home
- English: Umm Muhammad (Saheeh International), supplied by the project from https://tanzil.net/trans/en.sahih
- The upstream LICENSE.txt is included verbatim. Its text specifies CC BY-SA 4.0 (the npm manifest's CC-BY-4.0 label differs; retain the full upstream license). Attribution applies to the dataset; app code is separate.
- Text is never generated, normalized, truncated, or translated by the app. UI adds verse number markers outside the source text.

`page-map.json` retains only factual [page, juz] metadata, keyed by surah:ayah, from https://api.alquran.cloud/v1/quran/quran-uthmani (2026-09-07). Arabic text from that response is not redistributed. `chapters.json` contains chapter metadata from https://api.quran.com/api/v4/chapters?language=en on the same date.

Mappings are validated for all 6,236 verses and 604 pages. Layout modes share these page references; translations are matched by surah and verse, never by an estimated number of verses per page. Existing Mushaf page images are retained.
