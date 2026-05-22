import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wallet, 
  LineChart, 
  Shield, 
  Zap, 
  Users, 
  Gift, 
  Lock, 
  ChevronRight, 
  Info, 
  Copy, 
  CheckCircle2, 
  ArrowRightLeft, 
  Play, 
  Send, 
  RefreshCw, 
  AlertCircle,
  Coins,
  Check,
  Search,
  Flame,
  FileText,
  DollarSign,
  Rocket,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  doc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs, 
  increment,
  addDoc
} from 'firebase/firestore';
import { toast } from 'sonner';
import PinProtocolModal from './PinProtocolModal';

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

type CryptoKey = 'ETH' | 'BTC' | 'USDT' | 'USD';

const CONVERSION_RATES: Record<CryptoKey, number> = {
  ETH: 2350,   // 1 ETH = 2350 TWN (0.000425 ETH per TWN)
  BTC: 120000, // 1 BTC = 120000 TWN (approx)
  USDT: 235.29, // 1 USDT = 235.29 TWN ($0.00425 per TWN)
  USD: 235.29  // 1 USD = 235.29 TWN
};

const REFERENCE_PRICE = 0.00425;

export default function TWNTokenPortal() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Price & Market Metrics Fluctuation States (Requirements 6 & 7)
  const [currentPrice, setCurrentPrice] = useState(0.00425);
  
  // Real percentage change calculation derived solely from currentPrice and REFERENCE_PRICE
  const percentageChange = ((currentPrice - REFERENCE_PRICE) / REFERENCE_PRICE) * 100;
  const isIncrease = percentageChange >= 0;
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | 'flat' | 'clean'>('flat');
  const [liveTokensSold, setLiveTokensSold] = useState(256420000);
  const [liveHolders, setLiveHolders] = useState(15680);
  const [liveTotalRaised, setLiveTotalRaised] = useState(1092450);

  const priceTrendRef = useRef<'up' | 'down'>('up');
  const trendTicksLeftRef = useRef<number>(10);

  // Price natural fluctuation loops (0.00350 -> 0.00749)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        // Decide trend direction
        if (trendTicksLeftRef.current <= 0) {
          // Flip trend or decide on new direction
          if (Math.random() < 0.65) {
            priceTrendRef.current = priceTrendRef.current === 'up' ? 'down' : 'up';
          }
          // Set trend duration between 8 and 20 ticks (lasts for ~36 to 90 seconds)
          trendTicksLeftRef.current = Math.floor(Math.random() * 13) + 8;
        } else {
          trendTicksLeftRef.current -= 1;
        }

        // Calculate slow movement in trend direction with a tiny bit of noise
        const baseMovement = priceTrendRef.current === 'up' ? 0.00001 : -0.00001;
        const noise = (Math.random() * 0.000006) - 0.000003;
        const change = baseMovement + noise;
        let next = prev + change;
        
        // Boundaries clamps inside a realistic trading band
        if (next < 0.00350) {
          next = 0.00350 + Math.random() * 0.00003;
          priceTrendRef.current = 'up';
          trendTicksLeftRef.current = Math.floor(Math.random() * 10) + 10;
        } else if (next > 0.00749) {
          next = 0.00749 - Math.random() * 0.00003;
          priceTrendRef.current = 'down';
          trendTicksLeftRef.current = Math.floor(Math.random() * 10) + 10;
        }
        
        if (next > prev) {
          setPriceTrend('up');
        } else if (next < prev) {
          setPriceTrend('down');
        } else {
          setPriceTrend('flat');
        }
        
        // Return back to clean/stable state for nice platform tick flash
        setTimeout(() => {
          setPriceTrend('clean');
        }, 1200);

        return next;
      });
    }, 4500); // Ticks every 4.5 seconds to feel smooth and steady
    return () => clearInterval(interval);
  }, []);

  // Daily gradual metrics accumulation (Tokens, Holders, Total Raised)
  useEffect(() => {
    const interval = setInterval(() => {
      const soldAmount = Math.floor(Math.random() * 8) + 2; // Simulates live buys
      setLiveTokensSold(prev => prev + soldAmount);
      
      const raisedIncrement = soldAmount * currentPrice * (1 + Math.random() * 0.02);
      setLiveTotalRaised(prev => prev + raisedIncrement);

      if (Math.random() > 0.83) {
        setLiveHolders(prev => prev + 1);
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [currentPrice]);
  
  // Tab/Modal states
  const [activeTab, setActiveTab] = useState<'swap' | 'buy'>('swap');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Premium Purchase Flow states
  const [buyFlowStep, setBuyFlowStep] = useState<'choice' | 'deposit' | 'balance'>('choice');
  const [selectedBalanceSource, setSelectedBalanceSource] = useState<'available' | 'funding' | 'reward'>('available');
  const [directDepositAmount, setDirectDepositAmount] = useState('');
  const [directDepositMethod, setDirectDepositMethod] = useState<'btc' | 'usdt'>('usdt');
  const [directDepositTxId, setDirectDepositTxId] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Custom alerts
  const [copiedBtc, setCopiedBtc] = useState(false);
  const [copiedUsdt, setCopiedUsdt] = useState(false);

  // Core Interactive Swap form
  const [payCurrency, setPayCurrency] = useState<CryptoKey>('ETH');
  const [payAmount, setPayAmount] = useState<string>('1.00');
  const [twnAmount, setTwnAmount] = useState<string>('2,350.00');
  const [isBuyingWithBalance, setIsBuyingWithBalance] = useState(false);
  const [balanceBuyAmount, setBalanceBuyAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  // Send Token Form
  const [sendUserId, setSendUserId] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [verifiedRecipient, setVerifiedRecipient] = useState<any>(null);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [sendStep, setSendStep] = useState<'form' | 'success'>('form');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'buy' | 'send' | 'deposit' | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Handle auto-calculation of TWN swap amount
  useEffect(() => {
    const val = parseFloat(payAmount);
    if (!isNaN(val) && val >= 0) {
      const calculated = val * CONVERSION_RATES[payCurrency];
      setTwnAmount(calculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setTwnAmount('0.00');
    }
  }, [payAmount, payCurrency]);

  // Recipient real-time verification (Send Flow)
  useEffect(() => {
    const lookupRecipient = async () => {
      if (sendUserId.length === 8) {
        setIsSearchingRecipient(true);
        setSearchError(false);
        try {
          let q = query(collection(db, 'users'), where('public_id', '==', sendUserId));
          let snap = await getDocs(q);
          
          if (snap.empty) {
            const numericId = parseInt(sendUserId, 10);
            if (!isNaN(numericId)) {
              q = query(collection(db, 'users'), where('public_id', '==', numericId));
              snap = await getDocs(q);
            }
          }

          if (!snap.empty) {
            const recipientDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
            
            if (recipientDoc.banned || recipientDoc.suspended) {
              toast.error("Recipient account is currently restricted.");
              setVerifiedRecipient(null);
              setSearchError(true);
              return;
            }

            if (recipientDoc.id === user?.uid) {
              toast.error("You cannot send tokens to yourself");
              setVerifiedRecipient(null);
              setSearchError(true);
            } else {
              setVerifiedRecipient(recipientDoc);
              setSearchError(false);
            }
          } else {
            setVerifiedRecipient(null);
            setSearchError(true);
          }
        } catch (err) {
          console.error(err);
          setSearchError(true);
        } finally {
          setIsSearchingRecipient(false);
        }
      } else {
        setVerifiedRecipient(null);
        setSearchError(false);
      }
    };

    lookupRecipient();
  }, [sendUserId, user?.uid]);

  // Reset Send states
  useEffect(() => {
    if (!showSendModal) {
      setSendUserId('');
      setSendAmount('');
      setVerifiedRecipient(null);
      setSearchError(false);
      setSendStep('form');
    }
  }, [showSendModal]);

  // Clear clipboard timeouts
  const handleCopy = (text: string, isBtc: boolean) => {
    navigator.clipboard.writeText(text);
    if (isBtc) {
      setCopiedBtc(true);
      setTimeout(() => setCopiedBtc(false), 2000);
    } else {
      setCopiedUsdt(true);
      setTimeout(() => setCopiedUsdt(false), 2000);
    }
    toast.success("Deposit Address Copied Successfully");
  };

  // Trigger purchase via balance
  const initiateBalanceBuy = () => {
    const amt = parseFloat(balanceBuyAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount to purchase.");
      return;
    }

    let sourceVal = 0;
    if (selectedBalanceSource === 'available') {
      sourceVal = profile?.available_balance || 0;
    } else if (selectedBalanceSource === 'funding') {
      sourceVal = profile?.funding_balance || 0;
    } else if (selectedBalanceSource === 'reward') {
      sourceVal = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
    }

    if (amt > sourceVal) {
      toast.error(`Insufficient ${selectedBalanceSource === 'reward' ? 'Reward' : selectedBalanceSource === 'funding' ? 'Funding' : 'Available'} Balance.`);
      return;
    }

    setPinAction('buy');
    setShowPinModal(true);
  };

  // Trigger purchase via direct deposit request
  const initiateDirectDeposit = () => {
    const amt = parseFloat(directDepositAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    if (!directDepositTxId.trim()) {
      toast.error("Please enter your transaction reference / hash.");
      return;
    }

    setPinAction('deposit');
    setShowPinModal(true);
  };

  // Trigger Send TWN token
  const initiateSendToken = () => {
    const amt = parseFloat(sendAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    const userTwn = profile?.twn_balance || 0;
    if (amt > userTwn) {
      toast.error("Insufficient TWN token balance.");
      return;
    }

    setPinAction('send');
    setShowPinModal(true);
  };

  // Execute actual transactions after PIN succeeds
  const handleSecurityPinSuccess = async (pin: string) => {
    setShowPinModal(false);

    if (pinAction === 'buy') {
      await executeBalanceBuy();
    } else if (pinAction === 'send') {
      await executeSendTransfer();
    } else if (pinAction === 'deposit') {
      await executeDirectDepositSubmit();
    }
    setPinAction(null);
  };

  const executeDirectDepositSubmit = async () => {
    const amountVal = parseFloat(directDepositAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    setIsSubmittingTx(true);
    const calculatedTwn = amountVal * 50; // $1 = 50 TWN

    try {
      const newDeposit = {
        user_id: user!.uid,
        user_name: profile?.name || 'User',
        amount: amountVal,
        method: directDepositMethod,
        reference: directDepositTxId,
        status: 'pending',
        is_twn_deposit: true,
        twn_amount: calculatedTwn,
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(db, 'deposits'), newDeposit);
      
      // Also add transaction entry
      const txRef = doc(collection(db, 'transactions'));
      await addDoc(collection(db, 'transactions'), {
        user_id: user!.uid,
        type: 'deposit',
        type_detail: 'twn_deposit_pending',
        amount: amountVal,
        twn_amount: calculatedTwn,
        method: directDepositMethod,
        reference: directDepositTxId,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      // Add Notification
      await addDoc(collection(db, 'notifications'), {
        user_id: user!.uid,
        title: 'TWN Deposit Submitted',
        message: `Your deposit request of ${formatCurrency(amountVal)} for ${calculatedTwn.toLocaleString()} TWN is matching verification protocol node queues.`,
        type: 'info',
        read: false,
        created_at: new Date().toISOString()
      });

      toast.success("Deposit Request logged successfully! Pending Admin verification.");
      setDirectDepositAmount('');
      setDirectDepositTxId('');
      setBuyFlowStep('choice');
      setShowBuyModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request.");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const executeBalanceBuy = async () => {
    const usdToSpend = parseFloat(balanceBuyAmount);
    if (isNaN(usdToSpend) || usdToSpend <= 0) return;

    if (profile?.suspended || profile?.banned) {
      toast.error("Your account has been restricted.");
      return;
    }

    setIsSubmittingTx(true);
    const calculatedTwn = usdToSpend * 50; // $1 = 50 TWN!

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user!.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("Profile not found");

        const userData = userSnap.data();
        
        let availableFunds = 0;
        if (selectedBalanceSource === 'available') {
          availableFunds = userData.available_balance || 0;
        } else if (selectedBalanceSource === 'funding') {
          availableFunds = userData.funding_balance || 0;
        } else if (selectedBalanceSource === 'reward') {
          availableFunds = userData.withdraw_methods?.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
        }

        if (usdToSpend > availableFunds) {
          throw new Error(`Insufficient ${selectedBalanceSource === 'reward' ? 'Reward' : selectedBalanceSource === 'funding' ? 'Funding' : 'Available'} Balance.`);
        }

        // Prepare updates
        const updates: any = {
          twn_balance: increment(calculatedTwn)
        };

        if (selectedBalanceSource === 'available') {
          updates.available_balance = increment(-usdToSpend);
        } else if (selectedBalanceSource === 'funding') {
          updates.funding_balance = increment(-usdToSpend);
        } else if (selectedBalanceSource === 'reward') {
          const currentWithdrawMethods = userData.withdraw_methods || {};
          const currentReward = currentWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
          updates.withdraw_methods = {
            ...currentWithdrawMethods,
            reward_dollar_balance: currentReward - usdToSpend,
          };
          updates.reward_dollar_balance = increment(-usdToSpend);
        }

        transaction.update(userRef, updates);

        // Add transaction entry
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user!.uid,
          type: 'purchase',
          type_detail: 'twn_purchase_balance',
          amount: usdToSpend,
          twn_amount: calculatedTwn,
          source_balance: selectedBalanceSource,
          status: 'completed',
          created_at: new Date().toISOString()
        });

        // Add Notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user!.uid,
          title: 'TWN Tokens Acquired',
          message: `Successfully purchased ${calculatedTwn.toLocaleString()} TWN tokens with ${formatCurrency(usdToSpend)} from your ${selectedBalanceSource === 'reward' ? 'Reward' : selectedBalanceSource === 'funding' ? 'Funding' : 'Available'} balance.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success(`Purchase Completed! Got ${calculatedTwn.toLocaleString()} TWN.`);
      setBalanceBuyAmount('');
      setBuyFlowStep('choice');
      setShowBuyModal(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Purchase Transaction Rejected by Security Node.");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const executeSendTransfer = async () => {
    const twnToSend = parseFloat(sendAmount);
    if (isNaN(twnToSend) || twnToSend <= 0) return;

    if (profile?.suspended || profile?.banned) {
      toast.error("Your account features are currently restricted.");
      return;
    }

    setIsSubmittingTx(true);

    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user!.uid);
        const receiverRef = doc(db, 'users', verifiedRecipient.id);

        const senderSnap = await transaction.get(senderRef);
        const receiverSnap = await transaction.get(receiverRef);

        if (!senderSnap.exists() || !receiverSnap.exists()) {
          throw new Error("Profile synchronization failed. Contact helpdesk.");
        }

        const senderData = senderSnap.data();
        const senderTwn = senderData.twn_balance || 0;

        if (senderTwn < twnToSend) {
          throw new Error("Insufficient TWN Token Balance.");
        }

        // Deduct from sender's twn_balance
        transaction.update(senderRef, {
          twn_balance: increment(-twnToSend)
        });

        // Add to recipient's twn_balance
        transaction.update(receiverRef, {
          twn_balance: increment(twnToSend)
        });

        // Save to sender's beneficiaries list in Firestore automatically
        const beneficiaryRef = doc(db, 'users', user!.uid, 'beneficiaries', verifiedRecipient.id);
        transaction.set(beneficiaryRef, {
          name: verifiedRecipient.name,
          username: verifiedRecipient.username,
          photoURL: verifiedRecipient.photoURL || null,
          public_id: verifiedRecipient.public_id,
          last_transfer: new Date().toISOString()
        }, { merge: true });

        // Transactions documents
        const txSenderRef = doc(collection(db, 'transactions'));
        transaction.set(txSenderRef, {
          user_id: user!.uid,
          type: 'transfer',
          type_detail: 'twn_token_transfer',
          amount: twnToSend,
          sender_id: user!.uid,
          receiver_id: verifiedRecipient.id,
          receiver_public_id: verifiedRecipient.public_id,
          receiver_name: verifiedRecipient.name,
          token: 'TWN',
          status: 'completed',
          created_at: new Date().toISOString()
        });

        const txReceiverRef = doc(collection(db, 'transactions'));
        transaction.set(txReceiverRef, {
          user_id: verifiedRecipient.id,
          type: 'transfer',
          type_detail: 'twn_token_transfer',
          amount: twnToSend,
          sender_id: user!.uid,
          sender_public_id: profile?.public_id,
          sender_name: profile?.name,
          token: 'TWN',
          status: 'completed',
          created_at: new Date().toISOString()
        });

        // Notifications
        const recipientNotif = doc(collection(db, 'notifications'));
        transaction.set(recipientNotif, {
          user_id: verifiedRecipient.id,
          sender_id: user!.uid,
          title: 'TWN Tokens Received',
          message: `You received ${twnToSend.toLocaleString()} TWN Tokens from ${profile?.name}.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });

        const senderNotif = doc(collection(db, 'notifications'));
        transaction.set(senderNotif, {
          user_id: user!.uid,
          title: 'TWN Tokens Sent',
          message: `Successfully transferred ${twnToSend.toLocaleString()} TWN Tokens to ${verifiedRecipient.name}.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      setSendStep('success');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Transfer Rejected by Security Protocol.");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-white selection:bg-purple-500/30 overflow-hidden relative pb-32">
      {/* Sleek Floating Back Button */}
      <div className="absolute top-6 left-6 z-[60]">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-black/85 border border-white/10 hover:border-purple-500/40 rounded-full text-xs font-black uppercase tracking-widest text-white/90 hover:text-white transition-all active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft size={14} className="text-purple-400" />
          <span>Back</span>
        </button>
      </div>

      {/* Background radial overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] bg-purple-900/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }} />
        
        {/* Animated matrix streams */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0, 1.2, 0],
              y: [0, -120],
              x: Math.random() * 80 - 40
            }}
            transition={{ 
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              delay: Math.random() * 8
             }}
            className="absolute bg-purple-500 rounded-full w-[1.5px] h-[1.5px]"
            style={{ 
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* FULL WIDTH EDGE-TO-EDGE CINEMATIC HERO HEADER */}
      <div className="w-full relative z-[5] m-0 p-0 border-0 leading-none">
        <motion.img 
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src="https://i.imgur.com/KYXMIAr.png"
          alt="Tavari Wave Network Cinematic Header banner"
          className="w-full h-auto block select-none border-0 p-0 m-0"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main outer width boundaries */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-12">

        {/* PREMIUM BINANCE/BYBIT LIVE MARKET STATS CARD (Requirement 5) */}
        <div className="bg-[#0b0c16]/75 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 select-none relative overflow-hidden">
          {/* Subtle neon indicator in the card */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          {[
            { label: "Total Supply", value: "1,000,000,000", postfix: "TWN", isLive: false },
            { label: "Tokens Sold", value: liveTokensSold.toLocaleString(), postfix: "TWN", isLive: true },
            { label: "Holders", value: `${liveHolders.toLocaleString()}+`, postfix: "Users", isLive: true },
            { label: "Current Price", value: `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`, postfix: "USD", isPrice: true },
            { label: "Total Raised", value: `$${Math.floor(liveTotalRaised).toLocaleString()}+`, postfix: "USD", isLive: true }
          ].map((stat, i) => (
            <div key={i} className="space-y-1.5 p-2.5 border-r border-white/5 last:border-r-0 max-lg:border-r-0 max-md:even:border-r-0 text-center lg:text-left transition-colors hover:bg-white/[0.01] rounded-xl">
              <div className="flex items-center justify-center lg:justify-start gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
                {stat.isLive && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 justify-center lg:justify-start">
                <span className={cn(
                  "text-sm md:text-lg font-black transition-all duration-300 font-mono tracking-tight",
                  stat.isPrice
                    ? priceTrend === 'up'
                      ? "text-emerald-400 scale-[1.02] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      : priceTrend === 'down'
                        ? "text-rose-400 scale-[1.02] drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                        : "text-white"
                    : "text-white"
                )}>
                  {stat.value}
                </span>
                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">{stat.postfix}</span>
                {stat.isPrice && (
                  <span className={cn(
                    "ml-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md leading-none",
                    isIncrease 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "bg-rose-500/10 text-rose-400"
                  )}>
                    {isIncrease ? "+" : ""}{percentageChange.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Top Navbar Header matching visually the references */}
        <header className="flex items-center justify-between py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/wU33xy3.png" alt="ZWA" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-white leading-tight font-sans">Tavari Wave</span>
              <span className="text-[8px] font-bold text-purple-400 uppercase tracking-[0.4em] leading-none">Network</span>
            </div>
          </div>
          
          {/* Menu Items (Centered in full-size layout) */}
          <nav className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[#8E8A9E]">
            <a href="/home" className="hover:text-white transition-colors">Home</a>
            <span className="cursor-not-allowed opacity-50">About</span>
            <span className="cursor-not-allowed opacity-50">Tokenomics</span>
            <span className="cursor-not-allowed opacity-50">Roadmap</span>
            <span className="cursor-not-allowed opacity-50">FAQ</span>
            <span className="cursor-not-allowed opacity-50">Contact</span>
          </nav>
          
          {/* Identity Sync indicator */}
          <div className="flex items-center gap-2 bg-[#0a0d1f] border border-purple-500/10 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-purple-200">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span>ID: {profile?.public_id || "Connected"}</span>
          </div>
        </header>

        {/* HERO INFO BLOCK & INTERACTION GRID STARTING BELOW THE IMAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Title / Info Blocks (left 6 cols on wide screen) */}
            <div className="lg:col-span-7 flex flex-col space-y-6 md:pr-4">
              <div className="inline-flex items-center gap-2 self-start bg-purple-500/10 border border-purple-400/20 px-3.5 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black tracking-widest text-purple-200 uppercase leading-none">● INTRODUCING</span>
              </div>

              {/* Title matches precisely the glowing, italicized, bold references */}
              <div className="space-y-2 select-none">
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] font-sans">
                  <span className="block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">TWN</span>
                  <span className="block text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">The Wave</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-[#F59E0B] drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]">Token</span>
                </h1>
              </div>

              <p className="max-w-md text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] leading-relaxed text-[#8E8A9E]">
                Powering the future of a decentralized economy. Built for the <span className="text-[#A855F7]">Wave</span>. Multi-layered utility orchestration, governance-backed node networks, and elite financial optimization engines.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setBuyFlowStep('choice');
                    setShowBuyModal(true);
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#A855F7] via-[#8B5CF6] to-[#F59E0B] text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(168,85,247,0.3)] hover:brightness-110 duration-200 transition-all cursor-pointer"
                >
                  <Rocket size={14} className="animate-pulse" /> Buy TWN Now
                </motion.button>
                
                <button 
                  onClick={() => toast.info("TRAILER PREVIEW PROTOCOL ONLINE", { description: "Establishing real-time playback link... Feature pending governance initialization." })}
                  className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/15 text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 duration-200 transition-all backdrop-blur-md cursor-pointer"
                >
                  <Play size={13} fill="currentColor" /> Watch Trailer
                </button>
              </div>
            </div>

            {/* User Token Wallet Card (right 5 cols on wide screen) (Requirement 8 & 9) */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-[360px] bg-gradient-to-b from-[#0e0f24] to-[#04050f] border border-white/10 rounded-3xl p-6 shadow-[0_25px_50px_rgba(0,0,0,0.7)] relative overflow-hidden"
              >
                {/* Visual purple neon glowing vector */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#a855f7]/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-[50px] pointer-events-none" />

                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                  <div className="flex items-center gap-2 text-white">
                    <div className="p-2.5 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/25 text-[#A855F7]">
                      <Wallet size={16} className="animate-pulse" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#e2e8f0]">Token Portfolio</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest text-[#10B981] bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                    <Shield size={10} className="stroke-[3px]" /> Escrow Secured
                  </div>
                </div>

                {/* Primary User Balance Section */}
                <div className="bg-black/40 border border-white/5 px-5 py-6 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-2 select-all">
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-400">Total Available Balance</span>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] font-sans">
                      {(profile?.twn_balance || 0).toLocaleString()} <span className="text-xs font-bold text-purple-400 uppercase">TWN</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest font-mono mt-1">
                      ≈ ${((profile?.twn_balance || 0) * currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] font-bold">USD</span>
                    </span>
                  </div>

                  <div className="absolute top-1.5 right-2 flex items-center justify-center gap-1 opacity-60">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-purple-400"></span>
                    <span className="text-[6px] font-bold uppercase text-purple-200 tracking-widest">Live Syncing</span>
                  </div>
                </div>

                {/* Account Details and Specs inside Wallet */}
                <div className="space-y-2.5 mt-5">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#8E8A9E] border-b border-white/5 pb-2">
                    <span>Protocol Type</span>
                    <span className="text-white font-black">ZWA-20 HyperLink</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#8E8A9E] border-b border-white/5 pb-2">
                    <span>Contract Address</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("0xTWN7c47a25fe39a88ad491a92e1b1");
                        toast.success("Contract address copied!");
                      }}
                      className="text-purple-400 hover:text-purple-300 transition-all font-mono font-bold"
                    >
                      0xTWN...d91a 📋
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#8E8A9E] border-b border-white/5 pb-2">
                    <span>Peak Staking Yield</span>
                    <span className="text-[#10B981] font-black font-mono">18.5% APR</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#8E8A9E]">
                    <span>Account Security</span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      🛡️ Level 3 Active
                    </span>
                  </div>
                </div>

                {/* Direct Action Triggers */}
                <div className="grid grid-cols-2 gap-2 mt-6">
                  <button 
                    onClick={() => {
                      setBuyFlowStep('choice');
                      setShowBuyModal(true);
                    }}
                    className="py-3.5 bg-gradient-to-r from-purple-600 to-[#F59E0B] hover:brightness-110 duration-200 active:scale-95 transition-all text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl cursor-pointer"
                  >
                    🚀 Buy TWN
                  </button>
                  <button 
                    onClick={() => {
                      setShowSendModal(true);
                    }}
                    className="py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl duration-200 active:scale-95 transition-all cursor-pointer"
                  >
                    📤 Transfer
                  </button>
                </div>

                <div className="flex items-center justify-around gap-2 pt-4 border-t border-white/5 mt-5 text-[8px] font-black text-[#8E8A9E] select-none">
                  <span>⚡ Real-Time Asset Index</span>
                  <span>🔒 Cold Custody Ledger</span>
                </div>
              </motion.div>
            </div>

          </div>

        {/* 4 CORE BENEFITS GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Secure & Audited", desc: "Smart contract audited by leading decentralized cryptographic cybersecurity experts.", color: "from-blue-500/10" },
            { title: "Built for Growth", desc: "Strong utility backing real-world digital asset integration, staking support, and rewards.", color: "from-purple-500/10" },
            { title: "Community Driven", desc: "Completely powered and optimized by a global Tavari Wave multi-user DAO foundation.", color: "from-orange-500/10" },
            { title: "Transparent Flow", desc: "Provides absolute 100% transparency tracking transaction ledgers.", color: "from-emerald-500/10" }
          ].map((item, i) => (
            <div 
              key={i}
              className={cn(
                "p-6 md:p-8 bg-gradient-to-b via-white/[0.02] to-transparent border border-white/5 rounded-3xl relative overflow-hidden backdrop-blur-md hover:border-purple-500/30 transition-all duration-300 group",
                item.color
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-115 transition-transform duration-300">
                <Shield size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">{item.title}</h4>
              <p className="text-[10px] text-[#8E8A9E] leading-relaxed font-semibold uppercase">{item.desc}</p>
            </div>
          ))}
        </div>



      </div>

      {/* FLOATABLE GLASSMORPHIC CORE NAVIGATION DEVICE (DOCK) BAR AT BOTTOM OF PORTAL */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] max-w-lg w-[90%] select-none px-4 md:px-0">
        <div className="backdrop-blur-xl bg-[#080916]/80 border border-white/10 py-3.5 px-6 rounded-2xl flex items-center justify-around gap-2 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          {[
            { label: 'BUY', action: () => setShowBuyModal(true), style: 'hover:text-amber-400 active:scale-95' },
            { label: 'SELL', action: () => setShowSellModal(true), style: 'hover:text-rose-400 active:scale-95' },
            { label: 'SWAP', action: () => setShowSwapModal(true), style: 'hover:text-blue-400 active:scale-95' },
            { label: 'SEND', action: () => setShowSendModal(true), style: 'hover:text-purple-400 active:scale-95' }
          ].map((dockBtn, idx) => (
            <button
              key={idx}
              onClick={dockBtn.action}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black tracking-[0.2em] transition-all text-[#8E8A9E] hover:bg-white/5 hover:text-white uppercase relative group cursor-pointer",
                dockBtn.style
              )}
            >
              <span className="relative z-10">{dockBtn.label}</span>
              {/* Pulsating glow inside buttons */}
              <div className="absolute inset-0 rounded-lg bg-purple-500/0 group-hover:bg-purple-500/5 blur-md transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* GLOBAL BACKGROUND INTERACTIVE PARTICLES */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
         <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
         <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
      </div>

      {/* --- PREMIUM MODALS --- */}
      <AnimatePresence>
        {/* 1. BUY TWN MODAL */}
        {showBuyModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBuyModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-[#0a0d1f] border-2 border-purple-500/20 rounded-[32px] p-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] overflow-hidden z-10"
            >
              {/* Visual accents */}
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setShowBuyModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step 1: Choice between Direct Deposit and Balanced Purchase */}
              {buyFlowStep === 'choice' && (
                <div className="space-y-6 pt-2">
                  <div className="text-center space-y-1">
                    <div className="mb-3 inline-flex w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 items-center justify-center text-[#A855F7] shadow-inner">
                      <Coins size={22} className="animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic text-white font-sans">Acquire TWN</h3>
                    <p className="text-[9px] font-black tracking-widest text-[#8E8A9E] uppercase">Select your preferred funding channel</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-1">
                    {/* Direct Deposit Option Card */}
                    <button 
                      onClick={() => setBuyFlowStep('deposit')}
                      className="p-5 bg-[#05060f]/60 hover:bg-[#111425]/60 border border-white/5 hover:border-purple-500/30 rounded-2xl text-left transition-all group flex items-start gap-4 cursor-pointer"
                    >
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[#A855F7] group-hover:bg-[#A855F7] group-hover:text-white transition-all">
                        <Wallet size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Direct Deposit</h4>
                        <p className="text-[9px] text-[#8E8A9E] font-bold leading-normal uppercase">Send BTC or USDT externally and request audit approval.</p>
                      </div>
                    </button>

                    {/* Fund with Balance Option Card */}
                    <button 
                      onClick={() => setBuyFlowStep('balance')}
                      className="p-5 bg-[#05060f]/60 hover:bg-[#111425]/60 border border-white/5 hover:border-purple-500/30 rounded-2xl text-left transition-all group flex items-start gap-4 cursor-pointer"
                    >
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-white transition-all">
                        <RefreshCw size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Fund with Balance</h4>
                        <p className="text-[9px] text-[#8E8A9E] font-bold leading-normal uppercase text-amber-500/90">Instantly convert platform balance to TWN. Zero fees!</p>
                      </div>
                    </button>
                  </div>

                  <div className="p-4 bg-[#05060f]/50 border border-white/5 rounded-2xl text-center space-y-1">
                    <span className="text-[8px] font-black tracking-widest uppercase text-[#F59E0B]">Conversion Payout Rates</span>
                    <p className="text-[9px] text-purple-200 leading-normal font-bold uppercase">
                      All acquisitions instantly credit assets at $1 USD = 50 TWN Tokens respectively.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Direct Cryptography Deposit Flow */}
              {buyFlowStep === 'deposit' && (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <button 
                      onClick={() => setBuyFlowStep('choice')}
                      className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-[#8E8A9E] hover:text-white rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <div className="text-left">
                      <h3 className="text-sm font-black uppercase tracking-tight text-white">Direct Cryptography Deposit</h3>
                      <p className="text-[9px] font-black tracking-widest text-purple-400 uppercase">Step 2: Send External Transmissions</p>
                    </div>
                  </div>

                  {/* Method Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDirectDepositMethod('usdt')}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${directDepositMethod === 'usdt' ? 'bg-[#150a21] border border-[#a855f7]/40 text-[#a855f7]' : 'bg-[#05060f]/80 border border-white/5 text-[#8E8A9E] hover:border-white/10'}`}
                    >
                      USDT (TRC-20)
                    </button>
                    <button
                      onClick={() => setDirectDepositMethod('btc')}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${directDepositMethod === 'btc' ? 'bg-[#150a21] border border-[#a855f7]/40 text-[#a855f7]' : 'bg-[#05060f]/80 border border-white/5 text-[#8E8A9E] hover:border-white/10'}`}
                    >
                      Bitcoin Native
                    </button>
                  </div>

                  {/* Address Block */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-black text-[#8E8A9E] px-1 uppercase tracking-wider">
                      <span>Transmission Node Address</span>
                      {directDepositMethod === 'btc' ? (
                        copiedBtc ? <span className="text-emerald-400">Address Copied!</span> : <span className="text-[#F59E0B]">BTC Address</span>
                      ) : (
                        copiedUsdt ? <span className="text-emerald-400">Address Copied!</span> : <span className="text-purple-400">TRC-20 Address</span>
                      )}
                    </div>
                    <div className="bg-[#05060f] border border-white/10 hover:border-white/15 rounded-xl p-3 flex items-center justify-between gap-3 overflow-hidden transition-all duration-200">
                      <span className="text-[9px] font-mono text-slate-300 truncate tracking-wide">
                        {directDepositMethod === 'btc' ? CRYPTO_ADDRESSES.btc : CRYPTO_ADDRESSES.usdt}
                      </span>
                      <button 
                        onClick={() => handleCopy(directDepositMethod === 'btc' ? CRYPTO_ADDRESSES.btc : CRYPTO_ADDRESSES.usdt, directDepositMethod === 'btc')}
                        className="p-1 px-2.5 bg-[#12132d] hover:bg-purple-500/20 text-purple-400 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-[#8E8A9E] uppercase tracking-widest block px-1">Amount Transmitted (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                        <input 
                          type="number"
                          placeholder="e.g. 100"
                          value={directDepositAmount}
                          onChange={(e) => setDirectDepositAmount(e.target.value)}
                          className="w-full bg-[#05060f] border border-white/10 focus:border-purple-500 rounded-xl py-2.5 pl-8 pr-12 text-xs font-black text-white focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-purple-400">
                          = {((parseFloat(directDepositAmount) || 0) * 50).toLocaleString()} TWN
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-[#8E8A9E] uppercase tracking-widest block px-1">Transaction ID / Reference Hash</label>
                      <input 
                        type="text"
                        placeholder="Paste Hash / TX ID here"
                        value={directDepositTxId}
                        onChange={(e) => setDirectDepositTxId(e.target.value)}
                        className="w-full bg-[#05060f] border border-white/10 focus:border-purple-500 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={initiateDirectDeposit}
                    disabled={isSubmittingTx || !directDepositAmount || !directDepositTxId}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingTx ? "Logging Request..." : "Submit Verification Audit"}
                  </button>
                </div>
              )}

              {/* Step 3: Instant Balance Conversion Flow */}
              {buyFlowStep === 'balance' && (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <button 
                      onClick={() => setBuyFlowStep('choice')}
                      className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-[#8E8A9E] hover:text-white rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <div className="text-left">
                      <h3 className="text-sm font-black uppercase tracking-tight text-white">Instant Balance Conversion</h3>
                      <p className="text-[9px] font-black tracking-widest text-[#F59E0B] uppercase">No Admin Approvals Required</p>
                    </div>
                  </div>

                  {/* Balance Source Cards */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-[#8E8A9E] uppercase tracking-widest block px-1 mb-1">Select Source Balance</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Available */}
                      <button
                        onClick={() => setSelectedBalanceSource('available')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${selectedBalanceSource === 'available' ? 'bg-purple-900/15 border-purple-500/40 text-purple-200' : 'bg-[#05060f]/80 border-white/5 text-[#8E8A9E] hover:border-white/10'}`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none block">Available</span>
                        <span className="text-[9px] font-black text-white font-mono leading-none block mt-1">{formatCurrency(profile?.available_balance || 0)}</span>
                      </button>
                      
                      {/* Funding */}
                      <button
                        onClick={() => setSelectedBalanceSource('funding')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${selectedBalanceSource === 'funding' ? 'bg-purple-900/15 border-purple-500/40 text-purple-200' : 'bg-[#05060f]/80 border-white/5 text-[#8E8A9E] hover:border-white/10'}`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none block">Funding</span>
                        <span className="text-[9px] font-black text-white font-mono leading-none block mt-1">{formatCurrency(profile?.funding_balance || 0)}</span>
                      </button>

                      {/* Reward */}
                      <button
                        onClick={() => setSelectedBalanceSource('reward')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${selectedBalanceSource === 'reward' ? 'bg-purple-900/15 border-purple-500/40 text-purple-200' : 'bg-[#05060f]/80 border-white/5 text-[#8E8A9E] hover:border-white/10'}`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none block">Reward</span>
                        <span className="text-[9px] font-black text-white font-mono leading-none block mt-1">
                          {formatCurrency(profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0)}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Conversion Input */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[8px] font-black text-[#8E8A9E] px-1 uppercase tracking-widest">
                      <span>Amount in USD</span>
                      <span>Rate: $1 = 50 TWN</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                      <input 
                        type="number"
                        placeholder="e.g. 50"
                        value={balanceBuyAmount}
                        onChange={(e) => setBalanceBuyAmount(e.target.value)}
                        className="w-full bg-[#05060f] border border-white/10 focus:border-purple-500 rounded-xl py-3 pl-8 pr-12 text-xs font-black text-white focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          let sourceVal = 0;
                          if (selectedBalanceSource === 'available') sourceVal = profile?.available_balance || 0;
                          else if (selectedBalanceSource === 'funding') sourceVal = profile?.funding_balance || 0;
                          else if (selectedBalanceSource === 'reward') sourceVal = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
                          setBalanceBuyAmount((sourceVal).toFixed(2));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-purple-400 hover:text-white transition-all bg-purple-500/10 px-2 py-1 rounded cursor-pointer"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Preview box */}
                  <div className="bg-[#150a21]/50 border border-[#a855f7]/10 p-4 rounded-xl flex items-center justify-between select-none">
                    <div className="text-left leading-none font-sans">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mb-1">Purchasing</span>
                      <span className="text-base font-black text-white font-mono">{(parseFloat(balanceBuyAmount) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-[10px]">
                      →
                    </div>
                    <div className="text-right leading-none font-sans">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mb-1">Acquired Payout</span>
                      <span className="text-base font-black text-[#F59E0B] font-mono">
                        {((parseFloat(balanceBuyAmount) || 0) * 50).toLocaleString()} TWN
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={initiateBalanceBuy}
                    disabled={isSubmittingTx || !balanceBuyAmount || parseFloat(balanceBuyAmount) <= 0}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-[#F59E0B] text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingTx ? "Authorizing Security..." : "Unlock with Transfer PIN"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 2. SELL MODAL */}
        {showSellModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSellModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-sm bg-[#0a0d1f] border-2 border-purple-500/20 rounded-[32px] p-8 shadow-[0_0_80px_rgba(239,68,68,0.2)] text-center space-y-6 overflow-hidden z-10"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <Flame size={32} className="animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic text-white font-sans tracking-tight">Sell Feature</h3>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent mx-auto" />
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Coming Soon</p>
                <p className="text-[9px] text-[#8E8A9E] leading-relaxed font-bold uppercase max-w-xs mx-auto">
                  Tavari decentralized index-driven market selling mechanisms are locked during early acquisition rounds. Live trading and selling pools will launch in the next milestone.
                </p>
              </div>

              <button 
                onClick={() => setShowSellModal(false)}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Go Back
              </button>
            </motion.div>
          </div>
        )}

        {/* 3. SWAP MODAL */}
        {showSwapModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSwapModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-sm bg-[#0a0d1f] border-2 border-purple-500/20 rounded-[32px] p-8 shadow-[0_0_80px_rgba(59,130,246,0.2)] text-center space-y-6 overflow-hidden z-10"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20">
                <RefreshCw size={32} className="animate-spin" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic text-white font-sans tracking-tight">Swap Feature</h3>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto" />
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Coming Soon</p>
                <p className="text-[9px] text-[#8E8A9E] leading-relaxed font-bold uppercase max-w-xs mx-auto">
                  Instant smart swaps matching other ecosystem cryptocurrencies in real-time are awaiting liquidity provider node approvals in the next governance tier.
                </p>
              </div>

              <button 
                onClick={() => setShowSwapModal(false)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Go Back
              </button>
            </motion.div>
          </div>
        )}

        {/* 4. SEND TWN MODAL */}
        {showSendModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSendModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-[#0a0d1f] border-2 border-purple-500/20 rounded-[32px] p-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] overflow-hidden z-10"
            >
              {/* Close Button */}
              {sendStep !== 'success' && (
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => setShowSendModal(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {sendStep === 'form' ? (
                <div className="space-y-6 pt-2">
                  <div className="text-center space-y-1 select-none">
                    <div className="mb-3 inline-flex w-12 h-12 rounded-xl bg-[#c084fc]/10 border border-[#a855f7]/20 items-center justify-center text-[#A855F7] shadow-inner">
                      <Send size={20} className="-rotate-12 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic text-white font-sans">Transfer TWN</h3>
                    <p className="text-[9px] font-black tracking-widest text-purple-400 uppercase">SEND TO RECIPIENT NODE WALLET</p>
                  </div>

                  {/* Wallet Info Display */}
                  <div className="bg-[#05060f]/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#8E8A9E] uppercase tracking-wider">Your Balance</span>
                    <span className="text-sm font-black text-purple-300">{(profile?.twn_balance || 0).toLocaleString()} TWN</span>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    
                    {/* Recipient Field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8px] font-black text-[#8E8A9E] px-1 uppercase tracking-widest">
                        <span>Recipient ID</span>
                        {searchError && <span className="text-rose-500 animate-pulse">Node not found</span>}
                      </div>
                      
                      <div className="relative">
                        <Search className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2",
                          verifiedRecipient ? "text-[#10B981]" : searchError ? "text-rose-500" : "text-slate-400"
                        )} size={14} />
                        
                        <input 
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="Enter 8-Digit User ID"
                          value={sendUserId}
                          onChange={(e) => setSendUserId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className={cn(
                            "w-full bg-[#05060f] border rounded-xl py-3 pl-10 pr-4 text-xs font-black text-white focus:outline-none focus:border-purple-500 transition-all",
                            verifiedRecipient ? "border-emerald-500/50 bg-emerald-500/5" :
                            (sendUserId.length === 8 && searchError) ? "border-rose-500 bg-rose-500/5" :
                            "border-white/5"
                          )}
                        />
                        {isSearchingRecipient && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 animate-spin">
                            <RefreshCw size={12} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verified Recipient Box */}
                    {verifiedRecipient && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 select-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#111422] border-2 border-emerald-500 flex items-center justify-center overflow-hidden">
                          <img 
                            src={verifiedRecipient.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${verifiedRecipient.username}`} 
                            alt="Recipient" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left leading-none">
                          <span className="text-[11px] font-black text-white block mb-1">{verifiedRecipient.name}</span>
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">@{verifiedRecipient.username} • {verifiedRecipient.public_id}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* TWN Amount */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8px] font-black text-[#8E8A9E] px-1 uppercase tracking-widest">
                        <span>TWN Amount</span>
                        <span>🌟 TWN</span>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="Amount of TWN tokens to send"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="w-full bg-[#05060f] border border-white/5 focus:border-purple-500 rounded-xl py-3 pl-4 pr-16 text-xs font-black text-white focus:outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => setSendAmount((profile?.twn_balance || 0).toString())}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-purple-400 hover:text-white transition-all bg-purple-500/10 px-2 py-1 rounded"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                  </div>

                  <button 
                    disabled={!sendAmount || parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > (profile?.twn_balance || 0) || !verifiedRecipient || isSubmittingTx}
                    onClick={initiateSendToken}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-[#F59E0B] text-white rounded-xl font-black uppercase tracking-[0.25em] text-[10px] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {isSubmittingTx ? "Verifying Nodes..." : "Continue to Secure PIN"}
                  </button>
                </div>
              ) : (
                /* SEND SUCCESS STATE */
                <div className="text-center py-6 space-y-6 select-none">
                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20 border border-emerald-400/25"
                    >
                      <CheckCircle2 size={32} />
                    </motion.div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -z-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight font-sans">Transfer Success</h3>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">NODE HANDSHAKE VERIFIED</p>
                  </div>

                  <div className="bg-[#05060f]/60 border border-white/5 rounded-2xl p-4 space-y-2 text-left">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5 font-sans">
                      <span className="text-[9px] font-black text-[#8E8A9E] uppercase">Amount</span>
                      <span className="text-xs font-black text-[#A855F7] font-mono">{parseFloat(sendAmount).toLocaleString()} TWN</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5 font-sans">
                      <span className="text-[9px] font-black text-[#8E8A9E] uppercase">Recipient</span>
                      <span className="text-[10px] font-bold text-white block truncate max-w-[120px]">{verifiedRecipient?.name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-[9px] font-black text-[#8E8A9E] uppercase leading-none">Status</span>
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Success</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowSendModal(false)}
                    className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-[0.25em] text-[10px] hover:bg-slate-200 active:scale-[0.98] transition-transform"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM FLOATING GLASS BOTTOM NAVIGATION DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-sm px-4 md:px-0">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
          className="relative bg-[#060814]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.15)] flex justify-between items-center gap-1 overflow-hidden"
        >
          {/* Subtle colored glow blur effects inside dock background */}
          <div className="absolute top-0 left-1/4 -translate-y-1/2 w-12 h-6 bg-purple-500/20 blur-xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 -translate-y-1/2 w-12 h-6 bg-amber-500/20 blur-xl pointer-events-none" />

          {/* Action Tabs */}
          {[
            { 
              name: 'Buy', 
              icon: Wallet, 
              color: 'text-purple-400', 
              glow: 'rgba(168,85,247,0.4)',
              bg: 'bg-purple-500/10 border-purple-500/20',
              action: () => {
                setBuyFlowStep('choice');
                setShowBuyModal(true);
              }
            },
            { 
              name: 'Sell', 
              icon: Flame, 
              color: 'text-rose-400', 
              glow: 'rgba(239,68,68,0.4)',
              bg: 'bg-rose-500/10 border-rose-500/20',
              action: () => setShowSellModal(true)
            },
            { 
              name: 'Swap', 
              icon: RefreshCw, 
              color: 'text-blue-400', 
              glow: 'rgba(59,130,246,0.4)',
              bg: 'bg-blue-500/10 border-blue-500/20',
              action: () => setShowSwapModal(true)
            },
            { 
              name: 'Send', 
              icon: Send, 
              color: 'text-[#F59E0B]', 
              glow: 'rgba(245,158,11,0.4)',
              bg: 'bg-amber-500/10 border-amber-500/20',
              action: () => {
                setSendStep('form');
                setShowSendModal(true);
              }
            }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.name}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={tab.action}
                className={`flex-1 py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${tab.bg} relative group`}
              >
                {/* Active glow on hover hover:shadow */}
                <span className="absolute inset-x-0 bottom-1 h-px bg-current opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: tab.color }} />
                
                <Icon size={18} className={`${tab.color} drop-shadow-[0_0_8px_var(--glow-color)]`} style={{ '--glow-color': tab.glow } as any} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">{tab.name}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* SECURE PIN PROTOCOL GATEWAY */}
      <PinProtocolModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleSecurityPinSuccess}
        isSubmitting={isSubmittingTx}
      />
    </div>
  );
}
