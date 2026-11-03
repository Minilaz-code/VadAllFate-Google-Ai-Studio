# STORAGE-ALIGN-03 acceptance handoff

Paired review branch: `codex/v2-storage-align-03`. Backend base `a2e3970fa66460652dedeaf108650b5f37bea48c`; frontend base `d5d1a7c6f0dd1c5232d21e2d0821a10b72601751`. Exact published heads are delivered separately to avoid self-referential commits. No main merge.

## Result and operating boundary

PASS for the controlled generic first slice: existing App, character inventory/resource view and AdventurePlayPanel consume source-backed instances. R1 alone commits targeted Save deltas. Baseline hierarchy remains SAVE > HOMEBREW > CAMPAIGN > ADVENTURE/REGION > WORLD > RULES, with five immutable pinned source SQLite files and one active gameplay Save. Credential registries remain non-gameplay auxiliary authentication stores.

Original CC0 Amber sources were explicitly authored and approved for this milestone; no draft source was promoted by the adapter. Iris Vale, Tovan Ash and Mira Fen have exact source definitions; a second Iris instance shares the first definition while retaining independent mutable state. Ada Brook and Ben Ash have separate original character definitions/actors, resources and owned balm instances. Exact source definition and version/hash/licence metadata stay in baselines; memories, current relationship changes, clock and objective deltas stay in the Save. Real private Waterdeep is not required or redistributed. Accepted SA02 private-source publication and legacy alias behaviour remain available unchanged.

Contract: [STORAGE-ALIGN-03-ENTITY-CONTRACT.md](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-storage-align-03/docs/STORAGE-ALIGN-03-ENTITY-CONTRACT.md). This documents IDs, owners, action bounds, exact API, legacy adapters, recovery and remaining restrictions.

## Actual Windows/Edge acceptance

Windows Python3.14.7 / SQLite3.50.4; headed Microsoft Edge against the owned Python/React launcher. Final source-bound journey32.4s, full backend/frontend restart comparison5.3s; additional all-pair trust restart verification recorded in evidence. Existing App visually inspected. Two independent invited player contexts had no DM credentials.

| Requirement | Result / evidence |
|---|---|
| Two independent characters and at least three NPCs | PASS: Ada/Ben; Iris/Tovan/Mira plus second Iris, exact IDs shown |
| Character A and B tell NPC1 different things | PASS: two Iris memories retain actor.ada and actor.ben |
| NPC2 learns separately; NPC3 does not inherit | PASS: Tovan1, Mira0; same-source Iris twin0 |
| Relationship endpoints | PASS: Tovan/Ben1, Tovan/Ada0; other pairs0 |
| Character resources/ownership | PASS: Ada12->16HP, Ben9->13HP; each own balm2->1; player sees its character only |
| Clock and original objective | PASS: minute855->861, progress1/2; earlier objective functionality retained |
| Complete restart | PASS: exact role-aware projections/history for A/B; all pair values checked |
| Independent second Save | PASS: HP12/9, balm2each, no memories, relationships0, minute855; same baselines |
| Baseline immutability and Save-only changes | PASS: all five file hashes unchanged; unaffected character has no rewritten resource rows in isolation test |
| Secrecy and invalid requests | PASS: cross-character/Save, stale, malformed, oversized text and unauthorised trust/history reject; no queue poisoning |
| R1 recovery/idempotency/audit | PASS: native exact retry, four new genuine process-death windows, independent full replay; earlier11-window suite retained |
| Bounded growth | PASS: resource2652 bytes against118784/2904064 source bytes; testimony2539..2556 bytes |
| No normal full-history replay | PASS:120 memories across3NPCs, revision121 after restart/continue; zero foreground audits; one explicit complete audit |

Capacity proof retains40 memories per NPC, independently retrieves the earliest unresolved promise after restart, and leaves the fourth shared-definition instance empty. Indexed pages returned1 at revision3 and10 at revisions30/60/120 in0.0191/0.0415/0.0482/0.0600s respectively. Median submit0.1519s, p950.7280s, restart0.0844s, explicit full audit1.9648s, Save2060288bytes. Shared host during regressions, not isolated benchmarking or a production performance guarantee. No10000-action rerun and no mandatory100-revision audit.

Machine-readable metadata (backend repository): `docs/evidence/STORAGE-ALIGN-03-VERIFICATION.json`, `STORAGE-ALIGN-03-PROOF.json` and publication audit. Private host tokens, raw responses, screenshots and databases remain local.

## Automated results

