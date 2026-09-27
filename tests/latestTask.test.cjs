const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLatestTask } = require('../utils/latestTask');
test('rapid choices apply the newest pending choice and settle every caller', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; }); const seen = [];
  const run = createLatestTask(async value => { seen.push(value); if (value === 1) await gate; return value; });
  const first = run(1), second = run(2), third = run(3); release();
  assert.deepEqual(await Promise.all([first, second, third]), [1, 3, 3]);
  assert.deepEqual(seen, [1, 3]);
});
test('a failed refresh cannot poison the next choice', async () => {
  const run = createLatestTask(async value => { if (value === 'bad') throw Error('offline'); return value; });
  const bad = assert.rejects(run('bad'), /offline/); const good = run('good');
  await bad; assert.equal(await good, 'good');
});
