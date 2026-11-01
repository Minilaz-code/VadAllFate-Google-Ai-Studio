# I5 controlled atomic granular authority handoff

2026-11-01. **PASS for the approved first slice in newly created disposable databases only. PREPARED, disabled in gameplay. STOP after I5.** No existing Save migration or legacy long-campaign-limit fix is claimed.

## Review identity

Both repositories use `codex/v2-granular-i5`, based exactly on backend `1fc38b6c0a51cb7868c90ce2580f1b39ad59ef5c` and frontend `8e7c7fa4a67179c3e3012187108922f50125c89e`. Final full publication SHAs are recorded in the delivery response and can be verified with `git ls-remote origin refs/heads/codex/v2-granular-i5`. This avoids a self-referential commit hash in its own file.

- [Backend branch](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i5)
- [Frontend branch](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i5)
- [Exact versioned schema/authority specification](V2-GRANULAR-I5-ATOMIC-SPEC.md)
- [All original G01ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“G29 cases with separate I5 dispositions](V2-GRANULAR-ACCEPTANCE-MAP.json)

Frontend changes are documentation only. Antigravity should review these branches; do not enable the fixture route in the V2 app. Existing application gateways, UI, authentication, ContentResolver, Python AI Harness, normal migration dispatch, CampaignStore and frozen normative schemas remain unchanged.

## Supported implementation and ownership

The existing `runtime/commit_authority.py` owns the only writer capability, transaction and final acknowledgement. Its guarded `granular_fixture` method is unreachable from normal gateway/startup dispatch and refuses ordinary stores. Eight existing legacy entry points gain no-op-by-default guards; after removing those statements their function ASTs equal the baseline. Native legacy campaigns, including one sharing a disposable container, retain their old route.

New `runtime/granular/authority_contracts.py`, `authority_validation.py`, `authority_storage.py`, `authority_integration.py`, `authority_core_v1.sql` and `disposable_fixture.py` implement exact adapters, independent validation, connection-bound affected-row updates, source/cache/evidence audits, fresh-only installation and isolated capabilities. `pyproject.toml` packages the new SQL asset. The existing I2 driver/schema, I3 contracts/codec, I4 hash profile/goldens, old DTOs, receipt structures and hash functions are preserved. One obsolete I2 static import-ban test is narrowed to forbid startup imports while allowing the explicitly approved guarded authority method; lifecycle/no-second-writer assertions remain.

Immutable NPC identities are created at trusted fixture genesis from a pinned original CC0 registry. The sole material operation is a compound authorised private unverified TOLD memory plus evidenced relationship adjustment. The actor is a read-only original identity reference, not combat/character state. DM admission pins the complete prepared candidate and exact scripted result; no worker can substitute another valid delta or result. Independent validation repeats on material commit. The registry/capabilities are fixture implementations, not real pack installation or application login integration.

One SQLite transaction commits the actual native RuntimeEvent, typed memory and relationship/history, authenticated paths, one head revision, applied intents, ledger, outbox, proof, receipt and final admission status. All fourteen tested fault stages yield rollback or exact-once recovery. Real subprocess termination during a row write and after COMMIT proves restart recovery, rather than merely returning staged bytes. Duplicate response-loss replay returns the same receipt without another event, memory, relationship delta or revision. Unrelated canonical records and legacy sentinel are unchanged.

R1 request IDs remain globally unique: admission atomically reserves each complete approved request ID, with triggers checking committed IDs and pending reservations. Collisions reject before queue insertion. Entity/action/nonce IDs remain campaign-scoped and are exercised in two independent worlds. Stale inputs can receive an explicit authenticated stale disposition without rebasing or deleting retained evidence.

## Actual measurements

