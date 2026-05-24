import React, { useState, useEffect } from 'react';

// Premium glass-morphic accent ring for icons
export const IconGlowWrapper = ({ children, color = 'emerald' }: { children: React.ReactNode, color?: 'emerald' | 'red' | 'blue' | 'purple' }) => {
  const glowStyles = {
    emerald: 'bg-[#10B981]/10 border-[#10B981]/25 hover:border-[#10B981]/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    red: 'bg-[#EF4444]/10 border-[#EF4444]/25 hover:border-[#EF4444]/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]',
    blue: 'bg-[#3B82F6]/10 border-[#3B82F6]/25 hover:border-[#3B82F6]/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]',
    purple: 'bg-[#8B5CF6]/10 border-[#8B5CF6]/25 hover:border-[#8B5CF6]/50 shadow-[0_0_25px_rgba(139,92,246,0.15)]',
  };

  return (
    <div className={`w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[24px] border flex items-center justify-center mb-1 lg:mb-6 transition-all duration-500 hover:scale-105 active:scale-95 ${glowStyles[color]} relative group overflow-hidden`}>
      {/* Dynamic ambient hover background sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-white/[0.03] to-white/[0.1] transition-opacity duration-500 pointer-events-none" />
      {children}
    </div>
  );
};

export const PremiumFundingIcon = () => {
  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 lg:w-14 lg:h-14 drop-shadow-[0_4px_12px_rgba(16,185,129,0.25)] select-none pointer-events-none"
    >
      <defs>
        <linearGradient id="goldPlate" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="25%" stopColor="#FFE15D" />
          <stop offset="50%" stopColor="#E2A612" />
          <stop offset="75%" stopColor="#FFDC51" />
          <stop offset="100%" stopColor="#966C05" />
        </linearGradient>
        
        <linearGradient id="emeraldCore" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="metallicBack" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#252A37" />
          <stop offset="50%" stopColor="#131722" />
          <stop offset="100%" stopColor="#080A0F" />
        </linearGradient>

        <linearGradient id="goldAccent" x1="35" y1="35" x2="65" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE79A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <radialGradient id="highLight" cx="35" cy="35" r="30" fx="35" fy="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Base plate with 3D shadow chamfer */}
      <circle cx="50" cy="51" r="38" fill="black" opacity="0.6" filter="blur(2px)" />
      <circle cx="50" cy="50" r="38" fill="url(#metallicBack)" stroke="#2D3748" strokeWidth="1.5" />
      
      {/* Outer Golden Concentric Precision Ridge */}
      <circle cx="50" cy="50" r="34" stroke="url(#goldPlate)" strokeWidth="1.2" strokeDasharray="140 10 40 10" className="animate-[spin_40s_linear_infinite]" />
      <circle cx="50" cy="50" r="31" stroke="#10B981" strokeWidth="0.5" strokeOpacity="0.4" />

      {/* Embedded High-Tech Circuit Board Interconnections */}
      <path d="M 32 32 L 40 40 L 40 45" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="32" cy="32" r="1.5" fill="#10B981" className="animate-pulse" />

      <path d="M 68 32 L 60 40 L 60 45" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="68" cy="32" r="1.5" fill="#10B981" className="animate-pulse" />

      <path d="M 28 50 L 38 50" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="28" cy="50" r="1.5" fill="#10B981" />

      <path d="M 72 50 L 62 50" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="72" cy="50" r="1.5" fill="#10B981" />

      <path d="M 32 68 L 40 60 L 40 55" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="32" cy="68" r="1.5" fill="#10B981" className="animate-pulse" />

      {/* Central 3D High-End Gold/Emerald Node Cylinder */}
      <circle cx="50" cy="50" r="22" fill="#0A0F1D" stroke="url(#goldPlate)" strokeWidth="2" />
      <circle cx="50" cy="50" r="17" fill="url(#emeraldCore)" />
      
      {/* Gold Crown Vault Handle / Star Details in Center */}
      <path d="M 44 44 L 56 44 L 56 56 L 44 56 Z" fill="none" stroke="url(#goldPlate)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="4.5" fill="url(#goldAccent)" stroke="#111827" strokeWidth="1" />
      
      {/* Corner Vault Bolts representing ultra-realistic luxury finish */}
      <circle cx="44" cy="44" r="1.2" fill="white" />
      <circle cx="56" cy="44" r="1.2" fill="white" />
      <circle cx="56" cy="56" r="1.2" fill="white" />
      <circle cx="44" cy="56" r="1.2" fill="white" />

      {/* Realistic light glare reflection overlay */}
      <path d="M 18 34 C 23 23, 35 15, 50 15 C 65 15, 77 23, 82 34 C 74 27, 63 22, 50 22 C 37 22, 26 27, 18 34 Z" fill="url(#highLight)" />
    </svg>
  );
};

export const PremiumWithdrawIcon = () => {
  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 lg:w-14 lg:h-14 drop-shadow-[0_4px_12px_rgba(239,68,68,0.25)] select-none pointer-events-none"
    >
      <defs>
        <linearGradient id="leatherTone" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#323846" />
          <stop offset="50%" stopColor="#1C2029" />
          <stop offset="100%" stopColor="#0B0E14" />
        </linearGradient>

        <linearGradient id="redRubyCarbon" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>

        <linearGradient id="metallicTitanium" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="35%" stopColor="#64748B" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="70%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="goldDetails" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <radialGradient id="rubyGlow" cx="50" cy="50" r="30" fx="50" fy="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft Bottom glow */}
      <circle cx="50" cy="53" r="38" fill="url(#rubyGlow)" />
      
      {/* 3D shadows and outer protective titanium ring */}
      <rect x="18" y="23" width="64" height="54" rx="14" fill="black" opacity="0.6" />
      <rect x="18" y="21" width="64" height="54" rx="14" fill="url(#leatherTone)" stroke="url(#metallicTitanium)" strokeWidth="1.8" />
      
      {/* Luxurious carbon-style pattern cuts inside the wallet */}
      <path d="M 22 25 L 78 25 M 22 30 L 78 30 M 22 35 L 78 35 M 22 40 L 78 40" stroke="white" strokeWidth="0.1" opacity="0.15" />
      <path d="M 25 22 L 25 73 M 30 22 L 30 73 M 35 22 L 35 73 M 40 22 L 40 73" stroke="white" strokeWidth="0.1" opacity="0.15" />

      {/* Gold Card Slot Edge Highlights */}
      <path d="M 24 38 C 35 38, 38 34, 50 34 C 62 34, 65 38, 76 38" stroke="url(#goldDetails)" strokeWidth="1" fill="none" opacity="0.7" />
      <path d="M 24 45 C 35 45, 38 41, 50 41 C 62 41, 65 45, 76 45" stroke="url(#goldDetails)" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Credit Card emerging from the wallet slot (Luxury Matte Black with Golden Chip) */}
      <rect x="28" y="27" width="44" height="26" rx="4" fill="#0C0E16" stroke="url(#goldDetails)" strokeWidth="1" />
      
      {/* Microscopic realistic Gold Core Contact Chip */}
      <rect x="34" y="34" width="8" height="6" rx="1" fill="url(#goldDetails)" />
      {/* Fine lines on Chip */}
      <line x1="38" y1="34" x2="38" y2="40" stroke="#78350F" strokeWidth="0.4" />
      <line x1="34" y1="37" x2="42" y2="37" stroke="#78350F" strokeWidth="0.4" />

      {/* Holographic electromagnetic wave arcs emitting (indicating tap-to-pay/withdrawal activity) */}
      <path d="M 60 31 A 4 4 0 0 1 60 39" stroke="#EF4444" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" className="animate-pulse" />
      <path d="M 63 29 A 7 7 0 0 1 63 41" stroke="#EF4444" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" className="animate-pulse" />

      {/* Heavy Metal Clasp with Glowing Crimson LED indicator */}
      <rect x="42" y="55" width="16" height="20" rx="3" fill="url(#metallicTitanium)" stroke="url(#goldDetails)" strokeWidth="0.8" />
      <polygon points="46,65 54,65 50,71" fill="#111827" />
      
      {/* Pure Crimson LED Indicator (Subtle breathing/blinking effect) */}
      <circle cx="50" cy="61" r="2" fill="#EF4444" className="animate-pulse" />
      <circle cx="50" cy="61" r="3.5" stroke="#EF4444" strokeWidth="0.5" opacity="0.4" className="animate-ping" />
      
      {/* Stitching holes for high-end realistic leathercraft look */}
      <circle cx="21" cy="24" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="28" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="32" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="36" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="40" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="44" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="48" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="52" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="56" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="60" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="64" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="68" r="0.4" fill="white" opacity="0.4" />
      <circle cx="21" cy="72" r="0.4" fill="white" opacity="0.4" />
      
      <circle cx="79" cy="24" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="28" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="32" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="36" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="40" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="44" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="48" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="52" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="56" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="60" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="64" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="68" r="0.4" fill="white" opacity="0.4" />
      <circle cx="79" cy="72" r="0.4" fill="white" opacity="0.4" />
    </svg>
  );
};

