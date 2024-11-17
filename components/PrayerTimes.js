import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Switch, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import PrayerTimeSettings from './PrayerTimeSettings';
import AdhanPreferenceModal from './AdhanPreferencesModal';
import { format } from 'date-fns';
import { BACKGROUND_NOTIFICATION_TASK } from '../constants/NotificationConstants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PrayerTimes = ({ themeColors, language, registerForPushNotificationsAsync, isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const prayerTimesRef = useRef(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [settings, setSettings] = useState({
    showImsak: false,
    autoDetectLocation: true,
    automaticSettings: true,
    location: 'United States',
    calculationMethodId: 2,
  });
  const [playAdhan, setPlayAdhan] = useState(true);
  const [adhanPreferences, setAdhanPreferences] = useState({
    Fajr: 'Adhan (Madina)',
    Dhuhr: 'Adhan (Madina)',
    Asr: 'Adhan (Madina)',
    Maghrib: 'Adhan (Madina)',
    Isha: 'Adhan (Madina)',
  });
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [adhanModalVisible, setAdhanModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Add translations
  const translations = {
    prayerTimes: { en: 'Prayer Times', ar: 'أوقات الصلاة' },
    today: { en: 'Today', ar: 'اليوم' },
    nextPrayer: { en: 'Next Prayer', ar: 'الصلاة القادمة' },
    in: { en: 'in', ar: 'في' },
    fajr: { en: 'Fajr', ar: 'الفجر' },
    sunrise: { en: 'Sunrise', ar: 'الشروق' },
    dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
    asr: { en: 'Asr', ar: 'العصر' },
    maghrib: { en: 'Maghrib', ar: 'المغرب' },
    isha: { en: 'Isha', ar: 'العشاء' },
    imsak: { en: 'Imsak', ar: 'الإمساك' },
    next: { en: 'Next', ar: 'التالي' },
    playAdhan: { en: 'Play Adhan', ar: 'تشغيل الأذان' },
    midnight: { en: 'Midnight', ar: 'منتصف الليل' },
    lastTime: { en: 'Last time', ar: 'آخر وقت' },
    lastTimeIsha: { en: 'Last time to pray Isha ends in', ar: 'آخر وقت لصلاة العشاء ينتهي في' },
    fajrEnds: { en: 'Fajr ends in', ar: 'ينتهي وقت الفجر في' },
    am: { en: 'AM', ar: 'ص' },
    pm: { en: 'PM', ar: 'م' },
  };

  const arabicFontFamily = Platform.OS === 'ios' ? 'Arial' : 'Scheherazade';

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  // Add this helper function after the translations object
  const convertToArabicNumbers = (str) => {
    if (!str) return str;
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.toString().replace(/[0-9]/g, (w) => arabicNumbers[w]);
  };

  useEffect(() => {
    const setup = async () => {
      try {
        // Request notifications permission
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });

        if (status !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }

        await loadSettings();
        await loadAdhanPreferences();
        await loadCachedPrayerTimes();
        await schedulePrayerNotifications();
      } catch (error) {
        console.error('Error in setup:', error);
      }
    };

    setup();
  }, []);

  useEffect(() => {
    if (prayerTimesRef.current) {
      const timer = setInterval(() => {
        updateNextPrayerAndCountdown();
      }, 1000); // Update every second
      return () => clearInterval(timer);
    }
  }, [prayerTimesRef.current]); // Add prayerTimesRef.current as a dependency

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('prayerTimeSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAdhanPreferences = async () => {
    try {
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const loadedPreferences = {};
      for (const prayer of prayers) {
        const savedPreference = await AsyncStorage.getItem(`adhan_preference_${prayer}`);
        loadedPreferences[prayer] = savedPreference || 'Adhan (Madina)';
      }
      setAdhanPreferences(loadedPreferences);
    } catch (error) {
      console.error('Error loading adhan preferences:', error);
    }
  };

  const loadCachedPrayerTimes = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const cachedData = await AsyncStorage.getItem(`prayerTimes_${today}`);
      if (cachedData) {
        const { prayerTimes, location } = JSON.parse(cachedData);
        prayerTimesRef.current = prayerTimes;
        setSettings(prevSettings => ({ ...prevSettings, location }));
        updateNextPrayerAndCountdown();
        setIsLoading(false);
      } else {
        await fetchPrayerTimes();
      }
    } catch (error) {
      console.error('Error loading cached prayer times:', error);
      setError('Failed to load prayer times. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchPrayerTimes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let coords;
      if (settings.autoDetectLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission to access location was denied');
        }
        const locationResult = await Location.getCurrentPositionAsync({});
        coords = locationResult.coords;
      } else {
        // Use the manually set location (implement geocoding here)
        coords = { latitude: 0, longitude: 0 };
      }

      const response = await axios.get(`https://api.aladhan.com/v1/timings`, {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          method: settings.calculationMethodId,
        },
      });

      const newPrayerTimes = response.data.data.timings;
      prayerTimesRef.current = newPrayerTimes;
      updateNextPrayerAndCountdown();

      // Cache the prayer times
      const today = format(new Date(), 'yyyy-MM-dd');
      await AsyncStorage.setItem(`prayerTimes_${today}`, JSON.stringify({
        prayerTimes: newPrayerTimes,
        location: settings.location,
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      setError('Failed to fetch prayer times. Please check your internet connection and try again.');
      setIsLoading(false);
    }
  };

  const updateNextPrayerAndCountdown = () => {
    if (!prayerTimesRef.current) return;
    const next = getNextPrayer(prayerTimesRef.current);
    setNextPrayer(next);
    const countdownTime = getCountdown(next, prayerTimesRef.current);
    setCountdown(language === 'ar' ? convertToArabicNumbers(countdownTime) : countdownTime);
  };

  const getNextPrayer = (times) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Midnight'];
    
    for (let prayer of prayers) {
      const [hours, minutes] = times[prayer].split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      if (prayerTime > currentTime) return prayer;
    }
    return 'Fajr'; // If all prayers have passed, return Fajr for the next day
  };

  const getCountdown = (prayer, times) => {
    const now = new Date();
    const [hours, minutes] = times[prayer].split(':').map(Number);
    let prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    if (prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    const diff = prayerDate - now;
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diff % (1000 * 60)) / 1000);

    const timeString = `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
    return timeString;
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(newSettings));
    fetchPrayerTimes();
  };

  const renderPrayerTime = (prayer) => {
    if (!prayerTimesRef.current) return null;
    const isNext = nextPrayer === prayer;
    const iconSource = getPrayerIcon(prayer);
    const isArabic = language === 'ar';
    
    const convertTo12Hour = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? getTranslatedText('pm') : getTranslatedText('am');
      const adjustedHours = hours % 12 || 12;
      const timeString = `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      return language === 'ar' ? convertToArabicNumbers(timeString) : timeString;
    };

    // Calculate midnight time
    const getMidnightTime = () => {
      if (prayerTimesRef.current['Midnight']) {
        return prayerTimesRef.current['Midnight'];
      }
      return null;
    };

    return (
      <TouchableOpacity 
        key={prayer}
        style={[
          styles.prayerItem, 
          isNext && styles.nextPrayer,
          isDarkMode && styles.prayerItemDark,
          isArabic && styles.prayerItemRTL
        ]}
        onPress={() => {
          setSelectedPrayer(prayer);
          setAdhanModalVisible(true);
        }}
      >
        <View style={[styles.leftContent, isArabic && styles.leftContentRTL]}>
          <View style={styles.iconContainer}>
            {iconSource ? (
              <Image 
                source={iconSource} 
                style={[styles.icon, prayer === 'Asr' && styles.asrIcon]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons 
                name={getPrayerIconName(prayer)}
                size={24}
                color={isDarkMode ? themeColors.darkTextColor : themeColors.textColor}
              />
            )}
          </View>
          <View style={[styles.prayerInfo, isArabic && styles.prayerInfoRTL]}>
            <Text style={[
              styles.prayerName, 
              isDarkMode && styles.prayerNameDark,
              isArabic && styles.arabicPrayerName
            ]}>
              {getTranslatedText(prayer.toLowerCase())}
            </Text>
            {prayer === 'Fajr' && (
              <Text style={[
                styles.sunriseTime, 
                { color: isDarkMode ? themeColors.darkSecondaryTextColor : themeColors.secondaryTextColor },
                isArabic && styles.arabicText
              ]}>
                {getTranslatedText('sunrise')} {convertTo12Hour(prayerTimesRef.current['Sunrise'])}
              </Text>
            )}
            {prayer === 'Isha' && getMidnightTime() && (
              <Text style={[
                styles.sunriseTime, 
                { color: isDarkMode ? themeColors.darkSecondaryTextColor : themeColors.secondaryTextColor },
                isArabic && styles.arabicText
              ]}>
                {getTranslatedText('midnight')} {convertTo12Hour(getMidnightTime())}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.prayerTimeContainer, isArabic && styles.prayerTimeContainerRTL]}>
          <Text style={[
            styles.prayerTime, 
            isDarkMode && { color: '#6ECF76' },
            isArabic && styles.arabicPrayerTime
          ]}>
            {convertTo12Hour(prayerTimesRef.current[prayer])}
          </Text>
          {isNext && (
            <View style={[styles.nextIndicator, isArabic && styles.nextIndicatorRTL]}>
              <Ionicons name="time-outline" size={16} color={isDarkMode ? '#6ECF76' : '#4CAF50'} />
              <Text style={[
                styles.nextText, 
                isDarkMode && { color: '#6ECF76' },
                isArabic && styles.arabicText
              ]}>
                {getTranslatedText('next')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getPrayerIcon = (prayer) => {
    switch (prayer) {
      case 'Fajr': return require('../assets/fajir.png');
      case 'Dhuhr': return require('../assets/dhur.png');
      case 'Asr': return require('../assets/asr.png');
      case 'Maghrib': return require('../assets/magrib.png');
      case 'Isha': return require('../assets/Isha.png');
      default: return null;
    }
  };

  const getPrayerIconName = (prayer) => {
    switch (prayer) {
      case 'Imsak': return 'sunny';
      case 'Midnight': return 'moon';
      case 'Lastthird': return 'partly-sunny';
      case 'Firstthird': return 'partly-sunny';
      default: return 'prayer-time';
    }
  };

  const schedulePrayerNotifications = async () => {
    try {
      // Cancel existing notifications
      let existingNotificationIds = await AsyncStorage.getItem('scheduledNotificationIds');
      if (existingNotificationIds) {
        existingNotificationIds = JSON.parse(existingNotificationIds);
        for (let id of existingNotificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }

      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const now = new Date();
      const newNotificationIds = [];

      // Register background task if not already registered
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

      for (let prayer of prayers) {
        const [hours, minutes] = prayerTimesRef.current[prayer].split(':').map(Number);
        let prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // If prayer time has passed, schedule for next day
        if (prayerDate <= now) {
          prayerDate.setDate(prayerDate.getDate() + 1);
        }

        const adhanPreference = adhanPreferences[prayer];
        if (!playAdhan || adhanPreference === 'None') {
          continue;
        }

        // Schedule the notification
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayer} Prayer`,
            body: `It's time to pray ${prayer}`,
            data: { prayer, adhanPreference },
            sound: adhanPreference === 'Silent' ? null : 'default',
            // Add priority for Android
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            date: prayerDate,
            // Enable precise timing for Android
            channelId: 'prayer-times',
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

  // Add this useEffect to create notification channel for Android
  useEffect(() => {
    const createNotificationChannel = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('prayer-times', {
          name: 'Prayer Times',
          importance: Notifications.AndroidImportance.MAX,
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    };

    createNotificationChannel();
  }, []);

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
        return; // Don't play anything for other options
    }

    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
  };

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const { adhanPreference } = notification.request.content.data;
      if (playAdhan && adhanPreference && adhanPreference !== 'None' && adhanPreference !== 'Silent' && adhanPreference !== 'Default notification sound') {
        playAdhanSound(adhanPreference);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, [playAdhan, adhanPreferences]);

  const handleAdhanPreferenceChange = async (prayer, preference) => {
    await AsyncStorage.setItem(`adhan_preference_${prayer}`, preference);
    setAdhanPreferences(prev => ({ ...prev, [prayer]: preference }));
    schedulePrayerNotifications();
  };

  const togglePlayAdhan = () => {
    const newValue = !playAdhan;
    setPlayAdhan(newValue);
    AsyncStorage.setItem('playAdhan', JSON.stringify(newValue));
    schedulePrayerNotifications();
  };

  const handlePreferenceChange = (prayer, adhanType, reminderTime) => {
    // Update your prayer times settings
    // Schedule notifications based on both adhan type and reminder time
    if (reminderTime !== 'None') {
      // Schedule reminder notification
      const reminderMinutes = {
        '5 minutes before': 5,
        '10 minutes before': 10,
        '15 minutes before': 15,
        '30 minutes before': 30,
        '1 hour before': 60
      }[reminderTime] || 0;
      
      // Schedule reminder notification reminderMinutes before prayer time
      scheduleReminderNotification(prayer, reminderMinutes);
    }

    // Schedule main adhan notification
    scheduleAdhanNotification(prayer, adhanType);
  };

  const scheduleAdhanNotification = async (prayer, adhanType) => {
    try {
      const [hours, minutes] = prayerTimesRef.current[prayer].split(':').map(Number);
      let prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);
      
      // If prayer time has passed, schedule for next day
      if (prayerDate <= new Date()) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }

      // Cancel any existing notification for this prayer
      const existingIds = await AsyncStorage.getItem(`notification_${prayer}`);
      if (existingIds) {
        const ids = JSON.parse(existingIds);
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }

      // Don't schedule if None is selected
      if (adhanType === 'None') {
        return;
      }

      const notificationContent = {
        title: `Time for ${prayer} Prayer`,
        body: `It's time to pray ${prayer} (${prayerTimesRef.current[prayer]})`,
        data: { prayer, adhanPreference: adhanType },
        priority: Notifications.AndroidImportance.MAX,
      };

      // Handle different notification types
      if (adhanType === 'Silent') {
        notificationContent.sound = false;
      } else if (adhanType === 'Default notification sound') {
        notificationContent.sound = true;
      } else {
        // For custom adhans, we'll handle the sound in the background task
        notificationContent.sound = false;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          date: prayerDate,
          channelId: 'prayer-times'
        }
      });

      // Store the notification ID
      await AsyncStorage.setItem(`notification_${prayer}`, JSON.stringify([notificationId]));
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const scheduleReminderNotification = async (prayer, reminderMinutes) => {
    if (reminderMinutes <= 0) return;

    try {
      const [hours, minutes] = prayerTimesRef.current[prayer].split(':').map(Number);
      let reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);
      reminderDate.setMinutes(reminderDate.getMinutes() - reminderMinutes);

      if (reminderDate <= new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer} Prayer Reminder`,
          body: `${prayer} prayer will be in ${reminderMinutes} minutes`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderDate,
          channelId: 'prayer-reminders'
        }
      });

      const storedIds = await AsyncStorage.getItem('scheduledReminderIds') || '[]';
      const reminderIds = JSON.parse(storedIds);
      reminderIds.push(notificationId);
      await AsyncStorage.setItem('scheduledReminderIds', JSON.stringify(reminderIds));
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/islamic-pattern2.png')}
      style={styles.background}
      imageStyle={[styles.backgroundImage, isDarkMode && styles.backgroundImageDark]}
      resizeMode="cover"
    >
      <View style={[
        styles.container, 
        { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.1)' }
      ]}>
        {isLoading ? (
          <ActivityIndicator size="large" color={themeColors.activeTabColor} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.errorColor }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPrayerTimes}>
              <Text style={[styles.retryButtonText, { color: themeColors.activeTabColor }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : prayerTimesRef.current ? (
          <>
            <View style={styles.header}>
              <Text style={[
                styles.title,
                { color: isDarkMode ? themeColors.darkTextColor : themeColors.textColor },
                language === 'ar' && styles.arabicTitle
              ]}>
                {getTranslatedText('prayerTimes')}
              </Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color={isDarkMode ? themeColors.darkSecondaryTextColor : themeColors.secondaryTextColor} />
                <Text style={[
                  styles.subtitle,
                  { color: isDarkMode ? themeColors.darkSecondaryTextColor : themeColors.secondaryTextColor },
                  language === 'ar' && styles.arabicSubtitle
                ]}>
                  {settings.location}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.date, { color: isDarkMode ? themeColors.darkTextColor : themeColors.textColor }]}>
                {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              {nextPrayer && (
                <Text style={[
                  styles.countdown,
                  { color: isDarkMode ? '#6ECF76' : themeColors.activeTabColor },
                  language === 'ar' && styles.arabicCountdown
                ]}>
                  {nextPrayer === 'Midnight' 
                    ? `${getTranslatedText('lastTimeIsha')} ${countdown}`
                    : nextPrayer === 'Sunrise'
                      ? `${getTranslatedText('fajrEnds')} ${countdown}`
                      : `${getTranslatedText('nextPrayer')}: ${getTranslatedText(nextPrayer.toLowerCase())} ${getTranslatedText('in')} ${countdown}`
                  }
                </Text>
              )}
            </View>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ 
                flexGrow: 1,
                justifyContent: 'center'
              }}
              showsVerticalScrollIndicator={false}
            >
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(renderPrayerTime)}
              {settings.showImsak && renderPrayerTime('Imsak')}
            </ScrollView>
          </>
        ) : (
          <Text style={[styles.errorText, { color: themeColors.errorColor }]}>No prayer times available. Please check your settings and try again.</Text>
        )}
      </View>
      <PrayerTimeSettings 
        isVisible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        themeColors={themeColors}
        onSettingsChange={handleSettingsChange}
        language={language}
      />
      <AdhanPreferenceModal
        isVisible={adhanModalVisible}
        onClose={() => setAdhanModalVisible(false)}
        prayer={selectedPrayer}
        themeColors={themeColors}
        language={language}
        onPreferenceChange={handleAdhanPreferenceChange}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    opacity: 1, 
    width: '100%', 
    height: '100%', 
  },
  backgroundImageDark: {
    opacity: 0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: '5%',
    paddingVertical: '2%',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: '4%',
    marginBottom: '2%',
    width: '100%',
  },
  title: {
    fontSize: Math.min(28, Math.round(Dimensions.get('window').width * 0.07)),
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  titleDark: {
    color: 'white',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '2%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.04)),
    marginLeft: 5,
  },
  date: {
    fontSize: Math.min(18, Math.round(Dimensions.get('window').width * 0.045)),
    fontWeight: 'bold',
    marginTop: '2%',
    textAlign: 'center',
  },
  countdown: {
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.04)),
    fontWeight: 'bold',
    marginTop: '2%',
    textAlign: 'center',
    paddingHorizontal: '5%',
  },
  scrollView: {
    width: '100%',
    maxHeight: Math.round(Dimensions.get('window').height * 0.65),
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3%',
    marginBottom: '2%',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.round(Dimensions.get('window').height * 0.075),
  },
  nextPrayer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Green highlight for next prayer
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  prayerItemDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: Math.round(Dimensions.get('window').width * 0.12),
    height: Math.round(Dimensions.get('window').width * 0.12),
    marginRight: '4%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
    maxWidth: Math.round(Dimensions.get('window').width * 0.08),
    maxHeight: Math.round(Dimensions.get('window').width * 0.08),
  },
  asrIcon: {
    maxWidth: 34,
    maxHeight: 34,
  },
  prayerInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  prayerName: {
    fontSize: Math.min(18, Math.round(Dimensions.get('window').width * 0.045)),
    fontWeight: 'bold',
    color: 'black',
  },
  prayerNameDark: {
    color: 'white',
  },
  sunriseTime: {
    fontSize: Math.min(14, Math.round(Dimensions.get('window').width * 0.035)),
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: Math.round(Dimensions.get('window').width * 0.2),
    justifyContent: 'flex-end',
  },
  prayerTime: {
    fontSize: Math.min(18, Math.round(Dimensions.get('window').width * 0.045)),
    fontWeight: 'bold',
    marginRight: '3%',
    color: '#4CAF50',
  },
  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    fontSize: Math.min(12, Math.round(Dimensions.get('window').width * 0.03)),
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5%',
  },
  errorText: {
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.04)),
    textAlign: 'center',
    marginBottom: '5%',
  },
  retryButton: {
    padding: '3%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryButtonText: {
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.04)),
    fontWeight: 'bold',
  },
  prayerItemRTL: {
    flexDirection: 'row-reverse',
  },
  leftContentRTL: {
    flexDirection: 'row-reverse',
  },
  prayerInfoRTL: {
    alignItems: 'flex-end',
    marginRight: '4%',
    marginLeft: 0,
  },
  prayerTimeContainerRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  nextIndicatorRTL: {
    flexDirection: 'row-reverse',
    marginRight: '3%',
    marginLeft: 0,
  },
  arabicText: {
    fontFamily: 'Scheherazade',
    textAlign: 'right',
    fontSize: Math.min(20, Math.round(Dimensions.get('window').width * 0.05)),
    lineHeight: Math.min(28, Math.round(Dimensions.get('window').width * 0.07)),
  },
  arabicTitle: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(28, Math.round(Dimensions.get('window').width * 0.07)),
    lineHeight: Math.min(34, Math.round(Dimensions.get('window').width * 0.085)),
    fontWeight: 'bold',
  },
  arabicSubtitle: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.04)),
    lineHeight: Math.min(22, Math.round(Dimensions.get('window').width * 0.055)),
  },
  arabicPrayerName: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(22, Math.round(Dimensions.get('window').width * 0.055)),
    lineHeight: Math.min(30, Math.round(Dimensions.get('window').width * 0.075)),
    fontWeight: 'bold',
  },
  arabicPrayerTime: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(20, Math.round(Dimensions.get('window').width * 0.05)),
    lineHeight: Math.min(28, Math.round(Dimensions.get('window').width * 0.07)),
    fontWeight: 'bold',
  },
  arabicCountdown: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(18, Math.round(Dimensions.get('window').width * 0.045)),
    lineHeight: Math.min(26, Math.round(Dimensions.get('window').width * 0.065)),
    fontWeight: 'bold',
  },
});

export default PrayerTimes;