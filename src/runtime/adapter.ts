/**
 * VadAllFate - Campaign Client & Runtime Boundary Architecture (AIUI-CP001)
 *
 * Provides a clean interface boundary separating:
 * 1. DemoCampaignClient (Non-authoritative in-memory demonstration)
 * 2. PythonRuntimeGateway (Future integration boundary for established Python R1 runtime)
 *
 * ARCHITECTURAL CONSTRAINTS:
 * - No automatic fallback from failed production writes to demo commits.
 * - Demo client clearly identifies as ephemeral and non-authoritative.
 * - Server-side role projection boundaries are explicitly distinguished.
 */

import { resolveSessionApiBaseUrl, getV2CampaignId, getV2Token, hasV2Session, loginWithHostKey, v2SessionHeaders } from '../services/v2Session.ts';
import type {
  DemoActionEnvelope,
  DemoCommitReceipt,
  DemoSnapshotRef,
  DemoCausalEvent,
  DemoStatePatch,
  OperatingMode,
  UserRole,
  CampaignProjection,
  PlayerSafeCampaignProjection,
  DmFullCampaignProjection,
  PlayerSafeQuest,
  PlayerSafeLocation,
  PlayerSafeNpc,
  RuntimeConnectionStatus,
} from '../types/runtime.ts';
import type { CharacterSheet, RuleCitation } from '../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../types/npc.ts';
import type { MasterWorldClock, Faction, WorldLocation, Quest, SourcePack } from '../types/world.ts';
import type { DirectorProfile, DirectorRecommendation, PlayerSpotlightMetric } from '../types/director.ts';

import {
  INITIAL_SNAPSHOT,
  INITIAL_WORLD_CLOCK,
  DEMO_CHARACTERS,
  DEMO_NPCS,
  DEMO_FACTIONS,
  DEMO_LOCATIONS,
  DEMO_QUESTS,
  DEMO_RULES,
  DEMO_DIRECTOR_PROFILES,
  DEMO_RECOMMENDATIONS,
  DEMO_SPOTLIGHT_METRICS,
  DEMO_EVENTS,
  DEMO_SOURCE_PACKS,
} from './demoData.ts';
import { checkActionAdmission, validateStatePatch } from './rules.ts';
import { advanceWorldClock } from './clock.ts';

/**
 * Universal Frontend Campaign Client Interface
 */
export interface CampaignClient {
  getProjection(role: UserRole, characterId?: string): CampaignProjection;
  subscribe(callback: () => void): () => void;
  submitAction(envelope: DemoActionEnvelope): Promise<{
    receipt: DemoCommitReceipt;
    event?: DemoCausalEvent;
  }>;
  submitActionEnvelope(envelope: DemoActionEnvelope): Promise<{
    receipt: DemoCommitReceipt;
    event?: DemoCausalEvent;
  }>;
  queryRules(searchTerm: string, category?: string): RuleCitation[];
  getConnectionStatus(): RuntimeConnectionStatus;
  advanceTime(minutes: number): void;
  toggleClockPause(): void;
  setOperatingMode(mode: OperatingMode): void;
  setActiveDirectorProfile(profileId: string): void;
  reviewRecommendation(recId: string, action: 'ACCEPTED' | 'DISMISSED'): void;
  addHomebrewCreature(npc: NonPlayerCharacter): void;
  addHomebrewSpell(spell: any): void;
  addHomebrewItem(item: any): void;
  addHomebrewSourcePack(pack: SourcePack): void;
  getCurrentSnapshot(): DemoSnapshotRef;
}

/**
 * Internal state shape for the local demonstration client.
 */
interface DemoClientInternalState {
  campaignId: string;
  name: string;
  currentSnapshot: DemoSnapshotRef;
  operatingMode: OperatingMode;
  worldClock: MasterWorldClock;
  characters: CharacterSheet[];
  npcs: NonPlayerCharacter[];
  factions: Faction[];
  locations: WorldLocation[];
  quests: Quest[];
  events: DemoCausalEvent[];
  directorProfiles: DirectorProfile[];
  activeDirectorProfileId: string;
  recommendations: DirectorRecommendation[];
  spotlightMetrics: PlayerSpotlightMetric[];
  sourcePacks: SourcePack[];
  combatState?: { isActive: boolean; round: number; activeTurnIndex: number; combatants: {entityId:string;name:string;entityType:string;roll:number;initiativeBonus:number;initiative:number;isVisibleToPlayers:boolean}[] };
  processedNonces: Set<string>;
}

/**
 * DemoCampaignClient:
 * Operates the in-memory demonstration adapter.
 * Explicitly non-authoritative, ephemeral, and unsuitable for live multiplayer.
 */
