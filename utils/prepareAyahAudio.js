const { timingWordMap } = require('./quranAudio');

function prepareAyahAudio({ uri, individual, bounds }, input, text) {
  const raw = input || [];
  if (!individual && !raw?.length) throw new Error('This ayah has no usable timing data. Please choose another reader.');
  const segments = (raw || []).filter(segment => !segment.invalid);
  let wordMap = null;
  try { wordMap = timingWordMap(text, raw); } catch { /* Play without a misleading highlight. */ }
  // A corrupt first/last word cannot safely delimit an ayah in a surah file.
  const lastWord = Math.max(...raw.map(s => s.wordEnd));
  const hasBoundaries = segments.some(s => s.word === 0) && segments.some(s => s.wordEnd === lastWord);
  if (!individual && !hasBoundaries && !bounds) {
    throw new Error('This ayah has damaged timing data. Please choose another reader.');
  }
  const highlighted = segments.map(segment => ({ ...segment, highlight: wordMap?.[segment.word] && wordMap?.[segment.wordEnd - 1] ? { from: wordMap[segment.word].from, to: wordMap[segment.wordEnd - 1].to } : null }));
  const missingWords = wordMap?.some((_, index) => !segments.some(s => index >= s.word && index < s.wordEnd));
  if (bounds && (!Number.isFinite(bounds.start) || !Number.isFinite(bounds.end) || bounds.start < 0 || bounds.end <= bounds.start)) throw new Error('Invalid recovered ayah boundary.');
  return { source: { uri }, segments: highlighted, partial: !wordMap || missingWords || raw.some(s => s.invalid) || !segments.length,
    recovered: bounds?.method || null,
    startTime: individual ? 0 : (bounds?.start ?? Math.min(...segments.map(s => s.start))) / 1000,
    endTime: individual ? undefined : (bounds?.end ?? Math.max(...segments.map(s => s.end))) / 1000 };
}
module.exports = { prepareAyahAudio };
