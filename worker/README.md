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

4. Set `HOSTED_PROXY_URL` in `src/ai/hosted.js` to the live URL. Update `HOSTED_MODEL_LABEL` whenever the deployed `MODEL` changes. Publish the static site and verify a real request from the GitHub Pages site. The checked-in URL is empty.
5. To change models, edit `MODEL` under `[vars]` in `worker/wrangler.toml` and deploy again. To disable inference, set `ENABLED = "false"` and redeploy. Browser preflights still succeed so the UI can read the POST's 503 and offer the simulated Judge Demo.

The deployment configuration uses `@cf/qwen/qwen3.8-27b` with low reasoning effort. The requested built-in fallback `@cf/qwen/qwen3-30b-a3b-fp8` is scheduled to stop accepting requests on November 20, 2026. Keep an active MODEL in the config. The quality regression suggests `@cf/openai/gpt-oss-120b` only when more than one model Green disagrees with the presets. [Cloudflare retirement notice](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/) · [Qwen 3.8 27B model](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)

## Limits and privacy

- The Worker echoes the exact allowed origin and serves only POST and OPTIONS. CORS is a browser policy. Clients outside the browser can set Origin themselves, so this public endpoint relies on rate and budget controls.
- The Worker streams at most 32 KiB of UTF-8 JSON into its request buffer, accepts up to eight system/user messages, and forwards only allowed fields with a server-selected model and a 1,600-token ceiling. Valid upstream JSON objects are normalized to the frontend's OpenAI-compatible response format.
- The native limiter targets six valid POSTs per minute per Cloudflare-provided connecting IP. Counts are approximate and local to a Cloudflare location. If the account cannot deploy the binding, remove its entire rate-limit block, set `ALLOW_MEMORY_RATE_LIMIT = "true"`, and deploy again. That bounded fallback is per isolate, resets at minute boundaries and on isolate restart, and does not provide a shared global limit. Without a configured limiter or the connecting IP, inference is unavailable. [Cloudflare rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- The Worker responds after an 18-second upstream deadline. A timed-out upstream operation may still incur usage. The Worker returns 429 for quota and capacity errors and a short code for other upstream failures. The free allocation resets daily at 00:00 UTC (08:00 Beijing time). On Workers Paid, usage can be billed beyond the free allocation. [Workers AI errors](https://developers.cloudflare.com/workers-ai/platform/errors/) · [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- The proxy forwards the answer and rubric to Workers AI. It does not retain either. Application logs include only status and elapsed milliseconds. User-supplied keys belong to the separate DeepSeek mode and never go to the hosted proxy.

## Verification

Unit tests use mock AI and limiter bindings. Real Workers AI response shapes, whether the Qwen `/no_think` suffix changes inference, actual quota error shapes, account rate limit support, production-origin CORS and latency require verification on the deployed Worker. The Worker strips complete `<think>…</think>` blocks from text responses before parsing.
