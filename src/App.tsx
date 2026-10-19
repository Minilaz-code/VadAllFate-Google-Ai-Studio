/**
 * VadAllFate (Ada V2) — Persistent AI Tabletop RPG Platform
 * Master Application Shell (AIUI-CP001 Architecture Boundary Lock)
 */

import React, { useState, useEffect } from 'react';
import type { OperatingMode, UserRole, CampaignProjection, DmFullCampaignProjection, PlayerSafeCampaignProjection } from './types/runtime.ts';
import { clientManager } from './runtime/adapter.ts';
import { Header } from './components/layout/Header.tsx';
import { NarrativePlayView } from './components/play/NarrativePlayView.tsx';
import { BattlemapView } from './components/battlemap/BattlemapView.tsx';
import { DmPlanningView } from './components/planning/DmPlanningView.tsx';
import { HomebrewWorkshopView } from './components/workshop/HomebrewWorkshopView.tsx';
import { FeatureStatusModal } from './components/common/FeatureStatusModal.tsx';
import { AlertTriangle, RefreshCw, Cpu, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'play' | 'battlemap' | 'planning' | 'workshop'>('play');
  const [userRole, setUserRole] = useState<UserRole>('dm_host');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('char-kaelen');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isUsingDemo, setIsUsingDemo] = useState(clientManager.isUsingDemo());
  const [tick, setTick] = useState(0);

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

  // Retrieve current role-aware projection if in demo mode
  let projection: CampaignProjection | null = null;
  let gatewayError: string | null = null;

  if (isUsingDemo) {
    projection = activeClient.getProjection(userRole, selectedCharacterId);
  } else {
    try {
      projection = activeClient.getProjection(userRole, selectedCharacterId);
    } catch (e: any) {
      gatewayError = e.message;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans select-none antialiased">
      {/* Persistent Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        operatingMode={projection ? projection.operatingMode : 'ai_primary_codm'}
        onSelectOperatingMode={(mode) => activeClient.setOperatingMode(mode)}
        currentRole={userRole}
        selectedCharacterId={selectedCharacterId}
        onSelectRole={(role, charId) => {
          setUserRole(role);
          if (charId) setSelectedCharacterId(charId);
        }}
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
        onAdvanceTime={(mins) => activeClient.advanceTime(mins)}
        onTogglePauseClock={() => activeClient.toggleClockPause()}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        runtimeStatusText={connectionStatus.statusLabel}
        isUsingDemoClient={isUsingDemo}
        onToggleClientMode={(useDemo) => clientManager.switchClient(useDemo)}
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
              </div>
            </div>

            <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-2 text-[11px] text-neutral-300">
              <div className="text-red-400 font-bold">Architecture Safety Enforced:</div>
              <p className="leading-relaxed">
                The canonical VadAllFate runtime must run as an authoritative Python daemon backed by SQLite.
                Because the daemon is not currently reachable, live operations are safely locked.
              </p>
              <div className="text-neutral-500 pt-1 border-t border-neutral-900 text-[10px]">
                * Automatic fallback from production failure to demo commits is disabled by architectural policy.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
              >
                Inspect Architectural Register
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
      )}

      {/* Main Active Application Area (Demo or Connected Mode) */}
      {projection && (
        <div className="flex-1 flex flex-col min-h-0">
          {currentTab === 'play' && (
            <NarrativePlayView
              characters={projection.characters}
              npcs={projection.npcs}
              quests={projection.quests}
              events={projection.events}
              currentSnapshot={activeClient.getCurrentSnapshot()}
              userRole={userRole}
              operatingMode={projection.operatingMode}
              directorProfiles={
                userRole === 'dm_host'
                  ? (projection as DmFullCampaignProjection).directorProfiles || []
                  : []
              }
              activeDirectorProfileId={
                userRole === 'dm_host'
                  ? (projection as DmFullCampaignProjection).activeDirectorProfileId || ''
                  : ''
              }
              recommendations={
                userRole === 'dm_host'
                  ? (projection as DmFullCampaignProjection).recommendations || []
                  : []
              }
              spotlightMetrics={
                userRole === 'dm_host'
                  ? (projection as DmFullCampaignProjection).spotlightMetrics || []
                  : []
              }
              selectedCharacterId={selectedCharacterId}
              onSelectOperatingMode={(mode) => activeClient.setOperatingMode(mode)}
              onSelectDirectorProfile={(pId) => activeClient.setActiveDirectorProfile(pId)}
              onNavigateToBattlemap={() => setCurrentTab('battlemap')}
            />
          )}

          {currentTab === 'battlemap' && (
            <BattlemapView
              characters={projection.characters}
              npcs={projection.npcs}
              userRole={userRole}
              currentSnapshot={activeClient.getCurrentSnapshot()}
              selectedCharacterId={selectedCharacterId}
              onNavigateToPlay={() => setCurrentTab('play')}
              onMoveToken={(entityId, targetX, targetY, entityType) => {
                activeClient.submitActionEnvelope({
                  actionId: `move-${Date.now()}`,
                  actorId: entityId,
                  actorRole: userRole,
                  actionType: 'MOVE_TOKEN',
                  payload: { entityId, targetX, targetY, entityType },
                  snapshotRef: activeClient.getCurrentSnapshot(),
                  timestampUtc: new Date().toISOString(),
                  clientNonce: `nonce-${Date.now()}`,
                });
              }}
            />
          )}

          {currentTab === 'planning' && (
            <DmPlanningView
              npcs={(projection as DmFullCampaignProjection).npcs || []}
              factions={(projection as DmFullCampaignProjection).factions || []}
              locations={(projection as DmFullCampaignProjection).locations || []}
              quests={(projection as DmFullCampaignProjection).quests || []}
              worldClock={projection.worldClock}
              directorProfiles={(projection as DmFullCampaignProjection).directorProfiles || []}
              activeDirectorProfileId={(projection as DmFullCampaignProjection).activeDirectorProfileId || ''}
              recommendations={(projection as DmFullCampaignProjection).recommendations || []}
              onSelectDirectorProfile={(pId) => activeClient.setActiveDirectorProfile(pId)}
              onAdvanceTime={(mins) => activeClient.advanceTime(mins)}
              onTogglePauseClock={() => activeClient.toggleClockPause()}
            />
          )}

          {currentTab === 'workshop' && (
            <HomebrewWorkshopView sourcePacks={projection.sourcePacks} />
          )}
        </div>
      )}

      {/* Architectural Status Register Audit Modal */}
      <FeatureStatusModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
