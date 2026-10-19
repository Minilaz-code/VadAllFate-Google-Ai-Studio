import React, { useState } from 'react';
import {
  Compass,
  Scroll,
  BookOpen,
  Sword,
  Sliders,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Flame,
  Radio,
  FileText,
  X,
  Map as MapIcon,
  Users,
  MessageSquare,
  Footprints,
  Clock,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Dice5,
  Target,
  Coffee,
} from 'lucide-react';
import type { CharacterSheet, RuleCitation } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { Quest } from '../../types/world.ts';
import type { CausalEvent, SnapshotRef, UserRole, OperatingMode, PlayerSafeNpc, PlayerSafeQuest } from '../../types/runtime.ts';
import type { DirectorProfile, DirectorRecommendation, PlayerSpotlightMetric } from '../../types/director.ts';
import { CharacterSheetModal } from './CharacterSheetModal.tsx';
import { DiceRollerModal } from './DiceRollerModal.tsx';
import { ActionSubmissionModal } from './ActionSubmissionModal.tsx';
import { VadAllVoxBar } from './VadAllVoxBar.tsx';
import { runtimeService } from '../../runtime/adapter.ts';

export type SceneMode = 'roleplay' | 'exploration' | 'combat' | 'downtime';

interface NarrativePlayViewProps {
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
  onNavigateToBattlemap?: () => void;
}

