import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const site = 'https://judylp.github.io';
const local = 'http://localhost:5174';
const payload = {messages:[{role:'system',content:'Grade JSON.'},{role:'user',content:'Answer.'}]};
const route = 'https://example.workers.dev';
const ip = '192.0.2.7';

function req({origin=site, method='POST', data=payload, raw, headers={}}={}) {
  return new Request(route,{method,headers:{
    ...(origin && {Origin:origin}),
    'Content-Type':'application/json','CF-Connecting-IP':ip,...headers,
  }, body:method==='POST' ? raw ?? JSON.stringify(data) : undefined});
}

function fixture(overrides={}) {
  const calls = [];
  const keys = [];
  const env = {
    ENABLED:'true', ALLOWED_ORIGINS:site + ',' + local + ',http://127.0.0.1:5174',
    AI:{async run(...args) { calls.push(args); return {response:'{"verdicts":[],"followUp":null}'}; }},
    DEMO_LIMITER:{async limit({key}) { keys.push(key); return {success:true}; }},
    ...overrides,
  };
  return {env,calls,keys};
}

function assertCors(res, origin) {
  assert.equal(res.headers.get('Vary'),'Origin');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin);
  if (origin) {
    assert.equal(res.headers.get('Access-Control-Allow-Methods'),'POST, OPTIONS');
    assert.equal(res.headers.get('Access-Control-Allow-Headers'),'Content-Type');
    assert.equal(res.headers.get('Cache-Control'),'no-store');
  } else {
    assert.equal(res.headers.get('Access-Control-Allow-Methods'),null);
    assert.equal(res.headers.get('Access-Control-Allow-Headers'),null);
  }
}

test('rejects unapproved or missing Origin without CORS or inference', async() => {
  const {env,calls,keys} = fixture();
  for (const origin of ['https://judylp.github.io.other.invalid',null]) {
    const res = await worker.fetch(req({origin}),env);
    assert.equal(res.status,403);
    assertCors(res,null);
  }
  assert.deepEqual(calls,[]);
  assert.deepEqual(keys,[]);
});

test('allowed preflight echoes Origin and leaves quota unused, including when disabled', async() => {
  const {env,calls,keys} = fixture({ENABLED:'false'});
  const res = await worker.fetch(req({method:'OPTIONS',origin:local}),env);
  assert.equal(res.status,204);
  assertCors(res,local);
  assert.equal(await res.text(),'');
  assert.deepEqual(calls,[]);
  assert.deepEqual(keys,[]);
});

test('disallowed method returns 405 and enabled switch fails closed on POST', async() => {
  const {env,calls} = fixture({ENABLED:'TRUE'});
  const get = await worker.fetch(req({method:'GET'}),env);
  assert.equal(get.status,405);
  assert.equal(get.headers.get('Allow'),'POST, OPTIONS');
  assertCors(get,site);
  const post = await worker.fetch(req(),env);
  assert.equal(post.status,503);
  assert.deepEqual(await post.json(),{error:'DISABLED'});
  assertCors(post,site);
  assert.deepEqual(calls,[]);
});

test('enforces 32 KiB UTF-8 cap with and without Content-Length', async() => {
  const {env,calls} = fixture();
  const data = {messages:[{role:'user',content:'汉'.repeat(11000)}]};
  for (const request of [req({data}),req({headers:{'Content-Length':'40000'}})]) {
    const res = await worker.fetch(request,env);
    assert.equal(res.status,400);
    assertCors(res,site);
  }
  assert.deepEqual(calls,[]);
});

test('rejects malformed JSON, non-JSON, illegal roles, messages and token bounds', async() => {
  const {env,calls} = fixture();
  const requests = [
    req({raw:'{'}), req({headers:{'Content-Type':'text/plain'}}),
    req({data:{messages:[{role:'assistant',content:'bad role'}]}}),
    req({data:{messages:[{role:'user',content:123}]}}),
    req({data:{messages:Array(9).fill(payload.messages[1])}}),
    req({data:{messages:[payload.messages[0]]}}),
    req({data:{...payload,max_tokens:0}}),
    req({data:{...payload,max_completion_tokens:0}}),
  ];
  for (const request of requests) assert.equal((await worker.fetch(request,env)).status,400);
  assert.deepEqual(calls,[]);
});

