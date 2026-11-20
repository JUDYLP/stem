# Hosted proxy regression

GPT-OSS 120B regression status **NOT RUN**. The owner will run the live comparison against `https://unscripted-demo-proxy.judylp.workers.dev`. Running `node tools/hosted-regression.mjs --url <Worker URL>` from the repository root replaces this page with the model comparison, quote and JSON failure counts, timing, and token counts when the model returns usage, for all twelve cases. Use `--out <report.md>` to save a separate report for each model.

Owner-provided baseline with Gemma before the thinking and token-cap changes: 5/12 HTTP 200, 5/12 HTTP 503 timeouts at 30 seconds, and 2/12 HTTP 502 invalid JSON. Successful cases averaged 1,194 completion tokens. The local paired probe could not resolve the Worker host (`EAI_AGAIN`).

Owner-provided Gemma run after disabling thinking: 12/12 HTTP 200, roughly five seconds per request, zero JSON failures. Seven c02 points expected to be Amber were returned as Green (Java L2/L3, Redis L1/L2, MySQL L1/L2/L3). The next comparison uses GPT-OSS 120B with low reasoning effort.
