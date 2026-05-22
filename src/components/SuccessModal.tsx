import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  autoClose = true, 
  autoCloseDuration = 3000 
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#0a0d1f] border border-white/10 rounded-[40px] p-10 shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden text-center"
          >
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[80px]" />

            <div className="relative space-y-8">
              {/* Animation Container */}
              <div className="relative w-24 h-24 mx-auto">
                {/* Spinning Loader */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500/30"
                />
                
                {/* Check Circle */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 12 }}
                  className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/20"
                >
                  <Check size={40} className="text-white" />
                </motion.div>

                {/* Pulse Effect */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-purple-500 rounded-full"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-serif text-white">
                  {title}
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />
                <p className="text-aura-muted text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed opacity-70">
                  {message}
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
