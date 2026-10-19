import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoCampaignClient, PythonRuntimeGateway, clientManager, runtimeService } from './adapter.ts';
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

test('Projection Isolation: PlayerSafe and ObserverSafe projections exclude quest secrets, dmNotes, guardedSecrets, and undiscovered locations', () => {
  const client = new DemoCampaignClient();

  // Test both player and observer roles
  const roles: Array<'player' | 'observer'> = ['player', 'observer'];

  for (const role of roles) {
    const proj = client.getProjection(role, 'char-kaelen') as any;
    assert.equal(proj.projectionRole, role);

    // 1. Serialization Absence Verification:
    // JSON serialized output must NOT contain confidential secret keys
    const serialized = JSON.stringify(proj);
    assert.equal(
      serialized.includes('dmSecretTwist'),
      false,
      `Serialized ${role} projection leaked "dmSecretTwist"`
    );
    assert.equal(
      serialized.includes('dmNotes'),
      false,
      `Serialized ${role} projection leaked "dmNotes"`
    );
    assert.equal(
      serialized.includes('guardedSecrets'),
      false,
      `Serialized ${role} projection leaked "guardedSecrets"`
    );
    assert.equal(
      serialized.includes('dmSecrets'),
      false,
      `Serialized ${role} projection leaked "dmSecrets"`
    );

    // 2. Hidden tokens exclusion:
    // npc-ghoul-stalker is an ambush monster with isVisibleToPlayers=false; must be completely omitted
    const hasHiddenGhoul = proj.npcs.some((n: any) => n.id === 'npc-ghoul-stalker');
    assert.equal(hasHiddenGhoul, false, `Hidden sentry was exposed in ${role} projection`);

    // 3. Undiscovered locations exclusion:
    // loc-forgotten-crypt has isDiscoveredByParty=false; must be completely omitted
    const hasUndiscoveredCrypt = proj.locations.some((l: any) => l.id === 'loc-forgotten-crypt');
    assert.equal(hasUndiscoveredCrypt, false, `Undiscovered location was exposed in ${role} projection`);

    // All projected locations must have isDiscoveredByParty === true
    for (const loc of proj.locations) {
      assert.equal(loc.isDiscoveredByParty, true);
      assert.equal('dmNotes' in loc, false);
    }

    // 4. Quests allowlist verification:
    // All quests must be stripped of dmSecretTwist
    for (const q of proj.quests) {
      assert.equal('dmSecretTwist' in q, false);
    }

    // 5. NPC allowlist verification:
    const vaelin = proj.npcs.find((n: any) => n.id === 'npc-brother-vaelin');
    assert.ok(vaelin, 'Visible NPC Brother Vaelin should be included');
    // Verify private internal cognition is strictly excluded
    assert.equal('knowledgeBoundary' in vaelin, false, 'Internal knowledgeBoundary must not be exposed to players');
    assert.equal('falseBeliefs' in vaelin, false, 'falseBeliefs must not be exposed to players');
    assert.equal('suspicions' in vaelin, false, 'suspicions must not be exposed to players');
    assert.equal('guardedSecrets' in vaelin, false, 'guardedSecrets must not be exposed to players');
    assert.equal('motivationsAndGoals' in vaelin, false, 'Internal goals must not be exposed to players');
    assert.equal('routinesAndCommitments' in vaelin, false, 'Internal routines must not be exposed to players');
    assert.equal('statBlock' in vaelin, false, 'Combat stat block must not be exposed to players');
    assert.ok(vaelin.publicKnowledge, 'Public knowledge must be present');
    assert.ok(Array.isArray(vaelin.publicKnowledge.publicFacts), 'Public facts array must be present');
  }

  // Verify DM Full projection retains complete data
  const dmProj = client.getProjection('dm_host') as any;
  assert.equal(dmProj.projectionRole, 'dm_host');

  // DM projection retains hidden ghoul
  const dmHasGhoul = dmProj.npcs.some((n: any) => n.id === 'npc-ghoul-stalker');
  assert.equal(dmHasGhoul, true);

  // DM projection retains guarded secrets
  const dmVaelin = dmProj.npcs.find((n: any) => n.id === 'npc-brother-vaelin');
  assert.ok(dmVaelin.knowledgeBoundary.guardedSecrets.length > 0);

  // DM projection retains undiscovered crypt and dmNotes
  const dmCrypt = dmProj.locations.find((l: any) => l.id === 'loc-forgotten-crypt');
  assert.ok(dmCrypt);
  assert.equal(dmCrypt.isDiscoveredByParty, false);
  assert.ok(dmCrypt.dmNotes.length > 0);

  // DM projection retains quest twists
  const dmQuest = dmProj.quests.find((q: any) => q.id === 'quest-unseal-vault');
  assert.ok(dmQuest.dmSecretTwist);
});

