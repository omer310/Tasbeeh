import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, AppState, Linking } from 'react-native';
import { androidPrayerAlarm, getAndroidAlarmStatus } from '../services/AndroidPrayerAlarm';
import { requestNotificationPermissions } from '../services/NotificationService';

export default function PrayerAlertStatus({ themeColors: t, enabled, onToggle, refreshKey, onRefresh }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const modeWrite = useRef(Promise.resolve());
  const modeRevision = useRef(0);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      const id = modeRevision.current;
      return getAndroidAlarmStatus().then(value => { if (active && modeRevision.current === id) setStatus(value); }).catch(e => { if (active) setError(e.message); });
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { active = false; subscription.remove(); };
  }, [refreshKey, enabled]);
  if (Platform.OS === 'web') return null;
  const setup = async () => {
    try {
      setError('');
      if (!await requestNotificationPermissions()) { await Linking.openSettings(); return; }
      const current = await getAndroidAlarmStatus();
      if (current?.unavailable) throw new Error('Install the new Android preview APK to enable Azan.');
      if (current && !current.exact) await androidPrayerAlarm.openAlarmSettings();
      else if (current && !current.playbackChannel) await androidPrayerAlarm.openNotificationSettings();
      else if (current?.alarmMode && !current.dndAllowsAlarms) await androidPrayerAlarm.openDndSettings();
      else if (current && (current.alarmMode ? !current.alarmVolume : current.silentMode || current.doNotDisturb || !current.notificationVolume)) {
        if (androidPrayerAlarm.openSoundSettings) await androidPrayerAlarm.openSoundSettings();
        else await androidPrayerAlarm.openNotificationSettings();
      }
      else await onRefresh();
      setStatus(await getAndroidAlarmStatus());
    } catch (e) { setError(e.message); }
  };
  const setAlarmMode = value => {
    if (!androidPrayerAlarm?.setAlarmMode) { setError('Install the updated Android APK to use alarm mode.'); return; }
    const id = ++modeRevision.current;
    setError(''); setStatus(previous => ({ ...previous, alarmMode: value }));
    modeWrite.current = modeWrite.current.catch(() => {}).then(() => androidPrayerAlarm.setAlarmMode(value))
      .then(() => getAndroidAlarmStatus()).then(value => { if (modeRevision.current === id) setStatus(value); })
      .catch(e => { if (modeRevision.current === id) { setError(e.message); setStatus(previous => ({ ...previous, alarmMode: !value })); } });
  };
  const soundIssue = status?.alarmMode ? (!status.alarmVolume ? 'Turn up alarm volume' : !status.dndAllowsAlarms ? 'Allow alarms in your Do Not Disturb settings' : null) : status && (status.silentMode || status.doNotDisturb || !status.notificationVolume) ? 'Azan is muted by your phone settings' : null;
  const issue = !enabled ? 'Prayer alerts are off' : status?.unavailable ? 'Install the updated APK for Azan' : status && !status.notifications ? 'Allow notifications for prayer alerts' : status && !status.exact ? 'Allow Alarms & reminders for on-time Azan' : status && !status.playbackChannel ? 'Azan playback channel is disabled' : soundIssue;
  return <View style={{ marginHorizontal: 16, padding: 12, borderRadius: 14, backgroundColor: t.inputBackground, gap: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: t.textColor, fontWeight: '600' }}>Prayer alerts</Text>
      <Switch accessibilityLabel="Enable prayer alerts" value={enabled} onValueChange={onToggle} />
    </View>
    <Text style={{ color: issue ? t.errorColor : t.secondaryTextColor, fontSize: 12 }}>
      {issue || (status?.scheduled ? `${status.scheduled} alerts ready · through ${new Date(status.through).toLocaleDateString()}` : 'Tap a prayer to choose its sound and reminder')}
    </Text>
    {enabled && <TouchableOpacity accessibilityRole="button" onPress={setup} style={{ paddingVertical: 6 }}><Text style={{ color: t.activeTabColor, fontWeight: '600' }}>{issue ? 'Set up prayer alerts' : 'Refresh alert schedule'}</Text></TouchableOpacity>}
    {Platform.OS === 'android' && <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}><Text style={{ flex: 1, color: t.textColor, fontWeight: '600' }}>Play Adhan during DND</Text><Switch accessibilityLabel="Play Adhan during Do Not Disturb using alarm volume" value={status?.alarmMode === true} onValueChange={setAlarmMode} /></View>
      <Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 19 }}>Uses your alarm volume, including in silent mode. Allow Alarms in Android’s Do Not Disturb exceptions. Silent, Vibrate and advance reminders keep their own notification behavior.</Text>
      {status?.alarmMode && <TouchableOpacity accessibilityRole="button" onPress={async () => { try { await androidPrayerAlarm.openDndSettings(); } catch (e) { setError(e.message); } }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: t.activeTabColor }}>Open Do Not Disturb settings</Text></TouchableOpacity>}
    </>}
    {!!error && <Text style={{ color: t.errorColor }}>{error}</Text>}
  </View>;
}
