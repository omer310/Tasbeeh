const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createQuranPlayback } = require('../utils/quranPlayback');
const { createAudioPreview } = require('../utils/audioPreview');
const settle = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { resolve, promise }; };
function fixture({ individual = false, loadPlan: override } = {}) {
  const players = [], prefetched = [], states = [];
  const timeline = [0, 1, 2].map(i => ({ key: `1:${i + 1}`, startTime: individual ? 0 : i * 2, endTime: individual ? undefined : i * 2 + 1.5, partial: i === 1,
    segments: [{ start: individual ? 100 : i * 2000 + 100, end: individual ? 1000 : i * 2000 + 1000, highlight: { from: 0, to: i + 1 } }] }));
  const load = async (reciter, key) => { const index = Number(key.split(':')[1]) - 1; const uri = `${reciter}/${individual ? key : 'surah'}`; return { ...timeline[index], source: { uri }, sourceId: uri, individual, timeline, reciter, index }; };
  const preview = createAudioPreview({ configure: async () => {}, loadSource: async value => value, createPlayer(source) {
    const p = { source, time: 0, playing: false, seeks: [], removed: false,
      addListener(_, emit) { this.emit = emit; return { remove() {} }; },
      seekTo(time) { this.time = time; this.seeks.push(time); return Promise.resolve(); },
      play() { this.playing = true; this.emit({ isLoaded: true, playing: true, currentTime: this.time }); },
      pause() { this.playing = false; }, remove() { this.removed = true; },
      progress(time) { this.time = time; this.emit({ isLoaded: true, playing: true, currentTime: time }); },
      finish() { this.emit({ isLoaded: true, didJustFinish: true, currentTime: this.time }); } };
    players.push(p); return p;
  } });
  const controller = createQuranPlayback({ loadPlan: override ? (r, k) => override(r, k, load) : load, playAudio: preview.play, prefetch: p => prefetched.push(p.key), onChange: s => states.push(s) });
  return { controller, players, prefetched, states, preview };
}

