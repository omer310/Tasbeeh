import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, FlatList, TextInput, ActivityIndicator, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detectPrayerLocation, describePrayerLocation } from '../services/PrayerLocationService';
import { withTimeout } from '../utils/withTimeout';
import { ADJUSTABLE_PRAYERS, regionalMethod, validatePrayerSettings } from '../utils/prayerSettings';
import { PRAYER_METHODS } from '../data/prayerMethods';
import { countries } from './countries';

const prayerArabic = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
export default function PrayerTimeSettings({ isVisible, onClose, themeColors: t, initialSettings, onSettingsChange, language = 'en' }) {
  const ar = language === 'ar', tr = (en, arabic) => ar ? arabic : en;
  const [draft, setDraft] = useState({}), [picker, setPicker] = useState(null), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null), [error, setError] = useState('');
  const operation = useRef(0), saving = useRef(false), initial = useRef(initialSettings), form = useRef(null);
  useLayoutEffect(() => { initial.current = initialSettings; }, [initialSettings]);
  useEffect(() => {
    ++operation.current;
    if (isVisible) {
      const values = { showImsak: false, timeFormat: '12', calculationMethodId: 2, madhhabMethod: 1, ...initial.current };
      const countryCode = values.countryCode || countries.find(country => country.name === values.country || country.code === values.country)?.code;
      setDraft({ ...values, countryCode, autoDetectLocation: values.autoDetectLocation ?? !(values.city && values.country), adjustmentMethod: [2, 3, 4].includes(Number(values.adjustmentMethod)) ? Number(values.adjustmentMethod) : 4 });
      setError(''); setBusy(saving.current ? 'saving' : null); setPicker(null); setQuery('');
    }
    return () => { ++operation.current; };
  }, [isVisible]);
  const displayNames = useMemo(() => { try { return new Intl.DisplayNames([language], { type: 'region' }); } catch { return null; } }, [language]);
  const countryLabel = item => displayNames?.of(item.code) || item.name;
  const update = patch => { if (!saving.current) { ++operation.current; setBusy(null); setError(''); setDraft(value => ({ ...value, ...patch })); } };
  const close = () => { ++operation.current; onClose(); };
  const back = () => { if (picker) { setPicker(null); setQuery(''); } else close(); };
  const locate = async () => {
    if (saving.current) return;
    const id = ++operation.current;
    setBusy('locating'); setError('');
    try {
      const coords = await detectPrayerLocation();
      const [places, location] = await Promise.all([
        withTimeout(Location.reverseGeocodeAsync(coords), 3000, 'Address unavailable').catch(() => []), describePrayerLocation(coords),
      ]);
      if (id !== operation.current) return;
      const countryCode = places[0]?.isoCountryCode;
      setDraft(value => ({ ...value, latitude: coords.latitude, longitude: coords.longitude, autoDetectLocation: true, city: '', country: '', countryCode, location,
        ...(value.automaticSettings && countryCode ? { calculationMethodId: regionalMethod(countryCode) } : {}) }));
    } catch (e) { if (id === operation.current) setError(e.message); }
    finally { if (id === operation.current) setBusy(null); }
  };
  const save = async () => {
    if (saving.current || busy === 'locating') return;
    const id = ++operation.current;
    saving.current = true; setBusy('saving'); setError('');
    try {
      let normalized;
      try { normalized = validatePrayerSettings(draft); }
      catch (e) {
        const messages = { location: tr('Choose a country and enter its city, or use your current location.', 'اختر الدولة وأدخل المدينة أو استخدم موقعك الحالي.'), angles: tr('Fajr and Isha angles must be greater than 0 and at most 30.', 'يجب أن تكون زوايا الفجر والعشاء أكبر من صفر ولا تتجاوز ٣٠.'), adjustments: tr('Adjustments must be whole minutes between −30 and +30.', 'التعديلات دقائق صحيحة بين −٣٠ و+٣٠.'), method: tr('Choose a valid calculation method.', 'اختر طريقة حساب صحيحة.') };
        throw new Error(messages[e.code] || e.message);
      }
      await onSettingsChange(normalized);
      setDraft(normalized);
      if (id === operation.current) close();
    } catch (e) { if (id === operation.current) { setError(e.message || tr('Could not update prayer times. Please retry.', 'تعذر تحديث أوقات الصلاة. حاول مجددًا.')); form.current?.scrollTo({ y: 0, animated: true }); } }
    finally { saving.current = false; setBusy(null); }
  };
  const selectedMethod = PRAYER_METHODS.find(method => method.id === Number(draft.calculationMethodId));
  const accentText = t.isDark ? t.backgroundColor : '#fff';
  const input = [styles.input, { color: t.textColor, backgroundColor: t.inputBackground }];
  const section = label => <Text style={[styles.section, { color: t.textColor }]}>{label}</Text>;
  const choice = (label, action, selected = false) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityState={{ selected, disabled: busy === 'saving' }} disabled={busy === 'saving'} onPress={action} style={[styles.choice, { backgroundColor: selected ? t.activeTabColor : t.inputBackground }]}><Text style={{ color: selected ? accentText : t.textColor, flexShrink: 1 }}>{label}</Text></TouchableOpacity>;
  const openPicker = next => { if (saving.current) return; ++operation.current; setBusy(null); setQuery(''); setPicker(next); };
  const title = picker === 'country' ? tr('Choose country', 'اختر الدولة') : picker === 'method' ? tr('Calculation method', 'طريقة الحساب') : tr('Prayer settings', 'إعدادات الصلاة');
  return <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={back}>
    <SafeAreaView style={[styles.screen, { backgroundColor: t.backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.page}>
          <View style={[styles.header, { borderBottomColor: t.separatorColor }]}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr('Back', 'رجوع')} onPress={back} style={styles.backButton}><Ionicons name={ar ? 'arrow-forward' : 'arrow-back'} size={25} color={t.textColor} /></TouchableOpacity>
            <Text accessibilityRole="header" style={{ flex: 1, color: t.textColor, fontSize: 24, fontWeight: '700', textAlign: ar ? 'right' : 'left' }}>{title}</Text>
          </View>
          <View style={styles.body}>
    {picker ? <>
      <TextInput accessibilityLabel={tr('Search', 'بحث')} placeholder={tr('Search', 'بحث')} placeholderTextColor={t.secondaryTextColor} value={query} onChangeText={setQuery} style={input} />
      <FlatList keyboardShouldPersistTaps="handled" data={(picker === 'country' ? countries : PRAYER_METHODS).filter(item => `${item.name} ${item.ar || ''} ${item.code || ''} ${item.code ? countryLabel(item) : ''}`.toLowerCase().includes(query.toLowerCase()))} keyExtractor={item => String(item.id ?? item.code)} renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" style={[styles.listRow, { borderBottomColor: t.separatorColor }]} onPress={() => {
        if (picker === 'country') update({ country: item.name, countryCode: item.code, city: item.name === draft.country ? draft.city : '', latitude: null, longitude: null, autoDetectLocation: false, ...(draft.automaticSettings ? { calculationMethodId: regionalMethod(item.code) } : {}) });
        else update({ calculationMethodId: item.id, automaticSettings: false, fajrAngle: draft.fajrAngle || '18', ishaAngle: draft.ishaAngle || '17' });
        setPicker(null); setQuery('');
      }}><Text style={{ color: t.textColor, lineHeight: 23 }}>{picker === 'country' ? countryLabel(item) : ar ? item.ar : item.name}</Text></TouchableOpacity>} />
    </> : <>
      <ScrollView ref={form} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        {!!error && <Text accessibilityRole="alert" style={{ color: t.errorColor, lineHeight: 22 }}>{error}</Text>}
        {section(tr('Location', 'الموقع'))}
        <View style={styles.options}>{choice(tr('Current location', 'الموقع الحالي'), locate, draft.autoDetectLocation !== false)}{choice(tr('Choose a city', 'اختيار مدينة'), () => update({ autoDetectLocation: false, latitude: null, longitude: null }), draft.autoDetectLocation === false)}</View>
        {draft.autoDetectLocation !== false ? <Text style={{ color: t.secondaryTextColor }}>{busy === 'locating' ? tr('Finding your location…', 'جارٍ تحديد الموقع…') : draft.location || tr('Tap Current location to locate your phone.', 'اضغط الموقع الحالي لتحديد موقع الهاتف.')}</Text> : <>
          {choice(draft.country ? countryLabel(countries.find(c => c.name === draft.country || c.code === draft.country) || { code: draft.countryCode || 'ZZ', name: draft.country }) : tr('Choose country', 'اختر الدولة'), () => openPicker('country'))}
          <TextInput editable={busy !== 'saving'} accessibilityLabel={tr('Prayer city', 'مدينة الصلاة')} placeholder={tr('City, e.g. New York', 'المدينة، مثل الخرطوم')} placeholderTextColor={t.secondaryTextColor} value={draft.city || ''} onChangeText={city => update({ city, latitude: null, longitude: null, autoDetectLocation: false })} style={input} />
        </>}
        {section(tr('Calculation', 'الحساب'))}
        {choice(selectedMethod ? ar ? selectedMethod.ar : selectedMethod.name : tr('Choose method', 'اختر الطريقة'), () => openPicker('method'))}
        <View style={styles.toggle}><Text style={{ color: t.textColor, flex: 1 }}>{tr('Suggest method for selected country', 'اقتراح الطريقة للدولة المختارة')}</Text><Switch accessibilityLabel={tr('Suggest method for selected country', 'اقتراح الطريقة للدولة المختارة')} disabled={busy === 'saving'} value={!!draft.automaticSettings} onValueChange={automaticSettings => update({ automaticSettings, ...(automaticSettings && draft.countryCode ? { calculationMethodId: regionalMethod(draft.countryCode) } : {}) })} /></View>
        <Text style={{ color: t.textColor }}>{tr('Asr calculation', 'حساب العصر')}</Text>
        <View style={styles.options}>{choice(tr('Shafi, Maliki, Hanbali', 'الشافعي والمالكي والحنبلي'), () => update({ madhhabMethod: 1 }), Number(draft.madhhabMethod) !== 2)}{choice(tr('Hanafi', 'الحنفي'), () => update({ madhhabMethod: 2 }), Number(draft.madhhabMethod) === 2)}</View>
        <Text style={{ color: t.textColor }}>{tr('High latitude rule', 'حساب المناطق عالية العرض')}</Text>
        <View style={styles.options}>{[[2, 'Middle of night', 'منتصف الليل'], [3, 'One-seventh', 'سُبع الليل'], [4, 'Angle based', 'حسب الزاوية']].map(([id, en, arabic]) => choice(tr(en, arabic), () => update({ adjustmentMethod: id }), Number(draft.adjustmentMethod) === id))}</View>
        {Number(draft.calculationMethodId) === 99 && <View style={styles.options}>{['fajrAngle', 'ishaAngle'].map(key => <View key={key} style={{ flex: 1, gap: 8 }}><Text style={{ color: t.textColor }}>{key === 'fajrAngle' ? tr('Fajr angle', 'زاوية الفجر') : tr('Isha angle', 'زاوية العشاء')}</Text><TextInput editable={busy !== 'saving'} accessibilityLabel={key} keyboardType="decimal-pad" value={String(draft[key] || '')} onChangeText={value => update({ [key]: value })} style={input} /></View>)}</View>}
        {section(tr('Minute adjustments', 'تعديل الدقائق'))}
        <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{tr('Adjust to match your local mosque (−30 to +30 minutes).', 'عدّل الأوقات لتوافق مسجدك المحلي (من −٣٠ إلى +٣٠ دقيقة).')}</Text>
        {ADJUSTABLE_PRAYERS.map(prayer => {
          const minutes = Number(draft.prayerAdjustments?.[prayer] || 0), label = ar ? prayerArabic[prayer] : prayer;
          return <View key={prayer} style={styles.adjustment}><Text style={{ color: t.textColor, flex: 1 }}>{label}</Text>{[-1, 0, 1].map(direction => direction === 0 ? <Text key="value" style={{ color: t.textColor, minWidth: 38, textAlign: 'center' }}>{minutes > 0 ? '+' : ''}{minutes.toLocaleString(ar ? 'ar' : 'en')}</Text> : <TouchableOpacity key={direction} accessibilityRole="button" accessibilityLabel={`${direction < 0 ? tr('Decrease', 'تقليل') : tr('Increase', 'زيادة')} ${label}`} disabled={busy === 'saving' || Math.abs(minutes + direction) > 30} onPress={() => update({ prayerAdjustments: { ...draft.prayerAdjustments, [prayer]: minutes + direction } })} style={styles.step}><Ionicons name={direction < 0 ? 'remove' : 'add'} color={t.activeTabColor} size={22} /></TouchableOpacity>)}</View>;
        })}
        {choice(tr('Reset minute adjustments', 'إعادة ضبط الدقائق'), () => update({ prayerAdjustments: {} }))}
        {section(tr('Display', 'العرض'))}
        <View style={styles.options}>{choice(tr('12-hour', '١٢ ساعة'), () => update({ timeFormat: '12' }), draft.timeFormat !== '24')}{choice(tr('24-hour', '٢٤ ساعة'), () => update({ timeFormat: '24' }), draft.timeFormat === '24')}</View>
        <View style={styles.toggle}><Text style={{ color: t.textColor, flex: 1 }}>{tr('Show Imsak with Fajr', 'إظهار الإمساك مع الفجر')}</Text><Switch accessibilityLabel={tr('Show Imsak with Fajr', 'إظهار الإمساك مع الفجر')} disabled={busy === 'saving'} value={!!draft.showImsak} onValueChange={showImsak => update({ showImsak })} /></View>
        <Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 20 }}>{tr('Confirm the calculation method with your local mosque. Tap a prayer on the home page for its sound and reminder.', 'تحقق من طريقة الحساب مع مسجدك المحلي. اضغط على الصلاة في الصفحة الرئيسية لضبط صوتها والتذكير.')}</Text>
      </ScrollView>
      <TouchableOpacity accessibilityRole="button" disabled={!!busy} onPress={save} style={[styles.save, { backgroundColor: t.activeTabColor, opacity: busy ? 0.7 : 1 }]}>{!!busy && <ActivityIndicator color={accentText} />}<Text style={{ color: accentText, fontWeight: '700' }}>{busy === 'saving' ? tr('Updating prayer times…', 'جارٍ تحديث أوقات الصلاة…') : tr('Save settings', 'حفظ الإعدادات')}</Text></TouchableOpacity>
    </>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }, header: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 }, backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, body: { flex: 1, minHeight: 0, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 12, gap: 14 }, form: { gap: 16, paddingBottom: 24 }, section: { fontSize: 17, fontWeight: '700', marginTop: 14 }, input: { padding: 13, borderRadius: 12, fontSize: 16, minHeight: 48 }, choice: { padding: 13, borderRadius: 12, minHeight: 44, justifyContent: 'center' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, listRow: { padding: 16, borderBottomWidth: 1 }, toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, save: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, flexShrink: 0 }, adjustment: { flexDirection: 'row', alignItems: 'center' }, step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
