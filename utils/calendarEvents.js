const EVENTS = [
  ['new-year', 'Islamic New Year', 'رأس السنة الهجرية', 1, 1],
  ['ashura', 'Day of Ashura', 'يوم عاشوراء', 1, 10],
  ['mawlid', 'Mawlid al-Nabi', 'المولد النبوي', 3, 12],
  ['miraj', 'Lailat al Miraj', 'ليلة المعراج', 7, 27],
  ['ramadan', 'Ramadan begins', 'بداية رمضان', 9, 1],
  ['fitr', 'Eid al-Fitr', 'عيد الفطر', 10, 1],
  ['arafah', 'Day of Arafah', 'يوم عرفة', 12, 9],
  ['adha', 'Eid al-Adha', 'عيد الأضحى', 12, 10],
].map(([id, en, ar, month, day]) => ({ id, en, ar, month, day }));
const eventsForDay = hijri => EVENTS.filter(event => event.month === Number(hijri?.month?.number) && event.day === Number(hijri?.day));
const civilDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
const daysUntil = (date, today) => civilDay(date) - civilDay(today);
function upcomingEvents(days, today, limit = 8) {
  const found = new Map();
  for (const day of days) {
    const [d, m, y] = day.gregorian.date.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12), remaining = daysUntil(date, today);
    if (remaining < 0) continue;
    for (const event of eventsForDay(day.hijri)) {
      const key = `${event.id}-${day.hijri.year}`;
      if (!found.has(key)) found.set(key, { ...event, key, date, remaining });
    }
  }
  return [...found.values()].sort((a, b) => a.date - b.date).slice(0, limit);
}
function countdownLabel(days, language = 'en') {
  const ar = language === 'ar', n = days.toLocaleString(ar ? 'ar' : 'en', { useGrouping: false });
  if (days === 0) return ar ? 'اليوم' : 'Today';
  if (days === 1) return ar ? 'غدًا' : 'Tomorrow';
  if (ar) return days === 2 ? 'بعد يومين' : `بعد ${n} ${days <= 10 ? 'أيام' : 'يومًا'}`;
  return `In ${n} days`;
}
module.exports = { EVENTS, eventsForDay, upcomingEvents, daysUntil, countdownLabel };
