const { test } = require('node:test');
const assert = require('node:assert/strict');
const { wheelIndex, createWheelInteraction } = require('../utils/wheelPicker');
function wheel() {
  const selected = [], moving = [], aligned = [], jobs = [];
  const interaction = createWheelInteraction({ count: 30, rowHeight: 52, initialIndex: 0,
    onSelect: value => selected.push(value), onMoving: value => moving.push(value), onAlign: (...value) => aligned.push(value),
    schedule: callback => { jobs.push(callback); return jobs.length; }, cancelSchedule: () => {},
  });
  return { interaction, selected, moving, aligned, jobs };
}
test('a short drag without momentum snaps to the nearest row and settles once', () => {
  const w = wheel(); w.interaction.begin(0); w.interaction.scroll(112); w.interaction.endDrag(112);
  assert.deepEqual(w.selected, []); assert.equal(w.moving.at(-1), true);
  w.jobs.at(-1)(); assert.deepEqual(w.selected, [2]); assert.equal(w.moving.at(-1), false);
  w.interaction.momentumEnd(112); assert.deepEqual(w.selected, [2]);
});
test('coasting postpones commitment and ignores stale idle callbacks', () => {
  const w = wheel(); w.interaction.begin(0); w.interaction.endDrag(60);
  const oldIdle = w.jobs.at(-1); w.interaction.momentumBegin(); w.interaction.scroll(260);
  oldIdle(); assert.deepEqual(w.selected, []);
  w.interaction.momentumEnd(312); assert.deepEqual(w.selected, [6]);
  w.jobs.forEach(job => job()); assert.deepEqual(w.selected, [6]);
});
test('a linked column change cancels old inertia even when its selected row is unchanged', () => {
  const w = wheel(); w.interaction.begin(0); w.interaction.endDrag(300);
  w.interaction.sync(0); w.interaction.momentumEnd(600); w.jobs.forEach(job => job());
  assert.deepEqual(w.selected, []); assert.deepEqual(w.aligned.at(-1), [0, true]); assert.equal(w.moving.at(-1), false);
});
test('a deliberate tap wins over a previous wheel gesture', () => {
  const w = wheel(); w.interaction.begin(0); w.interaction.endDrag(500); w.interaction.tap(4);
  w.interaction.momentumEnd(700); w.jobs.forEach(job => job());
  assert.deepEqual(w.selected, [4]); assert.deepEqual(w.aligned.at(-1), [4, true]);
});
test('closing or replacing a Surah wheel prevents a delayed selection', () => {
  const w = wheel(); w.interaction.begin(0); w.interaction.endDrag(500); w.interaction.dispose();
  w.jobs.forEach(job => job()); w.interaction.momentumEnd(500);
  assert.deepEqual(w.selected, []); assert.equal(w.moving.at(-1), false);
});
test('wheel snapping remains bounded at the first and last ayah and across row sizes', () => {
  for (const height of [48, 52, 78]) for (const count of [3, 7, 30, 114, 286]) {
    assert.equal(wheelIndex(-height, height, count), 0);
    assert.equal(wheelIndex(height * count, height, count), count - 1);
    assert.equal(wheelIndex(height * 1.6, height, count), 2);
  }
});
test('linked changes roll into place while first layout aligns without an entrance sweep', () => {
  const w = wheel(); w.interaction.sync(20); assert.deepEqual(w.aligned.at(-1), [20, true]);
  w.interaction.sync(20, true); assert.deepEqual(w.aligned.at(-1), [20, false]);
  w.interaction.begin(1040); w.interaction.endDrag(1200);
  w.interaction.sync(0, false, 7); w.interaction.momentumEnd(1200); w.jobs.forEach(job => job());
  assert.deepEqual(w.selected, []); assert.deepEqual(w.aligned.at(-1), [0, true]);
  w.interaction.tap(15); assert.deepEqual(w.selected, [6]);
  w.interaction.sync(145, false, 286); assert.deepEqual(w.aligned.at(-1), [145, true]);
});
test('wheel feedback ticks only for user changes and throttles fast flings', () => {
  const ticks = []; let time = 0;
  const w = createWheelInteraction({ count: 30, rowHeight: 52, initialIndex: 0,
    onSelect() {}, onMoving() {}, onAlign() {}, onTick: () => ticks.push(time), now: () => time,
  });
  w.sync(5); w.scroll(260); assert.deepEqual(ticks, []);
  w.begin(260); w.scroll(312); w.scroll(315); time = 10; w.scroll(364);
  time = 70; w.scroll(416); assert.deepEqual(ticks, [0, 70]);
  w.sync(2); w.scroll(104); assert.deepEqual(ticks, [0, 70]);
  time = 140; w.tap(4); assert.deepEqual(ticks, [0, 70, 140]); w.dispose();
});
test('old native momentum cannot settle a new gesture while the finger is still down', () => {
  const w = wheel(); w.interaction.sync(12); w.interaction.begin(400);
  w.interaction.momentumBegin(); w.interaction.momentumEnd(624); w.jobs.forEach(job => job());
  assert.deepEqual(w.selected, []); assert.equal(w.moving.at(-1), true);
  w.interaction.endDrag(416); w.interaction.momentumEnd(416); assert.deepEqual(w.selected, [8]);
});
