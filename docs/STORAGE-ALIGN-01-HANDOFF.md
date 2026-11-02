# STORAGE-ALIGN-01 frontend review

Branch `codex/v2-storage-align-01`, based on PLAY-00 `9b67fa310b76c3a2e19d3ea2adbed38aed6fca03`. [Backend handoff and evidence](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-storage-align-01/docs/STORAGE-ALIGN-01-HANDOFF.md).

Explicit `?storageAlign=1` mounts `StorageAlignmentPlay`, using the existing Windows launcher/Python/React connection. No silent fallback, legacy Save conversion or normal granular activation. The normal App component is unchanged. UI selects only fresh disposable A/B, authenticates using the existing server registry, shows pinned layered provenance and the actual committed revision, and submits closed resource, NPC testimony/relationship and clock/objective actions. The server determines role; player receives no private memory/trust or DM controls. No AI or source-combat integration claimed.

Actual headed Edge journey passed (4.6s final case): independent A/B outcomes, resource quantities/HP, testimony/trust, clock/objective, explicit audit and player secrecy. Complete Windows service restart/new browser passed (2.5s final case): both Save projections/snapshots and source bytes identical. See `e2e/storage-align.spec.ts` for private-control/phase guards and backend handoff for reproduction. Raw responses/screenshots/keys remain outside Git.

154 frontend tests passed; direct TypeScript and production build passed (existing Vite native-loader/large-chunk advisories). Development profile only; complete legacy worksheets/VTT/dialogue are not migrated. Production activation, full domain owners, source publication and I8 remain held. STOP for paired review.
