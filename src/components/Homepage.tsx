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
  X,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  Cpu
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { DynamicBalance } from './DynamicBalance';
import { RotatingButtonText } from './RotatingButtonText';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { broadcastActivity } from '../lib/activity_logger';

import TopInvestorsSection from './TopInvestorsSection';
import WhyChooseSection from './WhyChooseSection';
import { ROIEngineStats } from './ROIEngineDisplay';
import LiveActivityNotification from './LiveActivityNotification';

const MemoizedTopInvestorsSection = React.memo(TopInvestorsSection);
const MemoizedWhyChooseSection = React.memo(WhyChooseSection);

export default function Homepage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { requestPopup, closePopup, activePopupId } = useUI();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      setInvestmentsLoaded(true);
    }, (error) => {
        console.error("Error fetching investments:", error);
        setInvestmentsLoaded(true);
    });

    return () => unsubInvestments();
  }, [user]);

  const [showCheckInPopup, setShowCheckInPopup] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');

  // Compound popup states
  const [investmentsLoaded, setInvestmentsLoaded] = useState(false);
  const [showCompoundPopup, setShowCompoundPopup] = useState(false);
  const [showCompoundSuccess, setShowCompoundSuccess] = useState(false);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const [isCompounding, setIsCompounding] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);

  const localNow = new Date();
  const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');

  const lastCompoundDate = profile?.withdraw_methods?.last_compound_popup_date || 
                           (user ? localStorage.getItem(`last_compound_popup_date_${user.uid}`) : '') || '';
  
  const hasActiveInvestment = investments.some(i => i.status === 'active');
  const availableBalance = profile?.available_balance || 0;
  const rewardBalance = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
  const hasEligibleBalance = availableBalance >= 7 || rewardBalance >= 7;

  const shouldShowCompoundToday = !lastCompoundDate || lastCompoundDate !== todayDateStr;
  const isCompoundPopupEligible = user && profile && investmentsLoaded && hasActiveInvestment && shouldShowCompoundToday && hasEligibleBalance;

  // Trigger Compound Popup
  useEffect(() => {
    if (!user || !profile || !investmentsLoaded) return;

    if (isCompoundPopupEligible && !showCompoundPopup && activePopupId !== 'compound-profits') {
      const timer = setTimeout(() => {
        requestPopup(
          'compound-profits', 
          () => {
            setShowCompoundPopup(true);
            setIsConfirmingSkip(false);
          }, 
          () => {
            setShowCompoundPopup(false);
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, investmentsLoaded, isCompoundPopupEligible, showCompoundPopup, activePopupId, requestPopup]);

  // Handle other popups conditional suspension
  useEffect(() => {
    if (!user || !profile || !investmentsLoaded) return;
    
    // SUSPEND daily check-in popup if compound popup is eligible, showing, or compound success popup is showing !
    if (isCompoundPopupEligible || showCompoundPopup || showCompoundSuccess) {
      return;
    }

    // Check if yesterday or today claimed in profile record
    const claimedDates = profile?.withdraw_methods?.claimed_dates || profile?.claimed_dates || [];
    const localNow = new Date();
    const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');
    const alreadyClaimed = claimedDates.includes(todayDateStr);

    if (!alreadyClaimed) {
      // Show Check-In popup first (slightly delayed for a premium entry flow)
      const timer = setTimeout(() => {
        requestPopup('daily-check-in', () => setShowCheckInPopup(true), () => setShowCheckInPopup(false));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, profile, investmentsLoaded, isCompoundPopupEligible, showCompoundPopup, requestPopup]);

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

      toast.success("Successfully checked-in today! +1 TWN Point credited.", { id: toastId });
      setClaimStatus('claimed');
      
      // Automatically redirect to the consolidated token portal after a brief premium confirmation pause
      setTimeout(() => {
        closePopup('daily-check-in');
        navigate('/daily-points');
      }, 1500);

    } catch (err: any) {
      setClaimStatus('idle');
      toast.error(err.message || "Something went wrong.", { id: toastId });
    }
  };

  const handleCompoundClick = async () => {
    if (!user || isCompounding) return;

    const isAutoCompoundActive = !!(
      profile?.auto_compound_enabled &&
      profile?.auto_compound_end_date &&
      new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
    );

    if (isAutoCompoundActive) {
      setShowDurationSelector(false);
      return;
    }

    setIsCompounding(true);
    const toastId = toast.loading("Processing compounding transfer to Assets...");

    try {
      const userRef = doc(db, 'users', user.uid);
      const nowIso = new Date().toISOString();
      let transferredAmount = 0;

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const userData = userSnap.data();
        const curAvailable = userData.available_balance || 0;
        const curReward = userData.withdraw_methods?.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;

        const walletsToCompound: ('available' | 'reward')[] = [];
        if (curAvailable >= 7) {
          walletsToCompound.push('available');
        }
        if (curReward >= 7) {
          walletsToCompound.push('reward');
        }

        let availableDeduction = 0;
        let rewardDeduction = 0;

        if (walletsToCompound.includes('available')) {
          availableDeduction = curAvailable;
        }
        if (walletsToCompound.includes('reward')) {
          rewardDeduction = curReward;
        }

        const totalToCompound = availableDeduction + rewardDeduction;
        if (totalToCompound <= 0) {
          throw new Error("Deduction threshold not met. Minimum amount is $7.");
        }

        transferredAmount = totalToCompound;

        const updates: any = {};
        if (availableDeduction > 0) {
          updates.available_balance = increment(-availableDeduction);
        }

        if (rewardDeduction > 0) {
          const existingWithdrawMethods = userData.withdraw_methods || {};
          const oldReward = existingWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
          updates.withdraw_methods = {
            ...existingWithdrawMethods,
            reward_dollar_balance: oldReward - rewardDeduction
          };
        }

        updates.total_invested = increment(totalToCompound);

        const existingCompounds = userData.withdraw_methods?.compounded_amounts || userData.compounded_amounts || [];
        const newCompounds = [...existingCompounds, totalToCompound];

        const existingWithdrawMethodsUpdate = updates.withdraw_methods || userData.withdraw_methods || {};
        updates.withdraw_methods = {
          ...existingWithdrawMethodsUpdate,
          compounded_amounts: newCompounds,
          last_compound_popup_date: todayDateStr
        };

        if (userData.compounded_amounts) {
          const existingCompoundsStd = userData.compounded_amounts || [];
          updates.compounded_amounts = [...existingCompoundsStd, totalToCompound];
        }

        transaction.update(userRef, updates);

        if (availableDeduction > 0) {
          const txRef1 = doc(collection(db, 'transactions'));
          transaction.set(txRef1, {
            user_id: user.uid,
            type: 'compound',
            type_detail: 'compound_available_balance',
            amount: availableDeduction,
            status: 'approved',
            created_at: nowIso,
            description: 'Compounded Available Balance to active investment asset'
          });
        }
        if (rewardDeduction > 0) {
          const txRef2 = doc(collection(db, 'transactions'));
          transaction.set(txRef2, {
            user_id: user.uid,
            type: 'compound',
            type_detail: 'compound_reward_balance',
            amount: rewardDeduction,
            status: 'approved',
            created_at: nowIso,
            description: 'Compounded Reward Balance to active investment asset'
          });
        }

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Balance Compounded to Assets',
          message: `Your balance of ${formatCurrency(totalToCompound)} has been successfully transferred to your Asset Portfolio. Reinvestment complete.`,
          read: false,
          created_at: nowIso
        });
      });

      localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
      toast.success(`Transferred ${formatCurrency(transferredAmount)} to Assets!`, { id: toastId });

      broadcastActivity(
        profile?.name || "Client",
        "Compounded Balance to Assets",
        `$${transferredAmount.toFixed(2)}`,
        true,
        "🔁"
      );

      setShowDurationSelector(true);
    } catch (err: any) {
      console.error("Compounding transfer failed:", err);
      toast.error(err.message || "Failed to process compounding transfer.", { id: toastId });
    } finally {
      setIsCompounding(false);
    }
  };

  const selectCompoundingDuration = async (days: number) => {
    if (!user || isCompounding) return;
    setIsCompounding(true);
    const toastId = toast.loading("Activating automated daily compounding schedule...");

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const userRef = doc(db, 'users', user.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const updates: any = {
          auto_compound_enabled: true,
          auto_compound_duration: days,
          auto_compound_start_date: startDate.toISOString(),
          auto_compound_end_date: endDate.toISOString(),
          auto_compound_expired: false
        };

        const nowIso = new Date().toISOString();
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Automated Compounding Active',
          message: `Successfully set up ${days}-day automated compounding protocol. Daily ROI will be reinvested automatically.`,
          read: false,
          created_at: nowIso
        });

        transaction.update(userRef, updates);
      });

      toast.success(`Automated compounding protocol (${days} days) active!`, { id: toastId });
      
      closePopup('compound-profits');
      setShowDurationSelector(false);
      setShowCompoundSuccess(true);
    } catch (err: any) {
      console.error("Compounding schedule setup failed:", err);
      toast.error(err.message || "Failed to activate compounding schedule.", { id: toastId });
    } finally {
      setIsCompounding(false);
    }
  };

  const handleCancelClick = () => {
    setIsConfirmingSkip(true);
  };

  const handleSkipConfirmYes = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const existingWithdrawMethods = profile?.withdraw_methods || {};
        await updateDoc(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            last_compound_popup_date: todayDateStr
          }
        });
        localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
      }
    } catch (e) {
      console.error("Failed to update skip tracker in DB:", e);
      if (user) localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
    } finally {
      setIsConfirmingSkip(false);
      closePopup('compound-profits');
    }
  };

  const handleSkipConfirmNo = () => {
    setIsConfirmingSkip(false);
  };

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
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-emerald-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(16,185,129,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 hover:shadow-[0_22px_50px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden gpu-accelerate"
        >
          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none" />
          
          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <ArrowDownLeft 
              className="w-5 h-5 lg:w-8 lg:h-8 text-emerald-400 filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.3)] transform group-hover:rotate-3 transition-transform duration-500 scale-[1.12]"
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
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-red-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(239,68,68,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-red-500/50 hover:shadow-[0_22px_50px_rgba(239,68,68,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden gpu-accelerate"
        >
          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/25 to-transparent pointer-events-none" />

          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-red-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <ArrowUpRight 
              className="w-5 h-5 lg:w-8 lg:h-8 text-red-400 filter drop-shadow-[0_4px_10px_rgba(239,68,68,0.3)] transform group-hover:-rotate-3 transition-transform duration-500 scale-[1.12]"
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
          className="bg-gradient-to-b from-[#0e111a]/80 to-[#08090d]/95 border border-blue-500/20 shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(59,130,246,0.02)] backdrop-blur-md rounded-[24px] lg:rounded-[32px] p-3 lg:p-7 aspect-square lg:aspect-auto flex flex-col items-center justify-center text-center group hover:border-blue-500/50 hover:shadow-[0_22px_50px_rgba(59,130,246,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden gpu-accelerate"
        >
          {profile && !['AI 1.8', 'AI 2.0', 'AI 2.5', 'AI 3.0'].includes(profile.active_robot || '') && investments.some(i => i.status === 'active') && (profile.total_invested || 0) > 0 && (
            <>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes premiumPulse {
                  0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 0 8px rgba(124, 58, 237, 0.4);
                  }
                  50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 18px rgba(124, 58, 237, 0.7);
                  }
                }
                .animate-premium-pulse {
                  animation: premiumPulse 2s infinite ease-in-out;
                }
              `}} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/ai-marketplace');
                }}
                className="animate-premium-pulse absolute top-3 right-3 lg:top-5 lg:right-5 px-2.5 py-1 text-[8px] lg:text-[9px] font-black uppercase tracking-wider rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white cursor-pointer select-none border border-white/10 flex items-center justify-center gap-1 transition-all z-10"
                style={{ willChange: 'transform' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Upgrade</span>
              </button>
            </>
          )}

          {/* Subtle 3D glossy highlight line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent pointer-events-none" />

          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#11141b]/95 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center mb-1 lg:mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-105 group-hover:border-blue-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <TrendingUp 
              className="w-5 h-5 lg:w-8 lg:h-8 text-blue-400 filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)] transform group-hover:scale-110 transition-transform duration-500 scale-[1.12]"
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
      
      {/* Footer Status hidden per user request */}

      {/* Platform Guide Preview Card */}
      <div className="w-full max-w-5xl mx-auto px-1 mt-6">
        <div className="bg-gradient-to-r from-[#11141b]/50 to-[#0c0d13]/80 border border-white/5 hover:border-aura-lime/20 rounded-[32px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-aura-lime/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/[0.01] rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-aura-lime/10 border border-aura-lime/20 rounded-full text-aura-lime">
              <BookOpen size={12} />
              <span className="text-[8px] font-black uppercase tracking-wider">Ecosystem Guide</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white uppercase italic">
              New to the <span className="text-aura-lime">Tavari Wave</span> Protocol?
            </h3>
            <p className="text-xs text-[#8E8A9E] leading-relaxed max-w-2xl">
              Our comprehensive platform guide walks you through every major feature. Discover how decentralized investments, regional rules, dynamic TWN token pricing, daily check-ins, and high-security withdraw mechanisms work in unison.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/guide')}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aura-lime/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#CCFF00] hover:text-white transition-all whitespace-nowrap active:scale-95 cursor-pointer"
          >
            Read More
          </button>
        </div>
      </div>

      {/* TWN Token Mining Portal Premium Card */}
      <div className="w-full max-w-5xl mx-auto px-1 mt-6">
        <div className="bg-gradient-to-r from-[#11141b]/60 via-[#161310]/75 to-[#0b0c16]/90 border border-amber-500/15 hover:border-amber-400/40 rounded-[32px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500 group">
          {/* Glowing particle lights matching the high-end ASIC miner theme */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/[0.02] rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400">
              <Cpu size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[8px] font-black uppercase tracking-wider">LIVE HARVEST RIGS</span>
            </div>
            
            <h3 className="text-xl font-bold tracking-tight text-white uppercase italic leading-none">
              TWN Token <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Mining Arrays</span>
            </h3>
            
            <p className="text-xs text-[#8E8A9E] leading-relaxed max-w-2xl uppercase font-semibold">
              Boot up decentralized harvesters to generate TWN directly in real-time. Power on free-tier hourly nodes, or subscribe to ultra-high intensity Antminer S23 & Avalon ASIC units to claim premium, certified blocks daily.
            </p>
          </div>

          <button 
            onClick={() => navigate('/mining')}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#07090e] shadow-[0_5px_20px_rgba(245,158,11,0.25)] hover:scale-[1.03] active:scale-95 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            Power On Miners <Zap size={14} className="text-[#07090e]" />
          </button>
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
                  Acknowledge your daily attendance to receive <span className="text-[#10B981] font-black tracking-wide">+1 TWN Point</span> instantly credited to your active wallet node.
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

      {/* Compound Your Profits Popup */}
      <AnimatePresence>
        {showCompoundPopup && (() => {
          const isAutoCompoundActive = !!(
            profile?.auto_compound_enabled &&
            profile?.auto_compound_end_date &&
            new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
          );

          return (
            <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                // Backdrop clicks don't close so they must proceed or skip explicitly
              />
              
              {/* Flex column container keeping Card at top and buttons below, matching Daily Reward layout */}
              <div className={cn(
                "flex flex-col items-center gap-5 w-full relative z-10 select-none transition-all duration-300",
                showDurationSelector && !isAutoCompoundActive ? "max-w-[340px]" : "max-w-[260px]"
              )}>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  className="w-full bg-[#050608]/80 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl px-6 py-10 text-center shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                  {/* Decorative Glow */}
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-xl pointer-events-none",
                    isConfirmingSkip ? "bg-red-500/5" : "bg-[#10B981]/5"
                  )} />
                  
                  {/* Confirmation Dialogue, Active plan view, selection grid or Intro view */}
                  {isConfirmingSkip ? (
                    <div>
                      <div className="mb-5 inline-flex w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-red-400 shadow-inner">
                        <Clock size={22} className="animate-pulse" />
                      </div>
                      
                      <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-3 font-sans">
                        Skip Compounding?
                      </h3>
                      
                      <p className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[200px] mx-auto">
                        Are you sure you don't want to compound your profits? Reinvesting maximizes your daily ROI potentials.
                      </p>
                    </div>
                  ) : isAutoCompoundActive ? (
                    <div>
                      <div className="mb-5 inline-flex w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 items-center justify-center text-[#10B981] shadow-inner">
                        <Bot size={22} className="animate-pulse" />
                      </div>
                      
                      <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-2 font-sans">
                        Auto-Compound Active
                      </h3>
                      
                      <p className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[200px] mx-auto mb-4 font-sans">
                        Your high-yield quant node is configured for <span className="text-[#10B981] font-black">{profile?.auto_compound_duration} Days</span> automated reinvestment.
                      </p>

                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left space-y-2 mb-1">
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className="text-white/40">Duration:</span>
                          <span className="text-white/80 font-bold">{profile?.auto_compound_duration} Days</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className="text-white/40">Start Date:</span>
                          <span className="text-white/80 font-mono text-[8px]">
                            {profile?.auto_compound_start_date ? new Date(profile.auto_compound_start_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className="text-white/40">End Date:</span>
                          <span className="text-white/80 font-mono text-emerald-400 font-bold text-[8px]">
                            {profile?.auto_compound_end_date ? new Date(profile.auto_compound_end_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : showDurationSelector ? (
                    <div className="w-full">
                      <div className="mb-4 inline-flex w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 items-center justify-center text-purple-400 shadow-inner">
                        <Clock size={22} className="animate-pulse" />
                      </div>
                      
                      <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-2 font-sans">
                        Select Duration
                      </h3>
                      
                      <p className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[240px] mx-auto mb-5 font-sans">
                        Choose a duration for automatic daily reinvesting of your ROI earnings.
                      </p>

                      {/* Elegant premium cards list for duration options */}
                      <div className="space-y-2 w-full">
                        {[15, 30, 90, 180, 365].map((days) => (
                          <button
                            key={days}
                            onClick={() => selectCompoundingDuration(days)}
                            disabled={isCompounding}
                            className="w-full flex items-center justify-between p-3 bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 hover:border-[#10B981]/30 rounded-xl transition-all duration-200 group text-left cursor-pointer active:scale-[0.99] select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] opacity-60 group-hover:opacity-100 transition-opacity" />
                              <div>
                                <span className="text-xs font-black text-white">{days} Days</span>
                                <p className="text-[8px] text-white/35 mt-0.5 font-sans">Continuous reinvesting protocol</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                              SET &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Visual Icon Badge */}
                      <div className="mb-5 inline-flex w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-[#10B981] shadow-inner">
                        <TrendingUp size={22} className="animate-bounce" />
                      </div>
                      
                      <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-3 font-sans">
                        ROI/Profit Compounding
                      </h3>
                      
                      <p className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[200px] mx-auto">
                        Increase your earning potential by reinvesting your accumulated earnings into your active investment.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Standalone action buttons below the Card, matching Daily Reward layout pattern */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.1 }}
                  className="flex gap-3 w-full justify-center"
                >
                  {isConfirmingSkip ? (
                    <>
                      <button
                        onClick={handleSkipConfirmYes}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-red-400 transition-all duration-200 cursor-pointer italic text-center"
                      >
                        Yes
                      </button>
                      <button
                        onClick={handleSkipConfirmNo}
                        className="flex-1 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg"
                      >
                        No
                      </button>
                    </>
                  ) : isAutoCompoundActive ? (
                    <button
                      onClick={() => closePopup('compound-profits')}
                      className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg"
                    >
                      Got It
                    </button>
                  ) : showDurationSelector ? (
                    <button
                      onClick={() => {
                        closePopup('compound-profits');
                        setShowDurationSelector(false);
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all duration-200 cursor-pointer italic text-center"
                    >
                      Exit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelClick}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all duration-200 cursor-pointer italic text-center"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCompoundClick}
                        disabled={isCompounding}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg",
                          isCompounding
                            ? "bg-[#1F1D2B]/50 border border-white/5 opacity-80 cursor-wait text-gray-400"
                            : "bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white"
                        )}
                      >
                        {isCompounding ? "Signing..." : "Accept"}
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showCompoundSuccess && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />
            
            {/* Flex column container keeping Card at top and OK button below, matching Daily Reward layout exactly */}
            <div className="flex flex-col items-center gap-5 max-w-[260px] w-full relative z-10 select-none">
              
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
                  <TrendingUp size={22} className="animate-bounce" />
                </div>
                
                <h3 className="text-sm font-black italic uppercase tracking-wider text-white mb-3 font-sans">
                  Successfully Compounded!
                </h3>
                
                <div className="text-[10px] text-[#8E8A9E] leading-relaxed max-w-[200px] mx-auto font-sans font-medium space-y-1 text-center">
                  <p>Keep Compounding.</p>
                  <p>Keep Earning.</p>
                  <p>Keep Referring.</p>
                  <p>Keep Growing with Wave.</p>
                </div>
              </motion.div>
              
              {/* Standalone centered OK button separated below */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
                onClick={() => setShowCompoundSuccess(false)}
                className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg transition-all italic duration-200 cursor-pointer w-auto min-w-[150px] text-center bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
              >
                OK
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
