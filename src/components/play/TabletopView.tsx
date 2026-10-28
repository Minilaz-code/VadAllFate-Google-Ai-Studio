import React, { useState, useEffect } from 'react';
import {
  Users,
  Compass,
  Scroll,
  BookOpen,
  Sword,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Shield,
  Heart,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Radio,
  FileText,
  X,
  Database,
} from 'lucide-react';
import type { CharacterSheet, RuleCitation } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { Quest } from '../../types/world.ts';
import type { CausalEvent, SnapshotRef, UserRole, OperatingMode, PlayerSafeNpc, PlayerSafeQuest } from '../../types/runtime.ts';
import type { DirectorProfile, DirectorRecommendation, PlayerSpotlightMetric } from '../../types/director.ts';
import { VirtualTabletop } from './VirtualTabletop.tsx';
import { CharacterSheetModal } from './CharacterSheetModal.tsx';
import { DiceRollerModal } from './DiceRollerModal.tsx';
import { ActionSubmissionModal } from './ActionSubmissionModal.tsx';
import { VadAllVoxBar } from './VadAllVoxBar.tsx';
import { runtimeService } from '../../runtime/adapter.ts';
import {
  srd51ReferenceClient,
  formatSRD51EntityDetails,
  type SRD51EntityRecord,
  type SRD51SourceMetadata,
} from '../../services/srd51Reference.ts';

interface TabletopViewProps {
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  quests: (Quest | PlayerSafeQuest)[];
  events: CausalEvent[];
  currentSnapshot: SnapshotRef;
  userRole: UserRole;
  operatingMode: OperatingMode;
  directorProfiles: DirectorProfile[];
  activeDirectorProfileId: string;
  recommendations: DirectorRecommendation[];
  spotlightMetrics: PlayerSpotlightMetric[];
  selectedCharacterId?: string;
  onSelectOperatingMode: (mode: OperatingMode) => void;
  onSelectDirectorProfile: (profileId: string) => void;
}

