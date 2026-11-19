import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAIProvider} from '../src/ai/provider.js';
import {judgeAnswer,validateVerdicts,redisContext,buildMessages,requestGate} from '../src/ai/judge.js';
const load = path=>JSON.parse(readFileSync(new URL(path,import.meta.url)));
const pack=load('../data/packs/unscripted-core.v1.json');
const question=load('../data/questions.json').find(q=>q.id==='redis-expiration-v2');
const context=redisContext(pack,question,question.layers[0],'en');
const criteria=context.criteria,answer='An expired key is removed when accessed.';
const row={pointId:criteria[0].pointId,light:'green',reason:'Explains lazy deletion',quote:answer};
const check=verdicts=>validateVerdicts({verdicts,followUp:null},criteria,answer);
test('Redis adapter rejects drift between official rubric and training copy',()=>{
  assert.throws(()=>redisContext(pack,question,{...question.layers[0],rubric_en:[]},'en'),/MISMATCH/);
  assert.equal(buildMessages(context,answer)[1].role,'user');
});
test('verdicts join by stable ID, missing points amber, false evidence downgraded',()=>{
  const result=check([row]);assert.equal(result.verdicts[0].light,'green');assert.equal(result.verdicts[1].light,'amber');
  assert.equal(check([{...row,quote:'invented'}]).verdicts[0].light,'amber');
  assert.throws(()=>check([row,row]),/CONTRACT/);assert.throws(()=>check([{...row,pointId:'unknown'}]),/CONTRACT/);
});
test('new request and navigation invalidate the prior answer',()=>{
  const gate=requestGate(), first=gate.start(), second=gate.start();
  assert.ok(first.aborted);gate.cancel();assert.ok(second.aborted);
});
const settings={apiKey:'synthetic'};
for(const [name,response,expected] of [
  ['valid',new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]})),null],
  ['outer JSON',new Response('bad'),'INVALID_JSON'],
  ['content JSON',new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'bad'}}]})),'INVALID_JSON'],
  ['empty',new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:''}}]})),'EMPTY'],
  ['truncated',new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'{}'}}]})),'TRUNCATED'],
  ...[401,429,503].map(s=>[String(s),new Response(null,{status:s}),'HTTP_'+s]),
]){
  test('provider '+name,async t=>{
    t.mock.method(globalThis,'fetch',async()=>response);
    const request=createAIProvider(settings)([]);
    if(expected)await assert.rejects(request,new RegExp(expected));else assert.deepEqual(await request,{ok:true});
  });
}
test('missing key stays offline; timeout reported explicitly',async t=>{
  await assert.rejects(createAIProvider()([]),/NO_KEY/);
  t.mock.method(globalThis,'fetch',async()=>{throw new DOMException('timed out','TimeoutError')});
  await assert.rejects(createAIProvider(settings)([]),/TIMEOUT/);
});

test('judge only emits suggestions; a superseded completion cannot reach the view',async t=>{
  const gate=requestGate(), applied=[];
  let finish;
  const pending=judgeAnswer(()=>new Promise(r=>{finish=r}),context,answer,gate.start(),v=>applied.push(v));
  gate.cancel();
  finish({verdicts:[row],followUp:null});
  await pending;
  assert.equal(applied.length,0);
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('unexpected storage access')}});
  t.after(()=>{if(previous) Object.defineProperty(globalThis,'localStorage',previous); else delete globalThis.localStorage;});
  await judgeAnswer(async()=>({verdicts:[row],followUp:null}),context,answer,gate.start(),v=>applied.push(v));
  assert.equal(applied.length,1);
});
