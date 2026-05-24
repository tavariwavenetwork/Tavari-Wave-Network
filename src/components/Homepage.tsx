import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Wallet, 
  Coins, 
  Bot, 
  Zap,
  Activity,
  Clock,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DynamicBalance } from './DynamicBalance';
import { RotatingButtonText } from './RotatingButtonText';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

import TopInvestorsSection from './TopInvestorsSection';
import WhyChooseSection from './WhyChooseSection';
import { ROIEngineStats } from './ROIEngineDisplay';
import LiveActivityNotification from './LiveActivityNotification';

const MemoizedTopInvestorsSection = React.memo(TopInvestorsSection);
const MemoizedWhyChooseSection = React.memo(WhyChooseSection);

export default function Homepage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [showCheckInPopup, setShowCheckInPopup] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');

  useEffect(() => {
    if (!user || !profile) return;
    
    // Check if yesterday or today claimed in profile record
    const claimedDates = profile?.withdraw_methods?.claimed_dates || profile?.claimed_dates || [];
    const localNow = new Date();
    const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');
    const alreadyClaimed = claimedDates.includes(todayDateStr);

    if (!alreadyClaimed) {
      // Show Check-In popup first (slightly delayed for a premium entry flow)
      const timer = setTimeout(() => {
        setShowCheckInPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleDailyClaim = async () => {
    if (!user || claimStatus !== 'idle') return;
    
    setClaimStatus('claiming');
    const toastId = toast.loading("Processing atomic ledger attestation...");
    
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', user.uid);
      
      const localNow = new Date();
      const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');
      
      const yesterdayDate = new Date(localNow);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yStr = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, '0'), String(yesterdayDate.getDate()).padStart(2, '0')].join('-');

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Tavari Wave protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        
        // Retrieve current reward tracking state nested under withdraw_methods
        const currentStreak = existingWithdrawMethods.current_streak || 0;
        const lastCheckIn = existingWithdrawMethods.last_check_in || '';
        const claimedDatesList = existingWithdrawMethods.claimed_dates || [];
        const claimedDatesSet = new Set(claimedDatesList);

        // Check if already claimed today
        if (claimedDatesSet.has(todayDateStr)) {
          throw new Error("Safety protocol triggered: Attestation already signed for this cycle.");
        }

        const lastCheckInDateOnly = lastCheckIn ? lastCheckIn.split('T')[0] : '';

        // Calculate new streak
        let newStreak = 1;
        if (lastCheckIn) {
          if (lastCheckInDateOnly === yStr) {
            newStreak = currentStreak + 1;
          } else if (lastCheckInDateOnly === todayDateStr) {
            newStreak = currentStreak;
          } else {
            newStreak = 1;
          }
        }

        const newClaimedDates = [...claimedDatesList, todayDateStr];
        const newPointsBalance = (existingWithdrawMethods.points_balance || 0) + 1;
        const newTotalClaimedDays = (existingWithdrawMethods.total_claimed_days || 0) + 1;

        // Perform transaction write update
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: newPointsBalance,
            total_claimed_days: newTotalClaimedDays,
            current_streak: newStreak,
            last_check_in: nowIso,
            claimed_dates: newClaimedDates
          }
        });

        // Write Transaction Log
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'points_gain',
          amount: 1,
          status: 'approved',
          created_at: nowIso,
          description: 'Daily Check-In Incentive'
        });

        // Write Notification Log
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Daily Check-In Successful',
          message: 'Successfully checked in today! 1 Point has been credited to your balance.',
          read: false,
          created_at: nowIso
        });
      });

      toast.success("Successfully checked-in today! +1 Point credited.", { id: toastId });
      setClaimStatus('claimed');
      
      // Automatically redirect to rewards page after a brief premium confirmation pause
      setTimeout(() => {
        setShowCheckInPopup(false);
        navigate('/rewards');
      }, 1500);

    } catch (err: any) {
      setClaimStatus('idle');
      toast.error(err.message || "Something went wrong.", { id: toastId });
    }
  };

  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    // Listen to investments to determine state
    const qInv = query(collection(db, 'investments'), where('user_id', '==', user.uid));
    const unsubInvestments = onSnapshot(qInv, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(list);
      
    }, (error) => {
        console.error("Error fetching investments:", error);
    });

    return () => unsubInvestments();
  }, [user]);

  const activeCount = investments.filter(i => i.status === 'active').length;

  return (
    <div className="w-full flex flex-col items-center -mt-8 px-3 lg:px-0">
      
      {/* Live Social Proof Activity Feed */}
      <div className="py-5 lg:py-7 w-full flex justify-center">
        <LiveActivityNotification />
      </div>

      {/* Main Content Sections wrapped to maintain spacing */}
      <div className="w-full flex flex-col items-center space-y-4 lg:space-y-10">
        {/* --- DASHBOARD GRID --- */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 scale-[0.98] lg:scale-100 origin-top">
        
        {/* CARD 1: FUNDING */}
        <div 
          style={{ willChange: 'transform' }}
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-emerald-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(16,185,129,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 hover:shadow-[0_22px_50px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden"
        >
          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none" />
          
          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src="https://i.imgur.com/f1c06xR.png" 
              alt="Funding" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)] transform group-hover:rotate-3 transition-transform duration-500 scale-[1.12]"
            />
          </div>
          <h3 className="text-white text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1 lg:mb-3">Funding</h3>
          <div className="hidden lg:block w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="flex-1 flex items-center justify-center w-full min-h-[40px] lg:min-h-[80px]">
            <DynamicBalance value={formatCurrency(profile?.funding_balance || 0)} />
          </div>
          <button 
            onClick={() => navigate('/fund/deposit')}
            className="w-full py-1.5 lg:py-2.5 rounded-lg lg:rounded-2xl text-[9px] lg:text-[14px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {t('Deposit')}
          </button>
        </div>

        {/* CARD 2: AVAILABLE BALANCE */}
        <div 
          style={{ willChange: 'transform' }}
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-red-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(239,68,68,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-red-500/50 hover:shadow-[0_22px_50px_rgba(239,68,68,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden"
        >
          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/25 to-transparent pointer-events-none" />

          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-red-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src="https://i.imgur.com/NfiT074.png" 
              alt="Wallet" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)] transform group-hover:-rotate-3 transition-transform duration-500 scale-[1.12]"
            />
          </div>
          <h3 className="text-white text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1 lg:mb-3">Available</h3>
          <div className="hidden lg:block w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="flex-1 flex items-center justify-center w-full min-h-[40px] lg:min-h-[80px]">
            <DynamicBalance value={formatCurrency(profile?.available_balance || 0)} />
          </div>
          <button 
            onClick={() => navigate('/fund/withdraw')}
            className="w-full py-1.5 lg:py-2.5 rounded-lg lg:rounded-2xl text-[9px] lg:text-[14px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-red-500 to-red-600 shadow-[0_5px_15px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Withdraw
          </button>
        </div>

        {/* CARD 3: TOTAL ASSETS */}
        <div 
          style={{ willChange: 'transform' }}
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-blue-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(59,130,246,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-blue-500/50 hover:shadow-[0_22px_50px_rgba(59,130,246,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden"
        >
          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent pointer-events-none" />

          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-blue-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src="https://i.imgur.com/qh3Dbhx.png" 
              alt="Assets Bag" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500 scale-[1.12]"
            />
          </div>
          <h3 className="text-white text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1 lg:mb-3">Assets</h3>
          <div className="hidden lg:block w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="flex-1 flex items-center justify-center w-full min-h-[40px] lg:min-h-[80px]">
            <DynamicBalance value={formatCurrency(profile?.total_invested || 0)} />
          </div>
          <button 
            onClick={() => navigate('/invest')}
            className="w-full py-1.5 lg:py-2.5 rounded-lg lg:rounded-2xl text-[9px] lg:text-[14px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_5px_15px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center min-h-[32px] lg:min-h-[56px] cursor-pointer"
          >
            <RotatingButtonText texts={['You Invest', 'We Trade', 'You Earn']} />
          </button>
        </div>

        {/* CARD 4: ROI ENGINE */}
        <ROIEngineStats 
          investments={investments}
          profile={profile}
          user={user}
          variant="home"
        />
      </div>
      
      {/* Footer Status */}
      <div className="hidden xl:flex pt-10 items-center justify-between gap-6 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Mainnet Secured</p>
           </div>
           <div className="h-4 w-px bg-white/10" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-aura-muted">Encryption Protocol: AES-256V2</p>
        </div>
        <div className="flex items-center gap-6">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-aura-muted tracking-tighter">Terminal v1.1.0-RC</p>
        </div>
      </div>
      <MemoizedTopInvestorsSection />
      <MemoizedWhyChooseSection />
      </div>

      {/* Daily Check-In/Claim Popup */}
      <AnimatePresence>
        {showCheckInPopup && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
            {/* Reduced background blur - backdrop-blur-[2px] instead of heavy blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              // Persist popup: backdrop clicks are ignored so it only dismisses on claim completion
            />
            
            {/* Flex column container keeping Card at top and CLAIM button below */}
            <div className="flex flex-col items-center gap-5 max-w-[260px] w-full relative z-10 select-none">
              
              {/* Premium Light, Transparent/Glassmorphic Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="w-full bg-[#050608]/80 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl px-6 py-10 text-center shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden"
              >
                {/* Decorative Accent Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 bg-[#10B981]/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Visual Icon Badge */}
                <div className="mb-5 inline-flex w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-[#10B981] shadow-inner">
                  <Coins size={22} className="animate-bounce" />
                </div>
                
                <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-3 font-sans">
                  Daily Check-In
                </h3>
                
                <p className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[200px] mx-auto">
                  Acknowledge your daily attendance to receive <span className="text-[#10B981] font-black tracking-wide">+1 PTS</span> loyalty token instantly credited to your active wallet node.
                </p>
              </motion.div>
              
              {/* Standalone centered CLAIM button separated below */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
                onClick={handleDailyClaim}
                disabled={claimStatus !== 'idle'}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg transition-all italic duration-200 cursor-pointer w-auto min-w-[150px] text-center rounded-xl",
                  claimStatus === 'idle' && "bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)]",
                  claimStatus === 'claiming' && "bg-[#1F1D2B]/50 border border-white/5 opacity-80 cursor-wait",
                  claimStatus === 'claimed' && "bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 shadow-[0_4px_15px_rgba(16,185,129,0.15)] italic font-black uppercase"
                )}
              >
                {claimStatus === 'idle' && "Claim"}
                {claimStatus === 'claiming' && "Signing..."}
                {claimStatus === 'claimed' && "Claimed"}
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
