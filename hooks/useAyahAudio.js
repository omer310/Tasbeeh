import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playAudio } from '../services/AudioService';
import { loadAyahAudio, prepareQuranChapter, prefetchFollowing, discardPrefetchedAudio } from '../services/QuranAudioService';
import { createQuranPlayback } from '../utils/quranPlayback';
import { QURAN_RECITERS } from '../data/quranReciters';

export default function useAyahAudio({ enabled, chapterId, layout }) {
  const [reciter, setReciter] = useState('alzain');
  const [playback, setPlayback] = useState({ status: 'idle', playingKey: null, word: null, partial: false, single: false, follow: true, error: '' });
  const [controller] = useState(() => createQuranPlayback({ loadPlan: loadAyahAudio, playAudio, prefetch: prefetchFollowing, discardCached: discardPrefetchedAudio, onChange: setPlayback }));
  const readerChanged = useRef(false), writes = useRef(Promise.resolve());
  const [saveError, setSaveError] = useState('');
  const stop = controller.stop;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('quranAudioReciter').then(value => {
      if (active && !readerChanged.current && QURAN_RECITERS.some(item => item.id === value)) setReciter(value);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => { stop(); return stop; }, [enabled, layout, stop]);
  useEffect(() => {
    if (!enabled) return;
    // Prepare local word maps outside the Play handler; this starts no audio.
    const task = requestIdleCallback(() => { try { prepareQuranChapter(reciter, chapterId); } catch { /* Play reports a recoverable error. */ } });
    return () => cancelIdleCallback(task);
  }, [enabled, chapterId, reciter]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', value => { if (value !== 'active') stop(); });
    return () => subscription.remove();
  }, [stop]);
  const chooseReciter = value => {
    if (!QURAN_RECITERS.some(item => item.id === value)) return;
    readerChanged.current = true;
    if (value !== reciter) stop();
    setReciter(value); setSaveError('');
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem('quranAudioReciter', value))
      .catch(() => setSaveError('Could not save your reader preference.'));
  };
  const play = key => { if (enabled) { readerChanged.current = true; controller.toggle(reciter, key); } };
  const playFrom = (key, single = false, range = null) => { if (enabled) { readerChanged.current = true; void controller.start(reciter, key, { single, range }); } };
  return { ...playback, error: playback.error || saveError, reciter, chooseReciter, play, playFrom, stop, skip: controller.skip, setFollow: controller.follow };
}
