import React, { useState } from 'react';
import {
  Compass,
  Scroll,
  Sparkles,
  Clock,
  CloudFog,
  Shield,
  Eye,
  Sliders,
  ChevronDown,
  Play,
  Pause,
  FastForward,
  Cpu,
  Map as MapIcon,
  User,
  BookOpen,
  LogOut,
  Radio,
  Server,
  Lock,
} from 'lucide-react';
import type { OperatingMode, UserIdentityContext } from '../../types/runtime.ts';
import type { MasterWorldClock } from '../../types/world.ts';
import {
  type ApplicationTab,
  canAccessDmWorkspaces,
  canHostSession,
  getAuthorisedTabs,
  DEMO_IDENTITY_PRESETS,
} from '../../runtime/roleAuthority.ts';

export const OPERATING_MODES_CONFIG: {
  id: OperatingMode;
  label: string;
  shortDesc: string;
  authority: string;
}[] = [
  {
    id: 'full_ai_dm',
    label: 'Full AI DM',
    shortDesc: 'AI handles narration, NPC dialogue, adjudication & pacing within authorised boundaries.',
    authority: 'AI Adjudicated • Autonomous',
  },
  {
    id: 'ai_primary_codm',
    label: 'AI-primary Co-DM',
    shortDesc: 'AI runs active session; human DM supervises, guides tone, and retains instant veto.',
    authority: 'AI Primary • Human Veto',
  },
  {
    id: 'human_primary_codm',
    label: 'Human-primary Co-DM',
    shortDesc: 'Human DM leads tabletop; AI handles delegated rules, NPC banter, and math.',
    authority: 'Human Lead • AI Delegated',
  },
  {
    id: 'human_dm_assist',
    label: 'Human DM Assist',
    shortDesc: 'Human DM runs entire game; AI provides passive rule lookup & administrative aid.',
    authority: 'Human Sovereign • AI Tooling',
  },
  {
    id: 'human_sovereign',
    label: 'Human Sovereign',
    shortDesc: 'Human DM retains absolute decision authority; AI remains completely dormant.',
    authority: '100% Human Controlled',
  },
];

interface HeaderProps {
  currentTab: ApplicationTab;
  onSelectTab: (tab: ApplicationTab) => void;
  identity: UserIdentityContext;
  onSelectIdentity: (identity: UserIdentityContext) => void;
  operatingMode: OperatingMode;
  onSelectOperatingMode: (mode: OperatingMode) => void;
  worldClock: MasterWorldClock;
  onAdvanceTime: (mins: number) => void;
  onTogglePauseClock: () => void;
  onOpenAudit: () => void;
  runtimeStatusText?: string;
  isUsingDemoClient?: boolean;
  onToggleClientMode?: (useDemo: boolean) => void;
  onExitPreview: () => void;
  onEnterPreview: (characterId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  identity,
  onSelectIdentity,
  operatingMode,
  onSelectOperatingMode,
  worldClock,
  onAdvanceTime,
  onTogglePauseClock,
  onOpenAudit,
  runtimeStatusText,
  isUsingDemoClient = true,
  onToggleClientMode,
  onExitPreview,
  onEnterPreview,
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);

  const isDm = canAccessDmWorkspaces(identity);
  const isHost = canHostSession(identity);
  const isPreviewing = identity.previewMode?.isActive === true;
  const authorisedTabs = getAuthorisedTabs(identity);

  const activeModeConfig =
    OPERATING_MODES_CONFIG.find((m) => m.id === operatingMode) || OPERATING_MODES_CONFIG[1];

  // Tab label definitions: reflects hosting status without conflating it with DM permissions
  const getTabLabel = (tab: ApplicationTab): string => {
    switch (tab) {
      case 'play':
        return isHost ? 'Play / Host' : 'Play';
      case 'battlemap':
        return 'Battlemap';
      case 'planning':
        return 'DM Planning';
      case 'workshop':
        return 'Homebrew Workshop';
      case 'character':
        return 'Character';
      case 'journal':
        return 'Journal / Quests';
      default:
        return tab;
    }
  };

  const getTabIcon = (tab: ApplicationTab) => {
    switch (tab) {
      case 'play':
        return Compass;
      case 'battlemap':
        return MapIcon;
      case 'planning':
        return Scroll;
      case 'workshop':
        return Sparkles;
      case 'character':
        return User;
      case 'journal':
        return BookOpen;
      default:
        return Compass;
    }
  };

