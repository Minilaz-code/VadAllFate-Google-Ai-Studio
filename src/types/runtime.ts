/**
 * VadAllFate - Architecture Boundary & Contract Definitions (AIUI-CP001)
 *
 * Separates:
 * 1. Frontend View Models (UI state & presentation)
 * 2. Typed Client Projections (Player-Safe vs DM-Full)
 * 3. Demonstration Types (Local In-Memory Spine)
 * 4. Future Canonical Python R1 Transport Contracts (Target Specifications)
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - The canonical Python runtime owns authoritative state, SQLite persistence, and rule validation.
 * - Demonstration types MUST NOT claim canonical authority or machine-schema compatibility.
 */

import type { CharacterSheet } from './dnd5e.ts';
import type { NonPlayerCharacter } from './npc.ts';
import type { Faction, WorldLocation, Quest, MasterWorldClock, SourcePack } from './world.ts';
import type { DirectorProfile, DirectorRecommendation, PlayerSpotlightMetric } from './director.ts';

// ============================================================================
// SECTION 1: FRONTEND VIEW MODELS & OPERATING MODES
// ============================================================================

export type OperatingMode =
  | 'full_ai_dm'
  | 'ai_primary_codm'
  | 'human_primary_codm'
  | 'human_dm_assist'
  | 'human_sovereign';

export interface OperatingModeConfig {
  id: OperatingMode;
  label: string;
  shortDesc: string;
  narrativeAuthority: 'AI' | 'Co-Led (AI Default)' | 'Co-Led (Human Default)' | 'Human (AI Assisted)' | 'Human Sovereign';
  adjudicationAuthority: 'AI Automated' | 'AI with DM Veto' | 'Human with AI Validation' | 'Human with Rule Lookup' | 'Human Manual';
  directorActivityLevel: 'High (Proactive)' | 'Moderate' | 'Advisory' | 'Passive' | 'Off';
  canOverrideHuman: boolean; // MUST ALWAYS BE FALSE
}

export type UserRole = 'dm_host' | 'player' | 'observer';

export type GameRole = 'dm' | 'player' | 'observer';
export type SessionHostStatus = 'host' | 'non_host';

export interface UserSession {
  userId: string;
  displayName: string;
  role: UserRole;
  assignedCharacterId?: string;
  isHost: boolean;
}

export interface UserIdentityContext {
  gameRole: GameRole;
  isHost: boolean;
  assignedCharacterId?: string;
  previewMode?: {
    isActive: boolean;
    previewRole: 'player' | 'observer';
    previewCharacterId: string;
  };
}

// ============================================================================
// SECTION 2: CLIENT PROJECTION BOUNDARY & ALLOWLIST VIEW MODELS (AIUI-CP001B)
// ============================================================================

/**
 * Explicit allowlisted Player-Safe View Models.
 * Confidential DM properties are strictly excluded at type and runtime serialization levels.
 */
export interface PlayerSafeQuest {
  id: string;
  title: string;
  giverNpcId: string;
  giverName: string;
  status: 'active' | 'completed' | 'failed' | 'dormant';
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  objectives: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    isOptional?: boolean;
  }>;
  rewardsDescription: string;
  // NOTE: dmSecretTwist is strictly excluded from PlayerSafeQuest
}

export interface PlayerSafeLocation {
  id: string;
  name: string;
  region: string;
  type: 'settlement' | 'dungeon' | 'wilderness' | 'ruins' | 'interior';
  coordinates: { x: number; y: number };
  connectedRouteIds: string[];
  travelHazardLevel: 'Safe' | 'Low' | 'Moderate' | 'Deadly';
  travelTimeHoursFromParty: number;
  publicDescription: string;
  isDiscoveredByParty: true; // Only discovered locations are projected to players/observers
  // NOTE: dmNotes is strictly excluded from PlayerSafeLocation
}

