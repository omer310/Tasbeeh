import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, AppState, Linking } from 'react-native';
import { androidPrayerAlarm, getAndroidAlarmStatus } from '../services/AndroidPrayerAlarm';
import { requestNotificationPermissions } from '../services/NotificationService';

export default function PrayerAlertStatus({ themeColors: t, enabled, onToggle, refreshKey, onRefresh }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => getAndroidAlarmStatus().then(value => { if (active) setStatus(value); }).catch(e => { if (active) setError(e.message); });
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
      else if (current && (!current.playbackChannel || current.silentMode || current.doNotDisturb || !current.notificationVolume)) await androidPrayerAlarm.openNotificationSettings();
      else await onRefresh();
      setStatus(await getAndroidAlarmStatus());
    } catch (e) { setError(e.message); }
  };
  const issue = !enabled ? 'Prayer alerts are off' : status?.unavailable ? 'Install the updated APK for Azan' : status && !status.notifications ? 'Allow notifications for prayer alerts' : status && !status.exact ? 'Allow Alarms & reminders for on-time Azan' : status && !status.playbackChannel ? 'Azan playback channel is disabled' : status && (status.silentMode || status.doNotDisturb || !status.notificationVolume) ? 'Azan is muted by your phone settings' : null;
  return <View style={{ marginHorizontal: 16, padding: 12, borderRadius: 14, backgroundColor: t.inputBackground, gap: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: t.textColor, fontWeight: '600' }}>Prayer alerts</Text>
      <Switch accessibilityLabel="Enable prayer alerts" value={enabled} onValueChange={onToggle} />
    </View>
    <Text style={{ color: issue ? t.errorColor : t.secondaryTextColor, fontSize: 12 }}>
      {issue || (status?.scheduled ? `${status.scheduled} alerts ready · through ${new Date(status.through).toLocaleDateString()}` : 'Tap a prayer to choose its Azan and test delivery')}
    </Text>
    {enabled && <TouchableOpacity accessibilityRole="button" onPress={setup} style={{ paddingVertical: 6 }}><Text style={{ color: t.activeTabColor, fontWeight: '600' }}>{issue ? 'Set up prayer alerts' : 'Refresh alert schedule'}</Text></TouchableOpacity>}
    {!!error && <Text style={{ color: t.errorColor }}>{error}</Text>}
  </View>;
}