export const TabletopView: React.FC<TabletopViewProps> = ({
  characters,
  npcs,
  quests,
  events,
  currentSnapshot,
  userRole,
  operatingMode,
  directorProfiles,
  activeDirectorProfileId,
  recommendations,
  spotlightMetrics,
  selectedCharacterId,
  onSelectOperatingMode,
  onSelectDirectorProfile,
}) => {
  // Panel collapse states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // Tabs
  const [leftTab, setLeftTab] = useState<'party' | 'npcs' | 'quests' | 'rules'>('party');
  const [rightTab, setRightTab] = useState<'inspector' | 'director' | 'initiative'>('inspector');
  const [bottomTab, setBottomTab] = useState<'timeline' | 'receipts'>('timeline');

  // Selected Entity
  const [selectedEntityId, setSelectedEntityId] = useState<string>('char-kaelen');
  const [selectedEntityType, setSelectedEntityType] = useState<'character' | 'npc'>('character');

  // Modals
  const [sheetChar, setSheetChar] = useState<CharacterSheet | null>(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionInput, setActionInput] = useState('');

  // Rules search (Live Python SRD 5.1 Read-Only API + separate Campaign House Rules overlay)
  const [rulesQuery, setRulesQuery] = useState('');
  const [rulesCategory, setRulesCategory] = useState('All');
  const [selectedRule, setSelectedRule] = useState<RuleCitation | null>(null);
  const [srdItems, setSrdItems] = useState<SRD51EntityRecord[]>([]);
  const [selectedSrdEntity, setSelectedSrdEntity] = useState<SRD51EntityRecord | null>(null);
  const [srdStatus, setSrdStatus] = useState<SRD51SourceMetadata | null>(null);
  const [srdLoading, setSrdLoading] = useState(false);
  const [srdError, setSrdError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    srd51ReferenceClient
      .getStatus(controller.signal)
      .then((meta) => {
        setSrdStatus(meta);
        setSrdError(null);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setSrdStatus(null);
          setSrdError(err?.message || 'SRD 5.1 Python reference API is unavailable.');
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSrdLoading(true);
      srd51ReferenceClient
        .search({
          query: rulesQuery,
          category: rulesCategory,
          limit: 50,
          signal: controller.signal,
        })
        .then((res) => {
          setSrdItems(res.items);
          setSrdError(null);
          setSrdLoading(false);
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setSrdItems([]);
            setSrdError(err?.message || 'Failed to query SRD 5.1 reference API.');
            setSrdLoading(false);
          }
        });
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [rulesQuery, rulesCategory]);

  const houseRulesList = runtimeService
    .queryRules(rulesQuery, rulesCategory === 'Monsters' || rulesCategory === 'Equipment' ? 'All' : rulesCategory)
    .filter((r) => r.source === 'House Rule');

  // Director Explanation Inspector modal/drawer
  const [inspectingRec, setInspectingRec] = useState<DirectorRecommendation | null>(null);

  const selectedChar = characters.find((c) => c.id === selectedEntityId);
  const selectedNpc = npcs.find((n) => n.id === selectedEntityId);

  // Filtered lists based on userRole
  const visibleNpcs = npcs.filter((n) => userRole === 'dm_host' || n.token.isVisibleToPlayers);
  const visibleEvents = events.filter((e) => userRole === 'dm_host' || !e.isDmOnly);

  // Quick Action Submission from Bottom Input
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim()) return;

    await runtimeService.submitActionEnvelope({
      actionId: `quick-act-${Date.now()}`,
      actorId: selectedCharacterId || 'char-kaelen',
      actorRole: userRole,
      actionType: 'FREEFORM_ROLEPLAY',
      payload: {
        message: actionInput.trim(),
        targetNpcName: selectedNpc ? selectedNpc.name : undefined,
      },
      snapshotRef: { ...currentSnapshot },
      timestampUtc: new Date().toISOString(),
      clientNonce: `nonce-${Math.random().toString(36).substring(2, 7)}`,
    });

    setActionInput('');
  };

  const handleMoveToken = (entityId: string, targetX: number, targetY: number, entityType: 'character' | 'npc') => {
    runtimeService.submitActionEnvelope({
      actionId: `move-${Date.now()}`,
      actorId: entityId,
      actorRole: userRole,
      actionType: 'MOVE_TOKEN',
      payload: {
        entityId,
        cellX: targetX,
        cellY: targetY,
        targetX,
        targetY,
        targetCell: { x: targetX, y: targetY },
        entityType,
        coordinateSystem: 'grid_cell',
      },
      snapshotRef: { ...currentSnapshot },
      timestampUtc: new Date().toISOString(),
      clientNonce: `nonce-${Date.now()}`,
    });
  };

  const rulesList = runtimeService.queryRules(rulesQuery, rulesCategory);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden">
      {/* Top 3-Panel Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        {leftPanelOpen && (
          <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 shrink-0">
            {/* Panel Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/70 text-xs">
              {[
                { id: 'party', label: 'Party', icon: Users },
                { id: 'npcs', label: 'NPCs', icon: Compass },
                { id: 'quests', label: 'Quests', icon: Scroll },
                { id: 'rules', label: 'Rules', icon: BookOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setLeftTab(tab.id as any)}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                      leftTab === tab.id
                        ? 'border-amber-500 text-amber-200 bg-neutral-900'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-neutral-200">
              {leftTab === 'party' && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 flex justify-between items-center mb-1">
                    <span>Adventuring Party</span>
                    <span className="text-amber-400">SRD 5.1</span>
                  </div>
                  {characters.map((char) => (
                    <div
                      key={char.id}
                      onClick={() => {
                        setSelectedEntityId(char.id);
                        setSelectedEntityType('character');
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedEntityId === char.id
                          ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white font-cinzel text-xs"
                            style={{ backgroundColor: char.token.color }}
                          >
                            {char.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-100">{char.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Lvl {char.level} {char.characterClass}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSheetChar(char);
                          }}
                          aria-label={`Open sheet for ${char.name}`}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-amber-300 transition-colors"
                        >
                          Sheet
                        </button>
                      </div>

                      {/* Mini HP & AC bar */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {char.currentHp} / {char.maxHp} HP
                        </span>
                        <span className="text-amber-300 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          AC {char.armorClass}
                        </span>
                        <span className="text-neutral-400">Init {char.initiativeBonus >= 0 ? `+${char.initiativeBonus}` : char.initiativeBonus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'npcs' && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 flex justify-between items-center mb-1">
                    <span>Active In Scene</span>
                    <span>{visibleNpcs.length} NPCs</span>
                  </div>
                  {visibleNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      onClick={() => {
                        setSelectedEntityId(npc.id);
                        setSelectedEntityType('npc');
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedEntityId === npc.id
                          ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-neutral-100">{npc.name}</div>
                        {!npc.token.isVisibleToPlayers && (
                          <span className="text-[9px] font-mono px-1 rounded bg-red-950 text-red-300 border border-red-800">
                            DM HIDDEN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{npc.title}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-1">
                        Race: {npc.race} • Occ: {npc.occupation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'quests' && (
                <div className="space-y-2.5">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">
                    Active Campaign Quests
                  </div>
                  {quests.map((q) => (
                    <div key={q.id} className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-amber-200">{q.title}</h4>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {q.urgency}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400">Giver: {q.giverName}</p>
                      <div className="mt-2 space-y-1">
                        {q.objectives.map((obj) => (
                          <div key={obj.id} className="flex items-start gap-1.5 text-[11px]">
                            <span className={obj.isCompleted ? 'text-emerald-400' : 'text-neutral-500'}>
                              {obj.isCompleted ? '✓' : '○'}
                            </span>
                            <span className={obj.isCompleted ? 'line-through text-neutral-500' : 'text-neutral-300'}>
                              {obj.description}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* DM Secret Twist (Visible only to DM role) */}
                      {userRole === 'dm_host' && (q as any).dmSecretTwist && (
                        <div className="mt-2.5 p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300">
                          <span className="font-bold font-mono uppercase">[DM Secret]: </span>
                          {(q as any).dmSecretTwist}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'rules' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Database className="w-3 h-3 text-amber-400" />
                      <span>SRD 5.1 & House Rules</span>
                    </span>
                    {srdStatus ? (
                      <span className="text-emerald-400">{srdStatus.total_entities} RO</span>
                    ) : (
                      <span className="text-red-400">API Offline</span>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                    <input
                      type="text"
                      value={rulesQuery}
                      onChange={(e) => setRulesQuery(e.target.value)}
                      placeholder="Search grapple, fireball, aboleth, cover..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded pl-8 pr-2 py-1.5 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Combat', 'Actions', 'Conditions', 'Movement', 'Magic', 'Monsters', 'Equipment'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setRulesCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          rulesCategory === cat
                            ? 'bg-amber-700 text-neutral-950 font-bold'
                            : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {srdError && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-800/60 text-red-200 text-[10px] font-mono">
                      {srdError}
                    </div>
                  )}

                  {srdLoading && (
                    <div className="text-[10px] font-mono text-neutral-400 py-1 text-center">
                      Querying SRD 5.1 SQLite…
                    </div>
                  )}

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {srdItems.map((item) => (
                      <div
                        key={item.entity_key}
                        onClick={() => {
                          setSelectedSrdEntity(item);
                          setSelectedRule(null);
                        }}
                        className={`p-2.5 rounded border transition-colors cursor-pointer ${
                          selectedSrdEntity?.entity_key === item.entity_key
                            ? 'bg-amber-950/40 border-amber-600/70'
                            : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-neutral-200 truncate">{item.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 text-amber-400 border border-neutral-800">
                            {item.ruleset} • {item.entity_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">{item.summary}</p>
                      </div>
                    ))}

                    {houseRulesList.map((r) => (
                      <div
                        key={r.ruleId}
                        onClick={() => {
                          setSelectedRule(r);
                          setSelectedSrdEntity(null);
                        }}
                        className={`p-2.5 rounded border transition-colors cursor-pointer ${
                          selectedRule?.ruleId === r.ruleId
                            ? 'bg-amber-950/40 border-amber-600/70'
                            : 'bg-neutral-950/70 border-amber-900/40 hover:border-amber-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-amber-200">{r.title}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {r.source}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">{r.citationText}</p>
                      </div>
                    ))}
                  </div>

                  {selectedSrdEntity && (() => {
                    const formatted = formatSRD51EntityDetails(selectedSrdEntity);
                    return (
                      <div className="p-3 rounded bg-neutral-950 border border-amber-800/40 text-neutral-200 mt-2 space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-amber-200">
                          <span>{selectedSrdEntity.name}</span>
                          <span className="text-[10px] font-mono text-amber-400">{selectedSrdEntity.entity_key}</span>
                        </div>
                        <p className="text-[10px] font-mono text-cyan-300">{formatted.subtitle}</p>
                        <p className="text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap">{formatted.bodyText}</p>
                      </div>
                    );
                  })()}

                  {selectedRule && (
                    <div className="p-3 rounded bg-neutral-950 border border-amber-800/40 text-neutral-200 mt-2">
                      <div className="flex items-center justify-between font-bold text-amber-200 mb-1">
                        <span>{selectedRule.title}</span>
                        <span className="text-[10px] font-mono text-amber-400">{selectedRule.source}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">{selectedRule.citationText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Left Collapse Toggle Button */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-r border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={leftPanelOpen ? 'Collapse Left Panel' : 'Expand Left Panel'}
        >
          {leftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* CENTRE PANEL: Virtual Tabletop Canvas */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          <VirtualTabletop
            characters={characters}
            npcs={npcs}
            userRole={userRole}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id, type) => {
              setSelectedEntityId(id);
              setSelectedEntityType(type);
              setRightTab('inspector');
            }}
            onMoveToken={handleMoveToken}
            onQuickAttack={(atk, tgt) => setShowActionModal(true)}
            onOpenDiceRoller={() => setShowDiceModal(true)}
          />
        </main>

        {/* Right Collapse Toggle Button */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-l border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={rightPanelOpen ? 'Collapse Right Panel' : 'Expand Right Panel'}
        >
          {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* RIGHT PANEL: Inspector & Director Controls */}
        {rightPanelOpen && (
          <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 shrink-0">
            {/* Right Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/70 text-xs">
              <button
                onClick={() => setRightTab('inspector')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  rightTab === 'inspector'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>
              <button
                onClick={() => setRightTab('director')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  rightTab === 'director'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Director AI</span>
              </button>
              <button
                onClick={() => setRightTab('initiative')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  rightTab === 'initiative'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sword className="w-3.5 h-3.5" />
                <span>Initiative</span>
              </button>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-neutral-200">
              {rightTab === 'inspector' && (
                <div>
                  {selectedChar && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                        <div>
                          <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{selectedChar.name}</h3>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {selectedChar.race} {selectedChar.characterClass}
                          </span>
                        </div>
                        <button
                          onClick={() => setSheetChar(selectedChar)}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium"
                        >
                          Full Sheet
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                          <span className="text-[9px] text-neutral-500 uppercase font-mono">HP</span>
                          <div className="text-sm font-bold text-emerald-400 font-mono">
                            {selectedChar.currentHp}/{selectedChar.maxHp}
                          </div>
                        </div>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                          <span className="text-[9px] text-neutral-500 uppercase font-mono">AC</span>
                          <div className="text-sm font-bold text-amber-300 font-mono">{selectedChar.armorClass}</div>
                        </div>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                          <span className="text-[9px] text-neutral-500 uppercase font-mono">Speed</span>
                          <div className="text-sm font-bold text-neutral-200 font-mono">{selectedChar.speedFt}ft</div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono text-neutral-400 block">Actions & Attacks</span>
                        {selectedChar.inventory
                          .filter((i) => i.type === 'weapon')
                          .map((w) => (
                            <div
                              key={w.id}
                              className="p-2 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold text-neutral-200">{w.name}</div>
                                <div className="text-[10px] text-neutral-500 font-mono">{w.damage} {w.damageType}</div>
                              </div>
                              <button
                                onClick={() => setShowActionModal(true)}
                                className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] font-mono border border-amber-700/60"
                              >
                                Strike
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedNpc && (
                    <div className="space-y-3">
                      <div className="pb-2 border-b border-neutral-800">
                        <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{selectedNpc.name}</h3>
                        <p className="text-[10px] text-neutral-400">{selectedNpc.title}</p>
                      </div>

                      <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                        <span className="text-[9px] text-neutral-500 uppercase font-mono">Appearance</span>
                        <p className="text-[11px] text-neutral-300 mt-0.5">{selectedNpc.appearanceDescription}</p>
                      </div>

                      {/* Knowledge boundary card */}
                      <div className="p-2.5 bg-neutral-950 rounded border border-amber-800/40 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-300 font-mono uppercase block">
                          {userRole === 'dm_host' ? 'NPC Knowledge Boundary' : 'Public Knowledge & Rumors'}
                        </span>
                        <div>
                          <span className="text-[9px] text-emerald-400 font-mono">
                            {userRole === 'dm_host' ? 'Verified Facts:' : 'Known Facts & Topics:'}
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-neutral-300">
                            {('publicKnowledge' in selectedNpc
                              ? selectedNpc.publicKnowledge.publicFacts
                              : (selectedNpc as NonPlayerCharacter).knowledgeBoundary?.verifiedFacts || []
                            ).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                        {userRole === 'dm_host' && 'knowledgeBoundary' in selectedNpc && (selectedNpc as NonPlayerCharacter).knowledgeBoundary.guardedSecrets && (
                          <div className="pt-1.5 border-t border-neutral-800">
                            <span className="text-[9px] text-amber-400 font-mono uppercase">[DM Secrets]:</span>
                            <ul className="list-disc list-inside text-[11px] text-amber-200/90">
                              {((selectedNpc as NonPlayerCharacter).knowledgeBoundary.guardedSecrets || []).map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Memory cue list (DM Host Only) */}
                      {userRole === 'dm_host' && (selectedNpc as any)?.memoryEntries && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                            Structured Memories
                          </span>
                          <div className="space-y-1.5">
                            {((selectedNpc as any).memoryEntries || []).map((m: any) => (
                              <div key={m.id} className="p-2 rounded bg-neutral-950 border border-neutral-800">
                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                                  <span>{m.subject}</span>
                                  <span>{m.worldMinute}m</span>
                                </div>
                                <p className="text-[11px] text-neutral-300 mt-0.5">{m.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {rightTab === 'director' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                      Storyteller Profile
                    </span>
                    <select
                      value={activeDirectorProfileId}
                      onChange={(e) => onSelectDirectorProfile(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-600"
                    >
                      {directorProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tension Meter */}
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-neutral-400">Narrative Tension</span>
                      <span className="text-amber-300 font-bold">58 / 100 Target</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-red-500" style={{ width: '58%' }} />
                    </div>
                  </div>

                  {/* Spotlight Balancer */}
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                      Player Spotlight Balancing
                    </span>
                    {spotlightMetrics.map((sm) => (
                      <div key={sm.playerId} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span>{sm.characterName}</span>
                          <span className="font-mono text-amber-300">{sm.spotlightScore}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${sm.spotlightScore}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400">
                      <span>Director Suggestions</span>
                      <span>{recommendations.length} Pending</span>
                    </div>
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-amber-200">{rec.title}</h4>
                          <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 text-neutral-400">
                            {rec.recommendationType}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-snug">{rec.proposal}</p>
                        
                        {/* Explanation Inspector Button */}
                        <button
                          onClick={() => setInspectingRec(rec)}
                          className="w-full py-1 text-center text-[10px] font-mono rounded bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 transition-colors"
                        >
                          Inspect Director Causal Reasoning
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rightTab === 'initiative' && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">
                    Combat Initiative Tracker
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Kaelen Swiftwind', init: 21, hp: '24/28', type: 'PC' },
                      { name: 'Sorsha Grayveil', init: 17, hp: '24/24', type: 'NPC' },
                      { name: 'Lyra Moonwhisper', init: 14, hp: '20/20', type: 'PC' },
                      { name: 'Brother Vaelin', init: 8, hp: '18/18', type: 'NPC' },
                    ].map((turn, i) => (
                      <div
                        key={turn.name}
                        className={`p-2.5 rounded border flex items-center justify-between ${
                          i === 0
                            ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">#{turn.init}</span>
                          <span className="font-semibold">{turn.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400">{turn.hp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* BOTTOM PANEL: Timeline, Dice console, Quick actions, VadAllVox */}
      {bottomPanelOpen && (
        <footer className="h-56 bg-neutral-900 border-t border-neutral-800 flex flex-col z-30 shrink-0">
          {/* Bottom Bar Controls & Tabs */}
          <div className="px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="font-cinzel font-semibold text-neutral-200">Session Ledger:</span>
              <button
                onClick={() => setBottomTab('timeline')}
                className={`font-medium transition-colors ${
                  bottomTab === 'timeline' ? 'text-amber-300 font-bold' : 'hover:text-neutral-200'
                }`}
              >
                Causal Event Stream ({visibleEvents.length})
              </button>
              <span className="text-neutral-600">•</span>
              <button
                onClick={() => setShowActionModal(true)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                <Zap className="w-3 h-3" />
                <span>ActionEnvelope</span>
              </button>
              <span className="text-neutral-600">•</span>
              <button
                onClick={() => setShowDiceModal(true)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                <Sparkles className="w-3 h-3" />
                <span>Dice Tray</span>
              </button>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-neutral-500">Current Commit:</span>
              <span className="text-amber-300 font-bold">Seq #{currentSnapshot.commitSequence}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">Hash: {currentSnapshot.stateHash.substring(0, 8)}...</span>
            </div>
          </div>

          {/* Event Stream Log */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
            {visibleEvents.map((evt) => (
              <div
                key={evt.eventId}
                className={`px-3 py-1.5 rounded flex items-start justify-between gap-3 ${
                  evt.isDmOnly
                    ? 'bg-amber-950/30 border border-amber-800/40 text-amber-200'
                    : 'bg-neutral-950/70 border border-neutral-800/80 text-neutral-300'
                }`}
              >
                <div className="flex items-start gap-2 max-w-4xl">
                  <span className="text-[10px] text-neutral-500 select-none shrink-0 mt-0.5">
                    [{evt.worldMinute}m | #{evt.commitSequence}]
                  </span>
                  <span className="font-semibold text-neutral-200 shrink-0">{evt.actorName}:</span>
                  <span className="text-neutral-300">{evt.summary}</span>
                </div>
                {evt.diceRoll && (
                  <div className="shrink-0 text-right font-mono text-[11px] text-amber-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {evt.diceRoll.formula} ➔ <span className="font-bold">{evt.diceRoll.total}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Quick-Action Input Bar */}
          <form onSubmit={handleQuickSubmit} className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              {userRole === 'dm_host' ? 'DM Narration / Intent:' : 'Player Action:'}
            </span>
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder="e.g. I draw my bow and search the submerged archway for tripwires..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-600"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

          {/* VadAllVox Voice System Bar */}
          <VadAllVoxBar
            activeSpeakerName={selectedNpc ? selectedNpc.name : 'Brother Vaelin'}
            lastDialogueText="“The Third Age seals were never designed to withstand this much pressure! If the sluice gates give way, we will all drown.”"
          />
        </footer>
      )}

      {/* MODALS */}
      <CharacterSheetModal
        character={sheetChar}
        onClose={() => setSheetChar(null)}
        onRollCheck={(skill, mod) => {
          setShowDiceModal(true);
        }}
      />

      <DiceRollerModal
        isOpen={showDiceModal}
        onClose={() => setShowDiceModal(false)}
        onApplyRollToGame={(res, label) => {
          runtimeService.submitActionEnvelope({
            actionId: `dice-act-${Date.now()}`,
            actorId: selectedCharacterId || 'char-kaelen',
            actorRole: userRole,
            actionType: 'SKILL_CHECK',
            payload: {
              skillName: label,
              roll: res.rolls[0] || res.baseTotal,
              modifier: res.modifier,
              total: res.total,
              reason: res.details,
            },
            snapshotRef: { ...currentSnapshot },
            timestampUtc: new Date().toISOString(),
            clientNonce: `nonce-${Date.now()}`,
          });
        }}
      />

      <ActionSubmissionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        currentSnapshot={currentSnapshot}
        characters={characters}
        npcs={npcs}
        userRole={userRole}
        selectedCharacterId={selectedCharacterId}
      />

      {/* Director Explanation Inspector Drawer */}
      {inspectingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-amber-800/40 rounded-lg shadow-2xl p-6 text-xs text-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold font-cinzel text-amber-100 text-sm">
                  Director AI Recommendation Explanation
                </h3>
              </div>
              <button
                onClick={() => setInspectingRec(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500">Proposal</span>
              <h4 className="font-bold text-neutral-100 text-sm mt-0.5">{inspectingRec.title}</h4>
              <p className="text-neutral-300 mt-1">{inspectingRec.proposal}</p>
            </div>

            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-amber-400">Tension Assessment: </span>
                <span className="text-neutral-300">{inspectingRec.directorExplanation.tensionAssessment}</span>
              </div>
              <div>
                <span className="text-cyan-400">Pacing Assessment: </span>
                <span className="text-neutral-300">{inspectingRec.directorExplanation.pacingAssessment}</span>
              </div>
              <div>
                <span className="text-emerald-400">Spotlight Assessment: </span>
                <span className="text-neutral-300">{inspectingRec.directorExplanation.spotlightAssessment}</span>
              </div>
              <div>
                <span className="text-amber-300">Causal Narrative Reason: </span>
                <span className="text-neutral-300">{inspectingRec.directorExplanation.narrativeCausalReason}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  runtimeService.reviewRecommendation(inspectingRec.id, 'DISMISSED');
                  setInspectingRec(null);
                }}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                Dismiss Suggestion
              </button>
              <button
                onClick={() => {
                  runtimeService.reviewRecommendation(inspectingRec.id, 'ACCEPTED');
                  setInspectingRec(null);
                }}
                className="px-4 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold"
              >
                Authorize & Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