Broad backend: **630 passed, 2 skipped in814.46s**. Skips retain the existing opt-in private-archive and unavailable Windows symlink privilege conditions. The final focused suite passed **43 cases in166.80s** after the additional offline duplicate-character-source rejection, restored status typography and malformed-operation guard. These changes leave native storage/authority semantics intact. The final generic suite passed **10 cases in65.02s** after adding a source-backed location-kind guard. Its original-fixture association test validates DM-only named association, missing-location and character-as-location rejection, Save-only mutation and explicit audit. It reasserts the existing named association; alternate-location movement/VTT is not demonstrated.

Frontend final tree: **156 passed in4.386s**, TypeScript PASS and production build PASS3.89s. Existing Vite native-configuration and large-chunk advisories remain. Final full restart additionally verified all actor/NPC relationship pairs in5.3s.

## Reproduce and inspect

Use both paired checkouts. From backend:

```powershell
.venv/Scripts/python.exe scripts/storage_align_entities.py --control "$env:ENTITY_CONTROL"
$c = Get-Content $env:ENTITY_CONTROL -Raw | ConvertFrom-Json
./scripts/start-vadallfate-v2.ps1 -StorageAlignRoot $c.root -ApiPort 8894 -UiPort 3194 -SkipOllama
```

ENTITY_CONTROL must be a NEW local filename. This creates approved original source packs, publishes new versioned baselines and initialises fresh independent A/B Saves through R1. It never converts an existing Save. Open `http://127.0.0.1:3194/?storageAlign=2`; obtain the host key locally from the owned launcher record. Do not publish that record. DM selects exact character/NPC in existing AdventurePlayPanel. Provision actor.ada/actor.ben player invites; their existing Character/Inventory views expose only their owned supported consumable. A/B selection clears credentials.

Generic publication API: `storage_align.entity_publication.publish_entities(world_pack=..., campaign_id=..., characters=[explicit original approved specs], npcs=[explicit approved source bindings], ...)`, followed by existing `create_save(root,'a'/'b')`. Full specification/example is executable in `storage_align/original_scenario.py`. No arbitrary pack SQL or live Homebrew activation is accepted.

Tests:

```powershell
.venv/Scripts/python.exe -m pytest
.venv/Scripts/python.exe -m pytest tests/test_storage_align_entities.py tests/test_storage_align.py tests/test_storage_align_sources.py
.venv/Scripts/python.exe tools/storage_align_03_proof.py --output "$env:NEW_PROOF_OUTPUT"
```

Frontend: `npm test`; `node node_modules/typescript/bin/tsc --noEmit`; `npm run build`.

Connected: set VADALLFATE_ENTITY_CONTROL to the private control path, VADALLFATE_E2E_URL to the owned UI, VADALLFATE_E2E_OUTPUT to a private artifact directory, and VADALLFATE_ENTITY_PHASE=journey. Run `node node_modules/@playwright/test/cli.js test e2e/storage-align-03.spec.ts --headed -g multi-character`. Journey requires a fresh root. Fully stop/restart the owned launcher, set phase=restart and run `-g 'full application restart'`. Restart compares exact retained responses plus every relationship pair; it never reseeds gameplay state.

## Review scope and remaining holds

Changed backend units: new entities typed contract, offline entity_publication and original_scenario, read-only entity_application; existing model dispatch, campaign-aware storage_align runtime/service and two campaign-parameter recovery substitutions in CommitAuthority. Native store, frozen schemas, property schema, staged codec, JCS and authenticated tree algorithms remain unchanged. No new writer or normal production registration.

Frontend changes are limited to existing AdventurePlayPanel exact target/history selection and display, source-profile host character discovery in v2Session, and connected tests. No shadow database, UI replacement or cloud/AI provider.

The330-row ownership inventory retains every original status and307 proposed-owner rows. Added annotations record only bounded generic slices; no complete legacy field owner, transform, reverse transform or I8 acceptance is claimed. Existing29-case matrix and all earlier evidence remain untouched.

PARTIAL/HOLD: full inventory/equipment/attunement/spells; shared private character-source templates; arbitrary unbounded roster browsing; broader NPC beliefs/observations/verification/knowledge admission and AI dialogue; full calendars/indexed scheduling; generic quest graphs/rewards; positions/grids/VTT persistence; rolls and source combat. Current memory is told-unverified testimony, and trust is DM-approved numerical accounting. Location is an approved named association, not spatial placement. Existing unsupported header controls remain present but cannot commit these held actions. Underlying service status retains the SA02 compatibility label; per-projection storageFormat and entity contract identify SA03. No automatic private knowledge release.

No existing/production Save conversion, I8, default activation, frozen schema/codec/hash amendment, new integrity policy, protected merge, CP149/150 or Antigravity checkout changes. Optional audit and existing corruption HOLD/recovery threat model are preserved; bounded read verification is not a claim to certify entire history. STOP after STORAGE-ALIGN-03 for acceptance.
