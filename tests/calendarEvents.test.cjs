const { test } = require('node:test');
const assert = require('node:assert/strict');
const { eventsForDay, upcomingEvents, daysUntil, countdownLabel } = require('../utils/calendarEvents');
process.env.TZ = 'America/New_York';
const row = (date, month, day, year = 1448) => ({ gregorian: { date }, hijri: { month: { number: month }, day: String(day), year: String(year) } });
test('the calendar grid marks named occasions but leaves ordinary days unmarked', () => {
  assert.equal(eventsForDay(row('', 9, 1).hijri)[0].id, 'ramadan');
  assert.equal(eventsForDay(row('', 12, 9).hijri)[0].id, 'arafah');
  assert.equal(eventsForDay(row('', 12, 10).hijri)[0].id, 'adha');
  assert.deepEqual(eventsForDay(row('', 9, 2).hijri), []);
  assert.deepEqual(eventsForDay(undefined), []);
});
test('upcoming counts use the same supplied Hijri conversion as the grid, including today', () => {
  const today = new Date(2026, 8, 19, 23, 59);
  const days = [row('18-09-2026', 9, 1), row('19-09-2026', 10, 1), row('20-09-2026', 12, 9), row('21-09-2026', 12, 10)];
  const result = upcomingEvents([...days, ...days], today);
  assert.deepEqual(result.map(v => [v.id, v.remaining]), [['fitr', 0], ['arafah', 1], ['adha', 2]]);
  const shifted = upcomingEvents([row('22-09-2026', 12, 10)], today);
  assert.equal(shifted[0].remaining, 3);
});
test('civil day countdowns stay correct over DST and year boundaries', () => {
  assert.equal(daysUntil(new Date(2026, 2, 9), new Date(2026, 2, 8, 23)), 1);
  assert.equal(daysUntil(new Date(2026, 10, 2), new Date(2026, 10, 1)), 1);
  assert.equal(daysUntil(new Date(2027, 0, 1), new Date(2026, 11, 31)), 1);
  assert.equal(countdownLabel(0), 'Today'); assert.equal(countdownLabel(1), 'Tomorrow');
  assert.equal(countdownLabel(7), 'In 7 days'); assert.equal(countdownLabel(2, 'ar'), 'بعد يومين');
});
test('recurring events retain separate Hijri years and remain chronologically ordered', () => {
  const result = upcomingEvents([row('02-01-2027', 1, 1, 1449), row('01-01-2026', 1, 1, 1448)], new Date(2026, 0, 1));
  assert.deepEqual(result.map(v => v.key), ['new-year-1448', 'new-year-1449']);
  assert.equal(upcomingEvents([row('01-01-2026', 1, 1)], new Date(2026, 0, 2)).length, 0);
});