test('Negative Case: Player action targeting hidden NPC in demo is rejected', async () => {
  const client = new DemoCampaignClient();
  const snap = client.getCurrentSnapshot();

  // 1. Player attack targeting hidden NPC 'npc-ghoul-stalker'
  const playerAttackHidden: DemoActionEnvelope = {
    actionId: 'act-attack-hidden-npc',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'ATTACK_ACTION',
    payload: {
      attackerId: 'char-kaelen',
      targetId: 'npc-ghoul-stalker', // Hidden sentry
      attackName: 'Longbow Snipe',
      roll: 18,
      isCritical: false,
      isFumble: false,
      totalToHit: 23,
      damage: 9,
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-hidden-npc-001',
  };

  const attackResult = await client.submitAction(playerAttackHidden);
  assert.equal(attackResult.receipt.status, 'REJECTED_UNAUTHORIZED_TARGET');
  assert.match(attackResult.receipt.error || '', /hidden from player view/);

  // 2. Player moving hidden NPC token
  const playerMoveHidden: DemoActionEnvelope = {
    actionId: 'act-move-hidden-npc',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: {
      entityId: 'npc-ghoul-stalker',
      targetX: 50,
      targetY: 50,
      entityType: 'npc',
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-hidden-npc-002',
  };

  const moveResult = await client.submitAction(playerMoveHidden);
  assert.equal(moveResult.receipt.status, 'REJECTED_UNAUTHORIZED_TARGET');
  assert.match(moveResult.receipt.error || '', /hidden from player view/);

  // 3. Player moving visible NPC token
  const playerMoveVisibleNpc: DemoActionEnvelope = {
    actionId: 'act-move-visible-npc',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: {
      entityId: 'npc-brother-vaelin',
      targetX: 50,
      targetY: 50,
      entityType: 'npc',
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-hidden-npc-003',
  };

  const moveVisibleResult = await client.submitAction(playerMoveVisibleNpc);
  assert.equal(moveVisibleResult.receipt.status, 'REJECTED_UNAUTHORIZED_TARGET');
  assert.match(moveVisibleResult.receipt.error || '', /Players cannot move NPC tokens/);

  // 4. DM attack targeting hidden NPC succeeds
  const dmAttackHidden: DemoActionEnvelope = {
    actionId: 'act-dm-attack-hidden',
    actorId: 'dm-host',
    actorRole: 'dm_host',
    actionType: 'ATTACK_ACTION',
    payload: {
      attackerId: 'char-kaelen',
      targetId: 'npc-ghoul-stalker',
      attackName: 'Longbow Snipe',
      roll: 18,
      isCritical: false,
      isFumble: false,
      totalToHit: 23,
      damage: 5,
    },
    snapshotRef: snap,
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-hidden-npc-004',
  };

  const dmResult = await client.submitAction(dmAttackHidden);
  assert.equal(dmResult.receipt.status, 'COMMITTED');
});

test('Client-Switch Isolation: Active client routing and fail-closed submission', async () => {
  // 1. Switch client to Python Gateway (disconnected)
  clientManager.switchClient(false);
  assert.equal(clientManager.isUsingDemo(), false);

  const activeClient = clientManager.getClient();
  assert.equal(activeClient instanceof PythonRuntimeGateway, true);

  const dummyEnvelope: DemoActionEnvelope = {
    actionId: 'act-switch-test',
    actorId: 'char-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: { entityId: 'char-kaelen', targetX: 30, targetY: 30 },
    snapshotRef: { campaignId: 'DISCONNECTED', commitSequence: 0, stateHash: 'NONE', worldMinute: 0 },
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-switch-test-001',
  };

  // Calling through activeClient directly fails closed
  await assert.rejects(
    async () => await activeClient.submitAction(dummyEnvelope),
    /Python R1 runtime gateway is disconnected/
  );

  // Calling through dynamic runtimeService proxy also fails closed and NEVER touches demo state
  await assert.rejects(
    async () => await runtimeService.submitActionEnvelope(dummyEnvelope),
    /Python R1 runtime gateway is disconnected/
  );

  // Mutating time fails closed
  assert.throws(
    () => runtimeService.advanceTime(10),
    /Cannot advance time: Python runtime disconnected/
  );

  // 2. Switch client back to Demo
  clientManager.switchClient(true);
  assert.equal(clientManager.isUsingDemo(), true);

  const snap = clientManager.getClient().getCurrentSnapshot();
  const validDemoEnvelope: DemoActionEnvelope = {
    ...dummyEnvelope,
    actionId: 'act-switch-test-restored',
    snapshotRef: snap,
    clientNonce: 'nonce-switch-restored-002',
  };

  // Submitting through dynamic runtimeService now succeeds in demo client
  const restoredResult = await runtimeService.submitActionEnvelope(validDemoEnvelope);
  assert.equal(restoredResult.receipt.status, 'COMMITTED');
});

test('Gateway Status Reporting: Disconnected gateway separates intended authority from action readiness', () => {
  const gateway = new PythonRuntimeGateway('http://localhost:8000/api/v1/runtime');
  const status = gateway.getConnectionStatus();

  // Intended authority is canonical Python backend
  assert.equal(status.intendedAuthority, 'CANONICAL_PYTHON_BACKEND');

  // Actual verified connection state is false
  assert.equal(status.isConnectedToLivePython, false);

  // Disconnected gateway CANNOT claim present authority or accept actions
  assert.equal(status.isCurrentlyAuthoritative, false);
  assert.equal(status.canAcceptAuthoritativeActions, false);
  assert.match(status.statusLabel, /Fail-Closed, Non-Authoritative/);

  // Compare with Demo client status
  const demoClient = new DemoCampaignClient();
  const demoStatus = demoClient.getConnectionStatus();
  assert.equal(demoStatus.intendedAuthority, 'NON_AUTHORITATIVE_DEMO');
  assert.equal(demoStatus.isCurrentlyAuthoritative, false);
  assert.equal(demoStatus.canAcceptAuthoritativeActions, false);
});

test('Canonical Contract Placeholders: Stubs are explicitly unverified without speculative schemas', () => {
  // Verify that the unverified placeholder objects can be typed and bear the unverified notice
  const stubAction: import('../types/runtime.ts').UnverifiedCanonicalActionEnvelopePlaceholder = {
    _unverifiedNotice: 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE',
  };
  assert.equal(stubAction._unverifiedNotice, 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE');

  const stubReceipt: import('../types/runtime.ts').UnverifiedCanonicalCommitReceiptPlaceholder = {
    _unverifiedNotice: 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE',
  };
  assert.equal(stubReceipt._unverifiedNotice, 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE');
});
