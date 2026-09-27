# Quran Tafsir

Hold any ayah in Mushaf or either text mode and choose **Read Tafsir**. Ayah-by-ayah mode also offers the existing ellipsis button. Holding a word opens the same menu; Tafsir explains the full ayah, while the existing word-listening actions remain available. Back returns to ayah actions within the same sheet. The larger Tafsir view scrolls independently from the reading page.

## Sources and selection

The source menu labels the author and language, applies immediately, and remembers the user's choice. With no saved choice, the app language selects English Ibn Kathir (abridged) or Arabic Al-Sa’di.

| Resource ID | Tafsir | Language |
| --- | --- | --- |
| 169 | Ibn Kathir (abridged) | English |
| 168 | Ma’arif al-Qur’an | English |
| 91 | Al-Sa’di | Arabic |
| 14 | Ibn Kathir | Arabic |
| 16 | Al-Muyassar | Arabic |

IDs and attribution are verified against [Quran.com's resource catalogue](https://api.quran.com/api/v4/resources/tafsirs?language=en). Content is fetched on demand from `https://api.quran.com/api/v4/tafsirs/{resource_id}/by_ayah/{verse_key}` with a 15-second timeout. All five sources returned correctly identified 2:255 responses on 2026-09-23. Each displayed passage links to its Quran.com source page. The current [Quran Foundation integration guide](https://api-docs.quran.com/docs/api-reference/) describes authenticated backend access; this implementation uses the verified public endpoint and would need a backend migration if that endpoint becomes unavailable.

HTML is displayed as plain native text with paragraph breaks and entity decoding. The app does not generate or summarize explanations. Responses must match both the requested resource and verse; empty or mismatched content produces an error with Retry and a source link. An older request cannot replace the currently selected source/ayah.

## Verse boundaries and offline reads

Hafs uses its verse key directly. Duri resolves all unique canonical references from the selected native ayah's word routes. For example, Duri 2:1 spans Hafs 2:1–2, while printed Duri 67:9–10 is a single Unicode Duri passage corresponding to Hafs 67:9. The panel labels the corresponding Hafs references. A publisher's explanation spanning several ayahs is displayed once, with its supplied range.

Recent successful responses are stored locally, bounded by 24 entries and 400,000 text characters. Cache keys include source and verse. Failed responses are never cached. A first uncached read requires internet; preferences and cached passages survive reopening the app.

## Verification

All 161 source tests pass, covering every Hafs/Duri reference, grouped content, malformed responses, concurrent reads, retry, offline cache and ordered preference writes. Touched code has no lint errors; legacy effect warnings remain. No build or native device QA was run under the existing hold. Phone review must cover long holds and the ellipsis action, switching sources, Back/dismissal, both languages/themes, and offline reopening. See [roadmap](ROADMAP.md).
