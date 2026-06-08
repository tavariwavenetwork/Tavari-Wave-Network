import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  onIdTokenChanged, 
  User as FirebaseUser,
  getAuth,
  getIdTokenResult
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  getFirestore,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getRoiByAmount, isWeekendROI } from '../lib/utils';
import PremiumLoader from '../components/PremiumLoader';

export const DEFAULT_PLANS = [
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

export function getRoiByAmountDynamic(amount: number, livePlans: any[]): number {
  const isWeekend = isWeekendROI();
  const matchingPlan = (livePlans || []).find((p: any) => p.active_status !== false && amount >= p.min && amount <= p.max);
  if (matchingPlan) {
    const planId = (matchingPlan.id || matchingPlan.name || '').toLowerCase();
    if (planId.includes('regular')) {
      return isWeekend ? 0.015 : 0.025;
    } else if (planId.includes('premium')) {
      return isWeekend ? 0.017 : 0.027;
    } else if (planId.includes('elite')) {
      return isWeekend ? 0.019 : 0.029;
    }
    return matchingPlan.roi;
  }
  return getRoiByAmount(amount); // fallback
}

export function calculateExpectedDailyRoi(
  activeInvestments: any[],
  compoundedAmounts: number[] | undefined,
  plans: any[]
): number {
  if (activeInvestments.length === 0) return 0;

  // Find the oldest active investment to add the $3 signup bonus to
  const sortedInvestments = [...activeInvestments].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || a.activated_at || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || b.activated_at || 0).getTime();
    return dateA - dateB;
  });

  let originalRoi = 0;
  sortedInvestments.forEach((inv, index) => {
    // Add the $3 signup bonus to the oldest active investment (index === 0)
    const amount = index === 0 ? inv.amount + 3 : inv.amount;
    originalRoi += amount * getRoiByAmountDynamic(amount, plans);
  });

  let compoundedRoi = 0;
  const compounds = compoundedAmounts || [];
  compounds.forEach(compAmount => {
    if (compAmount > 0) {
      compoundedRoi += compAmount * getRoiByAmountDynamic(compAmount, plans);
    }
  });

  return originalRoi + compoundedRoi;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorString);
  throw new Error(errorString);
}

interface UserProfile {
  uid: string;
  public_id?: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'cipher';
  funding_balance: number;
  available_balance: number;
  total_earnings: number;
  total_invested: number;
  email_verified?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  plans: any[];
  expectedDailyRoi: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const plansRef = useRef<any[]>(DEFAULT_PLANS);
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [compoundTransactions, setCompoundTransactions] = useState<any[]>([]);

