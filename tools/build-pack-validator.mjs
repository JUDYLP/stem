import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { build } from 'esbuild';
import { packAjvOptions } from '../src/packs/ajv-options.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildPackValidator() {
  const outdir = join(root, 'work/pack-validator');
  await mkdir(outdir, { recursive: true });
  const source = await readFile(join(root, 'docs/architecture/question-pack.schema.v1.json'));
  const schema = JSON.parse(source);
  const ajv = new Ajv2020(packAjvOptions());
  const structure = standaloneCode(ajv, ajv.compile(schema));
  await writeFile(join(outdir, 'structure.mjs'), structure);
  const entry = `import validate from './structure.mjs';
import {createPackValidator} from '../../src/packs/core.js';
export {comparePackVersions} from '../../src/packs/core.js';
export const {validateQuestionPackText,validateQuestionPackBytes}=createPackValidator(validate);`;
  await writeFile(join(outdir, 'entry.mjs'), entry);
  const outfile = join(outdir, 'pack-validator.mjs');
  const result = await build({
    absWorkingDir: root, entryPoints: [join(outdir, 'entry.mjs')], outfile,
    bundle: true, platform: 'browser', format: 'esm', target: 'es2022',
    metafile: true, write: false, legalComments: 'inline', logLevel: 'silent',
  });
  for (const output of Object.values(result.metafile.outputs)) {
    if (output.imports.length) throw new Error('Browser bundle has unresolved imports');
  }
  // Ajv compiler must never be part of the runtime artifact (small runtime helpers are fine).
  if (Object.keys(result.metafile.inputs).some(p => /ajv\/dist\/(?:compile|core|2020)/.test(p))) {
    throw new Error('Ajv compiler leaked into browser output');
  }
  const code = result.outputFiles[0].text;
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(code)) throw new Error('Dynamic code evaluation in bundle');
  await writeFile(outfile, code);
  await writeFile(join(outdir, 'metafile.json'), JSON.stringify(result.metafile, null, 2));
  await writeFile(join(outdir, 'build-info.json'), JSON.stringify({
    schemaPath: 'docs/architecture/question-pack.schema.v1.json',
    schemaSha256: createHash('sha256').update(source).digest('hex'),
    bundleSha256: createHash('sha256').update(code).digest('hex'),
    bytes: Buffer.byteLength(code),
  }, null, 2));
  return outfile;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(`Built browser ESM: ${await buildPackValidator()}`);
}
