# STORAGE-ALIGN-05 implementation handoff

Paired review branch: `codex/v2-storage-align-05`. Backend base `e0e5b988d78358f60ce0ebc55c8a7e90eee3e0cb`; frontend base `5fe326eeb4d4a0e04256dc2efbdd96a2191dd911`. Exact published heads accompany the delivery; no self-referential commit hash in this document. STOP for independent acceptance, without main merge, production activation or migration.

## Result and subsystem status

The actual existing Windows Python/React application completes the original connected world-progression journey through the six-layer hierarchy of five read-only baselines and the selected R1 Save. No new database, competing writer or whole-campaign document is introduced. The existing M-SIM algorithms remain unchanged; the new adapter supplies selected typed data and commits bounded consequences through the existing authority.

| Subsystem | Status | Verified scope and limit |
|---|---|---|
| Master clock and scheduler | PASS controlled slice | Explicit DM time, PAUSED offline, indexed due selection, durable multi-commit plan, exact event completion and resumed pending work |
| Weather and travel | PASS controlled slice / PARTIAL general model | Seeded seasonal transition and approved original foot route; weather changes40 base minutes to60 at departure. No mid-journey weather rescheduling or all-region simulation |
| NPC routine and arrival | PASS controlled slice / PARTIAL general routines | Exact runtime courier identity, named locations, future appointments survive dormancy and reactivate when due; no general routine language or VTT geometry |
| Rumours/knowledge | PASS controlled slice / PARTIAL general cognition | One authorised individual dispatch acquisition and eligible face-to-face hearsay; independent uninformed third NPC; no omniscient sharing, verification engine or autonomous belief reasoning |
| Factions/escalation | PASS controlled slice / PARTIAL general strategy | Actual committed arrival report triggers one standing+5 and one clock segment; no economy, strategy or faction-wide NPC knowledge |
| News | PASS controlled slice / PARTIAL publishing platform | One scheduled source-defined issue, addressed report, editorial deadline, attributed class and secret exclusion; no AI prose or unrestricted tag feed |
| Existing application integration | PASS | Existing adventure view, source catalogue, runtime individuals, world controls/projections; player-safe world/news only |
| Restart, recovery, isolation | PASS | Exact A/B recovery, four genuine arrival-transaction death boundaries, native exact receipts and independent complete replay |
| Production, I8, source activation, AI cognition | HOLD | Not authorised by this milestone |

See [world ownership and algorithm reconciliation](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-storage-align-05/docs/STORAGE-ALIGN-05-WORLD-CONTRACT.md) for exact addresses, command bounds, recovery protocol and integrity limitations. Original M-series inventory claims are not promoted to implemented ownership. The330-row inventory retains the original307 proposed statuses and migration holds.

## Connected Windows / Edge evidence

Final headed Edge journey passed in45.9s (50.3s runner); full Python/React shutdown and restart passed in8.9s (11.2s runner). Screenshots were visually inspected and retained privately. Gameplay was not populated by direct Save writes or after-the-fact fixture consequences.

- Mounted220 approved original CC0 NPC definitions. DM browsed source catalogue and created three distinct runtime individuals sharing one exact immutable definition.
- Explicit DM enrolment placed the source-created courier at Lantern Hill, admitted a bounded unverified dispatch, and scheduled weather, departure and a future appointment. It did not publish generated content to a baseline.
- Third NPC became dormant; its appointment remained pending. The catalogue and generic creation/lifecycle UI remain available.
- World time855→885: seeded Clear→Thunderstorm effective856; courier departed857. Approved base40 minutes became60, ETA917. Courier was still at the origin with TRAVELLING status before arrival.
- World time885→925: scheduler committed arrival at the named landing, then a report-backed guild response (+5, clock1/4), eligible person-to-person unverified rumour and a newspaper issue. The third NPC acquired no rumour. Scheduled publication/deadline919 and actual catch-up publication925 are distinct persisted values.
- Player joined through an invite and saw public weather, journey and news. NPC private memories, pending jobs, institutional faction state, private editorial report and DM controls were excluded by the server.
- Explicit authenticated complete integrity audit passed. All five baseline hashes stayed unchanged.
- Full application restart recovered exact world projections for both Saves. A retained consequences; B remained minute855/Clear with no enrolled NPC routine, scheduled events or consequences. Completed outcomes did not react again.

Private raw projections, credentials, screenshots, process logs and SQLite fixtures are excluded from Git. Public evidence contains only numeric outcomes, hashes, bounds and test results.

## Acceptance matrix

