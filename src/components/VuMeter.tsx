import React, {useEffect, useRef} from 'react';

interface VuMeterProps {
  label: string;
  valueDb: number; // -60 to +6 dB
  isClip?: boolean;
  gainReductionDb?: number; // 0 to -24 dB
  size?: 'sm' | 'md' | 'lg';
}

export const VuMeter: React.FC<VuMeterProps> = ({
  label,
  valueDb,
  gainReductionDb,
  size = 'md',
}) => {
  const needleRef = useRef<SVGGElement>(null);
  const smoothedRef = useRef(-60);

  // Ballistics: Fast attack, slower decay (VU standard ballistics ~300ms integration)
  useEffect(() => {
    let animId: number;
    const update = () => {
      const target = valueDb;
      const current = smoothedRef.current;
      const attackSpeed = 0.35;
      const decaySpeed = 0.08;

      if (target > current) {
        smoothedRef.current += (target - current) * attackSpeed;
      } else {
        smoothedRef.current += (target - current) * decaySpeed;
      }

      // Map dB to needle angle: -20dB is ~ -40deg, 0dB is ~ 0deg, +3dB is ~ +35deg
      // Clamped between -45deg and +45deg
      const normalized = Math.max(-20, Math.min(3, smoothedRef.current));
      const angle = ((normalized - (-20)) / (3 - (-20))) * 80 - 40;

      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${angle} 100 130)`);
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [valueDb]);

  const isPeakHot = valueDb > -0.5;
  const isGrActive = gainReductionDb !== undefined && gainReductionDb < -1.0;

  const width = size === 'sm' ? 140 : size === 'lg' ? 220 : 180;
  const height = size === 'sm' ? 85 : size === 'lg' ? 130 : 105;

  return (
    <div
      className="flex flex-col items-center bg-[#15171a] p-2 rounded-lg border border-slate-700/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
      style={{width: `${width}px`}}
    >
      {/* Analog Meter Glass Window */}
      <div
        className="relative w-full rounded overflow-hidden bg-gradient-to-b from-[#f9f5e8] via-[#ede6d1] to-[#ded4b8] border border-amber-900/30 shadow-[inset_0_3px_10px_rgba(0,0,0,0.4)]"
        style={{height: `${height}px`}}
      >
        {/* Subtle amber backlit glow */}
        <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent pointer-events-none" />

        <svg viewBox="0 0 200 140" className="w-full h-full">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="meterFace" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbf7ec" />
              <stop offset="100%" stopColor="#ded5bb" />
            </linearGradient>
            <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Scale Arc */}
          <path
            d="M 35 110 A 85 85 0 0 1 165 110"
            fill="none"
            stroke="#4a3e2a"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />

          {/* Red Zone (+0 to +3 dB) */}
          <path
            d="M 132 83 A 85 85 0 0 1 165 110"
            fill="none"
            stroke="#dc2626"
            strokeWidth="3.5"
          />

          {/* Scale Ticks & Numbers */}
          {/* -20 */}
          <line x1="42" y1="102" x2="49" y2="105" stroke="#3d3322" strokeWidth="1.5" />
          <text x="36" y="98" fontSize="8" fontFamily="monospace" fill="#5c4d34" fontWeight="bold">-20</text>

          {/* -10 */}
          <line x1="63" y1="88" x2="68" y2="93" stroke="#3d3322" strokeWidth="1.5" />
          <text x="56" y="84" fontSize="8" fontFamily="monospace" fill="#5c4d34" fontWeight="bold">-10</text>

          {/* -7 */}
          <line x1="80" y1="80" x2="84" y2="86" stroke="#3d3322" strokeWidth="1.5" />
          <text x="76" y="75" fontSize="8" fontFamily="monospace" fill="#5c4d34" fontWeight="bold">-7</text>

          {/* -5 */}
          <line x1="94" y1="76" x2="96" y2="83" stroke="#3d3322" strokeWidth="1.5" />
          <text x="91" y="70" fontSize="8" fontFamily="monospace" fill="#5c4d34" fontWeight="bold">-5</text>

          {/* -3 */}
          <line x1="108" y1="76" x2="108" y2="83" stroke="#3d3322" strokeWidth="1.5" />
          <text x="105" y="70" fontSize="8" fontFamily="monospace" fill="#5c4d34" fontWeight="bold">-3</text>

          {/* 0 */}
          <line x1="130" y1="82" x2="128" y2="89" stroke="#dc2626" strokeWidth="2" />
          <text x="127" y="76" fontSize="9" fontFamily="monospace" fill="#dc2626" fontWeight="bold">0</text>

          {/* +1, +2, +3 */}
          <line x1="145" y1="91" x2="141" y2="97" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="158" y1="103" x2="152" y2="108" stroke="#dc2626" strokeWidth="2" />
          <text x="156" y="99" fontSize="8" fontFamily="monospace" fill="#dc2626" fontWeight="bold">+3</text>

          {/* Center Brand Text in Meter */}
          <text x="100" y="105" textAnchor="middle" fontSize="8" fontFamily="sans-serif" fill="#7a6b52" letterSpacing="1">
            VU
          </text>
          <text x="100" y="115" textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#9c8c72">
            BASS PRO
          </text>

          {/* Moving Needle */}
          <g ref={needleRef} transform="rotate(-40 100 130)" filter="url(#needleShadow)">
            {/* Fine needle tip */}
            <line x1="100" y1="130" x2="100" y2="52" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="100" y1="62" x2="100" y2="52" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
          </g>

          {/* Pivot cap */}
          <circle cx="100" cy="130" r="14" fill="#292524" stroke="#44403c" strokeWidth="1.5" />
          <circle cx="100" cy="130" r="6" fill="#1c1917" />
          <circle cx="98" cy="128" r="2" fill="#78716c" opacity="0.6" />
        </svg>

        {/* Reflection sheen highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
      </div>

      {/* Meter Label & Peak LED */}
      <div className="w-full flex items-center justify-between px-1 mt-1.5 text-xs">
        <span className="font-semibold text-slate-300 text-[10px] tracking-wider uppercase font-mono">
          {label}
        </span>

        <div className="flex items-center gap-2">
          {/* Gain reduction indicator if provided */}
          {gainReductionDb !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-amber-500/80 font-mono">GR</span>
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isGrActive ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-800'
                }`}
              />
            </div>
          )}

          {/* Peak / Clip LED */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500 font-mono">CLIP</span>
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                isPeakHot ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-slate-800'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
