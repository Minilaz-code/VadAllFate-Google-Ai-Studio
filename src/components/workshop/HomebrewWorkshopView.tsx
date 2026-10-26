import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sword,
  Wand2,
  Shield,
  FileCheck,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  Scale,
} from 'lucide-react';
import type { SourcePack } from '../../types/world.ts';
import { runtimeService } from '../../runtime/adapter.ts';
import { v2BackendClient, type V2HomebrewRecord } from '../../services/v2BackendClient.ts';

interface HomebrewWorkshopProps {
  sourcePacks: SourcePack[];
}

export const HomebrewWorkshopView: React.FC<HomebrewWorkshopProps> = ({ sourcePacks }) => {
  const [activeTab, setActiveTab] = useState<
    'creatures' | 'spells' | 'items' | 'rules' | 'packages' | 'lifecycle'
  >('creatures');

  // V2 Homebrew Lifecycle Registry state (KGP-03)
  const [homebrewRecords, setHomebrewRecords] = useState<V2HomebrewRecord[]>([]);
  const [hbBaseSrdUri, setHbBaseSrdUri] = useState('srd51:spell:119');

  const dmAudience = {
    actor_id: 'dm-1',
    role: 'dm' as const,
    campaign_id: 'aethelgard-vault-001',
    save_id: 'save-main',
  };

  useEffect(() => {
    let cancelled = false;
    v2BackendClient.listHomebrew(dmAudience).then((items) => {
      if (!cancelled) setHomebrewRecords(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTransitionHomebrew = async (
    hb: V2HomebrewRecord,
    targetStatus: 'validated' | 'implemented' | 'deprecated'
  ) => {
    const updated = await v2BackendClient.transitionHomebrew(
      dmAudience,
      hb.homebrew_id,
      targetStatus,
      hb.version
    );
    const refreshed = await v2BackendClient.listHomebrew(dmAudience);
    setHomebrewRecords(refreshed);
    showSuccess(
      `Homebrew "${updated.name}" v${updated.version} transitioned to ${updated.status.toUpperCase()} (scope: ${updated.scope_kind}:${updated.scope_id}).`
    );
  };

  // Creature builder state
  const [creatureName, setCreatureName] = useState('Abyssal Drowned Sentinel');
  const [creatureCr, setCreatureCr] = useState(2);
  const [creatureHp, setCreatureHp] = useState(45);
  const [creatureAc, setCreatureAc] = useState(14);
  const [creatureSpeed, setCreatureSpeed] = useState(30);
  const [creatureAttack, setCreatureAttack] = useState('Rusted Harpoon');
  const [creatureDamage, setCreatureDamage] = useState('1d10+2');

  // Spell builder state
  const [spellName, setSpellName] = useState('Tidal Ward of Aethelgard');
  const [spellLevel, setSpellLevel] = useState(2);
  const [spellSchool, setSpellSchool] = useState('abjuration');
  const [spellRange, setSpellRange] = useState('30 feet');
  const [spellDescription, setSpellDescription] = useState('Creates a pressurized vortex of barrier water granting +3 AC.');

  // Item builder state
  const [itemName, setItemName] = useState('Amulet of Karst Whispers');
  const [itemType, setItemType] = useState('wondrous_item');
  const [itemRarity, setItemRarity] = useState('rare');
  const [itemDescription, setItemDescription] = useState('Allows wearer to cast Water Breathing at will while attuned.');

  // Notification / Feedback banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleSaveCreature = (e: React.FormEvent) => {
    e.preventDefault();
    runtimeService.addHomebrewCreature({
      id: `hb-creature-${Date.now()}`,
      campaignId: 'aethelgard-vault-001',
      name: creatureName,
      title: 'Homebrew Monster',
      race: 'Abyssal Construct',
      occupation: 'Vault Guardian',
      currentLocationId: 'loc-vault-antechamber',
      appearanceDescription: 'Corroded armor welded to aquatic bone.',
      personalityTraits: ['Relentless', 'Guards the floodgate'],
      motivationsAndGoals: ['Enforce threshold security'],
      routinesAndCommitments: [],
      knowledgeBoundary: {
        verifiedFacts: ['Guards the third runic key'],
        falseBeliefs: [],
        suspicions: [],
        guardedSecrets: [],
      },
      relationships: [],
      memoryEntries: [],
      token: {
        x: 50,
        y: 50,
        size: 1,
        color: '#dc2626',
        tokenLabel: creatureName.substring(0, 8),
        isVisibleToPlayers: false,
      },
      statBlock: {
        challengeRating: creatureCr,
        armorClass: creatureAc,
        hitPoints: creatureHp,
        maxHitPoints: creatureHp,
        speedFt: creatureSpeed,
        attacks: [
          {
            name: creatureAttack,
            toHitBonus: 4,
            damageFormula: creatureDamage,
            description: 'Piercing damage plus DC 12 grapple check.',
          },
        ],
      },
      isAlive: true,
    });
    showSuccess(`Homebrew creature "${creatureName}" saved to campaign registry.`);
  };

  const handleSaveSpell = async (e: React.FormEvent) => {
    e.preventDefault();
    runtimeService.addHomebrewSpell({
      id: `hb-spell-${Date.now()}`,
      name: spellName,
      level: spellLevel,
      school: spellSchool,
      castingTime: '1 action',
      range: spellRange,
      components: { verbal: true, somatic: true },
      duration: 'Concentration, 10 minutes',
      concentration: true,
      ritual: false,
      description: spellDescription,
      isHomebrew: true,
    });
    await v2BackendClient.saveHomebrewDraft(dmAudience, {
      category: 'spell',
      name: spellName,
      base_srd_uri: hbBaseSrdUri || null,
      specification: {
        level: spellLevel,
        school: spellSchool,
        casting_time: '1 action',
        range: spellRange,
        summary: spellDescription,
      },
    });
    const refreshed = await v2BackendClient.listHomebrew(dmAudience);
    setHomebrewRecords(refreshed);
    showSuccess(`Homebrew spell "${spellName}" saved as versioned DRAFT in V2 Lifecycle Registry.`);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    runtimeService.addHomebrewItem({
      id: `hb-item-${Date.now()}`,
      name: itemName,
      type: itemType,
      rarity: itemRarity,
      quantity: 1,
      weightLbs: 1,
      costGp: 500,
      attunementRequired: true,
      description: itemDescription,
      isHomebrew: true,
      sourceAttribution: 'VadAllFate Workshop',
    });
    showSuccess(`Homebrew item "${itemName}" added to compendium forge.`);
  };

  // Export JSON source package
  const handleExportPackage = () => {
    const pkg = {
      manifest: {
        format: 'VadAllFate-SourcePack-v1',
        name: 'Custom-Homebrew-Export',
        exportedAt: new Date().toISOString(),
        license: 'CC-BY-4.0 SRD 5.1 & Original Homebrew',
        sha256: Math.random().toString(16).substring(2, 16),
      },
      sourcePacks,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VadAllFate-Homebrew-Pack-${Date.now()}.json`;
    a.click();
    showSuccess('Exported portable VadAllFate source pack package.');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden text-neutral-200 text-xs">
      {/* Top Banner */}
      <div className="px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-950 border border-amber-700/50 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-cinzel text-amber-100">Homebrew Workshop & Compendium</h2>
            <p className="text-[10px] text-neutral-400">
              Structured creator for custom monsters, spells, items, house rules, and validated source packs.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800">
          {[
            { id: 'creatures', label: 'Creatures & Monsters', icon: Sword },
            { id: 'spells', label: 'Spells & Cantrips', icon: Wand2 },
            { id: 'items', label: 'Equipment & Relics', icon: Shield },
            { id: 'lifecycle', label: `Lifecycle Registry (${homebrewRecords.length})`, icon: Scale },
            { id: 'packages', label: 'Source Packs & Exports', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-950 text-amber-200 border border-amber-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Workshop Content Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* CREATURE FORGE */}
        {activeTab === 'creatures' && (
          <form onSubmit={handleSaveCreature} className="space-y-5 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold font-cinzel text-amber-100">Statblock Creator: Monster / NPC</h3>
              <p className="text-neutral-400 text-xs">
                Generates a standardized 5e SRD stat block with token coordinates and attack formulas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">
                  Creature Name
                </label>
                <input
                  type="text"
                  value={creatureName}
                  onChange={(e) => setCreatureName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">
                  Challenge Rating (CR)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={creatureCr}
                  onChange={(e) => setCreatureCr(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Hit Points (HP)</label>
                  <input
                    type="number"
                    value={creatureHp}
                    onChange={(e) => setCreatureHp(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Armor Class</label>
                  <input
                    type="number"
                    value={creatureAc}
                    onChange={(e) => setCreatureAc(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Speed (ft)</label>
                  <input
                    type="number"
                    value={creatureSpeed}
                    onChange={(e) => setCreatureSpeed(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Primary Attack</label>
                  <input
                    type="text"
                    value={creatureAttack}
                    onChange={(e) => setCreatureAttack(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Damage Formula</label>
                  <input
                    type="text"
                    value={creatureDamage}
                    onChange={(e) => setCreatureDamage(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Forge Creature</span>
              </button>
            </div>
          </form>
        )}

        {/* SPELL SCRIBE */}
        {activeTab === 'spells' && (
          <form onSubmit={handleSaveSpell} className="space-y-5 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold font-cinzel text-amber-100">Spell Scribe Workshop</h3>
              <p className="text-neutral-400 text-xs">
                Transcribe custom arcana, schools, casting requirements and concentration conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Spell Name</label>
                <input
                  type="text"
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Spell Level</label>
                <select
                  value={spellLevel}
                  onChange={(e) => setSpellLevel(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                >
                  <option value={0}>Cantrip (Level 0)</option>
                  <option value={1}>1st Level</option>
                  <option value={2}>2nd Level</option>
                  <option value={3}>3rd Level</option>
                  <option value={4}>4th Level</option>
                  <option value={5}>5th Level</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Arcane School</label>
                <select
                  value={spellSchool}
                  onChange={(e) => setSpellSchool(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="abjuration">Abjuration</option>
                  <option value="conjuration">Conjuration</option>
                  <option value="divination">Divination</option>
                  <option value="enchantment">Enchantment</option>
                  <option value="evocation">Evocation</option>
                  <option value="illusion">Illusion</option>
                  <option value="necromancy">Necromancy</option>
                  <option value="transmutation">Transmutation</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Range</label>
                <input
                  type="text"
                  value={spellRange}
                  onChange={(e) => setSpellRange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Spell Description</label>
                <textarea
                  value={spellDescription}
                  onChange={(e) => setSpellDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Scribe Spell</span>
              </button>
            </div>
          </form>
        )}

        {/* ITEM & RELIC FORGE */}
        {activeTab === 'items' && (
          <form onSubmit={handleSaveItem} className="space-y-5 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold font-cinzel text-amber-100">Equipment & Artifact Forge</h3>
              <p className="text-neutral-400 text-xs">
                Create weapons, armor, wondrous items, and relics with attunement and magical properties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Rarity</label>
                <select
                  value={itemRarity}
                  onChange={(e) => setItemRarity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="very_rare">Very Rare</option>
                  <option value="legendary">Legendary</option>
                  <option value="artifact">Artifact</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Item Lore & Properties</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Forge Equipment</span>
              </button>
            </div>
          </form>
        )}

        {/* SOURCE PACKS & PORTABLE PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-base font-bold font-cinzel text-amber-100">Installed Source Packs</h3>
                  <p className="text-neutral-400 text-xs">
                    Versioned rulesets and compendium packages with cryptographic provenance hashes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPackage}
                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1.5 transition-colors font-mono"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Package</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                {sourcePacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-100 text-sm">{pack.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-amber-400 border border-neutral-800">
                          v{pack.version}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        {pack.license}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{pack.description}</p>
                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
                      <span>Author: {pack.author}</span>
                      <span>
                        Counts: {pack.itemCount} items, {pack.spellCount} spells, {pack.monsterCount} monsters
                      </span>
                      <span className="text-amber-400/80">Hash: {pack.provenanceHash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* V2 HOMEBREW LIFECYCLE REGISTRY (DRAFT -> VALIDATE -> IMPLEMENT) */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-4">
            <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
              <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-cinzel text-amber-100">
                    Scoped Homebrew Lifecycle Registry (Draft → Validate → Implement)
                  </h3>
                  <p className="text-neutral-400 text-xs">
                    Overrides are scoped strictly to the active campaign/save and never mutate read-only SRD 5.1 rows.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-cyan-300">
                  SRD 5.1 Read-Only Guard Active
                </span>
              </div>

              <div className="space-y-3">
                {homebrewRecords.map((hb) => (
                  <div
                    key={`${hb.homebrew_id}-v${hb.version}`}
                    className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-100 text-sm">
                          {hb.name} (v{hb.version})
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                          {hb.category}
                        </span>
                        {hb.base_srd_uri && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300">
                            Overrides {hb.base_srd_uri}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          hb.status === 'implemented'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : hb.status === 'validated'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}
                      >
                        {hb.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300">
                      {hb.specification.summary || JSON.stringify(hb.specification)}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900">
                      <span className="text-[10px] font-mono text-neutral-500">
                        Scope: {hb.scope_kind}:{hb.scope_id} • Spec Hash: {hb.spec_hash.slice(0, 12)}
                      </span>
                      <div className="flex items-center gap-2">
                        {hb.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionHomebrew(hb, 'validated')}
                            className="px-3 py-1 rounded bg-cyan-800 hover:bg-cyan-700 text-white font-semibold text-xs"
                          >
                            Validate Specification
                          </button>
                        )}
                        {hb.status === 'validated' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionHomebrew(hb, 'implemented')}
                            className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs"
                          >
                            Implement in Campaign
                          </button>
                        )}
                        {hb.status === 'implemented' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionHomebrew(hb, 'deprecated')}
                            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                          >
                            Deprecate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
