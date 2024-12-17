import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
const PRAYER_NOTIFICATION_CHANNEL = 'prayer-times';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Register background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }
  
  if (data.prayer && data.adhanPreference) {
    await playAdhanSound(data.adhanPreference);
  }
});

const createNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PRAYER_NOTIFICATION_CHANNEL, {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Add this to bypass Do Not Disturb
      sound: true,
    });
  }
};

const registerBackgroundTasks = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 1, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    console.error("Task registration failed:", err);
  }
};

const playAdhanSound = async (adhanPreference) => {
  let soundFile;
  switch (adhanPreference) {
    case 'Adhan (Nureyn Mohammad)':
      soundFile = require('../assets/adhan.mp3');
      break;
    case 'Adhan (Madina)':
      soundFile = require('../assets/madinah_adhan.mp3');
      break;
    case 'Adhan (Makka)':
      soundFile = require('../assets/makkah_adhan.mp3');
      break;
    case 'Long beep':
      soundFile = require('../assets/long_beep.mp3');
      break;
    default:
      return;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(soundFile, {
      shouldPlay: true,
      isLooping: false,
    });
    
    await sound.setVolumeAsync(1.0);
    await sound.playAsync();

    // Cleanup
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing adhan:', error);
  }
};

const schedulePrayerNotifications = async (prayerTimes, adhanPreferences, playAdhan = true) => {
  try {
    // Cancel existing notifications
    await cancelAllScheduledNotifications();

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    const newNotificationIds = [];

    for (let prayer of prayers) {
      if (!prayerTimes[prayer]) continue;

      const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
      let prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      // If prayer time has passed, schedule for next day
      if (prayerDate <= now) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }

      const adhanPreference = adhanPreferences[prayer];
      if (!playAdhan || adhanPreference === 'None') {
        continue;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${prayer} Prayer`,
          body: `It's time to pray ${prayer} (${prayerTimes[prayer]})`,
          data: { prayer, adhanPreference },
          sound: true,
          priority: 'max',
        },
        trigger: {
          date: prayerDate,
          channelId: PRAYER_NOTIFICATION_CHANNEL,
        },
      });
      
      newNotificationIds.push(notificationId);
    }

    // Save new notification IDs
    await AsyncStorage.setItem('scheduledNotificationIds', JSON.stringify(newNotificationIds));
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

const cancelAllScheduledNotifications = async () => {
  try {
    const existingIds = await AsyncStorage.getItem('scheduledNotificationIds');
    if (existingIds) {
      const ids = JSON.parse(existingIds);
      for (let id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          allowCriticalAlerts: true, // Add this for critical alerts
          provisional: false,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted!');
    }

    await createNotificationChannels();
    await registerBackgroundTasks();
    
    return finalStatus;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return null;
  }
};

const checkScheduledNotifications = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Currently scheduled notifications:', scheduledNotifications.length);
    
    // If no notifications are scheduled, try to reschedule them
    if (scheduledNotifications.length === 0) {
      const prayerTimes = await AsyncStorage.getItem('lastPrayerTimes');
      const adhanPreferences = await AsyncStorage.getItem('adhanPreferences');
      const playAdhan = await AsyncStorage.getItem('playAdhan');
      
      if (prayerTimes && adhanPreferences) {
        await schedulePrayerNotifications(
          JSON.parse(prayerTimes),
          JSON.parse(adhanPreferences),
          playAdhan === 'true'
        );
      }
    }
    
    return scheduledNotifications;
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
    return [];
  }
};

export {
  schedulePrayerNotifications,
  cancelAllScheduledNotifications,
  requestNotificationPermissions,
  playAdhanSound,
  BACKGROUND_NOTIFICATION_TASK,
  checkScheduledNotifications,
}; 