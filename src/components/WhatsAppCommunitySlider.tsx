import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  X, 
  MessageSquare, 
  Send, 
  Headphones, 
  Users, 
  Tv, 
  ArrowRight 
} from 'lucide-react';

export default function WhatsAppCommunitySlider() {
  const [position, setPosition] = useState(0); // 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startPosRef = useRef(0);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    startPosRef.current = position;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const thumbWidth = 38; // Match thumb width
    const padding = 8; // 4px padding on left/right of track (p-1 is 4px)
    const maxTravel = containerWidth - thumbWidth - padding - 14; // stops before touching the end edge
    
    if (maxTravel <= 0) return;
    
    const deltaX = clientX - startXRef.current;
    const deltaPercent = (deltaX / maxTravel) * 100;
    
    let newPercent = startPosRef.current + deltaPercent;
    if (newPercent < 0) newPercent = 0;
    if (newPercent > 100) newPercent = 100;
    
    setPosition(newPercent);
    
    if (newPercent >= 96) {
      handleComplete();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (position < 96) {
      // Smooth recoil using requestAnimationFrame
      const startVal = position;
      const startTime = performance.now();
      const animate = (time: number) => {
        const elapsed = time - startTime;
        const duration = 250; // ms
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentVal = startVal * (1 - ease);
        setPosition(currentVal);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setPosition(0);
        }
      };
      requestAnimationFrame(animate);
    }
  };

  const handleComplete = () => {
    setIsDragging(false);
    setPosition(100);
    
    // Open premium popup community options modal
    setIsModalOpen(true);
    
    // Reset the slider automatically back to 0 as requested in "Slider Reset"
    setTimeout(() => {
      setPosition(0);
    }, 400);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };
    const onMouseUp = () => {
      handleEnd();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      handleEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, position]);

  const maxTravelPx = containerRef.current 
    ? containerRef.current.clientWidth - 38 - 8 - 14
    : 0;
  const currentTranslateX = (position / 100) * maxTravelPx;

  // Community links defined in specific order
  const communityOptions = [
    {
      id: 'whatsapp_community',
      title: 'Join WhatsApp Community',
      subtitle: 'Official community chat group',
      icon: <Users className="text-emerald-400" size={18} />,
      badge: '👥 Community',
      link: 'https://chat.whatsapp.com/CoNzUZBmDsDC8bV8nB7uIH?s=cl&p=i&ilr=4',
      theme: 'from-emerald-500/10 to-emerald-500/0 hover:border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'support',
      title: 'Hotline Customer Service',
      subtitle: 'Direct hotline helpdesk support',
      icon: <Headphones className="text-amber-400" size={18} />,
      badge: '🎧 Support',
      link: 'https://wa.me/2347052532095?text=Hello%20Tavari%20Wave%20Network%20Support%2C%20I%20need%20assistance%20regarding%20my%20account.',
      theme: 'from-amber-500/10 to-amber-500/0 hover:border-amber-500/30 text-amber-400',
    },
    {
      id: 'telegram',
      title: 'Telegram Channel',
      subtitle: 'Official broadcast updates & bulletins',
      icon: <Send className="text-blue-400" size={18} />,
      badge: '✈️ Channel',
      link: 'https://t.me/tavariwavenetwork',
      theme: 'from-blue-500/10 to-blue-500/0 hover:border-blue-500/30 text-blue-400',
    },
  ];

  return (
    <div className="w-full relative select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes community-arrow-slide {
          0% { opacity: 0.1; transform: translateX(-4px) scale(0.9); }
          50% { opacity: 0.9; transform: translateX(2px) scale(1.15); }
          100% { opacity: 0.1; transform: translateX(-4px) scale(0.9); }
        }
        @keyframes community-glow-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.45); }
          70% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        @keyframes float-whatsapp {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.05); }
        }
      `}} />

      <div 
        ref={containerRef}
        className="relative h-[48px] w-full rounded-2xl bg-black/60 border border-white/10 p-1 flex items-center overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.8)] backdrop-blur-md"
        style={{ touchAction: 'none' }}
      >
        {/* Glowing Progress Fill */}
        <div 
          className="absolute left-1 top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#031d0f]/60 via-[#15803d]/80 to-[#22c55e]/90 shadow-[0_0_12px_rgba(37,211,102,0.3)] pointer-events-none"
          style={{ 
            width: `${currentTranslateX + 22}px`,
            transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Directional Arrows & Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none gap-1 bg-transparent">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-sans">
            Slide
          </span>
          <div className="flex items-center gap-0.5 opacity-40">
            {[0, 1, 2].map((i) => (
              <svg 
                key={i} 
                className="w-2.5 h-2.5 text-[#25D366]/65 filter drop-shadow-[0_0_2px_rgba(37,211,102,0.5)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
                style={{
                  animation: `community-arrow-slide 1.5s infinite ease-in-out`,
                  animationDelay: `${i * 120}ms`,
                  opacity: Math.max(0.1, 1 - (i * 0.25))
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ))}
          </div>
        </div>

        {/* Premium 3D Drag Thumb */}
        <div 
          style={{
            transform: `translateX(${currentTranslateX}px)`,
            transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            touchAction: 'none'
          }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX);
            }
          }}
          className={cn(
            "w-9.5 h-9.5 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing z-30 select-none relative",
            isDragging ? "scale-105" : "hover:scale-102"
          )}
        >
          {/* Attention Animation & Base */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'radial-gradient(circle at 35% 25%, #4ae380 0%, #25d366 50%, #128c7e 100%)',
              boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 3px 8px rgba(0,0,0,0.5)',
              animation: 'community-glow-pulse 2s infinite ease-in-out, float-whatsapp 3s infinite ease-in-out'
            }}
          />
          
          <div 
            className="absolute top-0.5 left-0.5 right-0.5 h-1/2 rounded-t-xl opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          <svg className="w-4.5 h-4.5 text-white z-10 relative filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.4)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.6 1.45 5.517 0 10.005-4.487 10.008-10.004.002-2.673-1.04-5.185-2.936-7.083-1.895-1.897-4.41-2.94-7.083-2.94-5.522 0-10.01 4.488-10.013 10.007-.001 1.83.483 3.62 1.4 5.21l-.995 3.63 3.733-.98c1.568.855 3.137 1.3 4.29 1.3zm10.742-7.41c-.29-.145-1.713-.846-1.978-.942-.265-.096-.458-.145-.65.145-.193.29-.747.942-.916 1.133-.169.191-.338.216-.628.072-.29-.145-1.226-.452-2.335-1.442-.863-.77-1.446-1.72-1.615-2.01-.17-.29-.018-.447.127-.59.13-.13.29-.338.434-.507.145-.17.193-.29.29-.483.097-.193.048-.361-.024-.507-.072-.145-.65-1.566-.89-2.145-.236-.57-.474-.492-.65-.5-.169-.008-.362-.01-.555-.01-.193 0-.506.072-.77.362-.265.29-1.012.99-1.012 2.417 0 1.425 1.036 2.802 1.18 2.995.145.193 2.036 3.11 4.933 4.364.688.298 1.225.476 1.644.609.693.22 1.324.19 1.823.115.556-.084 1.713-.699 1.954-1.374.24-.675.24-1.253.169-1.374-.07-.12-.264-.191-.555-.337z"/>
          </svg>
        </div>

        {/* Target end pocket */}
        <div className="absolute right-1 w-9.5 h-9.5 rounded-xl border border-dashed border-white/20 flex items-center justify-center bg-black/50 overflow-hidden select-none pointer-events-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-4 h-4 text-white/20 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.1-1.1" />
            </svg>
          </div>
        </div>
      </div>

      {/* PREMIUM GLASSMORPHISM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#090d16]/90 border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Grid Background Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              {/* Floating ambient glow spheres */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight uppercase">Join Our Community</h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Verified Access Nodes</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Options List */}
              <div className="relative space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {communityOptions.map((opt) => (
                  <a
                    key={opt.id}
                    href={opt.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Allow popup to stay intact, closing on interaction is neat or keep open.
                      // The prompt says "After opening, the homepage remains intact. No page refresh. No navigation away."
                      // We will keep the modal open or close it gracefully, but do NOT reload. Let's close modal or keep open.
                    }}
                    className={cn(
                      "group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-gradient-to-r transition-all duration-300 relative overflow-hidden",
                      opt.theme
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Icon wrapper */}
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {opt.icon}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">
                            {opt.title}
                          </span>
                          <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                            {opt.badge.split(' ')[1] || opt.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {opt.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>

              {/* Policy/Footer Notice */}
              <p className="relative text-[9px] text-slate-500 text-center font-semibold tracking-wider uppercase mt-5">
                🔒 Secured via Tavari wave network protocol
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
