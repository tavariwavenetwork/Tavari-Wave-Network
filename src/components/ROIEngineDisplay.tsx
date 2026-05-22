import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Bot, Zap, Clock } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth, getRoiByAmountDynamic } from '../contexts/AuthContext';
import { DynamicBalance } from './DynamicBalance';
import { CandlestickChart, TradingActivity } from './ROIEngineVisuals';

interface ROIEngineStatsProps {
  investments: any[];
  profile: any;
  user: any;
  variant?: 'home' | 'dashboard';
}

export const ROIEngineStats = React.memo(({ investments, profile, user, variant = 'home' }: ROIEngineStatsProps) => {
  const { plans } = useAuth();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("24:00:00");
  const [liveEarnings, setLiveEarnings] = useState(0);

  const activeInvestments = useMemo(() => investments.filter(i => i.status === 'active'), [investments]);
  const activeCount = activeInvestments.length;
  const yieldSum = useMemo(() => 
    activeInvestments.reduce((acc, curr: any) => acc + (curr.amount * getRoiByAmountDynamic(curr.amount, plans || [])), 0),
  [activeInvestments, plans]);

  useEffect(() => {
    if (!user || !profile || activeCount === 0 || !profile.roi_cycle_start) {
      setProgress(0);
      setTimeLeft("24:00:00");
      setLiveEarnings(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const totalDuration = 24 * 60 * 60 * 1000;
      const cycleStart = new Date(profile.roi_cycle_start).getTime();
      const elapsed = now - cycleStart;
      
      const currentCycleElapsed = elapsed % totalDuration;
      const currentProgress = (currentCycleElapsed / totalDuration) * 100;
      
      setProgress(currentProgress);
      setLiveEarnings(yieldSum * (currentProgress / 100));

      const diff = Math.max(0, totalDuration - currentCycleElapsed);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.uid, profile?.roi_cycle_start, activeCount, yieldSum]);

  if (activeCount === 0) {
    if (variant === 'dashboard') {
        return (
            <div 
              style={{ willChange: 'opacity' }}
              className="p-10 bg-[#11141b] border border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]"
            >
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-aura-muted/20 mb-2">
                 <Bot size={32} />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-widest">No active investment</h3>
               <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest max-w-[200px]">Pulse detected, but no core active. Activate one to start earning.</p>
            </div>
        );
    }
    return (
        <div 
        style={{ willChange: 'transform' }}
        className="bg-[#0b0e14] border-2 border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.1)] rounded-[24px] lg:rounded-[32px] p-4 lg:p-8 flex flex-col items-center justify-center text-center aspect-square lg:aspect-auto lg:min-h-full relative overflow-visible group"
        >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02]" />
        <div className="w-12 h-12 lg:w-20 lg:h-20 bg-[#11141b] rounded-xl lg:rounded-[24px] border border-white/10 flex items-center justify-center mb-4 lg:mb-8 relative z-10">
            <Bot className="text-emerald-500/40 w-6 h-6 lg:w-10 lg:h-10 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="relative z-10 space-y-2 lg:space-y-4 px-2">
            <h3 className="text-[10px] lg:text-xl font-black text-white uppercase tracking-[0.2em] italic font-serif leading-tight">Engine Offline</h3>
            <p className="text-[7px] lg:text-[10px] font-bold text-aura-muted uppercase tracking-[0.1em] leading-relaxed max-w-[120px] lg:max-w-[200px] mx-auto opacity-60">
            Activate pool to start earning
            </p>
        </div>
        </div>
    );
  }

  if (variant === 'dashboard') {
    return (
        <div 
            style={{ willChange: 'transform, opacity' }}
            className="p-10 bg-[#11141b] border border-white/5 rounded-[40px] relative overflow-visible group"
        >
            <div className="h-32 mb-10 relative overflow-visible border-b border-white/5">
                <div className="absolute inset-0 flex items-end justify-between px-4 gap-2 opacity-40 lg:opacity-50">
                    <CandlestickChart count={30} />
                </div>
                
                <div className="absolute top-4 left-4 lg:top-4 lg:left-6 flex flex-col items-start translate-y-0">
                    <div className="w-10 h-10 lg:w-14 lg:h-14 bg-[#11141b]/90 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center text-primary shadow-xl">
                    <Bot className="w-5 h-5 lg:w-7 lg:h-7 animate-bounce" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-emerald-500 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-emerald-500 rounded-full" />
                    </div>
                </div>

                <div className="absolute top-4 right-4 lg:top-4 lg:right-6">
                    <TradingActivity />
                </div>
                
                <div className="absolute bottom-2 left-4 right-4 flex justify-between">
                    <div className="text-[7px] font-mono text-primary/60 flex items-center gap-4 uppercase overflow-visible">
                    <span className={cn("animate-pulse", progress > 0 ? "text-primary" : "text-white/20")}>
                        {progress > 0 ? 'WAVE_SYNC: SUBMITTING' : 'STANDBY'}
                    </span>
                    <span className="hidden md:inline text-white/20">|</span>
                    <span className="animate-pulse delay-75 hidden md:inline">CYCLE: {timeLeft}</span>
                    <span className="hidden md:inline text-white/20">||</span>
                    <span className="animate-pulse delay-150">EST_RETURN: ${yieldSum.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-6 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-aura-muted">ROI Performance Matrix</h3>
                    <div className="flex flex-col items-center md:items-start gap-1 lg:gap-2 w-full pt-16 md:pt-0 overflow-visible">
                    <span className="text-lg lg:text-2xl font-black text-white/40 italic font-serif tracking-tighter">
                        {formatCurrency(yieldSum)} / Day
                    </span>
                    
                    <div className="flex flex-col items-center md:items-start w-full overflow-visible">
                        <DynamicBalance 
                            value={formatCurrency(liveEarnings)} 
                            className="text-emerald-500"
                            containerClassName="justify-center md:justify-start"
                            baseSizeMobile="text-3xl"
                            baseSizeDesktop="lg:text-5xl"
                        />
                    </div>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest">Time Remaining</p>
                    <p className="text-3xl font-black text-white italic font-serif font-mono">{timeLeft}</p>
                </div>
            </div>
        </div>
    );
  }

  // DEFAULT (Home variant)
  return (
    <div 
        style={{ willChange: 'transform' }}
        className="bg-[#0b0e14] border-2 border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.1)] rounded-[24px] lg:rounded-[32px] overflow-visible flex flex-col relative group aspect-square lg:aspect-auto"
    >
        <div className="absolute inset-0 lg:relative lg:h-32 overflow-visible">
            <div className="absolute inset-0 flex items-center lg:items-end justify-between px-1 lg:px-2 gap-1 opacity-20 lg:opacity-30 translate-y-4 lg:translate-y-0">
                <CandlestickChart count={25} />
            </div>
            
            <div className="absolute top-4 left-4 lg:top-6 lg:left-6 flex flex-col items-start lg:translate-y-0">
                <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/90 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center text-emerald-500 shadow-xl">
                <Bot className="w-5 h-5 lg:w-8 lg:h-8 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-emerald-500 rounded-full" />
                </div>
            </div>

            <div className="absolute top-1 right-1 lg:top-4 lg:right-6 flex items-center gap-2">
                <TradingActivity />
            </div>
        </div>

        <div className="p-4 lg:p-7 pt-12 lg:pt-0 flex-1 flex flex-col justify-end lg:justify-center text-center relative z-10 bg-transparent pb-0 lg:pb-0">
            <div className="flex flex-row lg:flex-col items-center justify-start lg:justify-center w-full px-0 lg:px-0 overflow-visible transform translate-y-7 lg:translate-y-0 relative">
                <div className="absolute left-4 lg:static lg:w-full lg:text-center text-left">
                <span className="text-[8px] lg:text-lg font-black text-white/40 italic font-serif tracking-tighter whitespace-nowrap">
                    {formatCurrency(yieldSum)}/
                </span>
                </div>
                
                <div className="absolute left-[38%] lg:static lg:left-0 lg:translate-x-0 overflow-visible flex flex-col items-start lg:items-center w-full min-h-[40px] lg:min-h-[60px]">
                  <DynamicBalance 
                    value={formatCurrency(liveEarnings)} 
                    className="text-emerald-500 text-left lg:text-center"
                    containerClassName="justify-start lg:justify-center"
                    baseSizeMobile="text-2xl"
                    baseSizeDesktop="lg:text-3xl"
                  />
                </div>
            </div>
        </div>

        <div className="p-4 lg:p-7 pt-10 lg:pt-4 pb-6 lg:pb-7 space-y-1 lg:space-y-4 relative z-10">
            <div className="space-y-2 lg:space-y-2">
            <div className="flex justify-between text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Progress</span>
                <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1 lg:h-2 bg-white/5 rounded-full overflow-hidden p-[0.5px] border border-white/5">
                <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] rounded-full"
                />
            </div>
            </div>

            <div className="flex justify-between items-center text-[7px] lg:text-[9px] font-black uppercase tracking-widest px-1 lg:px-0">
            <div className="flex flex-col items-start px-2 lg:px-1">
                <span className="hidden lg:block text-white/30 text-[5px] lg:text-[7px] mb-0.5 lg:mb-1">Nodes</span>
                <span className="text-white flex items-center gap-1">
                <Zap size={8} className="text-emerald-400 lg:w-[10px] lg:h-[10px]" /> {activeCount}
                </span>
            </div>
            <div className="flex flex-col items-end px-2 lg:px-1">
                <span className="hidden lg:block text-white/30 text-[5px] lg:text-[7px] mb-0.5 lg:mb-1">Cycle</span>
                <span className="text-white flex items-center gap-1">
                <span className="font-mono">{timeLeft}</span> <Clock size={8} className="text-emerald-400 lg:w-[10px] lg:h-[10px]" />
                </span>
            </div>
            </div>
        </div>
    </div>
  );
});
