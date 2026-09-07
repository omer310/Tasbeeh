const chapters = require('../data/quran/quran-en.json');
const metadata = require('../data/quran/page-map.json');
const pages = {};
for (const chapter of chapters) {
  for (const verse of chapter.verses) {
    const key = `${chapter.id}:${verse.id}`;
    const [page, juz] = metadata[key];
    (pages[page] ||= []).push({ ...verse, key, chapter: chapter.id, chapterName: chapter.name, page, juz });
  }
}
function getQuranPage(page) { return pages[page] || []; }
module.exports = { getQuranPage };
