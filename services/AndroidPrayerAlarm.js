import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
const native = Platform.OS === 'android' ? requireOptionalNativeModule('PrayerAlarm') : null;
export const androidPrayerAlarm = native;
export async function getAndroidAlarmStatus() {
  if (Platform.OS !== 'android') return null;
  if (!native) return { unavailable: true };
  return JSON.parse(await native.getStatus());
}
export const ANDROID_SOUNDS = {
  'Adhan (Nureyn Mohammad)': 'prayer_adhan', 'Adhan (Madina)': 'prayer_madinah',
  'Adhan (Makka)': 'prayer_makkah', 'Long beep': 'prayer_beep',
};
export function nativeAlarm(item) {
  const sound = item.reminder ? 'default' : item.sound === false ? 'silent' : ANDROID_SOUNDS[item.preference] || 'default';
  return {
    id: `${item.prayer}-${item.date.getTime()}-${item.reminder || 0}`, at: item.date.getTime(),
    prayer: item.prayer, preference: item.preference, sound,
    title: item.reminder ? `${item.prayer} prayer reminder` : `Time for ${item.prayer} prayer`,
    body: item.reminder ? `${item.prayer} prayer is in ${item.reminder} minutes` : `It's time to pray ${item.prayer}`,
  };
}
