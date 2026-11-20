# Submission draft — not submitted

## Current facts

- Track: Education.
- Source repository: https://github.com/JUDYLP/stem (public).
- Live website: https://judylp.github.io/stem/ (English: https://judylp.github.io/stem/?lang=en). Final UI check pending.
- Video: recorded (2:30, English voiceover and burned-in English subtitles); not uploaded yet. It shows the published site with real hosted AI judgments, not simulated ones.
- Live AI: a keyless hosted mode (Cloudflare Worker + Workers AI, GPT-OSS 120B) is deployed and configured for the site; a browser check on the published site is pending. Learners can also use their own DeepSeek key or a compatible proxy.
- Hosted regression (2026-11-20, 12 levels, 38 reference points): 12/12 requests succeeded in about 9–21 s; 68.4% agreement with preset lights; 1 point preset amber was judged green. Presets are comparison fixtures, not an accuracy benchmark.
- Question content: source-checked draft, pending participant review.
- User study / learning outcome evidence: none collected yet.

## English project description draft

### Inspiration

AI-assisted coding can produce working code before a learner can explain its mechanisms or limitations. Unscripted explores a small practice loop that asks software students to explain a concept, reason through it, and consider a boundary case.

### What it does

The prototype ships two question packs: Core Software Engineering (Java concurrency, Redis expiration, MySQL consistent reads) and a Python Starter pack (floating-point equality), four questions with three layers each: Explain, Reason, Stress-test. Each reference point is a signal light: learners write an explanation before seeing the checklist, then set a green, amber, or red light per point and confirm the level. Only an all-green level is a Pass; amber and red stay in review. The browser keeps the latest rating per question and level, plus a 200-entry history that drives a heat matrix and a timeline with light changes. Answers are kept only if the learner turns on an opt-in switch, and the Markdown crash sheet includes the light and missed points.

With AI judging on, a model proposes a light, a short reason and a verbatim quote from the learner's answer for each reference point, plus one targeted follow-up question. The page checks that each quote really appears in the answer; a green without a valid quote is downgraded to amber. Verdicts are suggestions: nothing is recorded until the learner confirms.

A bilingual signal-light demo on the landing page illustrates the flow using fixed, explicitly simulated feedback. It does not call an AI model and does not modify practice records.

### How it is built

HTML, CSS, native JavaScript modules, versioned JSON question packs validated with JSON Schema (Ajv) plus semantic checks, and browser localStorage. Offline practice and the simulated Judge Demo require no account or API key. The optional hosted judging mode uses a Cloudflare Worker that forces the model server-side, allows only the site's origin, rate-limits each IP to 6 requests per minute and stores no answers. Lights are CSS plus inline SVG, and motion respects the reduced-motion preference. Node's built-in test runner (261 tests) checks the pack contract, AI verdict parsing and quote checks, the Worker's origin, rate-limit and timeout handling, light aggregation, history trimming, answer-switch privacy, persistence fallback, and review export. Python's standard library serves local files during development.

### AI use and limitations

AI coding tools wrote essentially all of the code and tests: Codex (planning, most of the implementation, AI judging, the Worker, tests) and OpenCode running DeepSeek models (frontend visuals and UI). I came up with the idea, wrote the requirements for each stage, split the work between the tools, reviewed and merged the pull requests, and chose the hosted model by comparing regression results against a rule I set. The hosted demo uses the open-weight GPT-OSS 120B model on Cloudflare Workers AI. I also tried Qwen3.8 27B (too slow, timed out) and Gemma 4 26B (fast but too lenient with reasoning off). Live AI also supports a learner-provided DeepSeek key. Judge Demo uses labeled preset responses. The learner confirms the rating. I have not measured learning gains or validated the tool as a measure of mastery.

### What I learned

Honestly, I learned less about writing code than about building software with AI. AI tools wrote almost all of the code. What I learned was how to run the project:

- Coordinating several AI tools: Codex for backend and AI integration, OpenCode with DeepSeek for the frontend, each with clear file ownership so they did not overwrite each other.
- A real development process: planning, designing the frontend and backend separately, and working in stages, with each stage on its own git branch and pull request that I checked before merging.
- Reviewing AI output instead of trusting it: I set acceptance criteria, then checked test results and regression reports before saying yes.
- Deploying a free backend on Cloudflare Workers and its workers.dev domain, with an origin allowlist and rate limit so judges can use it without a key.
- Choosing a model with data, not speed: the fastest model I tried marked 7 half-explained points as fully correct. I set a rule (at most one false green) and picked GPT-OSS 120B, which met it.

My biggest takeaway: much of the hands-on work I would have done myself before AI can now be handed over completely. Setting up and deploying the Cloudflare Worker took me no coding at all; the AI did it, the result was the same, and it was much faster.

### What I would do differently

Can AI tools lift you up? Of course, the same way an elevator lifts anyone who steps in. But riding an elevator does not make your legs any stronger. AI got this project to the top floor; Unscripted is meant to be the stairs.

I shipped a lot of code I cannot fully explain, which is exactly the problem Unscripted is about. Next time I would write at least one core module myself and use Unscripted's own questions on my project before each merge.

### What's next

Finish my own review of the questions, collect a few real usability observations, add more question packs, and generate a draft pack from material the learner pastes in.

## Video plan (about 3 minutes; limit 6 minutes)

1. Show the tagline and explain the target learner's difficulty.
2. Pick one question and show the three layers.
3. Type an explanation, reveal reference points, and retry.
4. Set red and green lights, confirm a review level, show the heat matrix and timeline, then export the Crash Sheet and demonstrate that an all-green Pass removes it.
5. Run a hosted AI judgment: show the per-point lights, quotes and follow-up, then confirm. If showing Judge Demo instead, keep Simulated visible and say no live AI call is made.
6. Explain one real technical lesson and current limits.

Record the actual running app; disclose the AI-generated voiceover; ≤6 minutes on YouTube/Vimeo, public or unlisted. Confirm the link works without login. Do not show secrets.

## Video disclosure

- The voiceover is AI-generated: I wrote the script, and it was read by Microsoft Edge text-to-speech (voice: en-US-AvaMultilingualNeural, via the open-source edge-tts tool). It is not my own voice.
- The screen recording, cuts and subtitles were produced by an AI agent (Hark) running Playwright and ffmpeg on my instructions. I chose the shots and approved the script.
- Every AI verdict on screen is a real response from the hosted GPT-OSS 120B model on the published site. Waiting time was trimmed and some sections are slightly sped up (up to about 1.2×); no result was edited or faked.

## Remaining checklist

- [x] Repository public; README and sources accessible.
- [x] HTTPS site live.
- [x] Hosted AI judgment on the published site (recorded in the video, 2026-11-20).
- [ ] Final UI check.
- [ ] Three questions reviewed by participant.
- [ ] Downloaded Markdown opens correctly on participant device.
- [ ] Real video uploaded; link verified.
- [ ] Participant-written learning/contribution statements.
- [ ] Devpost Education submission completed and confirmation saved.
- [ ] Join official Discord; verify Demo Day live time and prerecorded deadline.

This file is a draft, not evidence of submission, trial users, or completed Demo Day participation.
