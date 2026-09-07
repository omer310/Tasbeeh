import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '../utils/prayerNotifications';
import { settingsKey, parseCalendar } from '../utils/prayerCache';

const cacheKey = settings => `prayerTimesCache:v2:${settingsKey(settings)}`;
export async function readPrayerCache(settings) {
  try { return JSON.parse(await AsyncStorage.getItem(cacheKey(settings)) || '{}'); }
  catch { return {}; }
}

export async function fetchPrayerDays(settings) {
  const { latitude, longitude, city, country, calculationMethodId = 2 } = settings;
  const byCity = Boolean(city?.trim() && country?.trim());
  if (!byCity && (latitude == null || longitude == null || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)))) {
    throw new Error('Choose a location to load prayer times.');
  }
  const cached = await readPrayerCache(settings);
  const now = new Date();
  // Monthly requests cover a long offline schedule. Adjacent months handle time-zone boundaries.
  const responses = await Promise.allSettled([-1, 0, 1].map(async offset => {
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const response = await axios.get(`https://api.aladhan.com/v1/${byCity ? 'calendarByCity' : 'calendar'}/${month.getFullYear()}/${month.getMonth() + 1}`, {
      params: { ...(byCity ? { city, country } : { latitude, longitude }), method: calculationMethodId, school: Number(settings.madhhabMethod) === 2 ? 1 : 0 },
      timeout: 15000,
    });
    const days = parseCalendar(response.data?.data);
    if (!Object.keys(days).length) throw new Error('Prayer calendar is unavailable.');
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
