import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Activity,
  History,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  ArrowRightLeft,
  Percent,
  CheckCircle2,
  X,
  RefreshCw,
  User,
  Bot
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { AnimatePresence } from 'motion/react';
import TransferModal from './TransferModal';
import { TransactionTicket } from './TransactionTicket';
import { useUI } from '../contexts/UIContext';
import { ROIEngineStats } from './ROIEngineDisplay';
import { DynamicBalance } from './DynamicBalance';

const DashboardCard = React.memo(({ icon: Icon, label, value, subtext, color, highlight }: { icon: any, label: string, value: string, subtext?: string, color: string, highlight?: boolean }) => {
  return (
    <div 
      style={{ willChange: 'transform' }}
      className={cn(
      "p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border transition-all duration-500 relative overflow-hidden group flex flex-col justify-between h-full min-h-[110px] lg:min-h-0",
      highlight ? "bg-primary border-primary text-white" : "bg-[#11141b] border-white/5 text-white hover:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("p-2 lg:p-3 rounded-lg lg:rounded-2xl shadow-inner", highlight ? "bg-white/20" : "bg-white/5", color)}>
          <Icon size={16} className="lg:w-5 lg:h-5" />
        </div>
      </div>
      <div className="overflow-hidden">
        <p className={cn("text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] mb-1", highlight ? "text-white/70" : "text-aura-muted")}>{label}</p>
        <DynamicBalance 
          value={value} 
          containerClassName="justify-start" 
          className="text-left"
          baseSizeMobile="text-lg"
          baseSizeDesktop="lg:text-2xl"
        />
        {subtext && <p className={cn("text-[6px] lg:text-[8px] font-bold uppercase tracking-widest mt-1", highlight ? "text-white/50" : "text-aura-muted")}>{subtext}</p>}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { isTransferModalOpen, openTransferModal, closeTransferModal } = useUI();
  const navigate = useNavigate();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [dailyYield, setDailyYield] = useState(0);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  const [referralStats, setReferralStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    // Listen to all investments for counts and yield
    const qInv = query(collection(db, 'investments'), where('user_id', '==', user.uid));
    const unsubInvestmentsList = onSnapshot(qInv, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(list);
      
      const yieldSum = list
        .filter((inv: any) => inv.status === 'active')
        .reduce((acc, curr: any) => acc + (curr.amount * (curr.dailyRoi || 0)), 0);
      setDailyYield(yieldSum);
    }, (error) => {
      console.warn("Investments list listener blocked:", error.message);
    });

    // Listen to referrals
    const qRef = query(collection(db, 'users'), where('referred_by', '==', user.uid));
    const unsubReferrals = onSnapshot(qRef, async (snap) => {
      const total = snap.size;
      const promises = snap.docs.map(async (uDoc) => {
        const invQ = query(collection(db, 'investments'), where('user_id', '==', uDoc.id), where('status', '==', 'active'), limit(1));
        const invSnap = await getDocs(invQ);
        return !invSnap.empty;
      });
      
      const results = await Promise.all(promises);
      const active = results.filter(r => r).length;
      setReferralStats({ total, active });
    }, (error) => {
      console.warn("Referrals listener blocked:", error.message);
    });

    // Unified tracking for combined transactions
    let currentDeposits: any[] = [];
    let currentWithdrawals: any[] = [];
    let currentTransfers: any[] = [];

    const updateCombined = () => {
      const all = [...currentDeposits, ...currentWithdrawals, ...currentTransfers];
      // Deduplicate by ID to prevent key collisions if the same event exists in multiple collections
      const seen = new Set();
      const unique = all.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      
      const combined = unique.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Display recent transactions directly as requested
      setRecentTx(combined.slice(0, 4));
    };

    const unsubDeposits = onSnapshot(
      query(collection(db, 'deposits'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentDeposits = snap.docs.map(doc => ({ id: doc.id, type: 'deposit', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Deposits listener blocked:", error.message)
    );

    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentWithdrawals = snap.docs.map(doc => ({ id: doc.id, type: 'withdrawal', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Withdrawals listener blocked:", error.message)
    );

    const unsubTransfers = onSnapshot(
      query(collection(db, 'transactions'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentTransfers = snap.docs
          .map(doc => ({ id: doc.id, type: 'transfer', ...doc.data() }))
          .filter(t => t.type !== 'withdrawal' && t.type !== 'deposit' && t.type !== 'investment');
        updateCombined();
      },
      (error) => console.warn("Transfers listener blocked:", error.message)
    );

    return () => {
      unsubInvestmentsList();
      unsubReferrals();
      unsubDeposits();
      unsubWithdrawals();
      unsubTransfers();
    };
  }, [user]);

  const activateInvestment = async (invId: string) => {
    setIsActivating(invId);
    const path = `investments/${invId}`;
    try {
      const now = new Date().toISOString();
      const userRef = doc(db, 'users', user!.uid);
      
      // Update investment
      await updateDoc(doc(db, 'investments', invId), {
        status: 'active',
        activated_at: now,
        last_sync: now,
        total_earned: 0
      });

      // If this is the first active investment, start the ROI cycle
      if (activeCount === 0) {
        await updateDoc(userRef, {
          roi_cycle_start: now
        });
      }

      toast.success("Investment Activated Successfully");
    } catch (error) {
      console.error("Activation failed:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: 'update',
        path,
        authInfo: {
          userId: user?.uid,
          email: user?.email,
          emailVerified: user?.emailVerified,
        }
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
      toast.error("Activation failed. Matrix connection disrupted.");
    } finally {
      setIsActivating(null);
    }
  };

  const activeCount = investments.filter(i => i.status === 'active').length;
  const inactiveCount = investments.filter(i => i.status === 'inactive').length;
  const activeList = investments.filter(i => i.status === 'active');
  const inactiveList = investments.filter(i => i.status === 'inactive');

  return (
    <div className="space-y-10 pb-20">
      <AnimatePresence>
        {/* Active Modal */}
        {showActiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowActiveModal(false)}
               className="absolute inset-0 bg-aura-black/90 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-[#0b0e14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
               <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white italic font-serif flex items-center gap-3">
                      <Activity className="text-primary" /> Active Nodes
                    </h2>
                    <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-2">Performing Core Operations</p>
                  </div>
                  <button onClick={() => setShowActiveModal(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto">
                  {activeList.length === 0 ? (
                    <div className="py-20 text-center">
                       <Zap className="mx-auto text-white/5 mb-6" size={64} />
                       <p className="text-sm font-black text-aura-muted uppercase tracking-widest">No active investment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {activeList.map(inv => (
                         <div key={inv.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={40} /></div>
                           <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest mb-2">{inv.plan_name} Node</p>
                           <div className="h-10 lg:h-12 w-full">
                            <DynamicBalance 
                                value={formatCurrency(inv.amount)} 
                                containerClassName="justify-start"
                                className="text-left"
                                baseSizeMobile="text-3xl"
                                baseSizeDesktop="lg:text-4xl"
                            />
                           </div>
                           <div className="mt-8 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Collecting Yield</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}

        {/* Inactive Modal */}
        {showInactiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowInactiveModal(false)}
               className="absolute inset-0 bg-aura-black/90 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-[#0b0e14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
               <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white italic font-serif flex items-center gap-3">
                      <Clock className="text-yellow-500" /> Awaiting Pulse
                    </h2>
                    <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-2">Investments Ready for Activation</p>
                  </div>
                  <button onClick={() => setShowInactiveModal(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto">
                  {inactiveList.length === 0 ? (
                    <div className="py-20 text-center">
                       <Clock className="mx-auto text-white/5 mb-6" size={64} />
                       <p className="text-sm font-black text-aura-muted uppercase tracking-widest">No plans to activate yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {inactiveList.map(inv => (
                         <div key={inv.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-6 opacity-5"><Zap size={40} /></div>
                           <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest mb-2">{inv.plan_name} Node</p>
                           <div className="h-10 lg:h-12 w-full mb-8">
                            <DynamicBalance 
                                value={formatCurrency(inv.amount)} 
                                containerClassName="justify-start"
                                className="text-left"
                                baseSizeMobile="text-3xl"
                                baseSizeDesktop="lg:text-4xl"
                            />
                           </div>
                           <button 
                             onClick={() => activateInvestment(inv.id)}
                             disabled={isActivating === inv.id}
                             className="w-full py-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/20"
                           >
                             {isActivating === inv.id ? 'Syncing...' : 'Activate Investment'}
                           </button>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-4xl font-black tracking-tight text-white uppercase italic font-serif">
            Welcome back, <span className="text-primary">{profile?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-aura-muted text-[9px] font-bold uppercase tracking-[0.2em]">
            Portfolio Overview & Performance Matrix
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">ACCOUNT ACTIVE</span>
           </div>
           <button 
             onClick={() => navigate('/profile')}
             className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
           >
             <User size={14} /> My Profile
           </button>
           <button 
             onClick={openTransferModal}
             className="px-6 py-4 bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-105 transition-all"
           >
             <ArrowRightLeft size={14} /> Transfer
           </button>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
        <DashboardCard 
          icon={Wallet} 
          label="Wallet Balance" 
          value={formatCurrency(profile?.funding_balance || 0)} 
          color="text-blue-400" 
        />
        <DashboardCard 
          icon={Activity} 
          label="Available" 
          value={formatCurrency(profile?.available_balance || 0)} 
          color="text-secondary" 
          highlight 
        />
        <DashboardCard 
          icon={TrendingUp} 
          label="Earnings" 
          value={formatCurrency(profile?.total_earnings || 0)} 
          color="text-purple-400" 
        />
        <DashboardCard 
          icon={Zap} 
          label="Active Nodes" 
          value={activeCount.toString()} 
          color="text-green-400" 
          subtext={`${activeList.length} Connected`}
        />
        <DashboardCard 
          icon={ShieldCheck} 
          label="Total Assets" 
          value={formatCurrency(profile?.total_invested || 0)} 
          color="text-orange-400" 
        />
        <DashboardCard 
          icon={Percent} 
          label="Daily Yield" 
          value={formatCurrency(dailyYield)} 
          color="text-cyan-400" 
          subtext="Estimated 24h"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Performance & History */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Investment Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setShowActiveModal(true)}
              className="p-8 bg-[#12151c] border border-white/5 rounded-[40px] flex items-center justify-between group hover:border-emerald-500/30 hover:bg-[#161a24] hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left cursor-pointer relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
               <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 rounded-bl-2xl">
                 <ArrowUpRight size={12} className="text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    Active Investments
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  </p>
                  <h4 className="text-5xl font-black text-white italic font-serif group-hover:text-emerald-400 transition-colors">{activeCount}</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Performing Node
                    </p>
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Tap to View →</span>
                  </div>
               </div>
               <div className="w-20 h-20 rounded-[32px] bg-emerald-500/5 flex items-center justify-center text-emerald-500/30 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all duration-500 shadow-inner">
                  <Activity size={44} />
               </div>
            </button>
            <button 
              onClick={() => setShowInactiveModal(true)}
              className="p-8 bg-[#12151c] border border-white/5 rounded-[40px] flex items-center justify-between group hover:border-yellow-500/30 hover:bg-[#161a24] hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left cursor-pointer relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
               <div className="absolute top-0 right-0 p-1 bg-yellow-500/20 rounded-bl-2xl">
                 <ArrowUpRight size={12} className="text-yellow-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.2em] mb-2">Inactive Investments</p>
                  <h4 className="text-5xl font-black text-white italic font-serif group-hover:text-yellow-400 transition-colors">{inactiveCount}</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-[8px] font-black text-yellow-500 uppercase tracking-[0.2em] bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      Ready for Pulse
                    </p>
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Tap to View →</span>
                  </div>
               </div>
               <div className="w-20 h-20 rounded-[32px] bg-yellow-500/5 flex items-center justify-center text-yellow-500/30 group-hover:text-yellow-500 group-hover:bg-yellow-500/10 transition-all duration-500 shadow-inner">
                  <Clock size={44} />
               </div>
            </button>
          </div>

          {/* ROI Performance Section */}
          <ROIEngineStats 
            investments={investments}
            profile={profile}
            user={user}
            variant="dashboard"
          />

          {/* Transaction History */}
          <div id="transactions" className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <History size={16} className="text-primary" /> Transaction History
              </h3>
              <button 
                onClick={() => navigate('/fund/transactions')}
                className="text-[10px] font-bold uppercase tracking-widest text-aura-muted hover:text-aura-lime transition-all"
              >
                View All <ChevronRight size={12} className="inline" />
              </button>
            </div>
            
            <div className="bg-[#11141b] border border-white/5 rounded-[40px] overflow-hidden">
              {recentTx.length === 0 ? (
                <div className="p-12 text-center text-aura-muted text-[10px] font-bold uppercase tracking-[0.2em]">
                  No transactions yet.
                </div>
              ) : (
                <div className="grid gap-2 p-2" id="dashboard-recent-tx-grid">
                  {recentTx.map((tx, idx) => (
                    <TransactionTicket 
                      key={`${tx.type}-${tx.id}-${idx}`}
                      tx={tx}
                      currentUserId={user?.uid ?? undefined}
                      variant="dashboard"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right: Referrals & Extra */}
        <div className="lg:col-span-4 space-y-8">
           <div className="p-8 bg-[#11141b] border border-white/5 rounded-[40px] space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400">
                    <Users size={20} />
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Referral Matrix</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Total Network</p>
                    <p className="text-2xl font-black text-white italic font-serif">{profile?.referrals_count || 0}</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Active Nodes</p>
                    <p className="text-2xl font-black text-aura-lime italic font-serif">{profile?.active_referrals || 0}</p>
                 </div>
              </div>

              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Referral Code</span>
                   <span className="text-[10px] font-black text-white tracking-[0.2em]">{profile?.referral_code || '---'}</span>
                 </div>
                 <div className="h-px bg-white/5" />
                 <div className="flex items-center justify-between gap-4">
                   <span className="text-[8px] font-black text-aura-muted uppercase tracking-widest flex-shrink-0">Ref Link</span>
                   <span className="text-[8px] font-black text-white/40 truncate">{`${window.location.origin}/signup?ref=${profile?.referral_code || ''}`}</span>
                 </div>
              </div>

              <div className="p-8 bg-primary text-white rounded-[32px] relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(124,58,237,0.3)]">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={60} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 italic">Referral Earnings</p>
                 <div className="h-10 lg:h-12 w-full mb-6">
                    <DynamicBalance 
                      value={formatCurrency(profile?.referral_earnings || 0)} 
                      containerClassName="justify-start"
                      className="text-left"
                      baseSizeMobile="text-3xl"
                      baseSizeDesktop="lg:text-4xl"
                    />
                 </div>
                 <button 
                  onClick={() => navigate('/referrals')}
                  className="w-full py-3 bg-white text-primary text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg"
                 >
                   Manage Network
                 </button>
              </div>
           </div>

            {/* Security Banner removed as per request */}
         </div>
      </div>
    </div>
  );
}
