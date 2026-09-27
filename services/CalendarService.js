import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment-hijri';

const monthsAr = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const memory = new Map(), pending = new Map();
export const calendarKey = date => `${date.getFullYear()}-${date.getMonth() + 1}`;
export function calendarMonth(date) {
  const key = calendarKey(date);
  if (memory.has(key)) return memory.get(key).days;
  const year = date.getFullYear(), month = date.getMonth();
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
    const day = new Date(year, month, i + 1, 12), hijri = moment(day).locale('en');
    return { gregorian: { day: String(i + 1), date: `${String(i + 1).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`, month: { en: day.toLocaleDateString('en-US', { month: 'long' }) } }, hijri: { day: String(hijri.iDate()), year: String(hijri.iYear()), month: { number: hijri.iMonth() + 1, en: hijri.format('iMMMM'), ar: monthsAr[hijri.iMonth()] } } };
  });
  memory.set(key, { days, timestamp: 0 });
  return days;
}
export function loadCalendarMonth(date) {
  const key = calendarKey(date);
  if (memory.get(key)?.timestamp > Date.now() - 86400000) return Promise.resolve(memory.get(key).days);
  if (pending.has(key)) return pending.get(key);
  const request = (async () => {
    const storageKey = `calendar:v1:${key}`;
    try {
      const saved = JSON.parse(await AsyncStorage.getItem(storageKey) || 'null');
      if (Array.isArray(saved?.days) && saved.days.length >= 28 && saved.timestamp > Date.now() - 86400000) { memory.set(key, saved); return saved.days; }
    } catch { /* The local calendar remains usable if the cache is unavailable. */ }
    const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${date.getMonth() + 1}/${date.getFullYear()}`, { params: { adjustment: 0, method: 4 }, timeout: 12000 });
    const days = response.data?.data;
    if (!Array.isArray(days) || days.length < 28 || !days.every(day => day.hijri?.month && day.gregorian?.date)) throw new Error('Calendar update unavailable');
    const value = { days, timestamp: Date.now() };
    memory.set(key, value);
    AsyncStorage.setItem(storageKey, JSON.stringify(value)).catch(() => {});
    return days;
  })();
  pending.set(key, request);
  request.finally(() => pending.delete(key)).catch(() => {});
  return request;
}
