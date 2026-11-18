import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {buildPackValidator} from './build-pack-validator.mjs';
const validator = await buildPackValidator();
const root = fileURLToPath(new URL('../',import.meta.url));
await build({
  absWorkingDir:root, stdin:{contents:"export * from './src/packs/registry.js'; export * from './src/packs/preview.js';", resolveDir:root},
  bundle:true, platform:'browser', format:'esm', outfile:'work/pack-runtime.mjs',
  plugins:[{name:'standalone-validator',setup(build) {
    build.onResolve({filter:/^\.\/validate\.js$/}, () => ({path:validator}));
  }}],
});
