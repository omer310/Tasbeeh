const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateKey, prayerDate, notificationSound, buildPrayerNotifications } = require('../utils/prayerNotifications');

const now = new Date(2026, 8, 7, 12, 0);
const times = { Fajr: '05:30', Dhuhr: '13:00', Asr: '16:00', Maghrib: '19:00', Isha: '20:30' };

test('does not move elapsed prayers to tomorrow using today’s timetable', () => {
  assert.deepEqual(buildPrayerNotifications(times, {}, {}, now).map(n => n.prayer), ['Dhuhr', 'Asr', 'Maghrib', 'Isha']);
});
test('uses tomorrow’s own timetable for tomorrow’s notifications', () => {
  const day = new Date(2026, 8, 8, 12);
  const [notification] = buildPrayerNotifications({ Fajr: '05:31' }, {}, {}, now, day);
  assert.equal(notification.date.getDate(), 8);
  assert.equal(notification.date.getMinutes(), 31);
});
test('None disables an Adhan, while Silent preserves a silent alert', () => {
  const result = buildPrayerNotifications(times, { Dhuhr: 'None', Asr: 'Silent' }, {}, now);
  assert.equal(result.some(n => n.prayer === 'Dhuhr'), false);
  assert.equal(result.find(n => n.prayer === 'Asr').sound, false);
});
test('reminders can be enabled independently of Adhan sound', () => {
  const [result] = buildPrayerNotifications({ Dhuhr: '13:00' }, { Dhuhr: 'None' }, { Dhuhr: '10 minutes before' }, now);
  assert.equal(result.reminder, 10);
  assert.equal(result.date.getHours(), 12);
  assert.equal(result.date.getMinutes(), 50);
});
test('elapsed reminders are skipped without losing the prayer alert', () => {
  const result = buildPrayerNotifications({ Dhuhr: '12:10' }, {}, { Dhuhr: '30 minutes before' }, now);
  assert.equal(result.length, 1);
  assert.equal(result[0].reminder, 0);
});
test('rejects missing, malformed and out-of-range prayer times', () => {
  for (const value of [undefined, '', '25:00', '12:99', 'not a time']) assert.equal(prayerDate(value, now), null);
});
test('accepts API time zone suffix without losing minutes', () => {
  const value = prayerDate('13:02 (EDT)', now);
  assert.equal(value.getHours(), 13);
  assert.equal(value.getMinutes(), 2);
});
test('maps every bundled notification sound consistently', () => {
  assert.equal(notificationSound('Adhan (Nureyn Mohammad)'), 'adhan.wav');
  assert.equal(notificationSound('Adhan (Madina)'), 'madinah_adhan.wav');
  assert.equal(notificationSound('Adhan (Makka)'), 'makkah_adhan.wav');
  assert.equal(notificationSound('Long beep'), 'long_beep.wav');
  assert.equal(notificationSound('Default notification sound'), 'default');
});

test('uses the selected city’s time zone for native notification dates', () => {
  assert.equal(prayerDate('13:00', now, 'America/New_York').toISOString(), '2026-09-07T17:00:00.000Z');
  assert.equal(prayerDate('13:00', now, 'Asia/Dubai').toISOString(), '2026-09-07T09:00:00.000Z');
});
test('handles daylight saving changes without hard-coding UTC offsets', () => {
  const winter = new Date(2026, 0, 15, 12);
  assert.equal(prayerDate('13:00', winter, 'America/New_York').toISOString(), '2026-01-15T18:00:00.000Z');
});
test('selects the correct calendar day across midnight in another city', () => {
  assert.equal(dateKey(new Date('2026-09-07T02:00:00Z'), 'America/New_York'), '2026-09-06');
  assert.equal(dateKey(new Date('2026-09-07T23:00:00Z'), 'Asia/Dubai'), '2026-09-08');
});
