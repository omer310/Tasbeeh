const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pageSlot, createMushafTurn } = require('../utils/mushafPager');

function pager(page = 300, width = 400) {
  const places = [], animations = [], commits = [];
  const turn = createMushafTurn({ origin: page, page, width, stop() {}, place: value => places.push(value),
    animate: (to, spring, done) => animations.push({ to, spring, done }), commit: page => commits.push(page) });
  return { turn, places, animations, commits };
}
test('Mushaf pages never overlap at any point of a swipe or its ownership handoff', () => {
  for (const width of [320, 412, 768, 1024]) for (const origin of [1, 2, 300, 603, 604]) {
    for (const target of [origin - 1, origin + 1].filter(page => page >= 1 && page <= 604)) {
      for (let step = 0; step <= 20; step++) {
        const position = (target - origin) * step / 20;
        const outgoing = (pageSlot(origin, origin) + position) * width;
        const incoming = (pageSlot(origin, target) + position) * width;
        assert.ok(Math.abs(Math.abs(incoming - outgoing) - width) < 0.000001);
      }
      assert.equal((pageSlot(origin, target) + target - origin) * width, 0);
    }
  }
});
test('committing consecutive turns leaves the native strip at its arrived position', () => {
  const p = pager();
  p.turn.begin(); p.turn.drag(100); p.turn.release(100, 0);
  assert.equal(p.turn.moving, true);
  p.animations.at(-1).done(true); assert.deepEqual(p.commits, [301]);
  const placed = p.places.length;
  p.turn.sync(301, 400); assert.equal(p.places.length, placed); assert.equal(p.turn.moving, false);
  p.turn.begin(); p.turn.release(100, 0); assert.equal(p.animations.at(-1).to, 2);
  p.animations.at(-1).done(true); p.turn.sync(302, 400);
  p.turn.begin(); p.turn.release(-100, 0); assert.equal(p.animations.at(-1).to, 1);
  p.animations.at(-1).done(true); assert.deepEqual(p.commits, [301, 302, 301]);
});
test('external jumps, resizing and disposal cancel stale native animation completions', () => {
  for (const interrupt of [p => p.turn.sync(420, 400), p => p.turn.sync(300, 700), p => p.turn.dispose()]) {
    const p = pager(); p.turn.release(200, 1); const old = p.animations.at(-1);
    interrupt(p); old.done(true); assert.deepEqual(p.commits, []);
  }
});
test('short pulls settle back and outer page edges cannot turn beyond the Mushaf', () => {
  for (const [page, dx] of [[1, -100], [604, 100], [30, 10]]) {
    const p = pager(page); p.turn.drag(dx); p.turn.release(dx, 0);
    assert.equal(p.animations.at(-1).to, 0); assert.equal(p.animations.at(-1).spring, true);
    p.animations.at(-1).done(true); assert.equal(p.turn.moving, false); assert.deepEqual(p.commits, []);
  }
});
test('a native interruption restores the current page without leaving gestures blocked', () => {
  const p = pager(); p.turn.release(200, 1); p.animations.at(-1).done(false);
  assert.equal(p.turn.moving, false); assert.equal(p.places.at(-1), 0); assert.deepEqual(p.commits, []);
});
