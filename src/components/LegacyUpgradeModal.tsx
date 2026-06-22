import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, TrendingUp, Info, HelpCircle, ArrowUpRight, CheckCircle, Flame } from 'lucide-react';
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
        {/* Backdrop filter blur with fade transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#020203]/90 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070a0f]/90 p-8 shadow-[0_0_50px_rgba(124,58,237,0.25)] backdrop-blur-2xl"
        >
          {/* Neon Purple ambient backdrop glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />

          {/* Icon Header */}
          <div className="relative flex justify-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary glow-purple animate-pulse">
              <Sparkles size={28} className="text-purple-400" />
            </div>
            {/* Tag badge */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
              Legacy Account VIP Offer
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black uppercase tracking-wider text-purple-100 font-sans">
              Asset Multiplier Upgrade
            </h2>
            <p className="mt-1.5 text-xs text-aura-muted uppercase tracking-widest font-semibold">
              Exclusive Legacy Benefits Program
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-white/70 text-center leading-relaxed mb-6 font-medium">
            Standard investment cycles have evolved. As an eligible pre-deployment account, you have been selected for a premium, one-time Migration Protocol to accelerate your financial growth on our platform.
          </p>

          {/* Metrics display block */}
          <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-5 mb-6">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
              <span className="text-white/50 font-bold uppercase tracking-wider">Original Assets</span>
              <span className="text-white font-mono font-bold tracking-tight">{formatCurrency(originalAssets)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
              <span className="text-white/50 font-bold uppercase tracking-wider flex items-center gap-1.5">
                Multiplier Tier
              </span>
              <span className="text-purple-400 font-mono font-bold tracking-tight uppercase">+300% Upgrade</span>
            </div>

            {isCalculated ? (
              <>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                  <span className="text-white/50 font-bold uppercase tracking-wider">Upgraded Portfolio Pool</span>
                  <span className="text-white font-mono font-light tracking-tight">{formatCurrency(upgradedAssetsPool)}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                  <span className="text-white/50 font-bold uppercase tracking-wider">Historical Withdrawals</span>
                  <span className="text-red-400 font-mono font-bold tracking-tight">-{formatCurrency(withdrawn)}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-black text-white uppercase tracking-wider">Final Upgraded Assets</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#CCFF00] font-mono tracking-tight">
                      {formatCurrency(finalUpgradedValue)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-aura-muted font-bold tracking-widest uppercase">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Retrieving Historical Metrics...
              </div>
            )}
          </div>

          {/* Program Features list */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full p-1 bg-green-500/10 text-green-400">
                <CheckCircle size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide">3.0X Asset Multiplier Integration</p>
                <p className="text-[10px] text-aura-muted font-medium mt-0.5">Your total asset base is expanded dynamically to 300% of its value (reduced by total historical withdrawals).</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full p-1 bg-green-500/10 text-green-400">
                <CheckCircle size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide">0.5% Daily ROI Program</p>
                <p className="text-[10px] text-aura-muted font-medium mt-0.5">Consistent yield disbursements distributed on a standard 24-hour cycle directly into your available balance.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full p-1 bg-green-500/10 text-green-400">
                <CheckCircle size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide">Depletion Protection Engine</p>
                <p className="text-[10px] text-aura-muted font-medium mt-0.5">Asset depletion mode safeguards yields. Each disbursement deducts the paid sum from remaining upgraded assets until it hits $0.00.</p>
              </div>
            </div>
          </div>

          {/* Actions button block */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleDecline}
              className="flex-1 order-last sm:order-first px-6 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-widest text-aura-muted hover:text-white bg-white/5 active:bg-white/10 transition-all disabled:opacity-50"
            >
              Decline Upgrade
            </button>

            <button
              type="button"
              disabled={isMigrating || !isCalculated}
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl btn-gradient-purple text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 glow-purple"
            >
              {isMigrating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  Accept Upgrade
                  <ArrowUpRight size={14} />
                </>
              )}
            </button>
          </div>

          <p className="text-[8px] text-center text-aura-muted uppercase tracking-widest font-semibold mt-4">
            Security Guarantee: This migration is a secure, strictly audited one-time action.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
