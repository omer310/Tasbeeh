import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function useLocalDay() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const refresh = () => {
      const now = new Date();
      setToday(previous => previous.toDateString() === now.toDateString() ? previous : now);
      clearTimeout(timer);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, midnight - now + 100);
    };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);
  return today;
}
