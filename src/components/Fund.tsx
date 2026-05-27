import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  MinusCircle, 
  History, 
  ArrowLeft, 
  Building2, 
  Bitcoin, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Filter,
  RefreshCw,
  X,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronDown,
  Search,
  Globe,
  Send,
  LayoutDashboard
} from 'lucide-react';
import { cn, formatCurrency, isWithdrawalAllowed } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { DynamicBalance } from './DynamicBalance';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

import SuccessModal from './SuccessModal';
import PinProtocolModal from './PinProtocolModal';
import { TransactionTicket } from './TransactionTicket';

const COUNTRIES = [
  { name: 'United States', flag: '🇺🇸', code: 'US' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
  { name: 'Canada', flag: '🇨🇦', code: 'CA' },
  { name: 'Australia', flag: '🇦🇺', code: 'AU' },
  { name: 'Germany', flag: '🇩🇪', code: 'DE' },
  { name: 'France', flag: '🇫🇷', code: 'FR' },
  { name: 'Singapore', flag: '🇸🇬', code: 'SG' },
  { name: 'Tanzania', flag: '🇹🇿', code: 'TZ' },
  { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
  { name: 'Uganda', flag: '🇺🇬', code: 'UG' },
  { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
  { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
  { name: 'Kuwait', flag: '🇰🇼', code: 'KW' }
];

// --- BANK SELECTOR MODAL ---
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[400px] bg-[#0d1016] border border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic font-serif">Select Institution</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} className="text-white/40" />
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-aura-lime/30 focus:bg-white/10 transition-all font-medium"
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
                  selectedBank === bank ? "bg-aura-lime/10" : "hover:bg-white/5"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wide transition-colors",
                    selectedBank === bank ? "text-aura-lime" : "text-white/70 group-hover:text-white"
                  )}>
                    {bank}
                  </span>
                </div>
                {selectedBank === bank && (
                  <Check size={14} className="text-aura-lime" />
                )}
              </button>
            ))}
            {filteredBanks.length === 0 && (
              <div className="p-10 text-center">
                <Building2 size={32} className="mx-auto text-white/5 mb-3" />
                <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest italic">No institutions found</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Verified Secure Gateway</p>
        </div>
      </motion.div>
    </div>
  );
}

// --- CONSTANTS ---
const INITIAL_TRANSACTIONS = [
  { id: '1', type: 'deposit', amount: 0, status: 'none', date: '-' },
];

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  erc20: "0x264E87AA85CBC641cBC4261a193bdc9948934E6D",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

// --- STABLE COMPONENTS ---

