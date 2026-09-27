/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { tafsirReferences, tafsirPlainText, normalizeTafsir, distinctTafsirPassages } = require('../utils/quranTafsir');
const { getReaderChapter } = require('../utils/quranReaderText');
const { TAFSIR_SOURCES, tafsirSource } = require('../data/tafsirSources');

test('all Hafs and Duri ayahs resolve every matching Tafsir reference', () => {
  for (const reader of ['hafs', 'duri']) {
    for (let chapter = 1; chapter <= 114; chapter++) {
      for (const verse of getReaderChapter(chapter, reader)) {
        const keys = tafsirReferences(verse.key, reader);
        const expected = reader === 'hafs' ? [verse.key] : [...new Set(verse.routes.flatMap(([, , routes]) => routes.map(([key]) => key)))];
        assert.deepEqual(new Set(keys), new Set(expected));
      }
    }
  }
  assert.deepEqual(tafsirReferences('1:1', 'duri'), ['1:2']);
  assert.deepEqual(tafsirReferences('2:1', 'duri'), ['2:1', '2:2'], 'one Duri ayah can span two Hafs ayahs');
  assert.deepEqual(tafsirReferences('67:9', 'duri'), ['67:9'], 'printed Duri 9–10 share one Hafs passage');
  assert.throws(() => tafsirReferences('115:1', 'hafs'));
  assert.throws(() => tafsirReferences('2:999', 'duri'));
});

const response = (sourceId, key, text = '<p>Explanation text.</p>', references = [key]) => ({ tafsir: {
  resource_id: sourceId, verses: Object.fromEntries(references.map(ref => [ref, {}])), text,
} });
test('Tafsir retains paragraphs and Arabic, rejects wrong references and deduplicates grouped passages', () => {
  assert.equal(tafsirPlainText('<h2>Title &amp; context</h2><p>بِسْمِ اللَّهِ<br>One &#x2014; two &quot;three&quot;.</p><script>bad()</script>'), 'Title & context\n\nبِسْمِ اللَّهِ\nOne — two "three".');
  assert.doesNotThrow(() => tafsirPlainText('&#999999999999;'));
  const source = tafsirSource(169);
  assert.throws(() => normalizeTafsir(response(91, '2:1'), source, '2:1'), /mismatch/);
  assert.throws(() => normalizeTafsir(response(169, '2:2'), source, '2:1'), /mismatch/);
  assert.throws(() => normalizeTafsir(response(169, '2:1', ''), source, '2:1'), /unavailable/);
  const payload = response(169, '2:1', '<p>Grouped explanation</p>', ['2:1', '2:2']);
  const first = normalizeTafsir(payload, source, '2:1'), second = normalizeTafsir(payload, source, '2:2');
  assert.equal(distinctTafsirPassages([first, second]).length, 1);
});

function service(storage, get) {
  const filename = path.resolve(__dirname, '../services/TafsirService.js'), localRequire = createRequire(filename);
  const code = babel.transformFileSync(filename, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === 'axios') return { get };
    return localRequire(name);
  } }, { filename });
  return module.exports;
}
test('Tafsir shares in-flight requests, caches successful reads and retries failures', async () => {
  const saved = new Map(); let requests = 0, fail = false;
  const storage = { getItem: async key => saved.get(key) || null, setItem: async (key, value) => saved.set(key, value) };
  const api = service(storage, async (url, options) => {
    requests++; assert.equal(options.timeout, 15000);
    if (fail) throw new Error('offline');
    const match = url.match(/tafsirs\/(\d+)\/by_ayah\/(\d+:\d+)$/);
    return { data: response(Number(match[1]), match[2]) };
  });
  const [a, b] = await Promise.all([api.loadTafsir(169, '2:255'), api.loadTafsir(169, '2:255')]);
  assert.equal(requests, 1); assert.deepEqual(a, b);
  fail = true;
  assert.equal((await api.loadTafsir(169, '2:255')).key, '2:255');
  await assert.rejects(api.loadTafsir(91, '2:255'), /offline/);
  fail = false;
  assert.equal((await api.loadTafsir(91, '2:255')).sourceId, 91);
  await new Promise(resolve => setImmediate(resolve));
  const offline = service(storage, () => { throw new Error('must use stored copy'); });
  assert.equal((await offline.loadTafsir(169, '2:255')).key, '2:255');
});
test('source choice is remembered, writes preserve tap order and unknown saved choices fall back by language', async () => {
  let saved = '999', writes = [];
  const api = service({ getItem: async () => saved, setItem: async (_, value) => { await new Promise(resolve => setImmediate(resolve)); saved = value; writes.push(value); } }, () => {});
  assert.equal((await api.readTafsirSource('ar')).id, 91);
  assert.equal((await api.readTafsirSource('en')).id, 169);
  await Promise.all([api.saveTafsirSource(14), api.saveTafsirSource(168)]);
  assert.deepEqual(writes, ['14', '168']);
  assert.equal((await api.readTafsirSource('ar')).id, 168);
  await assert.rejects(api.saveTafsirSource(999));
  assert.equal(new Set(TAFSIR_SOURCES.map(source => source.id)).size, TAFSIR_SOURCES.length);
});