export class DemoCampaignClient implements CampaignClient {
  private state: DemoClientInternalState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      campaignId: 'aethelgard-vault-001',
      name: 'The Sunken Vault of Aethelgard',
      currentSnapshot: { ...INITIAL_SNAPSHOT },
      operatingMode: 'ai_primary_codm',
      worldClock: { ...INITIAL_WORLD_CLOCK },
      characters: JSON.parse(JSON.stringify(DEMO_CHARACTERS)),
      npcs: JSON.parse(JSON.stringify(DEMO_NPCS)),
      factions: JSON.parse(JSON.stringify(DEMO_FACTIONS)),
      locations: JSON.parse(JSON.stringify(DEMO_LOCATIONS)),
      quests: JSON.parse(JSON.stringify(DEMO_QUESTS)),
      events: JSON.parse(JSON.stringify(DEMO_EVENTS)),
      directorProfiles: JSON.parse(JSON.stringify(DEMO_DIRECTOR_PROFILES)),
      activeDirectorProfileId: 'profile-atmospheric-mystery',
      recommendations: JSON.parse(JSON.stringify(DEMO_RECOMMENDATIONS)),
      spotlightMetrics: JSON.parse(JSON.stringify(DEMO_SPOTLIGHT_METRICS)),
      sourcePacks: JSON.parse(JSON.stringify(DEMO_SOURCE_PACKS)),
      processedNonces: new Set<string>(),
    };
  }

  public getCurrentSnapshot(): DemoSnapshotRef {
    return { ...this.state.currentSnapshot };
  }

  public getConnectionStatus(): RuntimeConnectionStatus {
    return {
      isConnectedToLivePython: false,
      adapterMode: 'DEMO_CLIENT_EPHEMERAL',
      endpoint: 'in-memory://browser/demo-adapter',
      version: 'CP001B-DEMO-EPHEMERAL',
      commitSequence: this.state.currentSnapshot.commitSequence,
      statusLabel: 'DEMO MODE — IN-MEMORY STATE — PYTHON RUNTIME NOT CONNECTED',
      intendedAuthority: 'NON_AUTHORITATIVE_DEMO',
      isCurrentlyAuthoritative: false,
      canAcceptAuthoritativeActions: false,
    };
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Generates typed projections:
   * Separates PlayerSafeCampaignProjection from DmFullCampaignProjection.
   * Excludes confidential fields and undiscovered content via explicit allowlists.
   */
  public getProjection(role: UserRole, characterId?: string): CampaignProjection {
    const base = {
      campaignId: this.state.campaignId,
      name: this.state.name,
      operatingMode: this.state.operatingMode,
      worldClock: { ...this.state.worldClock },
      characters: JSON.parse(JSON.stringify(this.state.characters)),
      sourcePacks: JSON.parse(JSON.stringify(this.state.sourcePacks)),
      isServerVerifiedProjection: false,
      projectionGeneratedAtUtc: new Date().toISOString(),
    };

    if (role === 'player' || role === 'observer') {
      // Physical allowlisting of the projection payload (Repair D & CP001B)
      // 1. Explicit allowlisted PlayerSafeNpc (visible tokens only, guardedSecrets excluded)
      const sanitizedNpcs: PlayerSafeNpc[] = this.state.npcs
        .filter((n) => n.token.isVisibleToPlayers === true)
        .map((n) => ({
          id: n.id,
          name: n.name,
          title: n.title,
          race: n.race,
          occupation: n.occupation,
          currentLocationId: n.currentLocationId,
          factionId: n.factionId,
          appearanceDescription: n.appearanceDescription,
          token: {
            x: n.token.x,
            y: n.token.y,
            size: n.token.size,
            color: n.token.color,
            tokenLabel: n.token.tokenLabel,
            isVisibleToPlayers: true as const,
          },
          publicKnowledge: {
            publicFacts: [...n.knowledgeBoundary.verifiedFacts],
          },
          isAlive: n.isAlive,
        }));

      // 2. Explicit allowlisted PlayerSafeLocation (discovered only, dmNotes excluded)
      const sanitizedLocations: PlayerSafeLocation[] = this.state.locations
        .filter((loc) => loc.isDiscoveredByParty === true)
        .map((loc) => ({
          id: loc.id,
          name: loc.name,
          region: loc.region,
          type: loc.type,
          coordinates: { x: loc.coordinates.x, y: loc.coordinates.y },
          connectedRouteIds: [...loc.connectedRouteIds],
          travelHazardLevel: loc.travelHazardLevel,
          travelTimeHoursFromParty: loc.travelTimeHoursFromParty,
          publicDescription: loc.publicDescription,
          isDiscoveredByParty: true,
        }));

      // 3. Explicit allowlisted PlayerSafeQuest (dmSecretTwist excluded)
      const sanitizedQuests: PlayerSafeQuest[] = this.state.quests.map((q) => ({
        id: q.id,
        title: q.title,
        giverNpcId: q.giverNpcId,
        giverName: q.giverName,
        status: q.status,
        urgency: q.urgency,
        objectives: q.objectives.map((obj) => ({
          id: obj.id,
          description: obj.description,
          isCompleted: obj.isCompleted,
          isOptional: obj.isOptional,
        })),
        rewardsDescription: q.rewardsDescription,
      }));

      // 4. Sanitized Causal Events (isDmOnly stripped)
      const sanitizedEvents: DemoCausalEvent[] = this.state.events
        .filter((e) => !e.isDmOnly)
        .map((e) => JSON.parse(JSON.stringify(e)));

      const playerProj: PlayerSafeCampaignProjection = {
        ...base,
        projectionRole: role,
        activeCharacterId: characterId,
        npcs: sanitizedNpcs,
        locations: sanitizedLocations,
        quests: sanitizedQuests,
        events: sanitizedEvents,
        securityLimitationNotice:
          'DEMO NOTICE: Client-side projection generated by in-browser adapter. True cryptographic RBAC requires connected Python runtime backend.',
      };
      return playerProj;
    }

    // Full DM projection
    const dmProj: DmFullCampaignProjection = {
      ...base,
      projectionRole: 'dm_host',
      npcs: JSON.parse(JSON.stringify(this.state.npcs)),
      factions: JSON.parse(JSON.stringify(this.state.factions)),
      locations: JSON.parse(JSON.stringify(this.state.locations)),
      quests: JSON.parse(JSON.stringify(this.state.quests)),
      events: JSON.parse(JSON.stringify(this.state.events)),
      directorProfiles: JSON.parse(JSON.stringify(this.state.directorProfiles)),
      activeDirectorProfileId: this.state.activeDirectorProfileId,
      recommendations: JSON.parse(JSON.stringify(this.state.recommendations)),
      spotlightMetrics: JSON.parse(JSON.stringify(this.state.spotlightMetrics)),
    };
    return dmProj;
  }

  public setOperatingMode(mode: OperatingMode): void {
    this.state = {
      ...this.state,
      operatingMode: mode,
    };
    this.appendSystemLog(`Operating mode switched to: ${mode.toUpperCase().replace(/_/g, ' ')}`);
    this.notify();
  }

  public setActiveDirectorProfile(profileId: string): void {
    this.state = {
      ...this.state,
      activeDirectorProfileId: profileId,
    };
    const prof = this.state.directorProfiles.find((p) => p.id === profileId);
    if (prof) {
      this.appendSystemLog(`Director profile set to: ${prof.name}`);
    }
    this.notify();
  }

  public queryRules(query: string, category?: string): RuleCitation[] {
    const q = query.trim().toLowerCase();
    if (!q && !category) return DEMO_RULES;

    return DEMO_RULES.filter((rule) => {
      const matchesCat = !category || category === 'All' || rule.category.toLowerCase() === category.toLowerCase();
      if (!matchesCat) return false;
      if (!q) return true;

      const matchesTitle = rule.title.toLowerCase().includes(q);
      const matchesText = rule.citationText.toLowerCase().includes(q);
      const matchesKeywords = rule.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesTitle || matchesText || matchesKeywords;
    });
  }

  public async submitActionEnvelope(envelope: DemoActionEnvelope) {
    return this.submitAction(envelope);
  }

  /**
   * Action Submission with Negative-Case Validation (Repair E)
   */
  public async submitAction(envelope: DemoActionEnvelope): Promise<{
    receipt: DemoCommitReceipt;
    event?: DemoCausalEvent;
  }> {
    // 1. Idempotency Check (Duplicate nonce rejection)
    if (this.state.processedNonces.has(envelope.clientNonce)) {
      const rejectReceipt: DemoCommitReceipt = {
        commitSequence: this.state.currentSnapshot.commitSequence,
        commitHash: this.state.currentSnapshot.stateHash,
        requestId: envelope.actionId,
        actionId: envelope.actionId,
        status: 'REJECTED_DUPLICATE_NONCE',
        committedAtUtc: new Date().toISOString(),
        appliedPatchesCount: 0,
        resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
        error: `Duplicate action detected: nonce ${envelope.clientNonce} has already been processed`,
        isSimulatedDemoReceipt: true,
      };
      return { receipt: rejectReceipt };
    }

    // 2. Concurrency Check (Stale snapshot rejection)
    const admission = checkActionAdmission(envelope, this.state.currentSnapshot);
    if (!admission.admitted) {
      const rejectReceipt: DemoCommitReceipt = {
        commitSequence: this.state.currentSnapshot.commitSequence,
        commitHash: this.state.currentSnapshot.stateHash,
        requestId: envelope.actionId,
        actionId: envelope.actionId,
        status: 'REJECTED_STALE_SNAPSHOT',
        committedAtUtc: new Date().toISOString(),
        appliedPatchesCount: 0,
        resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
        error: admission.error,
        isSimulatedDemoReceipt: true,
      };
      return { receipt: rejectReceipt };
    }

    // 3. Negative-Case Entity, Boundary & Role Permission Validation (Repair E & CP001B)
    const isPlayerOrObserver = envelope.actorRole === 'player' || envelope.actorRole === 'observer';

    if (isPlayerOrObserver && (envelope.actionType === 'DM_OVERRIDE_STATE' || envelope.actionType === 'ADVANCE_TIME')) {
      return {
        receipt: {
          commitSequence: this.state.currentSnapshot.commitSequence,
          commitHash: this.state.currentSnapshot.stateHash,
          requestId: envelope.actionId,
          actionId: envelope.actionId,
          status: 'REJECTED_UNAUTHORIZED_TARGET',
          committedAtUtc: new Date().toISOString(),
          appliedPatchesCount: 0,
          resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
          error: `Action rejected: Action type ${envelope.actionType} requires DM or Co-DM role authority`,
          isSimulatedDemoReceipt: true,
        },
      };
    }

    if (envelope.actionType === 'MOVE_TOKEN') {
      const { entityId, targetX, targetY, entityType } = envelope.payload;
      const targetChar = this.state.characters.find((c) => c.id === entityId);
      const targetNpc = this.state.npcs.find((n) => n.id === entityId);

      if (!targetChar && !targetNpc) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_NONEXISTENT_ENTITY',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: `Movement target entity "${entityId}" does not exist in campaign`,
            isSimulatedDemoReceipt: true,
          },
        };
      }

      // Check player moving an NPC or hidden entity
      if (isPlayerOrObserver && targetNpc) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_UNAUTHORIZED_TARGET',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: !targetNpc.token.isVisibleToPlayers
              ? `Action rejected: Target entity "${entityId}" is hidden from player view`
              : `Action rejected: Players cannot move NPC tokens`,
            isSimulatedDemoReceipt: true,
          },
        };
      }

      if (
        typeof targetX !== 'number' ||
        typeof targetY !== 'number' ||
        targetX < 0 ||
        targetX > 100 ||
        targetY < 0 ||
        targetY > 100
      ) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_OUT_OF_BOUNDS',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: `Coordinate (${targetX}, ${targetY}) is outside valid grid bounds [0, 100]`,
            isSimulatedDemoReceipt: true,
          },
        };
      }
    } else if (envelope.actionType === 'ATTACK_ACTION') {
      const { attackerId, targetId, isFumble, damage } = envelope.payload;
      const attacker = this.state.characters.find((c) => c.id === attackerId) || this.state.npcs.find((n) => n.id === attackerId);
      const targetChar = this.state.characters.find((c) => c.id === targetId);
      const targetNpc = this.state.npcs.find((n) => n.id === targetId);
      const target = targetChar || targetNpc;

      if (!attacker) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_NONEXISTENT_ENTITY',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: `Attacking actor "${attackerId}" does not exist`,
            isSimulatedDemoReceipt: true,
          },
        };
      }

      if (!target) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_INVALID_TARGET',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: `Attack target "${targetId}" is unavailable or nonexistent`,
            isSimulatedDemoReceipt: true,
          },
        };
      }

      // Hidden NPC Target Check for Player / Observer:
      if (isPlayerOrObserver && targetNpc && !targetNpc.token.isVisibleToPlayers) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_UNAUTHORIZED_TARGET',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: `Action rejected: Attack target "${targetId}" is hidden from player view and cannot be targeted`,
            isSimulatedDemoReceipt: true,
          },
        };
      }

      // Natural-1 Fumble Check: Never deals damage
      if (isFumble && damage > 0) {
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_VALIDATION_FAILURE',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: 'Rule invariant violation: Natural-1 attack fumbles cannot deal damage',
            isSimulatedDemoReceipt: true,
          },
        };
      }
    } else {
      // General check for dialogue or skill check targeting hidden NPC
      if (isPlayerOrObserver) {
        const targetNpcId = envelope.payload?.targetNpcId || envelope.payload?.targetId;
        if (targetNpcId) {
          const targetNpc = this.state.npcs.find((n) => n.id === targetNpcId);
          if (targetNpc && !targetNpc.token.isVisibleToPlayers) {
            return {
              receipt: {
                commitSequence: this.state.currentSnapshot.commitSequence,
                commitHash: this.state.currentSnapshot.stateHash,
                requestId: envelope.actionId,
                actionId: envelope.actionId,
                status: 'REJECTED_UNAUTHORIZED_TARGET',
                committedAtUtc: new Date().toISOString(),
                appliedPatchesCount: 0,
                resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
                error: `Action rejected: Target NPC "${targetNpcId}" is hidden from player view`,
                isSimulatedDemoReceipt: true,
              },
            };
          }
        }
      }
    }

    // 4. Derive Patches
    const proposedPatches: DemoStatePatch[] = [];
    let eventSummary = '';
    let eventCategory: DemoCausalEvent['category'] = 'WORLD';
    let diceRollData: DemoCausalEvent['diceRoll'] | undefined;
    let actorDisplayName = envelope.actorId;

    if (envelope.actionType === 'MOVE_TOKEN') {
      const { entityId, targetX, targetY, entityType } = envelope.payload;
      proposedPatches.push({
        entityType: entityType || 'character',
        entityId,
        path: 'token.x',
        op: 'replace',
        value: targetX,
      });
      proposedPatches.push({
        entityType: entityType || 'character',
        entityId,
        path: 'token.y',
        op: 'replace',
        value: targetY,
      });

      const char = this.state.characters.find((c) => c.id === entityId);
      const npc = this.state.npcs.find((n) => n.id === entityId);
      actorDisplayName = char?.name || npc?.name || entityId;
      eventSummary = `${actorDisplayName} moved token to coordinate (${targetX}, ${targetY}).`;
      eventCategory = 'COMBAT';
    } else if (envelope.actionType === 'ATTACK_ACTION') {
      const { attackerId, targetId, attackName, roll, isCritical, isFumble, totalToHit, damage } = envelope.payload;
      const char = this.state.characters.find((c) => c.id === attackerId);
      const targetNpc = this.state.npcs.find((n) => n.id === targetId);
      const targetChar = this.state.characters.find((c) => c.id === targetId);
      actorDisplayName = char?.name || attackerId;
      const targetName = targetNpc?.name || targetChar?.name || 'Target';

      diceRollData = {
        formula: '1d20+bonus',
        rolls: [roll],
        modifier: totalToHit - roll,
        total: totalToHit,
        isCritical,
        isFumble,
        reason: `${attackName} vs ${targetName}`,
      };

      if (damage && !isFumble) {
        if (targetNpc) {
          const prev = targetNpc.statBlock ? targetNpc.statBlock.hitPoints : 20;
          const newHp = Math.max(0, prev - damage);
          proposedPatches.push({
            entityType: 'npc',
            entityId: targetId,
            path: 'statBlock.hitPoints',
            op: 'replace',
            value: newHp,
          });
        } else if (targetChar) {
          const newHp = Math.max(0, targetChar.currentHp - damage);
          proposedPatches.push({
            entityType: 'character',
            entityId: targetId,
            path: 'currentHp',
            op: 'replace',
            value: newHp,
          });
        }
      }

      eventSummary = `${actorDisplayName} launched ${attackName} against ${targetName}: To-Hit Total ${totalToHit} (${
        isFumble ? 'Fumbled (0 Damage)' : damage ? `Dealt ${damage} damage` : 'Calculated'
      })`;
      eventCategory = 'COMBAT';
    } else if (envelope.actionType === 'SKILL_CHECK') {
      const { skillName, roll, modifier, total, reason } = envelope.payload;
      const char = this.state.characters.find((c) => c.id === envelope.actorId);
      actorDisplayName = char?.name || envelope.actorId;
      diceRollData = {
        formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
        rolls: [roll],
        modifier,
        total,
        reason: `${skillName} check: ${reason || 'Investigation'}`,
      };
      eventSummary = `${actorDisplayName} rolled ${skillName} check: ${total} (Roll: ${roll}, Mod: ${modifier >= 0 ? '+' : ''}${modifier})`;
      eventCategory = 'RULES_QUERY';
    } else if (envelope.actionType === 'ADVANCE_TIME') {
      const { minutes } = envelope.payload;
      if (this.state.worldClock.isPaused) {
        // Paused world cannot advance time unless explicitly unpaused
        return {
          receipt: {
            commitSequence: this.state.currentSnapshot.commitSequence,
            commitHash: this.state.currentSnapshot.stateHash,
            requestId: envelope.actionId,
            actionId: envelope.actionId,
            status: 'REJECTED_VALIDATION_FAILURE',
            committedAtUtc: new Date().toISOString(),
            appliedPatchesCount: 0,
            resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
            error: 'Cannot advance time while Master World Clock is paused',
            isSimulatedDemoReceipt: true,
          },
        };
      }
      const newClock = advanceWorldClock(this.state.worldClock, minutes);
      proposedPatches.push({
        entityType: 'world_clock',
        entityId: 'master_clock',
        path: 'totalWorldMinutes',
        op: 'replace',
        value: newClock.totalWorldMinutes,
      });
      eventSummary = `Master World Clock advanced by ${minutes} minutes (Time is now ${newClock.calendar.timeString}, ${newClock.calendar.timeOfDay}).`;
      eventCategory = 'WORLD';
    } else if (envelope.actionType === 'CAST_SPELL') {
      const { casterId, targetId, spellName, slotLevel, damage, healing } = envelope.payload;
      const char = this.state.characters.find((c) => c.id === (casterId || envelope.actorId));
      const targetNpc = this.state.npcs.find((n) => n.id === targetId);
      const targetChar = this.state.characters.find((c) => c.id === targetId);
      actorDisplayName = char?.name || casterId || envelope.actorId;
      const targetName = targetNpc?.name || targetChar?.name || 'Target';

      if (slotLevel && slotLevel > 0 && char && char.spellSlots && char.spellSlots[slotLevel]) {
        const slot = char.spellSlots[slotLevel];
        proposedPatches.push({
          entityType: 'character',
          entityId: char.id,
          path: `spellSlots.${slotLevel}.used`,
          op: 'replace',
          value: Math.min(slot.max, slot.used + 1),
        });
      }

      if (damage && damage > 0) {
        if (targetNpc && targetNpc.statBlock) {
          const newHp = Math.max(0, targetNpc.statBlock.hitPoints - damage);
          proposedPatches.push({
            entityType: 'npc',
            entityId: targetId,
            path: 'statBlock.hitPoints',
            op: 'replace',
            value: newHp,
          });
        } else if (targetChar) {
          const newHp = Math.max(0, targetChar.currentHp - damage);
          proposedPatches.push({
            entityType: 'character',
            entityId: targetId,
            path: 'currentHp',
            op: 'replace',
            value: newHp,
          });
        }
      } else if (healing && healing > 0 && targetChar) {
        const newHp = Math.min(targetChar.maxHp, targetChar.currentHp + healing);
        proposedPatches.push({
          entityType: 'character',
          entityId: targetId,
          path: 'currentHp',
          op: 'replace',
          value: newHp,
        });
      }

      eventSummary = `${actorDisplayName} cast ${spellName} on ${targetName}${damage ? ` dealing ${damage} damage` : healing ? ` restoring ${healing} HP` : ''}.`;
      eventCategory = 'MAGIC';
    } else if (envelope.actionType === 'USE_ITEM') {
      const { actorId, targetId, itemName, healing } = envelope.payload;
      const char = this.state.characters.find((c) => c.id === (actorId || envelope.actorId));
      const targetChar = this.state.characters.find((c) => c.id === (targetId || actorId || envelope.actorId));
      actorDisplayName = char?.name || envelope.actorId;
      const targetName = targetChar?.name || 'Self';

      if (healing && healing > 0 && targetChar) {
        const newHp = Math.min(targetChar.maxHp, targetChar.currentHp + healing);
        proposedPatches.push({
          entityType: 'character',
          entityId: targetChar.id,
          path: 'currentHp',
          op: 'replace',
          value: newHp,
        });
      }

      eventSummary = `${actorDisplayName} used ${itemName} on ${targetName}${healing ? ` (Restored ${healing} HP)` : ''}.`;
      eventCategory = 'COMBAT';
    } else if (envelope.actionType === 'DM_OVERRIDE_STATE') {
      const { entityId, entityType, path, value, summary } = envelope.payload;
      actorDisplayName = 'Dungeon Master';
      proposedPatches.push({
        entityType: entityType || 'character',
        entityId,
        path: path || 'currentHp',
        op: 'replace',
        value,
      });
      eventSummary = summary || `DM adjusted ${entityId} ${path} to ${value}.`;
      eventCategory = 'DM_NOTE';
    } else if (envelope.actionType === 'START_ENCOUNTER' || envelope.actionType === 'ROLL_INITIATIVE') {
      const combatants: any[] = [];
      for (const c of this.state.characters) {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + (c.initiativeBonus || 0);
        combatants.push({
          entityId: c.id,
          name: c.name,
          entityType: 'character',
          roll: d20,
          initiativeBonus: c.initiativeBonus || 0,
          initiative: total,
          isVisibleToPlayers: true,
        });
      }
      for (const n of this.state.npcs) {
        if (n.token?.isVisibleToPlayers) {
          const d20 = Math.floor(Math.random() * 20) + 1;
          const bonus = n.statBlock?.dexterity ? Math.floor((n.statBlock.dexterity - 10) / 2) : 1;
          combatants.push({
            entityId: n.id,
            name: n.name,
            entityType: 'npc',
            roll: d20,
            initiativeBonus: bonus,
            initiative: d20 + bonus,
            isVisibleToPlayers: true,
          });
        }
      }
      combatants.sort((a, b) => b.initiative - a.initiative);
      this.state.combatState = {
        isActive: true,
        round: 1,
        activeTurnIndex: 0,
        combatants,
      };
      eventSummary = `Initiative rolled! Combat encounter started with ${combatants.length} combatants. Current turn: ${combatants[0]?.name}.`;
      eventCategory = 'COMBAT';
    } else if (envelope.actionType === 'NEXT_TURN') {
      if (this.state.combatState && this.state.combatState.isActive) {
        let nextIdx = this.state.combatState.activeTurnIndex + 1;
        let nextRound = this.state.combatState.round;
        if (nextIdx >= this.state.combatState.combatants.length) {
          nextIdx = 0;
          nextRound += 1;
        }
        this.state.combatState = {
          ...this.state.combatState,
          round: nextRound,
          activeTurnIndex: nextIdx,
        };
        const activeName = this.state.combatState.combatants[nextIdx]?.name || 'Combatant';
        eventSummary = `Encounter advanced to Round ${nextRound}, Turn: ${activeName}.`;
        eventCategory = 'COMBAT';
      }
    } else if (envelope.actionType === 'END_ENCOUNTER') {
      if (this.state.combatState) {
        this.state.combatState = {
          ...this.state.combatState,
          isActive: false,
        };
      }
      eventSummary = 'Combat encounter ended. Scene returned to freeform play.';
      eventCategory = 'COMBAT';
    } else if (envelope.actionType === 'REST_SHORT' || envelope.actionType === 'REST_LONG' || (envelope.actionType as string) === 'REST_ACTION') {
      const isLong = envelope.actionType === 'REST_LONG';
      const minutes = isLong ? 480 : 60;
      const newClock = advanceWorldClock(this.state.worldClock, minutes);
      proposedPatches.push({
        entityType: 'world_clock',
        entityId: 'master_clock',
        path: 'totalWorldMinutes',
        op: 'replace',
        value: newClock.totalWorldMinutes,
      });

      if (isLong) {
        for (const c of this.state.characters) {
          proposedPatches.push({
            entityType: 'character',
            entityId: c.id,
            path: 'currentHp',
            op: 'replace',
            value: c.maxHp,
          });
          if (c.spellSlots) {
            for (const lvl of Object.keys(c.spellSlots)) {
              proposedPatches.push({
                entityType: 'character',
                entityId: c.id,
                path: `spellSlots.${lvl}.used`,
                op: 'replace',
                value: 0,
              });
            }
          }
        }
      }

      eventSummary = `Party completed a ${isLong ? 'Long Rest (8 Hours)' : 'Short Rest (1 Hour)'}. Time advanced by ${minutes} minutes.`;
      eventCategory = 'REST';
    } else if (envelope.actionType === 'FREEFORM_ROLEPLAY') {
      const { message, targetNpcName } = envelope.payload;
      const char = this.state.characters.find((c) => c.id === envelope.actorId);
      actorDisplayName = char?.name || envelope.actorId;
      eventSummary = `${actorDisplayName} ${targetNpcName ? `spoke to ${targetNpcName}` : 'declared'}: "${message}"`;
      eventCategory = 'DIALOGUE';
    }

    // 5. Validate StatePatches
    for (const patch of proposedPatches) {
      let targetEntity: any;
      if (patch.entityType === 'character') {
        targetEntity = this.state.characters.find((c) => c.id === patch.entityId);
      } else if (patch.entityType === 'npc') {
        targetEntity = this.state.npcs.find((n) => n.id === patch.entityId);
      }
      const validation = validateStatePatch(patch, targetEntity);
      if (!validation.isValid) {
        const rejectReceipt: DemoCommitReceipt = {
          commitSequence: this.state.currentSnapshot.commitSequence,
          commitHash: this.state.currentSnapshot.stateHash,
          requestId: envelope.actionId,
          actionId: envelope.actionId,
          status: 'REJECTED_VALIDATION_FAILURE',
          committedAtUtc: new Date().toISOString(),
          appliedPatchesCount: 0,
          resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
          error: validation.reason,
          isSimulatedDemoReceipt: true,
        };
        return { receipt: rejectReceipt };
      }
    }

    // 6. Apply Patches to Local State
    let updatedCharacters = [...this.state.characters];
    let updatedNpcs = [...this.state.npcs];
    let updatedClock = { ...this.state.worldClock };

    for (const patch of proposedPatches) {
      if (patch.entityType === 'character') {
        updatedCharacters = updatedCharacters.map((c) => {
          if (c.id === patch.entityId) {
            const clone = JSON.parse(JSON.stringify(c));
            if (patch.path === 'token.x') clone.token.x = patch.value;
            else if (patch.path === 'token.y') clone.token.y = patch.value;
            else if (patch.path === 'currentHp') clone.currentHp = patch.value;
            else if (patch.path === 'tempHp') clone.tempHp = patch.value;
            else if (patch.path === 'armorClass') clone.armorClass = patch.value;
            else if (patch.path === 'conditions') clone.conditions = patch.value;
            else if (patch.path.startsWith('spellSlots.')) {
              const parts = patch.path.split('.');
              if (parts.length === 3 && clone.spellSlots && clone.spellSlots[parts[1]]) {
                clone.spellSlots[parts[1]][parts[2]] = patch.value;
              }
            }
            return clone;
          }
          return c;
        });
      } else if (patch.entityType === 'npc') {
        updatedNpcs = updatedNpcs.map((n) => {
          if (n.id === patch.entityId) {
            const clone = JSON.parse(JSON.stringify(n));
            if (patch.path === 'token.x') clone.token.x = patch.value;
            else if (patch.path === 'token.y') clone.token.y = patch.value;
            else if (patch.path === 'statBlock.hitPoints' && clone.statBlock) {
              clone.statBlock.hitPoints = patch.value;
            } else if (patch.path === 'conditions') {
              clone.conditions = patch.value;
            }
            return clone;
          }
          return n;
        });
      } else if (patch.entityType === 'world_clock') {
        if (patch.path === 'totalWorldMinutes') {
          updatedClock = advanceWorldClock(this.state.worldClock, patch.value - this.state.worldClock.totalWorldMinutes);
        }
      }
    }

    // 7. Update Sequence, Hash, Nonces
    const nextCommitSeq = this.state.currentSnapshot.commitSequence + 1;
    const nextHash = Math.random().toString(16).substring(2, 14);
    const newSnapshot: DemoSnapshotRef = {
      campaignId: this.state.campaignId,
      commitSequence: nextCommitSeq,
      stateHash: nextHash,
      worldMinute: updatedClock.totalWorldMinutes,
    };

    const newNonces = new Set(this.state.processedNonces);
    newNonces.add(envelope.clientNonce);

    // 8. Create DemoCausalEvent
    const newEvent: DemoCausalEvent = {
      eventId: `evt-${nextCommitSeq}`,
      commitSequence: nextCommitSeq,
      worldMinute: updatedClock.totalWorldMinutes,
      category: eventCategory,
      summary: eventSummary || 'Action committed to demo state.',
      actorName: actorDisplayName,
      actorId: envelope.actorId,
      isDmOnly: envelope.actorRole === 'dm_host' && envelope.actionType === 'DM_OVERRIDE_STATE',
      diceRoll: diceRollData,
      timestampUtc: new Date().toISOString(),
    };

    // 9. Emit Simulated Demo Receipt
    const receipt: DemoCommitReceipt = {
      commitSequence: nextCommitSeq,
      commitHash: nextHash,
      requestId: envelope.actionId,
      actionId: envelope.actionId,
      status: 'COMMITTED',
      committedAtUtc: newEvent.timestampUtc,
      appliedPatchesCount: proposedPatches.length,
      resultingWorldMinute: updatedClock.totalWorldMinutes,
      isSimulatedDemoReceipt: true,
    };

    this.state = {
      ...this.state,
      currentSnapshot: newSnapshot,
      characters: updatedCharacters,
      npcs: updatedNpcs,
      worldClock: updatedClock,
      events: [newEvent, ...this.state.events],
      processedNonces: newNonces,
    };

    this.notify();
    return { receipt, event: newEvent };
  }

  public advanceTime(minutes: number): void {
    const updated = advanceWorldClock(this.state.worldClock, minutes);
    this.state = {
      ...this.state,
      worldClock: updated,
    };
    this.appendSystemLog(`World Clock advanced +${minutes} mins: ${updated.calendar.timeString} (${updated.calendar.timeOfDay})`);
    this.notify();
  }

  public toggleClockPause(): void {
    this.state = {
      ...this.state,
      worldClock: {
        ...this.state.worldClock,
        isPaused: !this.state.worldClock.isPaused,
      },
    };
    this.notify();
  }

  public addHomebrewSourcePack(pack: SourcePack): void {
    this.state = {
      ...this.state,
      sourcePacks: [pack, ...this.state.sourcePacks],
    };
    this.appendSystemLog(`Installed Homebrew Source Pack: "${pack.name}" (ID: ${pack.id})`);
    this.notify();
  }

  public addHomebrewItem(item: any): void {
    this.appendSystemLog(`Created Homebrew Item: "${item.name}"`);
    this.notify();
  }

  public addHomebrewSpell(spell: any): void {
    this.appendSystemLog(`Created Homebrew Spell: "${spell.name}"`);
    this.notify();
  }

  public addHomebrewCreature(npc: NonPlayerCharacter): void {
    this.state = {
      ...this.state,
      npcs: [npc, ...this.state.npcs],
    };
    this.appendSystemLog(`Created Homebrew Creature: "${npc.name}"`);
    this.notify();
  }

  public reviewRecommendation(recId: string, action: 'ACCEPTED' | 'DISMISSED'): void {
    this.state = {
      ...this.state,
      recommendations: this.state.recommendations.map((r) =>
        r.id === recId ? { ...r, status: action } : r
      ),
    };
    const rec = this.state.recommendations.find((r) => r.id === recId);
    if (rec) {
      this.appendSystemLog(`Director recommendation "${rec.title}" marked as ${action}`);
    }
    this.notify();
  }

  private appendSystemLog(message: string): void {
    const nextSeq = this.state.currentSnapshot.commitSequence + 1;
    const logEvent: DemoCausalEvent = {
      eventId: `sys-${Date.now()}`,
      commitSequence: nextSeq,
      worldMinute: this.state.worldClock.totalWorldMinutes,
      category: 'WORLD',
      summary: message,
      actorName: 'System Authority (Demo)',
      actorId: 'system',
      isDmOnly: false,
      timestampUtc: new Date().toISOString(),
    };
    this.state.events = [logEvent, ...this.state.events];
  }
}

