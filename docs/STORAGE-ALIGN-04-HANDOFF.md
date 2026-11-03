# STORAGE-ALIGN-04 review handoff

Paired review branch `codex/v2-storage-align-04`. Bases: backend `b2cf9460d7f5295118ef51757de262e3b6829e87`, frontend `82116ba0c5233eae6453aac8ef6056b71295ff2a`. Exact published heads are delivered separately, avoiding self-referential commit identifiers. No main merge or production activation.

## Delivered scope

The existing connected application now browses a real approved source catalogue, creates NPCs during play through R1, preserves recurring/dormant individuals, uses independent character-owned consumable stacks, runs public d20 requests and DM-confirmed physical reports, and completes a bounded original encounter. This is the controlled first slice, not general D&D rules or production migration acceptance.

The source catalogue and runtime instances are separate. The installed application fixture contains220 original CC0 NPC definitions and initially zero runtime NPCs. Source definitions are version/hash-pinned read-only. Source-backed creation writes binding+profile to Save; generated unnamed creation adds a separate approved Save-local definition. No WORLD/ADVENTURE/HOMEBREW write occurs during gameplay. Multiple individuals share a definition without sharing memories, HP or actor-specific trust.

SAVE > HOMEBREW > CAMPAIGN > ADVENTURE/REGION > WORLD > RULES remains binding. Original source pack adapters reuse ContentResolver. Source directory pagination and instance/history queries are indexed and bounded. NPC32 was a fixture restriction and is removed; page20/max30 is a workload bound, not a population limit. A 2500-definition source probe and40 runtime instances were exercised; this does not prove indefinite production capacity.

See [dynamic entity contract](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-storage-align-04/docs/STORAGE-ALIGN-04-DYNAMIC-ENTITY-CONTRACT.md) for exact identities, source layers, rights, operations, bounds, lifecycle and authority ownership.

## Real Windows / Edge journey

Actual headed Edge against the owned Python/React launcher passed the complete journey (Playwright list reporter:1.6minutes case,1.7minutes total; rounded output). Full Python/React shutdown and restart then reproduced exact A/B projections, individual histories/relationships/resources, roll outcomes and encounter state (7.2s case).

- DM browsed source pages and inspected three exact source definitions; then created two independent instances of one original source and an unnamed original traveller.
- A structured transient proposal caused no canonical revision. Human approval established the traveller, subsequently named Rowan under the same instance ID. A conversation remained after dormancy, indexed rediscovery and explicit reactivation.
- First source individual retained one private memory; its same-source twin retained none. Rowan retained its own separate memory and directed trust. Player projection omitted private NPC memory/trust.
- Invited Ada used her owned balm: HP12->16, quantity2->1. DM-authorised transfer moved one unit into Ben's distinct owned stack: final quantities0/3. Ben remained HP9.
- Server-generated public d20 resolved to4. A player's physical17 remained pending until a distinct DM confirmation; both results persisted as resolved/completed records with native evidence.
- DM selected the genuine source-created runtime opponent, started initiative for two PCs plus that NPC, applied/removed supported Prone, resolved an authorised attack, advanced the turn and ended the encounter. Actual hit: d20=14, bonus2 vs AC12, damage die1+bonus1=2; correct NPC HP8->6. Initiative and final outcome remain persisted after encounter end.
- Master World Clock advanced5minutes. SaveB, against identical baselines, retained zero NPC instances, original HP12/9, original stacks2/2, no rolls and no encounter consequences.
- All five baseline file hashes remained unchanged. Explicit independent audit through the authenticated gateway passed. No model inference or full-history foreground audit was used.

The rate limiter remains120 requests/minute per client address. Accelerated testing hit it. Controlled-profile transport now honours429 with bounded backoff and exactly the same request bytes/headers/nonce; session/Save changes cancel before another submission. Other errors do not auto-retry. New adventure intents obtain a current snapshot before submission; R1 never rebases an admitted request. Real journey duration includes normal UI refresh and rate-budget behaviour. No security limit was raised to obtain PASS.

## Acceptance matrix