export interface PlayerSafeNpc {
  id: string;
  name: string;
  title: string;
  race: string;
  occupation: string;
  currentLocationId: string;
  factionId?: string;
  appearanceDescription: string;
  token: {
    x: number;
    y: number;
    size: number;
    color: string;
    tokenLabel: string;
    isVisibleToPlayers: true;
  };
  // Public knowledge or verified dialogue topics known to the party
  publicKnowledge: {
    publicFacts: string[];
  };
  isAlive: boolean;
  // NOTE: Private internal NPC cognition (falseBeliefs, suspicions, motivationsAndGoals, routinesAndCommitments, guardedSecrets, statBlock) is strictly excluded
}

/**
 * Common projection properties.
 */
export interface CombatantTurnEntry {
  entityId: string;
  name: string;
  entityType: 'character' | 'npc';
  roll: number;
  initiativeBonus: number;
  initiative: number;
  isVisibleToPlayers: boolean;
}

export interface CombatTurnState {
  isActive: boolean;
  round: number;
  activeTurnIndex: number;
  combatants: CombatantTurnEntry[];
}

export type DicePolicy = 'ALLOW_MIXED_HONOUR_SYSTEM' | 'REQUIRE_DM_CONFIRMATION' | 'SERVER_DIGITAL_ONLY';
export type DiceMode = 'SERVER_DIGITAL' | 'PLAYER_PHYSICAL' | 'DM_PHYSICAL' | 'DM_ADJUDICATED_OVERRIDE';

export interface PendingAdjudication {
  adjudicationId: string;
  adjudicationType?: string;
  actorId: string;
  actorRole: string;
  actionType: string;
  stagedAtUtc: string;
  payload: any;
  summary: string;
  status: 'PENDING_HUMAN_DM_APPROVAL' | 'COMMITTED' | 'REJECTED';
  proposedPatches?: any[];
}

export interface BaseCampaignProjection {
  campaignId: string;
  name: string;
  operatingMode: OperatingMode;
  worldClock: MasterWorldClock;
  characters: CharacterSheet[];
  sourcePacks: SourcePack[];
  combatState?: CombatTurnState;
  dicePolicy?: DicePolicy;
  characterDicePreferences?: Record<string, DiceMode>;
  pendingAdjudications?: PendingAdjudication[];
  isServerVerifiedProjection: boolean; // false in demo mode
  projectionGeneratedAtUtc: string;
}

/**
 * Player-Safe Projection:
 * Generated for 'player' and 'observer' roles.
 * EXCLUDES:
 * - Hidden NPC tokens (isVisibleToPlayers === false)
 * - Guarded NPC secrets (guardedSecrets)
 * - DM confidential location notes (dmNotes)
 * - Undiscovered locations (isDiscoveredByParty === false)
 * - DM confidential quest twists (dmSecretTwist)
 * - DM-only causal events (isDmOnly === true)
 * - Private Director evaluations and explanations
 * - Faction DM secrets (factions omitted)
 */
export interface PlayerSafeCampaignProjection extends BaseCampaignProjection {
  projectionRole: 'player' | 'observer';
  activeCharacterId?: string;
  npcs: PlayerSafeNpc[];       // Allowlisted: visible tokens only; guardedSecrets stripped
  locations: PlayerSafeLocation[]; // Allowlisted: discovered only; dmNotes stripped
  quests: PlayerSafeQuest[];   // Allowlisted: dmSecretTwist stripped
  events: DemoCausalEvent[];   // Allowlisted: isDmOnly=false events only
  securityLimitationNotice: string;
}

/**
 * DM Full Projection:
 * Authoritative complete view for the Dungeon Master / Host.
 */
