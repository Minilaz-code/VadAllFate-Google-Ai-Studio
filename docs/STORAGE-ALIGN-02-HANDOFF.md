# STORAGE-ALIGN-02 acceptance handoff

Paired review branch: `codex/v2-storage-align-02`. Backend base `7a5a14f7b840919d54925d816b8e48aff535863d`; frontend base `41d8ceb80ee68ccdd5f1b46d199f67480c9e5d82`. Published branch heads are delivered separately to avoid self-referential commit identifiers.

## Implemented development slice

The existing App, character sheet/inventory, header and AdventurePlayPanel now consume the explicitly selected `?storageAlign=2` profile. The launcher selects this only for an owned disposable source publication. Ordinary legacy gameplay remains unchanged. No new gameplay engine, migration or production registration.

Five separate immutable SQLite sources resolve below the sole R1-written Save: SAVE > HOMEBREW > CAMPAIGN > ADVENTURE/REGION > WORLD > RULES. Credential registries are auxiliary authentication stores, never gameplay authority. The publisher validates ContentResolver pins, exact provenance, approval, visibility and licence, and produces content-addressed layer versions plus file hashes. Existing Save bindings cannot silently rebind. Baselines open read-only. Full source definitions never enter the Save.

Actual local eligible source: `personal.waterdeep.handoff.world:durnan`, pack version 1.1.1. Its complete bounded NPC definition is retained privately in WORLD; associated Yawning Portal location is name-only, with exact pointer provenance. The original DM-secret source remains DM-only; host explicitly releases only its display name. Template combat stays HOLD. Private source text, databases, screenshots and proof responses are not distributed here. Public tests use original CC0 fixtures.

CAMPAIGN retains the exact existing Lyra definition and original clock. Host explicitly provides starting HP24, owned balm2 and trust0. Accepted SA01 original balm restores fixed4 HP; it is not the SRD Potion of Healing. SRD reference `srd51:magic_item:142` remains unverified/reference-only. Draft creator adventure records remain inert. The objective is the accepted original controlled Lantern objective, not an activated source adventure. No unrelated scaffold beliefs/secrets are attributed to the selected NPC.

The implemented-Homebrew read-only adapter preserves exact version/scope/approval and validates specification hashes. No implemented local record was available; the existing draft was not activated. Unadapted Homebrew remains inert. Licences are retained per layer, including mixed SRD attribution and restricted private World rights.

## Running the controlled application

From the backend checkout, with an already installed eligible private pack and a NEW control path:

```powershell
.venv/Scripts/python.exe scripts/storage_align_sources.py --world-pack "$env:WORLD_PACK" --npc-ref "$env:NPC_REF" --starting-hp 24 --starting-balm 2 --initial-trust 0 --release-name --control "$env:SOURCE_CONTROL"
$c = Get-Content $env:SOURCE_CONTROL -Raw | ConvertFrom-Json
./scripts/start-vadallfate-v2.ps1 -StorageAlignRoot $c.root -ApiPort 8894 -UiPort 3194 -SkipOllama
```

Use the host credential from the private launcher record; never publish it. Open `http://127.0.0.1:3194/?storageAlign=2`. Existing host role menu can select Player Guest: Lyra for the character sheet; Inventory exposes the supported consumable. Return to Dungeon Master (Host) for explicit trust approval, time and objective advancement. Use real single-use player invites for secrecy testing. A/B selector clears credentials before reopening the independently bound Save.

Compatibility API: authenticated `/api/v2/projection`, `/content/adventure`, DM `/content/play`, `/actions` USE_ITEM/ADVANCE_TIME, `/content/talk`, `/content/wait`, `/content/objective`. Existing native snapshot/idempotency and session claims remain required. `X-VadAllFate-Development-Save: a|b` selects only the owned profile. Native R1 receipt is returned after APPLIED. Unsupported actions fail explicitly, including dice, combat and SRD potion mechanics; no fallback legacy writer. The normal header retains unsupported controls but they cannot commit unsupported gameplay.

Explicit immutable aliases `pc.lyra -> char-lyra-01` and `npc.nera -> selected source ref` reuse the accepted closed role slots. These are not general instance ownership or migration.

