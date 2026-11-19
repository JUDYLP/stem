# Hosted proxy regression

Gemma regression status **NOT RUN**. The owner will run the live comparison against `https://unscripted-demo-proxy.judylp.workers.dev`. Running `node tools/hosted-regression.mjs --url <Worker URL>` from the repository root replaces this page with the model comparison, quote and JSON failure counts, timing, and token counts when the model returns usage, for all twelve cases. Use `--out <report.md>` to save a separate report for each model.
