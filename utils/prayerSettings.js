const ADJUSTABLE_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const REGIONAL_METHODS = { US: 2, CA: 2, PK: 1, AF: 1, BD: 1, IN: 1, SA: 4, EG: 5, SD: 5, LY: 5, SO: 5, IR: 7, AE: 8, OM: 8, BH: 8, KW: 9, QA: 10, SG: 11, FR: 12, TR: 13, RU: 14, MY: 17, TN: 18, DZ: 19, ID: 20, MA: 21, PT: 22, JO: 23 };
const regionalMethod = country => REGIONAL_METHODS[String(country || '').toUpperCase()] || 3;
const numericText = value => String(value ?? '').trim().replace(/[٠-٩۰-۹]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٫,]/g, '.');
function validatePrayerSettings(input) {
  const value = { showImsak: false, timeFormat: '12', madhhabMethod: 1, adjustmentMethod: 4, ...input };
  const fail = code => { const error = new Error(code); error.code = code; throw error; };
  value.city = value.city?.trim() || ''; value.country = value.country?.trim() || '';
  if (value.autoDetectLocation === false || (value.autoDetectLocation == null && value.city && value.country)) {
    if (!value.city || !value.country) fail('location');
    value.latitude = null; value.longitude = null;
    value.autoDetectLocation = false;
    value.location = `${value.city}, ${value.country}`;
  } else {
    if ([value.latitude, value.longitude].some(v => v == null || v === '' || !Number.isFinite(Number(v))) || Math.abs(Number(value.latitude)) > 90 || Math.abs(Number(value.longitude)) > 180) fail('location');
    value.latitude = Number(value.latitude); value.longitude = Number(value.longitude);
    value.city = ''; value.country = ''; value.autoDetectLocation = true;
  }
  value.calculationMethodId = value.automaticSettings && value.countryCode ? regionalMethod(value.countryCode) : Number(value.calculationMethodId ?? 2);
  if (![0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 99].includes(value.calculationMethodId)) fail('method');
  if (![1, 2].includes(Number(value.madhhabMethod)) || ![2, 3, 4].includes(Number(value.adjustmentMethod))) fail('method');
  value.madhhabMethod = Number(value.madhhabMethod); value.adjustmentMethod = Number(value.adjustmentMethod);
  if (value.calculationMethodId === 99) {
    for (const key of ['fajrAngle', 'ishaAngle']) {
      const text = numericText(value[key]);
      if (!/^\d+(?:\.\d+)?$/.test(text) || Number(text) <= 0 || Number(text) > 30) fail('angles');
      value[key] = Number(text);
    }
  }
  value.prayerAdjustments = Object.fromEntries(ADJUSTABLE_PRAYERS.map(prayer => {
    const minutes = Number(value.prayerAdjustments?.[prayer] ?? 0);
    if (!Number.isInteger(minutes) || Math.abs(minutes) > 30) fail('adjustments');
    return [prayer, minutes];
  }));
  value.timeFormat = value.timeFormat === '24' ? '24' : '12';
  return value;
}
function formatPrayerTime(time, format = '12', language = 'en') {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time || ''));
  if (!match) return '—';
  const hours = Number(match[1]), minutes = match[2];
  const output = format === '24' ? `${String(hours).padStart(2, '0')}:${minutes}` : `${hours % 12 || 12}:${minutes} ${language === 'ar' ? (hours >= 12 ? 'م' : 'ص') : (hours >= 12 ? 'PM' : 'AM')}`;
  return language === 'ar' ? output.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : output;
}
module.exports = { ADJUSTABLE_PRAYERS, regionalMethod, numericText, validatePrayerSettings, formatPrayerTime };