/**
 * PythonRuntimeGateway:
 * Defines the future integration boundary for the canonical Python runtime.
 * When not connected, reports NOT CONNECTED and rejects all live mutations.
 * NO automatic fallback from production failure to demo writes is permitted.
 */
export class PythonRuntimeGateway implements CampaignClient {
  private endpoint: string;
  private connected: boolean = false;
  private cachedSnapshot: DemoSnapshotRef = {
    campaignId: 'DISCONNECTED',
    commitSequence: 0,
    stateHash: 'NONE',
    worldMinute: 0,
  };
  private cachedStatus: RuntimeConnectionStatus | null = null;
  private cachedDmProjection: DmFullCampaignProjection | null = null;
  private cachedPlayerProjection: PlayerSafeCampaignProjection | null = null;
  private listeners: Set<() => void> = new Set();

  constructor(endpoint: string = resolveSessionApiBaseUrl()) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  public getSessionToken(): string | null {
    return getV2Token('dm') ?? getV2Token('player') ?? null;
  }

  public lastAuthError: string | null = null;

  /**
   * Authenticate with a Host bootstrap key (obtained from the Windows launcher) or reuse an
   * existing tab session. The client cannot choose a role: the backend issues what the key allows.
   */
  public async authenticateSession(bootstrapKey?: string): Promise<string | null> {
    try {
      if (bootstrapKey) {
        await loginWithHostKey(bootstrapKey);
      }
      this.lastAuthError = hasV2Session() ? null : 'No session. Enter the Host key shown by the launcher.';
      return this.getSessionToken();
    } catch (e: any) {
      this.lastAuthError = e?.message || 'Authentication failed';
      return null;
    }
  }

