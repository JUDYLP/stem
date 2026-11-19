import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
test('packager ships HTML entries and every browser module dependency, including dynamic imports', async () => {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const files = new Set(JSON.parse(execFileSync(python, ['-c',
    'from tools.package_site import FILES; import json; print(json.dumps(FILES))'], {cwd:root})));
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const sourcePaths = await readdir(path.join(root, 'src'), {recursive:true});
  // Inspect even modules not reachable from the current page; only their dependencies
  // must ship. The npm-based development-only pack registry is not a page entry.
  const inputs = sourcePaths.filter(name => /\.m?js$/.test(name));
  const inspect = async (contents, dir, fullGraph) => {
    const imports = new Set();
    await build({stdin:{contents,resolveDir:dir}, bundle:true, write:false, format:'esm',
      logLevel:'silent', logOverride:{'unsupported-dynamic-import':'error'},
      plugins:[{name:'check-local-imports',setup(builder) {
        builder.onResolve({filter:/.*/}, args => {
          if (!fullGraph && args.kind !== 'dynamic-import') return {path:args.path,external:true};
          assert.match(args.path,/^\.{1,2}\//, 'Browser module must use a local path: '+args.path);
          const name = path.relative(root,path.resolve(args.resolveDir,args.path)).split(path.sep).join('/');
          imports.add(name);
          // The clean-checkout test verifies this allowance before CI builds the runtime.
          if (name === 'work/pack-runtime.mjs') return {path:args.path,external:true};
          return fullGraph ? undefined : {path:args.path,external:true};
        });
      }}]});
    for (const name of imports) assert.ok(files.has(name),'Missing from FILES: '+name);
  };
  for (const [,attrs,inline] of scripts) {
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) {
      await inspect('import '+JSON.stringify(src),root,true);
    } else if (inline.trim()) await inspect(inline,root,true);
  }
  for (const name of inputs) {
    const file = path.join(root,'src',name);
    await inspect(await readFile(file,'utf8'),path.dirname(file),false);
  }
  assert.ok(files.has('data/packs/unscripted-intro.v1.json'));
  assert.ok(files.has('work/pack-runtime.mjs'));
  assert.ok(files.has('assets/fonts/doto-latin-wght-normal.woff2'));
});
