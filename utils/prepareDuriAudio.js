const { getQuranChapter } = require('./quranData');
const { getReaderChapter } = require('./quranReaderText');
const { ayahAudioSource } = require('./quranAudio');
const { localTimings } = require('./quranLocalTimings');
const { recoveredBounds } = require('./quranPlaybackTimings');
const { prepareAyahAudio } = require('./prepareAyahAudio');

// HF uses Hafs reference keys even for its Duri recording. Project the original
// timestamp intervals onto native Duri word ranges; never renumber text in place.
function prepareDuriChapter(chapter) {
  const text = getReaderChapter(chapter, 'duri');
  const originals = new Map(getQuranChapter(chapter).map(v => {
    const raw = localTimings('noreen', v.key);
    return [v.key, prepareAyahAudio({ ...ayahAudioSource('noreen', v.key), bounds: recoveredBounds('noreen', v.key, raw) }, raw, v.text)];
  }));
  const projected = text.map(verse => {
    const sourceKeys = [...new Set(verse.routes.flatMap(([, , sources]) => sources.map(([key]) => key)))];
    const segments = [];
    for (const key of sourceKeys) {
      for (const s of originals.get(key).segments) {
        if (!s.highlight) continue;
        const targets = verse.routes.filter(([, , sources]) => sources.some(([k, from, to]) => k === key && from < s.highlight.to && to > s.highlight.from));
        if (!targets.length) continue;
        const highlight = { from: targets[0][0], to: targets.at(-1)[1] };
        const previous = segments.at(-1);
        // A single Duri word can correspond to two separately indexed source
        // tokens. Keep the whole word's interval; repeated tokens stay separate.
        if (previous?.sourceKey === key && previous.wordEnd === s.word && previous.highlight.from === highlight.from && previous.highlight.to === highlight.to) {
          previous.end = s.end; previous.wordEnd = s.wordEnd;
        } else segments.push({ ...s, sourceKey: key, highlight });
      }
    }
    segments.sort((a, b) => a.start - b.start);
    return { key: verse.key, source: originals.get(sourceKeys[0]).source, individual: false, segments, sourceKeys, routes: verse.routes,
      partial: sourceKeys.some(key => originals.get(key).partial) || verse.routes.some(([from, to]) => !segments.some(s => s.highlight.from <= from && s.highlight.to >= to)) };
  });
  const plans = projected.map((v, index) => {
    const first = originals.get(v.sourceKeys[0]), last = originals.get(v.sourceKeys.at(-1));
    const previous = projected[index - 1], next = projected[index + 1];
    // At a shared source-ayah boundary use the actual mapped words. At an
    // outer boundary retain the audited/recovered original audio interval.
    const sharedStart = previous?.sourceKeys.at(-1) === v.sourceKeys[0];
    const sharedEnd = next?.sourceKeys[0] === v.sourceKeys.at(-1);
    const startTime = sharedStart ? Math.min(...v.segments.map(s => s.start)) / 1000 : first.startTime;
    const endTime = sharedEnd ? Math.max(...v.segments.map(s => s.end)) / 1000 : last.endTime;
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) throw Error(`Missing Duri ayah bounds: ${v.key}`);
    const { sourceKeys, routes, ...plan } = v;
    return { ...plan, startTime, endTime };
  });
  // In 14:1 the reader briefly begins the next native Duri ayah, then repeats
  // part of the previous one. Choose a complete uninterrupted occurrence for
  // single-ayah playback; keep every original cue for continuous highlighting.
  const cues = plans.flatMap(v => v.segments.map(s => ({ ...s, key: v.key }))).sort((a, b) => a.start - b.start);
  const runs = [];
  for (const cue of cues) {
    if (runs.at(-1)?.key !== cue.key) runs.push({ key: cue.key, cues: [] });
    runs.at(-1).cues.push(cue);
  }
  for (let i = 1; i < plans.length; i++) {
    if (plans[i - 1].endTime - plans[i].startTime <= 0.2) continue;
    for (const plan of [plans[i - 1], plans[i]]) {
      const verse = text.find(v => v.key === plan.key);
      const run = runs.find(r => r.key === plan.key && verse.routes.every(([from, to]) => r.cues.some(s => s.highlight.from <= from && s.highlight.to >= to)));
      if (!run) throw Error(`No isolated Duri ayah occurrence: ${plan.key}`);
      plan.startTime = run.cues[0].start / 1000; plan.endTime = run.cues.at(-1).end / 1000;
    }
  }
  return plans;
}
module.exports = { prepareDuriChapter };
