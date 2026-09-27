/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');

function load(filename, mocks) {
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, configFile: false, babelrc: false,
    presets: ['module:@react-native/babel-preset'],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, __DEV__: false,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@babel/runtime/')) return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename });
  return module.exports.default;
}

const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
// Use the installed native API so a broad StyleSheet mock cannot hide the
// removed absoluteFillObject alias and miss the timer-clipping regression.
const StyleSheet = load(path.join(path.dirname(require.resolve('react-native/package.json')),
  'Libraries/StyleSheet/StyleSheetExports.js'), {
  '../../src/private/styles/composeStyles': (a, b) => [a, b],
  '../Components/View/ReactNativeStyleAttributes': {},
  './flattenStyle': flatten,
});
const Card = load(path.resolve(__dirname, '../components/PrayerCountdownCard.js'), {
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'react-native': { StyleSheet, Text: 'Text', View: 'View' },
  'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
  'react-native-svg': { __esModule: true, default: 'Svg',
    ...Object.fromEntries(['Circle', 'Defs', 'Mask', 'Path', 'RadialGradient', 'Rect', 'Stop'].map(name => [name, name])) },
});

function visit(node, ancestors, callback) {
  React.Children.forEach(node, child => {
    if (!React.isValidElement(child)) return;
    if (child.type?.$$typeof === Symbol.for('react.memo')) {
      visit(child.type.type(child.props), ancestors, callback);
      return;
    }
    callback(child, ancestors);
    visit(child.props.children, [...ancestors, child], callback);
  });
}

test('prayer artwork fills a separate background without displacing the countdown', () => {
  for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    for (const dark of [false, true]) {
      for (const height of [98, 110, 126]) {
        const label = `Next Prayer · ${prayer}`;
        const card = Card({ prayer, dark, height, label, countdown: '00:39:05' });
        let backgrounds = 0;
        const text = [];
        visit(card, [], (node, ancestors) => {
          if (node.type === 'Svg') {
            const layer = ancestors.find(parent => flatten(parent.props.style).position === 'absolute');
            assert.ok(layer, `${prayer}/${dark}/${height}: artwork must not occupy layout space`);
            for (const edge of ['top', 'right', 'bottom', 'left']) assert.equal(flatten(layer.props.style)[edge], 0);
            assert.equal(layer.props.pointerEvents, 'none');
            if (node.props.viewBox === '0 0 360 128') {
              assert.equal(node.props.width, '100%');
              assert.equal(node.props.height, '100%');
            } else {
              assert.equal(node.props.preserveAspectRatio, 'xMidYMax meet', 'mosque must retain its proportions');
              assert.ok(node.props.height >= 44, 'mosque silhouette must have room for its dome and walls');
            }
            backgrounds++;
          }
          if (node.type === 'Text') text.push(node.props.children);
        });
        assert.equal(backgrounds, 2);
        assert.equal(text.join(''), `${label}00:39:05`);
        assert.equal(card.props.accessibilityLabel, `${label}. 00:39:05`);
        const flow = React.Children.toArray(card.props.children).filter(child => flatten(child.props.style).position !== 'absolute');
        assert.equal(flow.length, 1, 'only the timer content should consume card space');
        assert.equal(flatten(flow[0].props.style).flex, 1);
        assert.equal(flatten(flow[0].props.style).justifyContent, 'center');
        assert.equal(flatten(flow[0].props.style).alignItems, 'center');
        assert.equal(flatten(card.props.style).paddingHorizontal || 0, 0);
        assert.equal(flatten(card.props.style).overflow, 'hidden');
      }
    }
  }
});