export interface DmFullCampaignProjection extends BaseCampaignProjection {
  projectionRole: 'dm_host';
  npcs: NonPlayerCharacter[]; // Full dossiers including guardedSecrets and hidden tokens
  factions: Faction[];        // Full faction data including dmSecrets
  locations: WorldLocation[]; // Full location data including dmNotes
  quests: Quest[];            // Full quest data including dmSecretTwist
  events: DemoCausalEvent[];  // All events including isDmOnly notes
  directorProfiles: DirectorProfile[];
  activeDirectorProfileId: string;
  recommendations: DirectorRecommendation[];
  spotlightMetrics: PlayerSpotlightMetric[];
}

export type CampaignProjection = PlayerSafeCampaignProjection | DmFullCampaignProjection;

/**
 * Type guard to safely identify full Dungeon Master campaign projections.
 * Never force cast (as DmFullCampaignProjection) without checking this guard.
 */
export function isDmFullProjection(
  projection: CampaignProjection | null | undefined
): projection is DmFullCampaignProjection {
  return projection != null && projection.projectionRole === 'dm_host';
}

/**
 * Type guard to safely identify player-safe campaign projections.
 */
export function isPlayerSafeProjection(
  projection: CampaignProjection | null | undefined
): projection is PlayerSafeCampaignProjection {
  return (
    projection != null &&
    (projection.projectionRole === 'player' || projection.projectionRole === 'observer')
  );
}

export interface RuntimeConnectionStatus {
  isConnectedToLivePython: boolean;
  adapterMode: 'DEMO_CLIENT_EPHEMERAL' | 'PYTHON_RUNTIME_GATEWAY';
  endpoint: string;
  version: string;
  commitSequence: number;
  statusLabel: string;
  intendedAuthority: 'NON_AUTHORITATIVE_DEMO' | 'CANONICAL_PYTHON_BACKEND';
  isCurrentlyAuthoritative: boolean;
  canAcceptAuthoritativeActions: boolean;
}

// ============================================================================
// SECTION 3: DEMONSTRATION CONTRACTS (LOCAL IN-MEMORY CLIENT)
// ============================================================================

export interface DemoSnapshotRef {
  campaignId: string;
  commitSequence: number;
  stateHash: string;
  worldMinute: number;
}

export type DemoActionType =
  | 'SET_DICE_POLICY' | 'APPROVE_ADJUDICATION' | 'REJECT_ADJUDICATION'
  | 'MOVE_TOKEN'
  | 'ATTACK_ACTION'
  | 'CAST_SPELL'
  | 'SKILL_CHECK'
  | 'USE_ITEM'
  | 'REST_SHORT'
  | 'REST_LONG'
  | 'START_ENCOUNTER'
  | 'ROLL_INITIATIVE'
  | 'NEXT_TURN'
  | 'END_ENCOUNTER'
  | 'APPLY_CONDITION'
  | 'REMOVE_CONDITION'
  | 'DEATH_SAVE'
  | 'FREEFORM_ROLEPLAY'
  | 'NPC_DIALOGUE'
  | 'SET_OPERATING_MODE'
  | 'SET_DIRECTOR_PROFILE'
  | 'REVIEW_RECOMMENDATION'
  | 'TOGGLE_DOOR'
  | 'REVEAL_FOG'
  | 'UPDATE_BATTLEMAP_STATE'
  | 'DM_OVERRIDE_STATE'
  | 'ADVANCE_TIME';

export interface DemoActionEnvelope {
  actionId: string;
  actorId: string;
  actorRole: UserRole;
  actionType: DemoActionType;
  payload: Record<string, any>;
  snapshotRef: DemoSnapshotRef;
  timestampUtc: string;
  clientNonce: string;
}

export interface DemoStatePatch {
  entityType: 'character' | 'npc' | 'location' | 'inventory' | 'world_clock' | 'combat_turn';
  entityId: string;
  path: string;
  op: 'replace' | 'add' | 'remove' | 'increment';
  value: any;
  previousValue?: any;
}

