import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Unlock, 
  Play, 
  Cpu, 
  Zap, 
  Sparkles, 
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Info,
  TrendingUp,
  Activity,
  Award,
  Copy,
  ExternalLink,
  Globe,
  Coins,
  MessageSquare,
  CheckCircle,
  QrCode
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { detectUserLocation } from '../utils/geo';

interface ColorTheme {
  primary: string;
  bg: string;
  border: string;
  borderHover: string;
  glow: string;
  badge: string;
  btnGrad: string;
  activeBorder: string;
  activeShadow: string;
  textGlow: string;
}

interface Robot {
  id: string;
  name: string;
  version: string;
  roi: string;
  roiRate: number;
  upgradePrice: number;
  image: string;
  description: string;
  speed: string;
  accuracy: string;
  strategy: string;
  riskProfile: string;
  executionDetails: string;
  colorTheme: ColorTheme;
}

const ROBOTS: Robot[] = [
  {
    id: 'ai-1.8',
    name: 'AI 1.8',
    version: 'v1.8.4-alpha',
    roi: '0.5%',
    roiRate: 0.005,
    upgradePrice: 7.5,
    image: 'https://i.imgur.com/qkFHhDR.png',
    description: 'Entry-level institutional high-frequency trading algorithm with microsecond arbitrage execution.',
    speed: '0.4ms latency',
    accuracy: '94.8% success rate',
    strategy: 'High-Frequency Arbitrage & Spread Capture',
    riskProfile: 'Very Low - Neutral Hedged',
    executionDetails: 'Continuously polls micro-liquidity differences across G10 forex and key cryptocurrency token pools to capitalize on micro-spread discrepancies.',
    colorTheme: {
      primary: 'text-amber-400',
      bg: 'from-amber-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-amber-500/10',
      borderHover: 'hover:border-amber-500/20',
      glow: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnGrad: 'from-amber-600 to-amber-500 hover:shadow-amber-500/20',
      activeBorder: 'border-amber-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]'
    }
  },
  {
    id: 'ai-2.0',
    name: 'AI 2.0',
    version: 'v2.0.1-stable',
    roi: '1.0%',
    roiRate: 0.01,
    upgradePrice: 12,
    image: 'https://i.imgur.com/JGTKlCJ.png',
    description: 'Neural-network based trading engine optimized for G10 currency liquidity and spread arbitrage.',
    speed: '0.2ms latency',
    accuracy: '97.2% success rate',
    strategy: 'Deep Neural Network Trend Prediction',
    riskProfile: 'Low - Conservative Balanced',
    executionDetails: 'Deploys a feed-forward recursive neural network tracking order book pressure from institutional liquidity partners for short-term trend execution.',
    colorTheme: {
      primary: 'text-emerald-400',
      bg: 'from-emerald-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-emerald-500/10',
      borderHover: 'hover:border-emerald-500/20',
      glow: 'bg-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnGrad: 'from-emerald-600 to-emerald-500 hover:shadow-emerald-500/20',
      activeBorder: 'border-emerald-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'
    }
  },
  {
    id: 'ai-2.5',
    name: 'AI 2.5',
    version: 'v2.5.0-beta',
    roi: '1.5%',
    roiRate: 0.015,
    upgradePrice: 15,
    image: 'https://i.imgur.com/3DpE79P.png',
    description: 'Advanced multi-agent deep learning model optimized for cross-border treasury swaps and volatility tracking.',
    speed: '0.1ms latency',
    accuracy: '98.9% success rate',
    strategy: 'Multi-Agent Reinforcement Learning',
    riskProfile: 'Moderate - Dynamic Rebalancing',
    executionDetails: 'Employs automated reinforcement learning agents acting in cooperative micro-pools to optimize synthetic swap spreads and volatility hedge offsets.',
    colorTheme: {
      primary: 'text-cyan-400',
      bg: 'from-cyan-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-cyan-500/10',
      borderHover: 'hover:border-cyan-500/20',
      glow: 'bg-cyan-500',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      btnGrad: 'from-cyan-600 to-cyan-500 hover:shadow-cyan-500/20',
      activeBorder: 'border-cyan-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]'
    }
  },
  {
    id: 'ai-3.0',
    name: 'AI 3.0',
    version: 'v3.0.0-enterprise',
    roi: '2.5%',
    roiRate: 0.025,
    upgradePrice: 20,
    image: 'https://i.imgur.com/dZqi2MZ.png',
    description: 'The pinnacle of automated trading technology. Employs quantum-resistant predictive analysis and sovereign hedging pools.',
    speed: '0.05ms latency',
    accuracy: '99.7% success rate',
    strategy: 'Quantum-Inspired Predictive Sovereignty Pool',
    riskProfile: 'Institutional Safe Sovereign',
    executionDetails: 'Our flagship algorithmic solution. Integrates high-dimensional quantum-inspired neural predictors with multi-tiered sovereign pool insurance backups.',
    colorTheme: {
      primary: 'text-purple-400',
      bg: 'from-purple-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-purple-500/10',
      borderHover: 'hover:border-purple-500/20',
      glow: 'bg-purple-500',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      btnGrad: 'from-purple-600 to-purple-500 hover:shadow-purple-500/20',
      activeBorder: 'border-purple-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]'
    }
  }
];

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  erc20: "0x264E87AA85CBC641cBC4261a193bdc9948934E6D",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

