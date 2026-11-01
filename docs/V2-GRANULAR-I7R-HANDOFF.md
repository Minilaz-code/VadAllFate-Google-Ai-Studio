# I7R reliability remediation handoff

2026-11-01. **I7 remains INCOMPLETE. I8 and normal granular gameplay remain held.** Option C remains direct typed SQLite under the existing R1 authority, with native legacy readers and no mandatory JSON paging.

## Review and integration identity

Paired branch: `codex/v2-granular-i7r`, based exactly on backend `57365c9c3c1066bfbc92b1b809b73f259e1a470f` and frontend `8c37e3b9baaee77938bd4314872d2bb473a1256c`. Final SHAs are verified in the delivery response; obtain immutable references with:

```powershell
git ls-remote origin refs/heads/codex/v2-granular-i7r
```

- [Backend branch](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i7r)
- [Frontend branch](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i7r)
- [Exact implemented protocols, trust limits and approval units](V2-GRANULAR-I7R-SPEC.md)
- [Original G01-G29 with additive I7R dispositions](V2-GRANULAR-ACCEPTANCE-MAP.json)

Antigravity should review the independent ASCII/JCS optimization separately from the PREPARED diagnostic prototype. Review commits: `6d7f3a939f8ff89046de9cc9eb143b283f243e08` (equivalent JCS fast path) and `4567c122dc660c5fe4e265cd4177668be15b2658` (disabled prototype/offline tooling). Do not import the fixture instrumentation into the application, register these operations, install these tables in existing Saves or change full-audit write eligibility. Frontend executable code is unchanged. Review/cherry-pick only into a separate development branch; no protected merge is performed here.

## What is implemented

**B:** connection-bound signed full-audit checkpoints and atomic transition stamps, externally pinned trust, bounded suffix diagnostics, independent full native-plus-metadata audit, version/Save/realm binding, negative substitution/truncation tests and real Windows pre/post-COMMIT abrupt-exit recovery. Existing action validation still precedes every stamp. No existing authority, schema, hash profile, codec, replay or audit policy is changed.

Prefix verification is faster on the measured snapshots but cannot establish present-tense integrity for old untouched data. An old row corrupted behind a trusted checkpoint may pass the diagnostic; the independent full audit rejects it. Thus this prototype is **rejected as a replacement for the mandatory full-audit gate**. It grants no write eligibility and refreshes no native audit marker. A future production policy needs separate approval and stronger corruption/key/anchor guarantees.

The only modified existing runtime file, `runtime/jcs_hash.py`, avoids a Python surrogate-character loop for exact native ASCII strings. Other strings/subclasses retain the original check; canonical bytes and I4 hash meanings are unchanged. Tests cover every BMP code point, supplementary Unicode and a deceptive subclass.

**A:** an authenticated, signed, read-only parent manifest/fork proposal and independently authenticated child-inspection demo. Parent records, source pins, events and receipts are unchanged. No child canonical Save is created. The offline demo rejects parent credentials, but is not the real V2 session service and cannot commit. Real independent canonical branching remains blocked at the explicitly specified FORK-1 authority/lineage/auth boundary.

**C:** authenticated offline pending-admission review retains exact damaged bytes (including invalid UTF-8), fingerprint, action/admission/dispatch identity and approval evidence. Distinguishes stale, missing codec, corrupt payload, missing module and untrusted replacement. It signs a HOLD report, never skips, overwrites, regenerates, marks APPLIED or advances a queue. The real disposition lifecycle remains blocked at ADMISSION-REPAIR-1. Malformed action JSON, missing approval rows or oversized damaged payloads fail closed without producing a complete review; this helper is not a general SQLite forensic-repair tool.

All new SQLite files are original disposable fixtures created by exclusive factory operations. The prototype is disabled, not a production schema registration or second writable authority. No real AI/provider PASS, cognition-system completion, private model reasoning or source combat activation is claimed.

## Comparative measurements

Each row uses the exact same snapshot for native full audit and five prefix reads after 80 actual native commits with atomic stamps. Full audit runs first; prefix reads are warm. Concurrent regression/endurance load can affect timings; these are observations, not latency SLAs or equivalent integrity guarantees.

