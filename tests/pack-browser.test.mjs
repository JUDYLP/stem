import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { buildPackValidator } from '../tools/build-pack-validator.mjs';
import * as nodeApi from '../src/packs/validate.js';
const output = await buildPackValidator();
const browserApi = await import(pathToFileURL(output));
const example = await readFile(new URL('../docs/architecture/question-pack.example.v1.json', import.meta.url), 'utf8');
const modified = fn => { const p=JSON.parse(example); fn(p); return JSON.stringify(p); };
const cases = [
  ['valid pack', example], ['invalid schema', '{}'],
  ['nested duplicate', '{"a":{"b":1,"b":2}}'],
  ['escaped duplicate', '{"a":1,"\u0061":2}'.replace('"a":2','"\\u0061":2')],
  ['dangerous key', '{"a":{"__proto__":{"polluted":true}}}'],
  ['escaped dangerous', '{"\\u0063onstructor":{}}'],
  ['oversize', ' '.repeat(1048577)],
  ['depth', '['.repeat(33)+'0'+']'.repeat(33)],
  ['missing translation', modified(p => { delete p.questions[0].layers[0].prompt.en; })],
  ['duplicate rubric', modified(p => { p.questions[1].layers[0].rubric[0].rubricId=p.questions[0].layers[0].rubric[0].rubricId; })],
  ['invalid date', modified(p => { p.questions[0].review={status:'reviewed',reviewer:'A',reviewedAt:'2026-02-30T00:00:00Z'}; })],
  ['wrong layer', modified(p => p.questions[0].layers.reverse())],
];
for (const [name,input] of cases) test(`browser ESM parity: ${name}`, () => {
  const expected=nodeApi.validateQuestionPackText(input);
  assert.equal(expected.valid,name==='valid pack');
  assert.deepEqual(browserApi.validateQuestionPackText(input),expected);
});
test('browser bytes and big-integer version parity', () => {
  for (const b of [new TextEncoder().encode(example),new Uint8Array([0xc3,0x28])]) {
    assert.deepEqual(browserApi.validateQuestionPackBytes(b),nodeApi.validateQuestionPackBytes(b));
  }
  assert.equal(browserApi.comparePackVersions('9007199254740993.0.0','9007199254740992.0.0'),1);
});
test('build uses repository schema and shared rules, no external imports or compiler', async () => {
  const base=new URL('../work/pack-validator/',import.meta.url);
  const info=JSON.parse(await readFile(new URL('build-info.json',base)));
  const schema=await readFile(new URL('../docs/architecture/question-pack.schema.v1.json',import.meta.url));
  assert.equal(info.schemaSha256,createHash('sha256').update(schema).digest('hex'));
  const meta=JSON.parse(await readFile(new URL('metafile.json',base)));
  for(const item of Object.values(meta.outputs)) assert.deepEqual(item.imports,[]);
  for(const name of ['core.js','strict-json.js','semantics.js']) assert.ok(Object.keys(meta.inputs).some(p=>p.endsWith('/'+name)));
  assert.ok(!Object.keys(meta.inputs).some(p=>/ajv\/dist\/(compile|core|2020)/.test(p)));
});
test('browser artifact imports and validates with string code generation disabled', () => {
  const script=`const api=await import(${JSON.stringify(pathToFileURL(output).href)}); const p=${JSON.stringify(example)}; if(!api.validateQuestionPackText(p).valid)process.exit(2);`;
  const result=spawnSync(process.execPath,['--disallow-code-generation-from-strings','--input-type=module','-e',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
