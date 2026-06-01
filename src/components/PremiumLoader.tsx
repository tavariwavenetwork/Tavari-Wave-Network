import React from 'react';

export default function PremiumLoader() {
  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center relative overflow-hidden select-none">
      {/* Premium ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center">
        {/* SVG Circle Loader with Solid / Dotted segments that rotate */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Rotating Dotted Ring */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 6"
              strokeOpacity="0.4"
              className="origin-center"
            />
          </svg>

          {/* Rotating Solid Ring */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#A855F7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="40 180"
              strokeOpacity="0.8"
              className="origin-center"
            />
          </svg>

          {/* Website Logo in center with elegant pulsate/glow animation */}
          <div className="absolute w-14 h-14 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite] transition-all duration-1000">
            <img 
              src="https://i.imgur.com/wU33xy3.png" 
              alt="Tavari Wave Network Logo" 
              className="w-11 h-11 object-contain brightness-110 drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            />
          </div>
        </div>

        {/* Premium Minimal Text Elements */}
        <div className="mt-8 text-center space-y-1">
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white font-sans">
            Tavari Wave Network
          </h1>
          <span className="text-[9px] font-black tracking-[0.35em] uppercase text-emerald-400/60 italic font-sans antialiased animate-pulse block">
            Ecosystem Loading
          </span>
        </div>
      </div>
    </div>
  );
}
