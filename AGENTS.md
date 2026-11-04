# VadAllFate React / AI Studio — Contributor and AI Agent Instructions
**Issued:** 2026-11-04. **Status:** playable-first development directive. **Authority:** product sequencing only; no protected merge or bypass of Python R1 holds.

Governing backend documents in Minilaz-code/VadAllFate:
- docs/V2-MASTER-DEVELOPMENT-GOALS.md
- docs/V2-PLAYABLE-FIRST-DELIVERY-ROADMAP-2026-11-04.md
- AGENTS.md
- Exact accepted R1/Combat/Source contracts and live GitHub review gates

## Highest priority: playable non-demo Windows VTT
The next acceptance milestone is a host opening the **real** Windows Python R1 + React application and completing a persistent two-combatant D&D SRD 5.1 encounter with initiative, permitted digital/physical rolls, attack/AC, independently verified damage, HP, rules citations, event/dice history, no unauthorised action, exact receipt and full application restart. No ad-hoc frontend rules adjudication, simulated receipt, manual Save editing or developer-only URL flag may be counted as this milestone.

Maintain honest CONNECTING / CONNECTED / AUTH REQUIRED / DISCONNECTED / EXPLICIT DEMO states. Never silently fall back to in-memory demo when a real connection fails. Existing ?storageAlign=2 is a bounded development profile; do not present it as the complete normal gameplay experience.

## Authority, security and UX
- The React app **captures user intent and displays server-verified projections**. All gameplay permissions, source selection, initiative/dice/HP and Save writes belong to Python R1 and CommitAuthority. Use exact ActionEnvelope/SnapshotRef/CommitReceipt.
- Existing direct SRD SQLite-backed rule lookup is read-only. Do not ask Gemini/Qwen to perform routine rules search.
- Clear DM-only cached resources when role/session/campaign changes. Player, observer and preview screens must never render private notes, NPC memories, unreleased assets, secret fog or DM plans.
- Keep the current approved visual direction: charcoal/slate, bronze/copper, restrained teal. No wholesale layout change without user choice. Phone/tablet ergonomics are important but remote multiplayer is still held.
- Source selection has distinct discover / preview / validate / DM approve / activation / pinned-to-Save stages. A checkbox does not independently make a pack playable.
- Integrate existing character/inventory/spell/notes UI with **authoritative** R1 data; never create a shadow gameplay state in React.
- A source-backed NPC dialogue panel must distinguish live model, human DM reply, draft/approved reply and unavailable inference. No false AI success message.
- Do not open network listeners, tunnel R1 or expose map assets without separate reviewed ACL/origin/session/transport security gates.

## Delivery ownership and tests
Do not edit Codex's WORLD-SOURCE-01 or Antigravity's COMBAT-R1-02 branches from this worktree; cross-owner changes require a separately agreed integration branch and contract. Do not merge protected branches or deploy without explicit user approval.

Before coding, inspect exact GitHub heads, signed-off contracts and existing tests. Prefer reusing the existing playable UI panels rather than rebuilding them. Give each checkpoint a user-facing acceptance scenario, failure paths and Windows Python+React connected verification. Run TypeScript, tests, production build, Playwright headed browser with real backend and restart/Save isolation where relevant. Report exact branches/SHAs, changed files, tests/CI/skips, screenshot/journey evidence, unresolved holds and next action.

A passing component test is not proof of a working default desktop launch. Do not call a feature complete until it is independently reviewed and, when applicable, human accepted.
