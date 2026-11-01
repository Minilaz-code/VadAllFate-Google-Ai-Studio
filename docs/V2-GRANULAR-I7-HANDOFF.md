# I7 extended first-slice reliability handoff

2026-11-01. **I7 acceptance remains INCOMPLETE unless the 10,000-action and independent logical Save gates are met.** No full campaign migration/production activation is claimed. Option C remains direct typed SQLite with native legacy readers, one existing R1 authority and no mandatory paged JSON.

## Review identity and scope

Both repositories use `codex/v2-granular-i7`, based exactly on backend `e8642f0dbe2d2678065cc252d8be150802b96253` and frontend `48e72260e73c178dfd54b54ba94c57eea8cebfd5`. Final verified remote SHAs are in the delivery response; verify with `git ls-remote origin refs/heads/codex/v2-granular-i7`. No protected merge or force push.

- [Backend branch](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i7)
- [Frontend branch](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i7)
- [Coverage reconciliation and exact approval gates](V2-GRANULAR-I7-READINESS.md)
- [Original G01-G29 plus additive I7 evidence](V2-GRANULAR-ACCEPTANCE-MAP.json)

Frontend executable code is unchanged; this repository receives the paired evidence/readiness/register handoff. All new databases, backup sources/children, deliberate corruption, lock injectors and archived-executable runs are exclusively generated original disposable fixtures. Production Saves, private source packs, CP149/CP150 and Antigravity checkouts are untouched.

## Actual implementation changes

Only production-side change: `runtime/granular/authority_storage.py::verify_receipt` computes the same SHA256(b"VAF-I5-ATOMIC-v1\0" + raw) after the unchanged strict decode has already validated those exact immutable bytes. Previously fingerprint(raw) invoked a second complete decode of the same bytes. Every schema/size/canonicality/module/source/target/evidence check remains; public codec/fingerprint functions are unchanged and still validate ingress. No acceptance cache persists between audits. Full source/tree/cache/event/receipt reconstruction, eligibility every 100 revisions and mandatory reopen/checkpoint audits remain.

`tests/granular_i7_crash_worker.py` and `tests/test_granular_i7.py` add real Windows abrupt-exit coverage at every I5 stage plus after admission, after dispatch, before staging, before/after validation, partial hash-node insertion and partial applied-intent insertion. Connection proxies inject termination into the SAME authority transaction; they acquire no writer capability or independent connection and never commit. Reopen recovers exact approved/staged bytes and scripted result, then at most one canonical memory, relationship consequence and receipt. No model/RNG result is regenerated.

Tests also cover full SQLite backup/divergence, wrong campaign/Save/preview projections across reopened copies, unknown/corrupt pending delivery, an external reservation-lock injector that writes no data, long-lived WAL reader/checkpoint contention, process termination during checkpoint and the actual archived I4 gateway. The existing I2-I6/R1 contracts and tests remain; no new production state module, handler, gateway dispatch, schema or migration is installed.

Tools `granular_i7_endurance.py`, `granular_i7_audit_profile.py`, `granular_i7_wal_probe.py` create their own new fixtures. They accept no production Save path. Endurance's run-local SQLite plus ticket/credential are intentionally retained privately in a tool-created temporary directory; published artifacts contain original numerical metadata only, never the private recovery credential/path or generated database. The action budget defaults to 10,000; the measured run uses an explicit 1,800-second action-admission budget. Audits/final verification may extend total wall time. Any budget stop is INCOMPLETE, never a manufactured PASS. Small profiling samples are labelled NOT_10000.

## Actual results

Final targeted I7/I2-I6/R1/JCS: **360 passed in 339.22s**, including all 32 I7 cases.

Final broad backend: **865 passed, 2 skipped in 1110.47s (18m30s)** after final runtime/test changes.

Frontend: **157 tests passed**, TypeScript check passed, Vite production build passed (existing native-config/large-chunk warnings retained). No new UI/Edge gameplay activation is claimed; Windows process-death/restart tests execute the actual Python authority.

### Sustained authoritative attempt

**INCOMPLETE_TIME_BUDGET: 1,401 /10,000 actions committed.** The explicit action-admission budget was 1,800 seconds; mandatory final audit/checkpoint/reopen extended total elapsed time to **1,924.155s**. This is a completed, verified partial run, not proof that 10,000 actions cannot ever finish with a longer budget. No 10,000-action PASS or unrestricted latency SLA is claimed.

