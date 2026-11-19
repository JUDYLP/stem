# Question Pack Review Report

Date: 2026-11-19  
Scope: `unscripted-core` (Java JUC, Redis, MySQL) and `unscripted-intro` (Python floating point), 4 questions / 12 layers.  
Status: content revisions prepared; **all question review statuses remain `unreviewed` pending owner approval and real-model regression testing**.

## Versioning

- `unscripted-core` advances from `1.0.0` to `1.0.1`. Pack versions are immutable by contract; content must not be changed under the same packId + packVersion.
- `unscripted-intro@1.0.0` is added as the supplied existing starter pack, not a newly designed question.
- Existing question IDs are unchanged. Existing rubric IDs are retained except Java L1's duplicate c03 is removed; Redis L3 adds c05.
- The intro pack is added as data and covered by validation tests. It is not wired into the current UI's built-in registry in this PR.

## Layer review summary

| Pack / question | Layer | Result | Changes |
|---|---|---|---|
| Core / Java JUC volatile | L1 | Revised | Merge duplicate c02/c03 into c02; remove c03 |
| Core / Java JUC volatile | L2 | Pass | No content change |
| Core / Java JUC volatile | L3 | Pass | No content change |
| Core / Redis expiration | L1 | Revised | Replace unrelated scheduler claim with logical expiry vs physical reclamation boundary |
| Core / Redis expiration | L2 | Pass | No content change |
| Core / Redis expiration | L3 | Revised | Split INCR value result (c02) from TTL preservation (new c05) |
| Core / MySQL consistent read | L1 | Pass | No content change |
| Core / MySQL consistent read | L2 | Pass | No content change |
| Core / MySQL consistent read | L3 | Revised | Make prompt self-contained; clarify UPDATE current read and row locking |
| Intro / Python floating point | L1 | Revised | Qualify typical binary64 implementation; clarify cross-language behavior |
| Intro / Python floating point | L2 | Revised | Scope accumulation result to this loop; accept integer units, Decimal-from-string, and Fraction as scenario-appropriate exact representations |
| Intro / Python floating point | L3 | Revised | Distinguish display formatting from stored value; clarify Decimal(float) and rounding context |

## Important scoring boundaries

### Java L1
The old c02 and c03 measured overlapping aspects of the same read-modify-write issue. The merged c02 requires the learner to identify read, calculation, and write as a compound operation and explain that interleaving can lose updates.

### Redis L3
The INCR result and TTL behavior are independent facts:
- c02: value changes from 1 to 2.
- c05: existing TTL is preserved; the original absolute expiration time is not reset.
A response that only states the new value must not receive Green for c05.

### MySQL L3
The prompt now contains its own initial balance, transaction order, isolation level, SQL statement, and assumptions. Under the stated sequence, UPDATE uses the current committed row value 80 and subtracts 10; A's subsequent consistent read sees its own update to 70.

### Python L2
c03 accepts three scenario-appropriate strategies: integer smallest units for fixed-precision counting, Decimal constructed from strings for decimal arithmetic, and Fraction for rational arithmetic. Naming a type without explaining why it fits the problem is not sufficient evidence for Green.

## Demo scenario changes

- Java L1 demo now uses the merged two-point rubric.
- Redis L1 demo now tests the revised expiry/reclamation boundary rather than an out-of-scope business scheduler claim.
- Redis L3 demo separately tests the INCR value and TTL preservation; omission of TTL evidence receives Amber, not Green.
- Three supplied Python demo scenarios are added to the shared scenario file.
- Python L2 c03 omission is Amber rather than Red.
- Python L3 distinguishes an incomplete explanation of display formatting from the explicit incorrect use of `Decimal(0.1)`.

All demo quotes are intended to be exact substrings of their sample answers; automated tests assert this and validate that each scenario references exactly the current layer's rubric IDs.

## Sources for technical verification

- Java Language Specification, Java SE 21, §17.4.5 (happens-before): https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5
- Redis EXPIRE: https://redis.io/docs/latest/commands/expire/
- Redis INCR: https://redis.io/docs/latest/commands/incr/
- Redis SET / KEEPTTL: https://redis.io/docs/latest/commands/set/
- MySQL 8.4 Consistent Nonlocking Reads: https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html
- MySQL 8.4 Locking Reads: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- Python Floating-Point Arithmetic: https://docs.python.org/3/tutorial/floatingpoint.html
- Python Decimal: https://docs.python.org/3/library/decimal.html
- Python Fractions: https://docs.python.org/3/library/fractions.html

## Validation status

