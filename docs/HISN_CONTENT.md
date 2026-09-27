# Hisn al-Muslim catalogue

The September 7 source update follows all 132 chapters and 267 entries in the [Hisn al-Muslim developer API](https://www.hisnmuslim.com/api/en/husn_en.json). `data/hisn-catalogue-audit.json` records the chapter/entry reconciliation. Every API entry has a corresponding reading card or group of cards.

Arabic text, repetitions and Arabic references come from [Abdellah Sellam's HisnElMuslim collection](https://github.com/asellam/HisnElMuslim), distributed under MIT. Its 133 categories and 302 cards separate morning from evening and split some combined invocations. The license is retained in `assets/licenses/hisn-el-muslim.txt`. Arabic content is bundled and works offline. Legacy saved Duas remain in the user's saved collection.

English meanings and pronunciation are read from the chapter API when needed and cached locally. A first visit to an uncached chapter needs a connection. Split passages and variants that cannot safely reuse a combined API translation have original English renderings in the local data. These do not receive a made-up transliteration. References and source links are available while reading.

The source API contains unescaped control characters, a missing title quote in chapter 126, and `Text` instead of `ARABIC_TEXT` in chapter 132. The catalogue import accounted for these; the runtime reader handles the malformed English JSON. Arabic remains accessible on network failure, with a retry for meanings.

Morning and evening use separate local-day progress, source repetition targets, a full-width counter and automatic progression. Completing the last repetition advances to the next unfinished card; completing the sequence shows a completion screen. This does not schedule new notifications or enforce a time window.

## Identical wording with different repetition counts

Morning Athkar cards 19 and 20 (`hisn-morning-19` and `hisn-morning-20`) contain the same Arabic tahlil. They map to two separate published entries: [Hisn 92](https://sunnah.com/hisn:92) gives ten repetitions in the morning/evening (also citing a one-repetition narration), while [Hisn 93](https://sunnah.com/hisn:93) gives one hundred in the morning. The latter cites the daily hundred-repetition narration in [Bukhari 6403](https://sunnah.com/bukhari:6403). Their separate cards preserve those source references and targets; the identical wording is not an import duplication. This distinction was checked following Omar's question on 2026-09-23. The evening list has different card 20, so visible card numbers must be interpreted within their collection. No wording, count, card order or saved progress was changed for this clarification.

Everyday shortcuts and the searchable topic/occasion sheet reuse these exact catalogue objects and IDs. They supply shorter English/Arabic navigation labels, not rewritten supplications. The first six shortcuts are visible on Discover; Show all exposes all twelve. Morning/evening progression and personal saved items are unchanged. Searching inside a topic can open a later matching card directly.

This revision is awaiting Omar's app testing. Catalogue reconciliation and source inspection are not a claim of device acceptance. See [ROADMAP](ROADMAP.md).
