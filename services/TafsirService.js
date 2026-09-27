import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { tafsirSource, defaultTafsirSource } from '../data/tafsirSources';
import { normalizeTafsir } from '../utils/quranTafsir';

const CACHE_KEY = 'quranTafsirCache:v1';
const PREFERENCE_KEY = 'quranTafsirSource:v1';
const cache = new Map(), pending = new Map();
let hydration, writes = Promise.resolve();
let preferenceWrites = Promise.resolve();
export async function readTafsirSource(language) {
  try { return tafsirSource(await AsyncStorage.getItem(PREFERENCE_KEY)) || defaultTafsirSource(language); }
  catch { return defaultTafsirSource(language); }
}
export function saveTafsirSource(id) {
  if (!tafsirSource(id)) return Promise.reject(new Error('Unknown Tafsir source'));
  preferenceWrites = preferenceWrites.catch(() => {}).then(() => AsyncStorage.setItem(PREFERENCE_KEY, String(id)));
  return preferenceWrites;
}
function trimCache() {
  let characters = [...cache.values()].reduce((sum, item) => sum + item.text.length, 0);
  while (cache.size > 24 || characters > 400000) {
    const oldest = cache.keys().next().value;
    characters -= cache.get(oldest).text.length; cache.delete(oldest);
  }
}
function hydrate() {
  if (!hydration) hydration = AsyncStorage.getItem(CACHE_KEY).then(raw => {
    const values = JSON.parse(raw || '[]');
    if (!Array.isArray(values)) return;
    for (const item of values) {
      if (tafsirSource(item?.sourceId) && typeof item.key === 'string' && typeof item.text === 'string' && item.text.trim()
        && Array.isArray(item.references) && item.references.includes(item.key) && item.references.every(key => /^\d+:\d+$/.test(key))) cache.set(`${item.sourceId}/${item.key}`, item);
    }
    trimCache();
  }).catch(() => {});
  return hydration;
}
export async function loadTafsir(sourceId, key) {
  const source = tafsirSource(sourceId);
  if (!source || !/^\d{1,3}:\d{1,3}$/.test(key)) throw new Error('Invalid Tafsir request');
  await hydrate();
  const identity = `${source.id}/${key}`;
  if (cache.has(identity)) {
    const value = cache.get(identity); cache.delete(identity); cache.set(identity, value); return value;
  }
  if (pending.has(identity)) return pending.get(identity);
  const task = axios.get(`https://api.quran.com/api/v4/tafsirs/${source.id}/by_ayah/${key}`, { timeout: 15000 })
    .then(({ data }) => {
      const value = normalizeTafsir(data, source, key);
      cache.set(identity, value); trimCache();
      writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(CACHE_KEY, JSON.stringify([...cache.values()]))).catch(() => {});
      return value;
    }).finally(() => pending.delete(identity));
  pending.set(identity, task);
  return task;
}
