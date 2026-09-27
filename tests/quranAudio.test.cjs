const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ayahAudioSource, decodeWordTimings, readingTokens, timingWordMap, activeWord, AUDIO_REVISION } = require('../utils/quranAudio');
const { prepareAyahAudio } = require('../utils/prepareAyahAudio');
const { localTimings } = require('../utils/quranLocalTimings');
const { QURAN_RECITERS } = require('../data/quranReciters');
const { getQuranChapter } = require('../utils/quranData');
const segment = (word, start, end) => ({ word, wordEnd: word + 1, start, end, invalid: end <= start });
const integer = number => { const out = []; do { const byte = number % 128; number = Math.floor(number / 128); out.push(byte | (number ? 128 : 0)); } while (number); return out; };
const field = (id, bytes) => [id * 8 + 2, ...integer(bytes.length), ...bytes];
function protobuf(rows) {
  const words = rows.flatMap(s => field(1, [8, ...integer(s.word), 16, ...integer(s.word + 1), 24, ...integer(s.start), 32, ...integer(s.end)]));
  return new Uint8Array(field(1, [...field(1, [...Buffer.from('1:1')]), ...field(2, words)]));
}
test('Noreen Duri audio and metadata use the same pinned recording', () => {
  const source = ayahAudioSource('noreen', '2:255');
  assert.match(source.uri, /Noreen%20Siddiq%20\(Duri%20an%20Abu%20Amr\)/);
  assert.ok(source.uri.includes(AUDIO_REVISION));
  assert.equal(source.uri.replace(/\.opus$/, '.pb'), source.timingUri);
  assert.equal(QURAN_RECITERS.find(r => r.id === 'noreen').riwayah, 'duri');
});
test('EveryAyah filenames select the matching reciter encoding and exact ayah', () => {
  assert.equal(ayahAudioSource('husary', '2:255').uri, 'https://everyayah.com/data/Husary_64kbps/002255.mp3');
  for (const key of ['0:1', '115:1', '2:0', '1:8', '../2:1']) assert.throws(() => ayahAudioSource('alzain', key));
  assert.throws(() => ayahAudioSource('unknown', '1:1'));
});
test('protobuf preserves exact millisecond offsets and marks corrupt words without discarding neighboring words', () => {
  const actual = decodeWordTimings(protobuf([segment(0, 20, 220), segment(1, 400, 280), segment(2, 420, 740)]))['1:1'];
  assert.equal(actual[0].start, 20); assert.equal(actual[1].invalid, true); assert.equal(actual[2].end, 740);
  assert.throws(() => decodeWordTimings(new Uint8Array([10, 250, 200])));
  assert.throws(() => decodeWordTimings(new Uint8Array(2_000_001)));
});
test('all Quran text survives tokenization character for character, including thin spaces and marks', () => {
  for (let chapter = 1; chapter <= 114; chapter++) for (const verse of getQuranChapter(chapter)) {
    for (const split of [false, true]) assert.equal(readingTokens(verse.text, split).map(t => t.text).join(''), verse.text);
  }
});
test('timed vocatives and hizb prefixes map to exact character spans', () => {
  const text = '۞يَـٰٓأَيُّهَا ٱلنَّاسُ';
  const map = timingWordMap(text, [segment(0, 0, 1), segment(1, 1, 2), segment(2, 2, 3)]);
  assert.equal(text.slice(map[0].from, map[0].to), '۞يَـٰٓ');
  assert.equal(text.slice(map[1].from, map[1].to), 'أَيُّهَا');
  assert.throws(() => timingWordMap(text, [segment(10, 0, 1)]));
});
test('highlights clear in pauses and follow repeated words', () => {
  const data = [segment(0, 10, 80), segment(1, 100, 180), segment(0, 200, 280)];
  assert.equal(activeWord(data, 80), null); assert.equal(activeWord(data, 100), 1); assert.equal(activeWord(data, 220), 0);
});
test('a damaged boundary cannot play a guessed full-surah segment', () => {
  assert.throws(() => prepareAyahAudio({ uri: 'surah.opus' }, [segment(0, 10, 10)], 'الم'), /damaged/);
  assert.throws(() => prepareAyahAudio({ uri: 'surah.opus' }, [], 'الم'), /no usable/);
});
test('internal timing gaps and unmatched word counts produce an explicit partial state', () => {
  const p = prepareAyahAudio({ uri: 'surah.opus' }, [segment(0, 100, 200), segment(1, 250, 240), segment(2, 300, 400)], 'قُلْ هُوَ ٱللَّهُ');
  assert.equal(p.partial, true); assert.equal(p.startTime, 0.1); assert.equal(p.endTime, 0.4); assert.equal(p.segments.length, 2);
  const mismatch = prepareAyahAudio({ uri: 'ayah.mp3', individual: true }, [segment(0, 100, 200)], 'قُلْ هُوَ');
  assert.equal(mismatch.partial, true); assert.equal(mismatch.segments[0].highlight, null);
  assert.equal(mismatch.startTime, 0); assert.equal(mismatch.endTime, undefined);
});
test('quran-align multiword spans remain a span instead of inventing per-word times', () => {
  const p = prepareAyahAudio({ uri: 'ayah.mp3', individual: true }, [{ word: 0, wordEnd: 2, start: 100, end: 500 }], 'قُلْ هُوَ');
  assert.deepEqual(p.segments[0].highlight, { from: 0, to: 'قُلْ هُوَ'.length });
});
test('all five bundled timing catalogs contain every ayah; Al-Araf uses its own ayah audio', () => {
  for (const reader of QURAN_RECITERS.filter(r => r.everyAyah)) for (let c = 1; c <= 114; c++) for (const verse of getQuranChapter(c)) {
    assert.ok(localTimings(reader.id, verse.key)?.length, `${reader.id} ${verse.key}`);
  }
  assert.match(ayahAudioSource('alafasy', '7:1').uri, /007001\.mp3$/);
  assert.equal(localTimings('alafasy', '7:1')[0].wordEnd, 1);
});

