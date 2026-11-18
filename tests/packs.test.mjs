import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateQuestionPackText as validate, validateQuestionPackBytes as bytes, comparePackVersions as compare } from '../src/packs/validate.js';
import { parseStrictJson, MAX_BYTES } from '../src/packs/strict-json.js';
const example = readFileSync(new URL('../docs/architecture/question-pack.example.v1.json', import.meta.url), 'utf8');
const fixture = () => JSON.parse(example);
function rejected(result, code) {
  assert.equal(result.valid, false);
  assert.ok(!Object.hasOwn(result, 'pack'));
  assert.ok(result.errors.length > 0 && result.errors.length <= 50);
  for (const error of result.errors) {
    assert.equal(typeof error.code, 'string');
    assert.ok(error.path.startsWith('$'));
    assert.equal(typeof error.message, 'string');
  }
  if (code) assert.ok(result.errors.some(e => e.code === code), JSON.stringify(result.errors));
}
function changed(mutate) { const p = fixture(); mutate(p); return validate(JSON.stringify(p)); }
function manyQuestions(count) {
  const p = fixture();
  p.questions = Array.from({ length: count }, (_, i) => {
    const q = structuredClone(p.questions[0]);
    q.id = `q-${i}`;
    q.title = q.category = { en: 'Example', 'zh-CN': '示例' };
    q.layers.forEach((l, li) => {
      l.prompt = { en: 'Explain', 'zh-CN': '解释' };
      l.rubric = [{ rubricId: `q-${i}-l${li}`, criterion: { en: 'Evidence', 'zh-CN': '证据' } }];
    });
    return q;
  });
  return p;
}

