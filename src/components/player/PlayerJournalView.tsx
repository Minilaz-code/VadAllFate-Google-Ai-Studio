import React, { useState } from 'react';
import {
  BookOpen,
  MapPin,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import type { PlayerSafeQuest, PlayerSafeLocation, PlayerSafeNpc } from '../../types/runtime.ts';

interface PlayerJournalViewProps {
  quests: PlayerSafeQuest[];
  locations: PlayerSafeLocation[];
  npcs: PlayerSafeNpc[];
}

export const PlayerJournalView: React.FC<PlayerJournalViewProps> = ({
  quests = [],
  locations = [],
  npcs = [],
}) => {
  const [section, setSection] = useState<'quests' | 'locations' | 'npcs'>('quests');
  const [selectedQuestId, setSelectedQuestId] = useState<string>(quests[0]?.id || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');

  const activeQuest = quests.find((q) => q.id === selectedQuestId) || quests[0];
  const activeLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 text-neutral-200 overflow-hidden text-xs">
      {/* Header Bar */}
      <div className="px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-cinzel text-neutral-100">Adventurer's Journal</h2>
            <p className="text-[10px] text-neutral-400">Party Quests, Discovered Realm Lore & Known Contacts</p>
          </div>
        </div>

        {/* Section switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          {[
            { id: 'quests', label: `Quests (${quests.length})`, icon: Shield },
            { id: 'locations', label: `Discovered Lands (${locations.length})`, icon: MapPin },
            { id: 'npcs', label: `Known NPCs (${npcs.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  section === tab.id
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Journal Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {/* SECTION 1: QUESTS */}
        {section === 'quests' && (
          quests.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <BookOpen className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Active Quests</h3>
              <p className="text-neutral-500 text-xs">Your party has not undertaken any quests yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quest List */}
              <div className="space-y-3">
                <h3 className="font-bold font-cinzel text-neutral-100 text-sm">Campaign Quests</h3>
                <div className="space-y-2">
                  {quests.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestId(q.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        q.id === activeQuest?.id
                          ? 'bg-emerald-950/40 border-emerald-600/70 shadow-sm'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-neutral-100">{q.title}</h4>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                            q.urgency === 'critical'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {q.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">Given by: {q.giverName}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quest Detail */}
              {activeQuest && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-cinzel text-emerald-200">{activeQuest.title}</h3>
                        <p className="text-neutral-400 text-xs">Quest Giver: {activeQuest.giverName}</p>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 capitalize px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                        {activeQuest.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">Objectives</h4>
                      <div className="space-y-2 bg-neutral-950/60 p-3.5 rounded border border-neutral-800">
                        {activeQuest.objectives.map((obj) => (
                          <div key={obj.id} className="flex items-start gap-2.5">
                            {obj.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                            )}
                            <span className={obj.isCompleted ? 'line-through text-neutral-500' : 'text-neutral-200'}>
                              {obj.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">Promised Rewards</h4>
                      <p className="text-neutral-300 bg-neutral-950/60 p-3 rounded border border-neutral-800">
                        {activeQuest.rewardsDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* SECTION 2: LOCATIONS */}
        {section === 'locations' && (
          locations.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <MapPin className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Lands Discovered</h3>
              <p className="text-neutral-500 text-xs">Travel beyond current horizons to map the world.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Location List */}
              <div className="space-y-3">
                <h3 className="font-bold font-cinzel text-neutral-100 text-sm">Discovered Sites</h3>
                <div className="space-y-2">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        loc.id === activeLoc?.id
                          ? 'bg-emerald-950/40 border-emerald-600/70 shadow-sm'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-neutral-100">{loc.name}</h4>
                        <span className="text-[10px] font-mono text-neutral-400 capitalize">{loc.travelHazardLevel}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 capitalize">{loc.region} • {loc.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Detail */}
              {activeLoc && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="border-b border-neutral-800 pb-3">
                      <h3 className="text-base font-bold font-cinzel text-neutral-100">{activeLoc.name}</h3>
                      <p className="text-neutral-400 text-xs capitalize">{activeLoc.region} Region • {activeLoc.type}</p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">Public Lore</h4>
                      <p className="text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded border border-neutral-800">
                        {activeLoc.publicDescription}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">Connected Routes</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeLoc.connectedRouteIds.map((rid) => {
                          const dest = locations.find((l) => l.id === rid);
                          return (
                            <div
                              key={rid}
                              className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-medium text-neutral-200">{dest?.name || rid}</span>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-500">
                                {dest?.travelTimeHoursFromParty || 2}h travel
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

        {/* SECTION 3: KNOWN NPCS */}
        {section === 'npcs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {npcs.map((n) => (
              <div
                key={n.id}
                className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div>
                    <h4 className="font-bold text-neutral-100 font-cinzel">{n.name}</h4>
                    <p className="text-[10px] text-neutral-400">{n.title}</p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{n.occupation}</span>
                </div>

                <p className="text-[11px] text-neutral-300 italic">{n.appearanceDescription}</p>

                {n.publicKnowledge?.publicFacts && n.publicKnowledge.publicFacts.length > 0 && (
                  <div className="pt-1">
                    <span className="font-mono text-[10px] uppercase text-neutral-500 block mb-1">
                      Known Information
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                      {n.publicKnowledge.publicFacts.map((fact, i) => (
                        <li key={i}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