## Acceptance evidence

Windows Python 3.14.7, SQLite 3.50.4, actual headed Edge and React connected through the owned launcher: PASS. Final fresh publication journey 18.1s; full backend/frontend process restart then exact A/B projection comparison PASS. Invited player had no DM credential and received no private memory/trust. Source bytes unchanged. Visual inspection confirmed existing App layout and committed objective/time/NPC feedback.

A: revision5, HP28, balm1, told-unverified memory1, DM-approved trust1, minute862, objective completed. B against identical baselines: revision0, HP24, balm2, no memory/trust change, minute855, objective active. This is recorded testimony, not AI cognition or automatic recall.

Broad backend: 621 passed, 2 skipped, 813.90s (before final isolated publication scaffold filter). Final publication suite: 7 passed, 18.07s after filter; final Windows journey/restart and proof also run after filter. Earlier focused runtime/source suite: 34 passed, 153.28s, including accepted process-death/recovery coverage. Frontend: 156 passed, TypeScript PASS, production build PASS (existing native-loader and large-chunk advisories). Skips: opt-in private archive and unavailable Windows symlink privilege.

Commands: `.venv/Scripts/python.exe -m pytest`; focused `-m pytest tests/test_storage_align_sources.py`; proof `.venv/Scripts/python.exe tools/storage_align_02_proof.py --help` (supply installed private source arguments). Frontend `npm test`, `node node_modules/typescript/bin/tsc --noEmit`, `npm run build`. Connected tests: `node node_modules/@playwright/test/cli.js test e2e/storage-align-02.spec.ts --headed` with VADALLFATE_SOURCE_CONTROL, VADALLFATE_SOURCE_PHASE=journey or restart and VADALLFATE_E2E_URL set to the owned server. Journey requires a fresh publication; restart compares saved private responses.

Final capacity proof: 110592 versus 2895872 baseline bytes, identical 2579-byte resource requests. 110 retained memories, revision111 after restart and continuation; oldest memory resolves. Memory requests2289–2299 bytes. Median submit0.1093s, p950.1468s, restart0.1080s, explicit complete audit0.9791s on this host; not an isolated hardware benchmark. Zero foreground complete audits, one explicit complete-history audit. Native 65536-byte limit and existing oversized preflight remain unchanged. No 100-action gate or 10000-action rerun.

Exact machine-readable metadata: `docs/evidence/STORAGE-ALIGN-02-VERIFICATION.json` and `STORAGE-ALIGN-02-PROOF.json`. No private response bodies are committed.

## Ownership and next review

The 330-row original inventory retains every original field/status, 23 roots, 282 known paths and all 307 proposed-owner statuses. Added annotations are family evidence only. Existing 29-case acceptance matrix is preserved. `STORAGE-ALIGN-02-DOMAIN-OWNERS.json` maps baseline, Save identity, validation, read authority, secrecy and source pins.

| Next owner | Exact remaining boundary |
|---|---|
| Character resources/inventory | General item identities, equipment, slots/rest/death/derived rules; current HP/balm is only a slice |
| NPC identity/knowledge/relationships | General instances and actors, eligibility-filtered beliefs/memories; current fixed role alias and trust are limited |
| Character/NPC positioning | Spatial identities, legal locations and coordinate validation; location name is association only |
| Quest dependencies | Generic objective graph, deadlines, rewards, secrecy and completion invariants |
| Scheduled world events | Indexed due events and routines; minute and HH:MM adapter has no full calendar rollover |
| Physical/digital rolls | Existing entropy, RollRequest lifecycle and adjudication contracts; no source-profile roll activation |
| VTT persistence | Asset ownership, grids, tokens, visibility and spatial revision invariants |

All future owners require field-complete reversible migration specifications, exact pins and R1 integration review. No existing Save was opened for conversion. No I8, production audit eligibility change, frozen schema/codec/hash change, source combat, private-secret AI reasoning, protected merge or Antigravity checkout modification. Full audit remains optional diagnostics with the existing SA01 threat model; this milestone does not amend integrity policy. STOP for STORAGE-ALIGN-02 acceptance.
