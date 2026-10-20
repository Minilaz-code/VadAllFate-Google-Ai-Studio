import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Zap,
  Sword,
  Sparkles,
  Backpack,
  User,
  BookOpen,
  Dices,
  Eye,
  Footprints,
} from 'lucide-react';
import type { CharacterSheet, AbilityScores } from '../../types/dnd5e.ts';
import { calculateAbilityModifier } from '../../runtime/rules.ts';

interface PlayerCharacterViewProps {
  characters: CharacterSheet[];
  selectedCharacterId?: string;
  onSelectCharacter?: (id: string) => void;
  onOpenDiceModal?: () => void;
}

export const PlayerCharacterView: React.FC<PlayerCharacterViewProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onOpenDiceModal,
}) => {
  const activeChar =
    characters.find((c) => c.id === selectedCharacterId) || characters[0];
  const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'inventory' | 'bio'>('combat');

  if (!activeChar) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-950 text-neutral-400">
        <p className="text-sm font-mono">No character sheet assigned to this player session.</p>
      </div>
    );
  }

  const abilityKeys: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 text-neutral-200 overflow-hidden text-xs">
      {/* Top Bar: Character Selector & Vitals */}
      <div className="px-6 py-3 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-md"
            style={{
              borderColor: activeChar.token.color || '#10b981',
              backgroundColor: `${activeChar.token.color}20`,
              color: activeChar.token.color,
            }}
          >
            {activeChar.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-cinzel text-neutral-100">{activeChar.name}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                Lvl {activeChar.level} {activeChar.characterClass}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {activeChar.race} • {activeChar.background} • {activeChar.alignment}
            </p>
          </div>
        </div>

        {/* Character switcher for multi-character players or party inspection */}
        {characters.length > 1 && (
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-500 font-mono px-2">Character:</span>
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCharacter?.(c.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  c.id === activeChar.id
                    ? 'bg-amber-950 text-amber-200 border border-amber-700/60'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Quick Dice Roller Trigger */}
        {onOpenDiceModal && (
          <button
            onClick={onOpenDiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-600/40 text-xs font-semibold transition-colors"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span>Roll Dice</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Core Defense & Vitals Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-red-950/60 text-red-400 border border-red-800/40">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Hit Points</div>
              <div className="text-base font-bold text-red-300">
                {activeChar.currentHp} / {activeChar.maxHp}
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Armor Class</div>
              <div className="text-base font-bold text-blue-300">{activeChar.armorClass} AC</div>
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Initiative</div>
              <div className="text-base font-bold text-amber-300">
                {activeChar.initiativeBonus >= 0 ? `+${activeChar.initiativeBonus}` : activeChar.initiativeBonus}
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Speed</div>
              <div className="text-base font-bold text-emerald-300">{activeChar.speedFt} ft</div>
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Passive Percep.</div>
              <div className="text-base font-bold text-purple-300">{activeChar.passivePerception}</div>
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className="p-2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-neutral-500">Hit Dice</div>
              <div className="text-base font-bold text-neutral-200">
                {activeChar.hitDice.current}/{activeChar.hitDice.total} {activeChar.hitDice.dieType}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Ability Scores Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {abilityKeys.map((ab) => {
            const score = activeChar.abilities[ab];
            const mod = calculateAbilityModifier(score);
            const isProf = activeChar.savingThrowProficiencies.includes(ab);

            return (
              <div
                key={ab}
                className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-center space-y-1 relative group hover:border-amber-700/50 transition-colors"
              >
                <div className="text-[11px] uppercase font-mono text-neutral-400 font-bold tracking-wider">
                  {ab}
                </div>
                <div className="text-xl font-bold font-mono text-amber-200">
                  {mod >= 0 ? `+${mod}` : mod}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">Score {score}</div>
                {isProf && (
                  <span className="text-[9px] font-mono text-emerald-400 block pt-0.5">
                    Save Prof
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Workspace Sub-tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-800">
          {[
            { id: 'combat', label: 'Actions & Attacks', icon: Sword },
            { id: 'spells', label: `Spells (${activeChar.spells?.length || 0})`, icon: Sparkles },
            { id: 'inventory', label: `Inventory (${activeChar.inventory?.length || 0})`, icon: Backpack },
            { id: 'bio', label: 'Roleplay & Traits', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-950 text-amber-200 border border-amber-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACTIONS & ATTACKS */}
        {activeTab === 'combat' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <h3 className="font-bold font-cinzel text-neutral-100 text-sm flex items-center gap-2">
                <Sword className="w-4 h-4 text-amber-400" />
                <span>Equipped Weapons & Actions</span>
              </h3>
              <div className="space-y-2">
                {activeChar.inventory
                  .filter((item) => item.type === 'weapon')
                  .map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-neutral-200">{w.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          Damage: <span className="text-amber-300 font-mono">{w.damage || '1d8'}</span> {w.damageType || 'slashing'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 capitalize">
                        {w.rarity}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <h3 className="font-bold font-cinzel text-neutral-100 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Proficient Skills</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeChar.skills
                  .filter((s) => s.proficient)
                  .map((s) => (
                    <div
                      key={s.name}
                      className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                    >
                      <span className="text-neutral-300">{s.name}</span>
                      <span className="text-[10px] font-mono uppercase text-emerald-400">
                        {s.ability}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPELLS */}
        {activeTab === 'spells' && (
          <div className="space-y-4">
            {activeChar.spellSlots && (
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
                <h4 className="font-mono text-xs uppercase text-cyan-300 font-bold">Spell Slots</h4>
                <div className="flex gap-4">
                  {Object.entries(activeChar.spellSlots).map(([lvl, slot]) => (
                    <div key={lvl} className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-center">
                      <div className="text-[10px] text-neutral-400 font-mono">Level {lvl}</div>
                      <div className="text-base font-bold text-cyan-300 mt-0.5">
                        {slot.max - slot.used} / {slot.max}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(activeChar.spells || []).map((spell) => (
                <div
                  key={spell.id}
                  className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-cyan-200">{spell.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{spell.description}</p>
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>Range: {spell.range}</span>
                    <span>Cast: {spell.castingTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
            <h3 className="font-bold font-cinzel text-neutral-100 text-sm flex items-center gap-2">
              <Backpack className="w-4 h-4 text-amber-400" />
              <span>Backpack & Equipment</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(activeChar.inventory || []).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200">{item.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">{item.costGp} GP</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{item.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                    <span>Qty: {item.quantity}</span>
                    <span>{item.weightLbs} lbs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BIO & ROLEPLAY */}
        {activeTab === 'bio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <h4 className="font-bold font-cinzel text-amber-200 text-sm">Personality & Ideals</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500 block">Personality Traits</span>
                  <p className="text-neutral-300 mt-1">{activeChar.personalityTraits}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500 block">Ideals</span>
                  <p className="text-neutral-300 mt-1">{activeChar.ideals}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <h4 className="font-bold font-cinzel text-amber-200 text-sm">Bonds & Flaws</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500 block">Bonds</span>
                  <p className="text-neutral-300 mt-1">{activeChar.bonds}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-neutral-500 block">Flaws</span>
                  <p className="text-neutral-300 mt-1">{activeChar.flaws}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
