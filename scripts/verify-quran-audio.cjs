// Source/data audit only: does not build, launch an app, or play device audio.
const fs = require('node:fs');
const { QURAN_RECITERS } = require('../data/quranReciters');
const { ayahAudioSource, decodeWordTimings, timingWordMap, AUDIO_REVISION } = require('../utils/quranAudio');
const { localTimings } = require('../utils/quranLocalTimings');
const { prepareAyahAudio } = require('../utils/prepareAyahAudio');
const { recoveredBounds } = require('../utils/quranPlaybackTimings');
const { getQuranChapter } = require('../utils/quranData');
const offline = process.argv.includes('--offline');
const report = { revision: AUDIO_REVISION, quranAlignRelease: '2016-11-24', checkedAt: new Date().toISOString(), offline, note: 'Structural checks, not a listening test or proof of millisecond accuracy.', readers: {} };
async function fetchChecked(url, options = {}) {
  let error;
  for (let i = 0; i < 3; i++) {
    try { const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) }); if (!response.ok) throw Error(`HTTP ${response.status}`); return response; }
    catch (e) { error = e; }
  }
  throw error;
}
async function audit(reader) {
  const result = report.readers[reader.id] = { chapters: 0, ayahs: 0, matchingWordCounts: 0, playable: 0, completeHighlights: 0, invalidSegments: 0, recoveredAyahs: [], partialAyahs: [], unavailableAyahs: [], errors: [], streamChecks: [] };
  if (reader.everyAyah && !offline) {
    const html = await (await fetchChecked(`https://everyayah.com/data/${reader.everyAyah}/`)).text();
    const files = new Set([...html.matchAll(/href="(?:[^"\s]*\/)?(\d{6}\.mp3)"/g)].map(m => m[1]));
    for (let chapter = 1; chapter <= 114; chapter++) for (const verse of getQuranChapter(chapter)) {
      const name = `${String(chapter).padStart(3, '0')}${String(verse.id).padStart(3, '0')}.mp3`;
      if (!files.has(name)) result.errors.push({ key: verse.key, error: 'Audio absent from EveryAyah index' });
    }
    result.indexFiles = files.size;
  }
  for (let chapter = 1; chapter <= 114; chapter++) {
    try {
      const source = ayahAudioSource(reader.id, `${chapter}:1`);
      let timings;
      if (!reader.everyAyah) {
        const dir = '.local-backups/quran-timings'; fs.mkdirSync(dir, { recursive: true });
        const file = `${dir}/${reader.id}-${chapter}.pb`;
        if (!fs.existsSync(file) && offline) throw Error('Missing cached timing file');
        const bytes = fs.existsSync(file) ? fs.readFileSync(file) : new Uint8Array(await (await fetchChecked(source.timingUri)).arrayBuffer());
        fs.writeFileSync(file, bytes); timings = decodeWordTimings(bytes);
      }
      result.chapters++;
      let previousStart = -1;
      for (const verse of getQuranChapter(chapter)) {
        const segments = reader.everyAyah ? localTimings(reader.id, verse.key) : timings[verse.key] || [];
        if (!reader.everyAyah && JSON.stringify(segments) !== JSON.stringify(localTimings(reader.id, verse.key))) result.errors.push({ key: verse.key, error: 'Bundled timestamps differ from pinned protobuf' });
        result.ayahs++; result.invalidSegments += segments.filter(s => s.invalid).length;
        try { timingWordMap(verse.text, segments); result.matchingWordCounts++; } catch { /* Reported below. */ }
        try {
          const bounds = recoveredBounds(reader.id, verse.key, segments);
          const prepared = prepareAyahAudio({ ...ayahAudioSource(reader.id, verse.key), bounds }, segments, verse.text);
          if (bounds) result.recoveredAyahs.push({ key: verse.key, ...bounds });
          if (!reader.everyAyah && (prepared.startTime < previousStart || prepared.endTime <= prepared.startTime)) result.errors.push({ key: verse.key, error: 'Unordered playback boundaries' });
          previousStart = prepared.startTime;
          result.playable++;
          if (prepared.partial) result.partialAyahs.push(verse.key); else result.completeHighlights++;
        } catch { result.unavailableAyahs.push(verse.key); }
      }
      if (!offline && [1, 2, 114].includes(chapter)) {
        const response = await fetchChecked(source.uri, { headers: { Range: 'bytes=0-127' } });
        const bytes = new Uint8Array(await response.arrayBuffer());
        const magic = String.fromCharCode(...bytes.subarray(0, 4));
        const validAudioHeader = reader.everyAyah ? magic.startsWith('ID3') || (bytes[0] === 255 && (bytes[1] & 224) === 224) : magic === 'OggS';
        result.streamChecks.push({ chapter, status: response.status, type: response.headers.get('content-type'), validAudioHeader });
        if (!validAudioHeader) result.errors.push({ chapter, error: 'Unexpected audio header' });
      }
    } catch (e) { result.errors.push({ chapter, error: e.message }); }
  }
  console.log(reader.id, `${result.playable}/6236 playable`, `${result.completeHighlights} complete timing maps`, `${result.partialAyahs.length} partial`, `${result.unavailableAyahs.length} unavailable`, `${result.errors.length} source errors`);
}
Promise.all(QURAN_RECITERS.map(reader => audit(reader).catch(e => report.readers[reader.id].errors.push({ error: e.message })))).then(() => {
  fs.writeFileSync('docs/QURAN_AUDIO_AUDIT.json', JSON.stringify(report, null, 2) + '\n');
  if (Object.values(report.readers).some(r => r.errors.length || r.unavailableAyahs.length || r.ayahs !== 6236)) process.exitCode = 1;
});
