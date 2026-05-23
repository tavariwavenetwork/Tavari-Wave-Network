import React, { useState, useEffect } from 'react';
import { Scale, ShieldAlert, ArrowLeft, ArrowUpRight, ShieldCheck, DollarSign, Calendar, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function InvestmentTerms() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white font-sans selection:bg-aura-lime/30">
      {/* Header */}
      <header className={cn(
        "fixed top-0 inset-x-0 transition-all duration-500 z-[100] border-b backdrop-blur-md",
        isScrolled ? "h-14 bg-aura-black/80 border-white/10" : "h-20 lg:h-24 bg-transparent border-transparent",
        "border-white/5"
      )}>
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-aura-muted hover:text-white transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Scale size={16} className="text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Investment Protocol</span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="py-24 border-b border-white/5 bg-gradient-to-b from-[#080a0f] to-[#050608]">
        <div className="max-w-4xl mx-auto px-6 pt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary mb-6 animate-pulse">
            <ShieldCheck size={12} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-widest">ECOSYSTEM TERMS</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white italic font-serif leading-tight mb-6">
            Investment <span className="text-aura-lime">Terms</span>
          </h1>
          <p className="text-aura-muted text-lg max-w-2xl leading-relaxed">
            Please carefully review the regulatory rules in force within our institutional quantitative portfolio system. 
            All allocations adhere strictly to the protocols described below.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Section A: Capital Terms */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-aura-lime">
            <ShieldAlert size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">A. Locked Capital Allocation Policy</h2>
          </div>
          <div className="p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-[24px] space-y-4 transition-all">
            <p className="text-aura-muted leading-relaxed">
              Upon initializing and activating any customized ROI plan inside the Wave Ecosystem, users agree and acknowledge that the invested primary capital/equity <strong className="text-white font-black hover:text-aura-lime transition-all">cannot be withdrawn</strong> from contract node pools during active cycles.
            </p>
            <p className="text-aura-muted leading-relaxed">
              The allocation remains operating and locked within cross-market smart contract vaults to consistently trigger trade executions and generate daily real-time returns. Locked structures enable consistent and calculated yield protection parameters for all participants.
            </p>
          </div>
        </section>

        {/* Section B: Withdrawal Threshold */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-aura-lime">
            <DollarSign size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">B. Safe Settle Withdrawal Threshold</h2>
          </div>
          <div className="p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-[24px] space-y-4 transition-all">
            <p className="text-aura-muted leading-relaxed">
              To guarantee cost-effective blockchain processing and gas sustainability for low-overhead wallets, users can only initiate withdrawals once the accrued balance reaches the minimum required threshold of <strong className="text-aura-lime font-mono font-black text-lg">$7.00 USD</strong>.
            </p>
            <p className="text-aura-muted leading-relaxed">
              Withdrawal requests below this preset floor cannot be processed by nodes. All network accounts must fully verify and consolidate balances to and above this threshold before execution.
            </p>
          </div>
        </section>

        {/* Section C & D: ROI Structures Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-aura-lime">
            <Calendar size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">C & D. Weekly Multi-Tier Yield Percentages</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekdays */}
            <div className="p-8 bg-white/[0.01] border border-primary/10 rounded-[24px] space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Weekday ROI Structure (Mon - Fri)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { name: "Regular Plan", roi: "2.5% daily ROI" },
                  { name: "Premium Plan", roi: "2.7% daily ROI" },
                  { name: "Elite Plan", roi: "2.9% daily ROI" }
                ].map((plan, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-aura-muted text-sm font-bold">{plan.name}</span>
                    <span className="text-primary font-mono font-black text-sm">{plan.roi}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weekends */}
            <div className="p-8 bg-white/[0.01] border border-secondary/10 rounded-[24px] space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-secondary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Weekend ROI Structure (Sat - Sun)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { name: "Regular Plan", roi: "1.5% daily ROI" },
                  { name: "Premium Plan", roi: "1.7% daily ROI" },
                  { name: "Elite Plan", roi: "1.9% daily ROI" }
                ].map((plan, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-aura-muted text-sm font-bold">{plan.name}</span>
                    <span className="text-secondary font-mono font-black text-sm">{plan.roi}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section E: ROI Explainer */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-aura-lime">
            <Zap size={20} className="text-aura-lime" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">E. Neural Trading Frequency & Market Variances</h2>
          </div>
          <div className="p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-[24px] space-y-6 transition-all">
            <p className="text-aura-muted leading-relaxed">
              Operational trading loops directly impact our daily ROI targets. The variance in daily percentage returns during weekdays and weekends is calculated in correlation with available asset market volume and traditional banking opening sequences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Weekday AI Operations</h4>
                <p className="text-xs text-aura-muted leading-relaxed">
                  During weekdays, the AI quantitative trading robots aggressively access a diverse, high-liquidity cross-section of global asset classes, routing trades dynamically through <strong className="text-white font-medium">Crypto, Forex, Stocks, Commodities, Futures, and other tradable assets.</strong> This optimal market exposure secures higher ROI thresholds.
                </p>
              </div>
              <div className="space-y-2 border-l-2 border-secondary/30 pl-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Weekend AI Operations</h4>
                <p className="text-xs text-aura-muted leading-relaxed">
                  During weekends, traditional exchanges are closed. AI algorithms trade <strong className="text-white font-medium">primarily Crypto markets</strong>, limiting total cross-market diversification targets. Expected daily yield parameters are automatically reduced to conform with lower volatile asset ranges.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer minimal info indicator */}
      <footer className="py-12 text-center border-t border-white/5 max-w-4xl mx-auto px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffffff20]">
          © 2026 Tavari Wave Network. Institutional Assets Reserved.
        </p>
      </footer>
    </div>
  );
}
