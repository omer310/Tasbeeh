const { test } = require('node:test');
const assert = require('node:assert/strict');
const { juzStarts, verseDestination, pageDestination, currentJuz, validQuranPage } = require('../utils/quranNavigation');
const { getReaderChapter, readerReference, canonicalReference } = require('../utils/quranReaderText');
const { printedPage } = require('../utils/printedMushaf');
test('all 30 Juz starts in both readings lead to a matching native ayah and printed page', () => {
  for (const reader of ['hafs', 'duri']) {
    const starts = juzStarts(reader);
    assert.deepEqual(starts.map(v => v.juz), Array.from({ length: 30 }, (_, i) => i + 1));
    for (const start of starts) {
      assert.ok(getReaderChapter(start.chapter, reader).some(v => v.key === start.key));
      assert.equal(readerReference(start.canonicalKey, reader), start.key);
      assert.equal(currentJuz(start.canonicalKey, reader), start.juz);
      assert.ok(printedPage(start.printedPage, reader).regions.some(region => region[1] === start.key));
      for (const mode of ['mushaf', 'flow', 'verses']) {
        assert.deepEqual(verseDestination(start.key, reader, mode), { chapter: start.chapter, nativeKey: start.key, canonicalKey: start.canonicalKey, page: mode === 'mushaf' ? start.printedPage : start.page });
      }
    }
  }
});
test('Duri preserves its own section starts and fixes coarse shared-page Juz labels', () => {
  const starts = juzStarts('noreen');
  assert.equal(starts[3].key, '3:91'); assert.equal(starts[6].key, '5:85');
  assert.equal(starts[10].key, '9:95'); assert.equal(starts[25].key, '46:1');
  assert.equal(currentJuz(canonicalReference('9:94', 'duri'), 'duri'), 10);
  assert.equal(currentJuz(canonicalReference('45:36', 'duri'), 'duri'), 25);
  assert.equal(starts[6].printedPage, 121); assert.equal(starts[6].page, 122);
});
test('page input accepts Arabic/Persian digits and rejects invalid or fractional pages', () => {
  for (const input of ['١', '۶۰۴', ' 22 ']) assert.equal(validQuranPage(input), true);
  for (const input of ['', '0', '605', '-2', '1.5', 'abc']) {
    assert.equal(validQuranPage(input), false); assert.equal(pageDestination(input, 'hafs', 'mushaf'), null);
  }
  for (const reader of ['hafs', 'duri']) for (const page of [1, 81, 121, 201, 502, 604]) {
    const dest = pageDestination(page, reader, 'mushaf');
    assert.equal(dest.page, page);
    assert.ok(printedPage(page, reader).regions.some(region => region[1] === readerReference(dest.canonicalKey, reader)));
  }
});
test('Surah jumps resolve edition pages rather than treating Hafs pages as Duri pages', () => {
  for (const reader of ['hafs', 'duri']) for (let chapter = 1; chapter <= 114; chapter++) {
    const key = `${chapter}:1`, dest = verseDestination(key, reader, 'mushaf');
    assert.equal(dest.chapter, chapter);
    assert.ok(printedPage(dest.page, reader).regions.some(region => region[1] === key));
  }
});