test('uses server model and JSON mode, caps tokens and appends /no_think to last user message', async() => {
  const model = '@cf/qwen/qwen3.8-27b';
  const {env,calls,keys} = fixture();
  const data = {...payload, model:'untrusted',max_tokens:9999,response_format:{type:'text'},
    stream:true, messages:[...payload.messages,{role:'system',content:'Other.',name:'ignored'}]};
  const res = await worker.fetch(req({data}),env);
  assert.equal(res.status,200);
  assertCors(res,site);
  assert.deepEqual(calls,[[model,{
    max_completion_tokens:700,response_format:{type:'json_object'},reasoning_effort:'low',
    messages:[payload.messages[0],{role:'user',content:'Answer.\n/no_think'},{role:'system',content:'Other.'}],
  }]]);
  assert.deepEqual(keys,[ip]);
  assert.deepEqual(await res.json(),{choices:[{message:{role:'assistant',content:'{"verdicts":[],"followUp":null}'},
    finish_reason:'stop'}],model});
  env.MODEL = '@cf/qwen/other-model';
  await worker.fetch(req({data:{...payload,max_tokens:123}}),env);
  assert.equal(calls[1][0],env.MODEL);
  assert.equal(calls[1][1].max_completion_tokens,123);
  assert.equal(calls[1][1].reasoning_effort,undefined);
});

test('Gemma disables thinking and honors the new token field over the legacy alias', async () => {
  const model = '@cf/google/gemma-4-26b-a4b-it';
  const {env,calls} = fixture({MODEL:model});
  const res = await worker.fetch(req({data:{...payload,max_tokens:900,max_completion_tokens:200}}),env);
  assert.equal(res.status,200);
  assert.deepEqual(calls,[[model,{messages:payload.messages,max_completion_tokens:200,
    response_format:{type:'json_object'},chat_template_kwargs:{enable_thinking:false}}]]);
  const completion = await res.json();
  assert.equal(completion.model,model);
  assert.equal(completion.choices[0].message.content,'{"verdicts":[],"followUp":null}',
    'Gemma JSON without think tags should pass through');
});

test('preserves upstream token usage in successful responses', async () => {
  const usage = {prompt_tokens:41,completion_tokens:23,total_tokens:64,
    completion_tokens_details:{reasoning_tokens:4}};
  for (const output of [
    {response:'{"ok":true}'},
    {choices:[{message:{content:'{"ok":true}'}}]},
  ]) {
    const {env} = fixture({AI:{run:async()=>({...output,usage})}});
    const res = await worker.fetch(req(),env);
    assert.equal(res.status,200);
    assert.deepEqual((await res.json()).usage,usage);
  }
});

for (const [name,result] of [
  ['response string',{response:'<think>hidden\nreasoning</think> {"ok":true} <think>extra</think>'}],
  ['response object',{response:{ok:true}}],
  ['choices',{choices:[{message:{content:'<think>hidden</think>{"ok":true}',reasoning_content:'hidden'}}]}],
]) {
  test('normalizes '+name+' into evidence-only OpenAI content', async() => {
    const {env} = fixture({AI:{run:async()=>result},MODEL:'override'});
    const res = await worker.fetch(req(),env);
    assert.equal(res.status,200);
    assert.deepEqual(await res.json(),{model:'override',choices:[{
      message:{role:'assistant',content:'{"ok":true}'},finish_reason:'stop',
    }]});
  });
}

test('extracts the first fenced JSON object in final content without changing quoted evidence', async() => {
  const json = {verdicts:[{quote:'A literal } then "quotes", \\ and <think>markup</think>'}],followUp:null};
  const content = '<think>{"ignored":true}</think> Intro { aside: \n'
    + '```json\n' + JSON.stringify(json) + '\n``` Trailing text. {"second":true}';
  const {env} = fixture({AI:{run:async()=>({choices:[{message:{
    content, reasoning_content:'{"internal":true}',
  }}]})}});
  const res = await worker.fetch(req(),env);
  assert.equal(res.status,200);
  const msg = (await res.json()).choices[0].message;
  assert.deepEqual(msg,{role:'assistant',content:JSON.stringify(json)});
});

