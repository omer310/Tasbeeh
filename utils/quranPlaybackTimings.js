const { localTimings } = require('./quranLocalTimings');

// Source 042.opus (pinned Mualim revision): band-limited silence detected from
// 9.736396 to 10.225021 s. Its midpoint separates the two zero-length records.
// This repairs an AYAH playback boundary; it is not a fabricated word timestamp.
const NOREEN_42_SEPARATOR = 9981;
function recoveredBounds(reader, key, raw) {
  if (!['noreen', 'alzain'].includes(reader)) return undefined;
  const valid = raw.filter(s => !s.invalid), last = Math.max(...raw.map(s => s.wordEnd));
  const firstOK = valid.some(s => s.word === 0), lastOK = valid.some(s => s.wordEnd === last);
  if (firstOK && lastOK) return undefined;
  const [chapter, ayah] = key.split(':').map(Number);
  const previous = localTimings(reader, `${chapter}:${ayah - 1}`).filter(s => !s.invalid);
  const next = localTimings(reader, `${chapter}:${ayah + 1}`).filter(s => !s.invalid);
  let start = firstOK ? Math.min(...valid.map(s => s.start)) : previous.length ? Math.max(...previous.map(s => s.end)) : ayah === 1 ? 0 : NaN;
  let end = lastOK ? Math.max(...valid.map(s => s.end)) : next.length ? Math.min(...next.map(s => s.start)) : NaN;
  let method = 'neighboring-ayah-boundaries';
  if (reader === 'noreen' && key === '42:1') { end = NOREEN_42_SEPARATOR; method = 'measured-silence'; }
  if (reader === 'noreen' && key === '42:2') { start = NOREEN_42_SEPARATOR; method = 'measured-silence'; }
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) return { start, end, method };
  return undefined;
}
function verseAtTime(verses, seconds) {
  // Binary search the monotonic playback starts, retaining the current ayah in
  // natural pauses. Word highlights independently clear when no word is active.
  let low = 0, high = verses.length - 1, found = -1;
  while (low <= high) { const mid = (low + high) >> 1; if (verses[mid].startTime <= seconds) { found = mid; low = mid + 1; } else high = mid - 1; }
  return found >= 0 ? verses[found] : null;
}
module.exports = { recoveredBounds, verseAtTime, NOREEN_42_SEPARATOR };
