# Quran display options

Reviewed 2026-09-07. The current page images are preserved as the default Mushaf display.

| Option | Fit for this app |
| --- | --- |
| [Quran Foundation font and page-layout APIs](https://api-docs.quran.com/docs/tutorials/fonts/page-layout/) | Best foundation for exact printed lines, QCF page fonts and word interactions. Requires layout metadata, the matching font distribution, and attention to provider access and font licensing. |
| [open-quran-view](https://github.com/adelpro/open-quran-view) | Includes self-contained fonts/metadata and multiple Hafs layouts. Its documented views are React DOM and Web Components, so it is not a direct native React Native component. |
| [react-native-quran](https://github.com/moustafahelmi96/react-native-quran) | A native reader implementation to evaluate for deeper page/font interactions. Bringing in an entire reader and its data/backend assumptions is a larger integration than the requested additional views. |
| [Quran JSON](https://github.com/risan/quran-json) with React Native Text | Straightforward offline Arabic and verse translations, compatible with adjustable type and flowing/card layouts. It is a data distribution rather than an exact printed-page renderer. Chosen for the two additional views. |

Implemented: **Mushaf** (existing images), **Flowing** (Arabic reflows with screen/font size), and **Ayah cards** (separate verses with optional Saheeh International English). All share exact page/verse references, bookmarks, and the saved reading position. Flowing text does not claim to reproduce fixed printed Mushaf line breaks.

The previous unused translation loader incorrectly estimated pages as seven verses each. It has been removed. Offline text is joined to page metadata by `surah:ayah`, preserving all 6,236 verses across 604 pages. Chapter lists also work offline. Text and licensing provenance are recorded in [data/quran/README.md](../data/quran/README.md).

Further exact line layouts should use [matching Quran Foundation fonts](https://api-docs.quran.com/docs/tutorials/fonts/font-rendering/) and [font/image license guidance](https://api-docs.quran.com/legal/mushaf-fonts-and-images/).
