import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '../utils/prayerNotifications';
import { settingsKey, parseCalendar, prayerRequestParams } from '../utils/prayerCache';
import { withTimeout } from '../utils/withTimeout';

const cacheKey = settings => `prayerTimesCache:v2:${settingsKey(settings)}`;
export async function readPrayerCache(settings) {
  try { return JSON.parse(await AsyncStorage.getItem(cacheKey(settings)) || '{}'); }
  catch { return {}; }
}

export async function fetchPrayerDays(settings, { onUpdate } = {}) {
  const { latitude, longitude, city, country } = settings;
  const byCity = Boolean(city?.trim() && country?.trim());
  if (!byCity && (latitude == null || longitude == null || latitude === '' || longitude === '' || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180)) {
    throw new Error('Choose a location to load prayer times.');
  }
  const cached = await readPrayerCache(settings);
  const now = new Date();
  // Monthly requests cover a long offline schedule. Adjacent months handle time-zone boundaries.
  const progressive = { ...cached };
  const responses = await Promise.allSettled([0, 1, -1].map(async offset => {
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const response = await withTimeout(axios.get(`https://api.aladhan.com/v1/${byCity ? 'calendarByCity' : 'calendar'}/${month.getFullYear()}/${month.getMonth() + 1}`, {
      params: { ...(byCity ? { city, country } : { latitude, longitude }), ...prayerRequestParams(settings) },
      timeout: 15000,
    }), 16000, 'Prayer times request timed out. Please retry.');
    const days = parseCalendar(response.data?.data);
    if (!Object.keys(days).length) throw new Error('Prayer calendar is unavailable.');
    Object.assign(progressive, days);
    if (progressive[dateKey(now, Object.values(days)[0]?._timeZone)]) onUpdate?.({ ...progressive });
    return days;
  }));
  const fresh = Object.assign({}, ...responses.filter(r => r.status === 'fulfilled').map(r => r.value));
  const merged = { ...cached, ...fresh };
  const today = dateKey(now, Object.values(merged)[0]?._timeZone);
  if (!merged[today]) throw new Error('Unable to load today’s prayers. Check your connection or choose a location in Settings.');
  if (!fresh[today]) throw new Error('Could not refresh today’s prayers. Saved times are still available.');
  await AsyncStorage.setItem(cacheKey(settings), JSON.stringify(merged));
  return merged;
}
