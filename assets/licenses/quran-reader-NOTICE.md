# Quran reader data attribution

- Duri Arabic text/medallions: King Fahd Glorious Quran Printing Complex, DouriData v2.0, mirrored by Quran Center / quran-meta at revision a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9. https://github.com/quran-center/quran-meta
- Duri font: KFGQPC, distributed unchanged from QUL: https://qul.tarteel.ai/resources/font/qpc-douri-font . The complete embedded EULA accompanies the font in quran-duri-font-LICENSE.txt. Font software is not relicensed under the Quran Center MIT license.
- Hafs text: existing Risan Bagja Pradana Quran JSON (CC BY-SA 4.0), https://github.com/risan/quran-json . Text is unchanged.
- Page/line membership: factual positions derived from zonetecde/mushaf-layout at 72116ce4d405d67823804f0eed795c1e6409b4af, https://github.com/zonetecde/mushaf-layout . Its QPC glyph strings and implementation are not used; this app renders its own source texts and font advances.
- Hafs font: existing Amiri by the Amiri Project Authors, SIL Open Font License 1.1.

Changes: split source Duri verse bodies from their original medallions; align word reference ranges without changing Arabic; derive adapted page rows and font advances; project original Noreen audio timestamps onto native Duri references. Duri pages retain the app's 604-page convention and are labeled adapted, not a publisher facsimile. The source JSON and font hashes and reproduction scripts are recorded in docs/QURAN_AUDIO.md. Audio licenses remain separate.
