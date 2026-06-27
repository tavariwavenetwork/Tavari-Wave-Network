import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  MinusCircle, 
  ArrowLeft, 
  Building2, 
  Bitcoin, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Cpu,
  Wallet,
  Coins,
  CreditCard,
  BarChart3,
  Check,
  Globe,
  X,
  Send,
  Search
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import { COUNTRIES } from '../constants/countries';
import { detectUserLocation } from '../utils/geo';
import investmentHeaderImage from '../assets/images/investment_header_1779476124204.png';
import { DynamicBalance } from './DynamicBalance';
import SuccessModal from './SuccessModal';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  doc, 
  onSnapshot,
  updateDoc, 
  increment, 
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { broadcastActivity } from '../lib/activity_logger';
import InvestProcessingView from './InvestProcessingView';

// --- CONSTANTS ---
const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  erc20: "0x264E87AA85CBC641cBC4261a193bdc9948934E6D",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

const BANK_DETAILS = {
  name: "OPay",
  number: "6550002094",
  accountName: "TAVARI WAVE NETWORK"
};

const PLAN_IMAGES: Record<string, string> = {
  regular: "https://i.imgur.com/rXzjSWv.png",
  premium: "https://i.imgur.com/BqbyCqy.png",
  elite: "https://i.imgur.com/ik9pTGI.png",
};