| NPCs / initial memories | Native independent full audit | Prefix median, 80 transitions | Full native + all stamps |
| --- | ---: | ---: | ---: |
| 100 /1,000 | 2.766s | 0.987s | 3.371s |
| 1,000 /10,000 | 14.521s | 1.215s | 15.143s |

Evidence: backend `docs/evidence/V2-GRANULAR-I7R-COMPARE-100.json` and `COMPARE-1000.json`. Both assert exact snapshot equality and unchanged old audit markers. Raw commit rows/request sizes and process CPU/RAM remain in those files. At 100/1,000 NPCs, frames were 11,421-11,429 /11,422-11,430 bytes; SQL rows/action 29-52 /38-60; median commit-with-stamp plus post-commit diagnostics 0.331 /0.363s; process peak working set 47,542,272 /114,233,344 bytes. These medians include the explicit diagnostics call and are not isolated SQL transaction times. Prefix time omits historical/untouched reconstruction; full metadata scan is O(history); native reconstruction is at least linear and includes sorting/tree rebuild and SQL/receipt checks.

`V2-GRANULAR-I7R-OFFLINE-PROBES.json` records five actual fault probes, including invalid UTF-8, covering four classifications and fork proposal/child-inspection denials; the fifth classification, stale input, is verified separately in the automated fixture tests, with no private raw review bodies or credentials. Signed raw reviews and generated files remain local.

## Verification and endurance

Final broad backend: **897 passed, 2 skipped in 973.96s (16m13s)** after all runtime/test changes, including the continuation test. Focused I7R/JCS/continuation: **32 passed in 153.68s**, with a final standalone continuation check **1 passed in 7.88s**. Real Windows abrupt-exit cases are included. The two skips were confirmed separately: private source archive is opt-in; Windows symlink creation privilege is unavailable. Frontend: **157 passed**, TypeScript check and production build passed. Existing Vite native-config/large-chunk warnings remain.

The first new attempt finished **INCOMPLETE_TIME_BUDGET at 9,101/10,000**, with clean final verification. Its report is retained unchanged. The same-fixture continuation completed the remaining **899 actions**, and final integrity/restart/exact-once verification succeeded. The combined result is **PASS_FIRST_SLICE_ENDURANCE: 10,000/10,000**. This does not promote overall I7 or production readiness. The original I7 artifact remains immutable at **1,401/10,000**, with its original declared 1,800-second budget.

The new attempt uses the unchanged `granular_i7_endurance.py`, the same original 100-NPC/1,000-memory genesis, rotating observer/nonces and memory/relationship actions, with an explicitly longer **14,400-second loop-start wall budget**. The budget is checked before an iteration's periodic audit; that audit/current action and mandatory final verification can extend total elapsed time. It does **not** use the signed-prefix prototype. Native full audits remain every 100 revisions, checkpoint/full-audit every 500, plus final independent full audit/checkpoint/reopen and exact-once retry. WAL, synchronous FULL, foreign keys, hash/replay and all history remain intact. Budget exhaustion would be INCOMPLETE, not an engine capacity ceiling.

If the four-hour attempt ends INCOMPLETE_TIME_BUDGET with clean final verification, the separately tested `granular_i7r_resume_endurance.py` can continue the SAME owned temporary fixture. It requires the local ticket, exact final snapshot and receipt count, read-only marker/cookie checks before writer open, mandatory full reopen audit and an additional existing authority checkpoint restoring connection-local WAL auto-checkpoint zero, the next original nonce and the same 100/500-revision policy. It refuses RUNNING/failed reports, a different/stale fixture and output over the prior report/ticket. The first report remains immutable; a new combined report retains every original action and binds the prior report SHA256. Its additional budget and extra full audits are separately disclosed. Combined elapsed time sums executed phases, excluding any operator pause between them. No overlap is counted.

```powershell
python tools/granular_i7r_resume_endurance.py --ticket <owned-temporary-local-only-recovery.json> --prior-report <completed-I7R-partial-report.json> --output <new-combined-numerical-output.json> --max-seconds 7200
```

The continuation test uses two actual native commits and a clearly scripted four-action resume-input fixture, then verifies four unique receipts, unchanged prior bytes/ticket and stale re-entry refusal. That small case is not measured 10,000-action evidence. No production Save path or original I7 fixture is used.

