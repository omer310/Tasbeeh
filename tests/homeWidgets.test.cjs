/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { prayerWidgetSnapshot, widgetDestination } = require('../utils/homeWidgets');
const { onPrayerWidgetData, publishPrayerWidgetData } = require('../utils/prayerWidgetEvents');
const categories = require('../data/hisnDuas.json');

const day = { Fajr: '05:30', Sunrise: '06:40', Dhuhr: '12:10', Asr: '15:30', Maghrib: '18:00', Isha: '19:30', _timeZone: 'America/New_York' };
test('widget follows the location timezone, exact prayer boundaries and next-day Fajr', () => {
  const cache = { '2026-09-19': day, '2026-09-20': { ...day, Fajr: '05:31' } };
  const snapshot = prayerWidgetSnapshot({ location: 'New York', timeFormat: '24' }, cache, Date.parse('2026-09-19T23:30:00Z'));
  assert.equal(snapshot.entries[0].prayer, 'Fajr');
  assert.equal(snapshot.entries[0].at, Date.parse('2026-09-20T09:31:00Z'));
  assert.equal(snapshot.timeFormat, '24'); assert.equal(snapshot.location, 'New York');
  assert.equal(snapshot.entries.length, 5);
  assert.ok(!snapshot.entries.some(item => item.prayer === 'Sunrise'));
});
test('widget cache expires honestly and ignores invalid times/timezones without inventing a day', () => {
  const now = Date.parse('2026-09-20T04:00:00Z');
  assert.deepEqual(prayerWidgetSnapshot({}, { '2026-09-19': day }, now).entries, []);
  assert.deepEqual(prayerWidgetSnapshot({}, {}, now).entries, []);
  const cache = { '2026-09-20': { ...day, Fajr: '99:99', Isha: null }, '2026-09-21': { ...day, _timeZone: 'Invalid/Zone' }, '2026-09-22': { ...day, _timeZone: null } };
  const snapshot = prayerWidgetSnapshot({}, cache, now);
  assert.deepEqual(snapshot.entries.map(item => item.prayer), ['Dhuhr', 'Asr', 'Maghrib']);
});
test('prayer widget honours DST, calculation offsets already in the cache, and sorted days', () => {
  const snapshot = prayerWidgetSnapshot({}, { '2026-11-02': { ...day, Fajr: '05:40' }, '2026-11-01': { ...day, Fajr: '05:39' } }, Date.parse('2026-11-01T04:00:00Z'));
  assert.equal(snapshot.entries[0].at, Date.parse('2026-11-01T10:39:00Z'));
  assert.equal(snapshot.entries[5].at, Date.parse('2026-11-02T10:40:00Z'));
});
test('Dua links resolve the exact displayed invocation and reject arbitrary destinations', () => {
  assert.deepEqual(widgetDestination('manarat://widget/prayer'), { kind: 'prayer' });
  const link = widgetDestination('manarat://widget/dua/hisn-10/hisn-10-2');
  assert.equal(link.category.id, 'hisn-10'); assert.equal(link.dua.id, 'hisn-10-2');
  assert.equal(widgetDestination('manarat://widget/dua/hisn-10').dua.id, 'hisn-10-1');
  for (const url of [null, 'https://widget/prayer', 'manarat://widget/dua/hisn-10/hisn-11-1', 'manarat://widget/dua/../../x', 'manarat://widget/dua/missing', 'manarat://widget/dua/hisn-10?next=evil']) assert.equal(widgetDestination(url), null);
});
test('dashboard preserves the complete day and sunrise after past prayers leave the next-prayer queue', () => {
  const snapshot = prayerWidgetSnapshot({}, { '2026-09-19': day, '2026-09-20': day }, Date.parse('2026-09-19T17:00:00Z'));
  assert.equal(snapshot.entries[0].prayer, 'Asr');
  assert.deepEqual(snapshot.days[0].prayers.map(item => item.prayer), ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
  assert.equal(snapshot.days[0].sunrise, Date.parse('2026-09-19T10:40:00Z'));
  assert.equal(snapshot.days[0].start, Date.parse('2026-09-19T04:00:00Z'));
  assert.equal(snapshot.days[0].end, snapshot.days[1].start);
  const hijri = require('moment-hijri')('2026-09-19', 'YYYY-MM-DD').locale('en');
  assert.equal(snapshot.days[0].hijri.day, hijri.iDate());
  assert.equal(snapshot.days[0].hijri.month, hijri.format('iMMMM'));
  assert.equal(snapshot.days[0].hijri.year, hijri.iYear());
  assert.ok(snapshot.days[0].hijri.monthAr);
});
test('after Isha today remains visible and tomorrow Fajr never reuses today’s time', () => {
  const snapshot = prayerWidgetSnapshot({}, { '2026-09-19': day, '2026-09-20': { ...day, Fajr: '05:31' } }, Date.parse('2026-09-20T02:00:00Z'));
  assert.equal(snapshot.days[0].date, '2026-09-19');
  assert.equal(snapshot.entries[0].at, snapshot.days[1].prayers[0].at);
  assert.notEqual(snapshot.entries[0].at, snapshot.days[0].prayers[0].at);
  const midnight = prayerWidgetSnapshot({}, { '2026-09-19': day, '2026-09-20': day }, Date.parse('2026-09-20T04:00:00Z'));
  assert.equal(midnight.days.length, 1);
  assert.equal(midnight.days[0].date, '2026-09-20');
});
test('dashboard civil-day bounds handle DST, month rollover and a calculation location ahead of the phone', () => {
  for (const [date, hours] of [['2026-03-08', 23], ['2026-11-01', 25]]) {
    const snapshot = prayerWidgetSnapshot({}, { [date]: day }, Date.parse(`${date}T00:00:00Z`));
    assert.equal((snapshot.days[0].end - snapshot.days[0].start) / 3600000, hours);
  }
  const snapshot = prayerWidgetSnapshot({}, { '2026-10-01': { ...day, _timeZone: 'Asia/Tokyo' } }, Date.parse('2026-09-30T18:00:00Z'));
  assert.equal(snapshot.days[0].start, Date.parse('2026-09-30T15:00:00Z'));
  assert.equal(snapshot.days[0].end, Date.parse('2026-10-01T15:00:00Z'));
});
test('dashboard does not invent missing sunrise, invalid dates or expired schedules', () => {
  const now = Date.parse('2026-09-20T04:00:00Z');
  assert.deepEqual(prayerWidgetSnapshot({}, { '2026-09-19': day }, now).days, []);
  assert.deepEqual(prayerWidgetSnapshot({}, { '2026-02-30': day }, 0).days, []);
  assert.equal(prayerWidgetSnapshot({}, { '2026-09-20': { ...day, Sunrise: '99:00' } }, now).days[0].sunrise, null);
  assert.deepEqual(prayerWidgetSnapshot({}, { '2026-09-20': { ...day, _timeZone: 'Bad/Zone' } }, now).days, []);
});
test('every offline native Dua preserves full source text, variants, counts and references', () => {
  const native = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../modules/home-widgets/android/src/main/assets/widget_duas.json'), 'utf8'));
  assert.equal(native.length, categories.length);
  for (const category of categories) {
    const item = native.find(row => row.id === category.id);
    assert.deepEqual(item.subcategories, category.subcategories);
    for (const dua of item.subcategories) assert.equal(widgetDestination(`manarat://widget/dua/${item.id}/${dua.id}`).dua, category.subcategories.find(row => row.id === dua.id));
  }
});
test('prayer data publishers release listeners and deliver accepted settings with their cache', () => {
  const events = [], settings = { location: 'Khartoum' }, days = { '2026-09-19': day };
  const stop = onPrayerWidgetData(value => events.push(value));
  publishPrayerWidgetData(settings, days); stop(); publishPrayerWidgetData({}, {});
  assert.deepEqual(events, [{ settings, days }]);
});