const getPlanIcon = (id: string) => {
  const imgSrc = PLAN_IMAGES[id];
  if (!imgSrc) return <Coins className="w-5 h-5 text-white" />;
  
  const glowStyle = id === 'regular' 
    ? 'shadow-[0_4px_20px_rgba(16,185,129,0.3)] shadow-[#10b981]'
    : id === 'premium'
    ? 'shadow-[0_4px_20px_rgba(139,92,246,0.35)] shadow-[#8b5cf6]'
    : 'shadow-[0_4px_22px_rgba(245,158,11,0.4)] shadow-[#f59e0b]';

  return (
    <div className={`w-8 h-8 lg:w-11 lg:h-11 flex items-center justify-center relative overflow-visible ${glowStyle} select-none`}>
      {/* Soft atmospheric gradient radial reflex glow */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr opacity-20 blur-md pointer-events-none -z-10 ${
        id === 'regular' ? 'from-emerald-500/30 to-transparent' : id === 'premium' ? 'from-purple-500/30 to-transparent' : 'from-amber-500/30 to-transparent'
      }`} />
      <img 
        src={imgSrc} 
        alt={`${id} tier`} 
        className="w-full h-full object-contain filter brightness-[1.12] contrast-[1.08] drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)] transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// --- HIGH-QUALITY REALISTIC FINTECH SVG ICONS ---
const RealisticBankIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="bankGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="bankBlue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="bankRoof" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
    </defs>
    <rect x="4" y="32" width="32" height="4" rx="1.5" fill="url(#bankGold)" />
    <rect x="6" y="29" width="28" height="3" rx="1" fill="#4B5563" />
    <rect x="9" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="15" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="22" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="28" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <path d="M4 16H36L20 4L4 16Z" fill="url(#bankRoof)" />
    <circle cx="20" cy="11" r="2.5" fill="url(#bankGold)" />
    <path d="M19 11H21" stroke="#FFF" strokeWidth="0.5" />
    <path d="M20 10V12" stroke="#FFF" strokeWidth="0.5" />
  </svg>
);

const RealisticBitcoinIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="btcGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="btcFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="16" fill="url(#btcGold)" />
    <circle cx="20" cy="19" r="13.5" fill="url(#btcFace)" />
    <circle cx="20" cy="19" r="11" stroke="#FBBF24" strokeWidth="0.5" opacity="0.5" />
    <circle cx="20" cy="19" r="10" stroke="#92400E" strokeWidth="0.5" opacity="0.3" />
    <path 
      d="M17 11V27M20.5 11V13M20.5 25V27M17 14.5H22C24.5 14.5 25.5 15.75 25.5 17.25C25.5 18.5 24.5 19.5 22.5 19.5C25 19.5 26 20.75 26 22.5C26 24.25 24.5 25.5 22 25.5H17M17 19.5H21.5" 
      stroke="#FFF" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const RealisticWalletIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="walletBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="walletFlap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      <linearGradient id="greenBill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="10" y="7" width="16" height="8" rx="1.5" transform="rotate(-15 10 7)" fill="url(#greenBill)" />
    <rect x="15" y="6" width="15" height="8" rx="1.5" transform="rotate(-5 15 6)" fill="#6EE7B7" />
    <rect x="5" y="11" width="30" height="23" rx="4" fill="#312E81" />
    <rect x="5" y="13" width="30" height="21" rx="3.5" fill="url(#walletBody)" />
    <line x1="5" y1="18" x2="35" y2="18" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
    <path d="M22 17H32C33.6569 17 35 18.3431 35 20V26C35 27.6569 33.6569 29 32 29H22C20.3431 29 19 27.6569 19 26V20C19 18.3431 20.3431 17 22 17Z" fill="url(#walletFlap)" />
    <circle cx="24" cy="23" r="2.5" fill="#FBBF24" />
    <circle cx="24" cy="23" r="1" fill="#D97706" />
  </svg>
);

const RealisticCardIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="silverGloss" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="chipGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
    </defs>
    <rect x="4" y="9" width="32" height="22" rx="3.5" fill="url(#cardBg)" stroke="#334155" strokeWidth="0.75" />
    <path d="M4 14L28 31H36V28L12 9H4V14Z" fill="url(#silverGloss)" opacity="0.15" />
    <rect x="8" y="14" width="6" height="5" rx="1" fill="url(#chipGold)" />
    <line x1="8" y1="16.5" x2="14" y2="16.5" stroke="#451A03" strokeWidth="0.5" opacity="0.3" />
    <line x1="11" y1="14" x2="11" y2="19" stroke="#451A03" strokeWidth="0.5" opacity="0.3" />
    <circle cx="28" cy="25" r="3.5" fill="#EF4444" opacity="0.85" />
    <circle cx="31.5" cy="25" r="3.5" fill="#F59E0B" opacity="0.85" />
  </svg>
);

export default function Invest() {
  const { user, profile, plans } = useAuth();
  const { 
    setDistractionFree, 
    setMrBActivationPopup,
    isViewingProcessingScreen,
    setIsViewingProcessingScreen,
    processingInvestmentId,
    setProcessingInvestmentId,
    isWelcomeBonusDeductedPopupOpen,
    setIsWelcomeBonusDeductedPopupOpen
  } = useUI();
  const { config: uiConfig } = useUIConfig();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'ngn' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'funding_balance' | 'available_balance' | 'referral_earnings' | 'reward_dollar_balance'>('funding_balance');
  const walletBalanceToShow = selectedWallet === 'reward_dollar_balance'
    ? (profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0)
    : (profile?.[selectedWallet] || 0);
  const [view, setView] = useState<'plans' | 'summary' | 'payment' | 'processing'>('plans');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [amountInput, setAmountInput] = useState<string>('');
  const [isPresetSelected, setIsPresetSelected] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'crypto' | 'bank' | 'card' | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);

  const formatNaira = (amount: number): string => {
    return '₦' + Math.round(amount).toLocaleString('en-US');
  };

  const formatValue = (amountInUsd: number): string => {
    if (selectedCurrency === 'ngn') {
      return formatNaira(amountInUsd * exchangeRate);
    }
    return formatCurrency(amountInUsd);
  };

  // Country Selection & Card Payment Unavailability States
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [notSupportedCountry, setNotSupportedCountry] = useState<string | null>(null);
  const [showCardUnavailable, setShowCardUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<string | null>(() => {
    // Initial sync detection via timezone so we have a reliable fallback instantly!
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
      if (tz.includes('lagos')) return 'Nigeria';
      if (tz.includes('sydney') || tz.includes('melbourne') || tz.includes('brisbane') || tz.includes('perth') || tz.includes('adelaide') || tz.includes('darwin') || tz.includes('hobart') || tz.includes('canberra') || tz.includes('australia')) return 'Australia';
      if (tz.includes('london') || tz.includes('belfast') || tz.includes('europe')) return 'United Kingdom';
      if (tz.includes('toronto') || tz.includes('vancouver') || tz.includes('montreal') || tz.includes('edmonton') || tz.includes('winnipeg') || tz.includes('halifax') || tz.includes('canada')) return 'Canada';
      if (tz.includes('berlin') || tz.includes('munich') || tz.includes('frankfurt') || tz.includes('germany')) return 'Germany';
      if (tz.includes('paris') || tz.includes('france')) return 'France';
      if (tz.includes('singapore')) return 'Singapore';
      if (tz.includes('new_york') || tz.includes('chicago') || tz.includes('los_angeles') || tz.includes('denver') || tz.includes('phoenix') || tz.includes('america')) return 'United States';
    } catch (e) {}
    return 'Nigeria'; // default fallback
  });

  useEffect(() => {
    async function loadDetectedLocation() {
      try {
        const result = await detectUserLocation();
        setDetectedCountry(result.country);
        console.log("[Invest] Detected geographic location:", result.country, result.code, result.method);
      } catch (err) {
        console.error("[Invest] Failed to run dynamic geolocation protocol:", err);
        // Fallback already handled during state setup
      }
    }
    loadDetectedLocation();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const unsubscribeRate = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setExchangeRate(doc.data().usd_to_ngn_rate || 1400);
      }
    }, (error) => {
      console.warn("Settings listener blocked:", error.message);
    });
    return () => unsubscribeRate();
  }, [user, profile]);
  const [cryptoType, setCryptoType] = useState<'usdt' | 'erc20' | 'btc'>('usdt');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    // Enable distraction-free mode when entering the steps
    if (view !== 'plans') {
      setDistractionFree(true);
    } else {
      setDistractionFree(false);
    }

    if (view !== 'processing') {
      setIsViewingProcessingScreen(false);
    }

    return () => {
      // Ensure it's disabled when leaving the page entirely
      setDistractionFree(false);
      setIsViewingProcessingScreen(false);
    };
  }, [view, setDistractionFree, setIsViewingProcessingScreen]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activateInvestment = async (inv: any) => {
    if (!user || !profile) return;
    if (isSubmitting) return;
    
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      // Ensure stable and race-condition free checking of previous investments
      const q = query(collection(db, 'investments'), where('user_id', '==', user.uid));
      const invsSnap = await getDocs(q);
      
      const userInvs = invsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const isFirstActivation = !userInvs.some((i: any) => 
        i.id !== inv.id && (i.status === 'active' || i.status === 'completed' || i.referral_bonus_processed === true)
      );
      const dynamicActiveCount = userInvs.filter((i: any) => i.status === 'active').length;

      await runTransaction(db, async (transaction) => {
        const invRef = doc(db, 'investments', inv.id);
        const invSnap = await transaction.get(invRef);
        
        if (!invSnap.exists()) throw new Error("Investment document not found in system databases.");
        const invData = invSnap.data();
        
        if (invData.status !== 'inactive') throw new Error("Investment has already been activated or is in an invalid state.");

        // Update Investment
        transaction.update(invRef, {
          status: 'active',
          activated_at: now,
          last_sync: now,
          total_earned: 0,
          referral_bonus_processed: true
        });

        const userRef = doc(db, 'users', user.uid);

        // Start user's ROI cycle timestamp if they have no other active investments
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

      // Trigger the $5 welcome bonus deduction popup if it was first activation
      if (isFirstActivation && !profile.welcome_bonus_deducted) {
        setIsWelcomeBonusDeductedPopupOpen({
          planName: inv.plan_name,
          amount: inv.amount
        });
      } else {
        // Trigger the 2% activation bonus popup for Mr. B directly
        if (setMrBActivationPopup) {
          setMrBActivationPopup({
            planName: inv.plan_name,
            amount: inv.amount
          });
        }
      }

      toast.success("Node Pulse Detected. Core Cycle Initiated + Referral Bonuses Dispersed.");
    } catch (error: any) {
      console.error("Activation failed:", error);
      toast.error(`Activation failed: ${error.message || String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartInvestment = (plan: any) => {
    const amountStr = amounts[plan.id] || '';
    const invAmount = parseFloat(amountStr);
    
    if (!amountStr || isNaN(invAmount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (invAmount < plan.min || invAmount > plan.max) {
      toast.error(`Amount must be between ${formatCurrency(plan.min)} and ${formatCurrency(plan.max)}`);
      return;
    }

    setSelectedPlan(plan);
    setConfirmedAmount(invAmount);
    setView('summary');
  };

  const submitInvestment = async () => {
    if (!user || !profile || !selectedPlan || !paymentMethod) return;
    
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    // 1. OFFLINE PROTECTION
    if (!navigator.onLine) {
      toast.error("Connection unstable. Please retry when online.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1.1 DUPLICATE PENDING INVESTMENT PREVENTION
      const qDup = query(
        collection(db, 'investments'),
        where('user_id', '==', user.uid),
        where('plan_name', '==', selectedPlan.name),
        where('amount', '==', confirmedAmount)
      );
      const dupSnap = await getDocs(qDup);
      const hasPendingMatch = dupSnap.docs.some(docRecord => {
        const d = docRecord.data();
        const s = (d.status || '').toLowerCase();
        return s === 'pending' || s === 'awaiting_payment' || s === 'under_review' || s === 'awaiting_approval' || s === 'awaiting-payment' || s === 'under-review' || s === 'awaiting_payment_verification';
      });

      if (hasPendingMatch) {
        toast.error(`A duplicate request for ${formatCurrency(confirmedAmount)} on the ${selectedPlan.name} Plan is already pending review.`);
        setIsSubmitting(false);
        return;
      }

      // Pre-declare reference to capture generated ID for tracking on success
      const invRef = doc(collection(db, 'investments'));
      const newInvestmentId = invRef.id;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const userData = userSnap.data();
        
        // 2. SERVER-SIDE BALANCE VALIDATION
        const currentWalletBalance = selectedWallet === 'reward_dollar_balance'
          ? (userData.withdraw_methods?.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0)
          : (userData[selectedWallet] || 0);

        if (paymentMethod === 'wallet' && confirmedAmount > currentWalletBalance) {
          throw new Error(`Insufficient ${selectedWallet.replace(/_/g, ' ')}. Please fund your wallet.`);
        }

        // 3. LOG INVESTMENT
        const isEnrolled = userData.migration_status === 'accepted' || !isLegacyUser(userData);
        const finalInvAmount = paymentMethod === 'wallet' 
          ? confirmedAmount * 3 
          : confirmedAmount;

        transaction.set(invRef, {
          user_id: user.uid,
          user_name: userData.name,
          plan_name: selectedPlan.name,
          amount: finalInvAmount,
          dailyRoi: selectedPlan.roi,
          duration: selectedPlan.duration,
          payment_method: paymentMethod,
          wallet_source: paymentMethod === 'wallet' ? selectedWallet : null,
          reference: transactionId || 'internal_wallet',
          status: paymentMethod === 'wallet' ? 'inactive' : 'pending',
          referral_bonus_processed: false,
          created_at: new Date().toISOString(),
        });

        // 4. ATOMIC BALANCE UPDATE
        if (paymentMethod === 'wallet') {
          const userUpdates: any = {
            total_invested: increment(finalInvAmount)
          };
          if (isEnrolled) {
            userUpdates.remaining_upgraded_assets = increment(finalInvAmount);
          }

          if (selectedWallet === 'reward_dollar_balance') {
            const existingWithdrawMethods = userData.withdraw_methods || {};
            const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
            userUpdates.withdraw_methods = {
              ...existingWithdrawMethods,
              reward_dollar_balance: oldRewardDollarBalance - confirmedAmount
            };
          } else {
            userUpdates[selectedWallet] = increment(-confirmedAmount);
          }
          
          transaction.update(userRef, userUpdates);
        }

        // 5. TRANSACTION RECORD
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'investment',
          amount: finalInvAmount,
          plan_name: selectedPlan.name,
          method: paymentMethod,
          wallet_source: paymentMethod === 'wallet' ? selectedWallet : null,
          status: paymentMethod === 'wallet' ? 'completed' : 'pending',
          created_at: new Date().toISOString()
        });
      });

      setAmounts({});
      setTransactionId('');
      toast.success(paymentMethod === 'wallet' ? "Investment initialized successfully." : "Investment request submitted. Awaiting network confirmation.");
      
      broadcastActivity(
        profile.name || "Client",
        "Activated Node",
        `$${confirmedAmount.toLocaleString()}`,
        true,
        "⚙️"
      );

      // Trigger the premium processing screen layout transition
      setProcessingInvestmentId(newInvestmentId);
      setIsViewingProcessingScreen(true);
      setView('processing');
    } catch (error: any) {
      console.error("Investment Error:", error);
      toast.error(error.message || "Process failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 lg:pb-8 bg-[#050608] -mx-6 -mt-8 px-6 pt-8 min-h-screen relative overflow-hidden transition-all duration-500">
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSelectedPlan(null);
          setView('plans');
          navigate('/dashboard#transactions');
        }}
        title={paymentMethod === 'wallet' ? "Deployment Successful" : "Deployment Pending"}
        message={paymentMethod === 'wallet' ? "Investment initialized and synchronized with the Tavari Wave Mainnet." : "Institutional deposit submitted. Awaiting network confirmation sequence."}
      />

      {/* Currency Selection Modal Overlay */}
      {selectedCurrency === null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-[6px]"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ 
              scale: 1, 
              y: [0, -5, 0],
            }}
            transition={{
              y: {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              scale: { duration: 0.3 }
            }}
            className="bg-gradient-to-b from-[#11141c]/95 to-[#07090d]/98 border border-white/10 rounded-[2rem] w-full max-w-sm p-6 space-y-6 shadow-[0_20px_50px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_1px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
          >
            {/* Decorative glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-secondary/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="space-y-1.5">
              <h3 className="text-xl md:text-2xl font-black text-white italic font-serif leading-none tracking-tight">
                Choose Your Currency
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-1">
              <button
                onClick={() => {
                  setSelectedCurrency('ngn');
                  setSelectedCountry('Nigeria');
                  setPaymentMethod('bank'); // default to bank transfer for Naira
                  toast.success("Naira (₦) investment pipeline established.");
                }}
                className="p-4 rounded-xl bg-white/[0.02] border border-[#A855F7]/20 hover:border-[#A855F7]/60 hover:bg-[#A855F7]/5 transition-all duration-300 group flex items-center justify-between text-left shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-3 animate-fade-in">
                  <span className="text-2xl filter drop-shadow-md select-none transform group-hover:scale-110 transition-transform duration-300">
                    🇳🇬
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">
                      Invest in Naira (₦)
                    </p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase tracking-[0.1em] mt-0.5">
                      Settlement via local bank transfer
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-aura-muted group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => {
                  setSelectedCurrency('usd');
                  toast.success("USD ($) investment pipeline established.");
                }}
                className="p-4 rounded-xl bg-white/[0.02] border border-[#A855F7]/20 hover:border-[#A855F7]/60 hover:bg-[#A855F7]/5 transition-all duration-300 group flex items-center justify-between text-left shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-3 animate-fade-in">
                  <span className="text-2xl filter drop-shadow-md select-none transform group-hover:scale-110 transition-transform duration-300">
                    🇺🇸
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">
                      Invest in Dollar ($)
                    </p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase tracking-[0.1em] mt-0.5">
                      Global USD settlement rails
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-aura-muted group-hover:text-white transition-colors" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Premium Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none translate-y-1/4 -translate-x-1/4" />
      
      <AnimatePresence mode="popLayout" initial={false}>
        {view === 'plans' && (
          <motion.div 
            key="plans"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-10 w-full animate-fade-in"
          >
            {/* Edge-to-Edge Premium Header Banner with Image Background */}
            <div className="-mx-6 -mt-8 mb-4 relative h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden">
              <img 
                src="https://i.imgur.com/CfAErfD.png" 
                alt="Investment Header" 
                className="w-full h-full object-cover brightness-[0.70] contrast-[1.05]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/30" />
              
              <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-serif italic text-white tracking-tight drop-shadow-md">Investment Plans</h1>
                </div>

                {/* Switch Currency Toggle inside the header */}
                {selectedCurrency !== null && (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 pl-3 shadow-lg select-none">
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-widest text-aura-muted">Currency:</span>
                    <div 
                      onClick={() => {
                        const currentVal = parseFloat(amountInput);
                        if (selectedCurrency === 'usd') {
                          setSelectedCurrency('ngn');
                          setSelectedCountry('Nigeria');
                          setPaymentMethod('bank');
                          if (currentVal && !isNaN(currentVal)) {
                            setAmountInput((currentVal * exchangeRate).toString());
                          }
                          toast.success("Switched to Naira (₦) investment flow.");
                        } else {
                          setSelectedCurrency('usd');
                          setSelectedCountry(null);
                          setPaymentMethod('bank');
                          if (currentVal && !isNaN(currentVal)) {
                            setAmountInput((currentVal / exchangeRate).toString());
                          }
                          toast.success("Switched to Dollar ($) investment flow.");
                        }
                      }}
                      className="relative flex items-center justify-between w-20 h-8 rounded-full bg-black/40 border border-white/10 cursor-pointer p-1 overflow-hidden"
                    >
                      {/* Animated sliding background pill */}
                      <motion.div 
                        className="absolute top-1 bottom-1 w-8 rounded-full bg-primary shadow-md"
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{
                          left: selectedCurrency === 'usd' ? '4px' : 'calc(100% - 36px)'
                        }}
                      />
                      
                      {/* Dollar indicator */}
                      <span className={cn(
                        "z-10 text-xs font-black w-8 text-center transition-colors duration-300",
                        selectedCurrency === 'usd' ? "text-white" : "text-white/30"
                      )}>
                        $
                      </span>

                      {/* Naira indicator */}
                      <span className={cn(
                        "z-10 text-xs font-black w-8 text-center transition-colors duration-300",
                        selectedCurrency === 'ngn' ? "text-white" : "text-white/30"
                      )}>
                        ₦
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-xl mx-auto px-4 space-y-6">
              {isPresetSelected ? (
                /* Selected Amount Display when Preset chosen */
                <div className="bg-gradient-to-b from-blue-500/10 to-indigo-500/15 border border-blue-500/30 rounded-3xl p-6 text-center space-y-4 shadow-[0_12px_24px_rgba(59,130,246,0.15)] animate-fade-in">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Selected Investment Amount</p>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {selectedCurrency === 'ngn'
                      ? formatNaira(parseFloat(amountInput))
                      : `$${parseFloat(amountInput).toLocaleString()}`
                    }
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPresetSelected(false);
                      setAmountInput('');
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-aura-muted hover:text-white underline transition-colors cursor-pointer"
                  >
                    Change Amount
                  </button>
                </div>
              ) : (
                /* Standard Selection UI with Preset Grid & Manual Input */
                <>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {[10, 20, 50, 80, 100, 200, 350, 500, 800, 1000, 1500, 2000, 3500, 5000, 8000, 10000, 15000, 25000, 50000, 100000].map((val) => {
                        const isSelected = selectedCurrency === 'ngn'
                          ? Math.abs(parseFloat(amountInput) - (val * exchangeRate)) < 0.01
                          : parseFloat(amountInput) === val;
                        return (
                          <button
                            key={val}
                            onClick={() => {
                              if (selectedCurrency === 'ngn') {
                                setAmountInput((val * exchangeRate).toString());
                              } else {
                                setAmountInput(val.toString());
                              }
                              setIsPresetSelected(true);
                            }}
                            className={cn(
                              "h-11 sm:h-14 rounded-xl sm:rounded-2xl text-center flex items-center justify-center transition-all duration-300 cursor-pointer select-none border text-[9px] xs:text-[10px] sm:text-xs font-bold",
                              isSelected
                                ? "bg-gradient-to-b from-blue-500/20 to-indigo-500/30 border-blue-500/50 text-white font-black shadow-[0_8px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] -translate-y-0.5"
                                : "bg-white/[0.03] border-white/10 text-gray-300 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-0.5 active:translate-y-0"
                            )}
                          >
                            {selectedCurrency === 'ngn'
                              ? `₦${(val * exchangeRate) >= 1000000 ? `${((val * exchangeRate) / 1000000).toFixed(1)}M` : `${((val * exchangeRate) / 1000).toFixed(0)}k`}`
                              : `$${val >= 1000 ? `${(val / 1000).toLocaleString()}k` : val}`
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual input block */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted ml-1">
                      {selectedCurrency === 'ngn' ? 'Enter Amount (₦)' : 'Enter Amount ($)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-extrabold text-sm">
                        {selectedCurrency === 'ngn' ? '₦' : '$'}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        value={amountInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setAmountInput(val);
                          setIsPresetSelected(false);
                        }}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-9 pr-4 text-sm font-black transition-all outline-none focus:bg-white/[0.05] focus:border-blue-500/50 text-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic summary of the chosen plan based on entered amount */}
                  {(() => {
                    const parsedVal = parseFloat(amountInput);
                    if (isNaN(parsedVal) || parsedVal <= 0) return null;
                    
                    const parsedValInUsd = selectedCurrency === 'ngn'
                      ? parsedVal / exchangeRate
                      : parsedVal;

                    const mappedPlan = plans.find((p: any) => parsedValInUsd >= p.min && parsedValInUsd <= p.max);
                    if (!mappedPlan) {
                      return (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                            {selectedCurrency === 'ngn'
                              ? `Amount outside investment limits (${formatNaira(10 * exchangeRate)} - ${formatNaira(10000000 * exchangeRate)})`
                              : `Amount outside investment limits (${formatCurrency(10)} - ${formatCurrency(10000000)})`
                            }
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase text-aura-muted tracking-widest">Target Node Plan</p>
                          <p className="text-xs font-black text-white italic font-serif">{mappedPlan.name}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase text-aura-muted tracking-widest">Daily Yield ROI</p>
                          <p className="text-xs font-black text-emerald-400 italic font-serif">{(mappedPlan.roi * 100).toFixed(1)}%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase text-aura-muted tracking-widest">Daily Profit Projection</p>
                          <p className="text-xs font-black text-white font-sans">
                            {selectedCurrency === 'ngn'
                              ? formatNaira(parsedVal * mappedPlan.roi)
                              : formatCurrency(parsedVal * mappedPlan.roi)
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  const parsedVal = parseFloat(amountInput);
                  if (isNaN(parsedVal) || parsedVal <= 0) {
                    toast.error("Please enter or select a valid amount.");
                    return;
                  }
                  
                  const parsedValInUsd = selectedCurrency === 'ngn'
                    ? parsedVal / exchangeRate
                    : parsedVal;

                  const mappedPlan = plans.find((p: any) => parsedValInUsd >= p.min && parsedValInUsd <= p.max);
                  if (!mappedPlan) {
                    if (selectedCurrency === 'ngn') {
                      toast.error(`Investment amount must be between ${formatNaira(10 * exchangeRate)} and ${formatNaira(10000000 * exchangeRate)}.`);
                    } else {
                      toast.error(`Investment amount must be between ${formatCurrency(10)} and ${formatCurrency(10000000)}.`);
                    }
                    return;
                  }
                  
                  // Setup amount mapping to standard amounts record to preserve sub-logic
                  setAmounts({ [mappedPlan.id]: amountInput });
                  setSelectedPlan(mappedPlan);
                  setConfirmedAmount(parsedValInUsd);
                  setView('summary');
                }}
                disabled={!amountInput || isNaN(parseFloat(amountInput)) || parseFloat(amountInput) <= 0}
                className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl disabled:opacity-20 transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Proceed to Invest
              </button>

              {/* Subtle Hyperlink text: Booster */}
              <div className="pt-8 pb-4 text-center">
                <Link
                  to="/booster"
                  className="text-[9px] font-black tracking-[0.25em] text-white/20 hover:text-white/60 uppercase transition-all duration-300 underline underline-offset-4 cursor-pointer"
                >
                  Booster
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'summary' && selectedPlan && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full flex items-center justify-center py-4 lg:py-10"
          >
            <div className="max-w-xl w-full">
             <div className="p-8 bg-[#11141b] border border-white/5 rounded-3xl space-y-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => setView('plans')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-aura-muted hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Plans
                </button>
 
                <div className="space-y-6">
                  {/* Slim Premium Combined AI Bot & Amount Card */}
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-white/10 rounded-2xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                    <div className="absolute inset-y-0 right-0 w-32 bg-blue-500/10 blur-xl rounded-full pointer-events-none" />
                    
                    {/* LEFT SIDE: Investment Amount */}
                    <div className="space-y-1 text-left z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Target Allocation</p>
                      <p className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
                        {selectedCurrency === 'ngn'
                          ? formatNaira(confirmedAmount * exchangeRate)
                          : formatCurrency(confirmedAmount)
                        }
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                          {selectedPlan.name}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Free AI Bot Image & Small Label */}
                    <div className="flex items-center gap-3 z-10">
                      <div className="text-right">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Free AI Robot</h4>
                      </div>
                      <img 
                        src="https://i.imgur.com/swuDIvl.png" 
                        alt="Free AI Bot" 
                        className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-pulse"
                        style={{ animationDuration: '3.5s' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex items-start gap-4">
                    <input 
                      type="checkbox" 
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 accent-primary h-4 w-4 rounded border-white/10 bg-white/5"
                    />
                    <label htmlFor="terms" className="text-[10px] font-bold text-aura-muted leading-relaxed tracking-[0.1em] normal-case">
                      I Understand And Agree To The{' '}
                      <Link 
                        to="/investment-terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-aura-lime underline transition-colors"
                      >
                        Investment Terms
                      </Link>
                    </label>
                  </div>
                </div>
 
                <button 
                  disabled={!agreedToTerms}
                  onClick={() => {
                    if (selectedCurrency === 'ngn') {
                      setSelectedCountry('Nigeria');
                      setPaymentMethod('bank');
                      setView('payment');
                    } else {
                      setShowCountryModal(true);
                    }
                  }}
                  className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-xl disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-primary/20"
                >
                  Proceed to Payment
                </button>
             </div>
            </div>
          </motion.div>
        )}

        {view === 'processing' && selectedPlan && (
          <InvestProcessingView 
            investmentId={processingInvestmentId}
            planName={selectedPlan.name}
            amount={confirmedAmount}
            onClose={() => {
              setView('plans');
              setSelectedPlan(null);
            }}
          />
        )}

        {view === 'payment' && selectedPlan && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full flex items-center justify-center py-4 lg:py-10"
          >
            <div className="max-w-xl w-full">
             <div className="p-8 bg-[#11141b] border border-white/5 rounded-3xl space-y-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => setView('summary')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-aura-muted hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Summary
                </button>
 
                <AnimatePresence>
                </AnimatePresence>
 
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-white italic font-serif">Payment Method</h3>
                  <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">Total cost: <span className="text-white font-black">{formatValue(confirmedAmount)}</span></p>
                </div>
 
                <div className="flex flex-col gap-4">
                   {(() => {
                     const rawOptions = [
                       { id: 'bank' as const, label: 'Bank Transfer', icon: <RealisticBankIcon />, description: "Direct institutional transfer", badge: "Recommended", badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", isRecommended: true },
                       { id: 'crypto' as const, label: 'Crypto Payments', icon: <RealisticBitcoinIcon />, description: "Pay via USDT, BTC, or ERC20" },
                       { id: 'wallet' as const, label: 'Wallet Balance', icon: <RealisticWalletIcon />, description: `${selectedWallet === 'reward_dollar_balance' ? 'Reward' : selectedWallet.split('_')[0].charAt(0).toUpperCase() + selectedWallet.split('_')[0].slice(1)} balance (${formatValue(walletBalanceToShow)})` },
                       { id: 'card' as const, label: 'Card Payment', icon: <RealisticCardIcon />, description: "Instant settlement via card integration", isUnavailable: true },
                     ];

                     const options = rawOptions.filter(opt => {
                       if (selectedCurrency === 'ngn') {
                         return opt.id === 'bank' || opt.id === 'wallet';
                       }
                       if (opt.id === 'bank') {
                         return selectedCountry === 'Nigeria';
                       }
                       return true;
                     });

                     const sortedOptions = [...options].sort((a, b) => {
                        if (a.id === paymentMethod) return 1;
                        if (b.id === paymentMethod) return -1;
                        return 0;
                      });





                     return sortedOptions.map((opt) => (
                       <motion.div layout key={opt.id} className="flex flex-col gap-4">
                         <PaymentOption 
                           icon={opt.icon} 
                           label={opt.label} 
                           description={opt.description}
                           selected={paymentMethod === opt.id}
                           onClick={() => { if ((opt as any).isUnavailable) { setShowCardUnavailable(true); } else { setPaymentMethod(opt.id); } }} badge={(opt as any).badge} badgeColor={(opt as any).badgeColor} isRecommended={(opt as any).isRecommended}
                         />

                         {paymentMethod === 'wallet' && opt.id === 'wallet' && (
                           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-1 overflow-hidden">
                              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-wrap gap-1">
                                {(['funding_balance', 'available_balance', 'referral_earnings', 'reward_dollar_balance'] as const).map(w => (
                                  <button 
                                    key={w}
                                    onClick={() => setSelectedWallet(w)}
                                    className={cn(
                                      "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                      selectedWallet === w ? "bg-primary text-white shadow-sm" : "text-aura-muted hover:text-white"
                                    )}
                                  >
                                    {w === 'reward_dollar_balance' ? 'Reward' : w.split('_')[0]}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div>
                                  <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">New Allocation</p>
                                  <p className="text-sm font-black text-white italic font-serif">{formatValue(confirmedAmount)}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    const balance = walletBalanceToShow;
                                    const cleanBalance = parseFloat(balance.toFixed(2));
                                    
                                    // Validation and Plan Switch Logic
                                    const appropriatePlan = (plans || []).filter((p: any) => p.active_status !== false).find((p: any) => cleanBalance >= p.min && cleanBalance <= p.max);
                                    
                                    if (appropriatePlan) {
                                      if (appropriatePlan.id !== selectedPlan?.id) {
                                        setSelectedPlan(appropriatePlan);
                                        toast.success(`Plan updated to ${appropriatePlan.name} for ${formatValue(cleanBalance)} allocation.`);
                                      }
                                      setConfirmedAmount(cleanBalance);
                                    } else {
                                      // Fallback: update amount anyway but check if it's too high for all or too low for all
                                      setConfirmedAmount(cleanBalance);
                                      const activePlans = (plans || []).filter((p: any) => p.active_status !== false);
                                      if (activePlans.length > 0) {
                                        if (cleanBalance < activePlans[0].min) {
                                          toast.error(`Minimum investment is ${formatValue(activePlans[0].min)}`);
                                        } else if (cleanBalance > activePlans[activePlans.length - 1].max) {
                                          toast.error(`Maximum investment is ${formatValue(activePlans[activePlans.length - 1].max)}`);
                                        }
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-primary/20"
                                >
                                  USE MAX BALANCE
                                </button>
                              </div>

                               {confirmedAmount > walletBalanceToShow && (
                                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center animate-pulse">Insufficient operational capital.</p>
                               )}
                              
                              {selectedPlan && (confirmedAmount < selectedPlan.min || confirmedAmount > selectedPlan.max) && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                                    Allocation outside {selectedPlan.name} limits ({formatValue(selectedPlan.min)} - {formatValue(selectedPlan.max)})
                                  </p>
                                  <div className="mt-3 grid grid-cols-1 gap-2">
                                    {(plans || []).filter((p: any) => p.active_status !== false).map((p: any) => (
                                      confirmedAmount >= p.min && confirmedAmount <= p.max && (
                                        <button 
                                          key={p.id}
                                          onClick={() => setSelectedPlan(p)}
                                          className="w-full py-2 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                        >
                                          Switch to {p.name} Plan
                                        </button>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}
                           </motion.div>
                         )}

                         {paymentMethod === 'crypto' && opt.id === 'crypto' && (
                           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 pt-1 overflow-hidden">
                              <div className="flex gap-2">
                                {(['usdt', 'erc20', 'btc'] as const).map(t => (
                                  <button 
                                    key={t} 
                                    onClick={() => setCryptoType(t)}
                                    className={cn(
                                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                      cryptoType === t ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-aura-muted"
                                    )}
                                  >
                                    {t.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center gap-6">
                                <div className="p-4 bg-white rounded-2xl shadow-xl"><QRCodeCanvas value={CRYPTO_ADDRESSES[cryptoType]} size={140} /></div>
                                <div className="w-full space-y-2">
                                  <p className="text-[10px] font-black uppercase text-center text-aura-muted tracking-widest">Target Address</p>
                                  <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-inner">
                                    <code className="text-[10px] font-mono text-white truncate">{CRYPTO_ADDRESSES[cryptoType]}</code>
                                    <button onClick={() => handleCopy(CRYPTO_ADDRESSES[cryptoType], 'wallet')} className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                      {copiedField === 'wallet' ? 'Copied' : 'Copy'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-1">Transaction ID</label>
                                <input 
                                  type="text"
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="Transaction ID"
                                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-xs font-mono focus:bg-white/10 focus:border-primary/50 outline-none transition-all text-white"
                                />
                              </div>
                           </motion.div>
                         )}

                         {paymentMethod === 'bank' && opt.id === 'bank' && (
                           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 pt-1 overflow-hidden text-left">
                              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-5 shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-aura-muted tracking-widest">
                                  <span>Bank</span>
                                  <span className="text-white font-black">{BANK_DETAILS.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <p className="text-[10px] text-aura-muted uppercase tracking-widest font-black">Account</p>
                                    <code className="text-base font-black text-white tracking-widest">{BANK_DETAILS.number}</code>
                                  </div>
                                  <button onClick={() => handleCopy(BANK_DETAILS.number, 'accNum')} className="text-[9px] font-black text-primary bg-primary/10 px-3 py-2 rounded-lg shadow-sm uppercase tracking-widest">
                                    {copiedField === 'accNum' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                  <div className="max-w-[180px]">
                                    <p className="text-[10px] text-aura-muted uppercase tracking-widest font-black">Name</p>
                                    <p className="text-[11px] font-black text-white uppercase leading-tight italic font-serif">{BANK_DETAILS.accountName}</p>
                                  </div>
                                  <button onClick={() => handleCopy(BANK_DETAILS.accountName, 'accName')} className="text-[9px] font-black text-primary bg-primary/10 px-3 py-2 rounded-lg shadow-sm uppercase tracking-widest">
                                    {copiedField === 'accName' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-1">Transaction ID</label>
                                  <input 
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Transaction ID or Username"
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-xs font-mono focus:bg-white/10 focus:border-primary/50 outline-none transition-all text-white"
                                  />
                                </div>
                                
                                {confirmedAmount > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="px-2 space-y-2 text-center"
                                  >
                                    <div className="flex items-center justify-center gap-4">
                                       <span className="text-xl font-black text-white italic tracking-tight font-serif">${confirmedAmount.toFixed(2)}</span>
                                       <span className="text-xl font-black text-aura-muted opacity-40">=</span>
                                       <span className="text-xl font-black text-[#10B981] italic tracking-tight font-serif">₦{(confirmedAmount * exchangeRate).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest">• Send exactly this amount</p>
                                  </motion.div>
                                )}
                              </div>
                           </motion.div>
                         )}
                       </motion.div>
                     ));
                   })()}
                </div>
 
                <button 
                  disabled={!paymentMethod || isSubmitting || ((paymentMethod === 'bank' || paymentMethod === 'crypto') ? !transactionId : confirmedAmount > walletBalanceToShow)}
                  onClick={submitInvestment}
                  className={cn(
                    "w-full py-5 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-lg disabled:opacity-20 transition-all",
                    selectedPlan.buttonColor
                  )}
                >
                  {(paymentMethod === 'bank' || paymentMethod === 'crypto') ? 'Confirm Transmission' : 'Initialize Cycle'}
                </button>
 
                <p className="text-[9px] text-center text-aura-muted uppercase font-bold tracking-[0.2em]">
                  Secure Neural Link Encryption Active
                </p>
             </div>
            </div>
          </motion.div>
        )}

        {/* PREMIUM COUNTRY SELECTION MODAL */}
        {showCountryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#11141b] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/5 flex items-start justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-widest leading-none">
                    Security Protocol
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white italic font-serif leading-tight">
                    Kindly choose your country/region to help us assign an account for you.
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowCountryModal(false);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-aura-muted hover:text-white transition-all flex-shrink-0 ml-4"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 md:px-8 pt-4 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-muted" />
                  <input 
                    type="text" 
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold text-white outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </div>
              </div>

              {/* Grid Content */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh]">
                {COUNTRIES.filter(c => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  c.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((c) => {
                  const isNigeria = c.code === 'NG';
                  const isDetected = detectedCountry && (
                    c.name.toLowerCase() === detectedCountry.toLowerCase() || 
                    c.code.toLowerCase() === detectedCountry.toLowerCase()
                  );
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        const matches = detectedCountry ? (
                          c.name.toLowerCase() === detectedCountry.toLowerCase() || 
                          c.code.toLowerCase() === detectedCountry.toLowerCase()
                        ) : true;
                        
                        setSearchQuery('');
                        if (!matches) {
                          setShowCountryModal(false);
                          setNotSupportedCountry(c.name);
                        } else {
                          setSelectedCountry(c.name);
                          setShowCountryModal(false);
                          setView('payment');
                          if (c.name !== 'Nigeria' && paymentMethod === 'bank') {
                            setPaymentMethod(null);
                          }
                          toast.success(`Assigned instant local institutional settlement route for ${c.name}.`);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-row items-center justify-start text-left gap-3.5 transition-all duration-300 group relative overflow-hidden w-full",
                        isDetected 
                          ? "bg-primary/[0.03] border-primary/40 hover:border-primary hover:bg-primary/[0.06] shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                          : "bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.08]"
                      )}
                    >
                      {isDetected && (
                        <div className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#EAB308]"></span>
                        </div>
                      )}
                      
                      <span className="text-2xl md:text-3xl filter drop-shadow-md select-none transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {c.flag}
                      </span>
                      
                      <div className="space-y-0.5 min-w-0 pr-1 flex-1">
                        <p className={cn(
                          "text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate",
                          isDetected ? "text-primary" : "text-white/95"
                        )}>
                          {c.name}
                        </p>
                        <p className="text-[7px] md:text-[8px] font-black text-aura-muted uppercase tracking-[0.12em] truncate">
                          {isDetected ? 'Highly matching node' : 'Alternate region'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Statement */}
              <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                <p className="text-[8px] font-bold text-aura-muted uppercase tracking-[.15em] max-w-md mx-auto leading-relaxed">
                  In compliance with FinCEN regulations, routing assignments are refreshed every 24 hours.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* REGION NOT SUPPORTED MODAL */}
        {notSupportedCountry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#11141b] border border-red-500/20 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-center p-8 space-y-6 relative"
            >
              {/* Globe Icon representation */}
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
                <Globe size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white italic font-serif leading-none">Region Not Supported</h3>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">Selected Region: {notSupportedCountry}</p>
              </div>

              <div className="space-y-4 text-xs font-semibold text-aura-muted leading-relaxed text-center px-4">
                <p>
                  The region you selected does not support your location.
                </p>
                <p className="text-white/90">
                  Kindly contact Tavari Wave Network administration for assistance.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a 
                  href="https://wa.me/2349167953016?text=Hello%20Tavari%20Wave%20Network%20Support%2C%20I%20need%20assistance%20regarding%20unsupported%20region%20access." 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Send size={12} /> Contact Support
                </a>
                <button 
                  onClick={() => setNotSupportedCountry(null)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-aura-muted hover:text-white font-black uppercase tracking-[0.2em] text-[9px] rounded-xl transition-all border border-white/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* CARD UNPROCESSIBLE / COMING SOON MODAL */}
        {showCardUnavailable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#11141b] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 text-center space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CreditCard size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white italic font-serif leading-none">Coming Soon...</h3>
              </div>

              <button 
                onClick={() => setShowCardUnavailable(false)}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-lg transition-all"
              >
                Okay, Proceed
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
      <p className="text-[8px] font-bold text-aura-muted uppercase tracking-widest mb-1">{label}</p>
      <DynamicBalance 
        value={value} 
        containerClassName="justify-start" 
        className={cn("text-left h-7", highlight ? "text-emerald-500" : "text-white")}
        baseSizeMobile="text-base"
        baseSizeDesktop="lg:text-lg"
      />
    </div>
  );
}

function PaymentOption({ 
  icon, 
  label, 
  description, 
  selected, 
  onClick,
  badge,
  badgeColor,
  isRecommended
}: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  selected: boolean, 
  onClick: () => void,
  badge?: string,
  badgeColor?: string,
  isRecommended?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group relative",
        selected 
          ? "bg-primary border-primary shadow-lg shadow-primary/20" 
          : isRecommended 
            ? "bg-white/[0.04] border-emerald-500/25 hover:border-emerald-500/40 hover:bg-white/[0.06]"
            : "bg-white/5 border-white/5 hover:border-white/10"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
        selected ? "bg-white/20 text-white" : "bg-white/5 text-aura-muted group-hover:text-white"
      )}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[11px] font-bold uppercase tracking-widest", selected ? "text-white" : "text-white/80")}>{label}</p>
          {badge && (
            <span className={cn(
              "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border-sm font-sans",
              selected ? "bg-white/10 text-white border-white/20" : badgeColor || "bg-white/5 text-white/50 border-white/5"
            )}>
              {badge}
            </span>
          )}
        </div>
        <p className={cn("text-[8px] font-bold uppercase tracking-tight mt-0.5", selected ? "text-white/60" : "text-aura-muted")}>{description}</p>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
        selected ? "bg-white border-white text-primary" : "border-white/10 bg-white/5"
      )}>
        {selected && <Check size={12} strokeWidth={4} />}
      </div>
    </button>
  );
}
