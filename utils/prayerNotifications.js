const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const SOUNDS = {
  'Adhan (Nureyn Mohammad)': 'adhan.wav',
  'Adhan (Madina)': 'madinah_adhan.wav',
  'Adhan (Makka)': 'makkah_adhan.wav',
  'Long beep': 'long_beep.wav',
};
const REMINDERS = {
  '5 minutes before': 5, '10 minutes before': 10,
  '15 minutes before': 15, '30 minutes before': 30, '1 hour before': 60,
};
function dateKey(date = new Date(), timeZone) {
  if (!timeZone) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function prayerDate(time, day = new Date(), timeZone) {
  const match = /^(\d{1,2}):(\d{2})(?:\s|$)/.exec(String(time));
  if (!match || +match[1] > 23 || +match[2] > 59) return null;
  const date = new Date(day);
  date.setHours(+match[1], +match[2], 0, 0);
  if (!timeZone) return date;
  const desired = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), +match[1], +match[2]);
  let instant = desired;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
    const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const adjustment = desired - represented;
    instant += adjustment;
    if (!adjustment) break;
  }
  return new Date(instant);
}
function notificationSound(preference) {
  if (preference === 'Silent' || preference === 'None') return false;
  return SOUNDS[preference] || 'default';
}
function buildPrayerNotifications(times, preferences, reminders = {}, now = new Date(), day = now) {
  const result = [];
  for (const prayer of PRAYERS) {
    const preference = preferences[prayer] || 'Adhan (Madina)';
    const date = prayerDate(times?.[prayer], day, times?._timeZone);
    if (!date || date <= now) continue;
    if (preference !== 'None') result.push({ prayer, date, preference, sound: notificationSound(preference), reminder: 0 });
    const minutes = REMINDERS[reminders[prayer]] || 0;
    const reminderDate = new Date(date.getTime() - minutes * 60000);
    if (minutes && reminderDate > now) result.push({ prayer, date: reminderDate, preference, sound: 'default', reminder: minutes });
  }
  return result;
}
module.exports = { PRAYERS, SOUNDS, REMINDERS, dateKey, prayerDate, notificationSound, buildPrayerNotifications };
