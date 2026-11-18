import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)
    .flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name))
      : /\.(?:js|mjs)$/.test(entry.name) ? [join(dir, entry.name)] : []);
}
const sources = ['src', 'tests', 'tools'].flatMap(dir => files(join(root, dir)));
for (const file of sources) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(1);
}
console.log(`Syntax checks passed: ${sources.length} JavaScript files`);
