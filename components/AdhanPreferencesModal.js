import React, { useLayoutEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import BottomSheet from './BottomSheet';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playAudio } from '../services/AudioService';
import { ADHAN_OPTIONS as OPTIONS } from '../data/adhanOptions';
import { getNextPrayerReminder } from '../services/NotificationService';
import { createPreferenceSelection } from '../utils/preferenceSelection';

const REMINDERS = ['None', '5 minutes before', '10 minutes before', '15 minutes before', '30 minutes before', '1 hour before'];

export default function AdhanPreferencesModal({ isVisible, onClose, prayer, themeColors: t, onPreferenceChange }) {
  const { height } = useWindowDimensions();
  const [selected, setSelected] = useState('Adhan (Madina)');
  const [reminder, setReminder] = useState('None');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextReminder, setNextReminder] = useState(null);
  const selection = useRef(null), savePreference = useRef(onPreferenceChange), touched = useRef(false);
  const audio = useRef(null);
  useLayoutEffect(() => { savePreference.current = onPreferenceChange; }, [onPreferenceChange]);
  const stop = () => { audio.current?.stop(); audio.current = null; setPlaying(null); setLoading(false); };
  useLayoutEffect(() => {
    if (!isVisible || !prayer) return;
    touched.current = false; setSaving(false); setError(''); setReminderOpen(false); setNextReminder(null);
    const model = createPreferenceSelection({
      defaults: { sound: 'Adhan (Madina)', advance: 'None' },
      load: async () => {
        const values = await AsyncStorage.multiGet([`adhan_preference_${prayer}`, `reminder_preference_${prayer}`]);
        return { sound: values[0][1] || 'Adhan (Madina)', advance: values[1][1] || 'None' };
      },
      save: async value => { await savePreference.current(prayer, value.sound, value.advance); return getNextPrayerReminder(prayer); },
      onChange: value => { setSelected(value.sound); setReminder(value.advance); },
      onSaving: setSaving,
      onError: error => setError(error ? error.message || 'Could not save your choice. Tap it again to retry.' : ''),
      onSaved: setNextReminder,
    });
    selection.current = model;
    void model.hydrate();
    let active = true;
    getNextPrayerReminder(prayer).then(value => { if (active && !touched.current && selection.current === model) setNextReminder(value); }).catch(() => {});
    return () => { active = false; model.dispose(); selection.current = null; audio.current?.stop(); audio.current = null; };
  }, [isVisible, prayer]);
  const close = () => { stop(); onClose(); };
  const save = patch => { touched.current = true; stop(); setNextReminder(null); void selection.current?.choose(patch); };
  const preview = option => {
    if (playing === option.name) { stop(); return; }
    stop(); setError(''); setPlaying(option.name);
    audio.current = playAudio(option.sound, {
      onState: state => { setLoading(state === 'loading'); if (state === 'idle') setPlaying(null); },
      onError: e => setError(e.message || 'Could not play this sound.'),
    });
  };
  return <BottomSheet visible={isVisible} title={prayer} subtitle="Sound & reminder" onClose={close} theme={t} height={height * 0.5} contentStyle={{ paddingHorizontal: 18 }}>
          {!!error && <Text accessibilityRole="alert" style={{ color: t.errorColor, paddingVertical: 10 }}>{error}</Text>}
          {saving && <Text accessibilityLiveRegion="polite" style={{ color: t.secondaryTextColor, fontSize: 12 }}>Updating alerts…</Text>}
          {!saving && reminder !== 'None' && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{nextReminder ? `Next reminder: ${new Date(nextReminder).toLocaleString()}` : 'No reminder scheduled yet. Check that prayer alerts and permissions are enabled.'}</Text>}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Reminder: ${reminder}`} accessibilityState={{ expanded: reminderOpen }} onPress={() => setReminderOpen(value => !value)} style={[styles.reminder, { backgroundColor: t.inputBackground, minHeight: 48, paddingRight: 14, gap: 10 }]}><Text style={{ color: t.textColor, fontSize: 13 }}>Remind me</Text><Text style={{ color: t.secondaryTextColor, flex: 1, textAlign: 'right', fontSize: 13 }}>{reminder}</Text><Ionicons name={reminderOpen ? 'chevron-up' : 'chevron-down'} size={16} color={t.textColor} /></TouchableOpacity>
          {reminderOpen && <View style={{ backgroundColor: t.inputBackground, borderRadius: 14, marginBottom: 10 }}>{REMINDERS.map(value => <TouchableOpacity key={value} accessibilityRole="radio" accessibilityState={{ checked: reminder === value }} onPress={() => { setReminderOpen(false); save({ advance: value }); }} style={{ minHeight: 44, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: t.textColor }}>{value}</Text>{reminder === value && <Ionicons name="checkmark" size={19} color={t.activeTabColor} />}</TouchableOpacity>)}</View>}
          {OPTIONS.map(option => <View key={option.name} style={[styles.option, { backgroundColor: selected === option.name ? t.inputBackground : 'transparent', borderColor: selected === option.name ? t.activeTabColor : 'transparent' }]}>
            <TouchableOpacity accessibilityRole="radio" accessibilityLabel={option.name} accessibilityState={{ checked: selected === option.name }} onPress={() => save({ sound: option.name })} style={styles.choice}>
              {option.icon ? <Ionicons name={option.icon} size={22} color={t.textColor} /> : <Image source={require('../assets/adhan-icon.png')} style={{ width: 25, height: 25, tintColor: t.textColor, resizeMode: 'contain' }} />}
              <View style={{ flex: 1, gap: 3 }}><Text style={{ color: t.textColor, fontSize: 14, fontWeight: '500' }}>{option.name}</Text>{!!option.country && <Text style={{ color: t.secondaryTextColor, fontSize: 11 }}>{option.country}</Text>}</View>
              {selected === option.name && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={19} />}
            </TouchableOpacity>
            {!!option.sound && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${playing === option.name ? 'Stop' : 'Preview'} ${option.name}`} onPress={() => preview(option)} style={styles.control}>{playing === option.name && loading ? <ActivityIndicator size="small" color={t.activeTabColor} /> : <Ionicons name={playing === option.name ? 'stop-circle-outline' : 'play-circle-outline'} size={26} color={t.activeTabColor} />}</TouchableOpacity>}
          </View>)}
  </BottomSheet>;
}
const styles = StyleSheet.create({ scrim: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }, sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26 }, handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 9 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12 }, control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, reminder: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, borderRadius: 13, marginBottom: 8 }, option: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, marginBottom: 4 }, choice: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 60, paddingHorizontal: 12, paddingVertical: 10 } });
