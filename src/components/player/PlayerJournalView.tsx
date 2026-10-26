import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  MapPin,
  Users,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  FileText,
  Lock,
  Share2,
  Plus,
  Save,
  Link2,
} from 'lucide-react';
import type { PlayerSafeQuest, PlayerSafeLocation, PlayerSafeNpc } from '../../types/runtime.ts';
import { v2BackendClient, type V2MarkdownNote } from '../../services/v2BackendClient.ts';

interface PlayerJournalViewProps {
  quests: PlayerSafeQuest[];
  locations: PlayerSafeLocation[];
  npcs: PlayerSafeNpc[];
  activeCharacterId?: string;
}

export const PlayerJournalView: React.FC<PlayerJournalViewProps> = ({
  quests = [],
  locations = [],
  npcs = [],
  activeCharacterId = 'char-lyra-01',
}) => {
  const [section, setSection] = useState<'quests' | 'locations' | 'npcs' | 'notes'>('quests');
  const [selectedQuestId, setSelectedQuestId] = useState<string>(quests[0]?.id || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');

  // V2 Authored Markdown Notes state (KGP-03)
  const [notes, setNotes] = useState<V2MarkdownNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('Harbor Investigation Notes');
  const [noteBody, setNoteBody] = useState<string>(
    'I suspect [[Jorren Vale]] knows more about [[Primara Cathedral]] than he admits. Prepared [[Fireball]].'
  );
  const [noteVisibility, setNoteVisibility] = useState<
    'private_player' | 'shared_with_dm' | 'party_shared'
  >('private_player');
  const [noteStatusBanner, setNoteStatusBanner] = useState<string | null>(null);

  const audience = {
    actor_id: activeCharacterId,
    role: 'player' as const,
    campaign_id: 'aethelgard-vault-001',
    save_id: 'save-main',
  };

  useEffect(() => {
    let cancelled = false;
    v2BackendClient.listNotes(audience).then((loaded) => {
      if (cancelled) return;
      setNotes(loaded);
      if (loaded.length > 0 && !selectedNoteId) {
        setSelectedNoteId(loaded[0].note_id);
        setNoteTitle(loaded[0].title);
        setNoteBody(loaded[0].markdown_body);
        if (loaded[0].visibility !== 'dm_private') {
          setNoteVisibility(loaded[0].visibility);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeCharacterId]);

  const handleSelectNote = (note: V2MarkdownNote) => {
    setSelectedNoteId(note.note_id);
    setNoteTitle(note.title);
    setNoteBody(note.markdown_body);
    if (note.visibility !== 'dm_private') {
      setNoteVisibility(note.visibility);
    }
  };

  const handleNewNote = () => {
    setSelectedNoteId(`note-${Date.now()}`);
    setNoteTitle('New Field Note');
    setNoteBody('Record observations using [[Entity Name]] wikilinks...');
    setNoteVisibility('private_player');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await v2BackendClient.saveNote(audience, {
      note_id: selectedNoteId || `note-${Date.now()}`,
      title: noteTitle,
      markdown_body: noteBody,
      visibility: noteVisibility,
      tags: ['journal'],
    });
    const refreshed = await v2BackendClient.listNotes(audience);
    setNotes(refreshed);
    setSelectedNoteId(saved.note_id);
    setNoteStatusBanner(
      `Saved note "${saved.title}" (rev ${saved.revision}, ACL: ${saved.visibility}, hash: ${saved.content_hash.slice(0, 10)}...)`
    );
  };

  const handleQuickShare = async (
    targetVisibility: 'private_player' | 'shared_with_dm' | 'party_shared'
  ) => {
    if (!selectedNoteId) return;
    const updated = await v2BackendClient.changeNoteVisibility(
      audience,
      selectedNoteId,
      targetVisibility
    );
    setNoteVisibility(targetVisibility);
    const refreshed = await v2BackendClient.listNotes(audience);
    setNotes(refreshed);
    setNoteStatusBanner(`Updated ACL for "${updated.title}" to ${updated.visibility}`);
  };

  const activeQuest = quests.find((q) => q.id === selectedQuestId) || quests[0];
  const activeLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const activeNote = notes.find((n) => n.note_id === selectedNoteId);

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
            <p className="text-[10px] text-neutral-400">
              Party Quests, Discovered Realm Lore, Known Contacts & ACL-Protected Markdown Notes
            </p>
          </div>
        </div>

        {/* Section switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          {[
            { id: 'quests', label: `Quests (${quests.length})`, icon: Shield },
            { id: 'locations', label: `Discovered Lands (${locations.length})`, icon: MapPin },
            { id: 'npcs', label: `Known NPCs (${npcs.length})`, icon: Users },
            { id: 'notes', label: `Field Notes (${notes.length})`, icon: FileText },
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
        {section === 'quests' &&
          (quests.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <BookOpen className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Active Quests</h3>
              <p className="text-neutral-500 text-xs">Your party has not undertaken any quests yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {activeQuest && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold font-cinzel text-emerald-200">
                          {activeQuest.title}
                        </h3>
                        <p className="text-neutral-400 text-xs">Quest Giver: {activeQuest.giverName}</p>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 capitalize px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                        {activeQuest.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">
                        Objectives
                      </h4>
                      <div className="space-y-2 bg-neutral-950/60 p-3.5 rounded border border-neutral-800">
                        {activeQuest.objectives.map((obj) => (
                          <div key={obj.id} className="flex items-start gap-2.5">
                            {obj.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={
                                obj.isCompleted
                                  ? 'line-through text-neutral-500'
                                  : 'text-neutral-200'
                              }
                            >
                              {obj.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">
                        Promised Rewards
                      </h4>
                      <p className="text-neutral-300 bg-neutral-950/60 p-3 rounded border border-neutral-800">
                        {activeQuest.rewardsDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* SECTION 2: LOCATIONS */}
        {section === 'locations' &&
          (locations.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 max-w-md mx-auto space-y-2">
              <MapPin className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-cinzel font-bold text-neutral-300">No Lands Discovered</h3>
              <p className="text-neutral-500 text-xs">Travel beyond current horizons to map the world.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <span className="text-[10px] font-mono text-neutral-400 capitalize">
                          {loc.travelHazardLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 capitalize">
                        {loc.region} • {loc.type}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {activeLoc && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4">
                    <div className="border-b border-neutral-800 pb-3">
                      <h3 className="text-base font-bold font-cinzel text-neutral-100">
                        {activeLoc.name}
                      </h3>
                      <p className="text-neutral-400 text-xs capitalize">
                        {activeLoc.region} Region • {activeLoc.type}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-1">
                        Public Lore
                      </h4>
                      <p className="text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded border border-neutral-800">
                        {activeLoc.publicDescription}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[11px] uppercase text-neutral-400 mb-2">
                        Connected Routes
                      </h4>
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
                                <span className="font-medium text-neutral-200">
                                  {dest?.name || rid}
                                </span>
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
          ))}

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

        {/* SECTION 4: V2 MARKDOWN FIELD NOTES & WIKILINKS */}
        {section === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Notes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-cinzel text-neutral-100 text-sm">
                  Authored Markdown Notes
                </h3>
                <button
                  type="button"
                  onClick={handleNewNote}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 text-[11px] font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Note</span>
                </button>
              </div>

              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.note_id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      note.note_id === selectedNoteId
                        ? 'bg-emerald-950/40 border-emerald-600/70'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-100">{note.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-700 text-emerald-300">
                        {note.visibility}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{note.markdown_body}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>Rev {note.revision}</span>
                      <span>{note.linked_entity_uris.length} wikilinks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Markdown Editor & ACL Controls */}
            <div className="lg:col-span-2 space-y-4">
              {noteStatusBanner && (
                <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{noteStatusBanner}</span>
                </div>
              )}

              <form
                onSubmit={handleSaveNote}
                className="p-5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-cinzel text-emerald-200">
                      Markdown Note & Epistemic ACL Editor
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      Player theories link to canonical entities via [[Wikilinks]] without overwriting canonical world truth.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickShare('private_player')}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Keep Private</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickShare('shared_with_dm')}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-[10px] text-amber-200"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share with DM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickShare('party_shared')}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-[10px] text-emerald-200"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share to Party</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                      Note Title
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                      Visibility Scope (ACL)
                    </label>
                    <select
                      value={noteVisibility}
                      onChange={(e) => setNoteVisibility(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100"
                    >
                      <option value="private_player">private_player (Only Me)</option>
                      <option value="shared_with_dm">shared_with_dm (Me + DM)</option>
                      <option value="party_shared">party_shared (Entire Party)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                    Markdown Body (Supports [[Jorren Vale]], [[Primara Cathedral]], [[Fireball]])
                  </label>
                  <textarea
                    rows={5}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-neutral-100 font-mono text-xs"
                  />
                </div>

                {activeNote && activeNote.linked_entity_uris.length > 0 && (
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-emerald-400">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Resolved Canonical Entity References (Read-Only Mentions)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeNote.linked_entity_uris.map((uri) => (
                        <span
                          key={uri}
                          className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[10px] text-neutral-300"
                        >
                          {uri}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-neutral-500">
                    Sync: {activeNote?.sync_status || 'ready'} • SHA-256 Indexed
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Markdown Note</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
