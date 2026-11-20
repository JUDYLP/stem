# Unscripted hosted demo proxy

The Worker uses Cloudflare's Workers AI binding. Site visitors do not need a key. Wrangler login authorizes the owner to deploy the Worker to their Cloudflare account.

## Deploy from Windows PowerShell

1. From the repository root, run the following. Wrangler needs to be at least 4.36 for the native rate limiter.

   ```powershell
   cd worker
   npx wrangler login
   npx wrangler deploy
   ```

2. Copy the `workers.dev` URL from Wrangler and verify both outcomes. The allowed test consumes one inference. The denied test should return 403 without an `Access-Control-Allow-Origin` header.

   ```powershell
   $workerUrl = 'https://unscripted-demo-proxy.YOUR-SUBDOMAIN.workers.dev'
   $sample = '{"messages":[{"role":"system","content":"Respond with only a JSON object."},{"role":"user","content":"Return an object with ok set to true."}],"max_tokens":128}'
   $sample | curl.exe -i -X POST $workerUrl -H 'Origin: http://localhost:5174' -H 'Content-Type: application/json' --data-binary '@-'
   $sample | curl.exe -i -X POST $workerUrl -H 'Origin: https://example.invalid' -H 'Content-Type: application/json' --data-binary '@-'
   ```

3. Run the 12-case English regression from the repository root. It waits 11 seconds between requests and writes `docs/HOSTED_REGRESSION.md`.

   ```powershell
   cd ..
   node tools/hosted-regression.mjs --url $workerUrl
   ```

4. The checked-in hosted URL is `https://unscripted-demo-proxy.judylp.workers.dev`. Update `HOSTED_PROXY_URL` if you deploy to a different Worker. The page shows the model ID returned by the Worker. Publish the static site and verify a real request from GitHub Pages.
5. To change models, edit `MODEL` under `[vars]` in `worker/wrangler.toml` and deploy again. To disable inference, set `ENABLED = "false"` and redeploy. Browser preflights still succeed so the UI can read the POST's 503 and offer the simulated Judge Demo.

## 选模型 · Compare models

1. Set `MODEL = "@cf/qwen/qwen3.8-27b"` in `worker/wrangler.toml` and deploy from `worker/`. The deployment config selects GPT-OSS 120B. The Worker falls back to Qwen when `MODEL` is unset.
2. From the repository root, run the Qwen regression with the Worker URL from the deployment steps.

   ```powershell
   node tools/hosted-regression.mjs --url $workerUrl --out docs/HOSTED_REGRESSION.qwen.md
   ```

3. Change `MODEL` to `@cf/google/gemma-4-26b-a4b-it`, redeploy the same Worker, and run again from the repository root.

   ```powershell
   node tools/hosted-regression.mjs --url $workerUrl --out docs/HOSTED_REGRESSION.gemma.md
   ```

Compare the false Greens, JSON and quote failures, latency, and average prompt and completion tokens. Each report lists the model from the response and excludes missing usage from the averages. To estimate daily capacity, use the model's input and output rates in Neurons per million tokens. Divide the daily allowance of 10,000 Neurons (or the remaining allowance for the account) by the estimated Neurons per judgment. Check the estimate against Cloudflare's usage dashboard. The regression suggests `@cf/openai/gpt-oss-120b` only if more than one hosted model Green disagrees with the presets. [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

```text
Neurons per judgment = (mean prompt tokens × input rate + mean completion tokens × output rate) / 1,000,000
estimated judgments = floor(available Neurons / Neurons per judgment)
```

GPT-OSS 120B uses the supported Chat Completions `messages` format with `reasoning_effort: 'low'` and sets the binding's `max_tokens` to 1,200 for every valid request regardless of the client's requested budget. The Worker forwards final answer text and usage. To return to Gemma, set `MODEL = "@cf/google/gemma-4-26b-a4b-it"` and redeploy. Gemma uses `chat_template_kwargs: {enable_thinking: false}`. Qwen receives `/no_think` and low reasoning effort. [GPT-OSS model documentation](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) [Qwen model documentation](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/) · [Gemma model documentation](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/)

## Limits and privacy

- The Worker echoes the exact allowed origin and serves only POST and OPTIONS. CORS is a browser policy. Clients outside the browser can set Origin themselves, so this public endpoint relies on rate and budget controls.
- The Worker streams at most 32 KiB of UTF-8 JSON into its request buffer, accepts up to eight system/user messages, and forwards only allowed fields with a server-selected model and a server-enforced completion budget. Other models honor the requested budget up to 700 tokens. Valid upstream JSON objects are normalized to the frontend's OpenAI-compatible response format.
- The native limiter targets six valid POSTs per minute per Cloudflare-provided connecting IP. Counts are approximate and local to a Cloudflare location. If the account cannot deploy the binding, remove its entire rate-limit block, set `ALLOW_MEMORY_RATE_LIMIT = "true"`, and deploy again. That bounded fallback is per isolate, resets at minute boundaries and on isolate restart, and does not provide a shared global limit. Without a configured limiter or the connecting IP, inference is unavailable. [Cloudflare rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- The Worker waits up to `DEADLINE_MS` milliseconds for inference, with a 40-second default. The hosted frontend and regression CLI share a 45-second request timeout. A timed-out upstream operation may still incur usage. The Worker returns 429 for quota and capacity errors and a short code for other upstream failures. The free allocation resets daily at 00:00 UTC (08:00 Beijing time). On Workers Paid, usage can be billed beyond the free allocation. [Workers AI errors](https://developers.cloudflare.com/workers-ai/platform/errors/) · [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- The proxy forwards the answer and rubric to Workers AI. It does not retain either. Application logs include only status and elapsed milliseconds. User-supplied keys belong to the separate DeepSeek mode and never go to the hosted proxy.

## Verification

Unit tests use mock AI and limiter bindings. Real Workers AI response shapes, whether the Qwen `/no_think` suffix changes inference, actual quota error shapes, account rate limit support, production-origin CORS and latency require verification on the deployed Worker. The Worker reads final content, skips complete `<think>…</think>` blocks outside JSON, and extracts the first complete JSON object from fenced or annotated content. GPT-OSS final-content extraction and its request parameters are covered by mocks. The external GPT-OSS regression at 700 tokens and 30 seconds returned 10 of 12 successful responses and one false Green (Redis L1 c02). Redis L3 returned invalid upstream JSON and Python float L3 timed out. Live verification of the 1,200-token and 40-second limits is pending.