export default function AIMarketplace() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pendingUpgrades, setPendingUpgrades] = useState<string[]>([]);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  
  // Custom Flow States
  const [currentView, setCurrentView] = useState<'marketplace' | 'pay' | 'success'>('marketplace');
  const [transactionId, setTransactionId] = useState<string>('');
  const [selectedCrypto, setSelectedCrypto] = useState<'usdt' | 'erc20' | 'btc'>('usdt');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [paymentMode, setPaymentMode] = useState<'transfer' | 'wallet'>('transfer');
  const [selectedWalletSource, setSelectedWalletSource] = useState<'available_balance' | 'funding_balance' | null>(null);
  const [enableWalletUpgradePayment, setEnableWalletUpgradePayment] = useState<boolean>(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
      if (tz.includes('lagos')) return 'Nigeria';
    } catch (e) {}
    return 'Nigeria';
  });

  // Load system exchange rate and wallet payment settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'system'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setExchangeRate(data.usd_to_ngn_rate || 1400);
        setEnableWalletUpgradePayment(data.enable_wallet_upgrade_payment !== undefined ? !!data.enable_wallet_upgrade_payment : true);
      }
    }, (err) => {
      console.error("Failed to load settings snapshot:", err);
    });
    return () => unsubscribe();
  }, []);

  // Geolocation detection
  useEffect(() => {
    async function loadDetectedLocation() {
      try {
        const result = await detectUserLocation();
        setDetectedCountry(result.country);
      } catch (err) {
        console.error("Failed to run geolocation protocol:", err);
      }
    }
    loadDetectedLocation();
  }, []);

  const selectedCountry = profile?.country || profile?.countryName || detectedCountry || 'Nigeria';
  const isNigeria = selectedCountry === 'Nigeria';

  // Subscribe to pending upgrade transaction requests for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('type', '==', 'ai_upgrade'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingNames = snapshot.docs.map(doc => doc.data().robot_name || doc.data().selected_bot);
      setPendingUpgrades(pendingNames);
    }, (error) => {
      console.error("Error subscribing to pending robot upgrades:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpgrade = (robot: Robot) => {
    setSelectedRobot(robot);
    setTransactionId('');
    setCurrentView('pay');
    
    // Determine default eligible wallet based on selected robot price
    const avail = profile?.available_balance || 0;
    const fund = profile?.funding_balance || 0;
    const price = robot.upgradePrice;
    if (avail >= price) {
      setSelectedWalletSource('available_balance');
    } else if (fund >= price) {
      setSelectedWalletSource('funding_balance');
    } else {
      setSelectedWalletSource(null);
    }
    // Default mode is always transfer
    setPaymentMode('transfer');
  };

  const handleActivate = async (robot: Robot) => {
    if (!user) return;
    setIsActivating(robot.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        active_robot: robot.name
      });
      toast.success(`${robot.name} engine activated successfully!`);
    } catch (error) {
      console.error("Activation failed:", error);
      toast.error("Failed to activate trading robot.");
    } finally {
      setIsActivating(null);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleContactSupport = () => {
    if (!selectedRobot) return;
    const number = "+2347052532095";
    const text = `Hello Support Team,

I have completed payment for an AI Trading Bot upgrade.

Bot Version: ${selectedRobot.name}

Kindly review and approve my upgrade request so I can activate the trading bot within my account.

Thank you.`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/2347052532095?text=${encodedText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOkClick = () => {
    setCurrentView('marketplace');
    setSelectedRobot(null);
    setTransactionId('');
  };

  const handleSubmitPayment = async () => {
    if (!user || !selectedRobot || !transactionId) return;
    setIsSubmitting(true);
    try {
      const txData = {
        user_id: user.uid,
        user_name: profile?.username || profile?.name || user.email || 'Anonymous',
        type: 'ai_upgrade',
        robot_name: selectedRobot.name,
        selected_bot: selectedRobot.name,
        amount: selectedRobot.upgradePrice,
        transaction_id: transactionId,
        tx_id: transactionId,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), txData);
      toast.success("AI Bot Upgrade payment submitted!");
      setCurrentView('success');
    } catch (err) {
      console.error("Payment submission failed:", err);
      toast.error("Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!user || !profile || !selectedRobot || !selectedWalletSource) return;

    if (!enableWalletUpgradePayment) {
      toast.error("Wallet payment for AI Bot upgrades is currently disabled.");
      return;
    }

    const price = selectedRobot.upgradePrice;
    const sourceWallet = selectedWalletSource;
    const currentBalance = profile[sourceWallet] || 0;

    if (currentBalance < price) {
      toast.error(`Insufficient ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} for this upgrade.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { runTransaction, doc, collection } = await import('firebase/firestore');
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User document not found.");

        const userData = userSnap.data();
        const freshBalance = userData[sourceWallet] || 0;
        if (freshBalance < price) {
          throw new Error(`Insufficient ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} for this upgrade.`);
        }

        // 1. Deduct funds from the selected wallet
        const userUpdates: any = {
          [sourceWallet]: freshBalance - price
        };

        // 2. Unlock the robot immediately (since wallet payment is auto-approved)
        const unlocked = userData.unlocked_robots || [];
        const robotName = selectedRobot.name;
        const updatedUnlocked = unlocked.includes(robotName) ? unlocked : [...unlocked, robotName];
        userUpdates.unlocked_robots = updatedUnlocked;

        transaction.update(userRef, userUpdates);

        // 3. Create normal transaction history entry marked as 'Approved' / 'Active'
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          user_name: userData.username || userData.name || user.email || 'Anonymous',
          type: 'ai_upgrade',
          robot_name: selectedRobot.name,
          selected_bot: selectedRobot.name,
          amount: price,
          transaction_id: `wallet_${sourceWallet}_${Date.now()}`,
          tx_id: `wallet_${sourceWallet}_${Date.now()}`,
          status: 'Active',
          created_at: new Date().toISOString()
        });

        // 4. Create a notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          title: 'AI Trading Robot Unlocked! 🤖',
          message: `Your payment of $${price} from your ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} has been processed. ${robotName} has been unlocked immediately.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success(`${selectedRobot.name} unlocked successfully using wallet funds!`);
      setCurrentView('success');
    } catch (error: any) {
      console.error("Wallet upgrade failed:", error);
      toast.error(error.message || "Failed to complete wallet payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlockedRobots = profile?.unlocked_robots || [];
  const activeRobotName = profile?.active_robot;
  const avail = profile?.available_balance || 0;
  const fund = profile?.funding_balance || 0;
  const showWalletOption = selectedRobot ? (enableWalletUpgradePayment && (avail >= selectedRobot.upgradePrice || fund >= selectedRobot.upgradePrice)) : false;

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#06080c]">
      {/* BACKGROUND IMAGE REFINEMENT: Reduce background image opacity/visibility to approximately 50% */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none z-0" 
        style={{ 
          backgroundImage: "url('https://i.imgur.com/4PGuFdH.png')",
          opacity: 0.5
        }} 
      />
      {/* Subtle white overlay above background image to create a lighter appearance behind content and elevate contrast */}
      <div className="absolute inset-0 bg-white/[0.04] pointer-events-none z-0" />

      {/* CSS style injection for continuous, hardware-accelerated marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 35s linear infinite;
        }
      `}</style>

      {/* Decorative Cybernetic Background elements */}
      <div className="absolute top-[500px] left-0 w-full h-[600px] bg-gradient-to-b from-purple-950/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HERO BACKGROUND REPLACEMENT - Edge-to-edge rendering */}
      <div className="w-full relative h-[260px] sm:h-[340px] lg:h-[420px] overflow-hidden border-b border-white/5">
        <img 
          src="https://i.imgur.com/st3mBBm.png" 
          alt="AI Portal Banner" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        {/* Cinema shadow gradients to isolate content */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c]/80 via-transparent to-black/50" />

        {/* Subtle full-width glassmorphism strip spanning horizontally floating over the bottom area of the Hero Section */}
        <div className="absolute bottom-4 left-0 right-0 w-full bg-black/45 backdrop-blur-[8px] border-y border-white/10 py-2.5 px-4 sm:px-8 z-20 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {/* Pulsing indicator */}
          <div className="flex items-center gap-1.5 mr-3 sm:mr-4 border-r border-white/10 pr-3 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black tracking-widest text-cyan-400 uppercase font-mono">SYSTEM LOG</span>
          </div>

          {/* Marquee Text */}
          <div className="flex-1 overflow-hidden relative w-full h-4 sm:h-5">
            <div className="animate-marquee whitespace-nowrap text-[9px] sm:text-xs font-semibold text-white/90 tracking-wider inline-block">
              Deploy ultra-high-frequency algorithmic trading robots powered by recurrent neural networks. Upgrade to unlock faster, higher-yield execution layers. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Deploy ultra-high-frequency algorithmic trading robots powered by recurrent neural networks. Upgrade to unlock faster, higher-yield execution layers.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-12 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {/* VIEW 1: MARKETPLACE */}
          {(currentView === 'marketplace' || currentView === 'pay' || currentView === 'success') && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Compact 2x2 on Mobile / 4-column on Desktop Grid Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {ROBOTS.map((robot) => {
                  const isUnlocked = unlockedRobots.includes(robot.name);
                  const isActive = activeRobotName === robot.name;
                  const isPending = pendingUpgrades.includes(robot.name);
                  const isLocked = !isUnlocked;
                  const theme = robot.colorTheme;

                  return (
                    <div key={robot.id} className="flex flex-col gap-3.5 sm:gap-4 h-full">
                      {/* Square Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={cn(
                          "relative group rounded-[20px] sm:rounded-[36px] border transition-all duration-500 flex flex-col justify-between overflow-hidden backdrop-blur-2xl p-3 sm:p-5 aspect-square select-none hover:-translate-y-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.95)] bg-gradient-to-b from-[#0c0e14]/98 to-[#06080c]/98 w-full",
                          theme.border,
                          theme.borderHover,
                          isActive ? cn(theme.activeBorder, theme.activeShadow, "shadow-[0_0_35px_rgba(255,255,255,0.08)]") : ""
                        )}
                      >
                        {/* Visual Status Indicator / Pulse effect */}
                        {isActive && (
                          <div className={cn("absolute inset-0 border rounded-[20px] sm:rounded-[36px] pointer-events-none animate-[pulse_2s_infinite]", theme.activeBorder)} />
                        )}

                        {/* Top Bar with Name & Learn More */}
                        <div className="flex justify-between items-center z-10 w-full mb-1 sm:mb-1.5">
                          <span className={cn("text-[9px] sm:text-xs font-black tracking-wider uppercase", theme.primary)}>
                            {robot.name}
                          </span>
                          
                          <button
                            onClick={() => setSelectedRobot(robot)}
                            className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-white/5 hover:bg-white/10 text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-gray-300 hover:text-white border border-white/10 rounded-full transition-all duration-300 cursor-pointer"
                          >
                            Learn More
                          </button>
                        </div>

                        {/* Centered Robot Image Area */}
                        <div className="relative flex-1 flex flex-col items-center justify-center my-1 sm:my-2 w-full min-h-0">
                          {/* Glowing Aura Behind Robot */}
                          <div className={cn(
                            "absolute w-16 h-16 sm:w-28 sm:h-28 rounded-full blur-2xl opacity-40 transition-all duration-500",
                            isActive ? theme.glow : "bg-gray-800/20"
                          )} />
                          
                          {/* Robot Image Wrapper perfectly centered and scaled */}
                          <div className="relative z-10 w-[82%] h-[82%] flex items-center justify-center">
                            <img 
                              src={robot.image} 
                              alt={robot.name} 
                              className={cn(
                                "w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.7)]",
                                isLocked && "grayscale opacity-40"
                              )}
                              referrerPolicy="no-referrer"
                            />

                            {/* Lock Overlay */}
                            {isLocked && !isPending && (
                              <div className="absolute top-0.5 left-0.5 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-gray-300 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center z-20">
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Stats - Only ROI percentage inside the card */}
                        <div className="flex flex-col items-center z-10 w-full mt-auto">
                          <span className="text-[9px] sm:text-xs font-black tracking-wide text-white/95">
                            {robot.roi} Daily ROI
                          </span>
                        </div>
                      </motion.div>

                      {/* Unlock / Upgrade / Activate button placed outside and centered horizontally below each card */}
                      <div className="w-full flex justify-center">
                        {isActive ? (
                          <span 
                            className="w-full py-3 sm:py-4 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
                          >
                            <Check size={14} className="sm:w-4 sm:h-4" />
                            Active
                          </span>
                        ) : isPending ? (
                          <span 
                            className="w-full py-3 sm:py-4 bg-yellow-400/15 text-yellow-500 border border-yellow-400/30 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(234,179,8,0.1)]"
                          >
                            <Clock size={14} className="animate-spin sm:w-4 sm:h-4" />
                            Pending
                          </span>
                        ) : isUnlocked ? (
                          <button 
                            onClick={() => handleActivate(robot)}
                            disabled={isActivating !== null}
                            className="w-full py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isActivating === robot.id ? (
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play size={14} fill="currentColor" className="sm:w-4 sm:h-4" />
                            )}
                            Activate
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpgrade(robot)}
                            className={cn(
                              "w-full py-3 sm:py-4 bg-gradient-to-r text-white font-black rounded-2xl text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95",
                              theme.btnGrad
                            )}
                          >
                            <Zap size={14} className="sm:w-4 sm:h-4" />
                            Unlock {formatCurrency(robot.upgradePrice)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STYLE INJECTION TO HIDE NAVBARS AND PREVENT BACKGROUND SCROLLING */}
      {(currentView === 'pay' || currentView === 'success') && (
        <style>{`
          /* Hide Top Navbar */
          nav.sticky.top-4, .sticky.top-4 {
            display: none !important;
          }
          /* Hide Mobile Bottom Nav */
          nav.lg\\:hidden.fixed.bottom-5, nav.bottom-5 {
            display: none !important;
          }
          /* Prevent background page scrolling */
          body {
            overflow: hidden !important;
          }
        `}</style>
      )}

      {/* PREMIUM RESPONSIVE DIALOG (MODAL OVERLAY) */}
      <AnimatePresence>
        {(currentView === 'pay' || currentView === 'success') && selectedRobot && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* Elegant backdrop with dark overlay and blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (currentView === 'pay') {
                  setCurrentView('marketplace');
                  setSelectedRobot(null);
                }
              }}
              className="fixed inset-0 bg-[#020305]/92 backdrop-blur-md cursor-pointer z-[1000]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-gradient-to-b from-[#0e111a]/98 via-[#090b11]/98 to-[#040507]/98 border border-white/10 rounded-[32px] p-5 sm:p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.05)] z-[1001] max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setCurrentView('marketplace');
                  setSelectedRobot(null);
                }}
                className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer z-20"
              >
                <X size={18} />
              </button>

              {currentView === 'pay' ? (
                <>
                  <div className="border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-lime mb-1 block">
                      AI UPGRADE PORTAL
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                      {paymentMode === 'wallet' ? 'Secure Wallet Upgrade' : (isNigeria ? 'Secure Bank Transfer' : 'Secure Crypto Asset')}
                    </h2>
                  </div>

                  {showWalletOption && (
                    <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl max-w-sm mx-auto w-full">
                      <button
                        onClick={() => setPaymentMode('transfer')}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none",
                          paymentMode === 'transfer'
                            ? "bg-gradient-to-r from-[#202738] to-[#121824] text-white border border-white/10 shadow-lg"
                            : "text-aura-muted hover:text-white"
                        )}
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => setPaymentMode('wallet')}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none",
                          paymentMode === 'wallet'
                            ? "bg-gradient-to-r from-[#202738] to-[#121824] text-white border border-white/10 shadow-lg"
                            : "text-aura-muted hover:text-white"
                        )}
                      >
                        Wallet
                      </button>
                    </div>
                  )}

                  {/* Content Reorganization */}
                  <div className="space-y-5">
                    {/* SECTION A: SELECTED AI BOT */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 p-1.5 shrink-0 flex items-center justify-center">
                          <img 
                            src={selectedRobot.image} 
                            alt={selectedRobot.name} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-aura-lime bg-aura-lime/10 border border-aura-lime/20 px-2 py-0.5 rounded-md">
                            Selected Bot
                          </span>
                          <p className="text-base font-black text-white mt-1">{selectedRobot.name}</p>
                          <p className="text-[10px] text-aura-muted font-mono">{selectedRobot.version}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                        <div className="sm:hidden text-[9px] text-aura-muted font-black uppercase tracking-widest">Expected Yield</div>
                        <div>
                          <p className="text-sm font-black text-emerald-400">{selectedRobot.roi} Daily ROI</p>
                          <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">
                            LOCKED
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: AMOUNT TO PAY */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-aura-muted uppercase tracking-widest font-black ml-1 block">
                        Amount to Pay
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          readOnly 
                          value={
                            isNigeria 
                              ? `${formatCurrency(selectedRobot.upgradePrice)} (₦${(selectedRobot.upgradePrice * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                              : formatCurrency(selectedRobot.upgradePrice)
                          }
                          className="w-full bg-[#030406]/90 border border-white/10 rounded-2xl py-4 px-5 text-sm sm:text-base font-bold text-gray-300 outline-none select-all cursor-default"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-aura-muted uppercase tracking-widest select-none pointer-events-none">
                          READ-ONLY
                        </div>
                      </div>
                    </div>

                    {paymentMode === 'transfer' ? (
                      <>
                        {isNigeria ? (
                          /* BANK DETAILS */
                          <div className="bg-gradient-to-b from-emerald-950/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                Bank Transfer Details
                              </span>
                              <span className="text-[7.5px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                Active Instant Bridge
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-0.5">
                                <p className="text-[9px] text-aura-muted uppercase tracking-widest font-bold">Bank Name</p>
                                <p className="text-sm font-black text-white">OPay Bank</p>
                              </div>

                              <div className="space-y-0.5">
                                <p className="text-[9px] text-aura-muted uppercase tracking-widest font-bold">Account Name</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-white truncate max-w-[150px]">TAVARI WAVE NETWORK</p>
                                  <button 
                                    onClick={() => handleCopy('TAVARI WAVE NETWORK', 'accName')}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                  >
                                    {copiedField === 'accName' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </div>

                              <div className="col-span-1 sm:col-span-2 space-y-1 bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="text-[9px] text-aura-muted uppercase tracking-widest font-bold">Account Number</p>
                                <div className="flex justify-between items-center gap-2">
                                  <code className="text-lg sm:text-xl font-mono font-black text-emerald-400 tracking-wider">6550002094</code>
                                  <button 
                                    onClick={() => handleCopy('6550002094', 'accNum')}
                                    className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-[9px] text-emerald-400 font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    {copiedField === 'accNum' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                    {copiedField === 'accNum' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* CRYPTO WALLET DETAILS */
                          <div className="space-y-4 bg-gradient-to-b from-purple-950/10 to-transparent border border-purple-500/20 rounded-2xl p-5">
                            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                              <span className="text-[10px] text-purple-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                                </span>
                                Crypto Wallet Destination
                              </span>
                              <span className="text-[7.5px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                                Global Digital Bridge
                              </span>
                            </div>

                            {/* Crypto Toggles */}
                            <div className="grid grid-cols-3 gap-2">
                              {(['usdt', 'erc20', 'btc'] as const).map(t => (
                                <button 
                                  key={t} 
                                  onClick={() => setSelectedCrypto(t)}
                                  className={cn(
                                    "py-2 rounded-xl text-[9px] font-black uppercase border transition-all cursor-pointer",
                                    selectedCrypto === t 
                                      ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                                      : "bg-white/5 border-white/5 text-aura-muted hover:bg-white/10"
                                  )}
                                >
                                  {t === 'usdt' ? 'USDT (TRC20)' : t.toUpperCase()}
                                </button>
                              ))}
                            </div>

                            {/* Display QR & Wallet Address */}
                            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                              <div className="p-3 bg-white rounded-2xl shadow-lg border border-white/25 shrink-0 flex items-center justify-center">
                                <QRCodeCanvas value={CRYPTO_ADDRESSES[selectedCrypto]} size={90} />
                              </div>

                              <div className="flex-1 w-full space-y-2">
                                <p className="text-[9px] text-aura-muted uppercase tracking-widest font-black">
                                  Wallet Address ({selectedCrypto === 'usdt' ? 'TRC20' : selectedCrypto === 'erc20' ? 'ERC20' : 'BTC'})
                                </p>
                                <div className="bg-[#030406]/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner overflow-hidden">
                                  <code className="text-[10px] font-mono text-purple-400 truncate tracking-wide select-all">
                                    {CRYPTO_ADDRESSES[selectedCrypto]}
                                  </code>
                                  <button 
                                    onClick={() => handleCopy(CRYPTO_ADDRESSES[selectedCrypto], 'wallet')} 
                                    className="flex-shrink-0 p-2 bg-white/5 border border-white/10 hover:bg-purple-500/25 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                                  >
                                    {copiedField === 'wallet' ? <Check size={12} className="text-purple-400" /> : <Copy size={12} />}
                                  </button>
                                </div>
                                <p className="text-[8px] text-aura-muted uppercase font-bold tracking-widest leading-relaxed">
                                  * Send exact equivalent amount. Review gas or network fees before sending.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TRANSACTION ID INPUT */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-aura-muted uppercase tracking-widest font-black ml-1 block">
                            Transaction ID / Ref
                          </label>
                          <input 
                            type="text" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter Transaction ID or Reference Hash"
                            className="w-full bg-[#030406]/90 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-bold text-white outline-none transition-all placeholder-white/20 shadow-inner"
                          />
                        </div>

                        {/* DUAL BUTTON ACTIONS FOR TRANSFER */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentView('marketplace');
                              setSelectedRobot(null);
                            }}
                            className="w-full sm:w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 transition-all cursor-pointer text-center select-none active:scale-95"
                          >
                            Cancel
                          </button>

                          <button
                            disabled={!transactionId || isSubmitting}
                            onClick={handleSubmitPayment}
                            className={cn(
                              "w-full sm:flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-20 cursor-pointer text-slate-950 flex items-center justify-center gap-2 select-none active:scale-95",
                              isNigeria ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10" : "bg-purple-500 hover:bg-purple-400 shadow-purple-500/10"
                            )}
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                            I Have Made Payment
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* WALLET SELECTION */}
                        <div className="space-y-3">
                          <label className="text-[10px] text-aura-muted uppercase tracking-widest font-black ml-1 block">
                            Select Wallet Source
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedRobot && avail >= selectedRobot.upgradePrice && (
                              <button
                                onClick={() => setSelectedWalletSource('available_balance')}
                                className={cn(
                                  "p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between gap-2.5",
                                  selectedWalletSource === 'available_balance'
                                    ? "bg-gradient-to-b from-[#15122e] to-transparent border-purple-500/40 shadow-[0_10px_25px_rgba(168,85,247,0.15)]"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-aura-muted">
                                    Available Balance
                                  </span>
                                  {selectedWalletSource === 'available_balance' && (
                                    <Check size={12} className="text-purple-400" />
                                  )}
                                </div>
                                <span className="text-lg sm:text-xl font-black text-white font-mono">
                                  {formatCurrency(avail)}
                                </span>
                              </button>
                            )}

                            {selectedRobot && fund >= selectedRobot.upgradePrice && (
                              <button
                                onClick={() => setSelectedWalletSource('funding_balance')}
                                className={cn(
                                  "p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between gap-2.5",
                                  selectedWalletSource === 'funding_balance'
                                    ? "bg-gradient-to-b from-[#15122e] to-transparent border-purple-500/40 shadow-[0_10px_25px_rgba(168,85,247,0.15)]"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-aura-muted">
                                    Deposit Balance
                                  </span>
                                  {selectedWalletSource === 'funding_balance' && (
                                    <Check size={12} className="text-purple-400" />
                                  )}
                                </div>
                                <span className="text-lg sm:text-xl font-black text-white font-mono">
                                  {formatCurrency(fund)}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* DUAL BUTTON ACTIONS FOR WALLET */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentView('marketplace');
                              setSelectedRobot(null);
                            }}
                            className="w-full sm:w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 transition-all cursor-pointer text-center select-none active:scale-95"
                          >
                            Cancel
                          </button>

                          <button
                            disabled={!selectedWalletSource || isSubmitting || (profile?.[selectedWalletSource] || 0) < selectedRobot.upgradePrice}
                            onClick={handleWalletPayment}
                            className={cn(
                              "w-full sm:flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-20 cursor-pointer text-slate-950 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/10 active:scale-95 select-none"
                            )}
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                            {!selectedWalletSource
                              ? "Select a Wallet Source"
                              : (profile?.[selectedWalletSource] || 0) < selectedRobot.upgradePrice
                              ? "Insufficient Balance"
                              : `Confirm Payment`
                            }
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* VIEW 3: SUCCESS SCREEN */
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
                      <CheckCircle size={36} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-emerald-400">
                      {paymentMode === 'wallet' ? 'Upgrade Successful' : 'Payment Submitted'}
                    </h2>
                    <p className="text-xs text-aura-muted leading-relaxed max-w-sm mx-auto uppercase font-bold tracking-wider">
                      {paymentMode === 'wallet' 
                        ? 'Your AI Bot Upgrade has been processed and activated. Your new robot is unlocked and ready for activation.'
                        : 'Your AI Bot Upgrade request has been received and is currently under review. Activation will become available immediately after approval.'}
                    </p>
                  </div>

                  {/* Info Block */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3.5 text-left max-w-sm mx-auto font-mono text-[11px]">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-aura-muted uppercase font-bold">AI VERSION:</span>
                      <span className="text-white font-black">{selectedRobot.name} ({selectedRobot.version})</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-aura-muted uppercase font-bold">AMOUNT:</span>
                      <span className="text-white font-black">{formatCurrency(selectedRobot.upgradePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aura-muted uppercase font-bold">STATUS:</span>
                      <span className={cn(
                        "font-black uppercase tracking-widest",
                        paymentMode === 'wallet' ? "text-emerald-400" : "text-amber-500 font-black uppercase tracking-widest animate-pulse"
                      )}>
                        {paymentMode === 'wallet' ? 'COMPLETED / ACTIVE' : 'PENDING REVIEW'}
                      </span>
                    </div>
                  </div>

                  {/* Two buttons */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                    <button
                      onClick={handleContactSupport}
                      className="py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageSquare size={13} />
                      Contact Support
                    </button>

                    <button
                      onClick={handleOkClick}
                      className="py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Premium Modal Popup for Learn More */}
      <AnimatePresence>
        {selectedRobot && currentView === 'marketplace' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRobot(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-[#0f111a]/95 border border-white/10 backdrop-blur-xl max-w-lg w-full p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedRobot(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Header with Title & Accent */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h3 className={cn("text-2xl font-black tracking-tight uppercase font-serif italic", selectedRobot.colorTheme.primary)}>
                    {selectedRobot.name}
                  </h3>
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-gray-400">
                    {selectedRobot.version}
                  </span>
                </div>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1 font-bold">
                  High-Frequency Algorithmic System
                </p>
              </div>

              {/* Center Colored Robot Image Area - Refined Hero Presentation */}
              <div className="flex flex-col justify-center items-center py-8 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[24px] border border-white/10 mb-6 relative overflow-hidden group">
                <div className={cn("absolute w-44 h-44 rounded-full blur-3xl opacity-35 transition-transform duration-1000 group-hover:scale-125", selectedRobot.colorTheme.glow)} />
                
                {/* Tech blueprint lines back-pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                <img 
                  src={selectedRobot.image} 
                  alt={selectedRobot.name} 
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain relative z-10 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <TrendingUp size={10} />
                    Expected Yield
                  </span>
                  <span className={cn("text-lg font-black block mt-1", selectedRobot.colorTheme.primary)}>
                    {selectedRobot.roi} Daily
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Activity size={10} />
                    Accuracy Rating
                  </span>
                  <span className="text-lg font-black block text-emerald-400 mt-1">
                    {selectedRobot.accuracy}
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Cpu size={10} />
                    latency delay
                  </span>
                  <span className="text-lg font-black block text-cyan-400 mt-1">
                    {selectedRobot.speed}
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Award size={10} />
                    Risk Matrix
                  </span>
                  <span className="text-sm font-black block text-purple-400 mt-1 truncate">
                    {selectedRobot.riskProfile}
                  </span>
                </div>
              </div>

              {/* Detailed Descriptions */}
              <div className="space-y-4 text-xs sm:text-sm text-aura-muted leading-relaxed">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Description</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Algorithmic Strategy</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.strategy}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Execution Methodology</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.executionDetails}
                  </p>
                </div>
              </div>

              {/* Action/Dismiss Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedRobot(null)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
