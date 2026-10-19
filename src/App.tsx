/**
 * VadAllFate (Ada V2) — Persistent AI Tabletop RPG Platform
 * Master Application Shell
 */

import React, { useState, useEffect } from 'react';
import type { OperatingMode, UserRole } from './types/runtime.ts';
import { runtimeService, AuthoritativeCampaignState } from './runtime/adapter.ts';
import { Header } from './components/layout/Header.tsx';
import { TabletopView } from './components/play/TabletopView.tsx';
import { DmPlanningView } from './components/planning/DmPlanningView.tsx';
import { HomebrewWorkshopView } from './components/workshop/HomebrewWorkshopView.tsx';
import { FeatureStatusModal } from './components/common/FeatureStatusModal.tsx';

export default function App() {
  const [campaignState, setCampaignState] = useState<AuthoritativeCampaignState>(() =>
    runtimeService.getState()
  );
  const [currentTab, setCurrentTab] = useState<'play' | 'planning' | 'workshop'>('play');
  const [userRole, setUserRole] = useState<UserRole>('dm_host');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('char-kaelen');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = runtimeService.subscribe((newState) => {
      setCampaignState(newState);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans select-none antialiased">
      {/* Persistent Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        operatingMode={campaignState.operatingMode}
        onSelectOperatingMode={(mode) => runtimeService.setOperatingMode(mode)}
        currentRole={userRole}
        selectedCharacterId={selectedCharacterId}
        onSelectRole={(role, charId) => {
          setUserRole(role);
          if (charId) setSelectedCharacterId(charId);
        }}
        worldClock={campaignState.worldClock}
        onAdvanceTime={(mins) => runtimeService.advanceTime(mins)}
        onTogglePauseClock={() => runtimeService.toggleClockPause()}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* Main Active Application Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentTab === 'play' && (
          <TabletopView
            characters={campaignState.characters}
            npcs={campaignState.npcs}
            quests={campaignState.quests}
            events={campaignState.events}
            currentSnapshot={campaignState.currentSnapshot}
            userRole={userRole}
            operatingMode={campaignState.operatingMode}
            directorProfiles={campaignState.directorProfiles}
            activeDirectorProfileId={campaignState.activeDirectorProfileId}
            recommendations={campaignState.recommendations}
            spotlightMetrics={campaignState.spotlightMetrics}
            selectedCharacterId={selectedCharacterId}
            onSelectOperatingMode={(mode) => runtimeService.setOperatingMode(mode)}
            onSelectDirectorProfile={(pId) => runtimeService.setActiveDirectorProfile(pId)}
          />
        )}

        {currentTab === 'planning' && (
          <DmPlanningView
            npcs={campaignState.npcs}
            factions={campaignState.factions}
            locations={campaignState.locations}
            quests={campaignState.quests}
            worldClock={campaignState.worldClock}
            directorProfiles={campaignState.directorProfiles}
            activeDirectorProfileId={campaignState.activeDirectorProfileId}
            recommendations={campaignState.recommendations}
            onSelectDirectorProfile={(pId) => runtimeService.setActiveDirectorProfile(pId)}
            onAdvanceTime={(mins) => runtimeService.advanceTime(mins)}
            onTogglePauseClock={() => runtimeService.toggleClockPause()}
          />
        )}

        {currentTab === 'workshop' && (
          <HomebrewWorkshopView sourcePacks={campaignState.sourcePacks} />
        )}
      </div>

      {/* Architectural Status Register Audit Modal */}
      <FeatureStatusModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
