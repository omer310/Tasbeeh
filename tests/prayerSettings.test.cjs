/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createRequire } = require('node:module');
const { validatePrayerSettings, formatPrayerTime, regionalMethod } = require('../utils/prayerSettings');
const { prayerRequestParams, settingsKey } = require('../utils/prayerCache');
const { dateKey } = require('../utils/prayerNotifications');
const { onPrayerWidgetData } = require('../utils/prayerWidgetEvents');
const base = { city: 'New York', country: 'US', autoDetectLocation: false, calculationMethodId: 2 };
function service(overrides = {}) {
  const filename = path.resolve(__dirname, '../services/PrayerSettingsService.js'), local = createRequire(filename);
  const calls = [], stored = new Map([['prayerTimeSettings', JSON.stringify(base)]]);
  const cache = { [dateKey(new Date(), 'UTC')]: { Fajr: '05:30', Isha: '20:00', _timeZone: 'UTC' } };
  const mocks = {
    '@react-native-async-storage/async-storage': { multiSet: async values => { calls.push('save'); if (overrides.storageError) throw new Error('storage failed'); values.forEach(([k, v]) => stored.set(k, v)); } },
    './PrayerTimesService': { readPrayerCache: async () => cache, fetchPrayerDays: async settings => { calls.push('fetch'); overrides.fetched?.(settings); if (overrides.fetchError) throw new Error('offline'); return cache; } },
    './NotificationService': { loadNotificationPreferences: async () => ({ preferences: { Fajr: 'Vibrate' }, reminders: {}, enabled: true }), schedulePrayerNotifications: async (...args) => { calls.push('schedule'); overrides.scheduled?.(...args); if (overrides.alertError) throw new Error('alerts failed'); } },
  };
  const code = require('@babel/core').transformSync(fs.readFileSync(filename, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => mocks[name] || local(name), Date, console }, { filename });
  return { ...module.exports, calls, stored, cache };
}
test('location, custom-angle and minute inputs are validated before saving', () => {
  const value = validatePrayerSettings({ ...base, city: '  Khartoum ', country: ' Sudan ', calculationMethodId: 99, fajrAngle: '١٨٫٥', ishaAngle: '۱۷' });
  assert.equal(value.location, 'Khartoum, Sudan'); assert.equal(value.fajrAngle, 18.5); assert.equal(value.ishaAngle, 17);
  assert.equal(validatePrayerSettings({ city: 'Paris', country: 'France' }).autoDetectLocation, false);
  for (const patch of [{ city: '' }, { autoDetectLocation: true, latitude: '', longitude: '' }, { autoDetectLocation: true, latitude: 100, longitude: 0 }, { calculationMethodId: 99, fajrAngle: 0, ishaAngle: 17 }, { calculationMethodId: 99, fajrAngle: '18x', ishaAngle: 17 }, { prayerAdjustments: { Fajr: 31 } }, { prayerAdjustments: { Fajr: 1.5 } }]) assert.throws(() => validatePrayerSettings({ ...base, ...patch }));
  assert.equal(validatePrayerSettings({ autoDetectLocation: true, latitude: 0, longitude: 0 }).latitude, 0);
});
test('method zero, country suggestions and all timing controls reach the API and cache identity', () => {
  const settings = validatePrayerSettings({ ...base, calculationMethodId: 0, madhhabMethod: 2, adjustmentMethod: 2, prayerAdjustments: { Fajr: 2, Sunrise: 1, Dhuhr: -1, Asr: 4, Maghrib: 3, Isha: 5 } });
  assert.deepEqual(prayerRequestParams(settings), { method: 0, school: 1, latitudeAdjustmentMethod: 1, tune: '0,2,1,-1,4,3,0,5,0' });
  assert.notEqual(settingsKey(settings), settingsKey({ ...settings, prayerAdjustments: {} }));
  assert.equal(settingsKey(base), settingsKey({ ...base, prayerAdjustments: { Fajr: 0 }, showImsak: true, timeFormat: '24' }));
  assert.equal(regionalMethod('sd'), 5);
  assert.equal(validatePrayerSettings({ ...base, automaticSettings: true, countryCode: 'SD' }).calculationMethodId, 5);
  assert.equal(validatePrayerSettings({ ...base, automaticSettings: false, countryCode: 'SD' }).calculationMethodId, 2);
});
test('12/24-hour display handles midnight, noon, API suffixes and Arabic numerals', () => {
  assert.equal(formatPrayerTime('00:05'), '12:05 AM'); assert.equal(formatPrayerTime('12:00'), '12:00 PM');
  assert.equal(formatPrayerTime('20:15 (EDT)', '24'), '20:15');
  assert.equal(formatPrayerTime('20:15', '12', 'ar'), '٨:١٥ م');
  assert.equal(formatPrayerTime(null), '—');
});
test('failed replacement fetch preserves the old settings and alert schedule', async () => {
  const s = service({ fetchError: true });
  await assert.rejects(s.savePrayerTimeSettings({ ...base, calculationMethodId: 5 }, base), /offline/);
  assert.deepEqual(s.calls, ['fetch']); assert.equal(s.stored.get('prayerTimeSettings'), JSON.stringify(base));
});
test('saving changed times fetches first, then persists, then schedules the matching cache', async () => {
  let scheduled;
  const s = service({ scheduled: (...args) => { scheduled = args; } });
  const result = await s.savePrayerTimeSettings({ ...base, prayerAdjustments: { Fajr: 2 } }, base);
  assert.deepEqual(s.calls, ['fetch', 'save', 'schedule']);
  assert.equal(scheduled[0], Object.values(s.cache)[0]); assert.equal(scheduled[4], s.cache);
  assert.equal(scheduled[1].Fajr, 'Vibrate'); assert.equal(result.alertError, null);
  assert.equal(JSON.parse(s.stored.get('prayerTimeSettings')).prayerAdjustments.Fajr, 2);
});
test('presentation-only saves work offline without replacing alerts', async () => {
  const s = service({ fetchError: true });
  const result = await s.savePrayerTimeSettings({ ...base, showImsak: true, timeFormat: '24' }, base);
  assert.deepEqual(s.calls, ['save']); assert.equal(result.cache, null);
  assert.equal(JSON.parse(s.stored.get('prayerTimeSettings')).timeFormat, '24');
});
test('storage failure prevents scheduling and alert failure is returned with saved times', async () => {
  const fail = service({ storageError: true });
  await assert.rejects(fail.savePrayerTimeSettings({ ...base, calculationMethodId: 5 }, base), /storage failed/);
  assert.deepEqual(fail.calls, ['fetch', 'save']);
  const alerts = service({ alertError: true });
  const result = await alerts.savePrayerTimeSettings({ ...base, calculationMethodId: 5 }, base);
  assert.equal(result.alertError, 'alerts failed'); assert.equal(result.cache, alerts.cache);
  assert.equal(JSON.parse(alerts.stored.get('prayerTimeSettings')).calculationMethodId, 5);
});

test('widgets receive committed location and display edits, never failed settings', async () => {
  const updates = [];
  const stop = onPrayerWidgetData(value => updates.push(value));
  try {
    const failed = service({ fetchError: true });
    await assert.rejects(failed.savePrayerTimeSettings({ ...base, calculationMethodId: 5 }, base));
    const storage = service({ storageError: true });
    await assert.rejects(storage.savePrayerTimeSettings({ ...base, timeFormat: '24' }, base));
    assert.equal(updates.length, 0);
    const saved = service();
    await saved.savePrayerTimeSettings({ ...base, timeFormat: '24' }, base);
    assert.equal(updates[0].settings.timeFormat, '24'); assert.equal(updates[0].days, saved.cache);
    await saved.savePrayerTimeSettings({ ...base, calculationMethodId: 5 }, base);
    assert.equal(updates[1].settings.calculationMethodId, 5); assert.equal(updates[1].days, saved.cache);
  } finally { stop(); }
});
