import React, {useCallback, useEffect, useRef, useState} from 'react';

interface FaderProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  height?: number;
  glowColor?: 'cyan' | 'amber' | 'emerald' | 'blue' | 'slate';
  accent?: boolean;
  onChange: (val: number) => void;
}

export const Fader: React.FC<FaderProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 0.5,
  defaultValue = 0,
  unit = 'dB',
  height = 180,
  glowColor = 'slate',
  accent = false,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Normalized 0 to 1 (0 = bottom = min, 1 = top = max)
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateFromPointer = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // Invert Y: top is max, bottom is min
    const relY = clientY - rect.top;
    const rawNorm = 1 - Math.max(0, Math.min(1, relY / rect.height));
    const rawVal = min + rawNorm * (max - min);

    // Snap to step
    const stepped = Math.round(rawVal / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(Number(clamped.toFixed(1)));
  }, [min, max, step, onChange]);

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === 'ArrowUp') delta = step;
    else if (e.key === 'ArrowDown') delta = -step;
    else if (e.key === 'PageUp') delta = step * 4;
    else if (e.key === 'PageDown') delta = -step * 4;
    else if (e.key === 'Home') {
      onChange(max);
      return;
    } else if (e.key === 'End') {
      onChange(min);
      return;
    }

    if (delta !== 0) {
      e.preventDefault();
      const next = Math.max(min, Math.min(max, Number((value + delta).toFixed(1))));
      onChange(next);
    }
  };

  // Color mappings
  const glowClasses = {
    cyan: 'bg-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.8)]',
    amber: 'bg-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    emerald: 'bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
    blue: 'bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.8)]',
    slate: 'bg-slate-400/80 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
  }[glowColor];

  const trackFillClasses = {
    cyan: 'from-cyan-500/40 via-cyan-500/20 to-transparent',
    amber: 'from-amber-500/40 via-amber-500/20 to-transparent',
    emerald: 'from-emerald-500/40 via-emerald-500/20 to-transparent',
    blue: 'from-blue-500/40 via-blue-500/20 to-transparent',
    slate: 'from-slate-500/30 via-slate-500/10 to-transparent',
  }[glowColor];

  // Tick marks: generate calibrated ticks
  const isZeroCentered = min < 0 && max > 0;

  return (
    <div
      className={`flex flex-col items-center select-none ${
        accent ? 'px-2 py-1 bg-slate-900/40 rounded-lg border border-slate-700/50' : 'px-1'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label={`${label} ${sublabel || ''}`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {/* Label and Sublabel */}
      <div className="text-center mb-1.5">
        <div
          className={`font-bold tracking-tight text-xs uppercase leading-tight ${
            accent ? 'text-amber-300 font-mono text-[11px]' : 'text-slate-200'
          }`}
        >
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">
            {sublabel}
          </div>
        )}
      </div>

      {/* Fader Track & Cap Container */}
      <div className="flex items-center gap-1.5">
        {/* Left Scale Marks */}
        <div
          className="flex flex-col justify-between text-[8px] font-mono text-slate-500 select-none py-1 text-right"
          style={{height: `${height}px`, width: '18px'}}
        >
          <span>{max > 0 ? `+${max}` : max}</span>
          {isZeroCentered && <span>0</span>}
          <span>{min}</span>
        </div>

        {/* The Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className="relative cursor-ns-resize group touch-none"
          style={{height: `${height}px`, width: '38px'}}
        >
          {/* Fader Slot (Recessed Metal Groove) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-2 bg-[#090b0d] rounded-full border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Illuminated fill line rising from bottom (or center if zero-centered) */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${trackFillClasses} transition-all duration-75`}
              style={{height: `${norm * 100}%`}}
            />
          </div>

          {/* Center Detent Marker if zero-centered */}
          {isZeroCentered && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-4 h-0.5 bg-slate-600/70 pointer-events-none"
              style={{
                top: `${(1 - (0 - min) / (max - min)) * 100}%`,
              }}
            />
          )}

          {/* Fader Knob Cap */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.4)] border border-slate-600/80 transition-transform ${
              isDragging ? 'scale-105 ring-1 ring-cyan-400/50' : 'hover:scale-[1.02]'
            }`}
            style={{
              // Center cap on the normalized position
              top: `calc(${100 - norm * 100}% - 16px)`,
              background: 'linear-gradient(180deg, #52525b 0%, #27272a 40%, #18181b 50%, #27272a 60%, #3f3f46 100%)',
            }}
          >
            {/* Grip Ridges on Fader Cap */}
            <div className="absolute inset-x-1 top-1.5 flex flex-col gap-0.5 items-center pointer-events-none">
              <div className="w-5 h-[1px] bg-white/20" />
              <div className="w-5 h-[1px] bg-black/50" />
              <div className="w-5 h-[1px] bg-white/20" />
            </div>

            {/* Center Illuminated Indicator Line */}
            <div
              className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2.5px] ${glowClasses}`}
            />

            <div className="absolute inset-x-1 bottom-1.5 flex flex-col gap-0.5 items-center pointer-events-none">
              <div className="w-5 h-[1px] bg-black/50" />
              <div className="w-5 h-[1px] bg-white/20" />
            </div>
          </div>
        </div>

        {/* Right Scale Hash Ticks */}
        <div
          className="flex flex-col justify-between py-2 text-slate-600"
          style={{height: `${height}px`}}
        >
          <div className="w-1.5 h-[1px] bg-slate-600" />
          <div className="w-1 h-[1px] bg-slate-700" />
          <div className="w-2 h-[1px] bg-slate-500" />
          <div className="w-1 h-[1px] bg-slate-700" />
          <div className="w-1.5 h-[1px] bg-slate-600" />
        </div>
      </div>

      {/* Numerical Value Readout */}
      <div className="mt-1.5 px-2 py-0.5 bg-[#090b0d] border border-slate-800 rounded text-center w-full min-w-[48px]">
        <span className="font-mono text-[10px] text-cyan-300 font-semibold tabular-nums">
          {value > 0 && unit === 'dB' ? `+${value.toFixed(1)}` : value.toFixed(1)}
        </span>
        <span className="text-[9px] text-slate-500 ml-0.5 font-mono">{unit}</span>
      </div>
    </div>
  );
};
