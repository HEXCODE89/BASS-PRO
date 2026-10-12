import React from 'react';
import {Power, RotateCcw, Save} from 'lucide-react';
import {FACTORY_PRESETS, PluginParameters, Preset} from '../types/plugin';

interface RackHeaderProps {
  currentPresetId: string;
  userPresets: Preset[];
  params: PluginParameters;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onSelectPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onResetDefault: () => void;
  onToggleBypass: () => void;
  onOpenReaPackModal: () => void;
}

export const RackHeader: React.FC<RackHeaderProps> = ({
  currentPresetId,
  userPresets,
  params,
  isPlaying = false,
  onTogglePlay,
  onSelectPreset,
  onSavePreset,
  onResetDefault,
  onToggleBypass,
  onOpenReaPackModal,
}) => {
  const allPresets = [...FACTORY_PRESETS, ...userPresets];

  return (
    <div className="relative w-full bg-gradient-to-b from-[#1e2227] via-[#16181d] to-[#111316] border-b border-slate-700/80 px-5 py-3 shadow-md">
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        {/* Left: Clean BASS PRO Branding */}
        <div className="flex items-center gap-3">
          {/* Rack Ear Screw */}
          <div className="hidden sm:flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-800 border border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <div className="w-2.5 h-[1.5px] bg-slate-950 rotate-45" />
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BASS PRO
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              DSP
            </span>
          </div>
        </div>

        {/* Center: Simplified Presets & Audition Button */}
        <div className="flex items-center gap-2 bg-[#0a0c0f] p-1 rounded-lg border border-slate-800 shadow-inner">
          <select
            value={currentPresetId}
            onChange={(e) => {
              const p = allPresets.find((item) => item.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="bg-[#14161a] text-cyan-300 font-mono text-xs font-semibold px-2.5 py-1 rounded border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <optgroup label="Presets">
              {FACTORY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            {userPresets.length > 0 && (
              <optgroup label="Custom">
                {userPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            onClick={onSavePreset}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Save preset"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetDefault}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Master Bypass & Right Screw */}
        <div className="flex items-center gap-2.5">
          {/* Master Bypass Button */}
          <button
            onClick={onToggleBypass}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              params.bypass
                ? 'bg-red-950/90 text-red-300 border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-emerald-950/90 text-emerald-300 border-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            }`}
            title="A/B Master Bypass"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{params.bypass ? 'BYPASS' : 'ACTIVE'}</span>
          </button>

          {/* Right Rack Screw */}
          <div className="hidden sm:flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-800 border border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <div className="w-2.5 h-[1.5px] bg-slate-950 -rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};
