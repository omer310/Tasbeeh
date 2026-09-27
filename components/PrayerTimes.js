import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, ActivityIndicator, Dimensions, Platform, AppState, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { detectPrayerLocation, describePrayerLocation } from '../services/PrayerLocationService';
import { withTimeout } from '../utils/withTimeout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import PrayerCountdownCard from './PrayerCountdownCard';
import PrayerAlertStatus from './PrayerAlertStatus';
import { settingsKey } from '../utils/prayerCache';
import { fetchPrayerDays, readPrayerCache } from '../services/PrayerTimesService';
import { dateKey, prayerDate } from '../utils/prayerNotifications';
import { calendarMonth, loadCalendarMonth } from '../services/CalendarService';
import { savePrayerPreference, savePrayerTimeSettings } from '../services/PrayerSettingsService';
import { formatPrayerTime } from '../utils/prayerSettings';
import { publishPrayerWidgetData } from '../utils/prayerWidgetEvents';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = SCREEN_WIDTH >= 768; // Common tablet breakpoint

const PrayerTimes = ({ themeColors, language, registerForPushNotificationsAsync, isDarkMode, navigation, onInitialReady }) => {
  const { height: viewportHeight } = useWindowDimensions();
  const compactPage = viewportHeight < 740;
  const countdownHeight = viewportHeight < 680 ? 98 : compactPage ? 110 : 126;
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const prayerTimesRef = useRef(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const prayerCacheRef = useRef({});
  const requestId = useRef(0);
  const fetching = useRef(false);
  const ready = useRef(false);
  const initialReadySent = useRef(false);
  const lastRefresh = useRef(0);
  const settingsRef = useRef(null);
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
  const [calendarDays, setCalendarDays] = useState(() => calendarMonth(new Date()));
  const calendarDate = format(new Date(), 'dd-MM-yyyy');
  const todayHijri = (calendarDays.find(day => day.gregorian.date === calendarDate) || calendarMonth(new Date()).find(day => day.gregorian.date === calendarDate))?.hijri;
  const hijriDate = todayHijri && { ...todayHijri, month: language === 'ar' ? todayHijri.month.ar : todayHijri.month.en };

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

  useEffect(() => {
    let active = true;
    loadCalendarMonth(new Date()).then(days => { if (active) setCalendarDays(days); }).catch(() => {});
    return () => { active = false; };
  }, [calendarDate]);

  useEffect(() => {
    if (isLoading || initialReadySent.current) return;
    // Reveal the already rendered home (or its recovery controls) after its first frame.
    const frame = requestAnimationFrame(() => { initialReadySent.current = true; onInitialReady?.(); });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, onInitialReady]);

  const tick = useEffectEvent(() => updateNextPrayerAndCountdown());
  const resume = useEffectEvent(async (fromBackground = false) => {
    if (!ready.current || fetching.current) return;
    try {
      const [raw, alerts] = await Promise.all([AsyncStorage.getItem('prayerTimeSettings'), loadNotificationPreferences()]);
      if (!ready.current || fetching.current) return;
      const saved = JSON.parse(raw || '{}');
      const next = { ...settingsRef.current, ...saved };
      const changed = settingsKey(next) !== settingsKey(settingsRef.current || {}) || next.autoDetectLocation !== settingsRef.current?.autoDetectLocation;
      setPlayAdhan(alerts.enabled); setAdhanPreferences(alerts.preferences);
      setSettings(next);
      const today = dateKey(new Date(), prayerTimesRef.current?._timeZone);
      if (fromBackground || changed || !prayerCacheRef.current[today] || Date.now() - lastRefresh.current > 5 * 60 * 1000) {
        fetchPrayerTimes(next);
      } else {
        updateNextPrayerAndCountdown();
      }
    } catch (e) { setError(e.message); }
  });
  useEffect(() => {
    let active = true;
    const setup = async () => {
      try {
        const [raw, stored] = await withTimeout(Promise.all([
          AsyncStorage.getItem('prayerTimeSettings'), loadNotificationPreferences(),
        ]), 10000, 'Saved prayer settings could not be loaded. Please retry.');
        const saved = JSON.parse(raw || '{}');
        const initial = { ...settings, ...saved };
        if (!active) return;
        settingsRef.current = initial;
        setSettings(initial); setAdhanPreferences(stored.preferences); setPlayAdhan(stored.enabled);
        const cache = await withTimeout(readPrayerCache(initial), 5000, 'Saved prayer times could not be loaded. Please retry.');
        if (!active) return;
        applyCache(cache);
        if (prayerTimesRef.current) setIsLoading(false);
        ready.current = true;
        await fetchPrayerTimes(initial);
      } catch (e) {
        if (active) { setError(e.message); setIsLoading(false); }
      }
    };
    setup();
    const unfocus = navigation?.addListener('focus', () => resume());
    const timer = setInterval(() => {
      if (navigation?.isFocused() !== false && AppState.currentState === 'active') tick();
    }, 1000);
    let lastState = AppState.currentState;
    const listener = AppState.addEventListener('change', state => {
      const returning = state === 'active' && lastState === 'background';
      lastState = state;
      if (returning) resume(true);
    });
    return () => { unfocus?.(); active = false; ready.current = false; requestId.current++; clearInterval(timer); listener.remove(); };
  }, []);

  const applyCache = cache => {
    publishPrayerWidgetData(settingsRef.current || {}, cache);
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
    fetching.current = true;
    // This function runs only from effects and user actions, never during render.
    // eslint-disable-next-line react-hooks/purity
    lastRefresh.current = Date.now();
    try {
      setError(null); setIsLoading(true);
      await withTimeout(updatePrayerTimesCache(nextSettings, id), 35000,
        'Loading took too long. Choose a city or retry your connection.');
    } catch (e) {
      if (id === requestId.current) setError(e.message || 'Unable to refresh prayer times.');
    } finally {
      if (id === requestId.current) { fetching.current = false; setIsLoading(false); requestId.current++; }
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
    const upcoming = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
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

  const handleSettingsChange = async (newSettings) => {
    const previous = settingsRef.current || settings;
    const id = ++requestId.current;
    fetching.current = true;
    try {
      const result = await savePrayerTimeSettings({ ...previous, ...newSettings }, previous);
      if (id !== requestId.current) return;
      settingsRef.current = result.settings;
      setSettings(result.settings);
      if (result.cache) {
        applyCache(result.cache);
        setError(null);
        setAlertError(result.alertError);
        setScheduleVersion(value => value + 1);
      }
    } finally {
      if (id === requestId.current) { fetching.current = false; setIsLoading(false); requestId.current++; }
    }
  };

  const formatTime = time => formatPrayerTime(time, settings.timeFormat, language);
  const renderPrayerTime = prayer => {
    const active = nextPrayer === prayer;
    return <TouchableOpacity key={prayer} accessibilityRole="button" accessibilityLabel={`${prayer}, ${formatTime(prayerTimes[prayer])}. Adhan options`} onPress={() => { setSelectedPrayer(prayer); setAdhanModalVisible(true); }}
      style={[styles.prayerRow, { flex: 1, minHeight: 0, paddingVertical: compactPage ? 4 : 7, backgroundColor: active ? (isDarkMode ? '#254438' : '#EAF4ED') : themeColors.cardColor, borderColor: active ? '#8DBCA2' : themeColors.separatorColor }]}>
      <View style={[styles.prayerIcon, { width: compactPage ? 32 : 42, height: compactPage ? 32 : 42, backgroundColor: active ? '#D5E9DC' : (isDarkMode ? '#354039' : '#F5F5EF') }]}><Image source={getPrayerIcon(prayer)} style={{ width: compactPage ? 23 : 27, height: compactPage ? 23 : 27 }} resizeMode="contain" /></View>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: themeColors.textColor, fontSize: 17, fontWeight: '600' }}>{getTranslatedText(prayer.toLowerCase())}</Text>
        {prayer === 'Fajr' && <Text style={{ color: themeColors.secondaryTextColor, fontSize: 11 }}>{getTranslatedText('sunrise')} · {formatTime(prayerTimes.Sunrise)}</Text>}
        {prayer === 'Fajr' && settings.showImsak && <Text style={{ color: themeColors.secondaryTextColor, fontSize: 11 }}>{getTranslatedText('imsak')} · {formatTime(prayerTimes.Imsak)}</Text>}
        {prayer === 'Isha' && <Text style={{ color: themeColors.secondaryTextColor, fontSize: 11 }}>{getTranslatedText('midnight')} · {formatTime(prayerTimes.Midnight)}</Text>}
      </View>
      <Text style={{ color: themeColors.textColor, fontSize: 19, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{formatTime(prayerTimes[prayer])}</Text>
      <Ionicons name="chevron-forward" size={15} color={themeColors.secondaryTextColor} />
    </TouchableOpacity>;
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
    setAdhanPreferences(previous => ({ ...previous, [prayer]: preference }));
    await savePrayerPreference(prayer, preference, reminder);
  };

  const togglePlayAdhan = async () => {
    const next = !playAdhan;
    try {
      await AsyncStorage.setItem('playAdhan', JSON.stringify(next));
      setPlayAdhan(next);
      if (next) await requestNotificationPermissions();
      await refreshAlerts();
    } catch (e) { setAlertError(e.message || 'Could not update prayer alerts. Please try again.'); }
  };

  const updatePrayerTimesCache = async (nextSettings = settings, id) => {
    let resolved = { ...nextSettings };
    const automatic = resolved.autoDetectLocation !== false;
    if (automatic) {
      try {
        const coords = await detectPrayerLocation();
        resolved = { ...resolved, latitude: coords.latitude, longitude: coords.longitude, city: '', country: '' };
        resolved.location = await describePrayerLocation(coords);
      } catch (e) {
        if (resolved.latitude == null || resolved.longitude == null) throw e;
        // Keep cached timings usable if GPS is temporarily unavailable.
        if (!resolved.location || /^[\d. ,+-]+$/.test(resolved.location)) resolved.location = 'Current location';
      }
    } else if (!(resolved.city?.trim() && resolved.country?.trim()) && (resolved.latitude == null || resolved.longitude == null)) {
      throw new Error('Choose a city and country to load prayer times.');
    }
    if (id !== requestId.current) return;
    if (resolved.city && resolved.country) resolved.location = `${resolved.city}, ${resolved.country}`;
    if (settingsKey(resolved) !== settingsKey(settingsRef.current || {})) { applyCache({}); await cancelAllScheduledNotifications(); }
    if (id !== requestId.current) return;
    settingsRef.current = resolved;
    setSettings(resolved);
    await AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(resolved));
    const savedCache = await readPrayerCache(resolved);
    if (id !== requestId.current) return;
    if (Object.keys(savedCache).length) applyCache(savedCache);
    if (prayerTimesRef.current) setIsLoading(false);
    const cache = await fetchPrayerDays(resolved, { onUpdate: days => {
      if (id === requestId.current) { applyCache(days); setIsLoading(false); }
    } });
    if (id !== requestId.current) return;
    setSettings(resolved); applyCache(cache);
    setIsLoading(false);
    await AsyncStorage.multiSet([
      ['prayerTimeSettings', JSON.stringify(resolved)], ['location', resolved.location || ''],
      ['latitude', resolved.latitude == null ? '' : String(resolved.latitude)], ['longitude', resolved.longitude == null ? '' : String(resolved.longitude)],
    ]);
    if (id === requestId.current) await refreshAlerts(cache, id);
  };

  const locationName = settings.location && !/^[\d. ,+-]+$/.test(settings.location) ? settings.location : (language === 'ar' ? 'الموقع الحالي' : 'Current location');
  return <View style={{ flex: 1, backgroundColor: themeColors.backgroundColor, paddingTop: insets.top + 6 }}>
    <View style={styles.page}>
      <View style={styles.topRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change prayer location" onPress={() => setSettingsModalVisible(true)} style={[styles.location, { flex: 1 }]}>
          <Ionicons name="location-outline" size={19} color={themeColors.activeTabColor} /><Text numberOfLines={1} style={{ color: themeColors.textColor, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{locationName}</Text><Ionicons name="chevron-down" size={14} color={themeColors.secondaryTextColor} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Prayer settings" onPress={() => setSettingsModalVisible(true)} style={styles.settingsButton}><Ionicons name="options-outline" color={themeColors.activeTabColor} size={23} /></TouchableOpacity>
      </View>
      <View style={styles.dateRow}>
        <View style={[styles.dateColumn, { backgroundColor: themeColors.cardColor, borderColor: themeColors.separatorColor }]}>
          <Text style={[styles.dateNumber, { color: themeColors.textColor }]}>{language === 'ar' ? convertToArabicNumbers(new Date().getDate()) : new Date().getDate()}</Text>
          <View style={styles.dateText}><Text numberOfLines={1} style={{ color: themeColors.textColor, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })}</Text><Text style={{ color: themeColors.secondaryTextColor, fontSize: 11, textAlign: 'center' }}>{new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' })}</Text></View>
        </View>
        <View style={[styles.dateColumn, { backgroundColor: themeColors.cardColor, borderColor: themeColors.separatorColor }]}>
          <Text style={[styles.dateNumber, { color: themeColors.activeTabColor }]}>{hijriDate ? (language === 'ar' ? convertToArabicNumbers(hijriDate.day) : hijriDate.day) : '—'}</Text>
          <View style={styles.dateText}><Text numberOfLines={2} style={{ color: themeColors.textColor, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{hijriDate?.month || (language === 'ar' ? 'التاريخ الهجري' : 'Hijri date')}</Text><Text style={{ color: themeColors.secondaryTextColor, fontSize: 11, textAlign: 'center' }}>{hijriDate ? `${language === 'ar' ? convertToArabicNumbers(hijriDate.year) : hijriDate.year} ${language === 'ar' ? 'هـ' : 'AH'}` : ''}</Text></View>
        </View>
      </View>
      {prayerTimes ? <>
        <PrayerCountdownCard prayer={nextPrayer || 'Fajr'} label={`${getTranslatedText('nextPrayer')} · ${getTranslatedText((nextPrayer || 'Fajr').toLowerCase())}`} countdown={countdown || (language === 'ar' ? '٠٠:٠٠:٠٠' : '00:00:00')} dark={isDarkMode} height={countdownHeight} />
        {!!error && <TouchableOpacity onPress={() => fetchPrayerTimes()} style={{ paddingVertical: 10 }}><Text style={{ color: themeColors.errorColor, fontSize: 12 }}>{error} Tap to retry.</Text></TouchableOpacity>}
        {!!alertError && <TouchableOpacity accessibilityRole="button" onPress={() => refreshAlerts()} style={{ paddingVertical: 8 }}><Text style={{ color: themeColors.errorColor, fontSize: 12 }}>{language === 'ar' ? 'تعذّر تحديث تنبيهات الصلاة. اضغط لإعادة المحاولة.' : 'Prayer alerts could not be updated. Tap to retry.'}</Text></TouchableOpacity>}
        <View style={styles.prayers}>{['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(renderPrayerTime)}</View>
      </> : <View style={styles.empty}>
        {isLoading ? <ActivityIndicator color={themeColors.activeTabColor} /> : <Ionicons name="location-outline" color={themeColors.activeTabColor} size={36} />}
        <Text style={{ color: themeColors.textColor, textAlign: 'center', lineHeight: 24 }}>{isLoading ? 'Finding prayer times for your location…' : error || 'Choose your location to get started.'}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => { requestId.current++; fetching.current = false; setIsLoading(false); setSettingsModalVisible(true); }} style={styles.recovery}><Text style={{ color: themeColors.activeTabColor }}>Choose a city instead</Text></TouchableOpacity>
        {!isLoading && <TouchableOpacity onPress={() => fetchPrayerTimes()} style={styles.recovery}><Text style={{ color: themeColors.activeTabColor }}>Try current location again</Text></TouchableOpacity>}
      </View>}
    </View>
    <PrayerTimeSettings isVisible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} themeColors={themeColors} initialSettings={settings} onSettingsChange={handleSettingsChange} language={language} />
    <AdhanPreferenceModal isVisible={adhanModalVisible} onClose={() => setAdhanModalVisible(false)} prayer={selectedPrayer} themeColors={themeColors} onPreferenceChange={handleAdhanPreferenceChange} />
  </View>;
};
const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingBottom: 88, flex: 1 }, topRow: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }, pageTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.7 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9 }, settingsButton: { padding: 10, minHeight: 44, justifyContent: 'center' },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 15, borderRadius: 19, borderWidth: 1, marginBottom: 12 }, dateRow: { flexDirection: 'row', gap: 10, marginBottom: 10, flexShrink: 0 }, dateText: { flexShrink: 1, alignItems: 'center', gap: 3 }, dateColumn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 18, borderWidth: 1, minHeight: 64 }, dateNumber: { fontSize: 31, fontWeight: '600', fontVariant: ['tabular-nums'] }, prayers: { flex: 1, gap: 7, minHeight: 0 }, prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 12, minHeight: 68, borderWidth: 1, borderRadius: 18 }, prayerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, minHeight: 0 }, recovery: { padding: 12 },
});
export default PrayerTimes;