test('one surah session follows ayahs and words continuously, clearing words in pauses', async () => {
  const f = fixture(); await f.controller.start('sudan', '1:1');
  f.players[0].progress(0.2); assert.deepEqual(f.controller.getState().word, { from: 0, to: 1 });
  f.players[0].progress(1.6); assert.equal(f.controller.getState().word, null);
  assert.deepEqual(f.controller.getState().lastWord, { from: 0, to: 1 }); // following must not jump back during a pause
  f.players[0].progress(2.2); assert.equal(f.controller.getState().playingKey, '1:2');
  assert.equal(f.controller.getState().partial, true); assert.equal(f.players.length, 1);
  f.players[0].finish(); assert.equal(f.controller.getState().status, 'idle');
});
test('next and previous seek the existing surah player; paused skips remain paused', async () => {
  const f = fixture(); await f.controller.start('sudan', '1:1');
  f.controller.skip(1); await settle();
  assert.equal(f.players.length, 1); assert.deepEqual(f.players[0].seeks, [2]);
  assert.equal(f.controller.getState().playingKey, '1:2');
  f.controller.toggle('sudan', '1:2'); f.controller.skip(1); await settle();
  assert.equal(f.players[0].playing, false); assert.equal(f.controller.getState().status, 'paused');
  f.controller.skip(-1); await settle(); assert.deepEqual(f.players[0].seeks, [2, 4, 2]);
  f.controller.stop();
});
test('Play this ayah stops at its boundary; switching back to continuous removes the stop boundary', async () => {
  const f = fixture(); await f.controller.start('sudan', '1:1', { single: true });
  f.players[0].progress(1.5); assert.equal(f.controller.getState().status, 'idle');
  await f.controller.start('sudan', '1:1', { single: true });
  await f.controller.start('sudan', '1:2');
  assert.equal(f.players.length, 2); f.players[1].progress(4.2);
  assert.equal(f.controller.getState().playingKey, '1:3'); assert.equal(f.players[1].removed, false);
  f.controller.stop();
});
test('individual tracks advance and prefetch while preserving manual scroll choice; stop at Surah end', async () => {
  const f = fixture({ individual: true }); await f.controller.start('other', '1:1');
  assert.deepEqual(f.prefetched, ['1:1']); f.controller.follow(false);
  f.players[0].finish(); await settle();
  assert.equal(f.players[1].source.uri, 'other/1:2'); assert.equal(f.controller.getState().follow, false);
  f.players[1].finish(); await settle(); f.players[2].finish(); await settle();
  assert.equal(f.players.length, 3); assert.equal(f.controller.getState().status, 'idle');
});
test('single-ayah mode never starts the next independent recording', async () => {
  const f = fixture({ individual: true }); await f.controller.start('other', '1:1', { single: true });
  f.players[0].finish(); await settle(); assert.equal(f.players.length, 1); assert.equal(f.controller.getState().status, 'idle');
});
test('an old plan resolving late cannot override the newest request', async () => {
  const delayed = deferred();
  const f = fixture({ loadPlan: async (r, k, load) => { if (k === '1:1') await delayed.promise; return load(r, k); } });
  const first = f.controller.start('sudan', '1:1'); await f.controller.start('sudan', '1:3');
  delayed.resolve(); await first; assert.equal(f.players.length, 1); assert.equal(f.controller.getState().playingKey, '1:3');
  f.controller.stop();
});
test('cancelling during loading prevents a delayed start', async () => {
  const delayed = deferred();
  const f = fixture({ loadPlan: async (r, k, load) => { await delayed.promise; return load(r, k); } });
  const pending = f.controller.start('sudan', '1:1'); f.controller.toggle('sudan', '1:1');
  delayed.resolve(); await pending; assert.equal(f.players.length, 0); assert.equal(f.controller.getState().status, 'idle');
});
test('old progress and completion cannot replace a requested reader while its plan loads', async () => {
  const delayed = deferred();
  const f = fixture({ individual: true, loadPlan: async (r, k, load) => { if (r === 'new') await delayed.promise; return load(r, k); } });
  await f.controller.start('old', '1:1'); const next = f.controller.start('new', '1:3');
  assert.equal(f.players[0].playing, false);
  f.players[0].progress(0.5); f.players[0].finish(); await settle();
  assert.equal(f.controller.getState().playingKey, '1:3'); assert.equal(f.players.length, 1);
  delayed.resolve(); await next; assert.equal(f.players[1].source.uri, 'new/1:3'); f.controller.stop();
});
test('an external Azan preview interrupts Quran without resurrecting the queue', async () => {
  const f = fixture({ individual: true }); await f.controller.start('other', '1:1');
  const other = f.preview.play({ uri: 'adhan' }); await other.ready;
  f.players[0].finish(); await settle(); assert.equal(f.controller.getState().status, 'idle');
  assert.equal(f.players.length, 2); other.stop();
});
test('a playback error clears audio ownership and the next Play can recover', async () => {
  const f = fixture(); await f.controller.start('sudan', '1:1');
  f.players[0].emit({ error: 'Offline' }); assert.equal(f.controller.getState().status, 'idle');
  assert.equal(f.controller.getState().error, 'Offline'); await f.controller.start('sudan', '1:2');
  assert.equal(f.controller.getState().error, ''); assert.equal(f.players[1].playing, true); f.controller.stop();
});


test('word playback seeks an existing stream, stops at its word boundary and never advances', async () => {
  const f=fixture(); await f.controller.start('sudan','1:1');
  await f.controller.start('sudan','1:2',{range:{from:0,to:2}});
  assert.equal(f.players.length,1); assert.equal(f.players[0].time,2.1);
  assert.equal(f.controller.getState().wordOnly,true);
  f.players[0].progress(3); assert.equal(f.controller.getState().status,'idle');
  assert.equal(f.players.length,1);
});
test('unavailable word clips report an error and cannot play a guessed slice', async () => {
  const f=fixture(); await f.controller.start('sudan','1:1',{range:{from:10,to:15}});
  assert.equal(f.players.length,0); assert.match(f.controller.getState().error,/no separate timing/);
});
test('continuous playback follows repeated native Duri references instead of an ayah-number approximation', async () => {
  const f=fixture({loadPlan:async(r,k,load)=>({...await load(r,k),cues:[
    {key:'1:2',start:100,end:300,highlight:{from:0,to:2},partial:false},
    {key:'1:1',start:400,end:600,highlight:{from:0,to:1},partial:false}
  ]})});
  await f.controller.start('sudan','1:1');
  f.players[0].progress(.2); assert.equal(f.controller.getState().playingKey,'1:2');
  f.players[0].progress(.5); assert.equal(f.controller.getState().playingKey,'1:1');
  f.controller.stop();
});