export const PremiumAssetsIcon = () => {
  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 lg:w-14 lg:h-14 drop-shadow-[0_4px_12px_rgba(59,130,246,0.25)] select-none pointer-events-none"
    >
      <defs>
        <linearGradient id="sapphireCore" x1="10" y1="10" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
          <stop offset="20%" stopColor="#3B82F6" />
          <stop offset="70%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="goldCoins" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="30%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <linearGradient id="platinumTowers" x1="30" y1="10" x2="70" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <radialGradient id="sapphireGlow" cx="50" cy="50" r="32" fx="50" fy="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cyber blue base glow */}
      <circle cx="50" cy="50" r="40" fill="url(#sapphireGlow)" />

      {/* Encased Circular Holographic Display Backplate */}
      <circle cx="50" cy="50" r="37" stroke="url(#sapphireCore)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="33" fill="#060913" stroke="#1E293B" strokeWidth="1.2" />

      {/* Rising Trend Wave (Assets Growth visualization) */}
      <path 
        d="M 23 60 Q 35 40, 50 48 T 77 28" 
        stroke="#3B82F6" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="opacity-90 shadow-lg"
      />
      <path 
        d="M 23 60 Q 35 40, 50 48 T 77 28 L 77 65 L 23 65 Z" 
        fill="url(#sapphireCore)" 
        opacity="0.15" 
      />

      <circle cx="77" cy="28" r="2.5" fill="#60A5FA" />
      <circle cx="77" cy="28" r="5" stroke="#60A5FA" strokeWidth="0.8" opacity="0.5" className="animate-ping" />

      {/* 3D Stack of Ultra-Luxurious Gold and Platinum Capital Assets in front */}
      {/* Coin 1: Bottom Platinum Coin */}
      <ellipse cx="38" cy="62" rx="14" ry="7" fill="#151B26" stroke="#475569" strokeWidth="1" />
      <ellipse cx="38" cy="60" rx="14" ry="7" fill="url(#platinumTowers)" stroke="#94A3B8" strokeWidth="0.8" />
      <ellipse cx="38" cy="60" rx="10" ry="4.5" fill="#1E293B" stroke="#475569" strokeWidth="0.4" />

      {/* Coin 2: Middle Golden Wealth Asset Coin */}
      <ellipse cx="62" cy="56" rx="13" ry="6.5" fill="#1B150A" stroke="#78350F" strokeWidth="1" />
      <ellipse cx="62" cy="54" rx="13" ry="6.5" fill="url(#goldCoins)" stroke="#FBBF24" strokeWidth="0.8" />
      <ellipse cx="62" cy="54" rx="9" ry="4" fill="#3F2203" stroke="#92400E" strokeWidth="0.4" />
      <circle cx="62" cy="54" r="2.5" fill="url(#platinumTowers)" opacity="0.6" />

      {/* Coin 3: Top Vault/Treasure Plate Stacked vertically (Sapphire Tech Token) */}
      <ellipse cx="46" cy="46" rx="11" ry="5.5" fill="#090F1E" stroke="#1E3A8A" strokeWidth="1" />
      <ellipse cx="46" cy="44" rx="11" ry="5.5" fill="url(#sapphireCore)" stroke="#60A5FA" strokeWidth="0.8" />
      <ellipse cx="46" cy="44" rx="7" ry="3.5" fill="#0C1D3F" stroke="#2563EB" strokeWidth="0.4" />
      <polygon points="46,41 49,45 46,47 43,45" fill="white" opacity="0.8" className="animate-pulse" />

      {/* Tiny decorative cyber particles rising */}
      <circle cx="30" cy="38" r="1" fill="#60A5FA" className="animate-bounce" />
      <circle cx="68" cy="34" r="1.2" fill="#FBBF24" className="animate-ping" />
    </svg>
  );
};

