const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAudioPreview } = require('../utils/audioPreview');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function fixture(options = {}) {
  const players = [], errors = [], states = [];
  const service = createAudioPreview({ loadSource: async x => x, configure: async () => {}, createPlayer(source) {
    const calls = [];
    const player = { source, calls, playing: false, addListener(_, listener) { this.emit = listener; return { remove: () => calls.push('unsubscribe') }; },
      seekTo(time) { calls.push(['seek', time]); return Promise.resolve(); },
      play() { calls.push('play'); this.playing = true; this.emit({ isLoaded: true, playing: true }); },
      pause() { calls.push('pause'); this.playing = false; }, remove() { calls.push('remove'); }, release() { calls.push('release'); } };
    players.push(player); return player;
  }, ...options });
  return { service, players, errors, states, callbacks: { onError: e => errors.push(e.message), onState: state => states.push(state) } };
}
test('Stop explicitly pauses before removing and releasing an audible player', async () => {
  const f = fixture(); const session = f.service.play('adhan', f.callbacks); await session.ready;
  assert.equal(f.players[0].playing, true); session.stop(); session.stop();
  assert.equal(f.players[0].playing, false);
  assert.deepEqual(f.players[0].calls, ['play', 'pause', 'unsubscribe', 'remove', 'release']);
  assert.equal(f.states.at(-1), 'idle');
});
test('Stop while downloading prevents a late player from starting', async () => {
  const download = deferred(); const f = fixture({ loadSource: () => download.promise });
  const session = f.service.play('adhan', f.callbacks); session.stop(); download.resolve('local.mp3');
  assert.equal(await session.ready, false); assert.equal(f.players.length, 0);
});
test('switching previews cancels an older download, even if it finishes later', async () => {
  const download = deferred(); const f = fixture({ loadSource: source => source === 'old' ? download.promise : Promise.resolve(source) });
  const first = f.service.play('old'); const second = f.service.play('new'); await second.ready;
  download.resolve('old-local'); await first.ready;
  assert.deepEqual(f.players.map(p => p.source), ['new']); second.stop();
});
test('asset download rejection is handled without an unhandled promise', async () => {
  const f = fixture({ loadSource: async () => { throw Error('ExpoAsset download rejected'); } });
  assert.equal(await f.service.play('adhan', f.callbacks).ready, false);
  assert.deepEqual(f.errors, ['ExpoAsset download rejected']); assert.equal(f.states.at(-1), 'idle');
});
test('native playback errors stop audio and allow a subsequent preview', async () => {
  const f = fixture(); await f.service.play('bad', f.callbacks).ready;
  f.players[0].emit({ error: 'Decoder failed' }); assert.equal(f.players[0].playing, false);
  const next = f.service.play('good', f.callbacks); await next.ready;
  assert.equal(f.players[1].playing, true); assert.deepEqual(f.errors, ['Decoder failed']); next.stop();
});
test('Stop during audio configuration prevents delayed playback', async () => {
  const config = deferred(); const f = fixture({ configure: () => config.promise });
  const session = f.service.play('adhan'); await new Promise(resolve => setImmediate(resolve)); session.stop(); config.resolve();
  await session.ready; assert.equal(f.players.length, 0);
});
test('stalled downloads time out and finish in a recoverable state', async () => {
  const f = fixture({ loadSource: () => new Promise(() => {}), timeout: 15 });
  assert.equal(await f.service.play('adhan', f.callbacks).ready, false);
  assert.match(f.errors[0], /could not load/); assert.equal(f.states.at(-1), 'idle');
});

test('ayah playback seeks before becoming audible and stops at the ayah boundary', async () => {
  const f = fixture(), progress = [];
  const session = f.service.play('surah.opus', { ...f.callbacks, startTime: 42, endTime: 49, onProgress: t => progress.push(t) });
  await session.ready;
  assert.deepEqual(f.players[0].calls.slice(0, 2), [['seek', 42], 'play']);
  f.players[0].emit({ isLoaded: true, playing: true, currentTime: 44 });
  assert.equal(progress.at(-1), 44);
  session.pause(); assert.equal(f.players[0].playing, false);
  session.resume(); assert.equal(f.players[0].playing, true);
  f.players[0].emit({ isLoaded: true, playing: true, currentTime: 49 });
  assert.equal(f.players[0].playing, false); assert.equal(f.states.at(-1), 'idle');
});
test('Stop or resume while seeking cannot start sound before the seek finishes', async () => {
  const seeking = deferred(), calls = [];
  const f = fixture({ createPlayer: () => ({ addListener: () => ({ remove() {} }), seekTo: () => seeking.promise,
    play: () => calls.push('play'), pause() {}, remove() {} }) });
  const session = f.service.play('surah.opus', { startTime: 10 });
  await new Promise(resolve => setImmediate(resolve));
  session.pause(); session.resume(); assert.deepEqual(calls, []);
  session.stop(); seeking.resolve();
  assert.equal(await session.ready, false); assert.deepEqual(calls, []);
});

test('backward seeking ignores a stale end position and only the newest seek can resume', async () => {
  const f = fixture(); const session = f.service.play('surah.opus', f.callbacks); await session.ready;
  const first = deferred(), second = deferred(); let count = 0;
  f.players[0].seekTo = () => ++count === 1 ? first.promise : second.promise;
  const older = session.seekTo(20, { end: 22 });
  const newest = session.seekTo(4, { end: 6 });
  first.resolve(); assert.equal(await older, false); assert.equal(f.players[0].playing, false);
  second.resolve(); assert.equal(await newest, true);
  f.players[0].emit({ isLoaded: true, playing: true, currentTime: 40 });
  assert.equal(f.players[0].playing, true);
  f.players[0].emit({ isLoaded: true, playing: true, currentTime: 4.2 });
  f.players[0].emit({ isLoaded: true, playing: true, currentTime: 6 });
  assert.equal(f.players[0].playing, false);
});
