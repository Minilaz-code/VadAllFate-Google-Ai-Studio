import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Database,
  Award,
} from 'lucide-react';
import type { CharacterSheet, RuleCitation } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { Quest } from '../../types/world.ts';
import type { CausalEvent, SnapshotRef, UserRole, OperatingMode, PlayerSafeNpc, PlayerSafeQuest, CombatTurnState, DemoActionType } from '../../types/runtime.ts';
import type { DirectorProfile, DirectorRecommendation, PlayerSpotlightMetric } from '../../types/director.ts';
import { CharacterSheetModal } from './CharacterSheetModal.tsx';
import { DiceRollerModal } from './DiceRollerModal.tsx';
import { ActionSubmissionModal } from './ActionSubmissionModal.tsx';
import { VadAllVoxBar } from './VadAllVoxBar.tsx';
import { CombatTracker } from './CombatTracker.tsx';
import { v2BackendClient, type V2MarkdownNote } from '../../services/v2BackendClient.ts';
import { runtimeService } from '../../runtime/adapter.ts';
import {
  srd51ReferenceClient,
  formatSRD51EntityDetails,
  type SRD51EntityRecord,
  type SRD51SourceMetadata,
} from '../../services/srd51Reference.ts';

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
  combatState?: CombatTurnState;
  selectedCharacterId?: string;
  campaignName?: string;
  locations?: any[];
  activeLocationId?: string;
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
  combatState,
  selectedCharacterId = 'char-kaelen',
  campaignName,
  locations,
  activeLocationId,
  onSelectOperatingMode,
  onSelectDirectorProfile,
  onNavigateToBattlemap,
}) => {
  // Scene mode
  const [sceneMode, setSceneMode] = useState<SceneMode>('roleplay');

  // Panel state
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'party' | 'npcs' | 'quests' | 'notes'>('party');
  const [rightTab, setRightTab] = useState<'director' | 'rules' | 'timeline'>('director');

  // Modals
  const [sheetChar, setSheetChar] = useState<CharacterSheet | null>(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [inspectingRec, setInspectingRec] = useState<DirectorRecommendation | null>(null);

  // Input & dialogue
  const [actionInput, setActionInput] = useState('');
  const [selectedNpcId, setSelectedNpcId] = useState<string>('npc-jorren-vale');
  const [actionStatus, setActionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [actionError, setActionError] = useState<string | null>(null);

  // Integrated Notes Workspace State
  const [notesList, setNotesList] = useState<V2MarkdownNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<V2MarkdownNote | null>(null);
  const [noteEditTitle, setNoteEditTitle] = useState('');
  const [noteEditBody, setNoteEditBody] = useState('');
  const [noteEditVisibility, setNoteEditVisibility] = useState<'private_player' | 'party_shared' | 'shared_with_dm' | 'dm_private'>('private_player');
  const [noteSaveStatus, setNoteSaveStatus] = useState<string | null>(null);

  // Rules reference (Live Python SRD 5.1 Read-Only API + separate Campaign House Rules overlay)
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

  // Separate Campaign House Rules overlay (never mixed into SRD SQLite records)
  const houseRulesList = runtimeService
    .queryRules(rulesQuery, rulesCategory === 'Monsters' || rulesCategory === 'Equipment' ? 'All' : rulesCategory)
    .filter((r) => r.source === 'House Rule');


  // Load notes for active character and campaign
  useEffect(() => {
    let active = true;
    const aud = {
      actor_id: selectedCharacterId || 'char-lyra-01',
      role: (userRole === 'dm' || userRole === 'dm_host') ? ('dm' as const) : ('player' as const),
      campaign_id: currentSnapshot?.campaignId || 'aethelgard-vault-001',
      save_id: 'save-main',
    };
    v2BackendClient.listNotes(aud).then((res) => {
      if (!active) return;
      setNotesList(res);
      if (res.length > 0 && !selectedNote) {
        setSelectedNote(res[0]);
        setNoteEditTitle(res[0].title);
        setNoteEditBody(res[0].markdown_body);
        setNoteEditVisibility(res[0].visibility);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [selectedCharacterId, userRole, currentSnapshot?.campaignId]);
  const activeChar = characters.find((c) => c.id === selectedCharacterId) || characters[0];
  const selectedNpc = npcs.find((n) => n.id === selectedNpcId) || npcs[0];

  const feedEndRef = useRef<HTMLDivElement>(null);

  // Derive chronological story events from authoritative events prop
  const chronologicalEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return [...events].sort((a, b) => {
      if (a.commitSequence !== b.commitSequence) {
        return a.commitSequence - b.commitSequence;
      }
      return new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime();
    });
  }, [events]);

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chronologicalEvents.length]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim() || actionStatus === 'submitting') return;

    setActionStatus('submitting');
    setActionError(null);
    try {
      await runtimeService.submitActionEnvelope({
        actionId: `quick-act-${Date.now()}`,
        actorId: activeChar?.id || 'char-lyra-01',
        actorRole: userRole,
        actionType: 'FREEFORM_ROLEPLAY',
        payload: {
          message: actionInput.trim(),
          targetNpcId: selectedNpc ? selectedNpc.id : undefined,
          targetNpcName: selectedNpc ? selectedNpc.name : undefined,
          invokeHarness: true,
        },
        snapshotRef: { ...currentSnapshot },
        timestampUtc: new Date().toISOString(),
        clientNonce: `nonce-${Math.random().toString(36).substring(2, 7)}`,
      });
      setActionInput('');
      setActionStatus('success');
      setTimeout(() => setActionStatus('idle'), 2500);
    } catch (err: any) {
      setActionStatus('error');
      setActionError(err?.message || 'Failed to submit action.');
    }
  };

  const handleSaveNoteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteSaveStatus('Saving note...');
    try {
      const aud = {
        actor_id: selectedCharacterId || 'char-lyra-01',
        role: (userRole === 'dm' || userRole === 'dm_host') ? ('dm' as const) : ('player' as const),
        campaign_id: currentSnapshot?.campaignId || 'aethelgard-vault-001',
        save_id: 'save-main',
      };
      await v2BackendClient.saveNote(aud, {
        note_id: selectedNote?.note_id || `note-${Date.now()}`,
        title: noteEditTitle || 'Untitled Note',
        markdown_body: noteEditBody,
        visibility: noteEditVisibility,
        tags: ['journal'],
      });
      const refreshed = await v2BackendClient.listNotes(aud);
      setNotesList(refreshed);
      setNoteSaveStatus('Saved!');
      setTimeout(() => setNoteSaveStatus(null), 2000);
    } catch (err: any) {
      setNoteSaveStatus(`Error: ${err?.message || 'Failed to save note'}`);
    }
  };

  // Dynamic scene context derivation
  const activeLoc = locations?.find((l) => l.id === activeLocationId) || locations?.[0];
  const dynamicSceneTitle = activeLoc ? activeLoc.name : (campaignName || 'Active Scene');
  const dynamicDistrict = (activeLoc as any)?.district || (activeLoc as any)?.region || campaignName || 'Highgate Quarter';
  const dynamicSummary = activeLoc?.publicSummary || (activeLoc as any)?.description || 'The scene awaits your command.';

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
                  {campaignName ? `${campaignName} · ` : ''}{dynamicSceneTitle}
                </h2>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-950 text-amber-400 border border-amber-800/40">
                  {dynamicDistrict}
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden md:block" />

          {/* Active Character Quick Sheet Access */}
          {activeChar && (
            <button
              onClick={() => setSheetChar(activeChar)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-amber-200 border border-neutral-800 hover:border-amber-600/50 text-xs font-mono transition-colors"
              title={`Open Character Sheet for ${activeChar.name}`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{activeChar.name}</span>
              <span className="text-[10px] text-neutral-400">Sheet</span>
            </button>
          )}

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

        {/* Action: Encounter Controls & Open Battlemap */}
        <div className="flex items-center gap-2">
          {!combatState?.isActive ? (
            <button
              onClick={() => {
                setSceneMode('combat');
                void runtimeService.submitAction({
                  actionId: `act-enc-start-${Date.now()}`,
                  clientNonce: `nonce-enc-start-${Date.now()}`,
                  actorId: userRole === 'dm_host' ? 'dm-1' : selectedCharacterId || 'char-lyra-01',
                  actorRole: userRole,
                  actionType: 'START_ENCOUNTER' as DemoActionType,
                  snapshotRef: runtimeService.getCurrentSnapshot(),
                  payload: {},
                  timestampUtc: new Date().toISOString(),
                });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 font-semibold text-xs transition-colors"
              title="Roll Authoritative Initiative & Start Encounter"
            >
              <Sword className="w-3.5 h-3.5 text-red-400" />
              <span>Roll Initiative</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-800/70 rounded px-2 py-1 text-xs">
              <span className="font-mono font-bold text-red-300">
                Round {combatState.round}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-amber-200 font-semibold">
                Turn: {combatState.combatants[combatState.activeTurnIndex]?.name || 'Active'}
              </span>
              <button
                onClick={() =>
                  void runtimeService.submitAction({
                    actionId: `act-enc-next-${Date.now()}`,
                    clientNonce: `nonce-enc-next-${Date.now()}`,
                    actorId: userRole === 'dm_host' ? 'dm-1' : selectedCharacterId || 'char-lyra-01',
                    actorRole: userRole,
                    actionType: 'NEXT_TURN' as DemoActionType,
                    snapshotRef: runtimeService.getCurrentSnapshot(),
                    payload: {},
                    timestampUtc: new Date().toISOString(),
                  })
                }
                className="ml-1 px-2 py-0.5 rounded bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold text-[11px]"
              >
                Next Turn
              </button>
              <button
                onClick={() =>
                  void runtimeService.submitAction({
                    actionId: `act-enc-end-${Date.now()}`,
                    clientNonce: `nonce-enc-end-${Date.now()}`,
                    actorId: userRole === 'dm_host' ? 'dm-1' : selectedCharacterId || 'char-lyra-01',
                    actorRole: userRole,
                    actionType: 'END_ENCOUNTER' as DemoActionType,
                    snapshotRef: runtimeService.getCurrentSnapshot(),
                    payload: {},
                    timestampUtc: new Date().toISOString(),
                  })
                }
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px]"
              >
                End
              </button>
            </div>
          )}

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

      {/* Active Initiative Turn Order Ribbon */}
      {combatState?.isActive && combatState.combatants.length > 0 && (
        <div className="px-4 py-1.5 bg-red-950/30 border-b border-red-900/50 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold shrink-0">
            Initiative Order:
          </span>
          {combatState.combatants.map((c, idx) => {
            const isCurrent = idx === combatState.activeTurnIndex;
            return (
              <div
                key={c.entityId}
                className={`px-2 py-0.5 rounded flex items-center gap-1.5 shrink-0 border ${
                  isCurrent
                    ? 'bg-amber-950/90 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
                }`}
              >
                <span className="font-mono text-[10px] text-amber-400">{c.initiative}</span>
                <span>{c.name}</span>
              </div>
            );
          })}
        </div>
      )}

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
              <button
                onClick={() => setLeftTab('notes')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                  leftTab === 'notes'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
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

              {leftTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                      Journal & Notes ({notesList.length})
                    </span>
                    <button
                      onClick={() => {
                        setSelectedNote(null);
                        setNoteEditTitle('New Field Note');
                        setNoteEditBody('Observations and [[Wikilinks]]...');
                        setNoteEditVisibility('private_player');
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[10px] font-mono transition-colors"
                    >
                      + New
                    </button>
                  </div>

                  {/* Notes Selection List */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {notesList.map((n) => (
                      <div
                        key={n.note_id}
                        onClick={() => {
                          setSelectedNote(n);
                          setNoteEditTitle(n.title);
                          setNoteEditBody(n.markdown_body);
                          setNoteEditVisibility(n.visibility);
                        }}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          selectedNote?.note_id === n.note_id
                            ? 'bg-amber-950/40 border-amber-600/70 text-amber-100'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate text-[11px]">{n.title}</span>
                          <span className="text-[9px] font-mono uppercase px-1 rounded bg-neutral-900 text-neutral-400">
                            {n.visibility.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note Editor */}
                  <form onSubmit={handleSaveNoteAction} className="pt-2 border-t border-neutral-800 space-y-2">
                    <input
                      type="text"
                      value={noteEditTitle}
                      onChange={(e) => setNoteEditTitle(e.target.value)}
                      placeholder="Note Title"
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 font-semibold focus:border-amber-600 outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500 font-mono">Scope:</span>
                      <select
                        value={noteEditVisibility}
                        onChange={(e) => setNoteEditVisibility(e.target.value as any)}
                        className="flex-1 px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 focus:border-amber-600 outline-none"
                      >
                        <option value="private_player">Private (Player Only)</option>
                        <option value="party_shared">Party Shared</option>
                        <option value="shared_with_dm">Shared With DM</option>
                        {(userRole === 'dm' || userRole === 'dm_host') && (
                          <option value="dm_private">DM Secret Note</option>
                        )}
                      </select>
                    </div>

                    <textarea
                      rows={5}
                      value={noteEditBody}
                      onChange={(e) => setNoteEditBody(e.target.value)}
                      placeholder="Markdown notes with [[Wikilinks]]..."
                      className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:border-amber-600 outline-none resize-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      {noteSaveStatus && (
                        <span className="text-[10px] font-mono text-amber-400">{noteSaveStatus}</span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>
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
                <span className="font-bold">Exploration Mode: {dynamicSceneTitle}</span>
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
                <span className="font-bold">Downtime & Rest: {dynamicDistrict}</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Short rest (1 hour) or Long rest (8 hours) rolls available
              </span>
            </div>
          )}

          {/* Authoritative Interactive Combat Tracker */}
          {(sceneMode === 'combat' || combatState?.isActive) && (
            <div className="shrink-0">
              <CombatTracker
                combatState={
                  combatState || {
                    isActive: true,
                    round: 1,
                    activeTurnIndex: 0,
                    combatants: characters.map((c, i) => ({
                      entityId: c.id,
                      name: c.name,
                      entityType: 'character',
                      roll: 15,
                      initiativeBonus: c.initiativeBonus || 0,
                      initiative: 15 + (c.initiativeBonus || 0),
                      isVisibleToPlayers: true,
                    })),
                  }
                }
                characters={characters}
                npcs={npcs}
                userRole={userRole}
                activeCharacterId={selectedCharacterId}
                currentSnapshot={currentSnapshot}
                onOpenCharacterSheet={(c) => setSheetChar(c)}
                onSubmitAction={async (envelope) => {
                  return runtimeService.submitActionEnvelope(envelope);
                }}
              />
            </div>
          )}

          {/* Narrative Story Stream - Authoritative Live Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chronologicalEvents.length === 0 ? (
              <div className="p-4 rounded-lg bg-neutral-900/80 border border-amber-900/30 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-[11px] pb-1 border-b border-neutral-800">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Scene Setting · {dynamicSceneTitle}</span>
                  <span className="text-neutral-500 ml-auto font-normal font-sans text-[10px]">Session Ready</span>
                </div>
                <p className="text-neutral-300">
                  {dynamicSummary}
                </p>
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400">
                  Enter dialogue or an action below to converse with Scholar Vale or inspect the surroundings. All player inputs, AI Co-DM narration, and rule adjudications appear here in chronological order.
                </div>
              </div>
            ) : (
              chronologicalEvents.map((evt) => {
                const hasStructuredDialogue = evt.playerMessage || evt.npcReply || evt.narration;
                if (hasStructuredDialogue) {
                  return (
                    <div key={evt.eventId} className="space-y-2">
                      {evt.playerMessage && (
                        <div className="p-3.5 rounded-lg border text-xs leading-relaxed bg-neutral-900/70 border-neutral-800 text-neutral-200">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/60 text-[10px] font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-300">{evt.actorName || 'Player'}</span>
                              <span className="text-neutral-400">(Player Action)</span>
                            </div>
                            <span className="text-neutral-500">
                              {evt.timestampUtc ? new Date(evt.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Seq ${evt.commitSequence}`}
                            </span>
                          </div>
                          <p className="text-neutral-100 font-medium">{evt.playerMessage}</p>
                        </div>
                      )}

                      {evt.npcReply && (
                        <div className="p-3.5 rounded-lg border text-xs leading-relaxed bg-amber-950/25 border-amber-700/50 text-amber-100 ml-3">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-800/40 text-[10px] font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{evt.targetNpcName || 'Scholar Jorren Vale'}</span>
                              <span className="text-amber-500/80">(NPC Dialogue)</span>
                            </div>
                            <span className="text-neutral-500">
                              {evt.timestampUtc ? new Date(evt.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Seq ${evt.commitSequence}`}
                            </span>
                          </div>
                          <p className="text-amber-100">{evt.npcReply}</p>
                        </div>
                      )}

                      {evt.narration && (
                        <div className="p-3.5 rounded-lg border text-xs leading-relaxed bg-neutral-900/90 border-amber-900/40 text-neutral-200 italic ml-2">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/60 text-[10px] font-mono not-italic">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-300">Dungeon Master</span>
                              <span className="text-neutral-400">(Narration)</span>
                            </div>
                            <span className="text-neutral-500">
                              {evt.timestampUtc ? new Date(evt.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Seq ${evt.commitSequence}`}
                            </span>
                          </div>
                          <p className="text-neutral-200">{evt.narration}</p>
                        </div>
                      )}
                    </div>
                  );
                }

                const isCombat = evt.category === 'COMBAT';
                const isRules = evt.category === 'RULES_QUERY';
                const isWorld = evt.category === 'WORLD';
                const isDialogue = evt.category === 'DIALOGUE';

                return (
                  <div
                    key={evt.eventId}
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      isCombat
                        ? 'bg-red-950/20 border-red-900/40 text-red-100'
                        : isRules
                        ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200 font-mono text-[11px]'
                        : isWorld
                        ? 'bg-neutral-900/90 border-amber-900/30 text-neutral-200'
                        : isDialogue
                        ? 'bg-amber-950/20 border-amber-700/40 text-amber-100'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/60 text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300">{evt.actorName || 'System'}</span>
                        <span className="text-neutral-400">({evt.category})</span>
                        {evt.isDmOnly && (
                          <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[9px]">
                            DM Only
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500">
                        {evt.timestampUtc ? new Date(evt.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Seq ${evt.commitSequence}`}
                      </span>
                    </div>

                    <p className="text-neutral-200">{evt.summary}</p>

                    {evt.diceRoll && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[10px] text-cyan-300">
                        <Dice5 className="w-3 h-3 text-cyan-400" />
                        <span>{evt.diceRoll.reason || 'Roll'}: {evt.diceRoll.formula} = {evt.diceRoll.total}</span>
                        {evt.diceRoll.isCritical && <span className="text-emerald-400 font-bold ml-1">CRIT!</span>}
                        {evt.diceRoll.isFumble && <span className="text-red-400 font-bold ml-1">FUMBLE!</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
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
          <div className="bg-neutral-900 border-t border-neutral-800 shrink-0">
            {actionError && (
              <div className="px-3 py-1.5 bg-red-950/80 border-b border-red-800 text-red-200 text-xs flex items-center justify-between">
                <span>{actionError}</span>
                <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">×</button>
              </div>
            )}
            <form onSubmit={handleQuickSubmit} className="p-3 flex gap-2">
              <input
                type="text"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder={`What does ${activeChar?.name || 'Lyra'} do? (e.g. "I ask Scholar Jorren Vale about the seal on the harbor gate")`}
                disabled={actionStatus === 'submitting'}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={actionStatus === 'submitting'}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded-md text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {actionStatus === 'submitting' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-amber-300 rounded-full animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : actionStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Act</span>
                  </>
                )}
              </button>
            </form>
          </div>
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
                  {/* Source Provenance & Connection Banner */}
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 space-y-1 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Database className="w-3 h-3 text-amber-400" />
                        <span>SRD 5.1 Read-Only SQLite</span>
                      </span>
                      {srdStatus ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px]">
                          {srdStatus.total_entities} Entities • RO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px]">
                          API Offline
                        </span>
                      )}
                    </div>
                    {srdStatus && (
                      <div className="text-[9px] text-neutral-500 flex items-center justify-between">
                        <span>{srdStatus.source.license_id}</span>
                        <span>SHA: {srdStatus.sqlite_sha256.slice(0, 12)}…</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search SRD 5.1 (e.g. fireball, aboleth, grappled, cover)..."
                      value={rulesQuery}
                      onChange={(e) => setRulesQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-[11px] text-neutral-200 placeholder-neutral-500"
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

                  {/* Error / Loading / Empty States */}
                  {srdError && (
                    <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-red-200 text-[10px] font-mono space-y-1">
                      <div className="font-bold text-red-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>SRD 5.1 Reference API Unavailable</span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed">{srdError}</p>
                    </div>
                  )}

                  {srdLoading && (
                    <div className="text-[10px] font-mono text-neutral-400 py-2 text-center">
                      Querying read-only SRD 5.1 SQLite…
                    </div>
                  )}

                  {/* SRD 5.1 Entities List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {!srdLoading && !srdError && srdItems.length === 0 && (
                      <div className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-500 text-center font-mono">
                        No SRD 5.1 records matched "{rulesQuery}" in {rulesCategory}.
                      </div>
                    )}

                    {srdItems.map((item) => (
                      <div
                        key={item.entity_key}
                        onClick={() => {
                          setSelectedSrdEntity(item);
                          setSelectedRule(null);
                        }}
                        className={`p-2 bg-neutral-950 rounded border cursor-pointer space-y-1 transition-colors ${
                          selectedSrdEntity?.entity_key === item.entity_key
                            ? 'border-amber-600/80 bg-amber-950/20'
                            : 'border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-neutral-200 text-xs truncate">{item.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 text-cyan-300 border border-neutral-800">
                              {item.entity_type}
                            </span>
                            <span className="text-[9px] font-mono text-amber-400">{item.ruleset}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2">{item.summary}</p>
                      </div>
                    ))}

                    {/* Separate Campaign House Rules Overlay */}
                    {houseRulesList.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-amber-400/80 block">
                          Campaign House Rules Overlay (Precedence Level 2)
                        </span>
                        {houseRulesList.map((rule) => (
                          <div
                            key={rule.ruleId}
                            onClick={() => {
                              setSelectedRule(rule);
                              setSelectedSrdEntity(null);
                            }}
                            className={`p-2 bg-neutral-950 rounded border cursor-pointer space-y-1 ${
                              selectedRule?.ruleId === rule.ruleId
                                ? 'border-amber-500 bg-amber-950/30'
                                : 'border-amber-900/40 hover:border-amber-700/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-200 text-xs">{rule.title}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                {rule.source}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-2">{rule.citationText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected SRD 5.1 Entity Detail Inspector */}
                  {selectedSrdEntity && (() => {
                    const formatted = formatSRD51EntityDetails(selectedSrdEntity);
                    return (
                      <div className="p-3 rounded bg-neutral-950 border border-amber-700/60 text-neutral-200 space-y-2 max-h-80 overflow-y-auto">
                        <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2">
                          <div>
                            <h4 className="font-bold text-amber-200 text-xs font-cinzel">{selectedSrdEntity.name}</h4>
                            <p className="text-[10px] font-mono text-cyan-300">{formatted.subtitle}</p>
                          </div>
                          <button
                            onClick={() => setSelectedSrdEntity(null)}
                            className="text-neutral-500 hover:text-neutral-200"
                            title="Close detail view"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {formatted.statsSummary.length > 0 && (
                          <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800 space-y-0.5 text-[10px] font-mono text-neutral-300">
                            {formatted.statsSummary.map((line, idx) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </div>
                        )}

                        <div className="text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                          {formatted.bodyText}
                        </div>

                        <div className="pt-2 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono text-neutral-500">
                          <span>Key: {selectedSrdEntity.entity_key}</span>
                          <span>Table: {selectedSrdEntity.source_table}</span>
                          <span className="px-1 rounded bg-neutral-900 text-amber-400/90 border border-neutral-800">
                            Status: {selectedSrdEntity.verification_status} (Reference Only)
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Selected House Rule Detail Inspector */}
                  {selectedRule && (
                    <div className="p-3 rounded bg-neutral-950 border border-amber-700/60 text-neutral-200 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                        <span className="font-bold text-amber-200 text-xs">{selectedRule.title}</span>
                        <span className="text-[9px] font-mono text-amber-400">{selectedRule.source}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">{selectedRule.citationText}</p>
                    </div>
                  )}
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
