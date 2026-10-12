import React, {useCallback, useRef, useState} from 'react';

interface KnobProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  glowColor?: 'cyan' | 'amber' | 'emerald' | 'blue' | 'slate';
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  size = 'md',
  glowColor = 'amber',
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(0);

  // Normalized: 0 to 1
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Angle: -135deg to +135deg (total 270 deg)
  const angle = -135 + norm * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = value;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.clientY; // upward drag increases value
      const sensitivity = (max - min) / 140; // ~140px vertical drag traverses full range
      let newVal = dragStartVal.current + deltaY * sensitivity;

      newVal = Math.round(newVal / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(Number(newVal.toFixed(1)));
    },
    [isDragging, max, min, step, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') delta = step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') delta = -step;
    if (delta !== 0) {
      e.preventDefault();
      const next = Math.max(min, Math.min(max, Number((value + delta).toFixed(1))));
      onChange(next);
    }
  };

  const sizePixels = size === 'sm' ? 42 : size === 'lg' ? 64 : 52;

  const pointerColorClass = {
    amber: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
    blue: 'bg-blue-400 shadow-[0_0_8px_#3b82f6]',
    slate: 'bg-slate-300 shadow-[0_0_6px_#cbd5e1]',
  }[glowColor];

  return (
    <div
      className="flex flex-col items-center select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="text-center mb-1">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-tight font-mono">
          {label}
        </div>
        {sublabel && (
          <div className="text-[9px] text-slate-500 font-mono tracking-tight leading-none">
            {sublabel}
          </div>
        )}
      </div>

      {/* Rotary Dial */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="relative cursor-ns-resize group touch-none"
        style={{width: `${sizePixels + 12}px`, height: `${sizePixels + 12}px`}}
      >
        {/* Outer Ring Bezel */}
        <div className="absolute inset-1 rounded-full bg-[#111316] border border-slate-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),_0_2px_4px_rgba(0,0,0,0.6)]" />

        {/* Knob Body */}
        <div
          className={`absolute rounded-full border border-slate-500/80 shadow-[0_3px_8px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform duration-75 ${
            isDragging ? 'ring-1 ring-amber-400/60' : 'group-hover:border-slate-400'
          }`}
          style={{
            inset: '8px',
            transform: `rotate(${angle}deg)`,
            background: 'conic-gradient(from 0deg, #27272a, #3f3f46, #27272a, #52525b, #27272a)',
          }}
        >
          {/* Subtle machined center indent */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#18181b] to-[#27272a] border border-slate-700/50" />

          {/* Pointer Tick */}
          <div
            className={`absolute top-0.5 left-1/2 -translate-x-1/2 w-[2.5px] h-3 rounded-full ${pointerColorClass}`}
          />
        </div>
      </div>

      {/* Value Display */}
      <div className="mt-1 px-1.5 py-0.5 bg-[#090b0d] border border-slate-800 rounded text-center min-w-[42px]">
        <span className="font-mono text-[10px] text-amber-300 font-semibold tabular-nums">
          {value > 0 && unit === 'dB' ? `+${value}` : value}
        </span>
        <span className="text-[9px] text-slate-500 ml-0.5 font-mono">{unit}</span>
      </div>
    </div>
  );
};
