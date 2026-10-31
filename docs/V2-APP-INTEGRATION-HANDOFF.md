# V2 application integration handoff — 2026-10-31

Backend: `Minilaz-code/VadAllFate`, branch `codex/v2-app-integration`.
Frontend: `Minilaz-code/VadAllFate-Google-Ai-Studio`, branch `codex/v2-app-integration`.
Exact tested implementation commits are recorded in the companion publication document.

## Delivered and verified

PASS: Existing ContentResolver integrated into the existing React PLAY screen and Python HTTP gateway. Installed immutable world/adventure versions and dependency hashes are selected explicitly. Location, full scene JSON, nested prose, source references, rights and protected raster artwork are available to the DM. Only explicitly released read-aloud text and introduced NPC names reach players. No implicit release of source prose.

PASS: Lyra can address Durnan through a real authenticated backend action. The existing admission pipeline and R1 CommitAuthority return a real COMMITTED receipt. Conversation state lives in the existing campaign document in SQLite. Human DM NPC replies are separately authenticated and committed, explicitly labelled human-authored. No generated AI reply is claimed.

PASS: Host campaign creation, selection and reload work through campaign-bound sessions. New campaigns start with the existing party template; world/adventure pins are independent per campaign. SQLite backup creates independent restartable Save files, verifies integrity and foreign keys, and records exact content pins. Opening a Save requires a process restart. A Save file checkpoints the entire runtime database, including its other campaigns; this is not a single-campaign portable export.

PASS: Real Windows launcher and headless Microsoft Edge exercised private Waterdeep selection, Yawning Portal artwork, Durnan introduction, Lyra interaction, browser reload, full process restart, campaign creation/switching, SQLite checkpoint creation, and reopening that checkpoint. A human DM reply survived full process restart on the Save branch. Primary runtime revision/state hashes remained unchanged by Save-branch play.

## Validation evidence

Backend (Windows Python 3.14.7 virtual environment):

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' --tb=short
# 532 passed, 2 skipped in 552.94s
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_game_content_api.py tests/test_v2_auth_security.py
# 25 passed in 51.14s (including final reply authorization and unsupported-ruleset regressions)
```

The full suite preceded the final reply guard and receipt-display repair; the targeted security suite verified the final backend logic. No frozen authority/schema code was changed.

Frontend (Node 24.22.1): `npm test` — 150 passed; `npm run lint` — PASS; `npm run build` — PASS. Build retains a bundle-size warning above 500 kB. Public tests use original redistributable CC0 fixtures. The three private browser journeys passed separately (content, restart/campaigns, Save branch); they are deliberately sequential and require a configured private library and dedicated runtime, not a shared production Save. Browser output and private proofs remain ignored locally.

```powershell
$env:VADALLFATE_E2E_HOST_RECORD = '<backend>/data/launcher/pids.json'
$env:VADALLFATE_E2E_OUTPUT = '<private-artifact-directory>'
node node_modules/@playwright/test/cli.js test e2e/content.spec.ts
# Stop and restart the same runtime before e2e/persistence.spec.ts.
# Open the created Save ID before e2e/save-branch.spec.ts.
```

## Windows launch and integration

Use separate Codex checkouts. Antigravity's original checkouts and development branches were left untouched. Fetch both origin remotes; review the published branches. In each active V2 integration branch, merge the corresponding `origin/codex/v2-app-integration` only after reviewing its diff. Do not merge into main. Backend branch includes the published content foundation plus source-anchor improvements.

Backend setup: create `.venv`, install the repository's development dependencies with `.venv/Scripts/python.exe -m pip install -e '.[dev]'`. Frontend: `npm ci`. Run from the backend root:

```powershell
$env:VADALLFATE_FRONTEND_DIR = '<absolute frontend checkout>'
$env:VADALLFATE_CONTENT_LIBRARY = '<private installed pack library>'
$env:VADALLFATE_CONTENT_ASSETS = '<private external-assets directory>'
./scripts/start-vadallfate-v2.ps1 -NoBrowser -SkipOllama -ApiPort 8876 -UiPort 3187
```

Open `http://127.0.0.1:3187`. Use the locally displayed host bootstrap credential in the existing login form; never copy it into Git, URLs or reports. PLAY → Campaign content → select world/adventure → Pin selected content → inspect location/open scene → inspect NPC → Introduce to party. Select a character, submit dialogue, and optionally reply as the human DM. Receipts are shown after committed actions.

Stop with `./scripts/start-vadallfate-v2.ps1 -Stop`. Open an independent Save with the same environment and `-SaveId <32-character Save ID>` appended to the launch command. Default runtime is the dedicated ignored `private-content/application/runtime.sqlite`; managed checkpoints are in its `save_branches` directory. Existing campaign Saves are not replaced. Ports must be free; the launcher refuses to attach to unrelated processes. Shutdown verifies recorded process IDs and start times.

The private pack layout remains `<library>/<pack_id>/<version>/manifest.json` plus hashed records. Existing content handoff documents describe local generation/installation; no private pack or artwork is available from GitHub. Generic HTTP endpoints under `/api/v2/content/` expose discovery, selection, records, definition, asset, play, open, release, interact and reply. Mutations require a session-bound campaign snapshot and unique action ID. `/api/v2/campaigns` and `/select`, `/saves` require host DM authority. Invalid pins, dependencies, ownership, preview mutations and cross-campaign requests fail closed. Source bodies are never accepted from clients as authority.

## Limitations and holds

PARTIAL: Pack Manager supports validated installed packs and exact selection; arbitrary upload, homebrew authoring, export and ruleset conversion are not implemented. Campaigns remain dnd5e-2014; incompatible rulesets are rejected by pack validation. Creator templates remain the existing content tooling.

PARTIAL: Source UI renders prose, read-aloud, lists, tables and declared raster assets. Raw source JSON remains complete in the API; unknown renderer structures and depth beyond 14 are not rendered. Missing assets are reported. Source references are shown; not all book/area links have gameplay navigation.

HOLD: AI NPC interpretation/replies are not connected to the source-backed path. `aiReplyAvailable=false` is explicit. Deterministic player utterances and human DM responses work; no autonomous NPC intelligence is claimed. Content prose does not create combat actors, mechanical statistics, positions or map geometry. Existing lower world/combat widgets retain the application template actors. No claim of full playable combat or automated source-map ingestion.

HOLD: Existing combat/schema/authentication holds remain. This is a local host application improvement, not a production security certification. R1 authority and campaign schema were preserved. CP149/CP150 were not touched. No giant ingestion database was created.

Next implementation task: map source NPC templates to existing approved actor creation and spatial contracts, with an explicit DM placement workflow, while preserving current combat holds. Then connect source-bound NPC interpreter proposals through the existing AI Harness only when its real provider is operational and tested.
