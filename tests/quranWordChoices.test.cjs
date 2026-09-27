const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');
const { getReaderChapter, verseWords } = require('../utils/quranReaderText');
const { prepareDuriChapter } = require('../utils/prepareDuriAudio');
const { wordClip } = require('../utils/quranWordClip');

// Exercise the actual stateless word picker and its press callbacks. Native view
// primitives are replaced only; this does not claim native gesture/rendering QA.
const filename = require.resolve('../components/QuranWordChoices.js');
const componentModule = new Module(filename, module);
componentModule.filename = filename;
componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = componentModule.require.bind(componentModule);
componentModule.require = id => id === 'react-native'
  ? { Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', StyleSheet: { create: value => value } }
  : originalRequire(id);
componentModule._compile(transformFileSync(filename, { presets: ['babel-preset-expo'], caller: { name: 'test', platform: 'android', isDev: false } }).code, filename);
const WordChoices = componentModule.exports.default.type;
const theme = { textColor: '#fff', activeTabColor: '#8bc', inputBackground: '#333' };

test('Mushaf word buttons select exact Hafs/Duri words without starting playback', () => {
  for (const reciter of ['alafasy', 'noreen']) {
    const verse = getReaderChapter(1, reciter)[2];
    const received = [];
    const props = { verse, reciter, range: null, theme, onSelectWord: (...args) => received.push(args) };
    const buttons = WordChoices(props).props.children;
    assert.equal(received.length, 0);
    assert.equal(buttons.length, verseWords(verse).length);
    const button = buttons[0];
    button.props.onPress();
    const [key, word] = received[0];
    assert.equal(key, verse.key);
    assert.equal(word.text, verse.text.slice(word.from, word.to));
    assert.equal(button.props.accessibilityLabel, word.text);
    assert.equal(button.props.children.props.style[1].fontFamily, reciter === 'noreen' ? 'QuranDuri' : 'Amiri');
    const selected = WordChoices({ ...props, range: word }).props.children;
    assert.equal(selected[0].props.accessibilityState.selected, true);
    assert.ok(selected.slice(1).every(item => !item.props.accessibilityState.selected));
  }
});

test('printed Duri Al-Mulk 9–10 word choices route to the shared native passage and real clips', () => {
  const verse = getReaderChapter(67, 'noreen')[8];
  const plan = prepareDuriChapter(67)[8];
  let selection;
  const buttons = WordChoices({ verse, reciter: 'noreen', range: null, theme, onSelectWord: (key, word) => { selection = { key, ...word }; } }).props.children;
  assert.equal(verse.key, '67:9');
  let playable = 0;
  for (const button of buttons) {
    button.props.onPress();
    assert.equal(selection.key, '67:9');
    const clip = wordClip(plan, selection);
    if (clip) {
      playable++;
      assert.ok(clip.endTime > clip.startTime);
      assert.ok(clip.segments.every(segment => segment.highlight.from >= selection.from && segment.highlight.to <= selection.to));
    }
  }
  assert.ok(buttons.length > 5);
  assert.ok(playable > 5);
});
