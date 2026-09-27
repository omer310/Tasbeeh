function settingsKey(settings) {
  const city = settings.city?.trim().toLowerCase(), country = settings.country?.trim().toLowerCase();
  const method = Number(settings.calculationMethodId ?? 2);
  const base = [city && country ? [city, country] : [settings.latitude == null || settings.latitude === '' ? null : Number(settings.latitude), settings.longitude == null || settings.longitude === '' ? null : Number(settings.longitude)], method, Number(settings.madhhabMethod || 1)];
  const rule = [2, 3, 4].includes(Number(settings.adjustmentMethod)) ? Number(settings.adjustmentMethod) - 1 : 3;
  // Preserve existing cache keys for the API's default rule and standard methods.
  if (rule !== 3 || method === 99) base.push(rule, method === 99 ? [Number(settings.fajrAngle), Number(settings.ishaAngle)] : null);
  const tune = prayerTuning(settings);
  if (tune.some(value => value !== 0)) base.push(tune);
  return JSON.stringify(base);
}
function prayerRequestParams(settings) {
  const method = Number(settings.calculationMethodId ?? 2);
  return { method, school: Number(settings.madhhabMethod) === 2 ? 1 : 0,
    latitudeAdjustmentMethod: [2, 3, 4].includes(Number(settings.adjustmentMethod)) ? Number(settings.adjustmentMethod) - 1 : 3,
    ...(method === 99 ? { methodSettings: `${Number(settings.fajrAngle)},null,${Number(settings.ishaAngle)}` } : {}),
    ...(prayerTuning(settings).some(value => value !== 0) ? { tune: prayerTuning(settings).join(',') } : {}) };
}
function prayerTuning(settings) {
  // AlAdhan tune order is not the display order. Unsupported entries stay zero.
  return ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Sunset', 'Isha', 'Midnight'].map(prayer => {
    if (!['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(prayer)) return 0;
    const value = Number(settings.prayerAdjustments?.[prayer] ?? 0);
    return Number.isInteger(value) && Math.abs(value) <= 30 ? value : 0;
  });
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
module.exports = { settingsKey, parseCalendar, prayerRequestParams };
