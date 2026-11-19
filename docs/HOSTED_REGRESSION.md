# Hosted proxy regression

Gemma regression status **NOT RUN**. The owner will run the live comparison against `https://unscripted-demo-proxy.judylp.workers.dev`. Running `node tools/hosted-regression.mjs --url <Worker URL>` from the repository root replaces this page with the model comparison, quote and JSON failure counts, timing, and token counts when the model returns usage, for all twelve cases. Use `--out <report.md>` to save a separate report for each model.

Owner-provided baseline with Gemma before the thinking and token-cap changes: 5/12 HTTP 200, 5/12 HTTP 503 timeouts at 30 seconds, and 2/12 HTTP 502 invalid JSON. Successful cases averaged 1,194 completion tokens. The local paired probe could not resolve the Worker host (`EAI_AGAIN`), so the new token usage and effect of disabling thinking await external measurement.