This workload has a fixed genesis NPC population and fixed clock. It grows memories, relationship evidence and immutable native history; it is not dynamic NPC creation, full quests/routines or a complete migrating campaign.

## Verified first I7R phase (retained unchanged)

First report: backend `docs/evidence/V2-GRANULAR-I7R-ENDURANCE-100.json`, SHA256 `6a108d577df65fcea9fcee2cec51f8d944a800324e7f8742dc26c823eb8067eb`. The continuation binds these exact retained bytes and does not overwrite them.

| Actual first-phase result | Value |
| --- | ---: |
| Verified material actions | 9,101 /10,000 |
| Loop budget /total execution seconds | 14,400 /15,120.947 |
| Process CPU seconds /peak working-set bytes | 11,955.828 /106,422,272 |
| Fully framed request range, bytes | 11,465-11,491 |
| Final SQLite bytes /peak observed WAL bytes | 454,729,728 /238,148,392 |
| Final WAL after audited truncate | 0 |
| Final full audit /checkpoint /reopen seconds | 180.963 /184.151 /176.633 |
| Receipts /ledger /outbox /admissions | 9,101 each |
| Applied intents /native events /memories | 18,202 /9,201 /10,101 |

All admissions were APPLIED; exact-once retry before and after mandatory full reopen matched the same receipt and snapshot. The last iteration began just before the loop deadline and included its scheduled full audit; it committed action 9,101 before the next budget check stopped admission. This is a verified budget-limited result, not an engine failure or proof of 10,000 actions. No history was removed.

Material-commit nearest-rank p50/p95/p99/max: 0.138 /0.550 /1.182 /5.189s excluding three traced samples; all raw observations remain. Concurrent regression/tool load and report serialization are included in total process measurements; no latency SLA is claimed. Full-history work is still a practical production blocker. The actual SQLite/ticket are indexed locally under ignored `private-content/i7r-local-recovery/`; no credentials or paths are published.

## Completed 10,000-action same-fixture result

**PASS_FIRST_SLICE_ENDURANCE**, from the actual original disposable SQLite, not aggregated independent samples. Backend numerical artifacts: `docs/evidence/V2-GRANULAR-I7R-ENDURANCE-10000.json` (combined), the unchanged 9,101-action report above, and `V2-GRANULAR-I7R-VERIFICATION.json` (cold SQL, preservation and regression evidence). The combined report retains the first 9,101 observations exactly as parsed, adds 899 subsequent native actions, and binds the original partial file SHA256. Its SHA256 is `c069d48d26d5ac31ce21c76b845d9616d5acda47f73dd061749619e2204c4dab`.

| Final actual measurement | Result |
| --- | ---: |
| Unique native material actions /receipts | 10,000 /10,000 |
| First loop budget /continuation loop budget | 14,400s /7,200s |
| First execution /continuation execution /combined | 15,120.947s /3,255.042s /18,375.989s |
| Combined CPU seconds /maximum process working-set bytes | 15,011.328 /151,711,744 |
| Framed request range | 11,465-11,492 bytes |
| Admission p50/p95/p99/max | 0.0925 /0.4732 /1.0026 /4.0694s |
| Dispatch p50/p95/p99/max | 0.0036 /0.0111 /0.4879 /3.8719s |
| Staging p50/p95/p99/max | 0.1007 /0.3624 /0.6953 /3.6661s |
| Material commit p50/p95/p99/max | 0.1350 /0.5364 /1.1779 /5.1894s |
| SQL rows/action, first 50 /last 50 | 31-52 /38-61 |
| WAL frames/action, first 50 /last 50 | 63-91 /80-114 |
| Final SQLite /peak observed WAL /final WAL | 499,408,896 /239,709,872 /0 bytes |
| Final independent full audit /checkpoint /full reopen | 205.453 /206.666 /207.819s |
| Native events /memories /applied intents | 10,100 /11,000 /20,000 |

Ledger, outbox and admissions each contain 10,000 rows, with zero non-APPLIED/pending admissions. Cold read-only `PRAGMA integrity_check` returned `ok`; foreign-key check returned no violations. Exact current snapshot equals the tool's independent rebuilt final snapshot. Entity-catalog revisions confirm every NPC identity remains revision zero and each of the 100 relationships is revision 100 (sum 10,000). No `p7r_*` tables exist in the actual endurance database: this run never used prefix verification. The binding remains `granular.v1` /PREPARED and every staged codec is `I5.PREPARED.atomic.v1`.

