import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
} from 'lucide-react';
import { v2BackendClient } from '../../services/v2BackendClient.ts';

interface Props {
  activeSpeakerName?: string;
  lastDialogueText?: string;
}

export const VadAllVoxBar: React.FC<Props> = ({
  activeSpeakerName = 'Brother Vaelin',
  lastDialogueText = '“The Third Age seals were never designed to withstand this much pressure!”',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('dm-narrator');
  const [playbackProgress, setPlaybackProgress] = useState(42);
  const [ttsEngineLabel, setTtsEngineLabel] = useState('VadAllVox TTS');

  const voices = [
    { id: 'dm-narrator', name: 'Archivist Narrator (Chatterbox Nano • Baritone)', engine: 'Chatterbox-Nano' },
    { id: 'npc-scholar', name: 'Jorren Vale / Highgate Scholar (Articulate)', engine: 'Chatterbox-Nano' },
    { id: 'npc-gruff', name: 'Veteran Mercenary / Guard (Gravelly)', engine: 'Chatterbox-Nano' },
    { id: 'npc-mystic', name: 'Planar Oracle / Seer (Harmonic)', engine: 'Chatterbox-Nano' },
    { id: 'system-herald', name: 'Tactical Rules Herald (Neutral)', engine: 'LocalTTS' },
  ];

  const handlePlayToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    setPlaybackProgress(75);
    const res = await v2BackendClient.synthesizeSpeech(lastDialogueText, selectedVoice);
    setTtsEngineLabel(`${res.backend_used} (${res.duration_sec}s)`);

    if (!isMuted && typeof Audio !== 'undefined' && res.audio_data_url) {
      try {
        const audio = new Audio(res.audio_data_url);
        audio.onended = () => setIsPlaying(false);
        void audio.play().catch(() => {
          // Headless/jsdom environment without audio output device
        });
      } catch {
        // Headless test fallback
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  return (
    <div className="w-full bg-neutral-950 border-t border-neutral-800 px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-300">
      {/* Left: Speaker identity & Engine tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800">
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-neutral-200">{activeSpeakerName}</span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800">
            {ttsEngineLabel}
          </span>
        </div>

        {/* Voice Selector */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-500 font-mono">Voice:</span>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-amber-600"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Dialogue Snippet & Simulated Waveform / Progress */}
      <div className="flex-1 max-w-xl hidden md:flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[11px] text-neutral-300 italic truncate max-w-md">
            {lastDialogueText}
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden mt-1 relative">
            <div
              className={`h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{ width: `${isPlaying ? playbackProgress : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Audio Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayToggle}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            isPlaying
              ? 'bg-amber-950 text-amber-300 border border-amber-600'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
          }`}
          title={isPlaying ? 'Pause Voice Playback' : 'Preview Voice Playback'}
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isPlaying ? 'Playing' : 'Preview'}</span>
        </button>

        <button
          onClick={handleStop}
          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
          title="Interrupt & Stop Playback"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
