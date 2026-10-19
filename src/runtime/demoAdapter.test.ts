import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoCampaignClient, PythonRuntimeGateway } from './adapter.ts';
import type { DemoActionEnvelope } from '../types/runtime.ts';

test('Negative Case: Movement targeting nonexistent entity is rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-move-nonexistent',
    actorId: 'nonexistent-ghost-actor',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: {
      entityId: 'nonexistent-ghost-actor',
      targetX: 50,
      targetY: 50,
      entityType: 'character',
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-neg-001',
  };

  const { receipt } = await client.submitAction(envelope);
  assert.equal(receipt.status, 'REJECTED_NONEXISTENT_ENTITY');
  assert.match(receipt.error || '', /does not exist in campaign/);
});

test('Negative Case: Out-of-bounds token coordinates are rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-move-oob',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: {
      entityId: 'char-kaelen',
      targetX: 150, // Out of bounds > 100
      targetY: -20, // Out of bounds < 0
      entityType: 'character',
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-neg-002',
  };

  const { receipt } = await client.submitAction(envelope);
  assert.equal(receipt.status, 'REJECTED_OUT_OF_BOUNDS');
  assert.match(receipt.error || '', /outside valid grid bounds/);
});

test('Negative Case: Attack against nonexistent target is rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-atk-invalid-target',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'ATTACK_ACTION',
    payload: {
      attackerId: 'char-kaelen',
      targetId: 'invalid-nonexistent-monster',
      attackName: 'Longbow Snipe',
      roll: 15,
      isCritical: false,
      isFumble: false,
      totalToHit: 18,
      damage: 6,
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-neg-003',
  };

  const { receipt } = await client.submitAction(envelope);
  assert.equal(receipt.status, 'REJECTED_INVALID_TARGET');
  assert.match(receipt.error || '', /unavailable or nonexistent/);
});

test('Negative Case: Natural-1 attack fumbles dealing damage are rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-atk-fumble-damage',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'ATTACK_ACTION',
    payload: {
      attackerId: 'char-kaelen',
      targetId: 'npc-brother-vaelin',
      attackName: 'Longbow Snipe',
      roll: 1, // Nat 1 fumble!
      isCritical: false,
      isFumble: true,
      totalToHit: 4,
      damage: 10, // Invariant violation: fumble cannot deal damage!
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-neg-004',
  };

  const { receipt } = await client.submitAction(envelope);
  assert.equal(receipt.status, 'REJECTED_VALIDATION_FAILURE');
  assert.match(receipt.error || '', /Natural-1 attack fumbles cannot deal damage/);
});

test('Negative Case: Duplicate action nonce replay is rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-idempotency-1',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'SKILL_CHECK',
    payload: {
      skillName: 'Perception',
      roll: 12,
      modifier: 3,
      total: 15,
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'unique-nonce-12345',
  };

  // First submission succeeds
  const first = await client.submitAction(envelope);
  assert.equal(first.receipt.status, 'COMMITTED');

  // Second submission with exact same clientNonce must be rejected
  const replay = await client.submitAction(envelope);
  assert.equal(replay.receipt.status, 'REJECTED_DUPLICATE_NONCE');
  assert.match(replay.receipt.error || '', /Duplicate action detected/);
});

test('Negative Case: Stale snapshot rejection', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  // Create an envelope with an old commitSequence
  const staleEnvelope: DemoActionEnvelope = {
    actionId: 'act-stale-test',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'SKILL_CHECK',
    payload: { skillName: 'Stealth', roll: 10, modifier: 3, total: 13 },
    snapshotRef: { ...snap, commitSequence: snap.commitSequence - 1 },
    timestampUtc: new Date().toISOString(),
    clientNonce: 'stale-nonce-999',
  };

  const { receipt } = await client.submitAction(staleEnvelope);
  assert.equal(receipt.status, 'REJECTED_STALE_SNAPSHOT');
  assert.match(receipt.error || '', /Stale snapshot rejected/);
});

test('Negative Case: Advancing time while world clock is paused is rejected', async () => {
  const client = new DemoCampaignClient();
  client.toggleClockPause(); // Pause the clock
  const snap = client.getCurrentSnapshot();

  const envelope: DemoActionEnvelope = {
    actionId: 'act-advance-paused',
    actorId: 'dm',
    actorRole: 'dm_host',
    actionType: 'ADVANCE_TIME',
    payload: { minutes: 30 },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'paused-clock-nonce-888',
  };

  const { receipt } = await client.submitAction(envelope);
  assert.equal(receipt.status, 'REJECTED_VALIDATION_FAILURE');
  assert.match(receipt.error || '', /Cannot advance time while Master World Clock is paused/);
});

test('Gateway Isolation: Disconnected PythonRuntimeGateway safely rejects writes', async () => {
  const gateway = new PythonRuntimeGateway('http://localhost:8000/api/v1/runtime');
  const snap = gateway.getCurrentSnapshot();
  assert.equal(gateway.getConnectionStatus().isConnectedToLivePython, false);

  const envelope: DemoActionEnvelope = {
    actionId: 'act-gateway-test',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: { entityId: 'char-kaelen', targetX: 20, targetY: 20 },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'gateway-nonce-001',
  };

  // Must reject and NOT fall back to local demo commits
  await assert.rejects(
    async () => await gateway.submitAction(envelope),
    /Python R1 runtime gateway is disconnected/
  );
});

test('Projection Isolation: PlayerSafe projection strips guardedSecrets and hidden tokens', () => {
  const client = new DemoCampaignClient();
  
  // 1. Get Player projection
  const playerProj = client.getProjection('player', 'char-kaelen') as any;
  assert.equal(playerProj.projectionRole, 'player');

  // Verify hidden sentry (Ghoul) is stripped
  const hasHiddenGhoul = playerProj.npcs.some((n: any) => n.id === 'npc-ghoul-stalker');
  assert.equal(hasHiddenGhoul, false);

  // Verify Brother Vaelin's guarded secrets are stripped
  const vaelin = playerProj.npcs.find((n: any) => n.id === 'npc-brother-vaelin');
  assert.ok(vaelin);
  assert.deepEqual(vaelin.knowledgeBoundary.guardedSecrets, []);

  // Verify DM notes are redacted in locations
  const antechamber = playerProj.locations.find((l: any) => l.id === 'loc-vault-antechamber');
  assert.ok(antechamber);
  assert.match(antechamber.dmNotes, /CONFIDENTIAL DM DATA EXCLUDED/);

  // 2. Get DM Full projection
  const dmProj = client.getProjection('dm_host') as any;
  assert.equal(dmProj.projectionRole, 'dm_host');

  // DM projection retains hidden ghoul
  const dmHasGhoul = dmProj.npcs.some((n: any) => n.id === 'npc-ghoul-stalker');
  assert.equal(dmHasGhoul, true);

  // DM projection retains guarded secrets
  const dmVaelin = dmProj.npcs.find((n: any) => n.id === 'npc-brother-vaelin');
  assert.ok(dmVaelin.knowledgeBoundary.guardedSecrets.length > 0);
});
