import React, { useState } from 'react';
import {
  X,
  Shield,
  Heart,
  Zap,
  Footprints,
  Sparkles,
  Sword,
  Backpack,
  Scroll,
  BookOpen,
  Award,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import { calculateAbilityModifier, formatModifier } from '../../runtime/rules.ts';

interface Props {
  character: CharacterSheet | null;
  onClose: () => void;
  onRollCheck?: (skillName: string, modifier: number) => void;
}

export const CharacterSheetModal: React.FC<Props> = ({ character, onClose, onRollCheck }) => {
  const [activeTab, setActiveTab] = useState<'core' | 'combat' | 'spells' | 'inventory' | 'bio'>('core');

  if (!character) return null;

  const abilities = [
    { key: 'str', label: 'Strength', score: character.abilities.str },
    { key: 'dex', label: 'Dexterity', score: character.abilities.dex },
    { key: 'con', label: 'Constitution', score: character.abilities.con },
    { key: 'int', label: 'Intelligence', score: character.abilities.int },
    { key: 'wis', label: 'Wisdom', score: character.abilities.wis },
    { key: 'cha', label: 'Charisma', score: character.abilities.cha },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-neutral-900 border border-amber-800/40 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white font-cinzel text-sm border-2 border-amber-500/50"
              style={{ backgroundColor: character.token.color }}
            >
              {character.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-cinzel text-amber-100">{character.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 text-amber-400 border border-amber-700/50">
                  Level {character.level} {character.characterClass}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {character.race} • {character.subclass || 'Base Class'} • {character.background} • {character.alignment}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Character Sheet"
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Nav Tabs */}
        <div className="px-6 bg-neutral-950/60 border-b border-neutral-800 flex gap-2">
          {[
            { id: 'core', label: 'Core & Stats', icon: Award },
            { id: 'combat', label: 'Combat & Actions', icon: Sword },
            { id: 'spells', label: 'Spells & Magic', icon: Sparkles },
            { id: 'inventory', label: 'Inventory', icon: Backpack },
            { id: 'bio', label: 'Personality & Lore', icon: Scroll },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-200'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-neutral-200 text-xs">
          {activeTab === 'core' && (
            <div className="space-y-6">
              {/* Vital Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-950/80 rounded border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Hit Points</span>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {character.currentHp} / {character.maxHp}
                    </div>
                  </div>
                  <Heart className="w-6 h-6 text-emerald-500/40" />
                </div>
                <div className="p-3 bg-neutral-950/80 rounded border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Armor Class</span>
                    <div className="text-lg font-bold text-amber-300 font-mono">{character.armorClass}</div>
                  </div>
                  <Shield className="w-6 h-6 text-amber-500/40" />
                </div>
                <div className="p-3 bg-neutral-950/80 rounded border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Initiative</span>
                    <div className="text-lg font-bold text-neutral-100 font-mono">
                      {formatModifier(character.initiativeBonus)}
                    </div>
                  </div>
                  <Zap className="w-6 h-6 text-amber-500/40" />
                </div>
                <div className="p-3 bg-neutral-950/80 rounded border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Speed</span>
                    <div className="text-lg font-bold text-neutral-100 font-mono">{character.speedFt} ft</div>
                  </div>
                  <Footprints className="w-6 h-6 text-neutral-600" />
                </div>
              </div>

              {/* 6 Ability Scores */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
                  Ability Scores & Modifiers
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {abilities.map((ab) => {
                    const mod = calculateAbilityModifier(ab.score);
                    const isSaveProf = character.savingThrowProficiencies.includes(ab.key as any);
                    return (
                      <div
                        key={ab.key}
                        className="p-3 bg-neutral-950 rounded border border-neutral-800 text-center flex flex-col items-center justify-center hover:border-amber-700/60 transition-colors"
                      >
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">{ab.key}</span>
                        <span className="text-xl font-bold font-mono text-amber-200 mt-1">{formatModifier(mod)}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">{ab.score}</span>
                        {isSaveProf && (
                          <span className="mt-1 text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            Save Prof
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills List */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
                  Skill Proficiencies (SRD 5.1)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {character.skills.map((skill) => {
                    const baseMod = calculateAbilityModifier(character.abilities[skill.ability]);
                    const profBonus = skill.proficient ? 2 : 0; // level 3 prof bonus is 2
                    const totalMod = baseMod + profBonus;
                    return (
                      <div
                        key={skill.name}
                        onClick={() => onRollCheck && onRollCheck(skill.name, totalMod)}
                        className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                          skill.proficient
                            ? 'bg-amber-950/30 border-amber-800/60 text-amber-200 hover:bg-amber-900/40'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                        title="Click to roll skill check"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${skill.proficient ? 'bg-amber-400' : 'bg-neutral-700'}`} />
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-[10px] text-neutral-500 uppercase font-mono">({skill.ability})</span>
                        </div>
                        <span className="font-mono font-bold">{formatModifier(totalMod)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combat' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                Attacks & Cantrips
              </h3>
              <div className="grid gap-3">
                {character.inventory
                  .filter((i) => i.type === 'weapon')
                  .map((weapon) => (
                    <div
                      key={weapon.id}
                      className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-amber-200 text-sm">{weapon.name}</h4>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                            {weapon.damageType}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">{weapon.description}</p>
                        <div className="flex gap-2 mt-2">
                          {weapon.properties?.map((p) => (
                            <span key={p} className="text-[9px] font-mono px-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-amber-300">{weapon.damage}</div>
                        <span className="text-[10px] text-neutral-500">Damage</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'spells' && (
            <div className="space-y-4">
              {character.spellSlots && (
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex gap-4">
                  {Object.entries(character.spellSlots).map(([lvl, slot]) => (
                    <div key={lvl} className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-amber-300">Level {lvl}:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: slot.max }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-3.5 rounded-full border ${
                              i < slot.max - slot.used
                                ? 'bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-500/50'
                                : 'bg-neutral-800 border-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3">
                {character.spells.map((spell) => (
                  <div key={spell.id} className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-amber-200 text-sm">{spell.name}</h4>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level} ${spell.school}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-neutral-400">
                      <div><span className="text-neutral-500">Cast: </span>{spell.castingTime}</div>
                      <div><span className="text-neutral-500">Range: </span>{spell.range}</div>
                      <div><span className="text-neutral-500">Duration: </span>{spell.duration}</div>
                    </div>
                    <p className="text-[11px] text-neutral-300 mt-2 leading-relaxed">{spell.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="grid gap-2">
                {character.inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-100">{item.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1 rounded bg-neutral-900 text-neutral-400">
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{item.description}</p>
                    </div>
                    <div className="text-right text-[11px] font-mono text-neutral-400">
                      <div>Qty: {item.quantity}</div>
                      <div>{item.weightLbs} lbs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bio' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-neutral-500 font-mono uppercase">Personality Traits:</span>
                <p className="mt-1 text-neutral-200">{character.personalityTraits}</p>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-neutral-500 font-mono uppercase">Ideals:</span>
                <p className="mt-1 text-neutral-200">{character.ideals}</p>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-neutral-500 font-mono uppercase">Bonds:</span>
                <p className="mt-1 text-neutral-200">{character.bonds}</p>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-neutral-500 font-mono uppercase">Flaws:</span>
                <p className="mt-1 text-neutral-200">{character.flaws}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
