import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let writing = Promise.resolve();
const localDay = () => { const date = new Date(); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; };
export default function useAthkarProgress(category, items) {
  const enabled = !!category?.period;
  const [day, setDay] = useState(localDay);
  const [counts, setCounts] = useState({});
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState('');
  const current = useRef({});
  const active = useRef(true);
  const key = `athkar:v1:${category?.id || 'reading'}`;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    if (!enabled) return;
    const check = () => setDay(localDay());
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    const timer = setInterval(check, 60000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let present = true;
    setReady(false);
    (async () => {
      let next = {};
      try {
        await writing.catch(() => {});
        const saved = JSON.parse(await AsyncStorage.getItem(key) || '{}');
        if (saved.day === day) next = Object.fromEntries(items.map(item => [item.id, Math.max(0, Math.min(item.repetitions || 1, Math.floor(Number(saved.counts?.[item.id]) || 0)))]));
      } catch { if (present) setError('Saved Athkar progress could not be loaded.'); }
      if (present) { current.current = next; setCounts(next); setReady(true); }
    })();
    return () => { present = false; };
  }, [day, enabled, items, key]);
  const record = next => {
    current.current = next; setCounts(next); setError('');
    const value = JSON.stringify({ day, counts: next });
    writing = writing.catch(() => {}).then(() => AsyncStorage.setItem(key, value)).catch(() => { if (active.current) setError('Your progress could not be saved.'); });
  };
  const increment = item => {
    if (!ready || !enabled) return false;
    const count = Math.min(item.repetitions || 1, (current.current[item.id] || 0) + 1);
    record({ ...current.current, [item.id]: count });
    return count >= (item.repetitions || 1);
  };
  return { enabled, day, ready, counts, error, increment, reset: () => record({}) };
}
