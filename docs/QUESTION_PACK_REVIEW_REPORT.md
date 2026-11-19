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
- Repository Node test suite / syntax check: pending rerun after the CI fix.
- Real provider / API-key model regression: **NOT RUN**; assigned to the local agent after merge-ready review.
- Browser integration of the intro pack: **NOT INCLUDED**; this PR adds the supplied pack as data only.
- Human owner approval: pending.