| Brief case | Evidence/status |
|---|---|
|1 six layers|PASS: existing mounted hierarchy, before/after hashes|
|2 >=200 definitions|PASS:220 connected;200 and2500 separate probes|
|3 multiple instances|PASS: three actual source-created individuals|
|4 source-backed weather/locations/visitors/factions|PASS: pinned original WORLD/RULES definitions and explicit DM routine|
|5 independent Saves|PASS: A/B shared baselines, separate authority/evidence|
|6 R1 clock advance|PASS: native receipt and durable marker|
|7 weather/travel|PASS:40→60 approved foot minutes|
|8 not present early|PASS: pre-arrival origin/TRAVELLING, ETA917|
|9–10 arrive beyond ETA|PASS: effective917, processed under clock925|
|11 faction response|PASS:+5, clock1/4 from causal report|
|12 rumour|PASS: exact-source eligible sender→listener acquisition|
|13 uninformed NPC|PASS: no third-person rumour|
|14 newspaper|PASS: one attributed report and stable issue|
|15 privacy|PASS: real player session and negative tests|
|16 dormant future event|PASS: connected pending appointment; automated due reactivation|
|17–18 full restart|PASS: Python/React stopped, exact A/B recovery|
|19 no duplicates|PASS: completed jobs omitted; exact retry receipts and unchanged restart|
|20 second Save|PASS: baseline-only B|
|21 immutable sources|PASS: all five hashes unchanged|
|22 bounded material|PASS: existing8-record/4KiB/64KiB limits; measured evidence|
|23 foreground audits|PASS: zero in workload probes|
|24 independent full audit|PASS: authenticated actual application and deterministic complete replay|
|25 genuine death|PASS: arrival at after_admission/after_stage/after_state_write/after_commit|

This matrix certifies the described controlled original slice, not a general production world simulator. Missing general features remain explicit in the subsystem table and contract.

## Reproduce and integrate for review

Check out these paired review branches in Codex-owned checkouts only. No merge with Antigravity combat branches or original checkouts is required. UI additions are limited to AdventurePlayPanel plus its WorldSimulationPanel child; CombatTracker, play_rules and legacy gateway/combat files remain SA04 bytes. Antigravity should review/merge only after independent acceptance and coordinate any later shared UI changes separately.

Create an entirely NEW private control filename and original installation:

```powershell
.venv/Scripts/python.exe scripts/storage_align_world.py --count 220 --control $env:WORLD_CONTROL
$c = Get-Content $env:WORLD_CONTROL -Raw | ConvertFrom-Json
./scripts/start-vadallfate-v2.ps1 -StorageAlignRoot $c.root -ApiPort 8895 -UiPort 3195 -SkipOllama
```

Wait for launcher/API/UI readiness. Open `http://127.0.0.1:3195/?storageAlign=2`, authenticate with the locally retained host key. Create three individuals in the existing catalogue panel. Select visitor/listener/uninformed NPC in Living world, approve the original routine, mark the irrelevant individual dormant, advance30 then40 minutes. If interrupted, use Resume pending world events. Older wait/objective controls also accept a durable clock plan; resume it before further material actions. No offline catch-up occurs automatically.

GET `/api/v2/content/world` returns a role-filtered bounded view with exact snapshotRef. POST content routes `world-enrol`, `world-advance`, `world-step` use existing contentMutation envelope and native receipt. Direct authority operations and WORLD_APPOINTMENT are described in the contract. No public arbitrary processor dispatch, NPC impersonation, SQL hook or write capability exists.

```powershell
.venv/Scripts/python.exe -m pytest
.venv/Scripts/python.exe -m pytest tests/test_storage_align_world.py tests/test_storage_align_population.py
.venv/Scripts/python.exe tools/storage_align_05_proof.py --output $env:NEW_WORLD_PROOF
```

Frontend: `npm test`; `node node_modules/typescript/bin/tsc --noEmit`; `npm run build`.

Connected tests: set VADALLFATE_WORLD_CONTROL to the private control path, VADALLFATE_E2E_URL to the owned UI, VADALLFATE_E2E_OUTPUT to a private directory and VADALLFATE_WORLD_PHASE=journey. Run `node node_modules/@playwright/test/cli.js test e2e/storage-align-05.spec.ts --headed -g 'actual connected'`. Then fully stop/restart the owned launcher, set phase=restart and run `-g 'complete application restart'`. Journey requires a fresh root. These commands never convert an existing Save.

## Capacity, integrity and holds

The evidence metadata records source catalogue growth, due work, dormant population, memory count, request bytes, Save size, lookup time, action latency, restart and explicit complete audit. The measured host is an Intel i7-4770 (4 cores/8 logical),16GiB RAM, Windows Python3.14.7/SQLite3.50.4. Tests share the host; CPU contention is visible in timings. Python allocation peaks exclude SQLite native memory and are not total RAM. No unlimited-world or production-latency claim.

