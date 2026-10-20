import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
import type { UserIdentityContext } from '../types/runtime.ts';

describe('Role Authority & Independent Hosting (AIUI-HOTFIX-001)', () => {
  it('Dungeon Master Host has access to all DM workspaces and host authority', () => {
    const dmHost: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
    };

    assert.equal(canAccessDmWorkspaces(dmHost), true);
    assert.equal(canAccessWorkshop(dmHost), true);
    assert.equal(canHostSession(dmHost), true);
    assert.equal(canExecuteDmActions(dmHost), true);
    assert.equal(getEffectiveProjectionRole(dmHost), 'dm_host');
    assert.deepEqual(getAuthorisedTabs(dmHost), ['play', 'battlemap', 'planning', 'workshop']);
  });

  it('Non-host Dungeon Master retains full DM authority despite not being the session host', () => {
    const dmGuest: UserIdentityContext = {
      gameRole: 'dm',
      isHost: false, // NOT host
    };

    // Independent DM authority: hosting status does NOT strip DM rights
    assert.equal(canAccessDmWorkspaces(dmGuest), true);
    assert.equal(canAccessWorkshop(dmGuest), true);
    assert.equal(canHostSession(dmGuest), false);
    assert.equal(canExecuteDmActions(dmGuest), true);
    assert.equal(getEffectiveProjectionRole(dmGuest), 'dm_host');
    assert.deepEqual(getAuthorisedTabs(dmGuest), ['play', 'battlemap', 'planning', 'workshop']);
  });

  it('Player who hosts session is NOT granted DM workspaces or DM action authority', () => {
    const playerHost: UserIdentityContext = {
      gameRole: 'player',
      isHost: true, // Technical host
      assignedCharacterId: 'char-kaelen',
    };

    // Hosting alone NEVER elevates to DM
    assert.equal(canAccessDmWorkspaces(playerHost), false);
    assert.equal(canAccessWorkshop(playerHost), false);
    assert.equal(canHostSession(playerHost), true);
    assert.equal(canExecuteDmActions(playerHost), false);
    assert.equal(getEffectiveProjectionRole(playerHost), 'player');
    assert.deepEqual(getAuthorisedTabs(playerHost), ['play', 'battlemap', 'character', 'journal']);
    assert.equal(isAllowedTab('planning', playerHost), false);
    assert.equal(isAllowedTab('workshop', playerHost), false);
    assert.equal(sanitizeTabForIdentity('planning', playerHost), 'play');
  });

  it('Non-host Player has standard player permissions without hosting or DM authority', () => {
    const playerGuest: UserIdentityContext = {
      gameRole: 'player',
      isHost: false,
      assignedCharacterId: 'char-lyra',
    };

    assert.equal(canAccessDmWorkspaces(playerGuest), false);
    assert.equal(canAccessWorkshop(playerGuest), false);
    assert.equal(canHostSession(playerGuest), false);
    assert.equal(canExecuteDmActions(playerGuest), false);
    assert.equal(getEffectiveProjectionRole(playerGuest), 'player');
    assert.deepEqual(getAuthorisedTabs(playerGuest), ['play', 'battlemap', 'character', 'journal']);
  });

  it('DM entering Preview as Player is temporarily isolated from DM workspaces and projection', () => {
    const dmPreviewing: UserIdentityContext = {
      gameRole: 'dm',
      isHost: true,
      previewMode: {
        isActive: true,
        previewRole: 'player',
        previewCharacterId: 'char-kaelen',
      },
    };

    // While previewing, DM workspaces are locked out and projection is player-safe
    assert.equal(canAccessDmWorkspaces(dmPreviewing), false);
    assert.equal(canAccessWorkshop(dmPreviewing), false);
    assert.equal(canExecuteDmActions(dmPreviewing), false);
    assert.equal(getEffectiveProjectionRole(dmPreviewing), 'player');
    assert.deepEqual(getAuthorisedTabs(dmPreviewing), ['play', 'battlemap', 'character', 'journal']);
    assert.equal(sanitizeTabForIdentity('planning', dmPreviewing), 'play');
    assert.equal(sanitizeTabForIdentity('workshop', dmPreviewing), 'play');
  });

  it('Exiting Player Preview restores DM authority immediately without session reload', () => {
    const dmContext: UserIdentityContext = {
      gameRole: 'dm',
      isHost: false,
      previewMode: {
        isActive: true,
        previewRole: 'player',
        previewCharacterId: 'char-kaelen',
      },
    };

    // Disabling preview
    dmContext.previewMode = undefined;

    assert.equal(canAccessDmWorkspaces(dmContext), true);
    assert.equal(canAccessWorkshop(dmContext), true);
    assert.equal(getEffectiveProjectionRole(dmContext), 'dm_host');
    assert.deepEqual(getAuthorisedTabs(dmContext), ['play', 'battlemap', 'planning', 'workshop']);
  });
});
