/**
 * VadAllFate — Role Authority & Independent Hosting Engine (AIUI-HOTFIX-001)
 *
 * Implements strict separation between:
 * 1. Game Role (Dungeon Master vs Player vs Observer)
 * 2. Session Hosting Status (Host vs Guest / Non-Host)
 * 3. DM Player Preview Mode (Previewing as a player without losing underlying DM authority)
 *
 * ARCHITECTURAL INVARIANTS:
 * - A user may be a Dungeon Master without hosting the session.
 * - A user may host a session without being the Dungeon Master.
 * - Hosting a session NEVER grants Dungeon Master permissions or secrets.
 * - Non-hosting DMs retain full DM permissions, secret dossiers, and configuration access.
 * - Client-side conditional checks are supplemented by projection filtering; true multiplayer
 *   security will be strictly enforced server-side before transmitting data.
 */

import type { UserIdentityContext, UserRole, GameRole } from '../types/runtime.ts';

/**
 * Standard application workspace tabs
 */
export type ApplicationTab =
  | 'play'
  | 'battlemap'
  | 'planning'
  | 'workshop'
  | 'character'
  | 'journal';

export const DM_ONLY_TABS: ReadonlyArray<ApplicationTab> = ['planning', 'workshop'];
export const PLAYER_SPECIFIC_TABS: ReadonlyArray<ApplicationTab> = ['character', 'journal'];

/**
 * Checks whether the user identity has authority to access DM-only workspaces
 * (DM Planning, Homebrew Workshop, NPC Cognition Dossiers, Factions, Storyteller Director).
 *
 * Hosting status (isHost) has NO effect on this permission.
 */
export function canAccessDmWorkspaces(identity: UserIdentityContext): boolean {
  if (identity.previewMode?.isActive) {
    // When previewing as player, DM workspaces are strictly barred
    return false;
  }
  return identity.gameRole === 'dm';
}

/**
 * Checks whether the user identity has authority to access Homebrew Workshop.
 * Restricted to Dungeon Masters not currently in preview mode.
 */
export function canAccessWorkshop(identity: UserIdentityContext): boolean {
  return canAccessDmWorkspaces(identity);
}

/**
 * Checks whether the user is the technical host of the session.
 * Technical host authority is orthogonal to gameplay/DM authority.
 */
export function canHostSession(identity: UserIdentityContext): boolean {
  return identity.isHost === true;
}

/**
 * Checks whether the user identity can execute authoritative DM gameplay actions
 * (e.g. DM_OVERRIDE_STATE, setting Director profiles, advancing world clock).
 */
export function canExecuteDmActions(identity: UserIdentityContext): boolean {
  if (identity.previewMode?.isActive) {
    return false;
  }
  return identity.gameRole === 'dm';
}

/**
 * Resolves the effective projection role requested from the campaign client.
 */
export function getEffectiveProjectionRole(identity: UserIdentityContext): UserRole {
  if (identity.previewMode?.isActive) {
    return identity.previewMode.previewRole;
  }
  if (identity.gameRole === 'dm') {
    return 'dm_host';
  }
  if (identity.gameRole === 'player') {
    return 'player';
  }
  return 'observer';
}

/**
 * Resolves the effective character ID for the identity.
 */
export function getEffectiveCharacterId(identity: UserIdentityContext): string {
  if (identity.previewMode?.isActive) {
    return identity.previewMode.previewCharacterId;
  }
  return identity.assignedCharacterId || 'char-kaelen';
}

/**
 * Validates if a target tab is permitted for the given identity context.
 */
export function isAllowedTab(tab: ApplicationTab, identity: UserIdentityContext): boolean {
  const isDm = canAccessDmWorkspaces(identity);

  if (DM_ONLY_TABS.includes(tab)) {
    return isDm;
  }

  if (PLAYER_SPECIFIC_TABS.includes(tab)) {
    // Character and Journal are player-facing tabs
    return !isDm;
  }

  // 'play' and 'battlemap' are shared workspaces accessible to all roles
  return true;
}

/**
 * Ensures tab navigation remains safe when switching roles or entering preview mode.
 * If the current tab is not allowed for the new identity, safely falls back to 'play'.
 */
export function sanitizeTabForIdentity(
  tab: ApplicationTab,
  identity: UserIdentityContext
): ApplicationTab {
  if (isAllowedTab(tab, identity)) {
    return tab;
  }
  return 'play';
}

/**
 * Returns the list of navigation tabs authorised for the user identity.
 */
export function getAuthorisedTabs(identity: UserIdentityContext): ApplicationTab[] {
  if (canAccessDmWorkspaces(identity)) {
    return ['play', 'battlemap', 'planning', 'workshop'];
  }
  return ['play', 'battlemap', 'character', 'journal'];
}

/**
 * Demonstration identity presets for testing and previewing
 */
export interface IdentityPreset {
  id: string;
  label: string;
  subtitle: string;
  context: UserIdentityContext;
}

export const DEMO_IDENTITY_PRESETS: IdentityPreset[] = [
  {
    id: 'dm-host',
    label: 'Dungeon Master (Host)',
    subtitle: 'Full DM authority + technical session host',
    context: {
      gameRole: 'dm',
      isHost: true,
      assignedCharacterId: undefined,
    },
  },
  {
    id: 'dm-guest',
    label: 'Dungeon Master (Non-Host / Guest)',
    subtitle: 'Full DM authority; joined another host\'s session',
    context: {
      gameRole: 'dm',
      isHost: false,
      assignedCharacterId: undefined,
    },
  },
  {
    id: 'player-host-kaelen',
    label: 'Player Host: Kaelen',
    subtitle: 'Session host without DM powers; player-safe perspective',
    context: {
      gameRole: 'player',
      isHost: true,
      assignedCharacterId: 'char-kaelen',
    },
  },
  {
    id: 'player-guest-lyra',
    label: 'Player Guest: Lyra',
    subtitle: 'Regular player; player-safe perspective',
    context: {
      gameRole: 'player',
      isHost: false,
      assignedCharacterId: 'char-lyra',
    },
  },
  {
    id: 'observer-guest',
    label: 'Observer (Spectator)',
    subtitle: 'Read-only player-safe perspective',
    context: {
      gameRole: 'observer',
      isHost: false,
      assignedCharacterId: undefined,
    },
  },
];
