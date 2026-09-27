const catalog = require('../data/quran/juz-starts.json');
const { getReaderChapter, riwayahFor, canonicalReference, readerReference } = require('./quranReaderText');
const { firstPrintedReference, printedPageForAyah } = require('./printedMushaf');
const { getQuranPage } = require('./quranData');
const navigationNumber = value => String(value ?? '').replace(/[٠-٩۰-۹]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).trim();
const validQuranPage = value => /^\d+$/.test(navigationNumber(value)) && Number(navigationNumber(value)) >= 1 && Number(navigationNumber(value)) <= 604;
const juzStarts = reader => catalog[riwayahFor(reader)];
function verseDestination(key, reader, mode) {
  const chapter = Number(key.split(':')[0]);
  const verse = getReaderChapter(chapter, reader).find(item => item.key === key);
  if (!verse) return null;
  return { chapter, nativeKey: key, canonicalKey: canonicalReference(key, reader), page: mode === 'mushaf' ? printedPageForAyah(key, reader) : verse.page };
}
function pageDestination(value, reader, mode) {
  if (!validQuranPage(value)) return null;
  const page = Number(navigationNumber(value));
  if (mode === 'mushaf') return { ...verseDestination(firstPrintedReference(page, reader), reader, mode), page };
  const first = getQuranPage(page)[0];
  return verseDestination(readerReference(first.key, reader), reader, mode);
}
function currentJuz(canonicalKey, reader) {
  return juzForNativeVerse(readerReference(canonicalKey, reader), reader);
}
function juzForNativeVerse(nativeKey, reader) {
  const order = key => { const [chapter, ayah] = key.split(':').map(Number); return chapter * 1000 + ayah; };
  const position = order(nativeKey);
  return juzStarts(reader).findLast(item => order(item.key) <= position)?.juz || 1;
}
function resolveReaderPosition(canonicalKey, reader, position) {
  if (position?.reader === riwayahFor(reader) && typeof position.key === 'string' && /^\d+:\d+$/.test(position.key) && Number(position.key.split(':')[0]) >= 1 && Number(position.key.split(':')[0]) <= 114) {
    const verse = getReaderChapter(Number(position.key.split(':')[0]), reader).find(item => item.key === position.key);
    if (verse && canonicalReference(verse.key, reader) === canonicalKey) return verse.key;
  }
  return readerReference(canonicalKey, reader);
}
module.exports = { navigationNumber, validQuranPage, juzStarts, verseDestination, pageDestination, currentJuz, juzForNativeVerse, resolveReaderPosition };
