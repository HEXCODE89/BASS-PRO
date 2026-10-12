import React, {useState} from 'react';

interface FootswitchProps {
  isActive: boolean;
  onStomp: () => void;
}

export const Footswitch: React.FC<FootswitchProps> = ({isActive, onStomp}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onStomp();
    setTimeout(() => setIsPressed(false), 160);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Jewel Indicator Lamp */}
      <div className="flex flex-col items-center mb-3">
        <div
          className={`relative w-6 h-6 rounded-full border-2 border-slate-600 transition-all duration-200 flex items-center justify-center ${
            isActive
              ? 'bg-cyan-400 shadow-[0_0_16px_#06b6d4,0_0_32px_rgba(6,182,212,0.6)]'
              : 'bg-[#181a1f] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
          }`}
        >
          {/* Jewel glass facets */}
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isActive
                ? 'bg-gradient-to-tr from-cyan-200 via-white to-cyan-300'
                : 'bg-gradient-to-tr from-[#252830] to-[#121417]'
            }`}
          />
          {/* Glass glare highlight */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1 rounded-full bg-white/60 pointer-events-none" />
        </div>
        <span
          className={`text-[8px] font-mono font-bold tracking-widest uppercase mt-1 transition-colors ${
            isActive ? 'text-cyan-400' : 'text-slate-600'
          }`}
        >
          {isActive ? 'ENGAGED' : 'BYPASS'}
        </span>
      </div>

      {/* 3PDT Heavy-Duty Footswitch Button */}
      <button
        onClick={handleClick}
        className="relative group cursor-pointer focus:outline-none"
        title="Stomp to toggle Active / True Bypass"
      >
        {/* Hex Nut Collar Base */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 border-2 border-slate-500 flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]">
          {/* Inner Threaded Washer */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#181a1e] to-[#2b2d35] border border-slate-600 flex items-center justify-center shadow-inner">
            {/* The Metal Plunger Button */}
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-500 border border-slate-400 shadow-[0_4px_8px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.6)] flex items-center justify-center transition-transform duration-75 ${
                isPressed ? 'scale-90 translate-y-0.5' : 'group-hover:scale-95'
              }`}
            >
              {/* Concentric Grooves */}
              <div className="w-6 h-6 rounded-full border border-slate-400/80 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Engraved Stompbox Text */}
      <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase mt-2">
        TRUE BYPASS
      </span>
    </div>
  );
};