| Case | Result / evidence |
|---|---|
| 1 mount200+ approved definitions | PASS:220 installed original source definitions; ContentResolver validation/pins |
| 2 search/page catalogue | PASS: actual UI pages20, exact name/ID API and indexed lookup probe |
| 3 exact source resolution | PASS: actual UI inspected source000020/21/22 |
| 4 unnamed NPC creation | PASS: explicit Human Sovereign R1 action, Save-local definition |
| 5 name same individual | PASS: Rowan retains UUID, source, memories and relationships |
| 6 recurring after restart | PASS: exact complete application restart comparison |
| 7 shared template isolation | PASS: two source instances, separate memory/HP state |
| 8 dormancy/reactivation | PASS: retained identity/history; no pruning or continuous processing |
| 9 two characters | PASS: individually owned Ada and Ben |
| 10 item definitions/instances | PASS: pinned original balm, distinct owned stack identities |
| 11 targeted inventory action | PASS: consumption plus conserving transfer through R1 |
| 12 permission/unchanged rows | PASS: negative ownership checks and prior SA03 isolation tests preserved |
| 13 approved runtime opponent | PASS: source-created original training template; local unarmed NPC refused |
| 14 digital roll | PASS: existing secure HMAC rejection sampler, no browser faces |
| 15 physical lifecycle | PASS: saved pending report, separate DM approval; rejection/restart tests |
| 16 encounter start/finish | PASS: existing combat component, closed supported original rules |
| 17 initiative/HP/conditions/results | PASS: native Save/evidence and restart equality |
| 18 exact instance targets | PASS: UUID opponent and separate character owners, active-turn validation |
| 19 full stop/restart | PASS: owned Python and React processes stopped/restarted |
| 20 exact state recovery | PASS: all created identities, memory/trust, resources, rolls and encounter |
| 21 divergent Saves | PASS: A consequences; B remains independently unchanged |
| 22 immutable baselines | PASS: before/after all five file hashes |
| 23 malformed/stale/duplicate/cross-Save | PASS: preflight/permission and exact-retry tests; queue remains usable |
| 24 bounded growth | PASS:200/2500 definitions,40 instances/40 memories; request measurements below |
| 25 no compulsory foreground audit | PASS:110-action population proof, zero foreground complete audits |
| 26 independent integrity verification | PASS: explicit complete replay and source-byte verification |
| 27 genuine process death | PASS: new create/digital workers, four boundaries each, native exact receipt retries |
| 28 accepted SA01/02/03 behaviour | PASS: existing suites preserved and rerun; no identity reinterpretation |

This matrix applies to the supported original training slice. It does not promote general equipment, source combat, faction simulation, AI cognition or VTT to implemented status.

## Reproduce

In the backend checkout, select a NEW private control filename:

```powershell
.venv/Scripts/python.exe scripts/storage_align_population.py --count 220 --control "$env:POPULATION_CONTROL"
$c = Get-Content $env:POPULATION_CONTROL -Raw | ConvertFrom-Json
./scripts/start-vadallfate-v2.ps1 -StorageAlignRoot $c.root -ApiPort 8894 -UiPort 3194 -SkipOllama
```

Wait for the owned launcher readiness record and API/UI readiness. Open `http://127.0.0.1:3194/?storageAlign=2`. Obtain the host key locally from the private launcher record; never publish that file. Open NPC catalogue/lifecycle in the existing adventure view, browse/inspect, explicitly approve and create. Use the existing character/inventory and dice panel; use the source mode of the existing combat tracker for the approved original encounter. Other mechanics refuse explicitly. Save selection clears credentials.

Generic approved source import is available via Python, with exact dependency-ordered world/adventure pack paths:

```python
from pathlib import Path
import tempfile
from vadallfate.runtime.storage_align.population_publication import create_population
from vadallfate.runtime.storage_align.service import create_save
root = create_population(Path(tempfile.mkdtemp()), source_packs=[Path("approved-world-pack")])
for save in ("a", "b"):
    create_save(root, save)
```

This is a new disposable original-character installation, not existing-Save conversion. Drafts, unsupported pack kinds, ambiguous definitions and >4KiB definitions fail publication. Exact world/adventure layer, source approval, rights and pins are retained. Imported NPCs stay combat-held regardless of statistics in their body. Generated fixture shards alone receive the reviewed original training admission. Optional source locations not yet adapted do not become inferred geometry or automatic world facts.

Authenticated existing routes under `/api/v2` remain. Added content routes: catalogue, source-npc, instances, npc-proposal, create-npc, profile-npc, transfer-item. Catalogue/runtime pages use `after` and max30 limit; memory history uses NPC-specific exclusive `before_revision`. Exact entity view and native receipts retain campaign, Save and source provenance. Relationship/event discovery is DM-only; explicit stored edges differ from neutral initial trust. API/operation schema is in the contract.

