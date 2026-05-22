import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  Zap, 
  History, 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle, 
  XCircle,
  Activity,
  LogOut,
  ChevronRight,
  TrendingUp,
  Wallet,
  Coins,
  Building2,
  ArrowDownLeft,
  Settings,
  Lock,
  Shield,
  Ban,
  UserPlus,
  UserMinus,
  RefreshCw,
  Play,
  Pause,
  DollarSign,
  AlertTriangle,
  Mail,
  MapPin,
  Clock,
  IdCard,
  UserCircle,
  ArrowLeft,
  Copy,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  addDoc,
  increment,
  getDoc,
  runTransaction,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logAudit } from '../../lib/auth_security';

// --- COMPONENTS ---

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
        active 
          ? "bg-aura-lime text-aura-black brutalist-shadow font-black" 
          : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      {badge && badge > 0 ? (
        <span className={cn(
          "w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-full shadow-inner",
          active ? "bg-black text-aura-lime font-black" : "bg-red-500 text-white animate-pulse"
        )}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, onClick }: { label: string, value: string, icon: any, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 sm:p-6 bg-white/[0.02] border border-white/5 rounded-[24px] hover:border-white/10 transition-all flex flex-col justify-between min-w-0 w-full",
        onClick ? "cursor-pointer hover:bg-white/[0.04] hover:scale-[1.01]" : ""
      )}
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <Icon size={20} className={color} />
          <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted bg-white/5 px-2 py-1 rounded-md">Live Sync</p>
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-black font-serif italic tracking-tight text-white truncate" title={value}>
          {value}
        </p>
      </div>
      <p className="text-[9px] sm:text-[10px] font-bold text-aura-muted uppercase tracking-wider mt-2 truncate">{label}</p>
    </div>
  );
}

