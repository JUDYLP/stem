import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateQuestionPackText } from '../src/packs/validate.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const coreText = read('../data/packs/unscripted-core.v1.json');
const introText = read('../data/packs/unscripted-intro.v1.json');
const legacy = JSON.parse(read('../data/questions.json'));
const scenarios = JSON.parse(read('../src/ai/demo-scenarios.json'));

const coreResult = validateQuestionPackText(coreText);
const introResult = validateQuestionPackText(introText);
assert.equal(coreResult.valid, true, JSON.stringify(coreResult.errors));
assert.equal(introResult.valid, true, JSON.stringify(introResult.errors));
const core = coreResult.pack;
const intro = introResult.pack;
const packs = new Map([[core.packId, core], [intro.packId, intro]]);

test('review set contains the existing three core questions and supplied intro question', () => {
  assert.equal(core.packVersion, '1.0.1');
  assert.equal(intro.packVersion, '1.0.0');
  assert.deepEqual(core.questions.map(q => q.id), ['juc-volatile-atomicity-v2','redis-expiration-v2','mysql-consistent-read-v2']);
  assert.deepEqual(intro.questions.map(q => q.id), ['float-equality-v1']);
  assert.equal([...packs.values()].reduce((n,p)=>n+p.questions.length,0), 4);
  assert.equal([...packs.values()].reduce((n,p)=>n+p.questions.reduce((m,q)=>m+q.layers.length,0),0), 12);
  for (const pack of packs.values()) for (const question of pack.questions) {
    assert.deepEqual(question.review, {status:'unreviewed'});
    assert.equal(question.layers.length, 3);
  }
});

test('Java L1 merges duplicate c02/c03 into a single compound-operation criterion', () => {
  const layer=core.questions[0].layers[0];
  assert.deepEqual(layer.rubric.map(r=>r.rubricId),['juc-volatile-atomicity-v2-l1-c01','juc-volatile-atomicity-v2-l1-c02']);
  assert.match(layer.rubric[1].criterion['zh-CN'],/读取、计算和写回/);
  assert.match(layer.rubric[1].criterion.en,/read, calculation, and write/);
});

test('Redis L3 separates INCR value from TTL preservation', () => {
  const layer=core.questions[1].layers[2];
  assert.deepEqual(layer.rubric.map(r=>r.rubricId),['redis-expiration-v2-l3-c01','redis-expiration-v2-l3-c02','redis-expiration-v2-l3-c03','redis-expiration-v2-l3-c04','redis-expiration-v2-l3-c05']);
  assert.match(layer.rubric.find(r=>r.rubricId.endsWith('-c05')).criterion.en,/TTL/);
});

test('MySQL L3 prompt is self-contained and identifies the current row value', () => {
  const layer=core.questions[2].layers[2];
  assert.match(layer.prompt['zh-CN'],/初始为 100/);
  assert.match(layer.prompt.en,/initial balance.*100/i);
  assert.match(layer.rubric[0].criterion['zh-CN'],/当前值 80/);
  assert.match(layer.rubric[0].criterion.en,/current value of 80/);
});

test('Python L2 accepts three scenario-appropriate exact representations', () => {
  const c03=intro.questions[0].layers[1].rubric[2].criterion;
  for (const term of ['整数最小单位','Decimal','Fraction']) assert.ok(c03['zh-CN'].includes(term));
  for (const term of ['integer smallest units','Decimal','Fraction']) assert.ok(c03.en.includes(term));
});

test('legacy training questions remain aligned with the revised core pack', () => {
  assert.equal(legacy.length,core.questions.length);
  for(const old of legacy){
    const question=core.questions.find(q=>q.id===old.id); assert.ok(question);
    assert.equal(old.title,question.title['zh-CN']); assert.equal(old.title_en,question.title.en);
    for(let i=0;i<3;i++){
      const layer=question.layers[i],oldLayer=old.layers[i];
      assert.equal(oldLayer.prompt,layer.prompt['zh-CN']); assert.equal(oldLayer.prompt_en,layer.prompt.en);
      assert.deepEqual(oldLayer.rubric,layer.rubric.map(r=>r.criterion['zh-CN']));
      assert.deepEqual(oldLayer.rubric_en,layer.rubric.map(r=>r.criterion.en));
    }
  }
});

test('all 12 demo scenarios map exactly to their pack rubrics and quote answer text', () => {
  assert.equal(scenarios.length,12);
  const seen=new Set();
  for(const scenario of scenarios){
    const pack=packs.get(scenario.packId); assert.ok(pack,'unknown pack '+scenario.packId);
    assert.equal(scenario.packVersion,pack.packVersion);
    const question=pack.questions.find(q=>q.id===scenario.questionId); assert.ok(question,'unknown question '+scenario.questionId);
    const layer=question.layers.find(l=>l.id===scenario.layerId); assert.ok(layer,'unknown layer '+scenario.layerId);
    const key=[scenario.packId,scenario.questionId,scenario.layerId].join('::');
    assert.ok(!seen.has(key),'duplicate scenario '+key); seen.add(key);
    assert.deepEqual(scenario.verdicts.map(v=>v.pointId),layer.rubric.map(r=>r.rubricId));
    for(const verdict of scenario.verdicts){
      assert.ok(['green','amber','red'].includes(verdict.light));
      assert.ok(verdict.quote===''||scenario.answer.includes(verdict.quote),verdict.pointId+' quote is not an answer substring');
    }
  }
});

test('Redis L3 demo does not give Green when INCR TTL evidence is absent', () => {
  const row=scenarios.find(s=>s.packId==='unscripted-core'&&s.questionId==='redis-expiration-v2'&&s.layerId==='L3');
  const ttl=row.verdicts.find(v=>v.pointId==='redis-expiration-v2-l3-c05');
  assert.equal(ttl.light,'amber');
  assert.equal(ttl.quote,'INCR changes it to 2.');
  assert.equal(row.verdicts.find(v=>v.pointId==='redis-expiration-v2-l3-c03').light,'red');
});

test('Python L2 demo treats omission of an exact representation as incomplete, not incorrect', () => {
  const row=scenarios.find(s=>s.packId==='unscripted-intro'&&s.layerId==='L2');
  assert.equal(row.verdicts.find(v=>v.pointId==='float-equality-v1-l2-c03').light,'amber');
});
