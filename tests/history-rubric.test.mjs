import test from 'node:test';
import assert from 'node:assert/strict';
import frozen from '../data/packs/unscripted-core.v1.0.0.json' with {type:'json'};
import current from '../data/packs/unscripted-core.v1.json' with {type:'json'};
import questions from '../data/questions.json' with {type:'json'};
import {createHistoryStore,HISTORY_KEY,makeRubricSnapshot} from '../src/history.js';
import {historyRubric} from '../src/history-rubric.js';
import {buildCrashSheet} from '../src/export.js';
import {createPackRegistry} from '../src/packs/registry.js';
import {createMigrationService} from '../src/storage/migration.js';
import {createLearningStore} from '../src/storage-v2.js';

const ts='2026-11-19T00:00:00Z';
const [java,redis]=frozen.questions;
const oldJava={questionId:java.id,layer:'L1',ts,light:'red',pointLights:['green','amber','red'],missedPoints:[2],answer:'It is atomic.'};
const oldRedis={questionId:redis.id,layer:'L3',ts,light:'red',pointLights:['green','red','green','green'],missedPoints:[1],answer:'The TTL resets.'};
const progress={items:{[java.id+'::L1']:{status:'review',updatedAt:ts},[redis.id+'::L3']:{status:'review',updatedAt:ts}},schemaVersion:1};
const v1=JSON.stringify({schemaVersion:1,saveAnswers:true,entries:[oldJava,oldRedis]});
const V2='unscripted.progress.v2';
const P1='unscripted.progress.v1';

function fixture() {
  const map=new Map([[HISTORY_KEY,v1],[P1,JSON.stringify(progress)]]);
  const storage={
    get length(){return map.size;},
    key:index=>[...map.keys()][index],
    getItem:key=>map.get(key)??null,
    setItem:(key,value)=>map.set(key,value),
    removeItem:key=>map.delete(key),
  };
  return {map,storage,log:createHistoryStore(()=>storage),locks:{request:(_key,_options,fn)=>fn()}};
}

test('Java L1 preserves all three old timeline lamps, historical text and answer', () => {
  const [entry]=fixture().log.snapshot().entries;
  const result=historyRubric(entry,'en');
  assert.equal(result.packVersion,'1.0.0');
  assert.ok(result.needsReconfirmation);
  assert.deepEqual(result.points.map(({rubricId})=>rubricId),java.layers[0].rubric.map(r=>r.rubricId));
  assert.equal(result.points[2].light,'red');
  assert.equal(result.points[2].text,java.layers[0].rubric[2].criterion.en);
  assert.equal(entry.answer,oldJava.answer);
});

test('Redis L3 retains the bilingual compound rating as one point with no c05', () => {
  const [,entry]=fixture().log.snapshot().entries;
  for (const [lang,locale] of [['en','en'],['zh','zh-CN']]) {
    const result=historyRubric(entry,lang);
    assert.ok(result.needsReconfirmation);
    assert.equal(result.points.length,4);
    assert.equal(result.points[1].light,'red');
    assert.equal(result.points[1].text,redis.layers[2].rubric[1].criterion[locale]);
    assert.ok(!result.points.some(point=>point.rubricId.endsWith('c05')));
  }
  assert.equal(entry.answer,oldRedis.answer);
});

test('unversioned records with ambiguous, different rubric text stay unassigned', () => {
  const result=historyRubric({...oldJava,questionId:redis.id},'en');
  assert.equal(result.packVersion,undefined);
  assert.ok(result.needsReconfirmation);
  assert.equal(result.points[2].text,'Historical criterion #3');
  assert.equal(result.points[2].light,'red');
});

test('new v1 confirmations persist two Java points under their actual version', () => {
  const {log,storage}=fixture();
  const official=current.questions[0].layers[0];
  log.add({...oldJava,ts:'2026-11-19T01:00:00Z',pointLights:['green','red'],missedPoints:[1],
    rubricSnapshot:makeRubricSnapshot(current,official)});
  const entries=createHistoryStore(()=>storage).snapshot().entries;
  assert.equal(entries.length,3);
  const result=historyRubric(entries.at(-1),'en');
  assert.equal(result.packVersion,'1.0.1');
  assert.equal(result.needsReconfirmation,false);
  assert.equal(result.points.length,2);
  assert.equal(result.points[1].text,official.rubric[1].criterion.en);
});

test('idempotent migration preserves original bytes; v1 and v2 concurrently export their rubrics', async () => {
  const f=fixture();
  const registry=createPackRegistry(), core=await registry.registerBuiltin();
  const args={...f,registry};
  const migration=createMigrationService(args);
  const plan=await migration.previewMigration();
  const first=await migration.migrateLegacyData({confirmed:true,token:plan.token});
  const prior=f.map.get(V2);
  await migration.migrateLegacyData({confirmed:true,token:plan.token});
  assert.equal(first.state,'committed');
  assert.equal(f.map.get(V2),prior);
  assert.equal(f.map.get(HISTORY_KEY),v1);
  assert.deepEqual((await migration.readLegacyArchive()).entries,[oldJava,oldRedis]);

  const official=current.questions[1].layers[2];
  const store=createLearningStore(args);
  await store.recordSelfRating({packId:core.packId,packVersion:core.packVersion,contentDigest:core.contentDigest,
    questionId:redis.id,layerId:'L3'}, {confirmed:true,ts:'2026-11-19T02:00:00Z',
    criterionResults:official.rubric.map(({rubricId})=>({rubricId,light:rubricId.endsWith('c05')?'red':'green'}))});
  const items=[...f.log.snapshot().entries,...f.log.versionedEntries(core.packId)];
  assert.equal(items.length,3);
  assert.equal(historyRubric(items.at(-1),'en').points[4].light,'red');
  const out=buildCrashSheet(questions,progress,'en',items);
  assert.ok(out.includes(java.layers[0].rubric[2].criterion.en));
  assert.ok(out.includes(redis.layers[2].rubric[1].criterion.en));
  assert.ok(out.includes(official.rubric[4].criterion.en));
  assert.ok(out.includes('unscripted-core@1.0.0 · Prior rating needs reconfirmation'));
  assert.ok(out.includes('unscripted-core@1.0.1'));
});

test('migration failure with no registered pack preserves the original v1 sources', async () => {
  const f=fixture();
  const migration=createMigrationService({...f,registry:createPackRegistry()});
  await assert.rejects(migration.previewMigration(),/BUILTIN_REQUIRED/);
  assert.equal(f.map.get(HISTORY_KEY),v1);
  assert.equal(f.map.get(P1),JSON.stringify(progress));
  assert.ok(!f.map.has(V2));
});
