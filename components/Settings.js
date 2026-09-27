import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, AppState, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader, OptionSheet, ui } from './ScreenUI';
import PrayerTimeSettings from './PrayerTimeSettings';
import PrayerAlertStatus from './PrayerAlertStatus';
import AdhanPreferencesModal from './AdhanPreferencesModal';
import HomeWidgetSettings from './HomeWidgetSettings';
import { loadNotificationPreferences } from '../services/NotificationService';
import { refreshSavedPrayerAlerts, savePrayerPreference, savePrayerAlertsEnabled, savePrayerTimeSettings } from '../services/PrayerSettingsService';

export default function Settings({ appearanceMode = 'system', changeAppearance, themeColors: t, language, changeLanguage }) {
  const [sheet, setSheet] = useState(null);
  const [prayer, setPrayer] = useState(null);
  const [location, setLocation] = useState({});
  const [alerts, setAlerts] = useState({ enabled: true, preferences: {} });
  const [error, setError] = useState('');
  const [alertError, setAlertError] = useState(null);
  const [version, setVersion] = useState(0);
  const preferenceRevision = useRef(0);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  useEffect(() => { setSelectedLanguage(language); }, [language]);
  const ar = selectedLanguage === 'ar';
  const load = async () => {
    const id = preferenceRevision.current;
    try { setLocation(JSON.parse(await AsyncStorage.getItem('prayerTimeSettings') || '{}')); const saved = await loadNotificationPreferences(); if (preferenceRevision.current === id) setAlerts(saved); }
    catch { setError('Could not load your settings. Please try again.'); }
  };
  useEffect(() => { load(); const sub = AppState.addEventListener('change', state => { if (state === 'active') { load(); setVersion(v => v + 1); } }); return () => sub.remove(); }, []);
  const attempt = async action => { try { setError(''); await action(); } catch (e) { setError(e.message); } };
  const refresh = async () => { await refreshSavedPrayerAlerts(); setAlertError(null); await load(); setVersion(v => v + 1); };
  const saveLocation = async value => {
    setError('');
    const result = await savePrayerTimeSettings(value, location);
    setLocation(result.settings); setAlertError(result.alertError); setVersion(v => v + 1);
  };
  const toggleAlerts = async enabled => {
    const id = ++preferenceRevision.current;
    setAlerts(previous => ({ ...previous, enabled })); setError('');
    try { await savePrayerAlertsEnabled(enabled); if (preferenceRevision.current === id) setVersion(v => v + 1); }
    catch (e) { if (preferenceRevision.current === id) setError(e.message); }
  };
  const row = (icon, label, detail, onPress) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[ui.row, { backgroundColor: t.cardColor }]}>
    <View style={[styles.icon, { backgroundColor: t.inputBackground }]}><Ionicons name={icon} color={t.activeTabColor} size={21} /></View><View style={{ flex: 1, gap: 4 }}><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{label}</Text>{!!detail && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{detail}</Text>}</View><Ionicons name="chevron-forward" color={t.secondaryTextColor} size={17} />
  </TouchableOpacity>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <PageHeader title={ar ? 'الإعدادات' : 'Settings'} subtitle={ar ? 'على طريقتك' : 'Make yourself at home'} theme={t} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: t.secondaryTextColor }]}>{ar ? 'الصلاة' : 'PRAYER & LOCATION'}</Text>
      {row('location-outline', ar ? 'الموقع ومواقيت الصلاة' : 'Location & prayer times', location.autoDetectLocation !== false ? (ar ? 'الموقع الحالي · تلقائي' : 'Current location · automatic') : location.location || 'Choose a city', () => { setSheet('location'); void load(); })}
      {row('notifications-outline', ar ? 'الأذان والتنبيهات' : 'Adhan & notifications', ar ? 'الأصوات والتذكيرات والأذونات' : 'Sounds, reminders and permissions', () => { setSheet('alerts'); void load(); })}
      <Text style={[styles.label, { color: t.secondaryTextColor }]}>{ar ? 'المظهر' : 'APPEARANCE'}</Text>
      {row('moon-outline', ar ? 'المظهر' : 'Appearance', ({ system: ar ? 'حسب إعداد الجهاز' : 'Use device setting', light: ar ? 'فاتح' : 'Light', dark: ar ? 'داكن' : 'Dark' })[appearanceMode], () => setSheet('appearance'))}
      {row('language-outline', ar ? 'اللغة' : 'Language', ar ? 'العربية' : 'English', () => setSheet('language'))}
      {Platform.OS === 'android' && row('grid-outline', ar ? 'أدوات الشاشة الرئيسية' : 'Home screen widgets', ar ? 'الصلاة القادمة · قراءة الأدعية' : 'Next prayer · Read your Duas', () => setSheet('widgets'))}
      {!!error && <Text accessibilityRole="alert" style={{ color: t.errorColor, lineHeight: 22 }}>{error}</Text>}
      {!!alertError && <TouchableOpacity accessibilityRole="button" onPress={() => void attempt(refresh)} style={{ paddingVertical: 12 }}><Text style={{ color: t.errorColor, lineHeight: 22 }}>{ar ? 'تعذّر تحديث تنبيهات الصلاة. اضغط لإعادة المحاولة.' : 'Prayer alerts could not be updated. Tap to retry.'}</Text></TouchableOpacity>}
      <View style={styles.about}><Ionicons name="sparkles-outline" color={t.activeTabColor} size={24} /><Text style={{ color: t.textColor, fontSize: 18, fontWeight: '600' }}>{ar ? 'منارة المسلم' : 'Manarat al-Muslim'}</Text><Text style={{ color: t.secondaryTextColor, textAlign: 'center', lineHeight: 22 }}>{ar ? 'رفيقك للصلاة والقرآن والذكر.' : 'A little space for prayer, reading and remembrance.'}</Text></View>
    </ScrollView>
    {Platform.OS === 'android' && <HomeWidgetSettings visible={sheet === 'widgets'} onClose={() => setSheet(null)} theme={t} language={selectedLanguage} />}
    <OptionSheet visible={sheet === 'appearance'} title={ar ? 'المظهر' : 'Appearance'} theme={t} onClose={() => setSheet(null)}>
      {[['system', ar ? 'حسب إعداد الجهاز' : 'Use device setting'], ['light', ar ? 'فاتح' : 'Light'], ['dark', ar ? 'داكن' : 'Dark']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked: appearanceMode === id }} onPress={() => { setSheet(null); void attempt(() => changeAppearance(id)); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.textColor, flex: 1, fontSize: 18 }}>{label}</Text>{appearanceMode === id && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={23} />}</TouchableOpacity>)}
    </OptionSheet>
    <OptionSheet visible={sheet === 'language'} title={ar ? 'اللغة' : 'Language'} theme={t} onClose={() => setSheet(null)}>
      {[['en', 'English'], ['ar', 'العربية']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selectedLanguage === id }} onPress={() => { setSelectedLanguage(id); setSheet(null); void attempt(() => changeLanguage(id)); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.textColor, flex: 1, fontSize: 18 }}>{label}</Text>{selectedLanguage === id && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={23} />}</TouchableOpacity>)}
    </OptionSheet>
    <PrayerTimeSettings isVisible={sheet === 'location'} initialSettings={location} themeColors={t} language={selectedLanguage} onClose={() => setSheet(null)} onSettingsChange={saveLocation} />
    <OptionSheet visible={sheet === 'alerts' && !prayer} title={ar ? 'الأذان والتنبيهات' : 'Adhan & notifications'} theme={t} onClose={() => setSheet(null)}>
      <PrayerAlertStatus themeColors={t} enabled={alerts.enabled} refreshKey={version} onRefresh={refresh} onToggle={toggleAlerts} />
      <Text style={{ color: t.secondaryTextColor, fontSize: 13, lineHeight: 21 }}>Choose a sound and reminder for each prayer. Vibrate gives a vibration-only alert, Silent shows a quiet notification, and None turns the main alert off. Advance reminders are separate.</Text>
      {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(name => <React.Fragment key={name}>{row('volume-medium-outline', name, alerts.preferences[name] || 'Adhan (Madina)', () => setPrayer(name))}</React.Fragment>)}
      {!!error && <Text style={{ color: t.errorColor }}>{error}</Text>}
    </OptionSheet>
    <AdhanPreferencesModal isVisible={!!prayer} prayer={prayer} themeColors={t} onClose={() => setPrayer(null)} onPreferenceChange={async (name, preference, reminder) => { ++preferenceRevision.current; setAlerts(a => ({ ...a, preferences: { ...a.preferences, [name]: preference } })); await savePrayerPreference(name, preference, reminder); setVersion(v => v + 1); }} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 92, gap: 10 }, label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 14, marginBottom: 2 }, icon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, about: { alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 28, paddingBottom: 10, paddingHorizontal: 18 } });
