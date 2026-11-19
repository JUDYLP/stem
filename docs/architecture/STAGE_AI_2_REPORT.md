# Stage AI-2 · Universal rubric judging

Baseline: PR #3 at `f325f0d`. Built-in pack: `unscripted-core@1.0.0`. All three questions have review status `unreviewed`, inherited by all nine layers.

## Coverage and real calls

Every row passed both locale context tests and a separate English preset demo test. All nine use the same provider and verdict validator. In a real Chrome tab on the packaged localhost site, the user authorized five DeepSeek calls using public synthetic answers. Each returned HTTP 200, model `deepseek-flash`, finish reason `stop`, complete known IDs and a readable, validated verdict. No returned nonempty quote failed the substring check. No learning rating was confirmed in these five calls.

| Topic | Layer | Demo and adapter | Live result in rubric order | Qualitative review |
|---|---|---|---|---|
| Java | L1 | PASS | green/red/red | Second point merits review: the answer recognizes an atomic read but misses compound atomicity. |
| Java | L2 | PASS | green/amber/red | Fits the two schedules and incorrect assertion about joining. |
| Java | L3 | PASS | NOT RUN | Automated coverage only. |
| Redis | L1 | PASS | green/amber/red | The TTL unit is correct, defaults are vague and the timing claim is wrong. |
| Redis | L2 | PASS | NOT RUN | Automated coverage only. |
| Redis | L3 | PASS | green/green/red/red | Recommend amber on point two. The answer predicts 2 but omits preservation of the TTL. |
| MySQL | L1 | PASS | green/amber/red | Correct snapshot, incomplete exclusion rule and incorrect own-write claim. |
| MySQL | L2 | PASS | NOT RUN | Automated coverage only. |
| MySQL | L3 | PASS | NOT RUN | Automated coverage only. |

## Context and state

The read-only adapter checks the displayed title, layer label, prompt and criteria against the fixed built-in pack in the selected language. CI validates the same asset through the pack registry. Requests contain the selected layer only, use stable rubric IDs and treat the answer as untrusted user data. The schema has no separate question description, so the adapter uses the current prompt as its description fallback. The earlier five browser calls used a null optional description before this fallback was added. Exact quotes prove attribution only. Graders can edit all lamps before confirming.

Judge Demo uses nine authored English samples, including deliberate omissions and mistakes. A clearly marked preview displays the example, editable lamps, reasons, excerpts and a follow-up. Its confirmation affects only the preview DOM. The learner's draft and real records stay separate. All sample material is served with the static app; running a scenario makes no model or asset requests.

## Verification

- PASS: npm ci, 183 Node tests (164 prior plus 18 context/scenario cases and one additional contract case), syntax checks on 37 JS files, both browser Pack builds and an allowlisted static package of 18 assets. The 32 AI-specific Node tests include 10 with fake provider/transport or timeout behavior; context and fixture assertions are deterministic checks.
- PASS: interactive Chrome ran all nine demos with fetch instrumented: zero outgoing fetches; draft restoration and unchanged progress/history verified. A separate automated headless Chrome test against the packaged site also clicks lamp controls, attempts formal confirmation inside demo mode, checks missing credentials, changes topics/layers/answers/credentials/mode during delayed responses, and verifies timeout and network failure recovery plus subsequent offline confirmation.
- PASS: 18 declared app assets were requested successfully in the browser run. The browser also probed the optional favicon and got 404.
- NOT RUN: paid calls on the four rows above, authenticated production Pages origin, other browsers and a production deployment. Presets use English examples in both UI languages. Rubric content still awaits human review.
- The PR workflow runs the entire build and the packaged-site browser test without provider credentials or deployment permissions. Its result is reported by GitHub Checks on the PR.