| Measurement | 100 NPC /10,000 memories | 1,000 NPC /20,000 memories |
| --- | ---: | ---: |
| Fully framed request bytes | 11,377ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“11,377 | 11,378ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“11,378 |
| Material commit median /max seconds | 0.3190 /0.4165 | 0.3215 /0.4830 |
| Actual affected SQL rows | 46ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“53 | 51ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“61 |
| Physical WAL frames per material commit | 71ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“78 | 78ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“90 |
| Records hashed per material action | 2 | 2 |
| Seed and initial verification seconds | 46.555 | 106.139 |
| Independent full rebuild/evidence audit seconds | 20.255 | 38.449 |
| Checkpoint including full audit seconds | 21.964 | 40.153 |
| Reopen including mandatory full audit seconds | 20.095 | 40.495 |
| Windows process peak working-set bytes | 100,913,152 | 181,575,680 |
| SQLite bytes after close | 14,897,152 | 32,530,432 |

Five material actions per population, original CC0 content, Windows Python, WAL and synchronous FULL, foreign keys ON. Final untraced runs include the request-ID reservation correction. Some regression load overlapped; these are observations, not an SLA. Admission/dispatch/staging is measured separately in each JSON and is additional latency. Affected rows include history/evidence/cache/head writes, not only two canonical records. WAL frames are actual file-framing deltas with auto-checkpoint disabled only on these temporary files; checkpoints are explicit and durability is retained. Whole-process peak includes generation/audits. Main disk size includes retained original memory and immutable approved/staged history; nothing was trimmed.

Numerical artifacts and all per-action times/CPU/path work are in backend `docs/evidence/V2-GRANULAR-I5-{100,1000}-MEASUREMENTS.json`. Separate `*-ALLOCATION-MEASUREMENTS.json` are traced allocation baselines before the final reservation index, explicitly labelled; do not use their timings or SQL sizes as final results. No previous pure-hash 63ms result is presented as transaction latency. With only five samples, nearest-rank p95/p99 is the observed maximum: the provisional 250ms small-world target is not met; larger-world maximum is below 500ms in this run, without establishing an endurance SLA.

Full audits independently rebuild actual source rows, cache paths, event chain and receipt/ledger/outbox/approval consistency. Required at genesis/reopen and before checkpoint; ordinary actions verify affected records/paths only. New work is held after 100 revisions without full audit. Corruption in untouched rows may be detected at the next full audit, not every action. The 20ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“40 second verification costs require production operational review; full-world verification is not constant-time.

## Reproduction and actual verification

Run from the backend checkout using its configured Python environment:

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i5.py tests/test_granular_i4.py tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
python -m pytest -q -o addopts=''
python tools/granular_authority_benchmark.py --npcs 100 --memories 10000 --actions 5
python tools/granular_authority_benchmark.py --npcs 1000 --memories 20000 --actions 5
```

Targeted final result: **307 passed in 166.58s**, including 59 I5 cases. Broad final result: **812 passed, 2 skipped in 882.06s (14m42s), after the final code correction**. The documented minimal execution and published golden outcome were also executed against the final code and matched. Both benchmark commands actually completed with independent root equality, restart verification and exact receipt retry. Frontend: **152 tests passed**, TypeScript check passed, Vite build passed; existing native-config and large-chunk warnings remain. No new UI/Edge granular gameplay PASS is claimed because activation is prohibited.

The test helper `tests/granular_i5_fixture.py` constructs the exact I3 candidate and approved outer frame. `tests/test_granular_i5.py` exercises the real authority rather than a parallel fake store. Original expected outcome/root/request metadata and a frozen-schema-valid fixture module descriptor are in `tests/fixtures/granular-i5/`, with CC0 rights. Benchmark/test factories accept only exclusively new `i5-disposable-*.sqlite` files; reopen requires the matching in-memory ticket and verifies marker/cookie read-only before any writer opens. No generated database is committed.

## Minimal disposable execution

From the backend checkout (test helpers installed on the import path):

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
sys.path.insert(0, "tests")
import granular_i5_fixture as worker
from vadallfate.runtime.granular import disposable_fixture as fixture

with TemporaryDirectory() as directory:
    ticket, store, authority, data = fixture.create(
        Path(directory) / "i5-disposable-example.sqlite")
    dm = data["campaign.original"]["sessions"]["DM"]
    candidate = worker.request(authority, dm)
    raw, ordinal, token = worker.stage(authority, candidate, dm)
    receipt = authority.granular_fixture(
        "commit", raw=raw, ordinal=ordinal, token=token, session=dm)
    before = authority.granular_fixture("audit", campaign="campaign.original")
    store.close()
    store, authority = fixture.reopen(ticket)
    recovered = authority.granular_fixture(
        "recover", campaign="campaign.original", ordinal=ordinal,
        token=token, session=dm)
    repeated = authority.granular_fixture(
        "commit", raw=recovered, ordinal=ordinal, token=token, session=dm)
    assert repeated == receipt
    assert authority.granular_fixture(
        "audit", campaign="campaign.original")["root"] == before["root"]
    store.close()
```

