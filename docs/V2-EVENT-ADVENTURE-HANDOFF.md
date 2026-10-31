# V2 event-driven adventure handoff - 2026-10-31

Both review branches: `codex/v2-event-adventure`. Review both repositories together; no merge into main is authorized.

| Repository | Tested implementation commit | Base |
| --- | --- | --- |
| Minilaz-code/VadAllFate | `8a57f6ee189b49f0f7d4b294389997a4221d9ba6` | `a8bffe82abf446b28208a88d046fece2f75941f0` |
| Minilaz-code/VadAllFate-Google-Ai-Studio | `f156e401ba5ab0b9d02607997ed03e2354ff8e8a` | `f22c6091c4458b1a938b70fc97d40649df489db6` |

Publication tips include this documentation after the implementation commits. Verify the tip with `git rev-parse HEAD` and `git ls-remote origin refs/heads/codex/v2-event-adventure`.

## Acceptance

| Requirement | Result | Evidence and boundary |
| --- | --- | --- |
| Event quest progression | PASS | Typed visit, information receipt, approved topic, time event, prior objective and approved event predicates on existing quests. Ordered prerequisites, deadline failure and event provenance persist through R1. No substring matching in this adventure. |
| Belief revision | PASS | DM retract/supersede preserves original evidence and revision metadata. Retired claims leave active dialogue knowledge and associated old witness context. Player revision refused. |
| Private knowledge affects behavior | PASS, bounded | Explicit neutral/reserved/decline enum only; secret text never enters model context. Record-ID trace remains DM-only. |
| Raw private generative reasoning | BLOCKED | Current validators cannot prove generated text excludes semantic paraphrases of a secret. No private chain-of-thought/model pass enabled. Public or explicitly character-disclosed knowledge remains the generation boundary. |
| Multiple connected activities | PASS | Ordered absolute world-minute activities in existing npcRoutines, approved source locations, objective prerequisites and deterministic availability. Narrative location transitions unplace tokens; they do not infer geometry. Existing physical routines still use the spatial engine. |
| Connected PLAY adventure | PASS | Enter, accept lead, actual Qwen reply, wait, appointment event, second NPC, report, quest completion and disclosed knowledge in the primary feed. Normal player actions require no source panel or JSON manipulation. |
| Restart and divergent timeline | PASS | Full restart recovered completion, dialogue, pinned identity, activity memory and character knowledge. Pre-appointment checkpoint failed after twenty-minute wait; failure survived restart. Primary canonical revisions/hashes unchanged by child actions. |
| Generic compatibility | PASS | Original CC0 Nera/Olwen fixtures and two unrelated original locations prove actual transitions. No Waterdeep IDs/names in the new runtime implementation. |
| Permissions/failure paths | PASS | Character spoofing, player DM commands, remote interaction, bad references/schedules and oversized queue safety covered. Existing provider failures, assisted/sovereign modes and prompt-context safeguards preserved. |

Private Edge acceptance used installed pinned Durnan and Volothamp Geddarm identities at the Yawning Portal. The appointment is an original DM-authored scenario, not a reproduced commercial adventure. The installed private starter pack supports one Waterdeep location, so this journey progresses time there; original fixtures prove two-location travel. NPCs receive only their own directed conversation/activity observations. The host's approved appointment fact is disclosed to the accepting character; the contact's activity observation is disclosed through the report topic.

Actual provider: `ollama-live:qwen3.5:4b`; Windows Python 3.14.7, Node 24.22.1, headless Microsoft Edge. No fallback counted as AI success. Model phrasing can still be awkward or mistaken and establishes no world truth or automatic gameplay consequence.

## Measured verification

- Broad Python: **556 passed, 2 skipped in 797.84s**. This broad run preceded final context wording, lead admission, validation and application preflight refinements; targeted checks below cover those changes.
- API/living-world/auth/Harness: **53 passed in 252.55s**.
- Adventure and commit recovery: **15 passed in 75.60s**.
- Final adventure tests: **6 passed in 34.31s**, including invalid activity event keys and oversized-request queue safety.
- Frontend: **152 passed**; TypeScript and production build PASS. Existing bundle-size warning remains.
- Final connected actual-model Edge journey: **1 passed in 34.1s**.
- Primary full restart: **1 passed in 6.0s**. Restored-primary pin/memory/knowledge verification: **1 passed in 7.9s**.
- Child missed-appointment outcome: **1 passed in 5.2s**. Child full restart: **1 passed in 4.0s**.

The first browser setup incorrectly shared its output directory with a fresh test Save; it was recreated with separate artifact storage. An early live run exposed an oversized scheduler request that could block admission recovery. Final runs use a fresh dedicated runtime. No production or prior living-world Save was altered.

## Authority and operational repair

All mutations follow existing authentication, snapshot freshness, state-delta validation and R1 admit/dispatch/stage/commit. No direct canonical SQL writer, second authority, frozen schema or CommitAuthority change. Immutable definitions and pins remain separate from campaign Save changes.

`quest_conditions.py` evaluates typed objectives. `game_adventure.py` orchestrates approved noncombat actions over existing characters, NPCs, quests and npcRoutines. Gateway `_gameplay` metadata is stripped from client input and recomputed server-side. Quest/activity effects share the validated proposal; setup and revision events remain DM-only.

