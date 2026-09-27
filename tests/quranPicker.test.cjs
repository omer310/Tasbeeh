const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pickerSelection, choosePickerValue, ayahCount } = require('../utils/quranPicker');
const { juzStarts, verseDestination, resolveReaderPosition } = require('../utils/quranNavigation');
const { readerReference } = require('../utils/quranReaderText');
const { printedPage } = require('../utils/printedMushaf');
const { groupReaderVerses, visibleReaderVerse } = require('../utils/quranReaderScroll');

test('choosing each Juz sets its matching Surah and starting ayah in both readings', () => {
  for (const reader of ['hafs', 'duri']) for (const start of juzStarts(reader)) {
    const next = choosePickerValue(pickerSelection('114:6', reader), 'juz', start.juz, reader);
    assert.deepEqual(next, { key: start.key, juz: start.juz, chapter: start.chapter, ayah: Number(start.key.split(':')[1]) });
  }
});
test('Surah changes reset to its first ayah and expose that reading’s complete ayah range', () => {
  for (const reader of ['hafs', 'duri']) for (let chapter = 1; chapter <= 114; chapter++) {
    const next = choosePickerValue(pickerSelection('2:280', reader), 'surah', chapter, reader);
    assert.equal(next.key, `${chapter}:1`);
    const last = choosePickerValue(next, 'ayah', 999, reader);
    assert.equal(last.ayah, ayahCount(chapter, reader));
    assert.ok(verseDestination(last.key, reader, 'verses'));
  }
  assert.equal(ayahCount(2, 'hafs'), 286); assert.equal(ayahCount(2, 'duri'), 285);
});
test('selecting an ayah across a Juz boundary updates Juz without changing the chosen ayah', () => {
  const before = pickerSelection('2:141', 'hafs');
  assert.equal(before.juz, 1);
  assert.deepEqual(choosePickerValue(before, 'ayah', 142, 'hafs'), { chapter: 2, ayah: 142, key: '2:142', juz: 2 });
  const duri = choosePickerValue(pickerSelection('9:94', 'duri'), 'ayah', 95, 'duri');
  assert.equal(duri.juz, 11); assert.equal(duri.key, '9:95');
});
test('Duri ayahs sharing one canonical reference remain distinct when jumping and restoring', () => {
  for (const key of ['1:6', '1:7']) for (const mode of ['mushaf', 'flow', 'verses']) {
    const destination = verseDestination(key, 'duri', mode);
    assert.equal(destination.canonicalKey, '1:7'); assert.equal(destination.nativeKey, key);
    const stored = JSON.parse(JSON.stringify({ reader: 'duri', key: destination.nativeKey }));
    assert.equal(resolveReaderPosition(destination.canonicalKey, 'duri', stored), key);
    if (mode === 'mushaf') assert.ok(printedPage(destination.page, 'duri').regions.some(region => region[1] === key));
  }
});
test('old preferences and changing readers fall back safely; stale native positions cannot win', () => {
  for (const position of [null, { reader: 'hafs', key: '1:7' }, { reader: 'duri', key: '999:1' }, { reader: 'duri', key: 'bad' }, { reader: 'duri', key: '2:1' }]) {
    assert.equal(resolveReaderPosition('1:7', 'duri', position), readerReference('1:7', 'duri'));
  }
  assert.equal(resolveReaderPosition('1:7', 'hafs', { reader: 'duri', key: '1:6' }), '1:7');
});
test('flow-mode jumps begin a row at the requested ayah without changing or dropping Quran text', () => {
  const { getReaderChapter } = require('../utils/quranReaderText');
  for (const reader of ['hafs', 'duri']) for (const chapter of [1, 2, 67, 114]) {
    const verses = getReaderChapter(chapter, reader), anchor = verses.at(-1).key;
    const rows = groupReaderVerses(verses, 'flow', anchor);
    assert.deepEqual(rows.flat(), verses);
    assert.equal(rows.find(row => row.some(verse => verse.key === anchor))[0].key, anchor);
  }
});
test('short Surahs retain a visible chosen ayah until the reader scrolls or playback follows', () => {
  const visible = [[{ key: '1:6' }], [{ key: '1:7' }]];
  assert.equal(visibleReaderVerse(visible, '1:7', true).key, '1:7');
  assert.equal(visibleReaderVerse(visible, '1:7', false).key, '1:6');
  assert.equal(visibleReaderVerse(visible, '1:1', true).key, '1:6');
});
