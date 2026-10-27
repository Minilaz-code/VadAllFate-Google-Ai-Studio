# VadAllFate V2 — Player Experience, VTT and Frontend Rebuild Brief

**Product decision:** 2026-10-27  
**Status:** APPROVED USER-OBSERVED REQUIREMENTS / FRONTEND DELIVERY BACKLOG — NOT IMPLEMENTED OR VERIFIED  
**Repository:** Minilaz-code/VadAllFate-Google-Ai-Studio; development branch v2/srd51-rules-browser  
**Applies with:** docs/V2-INTEGRATION-INSTRUCTIONS.md and Python repository docs/V2-ARCHITECTURE-INSTRUCTIONS-HARNESS-KNOWLEDGE-GRAPH.md, docs/V2-PORTABLE-CAMPAIGN-PACKS-AND-OBSIDIAN-INTEROP.md. Preserve R1 Commit Authority, single authoritative SQLite, source provenance, licensing, role-based secrecy, V2 security, frozen schemas, Step 51 monster hold, CP017B hold, no unverified gameplay.

## Why this is needed: actual player/host acceptance feedback

Despite earlier success claims and headless smoke tests, the user launched and interacted with the V2 interface and reports:

1. Application still appears in Demo Mode, with controls that do not affect the live game.
2. Player-entered text is saved to Events but does not appear in the dialogue/narrative window.
3. Combat view lacks a practical, integrated tracker for initiative/turns, current/max/temporary HP, conditions, resources and spell slots.
4. Character sheets and notes are not discoverable/useful from normal play. There are components for them, but navigational presence is not user-verified functionality.
5. Current battlemap/VTT is cramped and clunky, with too little usable editing surface.
6. Imported Blue Alley map cannot be aligned to the grid without zooming/cropping away most (~80%) of the image. Map must retain full image when calibrating grid independently.
7. Current frontend style is not acceptable: dense panels, cluttered controls and typography, insufficient hierarchy. User expects modern dark charcoal/slate with bronze/copper accents and teal highlights, responsive for desktop/tablet/mobile.

These reports outweigh fixture-only "verified" labels. Do not mark user experience PASS until a human can complete each acceptance scenario in the real installed app. Do NOT equate demo UI previews and API-level tests with usable gameplay.

## Delivery scheduling / dependencies

**Immediate P0 (not postponed):** fix live/auth/demo start behaviour, the narrative dialogue display and other basic interaction blockers, integrated with current Milestone 10B / Milestone 11 backend verification. The user must be able to tell definitively which runtime is active and why they cannot interact.

**Main frontend effort:** begin after backend is stable enough to provide trustworthy auth, authoritative action/result projections, campaign pack admission and CRUD contracts — do NOT wait for every living-world subsystem or the "entire backend" to be finished. Run UX and backend development in parallel through explicit versioned APIs after stability gates.

Do not allow battlemap persistence to replace CPP-03 campaign-pack admission. Maintain independent but integrated VTT and UX workstreams.

## UX-00 — Architecture-to-UX mapping, live/demo truth and visual design system

- Audit app shell, Header, CampaignClientManager, PythonRuntimeGateway, projections, permission matrix, notes, character sheet modal/view, NarrativePlayView, BattlemapCanvas, battlemapSessionManager, source pack panels and existing tests.
- Diagnose why normal Windows-launcher flow still opens Demo Mode despite auth handoff. The source currently defaults CampaignClientManager to DemoCampaignClient and attempts live connection on key/session in App.tsx; test all start paths and meaningful failures. Live launcher should make an authorised live attempt and visibly show CONNECTED / AUTH REQUIRED / DISCONNECTED / EXPLICIT DEMO. Never silently redirect failed live actions to demo data.
- Display an actionable connection reason (authentication failed / Python unavailable / port mismatch / backend rejected / stale token), plus retry, authenticate and safe logout.
- Remove fake, hardcoded campaign context from production (e.g. Yawning Portal scene when running the Aethelgard demo). The content shown must come from the selected campaign/save and authorised user role.
- Design a coherent visual system based on dark charcoal/slate, bronze/copper, selective teal, readable typography, clear hierarchy, restrained visual density, generous gameplay space and adaptive layouts. Preserve a functional low-resource Windows baseline.