Due selection loads at most one scheduled property per query. Event validation loads affected dependencies, not all NPCs or historical memories. Ten due appointments require ten independent consequences plus a completion step, never one oversized atomic fiction. A future calendar or unsupported source processor needs a reviewed adapter. Completed jobs/news/history are retained; current UI summaries are bounded20 and selected NPC memories10. A general paginated world-event archive is future UX; these display bounds do not delete records or cap the population.

The explicit full audit remains separate from normal gameplay. The existing trusted-delta threat model is preserved; selected index rows do not prove absence of all omitted/corrupted range entries. Complete replay recomputes logical ordering and checks current state and immutable history. This milestone does not amend production audit eligibility or assert stronger range-authentication guarantees.

HOLD: existing Save conversion/I8; normal granular/profile activation; production audit-policy changes; arbitrary source/Homebrew SQL; general routine/goal/strategy/economy logic; mid-journey weather adaptation; SRD/source monster mechanics; spatial geometry/movement; AI-grounded dialogue/cognition; portable private Save export. No CP149/150, protected merge, competing writer or Antigravity checkout change. STOP after STORAGE-ALIGN-05.

## Measured capacity and verification files

Backend evidence: `docs/evidence/STORAGE-ALIGN-05-VERIFICATION.json`, `STORAGE-ALIGN-05-PROOF.json` and publication audit manifest. No raw private response is included.

Final source probes200/2500: startup0.133/0.181s, Python peak1.71/2.24MB, restart0.352/0.146s. Offline source construction7.16/42.24s is not gameplay. The larger fixture retained43 individuals,40 dormant,100 prior conversation memories and40 future appointments. Due selection fetched at most one scheduled record; measured maximum lookup6.4–13.4ms. Ten due appointments required11 processing transactions including plan completion,4.08s total. Appointment-step frames stayed <=6117bytes and clock frames3169–3321bytes. In the actual connected journey, enrolment was11992bytes and the largest scheduled consequence13460bytes. All fit the unchanged65536-byte limit; no missing data was pruned.

The larger Save was5177344bytes; explicit full audit3.596s, zero compulsory foreground complete audits. Individual event latency varied on the shared host (up to4.72s in the smaller probe during contention), so these measurements do not establish production latency or a monotonic scaling curve. Increasing due work increases the number of bounded commits; increasing source catalogue size does not enlarge each request. Body size varies slightly with revision/evidence identifiers, not a whole-world rewrite.

An authenticated real-HTTP pressure check accepted119 reads then returned429 at the unchanged limiter; authoritative state was identical. Existing controlled transport retries only429 with captured identical request bytes and cancels on Save/session change. Native stale/cross-Save/permission and queue regressions are retained.

A development regression in the early WORLD operation classifier was repaired: malformed non-string operations are rejected before calling string methods or admitting input. The early broader run was stopped after identifying this failure. A subsequent run crossed the final faction-report edit, mixing parent/child reducer versions; it too was stopped. The final full suite runs with code frozen so crash workers and parent use identical code. Focused negative tests verify no queue poison. This was not a change to accepted R1 wire contracts.

Final review also separated institutional receipt from press receipt: arrival writes a distinct report addressed to `amber-guild`, and the faction processor validates that recipient. The press continues to receive only its own addressed report. Arrival plus its children/completion now uses exactly8 changed properties in one native transaction. The affected arrival/recovery tests and real connected journey are rerun after this correction; no accepted Save is converted.

Review integration commands (run separately in each Codex-owned repository):

```powershell
git fetch origin codex/v2-storage-align-05
git switch codex/v2-storage-align-05
git rev-parse HEAD
```

Compare HEAD with the exact published delivery SHA, use a fresh WORLD_CONTROL path, then run the commands above. Do not cherry-pick this experimental profile into normal runtime or merge Antigravity combat work without the separate acceptance/integration review.

General-world integration blocker: no reject/replan UI exists for an already scheduled consequence whose eligibility later becomes false. Such work fails closed and leaves the durable plan pending; the material-action barrier requires a separately reviewed repair/rejection workflow. The original acceptance routine completes, but this failure-handling limitation must be addressed before general production use. No unsupported consequence is silently committed to get past it.

## Final regression result

Frozen-code complete backend suite: **662 passed,2 skipped in1168.37s**. The two existing skips are private archive opt-in and Windows symlink privilege. Final dedicated world suite:10 passed in155.503s. Earlier combined world/SA04 slice:29 passed. Frontend:158 passed; TypeScript and production build PASS, with existing Vite configuration/chunk-size advisories. Final connected Edge journey45.9s; full restart8.9s; authenticated post-restart complete audit PASS at revision15/24 records. Publication audit covers all outgoing committed blobs and messages against the exact accepted SA04 bases. No private source, artwork, credentials, personal paths, raw responses or SQLite fixtures are published.
