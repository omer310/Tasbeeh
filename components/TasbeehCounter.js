import React, { useEffect, useReducer, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialTasbihState, tasbihReducer, currentTasbih } from '../utils/tasbihState';
import { PageHeader, IconButton, OptionSheet, ui } from './ScreenUI';
import TasbihCollectionEditor from './TasbihCollectionEditor';

const digits = text => text.replace(/[٠-٩۰-۹]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
const validGoal = value => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000000;
export default function TasbeehCounter({ themeColors: t, language = 'en' }) {
  const [state, dispatch] = useReducer(tasbihReducer, initialTasbihState);
  const [sheet, setSheet] = useState(null), [chooser, setChooser] = useState('dhikrs');
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState(''), [goalInput, setGoalInput] = useState('');
  const [customArabic, setCustomArabic] = useState(''), [customEnglish, setCustomEnglish] = useState('');
  const [error, setError] = useState('');
  const writing = useRef(Promise.resolve());
  const ar = language === 'ar', current = currentTasbih(state);
  const session = state.sessions[state.activeCollection];
  const collection = state.collections.find(item => item.id === state.activeCollection);
  const title = value => ar ? value.titleAr || value.title : value.title;
  useEffect(() => {
    let live = true;
    (async () => {
      const raw = await AsyncStorage.getItem('tasbih:v3') ?? await AsyncStorage.getItem('tasbih:v2');
      if (live) dispatch({ type: 'hydrate', value: raw ? JSON.parse(raw) : {} });
    })().catch(() => { if (live) setError('Your counts could not be loaded. Reopen the app to try again.'); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const saved = JSON.stringify(state);
    writing.current = writing.current.catch(() => {}).then(() => AsyncStorage.setItem('tasbih:v3', saved)).catch(() => setError('Your latest count could not be saved.'));
  }, [state]);
  useEffect(() => {
    if (!session || session.complete || current.count < current.goal || sheet || editing !== undefined) return;
    const timer = setTimeout(() => dispatch({ type: 'advance', id: state.activeCollection, index: session.index }), 300);
    return () => clearTimeout(timer);
  }, [session, current.count, current.goal, state.activeCollection, sheet, editing]);
  const count = () => { if (!state.hydrated || session?.complete || (current.goal && current.count >= current.goal)) return; Haptics.selectionAsync().catch(() => {}); dispatch({ type: 'count' }); };
  const setGoal = value => { dispatch({ type: 'goal', value }); setSheet(null); setGoalInput(''); };
  const number = value => ar ? String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]) : String(value);
  const normalize = value => value.toLowerCase().replace(/[\u064B-\u065F]/g, '');
  const inputStyle = [styles.input, { color: t.textColor, backgroundColor: t.inputBackground }];
  return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <PageHeader title={ar ? 'التسبيح' : 'Tasbih'} subtitle={ar ? 'لحظة للذكر' : 'A moment of remembrance'} theme={t}>
      <IconButton name="refresh-outline" label="Reset current dhikr count" color={t.activeTabColor} onPress={() => Alert.alert(ar ? 'إعادة العداد؟' : 'Reset this count?', ar ? 'ستبقى الأذكار الأخرى كما هي.' : 'Your other dhikr counts will stay as they are.', [{ text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' }, { text: ar ? 'إعادة' : 'Reset', onPress: () => dispatch({ type: 'reset' }) }])} />
    </PageHeader>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change dhikr or collection" disabled={!state.hydrated} onPress={() => { setQuery(''); setChooser(collection ? 'collections' : 'dhikrs'); setSheet('dhikr'); }} style={[styles.selector, { backgroundColor: t.isDark ? '#263A2F' : '#EDF4ED' }]}>
      <View style={styles.selectorTop}><Text numberOfLines={1} style={{ flex: 1, color: t.activeTabColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{collection ? title(collection) : ar ? 'الذكر الحالي' : 'CURRENT DHIKR'}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text style={{ color: t.activeTabColor, fontSize: 12 }}>{ar ? 'تغيير' : 'Change'}</Text><Ionicons name="chevron-down" size={17} color={t.activeTabColor} /></View></View>
      <Text numberOfLines={3} style={{ fontFamily: 'Amiri', fontSize: 24, lineHeight: 40, color: t.textColor, textAlign: 'center' }}>{current.ar}</Text>
      {!ar && <Text numberOfLines={2} style={{ color: t.secondaryTextColor, textAlign: 'center', fontSize: 13, lineHeight: 21 }}>{current.en}</Text>}
    </TouchableOpacity>
    <View style={styles.goalRow}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Set dhikr goal" onPress={() => { setGoalInput(''); setSheet('goal'); }} style={[styles.pill, { backgroundColor: t.inputBackground }]}><Ionicons name="flag-outline" size={15} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 12 }}>{current.goal ? `${ar ? 'الهدف' : 'Goal'} · ${number(current.goal)}` : ar ? 'حدد هدفاً' : 'Set a goal'}</Text></TouchableOpacity>
      {session && <TouchableOpacity accessibilityLabel="Pause collection" onPress={() => dispatch({ type: 'end' })} style={styles.pill}><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{number(session.index + 1)}/{number(session.steps.length)}</Text><Ionicons name="pause-circle-outline" size={20} color={t.secondaryTextColor} /></TouchableOpacity>}
      <TouchableOpacity accessibilityLabel="Read full dhikr" onPress={() => setSheet('read')} style={ui.icon}><Ionicons name="expand-outline" size={19} color={t.activeTabColor} /></TouchableOpacity>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Count dhikr. Current count ${current.count}`} disabled={!state.hydrated || !!sheet || editing !== undefined} onPress={count} activeOpacity={0.72} style={styles.counter}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 108, fontWeight: '300', color: t.activeTabColor, fontVariant: ['tabular-nums'], paddingHorizontal: 20 }}>{number(current.count)}</Text>
      <Text style={{ color: t.secondaryTextColor, fontSize: 13, marginTop: 14 }}>{session?.complete ? (ar ? 'اكتملت المجموعة' : 'Collection complete') : current.goal && current.count >= current.goal ? (session ? ar ? 'الذكر التالي…' : 'Next dhikr…' : ar ? 'اكتمل الهدف' : 'Goal reached') : ar ? 'اضغط للتسبيح' : 'Tap anywhere here to count'}</Text>
    </TouchableOpacity>
    {session?.complete && <TouchableOpacity onPress={() => dispatch({ type: 'start', id: state.activeCollection, restart: true })} style={[styles.pill, { alignSelf: 'center', backgroundColor: t.inputBackground, marginBottom: 12 }]}><Ionicons name="refresh" size={18} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{ar ? 'بدء جولة جديدة' : 'Start a new round'}</Text></TouchableOpacity>}
    {!!error && <Text style={{ color: t.errorColor, padding: 12 }}>{error}</Text>}
    <OptionSheet visible={sheet === 'dhikr'} title={ar ? 'اختر الذكر' : 'Choose your dhikr'} theme={t} onClose={() => setSheet(null)}>
      <View style={{ flexDirection: 'row', gap: 8 }}>{[['dhikrs', ar ? 'الأذكار' : 'Adhkar'], ['collections', ar ? 'المجموعات' : 'Collections']].map(([id, label]) => <TouchableOpacity key={id} onPress={() => setChooser(id)} style={[styles.pill, { flex: 1, backgroundColor: chooser === id ? '#287457' : t.inputBackground }]}><Text style={{ color: chooser === id ? '#fff' : t.textColor, fontWeight: '600' }}>{label}</Text></TouchableOpacity>)}</View>
      {chooser === 'collections' ? <>
        {state.collections.map(item => {
          const saved = state.sessions[item.id];
          return <View key={item.id} style={[styles.collectionRow, { backgroundColor: t.inputBackground }]}>
            <TouchableOpacity accessibilityLabel={`${saved && !saved.complete ? 'Resume' : 'Start'} ${title(item)}`} onPress={() => { dispatch({ type: 'start', id: item.id }); setSheet(null); }} style={{ flex: 1, padding: 16, gap: 6 }}>
              <Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{title(item)}</Text>
              <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{number(item.items.length)} {ar ? 'أذكار' : 'Adhkar'} · {saved && !saved.complete ? (ar ? 'متابعة' : 'Resume') : ar ? 'ابدأ' : 'Start'}</Text>
              {item.id === 'morning' && <Text style={{ color: t.secondaryTextColor, fontSize: 11, lineHeight: 17 }}>{ar ? 'مختارات قصيرة من حصن المسلم' : 'Short remembrances from Hisn al-Muslim'}</Text>}
            </TouchableOpacity>
            <IconButton name="create-outline" label={`Edit ${title(item)}`} color={t.activeTabColor} onPress={() => { setSheet(null); setEditing(item); }} />
          </View>;
        })}
        <TouchableOpacity onPress={() => { setSheet(null); setEditing(null); }} style={ui.primary}><Text style={styles.white}>{ar ? 'إنشاء مجموعة' : 'Create a collection'}</Text></TouchableOpacity>
      </> : <>
        <TextInput accessibilityLabel="Search dhikr" value={query} onChangeText={setQuery} placeholder={ar ? 'ابحث عن ذكر…' : 'Search dhikr…'} placeholderTextColor={t.secondaryTextColor} style={inputStyle} />
        {Object.entries(state.dhikrs).filter(([, value]) => normalize(`${value.ar} ${value.en}`).includes(normalize(query))).map(([key, value]) => <TouchableOpacity key={key} accessibilityRole="radio" accessibilityState={{ checked: !session && state.selected === key }} onPress={() => { dispatch({ type: 'select', id: key }); setSheet(null); }} style={[styles.dhikrRow, { borderColor: t.separatorColor }]}><View style={{ flex: 1, gap: 4 }}><Text style={{ color: t.textColor, fontFamily: 'Amiri', fontSize: 23, textAlign: 'right' }}>{value.ar}</Text>{!ar && <Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 20 }}>{value.en}</Text>}</View>{!session && state.selected === key && <Ionicons name="checkmark-circle" size={23} color={t.activeTabColor} />}</TouchableOpacity>)}
        <TouchableOpacity onPress={() => setSheet('add')} style={ui.primary}><Text style={styles.white}>{ar ? 'إضافة ذكر' : 'Add your own dhikr'}</Text></TouchableOpacity>
      </>}
    </OptionSheet>
    <OptionSheet visible={sheet === 'goal'} title={ar ? 'هدف التسبيح' : 'A goal for this dhikr'} theme={t} onClose={() => setSheet(null)}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{(session ? [33, 99, 100] : [0, 33, 99, 100]).map(value => <TouchableOpacity key={value} onPress={() => setGoal(value)} style={[styles.pill, { padding: 16, backgroundColor: current.goal === value ? '#287457' : t.inputBackground }]}><Text style={{ color: current.goal === value ? '#fff' : t.textColor }}>{value ? number(value) : ar ? 'بدون هدف' : 'Free count'}</Text></TouchableOpacity>)}</View>
      <TextInput accessibilityLabel="Custom dhikr goal" keyboardType="number-pad" value={goalInput} onChangeText={text => setGoalInput(digits(text))} placeholder={ar ? 'هدف آخر' : 'Your own target'} placeholderTextColor={t.secondaryTextColor} style={inputStyle} />
      {!!session && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'لهذه الجولة فقط. عدّل المجموعة لتغيير الأهداف المحفوظة.' : 'For this round. Edit the collection to change its saved targets.'}</Text>}
      <TouchableOpacity disabled={!validGoal(goalInput)} onPress={() => setGoal(Number(goalInput))} style={[ui.primary, { opacity: validGoal(goalInput) ? 1 : 0.45 }]}><Text style={styles.white}>{ar ? 'تعيين الهدف' : 'Set goal'}</Text></TouchableOpacity>
    </OptionSheet>
    <OptionSheet visible={sheet === 'add'} title={ar ? 'ذكر خاص' : 'Your own dhikr'} theme={t} onClose={() => setSheet(null)}>
      <TextInput accessibilityLabel="New dhikr Arabic" multiline value={customArabic} onChangeText={setCustomArabic} placeholder="الذكر بالعربية" placeholderTextColor={t.secondaryTextColor} style={inputStyle} />
      <TextInput accessibilityLabel="New dhikr translation" value={customEnglish} onChangeText={setCustomEnglish} placeholder={ar ? 'المعنى · اختياري' : 'Meaning · optional'} placeholderTextColor={t.secondaryTextColor} style={inputStyle} />
      <TouchableOpacity disabled={!customArabic.trim()} onPress={() => { const key = customArabic.trim(); dispatch({ type: 'addDhikr', id: key, value: state.dhikrs[key] || { ar: key, en: customEnglish.trim(), count: 0, goal: 0 } }); setCustomArabic(''); setCustomEnglish(''); setSheet(null); }} style={ui.primary}><Text style={styles.white}>{ar ? 'إضافة الذكر' : 'Add dhikr'}</Text></TouchableOpacity>
    </OptionSheet>
    <OptionSheet visible={sheet === 'read'} title={ar ? 'الذكر' : 'Your dhikr'} theme={t} onClose={() => setSheet(null)}><Text style={{ fontFamily: 'Amiri', fontSize: 25, lineHeight: 43, color: t.textColor, textAlign: 'right' }}>{current.ar}</Text>{!ar && <Text style={{ color: t.secondaryTextColor, fontSize: 15, lineHeight: 25 }}>{current.en}</Text>}</OptionSheet>
    {editing !== undefined && <TasbihCollectionEditor value={editing} library={state.dhikrs} theme={t} language={language} onClose={() => { setEditing(undefined); setChooser('collections'); setSheet('dhikr'); }} onDelete={id => { dispatch({ type: 'deleteCollection', id }); setEditing(undefined); setChooser('collections'); setSheet('dhikr'); }} onSave={(value, added) => { dispatch({ type: 'saveCollection', collection: value, dhikrs: added }); setEditing(undefined); setChooser('collections'); setSheet('dhikr'); }} />}
  </View>;
}
const styles = StyleSheet.create({ selector: { marginHorizontal: 20, padding: 18, borderRadius: 22, gap: 8 }, selectorTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }, goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8 }, pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20 }, counter: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingBottom: 28 }, collectionRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingRight: 10 }, input: { borderRadius: 14, padding: 15, fontSize: 16 }, dhikrRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 }, white: { color: '#fff', fontWeight: '600', fontSize: 15 } });
