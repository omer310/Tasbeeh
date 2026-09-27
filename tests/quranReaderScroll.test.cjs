const { test } = require('node:test');
const assert = require('node:assert/strict');
const { textLayoutKey, pullBoundary, createSeekBudget } = require('../utils/quranReaderScroll');
const { vectorGeometry, MUSHAF_CONTROLS_HEIGHT } = require('../utils/printedMushaf');

test('font size 44 and typography changes discard stale list measurements; scrolling does not', () => {
  const base = { mode: 'verses', fontSize: 30, translation: true, riwayah: 'hafs', width: 390, fontScale: 1 };
  for (const change of [{fontSize:44},{mode:'flow'},{translation:false},{riwayah:'duri'},{width:800},{fontScale:1.4}]) {
    assert.notEqual(textLayoutKey(base), textLayoutKey({ ...base, ...change }));
  }
  assert.equal(textLayoutKey(base), textLayoutKey({ ...base, anchorVerse: '2:150', playingKey: '2:151', followAudio: false }));
});

test('estimated short content midway through a Surah cannot steal a scroll for a Surah transition', () => {
  const reading = { delta: -4, offset: 800, height: 600, content: 1400, firstVisible: false, lastVisible: false, lastBottom: null, previous: true, next: true };
  assert.equal(pullBoundary(reading), null);
  assert.equal(pullBoundary({ ...reading, lastBottom: 1400 }), null);
  assert.equal(pullBoundary({ ...reading, lastVisible: true }), null);
  assert.equal(pullBoundary({ ...reading, lastVisible: true, lastBottom: 1800 }), null);
});

test('only the actual start/end and an outward drag can activate a Surah pull', () => {
  const atEnd = { delta: -4, offset: 900, height: 600, content: 1500, firstVisible: false, lastVisible: true, lastBottom: 1420, previous: true, next: true };
  assert.equal(pullBoundary(atEnd), 'next');
  assert.equal(pullBoundary({ ...atEnd, delta: 4 }), null);
  assert.equal(pullBoundary({ ...atEnd, next: false }), null);
  assert.equal(pullBoundary({ ...atEnd, offset: 0, delta: 4, firstVisible: true }), 'previous');
  assert.equal(pullBoundary({ ...atEnd, offset: 0, delta: 4, firstVisible: false }), null);
  assert.equal(pullBoundary({ ...atEnd, offset: 0, delta: 4, firstVisible: true, previous: false }), null);
});

test('layout callbacks and word updates cannot replenish an exhausted scroll retry budget', () => {
  const seek = createSeekBudget(6);
  for (let i = 0; i < 30; i++) {
    seek.begin(150);
    assert.equal(seek.retry(150), i < 6);
  }
  seek.begin(151); assert.equal(seek.retry(151), true);
  assert.equal(seek.retry(150), false);
});

test('manual scrolling cancels late retries, while an explicit fresh seek can recover', () => {
  const seek = createSeekBudget(); seek.begin(80); assert.equal(seek.retry(80), true);
  seek.cancel(); assert.equal(seek.target(), null); assert.equal(seek.retry(80), false);
  seek.begin(80); assert.equal(seek.retry(80), true);
});

test('Mushaf always fits the full page above the player on small phones and landscape', () => {
  for (const box of [[0,0,345,550],[-2,-74,242,308]]) for (const [width, height] of [[280,330],[390,700],[768,780],[900,170]]) {
    const page = vectorGeometry(box, width, height - MUSHAF_CONTROLS_HEIGHT);
    assert.ok(page.width <= width && page.height <= height - MUSHAF_CONTROLS_HEIGHT);
  }
});