export const PremiumRobotIcon = ({ isActive = true, className = "" }: { isActive?: boolean, className?: string }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let timeoutId: any;

    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 160); // fast natural blink duration (160ms)

      const intervals = [1000, 2000, 3000, 5000];
      const nextInt = intervals[Math.floor(Math.random() * intervals.length)];
      timeoutId = setTimeout(triggerBlink, nextInt);
    };

    // First blink in 2s
    timeoutId = setTimeout(triggerBlink, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-[0_4px_16px_rgba(16,185,129,0.25)] select-none pointer-events-none transition-transform duration-500`}
    >
      <defs>
        {/* Deep steel casing gradients */}
        <linearGradient id="chassisGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="25%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="75%" stopColor="#27303F" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Premium chrome plate highlights */}
        <linearGradient id="chromeAccent" x1="20" y1="5" x2="80" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="neonEmerald" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="neonStandby" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <radialGradient id="visorReflect" cx="50" cy="42" r="28" fx="50" fy="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Cyber ambient circular aura ring (Behind head) */}
      <circle 
        cx="50" 
        cy="45" 
        r="44" 
        stroke={isActive ? '#10B981' : '#F59E0B'} 
        strokeWidth="0.8" 
        strokeDasharray="8 8" 
        strokeOpacity="0.45"
        className="animate-[spin_40s_linear_infinite]" 
      />
      <circle 
        cx="50" 
        cy="45" 
        r="38" 
        stroke="white" 
        strokeWidth="0.4" 
        strokeOpacity="0.1" 
      />

      <g transform="translate(0, 4)">
        {/* Neck connector piece */}
        <rect x="42" y="65" width="16" height="12" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
        <line x1="45" y1="70" x2="55" y2="70" stroke="#0F172A" strokeWidth="1.5" />
        <line x1="45" y1="73" x2="55" y2="73" stroke="#0F172A" strokeWidth="1.5" />

        {/* Outer Heavy Steel Helmet Plates */}
        <path d="M 22 45 C 22 24, 78 24, 78 45 C 78 62, 22 62, 22 45 Z" fill="url(#chassisGrad)" stroke="url(#chromeAccent)" strokeWidth="1.8" />
        
        {/* Premium Side Ear vent nodes (with metallic screws) */}
        {/* Left ear */}
        <path d="M 18 40 C 18 35, 22 35, 22 45 C 22 55, 18 55, 18 40 Z" fill="url(#chromeAccent)" stroke="#111827" strokeWidth="1" />
        <circle cx="20" cy="45" r="1.5" fill="#0F172A" />
        {/* Right ear */}
        <path d="M 82 40 C 82 35, 78 35, 78 45 C 78 55, 82 55, 82 40 Z" fill="url(#chromeAccent)" stroke="#111827" strokeWidth="1" />
        <circle cx="80" cy="45" r="1.5" fill="#0F172A" />

        {/* Futuristic Obsidian Black Visor (Fintech glass shield) */}
        <path d="M 28 35 C 28 32, 72 32, 72 35 L 68 52 C 68 55, 32 55, 32 52 Z" fill="#0B0F19" stroke="#334155" strokeWidth="1.2" />

        {/* Visor internal circuit guide lines (Tech aesthetics) */}
        <path d="M 30 38 L 70 38" stroke="white" strokeWidth="0.25" opacity="0.1" />
        <path d="M 34 49 L 66 49" stroke="white" strokeWidth="0.25" opacity="0.1" />

        {/* Glowing Neural Visor Eyes / Indicator Matrix (With Animated Blinking) */}
        {!isBlinking ? (
          /* DIGITAL EYES - ACTIVE OPEN */
          <g filter="url(#aiGlow)">
            {/* Left Eye */}
            <rect 
              x="36" 
              y="40" 
              width="10" 
              height="6" 
              rx="3" 
              fill={isActive ? 'url(#neonEmerald)' : 'url(#neonStandby)'} 
              className="transition-all duration-200"
            />
            {/* Right Eye */}
            <rect 
              x="54" 
              y="40" 
              width="10" 
              height="6" 
              rx="3" 
              fill={isActive ? 'url(#neonEmerald)' : 'url(#neonStandby)'} 
              className="transition-all duration-200"
            />
            
            {/* Deep inner white electric pupil glow for realism */}
            <circle cx="41" cy="43" r="1.5" fill="white" opacity="0.9" />
            <circle cx="59" cy="43" r="1.5" fill="white" opacity="0.9" />
          </g>
        ) : (
          /* DIGITAL EYES - BLINKING CLOSED (Flat narrow horizontal slit representing closed lids) */
          <g filter="url(#aiGlow)">
            {/* Left Eye Slit */}
            <rect 
              x="35" 
              y="42.5" 
              width="12" 
              height="1.5" 
              rx="0.75" 
              fill={isActive ? '#A7F3D0' : '#FDE68A'} 
              className="transition-all duration-100"
            />
            {/* Right Eye Slit */}
            <rect 
              x="53" 
              y="42.5" 
              width="12" 
              height="1.5" 
              rx="0.75" 
              fill={isActive ? '#A7F3D0' : '#FDE68A'} 
              className="transition-all duration-100"
            />
          </g>
        )}

        {/* Real life micro-glass glare reflections overlaid on visor for premium material appearance */}
        <path d="M 29 35 C 38 31, 62 31, 71 35 C 65 39, 35 39, 29 35 Z" fill="url(#visorReflect)" />
        <path d="M 31 51 C 36 53, 64 53, 69 51 C 65 48, 35 48, 31 51 Z" fill="url(#visorReflect)" opacity="0.5" />

        {/* Vent Grill Mouth Pattern on bottom metallic chassis */}
        <path d="M 44 59 L 56 59 M 46 61 L 54 61 M 48 63 L 52 63" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />

        {/* Forehead Micro-LED Core Light */}
        <circle cx="50" cy="29" r="2.5" fill={isActive ? '#10B981' : '#F59E0B'} />
        <circle cx="50" cy="29" r="1" fill="white" />
        <circle cx="50" cy="29" r="4.5" stroke={isActive ? '#10B981' : '#F59E0B'} strokeWidth="0.8" opacity="0.4" className="animate-pulse" />
      </g>
    </svg>
  );
};
