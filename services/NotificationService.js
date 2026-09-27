import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { fetchPrayerDays } from './PrayerTimesService';
import { androidPrayerAlarm, getAndroidAlarmStatus, nativeAlarm } from './AndroidPrayerAlarm';
import { PRAYERS, SOUNDS, dateKey, buildPrayerNotifications } from '../utils/prayerNotifications';

const REFRESH_TASK = 'refresh-prayer-notifications';
const channelId = (sound, vibrate = false) => `prayer-v57-${vibrate ? 'vibrate' : sound === false ? 'silent' : sound.replace(/\W/g, '-')}`;
let channelsReady;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({ handleNotification: async notification => ({
    shouldShowBanner: true, shouldShowList: true, shouldSetBadge: false,
    shouldPlaySound: notification.request.content.data?.silent !== true,
  }) });
  TaskManager.defineTask(REFRESH_TASK, async () => {
    try {
      const settings = JSON.parse(await AsyncStorage.getItem('prayerTimeSettings') || '{}');
      if (!(settings.city && settings.country) && (settings.latitude == null || settings.longitude == null)) return BackgroundTask.BackgroundTaskResult.Success;
      const cache = await fetchPrayerDays(settings);
      const { preferences, reminders, enabled } = await loadNotificationPreferences();
      await schedulePrayerNotifications(cache[dateKey(new Date(), Object.values(cache)[0]?._timeZone)], preferences, enabled, reminders, cache);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn('Prayer notification refresh failed:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function createNotificationChannels() {
  if (Platform.OS !== 'android') return;
  if (channelsReady) return channelsReady;
  channelsReady = (async () => {
  for (const sound of [false, 'default', ...Object.values(SOUNDS)]) {
    await Notifications.setNotificationChannelAsync(channelId(sound), {
      name: sound === false ? 'Silent prayer reminders' : `Prayer reminders (${sound})`,
      importance: Notifications.AndroidImportance.HIGH,
      ...(sound === 'default' ? {} : { sound: sound === false ? null : sound }),
      enableVibrate: sound !== false,
    });
  }
  await Notifications.setNotificationChannelAsync(channelId(false, true), {
    name: 'Vibrate prayer alerts', importance: Notifications.AndroidImportance.HIGH,
    sound: null, enableVibrate: true, vibrationPattern: [0, 400, 250, 400, 250, 400],
  });
  })().catch(error => { channelsReady = null; throw error; });
  return channelsReady;
}

export async function initializeNotifications() {
  if (Platform.OS === 'web') return;
  await createNotificationChannels();
  if (await TaskManager.isAvailableAsync()) {
    await BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 60 });
  }
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  await createNotificationChannels();
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return permission.granted;
}

export async function loadNotificationPreferences() {
  const stored = Object.fromEntries(await AsyncStorage.multiGet([
    'adhanPreferences', 'playAdhan', ...PRAYERS.flatMap(prayer => [`adhan_preference_${prayer}`, `reminder_preference_${prayer}`]),
  ]));
  const preferences = JSON.parse(stored.adhanPreferences || '{}');
  const reminders = {};
  for (const prayer of PRAYERS) {
    preferences[prayer] = stored[`adhan_preference_${prayer}`] || preferences[prayer] || 'Adhan (Madina)';
    reminders[prayer] = stored[`reminder_preference_${prayer}`] || 'None';
  }
  const enabled = stored.playAdhan !== 'false';
  return { preferences, reminders, enabled };
}

async function cancelScheduledNow() {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
  if (androidPrayerAlarm) {
    await androidPrayerAlarm.replaceSchedule('[]');
    await androidPrayerAlarm.cancelTest();
    await androidPrayerAlarm.stop();
  }
}

let scheduling = Promise.resolve();
export function cancelAllScheduledNotifications() {
  scheduling = scheduling.catch(() => {}).then(cancelScheduledNow);
  return scheduling;
}
export function schedulePrayerNotifications(times, preferences, enabled = true, reminders = {}, cache) {
  // Serialize preference changes so an older request cannot cancel a newer schedule.
  scheduling = scheduling.catch(() => {}).then(async () => {
    if (Platform.OS === 'web') return [];
    const permission = await Notifications.getPermissionsAsync();
    if (!enabled) { await cancelScheduledNow(); return []; }
    if (!permission.granted) throw new Error('Allow notifications to receive prayer alerts.');
    if (!times) return [];
    const previous = await Notifications.getAllScheduledNotificationsAsync();
    await createNotificationChannels();
    const now = new Date();
    const days = cache || { [dateKey(now, times._timeZone)]: times };
    const requests = Object.entries(days).flatMap(([day, dayTimes]) =>
      buildPrayerNotifications(dayTimes, preferences, reminders, now, new Date(`${day}T12:00:00`))
    ).sort((a, b) => a.date - b.date).filter(item => item.date - now < 30 * 86400000).slice(0, Platform.OS === 'ios' ? 60 : 300);
    if (Platform.OS === 'android') {
      if (!androidPrayerAlarm) throw new Error('Install the new Android preview APK to enable Azan alarms.');
      const newSounds = ['Vibrate', 'Adhan (Sudan)', 'Adhan (Mishary Alafasy)', 'Adhan (Abdulbasit)', 'Adhan (Al-Aqsa)', 'Adhan (Turkey)'];
      if (requests.some(item => !item.reminder && newSounds.includes(item.preference)) && (await getAndroidAlarmStatus())?.audioLibraryVersion !== 2) {
        throw new Error('Install the updated Android APK to use the new Azans and Vibrate. Your previous schedule is still active.');
      }
      const count = await androidPrayerAlarm.replaceSchedule(JSON.stringify(requests.map(nativeAlarm)));
      // Only remove the old Expo schedule after the native replacement is safely stored.
      await Promise.all(previous.map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
      return Array.from({ length: count }, (_, i) => String(i));
    }
    const ids = [];
    try { for (const item of requests) {
      ids.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: item.reminder ? `${item.prayer} Prayer Reminder` : `Time for ${item.prayer} Prayer`,
          body: item.reminder ? `${item.prayer} prayer will be in ${item.reminder} minutes` : `It's time to pray ${item.prayer}`,
          sound: item.sound,
          data: { prayer: item.prayer, adhanPreference: item.preference, silent: item.sound === false, reminder: item.reminder, at: item.date.getTime() },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: channelId(item.sound, !item.reminder && item.preference === 'Vibrate') },
      }));
    }
    } catch (error) {
      await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
      throw error;
    }
    await Promise.all(previous.map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
    return ids;
  });
  return scheduling;
}

