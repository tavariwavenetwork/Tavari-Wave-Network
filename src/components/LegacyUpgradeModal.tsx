import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDocs, collection, query, where, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function LegacyUpgradeModal() {
  const { user, profile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  const [originalAssets, setOriginalAssets] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [upgradedAssetsPool, setUpgradedAssetsPool] = useState(0);
  const [finalUpgradedValue, setFinalUpgradedValue] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;

    // Check if user is a Legacy User and is pending
    const legacy = isLegacyUser(profile);
    const isPending = legacy && (!profile.migration_status || profile.migration_status === 'pending');

    if (isPending) {
      // Calculate and load original investment assets
      const currentAssets = profile.total_invested || 0;
      setOriginalAssets(currentAssets);
      setIsOpen(true);
      
      // Compute historical withdrawals asynchronously
      const fetchWithdrawals = async () => {
        try {
          let totalWithdrawnSum = 0;
          
          // Query withdrawals collection for this user which are approved
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
          // Fallback to safe default
          setUpgradedAssetsPool(currentAssets * 3);
          setFinalUpgradedValue(currentAssets * 3);
          setIsCalculated(true);
        }
      };

      fetchWithdrawals();
    }
  }, [user, profile]);

  const handleDecline = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.migration_status && data.migration_status !== 'pending') {
          return; // already processed
        }
        transaction.update(userRef, {
          migration_status: 'declined'
        });
      });
      setIsOpen(false);
      toast.info("You declined the premium Asset Multiplier Upgrade. Your existing investment plan remains unchanged.");
    } catch (err) {
      console.error("Error declining upgrade:", err);
      toast.error("Failed to update preferences. Please retry.");
    }
  };

  const handleAccept = async () => {
    if (!user || !profile || !isCalculated) return;
    setIsMigrating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const txId = `migration-upgrade-${user.uid}`;
      const txRef = doc(db, 'transactions', txId);
      const notifRef = doc(collection(db, 'notifications'));

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error("User document missing");

        const data = snap.data();
        if (data.migration_status && data.migration_status !== 'pending') {
          throw new Error("Migration already finalized for this account.");
        }

        // Verify transaction isn't already created
        const snapTx = await transaction.get(txRef);
        if (snapTx.exists()) {
          throw new Error("Migration transaction already registered.");
        }

        // Update the user profile
        transaction.update(userRef, {
          migration_status: 'accepted',
          original_assets_before_upgrade: originalAssets,
          remaining_upgraded_assets: finalUpgradedValue,
          total_invested: finalUpgradedValue, // sets Assets to Final Upgraded Asset Value
          roi_cycle_start: new Date().toISOString() // Start fresh ROI cycle
        });

        // Save migration transaction record
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'migration_upgrade',
          status: 'approved',
          amount: finalUpgradedValue,
          original_amount: originalAssets,
          historical_withdrawals: withdrawn,
          created_at: new Date().toISOString(),
          description: `Legacy Asset Multiplier executed: scaled $${originalAssets.toFixed(2)} to 300% ($${(originalAssets * 3).toFixed(2)}) less withdrawals ($${withdrawn.toFixed(2)})`
        });

        // Save notification
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Multiplier Upgrade Activated',
          message: `Your asset balance has been upgraded to ${formatCurrency(finalUpgradedValue)} (300% value less historical withdrawals). Daily cycle ROI is now set to 0.5% (24-hour cycle).`,
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success("Congratulations! Your VIP Asset Multiplier Upgrade is now fully active.");
      setIsOpen(false);
    } catch (err: any) {
      console.error("Migration error:", err);
      toast.error(err.message || "Failed to execute your program upgrade. Please try again or contact support.");
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Modern executive dark transparent backdrop filter blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modern executive white theme card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-sm rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col gap-5 my-auto overflow-hidden"
        >
          {/* Subtle green glassmorphism accent light glow inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-[40px] pointer-events-none" />

          {/* Premium Title Section */}
          <div className="text-center">
            <h2 className="text-base font-black tracking-wider text-black font-sans uppercase">
              ASSET MULTIPLIER UPGRADE
            </h2>
            <p className="mt-1 text-xs text-emerald-600 font-bold uppercase tracking-wide">
              300% Portfolio Upgrade
            </p>
          </div>

          {/* Premium Fintech Stats Rows */}
          <div className="space-y-3 rounded-2xl bg-gray-50/75 border border-gray-100 p-4">
            {/* Row 1: Original Assets (Black / Black) */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-100/70">
              <span className="text-black font-semibold">Original Assets</span>
              <span className="text-black font-mono font-bold">
                {formatCurrency(originalAssets)}
              </span>
            </div>

            {/* Row 2: Upgraded Portfolio Pool (Green / Green) */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-100/70">
              <span className="text-emerald-600 font-semibold">Upgraded Portfolio Pool</span>
              <span className="text-emerald-600 font-mono font-bold">
                {isCalculated ? formatCurrency(upgradedAssetsPool) : 'Calculating...'}
              </span>
            </div>

            {/* Row 3: Historical Withdrawals (Red / Red) */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-100/70">
              <span className="text-red-600 font-semibold">Historical Withdrawals</span>
              <span className="text-red-600 font-mono font-bold">
                {isCalculated ? `-${formatCurrency(withdrawn)}` : 'Calculating...'}
              </span>
            </div>

            {/* Row 4: Final Upgraded Assets (Green / Green) */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-emerald-600 font-black uppercase">Final Upgraded Assets</span>
              <span className="text-sm font-black text-emerald-600 font-mono">
                {isCalculated ? formatCurrency(finalUpgradedValue) : 'Calculating...'}
              </span>
            </div>
          </div>

          {/* Dual Action Premium Buttons: Unified Single Row, Equal Widths */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Left Button: Decline (White bg, Grey border, Black text) */}
            <button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleDecline}
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
            >
              Decline
            </button>

            {/* Right Button: Accept Upgrade (Green bg, White text) */}
            <button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleAccept}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-xs font-black uppercase tracking-wider text-white shadow-sm shadow-emerald-600/10 transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
            >
              {isMigrating ? (
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing</span>
                </div>
              ) : (
                'Accept Upgrade'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
