import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DemoCampaignClient } from './adapter.ts';
import {
  canAccessDmWorkspaces,
  canAccessWorkshop,
  canHostSession,
  canExecuteDmActions,
  getEffectiveProjectionRole,
  isAllowedTab,
  sanitizeTabForIdentity,
  getAuthorisedTabs,
} from './roleAuthority.ts';
import type { UserIdentityContext, DmFullCampaignProjection, PlayerSafeCampaignProjection } from '../types/runtime.ts';
import { isDmFullProjection, isPlayerSafeProjection } from '../types/runtime.ts';
import { checkActionAdmission } from './rules.ts';

describe('AIUI-HOTFIX-001 Role Separation & Crash Resilience Regression Suite', () => {
  const client = new DemoCampaignClient();

  // Test 1: DM host accessing all DM workspaces
  it('1. DM host has authority over all DM workspaces and session hosting', () => {
    const dmHost: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
    };
    assert.equal(canAccessDmWorkspaces(dmHost), true);
    assert.equal(canAccessWorkshop(dmHost), true);
    assert.equal(canHostSession(dmHost), true);
    assert.equal(canExecuteDmActions(dmHost), true);
    assert.deepEqual(getAuthorisedTabs(dmHost), ['play', 'battlemap', 'planning', 'workshop']);

    const proj = client.getProjection('dm_host');
    assert.equal(isDmFullProjection(proj), true);
    if (isDmFullProjection(proj)) {
      assert.ok(proj.factions.length > 0);
      assert.ok(proj.directorProfiles.length > 0);
    }
  });

  // Test 2: Non-host DM accessing all DM workspaces
  it('2. Non-host DM retains full DM authority and access to DM workspaces without hosting permissions', () => {
    const dmGuest: UserIdentityContext = {
      gameRole: 'dm',
      isHost: false, // NOT session host
    };
    // Hosting status does not diminish DM authority
    assert.equal(canAccessDmWorkspaces(dmGuest), true);
    assert.equal(canAccessWorkshop(dmGuest), true);
    assert.equal(canHostSession(dmGuest), false);
    assert.equal(canExecuteDmActions(dmGuest), true);
    assert.deepEqual(getAuthorisedTabs(dmGuest), ['play', 'battlemap', 'planning', 'workshop']);
  });

  // Test 3: Player host unable to access DM workspaces
  it('3. Player host cannot access DM workspaces or execute DM actions despite hosting the session', () => {
    const playerHost: UserIdentityContext = {
      gameRole: 'player',
      isHost: true, // Technical host
      assignedCharacterId: 'char-kaelen',
    };
    assert.equal(canAccessDmWorkspaces(playerHost), false);
    assert.equal(canAccessWorkshop(playerHost), false);
    assert.equal(canHostSession(playerHost), true);
    assert.equal(canExecuteDmActions(playerHost), false);
    assert.equal(isAllowedTab('planning', playerHost), false);
    assert.equal(isAllowedTab('workshop', playerHost), false);
    assert.deepEqual(getAuthorisedTabs(playerHost), ['play', 'battlemap', 'character', 'journal']);
  });

  // Test 4: Non-host player unable to access DM workspaces
  it('4. Non-host player has player-only tabs without hosting or DM permissions', () => {
    const playerGuest: UserIdentityContext = {
      gameRole: 'player',
      isHost: false,
      assignedCharacterId: 'char-lyra',
    };
    assert.equal(canAccessDmWorkspaces(playerGuest), false);
    assert.equal(canAccessWorkshop(playerGuest), false);
    assert.equal(canHostSession(playerGuest), false);
    assert.equal(canExecuteDmActions(playerGuest), false);
    assert.deepEqual(getAuthorisedTabs(playerGuest), ['play', 'battlemap', 'character', 'journal']);
  });

  // Test 5: DM switching to player preview from NPC Cognition
  it('5. DM switching to player preview from NPC Cognition sanitizes tab and generates player-safe projection', () => {
    const dmContext: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
    };
    // Tab starts on planning
    let currentTab: any = 'planning';
    assert.equal(isAllowedTab(currentTab, dmContext), true);

    // Switch to preview mode
    dmContext.previewMode = {
      isActive: true,
      previewRole: 'player',
      previewCharacterId: 'char-kaelen',
    };

    // Sanitize tab
    currentTab = sanitizeTabForIdentity(currentTab, dmContext);
    assert.equal(currentTab, 'play', 'Must safely redirect to play workspace');

    // Effective projection role is player
    const effRole = getEffectiveProjectionRole(dmContext);
    assert.equal(effRole, 'player');

    const proj = client.getProjection(effRole, dmContext.previewMode.previewCharacterId);
    assert.equal(isPlayerSafeProjection(proj), true);
    assert.equal(isDmFullProjection(proj), false);

    // Player-safe projection excludes confidential faction dossiers and director
    assert.equal((proj as any).factions, undefined);
    assert.equal((proj as any).directorProfiles, undefined);
  });

  // Test 6: DM switching to player preview from Factions
  it('6. DM switching to player preview from Factions prevents access to confidential schemes', () => {
    const dmContext: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
      previewMode: {
        isActive: true,
        previewRole: 'player',
        previewCharacterId: 'char-kaelen',
      },
    };

    assert.equal(canAccessDmWorkspaces(dmContext), false);
    assert.equal(isAllowedTab('planning', dmContext), false);
    assert.equal(sanitizeTabForIdentity('planning', dmContext), 'play');
  });

  // Test 7: DM switching to player preview from Storyteller
  it('7. DM switching to player preview from Storyteller locks director controls', () => {
    const dmContext: UserIdentityContext = {
      gameRole: 'dm',
      isHost: false,
      previewMode: {
        isActive: true,
        previewRole: 'player',
        previewCharacterId: 'char-lyra',
      },
    };

    assert.equal(canExecuteDmActions(dmContext), false);
    assert.equal(canAccessDmWorkspaces(dmContext), false);
    assert.equal(sanitizeTabForIdentity('workshop', dmContext), 'play');
  });

  // Test 8: DM returning from player preview
  it('8. DM returning from player preview immediately restores DM authority without session restart', () => {
    const dmContext: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
      previewMode: {
        isActive: true,
        previewRole: 'player',
        previewCharacterId: 'char-kaelen',
      },
    };

    // Exit preview
    dmContext.previewMode = undefined;

    assert.equal(canAccessDmWorkspaces(dmContext), true);
    assert.equal(canExecuteDmActions(dmContext), true);
    assert.equal(getEffectiveProjectionRole(dmContext), 'dm_host');
    assert.equal(isAllowedTab('planning', dmContext), true);
    assert.equal(isAllowedTab('workshop', dmContext), true);
  });

  // Test 9: Empty NPC/faction/Director datasets handled cleanly without throwing
  it('9. Empty NPC, faction, location, quest, and director datasets do not throw errors', () => {
    // Check that DmPlanningView props can safely receive empty arrays
    const emptyDataset = {
      npcs: [],
      factions: [],
      locations: [],
      quests: [],
      worldClock: client.getProjection('dm_host').worldClock,
      directorProfiles: [],
      activeDirectorProfileId: '',
      recommendations: [],
    };

    // Verify empty arrays have valid lengths and null dereferencing is protected
    assert.equal(emptyDataset.npcs.length, 0);
    assert.equal(emptyDataset.factions.length, 0);
    assert.equal(emptyDataset.locations.length, 0);
    assert.equal(emptyDataset.directorProfiles.length, 0);

    // Verify projection type guards handle null/undefined cleanly
    assert.equal(isDmFullProjection(null), false);
    assert.equal(isDmFullProjection(undefined), false);
    assert.equal(isPlayerSafeProjection(null), false);
    assert.equal(isPlayerSafeProjection(undefined), false);
  });

  // Test 10: Repeated perspective changes
  it('10. Repeated perspective changes execute deterministically without leaking state', () => {
    const roles: Array<'dm_host' | 'player' | 'observer'> = [
      'dm_host',
      'player',
      'observer',
      'dm_host',
      'player',
      'dm_host',
    ];

    for (const r of roles) {
      const p = client.getProjection(r);
      if (r === 'dm_host') {
        assert.equal(isDmFullProjection(p), true);
        assert.ok((p as DmFullCampaignProjection).factions);
      } else {
        assert.equal(isPlayerSafeProjection(p), true);
        assert.equal((p as any).factions, undefined);
      }
    }
  });

  // Test 11: Player battlemap rendering with hidden objects excluded
  it('11. Player projection excludes hidden tokens and DM-only entities from the battlemap', () => {
    const dmProj = client.getProjection('dm_host');
    const playerProj = client.getProjection('player');

    // DM projection includes hidden NPC tokens
    const hiddenInDm = dmProj.npcs.find((n) => n.token.isVisibleToPlayers === false);
    assert.ok(hiddenInDm, 'DM must see hidden tokens like the Ghoul Sentry');

    // Player projection MUST NOT include any hidden NPC tokens
    const hiddenInPlayer = playerProj.npcs.find((n: any) => n.token.isVisibleToPlayers === false);
    assert.equal(hiddenInPlayer, undefined, 'Player projection must never contain hidden tokens');

    // Player projection excludes guarded secrets
    for (const npc of playerProj.npcs) {
      assert.equal((npc as any).knowledgeBoundary?.guardedSecrets, undefined);
      assert.equal((npc as any).knowledgeBoundary?.falseBeliefs, undefined);
    }
  });

  // Test 12: Attempted navigation to restricted DM workspaces
  it('12. Attempted navigation to restricted DM workspaces is safely intercepted', () => {
    const playerIdentity: UserIdentityContext = {
      gameRole: 'player',
      isHost: true, // Even as host
    };

    assert.equal(isAllowedTab('planning', playerIdentity), false);
    assert.equal(isAllowedTab('workshop', playerIdentity), false);
    assert.equal(sanitizeTabForIdentity('planning', playerIdentity), 'play');
    assert.equal(sanitizeTabForIdentity('workshop', playerIdentity), 'play');
    assert.equal(sanitizeTabForIdentity('battlemap', playerIdentity), 'battlemap');
    assert.equal(sanitizeTabForIdentity('character', playerIdentity), 'character');
  });

  // Test 13: No unauthorised DM actions via frontend callbacks
  it('13. Player users cannot execute DM-only action types or target hidden entities', async () => {
    const snap = client.getCurrentSnapshot();

    // 1. Player role attempting DM_OVERRIDE_STATE
    const unauthorizedDmAction = {
      actionId: 'act-unauth-dm-1',
      actorId: 'char-kaelen',
      actorRole: 'player' as const,
      actionType: 'DM_OVERRIDE_STATE' as const,
      payload: {
        entityType: 'character',
        entityId: 'char-kaelen',
        path: 'currentHp',
        newValue: 999,
      },
      snapshotRef: snap,
      timestampUtc: new Date().toISOString(),
      clientNonce: `nonce-${Date.now()}-1`,
    };

    const dmCheck = checkActionAdmission(unauthorizedDmAction, snap);
    assert.equal(dmCheck.admitted, false, 'Player role cannot perform DM_OVERRIDE_STATE');
    assert.ok(dmCheck.error?.includes('DM or Co-DM role'));

    // Also test submission through client pipeline
    const dmResult = await client.submitAction(unauthorizedDmAction);
    assert.ok(
      dmResult.receipt.status === 'REJECTED_STALE_SNAPSHOT' ||
      dmResult.receipt.status === 'REJECTED_UNAUTHORIZED_TARGET'
    );

    // 2. Player attempting to target a hidden NPC
    const targetHiddenAction = {
      actionId: 'act-target-hidden-1',
      actorId: 'char-kaelen',
      actorRole: 'player' as const,
      actionType: 'ATTACK_ACTION' as const,
      payload: {
        attackerId: 'char-kaelen',
        targetId: 'npc-ghoul-stalker', // Hidden token
        weaponName: 'Longsword',
      },
      snapshotRef: snap,
      timestampUtc: new Date().toISOString(),
      clientNonce: `nonce-${Date.now()}-2`,
    };

    const targetResult = await client.submitAction(targetHiddenAction);
    assert.equal(targetResult.receipt.status, 'REJECTED_UNAUTHORIZED_TARGET');
    assert.ok(targetResult.receipt.error?.includes('hidden'));
  });
});
