import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, ActivityIndicator, Dimensions, Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  schedulePrayerNotifications,
  requestNotificationPermissions,
  cancelAllScheduledNotifications,
  loadNotificationPreferences,
} from '../services/NotificationService';
import PrayerTimeSettings from './PrayerTimeSettings';
import AdhanPreferenceModal from './AdhanPreferencesModal';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import PrayerAlertStatus from './PrayerAlertStatus';
import { settingsKey } from '../utils/prayerCache';
import { fetchPrayerDays, readPrayerCache } from '../services/PrayerTimesService';
import { dateKey, prayerDate } from '../utils/prayerNotifications';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = SCREEN_WIDTH >= 768; // Common tablet breakpoint

const PrayerTimes = ({ themeColors, language, registerForPushNotificationsAsync, isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const prayerTimesRef = useRef(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const prayerCacheRef = useRef({});
  const requestId = useRef(0);
  const [alertError, setAlertError] = useState(null);
  const [scheduleVersion, setScheduleVersion] = useState(0);
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
  const [hijriDate, setHijriDate] = useState(null);

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


  const getTranslatedText = (key) => {
    return translations[key]?.[language] || key;
  };

  // Add this helper function after the translations object
  const convertToArabicNumbers = (str) => {
    if (!str) return str;
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.toString().replace(/[0-9]/g, (w) => arabicNumbers[w]);
  };

  const fetchHijriDate = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`, { timeout: 12000 });
      
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
      console.warn('Hijri date unavailable:', error.message);
    }
  };

  useEffect(() => {
    fetchHijriDate();
  }, [language]);

  const tick = useEffectEvent(() => updateNextPrayerAndCountdown());
  const resume = useEffectEvent(() => fetchPrayerTimes(settings));
  useEffect(() => {
    let active = true;
    const setup = async () => {
      try {
        const saved = JSON.parse(await AsyncStorage.getItem('prayerTimeSettings') || '{}');
        const initial = { ...settings, ...saved };
        const stored = await loadNotificationPreferences();
        if (!active) return;
        setSettings(initial); setAdhanPreferences(stored.preferences); setPlayAdhan(stored.enabled);
        const cache = await readPrayerCache(initial);
        if (!active) return;
        applyCache(cache);
        if (prayerTimesRef.current) setIsLoading(false);
        await fetchPrayerTimes(initial);
      } catch (e) {
        if (active) { setError(e.message); setIsLoading(false); }
      }
    };
    setup();
    const timer = setInterval(() => tick(), 1000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') resume(); });
    return () => { active = false; requestId.current++; clearInterval(timer); listener.remove(); };
  }, []);

  const applyCache = cache => {
    prayerCacheRef.current = cache;
    prayerTimesRef.current = cache[dateKey(new Date(), Object.values(cache)[0]?._timeZone)] || null;
    setPrayerTimes(prayerTimesRef.current);
    updateNextPrayerAndCountdown();
  };

  const refreshAlerts = async (cache = prayerCacheRef.current, expectedId = requestId.current) => {
    try {
      const stored = await loadNotificationPreferences();
      if (expectedId !== requestId.current) return;
      await schedulePrayerNotifications(prayerTimesRef.current, stored.preferences, stored.enabled, stored.reminders, cache);
      setAlertError(null);
    } catch (e) { setAlertError(e.message || 'Could not refresh prayer alerts.'); }
    setScheduleVersion(value => value + 1);
  };

  const fetchPrayerTimes = async (nextSettings = settings) => {
    const id = ++requestId.current;
    try {
      setError(null); setIsLoading(true);
      if (prayerTimesRef.current) void refreshAlerts(prayerCacheRef.current, id);
      await updatePrayerTimesCache(nextSettings, id);
    } catch (e) {
      if (id === requestId.current) setError(e.message || 'Unable to refresh prayer times.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  };

  const updateNextPrayerAndCountdown = () => {
    if (!prayerTimesRef.current) return;
    const currentDay = dateKey(new Date(), prayerTimesRef.current._timeZone);
    if (!prayerCacheRef.current[currentDay]) {
      prayerTimesRef.current = null; setPrayerTimes(null); setError('Today’s prayers need refreshing.');
      fetchPrayerTimes(); return;
    }
    prayerTimesRef.current = prayerCacheRef.current[currentDay];
    setPrayerTimes(prayerTimesRef.current);
    const next = getNextPrayer(prayerTimesRef.current);
    setNextPrayer(next);
    const countdownTime = getCountdown(next, prayerTimesRef.current);
    setCountdown(language === 'ar' ? convertToArabicNumbers(countdownTime) : countdownTime);
  };

  const getNextPrayer = (times) => {
    const now = new Date();
    const day = new Date(`${dateKey(now, times._timeZone)}T12:00:00`);
    const upcoming = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Midnight']
      .map(prayer => ({ prayer, date: prayerDate(times[prayer], day, times._timeZone) }))
      .filter(item => item.date && item.date > now).sort((a, b) => a.date - b.date);
    return upcoming[0]?.prayer || 'Fajr';
  };

  const getCountdown = (prayer, times) => {
    const now = new Date();
    const day = new Date(`${dateKey(now, times._timeZone)}T12:00:00`);
    let target = prayerDate(times[prayer], day, times._timeZone);
    if (!target) return '00:00:00';
    if (target <= now) {
      day.setDate(day.getDate() + 1);
      const tomorrow = prayerCacheRef.current[dateKey(day)] || times;
      target = prayerDate(tomorrow[prayer], day, tomorrow._timeZone);
    }
    const seconds = Math.max(0, Math.floor((target - now) / 1000));
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
      .map(value => String(value).padStart(2, '0')).join(':');
  };

  const handleSettingsChange = (newSettings) => {
    if (settingsKey(newSettings) !== settingsKey(settings)) {
      applyCache({});
      cancelAllScheduledNotifications().catch(e => setAlertError(e.message));
    }
    setSettings(newSettings);
    AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(newSettings));
    fetchPrayerTimes(newSettings);
  };

  const renderPrayerTime = (prayer) => {
    if (!prayerTimes) return null;
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
      if (prayerTimes['Midnight']) {
        return prayerTimes['Midnight'];
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
                name="time-outline"
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
                {getTranslatedText('sunrise')} {convertTo12Hour(prayerTimes['Sunrise'])}
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
          {convertTo12Hour(prayerTimes[prayer])}
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

  const handleAdhanPreferenceChange = async (prayer, preference, reminder) => {
    const newPreferences = { ...adhanPreferences, [prayer]: preference };
    setAdhanPreferences(newPreferences);
    await AsyncStorage.setItem('adhanPreferences', JSON.stringify(newPreferences));
    await AsyncStorage.setItem(`adhan_preference_${prayer}`, preference);
    if (reminder) await AsyncStorage.setItem(`reminder_preference_${prayer}`, reminder);
    if (playAdhan) await requestNotificationPermissions();
    await refreshAlerts();
  };

  const togglePlayAdhan = async () => {
    const next = !playAdhan;
    setPlayAdhan(next);
    await AsyncStorage.setItem('playAdhan', JSON.stringify(next));
    if (next) await requestNotificationPermissions();
    await refreshAlerts();
  };

  const updatePrayerTimesCache = async (nextSettings = settings, id) => {
    let resolved = { ...nextSettings };
    if (!(resolved.city?.trim() && resolved.country?.trim()) && (resolved.latitude == null || resolved.longitude == null)) {
      if (Platform.OS === 'web') throw new Error('Choose your location in Settings to load prayer times.');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location access is off. Choose your location in Settings.');
      let timeout;
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Location took too long. Choose a city in Settings.')), 12000); }),
      ]).finally(() => clearTimeout(timeout));
      resolved = { ...resolved, latitude: location.coords.latitude, longitude: location.coords.longitude };
      resolved.location = `${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`;
    }
    if (resolved.city && resolved.country) resolved.location = `${resolved.city}, ${resolved.country}`;
    const cache = await fetchPrayerDays(resolved);
    if (id !== requestId.current) return;
    setSettings(resolved); applyCache(cache);
    setIsLoading(false);
    await AsyncStorage.multiSet([
      ['prayerTimeSettings', JSON.stringify(resolved)], ['location', resolved.location || ''],
      ['latitude', resolved.latitude == null ? '' : String(resolved.latitude)], ['longitude', resolved.longitude == null ? '' : String(resolved.longitude)],
    ]);
    if (id === requestId.current) void refreshAlerts(cache, id);
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
        {isLoading && !prayerTimes ? (
          <ActivityIndicator size="large" color={themeColors.activeTabColor} />
        ) : error && !prayerTimes ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.errorColor }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchPrayerTimes()}>
              <Text style={[styles.retryButtonText, { color: themeColors.activeTabColor }]}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={() => setSettingsModalVisible(true)}>
              <Text style={[styles.retryButtonText, { color: themeColors.activeTabColor }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        ) : prayerTimes ? (
          <>
            {!!error && <TouchableOpacity onPress={() => fetchPrayerTimes()} style={{ padding: 10 }}><Text style={{ color: themeColors.errorColor }}>{error} Tap to retry.</Text></TouchableOpacity>}
            <PrayerAlertStatus themeColors={themeColors} enabled={playAdhan} onToggle={togglePlayAdhan} refreshKey={scheduleVersion} onRefresh={() => refreshAlerts()} />
            {!!alertError && Platform.OS !== 'web' && <Text style={{ color: themeColors.errorColor, paddingHorizontal: 20, fontSize: 12 }}>{alertError}</Text>}
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