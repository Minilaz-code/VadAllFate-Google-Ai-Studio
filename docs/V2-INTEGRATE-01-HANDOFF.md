# V2-INTEGRATE-01 UI handoff

Status: author-tested connected first play; independent integration gate pending. No merge/deploy, legacy Save conversion or production activation.

Branch `codex/v2-integrate-01-ui`, exact parent `123738972ee9af5f518cc8e7be8f0b9529f416f9`. Connected executable UI checkpoint `54703fecf03ecea5be9805d90e7a4ad96894c7d4`; subsequent old-regression harness/evidence commits leave application source identical. Backend paired branch `codex/v2-integrate-01-backend`, tested executable `f42550322539556deb80fcccf43d50a086b300ee`, exact parent `5fb661770617306a74133e14cf5e36954f622e17`.

The [single producer/consumer contract](https://github.com/Minilaz-code/VadAllFate/blob/ec037da6a36cee9cd9238fa4efd17dc5e0df75f5/docs/V2-INTEGRATE-01-R1-UI-CONTRACT.md) was published before UI mutation wiring. [Backend handoff/screenshots/verification](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-integrate-01-backend/docs/V2-INTEGRATE-01-HANDOFF.md) contains reproducible launcher commands, source hashes, API mappings, results and scope.

## Changes

Normal-root startup discovers the actual configured server profile before authentication; no storageAlign query required. Reuse existing signed sessions, per-Save header/credential clearing and fail-closed gateway. Existing CombatTracker permits PC inclusion choice, preserving two-PC default/regressions, and renders native persisted receipts. Existing adapter owns projection refresh; duplicate parent refresh removed. New small read-only Rules panel reuses existing SRD client/formatter, not another engine or AI. Existing e2e Save label updated to Campaign Save. No package/workflow/dependency, source activation, VTT redesign, local HP/dice authority or arbitrary Save path.

New `e2e/v2-integrate-01.spec.ts`: normal root, real API/Edge, Save B then A/authentication, reviewed NPC, one-PC duel/native initiative/digital attacks/unowned refusal/HP/conditions/receipt UI/SRD lookup/end, then separate full process restart/exact native retry/Save/source comparison. Existing `e2e/combat-r1-01.spec.ts` five-combatant journey retained. Its stale expected equipment-error 403 was corrected to the unchanged accepted worker's actual 400, additionally requiring WEAPON_NOT_EQUIPPED and unchanged state/history; no runtime permission relaxation.

## Actual verification

- Node 24.22.1: **160 passed, zero failures/skips**; TypeScript no errors; production Vite build passes (large-chunk warning retained).
- Headed Microsoft Edge **156.0.4314.58** normal-root journey PASS, about 1.5 minutes: nine real digital attacks, Skeleton 0/13 Unconscious, Ada 8/20, actual receipts and read-only SQLite reference.
- Python + React processes stopped/relaunched; normal-root restart test PASS **10.5s**, identical projections/receipts/exact retry/Save B/source hashes.
- Existing five-combatant headed journey PASS **2.3m** and separate restart PASS **12.6s**, preserving source mechanics, physical confirmation, defeat memory and Save isolation.
- Backend final full suite **724 passed, 2 unchanged skips** (1446.01s); focused integration 13 passed. Targeted component suites pass and remain included in final full run.

Each browser phase invocation passes its selected test and skips the other phase by explicit operator phase; no fixtureless/headless success is claimed. Read the committed e2e for exact real actions. Private control paths, tokens, raw response/projection files, Saves and XML/logs remain outside Git. Backend evidence publishes only visually reviewed original/SRD screenshots and sanitized hashes/metadata.

## Run / holds

Use the paired Windows launcher from backend with explicit compatible `-CampaignRoot` (retains existing owned fresh-profile guards), configured checkout/Python/frontend directories. Launcher opens `/` with consumed host-key fragment; authenticate and select Campaign Save. Old legacy campaign Saves are not converted, duplicated or routed to two writers. General campaign creation, production format activation and source imports remain held. The proof uses a fresh original/approved SRD controlled campaign, not all existing Saves or every physical-dice UI combination. Backend R1 remains sole gameplay writer.

Commands: `npm test`, `npm run lint`, `npm run build`; `node node_modules/@playwright/test/cli.js test e2e/v2-integrate-01.spec.ts --headed` with private `VADALLFATE_INTEGRATE_01_CONTROL`, URL/output and phase journey/restart, separated by real launcher shutdown/relaunch. Existing five-combatant e2e uses its existing control/phase variables in another fresh fixture.

Hosted CI is separate from local Windows evidence. Inherited backend Linux Windows-path fixture errors and genuine live-Ollama failure remain HOLD; no workflow/test skips or false inference claim. Exact latest run URLs/SHAs are in paired draft PRs. Human host/independent acceptance not self-issued. Antigravity's original checkout remains untouched.

**STOP: independent integration PASS/HOLD/NO-GO. No protected merge, deployment or automatic next milestone.**
