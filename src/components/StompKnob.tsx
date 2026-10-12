import React, {useCallback, useRef, useState} from 'react';

interface StompKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  glowColor?: 'cyan' | 'amber' | 'white';
  onChange: (val: number) => void;
}

export const StompKnob: React.FC<StompKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  size = 'md',
  glowColor = 'cyan',
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(0);

  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
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
      const deltaY = dragStartY.current - e.clientY;
      const sensitivity = (max - min) / 120;
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

  const sizePx = size === 'sm' ? 44 : size === 'lg' ? 62 : 52;

  const pointerColor = {
    cyan: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
    amber: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
    white: 'bg-slate-100 shadow-[0_0_6px_#ffffff]',
  }[glowColor];

  return (
    <div className="flex flex-col items-center select-none group">
      {/* Knob Label */}
      <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase mb-1">
        {label}
      </span>

      {/* Rotary Dial */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="relative cursor-ns-resize touch-none flex items-center justify-center"
        style={{width: `${sizePx + 10}px`, height: `${sizePx + 10}px`}}
      >
        {/* Recessed metal rim base */}
        <div className="absolute inset-1 rounded-full bg-[#0a0b0d] border border-slate-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />

        {/* Machined Aluminum Knob Body */}
        <div
          className={`relative rounded-full border border-slate-600 shadow-[0_4px_8px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all ${
            isDragging ? 'ring-1 ring-cyan-400/60 scale-105' : 'group-hover:border-slate-400'
          }`}
          style={{
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            transform: `rotate(${angle}deg)`,
            background: 'conic-gradient(from 0deg, #27272a, #3f3f46, #18181b, #52525b, #27272a)',
          }}
        >
          {/* Inner concentric machined ring */}
          <div className="absolute inset-1.5 rounded-full bg-gradient-to-b from-[#222326] to-[#141518] border border-slate-700/60" />

          {/* White / Glow Pointer Line */}
          <div
            className={`absolute top-0.5 left-1/2 -translate-x-1/2 w-[2px] h-3 rounded-full ${pointerColor}`}
          />
        </div>
      </div>

      {/* Numerical Value Readout */}
      <span className="mt-1 text-[9px] font-mono text-slate-400 tabular-nums">
        {value > 0 && unit === 'dB' ? `+${value}` : value}
        {unit}
      </span>
    </div>
  );
};