test('pack example passes text and bytes with 3 questions, 9 layers and 29 criteria', () => {
  const a = validate(example), b = bytes(new TextEncoder().encode(example));
  assert.equal(a.valid, true); assert.deepEqual(a, b);
  assert.equal(a.pack.questions.length, 3);
  assert.equal(a.pack.questions.flatMap(q => q.layers).length, 9);
  assert.equal(a.pack.questions.flatMap(q => q.layers.flatMap(l => l.rubric)).length, 29);
});
test('example conversion preserves all three legacy bilingual questions', () => {
  const old = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
  const pack = validate(example).pack;
  for (const [i, q] of old.entries()) {
    const current = pack.questions[i];
    assert.equal(current.id, q.id);
    assert.deepEqual(current.title, { 'zh-CN': q.title, en: q.title_en });
    q.layers.forEach((l, j) => {
      assert.deepEqual(current.layers[j].prompt, { 'zh-CN': l.prompt, en: l.prompt_en });
      assert.deepEqual(current.layers[j].rubric.map(r => r.criterion['zh-CN']), l.rubric);
      assert.deepEqual(current.layers[j].rubric.map(r => r.criterion.en), l.rubric_en);
    });
  }
});
for (const [name, mutate, code] of [
  ['missing required', p => { delete p.packId; }, 'SCHEMA_REQUIRED'],
  ['schema version', p => { p.schemaVersion = 2; }, 'UNSUPPORTED_SCHEMA_VERSION'],
  ['schema version string', p => { p.schemaVersion = '1'; }, 'UNSUPPORTED_SCHEMA_VERSION'],
  ['empty questions', p => { p.questions = []; }, 'SCHEMA_MINITEMS'],
  ['missing layer', p => { p.questions[0].layers.pop(); }, 'SCHEMA_MINITEMS'],
  ['extra layer', p => { p.questions[0].layers.push(p.questions[0].layers[0]); }, 'SCHEMA_MAXITEMS'],
  ['layer order', p => { p.questions[0].layers.reverse(); }, 'SCHEMA_CONST'],
  ['layer label', p => { p.questions[0].layers[0].label = 'Reason'; }, 'SCHEMA_CONST'],
  ['missing rubric', p => { delete p.questions[0].layers[0].rubric; }, 'SCHEMA_REQUIRED'],
  ['empty rubric', p => { p.questions[0].layers[0].rubric = []; }, 'SCHEMA_MINITEMS'],
  ['too many rubric', p => { p.questions[0].layers[0].rubric = Array(13).fill(p.questions[0].layers[0].rubric[0]); }, 'SCHEMA_MAXITEMS'],
  ['duplicate language', p => { p.supportedLanguages.push('en'); }, 'SCHEMA_UNIQUEITEMS'],
  ['wrong type', p => { p.title = 'title'; }, 'SCHEMA_TYPE'],
  ['review metadata absent', p => { p.questions[0].review.status = 'reviewed'; }, 'SCHEMA_REQUIRED'],
  ['unreviewed metadata present', p => { p.questions[0].review.reviewer = 'A'; }, 'SCHEMA_NOT'],
  ['blank criterion', p => { p.questions[0].layers[0].rubric[0].criterion.en = '\u3000\t'; }, 'SCHEMA_PATTERN'],
  ['overlong prompt', p => { p.questions[0].layers[0].prompt.en = 'x'.repeat(12001); }, 'SCHEMA_MAXLENGTH'],
  ['version newline', p => { p.packVersion = '1.0.0\n'; }, 'SCHEMA_PATTERN'],
  ['id newline', p => { p.packId = 'a\n'; }, 'SCHEMA_PATTERN'],
]) test(`structure rejects ${name}`, () => rejected(changed(mutate), code));
for (const [name, select] of [
  ['pack', p => p], ['question', p => p.questions[0]], ['review', p => p.questions[0].review],
  ['layer', p => p.questions[0].layers[0]], ['rubric', p => p.questions[0].layers[0].rubric[0]],
]) test(`unknown field rejected inside ${name}`, () => rejected(changed(p => { select(p).extra = true; }), 'UNKNOWN_FIELD'));
for (const [name, mutate, code] of [
  ['question duplicate', p => { p.questions[1].id = p.questions[0].id; }, 'DUPLICATE_QUESTION_ID'],
  ['rubric duplicate across questions', p => { p.questions[1].layers[1].rubric[0].rubricId = p.questions[0].layers[0].rubric[0].rubricId; }, 'DUPLICATE_RUBRIC_ID'],
  ['rubric duplicate across layers', p => { p.questions[0].layers[1].rubric[0].rubricId = p.questions[0].layers[0].rubric[0].rubricId; }, 'DUPLICATE_RUBRIC_ID'],
  ['default language', p => { p.defaultLanguage = 'fr'; }, 'DEFAULT_LANGUAGE'],
  ['missing title language', p => { delete p.title.en; }, 'MISSING_TRANSLATION'],
  ['undeclared language', p => { p.questions[0].layers[0].rubric[0].criterion.fr = 'Bonjour'; }, 'UNDECLARED_LANGUAGE'],
]) test(`semantics rejects ${name}`, () => rejected(changed(mutate), code));
for (const [name, select] of [
  ['description', p => p.description], ['category', p => p.questions[0].category],
  ['question title', p => p.questions[0].title], ['prompt', p => p.questions[0].layers[0].prompt],
  ['criterion', p => p.questions[0].layers[0].rubric[0].criterion],
]) test(`missing translation at ${name}`, () => rejected(changed(p => { delete select(p).en; }), 'MISSING_TRANSLATION'));
for (const date of ['2025-02-29T12:00:00Z', '2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-00-01T00:00:00Z', '2026-01-00T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:60:00Z', '2026-01-01T00:00:60Z']) {
  test(`reject nonexistent UTC ${date}`, () => rejected(changed(p => { p.questions[0].review = { status: 'reviewed', reviewer: 'A', reviewedAt: date }; }), 'INVALID_REVIEW_DATE'));
}
test('valid leap day accepted; offsets and fractional seconds rejected by v1 format', () => {
  const run = date => changed(p => { p.questions[0].review = { status: 'reviewed', reviewer: 'A', reviewedAt: date }; });
  assert.equal(run('2024-02-29T23:59:59Z').valid, true);
  rejected(run('2024-02-29T23:59:59+00:00'), 'SCHEMA_PATTERN');
  rejected(run('2024-02-29T23:59:59.000Z'), 'SCHEMA_PATTERN');
});
for (const text of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"a":{"x":1,"x":2}}', '[{"x":1,"x":2}]']) {
  test(`duplicate member detected: ${text}`, () => rejected(validate(text), 'DUPLICATE_JSON_KEY'));
}
test('duplicate member detection happens before ordinary object materialization', () => {
  const original = JSON.parse;
  JSON.parse = () => { throw new Error('Object materialization must not occur'); };
  try { assert.equal(parseStrictJson('{"x":1,"x":2}').error.code, 'DUPLICATE_JSON_KEY'); }
  finally { JSON.parse = original; }
});
test('same member in sibling objects and strings resembling JSON are not duplicate keys', () => {
  assert.deepEqual(parseStrictJson('{"a":{"x":1},"b":{"x":2},"s":"\\\"x\\\":1"}').value,
    { a: { x: 1 }, b: { x: 2 }, s: '"x":1' });
});
for (const key of ['__proto__', 'constructor', 'prototype', '\\u005f_proto__']) {
  test(`dangerous member ${key}`, () => {
    rejected(validate(`{"nested":{"${key}":{"polluted":true}}}`), 'DANGEROUS_KEY');
    assert.equal({}.polluted, undefined);
  });
}
for (const text of ['', '{', '{"x":1,}', '{/*c*/"x":1}', '{"x":01}', '{"x":NaN}', 'true false', '\ufeff{}', '{"x":"\n"}']) {
  test(`invalid JSON rejected ${JSON.stringify(text)}`, () => rejected(validate(text), 'INVALID_JSON'));
}
test('UTF-8 is fatal, byte subviews respected, raw/escaped lone surrogates rejected', () => {
  rejected(bytes(new Uint8Array([0xc3, 0x28])), 'INVALID_UTF8');
  rejected(bytes(new Uint8Array([0xed, 0xa0, 0x80])), 'INVALID_UTF8');
  const encoded = new TextEncoder().encode(example);
  const buffer = new Uint8Array(encoded.length + 2); buffer.set(encoded, 1);
  assert.equal(bytes(buffer.subarray(1, -1)).valid, true);
  rejected(validate('"\ud800"'), 'INVALID_UNICODE');
  rejected(validate('"\\ud800"'), 'INVALID_UNICODE');
  rejected(validate('{"x":1e400}'), 'NON_FINITE_NUMBER');
});
test('1 MiB exactly passes, one byte over fails for text and byte APIs', () => {
  const compact = JSON.stringify(fixture());
  const text = compact + ' '.repeat(MAX_BYTES - Buffer.byteLength(compact));
  assert.equal(validate(text).valid, true);
  assert.equal(bytes(Buffer.from(text)).valid, true);
  rejected(validate(text + ' '), 'MAX_BYTES');
  rejected(bytes(Buffer.from(text + ' ')), 'MAX_BYTES');
  rejected(validate('汉'.repeat(Math.floor(MAX_BYTES / 3) + 1)), 'MAX_BYTES');
});
test('depth counts containers: 32 passes ingress, 33 rejected before schema', () => {
  const text = n => '['.repeat(n) + '0' + ']'.repeat(n);
  assert.ok(parseStrictJson(text(32)).value);
  rejected(validate(text(32)), 'SCHEMA_TYPE'); // Valid JSON depth, not a valid Pack.
  rejected(validate(text(33)), 'MAX_DEPTH');
  rejected(validate(text(10000)), 'MAX_DEPTH'); // Never recursively parses all 10000.
});
test('exactly 200 questions passes, 201 fails', () => {
  assert.equal(validate(JSON.stringify(manyQuestions(200))).valid, true);
  rejected(validate(JSON.stringify(manyQuestions(201))), 'SCHEMA_MAXITEMS');
});
test('eight complete languages pass; ninth rejected', () => {
  const p = fixture();
  const langs = ['en', 'zh-CN', 'fr', 'de', 'ja', 'es', 'it', 'ko'];
  function fill(v) {
    if (!v || typeof v !== 'object') return;
    if (Object.hasOwn(v, 'en')) for (const l of langs) v[l] ??= 'Translation';
    else Object.values(v).forEach(fill);
  }
  fill(p); p.supportedLanguages = langs;
  assert.equal(validate(JSON.stringify(p)).valid, true);
  p.supportedLanguages = [...langs, 'pt'];
  rejected(validate(JSON.stringify(p)), 'SCHEMA_MAXITEMS');
});
test('over 50 semantic errors return exactly 50 in stable order and no partial pack', () => {
  const p = manyQuestions(60); p.questions.forEach(q => { delete q.title.en; });
  const text = JSON.stringify(p), result = validate(text);
  rejected(result, 'MISSING_TRANSLATION'); assert.equal(result.errors.length, 50);
  assert.deepEqual(validate(text), result);
});
test('HTML remains literal data, input bytes unchanged, output instances independent', () => {
  const p = fixture(), html = '<img src=x onerror="globalThis.pwned=true"><script>alert(1)</script>';
  p.questions[0].layers[0].prompt.en = html;
  const input = Buffer.from(JSON.stringify(p)), saved = Buffer.from(input);
  const a = bytes(input), b = bytes(input);
  assert.equal(a.valid, true); assert.deepEqual(input, saved); assert.deepEqual(a, b);
  assert.equal(a.pack.questions[0].layers[0].prompt.en, html);
  assert.equal(globalThis.pwned, undefined);
  a.pack.title.en = 'Mutated output'; assert.notEqual(a.pack.title.en, b.pack.title.en);
});
test('input types rejected without coercion', () => {
  for (const v of [null, {}, [], 1]) rejected(validate(v), 'INPUT_TYPE');
  for (const v of [null, {}, [], 'text', new ArrayBuffer(4)]) rejected(bytes(v), 'INPUT_TYPE');
});
test('pure validation imports and runs with DOM, storage, network and logs forbidden', () => {
  const moduleUrl = new URL('../src/packs/validate.js', import.meta.url).href;
  const script = `
    const {readFileSync}=await import('node:fs');
    const input=readFileSync(new URL(${JSON.stringify(new URL('../docs/architecture/question-pack.example.v1.json', import.meta.url).href)}), 'utf8');
    for(const name of ['document','window','localStorage','fetch']) Object.defineProperty(globalThis,name,{get(){throw Error(name+' accessed')}});
    for(const name of ['log','warn','error']) console[name]=()=>{throw Error('console output')};
    const {validateQuestionPackText}=await import(${JSON.stringify(moduleUrl)});
    if(!validateQuestionPackText(input).valid) process.exit(2);
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
for (const [a,b,result] of [
  ['1.0.0','1.0.1',-1],['1.1.0','1.0.9',1],['2.0.0','1.99.99',1],['1.0.0','1.0.0',0],
  ['999999999999999999999999.0.0','1000000000000000000000000.0.0',-1],
  ['9007199254740993.0.0','9007199254740992.0.0',1],
  ['1.999999999999999999999999.0','1.999999999999999999999998.9',1],
]) test(`decimal version comparison ${a} / ${b}`, () => assert.equal(compare(a,b),result));
test('invalid versions throw, including leading zeros and suffixes', () => {
  for (const v of ['01.0.0','1.00.0','1.0.01','1.0','v1.0.0','1.0.0-rc.1','1.0.0+build','1.0.0\n','-1.0.0',null]) {
    assert.throws(() => compare(v,'1.0.0'),TypeError);
    assert.throws(() => compare('1.0.0',v),TypeError);
  }
});
test('large version fits schema; comparator also supports longer decimal components without Number', () => {
  assert.equal(changed(p => { p.packVersion='999999999999999999999999.0.0'; }).valid,true);
  assert.equal(compare('9'.repeat(100)+'.0.0','1'+'0'.repeat(100)+'.0.0'),-1);
});
