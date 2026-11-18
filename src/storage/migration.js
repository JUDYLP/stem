import {P1,H1,V2,PREFIX,shape,object,check,parse,empty,version,readState,keys,locked,writeChecked,timestamp,light} from './snapshot.js';
const known=new Set(['juc-volatile-atomicity-v2','redis-expiration-v2','mysql-consistent-read-v2']);
const sources=storage=>({progress:storage.getItem(P1),history:storage.getItem(H1)});
async function fingerprint(raw){
  if(raw===null)return null;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return 'sha256:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function strictLegacy(raw){
  const p=raw.progress===null?{schemaVersion:1,items:{}}:parse(raw.progress);
  shape(p,['schemaVersion','items']);check(p.schemaVersion===1 && object(p.items));
  for(const [k,i] of Object.entries(p.items)){
    check(/^[a-z0-9-]+::L[123]$/.test(k));shape(i,['status','updatedAt']);
    check(['pass','review'].includes(i.status)&&timestamp(i.updatedAt));
  }
  const h=raw.history===null?{schemaVersion:1,saveAnswers:false,entries:[]}:parse(raw.history);
  shape(h,['schemaVersion','saveAnswers','entries']);
  check(h.schemaVersion===1 && typeof h.saveAnswers==='boolean' && Array.isArray(h.entries)&&h.entries.length<=200);
  for(const e of h.entries){
    shape(e,['questionId','layer','ts','light','pointLights','missedPoints'],['answer']);
    check(typeof e.questionId==='string' && /^[a-z0-9-]+$/.test(e.questionId) && /^L[123]$/.test(e.layer)&&timestamp(e.ts)&&light(e.light));
    check(Array.isArray(e.pointLights)&&e.pointLights.length && e.pointLights.every(light));
    check(Array.isArray(e.missedPoints)&&e.missedPoints.every(i=>Number.isInteger(i)&&i>=0&&i<e.pointLights.length));
    check(!('answer' in e)||typeof e.answer==='string');
  }
  return {items:p.items,entries:h.entries};
}

export function createMigrationService({storage,locks,registry}){
  function preflightMigration(){
    const raw=sources(storage);
    const exists=storage.getItem(V2)!==null;
    if(exists)readState(storage);
    return {progressPresent:raw.progress!==null,historyPresent:raw.history!==null,targetExists:exists};
  }
  async function prepare(){
    const raw=sources(storage);
    const {items,entries}=strictLegacy(raw);
    const r=registry.get('unscripted-core','1.0.0');
    check(r?.source==='builtin','BUILTIN_REQUIRED');
    const state=empty(),v=version(state,r,true),unmapped=[];
    for(const [key,i] of Object.entries(items)){
      if(!known.has(key.split('::')[0])){unmapped.push(key);continue;}
      v.items[r.packId+'::'+key]={...i,source:'legacy-v1',needsReconfirmation:true};
    }
    const sourceProgressDigest=await fingerprint(raw.progress),sourceHistoryDigest=await fingerprint(raw.history);
    const token=JSON.stringify([sourceProgressDigest,sourceHistoryDigest,r.contentDigest]);
    return {raw,state,sourceProgressDigest,sourceHistoryDigest,preview:{token,mapped:Object.keys(v.items).length,unmapped,archivedHistory:entries.length}};
  }
  async function inspectMigrationState(){
    const artifacts=keys(storage).filter(k=>k.startsWith(PREFIX));
    if(storage.getItem(V2)===null)return {state:artifacts.length?'interrupted':'absent',artifacts};
    const m=readState(storage).migration;
    if(!m)return {state:'existing',artifacts};
    const raw=sources(storage);
    const changed=await fingerprint(raw.progress)!==m.sourceProgressDigest || await fingerprint(raw.history)!==m.sourceHistoryDigest;
    return {state:changed?'source-conflict':'committed',artifacts};
  }
  return {
    preflightMigration,inspectMigrationState,
    async previewMigration(){check(!preflightMigration().targetExists,'TARGET_EXISTS');return (await prepare()).preview;},
    async migrateLegacyData({confirmed,token}){
      if(confirmed!==true)return {state:'cancelled'};
      return locked(locks,async()=>{
        if(storage.getItem(V2)!==null)return inspectMigrationState();
        const plan=await prepare();check(plan.preview.token===token,'SOURCE_CHANGED');
        const transactionId=crypto.randomUUID(),prefix=PREFIX+transactionId+'.';
        const backup=prefix+'backup',candidate=prefix+'candidate';
        check(storage.getItem(backup)===null&&storage.getItem(candidate)===null,'TRANSACTION_COLLISION');
        plan.state.migration={transactionId,state:'committed',sourceProgressDigest:plan.sourceProgressDigest,sourceHistoryDigest:plan.sourceHistoryDigest};
        const snapshot=JSON.stringify(plan.state);
        writeChecked(storage,backup,JSON.stringify(plan.raw));
        writeChecked(storage,candidate,snapshot);
        readState({getItem:()=>storage.getItem(candidate)});
        const now=sources(storage);
        check(now.progress===plan.raw.progress && now.history===plan.raw.history,'SOURCE_CHANGED');
        check(storage.getItem(V2)===null,'TARGET_EXISTS');
        writeChecked(storage,V2,snapshot);
        const result=await inspectMigrationState();
        if(result.state==='committed')storage.removeItem(candidate);
        return {state:result.state,transactionId};
      });
    },
    async readLegacyArchive(){
      const m=readState(storage).migration;check(m,'NO_ARCHIVE');
      const raw=storage.getItem(PREFIX+m.transactionId+'.backup');check(raw!==null,'BACKUP_MISSING');
      const archive=parse(raw);shape(archive,['progress','history']);
      check(await fingerprint(archive.progress)===m.sourceProgressDigest && await fingerprint(archive.history)===m.sourceHistoryDigest,'BACKUP_DAMAGED');
      return strictLegacy(archive);
    },
  };
}
