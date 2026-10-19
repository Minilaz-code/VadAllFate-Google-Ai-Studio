/**
 * VadAllFate - Core Runtime & Commit Authority Types
 * Compatible with established Python deterministic runtime,
 * SQLite persistence, and versioned R1 schemas.
 */

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

export interface UserSession {
  userId: string;
  displayName: string;
  role: UserRole;
  assignedCharacterId?: string;
  isHost: boolean;
}

/**
 * SnapshotRef: An immutable cryptographic/monotonically increasing
 * reference to the campaign state at a specific commit.
 */
export interface SnapshotRef {
  campaignId: string;
  commitSequence: number;
  stateHash: string;
  worldMinute: number;
}

/**
 * ActionEnvelope: The inbound request from a player or DM.
 */
export interface ActionEnvelope {
  actionId: string;
  actorId: string;
  actorRole: UserRole;
  actionType:
    | 'MOVE_TOKEN'
    | 'ATTACK_ACTION'
    | 'CAST_SPELL'
    | 'SKILL_CHECK'
    | 'USE_ITEM'
    | 'REST_SHORT'
    | 'REST_LONG'
    | 'FREEFORM_ROLEPLAY'
    | 'DM_OVERRIDE_STATE'
    | 'ADVANCE_TIME';
  payload: Record<string, any>;
  snapshotRef: SnapshotRef;
  timestampUtc: string;
  clientNonce: string;
}

/**
 * StatePatch: A deterministic set of state mutations proposed by rules/workers.
 */
export interface StatePatch {
  entityType: 'character' | 'npc' | 'location' | 'inventory' | 'world_clock' | 'combat_turn';
  entityId: string;
  path: string;
  op: 'replace' | 'add' | 'remove' | 'increment';
  value: any;
  previousValue?: any;
}

/**
 * CommitRequest: Submitted exclusively to the Single Commit Authority.
 */
export interface CommitRequest {
  requestId: string;
  actionEnvelope: ActionEnvelope;
  proposedPatches: StatePatch[];
  validationReport: {
    isValid: boolean;
    ruleCitations: string[];
    rejectionReason?: string;
  };
}

/**
 * CommitReceipt: Emitted by the Commit Authority upon canonical persistence.
 */
export interface CommitReceipt {
  commitSequence: number;
  commitHash: string;
  requestId: string;
  actionId: string;
  status: 'COMMITTED' | 'REJECTED_STALE_SNAPSHOT' | 'REJECTED_VALIDATION_FAILURE';
  committedAtUtc: string;
  appliedPatchesCount: number;
  resultingWorldMinute: number;
  error?: string;
}

/**
 * CausalEvent: The durable, append-only history of the campaign.
 */
export interface CausalEvent {
  eventId: string;
  commitSequence: number;
  worldMinute: number;
  category: 'COMBAT' | 'DIALOGUE' | 'WORLD' | 'REST' | 'RULES_QUERY' | 'DM_NOTE';
  summary: string;
  details?: string;
  actorName: string;
  actorId: string;
  isDmOnly: boolean; // Server-enforced: must be excluded from player projections
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
}

/**
 * Feature Status classification for the architectural register.
 */
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