## UX-01 — Live narrative feed, conversation and event ledger

**Verified source-code issue at decision date:** NarrativePlayView.tsx declares hardcoded narrativeFeed items n1–n4 and renders narrativeFeed.map, while the real runtime's events are rendered separately in the right-hand timeline. This explains user-visible input that reaches Events but never appears in the dialogue pane.

- Replace static story feed with authoritative, persisted, role-filtered timeline from selected Save, with typed UI entries for narration, player actions, spoken dialogue, NPC replies, skill checks, rule adjudication, system/status/errors and directed/private communication.
- Preserve separate audit/event ledger for machine events; readable narrative window should reflect actual meaningful events in chronological order. Never manufacture NPC speech from mere event names or misrepresent an uncommitted proposal as spoken canon.
- On submit: show pending state, committed receipt or explicit error; display the player's original utterance and any independently recorded NPC/narrator reply. Never pretend an AI response was created when runtime only logged an action.
- Make dialogue reliable after switching tabs, reconnecting and restarting; support scroll-to-new, search/filter, readable speaker attribution, date/world-clock stamp, optional roll details and export by authorised role.
- Acceptance: user types a line in roleplay, obtains one actual authoritative result, sees their line and relevant response in the central transcript, not only the separate Events sidebar. Refresh preserves chronology and DM-only material never leaks.

## UX-02 — Usable character sheets, journal and combat tracker

- Provide clear character sheet and Notes/Journal access from play without searching multiple unrelated tabs; full character sheet, spells, equipment, skills, proficiencies, conditions, hit dice, biography, inventory and role-scoped editing as supported by backend authority.
- Provide player notes, DM-only notes and party-shared journals; Markdown, wikilinks and Obsidian-style backlinks and eventual native graph view. A player's theories are not canon and must not be written into world fact tables.
- Upgrade combat UI from demonstration initiative strip to a real initiative and round/turn tracker with per-combatant HP current/max/temp, AC, conditions, death saves, concentration, effect durations, spell slots by level, used/remaining charges, hit dice and rest resources **where authoritative backend supports them**; show explicit pending/unsupported on held mechanics.
- Character sheet and combat tracker must display consistent authoritative values and respond to damage, healing, casting, rests, approved adjudications, veto/correction and restart. Do not give players edit access to NPC secrets or DM/Host-only controls.
- DM needs easy authorised HP/spell/resource adjustment and quick combat actions through existing validation and Commit Authority, not client-side local mutation.
- Acceptance: after an attack and a spell, the selected character sheet, combat tracker and transcript agree on committed HP/spell slot effects; restart retains them; DM corrections are logged; no monster-combat hold bypass.

## UX-03 — Spacious professional VTT, image and grid calibration

**Verified source-code issue at decision date:** BattlemapCanvas.tsx places artwork in a centered flex container with `overflow-hidden`, itself constrained to grid.width * cellSizePx by grid.height * cellSizePx. Imported images default to scale=1; calibration changes the artwork transform within the clipping surface. This can conceal large parts of a high-resolution image while attempting to align its printed squares.

