/**
 * Master World Simulation, Clock, Factions, Locations & Quests
 */

export interface MasterWorldClock {
  totalWorldMinutes: number; // Minute-resolution timeline since epoch
  calendar: {
    year: number;
    monthName: string;
    monthIndex: number;
    dayOfMonth: number;
    dayOfWeek: string;
    timeString: string; // e.g. "14:45"
    timeOfDay: 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night' | 'Midnight';
  };
  moonPhase: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  weather: {
    temperatureC: number;
    condition: 'Clear' | 'Overcast' | 'Gentle Rain' | 'Thunderstorm' | 'Fog' | 'Snow Flurry';
    windSpeedMph: number;
    visibility: 'Full' | 'Reduced' | 'Near Zero';
    mechanicalEffect?: string;
  };
  offlinePolicy: 'PAUSE_WHEN_OFFLINE' | 'BACKGROUND_SIMULATION' | 'REST_ONLY';
  isPaused: boolean;
}

export interface Faction {
  id: string;
  name: string;
  motto: string;
  influenceLevel: 'local' | 'regional' | 'continental';
  reputationWithParty: number; // -100 (Hostile) to 100 (Exalted)
  allegianceStatus: 'Allied' | 'Friendly' | 'Neutral' | 'Suspicious' | 'Hostile';
  headquarters: string;
  primaryGoals: string[];
  publicKnowledge: string;
  dmSecrets: string; // Excluded from player projections
}

export interface WorldLocation {
  id: string;
  name: string;
  region: string;
  type: 'settlement' | 'dungeon' | 'wilderness' | 'ruins' | 'interior';
  coordinates: { x: number; y: number };
  connectedRouteIds: string[];
  travelHazardLevel: 'Safe' | 'Low' | 'Moderate' | 'Deadly';
  travelTimeHoursFromParty: number;
  publicDescription: string;
  dmNotes: string; // DM confidential
  isDiscoveredByParty: boolean;
}

export interface QuestObjective {
  id: string;
  description: string;
  isCompleted: boolean;
  isOptional?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  giverNpcId: string;
  giverName: string;
  status: 'active' | 'completed' | 'failed' | 'dormant';
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  objectives: QuestObjective[];
  rewardsDescription: string;
  dmSecretTwist?: string;
}

export interface SourcePack {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: 'CC-BY-4.0 SRD 5.1' | 'OGL 1.0a' | 'Custom Homebrew';
  provenanceHash: string;
  ruleset: 'D&D 5e SRD 5.1' | 'Homebrew';
  itemCount: number;
  spellCount: number;
  monsterCount: number;
  isOfficial: boolean;
  importedAtUtc: string;
}
