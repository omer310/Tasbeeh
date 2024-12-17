import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Switch, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  schedulePrayerNotifications,
  requestNotificationPermissions,
  BACKGROUND_NOTIFICATION_TASK,
  checkScheduledNotifications,
  stopAdhan,
} from '../services/NotificationService';
import PrayerTimeSettings from './PrayerTimeSettings';
import AdhanPreferenceModal from './AdhanPreferencesModal';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = SCREEN_WIDTH >= 768; // Common tablet breakpoint

const CACHE_KEY_PREFIX = 'prayerTimes_';
const CACHE_DAYS = 3; // Cache prayer times for 3 days

const formatDate = (date) => format(date, 'yyyy-MM-dd');

const getCacheKey = (date) => `${CACHE_KEY_PREFIX}${formatDate(date)}`;

const getPrayerTimesForDate = async (date, latitude, longitude, method) => {
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/timings/${formatDate(date)}`, {
      params: {
        latitude,
        longitude,
        method,
      },
    });
    return response.data.data.timings;
  } catch (error) {
    throw error;
  }
};

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
    location: '',
    calculationMethodId: 2,
  });
  const [playAdhan, setPlayAdhan] = useState(true);
  const [adhanPreferences, setAdhanPreferences] = useState({
    Fajr: 'Adhan (Nureyn Mohammad)',
    Dhuhr: 'Adhan (Nureyn Mohammad)',
    Asr: 'Adhan (Nureyn Mohammad)',
    Maghrib: 'Adhan (Nureyn Mohammad)',
    Isha: 'Adhan (Nureyn Mohammad)',
  });
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [adhanModalVisible, setAdhanModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [hijriDate, setHijriDate] = useState(null);
  const [cachedPrayerTimes, setCachedPrayerTimes] = useState({});

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
    lastTimeIsha: { en: 'Last time to pray Isha ends in', ar: 'آخر وقت لصلاة الشاء ينتهي في' },
    fajrEnds: { en: 'Fajr ends in', ar: 'ينتهي وقت الفجر في' },
    am: { en: 'AM', ar: 'ص' },
    pm: { en: 'PM', ar: 'م' },
    hijriDate: { en: 'Hijri Date', ar: 'التاريخ الهجري' },
    hours: { en: 'Hours', ar: 'ساعات' },
    minutes: { en: 'Minutes', ar: 'دقائق' },
    seconds: { en: 'Seconds', ar: 'ثواني' },
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

  // Add this function after the translations object
  const getHijriDate = (date) => {
    // Using a simple calculation - for more accuracy you might want to use a library like moment-hijri
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    let jd = Math.floor((365.25 * (y + 4716))) + Math.floor((30.6001 * (m + 1))) + d - 1524.5;
    
    let l = Math.floor(jd) - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    
    let month = Math.floor((24 * l) / 709);
    let day = l - Math.floor((709 * month) / 24);
    let year = 30 * n + j - 30;

    const hijriMonths = {
      en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 
           'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'],
      ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
           'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
    };

    return {
      day,
      month: month - 1,
      year,
      monthName: hijriMonths[language][month - 1]
    };
  };

  const fetchHijriDate = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
      
      if (response.data.code === 200) {
        const gregorianDate = format(today, 'dd-MM-yyyy');
        const hijriData = response.data.data.find(
          item => item.gregorian.date === gregorianDate
        );
        
        if (hijriData) {
          setHijriDate({
            day: hijriData.hijri.day,
            month: language === 'ar' ? hijriData.hijri.month.ar : hijriData.hijri.month.en,
            year: hijriData.hijri.year,
            weekday: language === 'ar' ? hijriData.hijri.weekday.ar : hijriData.hijri.weekday.en
          });
        }
      }
    } catch (error) {
      setError('Failed to fetch Hijri date');
    }
  };

  useEffect(() => {
    fetchHijriDate();
  }, [language]);

  useEffect(() => {
    const setup = async () => {
      try {
        setIsLoading(true);
        
        await requestNotificationPermissions();
        
        const savedLocation = await AsyncStorage.getItem('location');
        if (savedLocation) {
          setSettings(prev => ({
            ...prev,
            location: savedLocation,
            autoDetectLocation: true,
            automaticSettings: true,
          }));
        }
        
        // Load cached prayer times first
        await loadCachedPrayerTimes();
        
        // Then update the cache in the background
        updatePrayerTimesCache();
        
      } catch (error) {
        console.error('Error in setup:', error);
        setError('Failed to initialize. Please check your settings.');
      } finally {
        setIsLoading(false);
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
      const currentLocation = await AsyncStorage.getItem('location');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...parsedSettings,
          location: currentLocation || prev.location || parsedSettings.location,
          autoDetectLocation: true,
          automaticSettings: true,
        }));
      }
    } catch (error) {
      setError('Failed to load settings');
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
      setError('Failed to load Adhan preferences');
    }
  };

  const loadCachedPrayerTimes = async () => {
    try {
      const cached = await AsyncStorage.getItem('prayerTimesCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setCachedPrayerTimes(parsedCache);
        
        const today = formatDate(new Date());
        if (parsedCache[today]) {
          prayerTimesRef.current = parsedCache[today];
          updateNextPrayerAndCountdown();
          return true;
        }
      }
      return false;
    } catch (error) {
      setError('Failed to load cached prayer times');
      return false;
    }
  };

  const fetchPrayerTimes = async (lat = null, lng = null) => {
    try {
      setIsLoading(true);
      await updatePrayerTimesCache();
    } catch (error) {
      setError('Failed to fetch prayer times. Please check your internet connection and try again.');
    } finally {
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
                styles.additionalTime,
                isDarkMode && styles.additionalTimeDark,
                isArabic && styles.arabicAdditionalTime
              ]}>
                {getTranslatedText('sunrise')} {convertTo12Hour(prayerTimesRef.current['Sunrise'])}
              </Text>
            )}
            {prayer === 'Isha' && getMidnightTime() && (
              <Text style={[
                styles.additionalTime,
                isDarkMode && styles.additionalTimeDark,
                isArabic && styles.arabicAdditionalTime
              ]}>
                {getTranslatedText('midnight')} {convertTo12Hour(getMidnightTime())}
              </Text>
            )}
          </View>
        </View>
        <Text style={[
          styles.prayerTime,
          isDarkMode && styles.prayerTimeDark,
          isArabic && styles.arabicPrayerTime
        ]}>
          {convertTo12Hour(prayerTimesRef.current[prayer])}
        </Text>
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

  // const getPrayerIconName = (prayer) => {
  //   switch (prayer) {
  //     case 'Imsak': return 'sunny';
  //     case 'Midnight': return 'moon';
  //     case 'Lastthird': return 'partly-sunny';
  //     case 'Firstthird': return 'partly-sunny';
  //     default: return 'prayer-time';
  //   }
  // };

  const getPrayerGradient = (prayer, isDarkMode) => {
    const gradients = {
      Fajr: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
      Dhuhr: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
      Asr: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
      Maghrib: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
      Isha: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
      default: isDarkMode 
        ? ['#1a4731', '#4CAF50'] 
        : ['#2d8a5c', '#4CAF50'],
    };
    return gradients[prayer] || gradients.default;
  };

  const handleAdhanPreferenceChange = async (prayer, preference) => {
    const newPreferences = { ...adhanPreferences, [prayer]: preference };
    setAdhanPreferences(newPreferences);
    await AsyncStorage.setItem('adhanPreferences', JSON.stringify(newPreferences));

    // Reschedule notifications with new preferences
    if (prayerTimesRef.current) {
      await schedulePrayerNotifications(
        prayerTimesRef.current,
        newPreferences,
        playAdhan
      );
    }
  };

  const togglePlayAdhan = () => {
    const newValue = !playAdhan;
    setPlayAdhan(newValue);
    AsyncStorage.setItem('playAdhan', JSON.stringify(newValue));
    schedulePrayerNotifications(
      prayerTimesRef.current,
      adhanPreferences,
      newValue
    );
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
      setError('Failed to schedule reminder notification');
    }
  };

  // Also add this useEffect to monitor notification scheduling
  useEffect(() => {
    const checkNotifications = async () => {
      const scheduled = await checkScheduledNotifications();
    };

    checkNotifications();
    
    // Set up an interval to check notifications every hour
    const interval = setInterval(checkNotifications, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  const testNotification = async () => {
    try {
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);
      
      const testPrayerTimes = {
        Fajr: format(testTime, 'HH:mm'),
        Dhuhr: '12:00',
        Asr: '15:00',
        Maghrib: '18:00',
        Isha: '20:00'
      };

      await schedulePrayerNotifications(
        testPrayerTimes,
        adhanPreferences,
        playAdhan
      );
    } catch (error) {
      setError('Failed to schedule test notification');
    }
  };

  const updatePrayerTimesCache = async () => {
    try {
      let coords;
      if (settings.latitude && settings.longitude) {
        coords = { latitude: settings.latitude, longitude: settings.longitude };
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }
        const location = await Location.getCurrentPositionAsync({});
        coords = location.coords;
        
        let geocode = await Location.reverseGeocodeAsync(coords);
        if (geocode[0]) {
          const newCity = geocode[0].city || geocode[0].subregion || '';
          const newCountry = geocode[0].country || '';
          const newLocation = newCity ? `${newCity}, ${newCountry}` : newCountry;
          
          setSettings(prev => ({
            ...prev,
            location: newLocation,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }));
          
          await AsyncStorage.multiSet([
            ['location', newLocation],
            ['latitude', coords.latitude.toString()],
            ['longitude', coords.longitude.toString()],
          ]);
        }
      }

      const today = new Date();
      const newCache = { ...cachedPrayerTimes };
      
      for (let i = 0; i < CACHE_DAYS; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);
        
        if (!newCache[dateStr]) {
          const prayerTimes = await getPrayerTimesForDate(
            date,
            coords.latitude,
            coords.longitude,
            settings.calculationMethodId
          );
          newCache[dateStr] = prayerTimes;
        }
      }

      setCachedPrayerTimes(newCache);
      await AsyncStorage.setItem('prayerTimesCache', JSON.stringify(newCache));
      
      const todayStr = formatDate(today);
      prayerTimesRef.current = newCache[todayStr];
      updateNextPrayerAndCountdown();
      
    } catch (error) {
      setError('Failed to update prayer times cache');
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/islamic-pattern3.png')}
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
              <TouchableOpacity 
                onPress={() => setSettingsModalVisible(true)} 
                style={[
                  styles.locationButton,
                  isDarkMode && styles.locationButtonDark
                ]}
              >
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color={isDarkMode ? '#4CAF50' : '#006400'} 
                />
                <Text style={[
                  styles.locationText,
                  isDarkMode && styles.locationTextDark,
                  language === 'ar' && styles.arabicLocationText
                ]}>
                  {settings.location || ''}
                </Text>
              </TouchableOpacity>

              <View style={[
                styles.dateCard,
                isDarkMode && styles.dateCardDark
              ]}>
                <View style={styles.dateRow}>
                  <View style={styles.dateColumn}>
                    <View style={styles.dateMainContent}>
                      <Text style={[
                        styles.dateNumber,
                        isDarkMode && styles.dateNumberDark
                      ]}>
                        {new Date().getDate()}
                      </Text>
                      <View style={styles.dateDetails}>
                        <Text style={[
                          styles.monthYear,
                          isDarkMode && styles.monthYearDark
                        ]}>
                          {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                            month: 'long'
                          }).split(' ')[0]}
                        </Text>
                        <Text style={[
                          styles.weekday,
                          isDarkMode && styles.weekdayDark
                        ]}>
                          {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                            weekday: 'long'
                          }).split(' ')[0]}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dateDivider} />

                  <View style={styles.dateColumn}>
                    {hijriDate ? (
                      <View style={styles.dateMainContent}>
                        <Text style={[
                          styles.dateNumber,
                          isDarkMode && styles.dateNumberDark,
                          language === 'ar' && styles.arabicDateNumber
                        ]}>
                          {language === 'ar' 
                            ? convertToArabicNumbers(hijriDate.day)
                            : hijriDate.day}
                        </Text>
                        <View style={styles.dateDetails}>
                          <Text style={[
                            styles.monthYear,
                            isDarkMode && styles.monthYearDark,
                            language === 'ar' && styles.arabicMonthYear
                          ]}>
                            {hijriDate.month}
                          </Text>
                          <Text style={[
                            styles.weekday,
                            isDarkMode && styles.weekdayDark,
                            language === 'ar' && styles.arabicWeekday
                          ]}>
                            {language === 'ar' 
                              ? convertToArabicNumbers(hijriDate.year)
                              : hijriDate.year}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color={themeColors.activeTabColor} />
                    )}
                  </View>
                </View>
              </View>
              
              {nextPrayer && (
                <LinearGradient
                  colors={getPrayerGradient(nextPrayer, isDarkMode)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.countdownContainer,
                    language === 'ar' && styles.countdownContainerRTL
                  ]}
                >
                  <Text style={[
                    styles.countdownTitle,
                    language === 'ar' && styles.countdownTitleRTL
                  ]}>
                    {nextPrayer === 'Sunrise' 
                      ? getTranslatedText('fajrEnds')
                      : `${getTranslatedText('nextPrayer')}: ${getTranslatedText(nextPrayer.toLowerCase())}`
                    }
                  </Text>
                  
                  <View style={styles.timeBoxesContainer}>
                    {countdown.split(':').map((value, index) => (
                      <React.Fragment key={index}>
                        <View style={styles.timeBox}>
                          <View style={styles.timeBoxInner}>
                            <Text style={styles.timeBoxText}>
                              {language === 'ar' ? convertToArabicNumbers(value) : value}
                            </Text>
                          </View>
                          <Text style={[
                            styles.timeBoxLabel,
                            language === 'ar' && styles.timeBoxLabelRTL
                          ]}>
                            {getTranslatedText(
                              index === 0 ? 'hours' : 
                              index === 1 ? 'minutes' : 
                              'seconds'
                            )}
                          </Text>
                        </View>
                        {index < 2 && (
                          <Text style={styles.timeBoxSeparator}>:</Text>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </LinearGradient>
              )}
            </View>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ 
                flexGrow: 1,
                justifyContent: 'center',
                paddingBottom: SCREEN_HEIGHT < 700 ? 60 : 20,
              }}
              showsVerticalScrollIndicator={false}
            >
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(renderPrayerTime)}
              {settings.showImsak && renderPrayerTime('Imsak')}
              
            </ScrollView>
          </>
        ) : (
          <Text style={[styles.errorText, { color: themeColors.errorColor }]}>
            No prayer times available. Please check your settings and try again.
          </Text>
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
    opacity: 0.1,
  },
  container: {
    flex: 1,
    paddingHorizontal: '5%',
    paddingVertical: '5%',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT < 700 ? '2%' : '3%',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    width: '100%',
  },
  title: {
    fontSize: isTablet 
      ? Math.min(36, SCREEN_WIDTH * 0.05)
      : Math.min(30, SCREEN_WIDTH * 0.075),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleDark: {
    color: 'white',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '1%',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  locationContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    elevation: 4,
  },
  subtitle: {
    fontSize: isTablet 
      ? Math.min(24, SCREEN_WIDTH * 0.035)
      : Math.min(20, SCREEN_WIDTH * 0.05),
    marginLeft: 5,
    color: '#006400',
    fontWeight: '600',
  },
  subtitleDark: {
    color: '#4CAF50',
  },
  date: {
    fontSize: isTablet 
      ? Math.min(22, SCREEN_WIDTH * 0.04)
      : Math.min(18, SCREEN_WIDTH * 0.055),
    fontWeight: 'bold',
    marginTop: isTablet ? '2%' : '3%',
    textAlign: 'center',
  },
  countdown: {
    fontSize: Math.min(18, Math.round(Dimensions.get('window').width * 0.055)),
    fontWeight: 'bold',
    marginTop: '2%',
    textAlign: 'center',
    paddingHorizontal: '10%',
    top: 20,
  },
  scrollView: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT < 700 
      ? SCREEN_HEIGHT * 0.40 
      : (ASPECT_RATIO > 1.6 
        ? SCREEN_HEIGHT * 0.60 
        : SCREEN_HEIGHT * 0.50),
    marginTop: SCREEN_HEIGHT < 700 ? 25 : 15,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isTablet ? '1.5%' : '2.5%',
    marginBottom: isTablet ? '0.8%' : '1.5%',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: isTablet 
      ? SCREEN_HEIGHT * 0.06 
      : SCREEN_HEIGHT * 0.075,
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
    fontSize: Math.min(20, Math.round(Dimensions.get('window').width * 0.055)),
    fontWeight: 'bold',
    color: 'black',
  },
  prayerNameDark: {
    color: 'white',
  },
  sunriseTime: {
    fontSize: Math.min(16, Math.round(Dimensions.get('window').width * 0.045)),
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
  arabicText: {
    fontFamily: 'Scheherazade',
    textAlign: 'right',
    fontSize: Math.min(24, Math.round(Dimensions.get('window').width * 0.06)),
    lineHeight: Math.min(32, Math.round(Dimensions.get('window').width * 0.08)),
  },
  arabicTitle: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(32, Math.round(Dimensions.get('window').width * 0.08)),
    lineHeight: Math.min(40, Math.round(Dimensions.get('window').width * 0.095)),
    fontWeight: 'bold',
  },
  arabicSubtitle: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(22, Math.round(Dimensions.get('window').width * 0.055)),
    lineHeight: Math.min(28, Math.round(Dimensions.get('window').width * 0.07)),
  },
  arabicPrayerName: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(26, Math.round(Dimensions.get('window').width * 0.065)),
    lineHeight: Math.min(34, Math.round(Dimensions.get('window').width * 0.085)),
    fontWeight: 'bold',
  },
  arabicPrayerTime: {
    fontFamily: 'Scheherazade',
    fontSize: SCREEN_HEIGHT < 700 
      ? Math.min(24, SCREEN_WIDTH * 0.06)  // Increased from 18 to 24
      : Math.min(26, SCREEN_WIDTH * 0.065), // Increased from 20 to 26
    marginLeft: 10,
    marginRight: 0,
    fontWeight: '600',
  },
  arabicCountdown: {
    fontFamily: 'Scheherazade',
    fontSize: Math.min(22, Math.round(Dimensions.get('window').width * 0.055)),
    lineHeight: Math.min(30, Math.round(Dimensions.get('window').width * 0.075)),
    fontWeight: 'bold',
  },
  hijriDate: {
    fontSize: isTablet 
      ? Math.min(22, SCREEN_WIDTH * 0.04)
      : Math.min(18, SCREEN_WIDTH * 0.055),
    marginTop: '2%',
    textAlign: 'center',
    opacity: 0.9,
  },
  arabicHijriDate: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet 
      ? Math.min(32, SCREEN_WIDTH * 0.06)
      : Math.min(28, SCREEN_WIDTH * 0.07),
    lineHeight: isTablet 
      ? Math.min(40, SCREEN_WIDTH * 0.075)
      : Math.min(34, SCREEN_WIDTH * 0.085),
  },
  countdownContainer: {
    borderRadius: 10,
    padding: isTablet ? 16 : 12,
    width: '100%',
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: SCREEN_HEIGHT < 700 ? 10 : (ASPECT_RATIO > 1.6 ? -30 : -15),
    marginTop: SCREEN_HEIGHT < 700 ? 8 : (isTablet ? 15 : 10),
  },
  countdownTitle: {
    color: '#ffffff',
    fontSize: isTablet 
      ? Math.min(20, SCREEN_WIDTH * 0.03)
      : Math.min(16, SCREEN_WIDTH * 0.04),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: isTablet ? 10 : 8,
    width: '100%',
  },
  timeBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
  },
  timeBox: {
    alignItems: 'center',
  },
  timeBoxInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: SCREEN_HEIGHT < 700 ? 8 : (isTablet ? 15 : 10),
    paddingVertical: SCREEN_HEIGHT < 700 ? 4 : (isTablet ? 8 : 6),
    minWidth: SCREEN_HEIGHT < 700 ? 45 : (isTablet ? 70 : 50),
  },
  timeBoxText: {
    color: '#ffffff',
    fontSize: SCREEN_HEIGHT < 700 ? 20 : (isTablet ? 32 : 24),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeBoxLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: SCREEN_HEIGHT < 700 ? 8 : (isTablet ? 12 : 10),
    marginTop: SCREEN_HEIGHT < 700 ? 2 : (isTablet ? 4 : 3),
  },
  timeBoxSeparator: {
    color: '#ffffff',
    fontSize: SCREEN_HEIGHT < 700 ? 20 : (isTablet ? 32 : 24),
    fontWeight: 'bold',
    marginHorizontal: SCREEN_HEIGHT < 700 ? 4 : (isTablet ? 10 : 6),
  },
  countdownTitleRTL: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet 
      ? Math.min(24, SCREEN_WIDTH * 0.04)
      : Math.min(20, SCREEN_WIDTH * 0.05),
    textAlign: 'center',
    width: '100%',
  },
  timeBoxLabelRTL: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet ? 14 : 12,
  },
  prayerTime: {
    fontSize: SCREEN_HEIGHT < 700 
      ? Math.min(16, SCREEN_WIDTH * 0.04)
      : Math.min(18, SCREEN_WIDTH * 0.045),
    fontWeight: '600',
    color: '#006400',
    marginRight: 10,
  },
  prayerTimeDark: {
    color: '#ffffff',
  },
  arabicPrayerTime: {
    fontFamily: 'Scheherazade',
    fontSize: SCREEN_HEIGHT < 700 
      ? Math.min(24, SCREEN_WIDTH * 0.06)  // Increased from 18 to 24
      : Math.min(26, SCREEN_WIDTH * 0.065), // Increased from 20 to 26
    marginLeft: 10,
    marginRight: 0,
    fontWeight: '600',
  },
  additionalTime: {
    fontSize: SCREEN_HEIGHT < 700 
      ? Math.min(12, SCREEN_WIDTH * 0.03)
      : Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#666666',
    marginTop: 2,
  },
  additionalTimeDark: {
    color: '#999999',
  },
  arabicAdditionalTime: {
    fontFamily: 'Scheherazade',
    fontSize: SCREEN_HEIGHT < 700 
      ? Math.min(20, SCREEN_WIDTH * 0.05)  // Increased from 14 to 20
      : Math.min(22, SCREEN_WIDTH * 0.055), // Increased from 16 to 22
    textAlign: 'right',
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 5,
  },
  dateCardDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dateMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  dateDetails: {
    marginLeft: 8,
    justifyContent: 'center',
    maxWidth: '70%',
    marginTop: 2,
  },
  dateDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#4CAF50',
    opacity: 0.5,
    marginHorizontal: 10,
  },
  dateNumber: {
    fontSize: isTablet ? 44 : 38,
    fontWeight: 'bold',
    color: '#4CAF50',
    lineHeight: isTablet ? 50 : 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dateNumberDark: {
    color: '#4CAF50',
  },
  monthYear: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    fontWeight: '500',
    maxWidth: '100%',
  },
  monthYearDark: {
    color: '#fff',
  },
  weekday: {
    fontSize: isTablet ? 14 : 12,
    color: '#888',
    marginTop: 2,
    maxWidth: '100%',
  },
  weekdayDark: {
    color: '#aaa',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationButtonDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  locationText: {
    fontSize: isTablet ? 18 : 16,
    color: '#006400',
    marginLeft: 5,
    fontWeight: '500',
  },
  locationTextDark: {
    color: '#4CAF50',
  },
  arabicDateNumber: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet ? 44 : 38,
    lineHeight: isTablet ? 50 : 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  arabicMonthYear: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet ? 20 : 18,
  },
  arabicWeekday: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet ? 18 : 16,
  },
  arabicLocationText: {
    fontFamily: 'Scheherazade',
    fontSize: isTablet ? 22 : 20,
    marginRight: 5,
    marginLeft: 0,
  }
});

export default PrayerTimes;