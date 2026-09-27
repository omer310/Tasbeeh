# Domain

Terms used in requirements and the app. See [SYSTEM](SYSTEM.md), [DECISIONS](DECISIONS.md), [CHANGELOG](CHANGELOG.md), and [ROADMAP](ROADMAP.md).

## Domain map

- **Product:** A Muslim daily companion for prayer times, Quran, remembrance, supplications, Qibla, Hadith and the Islamic calendar.
- **Primary actor:** The person reading or practicing through the app.
- **Core workflow:** Locate today's prayers, read or remember, save a place or Dua, receive configured prayer alerts.
- **Data conventions:** Prayer calculations and Hijri conversion use AlAdhan; local moon sighting can differ from calculated calendar dates.

## Core vocabulary

### Tafsir

**Meaning:** Scholarly explanation of Quranic verses, distinct from a translation of their meanings.
**Origin:** Established Quran-study terminology; this app offers published works from [Quran.com's Tafsir catalogue](https://api.quran.com/api/v4/resources/tafsirs?language=en).
**Why it matters:** Display the chosen author/language and matching passage, preserve source wording, and account for Hafs/Duri numbering differences. See [Tafsir behavior](QURAN_TAFSIR.md).

### Adhan / Azan

**Meaning:** The call to prayer; both spellings appear in the product.
**Origin:** Established Islamic terminology.
**Why it matters:** Android scheduled Adhan means the full selected recording, not merely a short notification clip. Preview playback and scheduled delivery have separate lifecycles.

### Mushaf

**Meaning:** The Quran in its familiar printed-page layout.
**Origin:** Established Islamic terminology; the app uses 604 published vector pages for each of Hafs and Duri.
**Why it matters:** The printed appearance requires publisher calligraphy and fixed line breaks. The selected vector source provides ayah regions. Hold a printed ayah to choose a word inside its listening panel; direct word holding/highlighting remains in text layouts. Printed Duri and Unicode Duri can also use different verse boundaries; their identifiers are explicitly bridged.

### Juz / Ajza

**Meaning:** One of the Quran's thirty reading divisions; Ajza is the plural.
**Origin:** Established Quran-reading terminology; Omar requested direct Juz navigation in addition to Surahs.
**Why it matters:** Section starts must resolve to the selected reading's actual passage. Ayah numbering and some division boundaries differ between Hafs and Duri; page-level labels can begin before a division on a shared page. See [navigation sources and corrections](QURAN_NAVIGATION.md).

### Dhikr / Tasbih

**Meaning:** Remembrance, with Tasbih used here for the counter supporting repeated dhikr.
**Origin:** Established Islamic terminology.
**Why it matters:** Each dhikr has its own count and optional goal. Collections move through an ordered sequence with a target for each entry.

### Tasbih collection / round

**Meaning:** A collection is a saved ordered selection of Adhkar and target counts. A round is one person's progress through that collection, which can be paused and resumed.
**Origin:** Omar's September 7 request for custom collections such as After Prayer and Morning Dhikr.
**Why it matters:** Round progress is separate from each dhikr's standalone counter. Targets are user-customizable; a custom collection is not presented as an authoritative prescribed sequence. The short Morning preset is distinct from the complete timed morning Athkar in Duas. See [SYSTEM](SYSTEM.md).

### Dua

**Meaning:** A supplication, organized by occasion in this app.
**Origin:** Established Islamic terminology.
**Why it matters:** Everyday shortcuts open existing Hisn occasions in one tap. Broad categories expose named, searchable occasions and a continuous reading option. Shortcut labels do not rewrite religious content or introduce new repetition counts. Saving and optional personal notes should not interrupt reading.

### Hisn al-Muslim / timed Athkar

**Meaning:** Hisn al-Muslim is the source collection of invocations used for the Dua catalogue. Athkar is the plural of dhikr; morning and evening are separate reading sequences here.
**Origin:** Established Islamic terminology and the user's September 7 requirements. See [content sources](HISN_CONTENT.md).
**Why it matters:** Source repetition counts belong to each invocation. The app saves morning/evening progress separately for the local day; these are reading routines, not new notification schedules.

### Silent / Vibrate / None

**Meaning:** Silent displays a notification without sound or vibration; Vibrate requests vibration without sound; None disables that prayer's main alert.
**Origin:** Product choices defined in the prayer preferences.
**Why it matters:** They must remain distinct; a separately selected advance reminder can still be enabled.

### Ayah playback / word highlighting

**Meaning:** A chosen reciter plays from the selected ayah to the end of the Surah, or just that ayah when explicitly selected, while the active word or source-defined word group is highlighted in the text.
**Origin:** Omar's September 10 request for his father.
**Why it matters:** A short text tap must not select or play. Holding selects a word and opens explicit word-only, ayah-only and continuous listening actions. Recovering an ayah playback boundary does not establish precise word timestamps. Highlights require timestamps for that exact recording and compatible word boundaries; dividing audio duration by word count is not acceptable.

### Duri / Hafs

**Meaning:** Names of Quranic transmission traditions. Noreen uses Duri an Abu Amr; the six other readers use Hafs. Displayed text matches the selected transmission.
**Origin:** The recitation catalog and Omar's explicit Noreen request.
**Why it matters:** Wording and ayah boundaries differ. The chosen Unicode Duri source has 6,217 ayahs, the printed Duri edition has 6,218, and source audio metadata uses 6,236 canonical references. Printed Al-Mulk 9–10 form Unicode ayah 9. Word routes bridge those numbering systems without relabeling Hafs text. See [audio sources and limits](QURAN_AUDIO.md).
