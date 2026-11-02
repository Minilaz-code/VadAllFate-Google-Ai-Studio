# Verified FORK-1 / ADMISSION-REPAIR-1 publication

2026-11-02. These immutable commits contain the reviewed implementations/proofs and paired handoffs. Both branch refs were read back from GitHub after normal pushes. Subsequent documentation-only commits may advance the branch heads; verify current heads with `git ls-remote origin refs/heads/codex/v2-granular-i7f refs/heads/codex/v2-granular-i7q`.

| Review unit | Repository | Verified implementation/handoff commit |
| --- | --- | --- |
| FORK-1, `codex/v2-granular-i7f` | [Backend](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i7f) | `afbeb614b676e83335e766e6bcaf5dbc06131468` |
| FORK-1, `codex/v2-granular-i7f` | [Frontend](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i7f) | `abb873ff3cd756e246ca61e3a8f046240456011d` |
| ADMISSION-REPAIR-1, `codex/v2-granular-i7q` | [Backend](https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i7q) | `0de06816ffd3c87f36f91638c0e17527d06bd010` |
| ADMISSION-REPAIR-1, `codex/v2-granular-i7q` | [Frontend](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i7q) | `f04874b600675069f200bef942542c5cc62fd4fa` |

- [Immutable FORK-1 handoff](https://github.com/Minilaz-code/VadAllFate/blob/afbeb614b676e83335e766e6bcaf5dbc06131468/docs/V2-GRANULAR-I7F-HANDOFF.md).
- [Immutable queue-recovery handoff](https://github.com/Minilaz-code/VadAllFate/blob/0de06816ffd3c87f36f91638c0e17527d06bd010/docs/V2-GRANULAR-I7Q-HANDOFF.md).
- [Consolidated readiness](V2-GRANULAR-I7-FQ-READINESS.md) and backend `docs/evidence/V2-GRANULAR-I7-FQ-VERIFICATION.json` contain final actual regressions: 435 targeted passed; 940 broad passed, two existing environment skips; 157 frontend tests/TypeScript/build passed.

Q follows F as a separate review increment. Review the approved I7R-to-F diff, then F-to-Q; do not merge protected branches, activate fixture modes or convert existing Saves. Both standalone first-slice contracts pass; F+Q composition/nested forks, complete typed ownership and production integrity cost remain unresolved. I7 remains INCOMPLETE; I8 and live activation remain held. No force push, production data change or endurance rerun was performed.
