import AsyncStorage from '@react-native-async-storage/async-storage';

const requests = new Map();
const clean = text => String(text || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

// The published API has literal newlines in strings and one missing title quote.
function parseSource(text, chapter) {
  let input = text.replace(/^\uFEFF/, '');
  if (chapter === 126) input = input.replace('frightened:', 'frightened":');
  let quoted = false, escaped = false, result = '';
  for (const char of input) {
    if (quoted && char.charCodeAt(0) < 32) { result += JSON.stringify(char).slice(1, -1); continue; }
    result += char;
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && quoted) escaped = true;
    else if (char === '"') quoted = !quoted;
  }
  const rows = Object.values(JSON.parse(result))[0];
  if (!Array.isArray(rows)) throw new Error('The meanings are temporarily unavailable.');
  return Object.fromEntries(rows.filter(row => Number.isInteger(row.ID)).map(row => [row.ID, { translation: clean(row.TRANSLATED_TEXT), transliteration: clean(row.LANGUAGE_ARABIC_TRANSLATED_TEXT) }]));
}

export function loadHisnMeanings(chapter) {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 132) return Promise.resolve({});
  if (requests.has(chapter)) return requests.get(chapter);
  const request = (async () => {
    const key = `hisn:meanings:v1:${chapter}`;
    try {
      const cached = JSON.parse(await AsyncStorage.getItem(key) || 'null');
      if (cached && typeof cached === 'object' && !Array.isArray(cached)) return cached;
    } catch { /* A failed cache must not prevent reading. */ }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`https://www.hisnmuslim.com/api/en/${chapter}.json`, { signal: controller.signal });
      if (!response.ok) throw new Error('Connect to load the English meaning.');
      const meanings = parseSource(await response.text(), chapter);
      AsyncStorage.setItem(key, JSON.stringify(meanings)).catch(() => {});
      return meanings;
    } finally { clearTimeout(timeout); }
  })();
  requests.set(chapter, request);
  request.catch(() => requests.delete(chapter));
  return request;
}
