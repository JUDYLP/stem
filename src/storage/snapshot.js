import {validRubricSnapshot} from '../history.js';
import {parseStrictJson} from '../packs/strict-json.js';
import {summarizeLights,statusForLight} from '../lights.js';

export const V2='unscripted.progress.v2', P1='unscripted.progress.v1', H1='unscripted.history.v1', PREFIX='unscripted.migration.v2.';
export const empty=()=>({schemaVersion:2,packs:{},saveAnswers:false,migration:null});
export function check(condition, code='DAMAGED_STATE') { if (!condition) throw new Error(code); }
export function object(x){return x!==null && typeof x==='object' && !Array.isArray(x);}
export function shape(x, required, optional=[]) {
  check(object(x) && required.every(k=>Object.hasOwn(x,k)) && Object.keys(x).every(k=>required.includes(k)||optional.includes(k)));
}
export function parse(raw){
  const result=parseStrictJson(raw);
  check(!result.error); return result.value;
}
// v1 accepted all Date.parse-compatible strings. Keep original legacy bytes and semantics.
export const legacyTimestamp=t=>typeof t==='string' && Number.isFinite(Date.parse(t));

export function timestamp(text){
  if(typeof text!=='string')return false;
  const match=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(text);
  if(!match || !Number.isFinite(Date.parse(text)))return false;
  // Check the supplied wall clock before applying its offset. Date.parse alone
  // normalizes inputs such as February 30 or 24:00 to the following day.
  const wallTime=match[1]+'.'+(match[2]??'').slice(0,3).padEnd(3,'0')+'Z';
  const parsed=new Date(wallTime);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString()===wallTime;
}
export const light=l=>['green','amber','red'].includes(l);
export const digest=d=>typeof d==='string' && /^sha256:[a-f0-9]{64}$/.test(d);
const id=s=>typeof s==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && !['constructor','prototype'].includes(s);
export function item(value){
  shape(value,['status','updatedAt'],['source','needsReconfirmation']);
  check(['pass','review'].includes(value.status)&&(value.source==='legacy-v1' ? legacyTimestamp : timestamp)(value.updatedAt));
  if ('source' in value || 'needsReconfirmation' in value) check(value.source==='legacy-v1' && value.needsReconfirmation===true);
}
export function readState(storage){
  const raw=storage.getItem(V2);
  if(raw===null){
    check(storage.getItem(P1)===null && storage.getItem(H1)===null,'MIGRATION_REQUIRED');
    return empty();
  }
  const s=parse(raw);
  shape(s,['schemaVersion','packs','saveAnswers','migration']);
  check(s.schemaVersion===2 && object(s.packs) && typeof s.saveAnswers==='boolean');
  if(s.migration!==null){
    const m=s.migration;
    shape(m,['state','transactionId','sourceProgressDigest','sourceHistoryDigest']);
    check(m.state==='committed' && typeof m.transactionId==='string' && /^[0-9a-f-]{36}$/.test(m.transactionId));
    for(const d of [m.sourceProgressDigest,m.sourceHistoryDigest])check(d===null||digest(d));
  }
  for(const [pid,p] of Object.entries(s.packs)){
    shape(p,['versions']); check(id(pid)&&object(p.versions));
    for(const [ver,v] of Object.entries(p.versions)){
      check(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(ver));
      shape(v,['contentDigest','items','history']);
      check(digest(v.contentDigest)&&object(v.items)&&Array.isArray(v.history)&&v.history.length<=200);
      for(const [key,i] of Object.entries(v.items)){
        const [p,q,l,...extra]=key.split('::');
        check(p===pid && id(q) && /^L[123]$/.test(l) && !extra.length); item(i);
      }
      const latest=new Map();
      for(const h of v.history){
        shape(h,['packId','packVersion','questionId','layerId','ts','light','criterionResults'],['answer','rubricSnapshot']);
        check(h.packId===pid && h.packVersion===ver && id(h.questionId) && /^L[123]$/.test(h.layerId) && timestamp(h.ts));
        check(!('answer' in h)||(s.saveAnswers && typeof h.answer==='string'));
        check(Array.isArray(h.criterionResults)&&h.criterionResults.length>0&&h.criterionResults.length<=12);
        const ids=new Set();
        for(const r of h.criterionResults){shape(r,['rubricId','light']);check(id(r.rubricId)&&light(r.light)&&!ids.has(r.rubricId));ids.add(r.rubricId);}
        if ('rubricSnapshot' in h) {
          const snapshot=h.rubricSnapshot;
          check(validRubricSnapshot(snapshot,h.criterionResults.length)&&snapshot.packId===pid&&snapshot.packVersion===ver&&
            snapshot.rubric.every((row,index)=>row.rubricId===h.criterionResults[index].rubricId));
        }
        check(h.light===summarizeLights(h.criterionResults.map(r=>r.light)));
        latest.set([pid,h.questionId,h.layerId].join('::'),h);
      }
      for(const [key,h] of latest){const i=v.items[key];check(i && !i.needsReconfirmation && i.updatedAt===h.ts && i.status===statusForLight(h.light));}
    }
  }
  if (s.migration === null) {
    check(storage.getItem(P1) === null && storage.getItem(H1) === null, 'LEGACY_DATA_CONFLICT');
  }
  return s;
}
export function version(s,r,create=false){
  let p=s.packs[r.packId];
  if(!p && create)p=s.packs[r.packId]={versions:{}};
  let v=p?.versions[r.packVersion];
  if(!v && create)v=p.versions[r.packVersion]={contentDigest:r.contentDigest,items:{},history:[]};
  check(!v || v.contentDigest===r.contentDigest,'DIGEST_MISMATCH');return v;
}
export function locked(locks,fn){
  check(locks?.request,'LOCK_UNAVAILABLE');
  return locks.request('unscripted.learning.v2',{mode:'exclusive'},fn);
}
export function keys(storage){return Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>typeof k==='string');}
export function writeChecked(storage,key,raw){
  storage.setItem(key,raw);
  check(storage.getItem(key)===raw,'READBACK_FAILED');
}
