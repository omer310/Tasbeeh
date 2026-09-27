const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getReaderChapter, canonicalReference, readerReference, verseWords } = require('../utils/quranReaderText');
const { getQuranChapter } = require('../utils/quranData');
const { prepareDuriChapter } = require('../utils/prepareDuriAudio');
const { wordClip } = require('../utils/quranWordClip');
const { wordPageRows, pageForWord } = require('../utils/quranWordPages');
const { locateTextLine, followOffset } = require('../utils/quranFollow');
const { timelineCue } = require('../utils/quranTimelineCue');

test('Duri uses its own 6217 ayahs and maps split/joined boundaries to audio references', () => {
  assert.equal(Array.from({ length: 114 }, (_, i) => getReaderChapter(i + 1, 'noreen').length).reduce((a,b) => a+b), 6217);
  assert.equal(canonicalReference('1:1', 'noreen'), '1:2');
  assert.equal(readerReference('1:7', 'noreen'), '1:6');
  assert.equal(canonicalReference('1:7', 'noreen'), '1:7');
  assert.equal(readerReference('2:2', 'noreen'), '2:1');
  for (const key of ['42:1','42:2','42:3']) assert.equal(readerReference(key, 'noreen'), '42:1');
  assert.equal(canonicalReference('42:2', 'noreen'), '42:4');
  assert.match(getReaderChapter(1, 'duri')[2].text, /^مَلِكِ/);
  assert.equal(getReaderChapter(1, 'alafasy'), getQuranChapter(1));
});

test('every Duri word retains a valid source reference and its exact character range', () => {
  for (let c = 1; c <= 114; c++) {
    const original = getQuranChapter(c), verses = getReaderChapter(c, 'duri');
    let lastSource = 0;
    for (const verse of verses) {
      for (const [from, to, sources] of verse.routes) {
        assert.ok(from >= 0 && to > from && to <= verse.text.length, verse.key);
        assert.ok(sources.length);
        for (const [key, a, b] of sources) {
          const ayah = Number(key.split(':')[1]);
          assert.ok(ayah >= lastSource, key); lastSource = ayah;
          assert.equal(Number(key.split(':')[0]), c);
          assert.ok(a >= 0 && b > a && b <= original[ayah - 1].text.length, key);
        }
      }
    }
  }
});

test('all 1208 text pages contain each reader word once, including verses crossing a page', () => {
  for (const reader of ['hafs', 'duri']) {
    const expected = new Map();
    for (let c = 1; c <= 114; c++) for (const verse of getReaderChapter(c, reader)) for (const word of verseWords(verse)) expected.set(`${verse.key}/${word.from}/${word.to}`, word.text);
    for (let page = 1; page <= 604; page++) {
      const rows = wordPageRows(page, reader);
      assert.ok(rows.length, `${reader}/${page}`);
      for (const [, kind, words] of rows) if (kind === 'text') for (const [key, from, to, text, width] of words) {
        const id = `${key}/${from}/${to}`;
        assert.ok(expected.has(id), `duplicate or invalid ${reader}/${id}`);
        assert.ok(text.includes(expected.get(id)), id);
        assert.ok(width > 0 && Number.isFinite(width), id);
        assert.equal(pageForWord(key, { from, to }, reader), page, id);
        expected.delete(id);
      }
    }
    assert.equal(expected.size, 0, `missing ${reader} words`);
  }
});

test('all native Duri ayahs have playable bounds and only real timestamp intervals', () => {
  for (let chapter = 1; chapter <= 114; chapter++) {
    const text = getReaderChapter(chapter, 'duri'), plans = prepareDuriChapter(chapter);
    assert.equal(plans.length, text.length);
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      assert.ok(plan.startTime >= 0 && plan.endTime > plan.startTime, plan.key);
      if (i) assert.ok(plan.startTime >= plans[i-1].startTime, plan.key);
      for (const s of plan.segments) {
        assert.ok(s.end > s.start && s.highlight.from >= 0 && s.highlight.to <= text[i].text.length, plan.key);
      }
    }
  }
  const fatiha = prepareDuriChapter(1);
  assert.equal(fatiha[0].startTime, 14.336);
  assert.equal(fatiha[5].endTime, fatiha[6].startTime);
});

test('a repeated Duri passage follows its real key and has a clean single-ayah occurrence', () => {
  const plans = prepareDuriChapter(14);
  const cues = plans.flatMap(v => v.segments.map(s => ({ ...s, key: v.key }))).sort((a,b) => a.start-b.start);
  assert.equal(plans[0].endTime, 19.139);
  assert.equal(plans[1].startTime, 26.587);
  assert.equal(timelineCue(cues, 19500).key, '14:2');
  assert.equal(timelineCue(cues, 21500).key, '14:1');
  assert.equal(timelineCue(cues, 27500).key, '14:2');
});

test('single-word clips preserve complete intervals and reject multiword or missing timing', () => {
  const part = (from, to, start, end) => ({ highlight: { from, to }, start, end });
  const plan = { segments: [part(0,2,10,100),part(2,5,100,300),part(6,9,400,700),part(0,2,800,900),part(2,5,900,1000)] };
  assert.deepEqual([wordClip(plan,{from:0,to:5}).startTime, wordClip(plan,{from:0,to:5}).endTime], [.01,.3]);
  assert.equal(wordClip(plan,{from:3,to:5}), null);
  assert.equal(wordClip(plan,{from:20,to:25}), null);
  assert.equal(wordClip({ segments: [part(0,9,0,100)] }, {from:0,to:5}), null);
  assert.equal(wordClip({ segments: [part(2,5,100,300)] }, {from:0,to:5}), null);
});

test('follow locates a word below the viewport within an already-visible paragraph', () => {
  const text = 'بسم الله الرحمن الرحيم';
  const lines = [{ text: 'بسم الله ', y:0, height:60 }, { text: 'الرحمن الرحيم', y:60, height:60 }];
  assert.equal(locateTextLine(lines, text, 15), lines[1]);
  assert.equal(followOffset({top:660,bottom:720,offset:0,height:600,content:1200}), 510);
  assert.equal(followOffset({top:160,bottom:220,offset:0,height:600,content:1200}), null);
  assert.equal(followOffset({top:1200,bottom:1260,offset:0,height:600,content:1260}), 660);
  assert.equal(locateTextLine(lines, text, 900), null);
});


test('Mushaf geometry fits narrow, tablet and landscape views or enables scrolling without clipping', () => {
  const { mushafGeometry } = require('../utils/mushafGeometry');
  for (const reader of ['hafs','duri']) for (let page=1;page<=604;page++) {
    const rows=wordPageRows(page,reader);
    for (const [width,height] of [[280,350],[360,520],[768,740],[800,160]]) {
      const g=mushafGeometry(rows,width,height,false);
      assert.ok(g.pageWidth<=width && g.size>0);
      if (!g.scroll) assert.ok(g.contentHeight<=height-49);
      for (const [,kind,words] of rows) if(kind==='text') {
        const wordWidth=words.reduce((sum,w)=>sum+w[4]*g.size,0)+(words.length-1)*g.size*.15+g.size*.6;
        assert.ok(wordWidth<=g.pageWidth+.01, `${reader}/${page}/${width}`);
      }
    }
  }
});
