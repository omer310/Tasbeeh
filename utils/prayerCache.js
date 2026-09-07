function settingsKey(settings) {
  const city = settings.city?.trim().toLowerCase(), country = settings.country?.trim().toLowerCase();
  return JSON.stringify([city && country ? [city, country] : [Number(settings.latitude), Number(settings.longitude)], Number(settings.calculationMethodId || 2), Number(settings.madhhabMethod || 1)]);
}
function parseCalendar(data) {
  const result = {};
  for (const day of data || []) {
    const date = day.date?.gregorian?.date?.split('-');
    if (date?.length !== 3 || !day.timings?.Fajr || !day.timings?.Isha) continue;
    const key = `${date[2]}-${date[1]}-${date[0]}`;
    result[key] = Object.fromEntries(Object.entries(day.timings).map(([name, time]) => [name, String(time).split(' ')[0]]));
    result[key]._timeZone = day.meta?.timezone;
  }
  return result;
}
module.exports = { settingsKey, parseCalendar };
