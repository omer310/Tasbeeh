/* global __dirname */
// Rebuild only when the bundled Quran text metadata changes. No network access.
const fs = require('node:fs');
const path = require('node:path');
const { getReaderChapter, canonicalReference } = require('../utils/quranReaderText');
const { printedPageForAyah } = require('../utils/printedMushaf');
const catalog = {};
// DouriData's jozz changes early on these shared pages. Use the actual
// division at Ya'tadhirun (9:95, next printed page) and Surah Al-Ahqaf.
// See docs/QURAN_NAVIGATION.md for the source comparison.
const duriStarts = { 11: '9:95', 26: '46:1' };
for (const reader of ['hafs', 'duri']) {
  const starts = new Map();
  for (let chapter = 1; chapter <= 114; chapter++) {
    for (const verse of getReaderChapter(chapter, reader)) {
      if (reader === 'duri' && duriStarts[verse.juz] && verse.key !== duriStarts[verse.juz]) continue;
      if (!starts.has(verse.juz)) starts.set(verse.juz, {
        juz: verse.juz, key: verse.key, chapter, canonicalKey: canonicalReference(verse.key, reader),
        page: verse.page, printedPage: printedPageForAyah(verse.key, reader),
      });
    }
  }
  if (starts.size !== 30 || [...starts.values()].some(item => !item.printedPage)) throw new Error(`Incomplete ${reader} Juz metadata`);
  catalog[reader] = [...starts.values()];
}
fs.writeFileSync(path.resolve(__dirname, '../data/quran/juz-starts.json'), JSON.stringify(catalog, null, 2) + '\n');