  return (
    <header className="w-full bg-neutral-950 border-b border-neutral-800 text-neutral-200 select-none sticky top-0 z-40 flex flex-col">
      {/* DM Preview as Player Banner (Persistent at very top when DM is inspecting player perspective) */}
      {isPreviewing && (
        <div className="w-full bg-amber-950/90 border-b border-amber-600/70 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-amber-100 z-50">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-900 border border-amber-500/80 text-amber-300">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold font-cinzel text-amber-200">
              Preview as Player:
            </span>
            <span className="text-amber-100 font-medium">
              Viewing as{' '}
              {identity.previewMode?.previewCharacterId === 'char-lyra'
                ? 'Lyra Moonshadow'
                : 'Kaelen Shadowstrider'}
            </span>
            <span className="text-amber-500">•</span>
            <span className="text-[11px] text-amber-300/80">
              DM secrets, private dossiers & unvisited geometry are masked
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch preview target */}
            <select
              value={identity.previewMode?.previewCharacterId || 'char-kaelen'}
              onChange={(e) => onEnterPreview(e.target.value)}
              className="bg-neutral-900 border border-amber-700/80 text-amber-200 text-[11px] rounded px-2 py-0.5 focus:outline-none"
            >
              <option value="char-kaelen">Preview as Kaelen</option>
              <option value="char-lyra">Preview as Lyra</option>
            </select>

            <button
              onClick={onExitPreview}
              className="flex items-center gap-1.5 px-3 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit Preview & Return to DM</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Global Navigation Row */}
      <div className="max-w-[1920px] w-full mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Role-Aware Workspaces */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-700 via-amber-900 to-neutral-900 flex items-center justify-center border border-amber-600/50 shadow-md shadow-amber-900/30">
              <span className="font-cinzel text-amber-200 font-extrabold text-sm tracking-wider">V</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-amber-100 text-base tracking-wider">
                  VadAllFate
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-amber-400 border border-amber-800/50">
                  Ada V2
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-neutral-400 tracking-tight">
                Persistent AI Tabletop RPG Platform
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-800 hidden md:block" />

          {/* Role-Specific Workspaces: DM Workspaces vs Player Workspaces */}
          <nav className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800" aria-label="Main Navigation">
            {authorisedTabs.map((tab) => {
              const Icon = getTabIcon(tab);
              const label = getTabLabel(tab);
              const isActive = currentTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => onSelectTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? isDm
                        ? 'bg-amber-600/20 text-amber-200 border border-amber-600/50 shadow-sm'
                        : 'bg-emerald-600/20 text-emerald-200 border border-emerald-600/50 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Master World Clock */}
        <div className="relative flex items-center">
          <div
            onClick={() => {
              if (isDm) setShowTimeControls(!showTimeControls);
            }}
            role={isDm ? 'button' : undefined}
            tabIndex={isDm ? 0 : undefined}
            onKeyDown={(e) => {
              if (isDm && e.key === 'Enter') setShowTimeControls(!showTimeControls);
            }}
            aria-label={isDm ? 'Toggle Master World Clock Controls' : 'World Clock Display'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 transition-colors text-xs ${
              isDm ? 'hover:border-amber-700/60 cursor-pointer' : 'cursor-default'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-semibold text-neutral-100">{worldClock?.calendar?.timeString || '14:15'}</span>
            <span className="text-neutral-400 font-medium">({worldClock?.calendar?.timeOfDay || 'Afternoon'})</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 hidden lg:inline">{worldClock?.calendar?.monthName || 'Tarsakh'} {worldClock?.calendar?.dayOfMonth || 14}</span>
            <span className="text-neutral-600 hidden lg:inline">•</span>
            <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
              <CloudFog className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden xl:inline">{worldClock?.weather?.condition || 'Clear'}</span>
            </div>
            {worldClock?.isPaused && (
              <span className="text-[10px] uppercase font-mono px-1 rounded bg-red-950 text-red-300 border border-red-800">
                Paused
              </span>
            )}
            {isDm && (
              <span className="text-[9px] font-mono text-neutral-500 border border-neutral-800 rounded px-1 hidden md:inline">
                DM Controls
              </span>
            )}
          </div>

          {/* DM Time Control Popover (Accessible only to DM) */}
          {isDm && showTimeControls && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-80 p-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-cinzel font-bold text-amber-200">World Clock Controls</span>
                <span className="text-[10px] font-mono text-neutral-400">1492 DR</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAdvanceTime(10)}
                  className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-mono transition-colors"
                >
                  +10 Minutes
                </button>
                <button
                  onClick={() => onAdvanceTime(60)}
                  className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-mono transition-colors"
                >
                  +1 Hour
                </button>
                <button
                  onClick={() => onAdvanceTime(480)}
                  className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-mono transition-colors"
                >
                  +8h (Long Rest)
                </button>
                <button
                  onClick={() => onAdvanceTime(1440)}
                  className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-mono transition-colors"
                >
                  +24 Hours
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={onTogglePauseClock}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
                    worldClock?.isPaused
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {worldClock?.isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume Clock</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Clock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Operating Mode & Role / Persona Switcher & Audit Register */}
        <div className="flex items-center gap-2">
          {/* Operating Mode Dropdown (DM Only) */}
          {isDm && (
            <div className="relative">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 text-xs transition-colors"
                aria-label="Select Operating Mode"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-neutral-200 leading-tight">{activeModeConfig.label}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {showModeDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-80 p-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 text-xs space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    Select Operating Mode
                  </div>
                  {OPERATING_MODES_CONFIG.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onSelectOperatingMode(mode.id);
                        setShowModeDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        operatingMode === mode.id
                          ? 'bg-amber-950/70 text-amber-200 border border-amber-700/50'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{mode.label}</span>
                        <span className="text-[10px] font-mono text-amber-400/90">{mode.authority}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{mode.shortDesc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DM-Only: "Preview as Player" Quick Action */}
          {identity.gameRole === 'dm' && !isPreviewing && (
            <button
              onClick={() => onEnterPreview('char-kaelen')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-emerald-600/50 text-xs text-neutral-300 hover:text-emerald-300 transition-colors"
              title="Preview the application from an authorized player's perspective"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Preview as Player</span>
            </button>
          )}

          {/* Role & Hosting Persona Switcher (Demonstration / Identity Matrix) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 text-xs transition-colors"
              aria-label="Select Role and Hosting Status"
            >
              {identity.gameRole === 'dm' ? (
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="font-medium text-neutral-200">
                {identity.gameRole === 'dm'
                  ? isHost
                    ? 'DM (Host)'
                    : 'DM (Guest)'
                  : isHost
                  ? `Player (Host: ${identity.assignedCharacterId === 'char-lyra' ? 'Lyra' : 'Kaelen'})`
                  : `Player (${identity.assignedCharacterId === 'char-lyra' ? 'Lyra' : 'Kaelen'})`}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-72 p-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 flex items-center justify-between">
                  <span>Role & Hosting Preset</span>
                  <span className="text-[10px] text-amber-400 font-mono">HOTFIX-001</span>
                </div>
                <div className="p-1.5 text-[10px] text-neutral-400 leading-tight bg-neutral-950 rounded border border-neutral-800/80 mb-1">
                  Game Role determines narrative authority. Session hosting determines technical hosting. They are completely independent.
                </div>

                {DEMO_IDENTITY_PRESETS.map((preset) => {
                  const isCurrent =
                    identity.gameRole === preset.context.gameRole &&
                    identity.isHost === preset.context.isHost &&
                    identity.assignedCharacterId === preset.context.assignedCharacterId &&
                    !isPreviewing;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelectIdentity(preset.context);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        isCurrent
                          ? preset.context.gameRole === 'dm'
                            ? 'bg-amber-950/70 text-amber-200 border border-amber-700/50'
                            : 'bg-emerald-950/70 text-emerald-200 border border-emerald-700/50'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {preset.context.gameRole === 'dm' ? (
                          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-neutral-100">{preset.label}</div>
                          <div className="text-[10px] text-neutral-400">{preset.subtitle}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Architecture Register Button */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-amber-700/50 text-neutral-300 hover:text-amber-200 text-xs transition-colors"
            title="Inspect Architecture Register & Contract Verification"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
