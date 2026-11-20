# Unscripted

**AI can write your code. Can you explain it?**

English | [中文](README.zh-CN.md)

Unscripted is a browser-based trainer for explaining code you did not write yourself. You explain a concept in your own words, compare your answer with reference points, and an AI judge (optional) suggests which points you covered. You stay in charge: nothing is recorded until you confirm.

- Live site: https://judylp.github.io/stem/?lang=en
- No account or API key needed for offline practice, the simulated Judge Demo, or hosted AI judging.

## How it works

Every reference point is a signal light: green means you explained it, amber means partly, red means missed, and dark grey means not answered yet. Each light also carries a shape (✓ / ! / ✗), so it does not rely on color alone.

The practice loop: read the question → explain it in your own words → submit and compare with the reference points → set or confirm a light per point → confirm the level → retry with a different wording → review the heat matrix and timeline → export a Markdown review sheet.

Each question has three levels: **Explain**, **Reason**, and **Stress-test**.

## Features

- **AI judging.** For each reference point, the model proposes a light, a short reason, and a verbatim quote from your answer, plus one targeted follow-up question. The page checks that every quote really appears in your answer; a green without a valid quote is downgraded to amber. The verdict is a suggestion until you confirm it.
- **Three ways to judge:**
  - **Hosted demo** — keyless, through a Cloudflare Worker running the open-weight GPT-OSS 120B on Workers AI.
  - **Bring your own key** — DeepSeek, or a custom OpenAI-compatible proxy. The key is kept only in page memory.
  - **Judge Demo** — preset simulated responses, always labeled *Simulated*. If the hosted demo is unavailable or out of daily quota, the page suggests this mode or your own key.
- **Two built-in question packs:** Core Software Engineering (Java `volatile` and atomicity, Redis key expiration, MySQL consistent reads) and Python Starter (floating-point equality). Four questions, three levels each.
- **Self-rating rules:** all green → Pass; any red → red; otherwise amber. Only an all-green level is a Pass.
- **Progress view:** a question × level heat matrix and a reverse-chronological timeline showing which points you missed and how a level changed over time.
- **Review sheet export:** UTF-8 Markdown with lights and missed points.
- **Opt-in answer saving:** off by default. When on, you can compare your first and latest answer for a level; turning it off deletes saved answers.
- **Bilingual UI:** English and Chinese, chosen by `?lang=`, saved preference, or browser language.
- **Accessibility:** lights are keyboard-operable buttons (Space/Enter to cycle, 1/2/3 to set), with ARIA labels and live announcements; motion respects `prefers-reduced-motion`.

## Hosted demo safeguards

The Worker forces the model server-side, accepts requests only from the site's origin, rate-limits each IP to 6 requests per minute, and stores no answers. It runs on Cloudflare's free daily quota (about 160 judgments a day at current usage, estimated); when the quota runs out it returns 429 and the page offers Judge Demo instead. See the [Worker guide](worker/README.md).

## Model choice and regression

We compared three models on Workers AI against preset lights for all 12 levels (38 reference points):

- Qwen3.8 27B: too slow, timed out.
- Gemma 4 26B: fast with reasoning off, but too lenient (7 amber points judged green).
- **GPT-OSS 120B (low reasoning): chosen.** On 2026-11-20, 12/12 requests succeeded in about 9–21 seconds, with 68.4% agreement with the presets and 1 preset-amber point judged green.

The presets are comparison fixtures, not an accuracy benchmark, and the sample is small. Full results: [hosted regression report](docs/HOSTED_REGRESSION.md).

## Run locally (Windows PowerShell)

```powershell
npm ci
npm run build:pack-runtime
python -m http.server 5174 --bind 127.0.0.1
```

Open http://127.0.0.1:5174/ (practice is at `#practice`). Open the site over HTTP, not from the file system. GitHub Pages builds the pack runtime automatically on deploy.

## Tests

Node 24, built-in test runner. Dev-only dependencies: Ajv 8.20.0, jsonc-parser 3.3.1, canonicalize 5.1.0, esbuild 0.28.2. The browser loads no runtime dependencies or CDN code.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check:syntax
```

261 automated tests cover the question-pack schema and semantic checks, bilingual alignment, AI verdict parsing and quote checks, the hosted Worker (origin allowlist, rate limit, timeout, JSON recovery), storage fallback, light aggregation, history trimming, answer-saving privacy, legacy progress compatibility, and export. Browser QA notes: [docs/QA_REPORT.md](docs/QA_REPORT.md).

## Data and privacy

Answers live in page memory and are cleared on refresh, unless you turn on answer saving. localStorage keys:

- `unscripted.progress.v1` — latest self-rating (pass/review) per question and level.
- `unscripted.history.v1` — each confirmed verdict (lights and missed points), up to 200 entries per pack; the answer text is included only when answer saving is on.
- `unscripted.language` — language preference.
- `unscripted.questionPack` — the last selected question pack.

Records stay in this browser and origin. AI judging sends your answer, the question, and the reference points to the service you choose; the hosted proxy does not store them. Offline practice and Judge Demo run entirely in the browser.

## Architecture

- `index.html`, `styles.css` — page structure, signal-light tokens, motion.
- `data/packs/` — versioned, bilingual question packs.
- `src/packs/` — pack validation (safe JSON parsing, Ajv JSON Schema, semantic checks), registry, JCS content digest.
- `src/ai/` — providers (hosted / DeepSeek / custom proxy), judging prompt and verdict validation, Judge Demo scenarios.
- `src/main.js` — practice flow, judging, heat matrix, timeline.
- `src/lights.js`, `src/dotfield.js`, `src/fx/` — lights, animated dot-field background, verdict effects.
- `src/history.js`, `src/storage.js`, `src/export.js`, `src/i18n.js` — records, storage fallback, export, translations.
- `worker/` — Cloudflare Worker proxy for the hosted demo.
- `tools/` — pack runtime build, syntax check, hosted regression script.
- `tests/` — Node tests.

Pack format: [schema spec](docs/architecture/QUESTION_PACK_SCHEMA_V1.md). A storage migration module (Stage 2C) is implemented and tested but not yet wired into the page.

## Limitations

- Questions were checked against official documentation but still await the author's final review ([docs/QUESTION_REVIEW.md](docs/QUESTION_REVIEW.md)).
- We have not measured learning gains or validated the tool as a measure of mastery.
- AI verdicts can be wrong; that is why the learner confirms every one.

## AI-assisted development

Codex and other AI coding agents helped with implementation, debugging, and tests under the author's direction. The author chose the product direction, reviewed the changes, and is responsible for the content.
