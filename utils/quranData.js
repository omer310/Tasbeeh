const chapters = require('../data/quran/quran-en.json');
const metadata = require('../data/quran/page-map.json');
const pages = {};
const surahs = {};
for (const chapter of chapters) {
  for (const verse of chapter.verses) {
    const key = `${chapter.id}:${verse.id}`;
    const [page, juz] = metadata[key];
    const item = { ...verse, key, chapter: chapter.id, chapterName: chapter.name, page, juz };
    (pages[page] ||= []).push(item);
    (surahs[chapter.id] ||= []).push(item);
  }
}
function getQuranPage(page) { return pages[page] || []; }
function getQuranChapter(chapter) { return surahs[chapter] || []; }
module.exports = { getQuranPage, getQuranChapter };
