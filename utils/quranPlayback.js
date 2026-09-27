const { verseAtTime } = require('./quranPlaybackTimings');
const { wordClip } = require('./quranWordClip');
const { timelineCue } = require('./quranTimelineCue');

function createQuranPlayback({ loadPlan, playAudio, prefetch = () => {}, discardCached = () => {}, onChange = () => {} }) {
  let state = { status: 'idle', playingKey: null, word: null, partial: false, single: false, follow: true, error: '' };
  let request = 0, generation = 0, session = null, plan = null, ready = false, seekTarget = null, loadingPlan = false;
  const emit = changes => {
    if (!Object.keys(changes).some(key => state[key] !== changes[key])) return;
    state = { ...state, ...changes }; onChange(state);
  };
  const stop = () => {
    ++request; ++generation;
    const previous = session; session = null; plan = null; ready = false; seekTarget = null; loadingPlan = false;
    previous?.stop();
    emit({ status: 'idle', playingKey: null, word: null, lastWord: null, partial: false, wordOnly: false });
  };
  const fail = error => { if (plan) discardCached(plan); stop(); emit({ error: error?.message || 'Audio could not load. Please try again.' }); };
  const progress = seconds => {
    if (loadingPlan || !plan || !Number.isFinite(seconds)) return;
    // Discard a queued position event from before a seek until the new position
    // arrives. Otherwise the highlight briefly jumps to the old ayah.
    if (seekTarget !== null) { if (Math.abs(seconds - seekTarget) > 2) return; seekTarget = null; }
    const verse = plan.individual || state.single ? plan : verseAtTime(plan.timeline, seconds) || plan;
    const cue = !state.single && !plan.individual ? timelineCue(plan.cues, seconds * 1000) : null;
    if (cue) { emit({ playingKey: cue.key, word: cue.highlight, lastWord: cue.highlight || (state.playingKey === cue.key ? state.lastWord : null), partial: cue.partial }); return; }
    const word = verse.segments.find(s => seconds * 1000 >= s.start && seconds * 1000 < s.end)?.highlight ?? null;
    emit({ playingKey: verse.key, word, lastWord: word || (state.playingKey === verse.key ? state.lastWord : null), partial: verse.partial });
  };
  async function start(reciter, key, { single = false, paused = false, follow = true, range = null } = {}) {
    if (range) single = true;
    const id = ++request;
    loadingPlan = true;
    session?.pause();
    if (id !== request) return;
    emit({ status: 'loading', playingKey: key, word: null, lastWord: null, partial: false, single, wordOnly: !!range, follow, error: '' });
    try {
      let next = await loadPlan(reciter, key);
      if (id !== request) return;
      if (range) {
        const clip = wordClip(next, range);
        if (!clip) throw Error('This word has no separate timing. You can play the ayah instead.');
        next = { ...next, ...clip };
      }
      loadingPlan = false;
      const reuse = ready && session && plan?.sourceId === next.sourceId;
      plan = next; seekTarget = next.startTime;
      emit({ partial: next.partial });
      const endTime = single ? next.endTime : undefined;
      if (reuse) {
        await session.seekTo(next.startTime, { end: endTime, resume: !paused });
      } else {
        const mine = ++generation;
        session?.stop(); ready = false;
        session = playAudio(next.source, {
          startTime: next.startTime, endTime, autoPlay: !paused,
          onProgress: seconds => { if (generation === mine) progress(seconds); },
          onState: (status, reason) => {
            if (generation !== mine) return;
            if (status === 'idle') {
              ready = false;
              if (reason !== 'complete' && reason !== 'error') stop();
            } else if (!loadingPlan) emit({ status });
          },
          onError: error => { if (generation === mine) fail(error); },
          onComplete: () => {
            if (generation !== mine) return;
            const current = plan; session = null; ready = false;
            if (loadingPlan) return;
            if (!state.single && current?.individual && current.index + 1 < current.timeline.length) {
              void start(current.reciter, current.timeline[current.index + 1].key, { follow: state.follow });
            } else stop();
          },
        });
        const active = session;
        if (await active.ready && generation === mine && session === active) ready = true;
      }
      if (id === request && plan && !state.single) prefetch(plan);
    } catch (error) { if (id === request) fail(error); }
  }
  function toggle(reciter, key) {
    if (state.status === 'loading') { stop(); return; }
    if (session) { if (state.status === 'paused') session.resume(); else session.pause(); }
    else void start(reciter, key);
  }
  function skip(direction) {
    if (!plan) return;
    const index = Number((state.playingKey || plan.key).split(':')[1]) - 1 + direction;
    if (index < 0 || index >= plan.timeline.length) return;
    void start(plan.reciter, plan.timeline[index].key, { single: state.single, paused: state.status === 'paused' });
  }
  return { start, toggle, skip, stop, follow: value => emit({ follow: value }), getState: () => state };
}
module.exports = { createQuranPlayback };