const { recoveredBounds, NOREEN_42_SEPARATOR } = require('../utils/quranPlaybackTimings');
test('a valid repeated boundary still plays when another copy of that word is damaged', () => {
  const raw = [segment(0, 10, 100), segment(1, 120, 119), segment(1, 150, 200)];
  const prepared = prepareAyahAudio({ uri: 'surah.opus' }, raw, 'قُلْ هُوَ');
  assert.equal(prepared.endTime, 0.2); assert.equal(prepared.partial, true);
});
test('Sudanese ayahs all have ordered playable boundaries without fabricating highlight segments', () => {
  for (const reader of ['noreen', 'alzain']) for (let c = 1; c <= 114; c++) {
    let previous = -1;
    for (const verse of getQuranChapter(c)) {
      const raw = localTimings(reader, verse.key);
      assert.ok(raw.length, `${reader} ${verse.key}`);
      const bounds = recoveredBounds(reader, verse.key, raw);
      const p = prepareAyahAudio({ ...ayahAudioSource(reader, verse.key), bounds }, raw, verse.text);
      assert.ok(p.startTime >= previous && p.endTime > p.startTime, `${reader} ${verse.key} order`);
      previous = p.startTime;
      assert.equal(p.segments.length, raw.filter(s => !s.invalid).length);
      if (bounds) assert.equal(p.partial, true, `${reader} ${verse.key} must disclose incomplete highlights`);
    }
  }
});
test('the measured Surah 42 pause separates adjacent untimed ayahs, with no invented word highlight', () => {
  for (const key of ['42:1', '42:2']) {
    const raw = localTimings('noreen', key), bounds = recoveredBounds('noreen', key, raw);
    const p = prepareAyahAudio({ ...ayahAudioSource('noreen', key), bounds }, raw, getQuranChapter(42).find(v => v.key === key).text);
    assert.equal(key === '42:1' ? p.endTime : p.startTime, NOREEN_42_SEPARATOR / 1000);
    assert.equal(p.segments.length, 0); assert.equal(p.partial, true);
  }
});
