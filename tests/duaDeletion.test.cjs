const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');
const { initialDuaState, duaReducer } = require('../utils/duaState');

test('deleting a custom Dua removes its bookmark and note without changing other saved items', () => {
  const custom = { id: 'custom-own', title: 'Personal words', isCustom: true, note: 'Old note', addedToCollection: true };
  const other = { id: 'hisn-25-1', title: 'Source Dua' };
  const state = { ...initialDuaState, hydrated: true, myDuas: [custom, other],
    favorites: { [custom.id]: true, [other.id]: true }, notes: { [custom.id]: 'Personal note', [other.id]: 'Keep this' } };
  const before = JSON.stringify(state);
  const next = duaReducer(state, { type: 'deleteCustom', id: custom.id });
  assert.deepEqual(next.myDuas, [other]);
  assert.deepEqual(next.favorites, { [other.id]: true });
  assert.deepEqual(next.notes, { [other.id]: 'Keep this' });
  assert.equal(JSON.stringify(state), before);
  const restored = duaReducer(initialDuaState, { type: 'hydrate', value: JSON.parse(JSON.stringify(next)) });
  assert.deepEqual(restored.myDuas, [other]);
  assert.equal(restored.notes[custom.id], undefined);
  assert.equal(restored.favorites[custom.id], undefined);
});

test('custom deletion cannot remove a source Dua or an unknown item', () => {
  const dua = { id: 'hisn-25-1', title: 'Source Dua' };
  const state = { ...initialDuaState, hydrated: true, myDuas: [dua], favorites: { [dua.id]: true } };
  for (const id of [dua.id, 'missing', undefined]) assert.equal(duaReducer(state, { type: 'deleteCustom', id, dua: { isCustom: true } }), state);
});

test('the last custom Dua can be deleted even if it has never been bookmarked', () => {
  const added = duaReducer({ ...initialDuaState, hydrated: true }, { type: 'custom', dua: { id: 'custom-last', title: 'My words' } });
  const deleted = duaReducer(added, { type: 'deleteCustom', id: 'custom-last' });
  assert.deepEqual(deleted.myDuas, []);
  assert.deepEqual(deleted.favorites, {});
  assert.deepEqual(deleted.notes, {});
  assert.equal(duaReducer(deleted, { type: 'deleteCustom', id: 'custom-last' }), deleted);
});

const hookCode = transformFileSync(path.join(__dirname, '../hooks/useDeleteCustomDua.js'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
function confirmation(hydrated = true, language = 'en') {
  const alerts = [], removed = [], returned = [];
  const loaded = { exports: {} };
  const dependencies = {
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    '../contexts/DuaContext': { useDua: () => ({ hydrated, onDeleteCustomDua: id => removed.push(id) }) },
  };
  Function('require', 'module', 'exports', hookCode)(name => dependencies[name], loaded, loaded.exports);
  return { ask: loaded.exports.default(language), alerts, removed, returned };
}

test('both languages require explicit Delete confirmation before deleting or leaving the reader', () => {
  for (const language of ['en', 'ar']) {
    const harness = confirmation(true, language);
    harness.ask({ id: 'custom-own', title: 'My words', titleAr: 'دعائي', isCustom: true }, () => harness.returned.push(true));
    assert.equal(harness.alerts.length, 1);
    assert.match(harness.alerts[0][1], language === 'ar' ? /دعائي/ : /My words/);
    assert.deepEqual(harness.removed, []);
    const buttons = harness.alerts[0][2];
    buttons.find(button => button.style === 'cancel').onPress?.();
    assert.deepEqual(harness.removed, []);
    assert.deepEqual(harness.returned, []);
    buttons.find(button => button.style === 'destructive').onPress();
    assert.deepEqual(harness.removed, ['custom-own']);
    assert.deepEqual(harness.returned, [true]);
  }
});

test('confirmation is unavailable before hydration or for built-in Duas', () => {
  const loading = confirmation(false);
  loading.ask({ id: 'custom-own', isCustom: true });
  assert.deepEqual(loading.alerts, []);
  const ready = confirmation();
  ready.ask({ id: 'hisn-25-1' });
  ready.ask(null);
  assert.deepEqual(ready.alerts, []);
});
