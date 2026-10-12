/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useState} from 'react';
import {
  audioEngine,
} from './audio/AudioEngine';
import {Footswitch} from './components/Footswitch';
import {MiniToggle} from './components/MiniToggle';
import {ReaPackModal} from './components/ReaPackModal';
import {StompKnob} from './components/StompKnob';
import {
  DEFAULT_PARAMS,
  FACTORY_PRESETS,
  PluginParameters,
  Preset,
} from './types/plugin';
import {FolderGit2, Pause, Play, RotateCcw, Volume2} from 'lucide-react';

export default function App() {
  const [params, setParams] = useState<PluginParameters>({...DEFAULT_PARAMS});
  const [currentPresetId, setCurrentPresetId] = useState<string>('default');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReaPackOpen, setIsReaPackOpen] = useState<boolean>(false);

  // Sync parameters with AudioEngine
  useEffect(() => {
    audioEngine.setParameters(params);
  }, [params]);

  // Load default DI riff and listen to playback state
  useEffect(() => {
    audioEngine.loadRiff('finger-groove').catch(console.error);
    audioEngine.setPlaybackStateListener((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const updateParam = <K extends keyof PluginParameters>(key: K, val: PluginParameters[K]) => {
    setParams((prev) => ({...prev, [key]: val}));
  };

  const handleSelectPreset = (preset: Preset) => {
    setCurrentPresetId(preset.id);
    setParams({...preset.params});
  };

  const handleResetDefault = () => {
    setParams({...DEFAULT_PARAMS});
    setCurrentPresetId('default');
  };

  const handleStomp = () => {
    updateParam('bypass', !params.bypass);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.ensureContextRunning();
      audioEngine.play();
    }
  };

  // Coordinated Bass tone controls for stompbox simplicity
  const handleBassChange = (val: number) => {
    setParams((prev) => ({
      ...prev,
      subBass: val,
      loBass: val,
    }));
  };

  const handleMidChange = (val: number) => {
    setParams((prev) => ({
      ...prev,
      articulation: val,
      fullness: -val * 0.5,
    }));
  };

  const handleTrebleChange = (val: number) => {
    setParams((prev) => ({
      ...prev,
      presence: val,
      treble: val * 0.7,
    }));
  };

  const isPedalActive = !params.bypass;

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col justify-between items-center py-6 px-4 selection:bg-cyan-500 selection:text-black">
      {/* Top Floating Utility Bar (Audition & Presets) */}
      <header className="w-full max-w-[460px] flex items-center justify-between gap-2 bg-[#101216] border border-slate-800/80 px-3.5 py-2 rounded-xl shadow-lg">
        {/* Play / Pause Audition Button */}
        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
            isPlaying
              ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
              : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:bg-cyan-900/80'
          }`}
          title={isPlaying ? 'Pause Bass DI Groove' : 'Play Bass DI Groove through pedal'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'PAUSE DI' : 'AUDITION DI'}</span>
        </button>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentPresetId}
            onChange={(e) => {
              const p = FACTORY_PRESETS.find((item) => item.id === e.target.value);
              if (p) handleSelectPreset(p);
            }}
            className="bg-[#181a20] text-cyan-300 font-mono text-[11px] font-semibold px-2 py-1 rounded border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {FACTORY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.replace('BASS PRO ', '')}
              </option>
            ))}
          </select>

          <button
            onClick={handleResetDefault}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset pedal controls"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* REAPER Install / ReaPack Button */}
        <button
          onClick={() => setIsReaPackOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 transition-colors shadow-[0_0_8px_rgba(6,182,212,0.2)]"
          title="Install in REAPER (Direct JSFX or ReaPack)"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">Install</span>
        </button>
      </header>

      {/* Main Single Stompbox Unit */}
      <main className="my-auto py-4 flex items-center justify-center w-full">
        <div className="relative w-full max-w-[420px]">
          {/* Side 1/4" Input Jack Socket (Right) */}
          <div className="hidden sm:flex flex-col items-center absolute -right-5 top-40 translate-x-1/2 z-0">
            <div className="w-4 h-8 bg-gradient-to-r from-slate-400 via-slate-600 to-slate-800 rounded-r-md border border-slate-500 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-[#0a0c0f] rounded-sm" />
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase">IN</span>
          </div>

          {/* Side 1/4" Output Jack Socket (Left) */}
          <div className="hidden sm:flex flex-col items-center absolute -left-5 top-40 -translate-x-1/2 z-0">
            <div className="w-4 h-8 bg-gradient-to-l from-slate-400 via-slate-600 to-slate-800 rounded-l-md border border-slate-500 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-[#0a0c0f] rounded-sm" />
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase">OUT</span>
          </div>

          {/* The Stompbox Enclosure */}
          <div className="relative z-10 w-full rounded-2xl bg-gradient-to-b from-[#22252b] via-[#181a1f] to-[#121316] border-2 border-slate-600/80 shadow-[0_24px_60px_rgba(0,0,0,0.95),_inset_0_1px_2px_rgba(255,255,255,0.25)] p-6 sm:p-7 flex flex-col justify-between">
            {/* 4 Corner Hex Mounting Bolts */}
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-500 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-900 rotate-45" />
            </div>
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-500 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-900 -rotate-45" />
            </div>
            <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-500 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-900 -rotate-30" />
            </div>
            <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-500 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-900 rotate-60" />
            </div>

            {/* Pedal Header: Brand & Identity */}
            <div className="text-center pb-4 mb-4 border-b border-slate-800">
              <h1 className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                BASS PRO
              </h1>
              <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-400/90 font-bold uppercase mt-0.5">
                HARMONIC DYNAMICS
              </p>
            </div>

            {/* Row 1: Primary Hero Knobs (PROFESS, DIRT, LEVEL) */}
            <div className="grid grid-cols-3 gap-2 justify-items-center mb-5">
              <StompKnob
                label="PROFESS"
                value={params.profess}
                min={0}
                max={100}
                step={1}
                defaultValue={45}
                unit="%"
                size="lg"
                glowColor="cyan"
                onChange={(val) => updateParam('profess', val)}
              />

              <StompKnob
                label="DIRT"
                value={params.dirt}
                min={0}
                max={100}
                step={1}
                defaultValue={20}
                unit="%"
                size="lg"
                glowColor="amber"
                onChange={(val) => updateParam('dirt', val)}
              />

              <StompKnob
                label="LEVEL"
                value={params.outputTrim}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={0}
                unit="dB"
                size="lg"
                glowColor="white"
                onChange={(val) => updateParam('outputTrim', val)}
              />
            </div>

            {/* Row 2: Secondary Tone & Blend Knobs (BASS, MID, TREBLE, BLEND) */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2 justify-items-center mb-5 bg-[#0e1013] p-3 rounded-xl border border-slate-800/80 shadow-inner">
              <StompKnob
                label="BASS"
                value={params.loBass}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={2.0}
                unit="dB"
                size="sm"
                glowColor="cyan"
                onChange={handleBassChange}
              />

              <StompKnob
                label="MID"
                value={params.articulation}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={2.5}
                unit="dB"
                size="sm"
                glowColor="cyan"
                onChange={handleMidChange}
              />

              <StompKnob
                label="TREBLE"
                value={params.presence}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={1.8}
                unit="dB"
                size="sm"
                glowColor="cyan"
                onChange={handleTrebleChange}
              />

              <StompKnob
                label="BLEND"
                value={params.mix}
                min={0}
                max={100}
                step={1}
                defaultValue={100}
                unit="%"
                size="sm"
                glowColor="white"
                onChange={(val) => updateParam('mix', val)}
              />
            </div>

            {/* Row 3: Mini Bat Toggle Switches (LF CUT & ATTACK) */}
            <div className="flex items-center justify-around mb-6 px-4">
              <MiniToggle
                label="LF CUT"
                leftLabel="FLAT"
                rightLabel="30Hz"
                isRight={params.lfCutEnabled}
                onToggle={() => updateParam('lfCutEnabled', !params.lfCutEnabled)}
              />

              <MiniToggle
                label="ATTACK"
                leftLabel="PUNCH"
                rightLabel="FAST"
                isRight={params.transients === 'fast'}
                onToggle={() =>
                  updateParam(
                    'transients',
                    params.transients === 'dynamic' ? 'fast' : 'dynamic'
                  )
                }
              />
            </div>

            {/* Row 4: Footswitch & Jewel LED Area */}
            <div className="pt-2 flex justify-center">
              <Footswitch
                isActive={isPedalActive}
                onStomp={handleStomp}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="text-center text-[11px] font-mono text-slate-600 mt-2">
        BASS PRO · Stompbox Edition · Web Audio DSP
      </footer>

      {/* ReaPack Repository Template Modal */}
      <ReaPackModal
        isOpen={isReaPackOpen}
        onClose={() => setIsReaPackOpen(false)}
      />
    </div>
  );
}
