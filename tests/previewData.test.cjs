const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getQuranPage } = require('../utils/quranData');
const { initialDuaState, duaReducer } = require('../utils/duaState');
const { settingsKey, parseCalendar } = require('../utils/prayerCache');
const chapters = require('../data/quran/quran-en.json');

test('all 6,236 Quran verses appear once across 604 pages, with unaltered Arabic and translation', () => {
  const verses = Array.from({ length: 604 }, (_, i) => {
    const page = getQuranPage(i + 1); assert.ok(page.length); return page;
  }).flat();
  assert.equal(verses.length, 6236); assert.equal(new Set(verses.map(v => v.key)).size, 6236);
  for (const verse of verses) {
    const source = chapters[verse.chapter - 1].verses[verse.id - 1];
    assert.equal(verse.text, source.text); assert.equal(verse.translation, source.translation);
    assert.ok(verse.juz >= 1 && verse.juz <= 30);
  }
});
test('Mushaf references handle variable verse counts and multiple surahs per page', () => {
  assert.deepEqual(getQuranPage(1).map(v => v.key), ['1:1','1:2','1:3','1:4','1:5','1:6','1:7']);
  assert.deepEqual(getQuranPage(2).map(v => v.key), ['2:1','2:2','2:3','2:4','2:5']);
  assert.equal(getQuranPage(604)[0].key, '112:1'); assert.equal(getQuranPage(604).at(-1).key, '114:6');
  assert.equal(getQuranPage(604).length, 15);
});
test('unfavoriting retains custom Duas, notes, and explicitly collected Duas', () => {
  for (const extra of [{ isCustom: true }, { note: 'Keep this note' }, { addedToCollection: true }]) {
    const dua = { id: 'a', title: 'Saved Dua', ...extra };
    const state = { ...initialDuaState, hydrated: true, myDuas: [dua], favorites: { a: true } };
    const next = duaReducer(state, { type: 'favorite', dua });
    assert.equal(next.myDuas.length, 1); assert.equal(next.favorites.a, undefined); assert.equal(state.favorites.a, true);
  }
});
test('favorite toggles never duplicate a Dua or mutate previous state', () => {
  const dua = { id: 'a', title: 'Dua' };
  const first = duaReducer(initialDuaState, { type: 'favorite', dua });
  const second = duaReducer(first, { type: 'favorite', dua });
  assert.equal(first.myDuas.length, 1); assert.equal(second.myDuas.length, 0); assert.equal(initialDuaState.myDuas.length, 0);
});
test('prayer caches cannot mix cities, calculation methods, or madhhabs', () => {
  const a = { city: 'New York', country: 'United States', calculationMethodId: 2, madhhabMethod: 1 };
  assert.equal(settingsKey(a), settingsKey({ ...a, city: '  NEW YORK ' }));
  for (const patch of [{ city: 'Boston' }, { calculationMethodId: 3 }, { madhhabMethod: 2 }]) assert.notEqual(settingsKey(a), settingsKey({ ...a, ...patch }));
});
test('monthly prayer responses keep Gregorian dates and time zones, ignoring malformed days', () => {
  const cache = parseCalendar([{ date: { gregorian: { date: '31-12-2026' } }, timings: { Fajr: '05:11 (EST)', Isha: '20:30' }, meta: { timezone: 'America/New_York' } }, {}]);
  assert.deepEqual(cache, { '2026-12-31': { Fajr: '05:11', Isha: '20:30', _timeZone: 'America/New_York' } });
});
