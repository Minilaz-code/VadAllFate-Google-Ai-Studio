# I6 limited format negotiation and read-only integration handoff

2026-11-01. **I6 ONLY. No granular gameplay activation, existing Save conversion or I8 execution.** Option C remains direct typed SQLite storage with native legacy readers; no mandatory paged JSON intermediary.

## Review identity

Paired branches: `codex/v2-granular-i6`, based exactly on backend `341cfa1ad166e564ecc91d6ae764aa4ce42b59b9` and frontend `0048187688703d829b21cf664ca55a34a6bfd6cc`. Final verified publication SHAs are in the delivery response; run `git ls-remote origin refs/heads/codex/v2-granular-i6` in each repository. No force push or main merge.

- [Backend branch](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i6)
- [Frontend branch](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i6)
- [Exact field ownership and integrity/old-runtime policy](V2-GRANULAR-I6-COVERAGE-AND-INTEGRITY.md)
- [Machine-readable field inventory](V2-GRANULAR-I6-FIELD-INVENTORY.json)
- [Original G01-G29 plus separate I6 partial evidence](V2-GRANULAR-ACCEPTANCE-MAP.json)

## Implemented contracts and files

`runtime/storage_formats.py`: version `I6.storage-capabilities.v1`; read-only persisted metadata resolver, consistent WAL snapshot and executable preflight. Results are LEGACY_SUPPORTED, GRANULAR_PREPARED_READ_ONLY, UNSUPPORTED_FORMAT, CORRUPT_OR_INCONSISTENT or MIGRATION_REQUIRED. Exact I5 mount/source/profile/head and legacy hash/identity/fence consistency determine selection, never client labels, AI or a filename. Only native legacy is playable; granularActions=false and migrationAvailable=false in every response. Missing granular binding on a valid native legacy Save preserves legacy behavior. Detached sentinel/rows or incomplete metadata cannot fall back to legacy.

`runtime/storage_inspection.py`: read facade reuses the exact existing SessionAuthRegistry HMAC/expiry/revocation verification through a subclass with read-only connections and no schema bootstrap. AudienceContext handles preview downgrade; only actual DM sessions may request another-character preview. Requested campaign and prepared logical Save must match trusted session and binding. Legacy uses native save-main/no alias because it has no persisted logical Save UUID; I6 does not invent one.

Its capabilities(), npc(id), play() and audit() methods have closed purposes; no SQL/raw database/generic entity API. The NPC projection authenticates selected physical rows against I4 paths, validates original source pins and caps memories at twenty. DM gets source provenance/private memories; host-player/observer/preview get public identity only. Native play reuses GameContentService.state_view with assigned-character permissions and a native-format snapshot read from one SQL snapshot, without conversion or a canonical writer.

`srd51_http_api.py`: authenticated GET `/api/v2/storage/capabilities` executes BEFORE gateway construction, including on a prepared disposable fixture. Missing Save hints are server-derived from persisted binding; supplied wrong Save/campaign fails. It never starts writable auth/bootstrap/Save services. Other attempted prepared gameplay gets HTTP 409 SAVE_FORMAT_UNAVAILABLE. Authenticated GET `/api/v2/storage/play` provides the native legacy read facade. Existing legacy APIs and requests without capability negotiation retain their native behavior. The ordinary HTTP gateway exposes no granular mutation, fixture activation, migration or raw NPC/SQL endpoint.

`v2_campaign_gateway.py` and `scripts/start-vadallfate-v2.ps1`: read-only preflight precedes writable startup. New existing unknown/empty/corrupt/granular containers refuse normal startup; genuinely nonexistent files keep existing fresh legacy bootstrap. Later authority opens recheck preflight. Prepared inspection does not use a writable gateway. This is cooperative preflight, not an OS file-identity/security sandbox against a hostile host swapping files after checks.

`granular/authority_storage.py`: only audit receives optional keyword record_verification=True, preserving every old caller's behavior. With False the SAME complete source/cache/event/receipt proof returns a snapshot report and never updates g_i5_audits. A read-only audit cannot refresh material write eligibility. No I5 commit/codec/hash/receipt/driver/schema behavior changes.

Frontend `services/storageCapabilities.ts` validates server capability versions/flags/campaign identity, checks session changes during requests, times out after five seconds and never caches another campaign's result. Only a 404 endpoint absence gives an explicitly labelled NOT_REPORTED/native legacy fallback. Auth/network/5xx/malformed replies fail closed. `CampaignManager.tsx` displays prepared/unavailable states, disables campaign actions until compatible and offers a read-only retry. No activation/migration control exists.

