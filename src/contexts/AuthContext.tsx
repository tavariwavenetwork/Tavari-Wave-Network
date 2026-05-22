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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const plansRef = useRef<any[]>(DEFAULT_PLANS);
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);

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

    const now = new Date().getTime();
    const cycleStart = new Date(cycleStartStr).getTime();
    const totalDuration = 24 * 60 * 60 * 1000;
    const elapsed = now - cycleStart;
    const completedCycles = Math.floor(elapsed / totalDuration);

    if (completedCycles > 0) {
      try {
        const q = query(collection(db, 'investments'), where('user_id', '==', firebaseUser.uid), where('status', '==', 'active'));
        const invSnap = await getDocs(q);
        
        if (invSnap.empty) {
          const newCycleStart = new Date(cycleStart + (completedCycles * totalDuration)).toISOString();
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

          if (totalCredit > 0) {
            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            
            // Update User Profile
            transaction.update(docRef, {
              available_balance: (currentProfile.available_balance || 0) + totalCredit,
              total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
              roi_cycle_start: newCycleStart
            });

            // Update individual investments
            investmentUpdates.forEach(update => {
              transaction.update(update.docRef, update.data);
            });

            // Add Transaction Record (with idempotent unique ID to prevent duplicate tickets)
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
      } catch (err) {
        console.error("[ROI Engine] Sync transaction failed:", err);
      }
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshAuth, plans: dynamicPlans }}>
      {!loading && children}
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
