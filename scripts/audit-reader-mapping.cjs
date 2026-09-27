// Structural text/audio audit only: does not start an app or listen to audio.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { getReaderChapter, verseWords } = require('../utils/quranReaderText');
const { prepareDuriChapter } = require('../utils/prepareDuriAudio');
const { ayahAudioSource } = require('../utils/quranAudio');
const { localTimings } = require('../utils/quranLocalTimings');
const { recoveredBounds } = require('../utils/quranPlaybackTimings');
const { prepareAyahAudio } = require('../utils/prepareAyahAudio');
const { wordClip } = require('../utils/quranWordClip');
const { QURAN_RECITERS } = require('../data/quranReciters');
const report = { kind: 'structural-only', textRevision: 'a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9', readers: [] };
for (const reader of QURAN_RECITERS) {
  const r = { reader: reader.id, ayahs: 0, partialAyahs: [], words: 0, isolatedWordClips: 0 };
  const hash = crypto.createHash('sha256');
  for (let chapter=1;chapter<=114;chapter++) {
    const verses = getReaderChapter(chapter,reader.id);
    const plans = reader.id === 'noreen' ? prepareDuriChapter(chapter) : verses.map(v=>{
      const raw=localTimings(reader.id,v.key);
      return prepareAyahAudio({...ayahAudioSource(reader.id,v.key),bounds:recoveredBounds(reader.id,v.key,raw)},raw,v.text);
    });
    for (let i=0;i<verses.length;i++) {
      const v=verses[i], p=plans[i]; hash.update(v.key+'\n'+v.text+'\n');
      r.ayahs++; if(p.partial)r.partialAyahs.push(v.key);
      for(const word of verseWords(v)){r.words++;if(wordClip(p,word))r.isolatedWordClips++;}
    }
  }
  r.textSha256=hash.digest('hex'); report.readers.push(r);
}
fs.writeFileSync('docs/QURAN_READER_AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(report.readers.map(r=>({reader:r.reader,ayahs:r.ayahs,partial:r.partialAyahs.length,words:r.words,isolated:r.isolatedWordClips})));