Test-only `tests/granular_i6_fixture.py` creates a fresh original fixture through real I5 authority, performs one real commit, then installs three disposable container-wide legacy canonical-write fences and fixture auth. No existing Save argument, normal runtime installer, second authority or current-state mutation is added. The original I5 SQL asset remains identical. `tests/test_granular_i6.py` covers actual archived old executable, live service capability preflight, native legacy, authorisation, corruption, restart and no writes. The existing I2 static test is narrowly extended for local imports in the two authorised read modules; its no-startup-import/no-driver-lifecycle restrictions remain.

## Supported compatibility evidence

| Scenario | Actual disposition |
| --- | --- |
| New runtime + native legacy Save | PASS: read-only detection, native projection and existing regression gameplay; no conversion. |
| New runtime + PREPARED fixture | PASS: real HTTP capability request without gateway/writer construction; bounded authorised inspection/full read-only audit; gameplay refused. |
| Old frontend + new backend | PASS for legacy request contract: unchanged old content/play request succeeds without new labels; no archived old-browser-bundle claim. |
| New frontend + actual old backend | PASS: actual archived I4 server on a newly created legacy Save, real Windows Edge labelled 404 fallback, usable native campaign controls/capacity and reload. No mock server in that test. |
| Prepared fixture in React | PASS: actual Python capability handler in isolated read mount, real Edge read-only label, disabled actions, reload and player private-memory denial. |
| Unknown/corrupt/incomplete metadata | PASS: explicit refusal, no repair/installation/conversion or fallback to gameplay. |
| Old executable + sealed I6 fixture | PASS for canonical fencing: archived I4 CampaignStore update/new campaign and full old gateway bootstrap fail without canonical changes. Operational schema/PRAGMA/auth/bootstrap work remains possible before failure. |
| Independently named Saves/campaigns | PASS for prepared binding/wrong-Save rejection and retained I5 isolation regressions. Whole-file branch migration/new logical IDs/portable session policy remain I8. |

The old-runtime source is exported from immutable I4 `1fc38b6c0a51cb7868c90ce2580f1b39ad59ef5c` into a temporary directory and actually executed, not replaced by a mock format predicate. New I6 inspection seals apply only to fresh fixtures; unsealed I5 fixtures retain their historical bound-campaign-only fences. No existing database receives this DDL. Never bypass the new launcher/preflight to open a real granular file with an old binary.

## Measured read/audit cost

| Measurement | 100 NPC /10,000 memories | 1,000 NPC /20,000 memories |
| --- | ---: | ---: |
| Capability median /max seconds | 0.0146 /0.0202 | 0.0183 /0.0220 |
| Bounded NPC median /max seconds | 0.1308 /0.1375 | 0.2236 /0.2481 |
| Independent full read-only audit seconds | 20.0572 | 42.2334 |
| Reopen and bounded projection seconds | 0.1294 | 0.1314 |
| Windows process peak working-set bytes | 107,708,416 | 187,072,512 |

Ten routine samples each; actual original fresh fixtures, WAL, foreign_keys=1, synchronous=FULL(2), no history trimming. Some regression load overlapped. Numerical evidence is in backend `docs/evidence/V2-GRANULAR-I6-{100,1000}-MEASUREMENTS.json`; main database bytes stayed equal throughout inspection. Logical-row equality tests additionally include operational and authority tables. Process peak covers setup, real seed commit and full audit, not just the routine read. Bounded reopen does NOT mean the full Save is verified: capabilities say NOT_FULLY_AUDITED, selected records say BOUNDED_PATH_CHECKED, full audit says FULL_AUDIT_COMPLETE only after verifying the exact returned snapshot. The twenty-memory result cap is not a worst-case SQL row-visit/time guarantee: ordering by causal event revision may scan/sort the selected NPC's history. Index/query-plan and long-reader budgets remain production review work. Full verification still costs ~20-42 seconds. The I5 mandatory material reopen/checkpoint audits and revision-age gate are unchanged. No background verifier or activation shortcut was introduced.

Native legacy preflight is measured separately on new original structural-size fixtures: 2,194,167 document bytes (100 NPC/10,000 memories) took median 0.0539s, max 0.1835s; 4,441,867 bytes (1,000 NPC/20,000 memories) took median 0.1001s, max 0.1764s. These fixtures measure native JSON/hash size, not validated complete gameplay. Reproduce with the same tool plus --legacy-only. Normal preflight scans/hashes legacy rows and repeated authority opens add linear legacy work; neither those costs nor the 64KiB legacy request risk are eliminated. Numerical artifacts are V2-GRANULAR-I6-LEGACY-{100,1000}-MEASUREMENTS.json. No source conversion or existing Save was used.

The actual Windows PowerShell launcher was also executed with -RuntimeDb pointing to a newly created prepared fixture and -CheckOnly: it returned SAVE_FORMAT_REFUSED before writable startup and left its SQLite bytes unchanged. The exact documented Python read example was executed successfully.

