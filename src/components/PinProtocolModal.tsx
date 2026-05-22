import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck,
  AlertCircle,
  Unlock,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { 
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';

interface PinProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  isSubmitting?: boolean;
}

export default function PinProtocolModal({ isOpen, onClose, onSuccess, isSubmitting: parentSubmitting }: PinProtocolModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'entry' | 'setup-init' | 'setup-confirm' | 'forgot-pin'>('entry');
  
  // States
  const [pinEntry, setPinEntry] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Feedback
  const [isShake, setIsShake] = useState(false);
  const [isPinValid, setIsPinValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isSubmitting = parentSubmitting || localSubmitting;

  // Determination logic
  useEffect(() => {
    if (isOpen) {
      if (!profile?.transfer_pin) {
        setStep('setup-init');
      } else {
        setStep('entry');
      }
      // Reset states
      setPinEntry('');
      setPassword('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setIsShake(false);
      setIsPinValid(false);
    }
  }, [isOpen, profile]);

  const handleEntryTrigger = (pin: string) => {
    if (pin.length === (profile?.transfer_pin?.length || 4)) {
      if (pin === profile?.transfer_pin) {
        setIsPinValid(true);
        setTimeout(() => {
          onSuccess(pin);
        }, 500);
      } else {
        setIsShake(true);
        toast.error("Invalid Security PIN");
        setTimeout(() => {
          setIsShake(false);
          setPinEntry('');
        }, 500);
      }
    }
  };

  const handleSetup = async () => {
    setError(null);
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setLocalSubmitting(true);
    try {
      // Re-authenticate
      if (user?.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      } else {
        throw new Error("Session Invalid");
      }

      await updateDoc(doc(db, 'users', user!.uid), {
        transfer_pin: newPin
      });

      toast.success("Security PIN synchronized");
      // After setup, proceed to use the PIN
      setTimeout(() => {
        onSuccess(newPin);
      }, 500);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError("Invalid Account Password");
      } else {
        toast.error("Protocol Sync Failed");
      }
    } finally {
      setLocalSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "relative w-full shadow-2xl overflow-hidden transition-all duration-500 bg-white",
          step === 'entry' ? "max-w-[300px] rounded-[40px]" : "max-w-[340px] rounded-[32px]"
        )}
      >
        {/* Header - Only for setups */}
        {step !== 'entry' && (
          <div className="bg-slate-900 p-6 text-white relative">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2.5">
                 <ShieldCheck className="text-emerald-400" size={20} />
                 <h3 className="text-sm font-black uppercase tracking-widest italic font-serif">Security Protocol</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className={cn("p-8", step === 'entry' ? "space-y-6" : "space-y-5")}>
          {step === 'entry' ? (
            <div className="text-center space-y-6">
               <div className="flex justify-between items-start">
                  <div className="w-10" /> {/* Spacer */}
                  <h3 className="text-sm font-black text-slate-800 italic font-serif flex items-center justify-center gap-2 lowercase">
                    <motion.span animate={isPinValid ? { rotateY: 180, scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.4 }}>
                      {isPinValid ? <Unlock size={18} className="text-emerald-500" /> : <Lock size={18} className="text-slate-300" />}
                    </motion.span>
                    auth_pin
                  </h3>
                  <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-colors">
                    <X size={18} />
                  </button>
               </div>

              <motion.div 
                animate={isShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex justify-center gap-2.5"
              >
                {[...Array(profile?.transfer_pin?.length || 4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-11 h-11 rounded-2xl border-2 flex items-center justify-center transition-all duration-300",
                      pinEntry.length > i 
                        ? (isShake ? "border-red-500 bg-red-50" : "border-slate-800 bg-slate-800") 
                        : "border-slate-100 bg-slate-50"
                    )}
                  >
                    <motion.div 
                      animate={{ scale: pinEntry.length > i ? 1 : 0 }}
                      className={cn("w-2.5 h-2.5 rounded-full", isShake ? "bg-red-500" : "bg-white")} 
                    />
                  </div>
                ))}
              </motion.div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    disabled={num === ''}
                    onClick={() => {
                      if (num === 'del') {
                        setPinEntry(prev => prev.slice(0, -1));
                      } else if (typeof num === 'number' && pinEntry.length < (profile?.transfer_pin?.length || 4)) {
                        const newVal = pinEntry + num;
                        setPinEntry(newVal);
                        if (newVal.length === (profile?.transfer_pin?.length || 4)) {
                          handleEntryTrigger(newVal);
                        }
                      }
                    }}
                    className={cn(
                      "h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-all active:scale-90",
                      num === '' ? "invisible" : "bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-100/50 shadow-sm"
                    )}
                  >
                    {num === 'del' ? <X size={14} className="text-slate-400" /> : num}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 pt-2">
                <button 
                  onClick={() => setStep('forgot-pin')}
                  className="text-[9px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                >
                  Forgot Security PIN?
                </button>
                {isSubmitting && (
                   <div className="flex items-center gap-1.5 grayscale opacity-50">
                    <RefreshCw size={10} className="animate-spin" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em]">Authenticating</span>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-2 mb-2">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  {step === 'setup-init' ? 'Initialize PIN' : step === 'forgot-pin' ? 'Override Security' : 'Confirm Protocol'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Verify account password to {step === 'forgot-pin' ? 'reset' : 'secure'} your node.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Verification Required"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-800 outline-none focus:border-slate-800 transition-all"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institutional PIN (4 digits)</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-center text-xl font-black tracking-[0.5em] focus:border-slate-800 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Identity PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-center text-xl font-black tracking-[0.5em] focus:border-slate-800 outline-none transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle size={12} />
                    {error}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button 
                  disabled={!password || newPin.length < 4 || newPin !== confirmPin || isSubmitting}
                  onClick={handleSetup}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-20"
                >
                  {isSubmitting ? 'Verifying Neural Link...' : 'Apply Security Link'}
                </button>
                <button onClick={onClose} className="w-full mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500">Cancel Override</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
