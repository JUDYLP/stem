import test from 'node:test';
import assert from 'node:assert/strict';
import core from '../data/packs/unscripted-core.v1.json' with {type:'json'};
import frozenIntro from '../data/packs/unscripted-intro.v1.json' with {type:'json'};
import activeIntro from '../data/packs/unscripted-intro.v1.1.0.json' with {type:'json'};
import scenarios from '../src/ai/demo-scenarios.json' with {type:'json'};
import {createPackRegistry} from '../src/packs/registry.js';
import {computePackDigest} from '../src/packs/digest.js';
import {questionsFromBuiltin} from '../src/questions.js';
import {buildMessages,buildEvaluationContext} from '../src/ai/judge.js';
import {openDemo} from '../src/ai/demo-scenario.js';
import {historyRubric} from '../src/history-rubric.js';
import {createHistoryStore,HISTORY_KEY,makeRubricSnapshot,MAX_ENTRIES} from '../src/history.js';
import {questionImpact} from '../src/i18n.js';
import {buildCrashSheet} from '../src/export.js';

const registry = createPackRegistry();
const [coreRecord,activeIntroRecord] = await registry.registerBuiltins();
const introRecord = registry.get('unscripted-intro', '1.0.0');
const intro = frozenIntro;
const [question] = questionsFromBuiltin(introRecord);

test('both builtins validate and register by immutable version and correct digest', async () => {
  assert.deepEqual(registry.list(),['unscripted-core','unscripted-intro']);
  assert.deepEqual(await registry.registerBuiltin(),coreRecord);
  assert.deepEqual(await registry.registerBuiltins(),[coreRecord,activeIntroRecord]);
  for (const [record, source] of [[coreRecord,core],[introRecord,intro],[activeIntroRecord,activeIntro]]) {
    assert.deepEqual(record.validatedPack,source);
    assert.equal(record.contentDigest,await computePackDigest(source));
    await assert.rejects(registry.registerImported(JSON.stringify(source)),{code:'RESERVED_ID'});
    assert.ok(record.validatedPack.questions.every(q => q.review.status === 'unreviewed'));
  }
  assert.deepEqual(registry.versions(intro.packId), ['1.0.0', '1.1.0']);
  assert.deepEqual(activeIntro.questions[0], frozenIntro.questions[0]);
  assert.equal(activeIntro.questions[1].id, 'python-mutable-default-v1');
  const ids = [core,activeIntro].flatMap(pack=>pack.questions.map(q=>q.id));
  assert.equal(ids.length,5);
  assert.equal(new Set(ids).size,ids.length,'v1 needs globally unique question IDs');
  assert.throws(()=>questionsFromBuiltin({...introRecord,source:'imported'}),/BUILTIN_REQUIRED/);
});

for (const [index,layer] of question.layers.entries()) {
  test('Python '+layer.id+' uses its exact bilingual rubric and isolated demo', () => {
    const official = intro.questions[0].layers[index];
    const scenario = scenarios.find(row=>row.packId===intro.packId && row.questionId===question.id && row.layerId===layer.id);
    for (const language of ['zh','en']) {
      const locale = language==='en'?'en':'zh-CN';
      const context = buildEvaluationContext({pack:introRecord.validatedPack,question,layer,language});
      assert.equal(context.packId,intro.packId);
      assert.equal(context.packVersion,intro.packVersion);
      assert.equal(context.prompt,official.prompt[locale]);
      assert.deepEqual(context.criteria,official.rubric.map(row=>({pointId:row.rubricId,criterion:row.criterion[locale]})));
      const [system,user] = buildMessages(context,'An isolated student answer.');
      assert.deepEqual(JSON.parse(user.content),{answer:'An isolated student answer.'});
      assert.doesNotMatch(system.content,/juc-volatile|redis-expiration|mysql-consistent/);
      for (const other of intro.questions[0].layers.filter(l=>l!==official))
        for (const row of other.rubric) assert.ok(!system.content.includes(row.rubricId));
      assert.deepEqual(openDemo(context),{answer:scenario.answer,verdicts:scenario.verdicts,followUp:scenario.followUp});
    }
    assert.throws(()=>buildEvaluationContext({pack:core,question,layer,language:'en'}),/RUBRIC_MISMATCH/);
    const mismatches = [{...layer,rubricIds:[...layer.rubricIds].reverse()},{...layer,prompt_en:'Different prompt'}];
    for (const mismatch of mismatches) assert.throws(()=>buildEvaluationContext({
      pack:intro,question,layer:mismatch,language:'en',
    }),/RUBRIC_MISMATCH/);
    assert.throws(()=>buildEvaluationContext({pack:intro,question:{...question,packVersion:'1.0.1'},layer,language:'en'}),/RUBRIC_MISMATCH/);
  });
}

test('new Intro v1 records export under the active Intro version with their rubric snapshots', () => {
  const activeQuestion = questionsFromBuiltin(activeIntroRecord)[1];
  const layer = activeIntro.questions[1].layers[0];
  const entry = {questionId:activeQuestion.id,layer:layer.id,light:'red',pointLights:['green','amber','red'],
    missedPoints:[2],rubricSnapshot:makeRubricSnapshot(activeIntro,layer)};
  assert.equal(historyRubric(entry,'en').needsReconfirmation,false);
  const progress = {schemaVersion:1,items:{[activeQuestion.id+'::L1']:{status:'review'}}};
  const exportText = buildCrashSheet([activeQuestion],progress,'en',[entry,
    {...entry,questionId:core.questions[0].id,rubricSnapshot:makeRubricSnapshot(core,core.questions[0].layers[0])}]);
  assert.match(exportText,/unscripted-intro@1.1.0/);
  assert.ok(exportText.includes(String.raw`The first output is \['a'\]; the second is \['a', 'b'\].`));
  assert.doesNotMatch(exportText,/unscripted-core|volatile|needs reconfirmation/);
});

test('a full Core v1 journal retains every Core entry after an Intro rating and reload', () => {
  const older = Array.from({length:MAX_ENTRIES},(_,i)=>({
    questionId:core.questions[0].id,layer:'L1',ts:new Date(1700000000000+i*1000).toISOString(),
    light:'red',pointLights:['green','green','red'],missedPoints:[2],
  }));
  let raw = JSON.stringify({schemaVersion:1,saveAnswers:false,entries:older});
  const storage = {getItem:key=>key===HISTORY_KEY?raw:null,setItem:(_key,value)=>{raw=value;}};
  const log = createHistoryStore(()=>storage);
  log.add({questionId:question.id,layer:'L1',light:'amber',pointLights:['amber','amber','amber'],
    rubricSnapshot:makeRubricSnapshot(intro,intro.questions[0].layers[0])});
  const saved = createHistoryStore(()=>storage).snapshot();
  assert.equal(saved.entries.length,MAX_ENTRIES+1);
  assert.deepEqual(saved.entries.slice(0,MAX_ENTRIES),older);
  assert.equal(saved.entries.at(-1).rubricSnapshot.packId,intro.packId);
});

test('questions without translated impact copy have no impact line text', () => {
  for (const lang of ['zh','en']) assert.equal(questionImpact('question-without-copy',lang),'');
});