export default function CipherAdmin() {
  const { user, profile, logout, plans } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'canalytics' | 'cdeposits' | 'cwithdrawals' | 'cinvestments' | 'cuser' | 'csettings' | 'csecurity' | 'cplans' | 'ckycs' | 'cnotifications' | 'cui_editor' | 'cnewsletter'>('canalytics');
  const [investFilter, setInvestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketType, setTicketType] = useState<'deposit' | 'withdrawal' | 'investment' | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [isDetailView, setIsDetailView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended' | 'banned' | 'inactive'>('all');
  
  // UI History System
  const [uiVersions, setUiVersions] = useState<any[]>([]);
  const [uiConfig, setUiConfig] = useState<any>({});
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // Admin Security Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      // Admin session expires after 24 hours of inactivity
      timeout = setTimeout(() => {
        toast.error("Admin Security Session Expired. Re-authentication Required.");
        logout().then(() => navigate('/welcome'));
      }, 24 * 60 * 60 * 1000); 
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    
    resetTimeout();
    
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      clearTimeout(timeout);
    };
  }, [logout, navigate]);

  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);

  // Broadcaster and monitor session states
  const [seenDepositIds, setSeenDepositIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_deposit_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [seenWithdrawalIds, setSeenWithdrawalIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_withdrawal_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [seenInvestmentIds, setSeenInvestmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_investment_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [investmentPreviewType, setInvestmentPreviewType] = useState<'active' | 'inactive' | null>(null);

  // Broadcast Notification Form and Targeting Panel States
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'selected' | 'inactive' | 'inactive_investors'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [notifSearchTerm, setNotifSearchTerm] = useState('');
  const [notifUserFilter, setNotifUserFilter] = useState<'all' | 'inactive' | 'inactive_investors'>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const pendingDepositsUnseenCount = useMemo(() => {
    return deposits.filter((dep: any) => dep.status === 'pending' && !seenDepositIds.includes(dep.id)).length;
  }, [deposits, seenDepositIds]);

  const pendingWithdrawalsUnseenCount = useMemo(() => {
    return withdrawals.filter((wit: any) => wit.status === 'pending' && !seenWithdrawalIds.includes(wit.id)).length;
  }, [withdrawals, seenWithdrawalIds]);

  const pendingInvestmentsUnseenCount = useMemo(() => {
    return investments.filter((inv: any) => inv.status === 'pending' && !seenInvestmentIds.includes(inv.id)).length;
  }, [investments, seenInvestmentIds]);

  useEffect(() => {
    if (activeTab === 'cdeposits') {
      const pendingIds = deposits.filter((dep: any) => dep.status === 'pending').map((dep: any) => dep.id);
      if (pendingIds.some(id => !seenDepositIds.includes(id))) {
        const updated = Array.from(new Set([...seenDepositIds, ...pendingIds]));
        setSeenDepositIds(updated);
        localStorage.setItem('seen_deposit_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, deposits, seenDepositIds]);

  useEffect(() => {
    if (activeTab === 'cwithdrawals') {
      const pendingIds = withdrawals.filter((wit: any) => wit.status === 'pending').map((wit: any) => wit.id);
      if (pendingIds.some(id => !seenWithdrawalIds.includes(id))) {
        const updated = Array.from(new Set([...seenWithdrawalIds, ...pendingIds]));
        setSeenWithdrawalIds(updated);
        localStorage.setItem('seen_withdrawal_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, withdrawals, seenWithdrawalIds]);

  useEffect(() => {
    if (activeTab === 'cinvestments') {
      const pendingIds = investments.filter((inv: any) => inv.status === 'pending').map((inv: any) => inv.id);
      if (pendingIds.some(id => !seenInvestmentIds.includes(id))) {
        const updated = Array.from(new Set([...seenInvestmentIds, ...pendingIds]));
        setSeenInvestmentIds(updated);
        localStorage.setItem('seen_investment_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, investments, seenInvestmentIds]);

  const getUserDetails = (userId: string, defaultName?: string) => {
    const matchedUser = users.find(u => u?.id === userId);
    return {
      id: userId || 'N/A',
      name: matchedUser?.name || defaultName || 'Anonymous',
      email: matchedUser?.email || 'N/A',
    };
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    
    // Total Deposit represents only unused deposited funds (funding_balance) across all users
    const totalDeposits = users.reduce((acc, curr) => acc + (curr.funding_balance || 0), 0);
      
    // Approved withdrawals sum
    const totalWithdrawals = withdrawals
      .filter((w: any) => w.status === 'approved')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    // Total Active Investments count and sum
    const activeInvestmentsList = investments.filter((i: any) => i.status === 'active');
    const activeNodes = activeInvestmentsList.length;
    const totalInvested = activeInvestmentsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Create a new metric mapping real-time spendable Available Balance across all users
    const totalAvailableBalance = users.reduce((acc, curr) => acc + (curr.available_balance || 0), 0);

    // Total Inactive Investments count
    const inactiveInvestmentsList = investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected');
    const inactiveNodes = inactiveInvestmentsList.length;

    // Total Live ROI Generated
    const totalLiveRoiGenerated = investments
      .filter((i: any) => i.status === 'active' || i.status === 'completed')
      .reduce((acc, curr) => acc + (curr.total_earned || 0), 0);

    // Total Active Investors: Distinct users with active investments
    const activeInvestorsWithNode = new Set(activeInvestmentsList.map((i: any) => i.user_id));
    const totalActiveInvestors = activeInvestorsWithNode.size;

    // Total Assets (sum of all users' active assets globally: Deposit + Spendable/Available + Investment + Referral)
    const totalReferralEarnings = users.reduce((acc, curr) => acc + (curr.referral_earnings || 0), 0);
    const totalAssets = totalDeposits + totalAvailableBalance + totalInvested + totalReferralEarnings;

    // Security alerts count
    const securityAlerts = securityLogs.filter((l: any) => 
      l.action?.includes('mfa_failed') || l.action?.includes('denied')
    ).length;

    // Active nodes count grouped by plans: Regular, Premium, Elite
    const activeRegularCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'regular').length;
    const activePremiumCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'premium').length;
    const activeEliteCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'elite').length;

    return {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalInvested,
      totalAvailableBalance,
      activeNodes,
      inactiveNodes,
      totalAssets,
      totalLiveRoiGenerated,
      totalActiveInvestors,
      securityAlerts,
      activeRegularCount,
      activePremiumCount,
      activeEliteCount
    };
  }, [users, deposits, withdrawals, investments, securityLogs]);

  useEffect(() => {
    const CIPHER_UID = '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
    const CIPHER_EMAIL = 'support@tavariwave.network';
    const OLD_CIPHER_EMAIL = 'contact.cga.usa@gmail.com';
    
    const isCipher = user?.uid === CIPHER_UID || user?.email === CIPHER_EMAIL || user?.email === OLD_CIPHER_EMAIL || profile?.role === 'cipher';

    if (!isCipher) return;
    
    // Real-time listeners for data sync
    const unsubscribeTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('created_at', 'desc'), limit(500)), 
      (snap) => {
        setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("Transactions sync failed:", err.message)
    );
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), 
      (doc) => {
        if (doc.exists()) {
          setExchangeRate(doc.data().usd_to_ngn_rate || 1400);
        }
      },
      (err) => console.error("System settings sync failed:", err.message)
    );

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
      },
      (err) => console.error("Users list sync failed:", err.message)
    );

    const unsubscribeDeposits = onSnapshot(query(collection(db, 'deposits'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeposits(list);
      },
      (err) => console.error("Deposits sync failed:", err.message)
    );

    const unsubscribeWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWithdrawals(list);
      },
      (err) => console.error("Withdrawals sync failed:", err.message)
    );

    const unsubscribeInvestments = onSnapshot(query(collection(db, 'investments'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvestments(list);
      },
      (err) => console.error("Investments sync failed:", err.message)
    );

    const unsubscribeAudit = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50)), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSecurityLogs(list);
      },
      (err) => console.error("Audit logs sync failed:", err.message)
    );

    const unsubscribeUI = onSnapshot(doc(db, 'settings', 'ui_config'), 
      (snap) => {
        if (snap.exists()) setUiConfig(snap.data());
      },
      (err) => console.error("UI Config sync failed:", err.message)
    );

    const unsubscribeUIVersions = onSnapshot(query(collection(db, 'ui_versions'), orderBy('timestamp', 'desc'), limit(50)), 
      (snap) => {
        setUiVersions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("UI Versions sync failed:", err.message)
    );

    let intervalId: any;
    const fetchSubscribers = async () => {
      try {
        const idToken = await user?.getIdToken();
        if (!idToken) return;
        const res = await fetch('/api/admin/newsletter-subscribers', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSubscribers(data);
        }
      } catch (err: any) {
        console.error("Subscribers fetch failed:", err.message);
      }
    };

    if (isCipher) {
      fetchSubscribers();
      intervalId = setInterval(fetchSubscribers, 10000);
    }

    return () => {
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeDeposits();
      unsubscribeWithdrawals();
      unsubscribeInvestments();
      unsubscribeAudit();
      unsubscribeUI();
      unsubscribeUIVersions();
      unsubscribeTransactions();
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, profile]);

  const fetchDevices = async (userId: string) => {
    try {
      const q = query(collection(db, 'users', userId, 'devices'), orderBy('lastLogin', 'desc'));
      const snap = await getDocs(q);
      setUserDevices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to fetch devices:", err);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDevices(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchData = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const sendNotifications = async () => {
    if (!notifTitle.trim()) {
      toast.error("Please enter a message title");
      return;
    }
    if (!notifMessage.trim()) {
      toast.error("Please enter a message body");
      return;
    }

    try {
      setIsSendingNotif(true);

      // Determine target users
      let targetUsers: any[] = [];
      if (notifTarget === 'all') {
        targetUsers = users;
      } else if (notifTarget === 'inactive') {
        targetUsers = users.filter(u => {
          const hasActiveNodes = investments.some(i => i.user_id === u.id && i.status === 'active');
          return !hasActiveNodes;
        });
      } else if (notifTarget === 'inactive_investors') {
        targetUsers = users.filter(u => {
          const hasActiveNodes = investments.some(i => i.user_id === u.id && i.status === 'active');
          const hasAnyNodes = investments.some(i => i.user_id === u.id);
          return !hasActiveNodes && hasAnyNodes;
        });
      } else if (notifTarget === 'selected') {
        targetUsers = users.filter(u => selectedUserIds.includes(u.id));
        if (targetUsers.length === 0) {
          toast.error("Please select at least one user first");
          setIsSendingNotif(false);
          return;
        }
      }

      if (targetUsers.length === 0) {
        toast.error("No users match the selected targeting criteria");
        setIsSendingNotif(false);
        return;
      }

      // Write notifications to Firebase
      const { doc, collection, writeBatch } = await import('firebase/firestore');
      
      const batchLimit = 400;
      let batch = writeBatch(db);
      let opCount = 0;

      for (let i = 0; i < targetUsers.length; i++) {
        const u = targetUsers[i];
        if (!u.id) continue;
        
        const notifRef = doc(collection(db, 'notifications'));
        const newNotification = {
          user_id: u.id,
          type: 'info',
          title: notifTitle,
          message: notifMessage,
          read: false,
          created_at: new Date().toISOString()
        };
        
        batch.set(notifRef, newNotification);
        opCount++;

        if (opCount >= batchLimit) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }

      toast.success(`Success! Broadcasted notification to ${targetUsers.length} users.`);
      setNotifTitle('');
      setNotifMessage('');
      setSelectedUserIds([]);
    } catch (e: any) {
      console.error("NOTIFICATION BROADCAST ERROR:", e);
      toast.error(`Broadcast failed: ${e?.message || 'Operation Denied'}`);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const approveDeposit = async (deposit: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'deposits', deposit.id);
        const userRef = doc(db, 'users', deposit.user_id);

        const depositDoc = await transaction.get(depositRef);
        if (!depositDoc.exists()) throw new Error("Deposit missing");

        const depositData = depositDoc.data();
        if (depositData.status !== 'pending') throw new Error("Already processed");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User missing");

        const depositAmountValue = parseFloat(depositData.amount || deposit.amount || 0);

        if (depositData.is_twn_deposit) {
          const twnCredited = depositData.twn_amount || (depositAmountValue * 50);
          transaction.update(userRef, { 
            twn_balance: increment(twnCredited)
          });
        } else {
          transaction.update(userRef, { 
            funding_balance: increment(depositAmountValue)
          });
        }

        transaction.update(depositRef, { 
          status: 'approved', 
          updated_at: new Date().toISOString() 
        });
      });

      toast.success("Deposit Approved & Balance Credited");
    } catch (error) {
      console.error("DEBUG [TRANSACTION ERROR]:", error);
      toast.error("Process failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const declineDeposit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'deposits', id), { status: 'declined', updated_at: new Date().toISOString() });
      toast.success("Deposit Declined");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const approveWithdrawal = async (withdrawal: any) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { 
        status: 'approved', 
        updated_at: new Date().toISOString() 
      });
      toast.success("Withdrawal Approved & Finalized");
    } catch (error) {
       console.error("WITHDRAWAL APPROVAL ERROR:", error);
       toast.error("Process failed");
    }
  };

  const declineWithdrawal = async (withdrawal: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
        const userRef = doc(db, 'users', withdrawal.user_id);

        const withdrawalSnap = await transaction.get(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal missing");
        if (withdrawalSnap.data().status !== 'pending') throw new Error("Already processed");

        // Return the funds
        transaction.update(userRef, { 
          available_balance: increment(withdrawal.amount)
        });

        transaction.update(withdrawalRef, { 
          status: 'declined', 
          updated_at: new Date().toISOString() 
        });

        // Add return log
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: withdrawal.user_id,
          type: 'adjustment',
          amount: withdrawal.amount,
          description: `Withdrawal Rejection Refund (${withdrawal.id})`,
          status: 'approved',
          created_at: new Date().toISOString()
        });
      });
      toast.success("Withdrawal Declined & Funds Returned");
    } catch (error: any) {
      console.error("WITHDRAWAL DECLINE ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const approveInvestment = async (investment: any) => {
    try {
      await updateDoc(doc(db, 'investments', investment.id), { 
        status: 'inactive', 
        updated_at: new Date().toISOString() 
      });
      await updateDoc(doc(db, 'users', investment.user_id), { 
        total_invested: increment(investment.amount)
      });
      toast.success("Investment Approved & Awaiting Activation");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const rejectInvestment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'investments', id), { 
        status: 'rejected', 
        updated_at: new Date().toISOString() 
      });
      toast.success("Investment Rejected");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const stopInvestment = async (investment: any) => {
    try {
      await updateDoc(doc(db, 'investments', investment.id), { status: 'completed', updated_at: new Date().toISOString() });
      toast.success("Investment Stopped");
    } catch (error) {
       toast.error("Process failed");
    }
  };

  const updateUserBalance = async (userId: string, field: string, amount: number, action: 'add' | 'subtract' | 'set') => {
    try {
      const userRef = doc(db, 'users', userId);
      if (action === 'add') {
        await updateDoc(userRef, { [field]: increment(amount) });
        toast.success(`Added ${formatCurrency(amount)} to ${field.replace('_', ' ')}`);
      } else if (action === 'subtract') {
        await updateDoc(userRef, { [field]: increment(-amount) });
        toast.success(`Subtracted ${formatCurrency(amount)} from ${field.replace('_', ' ')}`);
      } else {
        await updateDoc(userRef, { [field]: amount });
        toast.success(`Set ${field.replace('_', ' ')} to ${formatCurrency(amount)}`);
      }
    } catch (error) {
      toast.error("Balance update failed");
    }
  };

  const toggleUserStatus = async (userId: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), { [field]: value });
      toast.success("Account status updated");
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const updateExchangeRate = async (newRate: number) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        usd_to_ngn_rate: newRate,
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success("Exchange rate updated globally");
    } catch (error) {
      console.error("RATE UPDATE ERROR:", error);
      toast.error("Failed to update exchange rate");
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsDetailView(false);
    if (profile?.uid) {
      logAudit(profile.uid, 'admin_tab_navigate', { tab });
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <img src="https://i.imgur.com/wU33xy3.png" alt="Cipher Terminal Logo" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
          <span className="text-sm font-black uppercase tracking-tighter">CIPHER TERMINAL</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" active={activeTab === 'canalytics'} onClick={() => handleTabChange('canalytics')} />
          <SidebarItem icon={<CreditCard size={18} />} label="Deposits" active={activeTab === 'cdeposits'} onClick={() => handleTabChange('cdeposits')} badge={pendingDepositsUnseenCount} />
          <SidebarItem icon={<ArrowDownLeft size={18} />} label="Withdrawals" active={activeTab === 'cwithdrawals'} onClick={() => handleTabChange('cwithdrawals')} badge={pendingWithdrawalsUnseenCount} />
          <SidebarItem icon={<Zap size={18} />} label="Investments" active={activeTab === 'cinvestments'} onClick={() => handleTabChange('cinvestments')} badge={pendingInvestmentsUnseenCount} />
          <SidebarItem icon={<Users size={18} />} label="Users" active={activeTab === 'cuser'} onClick={() => handleTabChange('cuser')} />
          <SidebarItem icon={<UserMinus size={18} />} label="Inactive" active={activeTab === 'cinactiveusers'} onClick={() => handleTabChange('cinactiveusers')} />
          <SidebarItem icon={<IdCard size={18} />} label="KYC Control" active={activeTab === 'ckycs'} onClick={() => handleTabChange('ckycs')} />
          <SidebarItem icon={<ShieldCheck size={18} />} label="Security" active={activeTab === 'csecurity'} onClick={() => handleTabChange('csecurity')} />
          <SidebarItem icon={<TrendingUp size={18} />} label="ROI Plans" active={activeTab === 'cplans'} onClick={() => handleTabChange('cplans')} />
          <SidebarItem icon={<Play size={18} />} label="UI Studio" active={activeTab === 'cui_editor'} onClick={() => handleTabChange('cui_editor')} />
          <SidebarItem icon={<Mail size={18} />} label="Newsletter Subscribers" active={activeTab === 'cnewsletter'} onClick={() => handleTabChange('cnewsletter')} />
          <SidebarItem icon={<Mail size={18} />} label="Notifications" active={activeTab === 'cnotifications'} onClick={() => handleTabChange('cnotifications')} />
          <SidebarItem icon={<History size={18} />} label="Transactions" active={activeTab === 'ctransactions'} onClick={() => handleTabChange('ctransactions')} />
          <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'csettings'} onClick={() => handleTabChange('csettings')} />
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={async () => { await logout(); navigate('/welcome'); }}
            className="flex items-center gap-3 w-full p-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
          >
            <LogOut size={18} />
            <span className="text-[10px] uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-[-0.05em] leading-[0.85] text-white font-serif italic mb-2 capitalize">
              {activeTab.substring(1)}.
            </h1>
            <p className="text-aura-muted text-[10px] font-bold uppercase tracking-[0.3em]">System Level Access: root_alpha</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl text-aura-muted hover:text-aura-lime transition-all">
                <History size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        {activeTab === 'canalytics' && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <StatCard label="Total Users" value={stats.totalUsers.toString()} icon={Users} color="text-blue-400" />
              <StatCard label="Active Investors" value={stats.totalActiveInvestors.toString()} icon={Users} color="text-cyan-400" />
              <StatCard label="Total Assets" value={formatCurrency(stats.totalAssets)} icon={Building2} color="text-teal-400" />
              <StatCard label="Total Deposits" value={formatCurrency(stats.totalDeposits)} icon={CreditCard} color="text-green-400" />
              <StatCard label="Total Withdrawals" value={formatCurrency(stats.totalWithdrawals)} icon={ArrowDownLeft} color="text-red-400" />
              <StatCard label="Available Balance" value={formatCurrency(stats.totalAvailableBalance)} icon={Coins} color="text-indigo-400" />
              <StatCard label="Investment Balance" value={formatCurrency(stats.totalInvested)} icon={Coins} color="text-purple-400" />
              <StatCard label="Active Investments" value={stats.activeNodes.toString()} icon={Zap} color="text-aura-lime" onClick={() => setInvestmentPreviewType('active')} />
              <StatCard label="Inactive Investments" value={stats.inactiveNodes.toString()} icon={Zap} color="text-gray-500" onClick={() => setInvestmentPreviewType('inactive')} />
              <StatCard label="ROI Generated" value={formatCurrency(stats.totalLiveRoiGenerated)} icon={TrendingUp} color="text-amber-400" />
              <StatCard label="Vault Security Alerts" value={stats.securityAlerts.toString()} icon={AlertTriangle} color={stats.securityAlerts > 0 ? "text-red-500" : "text-emerald-500"} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
               {/* LIVE PENDING FEED */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Activity size={18} className="text-aura-lime" /> Pending Protocols
                     </h3>
                     <span className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">{deposits.filter(d => d.status === 'pending').length + withdrawals.filter(w => w.status === 'pending').length} Actions Required</span>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                     {[...deposits, ...withdrawals]
                        .filter(x => x.status === 'pending')
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item: any) => (
                           <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:border-aura-lime/20 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    item.method ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                                 )}>
                                    {item.method ? <CreditCard size={18} /> : <ArrowDownLeft size={18} />}
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-white uppercase">{item.user_name || 'Anonymous'}</p>
                                    <p className="text-[9px] text-aura-muted uppercase tracking-widest font-bold">
                                       {item.method ? 'Incoming Dep.' : 'Outgoing Wit.'} • {item.method || item.details?.method || 'Direct'}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black font-serif italic text-white">{formatCurrency(item.amount)}</p>
                                 <button 
                                    onClick={() => handleTabChange(item.method ? 'cdeposits' : 'cwithdrawals')}
                                    className="text-[8px] font-black uppercase tracking-widest text-aura-lime hover:underline"
                                 >Review Audit</button>
                              </div>
                           </div>
                        ))}
                     {deposits.filter(d => d.status === 'pending').length === 0 && withdrawals.filter(w => w.status === 'pending').length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                           <ShieldCheck size={32} className="mx-auto text-white/10 mb-2" />
                           <p className="text-[10px] font-black uppercase text-aura-muted tracking-widest">No pending settlements detected.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* MASTER TRANSACTION FEED */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <History size={18} className="text-aura-lime" /> Real-time Feed
                     </h3>
                     <span className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">Global Sequence Alpha</span>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                     {transactions.map((tx, idx) => (
                        <div key={`${tx.id}-${idx}`} className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="text-[8px] font-mono text-aura-muted">#{tx.id?.substring(0, 6)}</div>
                              <div>
                                 <p className="text-[10px] font-bold text-white uppercase">{tx.type?.replace(/_/g, ' ')}</p>
                                 <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest truncate max-w-[150px]">{tx.description || '-'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-white">{formatCurrency(tx.amount)}</p>
                              <p className="text-[7px] text-aura-muted uppercase font-black">{new Date(tx.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* NETWORK PORTFOLIOS (USER QUICK LIST) */}
               <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Users size={18} className="text-aura-lime" /> Network Identities
                     </h3>
                     <button onClick={() => handleTabChange('cuser')} className="text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline">View Mapping</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {users.slice(0, 6).map(u => (
                        <div key={u.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-aura-lime/30 transition-all" onClick={() => { setSelectedUser(u); setActiveTab('cuser'); setIsDetailView(true); }}>
                           <div className="flex items-center gap-4">
                              {u.photoURL ? (
                                 <img src={u.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover" />
                              ) : (
                                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-aura-lime font-black text-xs">{u.name?.[0]}</div>
                              )}
                              <div>
                                 <p className="text-xs font-black uppercase truncate max-w-[120px]">{u.name}</p>
                                 <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">{formatCurrency(u.available_balance || 0)} Liquid</p>
                              </div>
                           </div>
                           <ChevronRight size={14} className="text-aura-muted group-hover:text-aura-lime transition-all" />
                        </div>
                     ))}
                  </div>
               </div>

               {/* RECENT NODE INVESTMENTS */}
               <div className="space-y-6">
                  {/* INVESTMENT PLAN ACTIVITY TRACKING */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                     <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                           <Activity size={16} className="text-aura-lime" /> Plan Activity Allocation
                        </h3>
                        <span className="text-[8px] font-bold text-aura-muted uppercase tracking-widest">Real-time</span>
                     </div>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Regular Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activeRegularCount} Active</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Premium Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activePremiumCount} Active</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Elite Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activeEliteCount} Active</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Zap size={18} className="text-aura-lime" /> Active Nodes
                     </h3>
                     <button onClick={() => handleTabChange('cinvestments')} className="text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline">Sync All</button>
                  </div>
                  <div className="space-y-3">
                     {investments
                        .filter(i => i.status === 'active')
                        .slice(0, 5)
                        .map(inv => (
                        <div key={inv.id} className="p-4 bg-aura-lime/5 border border-aura-lime/10 rounded-2xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <bot className="w-8 h-8 rounded-lg bg-aura-lime flex items-center justify-center text-aura-black"><Zap size={14} /></bot>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-white truncate max-w-[100px]">{inv.user_name || 'Anon'}</p>
                                 <p className="text-[8px] text-aura-lime font-black uppercase tracking-widest">{inv.plan_name}</p>
                              </div>
                           </div>
                           <p className="text-xs font-black text-white italic font-serif">{formatCurrency(inv.amount)}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'cdeposits' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setDepositFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     depositFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {deposits
                    .filter((dep: any) => {
                      if (depositFilter === 'all') return true;
                      if (depositFilter === 'pending') return dep.status === 'pending';
                      if (depositFilter === 'approved') return dep.status === 'approved';
                      if (depositFilter === 'rejected') return dep.status === 'declined' || dep.status === 'rejected';
                      return true;
                    })
                    .map((dep: any) => {
                      const u = getUserDetails(dep.user_id, dep.user_name);
                      return (
                        <tr 
                          key={dep.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(dep); setTicketType('deposit'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(dep.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Deposit</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                              dep.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                              dep.status === 'approved' ? "bg-aura-lime/10 text-aura-lime" : "bg-red-400/10 text-red-100"
                            )}>{dep.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {dep.created_at ? new Date(dep.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs uppercase font-black tracking-wider text-aura-muted">{dep.method || 'Standard'}</td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {dep.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => declineDeposit(dep.id)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all" title="Decline"><XCircle size={16} /></button>
                                <button onClick={() => approveDeposit(dep)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-aura-lime hover:text-aura-black rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cwithdrawals' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setWithdrawalFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     withdrawalFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan Details</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {withdrawals
                    .filter((wit: any) => {
                      if (withdrawalFilter === 'all') return true;
                      if (withdrawalFilter === 'pending') return wit.status === 'pending';
                      if (withdrawalFilter === 'approved') return wit.status === 'approved';
                      if (withdrawalFilter === 'rejected') return wit.status === 'declined' || wit.status === 'rejected';
                      return true;
                    })
                    .map((wit: any) => {
                      const u = getUserDetails(wit.user_id, wit.user_name);
                      return (
                        <tr 
                          key={wit.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(wit); setTicketType('withdrawal'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(wit.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Withdrawal</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                              wit.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                              wit.status === 'approved' ? "bg-aura-lime/10 text-aura-lime" : "bg-red-400/10 text-red-100"
                            )}>{wit.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {wit.created_at ? new Date(wit.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs" onClick={(e) => e.stopPropagation()}>
                            {wit.method === 'bank' ? (
                              <div className="space-y-1 py-1 max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black bg-blue-400/10 text-blue-400 border border-blue-400/15 px-1.5 py-0.5 rounded-md">Fiat</span>
                                  <span className="font-bold uppercase text-[10px]">{wit.details?.bankName || 'Bank'}</span>
                                </div>
                                <div className="text-[10px] text-aura-muted flex items-center gap-1.5 font-mono">
                                  <span>{wit.details?.accNum || 'N/A'}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(wit.details?.accNum || '');
                                      toast.success("Account copied");
                                    }}
                                    className="hover:text-aura-lime text-gray-500 hover:scale-105 transition-all"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                                <div className="text-[9px] text-gray-500 italic max-w-[200px] truncate">{wit.details?.accName || 'N/A'}</div>
                              </div>
                            ) : (
                              <div className="space-y-1 py-1 max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black bg-purple-400/10 text-purple-400 border border-purple-400/15 px-1.5 py-0.5 rounded-md">Cyber</span>
                                  <span className="font-bold uppercase text-[10px]">{wit.details?.type?.toUpperCase() || 'USDT'}</span>
                                </div>
                                <div className="text-[10px] text-aura-muted flex items-center gap-1.5 font-mono animate-fade-in">
                                  <span className="truncate max-w-[124px]" title={wit.details?.address}>{wit.details?.address || 'N/A'}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(wit.details?.address || '');
                                      toast.success("Address copied");
                                    }}
                                    className="hover:text-aura-lime text-gray-500 hover:scale-105 transition-all"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {wit.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => declineWithdrawal(wit)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all" title="Decline"><XCircle size={16} /></button>
                                <button onClick={() => approveWithdrawal(wit)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-aura-lime hover:text-aura-black rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cinvestments' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setInvestFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     investFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {investments
                    .filter(inv => {
                      if (investFilter === 'all') return true;
                      if (investFilter === 'pending') return inv.status === 'pending';
                      if (investFilter === 'approved') return inv.status === 'inactive' || inv.status === 'active' || inv.status === 'completed';
                      if (investFilter === 'rejected') return inv.status === 'rejected';
                      return true;
                    })
                    .map((inv: any) => {
                      const u = getUserDetails(inv.user_id, inv.user_name);
                      return (
                        <tr 
                          key={inv.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(inv); setTicketType('investment'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(inv.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-aura-lime uppercase tracking-widest">Investment</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                               inv.status === 'active' ? "bg-aura-lime/10 text-aura-lime" : 
                               inv.status === 'inactive' ? "bg-blue-400/10 text-blue-400" :
                               inv.status === 'rejected' ? "bg-red-400/10 text-red-400" :
                               "bg-white/10 text-aura-muted"
                            )}>{inv.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {inv.created_at ? new Date(inv.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs uppercase font-black tracking-wider text-aura-lime">
                            {inv.plan_name || 'Regular'} Node
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-4 justify-end">
                              {inv.status === 'pending' && (
                                <>
                                  <button onClick={() => rejectInvestment(inv.id)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline">Reject</button>
                                  <button onClick={() => approveInvestment(inv)} className="text-[10px] font-black uppercase tracking-widest text-aura-lime hover:underline">Approve</button>
                                </>
                              )}
                              {(inv.status === 'active' || inv.status === 'inactive') && (
                                 <button onClick={() => stopInvestment(inv)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline">Stop</button>
                              )}
                              {inv.status === 'completed' && (
                                <span className="text-[10px] text-gray-500 uppercase font-black">Completed</span>
                              )}
                              {inv.status === 'rejected' && (
                                <span className="text-[10px] text-red-500 uppercase font-black">Rejected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'cuser' || activeTab === 'cinactiveusers') && (
          <div className="space-y-8">
            {!isDetailView ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                   <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                      {['all', 'active', 'suspended', 'banned'].map((f) => (
                        <button 
                          key={f}
                          onClick={() => setUserFilter(f as any)}
                          className={cn(
                            "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                            userFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                   {activeTab === 'cinactiveusers' && (
                     <div className="text-[10px] font-black uppercase text-aura-lime bg-aura-lime/10 px-4 py-2 rounded-xl animate-pulse">
                        Filtering Inactive Nodes Only
                     </div>
                   )}
                   <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 w-full md:w-80">
                      <Search size={16} className="text-aura-muted" />
                      <input 
                        type="text" 
                        placeholder="Search Identity..." 
                        className="bg-transparent border-none outline-none text-[10px] font-bold tracking-widest uppercase text-white w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-aura-muted">Identity</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-aura-muted">Balances</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-aura-muted text-center">Nodes</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {users
                        .filter(u => {
                          const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                          if (activeTab === 'cinactiveusers') {
                             const hasActiveNodes = investments.some(i => i.user_id === u.id && i.status === 'active');
                             if (hasActiveNodes) return false;
                          }
                          if (userFilter === 'all') return matchesSearch;
                          if (userFilter === 'active') return matchesSearch && !u.suspended && !u.banned;
                          if (userFilter === 'suspended') return matchesSearch && u.suspended;
                          if (userFilter === 'banned') return matchesSearch && u.banned;
                          return matchesSearch;
                        })
                        .map((user: any) => (
                        <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { setSelectedUser(user); setIsDetailView(true); }}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              {user.photoURL ? (
                                <img src={user.photoURL} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-aura-lime">{user.name?.[0] || 'U'}</div>
                              )}
                              <div>
                                <p className="text-sm font-bold tracking-tight">{user.name}</p>
                                <p className="text-[9px] text-aura-muted font-bold uppercase tracking-widest">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black font-serif italic text-white">{formatCurrency(user.available_balance || 0)}</p>
                            <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">Total: {formatCurrency((user.available_balance || 0) + (user.funding_balance || 0))}</p>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-[10px] font-black text-aura-lime bg-aura-lime/10 px-3 py-1 rounded-full border border-aura-lime/20">
                              {investments.filter(i => i.user_id === user.id && i.status === 'active').length} Active
                            </span>
                          </td>
                          <td className="px-8 py-6">
                             {user.banned ? (
                               <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/10 text-red-500 rounded-full flex items-center gap-1 w-fit"><Ban size={10} /> Banned</span>
                             ) : user.suspended ? (
                               <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1 w-fit"><Pause size={10} /> Suspended</span>
                             ) : (
                               <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full flex items-center gap-1 w-fit"><ShieldCheck size={10} /> Verified</span>
                             )}
                          </td>
                          <td className="px-8 py-6 text-right text-aura-muted group-hover:text-aura-lime transition-all">
                             <ChevronRight size={16} className="inline" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // USER DETAIL PANEL
              <div className="space-y-8 pb-20">
                 <button onClick={() => setIsDetailView(false)} className="flex items-center gap-2 text-aura-muted hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <ArrowLeft size={14} /> Back to Registry
                 </button>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COL: Profile & Status */}
                    <div className="lg:col-span-1 space-y-6">
                       <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] text-center space-y-4">
                          <div className="relative inline-block mx-auto">
                             {selectedUser.photoURL ? (
                               <img src={selectedUser.photoURL} className="w-24 h-24 rounded-[32px] object-cover border-2 border-aura-lime shadow-2xl shadow-aura-lime/20" alt="" />
                             ) : (
                               <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center font-black text-3xl text-aura-lime">{selectedUser.name?.[0]}</div>
                             )}
                             <div className={cn(
                               "absolute -bottom-2 -right-2 p-2 rounded-full border-2 border-aura-black shadow-lg",
                               selectedUser.banned ? "bg-red-500" : selectedUser.suspended ? "bg-yellow-500" : "bg-aura-lime"
                             )}>
                               {selectedUser.banned ? <Ban size={14} className="text-white" /> : selectedUser.suspended ? <Pause size={14} className="text-white" /> : <ShieldCheck size={14} className="text-aura-black" />}
                             </div>
                          </div>
                          <div>
                             <h3 className="text-2xl font-black font-serif italic text-white">{selectedUser.name}</h3>
                             <p className="text-[10px] text-aura-muted font-bold uppercase tracking-[0.2em]">{selectedUser.email}</p>
                             <p className="text-[8px] text-aura-lime font-black uppercase tracking-widest mt-2">ID: {selectedUser.id}</p>
                          </div>

                          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-2">
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'suspended', !selectedUser.suspended)}
                               className={cn(
                                 "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                 selectedUser.suspended ? "bg-yellow-500 text-aura-black" : "bg-white/5 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10"
                               )}
                             >
                                <Pause size={12} /> {selectedUser.suspended ? 'Unsuspend' : 'Suspend'}
                             </button>
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'banned', !selectedUser.banned)}
                               className={cn(
                                 "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                 selectedUser.banned ? "bg-red-500 text-white" : "bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500/10"
                               )}
                             >
                                <Ban size={12} /> {selectedUser.banned ? 'Unban' : 'Ban Access'}
                             </button>
                          </div>
                          
                          <div className="space-y-2">
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'roi_disabled', !selectedUser.roi_disabled)}
                               className={cn(
                                 "flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                 selectedUser.roi_disabled ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                               )}
                             >
                                {selectedUser.roi_disabled ? <Play size={12} /> : <Pause size={12} />}
                                {selectedUser.roi_disabled ? 'Enable ROI Engine' : 'Disable ROI Engine'}
                             </button>
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => toggleUserStatus(selectedUser.id, 'withdrawals_frozen', !selectedUser.withdrawals_frozen)}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                    selectedUser.withdrawals_frozen ? "bg-orange-500 text-white border-orange-500" : "bg-white/5 text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                                  )}
                                >
                                   <Lock size={12} /> {selectedUser.withdrawals_frozen ? 'Unfreeze Payout' : 'Freeze Payout'}
                                </button>
                                <button 
                                  onClick={() => toggleUserStatus(selectedUser.id, 'transfers_frozen', !selectedUser.transfers_frozen)}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                    selectedUser.transfers_frozen ? "bg-purple-500 text-white border-purple-500" : "bg-white/5 text-purple-400 border-purple-400/20 hover:bg-purple-400/10"
                                  )}
                                >
                                   <RefreshCw size={12} /> {selectedUser.transfers_frozen ? 'Unfreeze Transfer' : 'Freeze Transfer'}
                                </button>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-2"><MapPin size={12} /> Geographic Metadata</h4>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/60">
                                <span>Country</span>
                                <span>{selectedUser.countryName || 'Global Access'}</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/60">
                                <span>Last Sync</span>
                                <span className="font-mono text-[9px]">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'N/A'}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* RIGHT COL: Financials & History */}
                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { field: 'available_balance', label: 'Available', value: selectedUser.available_balance || 0, icon: Wallet, color: 'text-secondary' },
                            { field: 'funding_balance', label: 'Funding', value: selectedUser.funding_balance || 0, icon: CreditCard, color: 'text-blue-400' },
                            { field: 'total_earnings', label: 'Total Earnings', value: selectedUser.total_earnings || 0, icon: TrendingUp, color: 'text-purple-400' },
                            { field: 'total_invested', label: 'Total Invested', value: selectedUser.total_invested || 0, icon: Zap, color: 'text-orange-400' },
                            { field: 'referral_earnings', label: 'Referrals', value: selectedUser.referral_earnings || 0, icon: UserPlus, color: 'text-aura-lime' },
                          ].map((item) => (
                             <div key={item.field} className="p-6 bg-white/5 border border-white/5 rounded-3xl group">
                                <div className="flex justify-between items-start mb-4">
                                   <item.icon size={18} className={item.color} />
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          const amt = prompt("Amount to ADD?");
                                          if (amt) updateUserBalance(selectedUser.id, item.field, parseFloat(amt), 'add');
                                        }}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-aura-lime"
                                      >+ ADD</button>
                                      <button 
                                        onClick={() => {
                                          const amt = prompt("Amount to SET?");
                                          if (amt) updateUserBalance(selectedUser.id, item.field, parseFloat(amt), 'set');
                                        }}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-white"
                                      >EDIT</button>
                                       <button 
                                        onClick={() => updateUserBalance(selectedUser.id, item.field, 0, 'set')}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-red-400"
                                      >RESET</button>
                                   </div>
                                </div>
                                <p className="text-3xl font-black font-serif italic mb-1">{formatCurrency(item.value)}</p>
                                <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">{item.label}</p>
                             </div>
                          ))}
                       </div>

                       <div className="space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2"><History size={16} className="text-aura-lime" /> Registry Logs</h3>
                          <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="border-b border-white/5">
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Event</th>
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Value</th>
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Timestamp</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                   {investments.filter(inv => inv.user_id === selectedUser.id).slice(0, 5).map((inv: any) => (
                                     <tr key={inv.id}>
                                       <td className="px-8 py-4">
                                          <p className="text-[10px] font-bold text-white uppercase">{inv.plan_name} Node Activated</p>
                                       </td>
                                       <td className="px-8 py-4">
                                          <p className="text-[10px] font-black text-aura-lime tracking-widest">{formatCurrency(inv.amount)}</p>
                                       </td>
                                       <td className="px-8 py-4 text-right">
                                          <p className="text-[10px] text-aura-muted font-bold font-mono uppercase italic">{new Date(inv.created_at).toLocaleDateString()}</p>
                                       </td>
                                     </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ctransactions' && (
          <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-aura-muted">
                      <th className="px-8 py-6">Operation</th>
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6 text-right">Value</th>
                      <th className="px-8 py-6 text-right">Sequence</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                   {transactions.map(tx => (
                     <tr key={tx.id} className="hover:bg-white/[0.01]">
                        <td className="px-8 py-6">
                           <p className="text-[10px] font-bold text-white uppercase">{tx.type?.replace(/_/g, ' ')}</p>
                           <p className="text-[8px] italic text-aura-muted">{tx.description || '-'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-mono text-aura-muted">{tx.user_id?.substring(0, 8)}...</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-sm font-black font-serif italic text-white">{formatCurrency(tx.amount)}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-[9px] font-bold text-aura-muted uppercase">{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'just now'}</p>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'csettings' && (
          <div className="max-w-4xl space-y-12">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime mb-6 flex items-center gap-2">
                <Shield size={16} /> Security Architecture
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-aura-lime/10 rounded-2xl text-aura-lime"><Lock size={24} /></div>
                       <div>
                          <h4 className="text-sm font-black uppercase">Terminus Session</h4>
                          <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">Active root session: {profile?.name || 'Cipher'}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Auth Level</span>
                          <span className="text-white">Admin Alpha</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Encryption</span>
                          <span className="text-white">AES-256-GCM</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Last Handshake</span>
                          <span className="font-mono text-white">{new Date().toLocaleTimeString()}</span>
                       </div>
                    </div>

                    <button 
                      onClick={async () => { await logout(); navigate('/welcome'); }}
                      className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                       <LogOut size={16} /> Terminate All Sessions
                    </button>
                 </div>

                 <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ShieldCheck size={24} /></div>
                       <div>
                          <h4 className="text-sm font-black uppercase">MFA & Access</h4>
                          <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">System multi-factor settings</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">2FA Status</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 text-aura-muted rounded">Coming Soon</span>
                       </div>
                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Audit Log</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-aura-lime/10 text-aura-lime rounded">Synced</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 <Building2 size={16} className="text-aura-lime" /> Financial Configuration
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">USD to NGN Exchange Rate</label>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                           <div className="absolute inset-y-0 left-6 flex items-center text-aura-lime font-bold">₦</div>
                           <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                              placeholder="1400"
                              className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-base font-bold outline-none focus:border-aura-lime/50 transition-all text-white"
                           />
                        </div>
                        <button 
                           onClick={() => updateExchangeRate(exchangeRate)}
                           className="px-8 py-4 bg-aura-lime text-aura-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                        >
                           Update Rate
                        </button>
                     </div>
                     <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest ml-2 italic underline underline-offset-4 decoration-aura-lime/30">Used globally for Bank Transfer calculations</p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 <Activity size={16} className="text-aura-lime" /> Terminal Integrity
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Latency', value: '14ms', status: 'Optimal' },
                    { label: 'Db Sync', value: 'Real-time', status: 'Healthy' },
                    { label: 'Uptime', value: '99.99%', status: 'Stable' },
                  ].map((s, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted mb-2">{s.label}</p>
                       <p className="text-2xl font-black font-serif italic mb-1">{s.value}</p>
                       <span className="text-[8px] font-black uppercase tracking-widest text-aura-lime">{s.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'cui_editor' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif">Deployment Studio</h3>
                     <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            await addDoc(collection(db, 'ui_versions'), {
                              config: uiConfig,
                              timestamp: new Date(),
                              author: profile?.email,
                              description: 'Snapshot'
                            });
                            toast.success("State Sequenced");
                          }}
                          className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                        >
                          Snapshot
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'settings', 'ui_config'), uiConfig);
                              toast.success("UI Pipeline Re-synchronized. Changes Live.");
                            } catch (err) {
                              toast.error("Deployment Interrupted");
                            }
                          }}
                          className="px-6 py-2 bg-aura-lime text-aura-black text-[10px] font-black uppercase tracking-widest rounded-xl brutalist-shadow"
                        >
                          Deploy Live
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Global UI Parameters</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase text-white/40">Primary Color (Hex)</label>
                           <input 
                             type="text" 
                             value={uiConfig.primaryColor || '#a3e635'} 
                             onChange={(e) => setUiConfig({...uiConfig, primaryColor: e.target.value})}
                             className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase text-white/40">Platform Title</label>
                           <input 
                             type="text" 
                             value={uiConfig.platformTitle || 'Tavari Wave'} 
                             onChange={(e) => setUiConfig({...uiConfig, platformTitle: e.target.value})}
                             className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-white/40">Annoucement Banner</label>
                        <textarea 
                          value={uiConfig.announcement || ''} 
                          onChange={(e) => setUiConfig({...uiConfig, announcement: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm h-32"
                          placeholder="Welcome to the future of institutional trading..."
                        />
                     </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime">Version Topology</h3>
                   <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                      {uiVersions.length === 0 ? (
                        <div className="text-center py-10 text-aura-muted text-[10px] font-bold uppercase tracking-widest">No previous versions detected</div>
                      ) : (
                        uiVersions.map((v, i) => (
                          <div key={v.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 group hover:border-aura-lime/30 transition-all">
                             <div className="flex justify-between items-start">
                                <span className="text-[8px] font-black uppercase tracking-widest text-aura-muted">V_{uiVersions.length - i}</span>
                                <span className="text-[8px] font-mono text-white/40">{new Date(v.timestamp.seconds * 1000).toLocaleString()}</span>
                             </div>
                             <p className="text-[10px] text-white font-bold uppercase tracking-tight line-clamp-1">{v.description || 'System Update'}</p>
                             <button 
                               onClick={async () => {
                                 if (confirm("Restore this UI configuration state? Current state will be backed up.")) {
                                    await addDoc(collection(db, 'ui_versions'), {
                                      config: uiConfig,
                                      timestamp: new Date(),
                                      description: `Pre-rollback to V_${uiVersions.length - i}`
                                    });
                                    await setDoc(doc(db, 'settings', 'ui_config'), v.config);
                                    toast.success("UI Rollback Successful");
                                 }
                               }}
                               className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-aura-lime transition-all"
                             >
                               Rollback to this state
                             </button>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cplans' && (
           <CipherPlansEditor plans={plans} />
        )}

        {activeTab === 'cnotifications' && (
          <div className="space-y-8 text-white">
            {/* Header & Status bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                  Cipher Alert Network Protocols
                </span>
                <h2 className="text-3xl font-black font-serif italic mt-2">Broadcast Control Center</h2>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-mono text-aura-muted uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  Connected Node Directory: {users.length} Clients
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: COMPOSER (lg:col-span-5) */}
              <div className="lg:col-span-[5] bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime flex items-center gap-2 mb-1">
                    <Mail size={16} /> Broadcast Composer
                  </h3>
                  <p className="text-[9px] text-aura-muted uppercase tracking-wider">Configure dispatch parameters for client terminal display notifications.</p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block">Message Title</label>
                    <input 
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Security Update Node Activation"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-lime/40 outline-none transition-all placeholder:text-white/20 font-bold"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block">Message Body Details</label>
                    <textarea 
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Enter specific broadcast statement here..."
                      rows={5}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-lime/40 outline-none transition-all placeholder:text-white/20 font-medium"
                    />
                  </div>

                  {/* Targeting Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block mb-2">Recipient Scope Targeting</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: 'Send to All', desc: 'Deliver broadcast instantly to every user.', count: users.length },
                        { id: 'selected', label: `Send to Selected`, desc: 'Target specifically ticked accounts.', count: selectedUserIds.length },
                        { id: 'inactive', label: 'Send to Inactive', desc: 'Target clients without active nodes.', count: users.filter(u => !investments.some(i => i.user_id === u.id && i.status === 'active')).length },
                        { id: 'inactive_investors', label: 'Inactive Investors', desc: 'Exclude users with running nodes.', count: users.filter(u => {
                          const hasActiveNodes = investments.some(i => i.user_id === u.id && i.status === 'active');
                          const hasAnyNodes = investments.some(i => i.user_id === u.id);
                          return !hasActiveNodes && hasAnyNodes;
                        }).length }
                      ].map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setNotifTarget(scope.id as any)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 min-h-[100px]",
                            notifTarget === scope.id 
                              ? "bg-aura-lime/10 border-aura-lime text-white" 
                              : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10"
                          )}
                        >
                          <div>
                            <p className={cn("text-xs font-black uppercase tracking-wider", notifTarget === scope.id ? "text-aura-lime" : "text-white")}>
                              {scope.label}
                            </p>
                            <p className="text-[8px] text-gray-500 mt-1 leading-normal uppercase">{scope.desc}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold mt-2 self-end px-2 py-0.5 bg-white/5 rounded">
                            {scope.count} target{scope.count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={sendNotifications}
                    disabled={isSendingNotif}
                    className="w-full py-4 bg-aura-lime hover:bg-aura-lime/90 disabled:bg-white/5 text-black disabled:text-aura-muted font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSendingNotif ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} /> Dispersing Alerts...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" /> Dispatch Protocol Message
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: RECIPIENT LIST TARGETING (lg:col-span-12 items direction) */}
              <div className="lg:col-span-[7] bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6 flex flex-col h-[700px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime flex items-center gap-2 mb-1">
                      <Search size={16} /> Audience Directory Filters
                    </h3>
                    <p className="text-[9px] text-aura-muted uppercase tracking-wider">Browse, filter, and manually select clients for custom target alert dispatches.</p>
                  </div>
                  {/* Bulk Select all displayed */}
                  <button 
                    onClick={() => {
                      // Get all currently visible matching users
                      const visibleUsers = users.filter(u => {
                        const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                        const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                        const totalNodesCount = investments.filter(i => i.user_id === u.id).length;
                        
                        if (notifUserFilter === 'inactive') {
                          if (activeNodesCount > 0) return false;
                        } else if (notifUserFilter === 'inactive_investors') {
                          if (activeNodesCount > 0 || totalNodesCount === 0) return false;
                        }
                        return matchesSearch;
                      });
                      
                      const visibleIds = visibleUsers.map(u => u.id);
                      const allSelected = visibleIds.every(id => selectedUserIds.includes(id));
                      if (allSelected) {
                        // De-select Visible
                        setSelectedUserIds(selectedUserIds.filter(id => !visibleIds.includes(id)));
                      } else {
                        // Select Visible
                        setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...visibleIds])));
                      }
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-aura-lime bg-aura-lime/5 px-3 py-1.5 rounded-lg border border-aura-lime/10 hover:bg-aura-lime hover:text-black transition-all"
                  >
                    Toggle Select All Filtered
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Category toggle tabs */}
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    {[
                      { id: 'all', label: 'All Users' },
                      { id: 'inactive', label: 'Inactive Users' },
                      { id: 'inactive_investors', label: 'Inactive Investors' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNotifUserFilter(tab.id as any)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          notifUserFilter === tab.id ? "bg-aura-lime text-black" : "text-aura-muted hover:text-white"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search filter input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <input 
                      type="text"
                      placeholder="Search by name, email, or id..."
                      value={notifSearchTerm}
                      onChange={(e) => setNotifSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-white/10 placeholder:text-white/20 font-bold"
                    />
                  </div>
                </div>

                {/* Directory list scroll screen */}
                <div className="flex-1 overflow-y-auto pr-2 divide-y divide-white/5 scrollbar-none space-y-2">
                  {users
                    .filter(u => {
                      const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                      const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                      const totalNodesCount = investments.filter(i => i.user_id === u.id).length;
                      
                      if (notifUserFilter === 'inactive') {
                        if (activeNodesCount > 0) return false;
                      } else if (notifUserFilter === 'inactive_investors') {
                        if (activeNodesCount > 0 || totalNodesCount === 0) return false;
                      }
                      return matchesSearch;
                    })
                    .map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                      const totalNodesCount = investments.filter(i => i.user_id === u.id).length;

                      return (
                        <div 
                          key={u.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, u.id]);
                            }
                          }}
                          className={cn(
                            "py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 border",
                            isSelected 
                              ? "bg-aura-lime/[0.03] border-aura-lime/20" 
                              : "border-transparent hover:bg-white/[0.01]"
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Checkbox */}
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // toggled by outer parent click helper
                              className="w-3.5 h-3.5 accent-aura-lime cursor-pointer bg-white/10"
                            />
                            {/* Avatar */}
                            <div className="w-9 h-9 font-black text-xs text-black bg-aura-lime rounded-lg flex items-center justify-center shrink-0 uppercase w-9 h-9">
                              {u.name?.[0] || 'U'}
                            </div>
                            
                            {/* Details layout */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-white truncate max-w-[120px] block" title={u.name}>{u.name || 'Anonymous client'}</span>
                                <span className="text-[8px] font-mono text-aura-muted shrink-0">@{u.username || 'no_uname'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[8px] text-gray-400 font-mono">
                                <span className="truncate max-w-[100px]" title={u?.id}>ID: {u.id}</span>
                                <span className="hidden sm:inline text-gray-600">|</span>
                                <span className="truncate max-w-[150px]" title={u?.email}>{u.email || 'no-email'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Node Investment Status tracking */}
                          <div className="text-right shrink-0 pl-2">
                            {activeNodesCount > 0 ? (
                              <div className="text-[9px] font-black uppercase tracking-wider text-aura-lime bg-aura-lime/10 px-2.5 py-1 rounded">
                                {activeNodesCount} Running Node{activeNodesCount !== 1 ? 's' : ''}
                              </div>
                            ) : (
                              <div className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-400/10 px-2.5 py-1 rounded">
                                Inactive User
                              </div>
                            )}
                            <div className="text-[7px] text-aura-muted uppercase tracking-widest font-black mt-1">
                              History Nodes: {totalNodesCount}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {users.filter(u => {
                    const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                    const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                    const totalNodesCount = investments.filter(i => i.user_id === u.id).length;
                    
                    if (notifUserFilter === 'inactive') {
                      if (activeNodesCount > 0) return false;
                    } else if (notifUserFilter === 'inactive_investors') {
                      if (activeNodesCount > 0 || totalNodesCount === 0) return false;
                    }
                    return matchesSearch;
                  }).length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-[10px] uppercase font-black tracking-widest text-aura-muted">No Clients Found matching Filter Parameters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'csecurity' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-aura-lime" /> Protocol Integrity
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Platform Encryption', value: 'AES-256', status: 'ACTIVE' },
                    { label: 'Access Control', value: 'RBAC_LEVEL_4', status: 'ACTIVE' },
                    { label: 'Threat Monitoring', value: 'ML_ANOMALY', status: 'ACTIVE' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">{p.label}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-aura-muted">{p.value}</p>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-aura-lime px-2 py-1 bg-aura-lime/10 rounded">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col justify-center text-center space-y-4">
                <Shield size={48} className="mx-auto text-aura-lime animate-pulse" />
                <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif tracking-tighter">Security Handshake</h3>
                <p className="text-aura-muted text-[10px] uppercase font-bold tracking-widest max-w-xs mx-auto leading-relaxed">
                  The terminal is currently operating under institutional security parameters. All attempts at invalid access are logged and blocked automatically.
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black">{stats.securityAlerts}</p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase">Active Alerts</p>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div className="text-center">
                    <p className="text-xl font-black text-aura-lime">99.9%</p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase">Prevention Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">System-Wide Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Event Descriptor</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Subject ID</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Z-Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {securityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-aura-muted text-[10px] font-bold uppercase tracking-widest">No audit signals detected in current window</td>
                      </tr>
                    ) : (
                      securityLogs.map(log => (
                        <tr key={log.id} className="group hover:bg-white/[0.01]">
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-white uppercase">{log.action?.replace(/_/g, ' ')}</p>
                            <p className="text-[8px] font-bold text-aura-muted uppercase truncate max-w-[200px]">Device: {log.deviceId?.substring(0, 12)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[9px] font-mono text-aura-muted truncate">{log.user_id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                              log.action?.includes('failed') ? "bg-red-500/10 text-red-400" :
                              log.action?.includes('mfa') ? "bg-blue-500/10 text-blue-400" : "bg-aura-lime/10 text-aura-lime"
                            )}>
                              {log.action?.includes('failed') ? 'DENIED' : 'AUTHORIZED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-[9px] text-aura-muted font-bold font-mono uppercase italic">
                              {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'now'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cnewsletter' && (
          <div className="space-y-12">
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif">Newsletter Subscribers</h3>
                  <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-1">
                    Showing {subscribers.length} total subscribers registered to the network
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email Address</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Subscription Z-Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-12 text-center text-aura-muted text-[10px] font-bold uppercase tracking-widest">
                          No newsletter subscribers loaded on this node
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((sub, index) => (
                        <tr key={sub.id || index} className="group hover:bg-white/[0.01]">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-white font-sans">{sub.email}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-[10px] text-aura-muted font-bold font-mono uppercase italic">
                              {sub.created_at ? new Date(sub.created_at.seconds ? sub.created_at.seconds * 1000 : sub.created_at).toLocaleString() : 'just now'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CIPHER TICKET OVERLAY DETAILED RECEIPT */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020202]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[40px] w-full max-w-2xl p-8 space-y-8 relative my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-6 right-6 p-2 text-aura-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                    Cipher Secure Protocol
                  </span>
                  <span className="text-[10px] font-mono text-aura-muted">
                    ID: {selectedTicket.id?.substring(0, 16)}...
                  </span>
                </div>
                <h3 className="text-2xl font-black font-serif italic text-white capitalize">
                  {ticketType} Ticket
                </h3>
              </div>

              {/* Split Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                {/* Left Column: Transaction Metadata */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted border-b border-white/5 pb-2">
                    Transaction Specification
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Reference:</span>
                      <span className="font-mono text-white text-xs">{selectedTicket.reference || selectedTicket.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Amount:</span>
                      <span className="text-lg font-black text-white font-serif italic">
                        {formatCurrency(selectedTicket.amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Status:</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded",
                        selectedTicket.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                        selectedTicket.status === 'approved' || selectedTicket.status === 'active' ? "bg-aura-lime/10 text-aura-lime" :
                        "bg-red-400/10 text-red-500"
                      )}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Timestamp:</span>
                      <span className="text-white text-xs">
                        {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {/* Sub-details depending on method/type */}
                    {ticketType === 'investment' && (
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-aura-muted uppercase font-bold text-[10px]">Investment Plan:</span>
                        <span className="text-aura-lime uppercase font-black tracking-widest text-[10px]">
                          {selectedTicket.plan_name || 'Regular'} Node
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Settlement specifications for withdrawals or deposits */}
                  {ticketType === 'withdrawal' && (
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 mt-4 text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted">Destination Details</p>
                      {selectedTicket.method === 'bank' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Bank Name:</span>
                            <span className="text-white font-bold">{selectedTicket.details?.bankName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Account Number:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-mono">{selectedTicket.details?.accNum || 'N/A'}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.details?.accNum || '');
                                  toast.success("Account copied");
                                }}
                                className="text-aura-lime hover:text-white"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Holder Name:</span>
                            <span className="text-white">{selectedTicket.details?.accName || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Network Protocol:</span>
                            <span className="text-white font-bold">{selectedTicket.details?.type?.toUpperCase() || 'USDT'}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Wallet Location:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-mono text-[9px] truncate max-w-[140px] block" title={selectedTicket.details?.address}>{selectedTicket.details?.address || 'N/A'}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.details?.address || '');
                                  toast.success("Address copied");
                                }}
                                className="text-aura-lime hover:text-white"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: User Profile Identification */}
                {(() => {
                  const matchedUser = users.find(u => u.id === selectedTicket.user_id);
                  return (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted border-b border-white/5 pb-2">
                        User Identification Credentials
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">User Account ID:</span>
                          <span className="font-mono text-white text-[10px] truncate max-w-[140px] block" title={selectedTicket.user_id}>
                            {selectedTicket.user_id || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Full Name:</span>
                          <span className="text-white font-bold uppercase text-xs">{matchedUser?.name || selectedTicket.user_name || 'Anonymous User'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Email Address:</span>
                          <span className="text-white text-xs truncate max-w-[150px] block" title={matchedUser?.email}>{matchedUser?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Geographic Origin:</span>
                          <span className="text-white font-bold text-xs uppercase">{matchedUser?.countryName || matchedUser?.country || 'Global/Undefined'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Available Balance:</span>
                          <span className="text-aura-lime font-mono font-bold text-xs">
                            {formatCurrency(matchedUser?.available_balance || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Investment Value:</span>
                          <span className="text-cyan-400 font-mono font-bold text-xs">
                            {formatCurrency(matchedUser?.total_invested || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Controls / Actions */}
              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-end">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                >
                  Close Verification Panel
                </button>
                
                {selectedTicket.status === 'pending' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (ticketType === 'deposit') declineDeposit(selectedTicket.id);
                        if (ticketType === 'withdrawal') declineWithdrawal(selectedTicket);
                        if (ticketType === 'investment') rejectInvestment(selectedTicket.id);
                        setSelectedTicket(null);
                      }}
                      className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all border border-red-500/20"
                    >
                      Decline/Reject
                    </button>
                    <button 
                      onClick={() => {
                        if (ticketType === 'deposit') approveDeposit(selectedTicket);
                        if (ticketType === 'withdrawal') approveWithdrawal(selectedTicket);
                        if (ticketType === 'investment') approveInvestment(selectedTicket);
                        setSelectedTicket(null);
                      }}
                      className="px-6 py-3 bg-aura-lime text-aura-black hover:bg-aura-lime/95 rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                    >
                      Authorize & Approve
                    </button>
                  </div>
                )}

                {ticketType === 'investment' && (selectedTicket.status === 'active' || selectedTicket.status === 'inactive') ? (
                  <button 
                    onClick={() => {
                      stopInvestment(selectedTicket);
                      setSelectedTicket(null);
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                  >
                    Emergency Stop Investment Node
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVESTMENTS PREVIEW OVERLAY */}
      <AnimatePresence>
        {investmentPreviewType && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020202]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setInvestmentPreviewType(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[40px] w-full max-w-4xl p-8 space-y-8 relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setInvestmentPreviewType(null)}
                className="absolute top-6 right-6 p-2 text-aura-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                  Cipher Real-time Monitoring
                </span>
                <h3 className="text-2xl font-black font-serif italic text-white">
                  {investmentPreviewType === 'active' ? 'Active investments' : 'Inactive investments'} Preview List
                </h3>
              </div>

              {/* List Table */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[24px] overflow-hidden overflow-x-auto min-h-[200px] max-h-[450px]">
                <table className="w-full text-left min-w-[700px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name / Username</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Investment Plan</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02] text-white">
                    {(investmentPreviewType === 'active' 
                      ? investments.filter((i: any) => i.status === 'active')
                      : investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected')
                    ).map((inv: any) => {
                      const u = getUserDetails(inv.user_id, inv.user_name);
                      const matchedUser = users.find(x => x.id === inv.user_id);
                      return (
                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[100px] block font-mono font-bold" title={inv.user_id}>{inv.user_id}</span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-xs font-bold uppercase">{u.name}</div>
                            <div className="text-[9px] text-gray-500 font-mono">@{matchedUser?.username || 'no_uname'}</div>
                          </td>
                          <td className="px-6 py-3 text-xs text-aura-muted font-mono">{matchedUser?.email || u.email}</td>
                          <td className="px-6 py-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-aura-lime bg-aura-lime/5 px-2 py-0.5 rounded border border-aura-lime/10">
                              {inv.plan_name || 'Regular'} Node
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm font-black font-serif italic text-white/90">
                            {formatCurrency(inv.amount || 0)}
                          </td>
                          <td className="px-6 py-3">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded", 
                              inv.status === 'active' ? "bg-aura-lime/10 text-aura-lime" : 
                              inv.status === 'inactive' ? "bg-blue-400/10 text-blue-400" :
                              inv.status === 'completed' ? "bg-green-400/10 text-green-400" :
                              "bg-red-400/10 text-red-500"
                            )}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(investmentPreviewType === 'active' 
                      ? investments.filter((i: any) => i.status === 'active').length 
                      : investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected').length
                    ) === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center px-6 py-12 text-xs font-bold uppercase tracking-widest text-aura-muted">
                          No {investmentPreviewType} investments detected in real-time sync.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button 
                  onClick={() => setInvestmentPreviewType(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                >
                  Close Monitor Panel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CipherPlansEditorProps {
  plans: any[];
}

export function CipherPlansEditor({ plans }: CipherPlansEditorProps) {
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (plans && plans.length > 0) {
      setLocalPlans(plans.map(p => ({
        ...p,
        roiPercent: (p.roi * 100).toString(),
        minStr: p.min.toString(),
        maxStr: p.max.toString(),
        minWithdrawalStr: (p.minWithdrawal || 0).toString(),
        durationStr: (p.duration || 1).toString()
      })));
    }
  }, [plans]);

  const handleChangeField = (id: string, field: string, value: any) => {
    setLocalPlans(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSavePlan = async (id: string) => {
    const plan = localPlans.find(p => p.id === id);
    if (!plan) return;

    setLoadingId(id);
    try {
      const roiNum = parseFloat(plan.roiPercent) / 100;
      const minNum = parseFloat(plan.minStr);
      const maxNum = parseFloat(plan.maxStr);
      const durationNum = parseInt(plan.durationStr) || 1;
      const minWithdrawalNum = parseFloat(plan.minWithdrawalStr) || 0;

      if (isNaN(roiNum) || isNaN(minNum) || isNaN(maxNum)) {
        toast.error("Please provide valid numeric fields.");
        return;
      }

      const docRef = doc(db, 'investment_plans', id);
      const updatePayload = {
        name: plan.name,
        description: plan.description || '',
        roi: roiNum,
        min: minNum,
        max: maxNum,
        duration: durationNum,
        minWithdrawal: minWithdrawalNum,
        active_status: plan.active_status !== false,
        card_background: plan.card_background || '',
        card_border: plan.card_border || '',
        accent_color: plan.accent_color || '',
        updated_at: new Date().toISOString()
      };

      await setDoc(docRef, updatePayload, { merge: true });
      toast.success(`${plan.name} configuration saved successfully!`);
      
      await logAudit('update_investment_plan', `Updated ${plan.name} (ROI: ${plan.roiPercent}%, min: ${minNum}, max: ${maxNum})`);
    } catch (err: any) {
      toast.error(`Error saving plan: ${err?.message || err}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm("Initialize or recover factory fallback investment plans? This resets all changes.")) return;
    setResetting(true);
    try {
      const DEFAULT_PLANS = [
        {
          id: 'regular',
          name: 'Regular',
          min: 10,
          max: 40000,
          roi: 0.025,
          minWithdrawal: 3,
          description: 'Stable entry-level investment plan.',
          color: 'text-blue-400',
          accentColor: '#3B82F6',
          borderColor: 'border-blue-500/20',
          bgColor: 'bg-[#0f172a]',
          buttonColor: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
          gradient: 'from-blue-500/20 to-indigo-500/10',
          duration: 1,
          active_status: true
        },
        {
          id: 'premium',
          name: 'Premium',
          min: 50000,
          max: 900000,
          roi: 0.027,
          minWithdrawal: 15000,
          description: 'Advanced plan for high-volume investors.',
          color: 'text-emerald-400',
          accentColor: '#10B981',
          borderColor: 'border-emerald-500/20',
          bgColor: 'bg-[#064e3b]/20',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700',
          gradient: 'from-emerald-500/20 to-teal-500/10',
          duration: 3,
          active_status: true
        },
        {
          id: 'elite',
          name: 'Elite',
          min: 1000000,
          max: 10000000,
          roi: 0.029,
          minWithdrawal: 30000,
          description: 'Institutional-grade investment plan.',
          color: 'text-amber-400',
          accentColor: '#F59E0B',
          borderColor: 'border-amber-500/20',
          bgColor: 'bg-[#4c1d95]/20',
          buttonColor: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
          gradient: 'from-amber-500/20 to-purple-500/20',
          duration: 7,
          active_status: true
        }
      ];

      for (const plan of DEFAULT_PLANS) {
        const docRef = doc(db, 'investment_plans', plan.id);
        await setDoc(docRef, {
          ...plan,
          updated_at: new Date().toISOString()
        });
      }
      toast.success("Default plans mounted and synchronized successfully!");
    } catch (err: any) {
      toast.error(`Restore failed: ${err?.message || err}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
            Cipher ROI Index Protocols
          </span>
          <h2 className="text-3xl font-black font-serif italic mt-2">Yield Engine Controllers</h2>
        </div>
        <div>
          <button 
            disabled={resetting}
            onClick={handleInitializeDefaults}
            className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest border border-white/5 transition-all inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(resetting && "animate-spin")} />
            Reset Factory Defaults
          </button>
        </div>
      </div>

      {localPlans.length === 0 ? (
        <div className="p-16 text-center bg-white/[0.01] border border-white/5 rounded-[40px] space-y-4">
          <Zap size={32} className="mx-auto text-aura-muted animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-widest text-aura-muted">No Live Plans Initialized</h3>
          <p className="text-[10px] text-aura-muted uppercase tracking-wider max-w-xs mx-auto">Click "Reset Factory Defaults" above to quickly seed the standard Regular, Premium, and Elite tiers on Firestore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {localPlans.map((plan) => {
            const customCardStyle: React.CSSProperties = {};
            if (plan.card_background) customCardStyle.backgroundColor = plan.card_background;
            if (plan.card_border) customCardStyle.borderColor = plan.card_border;
            if (plan.accent_color) customCardStyle.boxShadow = `0 10px 40px -10px ${plan.accent_color}66`;

            return (
              <div 
                key={plan.id}
                className="bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-aura-lime animate-ping" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Tier Key: <span className="font-mono text-aura-lime font-bold">{plan.id}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-aura-muted font-bold">Active Status</label>
                    <button 
                      onClick={() => handleChangeField(plan.id, 'active_status', plan.active_status === false ? true : false)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all select-none border",
                        plan.active_status !== false 
                          ? "bg-aura-lime/10 border-aura-lime/30 text-aura-lime" 
                          : "bg-white/5 border-white/10 text-aura-muted"
                      )}
                    >
                      {plan.active_status !== false ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Tier Name</label>
                      <input 
                        type="text"
                        value={plan.name || ''}
                        onChange={(e) => handleChangeField(plan.id, 'name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Daily Yield % (e.g., 2.5)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={plan.roiPercent || ''}
                        onChange={(e) => handleChangeField(plan.id, 'roiPercent', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Minimum Deposit ($)</label>
                      <input 
                        type="number"
                        value={plan.minStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'minStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Maximum Deposit ($)</label>
                      <input 
                        type="number"
                        value={plan.maxStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'maxStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Duration Days (Cycles)</label>
                      <input 
                        type="number"
                        value={plan.durationStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'durationStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Minimum Withdrawal Limit ($)</label>
                      <input 
                        type="number"
                        value={plan.minWithdrawalStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'minWithdrawalStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Descriptive Bio</label>
                      <input 
                        type="text"
                        value={plan.description || ''}
                        onChange={(e) => handleChangeField(plan.id, 'description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-sans text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-2">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Card Background CSS/Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #0b0f19"
                            value={plan.card_background || ''}
                            onChange={(e) => handleChangeField(plan.id, 'card_background', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.card_background || '#000000' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Card Border CSS/Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #1e293b"
                            value={plan.card_border || ''}
                            onChange={(e) => handleChangeField(plan.id, 'card_border', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.card_border || '#000000' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Aura Glow Color Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #3b82f6"
                            value={plan.accent_color || ''}
                            onChange={(e) => handleChangeField(plan.id, 'accent_color', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.accent_color || '#000000' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col justify-between bg-black/40 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 blur-xl -z-0" style={{ background: plan.accent_color || '#3b82f6' }} />
                    
                    <div className="z-10 space-y-4">
                      <div>
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/10 text-white rounded-full font-bold">
                          Live UI Preview Aura
                        </span>
                        <p className="text-[8px] text-aura-muted mt-1 uppercase tracking-wider font-semibold">Simulates user card rendering parameters.</p>
                      </div>

                      <div 
                        className={cn(
                          "border rounded-3xl flex flex-col p-5 shadow-lg transition-all duration-300 relative overflow-hidden min-h-[220px] max-w-[240px] mx-auto",
                          !plan.card_border && "border-white/5",
                          !plan.card_background && "bg-[#090b10]"
                        )}
                        style={customCardStyle}
                      >
                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-black italic font-serif" style={plan.accent_color ? { color: plan.accent_color } : { color: '#ffffff' }}>
                              {plan.name || 'Tier Name'}
                            </h4>
                            <div 
                              className="inline-flex items-center justify-center p-1.5 rounded-lg"
                              style={{ backgroundColor: `${plan.accent_color || '#fff'}22`, border: `1px solid ${plan.accent_color || '#fff'}33` }}
                            >
                              <Zap size={10} className="text-white" />
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2.5 my-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[6px] font-black text-aura-muted uppercase tracking-widest font-bold">Daily Yield</span>
                              <span className="text-lg font-black italic font-serif font-bold" style={plan.accent_color ? { color: plan.accent_color } : { color: '#ffffff' }}>
                                {plan.roiPercent || '0.0'}%
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 text-[8px] font-bold text-white uppercase tracking-wider">
                              <CreditCard size={8} />
                              {formatCurrency(parseFloat(plan.minStr || '0'))} - {formatCurrency(parseFloat(plan.maxStr || '0'))}
                            </div>
                          </div>

                          <button 
                            disabled 
                            className="w-full py-2 rounded-lg text-white font-black text-[7px] uppercase tracking-widest opacity-60 pointer-events-none font-bold"
                            style={{ backgroundColor: plan.accent_color || '#22c55e' }}
                          >
                            Initialize Node
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button 
                        disabled={loadingId !== null}
                        onClick={() => handleSavePlan(plan.id)}
                        className="w-full py-3 bg-aura-lime hover:bg-opacity-80 active:scale-[0.98] text-black font-black text-[9px] uppercase tracking-[0.2em] transition-all rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold"
                      >
                        {loadingId === plan.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={12} />
                        )}
                        Save {plan.name || 'Tier'} Configurations
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
