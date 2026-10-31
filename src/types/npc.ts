/**
 * NPC Intelligence, Knowledge Boundaries, and Structured Memory
 * Enforces non-omniscience: distinguishes objective truth from NPC beliefs,
 * suspicions, secrets, and structured memory cues.
 */

export interface NpcMemory {
  id: string;
  worldMinute: number;
  subject: string;
  summary: string;
  emotionalImpression: 'positive' | 'negative' | 'neutral' | 'suspicious' | 'reverent';
  sourceCharacterName: string;
  credibility: number; // 0 to 100
}

export interface NpcRelationship {
  targetEntityId: string;
  targetName: string;
  relationshipType: 'ally' | 'rival' | 'merchant' | 'informant' | 'superior' | 'distrustful' | 'neutral';
  trustScore: number; // -100 to 100
  disposition: 'friendly' | 'indifferent' | 'hostile' | 'cautious';
  notes: string;
}

export interface NpcKnowledgeBoundary {
  // Objective facts this NPC genuinely knows
  verifiedFacts: string[];
  // Rumors, half-truths, or mistaken beliefs
  falseBeliefs: string[];
  // Active suspicions or ongoing deductions
  suspicions: string[];
  // Critical secrets this NPC guards
  guardedSecrets: string[];
}

export interface NonPlayerCharacter {
  id: string;
  campaignId: string;
  name: string;
  title: string;
  race: string;
  occupation: string;
  currentLocationId: string;
  factionId?: string;
  
  // Visual & Voice
  avatarUrl?: string;
  appearanceDescription: string;
  voiceProfile?: {
    voiceId: string;
    engine: 'VadAllVox-Core' | 'ElevenLabs' | 'LocalTTS';
    pitch: number;
    speakingStyle: string;
  };

  // Behavioral & Psychological
  personalityTraits: string[];
  motivationsAndGoals: string[];
  routinesAndCommitments: string[];
  
  // Knowledge limits (critical constraint: non-omniscient)
  knowledgeBoundary: NpcKnowledgeBoundary;

  // Relationship network
  relationships: NpcRelationship[];

  // Structured episodic memories
  memoryEntries: NpcMemory[];

  // Token on map
  token: {
    x: number;
    y: number;
    size: number;
    color: string;
    tokenLabel: string;
    isVisibleToPlayers: boolean;
  };

  // Combat Statblock (if engaged in combat)
  statBlock?: {
    dexterity?: number;
    challengeRating: number;
    armorClass: number;
    hitPoints: number;
    maxHitPoints: number;
    speedFt: number;
    attacks: {
      name: string;
      toHitBonus: number;
      damageFormula: string;
      description: string;
    }[];
  };

  isAlive: boolean;
}
