# Python Starter Pack integration

Base commit `0c7d6ef476ae82205a889e9640fce546dd2e0d38`. Branch `feat/intro-pack`.

## What changed

| Files | Change |
| --- | --- |
| `src/packs/registry.js` | `registerBuiltins()` registers Core and Intro with the existing schema, semantic validation and content digest. It guards global question ID uniqueness. `registerBuiltin()` still returns Core. |
| `src/questions.js`, `src/main.js`, `index.html`, `src/i18n.js` | Adapt validated Pack contents for the existing training UI. Show the bilingual selector, Pack title and version, and active review status. Category filtering, random selection and the three levels use the selected Pack. A switch remembers the previous selection and draft in page memory and cancels any pending verdict. |
| `src/ai/judge.js` | Build context from the active validated Pack. Verify the displayed title, layer, prompt, rubric text, and ordered rubric IDs. A request contains the current layer and learner answer. Existing Core evidence guards apply unchanged. |
| `src/history.js`, `src/history-rubric.js`, `src/export.js`, `src/storage/migration.js` | Scope the records view and Crash Sheet to the active Pack. New Intro ratings use the original v1 keys and carry the Pack version plus bilingual rubric snapshot. Apply the 200-entry retention cap separately per Pack so a new Intro rating cannot evict a Core rating. The dormant v1 archive reader recognizes that cap. Opening or switching Packs does not run migration or change stored records. |
| `tools/package_site.py`, `.github/workflows/pages.yml`, `README.md` | Include both current Packs, the frozen Core history Pack, and the generated browser runtime. Pages builds before packaging and verifies the live Intro JSON and runtime with HTTP 200 and a byte comparison after deployment. Local startup instructions now include the build step. |
| `tests/intro-pack.test.mjs`, `tests/browser/ai2.html`, `tests/site-assets.test.mjs` | Add runtime, UI, transport, history and packaging regression cases. |

The shipped Core and Intro data, their four `unreviewed` statuses, and the 12 demo scenarios retain the baseline contents.

## Actual Pack loading

| Pack | Version | Questions and layers | Canonical content digest |
| --- | --- | --- | --- |
| Core Software Engineering | 1.0.1 | Java/JUC, Redis and MySQL · 9 layers | `sha256:990efaf4a9417bd90327f544f85400081dfca0dfcb624a37b51a081660049c43` |
| Python Starter Pack | 1.0.0 | Python floating-point equality · 3 layers | `sha256:1c0477df67b9a2a95d859c7cb0373a2802d10217c1d7c5e35f9aecad4fdd3ab8` |

Both registered in the generated browser ESM with string code generation disabled. Chrome loaded the same runtime over HTTP from the packaged site.

## Test results

| Check | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm test` | PASS · 234/234, including six new integration unit tests. |
| `npm run check:syntax` | PASS · 47 JavaScript files. |
| `npm run build:pack-validator` and `npm run build:pack-runtime` | PASS |
| `python tools/package_site.py work/intro-integration-final` | PASS · 24 assets. Both current Pack JSON files, the archived Core JSON, and the runtime matched their inputs byte for byte. |
| Packaged Chrome AI2 · Core → Intro → Core | PASS · Core starts with three questions. Intro shows Python in all three levels, bilingual title and prompts, active category and random selection. Core returns to its draft and its own history. |
| Python Judge Demo | PASS · L1, L2 and L3 match the existing presets and display SIMULATED RESULT. Zero provider calls and no changes to v1 progress/history. |
| Python Mock Live AI | PASS · All three requests use Intro 1.0.0 and the exact active rubric IDs. Core IDs stay out of the prompt. Switching Packs aborts the outstanding request. |
| v1 history, progress and exported review sheet | PASS · Existing Core v1 entries survive switching and saving an Intro result. A full 200-entry Core journal survives Intro insertion and reload. Intro's Crash Sheet includes its rubric snapshot and version. |
| Real model requests | **NOT RUN**. Mock transport used. |
| GitHub Pages deployment and post-deployment HTTP/byte checks | **NOT RUN**. The PR is pending review. |

## Published resource allowlist

- Page and style · `index.html`, `styles.css`.
- Runtime and Packs · `work/pack-runtime.mjs`, `data/packs/unscripted-core.v1.json`, `data/packs/unscripted-core.v1.0.0.json`, `data/packs/unscripted-intro.v1.json`.
- Question and demo data · `data/questions.json`, `data/hero-demo.v1.json`, `src/ai/demo-scenarios.json`.
- Judging · `src/ai/demo-scenario.js`, `src/ai/provider.js`, `src/ai/judge.js`.
- Training, storage, language and visual modules · `src/main.js`, `src/questions.js`, `src/storage.js`, `src/export.js`, `src/demo.js`, `src/i18n.js`, `src/lights.js`, `src/history.js`, `src/history-rubric.js`, `src/dotfield.js`, `src/fx/verdict-fx.js`.
- Font · `assets/fonts/doto-latin-wght-normal.woff2`.

After review, the Pages workflow will check the exact public URLs for the Intro JSON and generated runtime.