export async function checkScheduledNotifications() {
  if (Platform.OS === 'web') return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

export { getAndroidAlarmStatus };
export async function getNextPrayerReminder(prayer) {
  if (Platform.OS === 'android') return (await getAndroidAlarmStatus())?.nextReminders?.[prayer] || null;
  if (Platform.OS === 'web') return null;
  const items = await Notifications.getAllScheduledNotificationsAsync();
  return items.map(item => item.content.data).filter(data => data?.prayer === prayer && data.reminder > 0 && data.at > Date.now()).sort((a, b) => a.at - b.at)[0]?.at || null;
}
export async function scheduleAzanTest(prayer, preference) {
  if (!(await requestNotificationPermissions())) throw new Error('Allow notifications first.');
  if (preference === 'None') throw new Error('Choose a sound, Vibrate or Silent before testing.');
  const item = { prayer, preference, sound: ['Silent', 'Vibrate'].includes(preference) ? false : SOUNDS[preference] || 'default', date: new Date(Date.now() + 15000), reminder: 0 };
  if (Platform.OS === 'android') {
    if (!androidPrayerAlarm) throw new Error('Install the new Android preview APK first.');
    const alarm = { ...nativeAlarm(item), id: 'azan-preview-test', test: true };
    await androidPrayerAlarm.scheduleTest(JSON.stringify(alarm));
  } else if (Platform.OS === 'ios') {
    await Notifications.scheduleNotificationAsync({ identifier: 'azan-preview-test', content: { title: `Azan test · ${prayer}`, body: preference, sound: item.sound }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date } });
  } else throw new Error('Scheduled Azan is available in the installed mobile app.');
}