Quantiles are nearest-rank, excluding four explicitly traced commits; all 10,000 raw records remain. The maximum material latency over ALL samples was 5.1894s. Process memory includes measurement/report data. Combined elapsed/CPU sum the two executed phases; the operator pause between them is excluded. Startup continuation full audit/checkpoint costs (186.050 /183.857s), periodic audits, 500-revision checkpoints, final verification and report I/O remain included. Concurrent earlier regression load is disclosed; these measurements are not a latency SLA.

Original I7 entity roots equal the new run at every common recorded revision: 100, 200, 300, 400, 600, 700, 800, 900, 1100, 1200, 1300, 1400. The original 1,401-action artifact is byte-identical (SHA256 `e7ae1c8c3e38244a5a6f30a58ad5692af04c0ab5b116f7c554a7da6220bcd877`). Canonical bytes/domains, pins and the full verification policy are preserved. **The target is now demonstrated for this first slice; full-history audits around 205 seconds at 10,000 actions remain an operational blocker.** No general playable-campaign latency/capacity or full typed-owner claim is made.

| I7R acceptance area | Final disposition |
| --- | --- |
| B disabled prototype, hashes, touched validation, corruption/crash/version cases | PASS scoped fixture evidence; prefix REJECTED as production full-audit/eligibility replacement. |
| A authenticated parent manifest/child inspection demonstration | PASS offline proposal/demo; real canonical fork BLOCKED at FORK-1. |
| C exact damaged-byte/operator HOLD classification | PASS offline fixture evidence; real queue disposition BLOCKED at ADMISSION-REPAIR-1. |
| 10,000 native actions, retained history, restart and idempotency | PASS FIRST SLICE, under the disclosed original full policy and two phase budgets. |
| R1/frontend regressions and preservation | PASS with the two named environment skips; no new UI/AI-provider PASS claimed. |
| Overall I7 /I8 /normal granular gameplay | INCOMPLETE /HELD /DISABLED. |

## Reproduction

From the configured backend Python environment:

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i7r.py tests/test_jcs_ascii_fastpath.py tests/test_granular_i7.py tests/test_granular_i6.py tests/test_granular_i5.py tests/test_granular_i4.py tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
python -m pytest -q -o addopts=''
python tools/granular_i7r_compare.py --npcs 100 --memories 1000 --actions 80
python tools/granular_i7r_compare.py --npcs 1000 --memories 10000 --actions 80
python tools/granular_i7r_offline_probe.py
python tools/granular_i7_endurance.py --actions 10000 --npcs 100 --memories 1000 --max-seconds 14400 --output <new-numerical-output.json>
```

These tools accept no existing Save path. Never publish local recovery credentials, databases, trust keys or signed raw operator reviews. Frontend: `npm test`, `npm run lint`, `npm run build`. No new UI is enabled and no new Edge gameplay PASS is claimed; Windows process-death tests exercise the actual Python fixture authority.

## Recommendation and next approval

| Area | Disposition / exact next boundary |
| --- | --- |
| Production integrity | Retain current full-audit policy. Prefix is diagnostic only, not a substitute for full corruption detection. |
| Logical fork | Offline proposal/demo complete; real canonical fork BLOCKED on FORK-1 lineage, revision, receipt, recovery and independent real-auth contract approval. |
| Corrupt pending input | Authenticated offline HOLD complete; queue disposition BLOCKED on ADMISSION-REPAIR-1 status/generation/CAS/recovery amendment. |
| Typed coverage | Original I6 field inventory remains; all unsupported owners/schema/validator/adapters remain gates. |
| I7 / I8 | I7 remains INCOMPLETE. No production activation, migration, source-combat or private-secret hold bypass. |

All prior review/matrix/I7 fields and original numerical evidence are preserved. No frozen normative contract, `runtime/store.py`, production Save, CP149/CP150, private pack, original Antigravity checkout or protected branch is modified. Publication includes original code/docs/numerical evidence only. Stop at the named protected boundaries and obtain explicit approval before implementing them.
