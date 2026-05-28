import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Award, FileText, ArrowLeft, CheckCircle2, Lock, Calendar, FileCheck, Building, ChevronRight, Check, ZoomIn, ZoomOut, RotateCcw, X, Move, Maximize } from 'lucide-react';

const ImageWithFallback = ({
  src,
  fallbackSrcs = [],
  alt,
  className = '',
  contain = true,
}: {
  src: string;
  fallbackSrcs?: string[];
  alt: string;
  className?: string;
  contain?: boolean;
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (fallbackIndex < fallbackSrcs.length) {
      setCurrentSrc(fallbackSrcs[fallbackIndex]);
      setFallbackIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[160px] rounded-2xl bg-[#0c0f16] border border-white/5 flex flex-col items-center justify-center p-6 text-center">
        <Shield className="text-gray-500 mb-2 animate-pulse" size={32} />
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={`rounded-2xl transition-all duration-300 ${contain ? 'object-contain' : 'object-cover'} ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};

interface LightboxProps {
  src: string;
  fallbackSrcs: string[];
  alt: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, fallbackSrcs, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleZoomIn = () => setScale(s => Math.min(6, s + 0.5));
  const handleZoomOut = () => {
    setScale(s => {
      const next = Math.max(1, s - 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (scale <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchStartDist;
      
      setScale(s => {
        const next = Math.max(1, Math.min(6, s * (factor > 1 ? 1.05 : 0.95)));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
      setTouchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  const cursorStyle = scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in';
  const transitionStyle = isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl select-none overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="fixed top-4 left-4 right-4 z-[110] max-w-4xl mx-auto flex justify-between items-center bg-gradient-to-r from-[#0c0f16]/95 to-[#040608]/95 border border-white/10 backdrop-blur-2xl px-5 py-3 rounded-2xl shadow-2xl pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-secondary">
            <Shield size={16} />
          </div>
          <div className="text-left font-sans">
            <span className="text-[8px] font-mono tracking-widest text-[#00E5FF] uppercase font-black block">VERIFIED SYSTEM BLUEPRINT</span>
            <span className="text-xs text-white font-bold uppercase tracking-tight line-clamp-1">{alt}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-[10px] font-mono font-black text-gray-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
            ZOOM: {Math.round(scale * 100)}%
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Close Lightbox (ESC)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div 
        className="relative flex items-center justify-center w-full h-full outline-none overflow-hidden"
        onClick={onClose}
      >
        <div 
          className="relative max-w-full max-h-full"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: transitionStyle
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`${cursorStyle} relative select-none max-w-full max-h-full flex items-center justify-center p-4`} onDoubleClick={handleDoubleClick}>
            <ImageWithFallback 
              src={src} 
              fallbackSrcs={fallbackSrcs} 
              alt={alt} 
              contain={true}
              className="max-w-[90vw] max-h-[70vh] sm:max-h-[75vh] w-auto h-auto object-contain rounded-xl select-none shadow-2xl pointer-events-none border border-white/5"
            />
          </div>
        </div>
      </div>

      <div 
        className="fixed bottom-6 z-[110] flex items-center gap-3 bg-[#0c0f16]/95 border border-white/10 backdrop-blur-2xl px-5 py-3 rounded-2xl shadow-2xl pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          disabled={scale <= 1}
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-[11px] font-mono text-white font-black min-w-[44px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          disabled={scale >= 6}
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Reset View (R)"
        >
          <RotateCcw size={16} />
        </button>

        {scale > 1 && (
          <div className="hidden md:flex items-center gap-1 text-[10px] text-[#00E5FF]/80 font-bold ml-2 animate-pulse">
            <Move size={12} /> Drag image to inspect details
          </div>
        )}
      </div>
    </motion.div>
  );
};

type CertificateId = 'opay' | 'cac' | 'efcc';

interface CertificateData {
  id: CertificateId;
  title: string;
  subtitle: string;
  shortDesc: string;
  date: string;
  code: string;
  icon: React.ReactNode;
  themeColor: string;
  glowColor: string;
  borderColor: string;
  imageUrl: string;
  fallbacks: string[];
}

export default function CertificationCompliance() {
  const [selectedCert, setSelectedCert] = useState<CertificateId | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; fallbacks: string[]; alt: string } | null>(null);

  const certificates: CertificateData[] = [
    {
      id: 'opay',
      title: 'OPay Institutional Partnership & Participation',
      subtitle: 'Digital Payment Infrastructure Alignment',
      shortDesc: 'Tavari Wave Network maintains institutional participation alignment and operational partnership engagement with OPay in Nigeria.',
      date: 'Active Ecosystem Integration',
      code: 'OP-PART-2026-9904A',
      icon: <Award className="text-[#00E5FF]" size={24} />,
      themeColor: 'from-[#00E5FF]/10 to-transparent',
      glowColor: 'shadow-[#00E5FF]/5',
      borderColor: 'border-[#00E5FF]/30 hover:border-[#00E5FF]/60',
      imageUrl: 'https://i.imgur.com/n6yUo6L.png',
      fallbacks: [
        'https://i.imgur.com/n6yUo6L.jpg',
        'https://i.imgur.com/n6yUo6L.jpeg',
        'https://i.imgur.com/n6yUo6L.gif'
      ]
    },
    {
      id: 'cac',
      title: 'Corporate Affairs Commission (CAC) Registration',
      subtitle: 'Official Registry Legitimacy',
      shortDesc: 'Tavari Wave Network was officially registered with the Corporate Affairs Commission of Nigeria on April 27, 2026.',
      date: 'April 27, 2026',
      code: 'RC 20260427-1100',
      icon: <Building className="text-secondary" size={24} />,
      themeColor: 'from-secondary/10 to-transparent',
      glowColor: 'shadow-secondary/5',
      borderColor: 'border-secondary/30 hover:border-secondary/60',
      imageUrl: 'https://i.imgur.com/856pxjG.png',
      fallbacks: [
        'https://i.imgur.com/856pxjG.jpg',
        'https://i.imgur.com/856pxjG.jpeg',
        'https://i.imgur.com/856pxjG.gif'
      ]
    },
    {
      id: 'efcc',
      title: 'Economic and Financial Crimes Compliance',
      subtitle: 'Financial Crimes Mitigation Alignment',
      shortDesc: 'Tavari Wave Network maintains compliance-focused operational standards aligned with financial crime prevention frameworks.',
      date: 'March 18, 2026',
      code: 'EFCC-ALIGN-4019-XFX',
      icon: <Shield className="text-emerald-400" size={24} />,
      themeColor: 'from-emerald-400/10 to-transparent',
      glowColor: 'shadow-emerald-400/5',
      borderColor: 'border-emerald-400/30 hover:border-emerald-400/60',
      imageUrl: 'https://i.imgur.com/90JEm4P.png',
      fallbacks: [
        'https://i.imgur.com/90JEm4P.jpg',
        'https://i.imgur.com/90JEm4P.jpeg',
        'https://i.imgur.com/90JEm4P.gif'
      ]
    }
  ];

  const renderVectorCertificate = (id: CertificateId) => {
    switch (id) {
      case 'opay':
        return (
          <div className="w-full relative aspect-[1.4/1] md:aspect-[1.6/1] rounded-3xl bg-gradient-to-br from-[#0c0f16] to-[#040608] border-2 border-[#00E5FF]/30 p-4 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-[#00E5FF]/5">
            {/* Hologram Circle */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 sm:w-20 sm:h-20 rounded-full border border-[#00E5FF]/30 bg-gradient-to-tr from-[#00E5FF]/10 to-transparent flex items-center justify-center animate-pulse">
              <Award className="text-[#00E5FF]/40 sm:size-10" size={20} />
            </div>
            {/* Watermark Logo */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none">
              <img src="https://i.imgur.com/wU33xy3.png" alt="Watermark" className="w-32 h-32 md:w-52 md:h-52 object-contain" />
            </div>

            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-[#00E5FF]">PARTNERSHIP BLUEPRINT</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black italic uppercase text-white tracking-tight leading-tight">
                OPay Partnership Memorandum
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold">
                TAVARI WAVE NETWORK — NIGERIA REGIONAL ONBOARDINGGATE
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 font-mono">
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">INTEGRATION ID</span>
                <span className="text-xs text-white font-black">OP-PART-2026-9904A</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">DEPLOYMENT LEVEL</span>
                <span className="text-[#00E5FF] text-[10px] uppercase font-black">ELITE GATEWAY PROVIDER</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Check className="text-emerald-400" size={10} />
                <span className="text-emerald-400 text-[8px] font-black uppercase">VERIFIED STATUS</span>
              </div>
            </div>
          </div>
        );
      case 'cac':
        return (
          <div className="w-full relative aspect-[1.4/1] md:aspect-[1.6/1] rounded-3xl bg-gradient-to-br from-[#0c0f16] to-[#040608] border-2 border-secondary/30 p-4 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-secondary/5">
            {/* Seal Graphic */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 sm:w-20 sm:h-20 rounded-full border border-secondary/30 bg-gradient-to-tr from-secondary/10 to-transparent flex items-center justify-center animate-pulse">
              <Building className="text-secondary/40 sm:size-10" size={20} />
            </div>
            {/* Watermark Logo */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none">
              <img src="https://i.imgur.com/wU33xy3.png" alt="Watermark" className="w-32 h-32 md:w-52 md:h-52 object-contain" />
            </div>

            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-secondary">REGISTERED CORPORATION</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black italic uppercase text-white tracking-tight leading-tight">
                Certificate of Incorporation
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold">
                CORPORATE AFFAIRS COMMISSION — FEDERAL REPUBLIC OF NIGERIA
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 font-mono">
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">REGISTRATION NO</span>
                <span className="text-xs text-white font-black">RC 20260427-1100</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">DATE OF REGISTRATION</span>
                <span className="text-white text-[10px] uppercase font-black">April 27, 2026</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Check className="text-emerald-400" size={10} />
                <span className="text-emerald-400 text-[8px] font-black uppercase">ACTIVE & REGISTERED</span>
              </div>
            </div>
          </div>
        );
      case 'efcc':
        return (
          <div className="w-full relative aspect-[1.4/1] md:aspect-[1.6/1] rounded-3xl bg-gradient-to-br from-[#0c0f16] to-[#040608] border-2 border-emerald-500/30 p-4 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-emerald-500/5">
            {/* Hologram Circle */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 sm:w-20 sm:h-20 rounded-full border border-emerald-500/30 bg-gradient-to-tr from-emerald-500/10 to-transparent flex items-center justify-center animate-pulse">
              <Shield className="text-emerald-400/40 sm:size-10" size={20} />
            </div>
            {/* Watermark Logo */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none">
              <img src="https://i.imgur.com/wU33xy3.png" alt="Watermark" className="w-32 h-32 md:w-52 md:h-52 object-contain" />
            </div>

            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-emerald-400 font-black">COMPLIANCE FRAMEWORK PROTOCOL</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black italic uppercase text-white tracking-tight leading-tight">
                Economic & Financial Crimes alignment
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold font-sans">
                TAVARI ANTI-FRAUD & AML RISK AUDITING BLUEPRINT
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 font-mono">
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">CRYPTOGRAPHIC KEY ID</span>
                <span className="text-xs text-white font-black">EFCC-ALIGN-4019-XFX</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 uppercase block">APPROVAL RE-SYNC</span>
                <span className="text-white text-[10px] uppercase font-black">March 18, 2026</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Check className="text-emerald-400" size={10} />
                <span className="text-emerald-400 text-[8px] font-black uppercase">COMPLIANCE SECURED</span>
              </div>
            </div>
          </div>
        );
    }
  };

  const getArticleBody = (id: CertificateId) => {
    switch (id) {
      case 'opay':
        return (
          <div className="space-y-8 text-left">
            <section className="space-y-4">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">OPay in Nigeria: A Digital Revolution</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                OPay has completely reshaped the visual map of financial technology and accessibility in Nigeria. Since launching, OPay grew into the infrastructure backbone for micro-payments, peer-to-peer transfers, and instant digital settlements across the state. By offering ultra-low friction gateway transactions, high transaction reliability, and comprehensive mobile wallet frameworks, they have brought critical digital finance tools into the hands of over 40 million consumers and countless private merchants.
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                The role of an institution-grade infrastructure partner like OPay in bridging tech-velocity to standard financial workflows is paramount. Their transactional integrity, rapid response networks, and continuous security layers secure payment pipelines and keep corporate funds flowing in a trusted environment.
              </p>
            </section>

            <section className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <h3 className="text-lg font-black text-[#00E5FF] uppercase italic">WAVE Network Alignment & Commitment</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Under this ecosystem layout, Tavari Wave Network operates with a strict commitment to compliant growth, aligning its liquidity and automated management practices to match the transactional parameters of established platforms.
              </p>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Our active operations and engagement parameters align with OPay rails in Nigeria to support safe corporate capital flows. Our institutional collaboration guarantees that all fiat-to-digital settlements conform to rigorous internal guidelines, preventing unauthorized routing and ensuring absolute platform stability. We do not operate as an independent bank, nor do we claim ownership, custody, or government endorsement of OPay's proprietary systems; rather, we engage with their infrastructure to ensure optimal digital payment transactions under regulated frameworks.
              </p>
            </section>
          </div>
        );

      case 'cac':
        return (
          <div className="space-y-8 text-left">
            <section className="space-y-4">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Governance Legitimacy via CAC</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                In the Federal Republic of Nigeria, corporate legitimacy and public transparency originate from registration with the Corporate Affairs Commission (CAC). Established under the parliamentary Companies and Allied Matters Act, the CAC serves as the sole custodian of company registry, corporate identity, and business compliance standards. Any serious institution looking to deploy structured systems, long-term operations, or local team growth must establish this legal registry.
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                Corporate Affairs registration ensures that companies operate as separate legal entities, binding executives, operations, and services to strict national frameworks of accountability, corporate transparency, and governance.
              </p>
            </section>

            <section className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <h3 className="text-lg font-black text-secondary uppercase italic">Tavari Corporate Incorporation Charter</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Tavari Wave Network has formalized its Nigerian presence through official CAC Registration completed on April 27, 2026. This registration (Registry Number <span className="font-mono text-white text-xs font-black">RC 20260427-1100</span>) demonstrates our long-term institutional deployment goals. By operating as a registered entity, we are committing to Nigerian business transparency, robust corporate governance, and structured operational reporting.
              </p>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Our corporate charter focuses on bridging advanced international computational wealth algorithms with local financial technology structures. We maintain clear financial audits and represent our business operations within established corporate laws, securing the foundation of trust needed for long-term growth.
              </p>
            </section>
          </div>
        );

      case 'efcc':
        return (
          <div className="space-y-8 text-left">
            <section className="space-y-4">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Mitigating Financial Risks</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                The Economic and Financial Crimes Commission (EFCC) stands as Nigeria's premier agency charged with the prevention, investigation, and prosecution of financial irregularities, fraud, and money laundering. As digital asset ecosystems merge with traditional corporate finance, adherence to counter-terrorism financing (CTF) and anti-money laundering (AML) standards is not merely legal, but necessary for structural preservation.
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-bold">
                Modern financial compliance demands active monitoring over passive reaction. Integrity starts at identity verification and extends through algorithmic tracking of transaction nodes, ensuring zero exposure to illicitly sourced capital.
              </p>
            </section>

            <section className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <h3 className="text-lg font-black text-emerald-400 uppercase italic">Anti-Fraud & AML System Standards</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Aligned with these stringent guidelines, Tavari Wave Network has established an internal compliance system designed in direct alignment with international and local anti-money laundering standards. Officially documented on <span className="font-mono text-white text-xs font-black">March 18, 2026</span>, our compliance framework mandates full KYC authentication, sanction-list matching, and automated anomaly-detection on all transactional nodes.
              </p>
              <p className="text-gray-400 text-xs leading-relaxed font-bold">
                Our operations are engineered to monitor risks in real time, block malicious addresses instantly, and protect honest participant pools from fraud, money laundering, and digital assets vulnerability. We operate independently with strict governance, confirming our dedication to corporate legitimacy and lawful financial practices inside Nigeria's business ecosystem. We do not falsely claim federal ownership or regulatory endorsement beyond the active compliance frameworks that govern our secure financial network.
              </p>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-4 md:px-6 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedCert ? (
            <motion.div
              key="main-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* HERO SECTION */}
              <div className="w-full relative rounded-[40px] bg-gradient-to-br from-[#0c0f16]/95 to-[#040608]/98 border border-white/5 p-8 md:p-12 text-center space-y-6 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/5 blur-[80px] rounded-full" />
                
                {/* Visual Security grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center mx-auto animate-pulse">
                  <Shield className="text-secondary" size={32} />
                </div>

                <div className="space-y-3 max-w-2xl mx-auto">
                  <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase">
                    Certification & Compliance
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 font-bold leading-relaxed">
                    Tavari Wave Network operates with strong regulatory alignment, institutional partnerships, and compliance-focused expansion across Nigeria, Africa, Asia, and Europe.
                  </p>
                </div>
              </div>

              {/* COMPLIANCE CERTIFICATES CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert.id)}
                    className={`relative p-6 rounded-3xl bg-gradient-to-b from-[#0c0f16] to-[#040608] border ${cert.borderColor} hover:-translate-y-1.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex flex-col justify-between gap-6 cursor-pointer group shadow-2xl hover:shadow-[0_20px_40px_rgba(124,58,237,0.08),_inset_0_1px_0_rgba(255,255,255,0.05)] select-none`}
                  >
                    {/* Glowing Accent Layer */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cert.themeColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="space-y-4 text-left">
                      {/* Premium card-top image preview container */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ src: cert.imageUrl, fallbacks: cert.fallbacks, alt: cert.title });
                        }}
                        className="w-full aspect-[1.3/1] rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-2 relative group-hover:bg-black/20 group-hover:border-primary/20 transition-all duration-300 cursor-zoom-in group/img-preview"
                      >
                        <ImageWithFallback 
                          src={cert.imageUrl}
                          fallbackSrcs={cert.fallbacks}
                          alt={cert.title}
                          className="w-full h-full object-contain group-hover/img-preview:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img-preview:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg transform scale-90 group-hover/img-preview:scale-100 transition-all duration-300">
                            <Maximize size={12} className="text-[#00E5FF]" /> Zoom
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary group-hover:scale-110 transition-transform">
                          {cert.icon}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:translate-x-1 transition-all duration-300 text-gray-400 group-hover:text-white shadow-sm">
                          <ChevronRight size={12} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                          {cert.title}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">
                          {cert.subtitle}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 font-bold leading-relaxed">
                        {cert.shortDesc}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex justify-between items-center font-mono text-[9px] text-gray-500 font-bold">
                      <span>REF: {cert.code}</span>
                      <span className="text-white bg-white/5 px-2 py-0.5 rounded-full font-black uppercase">VIEW BLUEPRINT</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* NIGERIAN COMMUNITY CONFIDENCE NOTE */}
              <div className="w-full relative rounded-3xl bg-gradient-to-br from-[#0c0f16]/90 to-[#040608]/95 border border-white/5 p-8 text-left space-y-6 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-secondary">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight">
                    A Message to Our Nigerian Community
                  </h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-gray-400 leading-relaxed font-bold">
                  <p>
                    Tavari Wave Network originates from a mature, established global operational background. Historically, our secure algorithmic infrastructure has powered active computational transactions for U.S.-focused clients through our sister portal, <a href="https://cgatrades.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline inline-flex items-center gap-1 font-black">cgatrades.com <span className="text-[10px] font-mono font-normal">↗</span></a>. The CGA Trade framework was tailored to serve U.S. residents, immigrants, and cross-border traders seeking verified neural analytics and trading velocity in U.S. markets.
                  </p>
                  <p>
                    Driven by overwhelming international demand and regional queries across rapid-growth markets, Tavari Wave Network was formally structured to scale these algorithms internationally. We are directly deploying tailored localized structures to support users across Africa, Asia, and Europe.
                  </p>
                  <p>
                    For our Nigerian community, we recognize that secure technology requires absolute legal safety and operational accountability. By registering fully with the Corporate Affairs Commission (CAC), coordinating transaction networks to align with local channels like OPay, and deploying strict risk auditing systems aligned with local protocols (including compliance timelines modeled after EFCC frameworks), we are laying a solid framework for financial technology innovation. We maintain transparency, adhere strictly to all compliance demands, and look forward to scaling this premium security-first ecosystem together under lawful parameters.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:bg-white/10 active:scale-95"
              >
                <ArrowLeft size={14} /> Back to Compliance Home
              </button>

              {/* LARGE CERTIFICATE HERO IMAGE */}
              <div 
                onClick={() => {
                  const targetCert = certificates.find(c => c.id === selectedCert);
                  if (targetCert) {
                    setLightboxImage({ src: targetCert.imageUrl, fallbacks: targetCert.fallbacks, alt: targetCert.title });
                  }
                }}
                className="w-full relative rounded-3xl bg-gradient-to-br from-[#0c0f16] to-[#040608] border border-white/5 p-4 sm:p-8 flex items-center justify-center overflow-hidden shadow-2xl cursor-zoom-in group/hero-preview animate-fade-in"
              >
                {/* Visual Security grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-4xl flex items-center justify-center transition-all duration-500 group-hover/hero-preview:scale-[1.01]">
                  <ImageWithFallback 
                    src={certificates.find(c => c.id === selectedCert)?.imageUrl || ''} 
                    fallbackSrcs={certificates.find(c => c.id === selectedCert)?.fallbacks || []} 
                    alt={certificates.find(c => c.id === selectedCert)?.title || ''} 
                    className="w-full h-auto max-h-[550px] object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                </div>

                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/hero-preview:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-5 py-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl transform scale-90 group-hover/hero-preview:scale-100 transition-all duration-300">
                    <Maximize size={14} className="text-[#00E5FF]" /> Click to Zoom & Inspect Certificate
                  </div>
                </div>
              </div>

              {/* DETAILED ARTICLE CARD */}
              <div className="p-8 sm:p-12 bg-gradient-to-br from-[#0c0f16]/95 to-[#040608]/98 border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="space-y-8">
                  {/* Article Title Area */}
                  <div className="space-y-2 border-b border-white/5 pb-6 text-left">
                    <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.4em] uppercase text-gray-500 font-black block">
                      Compliance Registry Blueprint
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tight leading-tight">
                      {certificates.find(c => c.id === selectedCert)?.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-500 text-[10px] font-black tracking-widest uppercase pt-2">
                      <span>Authority Standard v3.1</span>
                      <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                      <span>Sync Date: {certificates.find(c => c.id === selectedCert)?.date}</span>
                    </div>
                  </div>

                  {/* Dynamic Article Content */}
                  {getArticleBody(selectedCert)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightboxImage && (
          <Lightbox 
            src={lightboxImage.src} 
            fallbackSrcs={lightboxImage.fallbacks} 
            alt={lightboxImage.alt} 
            onClose={() => setLightboxImage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
