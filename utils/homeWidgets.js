const categories = require('../data/hisnDuas.json');
const { PRAYERS, prayerDate, dateKey } = require('./prayerNotifications');
const moment = require('moment-hijri');
const hijriMonthsAr = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const hijriMonthsShort = ['Muharram', 'Safar', 'Rabi’ I', 'Rabi’ II', 'Jumada I', 'Jumada II', 'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhu’l-Qi’dah', 'Dhu’l-Hijjah'];

// Share the app's calculation results, including location timezone and offsets.
// The widget never extrapolates yesterday's timings into another day.
function prayerWidgetSnapshot(settings = {}, days = {}, now = Date.now()) {
  const entries = [], calendar = [];
  const formatters = new Map();
  for (const [key, times] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !times || !times._timeZone) continue;
    const day = new Date(`${key}T12:00:00`);
    if (!Number.isFinite(day.getTime()) || dateKey(day) !== key) continue;
    let formatter = formatters.get(times._timeZone);
    if (!formatter) {
      try {
        formatter = new Intl.DateTimeFormat('en-US', { timeZone: times._timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
        formatters.set(times._timeZone, formatter);
      } catch { continue; }
    }
    const prayers = [];
    for (const prayer of PRAYERS) {
      try {
        const at = prayerDate(times[prayer], day, times._timeZone, formatter)?.getTime();
        if (Number.isFinite(at)) {
          const item = { prayer, at, timeZone: times._timeZone };
          prayers.push(item);
          if (at > now) entries.push(item);
        }
      } catch { /* A malformed cache entry must not prevent other days syncing. */ }
    }
    // Keep today's past times as well as future days. Civil-midnight bounds use
    // the calculation location, so travel and 23/25-hour DST days stay correct.
    const tomorrow = new Date(day);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = prayerDate('00:00', day, times._timeZone, formatter).getTime();
    const end = prayerDate('00:00', tomorrow, times._timeZone, formatter).getTime();
    if (end > now && prayers.length) {
      const hijri = moment(day).locale('en'); // Same local conversion as CalendarService.
      const sunrise = prayerDate(times.Sunrise, day, times._timeZone, formatter)?.getTime();
      calendar.push({ date: key, start, end, timeZone: times._timeZone, prayers,
        sunrise: Number.isFinite(sunrise) ? sunrise : null,
        hijri: { day: hijri.iDate(), year: hijri.iYear(), month: hijri.format('iMMMM'), monthShort: hijriMonthsShort[hijri.iMonth()], monthAr: hijriMonthsAr[hijri.iMonth()] } });
    }
  }
  entries.sort((a, b) => a.at - b.at);
  calendar.sort((a, b) => a.start - b.start);
  return { version: 1, location: settings.location || [settings.city, settings.country].filter(Boolean).join(', '),
    timeFormat: settings.timeFormat === '24' ? '24' : '12', entries: entries.slice(0, 470), days: calendar.slice(0, 94) };
}

function widgetDestination(url) {
  if (typeof url !== 'string') return null;
  if (url === 'manarat://widget/prayer') return { kind: 'prayer' };
  const match = /^manarat:\/\/widget\/dua\/(hisn-[a-z0-9-]+)(?:\/(hisn-[a-z0-9-]+))?$/.exec(url);
  const category = match && categories.find(item => item.id === match[1]);
  if (!category?.subcategories?.length) return null;
  const dua = match[2] ? category.subcategories.find(item => item.id === match[2]) : category.subcategories[0];
  return dua ? { kind: 'dua', category, dua } : null;
}

module.exports = { prayerWidgetSnapshot, widgetDestination };