  public async connectToLiveBackend(): Promise<boolean> {
    try {
      if (!hasV2Session()) {
        this.connected = false;
        this.lastAuthError = this.lastAuthError || 'Authentication required: no Host-issued session.';
        return false;
      }
      const [statusResp, dmResp, playerResp] = await Promise.all([
        fetch(`${this.endpoint}/status?campaign_id=${encodeURIComponent(getV2CampaignId())}`),
        fetch(`${this.endpoint}/projection?role=dm_host&campaign_id=${encodeURIComponent(getV2CampaignId())}`, { headers: v2SessionHeaders('dm') }),
        fetch(`${this.endpoint}/projection?role=player&character_id=char-lyra-01&campaign_id=${encodeURIComponent(getV2CampaignId())}`, {
          headers: v2SessionHeaders('player'),
        }),
      ]);
      if (!statusResp.ok || !dmResp.ok || !playerResp.ok) {
        this.connected = false;
        return false;
      }
      const statusData = await statusResp.json();
      const dmData = await dmResp.json();
      const playerData = await playerResp.json();

      this.connected = true;
      this.cachedSnapshot = {
        campaignId: dmData.campaignId || 'aethelgard-vault-001',
        commitSequence: statusData.commitSequence || 1,
        stateHash: statusData.stateHash || 'LIVE',
        worldMinute: statusData.worldMinute || 855,
      };
      this.cachedStatus = {
        isConnectedToLivePython: true,
        adapterMode: 'PYTHON_RUNTIME_GATEWAY',
        endpoint: this.endpoint,
        version: statusData.version || 'V2.0.0-PYTHON-AUTHORITATIVE',
        commitSequence: this.cachedSnapshot.commitSequence,
        statusLabel:
          statusData.statusLabel ||
          'PYTHON V2 AUTHORITATIVE RUNTIME CONNECTED (SQLite Single Commit Authority)',
        intendedAuthority: 'CANONICAL_PYTHON_BACKEND',
        isCurrentlyAuthoritative: true,
        canAcceptAuthoritativeActions: true,
      };
      this.cachedDmProjection = dmData;
      this.cachedPlayerProjection = playerData;
      this.notify();
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getCurrentSnapshot(): DemoSnapshotRef {
    if (this.connected) {
      return { ...this.cachedSnapshot };
    }
    return {
      campaignId: 'DISCONNECTED',
      commitSequence: 0,
      stateHash: 'NONE',
      worldMinute: 0,
    };
  }

  public getConnectionStatus(): RuntimeConnectionStatus {
    if (this.connected && this.cachedStatus) {
      return { ...this.cachedStatus };
    }
    return {
      isConnectedToLivePython: false,
      adapterMode: 'PYTHON_RUNTIME_GATEWAY',
      endpoint: this.endpoint,
      version: 'UNKNOWN (DAEMON NOT REACHABLE)',
      commitSequence: 0,
      statusLabel: 'PYTHON RUNTIME GATEWAY: NOT CONNECTED (Fail-Closed, Non-Authoritative)',
      intendedAuthority: 'CANONICAL_PYTHON_BACKEND',
      isCurrentlyAuthoritative: false,
      canAcceptAuthoritativeActions: false,
    };
  }

  public getProjection(role: UserRole, characterId?: string): CampaignProjection {
    if (!this.connected || !this.cachedDmProjection || !this.cachedPlayerProjection) {
      throw new Error(
        'Cannot retrieve campaign projection: Python R1 runtime gateway is disconnected. Demo fallback is disabled by architecture policy.'
      );
    }
    if (role === 'player' || role === 'observer') {
      return {
        ...this.cachedPlayerProjection,
        projectionRole: role,
        activeCharacterId: characterId,
      };
    }
    return this.cachedDmProjection;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public async submitAction(envelope: DemoActionEnvelope): Promise<{
    receipt: DemoCommitReceipt;
    event?: DemoCausalEvent;
  }> {
    if (!this.connected) {
      throw new Error(
        'Action submission rejected: Python R1 runtime gateway is disconnected. Automatic fallback to local demonstration is disabled.'
      );
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...v2SessionHeaders(envelope.actorRole),
    };
    const resp = await fetch(`${this.endpoint}/actions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(envelope),
    });
    if (!resp.ok) {
      throw new Error(`Python V2 runtime rejected action HTTP ${resp.status}`);
    }
    const result = await resp.json();
    await this.connectToLiveBackend();
    return result;
  }

  public async submitActionEnvelope(envelope: DemoActionEnvelope) {
    return this.submitAction(envelope);
  }

  public queryRules(searchTerm: string, category?: string): RuleCitation[] {
    return [];
  }

  public advanceTime(minutes: number): void {
    if (!this.connected) {
      throw new Error('Cannot advance time: Python runtime disconnected.');
    }
    const nonce = `nonce-adv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    void this.submitAction({
      actionId: `act-adv-${Date.now()}`,
      clientNonce: nonce,
      actorId: 'dm-1',
      actorRole: 'dm_host',
      actionType: 'ADVANCE_TIME',
      snapshotRef: this.getCurrentSnapshot(),
      payload: { minutes },
      timestampUtc: new Date().toISOString(),
    });
  }

  public toggleClockPause(): void {
    throw new Error('Cannot toggle clock: Python runtime disconnected.');
  }

  public setOperatingMode(mode: OperatingMode): void {
    if (!this.connected) {
      throw new Error('Cannot set operating mode: Python runtime disconnected.');
    }
    if (this.cachedDmProjection) {
      this.cachedDmProjection = { ...this.cachedDmProjection, operatingMode: mode };
    }
    if (this.cachedPlayerProjection) {
      this.cachedPlayerProjection = { ...this.cachedPlayerProjection, operatingMode: mode };
    }
    this.notify();
    const nonce = `nonce-mode-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    void this.submitAction({
      actionId: `act-mode-${Date.now()}`,
      clientNonce: nonce,
      actorId: 'dm-1',
      actorRole: 'dm_host',
      actionType: 'SET_OPERATING_MODE',
      snapshotRef: this.getCurrentSnapshot(),
      payload: { operatingMode: mode },
      timestampUtc: new Date().toISOString(),
    });
  }

  public setActiveDirectorProfile(profileId: string): void {
    if (!this.connected) {
      throw new Error('Cannot set director profile: Python runtime disconnected.');
    }
    if (this.cachedDmProjection) {
      this.cachedDmProjection = { ...this.cachedDmProjection, activeDirectorProfileId: profileId };
    }
    this.notify();
    const nonce = `nonce-prof-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    void this.submitAction({
      actionId: `act-prof-${Date.now()}`,
      clientNonce: nonce,
      actorId: 'dm-1',
      actorRole: 'dm_host',
      actionType: 'SET_DIRECTOR_PROFILE',
      snapshotRef: this.getCurrentSnapshot(),
      payload: { profileId },
      timestampUtc: new Date().toISOString(),
    });
  }

  public reviewRecommendation(recId: string, action: 'ACCEPTED' | 'DISMISSED'): void {
    if (!this.connected) {
      throw new Error('Cannot review recommendation: Python runtime disconnected.');
    }
    if (this.cachedDmProjection) {
      this.cachedDmProjection = {
        ...this.cachedDmProjection,
        recommendations: this.cachedDmProjection.recommendations.map((r) =>
          r.id === recId ? { ...r, status: action } : r
        ),
      };
    }
    this.notify();
    const nonce = `nonce-rec-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    void this.submitAction({
      actionId: `act-rec-${Date.now()}`,
      clientNonce: nonce,
      actorId: 'dm-1',
      actorRole: 'dm_host',
      actionType: 'REVIEW_RECOMMENDATION',
      snapshotRef: this.getCurrentSnapshot(),
      payload: { recommendationId: recId, decision: action },
      timestampUtc: new Date().toISOString(),
    });
  }

  public addHomebrewCreature(npc: NonPlayerCharacter): void {
    throw new Error('Cannot save creature: Python runtime disconnected.');
  }

  public addHomebrewSpell(spell: any): void {
    throw new Error('Cannot save spell: Python runtime disconnected.');
  }

  public addHomebrewItem(item: any): void {
    throw new Error('Cannot save item: Python runtime disconnected.');
  }

  public addHomebrewSourcePack(pack: SourcePack): void {
    throw new Error('Cannot add source pack: Python runtime disconnected.');
  }
}

/**
 * Global Client Manager
 * Manages active CampaignClient selection (Default: DemoCampaignClient).
 */
class CampaignClientManager {
  private activeClient: CampaignClient;
  private isDemoMode: boolean = true;
  private demoClient: DemoCampaignClient;
  private pythonGateway: PythonRuntimeGateway;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.demoClient = new DemoCampaignClient();
    this.pythonGateway = new PythonRuntimeGateway();
    this.activeClient = this.demoClient;
    this.pythonGateway.subscribe(() => {
      if (!this.isDemoMode) {
        for (const listener of this.listeners) {
          listener();
        }
      }
    });
  }

  public getClient(): CampaignClient {
    return this.activeClient;
  }

  public getPythonGateway(): PythonRuntimeGateway {
    return this.pythonGateway;
  }

  public isUsingDemo(): boolean {
    return this.isDemoMode;
  }

  public switchClient(useDemo: boolean): void {
    this.isDemoMode = useDemo;
    this.activeClient = useDemo ? this.demoClient : this.pythonGateway;
    for (const listener of this.listeners) {
      listener();
    }
  }

  public async connectPythonGateway(): Promise<boolean> {
    const ok = await this.pythonGateway.connectToLiveBackend();
    this.isDemoMode = false;
    this.activeClient = this.pythonGateway;
    for (const listener of this.listeners) {
      listener();
    }
    return ok;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const clientManager = new CampaignClientManager();

/**
 * Dynamic Proxy for runtimeService:
 * Automatically delegates all invocations to clientManager.getClient()
 * so operations always target the currently selected CampaignClient
 * rather than capturing an initial static reference.
 * When the Python Gateway is active and disconnected, any submitted
 * action or mutation fails closed as required by architectural policy.
 */
export const runtimeService: CampaignClient = new Proxy({} as CampaignClient, {
  get(_target, prop: string | symbol) {
    const active = clientManager.getClient();
    const val = (active as any)[prop];
    if (typeof val === 'function') {
      return val.bind(active);
    }
    return val;
  },
});

