const DEFAULT_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TOKENS = 1600;
const RATE_LIMIT = 6;
const MEMORY_KEY_LIMIT = 2048;
const memoryCounts = new Map();
let memoryMinute;

function response(origin, status, body, headers = {}) {
  const cors = origin ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } : {};
  const options = {status, headers:{'Vary':'Origin', 'Cache-Control':'no-store', ...cors, ...headers}};
  return body === null ? new Response(null, options) : Response.json(body, options);
}

async function readPayload(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '') ||
      !request.body || Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw Error('BAD_REQUEST');
  const reader = request.body.getReader();
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  let size = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      if (size + value.byteLength > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw Error('BAD_REQUEST');
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const payload = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes.subarray(0,size)));
  const {messages, max_tokens = MAX_TOKENS} = payload ?? {};
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 8 ||
      !messages.every(message => (message?.role === 'system' || message?.role === 'user') &&
        typeof message.content === 'string') || !messages.some(message => message.role === 'user') ||
      !Number.isInteger(max_tokens) || max_tokens < 1) throw Error('BAD_REQUEST');
  return {messages:messages.map(({role,content}) => ({role,content})), max_tokens:Math.min(max_tokens,MAX_TOKENS)};
}

async function withinLimit(env, ip) {
  if (!ip) throw Error('RATE_LIMIT_IDENTITY');
  if (env.DEMO_LIMITER) return (await env.DEMO_LIMITER.limit({key:ip})).success === true;
  if (env.ALLOW_MEMORY_RATE_LIMIT !== 'true') throw Error('RATE_LIMIT_UNAVAILABLE');
  const minute = Math.floor(Date.now() / 60000);
  if (minute !== memoryMinute) {
    memoryCounts.clear();
    memoryMinute = minute;
  }
  const count = memoryCounts.get(ip);
  if (count === undefined && memoryCounts.size >= MEMORY_KEY_LIMIT) return false;
  if (count >= RATE_LIMIT) return false;
  memoryCounts.set(ip, (count ?? 0) + 1);
  return true;
}

async function runWithDeadline(env, model, input) {
  let timeout;
  try {
    const expired = new Promise((_, reject) => {
      timeout = setTimeout(() => reject(Error('UPSTREAM_TIMEOUT')), 18000);
    });
    return await Promise.race([env.AI.run(model, input), expired]);
  } finally {
    clearTimeout(timeout);
  }
}

function isQuotaError(error) {
  return [error?.status, error?.statusCode, error?.code, error?.cause?.code]
    .some(code => [429,3036,3040].includes(Number(code))) ||
    /\b(?:429|3036|3040|quota|rate[ -]limit|daily free allocation|account limited|out of capacity|too many requests)\b/i
      .test(String(error?.message ?? error));
}

function jsonContent(result) {
  const content = result?.choices?.[0]?.message?.content ?? result?.response;
  const value = typeof content === 'string'
    ? JSON.parse(content.replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>/gi, '').trim())
    : content;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('INVALID_UPSTREAM_JSON');
  return JSON.stringify(value);
}

async function handle(request, env, origin) {
  if (!origin) return response(null, 403, {error:'ORIGIN_DENIED'});
  if (request.method === 'OPTIONS') return response(origin, 204, null);
  if (request.method !== 'POST') return response(origin, 405, {error:'METHOD_NOT_ALLOWED'}, {Allow:'POST, OPTIONS'});
  if (env.ENABLED !== 'true') return response(origin, 503, {error:'DISABLED'});

  let input;
  try {
    input = await readPayload(request);
  } catch {
    return response(origin, 400, {error:'BAD_REQUEST'});
  }
  const allowed = await withinLimit(env, request.headers.get('CF-Connecting-IP')).catch(() => null);
  if (allowed === null) return response(origin, 503, {error:'RATE_LIMIT_UNAVAILABLE'});
  if (!allowed) return response(origin, 429, {error:'RATE_LIMITED'});

  const model = env.MODEL?.trim() || DEFAULT_MODEL;
  if (model.startsWith('@cf/qwen/qwen3')) {
    const last = input.messages.findLast(message => message.role === 'user');
    last.content += '\n/no_think';
  }
  const inference = {...input, response_format:{type:'json_object'}};
  if (model === '@cf/qwen/qwen3.8-27b') inference.reasoning_effort = 'low';
  let result;
  try {
    result = await runWithDeadline(env, model, inference);
  } catch (error) {
    if (isQuotaError(error)) return response(origin, 429, {error:'UPSTREAM_LIMITED'});
    return response(origin, 503, {error:error?.message === 'UPSTREAM_TIMEOUT' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE'});
  }
  try {
    const content = jsonContent(result);
    return response(origin, 200, {choices:[{message:{role:'assistant',content},finish_reason:'stop'}], model});
  } catch {
    return response(origin, 502, {error:'INVALID_UPSTREAM_JSON'});
  }
}

export default {
  async fetch(request, env) {
    const start = performance.now();
    const origins = (env.ALLOWED_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
    const requestedOrigin = request.headers.get('Origin');
    const origin = origins.includes(requestedOrigin) ? requestedOrigin : null;
    const result = await handle(request, env, origin).catch(() => response(origin,503,{error:'UNAVAILABLE'}));
    console.log(JSON.stringify({status:result.status,durationMs:Math.round(performance.now()-start)}));
    return result;
  },
};
