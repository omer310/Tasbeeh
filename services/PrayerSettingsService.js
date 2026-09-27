import AsyncStorage from '@react-native-async-storage/async-storage';
import { readPrayerCache, fetchPrayerDays } from './PrayerTimesService';
import { dateKey } from '../utils/prayerNotifications';
import { loadNotificationPreferences, schedulePrayerNotifications, requestNotificationPermissions } from './NotificationService';
import { createLatestTask } from '../utils/latestTask';
import { validatePrayerSettings } from '../utils/prayerSettings';
import { settingsKey } from '../utils/prayerCache';
import { publishPrayerWidgetData } from '../utils/prayerWidgetEvents';

export async function savePrayerTimeSettings(input, previous = {}) {
  const settings = validatePrayerSettings(input);
  const changed = settingsKey(settings) !== settingsKey(previous);
  // Fetch before committing: a failed location/method must leave the previous
  // settings and working alarm schedule intact. Display-only edits work offline.
  const cache = changed ? await fetchPrayerDays(settings) : null;
  await AsyncStorage.multiSet([
    ['prayerTimeSettings', JSON.stringify(settings)], ['location', settings.location || ''],
    ['latitude', settings.latitude == null ? '' : String(settings.latitude)],
    ['longitude', settings.longitude == null ? '' : String(settings.longitude)],
  ]);
  let alertError = null;
  // Publish after the settings commit so a rejected location never replaces widgets.
  // Display-only edits use the existing cache and never require a network request.
  try { publishPrayerWidgetData(settings, cache || await readPrayerCache(settings)); }
  catch (error) { console.warn('Prayer widget refresh:', error); }
  if (changed) {
    try {
      const { preferences, reminders, enabled } = await loadNotificationPreferences();
      const times = cache[dateKey(new Date(), Object.values(cache)[0]?._timeZone)];
      await schedulePrayerNotifications(times, preferences, enabled, reminders, cache);
    } catch (error) { alertError = error.message || 'Could not update prayer alerts.'; }
  }
  return { settings, cache, alertError };
}

const refreshLatest = createLatestTask(() => refreshSavedPrayerAlerts());
let preferenceWrites = Promise.resolve();
export function savePrayerPreference(prayer, preference, reminder) {
  // Persist all prayers in order; coalesce only the expensive schedule refresh.
  const write = preferenceWrites.catch(() => {}).then(() => AsyncStorage.multiSet([
    [`adhan_preference_${prayer}`, preference], [`reminder_preference_${prayer}`, reminder],
  ]));
  preferenceWrites = write;
  return write.then(() => refreshLatest());
}

export function savePrayerAlertsEnabled(enabled) {
  const write = preferenceWrites.catch(() => {}).then(() => AsyncStorage.setItem('playAdhan', JSON.stringify(enabled)));
  preferenceWrites = write;
  return write.then(async () => {
    if (enabled) await requestNotificationPermissions();
    return refreshLatest();
  });
}

export async function refreshSavedPrayerAlerts() {
  const { preferences, reminders, enabled } = await loadNotificationPreferences();
  // Turning alerts off must work offline, even when today's cache is absent.
  if (!enabled) return schedulePrayerNotifications(null, preferences, false, reminders, {});
  const settings = JSON.parse(await AsyncStorage.getItem('prayerTimeSettings') || '{}');
  let cache = await readPrayerCache(settings);
  if (!cache[dateKey(new Date(), Object.values(cache)[0]?._timeZone)]) cache = await fetchPrayerDays(settings);
  const times = cache[dateKey(new Date(), Object.values(cache)[0]?._timeZone)];
  return schedulePrayerNotifications(times, preferences, enabled, reminders, cache);
}
