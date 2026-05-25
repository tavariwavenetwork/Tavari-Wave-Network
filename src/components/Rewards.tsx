import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gift, 
  Trophy, 
  Lock, 
  Coins, 
  Timer, 
  CheckCircle2, 
  Info,
  TrendingUp,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  History,
  Sparkles,
  ArrowRightLeft,
  Wallet,
  Check,
  Calendar,
  AlertCircle,
  PiggyBank,
  Search,
  ArrowLeft,
  Users,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isWithdrawalAllowed, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import rewardHeaderImage from '../assets/images/reward_header_1779476104728.png';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  increment, 
  arrayUnion, 
  addDoc, 
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { toast } from 'sonner';
import PinProtocolModal from './PinProtocolModal';
import { TransactionTicket } from './TransactionTicket';

interface Investment {
  id: string;
  amount: number;
  plan_name: string;
  status: string;
  reward_claimed?: boolean;
  created_at?: string;
}

const GUIDE_CARDS = [
  {
    id: 'daily',
    title: 'Daily Check-in Reward',
    shortDesc: 'Earn exactly 1 Point (PTS) every 24 hours simply by recording your daily attendance on the calendar.',
    fullDesc: `Our daily check-in system operates with highly secure 24-hour verification loops. By checking in, you claim Loyalty Points (PTS) that accumulate directly into your activity ledger.

Key Protocols:
• Reward Frequency: 1 Claim per 24 hours. The countdown activates immediately upon confirmation.
• Points Payout: Exactly +1 PTS is credited per claim. No dollar values are minted in this phase.
• Consecutive Streaks: Logging in on consecutive days increments your attendance streak, boosting platform status.
• Auto-tracking Clocks: Attestation logging automatically synchronizes with central network UTC clocks.`,
    iconColor: '#a855f7',
    glowColor: 'rgba(124,58,237,0.3)',
  },
  {
    id: 'investment',
    title: 'Investment Bonus',
    shortDesc: 'Activate any validator node and claim a calculated 2.00% instant bonus on your active capital tier.',
    fullDesc: `Unleash the performance yield of our advanced validator nodes. Launching any computing tier instantly triggers an eligible 2.00% capital cash back bonus.

Key Protocols:
• Node Eligibility: Applicable to all active Regular, Premium, or Elite container configurations.
• Principal Formula: The cashback value is calculated as 2% of the initial node principal (e.g., a $5,000 node generates a $100.00 cash back reward).
• Claim Cycle: Unlocked immediately upon successful node activation. Valid for 1 claim per lifecycle.
• Independent Yield: Claims occur completely outside of your daily compound ROI calculations to ensure asset safety.`,
    iconColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.3)',
  },
  {
    id: 'exchange',
    title: 'Exchange Mechanism',
    shortDesc: 'Convert earned PTS directly into spendable Reward Dollar Balance USD instantly with a zero-fee calculator.',
    fullDesc: `Convert loyalty activity points into spendable currencies automatically with our native zero-fee PTS → USD exchange channel.

Key Protocols:
• Conversion Formula: 10 PTS converts to exactly $1.00 USD. 100 PTS converts to $10.00 USD.
• Transaction Fees: 100% free with 0% swap fees added.
• Immediate Settlement: Swapping PTS outputs instantly to your Reward Dollar Balance. Converted reward dollars are fully eligible for platform withdrawal.
• Permanent Records: Every point conversion creates a secure, timestamped transaction entry in your Ledger.`,
    iconColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.3)',
  },
  {
    id: 'protocols',
    title: 'Reward Protocols',
    shortDesc: 'Settle reward payouts directly starting at $10.00 USD under strict security transfer PIN guidelines.',
    fullDesc: `Platform rewards withdrawals are guided by robust safety parameters and verification codes to preserve ecosystem stability.

Key Protocols:
• Settlement Threshold: Active withdrawals can be initiated starting from a minimum of $10.00 USD.
• Supported Routes: Eligible assets are settled to external crypto wallet addresses (USDT TRC-20) or verified bank accounts.
• Transfer PIN Guard: Security approvals require typing your custom security transfer PIN. The bank holder name must match your registration name perfectly.
• Network Fee fraction: Settle withdrawals under a standard 20% protocol fee used to fund container operational activities.`,
    iconColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.3)',
  }
];

const NIGERIAN_BANKS = [
  "Opay", "Kuda Bank", "Moniepoint MFB", "PalmPay", "Carbon", "FairMoney Microfinance Bank", 
  "VFD Microfinance Bank (VBank)", "Sparkle Microfinance Bank", "Eyowo", "Access Bank", 
  "Zenith Bank", "Guaranty Trust Bank (GTBank)", "First Bank of Nigeria", 
  "United Bank for Africa (UBA)", "Fidelity Bank", "Wema Bank", "Ecobank Nigeria", 
  "First City Monument Bank (FCMB)", "Sterling Bank", "Polaris Bank", "Union Bank of Nigeria", 
  "Keystone Bank", "Unity Bank", "Stanbic IBTC Bank", "Standard Chartered Bank Nigeria", 
  "Citibank Nigeria", "Titan Trust Bank", "Providus Bank", "Parallex Bank", "Globus Bank", 
  "Premium Trust Bank", "Optimus Bank", "SunTrust Bank Nigeria", "Signature Bank", 
  "Nova Commercial Bank", "Jaiz Bank", "Taj Bank", "Lotus Bank", "Rand Merchant Bank Nigeria", 
  "FSDH Merchant Bank", "Coronation Merchant Bank", "Greenwich Merchant Bank", 
  "Nova Merchant Bank", "LAPO Microfinance Bank", "AB Microfinance Bank Nigeria", 
  "Accion Microfinance Bank", "Addosser Microfinance Bank", "Bosak Microfinance Bank", 
  "CEMCS Microfinance Bank", "Daylight Microfinance Bank", "Ekondo Microfinance Bank", 
  "Fina Trust Microfinance Bank", "Fortis Microfinance Bank", "Grooming Microfinance Bank", 
  "Hasal Microfinance Bank", "Infinity Microfinance Bank", "Mainstreet Microfinance Bank", 
  "Mutual Trust Microfinance Bank", "NPF Microfinance Bank", "Peace Microfinance Bank", 
  "Pennywise Microfinance Bank", "Rephidim Microfinance Bank", "Royal Exchange Microfinance Bank", 
  "Safe Haven Microfinance Bank", "Shepherd Trust Microfinance Bank", "Solid Rock Microfinance Bank", 
  "Trustbond Microfinance Bank", "Unical Microfinance Bank", "Verite Microfinance Bank", 
  "Visa Microfinance Bank", "Xpress Microfinance Bank"
];

function BankSelectorModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedBank 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (bank: string) => void,
  selectedBank: string 
}) {
  const [search, setSearch] = useState('');
  
  const filteredBanks = NIGERIAN_BANKS.filter(bank => 
    bank.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-[400px] bg-[#0d1016] border border-white/10 rounded-[28px] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Select Institution</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text"
              autoFocus
              placeholder="Search banks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-emerald-500/30 focus:bg-white/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
          <div className="grid grid-cols-1 gap-1">
            {filteredBanks.map((bank, idx) => (
              <button
                key={`${bank}-${idx}`}
                onClick={() => {
                  onSelect(bank);
                  onClose();
                }}
                className={cn(
                  "w-full px-6 py-4 text-left rounded-2xl transition-all group relative flex items-center justify-between",
                  selectedBank === bank ? "bg-emerald-500/10 text-emerald-400 font-bold" : "hover:bg-white/5 text-white/70 hover:text-white"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wide transition-colors",
                    selectedBank === bank ? "text-emerald-400" : "text-white/70 group-hover:text-white"
                  )}>
                    {bank}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Rewards() {
  const { user, profile } = useAuth();
  const { config: uiConfig } = useUIConfig();
  const navigate = useNavigate();

  // Component States
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Referral System States & Listener
  const [referralClaims, setReferralClaims] = useState<any[]>([]);
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'referral_claims'),
      where('user_id', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claims: any[] = [];
      snapshot.forEach(docSnap => {
        claims.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by created_at desc
      claims.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setReferralClaims(claims);
    }, (err) => {
      console.error("Error fetching referral claims in rewards page:", err);
    });
    return () => unsubscribe();
  }, [user]);

  const handleClaimReward = async (claim: any) => {
    if (!user || !profile) return;
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    setIsClaimingId(claim.id);
    try {
      await runTransaction(db, async (transaction) => {
        const claimRef = doc(db, 'referral_claims', claim.id);
        const claimSnap = await transaction.get(claimRef);
        if (!claimSnap.exists()) throw new Error("Reward claim record not found.");
        
        const claimData = claimSnap.data();
        if (claimData.status !== 'pending') throw new Error("Reward has already been claimed.");

        const userRef = doc(db, 'users', user.uid);
        
        // Update user balances (referral_earnings and available_balance)
        transaction.update(userRef, {
          available_balance: increment(claim.amount),
          referral_earnings: increment(claim.amount)
        });

        // Mark claim as claimed
        transaction.update(claimRef, {
          status: 'claimed',
          claimed_at: new Date().toISOString()
        });

        // Add history transaction
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'referral_reward',
          amount: claim.amount,
          status: 'approved',
          created_at: new Date().toISOString(),
          description: claim.type === 'referrer'
            ? `Referral commission - partner ${claim.partner_name}`
            : `Welcome referral bonus unlocked`
        });

        // Add user notification
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          user_id: user.uid,
          title: 'Referral Reward Disbursed',
          message: `Successfully claimed ${claim.amount} USD to your Referral & Available balances.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success("Bonus Disbursed! Balance Successfully Updated.");
    } catch (err: any) {
      toast.error(err.message || "Claim failed.");
    } finally {
      setIsClaimingId(null);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth-scroll helper for the dashboard redirect path
  useEffect(() => {
    if (window.location.hash === '#referral-rewards') {
      const timer = setTimeout(() => {
        const el = document.getElementById('referral-rewards-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Points Conversion State
  const [pointsInput, setPointsInput] = useState('');
  
  // Withdrawal States
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'crypto' | 'bank'>('crypto');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMobileMethod, setSelectedMobileMethod] = useState<'crypto' | 'bank' | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);

  // Time metrics
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth(); // 0-11
  const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayDayNum = now.getDate();
  const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); // LOCAL YYYY-MM-DD

  // Active user parameters with fallbacks
  const points_balance = profile?.withdraw_methods?.points_balance ?? profile?.points_balance ?? 0;
  const reward_dollar_balance = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
  const total_claimed_days = profile?.withdraw_methods?.total_claimed_days ?? profile?.total_claimed_days ?? 0;
  const current_streak = profile?.withdraw_methods?.current_streak ?? profile?.current_streak ?? 0;
  const last_check_in = profile?.withdraw_methods?.last_check_in ?? profile?.last_check_in ?? '';
  const claimed_dates = profile?.withdraw_methods?.claimed_dates ?? profile?.claimed_dates ?? [];
  const claimedDatesSet = new Set(claimed_dates);
  const claimed_investment_ids = profile?.withdraw_methods?.claimed_investment_ids || [];

  // 1. Fetch user's active node investments
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'investments'),
      where('user_id', '==', user.uid),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Investment));
      setActiveInvestments(list);
    }, (err) => {
      console.error("Failed to load active investments:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch only reward activities real-time: points_gain, investment_reward, rewards_conversion, reward withdrawals
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTx = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as any);

      const filtered = allTx.filter((tx: any) => {
        const typeLower = (tx.type || '').toLowerCase();
        const descLower = (tx.description || '').toLowerCase();
        
        const isDailyCheckIn = typeLower === 'points_gain';
        const isInvestmentReward = typeLower === 'investment_reward';
        const isRewardsConversion = typeLower === 'rewards_conversion';
        const isRewardWithdrawal = typeLower === 'withdrawal' && (tx.is_reward_withdrawal === true || descLower.includes('reward'));
        
        return isDailyCheckIn || isInvestmentReward || isRewardsConversion || isRewardWithdrawal;
      });

      setRewardHistory(filtered);
    }, (err) => {
      console.error("Failed to load reward history:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Countdown handler for daily check-in (counts down to next global 12:00 AM midnight)
  useEffect(() => {
    const timer = setInterval(() => {
      const nowTime = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0); // Next 12:00 AM midnight
      const remains = nextMidnight.getTime() - nowTime.getTime();

      if (remains <= 0) {
        setCountdownStr('');
      } else {
        const hrs = Math.floor(remains / (60 * 60 * 1000));
        const mins = Math.floor((remains % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((remains % (60 * 1000)) / 1000);
        setCountdownStr(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reference for sliding calendar timeline container
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Check if can claim daily check-in (resets immediately at 12:00 AM midnight)
  const hasClaimedToday = claimedDatesSet.has(todayStr);
  const isDailyClaimable = !hasClaimedToday;

  // Generate the sliding timeline of check-in days in chronological order
  const daysList = useMemo(() => {
    const list = [];
    const signupDateStr = profile?.created_at || profile?.createdAt;
    let startDate = signupDateStr ? new Date(signupDateStr) : new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    if (isNaN(startDate.getTime())) {
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    }
    // Set to local start of day to avoid timezone mismatches
    startDate.setHours(0, 0, 0, 0);

    // End date is today + 14 days so we can reveal upcoming future days
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    const currentIter = new Date(startDate);
    while (currentIter <= endDate) {
      const iterStr = currentIter.toISOString().split('T')[0];
      const dayNum = currentIter.getDate();
      const monthNum = currentIter.getMonth();
      const yearNum = currentIter.getFullYear();
      const dayName = currentIter.toLocaleDateString('en-US', { weekday: 'short' });
      const monthLabel = currentIter.toLocaleDateString('en-US', { month: 'short' });
      
      list.push({
        dateStr: iterStr,
        dayNum,
        monthNum,
        yearNum,
        dayName,
        monthLabel,
        isToday: iterStr === todayStr,
        isPast: iterStr < todayStr,
        isFuture: iterStr > todayStr,
        isClaimed: claimedDatesSet.has(iterStr),
      });
      currentIter.setDate(currentIter.getDate() + 1);
    }
    return list;
  }, [profile?.created_at, profile?.createdAt, claimed_dates, todayStr]);

  // Compute the exact subset of days to display based on mobile/desktop rolling rules
  const visibleDays = useMemo(() => {
    const K = isMobile ? 3 : 5;
    // Find index of the first date that is NOT checked-in
    const firstUnclaimedIdx = daysList.findIndex(d => !d.isClaimed);
    const startIdx = firstUnclaimedIdx === -1 
      ? Math.max(0, daysList.length - K - 1) 
      : (firstUnclaimedIdx >= K ? firstUnclaimedIdx - K : 0);
    return daysList.slice(startIdx, startIdx + K + 1);
  }, [daysList, isMobile]);

  // Calculate dynamic missed days starting ONLY from registration date up to yesterday
  const missedDaysCount = useMemo(() => {
    let count = 0;
    const signupDateStr = profile?.created_at || profile?.createdAt;
    let startDate = signupDateStr ? new Date(signupDateStr) : new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    if (isNaN(startDate.getTime())) {
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    }
    startDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(startDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    while (checkDate < todayMidnight) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (!claimedDatesSet.has(dStr)) {
        count++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return count;
  }, [profile?.created_at, profile?.createdAt, claimed_dates, todayStr]);

  // Automatically shift the calendar left smoothly pointing to Today element
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = calendarContainerRef.current;
      const todayElement = document.getElementById(`cal-day-${todayStr}`);
      if (container && todayElement) {
        const containerLeft = container.getBoundingClientRect().left;
        const elementLeft = todayElement.getBoundingClientRect().left;
        const currentScrollLeft = container.scrollLeft;
        
        // Align Today at the beginning/front of the container with slight left offset
        const targetScrollLeft = currentScrollLeft + (elementLeft - containerLeft) - 12;
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }, 450); // slight buffer to let layout stabilize
    return () => clearTimeout(timer);
  }, [visibleDays, hasClaimedToday, todayStr]);

  // Daily Check-In function
  const handleDailyCheckIn = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    if (!isDailyClaimable) {
      toast.error("You are currently on a 24-hour claim cycle lock.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);
      
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
        if (claimedDatesSet.has(todayStr)) {
          throw new Error("Safety protocol triggered: Attestation already signed for this cycle.");
        }

        // Compute yesterday's date string in user's local timezone style
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yStr = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, '0'), String(yesterdayDate.getDate()).padStart(2, '0')].join('-');

        const lastCheckInDateOnly = lastCheckIn ? lastCheckIn.split('T')[0] : '';

        // Calculate new streak
        let newStreak = 1;
        if (lastCheckIn) {
          if (lastCheckInDateOnly === yStr) {
            newStreak = currentStreak + 1;
          } else if (lastCheckInDateOnly === todayStr) {
            newStreak = currentStreak;
          } else {
            newStreak = 1;
          }
        }

        const newClaimedDates = [...claimedDatesList, todayStr];
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
          user_id: authUser.uid,
          type: 'points_gain',
          amount: 1,
          status: 'approved',
          created_at: nowIso,
          description: 'Daily Check-In Incentive'
        });

        // Write Notification Log
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Daily Check-In Successful',
          message: 'Successfully checked in today! 1 Point has been credited to your balance.',
          read: false,
          created_at: nowIso
        });
      });

      toast.success("Successfully checked-in today! +1 Point credited.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert points to USD
  const handlePointsConversion = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    const ptsToConvert = parseInt(pointsInput);

    if (!pointsInput || isNaN(ptsToConvert) || ptsToConvert <= 0) {
      toast.error("Please enter a valid amount of points to convert.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const dollarReward = ptsToConvert * 0.10; // 10 pts = $1
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Tavari Wave protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const pointsBalance = existingWithdrawMethods.points_balance || 0;

        if (ptsToConvert > pointsBalance) {
          throw new Error("Your balance contains insufficient points.");
        }

        const newPointsBalance = pointsBalance - ptsToConvert;
        const newRewardDollarBalance = (existingWithdrawMethods.reward_dollar_balance || 0) + dollarReward;

        // Perform transaction write update
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: newPointsBalance,
            reward_dollar_balance: newRewardDollarBalance
          }
        });

        // Log transaction
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'rewards_conversion',
          amount: dollarReward,
          status: 'approved',
          created_at: nowIso,
          description: `Exchanged ${ptsToConvert} Points for Reward Dollars`
        });

        // Log notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Points Converted',
          message: `Exchanged ${ptsToConvert} PTS to $${dollarReward.toFixed(2)} Reward Dollars.`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Exchanged ${ptsToConvert} PTS to $${dollarReward.toFixed(2)} Reward Dollars!`);
      setPointsInput('');
    } catch (err: any) {
      toast.error(err.message || "Failed to convert points.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identify eligible active unclaimed investments
  const unclaimedInvestmentRewards = activeInvestments.filter(inv => !inv.reward_claimed && !claimed_investment_ids.includes(inv.id));
  
  // Find which plan cards to highlight
  const regularUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name.toLowerCase() === 'regular');
  const premiumUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name.toLowerCase() === 'premium');
  const eliteUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name.toLowerCase() === 'elite');

  // Claim 2% Node Reward
  const handleClaimInvestmentReward = async (inv: Investment) => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const rewardAmt = inv.amount * 0.02; // 2% 
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Tavari Wave protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const claimedInvestmentIds = existingWithdrawMethods.claimed_investment_ids || [];

        // Check if already claimed
        if (claimedInvestmentIds.includes(inv.id)) {
          throw new Error("Reward has already been processed for this active node.");
        }

        const newRewardDollarBalance = (existingWithdrawMethods.reward_dollar_balance || 0) + rewardAmt;
        const newClaimedInvestmentIds = [...claimedInvestmentIds, inv.id];

        // 1. Update balances & claims inside withdraw_methods on user document
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: newRewardDollarBalance,
            claimed_investment_ids: newClaimedInvestmentIds
          }
        });

        // 2. Log transaction
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'investment_reward',
          amount: rewardAmt,
          status: 'approved',
          created_at: nowIso,
          description: `2% Automated reward on active node (${inv.plan_name})`
        });

        // 3. Log notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Investment Reward Claimed',
          message: `You claimed $${rewardAmt.toFixed(2)} (2% reward) on your active ${inv.plan_name} node investment.`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Claimed $${rewardAmt.toFixed(2)} investment reward successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Claim failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Withdrawal authentication modal
  const handleWithdrawalRequest = () => {
    if (profile?.withdrawals_frozen) {
      toast.error("Withdrawal services are currently restricted for this account.");
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt < 10) {
      toast.error("Minimum reward withdrawal threshold is $10.00.");
      return;
    }

    if (amt > reward_dollar_balance) {
      toast.error("Your Reward Dollar Balance contains insufficient funds.");
      return;
    }

    if (withdrawMethod === 'bank') {
      if (!bankName.trim() || !bankAccNumber.trim() || !bankAccName.trim()) {
        toast.error("Please fill in all banking account details.");
        return;
      }
      const profileName = profile?.name || '';
      if (bankAccName.trim().toLowerCase() !== profileName.toLowerCase()) {
        toast.error(`Registered account name must match Profile Holder: ${profileName}`);
        return;
      }
    } else {
      if (!cryptoAddress.trim()) {
        toast.error("Please provide a valid wallet address.");
        return;
      }
    }

    setShowPinModal(true);
  };

  // On correct transfer PIN callback
  const handleWithdrawSubmit = async (pin: string) => {
    const authUser = auth.currentUser;
    if (!authUser || !profile) return;

    if (pin !== profile.transfer_pin) {
      toast.error("Invalid Security Transfer PIN.");
      return;
    }

    setShowPinModal(false);
    setIsSubmitting(true);
    
    try {
      const amountRaw = parseFloat(withdrawAmount);
      const amount = Math.floor(amountRaw * 100) / 100;
      const fee = Math.floor((amount * 0.20) * 100) / 100; // 20% flat fee
      const finalAmount = Math.floor((amount - fee) * 100) / 100;
      const nowIso = new Date().toISOString();

      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Tavari Wave protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const rewardDollarBalance = existingWithdrawMethods.reward_dollar_balance || 0;

        if (amount > rewardDollarBalance) {
          throw new Error("Your Reward Dollar Balance contains insufficient funds.");
        }

        const newRewardDollarBalance = rewardDollarBalance - amount;

        // Update reward_dollar_balance inside withdraw_methods
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: newRewardDollarBalance
          }
        });

        // Submit request into withdrawals collection
        const witRef = doc(collection(db, 'withdrawals'));
        transaction.set(witRef, {
          user_id: authUser.uid,
          user_name: profile.name,
          amount: amount,
          fee: fee,
          final_amount: finalAmount,
          method: withdrawMethod,
          details: withdrawMethod === 'bank' ? {
            bank_name: bankName,
            account_number: bankAccNumber,
            account_name: bankAccName
          } : {
            address: cryptoAddress
          },
          status: 'pending',
          is_reward_withdrawal: true,
          created_at: nowIso
        });

        // Submit into transactions log
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'withdrawal',
          amount: amount,
          fee: fee,
          final_amount: finalAmount,
          status: 'pending',
          is_reward_withdrawal: true,
          created_at: nowIso,
          description: `Reward balance settlement request (${withdrawMethod.toUpperCase()})`
        });

        // Submit notification info
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'info',
          title: 'Settlement Under Verification',
          message: `Your reward withdrawal request for $${amount.toFixed(2)} with a 20% protocol fee has been submitted.`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Success! Withdrawal request of $${amount.toFixed(2)} logged for review.`);
      setWithdrawAmount('');
      setCryptoAddress('');
      setBankName('');
      setBankAccNumber('');
      setBankAccName('');
      setShowWithdrawForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to process transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-[#9CA3AF] relative font-sans">
      
      {/* Background Neon Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Edge-to-Edge Premium Header Banner with Image Background */}
      <div className="w-full mb-8 relative overflow-hidden bg-[#050608]">
        <img 
          src="https://i.imgur.com/9tUwvoe.png" 
          alt="Ecosystem Rewards Header" 
          className="w-full h-auto block select-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Relocated Premium Portal Info Panel below the header image */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED]/25 to-[#A855F7]/15 flex items-center justify-center border border-[#7C3AED]/30 shadow-[0_4px_12px_rgba(124,58,237,0.15)] backdrop-blur-md">
            <Gift className="text-[#C084FC]" size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight italic">Ecosystem Reward</h1>
            <p className="text-[10px] md:text-xs text-aura-muted font-bold leading-snug mt-1.5">Claim, convert, and withdraw your rewards seamlessly.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-[#11131f]/80 border border-[#7C3AED]/35 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#C084FC]">verified portal</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10">

        {/* 6. TOP SECTION: REWARD BALANCES & TRACKING STATS */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          {/* Card: Points Balance */}
          <div className="col-span-1 md:col-span-1 p-6 bg-[#0a0c10]/80 backdrop-blur-xl border border-white/5 rounded-[28px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#A855F7]">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-aura-muted">Points Balance</span>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-black text-white italic tracking-tight">{points_balance.toLocaleString()}</span>
              <span className="text-xs font-bold text-[#A855F7] ml-2">PTS</span>
            </div>
            
            {/* Converting interface */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold text-aura-muted">Convert points to dollar rewards (10 PTS = $1.00):</p>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="PointsAmt" 
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#7C3AED]/40 placeholder:text-gray-600 font-mono"
                />
                <button 
                  onClick={handlePointsConversion}
                  disabled={isSubmitting || !pointsInput}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                >
                  Convert
                </button>
              </div>
            </div>
          </div>

          {/* Card: Reward Dollar Balance */}
          <div className="col-span-1 md:col-span-1 p-6 bg-[#0a0c10]/80 backdrop-blur-xl border border-white/5 rounded-[28px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Coins size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-aura-muted">Balance</span>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-black text-white italic tracking-tight">${reward_dollar_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-emerald-400 font-black ml-1 uppercase">USD</span>
            </div>

            {/* Withdrawal Trigger */}
            <div className="pt-3 border-t border-white/5">
              <button 
                onClick={() => {
                  setShowMethodSelector(true);
                  setSelectedMobileMethod(null);
                }}
                disabled={reward_dollar_balance < 10}
                className={cn(
                  "w-full py-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all shadow-md",
                  reward_dollar_balance >= 10 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 active:scale-[0.98]" 
                    : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                )}
              >
                {reward_dollar_balance >= 10 ? 'Withdraw' : 'Min Settlement $10.00'}
              </button>
            </div>
          </div>

          {/* Card: Streak & Total Stats */}
          <div className="col-span-1 md:col-span-1 p-6 bg-[#0a0c10]/80 backdrop-blur-xl border border-white/5 rounded-[28px] relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Timer size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-aura-muted">Claimed Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white italic tracking-tight">{current_streak}</span>
              <span className="text-xs font-bold uppercase text-orange-400">Days Active</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">Regular daily check-ins boost your passive ecosystem multiplier.</p>
          </div>

          {/* Card: Missed Days & Total Claimed */}
          <div className="col-span-1 md:col-span-1 p-6 bg-[#0a0c10]/80 backdrop-blur-xl border border-white/5 rounded-[28px] relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Trophy size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-aura-muted">Ecosystem Activity</span>
            </div>
            <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-500">Missed days</p>
                <p className="text-xl font-black text-rose-500 italic mt-0.5">{missedDaysCount}</p>
              </div>
              <div className="pl-4">
                <p className="text-[9px] uppercase font-bold text-gray-500">Total claimed</p>
                <p className="text-xl font-black text-emerald-400 italic mt-0.5">{total_claimed_days}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">Tracking automatically syncs to local timezone clocks.</p>
          </div>

        </div>

        {/* Dynamic Rewards Settlement Drawer */}
        <AnimatePresence>
          {showWithdrawForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#11131f] border border-emerald-500/20 rounded-3xl p-6 mb-10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-emerald-400" />
                  <h3 className="text-base font-black italic text-white uppercase tracking-tight">Ecosystem Reward Settlement</h3>
                </div>
                <button 
                  onClick={() => setShowWithdrawForm(false)}
                  className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Options panel */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1.5">Withdrawal Protocol</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={() => setWithdrawMethod('bank')}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all text-center",
                          withdrawMethod === 'bank' 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                            : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                        )}
                      >
                        Bank Transfer
                      </button>
                      <button 
                        onClick={() => setWithdrawMethod('crypto')}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all text-center",
                          withdrawMethod === 'crypto' 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                            : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                        )}
                      >
                        Crypto Wallet
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1.5">Withdraw Amount (USD)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="$0.00" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-4 px-4 text-base font-bold text-white outline-none focus:border-emerald-500/50 pr-16"
                      />
                      <button 
                        type="button"
                        onClick={() => setWithdrawAmount(reward_dollar_balance.toString())}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all"
                      >
                        Max
                      </button>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 px-0.5">
                      <span>Available: ${reward_dollar_balance.toFixed(2)}</span>
                      <span>Min: $10.00</span>
                    </div>
                  </div>
                </div>

                {/* Details input panel */}
                <div className="space-y-4 flex flex-col justify-between">
                  {withdrawMethod === 'crypto' ? (
                    <div>
                      <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1.5">USDT (TRC20) Wallet Destination</label>
                      <input 
                        type="text" 
                        placeholder="TR7NHqdj61L314G1135Y68t9..."
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-700 outline-none focus:border-emerald-500/40"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1">Financial Institution (Bank Name)</label>
                        <button 
                          type="button"
                          onClick={() => setShowBankSelector(true)}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none hover:border-emerald-500/40 transition-all text-left flex items-center justify-between"
                        >
                          <span className={bankName ? "text-white font-bold" : "text-gray-500 font-medium"}>
                            {bankName || "Select Bank"}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1">Account Number</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="e.g. 1093129482103"
                          value={bankAccNumber}
                          onChange={(e) => setBankAccNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1">Holder Name (Must perfectly match profile name)</label>
                        <input 
                          type="text" 
                          placeholder={profile?.name || "Holder Name"}
                          value={bankAccName}
                          onChange={(e) => setBankAccName(e.target.value)}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Calculations & verification triggered button */}
                  <div className="bg-[#0a0c10] border border-white/5 p-4 rounded-2xl space-y-2 mt-4">
                    <div className="flex justify-between text-xs">
                      <span>Fee Fraction (20% Protocol Fee):</span>
                      <span className="text-rose-400 font-mono">-${((parseFloat(withdrawAmount) || 0) * 0.20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-white pt-2 border-t border-white/5">
                      <span>Net Settlement Payout:</span>
                      <span className="text-emerald-400 font-mono">${((parseFloat(withdrawAmount) || 0) * 0.80).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={handleWithdrawalRequest}
                      disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-[0.98] transition-all rounded-xl text-xs font-black uppercase text-white tracking-widest disabled:opacity-40"
                    >
                      Verify PIN & Log Withdrawal
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MIDDLE SECTION: CALENDAR SYSTEM & DAILY CLAIM & INVESTMENTS REWARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Horizontal Calendar Check-In Card (8 columns) */}
          <div className="lg:col-span-8 p-6 md:p-8 bg-[#11131f] border border-white/5 rounded-[32px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-[#A855F7]" size={20} />
                <div>
                  <h3 className="text-base font-black italic text-white uppercase tracking-tight">Ecosystem Check-In</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Passive rewards tracking for {monthName}</p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                {hasClaimedToday ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Checked In Today
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 text-[#C084FC] text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <AlertCircle size={12} /> Action Needed
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Dates swiper strip container */}
            <div className="relative mb-6">
              <div 
                ref={calendarContainerRef}
                className="flex overflow-x-auto gap-3.5 pb-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
              >
                {visibleDays.map((item) => {
                  if (item.isClaimed) {
                    return (
                      <div 
                        key={item.dateStr} 
                        id={`cal-day-${item.dateStr}`}
                        className="flex-shrink-0 w-20 h-24 rounded-2xl bg-gradient-to-b from-[#0e1e16] to-[#0a0f0c] border border-emerald-500/50 flex flex-col items-center justify-center snap-start text-emerald-400 relative shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:border-emerald-500 transition-all duration-300"
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500/80 mb-1">{item.dayName}</span>
                        <span className="text-base font-black text-white">{item.dayNum}</span>
                        <span className="text-[8px] font-black text-emerald-400 mt-1.5 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded">+1 PTS</span>
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow-md border border-[#0a0f0c] w-4.5 h-4.5 flex items-center justify-center">
                          <Check size={11} strokeWidth={4} className="text-[#0a0f0c]" />
                        </span>
                      </div>
                    );
                  } else if (item.isToday) {
                    return (
                      <div 
                        key={item.dateStr} 
                        id={`cal-day-${item.dateStr}`}
                        className={cn(
                          "flex-shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center snap-start relative transition-all duration-300",
                          hasClaimedToday 
                            ? "bg-gradient-to-b from-[#0f111a] to-[#090a10] border border-white/5 text-gray-500"
                            : "bg-gradient-to-b from-[#7C3AED]/20 to-[#1d1433] border-2 border-[#7C3AED] text-white animate-pulse shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                        )}
                      >
                        <span className={cn("text-[9px] font-black uppercase tracking-wider mb-1", hasClaimedToday ? "text-gray-500" : "text-purple-300")}>
                          TODAY
                        </span>
                        <span className="text-base font-black text-white">{item.dayNum}</span>
                        <span className={cn(
                          "text-[8px] font-black mt-1.5 uppercase tracking-tighter px-1.5 py-0.5 rounded",
                          hasClaimedToday ? "bg-white/5 text-gray-500" : "bg-[#7C3AED]/20 text-purple-300"
                        )}>
                          +1 PTS
                        </span>
                        {!hasClaimedToday && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#7C3AED] animate-pulse" />
                        )}
                      </div>
                    );
                  } else if (item.isPast) {
                    return (
                      <div 
                        key={item.dateStr} 
                        id={`cal-day-${item.dateStr}`}
                        className="flex-shrink-0 w-20 h-24 rounded-2xl bg-[#08090f]/40 border border-white/[0.02] flex flex-col items-center justify-center snap-start text-gray-700/50"
                      >
                        <span className="text-[8px] font-bold uppercase tracking-tight text-gray-600 mb-1">Missed</span>
                        <span className="text-sm font-normal line-through text-gray-600">{item.dayNum}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={item.dateStr} 
                        id={`cal-day-${item.dateStr}`}
                        className="flex-shrink-0 w-20 h-24 rounded-2xl bg-gradient-to-b from-[#11131f] to-[#0a0b12] border border-white/5 flex flex-col items-center justify-center snap-start text-gray-400 hover:border-white/10 transition-all duration-300"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">{item.dayName}</span>
                        <span className="text-base font-semibold text-gray-300">{item.dayNum}</span>
                        <span className="text-[8px] font-bold text-gray-600 mt-1.5 uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">+1 PTS</span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Daily claim section */}
            <div className="mt-auto bg-[#0a0c10] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Obtain Daily Attendance Loyalty Token</p>
                <p className="text-[10px] text-gray-500 mt-1">Claim 1 Loyalty Point (PTS) absolutely free every 24 hours.</p>
              </div>
              
              <button 
                onClick={handleDailyCheckIn}
                disabled={isSubmitting || !isDailyClaimable}
                className={cn(
                  "w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all italic",
                  isDailyClaimable 
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 active:scale-95 text-white shadow-[0_4px_15px_rgba(124,58,237,0.3)]" 
                    : "bg-[#11131f] text-gray-600 border border-white/5 cursor-not-allowed"
                )}
              >
                {hasClaimedToday 
                  ? "Checked-in Completed" 
                  : countdownStr 
                    ? `Next in ${countdownStr}` 
                    : "Check-in & Claim +1 PTS"}
              </button>
            </div>
          </div>

          {/* Correct highlightable investment node rewards cards (4 columns) */}
          <div className="lg:col-span-4 p-6 md:p-8 bg-[#11131f] border border-white/5 rounded-[32px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-2.5 mb-6">
              <PiggyBank className="text-[#A855F7]" size={20} />
              <div>
                <h3 className="text-base font-black italic text-white uppercase tracking-tight">Active Node Multipliers</h3>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Unlocks 2.00% instant incentives</p>
              </div>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-around">
              
              {/* Regular investment tier */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                regularUnclaimed 
                  ? "bg-[#7C3AED]/5 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.15)]" 
                  : "bg-black/30 border-white/5 opacity-60"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black text-[#A855F7] tracking-widest bg-[#7C3AED]/10 px-2 py-0.5 rounded">Regular Plan</span>
                    <p className="text-xs text-gray-500 mt-1 max-w-[150px] leading-tight flex items-center gap-1">
                      {regularUnclaimed ? 'Active investment node' : 'No unclaimed regular rewards'}
                    </p>
                  </div>
                  {regularUnclaimed && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">Available Reward:</p>
                      <p className="text-sm font-black text-white italic">${(regularUnclaimed.amount * 0.02).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {regularUnclaimed && (
                  <button 
                    onClick={() => handleClaimInvestmentReward(regularUnclaimed)}
                    disabled={isSubmitting}
                    className="w-full mt-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Claim 2% Reward
                  </button>
                )}
              </div>

              {/* Premium investment tier */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                premiumUnclaimed 
                  ? "bg-emerald-500/5 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                  : "bg-black/30 border-white/5 opacity-60"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Premium Plan</span>
                    <p className="text-xs text-gray-500 mt-1 max-w-[150px] leading-tight flex items-center gap-1">
                      {premiumUnclaimed ? 'Active investment node' : 'No unclaimed premium rewards'}
                    </p>
                  </div>
                  {premiumUnclaimed && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">Available Reward:</p>
                      <p className="text-sm font-black text-white italic">${(premiumUnclaimed.amount * 0.02).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {premiumUnclaimed && (
                  <button 
                    onClick={() => handleClaimInvestmentReward(premiumUnclaimed)}
                    disabled={isSubmitting}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Claim 2% Reward
                  </button>
                )}
              </div>

              {/* Elite investment tier */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                eliteUnclaimed 
                  ? "bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                  : "bg-black/30 border-white/5 opacity-60"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-black text-amber-500 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">Elite Plan</span>
                    <p className="text-xs text-gray-500 mt-1 max-w-[150px] leading-tight flex items-center gap-1">
                      {eliteUnclaimed ? 'Active investment node' : 'No unclaimed elite rewards'}
                    </p>
                  </div>
                  {eliteUnclaimed && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">Available Reward:</p>
                      <p className="text-sm font-black text-white italic">${(eliteUnclaimed.amount * 0.02).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {eliteUnclaimed && (
                  <button 
                    onClick={() => handleClaimInvestmentReward(eliteUnclaimed)}
                    disabled={isSubmitting}
                    className="w-full mt-3 py-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Claim 2% Reward
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* --- DUAL-COLUMN ELITE REFERRAL MODULE GRID (8 + 4 cols) --- */}
        <div id="referral-rewards-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Card 1: Redesigned Referral Metrics Card (8 columns) */}
          <div className="lg:col-span-8 relative overflow-visible rounded-[32px] border-2 border-purple-500/25 bg-gradient-to-br from-[#121524]/95 via-purple-950/20 to-[#0e111a]/95 p-6 md:p-8 shadow-[0_20px_50px_rgba(168,85,247,0.12)] select-none">
            {/* Background glowing gradients */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 right-10 w-48 h-48 bg-pink-500/10 blur-[90px] rounded-full pointer-events-none" />
            
            {/* Extremely Premium overlapping 3D gift/wave visual graphic extending OUTSIDE boundaries */}
            <div className="absolute -right-6 -bottom-6 w-56 h-56 pointer-events-none opacity-85 hidden sm:block overflow-visible select-none">
               <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(168,85,247,0.4)]">
                 <defs>
                   <linearGradient id="glowG" x1="0" y1="0" x2="1" y2="1">
                     <stop offset="0%" stopColor="#ec4899" />
                     <stop offset="100%" stopColor="#8b5cf6" />
                   </linearGradient>
                 </defs>
                 {/* Floating floating sparks outside the box */}
                 <polygon points="12,18 18,12 24,18 18,24" fill="#fbbf24" opacity="0.8" />
                 <polygon points="80,50 84,46 88,50 84,54" fill="#67e8f9" opacity="0.6" />
                 
                 {/* Overlay circles for lighting */}
                 <circle cx="50" cy="50" r="32" fill="none" stroke="url(#glowG)" strokeWidth="0.5" strokeDasharray="3 3" />
                 
                 {/* Overlapping box elements */}
                 <path d="M 30,55 L 70,30 L 50,15 L 10,40 Z" fill="url(#glowG)" opacity="0.15" />
                 <path d="M 50,55 L 90,30 L 70,15 L 30,40 Z" fill="url(#glowG)" opacity="0.2" />
                 {/* Premium 3D Box lid and ribbon */}
                 <path d="M 40,58 L 80,38 L 50,22 L 10,42 Z" fill="url(#glowG)" />
                 <path d="M 10,42 L 50,62 L 50,95 L 10,75 Z" fill="#6d28d9" />
                 <path d="M 80,38 L 50,62 L 50,95 L 80,71 Z" fill="#4c1d95" />
                 <path d="M 50,62 L 50,95" stroke="#f472b6" strokeWidth="2.5" />
                 <path d="M 30,48 Q 50,25 50,15 Q 50,25 70,48 Q 50,58 30,48 Z" fill="#f43f5e" opacity="0.9" />
               </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[#A855F7] shadow-[0_4px_20px_rgba(168,85,247,0.2)]">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic text-white uppercase tracking-tight">Referral Matrix</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Earn spendable payouts of 5.00% under Elite Commission Tier</p>
                </div>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-center backdrop-blur-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Network</span>
                <span className="text-2xl sm:text-3xl font-black text-white italic font-serif leading-none">{profile?.referrals_count || 0}</span>
                <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest block mt-1">Partners</span>
              </div>
              
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-center backdrop-blur-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Active Nodes</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic font-serif leading-none">{profile?.active_referrals || 0}</span>
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block mt-1">First-Invested</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-5 bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20 rounded-2xl text-center backdrop-blur-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Referral Wallet</span>
                <span className="text-2xl sm:text-3xl font-black text-white italic font-serif leading-none">
                  {formatCurrency(profile?.referral_earnings || 0)}
                </span>
                <span className="text-[8px] font-bold text-pink-400 uppercase tracking-widest block mt-1">Unclaimed Payouts Available</span>
              </div>
            </div>

            {/* Connection / Share Area */}
            <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4 max-w-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Unique Invite Code</span>
                  <span className="text-xs font-black text-white tracking-[0.2em]">{profile?.referral_code || '---'}</span>
                </div>
                <div className="h-px sm:h-8 w-full sm:w-px bg-white/5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Network Referral Link</span>
                  <span className="text-[10px] font-bold text-white/50 truncate block mt-0.5 font-mono">
                    {profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    const link = profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`;
                    navigator.clipboard.writeText(link);
                    toast.success("Referral invitation link copied to clipboard!");
                  }}
                  className="px-4 py-2.5 bg-[#4c1d95] hover:bg-purple-600 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all self-stretch sm:self-center flex items-center justify-center gap-1.5 border border-purple-500/20 shadow-md cursor-pointer"
                >
                  <Copy size={12} /> Copy Share Link
                </button>
              </div>
            </div>

          </div>

          {/* Card 2: Referral Reward Claim Card (4 columns) */}
          <div className="lg:col-span-4 p-6 md:p-8 bg-[#11131f] border border-white/5 rounded-[32px] flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-2.5 mb-4">
              <Trophy className="text-purple-400" size={20} />
              <div>
                <h3 className="text-sm font-black italic text-white uppercase tracking-tight">Referral Rewards</h3>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Claim 5.00% pending payouts</p>
              </div>
            </div>

            {/* List claims */}
            <div className="flex-1 mt-2 overflow-y-auto space-y-3.5 pr-1 max-h-[280px] scrollbar-thin scrollbar-thumb-white/5">
              {referralClaims.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-black/20 border border-white/5 rounded-2xl">
                  <Gift size={24} className="text-gray-600 mb-2 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest leading-normal">
                    No Payouts Available
                  </span>
                  <span className="text-[8px] text-gray-600 leading-normal mt-1 block">
                    Your referral ledger is pristine. Payouts materialize here when direct partners activate nodes.
                  </span>
                </div>
              ) : (
                referralClaims.map((claim) => (
                  <div 
                    key={claim.id} 
                    className="p-3.5 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between gap-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {claim.type === 'referrer' ? 'Commission' : 'Welcome'}
                        </span>
                        <span className="text-[9px] text-gray-400 capitalize truncate max-w-[100px]">
                          Partner: {claim.partner_name}
                        </span>
                      </div>
                      <div className="text-xs font-black text-white mt-1">
                        Amount: {formatCurrency(claim.amount)}
                      </div>
                      <div className="text-[8px] text-gray-600 mt-0.5">
                        {new Date(claim.created_at || '').toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {claim.status === 'pending' ? (
                        <button 
                          onClick={() => handleClaimReward(claim)}
                          disabled={isClaimingId === claim.id}
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-pink-500/10 cursor-pointer"
                        >
                          {isClaimingId === claim.id ? 'Claiming' : 'Claim'}
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-xl">
                          Claimed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* REWARD TRANSACTION HISTORY SECTION */}
        <div id="reward-history-section" className="mb-10 p-6 md:p-8 bg-[#11131f] border border-white/5 rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-[#A855F7]">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-base font-black italic text-white uppercase tracking-tight">Reward Activity Ledger</h3>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Historical records of claimed points, conversion swaps, and settlements</p>
            </div>
          </div>

          {rewardHistory.length === 0 ? (
            <div id="no-reward-tx-msg" className="bg-[#0a0c10] border border-white/5 rounded-2xl p-8 text-center text-xs text-aura-muted font-bold uppercase tracking-widest">
              No reward records detected.
            </div>
          ) : (
            <div id="reward-tx-grid" className="grid gap-3 max-h-[480px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/5">
              {rewardHistory.map((tx, idx) => (
                <TransactionTicket 
                  key={`${tx.id}-${idx}`}
                  tx={tx}
                  currentUserId={user?.uid ?? undefined}
                  variant="fund"
                />
              ))}
            </div>
          )}
        </div>

        {/* 6. BOTTOM SECTION: COMPREHENSIVE INSTRUCTIONS / EXPLANATION CARD */}
        <div className="p-8 md:p-12 rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#11131f]/90 via-[#7C3AED]/10 to-[#11131f]/90 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-4 space-y-4 text-center lg:text-left">
              <div className="inline-block px-3 py-1 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-full text-[10px] font-black text-[#A855F7] uppercase tracking-widest mb-2">Platform Protocol</div>
              <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Loyalty Reward Guide</h3>
              <p className="text-xs text-aura-muted leading-relaxed">
                Discover the mechanics governing our automated checking systems, instant points conversion and secure settlement policies designed for elite network nodes.
              </p>
            </div>

            <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
              {GUIDE_CARDS.map((card) => (
                <div 
                  key={card.id}
                  id={`guide-card-${card.id}`}
                  onClick={() => setSelectedGuide(card)}
                  style={{ '--glow-color': card.glowColor } as React.CSSProperties}
                  className={cn(
                    "p-6 rounded-[24px] bg-[#0a0c14] border border-white/5 space-y-3 cursor-pointer select-none",
                    "transition-all duration-300 hover:scale-[1.02]",
                    "hover:shadow-[0_4px_25px_var(--glow-color)] hover:border-[#7C3AED]/40 active:scale-[0.99] group/card"
                  )}
                >
                  <h4 className="text-sm font-black text-white flex items-center gap-2.5 transition-all">
                    <span 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: card.iconColor, color: card.iconColor }}
                    /> 
                    {card.title}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">
                    {card.shortDesc}
                  </p>
                  <div className="pt-2 flex items-center gap-1 text-[9px] uppercase font-black text-[#A855F7] tracking-widest opacity-60 group-hover/card:opacity-100 transition-opacity">
                    See protocol detail →
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Enlarged Premium Popup/Modal for clicked guide card */}
      <AnimatePresence>
        {selectedGuide && (
          <div id="guide-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0f111a] border border-[#7C3AED]/30 rounded-[32px] max-w-lg w-full p-6 md:p-8 relative overflow-hidden shadow-[0_10px_50px_rgba(124,58,237,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 blur-3xl rounded-full" />
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedGuide(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: selectedGuide.iconColor }}
                />
                <h3 className="text-lg md:text-xl font-black text-white italic tracking-tight uppercase">
                  {selectedGuide.title}
                </h3>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 text-left">
                <p className="text-xs md:text-sm font-bold text-purple-300 leading-relaxed">
                  {selectedGuide.shortDesc}
                </p>
                <div className="text-[11px] text-aura-muted leading-relaxed whitespace-pre-wrap font-sans bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                  {selectedGuide.fullDesc}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setSelectedGuide(null)}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payout Selection Modal/Sheet for Mobile and General Unified Premium Payout Flow */}
      <AnimatePresence>
        {showMethodSelector && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setShowMethodSelector(false);
              setSelectedMobileMethod(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0f111a] border border-white/10 rounded-[28px] max-w-lg w-full p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[88vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-emerald-400" />
                  <h3 className="text-base font-black italic text-white uppercase tracking-tight">
                    {selectedMobileMethod ? 'Withdrawal Form' : 'Select Payout Method'}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMethodSelector(false);
                    setSelectedMobileMethod(null);
                  }}
                  className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {!isWithdrawalAllowed() ? (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 mx-auto bg-rose-500/5 border border-rose-500/15 rounded-full flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.08)] relative">
                    <Lock size={20} className="animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-rose-500/5 animate-ping opacity-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-wide font-sans">Portal Closed</h3>
                    <p className="text-[9px] font-black text-rose-400 py-0.5 px-2 bg-rose-500/5 rounded-full border border-rose-500/10 inline-block font-mono">
                      Service temporarily closed
                    </p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed font-medium max-w-[280px]">
                    Withdrawals are currently unavailable. Withdrawal window reopens Monday 9:00 AM GMT+1.
                  </p>
                  <div className="pt-4 border-t border-white/[0.04] w-full">
                    <div className="text-[9px] font-semibold text-white/30 tracking-wide font-sans">
                      Operational window: Mon 9:00 AM – Fri 4:00 PM (GMT+1)
                    </div>
                  </div>
                </div>
              ) : !selectedMobileMethod ? (
                // Step 1: Payout Method Options
                <div className="space-y-4">
                  <p className="text-xs text-[#9CA3AF] mb-4 text-left">Choose your preferred settlement option below to proceed.</p>
                  
                  <button
                    onClick={() => {
                      setWithdrawMethod('bank');
                      setSelectedMobileMethod('bank');
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center text-[#A855F7] group-hover:scale-105 transition-transform">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <span className="block text-xs font-black uppercase text-white tracking-wider">Bank Transfer</span>
                        <span className="text-[10px] text-gray-400">Local or international direct bank settlement.</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setWithdrawMethod('crypto');
                      setSelectedMobileMethod('crypto');
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <span className="block text-xs font-black uppercase text-white tracking-wider">Crypto Wallet</span>
                        <span className="text-[10px] text-gray-400">Withdraw instantly using USDT (TRC20) network.</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                // Step 2: Withdrawal Form Inputs
                <div className="space-y-4 text-left">
                  {/* Back button */}
                  <button 
                    onClick={() => setSelectedMobileMethod(null)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors mb-2"
                  >
                    ← Change Method
                  </button>

                  <div>
                    <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1.5">Withdraw Amount (USD)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="$0.00" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                      />
                      <button 
                        onClick={() => setWithdrawAmount(reward_dollar_balance.toString())}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all"
                      >
                        All
                      </button>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-0.5">
                      <span>Available: ${reward_dollar_balance.toFixed(2)}</span>
                      <span>Min: $10.00</span>
                    </div>
                  </div>

                  {selectedMobileMethod === 'crypto' ? (
                    <div>
                      <label className="text-xs font-bold text-aura-muted uppercase tracking-widest block mb-1.5">USDT (TRC20) Wallet Destination</label>
                      <input 
                        type="text" 
                        placeholder="TR7NHqdj61L314G1135Y68t9..."
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-gray-700 outline-none focus:border-emerald-500/40"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Bank Name</label>
                        <button 
                          type="button"
                          onClick={() => setShowBankSelector(true)}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none hover:border-emerald-500/40 transition-all text-left flex items-center justify-between"
                        >
                          <span className={bankName ? "text-white font-bold" : "text-gray-500 font-medium"}>
                            {bankName || "Select Bank"}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Account Number</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="e.g. 1093129482103"
                          value={bankAccNumber}
                          onChange={(e) => setBankAccNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Holder Name</label>
                        <input 
                          type="text" 
                          placeholder={profile?.name || "Holder Name"}
                          value={bankAccName}
                          onChange={(e) => setBankAccName(e.target.value)}
                          className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pricing/Protocol fee breakdown */}
                  <div className="bg-[#0a0c10] border border-white/5 p-4 rounded-2xl space-y-2 mt-4 text-xs shrink-0">
                    <div className="flex justify-between">
                      <span>Fee Fraction (20% Protocol Fee):</span>
                      <span className="text-rose-400 font-mono">-${((parseFloat(withdrawAmount) || 0) * 0.20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-white pt-2 border-t border-white/5">
                      <span>Net Payout:</span>
                      <span className="text-emerald-400 font-mono">${((parseFloat(withdrawAmount) || 0) * 0.80).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        // Validate first
                        if (!withdrawAmount || parseFloat(withdrawAmount) < 10) {
                          toast.error("Minimum settlement is $10.00");
                          return;
                        }
                        if (parseFloat(withdrawAmount) > reward_dollar_balance) {
                          toast.error("Requested amount exceeds available balance.");
                          return;
                        }
                        if (selectedMobileMethod === 'crypto' && !cryptoAddress) {
                          toast.error("Please provide a USDT destination wallet.");
                          return;
                        }
                        if (selectedMobileMethod === 'bank' && (!bankName || !bankAccNumber || !bankAccName)) {
                          toast.error("Please provide complete bank account details.");
                          return;
                        }
                        
                        // Close modal, then open PIN modal
                        setShowMethodSelector(false);
                        setShowPinModal(true);
                      }}
                      disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-[0.98] transition-all rounded-xl text-xs font-black uppercase text-white tracking-widest disabled:opacity-40"
                    >
                      Verify PIN & Log Withdrawal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security Verifications PIN code verification drawer modal */}
      <PinProtocolModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleWithdrawSubmit}
      />

      {/* Selectable Nigerian bank list modal */}
      <BankSelectorModal 
        isOpen={showBankSelector}
        onClose={() => setShowBankSelector(false)}
        onSelect={(bank) => setBankName(bank)}
        selectedBank={bankName}
      />

    </div>
  );
}
