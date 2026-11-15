import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressStore, parseProgress } from '../src/storage.js';
test('last rating replaces previous and survives reload without answer text', () => {
  let raw = null;
  const storage = {getItem:()=>raw,setItem:(_key,value)=>raw=value};
  const store = createProgressStore(()=>storage);
  store.rate('question::L2','review'); store.rate('question::L2','pass');
  assert.equal(createProgressStore(()=>storage).snapshot().items['question::L2'].status,'pass');
  assert.deepEqual(Object.keys(JSON.parse(raw).items['question::L2']).sort(),['status','updatedAt']);
});
test('corrupt or newer records stay untouched and use memory', () => {
  for (const raw of ['{bad','{"schemaVersion":2,"items":{}}','{"schemaVersion":1,"items":{"x::L1":{"status":"auto","updatedAt":"now"}}}']) {
    let writes=0; const store=createProgressStore(()=>({getItem:()=>raw,setItem:()=>writes++}));
    store.rate('question::L1','review'); assert.equal(writes,0); assert.ok(store.warning); assert.equal(store.snapshot().items['question::L1'].status,'review');
  }
});
test('denied read and quota failures still allow in-memory rating', () => {
  const denied=createProgressStore(()=>{throw new Error('denied');});
  denied.rate('question::L1','pass'); assert.ok(denied.warning);
  const full=createProgressStore(()=>({getItem:()=>null,setItem:()=>{throw new Error('quota');}}));
  full.rate('question::L1','review'); assert.ok(full.warning); assert.equal(full.snapshot().items['question::L1'].status,'review');
});
test('invalid rating rejected; snapshot cannot mutate internal state', () => {
  const store=createProgressStore(()=>({getItem:()=>null,setItem:()=>{}}));
  assert.throws(()=>store.rate('question::L1','auto'));
  const copy=store.snapshot(); copy.items['question::L1']={status:'pass'};
  assert.deepEqual(store.snapshot(),parseProgress(null));
});
