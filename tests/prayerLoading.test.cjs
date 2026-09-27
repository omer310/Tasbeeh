const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');
const { createRequire } = require('node:module');
const { settingsKey, prayerRequestParams } = require('../utils/prayerCache');
function load(file, mocks) {
  const filename = path.resolve(__dirname, '..', file), localRequire = createRequire(filename);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => mocks[name] || localRequire(name), console, Date, setTimeout, clearTimeout }, { filename });
  return module.exports;
}

test('disabling alerts cancels their schedule offline without loading location or calendars', async () => {
  let cancelled = false;
  const service = load('services/PrayerSettingsService.js', {
    '@react-native-async-storage/async-storage': { getItem: () => { throw new Error('Should not read location'); } },
    './PrayerTimesService': { readPrayerCache: () => { throw new Error('Should not fetch'); } },
    './NotificationService': { loadNotificationPreferences: async () => ({ enabled: false, preferences: {}, reminders: {} }), schedulePrayerNotifications: async (_times, _preferences, enabled) => { cancelled = enabled === false; return []; } },
  });
  await service.refreshSavedPrayerAlerts(); assert.equal(cancelled, true);
});
test('today is published before slow adjacent-month requests finish', async () => {
  const now = new Date(), day = String(now.getDate()).padStart(2, '0'), month = String(now.getMonth() + 1).padStart(2, '0');
  const response = { data: { data: [{ date: { gregorian: { date: `${day}-${month}-${now.getFullYear()}` } }, timings: { Fajr: '05:00', Isha: '20:00' } }] } };
  let finishAdjacent, publish, completed = false;
  const adjacent = new Promise(resolve => { finishAdjacent = resolve; });
  const published = new Promise(resolve => { publish = resolve; });
  const service = load('services/PrayerTimesService.js', {
    axios: { get: url => url.endsWith(`/${now.getFullYear()}/${now.getMonth() + 1}`) ? Promise.resolve(response) : adjacent },
    '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {} },
  });
  const task = service.fetchPrayerDays({ city: 'New York', country: 'US' }, { onUpdate: publish }).then(value => { completed = true; return value; });
  const first = await published;
  assert.equal(first[`${now.getFullYear()}-${month}-${day}`].Fajr, '05:00'); assert.equal(completed, false);
  finishAdjacent(response); await task;
});
test('concurrent location requests share one permission prompt and use a recent fix', async () => {
  let requests = 0, gps = 0;
  const coords = { latitude: 40.7, longitude: -74 };
  const service = load('services/PrayerLocationService.js', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-location': { requestForegroundPermissionsAsync: async () => { requests++; return { status: 'granted' }; }, hasServicesEnabledAsync: async () => true,
      getLastKnownPositionAsync: async () => ({ coords }), getCurrentPositionAsync: async () => { gps++; return { coords }; }, Accuracy: { Balanced: 3 } },
  });
  const first = service.detectPrayerLocation(), second = service.detectPrayerLocation();
  assert.equal(first, second); assert.equal(await first, coords); assert.equal(requests, 1); assert.equal(gps, 0);
});
test('denied location access returns a manual-location recovery message', async () => {
  const service = load('services/PrayerLocationService.js', {
    'react-native': { Platform: { OS: 'android' } }, 'expo-location': { requestForegroundPermissionsAsync: async () => ({ status: 'denied' }) },
  });
  await assert.rejects(service.detectPrayerLocation(), /Choose a city/);
});
test('custom angles and high-latitude rules affect both API parameters and cache identity', () => {
  const base = { city: 'New York', country: 'US', calculationMethodId: 99, fajrAngle: '18', ishaAngle: '17', adjustmentMethod: 2 };
  assert.deepEqual(prayerRequestParams(base), { method: 99, school: 0, latitudeAdjustmentMethod: 1, methodSettings: '18,null,17' });
  assert.notEqual(settingsKey(base), settingsKey({ ...base, fajrAngle: '19' }));
  assert.notEqual(settingsKey(base), settingsKey({ ...base, adjustmentMethod: 3 }));
  assert.notEqual(settingsKey({ latitude: '', longitude: '' }), settingsKey({ latitude: 0, longitude: 0 }));
});
test('blank coordinates are rejected rather than requesting prayers at zero latitude/longitude', async () => {
  let requested = false;
  const service = load('services/PrayerTimesService.js', { axios: { get: () => { requested = true; } }, '@react-native-async-storage/async-storage': {} });
  await assert.rejects(service.fetchPrayerDays({ latitude: '', longitude: '' }), /Choose a location/);
  assert.equal(requested, false);
});
