import {SrdReferencePanel} from './components/play/SrdReferencePanel.tsx';
import {discoverRuntimeProfile} from './services/runtimeProfile.ts';
import {resolveSessionApiBaseUrl} from './services/v2Session.ts';
import {CombatTracker} from './components/play/CombatTracker.tsx';
/**
 * VadAllFate (Ada V2) — Persistent AI Tabletop RPG Platform
 * Master Application Shell (AIUI-HOTFIX-001 Role Separation & Independent Hosting)
 */

import React, { useState, useEffect } from 'react';
import type {
  CampaignProjection,
  UserIdentityContext,
} from './types/runtime.ts';
import { isDmFullProjection } from './types/runtime.ts';
import { clientManager } from './runtime/adapter.ts';
import {
  type ApplicationTab,
  canAccessDmWorkspaces,
  canAccessWorkshop,
  getEffectiveProjectionRole,
  getEffectiveCharacterId,
  sanitizeTabForIdentity,
} from './runtime/roleAuthority.ts';
import { Header } from './components/layout/Header.tsx';
import { NarrativePlayView } from './components/play/NarrativePlayView.tsx';
import { BattlemapView } from './components/battlemap/BattlemapView.tsx';
import { DmPlanningView } from './components/planning/DmPlanningView.tsx';
import { HomebrewWorkshopView } from './components/workshop/HomebrewWorkshopView.tsx';
import { PlayerCharacterView } from './components/player/PlayerCharacterView.tsx';
import { PlayerJournalView } from './components/player/PlayerJournalView.tsx';
import { FeatureStatusModal } from './components/common/FeatureStatusModal.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import {LiveRollPanel} from './components/play/LiveRollPanel.tsx';
import {AdventurePlayPanel} from './components/play/AdventurePlayPanel.tsx';
import { ContentPlayPanel } from './components/content/ContentPlayPanel.tsx';
import { ShieldAlert } from 'lucide-react';
import { consumeHostKeyFromUrlFragment, hasV2Session, loginWithInvite, getV2Token,isLayeredDevelopment,getDevelopmentSave,selectDevelopmentSave } from './services/v2Session.ts';
import { v2BackendClient } from './services/v2BackendClient.ts';
import { battlemapSessionManager } from './state/battlemapSession.ts';

