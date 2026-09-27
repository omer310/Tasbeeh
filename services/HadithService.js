import axios from 'axios';
import { mergeHadiths } from '../utils/hadithSearch';

const books = new Map();
export function loadHadithBook(edition) {
  if (!/^(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah)$/.test(edition)) throw new Error('Unknown Hadith collection.');
  if (!books.has(edition)) {
    const request = Promise.all(['eng', 'ara'].map(lang => axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${lang}-${edition}.json`, { timeout: 25000 })))
      .then(([english, arabic]) => {
        if (!english.data?.hadiths?.length || !Array.isArray(arabic.data?.hadiths)) throw new Error('This collection is unavailable.');
        return mergeHadiths(english.data.hadiths, arabic.data.hadiths);
      }).catch(error => { books.delete(edition); throw error; });
    books.set(edition, request);
  }
  return books.get(edition);
}
