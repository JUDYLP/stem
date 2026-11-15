import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reviewItems, buildCrashSheet } from '../src/export.js';
const questions = JSON.parse(await readFile(new URL('../data/questions.json', import.meta.url)));
test('five rated layers include only latest review, independent of unrelated keys', () => {
  const entries = questions.flatMap(q => q.layers.map(l => `${q.id}::${l.id}`)).slice(0,5);
  const progress = {schemaVersion:1,items:Object.fromEntries(entries.map((key,i) => [key,{status:i===1?'pass':'review'}]))};
  progress.items['removed-question::L1']={status:'review'};
  assert.equal(reviewItems(questions,progress).length,4);
  progress.items[entries[0]].status='pass';
  assert.equal(reviewItems(questions,progress).length,3);
  const output=buildCrashSheet(questions,progress);
  assert.equal((output.match(/^## /gm)||[]).length,3);
  assert.ok(output.includes('未经过 AI 诊断'));
  assert.ok(!output.includes('removed-question'));
});
test('empty and all-pass exports have truthful empty state', () => {
  const progress={items:{}};
  assert.match(buildCrashSheet(questions,progress),/当前没有/);
  for(const q of questions) for(const l of q.layers) progress.items[`${q.id}::${l.id}`]={status:'pass'};
  assert.equal(reviewItems(questions,progress).length,0);
});
test('export escapes HTML and preserves Chinese UTF-8', () => {
  const data=structuredClone(questions); data[0].title='<script>中文</script>';
  const output=buildCrashSheet(data,{items:{[`${data[0].id}::L1`]:{status:'review'}}});
  assert.ok(!output.includes('<script>')); assert.ok(output.includes('中文'));
  assert.equal(new TextDecoder().decode(new TextEncoder().encode(output)),output);
});