This is an original scripted fixture, not an AI call or a suggested game integration endpoint. It creates its own temporary file and cannot accept an existing Save for conversion.

## Publication and preservation audit

Changed-file audit covers 25 backend text files and five frontend documentation files against the approved I4 baselines. It rejects personal Windows/home paths, credential/private-key signatures, binary content and generated/private-content/database/image/archive paths; retained numerical JSON was decoded and normalised. All new statements, NPC definitions and scripted replies are original CC0 fixture material; no commercial adventure text, restricted artwork, private source pack, real-provider output, session secret, ticket cookie or generated database is included.

The original design-review bytes and every pre-existing G01â€“G29 field/I4 annotation are preserved. Existing CampaignStore bytes are identical, and existing CommitAuthority method ASTs match after removing only eight approved default-no-op guards. No frozen schema, legacy codec/receipt/DTO/hash implementation, I2/I3/I4 module or frontend executable file changes. Both original Antigravity checkouts remain clean. Production Saves and CP149/CP150 were not opened for conversion or modified. Only this I5 branch is to be published; no force push or protected-branch merge.

## Requirement dispositions and remaining approval

| Requirement | Result / scope |
| --- | --- |
| Explicit I2/I3/I4/R1 mappings | PASS: versioned adapter/spec; old representations preserved. |
| Complete independent first-slice validation | PASS: session/owner/Save/module/pins/clock/I2+I4 targets/approved bytes; unsupported mechanics rejected. |
| One real atomic sole-authority material commit | PASS: two affected canonical rows plus all required event/evidence/receipt/head effects. |
| Fault recovery and exactly-once | PASS: injected stages, real process death, durable restart and response-loss replay. |
| Campaign/Save and knowledge isolation | PASS for fresh independent fixtures and bounded DM/player/own-NPC projections. |
| Growing first-slice capacity | PASS for measured populations and five actions each; 10,000-action endurance, comprehensive world fields and production latency held. |
| Legacy/frozen contracts | PASS: regressions and unchanged core bytes/AST checks; no existing Save opened for conversion. |
| Real gameplay, migration, old-client negotiation | HELD: I6/I8, no activation or conversion. |
| Real model/source-combat/private-secret reasoning | HELD: no provider call; scripted ORIGINAL_SCRIPT_NOT_AI evidence only. |

Dynamic NPC edits, WITNESSED source admission/fact promotion, general beliefs/party disclosure, quest/objective/schedule/inventory/spatial/homebrew fields, real ContentResolver/session adapters, multiwriter/long-reader stress, portable export, full-file branching and old-executable prewrite refusal are not implemented by this slice. Original G01ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“G29 full-acceptance statuses remain unchanged, with separate partial I5 evidence rather than blanket PASS.

**Next approval gate: I6 live capability/format negotiation only after reviewing exact module/content/session adapters, complete owner/field coverage, old-reader refusal before writable open, latency/audit policy and application security/restart tests. I8 copied-Save migration, rollback and export remain separately gated.** Do not select this fixture mode for real Saves. No automatic continuation beyond I5, no main merge, production data change or competing authority is authorised.