function SectionCard({ icon, title, description, onClick, color }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-8 bg-[#11141b] border border-white/5 rounded-[32px] flex flex-col items-center text-center group hover:border-white/10 transition-all duration-300 shadow-2xl relative overflow-hidden"
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5 group-hover:bg-aura-lime transition-colors duration-500" />
      <div className={cn("w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2">{title}</h3>
      <p className="text-xs text-aura-muted uppercase tracking-widest">{description}</p>
      <div className="mt-8 p-2 rounded-full bg-white/5 text-aura-muted group-hover:text-white transition-colors">
        <ArrowRight size={20} />
      </div>
    </button>
  );
}

function SummaryCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-[#11141b] border border-white/5 p-6 rounded-2xl">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted mb-1">{label}</p>
      <DynamicBalance 
        value={value} 
        containerClassName="justify-start" 
        className={cn("text-left h-8", color)}
        baseSizeMobile="text-xl"
        baseSizeDesktop="lg:text-2xl"
      />
    </div>
  );
}

function TabButton({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2",
        active ? "text-aura-lime border-aura-lime bg-aura-lime/5" : "text-aura-muted border-transparent hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

const RealisticDepositIcon = () => (
  <div className="relative w-14 h-14 mx-auto mb-1 flex items-center justify-center">
    {/* Outer halo / drop-shadow / radial-glow */}
    <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full scale-110" />
    
    {/* Inner shadow/reflection ring */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
      {/* Curved glass body */}
      <div className="w-full h-full rounded-2xl bg-gradient-to-b from-[#11241b] to-[#040806]/90 flex items-center justify-center border border-emerald-500/30 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
        {/* Specular highlights / gloss diagonal */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-45 transform pointer-events-none" />
        
        {/* Glowing 3D inner coin element */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-[1px] shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_rgba(255,255,255,0.2)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-md shadow-inner">
            +
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RealisticWithdrawIcon = () => (
  <div className="relative w-14 h-14 mx-auto mb-1 flex items-center justify-center">
    {/* Outer halo / drop-shadow / radial-glow */}
    <div className="absolute inset-0 bg-rose-500/20 blur-lg rounded-full scale-110" />
    
    {/* Inner shadow/reflection ring */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
      {/* Curved glass body */}
      <div className="w-full h-full rounded-2xl bg-gradient-to-b from-[#241114] to-[#080405]/95 flex items-center justify-center border border-rose-500/30 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
        {/* Specular highlights / gloss diagonal */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-45 transform pointer-events-none" />
        
        {/* Glowing 3D inner coin element */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 p-[1px] shadow-[0_4px_12px_rgba(244,63,94,0.4),inset_0_1px_rgba(255,255,255,0.2)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-rose-500 to-rose-600 flex items-center justify-center text-white font-black text-md shadow-inner">
            −
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Fund() {
  const { user, profile } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();

  // Shared UI States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const available_balance = profile?.available_balance || 0;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [notSupportedCountry, setNotSupportedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- DEPOSIT STATES ---
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'bank' | 'crypto' | null>(null);
  const [depositCryptoType, setDepositCryptoType] = useState<'usdt' | 'erc20' | 'btc'>('usdt');
  const [depositStep, setDepositStep] = useState<'input' | 'method' | 'payment' | 'status'>('input');
  const [depositTxId, setDepositTxId] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [withdrawExchangeRate, setWithdrawExchangeRate] = useState<number>(1400);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);

  // --- WITHDRAW STATES ---
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'method' | 'status'>('input');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'crypto'>('bank');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accNum: '', accName: '' });
  const [cryptoDetails, setCryptoDetails] = useState({ type: 'usdt', address: '' });
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);

  const withdrawalThreshold = 7;
  const withdrawalFeePercent = 20;

  // Mobile Flow States
  const [isDepositContinued, setIsDepositContinued] = useState(() => {
    return sessionStorage.getItem('nexus_has_seen_deposit_popup') === 'true';
  });
  const [isWithdrawContinued, setIsWithdrawContinued] = useState(() => {
    return sessionStorage.getItem('nexus_has_seen_withdraw_popup') === 'true';
  });
  const [showContinueDepositPopup, setShowContinueDepositPopup] = useState(false);
  const [showContinueWithdrawPopup, setShowContinueWithdrawPopup] = useState(false);
  const [hasDismissedDepositPopup, setHasDismissedDepositPopup] = useState(() => {
    return sessionStorage.getItem('nexus_has_seen_deposit_popup') === 'true';
  });
  const [hasDismissedWithdrawPopup, setHasDismissedWithdrawPopup] = useState(() => {
    return sessionStorage.getItem('nexus_has_seen_withdraw_popup') === 'true';
  });

  useEffect(() => {
    if (tab === 'deposit') {
      const hasSeen = sessionStorage.getItem('nexus_has_seen_deposit_popup') === 'true';
      if (hasSeen) {
        setIsDepositContinued(true);
        setShowContinueDepositPopup(false);
      } else if (selectedCountry === 'Nigeria') {
        setShowContinueDepositPopup(true);
      }
    } else {
      setShowContinueDepositPopup(false);
    }

    if (tab === 'withdraw') {
      const hasSeen = sessionStorage.getItem('nexus_has_seen_withdraw_popup') === 'true';
      if (hasSeen) {
        setIsWithdrawContinued(true);
        setShowContinueWithdrawPopup(false);
      } else {
        setShowContinueWithdrawPopup(true);
      }
    } else {
      setShowContinueWithdrawPopup(false);
    }
  }, [tab, selectedCountry]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    // Unified tracking for combined transactions
    let currentDeposits: any[] = [];
    let currentWithdrawals: any[] = [];
    let currentInvestments: any[] = [];
    let currentTransfers: any[] = [];

    const updateCombined = () => {
      const all = [...currentDeposits, ...currentWithdrawals, ...currentInvestments, ...currentTransfers];
      // Deduplicate by ID to prevent key collisions
      const seen = new Set();
      const unique = all.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      const combined = unique.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(combined);
    };

    const unsubscribeRate = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setExchangeRate(data.usd_to_ngn_rate || 1400);
        setWithdrawExchangeRate(data.usd_to_ngn_withdrawal_rate || data.usd_to_ngn_rate || 1400);
      }
    });

    const unsubscribeDep = onSnapshot(
      query(collection(db, 'deposits'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentDeposits = snap.docs.map(doc => ({ id: doc.id, type: 'deposit', ...doc.data() }));
        updateCombined();
      }
    );

    const unsubscribeWit = onSnapshot(
      query(collection(db, 'withdrawals'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentWithdrawals = snap.docs.map(doc => ({ id: doc.id, type: 'withdrawal', ...doc.data() }));
        updateCombined();
      }
    );

    const unsubscribeInv = onSnapshot(
      query(collection(db, 'investments'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentInvestments = snap.docs.map(doc => ({ id: doc.id, type: 'investment', ...doc.data() }));
        updateCombined();
      }
    );

    const unsubscribeTx = onSnapshot(
      query(collection(db, 'transactions'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentTransfers = snap.docs
          .map(doc => ({ id: doc.id, type: 'transfer', ...doc.data() }))
          .filter(t => t.type !== 'withdrawal' && t.type !== 'deposit' && t.type !== 'investment');
        updateCombined();
      }
    );

    return () => {
      unsubscribeRate();
      unsubscribeDep();
      unsubscribeWit();
      unsubscribeInv();
      unsubscribeTx();
    };
  }, [user, profile]);

  useEffect(() => {
    if (tab === 'deposit' && !selectedCountry) {
      setShowCountryModal(true);
    }
  }, [tab, selectedCountry]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || tx.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesType && matchesStatus;
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDepositReset = () => {
    setDepositAmount('');
    setDepositMethod(null);
    setDepositTxId('');
    setDepositStep('input');
    navigate('/dashboard#history');
  };

  const submitDeposit = async () => {
    if (!user || !profile) return;
    setIsSubmitting(true);
    try {
      const amount = parseFloat(depositAmount);
      const newDeposit = {
        user_id: user.uid,
        user_name: profile.name,
        amount,
        method: depositMethod,
        reference: depositTxId,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      await addDoc(collection(db, 'deposits'), newDeposit);
      setShowDepositSuccess(true);
      toast.success("Deposit request logged");
    } catch (error) {
       toast.error("Failed to submit request");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleWithdrawalRequest = () => {
    if (profile?.withdrawals_frozen) {
      toast.error("Withdrawal services are currently restricted for this account.");
      return;
    }
    if (withdrawMethod === 'bank') {
      const profileName = profile?.name || '';
      if (bankDetails.accName.trim().toLowerCase() !== profileName.toLowerCase()) {
        setWithdrawError(`Account name must match profile: ${profileName}`);
        return;
      }
    }
    setShowPinModal(true);
  };

  const handleWithdrawSubmit = async (pin: string) => {
    if (!user || !profile) return;

    if (pin !== profile.transfer_pin) {
      toast.error("Invalid Transfer PIN");
      return;
    }

    setIsSubmitting(true);
    try {
      const amountRaw = parseFloat(withdrawAmount);
      // Force consistent precision for deduction calculations
      const amount = Math.floor(amountRaw * 100) / 100;
      const fee = Math.floor(((amount * withdrawalFeePercent) / 100) * 100) / 100;
      const finalAmount = Math.floor((amount - fee) * 100) / 100;

      const available_balance = profile.available_balance || 0;
      if (amount > available_balance) {
         toast.error("Insufficient balance for this settlement.");
         return;
      }

      // Atomicity & Precision Fix: 
      // If the user attempts to withdraw their full balance (within epsilon), zero it out exactly.
      const isFullWithdrawal = Math.abs(available_balance - amount) < 0.0001;
      const deductionAmount = isFullWithdrawal ? available_balance : amount;

      const newWithdrawal = {
        user_id: user.uid,
        user_name: profile.name,
        amount: deductionAmount,
        fee,
        final_amount: finalAmount,
        method: withdrawMethod,
        details: withdrawMethod === 'bank' ? bankDetails : cryptoDetails,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const newNotification = {
        user_id: user.uid,
        type: 'info',
        title: 'Withdrawal Pending',
        message: `Your withdrawal request for ${formatCurrency(deductionAmount)} has been logged and is undergoing review.`,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Atomic Batch
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      const witRef = doc(collection(db, 'withdrawals'));
      const notifRef = doc(collection(db, 'notifications'));

      // 1. Update user methods + balance
      const updatedMethods = { ... (profile.withdraw_methods || {}) };
      if (withdrawMethod === 'bank') {
        updatedMethods.bank = bankDetails;
      } else {
        updatedMethods.crypto = cryptoDetails;
      }

      const { increment } = await import('firebase/firestore');
      batch.update(userRef, { 
        withdraw_methods: updatedMethods,
        available_balance: increment(-deductionAmount)
      });

      // 2. Create withdrawal record
      batch.set(witRef, newWithdrawal);

      // 3. Create notification
      batch.set(notifRef, newNotification);

      await batch.commit();
      
      setShowPinModal(false);
      setShowWithdrawSuccess(true);
      toast.success("Withdrawal request logged successfully");
    } catch (error: any) {
       console.error("WITHDRAWAL BATCH ERROR:", error);
       toast.error(`Failed to submit withdrawal: ${error?.message || 'Operation Denied'}`);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleUseSavedMethod = (type: 'bank' | 'crypto') => {
    const saved = profile?.withdraw_methods?.[type];
    if (saved) {
      if (type === 'bank') setBankDetails(saved);
      else setCryptoDetails(saved);
      toast.info(`Using saved ${type} details`);
    }
  };

  const handleWithdrawReset = () => {
    setWithdrawAmount('');
    setWithdrawStep('input');
    setWithdrawError(null);
    navigate('/dashboard#history');
  }

  // Mobile Click Gateways
  const handleMobileDepositClick = () => {
    if (!selectedCountry) {
      setShowCountryModal(true);
    } else {
      navigate('/fund/deposit');
    }
  };

  const handleMobileWithdrawClick = () => {
    navigate('/fund/withdraw');
  };

  // --- RENDER LOGIC ---

  const renderDeposit = () => {
    if (selectedCountry !== 'Nigeria') {
      return (
        <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-white/5 bg-[#11141b] rounded-[32px] text-center p-10 space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-aura-muted border border-white/5">
            <Globe size={28} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2">Region Assignment Required</h3>
            <p className="text-xs text-aura-muted uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Please select your country or region to verify support and assign the correct settlement bridge.
            </p>
          </div>
          <button 
            onClick={() => setShowCountryModal(true)}
            className="px-6 py-4 bg-aura-lime text-aura-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 transition-all mt-4"
          >
            Select Region
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Methods */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-aura-muted">Payment Channels</h3>
            <button 
              onClick={() => setShowCountryModal(true)}
              className="text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline flex items-center gap-1 font-mono"
            >
              <Globe size={12} /> {selectedCountry}
            </button>
          </div>
          
          <button 
            onClick={() => setDepositMethod('bank')}
            className={cn(
              "w-full p-6 flex items-center justify-between rounded-2xl border transition-all group",
              depositMethod === 'bank' ? "bg-aura-lime/10 border-aura-lime text-aura-lime" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-4">
              <Building2 size={24} className={cn(depositMethod === 'bank' ? "text-aura-lime" : "text-aura-muted")} />
              <div className="text-left">
                <p className="text-sm font-bold uppercase tracking-tight">Bank Transfer</p>
                <p className="text-[10px] opacity-60 font-medium">Instant Institutional</p>
              </div>
            </div>
            {depositMethod === 'bank' && <div className="w-2 h-2 rounded-full bg-aura-lime animate-pulse" />}
          </button>

          <button 
            onClick={() => setDepositMethod('crypto')}
            className={cn(
              "w-full p-6 flex items-center justify-between rounded-2xl border transition-all group",
              depositMethod === 'crypto' ? "bg-aura-lime/10 border-aura-lime text-aura-lime" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-4">
              <Bitcoin size={24} className={cn(depositMethod === 'crypto' ? "text-aura-lime" : "text-aura-muted")} />
              <div className="text-left">
                <p className="text-sm font-bold uppercase tracking-tight">Crypto Payment</p>
                <p className="text-[10px] opacity-60 font-medium">USDT / BTC / ETH</p>
              </div>
            </div>
            {depositMethod === 'crypto' && <div className="w-2 h-2 rounded-full bg-aura-lime animate-pulse" />}
          </button>
        </div>

        {/* Right Column: Details + Amount */}
        <div className="lg:col-span-8">
          {!depositMethod ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-center p-10">
               <PlusCircle size={48} className="text-white/10 mb-4" />
               <p className="text-[10px] font-bold text-aura-muted uppercase tracking-[0.2em]">Select a payment method to proceed</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#11141b] border border-white/10 p-8 rounded-[32px] space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Amount to Fund ($)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-6 flex items-center text-aura-lime font-bold">$</div>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0.00"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-base md:text-xl font-bold outline-none focus:border-aura-lime/50 transition-all text-white"
                      />
                    </div>
                    {depositAmount && parseFloat(depositAmount) < 10 && (
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 text-center animate-pulse">
                        Minimum deposit amount is $10.
                      </p>
                    )}
                  </div>



                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Transaction ID</label>
                      <input 
                        type="text"
                        value={depositTxId}
                        onChange={(e) => setDepositTxId(e.target.value)}
                        placeholder="Input your transaction ID or username"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl px-6 py-4 text-base md:text-sm font-mono focus:border-aura-lime outline-none transition-all text-white"
                      />
                    </div>

                    {depositMethod === 'bank' && depositAmount && parseFloat(depositAmount) > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-2 space-y-2 text-center"
                      >
                        <div className="flex items-center justify-center gap-4">
                           <span className="text-xl font-black text-white italic tracking-tight font-serif">${parseFloat(depositAmount).toFixed(2)}</span>
                           <span className="text-xl font-black text-aura-muted opacity-40">=</span>
                           <span className="text-xl font-black text-[#10B981] italic tracking-tight font-serif">₦{(parseFloat(depositAmount) * exchangeRate).toLocaleString()}</span>
                        </div>
                        <p className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest">• Send exactly this amount</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {depositMethod === 'bank' ? (
                    <div className="p-6 bg-gradient-to-b from-[#11241b]/35 to-[#0c0d12]/95 border border-emerald-500/20 rounded-3xl space-y-5 shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(16,185,129,0.03)] relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black uppercase text-aura-muted tracking-widest leading-none">Institution</span>
                          <span className="text-xs font-black text-white uppercase tracking-wider">OPay Bank</span>
                        </div>
                        <span className="text-[8px] font-extrabold bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          Active Bridge
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-aura-muted uppercase tracking-widest font-bold">Account Number</p>
                          <code className="text-base font-black text-emerald-400 tracking-wider">6550002094</code>
                        </div>
                        <button 
                          onClick={() => handleCopy('6550002094', 'accNum')} 
                          className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500/20 hover:text-emerald-400 transition-all active:scale-95 shadow-md flex-shrink-0"
                        >
                          {copiedField === 'accNum' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] text-aura-muted uppercase tracking-widest mb-1 font-bold">Account Name</p>
                        <p className="text-xs font-black text-white uppercase tracking-wide">TAVARI WAVE NETWORK</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-1">
                        {(['usdt', 'erc20', 'btc'] as const).map(t => (
                          <button 
                            key={t} 
                            onClick={() => setDepositCryptoType(t)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[8px] font-black uppercase border transition-all",
                              depositCryptoType === t ? "bg-aura-lime/20 border-aura-lime text-aura-lime" : "bg-white/5 border-white/5 text-aura-muted"
                            )}
                          >
                            {t.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="p-6 bg-gradient-to-b from-[#161124]/30 to-[#0c0d12]/95 border border-purple-500/20 rounded-3xl flex flex-col items-center gap-5 shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(168,85,247,0.03)] relative overflow-hidden backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -z-10" />
                        <div className="p-3 bg-white rounded-2xl shadow-[0_10px_25px_rgba(255,255,255,0.05)] border border-white/20">
                          <QRCodeCanvas value={CRYPTO_ADDRESSES[depositCryptoType]} size={105} />
                        </div>
                        <div className="w-full space-y-1.5">
                          <p className="text-[9px] text-center text-aura-muted uppercase tracking-widest font-bold">Scan QR or Copy Address</p>
                          <div className="bg-aura-black/95 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 overflow-hidden shadow-inner">
                            <code className="text-[9px] font-mono text-purple-400 truncate tracking-wide">{CRYPTO_ADDRESSES[depositCryptoType]}</code>
                            <button 
                              onClick={() => handleCopy(CRYPTO_ADDRESSES[depositCryptoType], 'wallet')} 
                              className="flex-shrink-0 p-1.5 hover:bg-white/5 rounded-lg text-aura-muted hover:text-white transition-all active:scale-95"
                            >
                              {copiedField === 'wallet' ? <Check size={12} className="text-purple-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                disabled={!depositTxId || !depositAmount || parseFloat(depositAmount) < 10 || isSubmitting}
                onClick={submitDeposit}
                className="w-full py-5 bg-aura-lime text-aura-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl disabled:opacity-30 transition-all"
              >
                {isSubmitting ? 'Processing Sync...' : 'I have made payment'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderWithdraw = () => {
    if (!isWithdrawalAllowed()) {
      return (
        <div className="max-w-[360px] mx-auto p-6 rounded-2xl bg-[#0c0d12]/50 border border-rose-500/10 text-center space-y-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/15 to-transparent" />
          <div className="w-12 h-12 mx-auto bg-rose-500/5 border border-rose-500/15 rounded-full flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.08)] relative">
            <Lock size={20} className="animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-rose-500/5 animate-ping opacity-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-wide font-sans">Portal Closed</h3>
            <p className="text-[9px] font-black text-rose-400 py-0.5 px-2 bg-rose-500/5 rounded-full border border-rose-500/10 inline-block">
              Service temporarily closed
            </p>
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed font-medium">
            Withdrawals are currently unavailable. Withdrawal window reopens Monday 9:00 AM GMT+1.
          </p>
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="text-[9px] font-semibold text-white/30 tracking-wide">
              Operational window: Mon 9:00 AM – Fri 4:00 PM (GMT+1)
            </div>
          </div>
        </div>
      );
    }

    const amountNum = parseFloat(withdrawAmount);
    const isFrozen = profile?.withdrawals_frozen || profile?.suspended || profile?.banned;
    const isInsufficient = withdrawAmount && (amountNum > available_balance);
    const isBelowMin = withdrawAmount && (amountNum < withdrawalThreshold);
    
    const fee = (amountNum * withdrawalFeePercent) / 100;
    const receiveAmount = amountNum - fee;

    if (withdrawStep === 'input') {
      return (
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Withdraw Funds</h2>
            <div className="flex items-center justify-center gap-2">
                <span className="text-aura-muted text-sm">Available Balance:</span>
                <div className="w-40 h-6">
                    <DynamicBalance 
                        value={formatCurrency(available_balance)} 
                        className="text-aura-lime" 
                        containerClassName="justify-start"
                        baseSizeMobile="text-sm"
                        baseSizeDesktop="lg:text-base"
                    />
                </div>
            </div>
            {isFrozen && <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em] bg-red-400/10 py-2 rounded-lg mt-4 animate-pulse">System Halt: Withdrawal access restricted</p>}
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className={cn(
                "absolute inset-y-0 left-6 flex items-center font-bold transition-colors",
                (isInsufficient || isBelowMin || isFrozen) ? "text-red-500" : "text-white/20"
              )}>$</div>
              <input 
                type="number" 
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isFrozen}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className={cn(
                  "w-full bg-white/5 border rounded-2xl py-6 pl-12 pr-20 text-base md:text-2xl font-bold outline-none transition-all text-white",
                  (isInsufficient || isBelowMin || isFrozen) ? "border-red-500 text-red-500 focus:bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-white/10 focus:border-red-400"
                )}
              />
              <button 
                type="button"
                onClick={() => setWithdrawAmount(available_balance.toString())}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all font-mono"
              >
                Max
              </button>
            </div>
            <div className="flex justify-between items-center px-4">
               <p className="text-[9px] font-bold text-aura-muted uppercase tracking-widest italic outline-none">Withdrawal Fee: 20%</p>
               {amountNum > 0 && (
                 <div className="text-right space-y-1">
                    <p className="text-[8px] font-medium text-aura-muted uppercase tracking-tighter">Final Receive: <span className="text-aura-lime font-black">{formatCurrency(receiveAmount > 0 ? receiveAmount : 0)}</span></p>
                 </div>
               )}
            </div>
            
            {amountNum > 0 && (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 mt-2 animate-fade-in text-left">
                 <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted tracking-wider">
                    <span>Withdrawal Exchange Rate:</span>
                    <span className="text-white font-mono">₦{withdrawExchangeRate.toLocaleString()}/$</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted tracking-wider">
                    <span>Equivalent Value:</span>
                    <span className="text-white font-mono">₦{(amountNum * withdrawExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="border-t border-white/[0.03] pt-2 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Equivalent Net Payout:</span>
                    <span className="text-sm font-black text-emerald-400 font-serif">₦{(Math.max(0, receiveAmount) * withdrawExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
              </div>
            )}

            {isInsufficient && <p className="text-red-500 text-[10px] font-bold uppercase text-center">Insufficient funds</p>}
            {isBelowMin && <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-pulse">Minimum withdrawal threshold is ${withdrawalThreshold}</p>}
          </div>
          <button 
            disabled={!withdrawAmount || isInsufficient || isBelowMin || amountNum <= 0 || isFrozen}
            onClick={() => setWithdrawStep('method')}
            className={cn(
              "w-full py-5 text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl transition-all",
              (isInsufficient || isBelowMin || !withdrawAmount || isFrozen) ? "bg-white/10 text-white/30 cursor-not-allowed grayscale" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
            )}
          >
            {isFrozen ? 'Access Restricted' : 'Select Withdrawal Method'}
          </button>
        </div>
      );
    }

    if (withdrawStep === 'method') {
      return (
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex items-center justify-between mb-4">
             <button 
                onClick={() => setWithdrawStep('input')}
                className="flex items-center gap-2 text-aura-muted hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
             >
                <ChevronLeft size={16} /> Back
             </button>
             <div className="text-center flex-1 pr-12">
               <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Transfer Details</h2>
             </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[24px] space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-aura-muted tracking-widest">Requested Amount</span>
                <span className="text-sm font-bold text-white">{formatCurrency(amountNum)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-aura-muted tracking-widest">Withdrawal Fee (20%)</span>
                <span className="text-sm font-bold text-red-500">-{formatCurrency(fee)}</span>
             </div>
             <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Final Amount You Receive</span>
                <span className="text-xl font-black text-emerald-500 italic font-serif">{formatCurrency(receiveAmount)}</span>
             </div>
             {withdrawMethod === 'bank' && (
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                   <div className="text-left">
                      <span className="text-[10px] font-bold uppercase text-red-400 tracking-widest block">Equivalent NGN Cashout</span>
                      <span className="text-[8px] font-bold text-aura-muted uppercase tracking-widest font-mono">@ ₦{withdrawExchangeRate.toLocaleString()}/$</span>
                   </div>
                   <span className="text-lg font-black text-white italic font-serif">₦{(receiveAmount * withdrawExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
             )}
          </div>
          
          <div className="flex gap-2">
            {(['bank', 'crypto'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setWithdrawMethod(m)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                  withdrawMethod === m ? "bg-red-500/10 border-red-500 text-red-400" : "bg-white/5 border-white/5 text-aura-muted"
                )}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-4 text-white">
            {withdrawMethod === 'bank' ? (
              <div className="space-y-4">
                {profile?.withdraw_methods?.bank && (
                   <button 
                      onClick={() => handleUseSavedMethod('bank')}
                      className="w-full flex items-center justify-between p-4 bg-aura-lime/5 border border-aura-lime/20 rounded-xl group hover:bg-aura-lime/10 transition-all"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-aura-lime/20 text-aura-lime"><Check size={14} /></div>
                         <div className="text-left">
                            <p className="text-[9px] font-black uppercase text-white">Use Saved Bank Account</p>
                            <p className="text-[8px] font-bold text-aura-muted uppercase">{profile.withdraw_methods.bank.bankName} • {profile.withdraw_methods.bank.accNum}</p>
                         </div>
                      </div>
                      <ChevronRight size={14} className="text-aura-muted group-hover:text-aura-lime transition-transform group-hover:translate-x-1" />
                   </button>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Bank Name</label>
                  <button 
                    type="button"
                    onClick={() => setShowBankSelector(true)}
                    className="w-full bg-white/5 border border-red-500/10 rounded-xl px-5 py-4 flex items-center justify-between text-base md:text-sm outline-none hover:bg-white/10 transition-all text-left"
                  >
                    <span className={cn(bankDetails.bankName ? "text-white font-bold" : "text-white/20 font-medium")}>
                      {bankDetails.bankName || "Select Bank"}
                    </span>
                    <ChevronDown size={18} className="text-aura-muted" />
                  </button>
                  <BankSelectorModal 
                    isOpen={showBankSelector} 
                    onClose={() => setShowBankSelector(false)} 
                    onSelect={(bank) => setBankDetails({...bankDetails, bankName: bank})}
                    selectedBank={bankDetails.bankName}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Account Number</label>
                  <input 
                    type="tel" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bankDetails.accNum} 
                    onChange={e => setBankDetails({...bankDetails, accNum: e.target.value.replace(/[^0-9]/g, '')})} 
                    className="w-full bg-white/5 border border-red-500/10 rounded-xl px-5 py-4 text-base md:text-sm outline-none focus:border-red-400" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Account Name (Must match profile)</label>
                  <input type="text" value={bankDetails.accName} onChange={e => setBankDetails({...bankDetails, accName: e.target.value})} className="w-full bg-white/5 border border-red-500/10 rounded-xl px-5 py-4 text-base md:text-sm outline-none focus:border-red-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.withdraw_methods?.crypto && (
                   <button 
                      onClick={() => handleUseSavedMethod('crypto')}
                      className="w-full flex items-center justify-between p-4 bg-aura-lime/5 border border-aura-lime/20 rounded-xl group hover:bg-aura-lime/10 transition-all"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-aura-lime/20 text-aura-lime"><Check size={14} /></div>
                         <div className="text-left">
                            <p className="text-[9px] font-black uppercase text-white">Use Saved Crypto Wallet</p>
                            <p className="text-[8px] font-bold text-aura-muted uppercase font-mono">{profile.withdraw_methods.crypto.type.toUpperCase()} • {profile.withdraw_methods.crypto.address.substring(0, 10)}...</p>
                         </div>
                      </div>
                      <ChevronRight size={14} className="text-aura-muted group-hover:text-aura-lime transition-transform group-hover:translate-x-1" />
                   </button>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Asset Type</label>
                  <select value={cryptoDetails.type} onChange={e => setCryptoDetails({...cryptoDetails, type: e.target.value})} className="w-full bg-[#161b22] border border-red-500/10 rounded-xl px-5 py-4 text-base md:text-sm outline-none focus:border-red-400">
                    <option value="usdt">USDT (TRC20)</option>
                    <option value="btc">Bitcoin (Native)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Wallet Address</label>
                  <input type="text" value={cryptoDetails.address} onChange={e => setCryptoDetails({...cryptoDetails, address: e.target.value})} className="w-full bg-white/5 border border-red-500/10 rounded-xl px-5 py-4 text-base md:text-sm outline-none focus:border-red-400" />
                </div>
              </div>
            )}
          </div>

          {withdrawError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{withdrawError}</p>}

          <button 
            disabled={withdrawMethod === 'bank' ? (!bankDetails.bankName || !bankDetails.accNum || !bankDetails.accName || isSubmitting) : (!cryptoDetails.address || isSubmitting)}
            onClick={handleWithdrawalRequest}
            className="w-full py-5 bg-red-600 text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all shadow-red-500/20"
          >
            {isSubmitting ? 'Processing...' : 'Authorize Withdrawal'}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <SuccessModal 
        isOpen={showDepositSuccess}
        onClose={handleDepositReset}
        title="Deposit Submitted"
        message={`Your deposit of ${formatCurrency(parseFloat(depositAmount) || 0)} has been logged. Verification sequence initiated.`}
      />
      <SuccessModal 
        isOpen={showWithdrawSuccess}
        onClose={handleWithdrawReset}
        title="Withdrawal Submitted"
        message="Your withdrawal request has been submitted successfully. Withdrawals are typically completed within 15 to 45 minutes. If processing takes longer, please contact support."
        autoClose={false}
      />

      <PinProtocolModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(pin) => {
          handleWithdrawSubmit(pin);
        }}
        isSubmitting={isSubmitting}
      />

      {/* COUNTRY SELECTOR MODAL */}
      <AnimatePresence>
        {showCountryModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
              onClick={() => {
                if (selectedCountry) setShowCountryModal(false);
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0c0d12]/95 border border-white/10 rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(255,255,255,0.01)] flex flex-col max-h-[80vh] backdrop-blur-xl z-10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-aura-lime/5 rounded-full blur-3xl -z-10 pointer-events-none" />
              {/* Header */}
              <div className="p-8 border-b border-white/5 space-y-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white italic font-serif leading-none">Select Region</h3>
                    <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">Assign localized settlement node</p>
                  </div>
                  {selectedCountry && (
                    <button 
                      onClick={() => setShowCountryModal(false)}
                      className="p-2 text-aura-muted hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-muted" />
                  <input 
                    type="text" 
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold text-white outline-none focus:border-aura-lime/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Countries Grid */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => {
                    const isNigeria = c.name === 'Nigeria';
                    return (
                      <button 
                        key={c.code}
                        onClick={() => {
                          if (isNigeria) {
                            setSelectedCountry('Nigeria');
                            setShowCountryModal(false);
                            toast.success('Assigned instant local institutional settlement route.');
                            navigate('/fund/deposit');
                          } else {
                            setShowCountryModal(false);
                            setNotSupportedCountry(c.name);
                          }
                        }}
                        className={cn(
                          "p-4 flex items-center justify-between bg-white/5 border rounded-2xl transition-all hover:bg-white/10 group text-left",
                          isNigeria ? "border-aura-lime/30 text-white" : "border-white/5 text-aura-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" role="img" aria-label={c.name}>{c.flag}</span>
                          <div>
                            <p className="text-xs font-bold leading-none">{c.name}</p>
                            <p className="text-[8px] font-bold opacity-40 font-mono mt-0.5">{c.code}</p>
                          </div>
                        </div>
                        {isNigeria && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-aura-lime px-2 py-0.5 bg-aura-lime/10 border border-aura-lime/20 rounded-md">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* REGION NOT SUPPORTED MODAL */}
        {notSupportedCountry && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setNotSupportedCountry(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-[#0d1016] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-6 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500">
                <Globe size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic font-serif leading-none">Not Supported</h3>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{notSupportedCountry} Node Offline</p>
              </div>

              <p className="text-xs font-bold text-aura-muted leading-relaxed uppercase tracking-wider">
                Automated peer-to-peer settlement networks for <span className="text-white">{notSupportedCountry}</span> are currently undergoing core maintenance.
              </p>

              <button 
                onClick={() => {
                  setNotSupportedCountry(null);
                  setShowCountryModal(true);
                }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-aura-muted hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all border border-white/5"
              >
                Choose Another Region
              </button>

              <a 
                href="https://t.me/Aura_support_Bot" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="w-full py-4 bg-aura-lime text-aura-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-aura-lime/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Send size={12} /> Contact Telegram Support
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Premium Desktop Side-by-Side Sidebar and Main Content, and Mobile Wallet Hub */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start w-full">
        {/* LEFT FIXED SIDEBAR FOR DESKTOP */}
        <div className="hidden lg:block lg:w-72 lg:flex-shrink-0 sticky top-28 space-y-6">
          <div className="p-6 bg-[#11141b]/95 border border-white/5 rounded-[32px] space-y-6 shadow-2xl backdrop-blur-md">
            <div className="space-y-1 pb-4 border-b border-white/5">
              <p className="text-[9px] font-black text-aura-lime uppercase tracking-[0.2em] mb-1">Transit Node</p>
              <h2 className="text-xl font-black text-white uppercase italic font-serif leading-none">Wave Wallet</h2>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-aura-muted hover:text-white hover:bg-white/5 transition-all group"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={16} />
                </div>
                Dashboard
              </button>

              <button 
                onClick={() => navigate('/fund/deposit')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group",
                  tab === 'deposit' 
                    ? "bg-aura-lime text-aura-black shadow-[0_4px_20px_rgba(204,255,0,0.15)]" 
                    : "text-aura-muted hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", tab === 'deposit' ? "bg-aura-black/10 text-aura-black" : "bg-emerald-500/10 text-emerald-400")}>
                  <PlusCircle size={16} />
                </div>
                Deposit
              </button>

              <button 
                onClick={() => navigate('/fund/withdraw')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group",
                  tab === 'withdraw' 
                    ? "bg-aura-lime text-aura-black shadow-[0_4px_20px_rgba(204,255,0,0.15)]" 
                    : "text-aura-muted hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", tab === 'withdraw' ? "bg-aura-black/10 text-aura-black" : "bg-rose-500/10 text-rose-400")}>
                  <MinusCircle size={16} />
                </div>
                Withdraw
              </button>

              <button 
                onClick={() => navigate('/fund/transactions')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group",
                  (tab === 'transactions' || !tab) 
                    ? "bg-aura-lime text-aura-black shadow-[0_4px_20px_rgba(204,255,0,0.15)]" 
                    : "text-aura-muted hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", (tab === 'transactions' || !tab) ? "bg-aura-black/10 text-aura-black" : "bg-purple-500/10 text-purple-400")}>
                  <History size={16} />
                </div>
                History
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-wider text-aura-muted opacity-60">System Synchronized</span>
            </div>
          </div>
        </div>

        {/* MAIN WALLET NODE / CONTENT AREA */}
        <div className="flex-1 w-full space-y-8">
          
          {/* 1. Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <SummaryCard label="Funding Wallet" value={formatCurrency(profile?.funding_balance || 0)} color="text-blue-400" />
            <SummaryCard label="Available" value={formatCurrency(profile?.available_balance || 0)} color="text-aura-lime" />
            <SummaryCard label="Total Earnings" value={formatCurrency(profile?.total_earnings || 0)} color="text-purple-400" />
            <SummaryCard label="Total Invested" value={formatCurrency(profile?.total_invested || 0)} color="text-orange-400" />
          </div>

          {/* PREMIUM FLOATING CONTINUATION POPUPS (MOBILE ONLY/POPUP BEHAVIOR) */}
          <AnimatePresence>
            {showContinueDepositPopup && !isDepositContinued && tab === 'deposit' && (
              <div className="fixed inset-0 z-[1150] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    sessionStorage.setItem('nexus_has_seen_deposit_popup', 'true');
                    setHasDismissedDepositPopup(true);
                    setIsDepositContinued(true);
                    setShowContinueDepositPopup(false);
                  }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="relative w-full max-w-[280px] bg-[#0c0d12]/95 border border-emerald-500/20 rounded-[28px] overflow-hidden p-5 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.08)] z-10 backdrop-blur-xl"
                >
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('nexus_has_seen_deposit_popup', 'true');
                      setHasDismissedDepositPopup(true);
                      setIsDepositContinued(true);
                      setShowContinueDepositPopup(false);
                    }} 
                    className="absolute top-3.5 right-3.5 p-1 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white"
                  >
                    <X size={14} />
                  </button>

                  <div className="space-y-4 pt-1">
                    <RealisticDepositIcon />

                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">Deposit</h3>
                      <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Swift/secure payment</p>
                    </div>

                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide leading-relaxed px-1">
                      Proceed to complete your deposit.
                    </p>

                    <button
                      onClick={() => {
                        sessionStorage.setItem('nexus_has_seen_deposit_popup', 'true');
                        setHasDismissedDepositPopup(true);
                        setIsDepositContinued(true);
                        setShowContinueDepositPopup(false);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black uppercase tracking-[0.15em] text-[9px] rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      Proceed <ArrowRight size={10} />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showContinueWithdrawPopup && !isWithdrawContinued && tab === 'withdraw' && (
              <div className="fixed inset-0 z-[1150] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    sessionStorage.setItem('nexus_has_seen_withdraw_popup', 'true');
                    setHasDismissedWithdrawPopup(true);
                    setIsWithdrawContinued(true);
                    setShowContinueWithdrawPopup(false);
                  }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="relative w-full max-w-[280px] bg-[#0c0d12]/95 border border-rose-500/20 rounded-[28px] overflow-hidden p-5 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(244,63,94,0.08)] z-10 backdrop-blur-xl"
                >
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('nexus_has_seen_withdraw_popup', 'true');
                      setHasDismissedWithdrawPopup(true);
                      setIsWithdrawContinued(true);
                      setShowContinueWithdrawPopup(false);
                    }} 
                    className="absolute top-3.5 right-3.5 p-1 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white"
                  >
                    <X size={14} />
                  </button>

                  <div className="space-y-4 pt-1">
                    <RealisticWithdrawIcon />

                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">Withdrawal</h3>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Secure Payment gateway</p>
                    </div>

                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide leading-relaxed px-1">
                      Continue to complete your withdrawal.
                    </p>

                    <button
                      onClick={() => {
                        sessionStorage.setItem('nexus_has_seen_withdraw_popup', 'true');
                        setHasDismissedWithdrawPopup(true);
                        setIsWithdrawContinued(true);
                        setShowContinueWithdrawPopup(false);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black uppercase tracking-[0.15em] text-[9px] rounded-xl shadow-lg shadow-rose-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      Continue <ArrowRight size={10} />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MOBILE NEW PREMIUM ACTION HUB */}
          <div className="lg:hidden space-y-6">
            <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/10 rounded-[32px] p-4 py-5 shadow-[inner_0_1px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.6)]">
              <div className="grid grid-cols-3 gap-3">
                {/* DEPOSIT ACTION BUTTON */}
                <button 
                  onClick={handleMobileDepositClick}
                  className={cn(
                    "relative py-5 px-2 rounded-[24px] bg-[#0d1016]/80 border transition-all duration-300 flex flex-col items-center justify-center gap-2 group overflow-hidden active:scale-95 shadow-md",
                    tab === 'deposit' 
                      ? "border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                      : "border-white/5 hover:border-emerald-500/20 text-white/80"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-300",
                    tab === 'deposit' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-emerald-400 group-hover:bg-emerald-500/10"
                  )}>
                    <PlusCircle size={18} className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                    {tab === 'deposit' && <span className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping opacity-30" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Deposit</span>
                </button>

                {/* WITHDRAW ACTION BUTTON */}
                <button 
                  onClick={handleMobileWithdrawClick}
                  className={cn(
                    "relative py-5 px-2 rounded-[24px] bg-[#0d1016]/80 border transition-all duration-300 flex flex-col items-center justify-center gap-2 group overflow-hidden active:scale-95 shadow-md",
                    tab === 'withdraw' 
                      ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
                      : "border-white/5 hover:border-rose-500/20 text-white/80"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-300",
                    tab === 'withdraw' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/5 text-rose-400 group-hover:bg-rose-500/10"
                  )}>
                    <MinusCircle size={18} className="drop-shadow-[0_0_4px_rgba(244,63,94,0.5)]" />
                    {tab === 'withdraw' && <span className="absolute inset-0 rounded-full bg-rose-500/15 animate-ping opacity-30" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Withdraw</span>
                </button>

                {/* HISTORY ACTION BUTTON */}
                <button 
                  onClick={() => navigate('/fund/transactions')}
                  className={cn(
                    "relative py-5 px-2 rounded-[24px] bg-[#0d1016]/80 border transition-all duration-300 flex flex-col items-center justify-center gap-2 group overflow-hidden active:scale-95 shadow-md",
                    (tab === 'transactions' || !tab) 
                      ? "border-purple-500/50 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                      : "border-white/5 hover:border-purple-500/20 text-white/80"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-300",
                    (tab === 'transactions' || !tab) ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-purple-400 group-hover:bg-purple-500/10"
                  )}>
                    <History size={18} className="drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                    {(tab === 'transactions' || !tab) && <span className="absolute inset-0 rounded-full bg-purple-500/15 animate-ping opacity-30" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">History</span>
                </button>
              </div>
            </div>

            {/* EMBEDDED CONTENT BLOCK ON MOBILE */}
            <div className="space-y-4">
              {tab === 'deposit' && (
                isDepositContinued ? (
                  <div className="animate-fade-in">{renderDeposit()}</div>
                ) : (
                  <div className="py-12 text-center border border-white/5 bg-[#11141b]/40 rounded-[32px] shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30 border border-white/5 shadow-inner">
                        <PlusCircle size={22} className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-aura-lime tracking-widest">Aura Secure Bridge</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Awaiting Secure Gateway Authorization...</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {tab === 'withdraw' && (
                isWithdrawContinued ? (
                  <div className="animate-fade-in">{renderWithdraw()}</div>
                ) : (
                  <div className="py-12 text-center border border-white/5 bg-[#11141b]/40 rounded-[32px] shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30 border border-white/5 shadow-inner">
                        <MinusCircle size={22} className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-aura-lime tracking-widest">Aura Secure Bridge</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Awaiting Secure Gateway Authorization...</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {(tab === 'transactions' || !tab) && (
                <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted flex items-center gap-2 font-mono">
                      <History size={14} className="text-purple-400" /> Transaction History
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="flex bg-[#11141b] p-1 rounded-lg border border-white/5">
                        {['all', 'deposit', 'withdrawal', 'transfer', 'investment'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={cn(
                              "px-3 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all font-mono",
                              filterType === t ? "bg-aura-lime text-aura-black" : "text-aura-muted hover:text-white"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-[#11141b]/30">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <History size={32} className="text-white/10" />
                      </div>
                      <p className="text-aura-muted text-[10px] font-black uppercase tracking-[0.2em]">No matching records found</p>
                      {(filterType !== 'all' || filterStatus !== 'all') && (
                        <button 
                          onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
                          className="mt-4 text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline flex items-center gap-2 mx-auto"
                        >
                          <X size={12} /> Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3" id="fund-tx-grid">
                      {filteredTransactions.map((tx, idx) => (
                        <TransactionTicket 
                          key={`${tx.type}-${tx.id}-${idx}`}
                          tx={tx}
                          currentUserId={user?.uid ?? undefined}
                          variant="fund"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE CONTENT BLOCK (DESKTOP) */}
          <div className={cn("min-h-[400px] hidden lg:block")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab || 'home'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {tab === 'deposit' && renderDeposit()}
                {tab === 'withdraw' && renderWithdraw()}
                {(tab === 'transactions' || !tab) && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted flex items-center gap-2">
                        <History size={14} className="text-purple-400" /> Transaction History
                      </h3>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex bg-[#11141b] p-1 rounded-lg border border-white/5">
                          {['all', 'deposit', 'withdrawal', 'transfer', 'investment'].map((t) => (
                            <button
                              key={t}
                              onClick={() => setFilterType(t)}
                              className={cn(
                                "px-3 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all",
                                filterType === t ? "bg-aura-lime text-aura-black" : "text-aura-muted hover:text-white"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                      <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <History size={32} className="text-white/10" />
                        </div>
                        <p className="text-aura-muted text-[10px] font-black uppercase tracking-[0.2em]">No matching records found</p>
                        {(filterType !== 'all' || filterStatus !== 'all') && (
                          <button 
                            onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
                            className="mt-4 text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline flex items-center gap-2 mx-auto"
                          >
                            <X size={12} /> Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3" id="fund-tx-grid">
                        {filteredTransactions.map((tx, idx) => (
                          <TransactionTicket 
                            key={`${tx.type}-${tx.id}-${idx}`}
                            tx={tx}
                            currentUserId={user?.uid ?? undefined}
                            variant="fund"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
