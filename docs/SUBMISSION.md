# Submission draft — not submitted

## Current facts

- Track: Education.
- Source repository: https://github.com/JUDYLP/stem (currently private; must become public for submission).
- Live website: not yet verified; Pages setup is pending.
- Video: not recorded or uploaded.
- Live AI: not integrated. Do not call the simulated example a real model response.
- Question content: source-checked draft, pending participant review.
- User study / learning outcome evidence: none collected yet.

## English project description draft

### Inspiration

AI-assisted coding can produce working code before a learner can explain its mechanisms or limitations. Unscripted explores a small practice loop that asks software students to explain a concept, reason through it, and consider a boundary case.

### What it does

The current prototype contains three technical questions with three layers each. Learners write an explanation before viewing reference points, retry in their own words, and choose Pass or Review themselves. The browser stores the latest self-rating. A Markdown Crash Sheet includes only the layers currently marked for review.

An English demo illustrates the flow using fixed, explicitly simulated feedback. It does not call an AI model and does not modify practice records.

### How it is built

HTML, CSS, native JavaScript modules, a JSON question bank, and browser localStorage. No account, backend, database, third-party frontend library, or API key is required. Node's built-in test runner checks the data contract, persistence fallback, and review export. Python's standard library serves local files during development.

### AI use and limitations

Codex assisted with planning, implementation, debugging and tests. The participant must review the content and explain their own contribution before submission. There is no live model integration in the current prototype. We have not measured learning gains or validated the tool as a measure of mastery.

If live integration remains unavailable because of browser CORS, disclose that actual reason. Do not claim the API-credit exception without confirming that it applies.

### What I learned

[Participant: replace with one or two things you can now independently explain, plus an actual debugging example. Do not submit this placeholder or invent a learning experience.]

### What's next

Finish participant review of the questions, validate public deployment, collect a few real usability observations, and evaluate a browser-compatible optional model integration with transparent failure handling.

## 90–180 second video plan

1. Show the tagline and explain the target learner's difficulty.
2. Pick one question and show the three layers.
3. Type an explanation, reveal reference points, and retry.
4. Mark Review, export the current Crash Sheet, then demonstrate that Pass removes it.
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
