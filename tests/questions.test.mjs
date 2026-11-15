import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateQuestions, loadQuestions } from '../src/questions.js';
const seed = JSON.parse(await readFile(new URL('../data/questions.json', import.meta.url)));
test('three seed questions have nine valid layers', () => assert.equal(validateQuestions(seed).flatMap(q => q.layers).length, 9));
for (const [name, mutate] of [
  ['duplicate ID', a => a.push(structuredClone(a[0]))],
  ['missing layer', a => a[0].layers.pop()],
  ['wrong order', a => a[0].layers.reverse()],
  ['empty rubric', a => a[0].layers[0].rubric[0] = ' '],
  ['missing category', a => a[0].category = ''],
]) test(name, () => { const data = structuredClone(seed); mutate(data); assert.throws(() => validateQuestions(data)); });
test('empty array and null rejected', () => {assert.throws(() => validateQuestions([])); assert.throws(() => validateQuestions(null));});
test('HTTP failure and invalid JSON propagate for retry UI', async () => {
  await assert.rejects(loadQuestions('/bad', async () => ({ok:false,status:404})), /404/);
  await assert.rejects(loadQuestions('/bad', async () => ({ok:true,json:async () => {throw new SyntaxError('bad JSON');}})));
});
