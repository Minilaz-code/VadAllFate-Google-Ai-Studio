# PLAY-00 frontend handoff

Development branch `codex/v2-play-00`, based on actual application reliability branch, not the prepared I7T-02 profile. Backend companion: [application readiness](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-play-00/docs/PLAY-00-APPLICATION-READINESS.md).

Added authoritative live d20/physical confirmation panel and bounded existing DM HP adjudication; practice dice explicitly unsaved and no longer submit a different hidden action. Signed assigned identity replaces demo identity in live projections. Invited-player login works without DM credentials. Live starts before first render, connection status requires actual projections, and explicit `?demo=1` is the only demo boot. NPC and dice actions interlock refresh. No new combat or source mechanics.

154 frontend tests PASS; TypeScript PASS via `node node_modules/typescript/bin/tsc --noEmit`; production build PASS (existing large bundle/native-config warnings). On this ampersand-containing checkout `npx tsc` shell wrapper failed; direct Node invocation passes. Real headed Windows Edge: resource/dice, story evidence, cold restart, invited browser and explicit demo checks completed. Evidence collection includes HOLD and is not a full gameplay PASS.

Automatic recall and legacy staged-request growth remain HOLD; chatty background reads can still receive 429 under unchanged rate policy. No storage activation/migration, I8, audit-policy change or protected merge. See paired backend gap and integrity documents. Preserve original checkouts; review these branches and cherry-pick only after review. Do not merge fixture branches as application integration. STOP for PLAY-00 review.