test('a truncated outer object or reasoning-only response stays 502', async() => {
  for (const result of [
    {response:'```json\n{"verdicts":[{"pointId":"c1"}'},
    {response:'<think>{"private":true}'},
    {choices:[{message:{content:null,reasoning_content:'{"ok":true}'}}],response:'{"ok":true}'},
  ]) {
    const {env} = fixture({AI:{run:async()=>result}});
    const res = await worker.fetch(req(),env);
    assert.equal(res.status,502);
    assert.deepEqual(await res.json(),{error:'INVALID_UPSTREAM_JSON'});
  }
});

test('non-JSON upstream output returns bare 502 code', async() => {
  const {env} = fixture({AI:{run:async()=>({response:'<think>secret</think>not json'})}});
  const res = await worker.fetch(req(),env);
  assert.equal(res.status,502);
  assertCors(res,site);
  assert.deepEqual(await res.json(),{error:'INVALID_UPSTREAM_JSON'});
});

test('maps actual and inferred quota codes to 429, and other upstream errors to 503', async() => {
  for (const [thrown,status,error] of [
    [Object.assign(Error('details'),{code:3036}),429,'UPSTREAM_LIMITED'],
    [Error('InferenceUpstreamError: 3040: private details'),429,'UPSTREAM_LIMITED'],
    [Error('private details'),503,'UPSTREAM_UNAVAILABLE'],
  ]) {
    const {env} = fixture({AI:{run:async()=>{throw thrown;}}});
    const res = await worker.fetch(req(),env);
    assert.equal(res.status,status);
    assertCors(res,site);
    assert.deepEqual(await res.json(),{error});
  }
});

test('only logs response status and elapsed milliseconds', async t => {
  const log = t.mock.method(console,'log',()=>{});
  const {env} = fixture({AI:{run:async()=>{throw Error('private upstream details');}}});
  await worker.fetch(req(),env);
  const summary = JSON.parse(log.mock.calls[0].arguments[0]);
  assert.deepEqual(Object.keys(summary).sort(),['durationMs','status']);
  assert.equal(summary.status,503);
  assert.equal(typeof summary.durationMs,'number');
});

test('binding denials stop the AI call and a missing binding fails closed by default', async() => {
  const {env,calls} = fixture({DEMO_LIMITER:{limit:async()=>({success:false})}});
  assert.equal((await worker.fetch(req(),env)).status,429);
  delete env.DEMO_LIMITER;
  assert.equal((await worker.fetch(req(),env)).status,503);
  assert.deepEqual(calls,[]);
});

test('opt-in isolate memory rate limit allows six posts per IP then rejects', async() => {
  const {env,calls} = fixture({DEMO_LIMITER:undefined,ALLOW_MEMORY_RATE_LIMIT:'true'});
  for (let i=0;i<6;i++) assert.equal((await worker.fetch(req(),env)).status,200);
  assert.equal((await worker.fetch(req(),env)).status,429);
  assert.equal((await worker.fetch(req({headers:{'CF-Connecting-IP':'192.0.2.8'}}),env)).status,200);
  assert.equal(calls.length,7);
});

for (const [setting,ms] of [[undefined,30000],['4500',4500],['invalid',30000]]) {
  test('slow inference gets a 503 at the deadline for DEADLINE_MS='+setting, async t => {
    t.mock.timers.enable({apis:['setTimeout']});
    const timeout = t.mock.method(globalThis,'setTimeout',globalThis.setTimeout);
    let started;
    const began = new Promise(resolve => {started = resolve;});
    const {env} = fixture({DEADLINE_MS:setting,AI:{run:()=>{started();return new Promise(()=>{});}}});
    const pending = worker.fetch(req(),env);
    await began;
    assert.equal(timeout.mock.calls[0].arguments[1],ms);
    t.mock.timers.tick(ms);
    const res = await pending;
    assert.equal(res.status,503);
    assertCors(res,site);
    assert.deepEqual(await res.json(),{error:'UPSTREAM_TIMEOUT'});
  });
}
