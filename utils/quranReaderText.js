const { getQuranChapter } = require('./quranData');
const duriText = require('./duriTextCatalog');
const { readingTokens } = require('./quranAudio');
const cache = new Map();
const riwayahFor = reader => reader === 'noreen' || reader === 'duri' ? 'duri' : 'hafs';
function getReaderChapter(chapter, reader = 'hafs') {
  if (riwayahFor(reader) === 'hafs') return getQuranChapter(chapter);
  if (!cache.has(chapter)) {
    const original = getQuranChapter(chapter);
    cache.set(chapter, duriText(chapter).map(([text, marker, sourcePage, juz, routes], index) => {
      const sourceKey = routes[0][2][0][0];
      return { id: index + 1, key: `${chapter}:${index + 1}`, chapter, chapterName: original[0]?.chapterName,
        text, marker, sourcePage, juz, routes, page: original[Number(sourceKey.split(':')[1]) - 1].page };
    }));
  }
  return cache.get(chapter) || [];
}
function canonicalReference(key, reader) {
  if (riwayahFor(reader) === 'hafs') return key;
  return getReaderChapter(Number(key.split(':')[0]), reader).find(v => v.key === key)?.routes[0][2][0][0] || key;
}
function readerReference(key, reader) {
  if (riwayahFor(reader) === 'hafs') return key;
  const verses = getReaderChapter(Number(key.split(':')[0]), reader);
  return verses.find(v => v.routes.some(([, , sources]) => sources.some(([source]) => source === key)))?.key || verses[0]?.key;
}
function verseWords(verse) {
  return verse.routes ? verse.routes.map(([from, to]) => ({ from, to, text: verse.text.slice(from, to), word: from })) : readingTokens(verse.text).filter(w => w.word !== null);
}
module.exports = { getReaderChapter, canonicalReference, readerReference, riwayahFor, verseWords };
