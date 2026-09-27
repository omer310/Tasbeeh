const chapters = require('../data/quran/chapters.json');
const duriCounts = require('../data/quran/duri-counts.json');
const { riwayahFor } = require('./quranReaderText');
const { juzStarts, juzForNativeVerse } = require('./quranNavigation');
const bounded = (value, maximum) => Math.max(1, Math.min(maximum, Math.round(Number(value) || 1)));
const ayahCount = (chapter, reader) => riwayahFor(reader) === 'duri' ? duriCounts[chapter - 1] : chapters[chapter - 1].verses_count;
function pickerSelection(key, reader) {
  const [c, a] = String(key || '1:1').split(':');
  const chapter = bounded(c, 114), ayah = bounded(a, ayahCount(chapter, reader));
  const nativeKey = `${chapter}:${ayah}`;
  return { chapter, ayah, juz: juzForNativeVerse(nativeKey, reader), key: nativeKey };
}
function choosePickerValue(selection, column, value, reader) {
  if (column === 'juz') return pickerSelection(juzStarts(reader)[bounded(value, 30) - 1].key, reader);
  if (column === 'surah') return pickerSelection(`${bounded(value, 114)}:1`, reader);
  return pickerSelection(`${selection.chapter}:${value}`, reader);
}
module.exports = { ayahCount, pickerSelection, choosePickerValue };
