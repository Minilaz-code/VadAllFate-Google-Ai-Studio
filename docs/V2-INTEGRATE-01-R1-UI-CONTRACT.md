# V2-INTEGRATE-01 frontend consumer contract — CP1

Sole implementation owner Codex; Antigravity paused. Frontend exact parent `123738972ee9af5f518cc8e7be8f0b9529f416f9`, branch `codex/v2-integrate-01-ui`. Backend exact parent `5fb661770617306a74133e14cf5e36954f622e17`, branch `codex/v2-integrate-01-backend`.

The single controlling producer/consumer contract is [backend CP1 ec037da6a36cee9cd9238fa4efd17dc5e0df75f5](https://github.com/Minilaz-code/VadAllFate/blob/ec037da6a36cee9cd9238fa4efd17dc5e0df75f5/docs/V2-INTEGRATE-01-R1-UI-CONTRACT.md). No second frontend API/schema is invented.

Normal root startup discovers the actual backend profile before authentication. Existing layered Save header/session/action/receipt endpoints are reused without requiring a developer query string. Compatible controlled fresh campaign only; old legacy campaign conversion remains HOLD. UI never writes HP, initiative, dice results or Save state locally. Existing components render authoritative projections and native receipt evidence. Token/Save changes cancel stale requests and clear prior credentials. No automatic demo fallback or source activation.

NEXT: implement the bounded first-play consumer, retain prior encounter tests, verify actual Windows launcher + headed Edge + full restart. Final paired draft PRs require independent integration review; no merge/deploy, production Save edits, new authority or hold removal.
