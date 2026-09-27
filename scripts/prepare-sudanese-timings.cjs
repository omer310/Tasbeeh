// Rebuild compact, unaltered Sudanese word timestamps from the pinned .pb cache
// populated by verify-quran-audio.cjs. No recording downloads or app launch.
const fs = require('node:fs');
const { decodeWordTimings } = require('../utils/quranAudio');
for (const reader of ['noreen', 'alzain']) {
  const catalog = {};
  for (let chapter = 1; chapter <= 114; chapter++) {
    const data = decodeWordTimings(fs.readFileSync(`.local-backups/quran-timings/${reader}-${chapter}.pb`));
    for (const [key, segments] of Object.entries(data)) catalog[key] = segments.map(s => [s.word, s.start, s.end]);
  }
  const file = `data/quran/audio/${reader}.json`, serialized = JSON.stringify(catalog);
  if (process.argv.includes('--check')) {
    if (JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8'))) !== serialized) throw Error(`${file} differs from pinned metadata`);
  } else fs.writeFileSync(file, serialized + '\n');
  console.log(reader, Object.keys(catalog).length, 'entries including source basmala records');
}
