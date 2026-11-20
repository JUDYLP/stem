# Submission draft — not submitted

## Current facts

- Track: Education.
- Source repository: https://github.com/JUDYLP/stem (currently private; must become public for submission).
- Live website: not yet verified; Pages setup is pending.
- Video: not recorded or uploaded.
- Live AI: learners can use their own DeepSeek key. The hosted Worker URL is configured for the site; production publication and GPT-OSS comparison are pending.
- Question content: source-checked draft, pending participant review.
- User study / learning outcome evidence: none collected yet.

## English project description draft

### Inspiration

AI-assisted coding can produce working code before a learner can explain its mechanisms or limitations. Unscripted explores a small practice loop that asks software students to explain a concept, reason through it, and consider a boundary case.

### What it does

The current prototype contains three technical questions with three layers each. Each reference point is a signal light: learners write an explanation before seeing the checklist, then set a green, amber, or red light per point and confirm the level. Only an all-green level is a Pass; amber and red stay in review. The browser keeps the latest rating per question and level, plus a 200-entry history that drives a heat matrix and a timeline with light changes. Answers are kept only if the learner turns on an opt-in switch, and the Markdown crash sheet now includes the light and missed points.

A bilingual signal-light demo on the landing page illustrates the flow using fixed, explicitly simulated feedback. It does not call an AI model and does not modify practice records.

### How it is built

HTML, CSS, native JavaScript modules, a JSON question bank, and browser localStorage. Offline practice and the simulated Judge Demo require no account or API key. The optional hosted judging mode uses a Cloudflare Worker. Lights are CSS plus inline SVG, and motion respects the reduced-motion preference. Node's built-in test runner checks the data contract, light aggregation, history trimming, answer-switch privacy, persistence fallback, and review export. Python's standard library serves local files during development.

### AI use and limitations

Codex assisted with planning, implementation, debugging and tests. The participant must review the content and explain their own contribution before submission. The hosted demo is configured for the open-weight GPT-OSS 120B model on Cloudflare Workers AI for the current comparison. Live AI also supports a learner-provided DeepSeek key. Judge Demo uses labeled preset responses. The learner confirms the rating. We have not measured learning gains or validated the tool as a measure of mastery.

### What I learned

[Participant: replace with one or two things you can now independently explain, plus an actual debugging example. Do not submit this placeholder or invent a learning experience.]

### What's next

Finish participant review of the questions, validate public deployment, collect a few real usability observations, and validate the hosted proxy on the public origin and report the model comparison.

## 90–180 second video plan

1. Show the tagline and explain the target learner's difficulty.
2. Pick one question and show the three layers.
3. Type an explanation, reveal reference points, and retry.
4. Set red and green lights, confirm a review level, show the heat matrix and timeline, then export the Crash Sheet and demonstrate that an all-green Pass removes it.
5. If showing the English demo, keep Simulated visible and say no live AI call is made.
6. Explain one real technical lesson and current limits.

Record the actual running app; ≤6 minutes on YouTube/Vimeo, public or unlisted. Confirm the link works without login. Do not show secrets.

## Remaining checklist

- [ ] Repository public; README and sources accessible.
- [ ] Verified HTTPS site and final UI checks.
- [ ] Three questions reviewed by participant.
- [ ] Downloaded Markdown opens correctly on participant device.
- [ ] Real video uploaded; link verified.
- [ ] Participant-written learning/contribution statements.
- [ ] Devpost Education submission completed and confirmation saved.
- [ ] Join official Discord; verify Demo Day live time and prerecorded deadline.

This file is a draft, not evidence of submission, trial users, or completed Demo Day participation.
