const { test } = require('node:test');
const assert = require('node:assert/strict');
const { swipePage } = require('../utils/readerNavigation');
const { locationLabel } = require('../utils/locationLabel');
const { calendarWeekday, shiftCalendarMonth } = require('../utils/calendarDates');
const { mergeHadiths, searchHadiths } = require('../utils/hadithSearch');

test('Quran swipes follow right-next, left-previous and respect book boundaries', () => {
  assert.equal(swipePage(5, 110), 6); assert.equal(swipePage(5, -110), 4);
  assert.equal(swipePage(1, -100), 1); assert.equal(swipePage(604, 100), 604);
  assert.equal(swipePage(4, 20), 4);
});
test('location labels use a district and city without repeating names', () => {
  assert.equal(locationLabel({ district: 'Brooklyn', city: 'New York', region: 'New York' }), 'Brooklyn, New York');
  assert.equal(locationLabel({ city: 'New York', region: 'New York' }), 'New York');
  assert.equal(locationLabel(null), '');
});
test('Calendar reads AlAdhan day-month-year and moves past month-end safely', () => {
  assert.equal(calendarWeekday('01-09-2026'), 2);
  const date = shiftCalendarMonth(new Date(2026, 0, 31), 1);
  assert.equal(date.getMonth(), 1); assert.equal(date.getDate(), 1);
  assert.equal(shiftCalendarMonth(new Date(2026, 0, 1), -1).getFullYear(), 2025);
});
test('Hadith translations join by number, tolerating missing or differently ordered entries', () => {
  const result = mergeHadiths([{ hadithnumber: 1, text: 'first' }, { hadithnumber: 2, text: 'second' }], [{ hadithnumber: '2', text: 'ثاني' }]);
  assert.equal(result[0].araText, ''); assert.equal(result[1].araText, 'ثاني');
});
test('Hadith search treats brackets literally, ignores Arabic marks and ranks exact numbers first', () => {
  const book = [{ hadithnumber: 1, engText: 'mercy [kindness]', araText: 'رَحْمَةٌ' }, { hadithnumber: 2, engText: 'mercy', araText: '' }];
  assert.deepEqual(searchHadiths(book, '['), [book[0]]);
  assert.deepEqual(searchHadiths(book, 'رحمة'), [book[0]]);
  assert.equal(searchHadiths(book, 'mercy 2')[0].hadithnumber, 2);
  assert.deepEqual(searchHadiths(book, '   '), []);
});
