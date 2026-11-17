import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { messages, LANGUAGE_KEY, resolveLanguage, initLanguage, setLanguage, getLanguage, t, localized } from '../src/i18n.js';
import { validateQuestions } from '../src/questions.js';
import { buildCrashSheet } from '../src/export.js';
const questions = JSON.parse(await readFile(new URL('../data/questions.json', import.meta.url)));
test('language priority is valid query, saved choice, browser language', () => {
  assert.equal(resolveLanguage('?lang=en','zh','zh-CN'),'en');
  assert.equal(resolveLanguage('?lang=zh','en','en-US'),'zh');
  assert.equal(resolveLanguage('?lang=xx','en','zh-TW'),'en');
  assert.equal(resolveLanguage('',null,'zh-TW'),'zh');
  assert.equal(resolveLanguage('',null,'fr-FR'),'en');
});
test('switch persists only the language key; blocked storage still permits switching', () => {
  const writes=[];const storage={getItem:()=> 'en',setItem:(...args)=>writes.push(args)};
  assert.equal(initLanguage('','zh-CN',()=>storage),'en');
  setLanguage('zh',()=>storage);assert.deepEqual(writes,[[LANGUAGE_KEY,'zh']]);
  setLanguage('en',()=>{throw Error('denied')});assert.equal(getLanguage(),'en');
  assert.equal(setLanguage('bad',()=>storage),false);assert.equal(getLanguage(),'en');
  assert.equal(initLanguage('?lang=en','zh-CN',()=>{throw Error('denied')}),'en');
  setLanguage('zh',()=>null);
});
test('English dictionary has complete entries, no Chinese except product name; interpolation is literal', () => {
  for(const pair of Object.values(messages)) { assert.ok(pair.zh);assert.ok(pair.en);assert.doesNotMatch(pair.en.replaceAll('脱稿',''),/[\u4e00-\u9fff]/); }
  assert.equal(t('当前 {count} 个题目层级需要复习（全分类）',{count:2},'en'),'2 levels to review across all categories.');
});
test('all nine English layers match Chinese rubric counts and reject missing translations', () => {
  validateQuestions(questions);
  for(const q of questions) {
    assert.doesNotMatch(q.title_en,/[\u4e00-\u9fff]/);
    for(const l of q.layers) {assert.equal(l.rubric_en.length,l.rubric.length);assert.doesNotMatch(l.prompt_en+l.rubric_en.join(''),/[\u4e00-\u9fff]/);}
  }
  for(const mutate of [q=>delete q[0].title_en,q=>delete q[0].layers[0].prompt_en,q=>q[0].layers[0].rubric_en.pop(),q=>q[0].layers[0].rubric_en[0]=' ']) {
    const copy=structuredClone(questions);mutate(copy);assert.throws(()=>validateQuestions(copy));
  }
});
test('English export contains translated question and checklist with no Chinese', () => {
  const data={items:Object.fromEntries(questions.flatMap(q=>q.layers.map(l=>[`${q.id}::${l.id}`,{status:'review'}])))};
  const en=buildCrashSheet(questions,data,'en');assert.doesNotMatch(en,/[\u4e00-\u9fff]/);assert.match(en,/Current crash sheet/);
  assert.ok(en.includes(localized(questions[0],'title','en')));assert.ok(en.includes(questions[2].layers[2].rubric_en[0]));
  assert.match(buildCrashSheet(questions,data,'zh'),/当前复习单/);
});
