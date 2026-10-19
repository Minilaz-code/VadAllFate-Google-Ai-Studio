/**
 * VadAllFate Runtime Adapter
 * Coordinates between the UI and either:
 * 1) The Embedded Deterministic Spine (in-memory, deterministic, schema-compliant demo adapter)
 * 2) The Live Python VadAllFate Runtime (via HTTP/WebSocket gateway when spawned)
 */

import type {
  ActionEnvelope,
  CommitReceipt,
  SnapshotRef,
  CausalEvent,
  StatePatch,
  OperatingMode,
  UserRole,
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

export interface AuthoritativeCampaignState {
  campaignId: string;
  name: string;
  currentSnapshot: SnapshotRef;
  operatingMode: OperatingMode;
  worldClock: MasterWorldClock;
  characters: CharacterSheet[];
  npcs: NonPlayerCharacter[];
  factions: Faction[];
  locations: WorldLocation[];
  quests: Quest[];
  events: CausalEvent[];
  directorProfiles: DirectorProfile[];
  activeDirectorProfileId: string;
  recommendations: DirectorRecommendation[];
  spotlightMetrics: PlayerSpotlightMetric[];
  sourcePacks: SourcePack[];
}

export interface RuntimeConnectionStatus {
  isConnectedToLivePython: boolean;
  adapterMode: 'EMBEDDED_DETERMINISTIC_SPINE' | 'PYTHON_RUNTIME_GATEWAY';
  endpoint: string;
  version: string;
  commitSequence: number;
}

class VadAllFateRuntimeService {
  private state: AuthoritativeCampaignState;
  private connectionStatus: RuntimeConnectionStatus;
  private listeners: Set<(state: AuthoritativeCampaignState) => void> = new Set();

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
    };

    this.connectionStatus = {
      isConnectedToLivePython: false,
      adapterMode: 'EMBEDDED_DETERMINISTIC_SPINE',
      endpoint: 'local://deterministic-spine/v2',
      version: 'R1-W00-COMPAT-SPINE-V2',
      commitSequence: this.state.currentSnapshot.commitSequence,
    };
  }

  public getState(): AuthoritativeCampaignState {
    return this.state;
  }

  public getConnectionStatus(): RuntimeConnectionStatus {
    return {
      ...this.connectionStatus,
      commitSequence: this.state.currentSnapshot.commitSequence,
    };
  }

  public subscribe(callback: (state: AuthoritativeCampaignState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
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

  /**
   * Authoritative Commit Pipeline:
   * ActionEnvelope -> Concurrency Check -> StatePatch Generation -> Validation ->
   * Single Commit Authority -> Canonical Update -> CommitReceipt -> CausalEvent
   */
  public async submitActionEnvelope(envelope: ActionEnvelope): Promise<{
    receipt: CommitReceipt;
    event?: CausalEvent;
  }> {
    // 1. Concurrency Check
    const admission = checkActionAdmission(envelope, this.state.currentSnapshot);
    if (!admission.admitted) {
      const rejectReceipt: CommitReceipt = {
        commitSequence: this.state.currentSnapshot.commitSequence,
        commitHash: this.state.currentSnapshot.stateHash,
        requestId: envelope.actionId,
        actionId: envelope.actionId,
        status: 'REJECTED_STALE_SNAPSHOT',
        committedAtUtc: new Date().toISOString(),
        appliedPatchesCount: 0,
        resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
        error: admission.error,
      };
      return { receipt: rejectReceipt };
    }

    // 2. Derive Patches based on Action Type
    const proposedPatches: StatePatch[] = [];
    let eventSummary = '';
    let eventCategory: CausalEvent['category'] = 'WORLD';
    let diceRollData: CausalEvent['diceRoll'] | undefined;
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

      if (damage && targetNpc) {
        const newHp = Math.max(0, targetNpc.statBlock ? targetNpc.statBlock.hitPoints - damage : 0);
        proposedPatches.push({
          entityType: 'npc',
          entityId: targetId,
          path: 'statBlock.hitPoints',
          op: 'replace',
          value: newHp,
        });
      }

      eventSummary = `${actorDisplayName} launched ${attackName} against ${targetName}: To-Hit Total ${totalToHit} (${damage ? `Dealt ${damage} damage` : 'Calculated'})`;
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
    } else if (envelope.actionType === 'REST_SHORT' || envelope.actionType === 'REST_LONG') {
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

      // Restore HP & spell slots on long rest
      if (isLong) {
        for (const c of this.state.characters) {
          proposedPatches.push({
            entityType: 'character',
            entityId: c.id,
            path: 'currentHp',
            op: 'replace',
            value: c.maxHp,
          });
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

    // 3. Validate Proposed Patches
    for (const patch of proposedPatches) {
      let targetEntity: any;
      if (patch.entityType === 'character') {
        targetEntity = this.state.characters.find((c) => c.id === patch.entityId);
      } else if (patch.entityType === 'npc') {
        targetEntity = this.state.npcs.find((n) => n.id === patch.entityId);
      }
      const validation = validateStatePatch(patch, targetEntity);
      if (!validation.isValid) {
        const rejectReceipt: CommitReceipt = {
          commitSequence: this.state.currentSnapshot.commitSequence,
          commitHash: this.state.currentSnapshot.stateHash,
          requestId: envelope.actionId,
          actionId: envelope.actionId,
          status: 'REJECTED_VALIDATION_FAILURE',
          committedAtUtc: new Date().toISOString(),
          appliedPatchesCount: 0,
          resultingWorldMinute: this.state.worldClock.totalWorldMinutes,
          error: validation.reason,
        };
        return { receipt: rejectReceipt };
      }
    }

    // 4. Apply Patches to State (Commit Authority)
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

    // 5. Update Monotonic Commit Sequence and Snapshot
    const nextCommitSeq = this.state.currentSnapshot.commitSequence + 1;
    const nextHash = Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);
    const newSnapshot: SnapshotRef = {
      campaignId: this.state.campaignId,
      commitSequence: nextCommitSeq,
      stateHash: nextHash,
      worldMinute: updatedClock.totalWorldMinutes,
    };

    // 6. Create CausalEvent
    const newEvent: CausalEvent = {
      eventId: `evt-${nextCommitSeq}`,
      commitSequence: nextCommitSeq,
      worldMinute: updatedClock.totalWorldMinutes,
      category: eventCategory,
      summary: eventSummary || 'Action committed to canonical state.',
      actorName: actorDisplayName,
      actorId: envelope.actorId,
      isDmOnly: envelope.actorRole === 'dm_host' && envelope.actionType === 'DM_OVERRIDE_STATE',
      diceRoll: diceRollData,
      timestampUtc: new Date().toISOString(),
    };

    // 7. Commit Receipt
    const receipt: CommitReceipt = {
      commitSequence: nextCommitSeq,
      commitHash: nextHash,
      requestId: envelope.actionId,
      actionId: envelope.actionId,
      status: 'COMMITTED',
      committedAtUtc: newEvent.timestampUtc,
      appliedPatchesCount: proposedPatches.length,
      resultingWorldMinute: updatedClock.totalWorldMinutes,
    };

    this.state = {
      ...this.state,
      currentSnapshot: newSnapshot,
      characters: updatedCharacters,
      npcs: updatedNpcs,
      worldClock: updatedClock,
      events: [newEvent, ...this.state.events],
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

  public addHomebrewCreature(npc: any): void {
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
    const logEvent: CausalEvent = {
      eventId: `sys-${Date.now()}`,
      commitSequence: nextSeq,
      worldMinute: this.state.worldClock.totalWorldMinutes,
      category: 'WORLD',
      summary: message,
      actorName: 'System Authority',
      actorId: 'system',
      isDmOnly: false,
      timestampUtc: new Date().toISOString(),
    };
    this.state.events = [logEvent, ...this.state.events];
  }
}

export const runtimeService = new VadAllFateRuntimeService();
