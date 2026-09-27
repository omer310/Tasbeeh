import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, AppState, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { requestNotificationPermissions } from '../services/NotificationService';
import { androidPrayerAlarm, getAndroidAlarmStatus } from '../services/AndroidPrayerAlarm';
import { detectPrayerLocation, describePrayerLocation } from '../services/PrayerLocationService';
import slides from '../data/onboardingSlides';
import OnboardingArtwork from './OnboardingArtwork';
import PrayerTimeSettings from './PrayerTimeSettings';

const DEFAULT_LOCATION = { autoDetectLocation: true, calculationMethodId: 2 };
export default function Onboarding({ onComplete, changeLanguage, themeColors: t, language = 'en' }) {
  const { width, height } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState(width);
  const [step, setStep] = useState(0), [selected, setSelected] = useState(language);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [manual, setManual] = useState(false), [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const [error, setError] = useState(null), [status, setStatus] = useState(null), [allowed, setAllowed] = useState(false);
  const pager = useRef(null), current = useRef(0), working = useRef(false), mounted = useRef(true);
  const languageWrite = useRef(Promise.resolve()), languageVersion = useRef(0);
  const ar = selected === 'ar', compact = height < 740;
  const artHeight = Math.min(compact ? 218 : 300, Math.max(150, height * 0.32));
  const artWidth = Math.min(pageWidth - 48, 430);
  const alertsReady = allowed && (Platform.OS !== 'android' || status?.exact);
  useEffect(() => {
    mounted.current = true;
    const refreshPermissions = async () => {
      const [alarm, permission] = await Promise.all([getAndroidAlarmStatus(), Notifications.getPermissionsAsync()]);
      if (mounted.current) { setStatus(alarm); setAllowed(permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL); }
    };
    AsyncStorage.getItem('prayerTimeSettings').then(raw => {
      if (!mounted.current) return;
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) setLocation({ ...DEFAULT_LOCATION, ...saved });
      setReady(true);
    }).catch(() => { if (mounted.current) setError({ step: 0, text: 'Your preferences could not be loaded. Reopen the app to try again.' }); });
    refreshPermissions().catch(() => {});
    const sub = AppState.addEventListener('change', state => { if (state === 'active') refreshPermissions().catch(() => {}); });
    return () => { mounted.current = false; sub.remove(); };
  }, []);
  useEffect(() => { pager.current?.scrollToOffset({ offset: current.current * pageWidth, animated: false }); }, [pageWidth]);
  const attempt = async action => {
    if (working.current || !ready) return;
    working.current = true; setBusy(true); setError(null);
    const sourceStep = current.current;
    try { await action(); }
    catch (e) { if (mounted.current) setError({ step: sourceStep, text: e.message || (ar ? 'تعذر الحفظ. حاول مرة أخرى.' : 'Could not save. Please try again.') }); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  };
  const saveLocation = async value => { await AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(value)); setLocation(value); };
  const locate = () => attempt(async () => {
    const coords = await detectPrayerLocation(), name = await describePrayerLocation(coords);
    await saveLocation({ ...location, latitude: coords.latitude, longitude: coords.longitude, location: name, autoDetectLocation: true, city: '', country: '' });
  });
  const enableAlerts = () => attempt(async () => {
    const granted = await requestNotificationPermissions();
    setAllowed(granted); await AsyncStorage.setItem('playAdhan', String(granted));
    if (!granted) { setError({ step: 3, text: ar ? 'يمكنك تفعيل التنبيهات لاحقاً من الإعدادات.' : 'You can enable notifications later in Settings.' }); return; }
    const next = await getAndroidAlarmStatus(); setStatus(next);
    if (next && !next.exact && androidPrayerAlarm) await androidPrayerAlarm.openAlarmSettings();
  });
  const move = index => {
    if (working.current || !ready) return;
    const target = Math.max(0, Math.min(slides.length - 1, index));
    current.current = target; setStep(target); pager.current?.scrollToOffset({ offset: target * pageWidth, animated: true });
  };
  const settle = event => {
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / pageWidth)));
    current.current = index; setStep(index);
  };
  const finish = () => attempt(async () => {
    await languageWrite.current;
    await changeLanguage(selected);
    await AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(location));
    await onComplete();
  });
  const selectLanguage = value => {
    if (!ready || working.current || value === selected) return;
    setSelected(value); setError(null);
    const version = ++languageVersion.current;
    // Language changes are immediate and never insert the busy spinner into
    // the centered slide. Serialize saves so rapid taps retain the last choice.
    languageWrite.current = languageWrite.current.catch(() => {}).then(() => changeLanguage(value)).catch(e => {
      if (mounted.current && version === languageVersion.current) setError({ step: 0, text: e.message || 'Could not save your language. Please try again.' });
    });
  };
  const action = (label, onPress, icon, secondary = false) => <TouchableOpacity accessibilityRole="button" disabled={busy || !ready} onPress={onPress} style={[secondary ? styles.secondary : styles.action, { backgroundColor: secondary ? 'transparent' : t.inputBackground, borderColor: t.separatorColor, opacity: busy || !ready ? 0.5 : 1 }]}>{!!icon && <Ionicons name={icon} size={20} color={t.activeTabColor} />}<Text style={{ color: t.activeTabColor, fontSize: 14, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{label}</Text></TouchableOpacity>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <View style={styles.top}><Text style={{ color: t.activeTabColor, fontSize: 18, fontWeight: '700', letterSpacing: 3 }}>MANARAT</Text><Text accessibilityLabel={`${ar ? 'الصفحة' : 'Page'} ${step + 1} ${ar ? 'من' : 'of'} ${slides.length}`} style={{ color: t.secondaryTextColor, fontSize: 12 }}>{step + 1} / {slides.length}</Text></View>
    <View style={{ flex: 1 }} onLayout={e => { const next = e.nativeEvent.layout.width; if (next > 0 && next !== pageWidth) setPageWidth(next); }}>
      <FlatList ref={pager} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false} bounces={false} scrollEnabled={ready && !busy && !manual} onMomentumScrollEnd={settle}
        keyExtractor={item => item.id} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3} removeClippedSubviews={false}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        extraData={{ selected, busy, ready, location, error, allowed, status, pageWidth, height, theme: t }}
        renderItem={({ item, index }) => <View style={{ width: pageWidth, flex: 1 }} accessibilityElementsHidden={step !== index} importantForAccessibility={step === index ? 'auto' : 'no-hide-descendants'}>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={[styles.slide, { gap: compact ? 15 : 20, paddingTop: compact ? 4 : 12 }]}>
            <View style={{ alignItems: 'center', width: '100%', marginBottom: compact ? 0 : 4 }}><OnboardingArtwork slide={item} width={artWidth} height={artHeight} /></View>
            <View style={{ gap: 10, width: '100%' }}>
              {item.id === 'language' ? <><Text style={[styles.title, { color: t.textColor, fontSize: compact ? 24 : 28 }]}>Choose Your Language</Text><Text style={{ color: t.activeTabColor, fontFamily: 'Amiri', fontSize: 28, lineHeight: 40, textAlign: 'center' }}>اختر لغتك</Text></> : <><Text accessibilityRole="header" style={[styles.title, { color: t.textColor, fontSize: compact ? 24 : 28 }]}>{ar ? item.titleAr : item.title}</Text><Text style={[styles.description, { color: t.secondaryTextColor, fontSize: compact ? 14 : 16, lineHeight: compact ? 23 : 26 }]}>{ar ? item.descriptionAr : item.description}</Text></>}
            </View>
            {item.id === 'language' && <View style={styles.languages}>{[['en', 'English'], ['ar', 'العربية']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked: selected === id }} disabled={busy || !ready} onPress={() => selectLanguage(id)} style={[styles.choice, { borderColor: selected === id ? t.activeTabColor : t.separatorColor, backgroundColor: selected === id ? (t.isDark ? '#254438' : '#EAF3ED') : t.cardColor }]}><Text style={{ color: t.textColor, fontSize: 18, fontWeight: '600' }}>{label}</Text>{selected === id && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={21} />}</TouchableOpacity>)}</View>}
            {item.id === 'prayer' && <View style={styles.controls}>{action(location.location || (ar ? 'استخدم موقعي الحالي' : 'Use my current location'), locate, location.location ? 'checkmark-circle-outline' : 'location-outline')}{action(ar ? 'اختر مدينة بدلاً من ذلك' : 'Choose a city instead', () => setManual(true), null, true)}<Text style={[styles.hint, { color: t.secondaryTextColor }]}>{ar ? 'يمكنك تغيير الموقع دائماً من صفحة الصلاة.' : 'You can always change your location on the prayer page.'}</Text></View>}
            {item.id === 'notifications' && <View style={styles.controls}>{action(alertsReady ? (ar ? 'تنبيهات الصلاة جاهزة' : 'Prayer alerts are ready') : (ar ? 'تفعيل تنبيهات الصلاة' : 'Enable prayer alerts'), enableAlerts, alertsReady ? 'checkmark-circle-outline' : 'notifications-outline')}<Text style={[styles.hint, { color: t.secondaryTextColor }]}>{Platform.OS === 'android' ? (ar ? 'فعّل الإشعارات والمنبّهات والتذكيرات لوصول الأذان في موعده. يمكنك إكمال ذلك لاحقاً من الإعدادات.' : 'Allow notifications and Alarms & reminders for on-time Adhan. You can also do this later in Settings.') : (ar ? 'يمكنك تغيير الأصوات والأذونات لاحقاً من الإعدادات.' : 'You can change sounds and permissions later in Settings.')}</Text></View>}
            {busy && step === index && <ActivityIndicator color={t.activeTabColor} />}
            {error?.step === index && <Text accessibilityRole="alert" style={{ color: t.errorColor, textAlign: 'center', lineHeight: 22 }}>{error.text}</Text>}
          </ScrollView>
        </View>} />
    </View>
    <View style={[styles.footer, { paddingTop: compact ? 8 : 14 }]}>
      <View style={styles.pagination} accessible accessibilityLabel={`${ar ? 'الصفحة' : 'Page'} ${step + 1} / ${slides.length}`}>{slides.map((item, index) => <View key={item.id} style={{ width: step === index ? 24 : 7, height: 7, borderRadius: 5, backgroundColor: step === index ? t.activeTabColor : t.separatorColor }} />)}</View>
      <TouchableOpacity accessibilityRole="button" disabled={busy || !ready} onPress={() => step === slides.length - 1 ? finish() : move(step + 1)} style={{ opacity: busy || !ready ? 0.5 : 1 }}><LinearGradient colors={t.isDark ? ['#327B5A', '#245F44'] : ['#347C5B', '#226744']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.next}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, lineHeight: 24 }}>{step === slides.length - 1 ? (ar ? 'دخول' : 'Enter') : (ar ? 'التالي' : 'Next')}</Text><Ionicons name={step === slides.length - 1 ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" /></LinearGradient></TouchableOpacity>
    </View>
    <PrayerTimeSettings isVisible={manual} initialSettings={location} themeColors={t} onClose={() => setManual(false)} onSettingsChange={saveLocation} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 18 }, slide: { paddingHorizontal: 26, paddingBottom: 20, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontWeight: '700', textAlign: 'center', lineHeight: 35 }, description: { textAlign: 'center' }, languages: { width: '100%', maxWidth: 400, gap: 10 }, choice: { borderWidth: 1.5, borderRadius: 17, paddingVertical: 15, paddingHorizontal: 20, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, controls: { gap: 4, width: '100%', maxWidth: 430 }, action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, minHeight: 49 }, secondary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 11, minHeight: 44 }, hint: { fontSize: 12, textAlign: 'center', lineHeight: 20 }, footer: { paddingHorizontal: 26, paddingBottom: 12, gap: 18 }, pagination: { flexDirection: 'row', justifyContent: 'center', gap: 7, height: 8 }, next: { minHeight: 54, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 } });
