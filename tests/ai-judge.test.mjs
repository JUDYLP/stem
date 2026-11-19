import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOSTED_PROXY_URL, HOSTED_TIMEOUT_MS} from '../src/ai/hosted.js';
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
test('model prompt sets reason length and requires a standalone JSON object',()=>{
  const [system] = buildMessages(context,answer);
  assert.match(system.content,/30 English words or 60 Chinese characters/);
  assert.match(system.content,/JSON object only, without Markdown or surrounding text/);
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

test('hosted requests use the 35-second timeout, with 20 seconds for standard connections',async t=>{
  const timing=t.mock.method(AbortSignal,'timeout',()=>new AbortController().signal);
  t.mock.method(globalThis,'fetch',async()=>new Response(
    '{"choices":[{"finish_reason":"stop","message":{"content":"{}"}}]}'));
  await createAIProvider({proxyURL:HOSTED_PROXY_URL,timeoutMs:HOSTED_TIMEOUT_MS})([]);
  await createAIProvider(settings)([]);
  assert.deepEqual(timing.mock.calls.map(call=>call.arguments[0]),[35000,20000]);
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

const targets = [
  {
    q: 'redis-expiration-v2', layer: 2, id: 'redis-expiration-v2-l3-c05',
    counterexamples: ['INCR changes the value to 2.', 'After INCR, the value becomes 2.', 'INCR 后数值变为 2。'],
    supported: [
      'INCR changes the value to 2 and keeps the original TTL deadline.',
      'The counter reaches two and the key still dies at the very same instant as before.',
      '加一到二，仍在原定时刻失效。',
    ],
  },
  {
    q: 'juc-volatile-atomicity-v2', layer: 0, id: 'juc-volatile-atomicity-v2-l1-c02',
    counterexamples: ['i++ is not atomic.', 'The increment isn’t thread-safe.', 'i++ 不是原子操作。'],
    supported: [
      'Both threads read the same old value, compute the same successor and write it back, losing one update.',
      'Both workers fetch five, each adds one, and each stores six. Two increments advance the count only once.',
      '两个线程同时取到五，各加一，各存六。两次增量只生效一次。',
    ],
  },
];

for (const {q,layer,id,counterexamples,supported} of targets) {
  const topic=load('../data/questions.json').find(entry=>entry.id===q);
  const modelVerdict=quote=>({pointId:id,light:'green',reason:'Claims the point is covered.',quote});
  test(id+' downgrades a model Green that quotes only the conclusion', async()=>{
    for (const [index, answer] of counterexamples.entries()) {
      const ctx=redisContext(pack,topic,topic.layers[layer],index===2?'zh':'en');
      const result=await new Promise((resolve,reject)=>{
        judgeAnswer(async()=>({verdicts:[modelVerdict(answer)],followUp:null}),ctx,answer,
          new AbortController().signal,resolve).catch(reject);
      });
      const point=result.verdicts.find(row=>row.pointId===id);
      assert.equal(point.light,'amber');
      assert.notEqual(point.reason,modelVerdict(answer).reason);
      assert.equal(point.quote,answer);
      if (q==='redis-expiration-v2') {
        const value={...modelVerdict(answer),pointId:'redis-expiration-v2-l3-c02'};
        assert.equal(validateVerdicts({verdicts:[value],followUp:null},ctx.criteria,answer)
          .verdicts.find(row=>row.pointId===value.pointId).light,'green');
      }
    }
  });
  test(id+' accepts model Green for complete evidence including paraphrases',()=>{
    const ctx=redisContext(pack,topic,topic.layers[layer],'en');
    assert.match(buildMessages(ctx,supported[0])[0].content,/supports all necessary parts/);
    for (const answer of supported) {
      const result=validateVerdicts({verdicts:[modelVerdict(answer)],followUp:null},ctx.criteria,answer);
      assert.equal(result.verdicts.find(row=>row.pointId===id).light,'green');
    }
  });
}
