import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createPackRegistry} from '../src/packs/registry.js';
import {computePackDigest} from '../src/packs/digest.js';
import {previewPack} from '../src/packs/preview.js';
const read = path => JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const pack = read('../data/packs/unscripted-core.v1.json');
const sample = (patch={}) => JSON.stringify({...pack,packId:'practice',...patch});

test('builtin preserves each legacy question, both languages and rubric order',async()=>{
  const {validatedPack:p} = await createPackRegistry().registerBuiltin();
  const old = read('../data/questions.json');
  assert.equal(p.questions.length,3);
  p.questions.forEach((q,i)=>{
    const o=old[i];
    assert.equal(q.id,o.id);
    assert.equal(q.review.status,'unreviewed');
    assert.deepEqual(q.title,{'zh-CN':o.title,en:o.title_en});
    assert.equal(q.layers.length,3);
    q.layers.forEach((l,j)=>{
      assert.equal(l.id,o.layers[j].id);
      assert.deepEqual(l.prompt,{'zh-CN':o.layers[j].prompt,en:o.layers[j].prompt_en});
      assert.deepEqual(l.rubric.map(r=>r.criterion.en),o.layers[j].rubric_en);
      assert.deepEqual(l.rubric.map(r=>r.criterion['zh-CN']),o.layers[j].rubric);
    });
  });
});
test('concurrent identical and conflicting registrations are atomic',async()=>{
  const r=createPackRegistry();
  const [a,b]=await Promise.all([r.registerImported(sample()),r.registerImported(sample())]);
  assert.deepEqual(a,b);
  const race=await Promise.allSettled(['first','second'].map(en=>r.registerImported(sample({packVersion:'1.0.1',title:{...pack.title,en}}))));
  assert.equal(race.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(race.find(x=>x.status==='rejected').reason.code,'VERSION_CONFLICT');
  assert.deepEqual(r.versions('practice'),['1.0.0','1.0.1']);
  assert.deepEqual(r.get('practice','1.0.1'),race.find(x=>x.status==='fulfilled').value);
});
test('namespace, validation, isolation and version ordering',async()=>{
  const r=createPackRegistry();
  await r.registerBuiltin();
  await assert.rejects(r.registerImported(JSON.stringify(pack)),{code:'RESERVED_ID'});
  await assert.rejects(r.registerImported(pack),{code:'INVALID_PACK'});
  await assert.rejects(r.registerImported(sample({questions:[pack.questions[0],pack.questions[0]]})),{code:'INVALID_PACK'});
  await assert.rejects(r.registerImported(sample({packVersion:'01.0.0'})),{code:'INVALID_PACK'});
  assert.deepEqual(r.list(),['unscripted-core']);
  const bytes=new TextEncoder().encode(sample());
  const promise=r.registerImported(bytes);
  bytes.fill(0);
  const record=await promise;
  record.validatedPack.title.en='changed';
  assert.deepEqual(r.get('practice','1.0.0').validatedPack.title,pack.title);
  for(const v of ['9007199254740993.0.0','9007199254740992.0.0']) await r.registerImported(sample({packVersion:v}));
  assert.deepEqual(r.versions('practice'),['1.0.0','9007199254740992.0.0','9007199254740993.0.0']);
});
test('JCS RFC 8785 numeric serialization and UTF-16 sorting vector',async()=>{
  const vector={'\u20ac':'Euro Sign','\r':'Carriage Return','\ufb33':'Hebrew Letter Dalet With Dagesh','1':'One','😀':'Emoji: Grinning Face','\u0080':'Control','ö':'Latin Small Letter O With Diaeresis'};
  const expected='{"\\r":"Carriage Return","1":"One","\u0080":"Control","ö":"Latin Small Letter O With Diaeresis","€":"Euro Sign","😀":"Emoji: Grinning Face","דּ":"Hebrew Letter Dalet With Dagesh"}';
  const digest=s=>'sha256:'+createHash('sha256').update(s).digest('hex');
  assert.equal(await computePackDigest(vector),digest(expected));
  assert.equal(await computePackDigest([333333333.33333329,1e30,4.50,2e-3,1e-27]),digest('[333333333.3333333,1e+30,4.5,0.002,1e-27]'));
  assert.equal(await computePackDigest(Object.fromEntries(Object.entries(pack).reverse())),await computePackDigest(pack));
  assert.notEqual(await computePackDigest({...pack,questions:[...pack.questions].reverse()}),await computePackDigest(pack));
  assert.notEqual(await computePackDigest('é'),await computePackDigest('e\u0301'));
});
test('whole-pack preview language, counts, plain text and author claims',async()=>{
  const r=createPackRegistry();
  const record=await r.registerBuiltin();
  for(const lang of ['en','zh-CN','zh','fr']){
    const p=previewPack(record,lang), actual=lang.startsWith('zh')?'zh-CN':'en';
    assert.equal(p.language,actual); assert.equal(p.fallback,lang==='fr');
    assert.deepEqual(p.questionSummaries.map(q=>q.title),pack.questions.map(q=>q.title[actual]));
    assert.deepEqual([p.questionCount,p.layerCount,p.rubricCount],[3,9,29]);
    assert.deepEqual(p.reviewStatus,{authorReviewed:0,unreviewed:3});
  }
  const html='<b>Literal</b>';
  const changed=JSON.parse(sample()); changed.title.en=html;
  changed.questions[0].review={status:'reviewed',reviewer:'Author',reviewedAt:'2026-01-01T00:00:00Z'};
  const p=previewPack(await r.registerImported(JSON.stringify(changed)),'en');
  assert.equal(p.title,html); assert.equal(p.reviewStatus.authorReviewed,1);
});
test('registration never touches local storage and failed digest preserves state',async()=>{
  const storage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const cryptoDescriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('unexpected storage access')}});
  try {
    const r=createPackRegistry();
    const before=await r.registerBuiltin();
    Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});
    await assert.rejects(r.registerImported(sample()),/Web Crypto/);
    assert.deepEqual(r.list(),['unscripted-core']);
    assert.deepEqual(r.get(before.packId,before.packVersion),before);
  } finally {
    Object.defineProperty(globalThis,'crypto',cryptoDescriptor);
    if(storage) Object.defineProperty(globalThis,'localStorage',storage);
    else delete globalThis.localStorage;
  }
});
