/**
 * DM Director & Storyteller Profiles Types
 * Modular AI Orchestration boundaries:
 * Fast Controller, Deep Controller, Context Compiler, DM Director
 */

export interface DirectorProfile {
  id: string;
  name: string;
  description: string;
  pacingLevel: 'slow_burn' | 'balanced' | 'fast_relentless';
  tensionTarget: number; // 0 - 100
  combatExplorationRatio: number; // 0 (Pure Exploration) to 100 (Pure Combat)
  mysteryDiscoveryRatio: number; // 0 (Straightforward) to 100 (Deep Enigma)
  socialInteractionFocus: number; // 0 to 100
  narrativeUrgency: 'low' | 'moderate' | 'high' | 'critical';
  sandboxFreedom: 'rail_structure' | 'guided_paths' | 'pure_sandbox';
  spotlightBalancing: 'automatic' | 'manual';
  riskConsequenceIntensity: 'forgiving' | 'standard' | 'deadly';
}

export interface PlayerSpotlightMetric {
  playerId: string;
  characterName: string;
  recentActionCount: number;
  lastTurnMinute: number;
  spotlightScore: number; // 0 (ignored) to 100 (over-indexed)
  suggestedPrompt: string;
}

export interface DirectorRecommendation {
  id: string;
  createdWorldMinute: number;
  recommendationType:
    | 'ENCOUNTER_TRIGGER'
    | 'NPC_INTERVENTION'
    | 'ENVIRONMENTAL_SHIFT'
    | 'LORE_REVEAL'
    | 'SPOTLIGHT_PROMPT';
  title: string;
  proposal: string;
  mechanicsHint?: string;
  directorExplanation: {
    tensionAssessment: string;
    pacingAssessment: string;
    spotlightAssessment: string;
    narrativeCausalReason: string;
  };
  suggestedActions: string[];
  status: 'PENDING_DM_REVIEW' | 'ACCEPTED' | 'DISMISSED';
}
