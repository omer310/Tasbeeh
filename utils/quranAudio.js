const chapters = require('../data/quran/chapters.json');
const { QURAN_RECITERS } = require('../data/quranReciters');

const AUDIO_REVISION = '70ea7051fdaa8ad6ad5388127f877b40c8b9ec1a';
function ayahAudioSource(reciterId, key) {
  const reader = QURAN_RECITERS.find(item => item.id === reciterId);
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(key));
  const chapter = match && chapters[Number(match[1]) - 1];
  const ayah = match && Number(match[2]);
  if (!reader || !chapter || ayah < 1 || ayah > chapter.verses_count) throw new Error('Choose a valid reader and ayah.');
  const number = String(chapter.id).padStart(3, '0');
  if (reader.everyAyah) return { uri: `https://everyayah.com/data/${reader.everyAyah}/${number}${String(ayah).padStart(3, '0')}.mp3`, individual: true };
  const base = `https://huggingface.co/datasets/zaibihassan/Quranic-Recitation-Data/resolve/${AUDIO_REVISION}/${encodeURIComponent(reader.folder)}/${number}/${number}`;
  return { uri: `${base}.opus`, timingUri: `${base}.pb` };
}

// Bounded decoder for the published SurahTimestamps protobuf schema. No audio
// is inferred: these offsets belong to the exact pinned .opus file above.
function decodeWordTimings(input) {
  const bytes = new Uint8Array(input);
  if (!bytes.length || bytes.length > 2_000_000) throw new Error('Invalid word timing data.');
  function fields(data) {
    let offset = 0;
    const result = [];
    const integer = () => {
      let n = 0, scale = 1;
      for (let i = 0; i < 8; i++) {
        if (offset >= data.length) throw new Error('Truncated word timing data.');
        const byte = data[offset++]; n += (byte & 127) * scale;
        if (byte < 128 && Number.isSafeInteger(n)) return n;
        scale *= 128;
      }
      throw new Error('Invalid word timing number.');
    };
    while (offset < data.length) {
      const tag = integer(), field = Math.floor(tag / 8), wire = tag % 8;
      if (wire === 0) result.push([field, integer()]);
      else if (wire === 2) {
        const length = integer();
        if (offset + length > data.length) throw new Error('Truncated word timing field.');
        result.push([field, data.subarray(offset, offset + length)]); offset += length;
      } else throw new Error('Unsupported word timing field.');
    }
    return result;
  }
  const result = {};
  for (const [field, entry] of fields(bytes)) {
    if (field !== 1) continue;
    const map = Object.fromEntries(fields(entry));
    const key = String.fromCharCode(...map[1]);
    if (!/^\d{1,3}:\d{1,3}$/.test(key)) throw new Error('Invalid ayah timing key.');
    result[key] = fields(map[2]).filter(([id]) => id === 1).map(([, segment]) => {
      const values = Object.fromEntries(fields(segment));
      const word = values[1] || 0, start = values[3] || 0, end = values[4] || 0;
      if (values[2] !== word + 1 || word > 500 || start > 86400000 || end > 86400000) throw new Error('Invalid word timing segment.');
      // Keep invalid ranges visible to the caller/audit. Never synthesize a
      // replacement time, and never let one bad word discard an entire surah.
      return { word, wordEnd: word + 1, start, end, invalid: end <= start };
    }).sort((a, b) => a.start - b.start);
  }
  return result;
}
function readingTokens(text, splitVocatives = false) {
  let index = -1;
  let offset = 0;
  // Thin spaces inside Arabic words are glyph spacing, not word boundaries.
  const parts = text.split(/([ \n\r\t]+)/).filter(Boolean).flatMap(value => {
    if (!splitVocatives) return [value];
    const match = /^([۞۩]?(?:(?:وَ|فَ)?يَ[ـٰٓ]+|هَ[ـٰٓ]+(?=أَنت)))(?=[أإءا-ي])/u.exec(value);
    return match ? [match[1], value.slice(match[1].length)] : [value];
  });
  return parts.map(value => {
    const token = { text: value, word: /[\u0621-\u063A\u0641-\u064A\u0671]/u.test(value) ? ++index : null, from: offset, to: offset + value.length };
    offset += value.length; return token;
  });
}
function timingWordMap(text, segments) {
  const count = Math.max(...segments.map(segment => segment.wordEnd ?? segment.word + 1));
  for (const split of [false, true]) {
    const words = readingTokens(text, split).filter(token => token.word !== null);
    if (words.length === count) return words.map(({ from, to }) => ({ from, to }));
  }
  throw new Error('Word timings do not match this ayah. Please choose another reader.');
}
function activeWord(segments, milliseconds) {
  // Clear the highlight during pauses; repeated words retain their own timings.
  return segments.find(segment => milliseconds >= segment.start && milliseconds < segment.end)?.word ?? null;
}
module.exports = { ayahAudioSource, decodeWordTimings, readingTokens, timingWordMap, activeWord, AUDIO_REVISION };
