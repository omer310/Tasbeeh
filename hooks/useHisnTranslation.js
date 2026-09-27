import { useEffect, useState } from 'react';
import { loadHisnMeanings } from '../services/HisnService';

export default function useHisnTranslation(dua, language) {
  const [data, setData] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const chapter = dua?.hisnChapter;
  const needed = language !== 'ar' && !!dua?.hisnEntry && !dua?.translation;
  useEffect(() => {
    if (!needed) return;
    let active = true;
    setData({ chapter, loading: true });
    loadHisnMeanings(chapter).then(meanings => { if (active) setData({ chapter, meanings }); }).catch(() => { if (active) setData({ chapter, error: true }); });
    return () => { active = false; };
  }, [chapter, needed, attempt]);
  const current = data?.chapter === chapter ? data : null;
  const meaning = current?.meanings?.[dua?.hisnEntry];
  return { translation: dua?.translation || meaning?.translation || '', transliteration: dua?.transliteration || meaning?.transliteration || '', loading: needed && (!current || current.loading), unavailable: needed && (!!current?.error || (!!current?.meanings && !meaning?.translation)), retry: () => setAttempt(value => value + 1) };
}