Validation commands:

```powershell
.venv/Scripts/python.exe -m pytest
.venv/Scripts/python.exe -m pytest tests/test_storage_align_population.py
.venv/Scripts/python.exe tools/storage_align_04_proof.py --output "$env:NEW_PROOF_OUTPUT"
```

Frontend: `npm test`; `node node_modules/typescript/bin/tsc --noEmit`; `npm run build`.

Connected acceptance: set VADALLFATE_POPULATION_CONTROL to the private control path, VADALLFATE_E2E_URL to the owned UI, VADALLFATE_E2E_OUTPUT to a private artifact directory and VADALLFATE_POPULATION_PHASE=journey. Run `node node_modules/@playwright/test/cli.js test e2e/storage-align-04.spec.ts --headed -g 'actual App'`. Journey needs a fresh root. Fully stop/restart the owned launcher, set phase=restart and run `-g 'full restart'`. No SQL seeding of gameplay outcomes occurs.

Exact test results and capacity metadata are in backend `docs/evidence/STORAGE-ALIGN-04-VERIFICATION.json` and `STORAGE-ALIGN-04-PROOF.json`. Screenshots, raw responses, credentials and databases stay local.

## Review units and remaining gates

- Population/typed-play owners extend the existing storage_align reducer, property tree and single authority transaction; no new gameplay service owns a writer.
- CommitAuthority changes only pass its existing private read context to the experimental prepare/commit/recovery driver. Staging, schema, codec, hashing, ledger and receipt contracts are unchanged. New Save indexes install only in newly created disposable fixtures, never normal startup or an existing Save.
- Existing entity application adapters handle empty runtime populations, current identity, bounded projections, sparse trust and location ownership. Original aliases/definitions remain immutable and compatible.
- Existing React components are extended; no competing screen or shadow database. Gateway backoff leaves rate/security policy unchanged. Source/actor selections are exact, not array-position state identities.
- The330-row ownership inventory keeps every original field/status and307 proposed mappings. Added annotations are related bounded-domain evidence only; no complete legacy owner/reversible transform is claimed. The29-case matrix is preserved.

HOLD: I8/conversion/default activation; general inventory/equipment/attunement/charges/spells; unverified SRD/source monsters; arbitrary imported mechanics; physical combat dice/secret rolls/general roll purposes; broad conditions/range/movement/reactions/death saves; VTT grids/geometry/fog/token persistence; runtime faction/goals/routines/scheduler ownership; full NPC knowledge admission/cognition/AI dialogue; portable Save export including private recovery context. Recent roll display is bounded20; older records remain persisted/addressable through the authority, and general roll-journal UX remains future work.

Existing M-SIM weather/visitors/faction/rumour/broadsheet processors, NPC cognition modules, Qwen Harness/context budgets, licensing pipelines, R1 authority and original Antigravity checkouts remain intact. No CP149/150, protected merge, production Save conversion, schema/codec/hash amendment, competing writer or new audit eligibility. The existing trusted-delta threat model is unchanged; selected path verification does not certify an entire history by itself.

STOP after STORAGE-ALIGN-04 for acceptance. No production activation or migration follows automatically.

## Final verification results

Backend full suite: **652 passed, 2 skipped in 952.82s**. Existing skips require the private archive opt-in or Windows symlink privilege. Frontend: **158 passed**, TypeScript and production build passed. Eight genuine process-death cases cover creation and secure digital resolution at admission, staging, state-write and commit boundaries. Final UI refinement also keeps older-story pagination scoped to the selected SA04 individual and displays stable IDs for same-name people.

Measured source probes:200/2500 definitions, indexed lookup11.14/9.44ms, startup154/144ms, creation requests5603/5600bytes. The3-byte difference reflects content-derived version encoding, not linear catalogue growth. At40 instances/40 memories:30 dormant,10 active summaries; creation requests5637–5644bytes, memory requests2611–2616bytes, median creation147ms/p95174ms, selected oldest lookup32ms, restart122ms, Save2547712bytes, explicit full audit1.372s. These are shared-host disposable-fixture observations; Python peak allocations exclude SQLite native memory. No indefinite capacity claim.

All outgoing changes are audited against the SA03 baselines. No private source content, artwork, credentials, machine paths, databases or raw responses are published. Protected schema/codec/hash/store/gateway/AI files retain baseline bytes. Publication audit manifests record file hashes.
