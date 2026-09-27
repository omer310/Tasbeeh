const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPreferenceSelection } = require('../utils/preferenceSelection');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {resolve,promise}; };
test('first tap shows immediately and survives pending hydration without erasing a reminder', async () => {
  const stored = deferred(), states = [], saved = [];
  const model = createPreferenceSelection({ defaults: { sound:'default', advance:'None' }, load:()=>stored.promise, onChange:v=>states.push(v), save:async v=>saved.push(v) });
  void model.hydrate(); const choice = model.choose({sound:'Sudan'});
  assert.equal(states.at(-1).sound,'Sudan');
  stored.resolve({sound:'old',advance:'10 minutes before'}); await choice;
  assert.deepEqual(states.at(-1),{sound:'Sudan',advance:'10 minutes before'});
  assert.deepEqual(saved,[{sound:'Sudan',advance:'10 minutes before'}]);
});
test('rapid changes keep the latest choice; closing cannot discard an accepted touch', async () => {
  const stored = deferred(), saved = [], states = [];
  const model = createPreferenceSelection({defaults:{},load:()=>stored.promise,save:async v=>saved.push(v),onChange:v=>states.push(v)});
  const first=model.choose({sound:'one'}), second=model.choose({sound:'two'});
  model.dispose(); stored.resolve({advance:'None'}); await Promise.all([first,second]);
  assert.deepEqual(saved,[{sound:'two',advance:'None'}]);
  assert.equal(states.length,2);
});
test('failed preference reads can retry without clearing the visible choice', async () => {
  let count=0; const errors=[],saved=[];
  const model=createPreferenceSelection({defaults:{},load:async()=>{if(!count++)throw Error('offline storage');return {advance:'None'};},save:async v=>saved.push(v),onChange:()=>{},onError:e=>errors.push(e)});
  await model.choose({sound:'Sudan'}); assert.ok(errors.at(-1));
  await model.choose({sound:'Sudan'}); assert.deepEqual(saved,[{sound:'Sudan',advance:'None'}]);
});