| Actual main-run measurement | Result |
| --- | ---: |
| Initial NPCs /memories; final memories | 100 /1,000; 2,401 |
| Fully framed first /last request bytes | 11,465 /11,491 |
| Admission p50 /p95 /p99 /max seconds | 0.1510 /0.7318 /1.6514 /3.7173 |
| Dispatch p50 /p95 /p99 /max seconds | 0.0050 /0.3506 /0.8593 /3.9969 |
| Staging p50 /p95 /p99 /max seconds | 0.1671 /0.7047 /1.8374 /4.6297 |
| Material commit p50 /p95 /p99 /max seconds | 0.2170 /0.8531 /2.3594 /4.7704 |
| SQL rows/action first 50 /last 50 range | 31-52 /31-53 |
| WAL frames/action first 50 /last 50 range | 63-91 /70-112 |
| Maximum observed WAL bytes | 213,304,792 |
| Final SQLite bytes /WAL bytes | 71,749,632 /0 |
| Process CPU seconds /peak working-set bytes | 1,192.766 /58,060,800 |
| Sparse Python allocation peaks at actions 1 /100 /1,000 | 234,436 /228,000 /238,334 bytes |
| Full audit at revision 100 /600 /1,401 | 5.712s /20.546s /40.506s |
| Final checkpoint /reopen full audit | 40.017s /41.419s |

Quantiles are nearest-rank from 1,398 untraced actions; three traced observations remain in the raw data. Maximum over ALL 1,401 material commits was also 4.7704s. Audit at revision 1,200 reached 47.910s under concurrent load, so times are not strictly monotonic. Checkpoints at revisions 500/1,000/final all truncated WAL to zero without deleting history. SQL/write amplification grows modestly with tree/index layout; raw per-action records retain every observation. The high p95/p99 and full-history verification costs remain operational risks, not resolved production targets.

Final counts independently matched: 1,401 receipts/ledger/outbox/admissions; 2,802 applied intents; 1,501 native events; 2,401 memories. No pending admission remained. Cold read-only SQL also verified relationship revision sum 1,401 and zero revised NPC identity records. Exact-once last-request retry and mandatory full reopen matched the final authoritative snapshot. The generated SQLite and local-only recovery credential are retained; an ignored backend private-content/i7-local-recovery index identifies these run-owned artifacts without publishing their paths/secrets.

The measured limiting constraint is throughput plus the required repeated full-history audit work, not request-byte overflow: frames remained below 16KiB and no rejected/poisoned action ended this run. Running longer under the unchanged I7 contracts remains possible but unverified; changing the integrity policy requires explicit review. The first-slice clock stays fixed and NPC population is genesis-defined; broader world/quest/routine progression is not simulated.

Per-action original data and nearest-rank p50/p95/p99/max, admission/dispatch/staging/material times, SQL affected rows, physical WAL frames, page sizes, sparse Python allocation samples and process CPU/RSS are in backend `docs/evidence/V2-GRANULAR-I7-ENDURANCE-100.json`. Traced samples are labelled and excluded from ordinary untraced quantiles; all raw observations remain available. Timing context includes concurrent regression/profiling load; this is not a controlled latency SLA. All writes retain synchronous FULL, foreign_keys ON and WAL. No history is trimmed.

The 100-NPC initial-1,000-memory and 1,000-NPC initial-10,000-memory profiling samples each completed 100 real material commits, full reconstruction, exact-once receipt retry, checkpoint and close/reopen. These test growing history at different genesis populations. The 1,000-NPC sample used 11,466-11,474-byte frames, material p50 0.3359s/p95 1.4149s/p99 and max 4.4385s, 27.061s final full audit, 25.718s reopen and 114,741,248-byte peak working set. They do NOT test dynamic NPC creation or satisfy 10,000 actions. The I5 entity identities remain immutable; a growing live population needs a separate supported create contract.

### Audit profile and safe improvement

Matching 100-NPC/1,000-initial-memory/100-action samples produced exactly equal final snapshot/root/evidence. Observed untraced full audit: baseline **7.423s**, reduced-duplicate implementation **5.979s**. These observations overlapped different regression loads; no controlled percentage guarantee is claimed. Profiled audit totals: 24.027s versus 18.410s, with **200 versus 100 complete request decodes** for 100 receipts. That exact eliminated duplicate work is the reliable comparison; cProfile timings are not ordinary transaction latencies.

Separate current 100-NPC/10,000-memory/10-action full audit: **20.996s unprofiled**, **67.739s under cProfile**. Inclusive source assembly/native checks/SQL 9.600s; independent reconstruction/record hashing 49.693s; cache verification/node hashing 7.215s; event-chain append 0.154s; receipt validation 0.802s. SQLite built-in self time 0.941s; hash/JCS self time 48.577s. Cumulative categories overlap and must not be summed. The full source profile reports 81,968 execute calls and fetch costs; records are independently rebuilt rather than accepting a stored root. Much of the remaining cost is Python canonicalisation/hash/validation, not raw SQLite I/O. Source-hash meaning and every independent integrity phase are retained.

Numerical profiles: `V2-GRANULAR-I7-PROFILE-BASELINE.json`, `PROFILE-OPTIMIZED.json`, `PROFILE-1000.json`, and `AUDIT-COMPONENTS.json` under backend docs/evidence. No read-only bounded result is called a full audit. Any proposed prefix/deferred policy changes are held at the exact readiness gate.

### WAL, checkpoint and locked conditions

Twenty real commits with a pinned reader grew WAL to **6,699,152 bytes /1,626 frames**. Reader remained at revision 0 while writer reached 20. Busy checkpoint failed after **7.237s including its required full audit** and WAL remained **6,703,272 bytes** (operational audit writes can add frames). After reader closure, audited truncate completed in **1.040s**, WAL became zero, and reopen/full audit took **1.023s** with identical state.

