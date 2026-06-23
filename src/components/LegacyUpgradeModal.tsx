import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDocs, collection, query, where, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function LegacyUpgradeModal() {
  const { user, profile, refreshAuth } = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  const [originalAssets, setOriginalAssets] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [upgradedAssetsPool, setUpgradedAssetsPool] = useState(0);
  const [finalUpgradedValue, setFinalUpgradedValue] = useState(0);

  useEffect(() => {
    const handleOpenEvent = () => {
      if (!user || !profile) return;
      
      const currentAssets = profile.original_assets_before_upgrade !== undefined 
        ? profile.original_assets_before_upgrade 
        : (profile.total_invested || 0);
        
      setOriginalAssets(currentAssets);
      setIsOpen(true);
      
      const fetchWithdrawals = async () => {
        try {
          let totalWithdrawnSum = 0;
          const qLimit = query(
            collection(db, 'withdrawals'),
            where('user_id', '==', user.uid),
            where('status', '==', 'approved')
          );
          const snap = await getDocs(qLimit);
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            totalWithdrawnSum += data.amount || 0;
          });
          
          setWithdrawn(totalWithdrawnSum);
          const timesThree = currentAssets * 3;
          setUpgradedAssetsPool(timesThree);
          
          const finalValue = Math.max(0, timesThree - totalWithdrawnSum);
          setFinalUpgradedValue(finalValue);
          setIsCalculated(true);
        } catch (err) {
          console.error("Error computing legacy upgraded metrics:", err);
          setUpgradedAssetsPool(currentAssets * 3);
          setFinalUpgradedValue(currentAssets * 3);
          setIsCalculated(true);
        }
      };

      fetchWithdrawals();
    };

    window.addEventListener('open-legacy-upgrade-modal', handleOpenEvent);

    if (user && profile) {
      const legacy = isLegacyUser(profile);
      const isPending = legacy && (!profile.migration_status || profile.migration_status === 'pending');
      if (isPending) {
        handleOpenEvent();
      }
    }

    return () => {
      window.removeEventListener('open-legacy-upgrade-modal', handleOpenEvent);
    };
  }, [user, profile]);

  const handleDecline = async () => {
    if (!user || !user.uid) {
      toast.error("Authentication expired. Please sign in again.");
      return;
    }
    if (!profile) {
      toast.error("User profile record not found. Please refresh.");
      return;
    }
    const profileUid = profile.uid || profile.user_id || user.uid;
    if (profileUid !== user.uid) {
      toast.error("Account ownership mismatch detected. Safe state update declined.");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Query active investments for the user so we can scale them down proportionally
      const q = query(
        collection(db, 'investments'),
        where('user_id', '==', user.uid),
        where('status', '==', 'active')
      );
      const invSnap = await getDocs(q);
      const activeInvs = invSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() } as any));

      const currentAssets = originalAssets;
      const remainingAssets = Math.max(0, currentAssets - withdrawn);
      const scaleFactor = currentAssets > 0 ? remainingAssets / currentAssets : 0;

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) {
          throw new Error("Unable to decline: User profile document is missing in the database.");
        }
        const data = snap.data();
        if (data.migration_status && data.migration_status !== 'pending') {
          return; // already processed
        }

        transaction.update(userRef, {
          migration_status: 'declined',
          total_invested: remainingAssets,
          original_assets_before_upgrade: currentAssets,
          remaining_upgraded_assets: remainingAssets,
          roi_cycle_start: new Date().toISOString()
        });

        // Update all active investments to match
        activeInvs.forEach(invDoc => {
          const newAmount = Math.max(0, (invDoc.amount || 0) * scaleFactor);
          const isExhausted = newAmount <= 1e-9;
          transaction.update(invDoc.ref, {
            amount: newAmount,
            status: isExhausted ? 'completed' : 'active',
            updated_at: new Date().toISOString()
          });
        });
      });

      if (refreshAuth) {
        await refreshAuth();
      }
      setIsOpen(false);
      toast.info(`You declined the premium Asset Multiplier Upgrade. Your asset balance has been adjusted to ${formatCurrency(remainingAssets)} and will deplete as daily ROI generates.`);
    } catch (err: any) {
      console.error("Error declining upgrade:", err);
      let errMsg = "An error occurred while declining the upgrade preference.";
      if (err.code === "permission-denied" || (err.message && err.message.includes("permission"))) {
        errMsg = "Security access denied. Please verify your authentication state and attempt again.";
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    }
  };

  const handleAccept = async () => {
    if (!user || !user.uid) {
      toast.error("Authentication expired. Please sign in again.");
      return;
    }
    if (!profile) {
      toast.error("User profile record not found. Please refresh.");
      return;
    }
    const profileUid = profile.uid || profile.user_id || user.uid;
    if (profileUid !== user.uid) {
      toast.error("Account ownership mismatch detected. Upgrade rejected.");
      return;
    }

    // Dynamic on-the-fly metrics computation fallback
    let finalValue = finalUpgradedValue;
    let fallbackOriginal = originalAssets;
    if (!isCalculated || finalValue <= 0) {
      const currentAssets = profile.original_assets_before_upgrade !== undefined 
        ? profile.original_assets_before_upgrade 
        : (profile.total_invested || 0);
      fallbackOriginal = currentAssets;
      const timesThree = currentAssets * 3;
      finalValue = Math.max(0, timesThree - withdrawn);
    }
    
    setIsMigrating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const txId = `migration-upgrade-${user.uid}`;
      const txRef = doc(db, 'transactions', txId);
      const notifRef = doc(collection(db, 'notifications'));

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) {
          throw new Error("Unable to execute upgrade: User profile document is missing in the database.");
        }

        const data = snap.data();
        if (data.migration_status && data.migration_status !== 'pending' && data.migration_status !== 'declined') {
          throw new Error("Migration already finalized for this account.");
        }

        // Update the user profile
        transaction.update(userRef, {
          migration_status: 'accepted',
          original_assets_before_upgrade: fallbackOriginal,
          remaining_upgraded_assets: finalValue,
          total_invested: finalValue, // sets Assets to Final Upgraded Asset Value
          roi_cycle_start: new Date().toISOString() // Start fresh ROI cycle
        });

        // Save migration transaction record - uses set with create-or-merge behavior safely
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'migration_upgrade',
          status: 'approved',
          amount: finalValue,
          original_amount: fallbackOriginal,
          historical_withdrawals: withdrawn,
          created_at: new Date().toISOString(),
          description: `Legacy Asset Multiplier executed: scaled $${fallbackOriginal.toFixed(2)} to 300% ($${(fallbackOriginal * 3).toFixed(2)}) less withdrawals ($${withdrawn.toFixed(2)})`
        });

        // Save notification
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Multiplier Upgrade Activated',
          message: `Your asset balance has been upgraded to ${formatCurrency(finalValue)} (300% value less historical withdrawals). Daily cycle ROI is now set to 0.5% (24-hour cycle).`,
          read: false,
          created_at: new Date().toISOString()
        });
      });

      if (refreshAuth) {
        await refreshAuth();
      }

      toast.success("Congratulations! Your VIP Asset Multiplier Upgrade is now fully active.");
      
      // Trigger luxurious celebration experience with 5 seconds auto-dismiss
      setIsCelebrating(true);
      setTimeout(() => {
        setIsCelebrating(false);
        setIsOpen(false);
      }, 5000);
    } catch (err: any) {
      console.error("Migration error:", err);
      let errMsg = "Failed to execute your program upgrade. Please try again or contact support.";
      if (err.code === "permission-denied" || (err.message && err.message.includes("permission"))) {
        errMsg = "Security access denied. Please ensure your session is active and try again.";
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setIsMigrating(false);
    }
  };

  const [isCelebrating, setIsCelebrating] = useState(false);

  // Generate deterministic-looking randomized particle info to avoid hydration mismatch
  const celebrationParticles = React.useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: (i * 7) % 100, // distributed %
      delay: (i * 0.15) % 3, // staggered entry
      duration: 3 + ((i * 0.4) % 2.5), // staggered speed
      size: 4 + ((i * 3) % 8), // staggered size
      color: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#A855F7' : '#10B981', // Gold, Purple, Emerald
      rotate: (i * 15) % 360,
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4">
        {/* Background blur refined to approximately 10% overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-[4px]"
        />

        {/* Celebrating Overlay Screen */}
        <AnimatePresence>
          {isCelebrating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[10000] bg-black/95 flex items-center justify-center flex-col overflow-hidden"
            >
              {/* Falling Premium Celebratory Elements */}
              {celebrationParticles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute top-[-20px] rounded-full shadow-lg"
                  style={{
                    left: `${p.x}%`,
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: p.color === '#FFD700' ? '0 0 10px rgba(255, 215, 0, 0.4)' : 'none',
                    opacity: 0.9,
                  }}
                  initial={{ y: -50, opacity: 1, rotate: p.rotate }}
                  animate={{ y: '105vh', opacity: 0, rotate: p.rotate + 360 }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}

              {/* Central Glowing Green wealth feature badge */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 }}
                className="flex flex-col items-center justify-center p-8 rounded-3xl bg-neutral-900/90 border border-emerald-500/30 backdrop-blur-md shadow-[0_20px_60px_rgba(16,185,129,0.3)] max-w-sm text-center mx-4 relative overflow-hidden"
              >
                {/* Visual sparkles */}
                <div className="absolute top-2 left-2 animate-bounce text-emerald-400 opacity-30">✨</div>
                <div className="absolute bottom-4 right-4 animate-ping text-yellow-400 opacity-20">★</div>

                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-7xl lg:text-8xl font-black text-emerald-400 font-sans tracking-tight drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] mb-4"
                >
                  300%
                </motion.div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                  Congratulations!
                </h3>
                <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">
                  300% Upgrade Successful
                </p>
                <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                  Your premium wealth upgrade has been fully activated. Daily high-yield cycle rewards are generating and streaming directly.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Stack containing Card + Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-sm flex flex-col gap-4 my-auto relative z-10"
        >
          {/* Outer Card with CONTINUOUSLY ROTATING Radial / Conic Gradient Border with Luxury Thickness */}
          <div className="w-full rounded-[2.2rem] p-[10px] overflow-hidden shadow-[0_20px_50px_rgba(124,58,237,0.4)] relative flex flex-col">
            {/* Smooth GPU accelerated continuous spinner */}
            <div 
              className="absolute w-[300%] h-[300%] top-[-100%] left-[-100%] bg-[conic-gradient(from_0deg,var(--color-primary),var(--color-secondary),#CCFF00,var(--color-primary))]"
              style={{
                animation: 'spin 10s linear infinite',
                zIndex: 0,
                willChange: 'transform'
              }}
            />
            
            {/* Inner white popup body with shadow-inner depth and grey separator */}
            <div className="relative z-10 w-full rounded-[1.8rem] bg-white p-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col gap-4 overflow-hidden">
              
              {/* Subtle light violet/purple bloom background overlay */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-50/70 rounded-full blur-[30px] pointer-events-none" />

              {/* Faint realistic robot watermark in background, opacity-6 */}
              <div 
                className="absolute inset-0 pointer-events-none select-none bg-cover bg-center grayscale opacity-[0.06] mix-blend-overlay"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80')"
                }}
              />

              {/* Official website logo in the top-left corner */}
              <img 
                src="https://i.imgur.com/wU33xy3.png" 
                alt="Wave Logo" 
                className="absolute top-4 left-4 h-5.5 w-auto object-contain brightness-95 opacity-80" 
              />

              {/* Premium Title Section */}
              <div className="text-center pt-8">
                <h2 className="text-lg font-black tracking-wider text-black font-sans uppercase">
                  ASSET MULTIPLIER UPGRADE
                </h2>
                <p className="mt-1 text-xs text-purple-600 font-bold uppercase tracking-wider">
                  300% Portfolio Upgrade
                </p>
              </div>

              {/* Premium stats display containing ONLY the 4 requested rows */}
              <div className="space-y-3 pt-1">
                
                {/* Row 1: Original Assets (Black / Black) */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                  <span className="text-black font-bold uppercase tracking-wide text-[10px]">Original Assets</span>
                  <span className="text-black font-mono font-bold">
                    {formatCurrency(originalAssets)}
                  </span>
                </div>

                {/* Row 2: Upgraded Portfolio Pool (Green / Green) */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                  <span className="text-emerald-600 font-bold uppercase tracking-wide text-[10px]">Upgraded Portfolio Pool</span>
                  <span className="text-emerald-600 font-mono font-bold">
                    {isCalculated ? formatCurrency(upgradedAssetsPool) : 'Calculating...'}
                  </span>
                </div>

                {/* Row 3: Historical Withdrawals (Red / Red) */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                  <span className="text-red-600 font-bold uppercase tracking-wide text-[10px]">Historical Withdrawals</span>
                  <span className="text-red-600 font-mono font-bold">
                    {isCalculated ? `-${formatCurrency(withdrawn)}` : 'Calculating...'}
                  </span>
                </div>

                {/* Row 4: Final Upgraded Assets (Green / Green) */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-emerald-600 font-black uppercase tracking-wide text-xs">Final Upgraded Assets</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {isCalculated ? formatCurrency(finalUpgradedValue) : 'Calculating...'}
                  </span>
                </div>

                {/* Read about upgrade link - INSIDE bottom section of popup card, center aligned */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/multiplier-upgrade');
                    }}
                    className="text-xs font-sans text-purple-600 hover:text-purple-700 underline tracking-wide font-bold bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Read about upgrade
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Buttons block below the card with premium styling - ONLY Decline and Accept Upgrade external */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleDecline}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-black uppercase tracking-wider text-black active:scale-[0.98] transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              Decline
            </button>

            <motion.button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleAccept}
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0px 4px 10px rgba(124, 58, 237, 0.2)",
                  "0px 4px 20px rgba(124, 58, 237, 0.5)",
                  "0px 4px 10px rgba(124, 58, 237, 0.2)"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full px-4 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-850 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-purple-600/20 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              {isMigrating ? (
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Accept Upgrade'
              )}
            </motion.button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
