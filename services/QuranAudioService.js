import { Asset } from 'expo-asset';
import { ayahAudioSource } from '../utils/quranAudio';
import { getQuranChapter } from '../utils/quranData';
import { localTimings } from '../utils/quranLocalTimings';
import { prepareAyahAudio } from '../utils/prepareAyahAudio';
import { recoveredBounds } from '../utils/quranPlaybackTimings';
import { prepareDuriChapter } from '../utils/prepareDuriAudio';

const chapters = new Map();
const downloads = new Map();
const warm = new Map();

export function prepareQuranChapter(reciter, chapter) {
  const id = `${reciter}:${chapter}`;
  if (!chapters.has(id)) {
    const verses = reciter === 'noreen' ? prepareDuriChapter(chapter) : getQuranChapter(chapter).map(verse => {
      const source = ayahAudioSource(reciter, verse.key);
      const raw = localTimings(reciter, verse.key);
      return { ...prepareAyahAudio({ ...source, bounds: recoveredBounds(reciter, verse.key, raw) }, raw, verse.text), key: verse.key, individual: !!source.individual };
    });
    verses.cues = verses[0]?.individual ? null : verses.flatMap(v => v.segments.map(s => ({ ...s, key: v.key, partial: v.partial }))).sort((a, b) => a.start - b.start);
    chapters.set(id, verses);
    if (chapters.size > 6) chapters.delete(chapters.keys().next().value);
  }
  return chapters.get(id);
}

export async function loadAyahAudio(reciter, key) {
  // All seven timing catalogs are local. No timing fetch, redirect or network
  // timeout stands between Play and preparing the audio stream.
  if (!/^\d{1,3}:\d{1,3}$/.test(key)) throw Error('Choose a valid ayah.');
  const [chapter, ayah] = key.split(':').map(Number);
  const timeline = prepareQuranChapter(reciter, chapter);
  const track = timeline[ayah - 1];
  if (!track) throw Error('Choose a valid ayah for this reader.');
  const cached = warm.get(track.source.uri);
  return { ...track, source: cached ? { uri: cached } : track.source, sourceId: track.source.uri, timeline, cues: timeline.cues, reciter, chapter, index: ayah - 1 };
}

export function prefetchFollowing(plan) {
  if (!plan.individual) return; // the active surah player already buffers ahead
  const next = plan.timeline[plan.index + 1];
  if (!next || warm.has(next.source.uri) || downloads.has(next.source.uri)) return;
  const uri = next.source.uri;
  // One ayah ahead, never another audible player. Cached files can be reclaimed
  // by the OS. A failed prefetch does not prevent normal streaming or retry.
  const pending = Asset.fromURI(uri).downloadAsync().then(asset => {
    if (asset.localUri) {
      warm.set(uri, asset.localUri);
      if (warm.size > 24) warm.delete(warm.keys().next().value);
    }
  }).catch(() => {}).finally(() => downloads.delete(uri));
  downloads.set(uri, pending);
}

export function discardPrefetchedAudio(plan) {
  // An OS-reclaimed cache file must not trap every retry on the same file URI.
  warm.delete(plan.sourceId);
}
