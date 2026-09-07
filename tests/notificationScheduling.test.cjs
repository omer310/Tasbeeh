const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const { createRequire } = require('node:module');
const path = require('node:path');
function load(file, mocks) {
  const filename = path.resolve(__dirname, '..', file);
  const localRequire = createRequire(filename);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => mocks[name] || localRequire(name), console, Date, setTimeout, clearTimeout }, { filename });
  return module.exports;
}
function notificationService(platform, failure = false) {
  const cancelled = [], scheduled = [];
  const notifications = {
    setNotificationHandler() {}, getPermissionsAsync: async () => ({ granted: true }),
    getAllScheduledNotificationsAsync: async () => [{ identifier: 'working-old-schedule' }],
    setNotificationChannelAsync: async () => {}, AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { DATE: 'date' },
    cancelScheduledNotificationAsync: async id => cancelled.push(id), cancelAllScheduledNotificationsAsync: async () => cancelled.push('all'),
    scheduleNotificationAsync: async request => { if (failure && scheduled.length) throw Error('Storage full'); scheduled.push(request); return `new-${scheduled.length}`; },
  };
  const native = { replaceSchedule: async json => { if (failure) throw Error('Exact alarms disabled'); scheduled.push(JSON.parse(json)); return JSON.parse(json).length; } };
  return { cancelled, scheduled, service: load('services/NotificationService.js', {
    'expo-notifications': notifications, 'expo-background-task': {}, 'expo-task-manager': { defineTask() {} },
    '@react-native-async-storage/async-storage': {}, 'react-native': { Platform: { OS: platform } },
    './PrayerTimesService': {}, './AndroidPrayerAlarm': { androidPrayerAlarm: native, nativeAlarm: item => ({ at: item.date.getTime(), preference: item.preference }), getAndroidAlarmStatus() {} },
  }) };
}
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const key = require('../utils/prayerNotifications').dateKey(tomorrow);
const times = { Fajr: '05:11', Dhuhr: '12:54', Isha: '20:30' };
test('Android alarm permission failure leaves the previous Expo schedule intact', async () => {
  const { service, cancelled } = notificationService('android', true);
  await assert.rejects(service.schedulePrayerNotifications(times, {}, true, {}, { [key]: times }), /Exact alarms disabled/);
  assert.deepEqual(cancelled, []);
});
test('successful Android migration removes the previous schedule only after native storage succeeds', async () => {
  const { service, cancelled, scheduled } = notificationService('android');
  await service.schedulePrayerNotifications(times, { Fajr: 'Adhan (Makka)' }, true, {}, { [key]: times });
  assert.equal(scheduled[0][0].preference, 'Adhan (Makka)'); assert.deepEqual(cancelled, ['working-old-schedule']);
});
test('partial iOS scheduling failure rolls back new notifications and retains the working schedule', async () => {
  const { service, cancelled } = notificationService('ios', true);
  await assert.rejects(service.schedulePrayerNotifications(times, {}, true, {}, { [key]: times }), /Storage full/);
  assert.deepEqual(cancelled, ['new-1']);
});
test('a failed adjacent-month request does not prevent today’s prayer times loading', async () => {
  const now = new Date(); const dd = String(now.getDate()).padStart(2,'0'); const mm = String(now.getMonth()+1).padStart(2,'0');
  const storage = new Map();
  const service = load('services/PrayerTimesService.js', {
    axios: { get: async url => { if (!url.endsWith(`/${now.getFullYear()}/${now.getMonth()+1}`)) throw Error('Temporary network failure'); return { data: { data: [{ date: { gregorian: { date: `${dd}-${mm}-${now.getFullYear()}` } }, timings: times }] } }; } },
    '@react-native-async-storage/async-storage': { getItem: async key => storage.get(key), setItem: async (key, value) => storage.set(key, value) },
  });
  const result = await service.fetchPrayerDays({ city: 'New York', country: 'United States' });
  assert.equal(result[`${now.getFullYear()}-${mm}-${dd}`].Fajr, '05:11'); assert.equal(storage.size, 1);
});
