import React from 'react';

interface MiniToggleProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  isRight: boolean;
  onToggle: () => void;
}

export const MiniToggle: React.FC<MiniToggleProps> = ({
  label,
  leftLabel,
  rightLabel,
  isRight,
  onToggle,
}) => {
  return (
    <div className="flex flex-col items-center select-none">
      <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-1">
        {label}
      </span>

      {/* Switch body */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1 bg-[#0c0e11] hover:bg-[#14161a] border border-slate-700/80 rounded-md transition-all cursor-pointer shadow-inner"
        title={`Toggle ${label}`}
      >
        <span
          className={`text-[8px] font-mono font-bold transition-colors ${
            !isRight ? 'text-cyan-400 font-extrabold' : 'text-slate-500'
          }`}
        >
          {leftLabel}
        </span>

        {/* Chrome Bat Switch Lever */}
        <div className="relative w-7 h-3.5 bg-[#181a1f] rounded-full border border-slate-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] flex items-center p-0.5">
          <div
            className={`w-3 h-2.5 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform duration-150 ${
              isRight ? 'translate-x-3.5 bg-gradient-to-b from-cyan-200 via-cyan-400 to-cyan-600' : 'translate-x-0'
            }`}
          />
        </div>

        <span
          className={`text-[8px] font-mono font-bold transition-colors ${
            isRight ? 'text-cyan-400 font-extrabold' : 'text-slate-500'
          }`}
        >
          {rightLabel}
        </span>
      </button>
    </div>
  );
};