- Implement a genuinely large, resizable/fullscreen canvas workspace (collapsible panels, no narrow fixed map zone, smooth pan/zoom, touch/tablet support, map-first layout).
- Keep distinct coordinate systems: natural image pixels; overlay-grid coordinates; world/game distances; viewport pan/zoom. Grid calibration must NOT involuntarily rescale/crop the source image.
- Support image-first import: display the ENTIRE Blue Alley artwork with aspect ratio intact by default ("fit whole image" / letterboxing), independent of grid dimensions. Allow freely expanding editable world canvas/map extents beyond initial grid, resizing grid counts and cell size without destructive crop.
- Support transparent overlay grid with adjustable grid origin X/Y, rotation if necessary, cell pitch/scale in pixels, per-map feet per cell, alignment using at least two known image-grid points, optional manual nudging, snap toggle and easy reset. Zoom-to-fit, zoom-to-100%, and artwork calibration must be distinct controls.
- Permit grids over preprinted battlemaps without rewriting original pixels. Define crop/clip only as an explicit user-selected, reversible export/view option; never silently crop imported artwork.
- Persist original imported artwork asset (not ephemeral blob URL), aspect ratio, transforms, scene geometry, walls, doors, fog, revealed state, tokens and alignment per map through approved backend contracts, Save isolation and ACL.
- Avoid browser memory blowups for high-resolution maps; sensible max dimensions/tile strategy and performance guardrails. Map controls must work for desktop and tablet/touch.
- Acceptance fixture: import original user-supplied Blue Alley image (or a large asymmetric-grid fixture if unavailable), see 100% of the artwork immediately, align the overlay grid to preprinted squares, pan/zoom and save/reopen WITHOUT permanently hiding any artwork, shifting grid alignment or losing geometry. Test both wide and tall images; percentage of artwork retained should be 100% excluding deliberate user cropping.

## UX-04 — Full frontend composition and interaction redesign

- Design around the three approved workspaces: Play/Host, DM Planning, Homebrew Workshop; accessible Character/Journal and Pack Manager in appropriate contexts.
- Play/Host: left contextual navigator, dominant central tabbed Story/VTT area with resizable split, right inspector/DM tools/combat/status; bottom narration/chat/voice/dice when useful. Fullscreen VTT and distraction-free reading mode.
- Clean, responsive, consistent typography. Eliminate tiny labels for core actions, gratuitous panes, demo labels in real play, redundant actions and sprawling controls. Prefer deliberate progressive disclosure.
- Consistent light interaction/contrast/accessibility, keyboard navigation, focus states, character and DM role protections, scalable layout desktop/tablet/mobile.
- Produce before/after screenshots and user-observable click-through scenarios, not just unit tests. Get feedback against proposed UI direction before wholesale replacement of working components.
- No change to the Python runtime architectural authority, rules reference DB, commits or source pack licensing because of appearance work.

## UX-05 — Campaign Pack Manager integration (CPP-04)

- Once CPP-03 Python APIs exist, build actual pack staging/upload, provenance/licence/edition/dependency preview, conflict resolution, role-safe per-record approval, install, version update, export, graph/Canvas/CSV/Markdown round-trip.
- Show source and import statuses. Never imply an inspected pack is active or executable; never run imported scripts.
- Support external-AI authoring brief and compatible examples; the user should be able to import a self-authored adventure with NO backend code edits.
- Later CPP-05 migrates original Dragon Heist M03–M16 baseline and supplements; preserve campaign-specific DM secrets and active Save separation.

## Acceptance gates and tracking

1. Production starts in attempted live mode from Windows launcher and cannot silently remain interactive demo. Users can see CONNECTED / AUTH REQUIRED / DISCONNECTED / EXPLICIT DEMO unambiguously.
2. Actions entered in the player's dialogue composer appear in the live dialogue feed, along with genuinely returned narration/NPC speech.
3. Character sheets, notes and authorised editing are discoverable within one interaction from play.
4. Combat tracker shows and persists HP, slots and conditions where supported, reflecting authority, turns and revocable approvals.
5. Full-map import retains ALL original artwork; Blue Alley calibration aligns overlay without 80% loss or destructive crop; transforms survive reload.
6. New UX visual design demonstrably improves information hierarchy and central gameplay area without breaking accessibility or DM secrecy.
7. Every result verified with local Windows live Python stack, real browser clicking, backend/frontend regression and actual human UAT; code inspection or demo fixture pass alone is insufficient.

**Status discipline:** User-observed broken UX remains OPEN even if previous implementation registers used "verified working" for narrower backend code-path tests. Keep source-provenance and truth of tests separate from user acceptance. Do not make commitments that every backend subsystem must be "complete" before frontend work begins.
