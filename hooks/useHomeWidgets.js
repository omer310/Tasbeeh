import { useCallback, useEffect, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readPrayerCache } from '../services/PrayerTimesService';
import { homeWidgetsAvailable, syncPrayerWidget, syncWidgetAppearance } from '../services/HomeWidgetService';
import { onPrayerWidgetData } from '../utils/prayerWidgetEvents';
import { widgetDestination } from '../utils/homeWidgets';

export default function useHomeWidgets(navigation, reveal, language, appearance, loaded) {
  const pending = useRef(null), opened = useRef(0), received = useRef(false);
  const flush = useCallback(() => {
    if (!navigation.isReady() || !pending.current) return;
    const destination = pending.current; pending.current = null;
    if (destination.kind === 'prayer') navigation.navigate('MainApp', { screen: 'Prayer Times' });
    else navigation.navigate('MainApp', { screen: 'Duas', params: { screen: 'DuaList', initial: false,
      params: { category: destination.category, dua: destination.dua, widgetOpenId: ++opened.current } } });
    // A cold Dua launch need not wait for the offscreen prayer tab to load.
    reveal();
  }, [navigation, reveal]);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    const accept = url => { const route = widgetDestination(url); if (route) { pending.current = route; flush(); } };
    const listener = Linking.addEventListener('url', ({ url }) => { received.current = true; accept(url); });
    Linking.getInitialURL().then(url => { if (active && !received.current) accept(url); }).catch(() => {});
    return () => { active = false; listener.remove(); };
  }, [flush]);
  useEffect(() => {
    if (!loaded || !homeWidgetsAvailable) return;
    let revision = 0, active = true;
    const report = error => console.warn('Home widget sync:', error);
    const refresh = async () => {
      const current = ++revision;
      try {
        const settings = JSON.parse(await AsyncStorage.getItem('prayerTimeSettings') || '{}');
        const days = await readPrayerCache(settings);
        if (active && current === revision) await syncPrayerWidget(settings, days);
      } catch (error) { report(error); }
    };
    const unsubscribe = onPrayerWidgetData(({ settings, days }) => {
      ++revision; void syncPrayerWidget(settings || {}, days).catch(report);
    });
    void refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; unsubscribe(); listener.remove(); };
  }, [loaded]);
  useEffect(() => {
    if (loaded) void syncWidgetAppearance(language, appearance).catch(error => console.warn('Widget appearance:', error));
  }, [language, appearance, loaded]);
  return flush;
}
