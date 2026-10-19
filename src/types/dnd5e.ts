/**
 * D&D 5e SRD 5.1 System Types & Structured Rules
 */

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SkillProficiency {
  name: string;
  ability: keyof AbilityScores;
  proficient: boolean;
  expertise?: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'adventuring_gear' | 'wondrous_item';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
  quantity: number;
  weightLbs: number;
  costGp: number;
  attunementRequired?: boolean;
  isAttuned?: boolean;
  properties?: string[];
  damage?: string;
  damageType?: string;
  acBonus?: number;
  description: string;
  isHomebrew?: boolean;
  sourceAttribution?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for cantrip
  school: 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  isHomebrew?: boolean;
}

export interface CharacterSheet {
  id: string;
  campaignId: string;
  name: string;
  race: string;
  characterClass: string;
  subclass?: string;
  level: number;
  experiencePoints: number;
  alignment: string;
  background: string;
  
  // VTT Token Info
  token: {
    x: number;
    y: number;
    size: number; // 1 = 5ft (1 square)
    color: string;
    avatarUrl?: string;
    tokenLabel: string;
    currentSpeedFt: number;
  };

  // Defenses
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  initiativeBonus: number;
  speedFt: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  hitDice: {
    total: number;
    current: number;
    dieType: 'd6' | 'd8' | 'd10' | 'd12';
  };
  deathSaves: {
    successes: number;
    failures: number;
  };

  // Abilities & Saves
  abilities: AbilityScores;
  savingThrowProficiencies: (keyof AbilityScores)[];
  skills: SkillProficiency[];

  // Combat resources
  spellSlots?: {
    [level: number]: {
      max: number;
      used: number;
    };
  };

  // Inventory & Spells
  inventory: Item[];
  spells: Spell[];
  
  // Roleplaying
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  notes: string;

  // Conditions
  conditions: string[];
}

export interface RuleCitation {
  ruleId: string;
  title: string;
  category: 'Combat' | 'Spells' | 'Movement' | 'Resting' | 'Conditions' | 'Environment';
  source: 'SRD 5.1' | 'House Rule';
  citationText: string;
  precedenceLevel: number; // 1 = SRD, 2 = Campaign House Rule (overrides SRD)
  keywords: string[];
}
