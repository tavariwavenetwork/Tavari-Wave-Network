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
  Bot,
  Gift
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth, getRoiByAmountDynamic, calculateExpectedDailyRoi } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, runTransaction, increment } from 'firebase/firestore';
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
  const { user, profile, plans, expectedDailyRoi } = useAuth();
  const { isTransferModalOpen, openTransferModal, closeTransferModal, setMrBActivationPopup, setIsWelcomeBonusDeductedPopupOpen } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentTx, setRecentTx] = useState<any[]>([]);

  // Automatically open the inactive modal when navigated here via an activation trigger
  useEffect(() => {
    if (location.state?.showInactive || location.hash === '#inactive') {
      setShowInactiveModal(true);
      // Clear navigation state to prevent annoying re-triggers upon tab-refresh
      navigate(location.pathname + (location.hash === '#inactive' ? '' : location.hash), { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  const [referralStats, setReferralStats] = useState({ total: 0, active: 0 });

  const dailyYield = expectedDailyRoi;

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
    let currentMiningUpgrades: any[] = [];

    const updateCombined = () => {
      const all = [...currentDeposits, ...currentWithdrawals, ...currentTransfers, ...currentMiningUpgrades];
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

    const unsubMining = onSnapshot(
      query(collection(db, 'mining_upgrades'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentMiningUpgrades = snap.docs.map(doc => ({ id: doc.id, type: 'mining_upgrade', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Mining upgrades listener blocked:", error.message)
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
      unsubMining();
      unsubWithdrawals();
      unsubTransfers();
    };
  }, [user]);

  const activateInvestment = async (invId: string) => {
    if (!user || !profile) return;
    if (isActivating) return;
    
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    setIsActivating(invId);
    const path = `investments/${invId}`;
    try {
      const now = new Date().toISOString();
      let activatedPlanName = '';
      let activatedAmount = 0;

      // Ensure stable and race-condition free checking of previous investments
      const q = query(collection(db, 'investments'), where('user_id', '==', user.uid));
      const invsSnap = await getDocs(q);
      
      const userInvs = invsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const isFirstActivation = !userInvs.some((i: any) => 
        i.id !== invId && (i.status === 'active' || i.status === 'completed' || i.referral_bonus_processed === true)
      );
      const dynamicActiveCount = userInvs.filter((i: any) => i.status === 'active').length;

      await runTransaction(db, async (transaction) => {
        const invRef = doc(db, 'investments', invId);
        const invSnap = await transaction.get(invRef);
        
        if (!invSnap.exists()) throw new Error("Investment document not found in system databases.");
        const invData = invSnap.data();
        
        if (invData.status !== 'inactive') throw new Error("Investment has already been activated or is in an invalid state.");

        activatedPlanName = invData.plan_name;
        activatedAmount = invData.amount;

        // Update Investment
        transaction.update(invRef, {
          status: 'active',
          activated_at: now,
          last_sync: now,
          total_earned: 0,
          referral_bonus_processed: true
        });

        const userRef = doc(db, 'users', user.uid);

        // If this is the first active investment, start the ROI cycle
        if (dynamicActiveCount === 0) {
          transaction.update(userRef, {
            roi_cycle_start: now
          });
        }

        // Referral Bonus Logic (only first investment activated)
        if (profile.referred_by && isFirstActivation && !invData.referral_bonus_processed) {
          const bonusAmount = invData.amount * 0.05;
          const referrerRef = doc(db, 'users', profile.referred_by);

          // Increment referrer's active referral count
          transaction.update(referrerRef, {
            active_referrals: increment(1)
          });

          // Create pending claim document for User A (referrer)
          const claimRef1 = doc(collection(db, 'referral_claims'));
          transaction.set(claimRef1, {
            user_id: profile.referred_by, // User A (referrer)
            type: 'referrer',
            amount: bonusAmount,
            partner_uid: user.uid, // User B
            partner_name: profile.username || 'Partner',
            status: 'pending',
            created_at: now
          });

          const notificationRef2 = doc(collection(db, 'notifications'));
          transaction.set(notificationRef2, {
            user_id: profile.referred_by,
            sender_id: user.uid,
            title: 'Referral Reward Pending',
            message: `Your referral ${profile.username} has activated an investment. Claim your referral reward now.`,
            type: 'success',
            read: false,
            created_at: now
          });
        }
      });

      // Trigger the $3 welcome bonus deduction popup if it was first activation
      if (isFirstActivation && !profile.welcome_bonus_deducted) {
        setIsWelcomeBonusDeductedPopupOpen({
          planName: activatedPlanName,
          amount: activatedAmount
        });
      } else {
        // Trigger Mr B's activation reward popup directly
        if (setMrBActivationPopup) {
          setMrBActivationPopup({
            planName: activatedPlanName,
            amount: activatedAmount
          });
        }
      }

      toast.success("Investment Activated Successfully! ROI Engine Started.");
    } catch (error: any) {
      console.error("Activation failed:", error);
      toast.error(`Activation failed: ${error.message || String(error)}`);
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
           <button 
             onClick={() => navigate('/rewards#referral-rewards')}
             className="w-full relative group overflow-hidden rounded-[32px] border border-purple-500/20 p-0.5 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:border-purple-500/40 hover:shadow-[0_20px_45px_rgba(168,85,247,0.12)] active:scale-95"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
             <div className="relative p-6 px-8 flex items-center justify-between rounded-[30px] bg-[#0b0e14]/75 border border-white/5">
                <div className="flex items-center gap-4 text-left">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Gift size={22} className="animate-pulse" />
                   </div>
                   <div>
                      <span className="text-[10px] font-bold uppercase text-purple-400 tracking-[0.2em] block leading-none mb-1">Earn 5% Bonus</span>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Referral Program</h4>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white transition-transform group-hover:translate-x-1">
                   <ChevronRight size={16} />
                </div>
             </div>
           </button>
        </div>
      </div>
    </div>
  );
}
