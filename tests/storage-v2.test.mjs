import test from 'node:test';
import assert from 'node:assert/strict';
import {createLearningStore} from '../src/storage-v2.js';
import {createMigrationService} from '../src/storage/migration.js';
import {createPackRegistry} from '../src/packs/registry.js';
import {P1,H1,V2,PREFIX} from '../src/storage/snapshot.js';
const ts='2026-01-01T00:00:00.000Z';
const registry=createPackRegistry(),core=await registry.registerBuiltin();
const q=core.validatedPack.questions[0], layer=q.layers[0],key=q.id+'::L1';
const ctx=r=>({packId:r.packId,packVersion:r.packVersion,contentDigest:r.contentDigest,questionId:q.id,layerId:'L1'});
const input={confirmed:true,ts,criterionResults:layer.rubric.map(r=>({rubricId:r.rubricId,light:'green'})),answer:'synthetic'};
const imported=await registry.registerImported(JSON.stringify({...core.validatedPack,packId:'study'}));
const newer=await registry.registerImported(JSON.stringify({...core.validatedPack,packId:'study',packVersion:'1.0.1'}));
function fixture(){
  const map=new Map(),writes=[];
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v);},removeItem:k=>map.delete(k),
    key:i=>[...map.keys()][i],get length(){return map.size;}};
  let queue=Promise.resolve();
  const locks={request:(_name,_opts,f)=>{const task=queue.then(f);queue=task.catch(()=>{});return task;}};
  const deps={storage,registry,locks};
  const m=createMigrationService(deps);
  return {map,storage,writes,m,s:createLearningStore(deps),deps,
    async migrate(){const {token}=await m.previewMigration();return m.migrateLegacyData({confirmed:true,token});}};
}
function seed(f){
  f.map.set(P1,JSON.stringify({schemaVersion:1,items:{[key]:{status:'pass',updatedAt:ts},'unknown::L2':{status:'review',updatedAt:ts}}}));
  f.map.set(H1,JSON.stringify({schemaVersion:1,saveAnswers:true,entries:[{questionId:q.id,layer:'L1',ts,light:'red',pointLights:['red'],missedPoints:[0],answer:'synthetic'}]}));
}
test('one confirmation is one write, detached views, version and digest isolation',async()=>{
  const {s,writes}=fixture();
  await s.recordSelfRating(ctx(core),input);assert.deepEqual(writes,[V2]);
  const v=s.view(ctx(core));assert.equal(v.history.length,1);assert.equal(v.history[0].answer,undefined);
  assert.equal(Object.values(v.items)[0].status,'pass');v.history.length=0;
  assert.equal(s.view(ctx(core)).history.length,1);
  assert.deepEqual(s.view(ctx(imported)).items,{});await s.recordSelfRating(ctx(imported),input);
  assert.deepEqual(s.view(ctx(newer)).items,{});assert.equal(s.view(ctx(imported)).history.length,1);
  assert.throws(()=>s.view({...ctx(core),contentDigest:imported.contentDigest}),/DIGEST/);
  await assert.rejects(s.recordSelfRating(ctx(core),{...input,confirmed:false}));
  await assert.rejects(s.recordSelfRating(ctx(core),{...input,criterionResults:[{rubricId:'foreign',light:'green'}]}));
});
test('latest 200 entries; answer opt-in, revocation and explicit pack clearing',async()=>{
  const f=fixture();await f.s.setSaveAnswers(true);
  for(let i=0;i<201;i++)await f.s.recordSelfRating(ctx(core),{...input,answer:String(i)});
  const h=f.s.view(ctx(core)).history;assert.equal(h.length,200);assert.equal(h[0].answer,'1');
  await f.s.setSaveAnswers(false);assert.ok(f.s.view(ctx(core)).history.every(e=>!('answer' in e)));
  seed(f);f.map.set(PREFIX+'old.backup','retained');
  for(const r of [imported,newer])await f.s.recordSelfRating(ctx(r),input);
  await f.s.clearPack(ctx(imported),true);assert.equal(f.s.view(ctx(newer)).history.length,0);
  assert.equal(f.s.view(ctx(imported)).history.length,0);assert.equal(f.s.view(ctx(core)).history.length,200);
  assert.ok(f.map.has(P1)&&f.map.has(PREFIX+'old.backup'));
});
test('quota rejects confirmation and preserves the previous durable snapshot',async()=>{
  const f=fixture();await f.s.recordSelfRating(ctx(core),input);const old=f.map.get(V2);
  f.storage.setItem=()=>{throw new DOMException('quota','QuotaExceededError')};
  await assert.rejects(f.s.recordSelfRating(ctx(core),input),{name:'QuotaExceededError'});assert.equal(f.map.get(V2),old);
});
test('empty migration; confirmation and lock required',async()=>{
  const f=fixture();const p=await f.m.previewMigration();assert.equal(p.mapped,0);
  await f.m.migrateLegacyData({confirmed:false,token:p.token});assert.equal(f.map.size,0);
  await assert.rejects(createMigrationService({...f.deps,locks:null}).migrateLegacyData({confirmed:true,token:p.token}),/LOCK/);
  assert.equal((await f.migrate()).state,'committed');
});
test('preview, archive, reconfirmation, repeated migration and post-commit source drift',async()=>{
  const f=fixture();seed(f);const before=new Map(f.map);const p=await f.m.previewMigration();
  assert.deepEqual(p.unmapped,['unknown::L2']);assert.equal(p.archivedHistory,1);
  const calls=await Promise.all([1,2].map(()=>f.m.migrateLegacyData({confirmed:true,token:p.token})));
  assert.ok(calls.every(r=>r.state==='committed'));assert.equal(f.writes.filter(k=>k===V2).length,1);
  for(const [k,v] of before)assert.equal(f.map.get(k),v);
  const view=f.s.view(ctx(core));assert.deepEqual(view.items,{});assert.equal(view.history.length,0);
  assert.equal(Object.values(view.legacyItems)[0].needsReconfirmation,true);
  const a=await f.m.readLegacyArchive();assert.equal(a.entries[0].answer,'synthetic');assert.deepEqual(a.entries[0].missedPoints,[0]);
  a.entries.length=0;assert.equal((await f.m.readLegacyArchive()).entries.length,1);
  f.map.delete(P1);assert.equal((await f.m.inspectMigrationState()).state,'source-conflict');
});
for(const [name,key,raw] of [['json',P1,'{'],['version',P1,'{"schemaVersion":3,"items":{}}'],['history',H1,'{"schemaVersion":1,"saveAnswers":false,"entries":[{}]}']]){
  test('strict migration rejects '+name,async()=>{const f=fixture();f.map.set(key,raw);await assert.rejects(f.m.previewMigration());assert.equal(f.writes.length,0);});
}
for(const point of ['read','backup','candidate','candidate-readback','final','source-change','target-appears','crash-after-final']){
  test('migration fault '+point,async()=>{
    const f=fixture();seed(f);const p=await f.m.previewMigration(),source=f.map.get(P1);
    const get=f.storage.getItem,set=f.storage.setItem;
    f.storage.getItem=k=>{
      if(point==='read')throw Error('read failed');
      if(point==='candidate-readback'&&k.endsWith('.candidate')&&f.map.has(k))return '{}';
      return get(k);
    };
    f.storage.setItem=(k,v)=>{
      if((point==='backup'&&k.endsWith('.backup'))||(point==='candidate'&&k.endsWith('.candidate'))||(point==='final'&&k===V2))throw Error('write failed');
      set(k,v);
      if(k.endsWith('.candidate')&&point==='source-change')f.map.set(P1,source+' ');
      if(k.endsWith('.candidate')&&point==='target-appears')f.map.set(V2,'preserve');
      if(k===V2&&point==='crash-after-final')throw Error('interrupted');
    };
    await assert.rejects(f.m.migrateLegacyData({confirmed:true,token:p.token}));
    f.storage.getItem=get;assert.equal(f.map.get(P1),point==='source-change'?source+' ':source);
    if(point==='crash-after-final')assert.equal((await f.m.inspectMigrationState()).state,'committed');
    else if(point==='target-appears')assert.equal(f.map.get(V2),'preserve');
    else assert.ok(!f.map.has(V2));
  });
}
test('existing valid or damaged v2 never overwritten',async()=>{
  const f=fixture();await f.s.recordSelfRating(ctx(core),input);const raw=f.map.get(V2);
  assert.equal((await f.m.migrateLegacyData({confirmed:true})).state,'existing');assert.equal(f.map.get(V2),raw);
  f.map.set(V2,'{}');await assert.rejects(f.m.migrateLegacyData({confirmed:true}));await assert.rejects(f.s.recordSelfRating(ctx(core),input));assert.equal(f.map.get(V2),'{}');
});
test('full deletion cancels, reports partial failure, removes orphan archives and retains preferences',async()=>{
  const f=fixture();seed(f);await f.migrate();f.map.set('unscripted.language','en');f.map.set(PREFIX+'orphan.candidate','private');
  const before=new Map(f.map);await f.s.deleteAll(false);assert.deepEqual(f.map,before);
  const remove=f.storage.removeItem;f.storage.removeItem=k=>{if(k===H1)throw Error('denied');remove(k);};
  assert.deepEqual(await f.s.deleteAll(true),{deleted:false,remaining:[H1]});
  f.storage.removeItem=remove;assert.equal((await f.s.deleteAll(true)).deleted,true);assert.deepEqual([...f.map.keys()],['unscripted.language']);
});
test('view requires migration when either legacy key exists, including empty raw strings',()=>{
  const f=fixture();
  assert.deepEqual(f.s.view(ctx(core)),{items:{},legacyItems:{},history:[]});
  for(const key of [P1,H1]){
    f.map.set(key,'');
    assert.throws(()=>f.s.view(ctx(core)),{message:'MIGRATION_REQUIRED'});
    assert.deepEqual([...f.map],[[key,'']]);
    f.map.delete(key);
  }
  assert.deepEqual(f.writes,[]);
});
test('v2 rejects invalid calendar and clock values at write and snapshot read',async()=>{
  const f=fixture();
  const leap='2024-02-29T23:59:59.12+08:00';
  await f.s.recordSelfRating(ctx(core),{...input,ts:leap});
  const original=f.map.get(V2);
  for(const ts of ['2025-02-29T12:00:00Z','2024-02-30T12:00:00Z','2024-04-31T12:00:00+08:00','2024-12-01T24:00:00Z','2024-01-01T00:60:00Z']){
    await assert.rejects(f.s.recordSelfRating(ctx(core),{...input,ts}),/INVALID_RATING/);
    assert.equal(f.map.get(V2),original);
    const snapshot=JSON.parse(original);
    const v=snapshot.packs[core.packId].versions[core.packVersion];
    Object.values(v.items)[0].updatedAt=v.history[0].ts=ts;
    f.map.set(V2,JSON.stringify(snapshot));
    assert.throws(()=>f.s.view(ctx(core)),/DAMAGED_STATE/);
    f.map.set(V2,original);
  }
});
test('legacy timestamps retain v1 interpretation and exact source text',async()=>{
  const f=fixture();seed(f);
  const old='2025-02-30T12:00:00Z';
  for(const k of [P1,H1])f.map.set(k,f.map.get(k).replaceAll(ts,old));
  const before=new Map(f.map);
  await f.migrate();
  for(const [k,v] of before)assert.equal(f.map.get(k),v);
  assert.equal(Object.values(f.s.view(ctx(core)).legacyItems)[0].updatedAt,old);
  assert.equal((await f.m.readLegacyArchive()).entries[0].ts,old);
});