export default function App() {
  const [hasAdventure,setHasAdventure]=useState(false);
  const [inviteInput,setInviteInput]=useState('');
  const [adventureBusy,setAdventureBusy]=useState(false);
  const [currentTab, setCurrentTab] = useState<ApplicationTab>('play');
  const [identity, setIdentity] = useState<UserIdentityContext>({
    gameRole: 'dm',
    isHost: true,
    assignedCharacterId: undefined,
  });

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [hostKeyInput, setHostKeyInput] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'CONNECTED' | 'AUTH REQUIRED' | 'DISCONNECTED' | 'EXPLICIT DEMO'>('CONNECTING');

  // Starts in attempted live mode by default
  useEffect(() => {
    let active = true;
    const initConnection = async () => {
      if(new URLSearchParams(window.location.search).get('demo')==='1') { clientManager.switchClient(true);setConnectionState('EXPLICIT DEMO');return; }
      const key = consumeHostKeyFromUrlFragment();
      await discoverRuntimeProfile(resolveSessionApiBaseUrl());
      if(active)setTick(t=>t+1);
      if (key) {
        setConnectionState('CONNECTING');
        const token = await clientManager.getPythonGateway().authenticateSession(key);
        setAuthMessage(token ? null : clientManager.getPythonGateway().lastAuthError);
        const ok = await clientManager.connectPythonGateway();
        if (active) {
          if (ok) {
            setConnectionState('CONNECTED');
          } else {
            setConnectionState(hasV2Session() ? 'DISCONNECTED' : 'AUTH REQUIRED');
          }
        }
      } else if (hasV2Session()) {
        setConnectionState('CONNECTING');
        const ok = await clientManager.connectPythonGateway();
        if (active) {
          setConnectionState(ok ? 'CONNECTED' : 'DISCONNECTED');
        }
      } else {
        setConnectionState('CONNECTING');
        const ok = await clientManager.connectPythonGateway();
        if (active) {
          if (ok) {
            setConnectionState('CONNECTED');
          } else {
            setConnectionState(hasV2Session() ? 'DISCONNECTED' : 'AUTH REQUIRED');
          }
        }
      }
    };
    void initConnection();
    return () => { active = false; };
  }, []);
  const [isUsingDemo, setIsUsingDemo] = useState(clientManager.isUsingDemo());
  const [, setTick] = useState(0);

  // Subscribe to active client and manager updates
  useEffect(() => {
    const unsubManager = clientManager.subscribe(() => {
      setIsUsingDemo(clientManager.isUsingDemo());
      setTick((t) => t + 1);
    });

    const activeClient = clientManager.getClient();
    const unsubClient = activeClient.subscribe(() => {
      setTick((t) => t + 1);
    });

    return () => {
      unsubManager();
      unsubClient();
    };
  }, [isUsingDemo]);

  const activeClient = clientManager.getClient();
  const connectionStatus = activeClient.getConnectionStatus();

  // Resolve effective projection parameters
  const effectiveRole = getEffectiveProjectionRole(identity);
  const effectiveCharId = !isUsingDemo && connectionStatus.isConnectedToLivePython && (effectiveRole === 'player' || effectiveRole === 'observer')
    ? (activeClient.getProjection('player') as import('./types/runtime.ts').PlayerSafeCampaignProjection).activeCharacterId || ''
    : getEffectiveCharacterId(identity);

  // Retrieve current role-aware projection safely
  let projection: CampaignProjection | null = null;
  let gatewayError: string | null = null;

  if (isUsingDemo) {
    projection = activeClient.getProjection(effectiveRole, effectiveCharId);
  } else {
    try {
      projection = activeClient.getProjection(effectiveRole, effectiveCharId);
    } catch (e: any) {
      gatewayError = e.message;
    }
  }

  // Hydrate persistent battlemap session state from authoritative backend projection
  useEffect(() => {
    if (projection && (projection as any).battlemapState) {
      battlemapSessionManager.hydrateFromBackendProjection((projection as any).battlemapState);
    }
  }, [projection]);

  // Stage W0: Invalidate asset blob URL cache when switching roles or identities
  // to prevent DM-only cached blob URLs from leaking into player views
  useEffect(() => {
    v2BackendClient.clearAssetBlobCache();
  }, [effectiveRole, identity.gameRole, projection?.campaignId, identity.assignedCharacterId, identity.previewMode?.isActive]);

  useEffect(()=>{
    if (!isUsingDemo && connectionStatus.isConnectedToLivePython && !getV2Token('dm')) {
      const view=activeClient.getProjection('player') as import('./types/runtime.ts').PlayerSafeCampaignProjection;
      setIdentity(previous=>previous.gameRole===view.projectionRole&&previous.assignedCharacterId===view.activeCharacterId ? previous :
        {gameRole:view.projectionRole,isHost:false,assignedCharacterId:view.activeCharacterId});
    }
  },[isUsingDemo,connectionStatus.isConnectedToLivePython,activeClient]);

  // Handlers for switching identity preset
  const handleSelectIdentity = (newIdentity: UserIdentityContext) => {
    if (!isUsingDemo && newIdentity.gameRole==='dm' && !getV2Token('dm')) return;
    if (!isUsingDemo && connectionStatus.isConnectedToLivePython && newIdentity.gameRole === 'player') {
      newIdentity = {...newIdentity, assignedCharacterId:(activeClient.getProjection('player') as import('./types/runtime.ts').PlayerSafeCampaignProjection).activeCharacterId};
    }
    setIdentity(newIdentity);
    if (newIdentity.gameRole === 'player' || newIdentity.gameRole === 'observer') {
      battlemapSessionManager.clearPrivilegedCache();
    }
    // Sanitize active tab to prevent invalid DM workspace access
    setCurrentTab((prevTab) => sanitizeTabForIdentity(prevTab, newIdentity));
  };

  // Handlers for entering/exiting Player Preview mode
  const handleEnterPreview = (characterId: string) => {
    battlemapSessionManager.clearPrivilegedCache();
    setIdentity((prev) => {
      const updated: UserIdentityContext = {
        ...prev,
        previewMode: {
          isActive: true,
          previewRole: 'player',
          previewCharacterId: characterId,
        },
      };
      setCurrentTab((prevTab) => sanitizeTabForIdentity(prevTab, updated));
      return updated;
    });
  };

  const handleExitPreview = () => {
    setIdentity((prev) => {
      const updated: UserIdentityContext = {
        ...prev,
        previewMode: undefined,
      };
      setCurrentTab((prevTab) => sanitizeTabForIdentity(prevTab, updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans select-none antialiased">
      {/* Persistent Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if(isLayeredDevelopment()&&!['play','character','journal'].includes(tab)){window.alert('UNSUPPORTED: this domain is not registered for the layered development Save.');return;}
          const safeTab = sanitizeTabForIdentity(tab, identity);
          setCurrentTab(safeTab);
        }}
        assignedCharacterName={projection?.characters.find(c=>c.id===effectiveCharId)?.name}
        identity={identity}
        onSelectIdentity={handleSelectIdentity}
        operatingMode={projection ? projection.operatingMode : 'ai_primary_codm'}
        onSelectOperatingMode={(mode) => {if(isLayeredDevelopment()){window.alert('UNSUPPORTED: AI/DM mode changes are not registered for this typed Save.');return;}activeClient.setOperatingMode(mode);}}
        worldClock={
          projection
            ? projection.worldClock
            : {
                totalWorldMinutes: 0,
                calendar: {
                  year: 1492,
                  monthName: 'Hammer',
                  monthIndex: 0,
                  dayOfMonth: 1,
                  dayOfWeek: 'Moonsday',
                  timeString: '00:00',
                  timeOfDay: 'Midnight',
                },
                moonPhase: 'New Moon',
                weather: { temperatureC: 0, condition: 'Clear', windSpeedMph: 0, visibility: 'Full' },
                offlinePolicy: 'PAUSE_WHEN_OFFLINE',
                isPaused: true,
              }
        }
        onAdvanceTime={(mins) => {
          if (canAccessDmWorkspaces(identity)) {
            activeClient.advanceTime(mins);
          }
        }}
        onTogglePauseClock={() => {
          if(isLayeredDevelopment()){window.alert('UNSUPPORTED: clock pause is not registered for this typed Save.');return;}
          if (canAccessDmWorkspaces(identity)) {
            activeClient.toggleClockPause();
          }
        }}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        runtimeStatusText={connectionStatus.statusLabel}
        connectionState={isUsingDemo?'EXPLICIT DEMO':connectionStatus.isConnectedToLivePython&&projection?'CONNECTED':connectionState==='CONNECTING'?'CONNECTING':hasV2Session()?'DISCONNECTED':'AUTH REQUIRED'}
        isUsingDemoClient={isUsingDemo}
        onToggleClientMode={(useDemo) => {
          if (useDemo) {
            clientManager.switchClient(true);
            setConnectionState('EXPLICIT DEMO');
          } else {
            clientManager.switchClient(false);
            setConnectionState('CONNECTING');
            void clientManager.connectPythonGateway().then((ok) => {
              setConnectionState(ok ? 'CONNECTED' : (hasV2Session() ? 'DISCONNECTED' : 'AUTH REQUIRED'));
            });
          }
        }}
        onExitPreview={handleExitPreview}
        onEnterPreview={handleEnterPreview}
      />

      {/* Disconnected Python Gateway Diagnostic Screen */}
      {!isUsingDemo && gatewayError && (
        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950">
          <div className="max-w-xl w-full p-6 rounded-lg bg-neutral-900 border border-red-800/60 shadow-2xl space-y-4 text-xs font-mono text-neutral-300">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="p-2 rounded bg-red-950 border border-red-700 text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-red-200 font-cinzel">
                  Python R1 Runtime Gateway: Not Connected
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Target: {connectionStatus.endpoint}
                </p>
                {gatewayError&&<p role="alert">{gatewayError}</p>}
                {clientManager.getPythonGateway().lastAuthError&&<p>{clientManager.getPythonGateway().lastAuthError}</p>}
              </div>
            </div>

            <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-2 text-[11px] text-neutral-300">
              <div className="text-red-400 font-bold">Architecture Safety Enforced:</div>
              <p className="leading-relaxed">
                The canonical VadAllFate runtime must run as an authoritative Python daemon backed by SQLite.
                No authenticated live projection is available, so live operations are safely locked.
              </p>
              <div className="text-neutral-500 pt-1 border-t border-neutral-900 text-[10px]">
                * Automatic fallback from production failure to demo commits is disabled by architectural policy.
              </div>
            </div>

            <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-2 text-[11px]">
              <div className="text-amber-300 font-bold">Host key or player invitation required</div>
              <p className="text-neutral-400">
                Paste the Host key shown in the launcher window. The role is decided by the backend, never by this page.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={hostKeyInput}
                  onChange={(e) => setHostKeyInput(e.target.value)}
                  placeholder="Host bootstrap key"
                  aria-label="Host bootstrap key"
                  className="flex-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-neutral-200"
                />
                <button
                  onClick={async () => {
                    const tok = await clientManager.getPythonGateway().authenticateSession(hostKeyInput.trim());
                    setAuthMessage(tok ? null : clientManager.getPythonGateway().lastAuthError);
                    setHostKeyInput('');
                    const ok = await clientManager.connectPythonGateway();
                    setConnectionState(ok ? 'CONNECTED' : (hasV2Session() ? 'DISCONNECTED' : 'AUTH REQUIRED'));
                  }}
                  className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold"
                >
                  Authenticate
                </button>
              </div>
              <div className="flex gap-2">
                <input type="password" aria-label="Player invite code" placeholder="Host-issued invite code" value={inviteInput} onChange={e=>setInviteInput(e.target.value)} className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded"/>
                <button disabled={!inviteInput.trim()} onClick={async()=>{
                  try { await loginWithInvite(inviteInput.trim());setInviteInput('');
                    const ok=await clientManager.connectPythonGateway();setConnectionState(ok?'CONNECTED':'DISCONNECTED');
                    setAuthMessage(ok?null:'Invite accepted, but runtime connection failed.');
                  } catch(e:any){setAuthMessage(e.message);}
                }} className="px-3 py-1 bg-emerald-800 rounded">Join with invite</button>
              </div>
              {authMessage && <div className="text-red-400">{authMessage}</div>}
            </div>

            <div className="flex items-center justify-between pt-2 gap-2">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
              >
                Inspect Architectural Register
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void clientManager.connectPythonGateway()}
                  className="px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs transition-colors"
                >
                  Retry Live Python V2 Connection
                </button>
                <button
                  onClick={() => clientManager.switchClient(true)}
                  className="px-4 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors shadow-md"
                >
                  Switch to In-Memory Demo Adapter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Active Application Area with ErrorBoundary Protection */}
      {projection && (
        <ErrorBoundary
          onRecover={() => setCurrentTab('play')}
          fallbackTitle="Workspace Render Exception Handled"
          fallbackDescription="A display error occurred in this workspace view. The error boundary caught it cleanly without crashing the application. Click below to return to the Play workspace."
        >
          <div className="flex-1 flex flex-col min-h-0">
            <LiveRollPanel externalBusy={adventureBusy} projection={projection} role={effectiveRole} actorId={effectiveCharId} isLive={!isUsingDemo&&connectionStatus.isConnectedToLivePython} isPreview={Boolean(identity.previewMode?.isActive)} onRefresh={()=>clientManager.connectPythonGateway()}/>
            {/* WORKSPACE 1: PLAY (Shared) */}
            {currentTab === 'play' && (
              <>{(!hasAdventure||effectiveRole==='dm_host')&&!isLayeredDevelopment()&&<ContentPlayPanel isPreview={Boolean(identity.previewMode?.isActive)} role={effectiveRole} snapshot={activeClient.getCurrentSnapshot()} characters={projection.characters} isLive={!isUsingDemo && connectionStatus.isConnectedToLivePython} onRefresh={() => clientManager.connectPythonGateway()} />}
              <AdventurePlayPanel onBusyChange={setAdventureBusy} refreshKey={JSON.stringify(activeClient.getCurrentSnapshot())} role={effectiveRole} characters={projection.characters} isLive={!isUsingDemo&&connectionStatus.isConnectedToLivePython} isPreview={Boolean(identity.previewMode?.isActive)} onAvailable={setHasAdventure} onRefresh={()=>clientManager.connectPythonGateway()}/>
              {(projection as any).storageFormat==='STORAGE-ALIGN-04'&&projection.combatState&&<CombatTracker supportedProfile combatEvidence={projection.combatEvidence} readOnly={Boolean(identity.previewMode?.isActive)||effectiveRole==='observer'} combatState={projection.combatState} characters={projection.characters} npcs={projection.npcs} userRole={effectiveRole} activeCharacterId={effectiveCharId} currentSnapshot={activeClient.getCurrentSnapshot()} onOpenCharacterSheet={()=>setCurrentTab('character')} onSubmitAction={async action=>{const result=await activeClient.submitAction(action);await clientManager.connectPythonGateway();return result;}}/>}
              {isLayeredDevelopment()&&<SrdReferencePanel/>}
              {!hasAdventure&&!isLayeredDevelopment()&&<NarrativePlayView
                characters={projection.characters}
                npcs={projection.npcs}
                quests={projection.quests}
                events={projection.events}
                currentSnapshot={activeClient.getCurrentSnapshot()}
                userRole={effectiveRole}
                operatingMode={projection.operatingMode}
                directorProfiles={
                  isDmFullProjection(projection) ? projection.directorProfiles : []
                }
                activeDirectorProfileId={
                  isDmFullProjection(projection) ? projection.activeDirectorProfileId : ''
                }
                recommendations={
                  isDmFullProjection(projection) ? projection.recommendations : []
                }
                spotlightMetrics={
                  isDmFullProjection(projection) ? projection.spotlightMetrics : []
                }
                combatState={projection.combatState}
                selectedCharacterId={effectiveCharId}
                dicePolicy={projection.dicePolicy}
                pendingAdjudications={projection.pendingAdjudications}
                onSelectOperatingMode={(mode) => {
                  if (canAccessDmWorkspaces(identity)) {
                    activeClient.setOperatingMode(mode);
                  }
                }}
                onSelectDirectorProfile={(pId) => {
                  if (canAccessDmWorkspaces(identity)) {
                    activeClient.setActiveDirectorProfile(pId);
                  }
                }}
                onNavigateToBattlemap={() => setCurrentTab('battlemap')}
              />}
              </>
            )}

            {/* WORKSPACE 2: BATTLEMAP (Shared, Role-Filtered) */}
            {currentTab === 'battlemap' && (
              <BattlemapView
                characters={projection.characters}
                npcs={projection.npcs}
                userRole={effectiveRole}
                currentSnapshot={activeClient.getCurrentSnapshot()}
                selectedCharacterId={effectiveCharId}
                identity={identity}
                onNavigateToPlay={() => setCurrentTab('play')}
                onSubmitAction={(env) => activeClient.submitActionEnvelope(env)}
                onMoveToken={(entityId, targetX, targetY, entityType) => {
                  return activeClient.submitActionEnvelope({
                    actionId: `move-${Date.now()}`,
                    actorId: entityId,
                    actorRole: effectiveRole,
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
                    snapshotRef: activeClient.getCurrentSnapshot(),
                    timestampUtc: new Date().toISOString(),
                    clientNonce: `nonce-${Date.now()}`,
                  });
                }}
              />
            )}

            {/* WORKSPACE 3: DM PLANNING (DM Only — Protected by Role & Projection Type Guard) */}
            {currentTab === 'planning' &&
              (canAccessDmWorkspaces(identity) && isDmFullProjection(projection) ? (
                <DmPlanningView
                  npcs={projection.npcs}
                  factions={projection.factions}
                  locations={projection.locations}
                  quests={projection.quests}
                  worldClock={projection.worldClock}
                  directorProfiles={projection.directorProfiles}
                  activeDirectorProfileId={projection.activeDirectorProfileId}
                  recommendations={projection.recommendations}
                  onSelectDirectorProfile={(pId) => activeClient.setActiveDirectorProfile(pId)}
                  onAdvanceTime={(mins) => activeClient.advanceTime(mins)}
                  onTogglePauseClock={() => activeClient.toggleClockPause()}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-neutral-950 text-neutral-400">
                  <div className="text-center space-y-2">
                    <p className="font-cinzel font-bold text-amber-200">Restricted Workspace</p>
                    <p className="text-xs">DM Planning requires authorized Dungeon Master credentials.</p>
                    <button
                      onClick={() => setCurrentTab('play')}
                      className="mt-2 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
                    >
                      Return to Play
                    </button>
                  </div>
                </div>
              ))}

            {/* WORKSPACE 4: HOMEBREW WORKSHOP (DM Only) */}
            {currentTab === 'workshop' &&
              (canAccessWorkshop(identity) ? (
                <HomebrewWorkshopView sourcePacks={projection.sourcePacks} />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-neutral-950 text-neutral-400">
                  <div className="text-center space-y-2">
                    <p className="font-cinzel font-bold text-amber-200">Restricted Workspace</p>
                    <p className="text-xs">Homebrew Workshop requires authorized Dungeon Master credentials.</p>
                    <button
                      onClick={() => setCurrentTab('play')}
                      className="mt-2 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
                    >
                      Return to Play
                    </button>
                  </div>
                </div>
              ))}

            {/* WORKSPACE 5: PLAYER CHARACTER (Player View) */}
            {currentTab === 'character' && (
              <PlayerCharacterView
                readOnly={Boolean(identity.previewMode?.isActive)||effectiveRole==='observer'}
                characters={projection.characters}
                selectedCharacterId={effectiveCharId}
                onSelectCharacter={(id) => {
                  setIdentity((prev) => ({ ...prev, assignedCharacterId: id }));
                }}
              />
            )}

            {/* WORKSPACE 6: PLAYER JOURNAL & QUESTS (Player View) */}
            {currentTab === 'journal' && (
              <PlayerJournalView
                quests={projection.quests}
                locations={
                  // Discovered locations only for player journal
                  projection.locations.filter((l: any) => l.isDiscoveredByParty === true) as any
                }
                npcs={
                  // Player-safe NPCs
                  projection.npcs as any
                }
              />
            )}
          </div>
        </ErrorBoundary>
      )}

      {isLayeredDevelopment()&&<aside className="px-4 py-2 text-sm border-t border-amber-900">Campaign Save <select aria-label="Campaign Save" value={getDevelopmentSave()} onChange={e=>{selectDevelopmentSave(e.target.value);window.location.reload();}} className="bg-neutral-900"><option value="a">A</option><option value="b">B</option></select> · {(projection as any)?.storageFormat==='STORAGE-ALIGN-04'?'Controlled first-play campaign: approved NPCs, supported SRD 5.1 combat and persistent R1 receipts. Existing legacy Saves are not converted.':'Supported: HP/balm, source NPC testimony, clock and controlled objective. Other writes, including dice and combat, return unsupported.'}</aside>}
      {/* Architectural Status Register Audit Modal */}
      <FeatureStatusModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