  const isProcessingRoiRef = useRef(false);
  const lastProcessedCycleRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'investment_plans'), async (snapshot) => {
      if (snapshot.empty) {
        setPlans(DEFAULT_PLANS);
        plansRef.current = DEFAULT_PLANS;
      } else {
        const loadedPlans = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        }));
        const order = ['regular', 'premium', 'elite'];
        loadedPlans.sort((a: any, b: any) => order.indexOf(a.id) - order.indexOf(b.id));
        setPlans(loadedPlans);
        plansRef.current = loadedPlans;
      }
    }, (error) => {
      console.warn("Error subscribing to investment_plans, falling back to default:", error);
      setPlans(DEFAULT_PLANS);
      plansRef.current = DEFAULT_PLANS;
    });
    return () => unsub();
  }, []);

  const checkAndProcessROI = useCallback(async (firebaseUser: FirebaseUser, docRef: any, profileData: UserProfile) => {
    const isRoiDisabled = profileData.roi_disabled === true;
    if (isRoiDisabled) return;

    let cycleStartStr = profileData.roi_cycle_start;
    if (!cycleStartStr) return;

    if (isProcessingRoiRef.current) return;
    if (lastProcessedCycleRef.current === cycleStartStr) return;

    const now = new Date().getTime();
    const cycleStart = new Date(cycleStartStr).getTime();
    const totalDuration = 24 * 60 * 60 * 1000;
    const elapsed = now - cycleStart;
    const completedCycles = Math.floor(elapsed / totalDuration);

    if (completedCycles > 0) {
      isProcessingRoiRef.current = true;
      try {
        const q = query(collection(db, 'investments'), where('user_id', '==', firebaseUser.uid), where('status', '==', 'active'));
        const invSnap = await getDocs(q);
        
        if (invSnap.empty) {
          const newCycleStart = new Date(cycleStart + (completedCycles * totalDuration)).toISOString();
          lastProcessedCycleRef.current = cycleStartStr;
          await updateDoc(docRef, { roi_cycle_start: newCycleStart });
          return;
        }

        await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(docRef);
          if (!userSnap.exists()) return;
          
          const currentProfile = userSnap.data() as UserProfile;
          const currentCycleStart = new Date(currentProfile.roi_cycle_start || cycleStartStr).getTime();
          const currentCompletedCycles = Math.floor((new Date().getTime() - currentCycleStart) / totalDuration);

          if (currentCompletedCycles <= 0) return;

          let totalCredit = 0;
          const investmentUpdates: { id: string, docRef: any, data: any }[] = [];

          for (const invDoc of invSnap.docs) {
            const invRef = doc(db, 'investments', invDoc.id);
            const invSnapInTx = await transaction.get(invRef);
            if (invSnapInTx.exists()) {
              const invData = invSnapInTx.data();
              if (invData.status === 'active') {
                const roiRate = getRoiByAmountDynamic(invData.amount, plansRef.current);
                const profitPerCycle = invData.amount * roiRate;
                const cycleProfit = currentCompletedCycles * profitPerCycle;
                totalCredit += cycleProfit;

                investmentUpdates.push({
                  id: invDoc.id,
                  docRef: invRef,
                  data: {
                    total_earned: (invData.total_earned || 0) + cycleProfit,
                    last_sync: new Date().toISOString(),
                    dailyRoi: roiRate
                  }
                });
              }
            }
          }

          const compounds = currentProfile.withdraw_methods?.compounded_amounts || currentProfile.compounded_amounts || [];
          let compoundsProfitPerCycle = 0;
          compounds.forEach((compAmount: number) => {
            if (compAmount > 0) {
              const roiRate = getRoiByAmountDynamic(compAmount, plansRef.current);
              compoundsProfitPerCycle += compAmount * roiRate;
            }
          });
          const totalCompoundsProfit = currentCompletedCycles * compoundsProfitPerCycle;
          totalCredit += totalCompoundsProfit;

          if (totalCredit > 0) {
            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            
            const oldAvailableBalance = currentProfile.available_balance || 0;
            const newAvailableBalance = oldAvailableBalance + totalCredit;

            transaction.update(docRef, {
              available_balance: newAvailableBalance,
              total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
              roi_cycle_start: newCycleStart
            });

            investmentUpdates.forEach(update => {
              transaction.update(update.docRef, update.data);
            });

            const txId = `roi-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
            const txRef = doc(db, 'transactions', txId);
            transaction.set(txRef, {
              user_id: firebaseUser.uid,
              type: 'roi_harvest',
              amount: totalCredit,
              plan_name: 'Auto-Yield Cycle',
              created_at: new Date().toISOString(),
              status: 'approved',
              description: `Automatic credit for ${currentCompletedCycles} cycle(s)`
            });
          } else {
            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            transaction.update(docRef, {
              roi_cycle_start: newCycleStart
            });
          }
        });
        lastProcessedCycleRef.current = cycleStartStr;
      } catch (err) {
        console.error("[ROI Engine] Sync transaction failed:", err);
      } finally {
        isProcessingRoiRef.current = false;
      }
    }
  }, []);

  const runExistingDataCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const currentWithdrawMethods = profileData.withdraw_methods || {};
    if (currentWithdrawMethods.rewards_migrated_v2) return;

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const txQuery = query(collection(db, 'transactions'), where('user_id', '==', firebaseUser.uid));
      const txSnap = await getDocs(txQuery);

      let totalReferralClaims = 0;

      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.status === 'approved' && tx.type === 'referral_reward') {
          totalReferralClaims += tx.amount || 0;
        }
      });

      if (totalReferralClaims > 0) {
        await runTransaction(db, async (transaction) => {
          const uSnap = await transaction.get(docRef);
          if (!uSnap.exists()) return;

          const uData = uSnap.data() as UserProfile;
          const uWithdrawMethods = uData.withdraw_methods || {};
          if (uWithdrawMethods.rewards_migrated_v2) return;

          const currentAvailable = uData.available_balance || 0;
          const oldRewardDollarBalance = uWithdrawMethods.reward_dollar_balance || 0;

          let newAvailable = currentAvailable - totalReferralClaims;
          if (newAvailable < 0) newAvailable = 0;

          const newRewardDollar = oldRewardDollarBalance + totalReferralClaims;

          transaction.update(docRef, {
            available_balance: newAvailable,
            withdraw_methods: {
              ...uWithdrawMethods,
              reward_dollar_balance: newRewardDollar,
              rewards_migrated_v2: true
            }
          });
        });
      } else {
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            rewards_migrated_v2: true
          }
        });
      }
    } catch (err) {
      console.error("[Migration Error] Failed to execute exact data correction:", err);
    }
  }, []);

  const runRoiRelocationCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const currentWithdrawMethods = profileData.withdraw_methods || {};
    if (currentWithdrawMethods.roi_relocated_v3) return;

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const txQuery = query(collection(db, 'transactions'), where('user_id', '==', firebaseUser.uid));
      const txSnap = await getDocs(txQuery);

      let totalRoiHarvest = 0;

      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.status === 'approved' && tx.type === 'roi_harvest') {
          totalRoiHarvest += tx.amount || 0;
        }
      });

      if (totalRoiHarvest > 0) {
        await runTransaction(db, async (transaction) => {
          const uSnap = await transaction.get(docRef);
          if (!uSnap.exists()) return;

          const uData = uSnap.data() as UserProfile;
          const uWithdrawMethods = uData.withdraw_methods || {};
          if (uWithdrawMethods.roi_relocated_v3) return;

          const oldRewardDollarBalance = uWithdrawMethods.reward_dollar_balance || 0;
          const currentAvailable = uData.available_balance || 0;

          // Deduct from reward balance, ensuring it doesn't go below 0
          const deductAmount = Math.min(totalRoiHarvest, oldRewardDollarBalance);
          const newRewardDollar = oldRewardDollarBalance - deductAmount;
          
          // Add back to available balance
          const newAvailable = currentAvailable + deductAmount;

          transaction.update(docRef, {
            available_balance: newAvailable,
            withdraw_methods: {
              ...uWithdrawMethods,
              reward_dollar_balance: newRewardDollar,
              roi_relocated_v3: true
            }
          });

          // Add transaction adjustment record for history integrity
          const correctionTxId = `roi-relocate-adj-${firebaseUser.uid}-${Date.now()}`;
          const correctionTxRef = doc(db, 'transactions', correctionTxId);
          transaction.set(correctionTxRef, {
            user_id: firebaseUser.uid,
            type: 'adjustment',
            amount: deductAmount,
            plan_name: 'Harvest relocation adjustment',
            created_at: new Date().toISOString(),
            status: 'approved',
            description: `ROI balance correction: Relocated $${deductAmount.toFixed(2)} from Reward Balance to Available Balance`
          });
        });
      } else {
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            roi_relocated_v3: true
          }
        });
      }
    } catch (err) {
      console.error("[Correction Error] Failed to execute ROI relocation:", err);
    }
  }, []);

  const runCompoundingMigrationCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      // 1. Fetch all transactions for this user with error isolation
      let txSnap;
      try {
        const txQuery = query(
          collection(db, 'transactions'),
          where('user_id', '==', firebaseUser.uid)
        );
        txSnap = await getDocs(txQuery);
      } catch (txErr: any) {
        console.error("[ROI Compound Fix] getDocs(transactions) failed:", txErr.message || txErr);
        throw txErr;
      }

      // 2. Group compound transactions by their exact created_at timestamp
      const groups: { [createdAt: string]: number } = {};
      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.type === 'compound') {
          const createdAt = tx.created_at || '';
          const amount = tx.amount || 0;
          if (createdAt && amount > 0) {
            groups[createdAt] = (groups[createdAt] || 0) + amount;
          }
        }
      });

      // 3. Extract the summed compounded amounts per compounding operation
      const compoundedAmounts = Object.values(groups).filter(val => val > 0);

      // 4. Update inside withdraw_methods to respect Firestore security rules on permitted keys
      try {
        const currentWithdrawMethods = profileData.withdraw_methods || {};
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            compounded_amounts: compoundedAmounts,
            compounded_amounts_migrated_v1: true
          }
        });
        console.log(`[ROI Compound Fix] Successfully migrated ${compoundedAmounts.length} compound amounts nested in withdraw_methods for user: ${firebaseUser.uid}`, compoundedAmounts);
      } catch (updateErr: any) {
        console.error("[ROI Compound Fix] updateDoc on users failed:", updateErr.message || updateErr);
        throw updateErr;
      }
    } catch (err: any) {
      console.error("[ROI Compound Fix] Migration correction failed:", err.message || err);
    }
  }, []);

  const fetchProfileWithRetry = useCallback(async (firebaseUser: FirebaseUser, retryCount = 0): Promise<void> => {
    const isCipher = firebaseUser.email === 'support@tavariwave.network' || 
                     firebaseUser.email === 'contact.cga.usa@gmail.com' || 
                     firebaseUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

    // Reload user state to ensure we have the absolute latest verification status
    // This addresses the "verified users unable to sign in" permission issue
    if (retryCount === 0) {
      try {
        await firebaseUser.reload();
        await firebaseUser.getIdToken(true);
      } catch (e) {
        console.warn("Auth reload failed during profile fetch", e);
      }
    }

    if (!firebaseUser.emailVerified && !isCipher) {
        setProfile(null);
        setLoading(false);
        return;
    }

    const docRef = doc(db, 'users', firebaseUser.uid);
    
    try {
      // Clear existing subscription
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
        unsubscribeProfileRef.current = null;
      }

      // Initial getDoc to check existence and prime the cache
      const initialSnap = await getDoc(docRef);
      if (initialSnap.exists()) {
        setProfile(initialSnap.data() as UserProfile);
      }

      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);

          // Safe trigger existing reward balance correction once
          if (!profileData.withdraw_methods?.rewards_migrated_v2) {
            runExistingDataCorrection(firebaseUser, profileData);
          }

          // Trigger relocation of ROI profits to Available Balance
          if (!profileData.withdraw_methods?.roi_relocated_v3) {
            runRoiRelocationCorrection(firebaseUser, profileData);
          }

          // Trigger reconstruction of compounding amounts for compounding ROI threshold fix
          const isMigrated = profileData.withdraw_methods?.compounded_amounts_migrated_v1 || profileData.compounded_amounts_migrated_v1;
          if (!isMigrated) {
            runCompoundingMigrationCorrection(firebaseUser, profileData);
          }

          // ROI Background Sync
          const cycleStartStr = profileData.roi_cycle_start;
          const isRoiDisabled = profileData.roi_disabled === true;

          // Auto-heal missing roi_cycle_start if active investments exist
          if (!cycleStartStr && !isRoiDisabled) {
            const q = query(collection(db, 'investments'), where('user_id', '==', firebaseUser.uid), where('status', '==', 'active'));
            getDocs(q).then(async (invSnap) => {
              if (!invSnap.empty) {
                let earliestTime = new Date().getTime();
                invSnap.docs.forEach(d => {
                  const data = d.data();
                  if (data.activated_at) {
                    const t = new Date(data.activated_at).getTime();
                    if (t < earliestTime) earliestTime = t;
                  }
                });
                const initTime = new Date(earliestTime).toISOString();
                try {
                  await updateDoc(docRef, { roi_cycle_start: initTime });
                } catch (e) {
                  console.warn("[ROI Auto-Heal] Failed:", e);
                }
              }
            }).catch(err => {
              console.warn("[ROI Auto-Heal] Fetch error:", err);
            });
          }

          if (cycleStartStr && !isRoiDisabled) {
            checkAndProcessROI(firebaseUser, docRef, profileData);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        // If snapshot fails with permission error, retry silently
        if (error.message.includes('permission')) {
          if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 500;
            setTimeout(() => fetchProfileWithRetry(firebaseUser, retryCount + 1), delay);
          } else {
            console.error("Max retries reached for profile fetch", error);
            setLoading(false);
          }
        } else {
          console.error("Profile subscription error:", error);
          setLoading(false);
        }
      });

      unsubscribeProfileRef.current = unsubscribe;
    } catch (err: any) {
      if (err.message.includes('permission') && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 500;
        setTimeout(() => fetchProfileWithRetry(firebaseUser, retryCount + 1), delay);
      } else {
        console.error("Fetch profile error:", err);
        setLoading(false);
      }
    }
  }, [checkAndProcessROI]);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Immediate silent run on focus/mount
    const docRef = doc(db, 'users', user.uid);
    checkAndProcessROI(user, docRef, profile);
    
    const interval = setInterval(() => {
      const cycleStartStr = profile.roi_cycle_start;
      const isRoiDisabled = profile.roi_disabled === true;
      if (cycleStartStr && !isRoiDisabled) {
         checkAndProcessROI(user, docRef, profile);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [user, profile, checkAndProcessROI]);

  const refreshAuth = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      if (updatedUser) {
        await fetchProfileWithRetry(updatedUser);
      }
    }
  }, [fetchProfileWithRetry]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Wait for verification before fetching profile
        const isCipher = firebaseUser.email === 'support@tavariwave.network' || 
                         firebaseUser.email === 'contact.cga.usa@gmail.com' || 
                         firebaseUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
        
        if (firebaseUser.emailVerified || isCipher) {
          await fetchProfileWithRetry(firebaseUser);
        } else {
          // If not verified, we set profile to null and wait
          setProfile(null);
          setLoading(false);
        }
      } else {
        if (unsubscribeProfileRef.current) {
          unsubscribeProfileRef.current();
          unsubscribeProfileRef.current = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
      }
    };
  }, [fetchProfileWithRetry]);

  const logout = useCallback(async () => {
    if (unsubscribeProfileRef.current) {
      unsubscribeProfileRef.current();
      unsubscribeProfileRef.current = null;
    }
    await auth.signOut();
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveInvestments([]);
      return;
    }

    const isCipher = user.email === 'support@tavariwave.network' || 
                     user.email === 'contact.cga.usa@gmail.com' || 
                     user.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
                     
    if (!user.emailVerified && !isCipher) {
      setActiveInvestments([]);
      return;
    }

    const q = query(
      collection(db, 'investments'),
      where('user_id', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveInvestments(list);
    }, (err) => {
      console.warn("[AuthContext:ActiveInvestments] subscription blocked:", err);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCompoundTransactions([]);
      return;
    }

    const isCipher = user.email === 'support@tavariwave.network' || 
                     user.email === 'contact.cga.usa@gmail.com' || 
                     user.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
                     
    if (!user.emailVerified && !isCipher) {
      setCompoundTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('type', '==', 'compound')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompoundTransactions(list);
    }, (err) => {
      console.warn("[AuthContext:CompoundTransactions] subscription blocked:", err);
    });

    return () => unsub();
  }, [user]);

  const dynamicPlans = plans.map(p => {
    const isWeekend = isWeekendROI();
    let dynamicRoi = p.roi;
    const planId = (p.id || p.name || '').toLowerCase();
    if (planId.includes('regular')) {
      dynamicRoi = isWeekend ? 0.015 : 0.025;
    } else if (planId.includes('premium')) {
      dynamicRoi = isWeekend ? 0.017 : 0.027;
    } else if (planId.includes('elite')) {
      dynamicRoi = isWeekend ? 0.019 : 0.029;
    }
    return { ...p, roi: dynamicRoi };
  });

  const lastValidRoiRef = useRef<number>(0);

  const derivedCompoundedAmounts = React.useMemo(() => {
    const profileCompounds = profile?.withdraw_methods?.compounded_amounts || profile?.compounded_amounts || [];
    
    // Group compound transactions by created_at to derive compounded amounts
    const txGroups: { [createdAt: string]: number } = {};
    compoundTransactions.forEach(tx => {
      const createdAt = tx.created_at || '';
      const amount = tx.amount || 0;
      if (createdAt && amount > 0) {
        txGroups[createdAt] = (txGroups[createdAt] || 0) + amount;
      }
    });
    const txCompounds = Object.values(txGroups).filter(val => val > 0);

    return txCompounds.length > 0 ? txCompounds : profileCompounds;
  }, [profile?.withdraw_methods?.compounded_amounts, profile?.compounded_amounts, compoundTransactions]);

  const expectedDailyRoi = React.useMemo(() => {
    const rawRoi = calculateExpectedDailyRoi(
      activeInvestments, 
      derivedCompoundedAmounts, 
      dynamicPlans
    );
    if (rawRoi > 0) {
      lastValidRoiRef.current = rawRoi;
      return rawRoi;
    }
    if (activeInvestments.length === 0) {
      return 0;
    }
    return lastValidRoiRef.current || 0;
  }, [activeInvestments, derivedCompoundedAmounts, dynamicPlans]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshAuth, plans: dynamicPlans, expectedDailyRoi }}>
      {loading ? <PremiumLoader /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
