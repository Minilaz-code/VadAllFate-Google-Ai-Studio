import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Sliders,
  Shield,
  Lock,
  Play,
  Pause,
  ArrowRight,
  Info,
  Network,
  FileCheck2,
  Eye,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { Faction, WorldLocation, Quest, MasterWorldClock } from '../../types/world.ts';
import type { DirectorProfile, DirectorRecommendation } from '../../types/director.ts';
import {
  v2BackendClient,
  type V2GraphProjectionResponse,
  type V2PlanRevision,
} from '../../services/v2BackendClient.ts';

interface DmPlanningViewProps {
  npcs: NonPlayerCharacter[];
  factions: Faction[];
  locations: WorldLocation[];
  quests: Quest[];
  worldClock: MasterWorldClock;
  directorProfiles: DirectorProfile[];
  activeDirectorProfileId: string;
  recommendations: DirectorRecommendation[];
  onSelectDirectorProfile: (profileId: string) => void;
  onAdvanceTime: (mins: number) => void;
  onTogglePauseClock: () => void;
}

export const DmPlanningView: React.FC<DmPlanningViewProps> = ({
  npcs = [],
  factions = [],
  locations = [],
  quests = [],
  worldClock,
  directorProfiles = [],
  activeDirectorProfileId,
  recommendations = [],
  onSelectDirectorProfile,
  onAdvanceTime,
  onTogglePauseClock,
}) => {
  const [planningSection, setPlanningSection] = useState<
    'locations' | 'npcs' | 'factions' | 'clock' | 'director' | 'graph' | 'plans'
  >('locations');

  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [selectedNpcId, setSelectedNpcId] = useState(npcs[0]?.id || '');
  const [selectedFactionId, setSelectedFactionId] = useState(factions[0]?.id || '');

  // V2 Knowledge Graph & Plan Lifecycle state (KGP-03)
  const [graphData, setGraphData] = useState<V2GraphProjectionResponse | null>(null);
  const [graphSearch, setGraphSearch] = useState('');
  const [previewPlayerGraph, setPreviewPlayerGraph] = useState(false);

  const [plans, setPlans] = useState<V2PlanRevision[]>([]);
  const [planTitle, setPlanTitle] = useState('Cathedral Bell Ambush Beat');
  const [planKind, setPlanKind] = useState('encounter_beat');
  const [planMarkdown, setPlanMarkdown] = useState(
    'When [[Jorren Vale]] tolls the bell at [[Primara Cathedral]], the hidden sentinel strikes.'
  );
  const [planStatusBanner, setPlanStatusBanner] = useState<string | null>(null);

  const dmAudience = {
    actor_id: 'dm-1',
    role: 'dm' as const,
    campaign_id: 'aethelgard-vault-001',
    save_id: 'save-main',
    is_host: true,
    preview_as_player_id: previewPlayerGraph ? 'char-lyra-01' : null,
  };

  useEffect(() => {
    let cancelled = false;
    v2BackendClient.queryGraph(dmAudience, graphSearch).then((res) => {
      if (!cancelled) setGraphData(res);
    });
    v2BackendClient
      .listPlans({ actor_id: 'dm-1', role: 'dm', campaign_id: 'aethelgard-vault-001' })
      .then((loaded) => {
        if (!cancelled) setPlans(loaded);
      });
    return () => {
      cancelled = true;
    };
  }, [previewPlayerGraph, graphSearch]);

  const handleProposePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await v2BackendClient.proposePlan(
      { actor_id: 'dm-1', role: 'dm', campaign_id: 'aethelgard-vault-001' },
      {
        title: planTitle,
        plan_kind: planKind,
        source_markdown: planMarkdown,
        structured_payload: { trigger: planTitle, dc: 14 },
        status: 'proposed',
      }
    );
    const updatedPlans = await v2BackendClient.listPlans({
      actor_id: 'dm-1',
      role: 'dm',
      campaign_id: 'aethelgard-vault-001',
    });
    setPlans(updatedPlans);
    setPlanStatusBanner(
      `Proposed Plan "${created.title}" (r${created.revision}, pinned hash: ${created.source_markdown_hash.slice(0, 12)}...)`
    );
  };

  const handleConfirmPlan = async (plan: V2PlanRevision) => {
    const confirmed = await v2BackendClient.transitionPlan(
      { actor_id: 'dm-1', role: 'dm', campaign_id: 'aethelgard-vault-001' },
      plan.plan_id,
      'confirmed',
      plan.revision
    );
    const updatedPlans = await v2BackendClient.listPlans({
      actor_id: 'dm-1',
      role: 'dm',
      campaign_id: 'aethelgard-vault-001',
    });
    setPlans(updatedPlans);
    setPlanStatusBanner(
      `Confirmed Plan "${confirmed.title}" (r${confirmed.revision}, commit: ${confirmed.confirmed_commit_id})`
    );
  };

  const activeLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const activeNpc = npcs.find((n) => n.id === selectedNpcId) || npcs[0];
  const activeFaction = factions.find((f) => f.id === selectedFactionId) || factions[0];
  const activeProfile =
    directorProfiles.find((p) => p.id === activeDirectorProfileId) || directorProfiles[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden text-neutral-200 text-xs">
      {/* DM Planning Navigation Bar */}
      <div className="px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-950 border border-amber-700/50 text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-cinzel text-amber-100">DM Confidential Workspace</h2>
            <p className="text-[10px] text-neutral-400">World Simulation, NPC Psychology, Travel Graphs, & Director</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800">
          {[
            { id: 'locations', label: 'World Locations & Routes', icon: MapPin },
            { id: 'npcs', label: 'NPC Cognition Dossiers', icon: Users },
            { id: 'factions', label: 'Factions & Reputation', icon: Shield },
            { id: 'clock', label: 'Master Clock & Calendar', icon: Calendar },
            { id: 'director', label: 'Storyteller Director Config', icon: Sliders },
            { id: 'graph', label: 'Knowledge Explorer', icon: Network },
            { id: 'plans', label: `Plan Lifecycle (${plans.length})`, icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setPlanningSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  planningSection === tab.id
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

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* SECTION 1: WORLD LOCATIONS & ROUTES */}
        {planningSection === 'locations' && (
          locations.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <Info className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Locations Recorded</h3>
              <p className="text-neutral-500 text-xs">No campaign travel nodes are currently defined in the world graph.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Location Node List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold font-cinzel text-neutral-100 text-sm">Campaign Travel Nodes</h3>
                  <span className="text-[10px] font-mono text-neutral-500">{locations.length} Locations</span>
                </div>
                <div className="space-y-2">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        loc.id === activeLoc?.id
                          ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-neutral-100">{loc.name}</h4>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            loc.travelHazardLevel === 'Deadly'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : loc.travelHazardLevel === 'Moderate'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {loc.travelHazardLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 capitalize">{loc.region} • {loc.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Detail & Travel Routes */}
              {activeLoc && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-cinzel text-amber-100">{activeLoc.name}</h3>
                        <p className="text-neutral-400 text-xs capitalize">{activeLoc.region} Region • {activeLoc.type}</p>
                      </div>
                      <div className="font-mono text-xs text-neutral-400">
                        Map Coords: ({activeLoc.coordinates.x}, {activeLoc.coordinates.y})
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">Public Description</h4>
                      <p className="text-neutral-300 text-xs leading-relaxed bg-neutral-950/60 p-3 rounded border border-neutral-800">
                        {activeLoc.publicDescription}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-amber-400 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>DM Confidential Tactical Notes</span>
                      </h4>
                      <div className="p-3 bg-amber-950/20 rounded border border-amber-800/50 text-amber-200 text-xs font-mono">
                        {activeLoc.dmNotes || 'No secret DM notes for this location.'}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">Connected Travel Routes</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeLoc.connectedRouteIds.map((rid) => {
                          const target = locations.find((l) => l.id === rid);
                          return (
                            <div
                              key={rid}
                              className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-medium text-neutral-200">{target?.name || rid}</span>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-400">
                                {target?.travelTimeHoursFromParty || 2}h
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* SECTION 2: NPC COGNITION DOSSIERS */}
        {planningSection === 'npcs' && (
          npcs.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <Info className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No NPCs Recorded</h3>
              <p className="text-neutral-500 text-xs">No campaign NPCs are currently registered in this dossier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* NPC List */}
              <div className="space-y-3">
                <h3 className="font-bold font-cinzel text-neutral-100 text-sm">Campaign Dramatis Personae</h3>
                <div className="space-y-2">
                  {npcs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNpcId(n.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        n.id === activeNpc?.id
                          ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-neutral-100">{n.name}</h4>
                        <span className="text-[10px] font-mono text-neutral-400">{n.occupation}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{n.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* NPC Cognitive Mind Map */}
              {activeNpc && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-cinzel text-amber-100">{activeNpc.name}</h3>
                        <p className="text-neutral-400 text-xs">
                          {activeNpc.race} • {activeNpc.occupation} • {activeNpc.title}
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-1 rounded border border-amber-800">
                        Non-Omniscient Bounded Cognition
                      </div>
                    </div>

                    {/* 4-way Knowledge Boundary with Null Guards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-neutral-950 rounded border border-emerald-800/40">
                        <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                          1. Verified Facts Known
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                          {(activeNpc.knowledgeBoundary?.verifiedFacts || ['No verified facts listed.']).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded border border-amber-800/40">
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-400 block mb-1">
                          2. False Beliefs / Rumors
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                          {(activeNpc.knowledgeBoundary?.falseBeliefs || ['No false beliefs recorded.']).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded border border-cyan-800/40">
                        <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                          3. Suspicions & Deductions
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                          {(activeNpc.knowledgeBoundary?.suspicions || ['No active suspicions recorded.']).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded border border-red-800/40">
                        <span className="font-mono text-[10px] uppercase font-bold text-red-400 block mb-1">
                          4. Guarded DM Secrets
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px]">
                          {(activeNpc.knowledgeBoundary?.guardedSecrets || ['No guarded secrets held.']).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Relationships */}
                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">
                        Relationship Web & Attitude
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activeNpc.relationships || []).length === 0 ? (
                          <div className="p-3 rounded bg-neutral-950 text-neutral-500 italic text-[11px] col-span-2">
                            No relationships mapped yet.
                          </div>
                        ) : (
                          activeNpc.relationships.map((rel) => (
                            <div
                              key={rel.targetEntityId}
                              className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-neutral-200">{rel.targetName}</span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                    rel.trustScore > 0 ? 'text-emerald-400' : 'text-red-400'
                                  }`}
                                >
                                  Trust: {rel.trustScore}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400">{rel.notes}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* SECTION 3: FACTIONS & REPUTATION */}
        {planningSection === 'factions' && (
          factions.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <Info className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Factions Recorded</h3>
              <p className="text-neutral-500 text-xs">No political or syndicate factions are currently registered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Faction List */}
              <div className="space-y-3">
                <h3 className="font-bold font-cinzel text-neutral-100 text-sm">Realm Factions</h3>
                <div className="space-y-2">
                  {factions.map((fac) => (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFactionId(fac.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        fac.id === activeFaction?.id
                          ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-neutral-100">{fac.name}</h4>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            fac.reputationWithParty > 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          Rep: {fac.reputationWithParty}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 italic">“{fac.motto}”</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faction Dossier */}
              {activeFaction && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-cinzel text-amber-100">{activeFaction.name}</h3>
                        <p className="text-neutral-400 text-xs italic">“{activeFaction.motto}”</p>
                      </div>
                      <div className="font-mono text-xs">
                        Standing: <span className="text-emerald-400 font-bold">{activeFaction.allegianceStatus}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">Headquarters</span>
                        <div className="font-semibold text-neutral-200 mt-1">{activeFaction.headquarters}</div>
                      </div>
                      <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">Influence Tier</span>
                        <div className="font-semibold text-neutral-200 mt-1 capitalize">{activeFaction.influenceLevel}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">
                        Faction Goals & Agenda
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-neutral-300 bg-neutral-950/70 p-3 rounded border border-neutral-800">
                        {(activeFaction.primaryGoals || []).map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-amber-400 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>DM Confidential Scheme</span>
                      </h4>
                      <div className="p-3 bg-amber-950/20 rounded border border-amber-800/50 text-amber-200 text-[11px] font-mono">
                        {activeFaction.dmSecrets || 'No confidential schemes registered.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* SECTION 4: MASTER WORLD CLOCK & CALENDAR */}
        {planningSection === 'clock' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-base font-bold font-cinzel text-amber-100">
                    Master World Clock & Atmospheric Engine
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Minute-resolution authoritative timeline. Deterministic time advancement.
                  </p>
                </div>
                <button
                  onClick={onTogglePauseClock}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold ${
                    worldClock?.isPaused
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {worldClock?.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{worldClock?.isPaused ? 'Resume Clock' : 'Pause Clock'}</span>
                </button>
              </div>

              {/* Clock Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Time of Day</span>
                  <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    {worldClock?.calendar?.timeString || '00:00'}
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">{worldClock?.calendar?.timeOfDay || 'Midnight'}</span>
                </div>

                <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Eldervale Calendar</span>
                  <div className="text-base font-bold text-neutral-200 mt-1">
                    {worldClock?.calendar?.monthName || 'Hammer'} {worldClock?.calendar?.dayOfMonth || 1}
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">Year {worldClock?.calendar?.year || 1492}</span>
                </div>

                <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Lunar Cycle</span>
                  <div className="text-base font-bold text-cyan-300 mt-1">{worldClock?.moonPhase || 'New Moon'}</div>
                  <span className="text-xs text-neutral-400">28-day cycle</span>
                </div>

                <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Atmosphere</span>
                  <div className="text-base font-bold text-amber-200 mt-1">{worldClock?.weather?.condition || 'Clear'}</div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {worldClock?.weather?.temperatureC || 18}°C • {worldClock?.weather?.windSpeedMph || 5} mph
                  </span>
                </div>
              </div>

              {/* Quick Time Advancement Controls */}
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold font-cinzel text-neutral-200">Advance World Clock (Authoritative)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() => onAdvanceTime(10)}
                    className="py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-center transition-colors"
                  >
                    +10 Minutes
                  </button>
                  <button
                    onClick={() => onAdvanceTime(60)}
                    className="py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-center transition-colors"
                  >
                    +1 Hour (Short)
                  </button>
                  <button
                    onClick={() => onAdvanceTime(480)}
                    className="py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-center transition-colors"
                  >
                    +8 Hours (Long Rest)
                  </button>
                  <button
                    onClick={() => onAdvanceTime(1440)}
                    className="py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-center transition-colors"
                  >
                    +24 Hours (Next Day)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: STORYTELLER DIRECTOR CONFIG */}
        {planningSection === 'director' && (
          directorProfiles.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <Info className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Director Profiles Active</h3>
              <p className="text-neutral-500 text-xs">No Storyteller Director configurations are defined for this campaign.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800 space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <h3 className="text-base font-bold font-cinzel text-amber-100">
                    DM Director & Storyteller Profiles
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Configures narrative pacing, encounter ratios, spotlight balancing, and consequence lethality.
                  </p>
                </div>

                {/* Profile Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {directorProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => onSelectDirectorProfile(prof.id)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        prof.id === activeProfile?.id
                          ? 'bg-amber-950/50 border-amber-600/80 shadow-md'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-bold text-neutral-100 text-sm mb-1">{prof.name}</div>
                      <p className="text-[11px] text-neutral-400 leading-snug">{prof.description}</p>
                      <div className="mt-3 text-[10px] font-mono text-amber-300">
                        Tension Target: {prof.tensionTarget}/100
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Metrics of Active Profile */}
                {activeProfile && (
                  <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-4">
                    <h4 className="font-mono text-xs uppercase text-amber-300 font-bold">
                      Active Profile Parameters: {activeProfile.name}
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Combat vs Exploration Ratio</span>
                          <span className="font-mono text-amber-300">
                            {activeProfile.combatExplorationRatio}% Combat / {100 - activeProfile.combatExplorationRatio}% Exploration
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-600" style={{ width: `${activeProfile.combatExplorationRatio}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Mystery & Discovery Enigma Focus</span>
                          <span className="font-mono text-cyan-300">{activeProfile.mysteryDiscoveryRatio}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-600" style={{ width: `${activeProfile.mysteryDiscoveryRatio}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Social Interaction & NPC Friction</span>
                          <span className="font-mono text-emerald-300">{activeProfile.socialInteractionFocus}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{ width: `${activeProfile.socialInteractionFocus}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">Pacing Level</span>
                        <div className="font-bold text-neutral-200 capitalize mt-0.5">
                          {activeProfile.pacingLevel?.replace('_', ' ') || 'Moderate'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">Sandbox Freedom</span>
                        <div className="font-bold text-neutral-200 capitalize mt-0.5">
                          {activeProfile.sandboxFreedom?.replace('_', ' ') || 'Standard'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">Lethality Risk</span>
                        <div className="font-bold text-neutral-200 capitalize mt-0.5">
                          {activeProfile.riskConsequenceIntensity || 'Normal'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* SECTION 6: V2 KNOWLEDGE GRAPH EXPLORER */}
        {planningSection === 'graph' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold font-cinzel text-amber-100">
                  Epistemic Knowledge Graph Explorer
                </h3>
                <p className="text-xs text-neutral-400">
                  Read-only projection over canonical SQLite entities, SRD 5.1 rules, notes, DM plans, and homebrew.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter graph nodes (e.g. Jorren, Primara)..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-100 w-64"
                />
                <button
                  type="button"
                  onClick={() => setPreviewPlayerGraph(!previewPlayerGraph)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-semibold ${
                    previewPlayerGraph
                      ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                      : 'bg-amber-950 text-amber-200 border-amber-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {previewPlayerGraph
                      ? 'Audience: Player-Safe Preview (char-lyra-01)'
                      : 'Audience: Full DM Truth'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Visible Nodes */}
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel font-bold text-neutral-100 text-sm">
                    Projected Nodes ({graphData?.nodes.length || 0})
                  </h4>
                  <span className="font-mono text-[10px] text-neutral-500">
                    Hash: {graphData?.projection_hash.slice(0, 12)}
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(graphData?.nodes || []).map((n) => (
                    <div
                      key={n.node_id}
                      className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-100">{n.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-cyan-300">
                          {n.entity_type} • {n.truth_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300">{n.summary}</p>
                      <div className="text-[10px] font-mono text-neutral-500">{n.node_id}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visible Relationships */}
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
                <h4 className="font-cinzel font-bold text-neutral-100 text-sm">
                  Projected Relationships ({graphData?.edges.length || 0})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(graphData?.edges || []).map((edge) => (
                    <div
                      key={edge.edge_id}
                      className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-300 font-bold">
                          {edge.relation_type}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {edge.visibility} • {edge.truth_level}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-300 font-mono break-all">
                        {edge.source_uri} → {edge.target_uri}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: V2 DM PLAN LIFECYCLE (PROPOSE -> CONFIRM) */}
        {planningSection === 'plans' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleProposePlan}
              className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4"
            >
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-base font-bold font-cinzel text-amber-100">
                  Propose DM Plan Revision
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Pins a SHA-256 Markdown snapshot so later draft edits never silently mutate a confirmed plan.
                </p>
              </div>

              {planStatusBanner && (
                <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{planStatusBanner}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Plan Kind
                </label>
                <select
                  value={planKind}
                  onChange={(e) => setPlanKind(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-100"
                >
                  <option value="encounter_beat">encounter_beat</option>
                  <option value="quest_branch">quest_branch</option>
                  <option value="faction_move">faction_move</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Source Markdown Snapshot (Supports [[Wikilinks]])
                </label>
                <textarea
                  rows={4}
                  value={planMarkdown}
                  onChange={(e) => setPlanMarkdown(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-neutral-100 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 text-white font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Propose Plan Revision</span>
              </button>
            </form>

            <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <h3 className="text-base font-bold font-cinzel text-amber-100">
                Active & Proposed DM Plans ({plans.length})
              </h3>
              <div className="space-y-3">
                {plans.map((p) => (
                  <div
                    key={`${p.plan_id}-r${p.revision}`}
                    className="p-3.5 bg-neutral-950 rounded border border-neutral-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-100">
                        {p.title} (r{p.revision})
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          p.status === 'confirmed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 font-mono">
                      {p.source_markdown_snapshot}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>Pinned Hash: {p.source_markdown_hash.slice(0, 14)}...</span>
                      {p.status === 'proposed' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPlan(p)}
                          className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-sans font-semibold"
                        >
                          Confirm Plan
                        </button>
                      )}
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
