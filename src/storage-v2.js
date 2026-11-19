import {V2,P1,H1,PREFIX,readState,check,locked,version,keys,writeChecked,light,timestamp} from './storage/snapshot.js';
import {summarizeLights,statusForLight} from './lights.js';

export function createLearningStore({storage,locks,registry}){
  function resolve(ctx){
    const r=registry.get(ctx.packId,ctx.packVersion);
    check(r && r.contentDigest===ctx.contentDigest,'DIGEST_MISMATCH');return r;
  }
  async function update(change){
    return locked(locks,()=>{
      const state=readState(storage);
      if(state.migration){
        const raw=storage.getItem(PREFIX+state.migration.transactionId+'.backup');
        check(raw!==null,'BACKUP_MISSING');
        const archived=JSON.parse(raw);
        check(archived.progress===storage.getItem(P1) && archived.history===storage.getItem(H1),'SOURCE_CHANGED');
      }
      change(state);
      writeChecked(storage,V2,JSON.stringify(state));
      return {persisted:true};
    });
  }
  return {
    view(ctx){
      const v=version(readState(storage),resolve(ctx));
      const items={}, legacyItems={};
      for(const [k,i] of Object.entries(v?.items??{}))(i.needsReconfirmation?legacyItems:items)[k]=i;
      return {items,legacyItems,history:v?.history??[]};
    },
    async recordSelfRating(ctx,input){
      const r=resolve(ctx);
      const {questionId,layerId}=ctx;
      const {confirmed,criterionResults,answer,ts=new Date().toISOString()}=structuredClone(input);
      check(confirmed===true,'CONFIRMATION_REQUIRED');
      const layer=r.validatedPack.questions.find(q=>q.id===questionId)?.layers.find(l=>l.id===layerId);
      check(layer && timestamp(ts) && (answer===undefined||typeof answer==='string'),'INVALID_RATING');
      check(Array.isArray(criterionResults)&&criterionResults.length===layer.rubric.length,'INVALID_CRITERIA');
      const results=layer.rubric.map(({rubricId})=>{
        const found=criterionResults.find(c=>c?.rubricId===rubricId);
        check(found && light(found.light),'INVALID_CRITERIA');return {rubricId,light:found.light};
      });
      return update(s=>{
        const v=version(s,r,true);
        const aggregate=summarizeLights(results.map(c=>c.light));
        v.items[[r.packId,questionId,layerId].join('::')]={status:statusForLight(aggregate),updatedAt:ts};
        const h={packId:r.packId,packVersion:r.packVersion,questionId,layerId,ts,light:aggregate,criterionResults:results};
        if(s.saveAnswers && answer!==undefined)h.answer=answer;
        v.history.push(h);v.history=v.history.slice(-200);
      });
    },
    setSaveAnswers(enabled){
      check(typeof enabled==='boolean');
      return update(s=>{
        s.saveAnswers=enabled;
        if(!enabled)for(const p of Object.values(s.packs))for(const v of Object.values(p.versions))for(const h of v.history)delete h.answer;
      });
    },
    clearPack(ctx,confirmed){
      if(confirmed!==true)return {cancelled:true};
      const r=resolve(ctx);return update(s=>{version(s,r);delete s.packs[r.packId];});
    },
    async deleteAll(confirmed){
      if(confirmed!==true)return {cancelled:true};
      return locked(locks,()=>{
        const owned=()=>keys(storage).filter(k=>[P1,H1,V2].includes(k)||k.startsWith(PREFIX));
        for(const key of owned()){try{storage.removeItem(key);}catch{/* verify all remaining keys */}}
        const remaining=owned();return {deleted:remaining.length===0,remaining};
      });
    },
  };
}