- JSON parsing and in-memory structural checks: performed during preparation.
- Initial GitHub Actions run exposed a version-pinning regression in legacy migration: `src/storage/migration.js` still requested Core 1.0.0 after the built-in pack advanced to 1.0.1. The migration now resolves the latest registered built-in Core version, and the storage migration test asserts the migrated snapshot targets that version.
- The next CI run exposed two further compatibility assumptions: AI context was pinned to Core 1.0.0, and the legacy array loader capped each layer at four rubric items. The judge now checks the Core pack identity and exact displayed-vs-official content without pinning a stale version; the legacy loader now accepts up to five items. Test fixtures were also corrected to keep imported 1.0.0 and 1.0.1 versions distinct, and demo light coverage is asserted across the built-in scenario set rather than every individual layer.
- The next Judging regression run passed all 218 Node tests, syntax validation, and both pack builds, then exposed a browser fixture assumption that every layer must contain all three lamp colors. That is incompatible with the approved Java L1 merge to two criteria. The browser test now checks that demo lamp count matches the active layer's rubric count and that every state is valid; color diversity is checked across the complete scenario set.
- Final GitHub Actions on the PR head passed: `npm test` (218/218), `npm run check:syntax`, `npm run build:pack-validator`, `npm run build:pack-runtime`, site packaging, and the AI2 browser integration fixture.
- Real-provider regression using the owner's local API key was not run; it remains a separate manual check.
- Real provider / API-key model regression: **NOT RUN**; assigned to the local agent after merge-ready review.
- Browser integration of the intro pack: **NOT INCLUDED**; this PR adds the supplied pack as data only.
- Human owner approval: pending.

## Second review

### Reproduction at `8d295b5`

The 218 baseline tests passed. Fixtures built from the v1 history format still reproduced two errors in timeline/export lookup against the current rubric: Java L1 dropped the third criterion, and Redis L3 replaced the old combined value and TTL criterion with the value-only criterion. A mock response with a genuine but insufficient quote reproduced an erroneous Green for each targeted criterion.

### Historical ratings

New v1 journal entries carry a bilingual rubric snapshot with pack ID, version, and ordered rubric IDs. Stable rubric IDs remain the primary attribution for v2; new v2 writes capture the same snapshot. The browser reads v2 history as a projection alongside v1. Migration archives original v1 bytes and marks legacy progress for reconfirmation, without manufacturing v2 ratings. It also recognizes the optional v1 snapshot.

The repository preserves the exact 1.0.0 Core artifact. Java L1’s original three lamps and Redis L3’s original four lamps identify their rubric layouts among the shipped Core versions. These unversioned ratings are still flagged for reconfirmation. If the count is ambiguous, only identical rubric texts across the candidate versions are used. Otherwise the view keeps the lamp, answer and numbered criterion with version unconfirmed. Redis’s old compound criterion is never split into new grades.

### Green evidence

The judge prompt now requires the quote to cover every necessary part of each criterion and asks the model to connect the evidence to the criterion in its reason. A deterministic veto downgrades the two known conclusion-only patterns, including tested English and Chinese variants. Redis L3 c02 can still credit the INCR value; c05 requires separate evidence about the existing expiration. Java L1 c02 asks for the interleaving mechanism. Complete answers and paraphrases can pass without a fixed positive keyword list. This protects the covered patterns; genuine quotes and a model's explanations can still be semantically insufficient elsewhere. The learner confirms final lamps.

### Regression status

- Stage A baseline: 218/218 passed; both old export failures and both false Green responses reproduced separately.
- Both PR Pack JSONs retained their published content and version. The historic 1.0.0 artifact is an exact copy from the main baseline.
- Real-provider calls for this revision: **NOT RUN**. The test suite covers mocked false Greens and complete evidence without requiring a network key.

- Stage B targeted tests: 50/50 passed across v1 history, v2 storage/migration, versioned rubric fixtures, and export. Chrome verified old Java and Redis evidence in the timeline alongside a 1.0.1 v2 result.
- Stage C targeted tests: 37/37 passed across the judge and context suites. The packaged Chrome test explicitly serves each incorrect mock Green and checks that the UI shows Amber.
- Stage D: npm ci, 228/228 Node tests, syntax checks for 46 JavaScript files, both Pack builds, packaging of 22 static assets, and Chrome AI2 integration all passed.
- The page continues to write reviews to its v1 journal. v2 history on this page is a read-only view. Unversioned records cannot always be assigned a rubric, and old ratings are marked for reconfirmation. There is no general client-side semantic verifier.