export const NarrativePlayView: React.FC<NarrativePlayViewProps> = ({
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
  selectedCharacterId = 'char-kaelen',
  onSelectOperatingMode,
  onSelectDirectorProfile,
  onNavigateToBattlemap,
}) => {
  // Scene mode
  const [sceneMode, setSceneMode] = useState<SceneMode>('roleplay');

  // Panel state
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'party' | 'npcs' | 'quests'>('party');
  const [rightTab, setRightTab] = useState<'director' | 'rules' | 'timeline'>('director');

  // Modals
  const [sheetChar, setSheetChar] = useState<CharacterSheet | null>(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [inspectingRec, setInspectingRec] = useState<DirectorRecommendation | null>(null);

  // Input & dialogue
  const [actionInput, setActionInput] = useState('');
  const [selectedNpcId, setSelectedNpcId] = useState<string>('npc-brother-vaelin');

  // Rules reference
  const [rulesQuery, setRulesQuery] = useState('');
  const [rulesCategory, setRulesCategory] = useState('All');
  const [selectedRule, setSelectedRule] = useState<RuleCitation | null>(null);

  const activeChar = characters.find((c) => c.id === selectedCharacterId) || characters[0];
  const selectedNpc = npcs.find((n) => n.id === selectedNpcId) || npcs[0];

  // Narrative Story Stream entries
  const narrativeFeed = [
    {
      id: 'n1',
      type: 'scene_setting',
      speaker: 'Dungeon Master',
      timestamp: '14:20 DR',
      content:
        'The taproom of the Yawning Portal is thick with pipeweed smoke and the scent of roasted mutton. In the center of the tavern floor, the massive forty-foot stone ring of the dry well yawns open into the cold dark of Undermountain. A dozen torches sputter along the damp timber rafters.',
    },
    {
      id: 'n2',
      type: 'dialogue',
      speaker: 'Brother Vaelin',
      speakerRole: 'NPC (Priest of Tymora)',
      timestamp: '14:22 DR',
      content:
        '"May Lady Luck steady your blade, Kaelen. The rumors in Castle Ward speak of cultists gathering in the Sunken Crypts below the sewers. If their ritual completes before the crescent moon, half of the lower ward may succumb to their necrotic blight."',
    },
    {
      id: 'n3',
      type: 'player_action',
      speaker: activeChar ? activeChar.name : 'Kaelen',
      speakerRole: 'Player Action',
      timestamp: '14:24 DR',
      content:
        'Leans over the carved oak table, studying the rough parchment map sketched by Brother Vaelin. "We will enter through the sewer outflow behind the Trades Ward before dusk."',
    },
    {
      id: 'n4',
      type: 'rules_check',
      speaker: 'Rules Resolution (Demonstration)',
      speakerRole: 'Deterministic SRD',
      timestamp: '14:25 DR',
      content:
        'Kaelen performed an Insight check (DC 13): rolled 15 (d20: 13 + modifier: +2) -> SUCCESS. Vaelin is visibly shaken and speaks with desperate sincerity.',
    },
  ];

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim()) return;

    await runtimeService.submitActionEnvelope({
      actionId: `quick-act-${Date.now()}`,
      actorId: activeChar?.id || 'char-kaelen',
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

  const rulesList = runtimeService.queryRules(rulesQuery, rulesCategory);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden select-none">
      {/* 1. Scene Context Banner */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-amber-100 text-sm tracking-wide">
                  Act I · The Yawning Portal Taproom
                </h2>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-950 text-amber-400 border border-amber-800/40">
                  Castle Ward · Waterdeep
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden md:block" />

          {/* Scene Mode Selector */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded border border-neutral-800 text-xs">
            <button
              onClick={() => setSceneMode('roleplay')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                sceneMode === 'roleplay'
                  ? 'bg-amber-700/40 text-amber-200 border border-amber-600/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Roleplay
            </button>
            <button
              onClick={() => setSceneMode('exploration')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                sceneMode === 'exploration'
                  ? 'bg-amber-700/40 text-amber-200 border border-amber-600/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Exploration
            </button>
            <button
              onClick={() => setSceneMode('combat')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                sceneMode === 'combat'
                  ? 'bg-amber-700/40 text-amber-200 border border-amber-600/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Combat (Demo)
            </button>
            <button
              onClick={() => setSceneMode('downtime')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                sceneMode === 'downtime'
                  ? 'bg-amber-700/40 text-amber-200 border border-amber-600/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Downtime
            </button>
          </div>
        </div>

        {/* Action: Open Battlemap */}
        <div className="flex items-center gap-2">
          {onNavigateToBattlemap && (
            <button
              onClick={onNavigateToBattlemap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
              title="Switch to Tactical Battlemap Workspace"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Open Tactical Battlemap</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Narrative Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toggle */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-r border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={leftOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
        >
          {leftOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* LEFT PANEL: Party, Scene NPCs & Quests */}
        {leftOpen && (
          <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 shrink-0">
            {/* Left Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/70 text-xs">
              <button
                onClick={() => setLeftTab('party')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  leftTab === 'party'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Party</span>
              </button>
              <button
                onClick={() => setLeftTab('npcs')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  leftTab === 'npcs'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>NPCs</span>
              </button>
              <button
                onClick={() => setLeftTab('quests')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  leftTab === 'quests'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Quests</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs text-neutral-200">
              {leftTab === 'party' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    Active Party Members ({characters.length})
                  </span>
                  {characters.map((char) => (
                    <div
                      key={char.id}
                      className={`p-3 rounded border transition-colors ${
                        activeChar?.id === char.id
                          ? 'bg-amber-950/20 border-amber-600/50'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-neutral-100 font-cinzel text-sm">{char.name}</h4>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Lvl {char.level} {char.race} {char.characterClass}
                          </span>
                        </div>
                        <button
                          onClick={() => setSheetChar(char)}
                          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium text-[10px]"
                        >
                          Sheet
                        </button>
                      </div>

                      {/* HP Bar & Stats */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-neutral-400">HP:</span>
                          <span className="text-emerald-400">
                            {char.currentHp} / {char.maxHp}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, (char.currentHp / char.maxHp) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-neutral-900 font-mono text-[10px] text-center">
                        <div className="bg-neutral-900/60 p-1 rounded">
                          <span className="text-neutral-500 block">AC</span>
                          <span className="text-amber-300 font-bold">{char.armorClass}</span>
                        </div>
                        <div className="bg-neutral-900/60 p-1 rounded">
                          <span className="text-neutral-500 block">Speed</span>
                          <span className="text-neutral-200">{char.speedFt}ft</span>
                        </div>
                        <div className="bg-neutral-900/60 p-1 rounded">
                          <span className="text-neutral-500 block">Passive</span>
                          <span className="text-cyan-300">{char.passivePerception}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'npcs' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    Scene NPCs Present ({npcs.filter((n) => userRole === 'dm_host' || n.token.isVisibleToPlayers).length})
                  </span>
                  {npcs.map((npc) => {
                    const isVisible = userRole === 'dm_host' || npc.token.isVisibleToPlayers;
                    if (!isVisible) return null;

                    const verifiedFacts = 'publicKnowledge' in npc
                      ? npc.publicKnowledge.publicFacts
                      : (npc as NonPlayerCharacter).knowledgeBoundary?.verifiedFacts || [];

                    return (
                      <div
                        key={npc.id}
                        className={`p-3 rounded border transition-colors ${
                          selectedNpcId === npc.id
                            ? 'bg-amber-950/20 border-amber-600/50'
                            : 'bg-neutral-950 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {!npc.token.isVisibleToPlayers && (
                              <span title="Hidden from players">
                                <EyeOff className="w-3 h-3 text-red-400" />
                              </span>
                            )}
                            <h4 className="font-bold text-neutral-100 font-cinzel text-sm">{npc.name}</h4>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono">{npc.occupation}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {npc.appearanceDescription}
                        </p>

                        {/* Known Topics */}
                        {verifiedFacts.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-neutral-900 space-y-1">
                            <span className="text-[9px] font-mono uppercase text-emerald-400 block">
                              Dialogue Topics:
                            </span>
                            <ul className="list-disc list-inside text-[10px] text-neutral-300 space-y-0.5">
                              {verifiedFacts.slice(0, 2).map((fact, idx) => (
                                <li key={idx} className="truncate">{fact}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-2 pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedNpcId(npc.id);
                              setActionInput(`Inquire with ${npc.name} regarding: `);
                            }}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium"
                          >
                            Speak to {npc.name.split(' ')[0]}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {leftTab === 'quests' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    Active Quests ({quests.length})
                  </span>
                  {quests.map((quest) => (
                    <div key={quest.id} className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-amber-200 font-cinzel text-xs">{quest.title}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 text-[9px] font-mono">
                          {quest.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        Quest Giver: {quest.giverName} · Urgency: {quest.urgency}
                      </p>

                      <div className="space-y-1 pt-1 border-t border-neutral-900">
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">Objectives:</span>
                        {quest.objectives.map((obj) => (
                          <div key={obj.id} className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                            <div className={`w-2 h-2 rounded-full ${obj.isCompleted ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
                            <span className={obj.isCompleted ? 'line-through text-neutral-500' : ''}>
                              {obj.description}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] font-mono text-amber-400/90 pt-1 border-t border-neutral-900">
                        Reward: {quest.rewardsDescription}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CENTER: Story Feed, Mode Panels & Action Console */}
        <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative overflow-hidden">
          {/* Mode-Specific Context Banner */}
          {sceneMode === 'combat' && (
            <div className="bg-red-950/40 border-b border-red-900/40 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 text-red-200">
                <Sword className="w-4 h-4 text-red-400" />
                <span className="font-bold">Tactical Combat Mode (Demonstration Initiative Tracker)</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Non-authoritative display · Python R1 runtime owns turn order & damage
              </span>
            </div>
          )}

          {sceneMode === 'exploration' && (
            <div className="bg-emerald-950/30 border-b border-emerald-900/40 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 text-emerald-200">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Exploration Mode: The Yawning Portal Dry Well</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Perception & Investigation DC references active
              </span>
            </div>
          )}

          {sceneMode === 'downtime' && (
            <div className="bg-cyan-950/30 border-b border-cyan-900/40 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 text-cyan-200">
                <Coffee className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">Downtime & Tavern Rest: Castle Ward</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Short rest (1 hour) or Long rest (8 hours) rolls available
              </span>
            </div>
          )}

          {/* Combat Initiative Tracker Table (Display-Only in Combat Mode) */}
          {sceneMode === 'combat' && (
            <div className="p-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-amber-400 block font-bold">1. Kaelen (Rogue)</span>
                  <span className="text-neutral-400">Initiative: 19 · HP 24/24 · AC 15</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-neutral-200 block font-bold">2. Lyra Moonshadow</span>
                  <span className="text-neutral-400">Initiative: 16 · HP 28/28 · AC 14</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-red-400 block font-bold">3. Shadow Initiate</span>
                  <span className="text-neutral-400">Initiative: 12 · HP 16/16 · AC 12</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-emerald-400 block font-bold">4. Brother Vaelin</span>
                  <span className="text-neutral-400">Initiative: 8 · HP 18/18 · AC 13</span>
                </div>
              </div>
            </div>
          )}

          {/* Narrative Story Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {narrativeFeed.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                  item.type === 'scene_setting'
                    ? 'bg-neutral-900/90 border-amber-900/30 text-neutral-200'
                    : item.type === 'dialogue'
                    ? 'bg-amber-950/20 border-amber-700/40 text-amber-100'
                    : item.type === 'rules_check'
                    ? 'bg-neutral-900 border-cyan-800/40 text-cyan-200 font-mono text-[11px]'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/60 text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">{item.speaker}</span>
                    {item.speakerRole && (
                      <span className="text-neutral-400">({item.speakerRole})</span>
                    )}
                  </div>
                  <span className="text-neutral-500">{item.timestamp}</span>
                </div>
                <p className="text-neutral-200">{item.content}</p>
              </div>
            ))}
          </div>

          {/* Quick Action Pills & Skills */}
          <div className="px-4 py-2 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-neutral-500 font-mono text-[10px] mr-1">Quick Rolls:</span>
              {['Stealth +5', 'Perception +4', 'Insight +2', 'Athletics +1', 'Initiative +3'].map((skill) => (
                <button
                  key={skill}
                  onClick={() => setShowDiceModal(true)}
                  className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-mono text-[10px] whitespace-nowrap transition-colors"
                >
                  {skill}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDiceModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors border border-neutral-700"
              >
                <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                <span>Roll Dice</span>
              </button>
              <button
                onClick={() => setShowActionModal(true)}
                className="flex items-center gap-1 px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Submit ActionEnvelope</span>
              </button>
            </div>
          </div>

          {/* Narrative Prompt Console */}
          <form onSubmit={handleQuickSubmit} className="p-3 bg-neutral-900 border-t border-neutral-800 shrink-0 flex gap-2">
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder={`What does ${activeChar?.name || 'Kaelen'} do? (e.g. "I ask Brother Vaelin about the symbols carved on the vault key")`}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded-md text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Act</span>
            </button>
          </form>
        </main>

        {/* Right Toggle */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-l border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={rightOpen ? 'Collapse Right Sidebar' : 'Expand Right Sidebar'}
        >
          {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* RIGHT PANEL: Director AI, Rules Reference & Receipts */}
        {rightOpen && (
          <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 shrink-0">
            {/* Right Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/70 text-xs">
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
                onClick={() => setRightTab('rules')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  rightTab === 'rules'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>5e Rules</span>
              </button>
              <button
                onClick={() => setRightTab('timeline')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  rightTab === 'timeline'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Events</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs text-neutral-200">
              {rightTab === 'director' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="font-mono text-[10px] uppercase text-neutral-400">
                      Narrative Pacing & Tension
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono">
                      Moderate Tension
                    </span>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                      Active AI Director Suggestions ({recommendations.length}):
                    </span>
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 bg-neutral-950 rounded border border-amber-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-amber-200 text-xs font-cinzel">{rec.title}</h5>
                          <span className="text-[9px] font-mono text-neutral-400">{rec.recommendationType}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300">{rec.proposal}</p>
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => setInspectingRec(rec)}
                            className="px-2 py-0.5 rounded bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-700/40 text-[10px]"
                          >
                            Inspect & Authorize
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Spotlight Metrics */}
                  {spotlightMetrics.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                        Player Spotlight Balance:
                      </span>
                      {spotlightMetrics.map((sm) => (
                        <div key={sm.playerId} className="flex items-center justify-between font-mono text-[10px]">
                          <span className="text-neutral-300">{sm.characterName}</span>
                          <span className="text-amber-400">{sm.spotlightScore}% spotlight</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {rightTab === 'rules' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search 5e rules (e.g. grapple, cover, stealth)..."
                      value={rulesQuery}
                      onChange={(e) => setRulesQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-[11px] text-neutral-200 placeholder-neutral-500"
                    />
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Combat', 'Actions', 'Conditions', 'Movement', 'Magic'].map((cat) => (
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

                  {/* Rules list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {rulesList.map((rule) => (
                      <div
                        key={rule.ruleId}
                        onClick={() => setSelectedRule(rule)}
                        className="p-2 bg-neutral-950 rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-200 text-xs">{rule.title}</span>
                          <span className="text-[9px] font-mono text-amber-400">{rule.source}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2">{rule.citationText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rightTab === 'timeline' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    Causal Timeline ({events.length} Events)
                  </span>
                  {events.map((ev) => (
                    <div key={ev.eventId} className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-300 font-bold">{ev.category}</span>
                        <span className="text-neutral-500">{ev.worldMinute}m</span>
                      </div>
                      <p className="text-[11px] text-neutral-300">{ev.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Full Character Sheet Modal */}
      <CharacterSheetModal
        character={sheetChar}
        onClose={() => setSheetChar(null)}
        onRollCheck={(skill: string, mod: number) => {
          setShowDiceModal(true);
        }}
      />

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={showDiceModal}
        onClose={() => setShowDiceModal(false)}
        onApplyRollToGame={(res: any, label: string) => {
          // Add roll to action input or narrative
        }}
      />

      {/* Action Submission Modal */}
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