## Verification commands and actual results

Backend, from its configured Python environment:

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i6.py tests/test_granular_i5.py tests/test_granular_i4.py tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
python -m pytest -q -o addopts=''
python tools/granular_inspection_benchmark.py --npcs 100 --memories 10000
python tools/granular_inspection_benchmark.py --npcs 1000 --memories 20000
```

Final targeted: **328 passed in 284.02s**, including all 21 I6 cases. Final broad: **833 passed, 2 skipped in 1063.42s (17m43s), after the final HTTP and preview integration corrections**. Earlier broad before final HTTP/preview integration: 832 passed, 2 skipped in 1061.99s; final results above supersede that run. Frontend: **157 tests passed**, TypeScript check and Vite production build passed (existing native-config/large-chunk warnings remain). **Three actual Windows Edge cases passed across isolated runs**: two prepared/synthetic-negative cases (final 6.7s), one against actual old backend (9.0s). Synthetic unsupported-format/404 HTTP cases are identified in the test; they are not substituted for the separate actual old-backend run.

Reproduce Edge safely: start `tools/granular_inspection_benchmark.py --npcs 2 --memories 2 --serve-port 8896 --session-output <temporary-local-session-file>`; start this frontend Vite on 3196 with VITE_VADALLFATE_V2_API_URL=http://127.0.0.1:8896/api/v2. Set VADALLFATE_I6_SESSION to that local-only credential file and VADALLFATE_E2E_URL=http://127.0.0.1:3196; run Playwright `e2e/storage-compatibility.spec.ts` excluding the actual-old-backend case. For the actual-old test, stop that isolated server, run `tools/i6_old_backend_server.py --session-output <another-temporary-local-session-file>` on the same reserved test port, set VADALLFATE_I6_OLD_BACKEND=1 and select its case. These tools create their own temporary databases; they accept no existing Save path. Do not commit their credential files, generated databases, screenshots or browser reports.

## Minimal original disposable read example

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
sys.path.insert(0, 'tests')
from granular_i6_fixture import create
from vadallfate.runtime.storage_inspection import Inspection
from vadallfate.runtime.storage_formats import preflight_writable

with TemporaryDirectory() as directory:
    ticket, tokens = create(Path(directory) / 'i5-disposable-inspect.sqlite')
    dm = Inspection(ticket.path, 'campaign.original', 'save.original', tokens['dm'])
    assert dm.capabilities()['status'] == 'GRANULAR_PREPARED_READ_ONLY'
    assert dm.npc('npc.0000')['memories']
    assert dm.audit()['verification'] == 'FULL_AUDIT_COMPLETE'
    player = Inspection(ticket.path, 'campaign.original', 'save.original', tokens['player'])
    assert player.npc('npc.0000')['memories'] == []
    try:
        preflight_writable(ticket.path)
    except ValueError:
        pass  # expected: normal gameplay writer refuses the prepared container
    else:
        raise AssertionError('prepared gameplay launch allowed')
```

## Preservation, integration and next gate

Publication audit: PASS, 22 backend and 12 frontend changed text files checked for personal paths, credentials/private keys, binary/restricted-content/generated-file names and redistribution rights. Final staged/committed files and messages are rechecked before pushing. Only code, original CC0 fixture metadata/field names, tests and numerical evidence are published. No private packs, adventure text, artwork, credentials/session record, generated database or personal absolute paths belong in the changes. Original design-review bytes and every prior G01-G29/I4/I5 field are retained; I6 annotations remain partial. CommitAuthority, CampaignStore, I2/I3/I4 meaning, I5 material commit path, legacy staged bytes/hashes/receipts, frozen schemas and production registrations are unchanged. No production Save, CP149/CP150, original Antigravity checkout or protected branch is modified.

Antigravity: fetch/review the paired I6 branches in your own integration checkout. Integrate the versioned read modules and preflight/API changes together with the React capability client/manager. Keep existing native legacy configuration/defaults. Test GET storage/capabilities using a real existing session; an old backend's missing endpoint stays labelled native legacy only. Do not register PREPARED fixtures as playable, call fixture bootstrap from application startup, install granular schemas into Saves or wire new typed gameplay writes.

**STOP AFTER I6.** Remaining approval: exact production typed owners/schemas/validators/content-session adapters and operational budgets before any activation; I8 needs separate explicit copied-Save migration/rollback/export approval, lossless field/evidence mapping and old-binary/session policy. No I8 execution or live typed writes are authorised here. Source-combat and private-secret generative reasoning holds remain. Existing legacy long-campaign request growth is not fixed by capability negotiation.
