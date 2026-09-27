const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { unzipSync, strFromU8 } = require('fflate');
const { printedPage, printedPageForAyah, firstPrintedReference, printedReference, vectorGeometry, regionBounds } = require('../utils/printedMushaf');
const { getReaderChapter } = require('../utils/quranReaderText');
const manifest = require('../data/quran/printed-pages/manifest.json');

test('every printed ayah region maps to a valid reader passage, including the Duri Al-Mulk split', () => {
  for (const edition of ['hafs', 'duri']) {
    const expected = new Set(Array.from({ length: 114 }, (_, i) => getReaderChapter(i + 1, edition).map(v => v.key)).flat());
    const seen = new Set();
    for (let page = 1; page <= 604; page++) {
      const data = printedPage(page, edition);
      assert.ok(data.regions.length);
      assert.equal(firstPrintedReference(page, edition), data.regions[0][1]);
      for (const [printed, key, outline] of data.regions) {
        assert.ok(expected.has(key), `${edition}/${page}/${printed} -> ${key}`);
        assert.equal(printedPageForAyah(key, edition, page), page);
        assert.ok(outline.startsWith('M'));
        const bounds = regionBounds(outline), [x, y, w, h] = data.viewBox;
        assert.ok(bounds.left >= x && bounds.top >= y && bounds.right <= x + w && bounds.bottom <= y + h, `${edition}/${page}/${key}`);
        seen.add(key);
      }
    }
    assert.deepEqual(seen, expected);
  }
  const mulk = printedPage(562, 'noreen').regions;
  assert.equal(mulk.find(([key]) => key === '67:9')[1], '67:9');
  assert.equal(mulk.find(([key]) => key === '67:10')[1], '67:9');
  assert.equal(printedPage(564, 'noreen').regions.find(([key]) => key === '67:31')[1], '67:30');
  assert.equal(printedReference('67:9', 'noreen'), '67:9–10');
  assert.equal(printedReference('67:30', 'noreen'), '67:31');
  assert.equal(printedReference('67:30', 'alafasy'), '67:30');
});

test('all 1208 bundled artwork archives decode and match their pinned checksums and coordinate systems', () => {
  for (const edition of ['hafs', 'duri']) for (let page = 1; page <= 604; page++) {
    const file = fs.readFileSync(path.join(__dirname, `../assets/quran-vectors/${edition}/${page}.zip`));
    assert.equal(crypto.createHash('sha256').update(file).digest('hex'), manifest.editions[edition].assetSha256[page - 1]);
    const files = unzipSync(file);
    assert.deepEqual(Object.keys(files), ['page.svg']);
    const xml = strFromU8(files['page.svg']);
    assert.ok(xml.includes('<path'));
    assert.ok(!xml.includes('ayahPolygon'), 'Touch regions belong to the independent overlay');
    assert.ok(!/<(?:script|text|image)\b/i.test(xml), 'Artwork must contain self-contained vector outlines');
    const box = xml.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.deepEqual(box, printedPage(page, edition).viewBox);
  }
});

test('page and overlay share one undistorted transform on phone, tablet and landscape', () => {
  for (const edition of ['hafs', 'duri']) for (const page of [1, 2, 81, 562, 604]) {
    const data = printedPage(page, edition);
    for (const [width, height] of [[280, 350], [390, 620], [768, 780], [900, 170]]) {
      {
        const g = vectorGeometry(data.viewBox, width, height);
        assert.ok(g.width > 0 && g.height > 0);
        assert.ok(Math.abs(g.width / g.height - data.viewBox[2] / data.viewBox[3]) < 1e-9);
        assert.ok(g.width <= width && g.height <= height);
        for (const [, , d] of data.regions) {
          const b = regionBounds(d);
          assert.ok((b.right - data.viewBox[0]) * g.scale <= g.width + .001);
          assert.ok((b.bottom - data.viewBox[1]) * g.scale <= g.height + .001);
        }
      }
    }
  }
});