The follow-up operational repair compacts application state-patch JSON and checks the existing staged-request codec before durable admission. An oversized request fails under the unchanged **65,536-byte** ceiling without creating a newly blocked queue head. This does not expand authority limits, repair already-blocked Saves or provide unlimited campaign capacity.

## Antigravity integration and launch

In each of your own backend/frontend integration checkouts:

```powershell
git fetch origin
git switch <your-active-v2-integration-branch>
git merge --no-ff origin/codex/v2-event-adventure
```

Review/merge each branch into its corresponding active V2 branch, never main. Preserve both sides' authentication, R1 and role-projection safeguards in any conflicts. Original Antigravity checkouts were untouched.

Backend checks:

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts=''
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_event_adventure.py tests/test_game_content_api.py tests/test_living_world_content.py tests/test_v2_auth_security.py tests/test_v2_ai_harness.py tests/test_v2_commit_recovery.py
```

Frontend checks:

```powershell
npm ci
npm test
npm run lint
npm run build
```

Use existing launcher/dependencies from [the living-world handoff](V2-LIVING-WORLD-HANDOFF.md):

```powershell
$env:VADALLFATE_FRONTEND_DIR = '<absolute frontend checkout>'
$env:VADALLFATE_CONTENT_LIBRARY = '<private installed pack library>'
$env:VADALLFATE_CONTENT_ASSETS = '<private external-assets directory>'
./scripts/start-vadallfate-v2.ps1 -NoBrowser -ApiPort 8876 -UiPort 3187 -RuntimeDb '<dedicated acceptance runtime.sqlite>'
```

Do not use `-SkipOllama` for real-model acceptance. In DM PLAY choose content pins, open **Prepare a connected noncombat adventure**, choose two NPCs, locations and scene, then approve once. Switch to the signed player role: enter, accept lead, travel/wait five minutes, deliver report. Ordinary play uses the new primary view. Assisted modes retain private DM draft/approval controls; sovereign mode disables AI. Free speech records an unverified witnessed statement, never item possession or physical proof.

Create a checkpoint before waiting with the existing Save controls. Stop the launcher and open its independent timeline with the same primary RuntimeDb plus `-SaveId <checkpoint-id>`. A twenty-minute wait misses this appointment. Opening a Save requires restart; no live DB replacement or portable single-campaign export is claimed.

Private opt-in automation: `e2e/event-adventure.spec.ts`. VADALLFATE_E2E_HOST_RECORD points to the local launcher PID record. VADALLFATE_E2E_OUTPUT must be a separate disposable browser-artifacts subdirectory, **never the Save directory**. Optional state/checkpoint/screenshot paths stay private. Default mode runs the journey; VADALLFATE_E2E_PHASE values `resume`, `branch`, `branch-resume` verify the respective opened runtime. This opt-in test needs private installed content; normal public tests use redistributable fixtures only.

## API additions

Paths below `/api/v2/content` use existing signed session headers and `contentMutation` snapshot/actionId envelopes. `GET adventure` uses the authenticated assigned character (DM may pass character_id) and returns safe location/time, present NPCs, released knowledge, quest progress, topics/destinations and canonical story events.

Player POSTs: `enter`/`travel` with characterId/locationRef; `wait` with characterId and minutes 5 or 20; `talk` with characterId/npcId/message; `topic` with characterId/npcId/topicId. Use a successful talk/topic receipt actionId as interactionId for existing `ai-reply`. AI replies remain separately committed and labelled by origin.

DM POSTs: `prepare`; `event-quest` with npcId/title/objectives/optional deadlineMinute; `world-event` with eventKey; `activities` with npcId/activities; `revise-knowledge` with npcId/knowledgeId/operation/reason and an admission-shaped replacement for supersede. Knowledge history/revision and behavior-policy controls are in the DM Living world panel. Arbitrary typed quest/activity authoring is API-level; the visual preparation form authors the bounded appointment workflow.

Example original objective:

```json
{"id":"arrival","description":"Reach the meeting place","condition":{"kind":"visit","locationRef":"example.appointment:tower"}}
```

Activity fields: fromMinute/toMinute, locationRef, present, goal; optional eventKey and requiresObjective with questId/objectiveId. Physical cell/scene fields are refused by this narrative activity API; use existing calibrated VTT placement/spatial routine workflows. Schedules never require per-minute model calls.

## Limits and protected work

The 64 KiB staged-request ceiling remains a material campaign-growth limit for the monolithic Save document. Long-campaign storage/migration needs separate approved design against frozen R1 contracts. Repeating calendars/route planning, arbitrary predicates, passive room-wide hearing, full NPC cognition, portable single-campaign export/import, production security certification and source-monster combat remain open. Narrative availability/location changes do not claim validated physical cross-scene travel.

CP149/CP150, original Antigravity checkouts, protected branches, frozen schemas, R1 CommitAuthority, private sources and production Saves remain untouched. New code/tests/docs contain no private source prose, generated packs/proof responses, restricted artwork, credentials or personal absolute paths. New public fixture material is original CC0. Private pack/asset rights remain in local manifests.
