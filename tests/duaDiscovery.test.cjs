const { test } = require('node:test');
const assert = require('node:assert/strict');
const categories = require('../data/hisnDuas.json');
const { EVERYDAY_DUAS, occasionsForTopic, duaCategoryDestination, normalizeDuaSearch } = require('../utils/duaDiscovery');

test('everyday shortcuts open the source Dua immediately and preserve its other variants', () => {
  assert.equal(new Set(EVERYDAY_DUAS.map(item => item.id)).size, 12);
  assert.ok(EVERYDAY_DUAS.slice(0, 6).some(item => item.id === 'hisn-10'));
  assert.ok(EVERYDAY_DUAS.slice(0, 6).some(item => item.id === 'hisn-13'));
  for (const shortcut of EVERYDAY_DUAS) {
    const category = categories.find(item => item.id === shortcut.id);
    const destination = duaCategoryDestination(shortcut.category);
    assert.equal(destination.category, category); assert.equal(destination.dua, category.subcategories[0]);
    assert.ok(destination.dua.arabic); assert.ok(shortcut.titleAr);
    assert.equal(duaCategoryDestination(category, category.subcategories.at(-1).id).dua, category.subcategories.at(-1));
  }
});
test('occasion search recognizes English, Arabic without marks, and words inside later Duas', () => {
  const home = categories.find(item => item.id === 'hisn-10'), mosque = categories.find(item => item.id === 'hisn-13');
  const topic = { occasions: [{ id: home.id }, { id: mosque.id }] };
  assert.deepEqual(occasionsForTopic(topic, 'mosque'), [mosque]);
  assert.deepEqual(occasionsForTopic(topic, 'دخول المسجد'), [mosque]);
  const words = mosque.subcategories[1].arabic.slice(-40);
  assert.equal(duaCategoryDestination(mosque, null, words).dua, mosque.subcategories[1]);
  assert.deepEqual(occasionsForTopic(topic, words), [mosque]);
  assert.deepEqual(occasionsForTopic(topic, 'unmatched phrase'), []);
  assert.equal(normalizeDuaSearch('إِلَى الـمَسْجِدِ'), 'الى المسجد');
});
test('missing categories never route to an empty reader and saved IDs fall back safely', () => {
  assert.equal(duaCategoryDestination(null), null); assert.equal(duaCategoryDestination({ subcategories: [] }), null);
  assert.equal(duaCategoryDestination(categories[0], 'obsolete-id').dua.id, categories[0].subcategories[0].id);
  assert.deepEqual(occasionsForTopic(null), []);
});