The process-death test kills an actual authority process while checkpoint truncation is blocked by a long reader, then reopens, verifies the committed snapshots/receipts and checkpoints successfully. The external lock injector reserves SQLite without any canonical data write or second authority; admission fails boundedly before a queue row is created, then a later valid action succeeds. Current fixture BEGIN contention surfaces sqlite3.OperationalError; no new live gateway error contract is invented. This is tested fault injection, not support for simultaneous independent canonical writers.

### Physical copies versus independent logical Saves

Whole-SQLite backup preserves complete typed/evidence/receipt history. Parent-only and child-only commits diverge into different roots without changing the other physical file. Stale/cross-root requests fail after divergence. However, backup also copies logical Save ID, fixture cookie and authentication secrets. A valid pinned pre-divergence frame is accepted in both copies. A copied token is valid in the copied realm; wrong client labels are rejected but do not create a new realm.

**Independent logical Save branching is BLOCKED.** No authorised fixture rebinding operation exists. Changing only a label/UUID would invalidate snapshot/genesis/historical receipt semantics. Existing I4 pure snapshot tests distinguish identical content with different Save identity, but that does not implement an actual authoritative fork of a retained receipt chain. No historical bytes/receipts are rewritten; full rebind/fork/session semantics are an explicit next gate, not I7 PASS.

### Security and incompatible versions

DM private-memory/source provenance and player/observer/preview denials persist across read-only reopen and newly backed-up files. Forged actor/source/pin/module/replay cases retain I3/I5/I6 regression coverage. Unknown codecs/corrupt staged requests cannot commit and remain a reviewed pending hold with no fake receipt or silent skip. A complete operator repair/disposition workflow is still required; current-snapshot corruption is not falsely marked stale.

The actual archived I4 executable (`1fc38b6c0a51cb7868c90ce2580f1b39ad59ef5c`) on a newly sealed fixture changed no existing table rows and no canonical world/evidence state. It created sixteen operational/authoring/asset/FTS tables and rewrote the local bootstrap file bytes. No authentication-row delta was observed in this particular already-provisioned fixture. Exact table names and boolean effects are in `V2-GRANULAR-I7-OLD-RUNTIME.json`; no secret values are published. This is neither zero operational writes nor universal protection against arbitrary old binaries with filesystem access. I6 launcher/preflight and fresh-fixture seals remain unchanged.

## Reproduction

From the configured backend Python environment:

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i7.py tests/test_granular_i6.py tests/test_granular_i5.py tests/test_granular_i4.py tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
python -m pytest -q -o addopts=''
python tools/granular_i7_endurance.py --actions 10000 --npcs 100 --memories 1000 --max-seconds 1800 --output <numerical-output.json>
python tools/granular_i7_audit_profile.py --npcs 100 --memories 10000
python tools/granular_i7_wal_probe.py
```

Frontend: npm test, npm run lint, npm run build. A longer endurance budget can be supplied explicitly; an unexecuted longer run is not acceptance evidence. Never point these tools at real Saves or publish their local recovery ticket/database.

## Dispositions and preservation

| Requirement | Disposition |
| --- | --- |
| 10,000 actions | INCOMPLETE: 1,401 /10,000 within the declared budget; actual count/results above, not inferred from samples. |
| Material fault/restart matrix | First-slice real-process and controlled-failure proof; every verified case listed in tests. |
| Independent Save branching | PARTIAL physical copy/divergence; BLOCKED independent logical identity/rebinding/auth realm. |
| WAL/concurrent readers/locks | PASS for measured original disposable scenarios; no general multiwriter claim. |
| Audit performance | Safe duplicate decode removed; full checks/gate preserved; growing full-history work remains an operational blocker. |
| Old runtime | PASS canonical fences on sealed fixtures; operational/bootstrap writes explicitly remain. |
| Role/source/knowledge | PASS supported first-slice projections/rejections; copied identity caveat retained. |
| Full production coverage / I8 | BLOCKED by every unsupported I6 owner/schema/validator/adapter and readiness gates. |
| Publication/privacy | PASS: 19 backend and five frontend changed text files reviewed; original numerical evidence/docs only, with final staged/committed privacy checks repeated before push. |

Original review and every prior G01-G29/I4-I6 field are preserved. New I7 evidence is scoped; no full-world or migration grade is promoted from unit tests. No source combat/private-secret model hold is bypassed. No private content, restricted artwork, personal absolute path, credential, generated Save or proof response is committed. Existing canonical schemas, R1 CommitAuthority/CampaignStore/DTOs/legacy staging/hash semantics, I2-I6 runtime behavior and Antigravity checkouts are preserved except the explicitly described equivalent audit optimisation.

**STOP after I7 work.** This handoff does not authorise I8, normal typed gameplay, production Save conversion or activation. Next review must address logical fork/session identity, corrupt pending disposition, full typed owner coverage and a practical integrity/endurance policy before any future disposable playable migration test. Exact proposed review units are in the readiness document.
