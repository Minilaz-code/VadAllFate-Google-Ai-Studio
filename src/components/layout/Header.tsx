import React, { useState } from 'react';
import {
  Compass,
  Scroll,
  Sparkles,
  Clock,
  Sun,
  Moon,
  CloudFog,
  Shield,
  Eye,
  Sliders,
  ChevronDown,
  Play,
  Pause,
  FastForward,
  Cpu,
  BookOpen,
} from 'lucide-react';
import type { OperatingMode, UserRole } from '../../types/runtime.ts';
import type { MasterWorldClock } from '../../types/world.ts';

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
  currentTab: 'play' | 'planning' | 'workshop';
  onSelectTab: (tab: 'play' | 'planning' | 'workshop') => void;
  operatingMode: OperatingMode;
  onSelectOperatingMode: (mode: OperatingMode) => void;
  currentRole: UserRole;
  selectedCharacterId?: string;
  onSelectRole: (role: UserRole, characterId?: string) => void;
  worldClock: MasterWorldClock;
  onAdvanceTime: (mins: number) => void;
  onTogglePauseClock: () => void;
  onOpenAudit: () => void;
  runtimeStatusText?: string;
  isUsingDemoClient?: boolean;
  onToggleClientMode?: (useDemo: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  operatingMode,
  onSelectOperatingMode,
  currentRole,
  selectedCharacterId,
  onSelectRole,
  worldClock,
  onAdvanceTime,
  onTogglePauseClock,
  onOpenAudit,
  runtimeStatusText,
  isUsingDemoClient = true,
  onToggleClientMode,
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);

  const activeModeConfig = OPERATING_MODES_CONFIG.find((m) => m.id === operatingMode) || OPERATING_MODES_CONFIG[1];

  return (
    <header className="w-full bg-neutral-950 border-b border-neutral-800 text-neutral-200 select-none sticky top-0 z-40">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Core Area Navigation */}
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

          {/* 3 Main Application Areas */}
          <nav className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800" aria-label="Main Navigation">
            <button
              onClick={() => onSelectTab('play')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'play'
                  ? 'bg-amber-600/20 text-amber-200 border border-amber-600/50 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Play / Host</span>
            </button>
            <button
              onClick={() => onSelectTab('planning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'planning'
                  ? 'bg-amber-600/20 text-amber-200 border border-amber-600/50 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>DM Planning</span>
            </button>
            <button
              onClick={() => onSelectTab('workshop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'workshop'
                  ? 'bg-amber-600/20 text-amber-200 border border-amber-600/50 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Homebrew Workshop</span>
            </button>
          </nav>
        </div>

        {/* Center: Master World Clock */}
        <div className="relative flex items-center">
          <div
            onClick={() => setShowTimeControls(!showTimeControls)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowTimeControls(!showTimeControls)}
            aria-label="Toggle Master World Clock Controls"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-amber-700/60 transition-colors cursor-pointer text-xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-semibold text-neutral-100">{worldClock.calendar.timeString}</span>
            <span className="text-neutral-400 font-medium">({worldClock.calendar.timeOfDay})</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 hidden lg:inline">{worldClock.calendar.monthName} {worldClock.calendar.dayOfMonth}</span>
            <span className="text-neutral-600 hidden lg:inline">•</span>
            <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
              <CloudFog className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden xl:inline">{worldClock.weather.condition}</span>
            </div>
            {worldClock.isPaused && (
              <span className="text-[10px] uppercase font-mono px-1 rounded bg-red-950 text-red-300 border border-red-800">
                Paused
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </div>

          {/* Time Controls Popover */}
          {showTimeControls && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-72 p-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-neutral-400 pb-1.5 border-b border-neutral-800">
                <span className="font-semibold text-neutral-200">Master World Clock</span>
                <span className="font-mono text-[11px]">Day {worldClock.calendar.dayOfMonth}, Year {worldClock.calendar.year}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Minute-resolution timeline: <span className="font-mono text-amber-300">{worldClock.totalWorldMinutes} mins</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onAdvanceTime(15)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center transition-colors font-mono"
                >
                  +15 Mins
                </button>
                <button
                  onClick={() => onAdvanceTime(60)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center transition-colors font-mono"
                >
                  +1 Hour
                </button>
                <button
                  onClick={() => onAdvanceTime(480)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center transition-colors font-mono"
                >
                  +8 Hours
                </button>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={onTogglePauseClock}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium w-full justify-center transition-colors ${
                    worldClock.isPaused
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                      : 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                  }`}
                >
                  {worldClock.isPaused ? (
                    <>
                      <Play className="w-3 h-3" /> Resume Time Flow
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" /> Pause World Clock
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Operating Mode & Role Switcher & Audit Register */}
        <div className="flex items-center gap-2">
          {/* Operating Mode Dropdown */}
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

          {/* Role & Perspective Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 text-xs transition-colors"
              aria-label="Select Player or DM Perspective"
            >
              {currentRole === 'dm_host' ? (
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="font-medium text-neutral-200">
                {currentRole === 'dm_host'
                  ? 'DM (Host View)'
                  : selectedCharacterId === 'char-lyra'
                  ? 'Lyra (Player)'
                  : 'Kaelen (Player)'}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-60 p-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  Perspective / Client Filter
                </div>
                <button
                  onClick={() => {
                    onSelectRole('dm_host');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-center justify-between ${
                    currentRole === 'dm_host'
                      ? 'bg-amber-950/70 text-amber-200 border border-amber-700/50'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="font-semibold">Dungeon Master (Host)</div>
                      <div className="text-[10px] text-neutral-400">Full visibility of secrets & notes</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSelectRole('player', 'char-kaelen');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-center justify-between ${
                    currentRole === 'player' && selectedCharacterId === 'char-kaelen'
                      ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-700/50'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Kaelen (Player Safe)</div>
                      <div className="text-[10px] text-neutral-400">DM secrets & hidden tokens masked</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSelectRole('player', 'char-lyra');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-center justify-between ${
                    currentRole === 'player' && selectedCharacterId === 'char-lyra'
                      ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-700/50'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="font-semibold">Lyra (Player Safe)</div>
                      <div className="text-[10px] text-neutral-400">DM secrets & hidden tokens masked</div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Honest Architecture & Runtime Status Badge */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAudit}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors ${
                isUsingDemoClient
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-red-950/60 border-red-700 text-red-300 hover:bg-red-900/60'
              }`}
              title="Inspect Architectural Feature Register (AIUI-CP001)"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {isUsingDemoClient
                  ? 'DEMO MODE — IN-MEMORY STATE — PYTHON RUNTIME NOT CONNECTED'
                  : 'PYTHON RUNTIME GATEWAY: NOT CONNECTED'}
              </span>
              <span className="xl:hidden font-bold">
                {isUsingDemoClient ? 'DEMO (EPHEMERAL)' : 'PYTHON (DISCONNECTED)'}
              </span>
            </button>
            {onToggleClientMode && (
              <button
                onClick={() => onToggleClientMode(!isUsingDemoClient)}
                className="px-2 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Toggle between in-memory Demo Client and disconnected Python Runtime Gateway"
              >
                {isUsingDemoClient ? 'Test Gateway' : 'Return to Demo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