export type DemoCommitStatus =
  | 'COMMITTED'
  | 'REJECTED_STALE_SNAPSHOT'
  | 'REJECTED_VALIDATION_FAILURE'
  | 'REJECTED_NONEXISTENT_ENTITY'
  | 'REJECTED_OUT_OF_BOUNDS'
  | 'REJECTED_INVALID_TARGET'
  | 'REJECTED_UNAUTHORIZED_TARGET'
  | 'REJECTED_UNAUTHORIZED_ROLE'
  | 'REJECTED_MONSTER_COMBAT_HOLD'
  | 'REJECTED_DUPLICATE_NONCE';

export interface DemoCommitReceipt {
  commitSequence: number;
  commitHash: string;
  requestId: string;
  actionId: string;
  status: DemoCommitStatus;
  committedAtUtc: string;
  appliedPatchesCount: number;
  resultingWorldMinute: number;
  error?: string;
  isSimulatedDemoReceipt: boolean;
}

export interface DemoCausalEvent {
  eventId: string;
  commitSequence: number;
  worldMinute: number;
  category: 'COMBAT' | 'DIALOGUE' | 'WORLD' | 'REST' | 'RULES_QUERY' | 'DM_NOTE' | 'MAGIC';
  summary: string;
  details?: string;
  actorName: string;
  actorId: string;
  isDmOnly: boolean;
  diceRoll?: {
    formula: string;
    rolls: number[];
    modifier: number;
    total: number;
    isCritical?: boolean;
    isFumble?: boolean;
    reason: string;
  };
  timestampUtc: string;
  actionType?: string;
  playerMessage?: string | null;
  npcReply?: string | null;
  narration?: string | null;
  targetNpcName?: string | null;
  targetNpcId?: string | null;
}

// Aliases preserved for backwards-compatibility within UI components
export type SnapshotRef = DemoSnapshotRef;
export type ActionEnvelope = DemoActionEnvelope;
export type StatePatch = DemoStatePatch;
export type CommitReceipt = DemoCommitReceipt;
export type CausalEvent = DemoCausalEvent;

// ============================================================================
// SECTION 4: UNVERIFIED CANONICAL PYTHON CONTRACT PLACEHOLDERS (AIUI-CP001B)
// ============================================================================

/**
 * UNVERIFIED PLACEHOLDER: The canonical Python R1 machine schemas are defined
 * in the private repository Minilaz-code/VadAllFate and have NOT been retrieved,
 * verified, or imported into this client.
 *
 * ARCHITECTURAL CONSTRAINTS:
 * - The frontend demonstration does NOT claim canonical compatibility.
 * - Do NOT rely on speculative field shapes or compatibility mappings.
 * - Canonical schemas remain strictly unverified pending formal schema export.
 */
export interface UnverifiedCanonicalActionEnvelopePlaceholder {
  readonly _unverifiedNotice: 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE';
  readonly rawPayload?: unknown;
}

export interface UnverifiedCanonicalCommitReceiptPlaceholder {
  readonly _unverifiedNotice: 'SCHEMA_NOT_VERIFIED_AGAINST_PYTHON_CANONICAL_SOURCE';
  readonly rawReceipt?: unknown;
}

// Deprecated speculative aliases retained solely as unverified placeholders
export type R1ActionEnvelope = UnverifiedCanonicalActionEnvelopePlaceholder;
export type R1CommitReceipt = UnverifiedCanonicalCommitReceiptPlaceholder;

// ============================================================================
// SECTION 5: FEATURE STATUS CLASSIFICATION REGISTER (REPAIR F)
// ============================================================================

export type FeatureStatusLevel =
  | 'IMPLEMENTED AND TESTED'
  | 'IMPLEMENTED — NOT YET VERIFIED'
  | 'DEMONSTRATION / MOCK'
  | 'NOT IMPLEMENTED';

export interface FeatureStatusItem {
  id: string;
  module: string;
  featureName: string;
  status: FeatureStatusLevel;
  contract: string;
  notes: string;
}
