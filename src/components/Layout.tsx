import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Globe, 
  Sun, 
  Moon, 
  Home, 
  PlusCircle, 
  BarChart3, 
  HelpCircle, 
  User,
  TrendingUp,
  Settings as SettingsIcon,
  ChevronDown,
  Lock,
  Trophy,
  Users,
  Info,
  Zap,
  MessageCircleQuestion,
  MessageSquarePlus,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowLeft,
  ArrowRightLeft,
  Gift,
  Coins,
  Headset,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import TransferModal from './TransferModal';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import MarketTicker from './MarketTicker';
import Footer from './Footer';

// --- SUB-COMPONENTS ---
// ... (SidebarItem, SidebarSubItem, BottomNavItem remain same)

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  isExpanded?: boolean;
}

function SidebarItem({ icon, label, active, onClick, children, isExpanded }: SidebarItemProps) {
  return (
    <div className="flex flex-col" style={{ transform: 'translateZ(0)' }}>
      <button 
        onClick={onClick}
        className={cn(
          "flex items-center justify-between w-full p-4 lg:p-3 rounded-xl transition-all duration-200 group text-left",
          active 
            ? "bg-aura-lime text-aura-black" 
            : "text-aura-muted hover:text-white hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn("transition-transform group-hover:scale-110", active ? "text-aura-black" : "text-aura-muted group-hover:text-aura-lime")}>
            {icon}
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider">{label}</span>
        </div>
        {children && (
          <ChevronDown 
            size={16} 
            className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
          />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 mt-1 pl-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarSubItem({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 lg:p-2 rounded-lg text-xs font-medium uppercase tracking-widest transition-all",
        active ? "text-aura-lime" : "text-aura-muted hover:text-white"
      )}
    >
      <ChevronRight size={12} className={active ? "text-aura-lime" : "text-aura-muted"} />
      {label}
    </button>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  gradientId?: string;
  glowColor?: string;
  isProfile?: boolean;
  profilePhoto?: string;
}

function BottomNavItem({ icon, label, active, onClick, gradientId, glowColor, isProfile, profilePhoto }: NavItemProps) {
  return (
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center justify-center flex-1 h-full py-1.5 z-10 transition-all duration-300 cursor-pointer"
    >
      {/* Light background glow when active */}
      <AnimatePresence>
        {active && (
          <motion.div
            layoutId={`glow-${gradientId}`}
            className="absolute inset-[15%] rounded-2xl opacity-10 blur-md -z-10 pointer-events-none"
            style={{ backgroundColor: glowColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.12, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </AnimatePresence>

      {/* Floating Icon Wrapper */}
      <motion.div 
        animate={{ 
          y: active ? -4 : 0,
          scale: active ? 1.08 : 1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "relative p-2 rounded-xl flex items-center justify-center transition-all duration-300",
          active 
            ? "bg-white/[0.04] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.35)]" 
            : "bg-transparent border border-transparent"
        )}
        style={{
          boxShadow: active ? `0 4px 15px -3px ${glowColor}30, 0 0 10px -1px ${glowColor}20` : 'none'
        }}
      >
        {isProfile ? (
          <div className={cn(
            "w-5 h-5 rounded-full overflow-hidden border transition-all duration-300 relative flex-shrink-0",
            active ? "border-[#CCFF00]" : "border-white/20"
          )}>
            <img 
              src={profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=nexus`} 
              alt={label} 
              className="w-full h-full object-cover animate-none" 
            />
          </div>
        ) : React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, { 
              size: 20,
              stroke: active && gradientId ? `url(#${gradientId})` : "currentColor",
              className: cn(
                "transition-all duration-300", 
                active ? "text-white animate-pulse" : "text-white/40"
              )
            })
          : icon}
        
        {/* Subtle dot beneath active icon */}
        {active && (
          <motion.div
            layoutId={`dot-${gradientId}`}
            className="absolute -bottom-1 w-1 h-1 rounded-full pointer-events-none"
            style={{ backgroundColor: glowColor }}
          />
        )}
      </motion.div>

      {/* Label */}
      <span className={cn(
        "text-[9px] font-semibold transition-all duration-300 tracking-wide mt-1 select-none", 
        active 
          ? "text-white opacity-100 font-extrabold" 
          : "text-white/45 opacity-100 hover:text-white"
      )}>
        {label}
      </span>
    </motion.button>
  );
}

// --- MAIN LAYOUT COMPONENT ---

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: any;
}

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isTransferModalOpen, openTransferModal, closeTransferModal, isDistractionFree, mrBActivationPopup, setMrBActivationPopup, requestPopup, closePopup } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDark = true;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global Adverts System Hooks
  const [layoutAdverts, setLayoutAdverts] = useState<any[]>([]);
  const [activeLayoutAd, setActiveLayoutAd] = useState<any | null>(null);

  const [showTelegramPopup, setShowTelegramPopup] = useState(false);

  // Referral Invite & Real-time Claim Popups State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activePendingClaims, setActivePendingClaims] = useState<any[]>([]);
  const [showClaimToast, setShowClaimToast] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Investment Promo State
  const [showInvestPromoModal, setShowInvestPromoModal] = useState(false);
  const [promoTriggered, setPromoTriggered] = useState(false);

  const handleCopyLink = () => {
    const code = profile?.referral_code || '';
    const link = code ? `${window.location.origin}/signup?ref=${code}` : `${window.location.origin}/signup`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Referral invitation link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Trigger modal on login or page refresh event
  useEffect(() => {
    if (!user) return;
    const hasTriggeredThisSession = sessionStorage.getItem('referral_invite_popup_triggered');
    if (!hasTriggeredThisSession) {
      sessionStorage.setItem('referral_invite_popup_triggered', 'true');
      const timer = setTimeout(() => {
        requestPopup('referral-invite', () => setShowInviteModal(true), () => setShowInviteModal(false));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, requestPopup]);

  // Trigger investment promotion modal after login or page refresh with randomized delay (2s to 10s)
  useEffect(() => {
    if (!user || promoTriggered) return;
    setPromoTriggered(true);
    
    // Choose randomly from standard delay options: 2s, 3s, 4s, 5s, 7s, 8s, 10s
    const delayOptions = [2000, 3000, 4000, 5000, 7000, 8000, 10000];
    const selectedDelay = delayOptions[Math.floor(Math.random() * delayOptions.length)];
    
    const timer = setTimeout(() => {
      requestPopup('investment-promo', () => setShowInvestPromoModal(true), () => setShowInvestPromoModal(false));
    }, selectedDelay);
    
    return () => clearTimeout(timer);
  }, [user, promoTriggered, requestPopup]);

  // Trigger modal on every visit to the Reward page with randomized delay
  useEffect(() => {
    if (location.pathname === '/rewards') {
      const delays = [1500, 2000, 3000, 5000, 9000, 10000];
      const randomDelay = delays[Math.floor(Math.random() * delays.length)];
      const timer = setTimeout(() => {
        requestPopup('referral-invite', () => setShowInviteModal(true), () => setShowInviteModal(false));
      }, randomDelay);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, requestPopup]);

  // Listen to Firestore real-time 'referral_claims' and trigger top-right popup toast
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'referral_claims'),
      where('user_id', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claims: any[] = [];
      snapshot.forEach(docSnap => {
        claims.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActivePendingClaims(claims);
      
      if (claims.length > 0) {
        // Automatically surface claims to the user immediately as a floating premium popup/toast
        const latestReferrerClaim = claims.find(c => c.type === 'referrer') || claims[0];
        if (latestReferrerClaim) {
          requestPopup(`mr-a-reward-${latestReferrerClaim.id}`, () => setShowClaimToast(latestReferrerClaim), () => setShowClaimToast(null));
        }
      } else {
        setShowClaimToast(null);
      }
    }, (err) => {
      console.error("Error listening to referral claims in layout:", err);
    });
    return () => unsubscribe();
  }, [user, requestPopup]);

  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    const nowLocalDate = [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getDate()).padStart(2, '0')].join('-');
    const closedKey = `telegramPopupClosedDate_${userId}`;
    const closedDate = localStorage.getItem(closedKey);
    
    // Popup should trigger randomly between 15s–45s
    if (closedDate !== nowLocalDate) {
      const randomTimeMs = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
      const timer = setTimeout(() => {
        if (localStorage.getItem(closedKey) !== nowLocalDate) {
          requestPopup('telegram', () => setShowTelegramPopup(true), () => setShowTelegramPopup(false));
         }
      }, randomTimeMs);
      
      return () => clearTimeout(timer);
    }
  }, [user, requestPopup]);

  const handleCloseTelegram = () => {
    if (user) {
      const nowLocalDate = [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getDate()).padStart(2, '0')].join('-');
      localStorage.setItem(`telegramPopupClosedDate_${user.uid}`, nowLocalDate);
    }
    closePopup('telegram');
  };

  // --- GLOBAL ADVERTS SUBSCRIPTION & OBSERVER SYSTEM ---
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'adverts'), (snap) => {
      if (snap.exists()) {
        setLayoutAdverts(snap.data().adverts || []);
      }
    }, (err) => {
      console.warn("Global layout adverts block loading failed:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (layoutAdverts.length === 0) {
      setActiveLayoutAd(null);
      return;
    }

    const currentPath = location.pathname;

    const matchingAd = layoutAdverts.find(ad => {
      if (ad.active === false) return false;

      const now = new Date().getTime();
      if (ad.scheduling?.startDate) {
        const start = new Date(ad.scheduling.startDate).getTime();
        if (now < start) return false;
      }
      if (ad.scheduling?.endDate) {
        const end = new Date(ad.scheduling.endDate).getTime();
        if (now > end) return false;
      }

      const targetingType = ad.pageTargeting?.type || 'all';
      let pageMatches = false;
      if (targetingType === 'all') {
        pageMatches = true;
      } else if (targetingType === 'dashboard' && currentPath === '/dashboard') {
        pageMatches = true;
      } else if (targetingType === 'rewards' && currentPath === '/rewards') {
        pageMatches = true;
      } else if (targetingType === 'invest' && currentPath === '/invest') {
        pageMatches = true;
      } else if (targetingType === 'profile' && currentPath === '/profile') {
        pageMatches = true;
      } else if (targetingType === 'fund' && currentPath === '/fund') {
        pageMatches = true;
      } else if (targetingType === 'custom' && ad.pageTargeting?.customPath === currentPath) {
        pageMatches = true;
      }

      if (!pageMatches) return false;

      const frequency = ad.scheduling?.type || 'every-refresh';
      const userId = user?.uid || 'guest';
      const dismissedKey = `adv_dismissed_${ad.id}_${userId}`;
      const shownSessionKey = `adv_shown_session_${ad.id}`;

      if (frequency === 'once-daily') {
        const dismissedToday = localStorage.getItem(dismissedKey);
        const todayStr = new Date().toDateString();
        if (dismissedToday === todayStr) return false;
      } else if (frequency === 'every-login') {
        const shownInSession = sessionStorage.getItem(shownSessionKey);
        if (shownInSession === 'true') return false;
      } else if (frequency === 'custom-interval') {
        const dismissedIntervalAt = localStorage.getItem(dismissedKey);
        if (dismissedIntervalAt) {
          const mSecsElapsed = now - Number(dismissedIntervalAt);
          const intervalMs = (ad.scheduling?.intervalMinutes || 30) * 60 * 1000;
          if (mSecsElapsed < intervalMs) return false;
        }
      } else if (frequency === 'every-refresh') {
        const dismissedRefresh = sessionStorage.getItem(`adv_dismissed_ref_${ad.id}`);
        if (dismissedRefresh === 'true') return false;
      }

      return true;
    });

    if (matchingAd) {
      requestPopup(
        `global-advert-${matchingAd.id}`, 
        () => setActiveLayoutAd(matchingAd), 
        () => setActiveLayoutAd(null)
      );
    } else {
      setActiveLayoutAd(null);
    }
  }, [layoutAdverts, location.pathname, user?.uid, requestPopup]);

  const handleDismissLayoutAd = (ad: any) => {
    const userId = user?.uid || 'guest';
    const frequency = ad.scheduling?.type || 'every-refresh';
    const dismissedKey = `adv_dismissed_${ad.id}_${userId}`;
    const shownSessionKey = `adv_shown_session_${ad.id}`;

    if (frequency === 'once-daily') {
      const todayStr = new Date().toDateString();
      localStorage.setItem(dismissedKey, todayStr);
    } else if (frequency === 'every-login') {
      sessionStorage.setItem(shownSessionKey, 'true');
    } else if (frequency === 'custom-interval') {
      localStorage.setItem(dismissedKey, String(new Date().getTime()));
    } else if (frequency === 'every-refresh') {
      sessionStorage.setItem(`adv_dismissed_ref_${ad.id}`, 'true');
    }

    closePopup(`global-advert-${ad.id}`);
    setActiveLayoutAd(null);
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  // Scroll detection for compact header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTab = location.pathname.substring(1) || 'dashboard';
  const showFooterPaths = ['/home', '/', '/markets', '/nodes', '/pools', '/neural-analytics', '/terms', '/privacy', '/cookies', '/aml'];
  const showFooter = showFooterPaths.includes(location.pathname);
  const isInternalApp = ['/dashboard', '/invest', '/fund', '/settings', '/profile', '/help', '/notifications'].some(path => location.pathname.startsWith(path));

  // Determine if we should show a back button
  const showBackButton = !['/home', '/dashboard'].includes(location.pathname) && !(isMobile && location.pathname === '/token');
  const isFullBleedPage = ['/about', '/how-it-works', '/faq', '/rewards', '/token'].includes(location.pathname);

  // Real-time notifications
  useEffect(() => {
    if (!user || !profile) return;

    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(items);
    }, (error) => {
      console.warn("Notifications listener blocked or failed:", error.message);
    });

    const unreadQ = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeUnread = onSnapshot(unreadQ, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.warn("Unread count listener blocked or failed:", error.message);
    });

    return () => {
      unsubscribe();
      unsubscribeUnread();
    };
  }, [user, profile]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(target)) {
        setIsExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsLanguageOpen(false);
  };

  const isCipher = profile?.role === 'cipher';
  const isVerified = user?.emailVerified || isCipher;

  if (user && !isVerified) {
    return (
      <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-aura-lime/10 rounded-full flex items-center justify-center border border-aura-lime/20 animate-pulse">
          <CheckCircle2 size={40} className="text-aura-lime" />
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Verification Pending</h1>
          <p className="text-aura-muted text-sm font-medium leading-relaxed">
            Your account has been detected but your email address <span className="text-white">({user.email})</span> is not yet verified. 
            Access to terminal assets and investments is restricted until verification is complete.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
             onClick={() => window.location.reload()}
             className="w-full py-4 bg-aura-lime text-aura-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 transition-all"
          >
            I have verified my email
          </button>
          <button 
             onClick={() => logout()}
             className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all"
          >
            Logout session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-500",
      isDark ? "bg-aura-black text-white" : "bg-aura-paper text-aura-black"
    )}>
      {/* --- TOP NAVBAR --- */}
      <nav className={cn(
        "sticky top-4 z-[100] mx-4 lg:mx-8 flex items-center px-6 backdrop-blur-2xl transition-all duration-500 rounded-[24px] border shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        isScrolled ? "h-14 py-2 mt-2" : "h-16 lg:h-20 mt-4",
        isDark 
          ? "bg-white/[0.03] border-primary/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
          : "bg-white/70 border-primary/20",
        // Mobile visibility logic
        ((location.pathname === '/home' || location.pathname === '/token') && !isDistractionFree) ? "flex" : "hidden lg:flex",
        isDistractionFree && "hidden lg:hidden"
      )}>
        {/* Left: Back Button or Menu */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1 lg:flex-none">
          {isMobile && location.pathname === '/token' ? (
            <motion.button 
              whileHover={{ x: -2 }}
              onClick={() => navigate('/home')}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 group",
                isDark ? "hover:bg-white/5 text-aura-muted hover:text-white" : "hover:bg-aura-black/5 text-aura-muted hover:text-aura-black"
              )}
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : showBackButton ? (
            <motion.button 
              whileHover={{ x: -2 }}
              onClick={() => navigate(-1)}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 group",
                isDark ? "hover:bg-white/5 text-aura-muted hover:text-white" : "hover:bg-aura-black/5 text-aura-muted hover:text-aura-black"
              )}
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-2 rounded-xl transition-colors lg:hidden",
                isDark ? "hover:bg-white/5" : "hover:bg-aura-black/5"
              )}
            >
              <Menu size={24} />
            </button>
          )}

          <Link to="/home" className={cn(
            "flex items-center gap-3 transition-all duration-500",
            isScrolled ? "scale-90" : "scale-100"
          )}>
            <div className="relative group">
              <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-10 lg:h-12 w-auto object-contain brightness-110" />
              <div className="absolute inset-0 bg-aura-lime/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl lg:text-2xl font-black tracking-tighter uppercase leading-none hidden sm:inline italic font-serif">Wave</span>
          </Link>
        </div>

        {/* Center: Desktop Nav Links */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2">
          {[
            { label: 'Home', path: '/home' },
            { label: 'Invest', path: '/invest' },
            { label: 'Deposit', path: '/fund' },
            { label: 'TWN Token', path: '/token' },
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'About', path: '/about' },
            { label: 'FAQ', path: '/faq' },
            { label: 'Help', path: '/help' },
          ].map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap group",
                  isActive 
                    ? "text-aura-lime shadow-[0_0_15px_rgba(204,255,0,0.1)]" 
                    : "text-aura-muted hover:text-white"
                )}
              >
                <span className="relative z-10 transition-all group-hover:tracking-[0.3em]">{t(item.label)}</span>
                {isActive && (
                  <motion.div 
                    layoutId="top-nav-active"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-aura-lime/0 via-aura-lime/5 to-aura-lime/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </button>
            );
          })}

          {/* Explore Dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => setIsExploreOpen(!isExploreOpen)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 group",
                isExploreOpen ? "text-white bg-white/5 border border-white/10" : "text-aura-muted hover:text-white"
              )}
            >
              <span className="group-hover:tracking-[0.3em] transition-all">Explore</span>
              <ChevronDown size={14} className={cn("transition-transform duration-300", isExploreOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isExploreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={cn(
                    "absolute top-full right-0 mt-4 w-52 rounded-[24px] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110] overflow-hidden backdrop-blur-3xl p-2",
                    isDark ? "bg-[#0a0d1f]/90 border-white/10" : "bg-white/90 border-aura-line"
                  )}
                >
                  <div className="space-y-1">
                    {[
                      { label: 'Partners', path: '/partners', icon: <Users size={14} /> },
                      { label: 'Top Investors', path: '/top-investors', icon: <Trophy size={14} /> },
                      { label: 'Reviews', path: '/reviews', icon: <MessageSquarePlus size={14} /> },
                      { label: 'Reward', path: '/rewards', icon: <Gift size={14} /> },
                    ].map((subItem) => (
                      <button
                        key={subItem.path}
                        onClick={() => {
                          handleNavigation(subItem.path);
                          setIsExploreOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-[16px] text-[10px] font-black uppercase tracking-[0.2em] transition-all group",
                          location.pathname === subItem.path 
                            ? "bg-aura-lime text-aura-black shadow-lg shadow-aura-lime/20" 
                            : "text-aura-muted hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className="group-hover:scale-110 transition-transform">{subItem.icon}</span>
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          <div className="relative" ref={languageRef}>
            <button 
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-lg hover:bg-white/[0.08] hover:border-white/10 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95 text-xl"
              title="Select Language"
            >
              {LANGUAGES.find(l => l.code === language)?.flag || '🇺🇸'}
            </button>

            <AnimatePresence>
              {isLanguageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ willChange: 'transform, opacity' }}
                  className={cn(
                    "absolute top-full right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl",
                    isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line"
                  )}
                >
                  <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar space-y-0.5">
                    {LANGUAGES.map((lang) => (
                      <button 
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setIsLanguageOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                          language === lang.code 
                            ? "bg-aura-lime text-aura-black shadow-lg shadow-aura-lime/20" 
                            : isDark ? "text-aura-muted hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-black hover:bg-black/5"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base select-none">{lang.flag}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider">{lang.name}</span>
                        </div>
                        {language === lang.code && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => handleNavigation('/help')}
            className="p-2 text-aura-muted hover:text-aura-lime transition-colors"
          >
            <Headset size={20} />
          </button>

          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-aura-muted hover:text-aura-lime relative transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-aura-lime rounded-full border-2 border-aura-black animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ willChange: 'transform, opacity' }}
                  className={cn(
                    "absolute top-full right-0 mt-2 w-80 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl",
                    isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line"
                  )}
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t('notifications')}</p>
                    <Link 
                      to="/notifications" 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[9px] font-bold uppercase tracking-widest text-aura-lime hover:underline"
                    >
                      {t('view_all')}
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={24} className="mx-auto text-aura-muted/20 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-aura-muted">{t('no_notifications')}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={async () => {
                            if (!n.read) {
                              await updateDoc(doc(db, 'notifications', n.id), { read: true });
                            }
                            handleNavigation('/notifications');
                          }}
                          className={cn(
                            "p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 last:border-0",
                            !n.read ? "bg-aura-lime/5" : "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h5 className="text-[11px] font-bold text-white truncate">{n.title}</h5>
                            <span className="text-[8px] font-medium text-aura-muted whitespace-nowrap">
                              {n.created_at ? formatDistanceToNow(
                                n.created_at.seconds ? new Date(n.created_at.seconds * 1000) : 
                                typeof n.created_at.toDate === 'function' ? n.created_at.toDate() :
                                new Date(n.created_at), 
                                { addSuffix: true }
                              ) : 'now'}
                            </span>
                          </div>
                          <p className="text-[10px] text-aura-muted line-clamp-2 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative hidden lg:block" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-aura-lime cursor-pointer hover:scale-110 transition-all duration-300 ring-2 ring-transparent hover:ring-aura-lime/20"
            >
              <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} alt="Profile" className="w-full h-full object-cover" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute top-full right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl",
                    isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line"
                  )}
                >
                  <div className="p-4 border-b border-white/5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-aura-muted mb-1">{t('authenticated_as')}</p>
                    <p className="text-sm font-bold text-white truncate">{profile?.name || 'Nexus User'}</p>
                    <p className="text-[8px] font-mono text-aura-muted truncate">@{profile?.username || 'user'}</p>
                  </div>
                  <div className="p-2">
                    <div className="flex gap-2 p-3">
                      <button 
                        onClick={() => handleNavigation('/dashboard')}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all border border-white/5 hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/10 group"
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:scale-110 transition-transform">
                          <LayoutDashboard size={18} className="text-indigo-400" />
                        </div>
                        {t('dashboard')}
                      </button>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          openTransferModal();
                        }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all border border-white/5 hover:border-pink-500/30 shadow-lg hover:shadow-pink-500/10 group"
                      >
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:scale-110 transition-transform">
                          <ArrowRightLeft size={18} className="text-purple-400" />
                        </div>
                        Transfer
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center gap-3 w-full p-3 rounded-lg text-xs font-bold uppercase tracking-widest text-aura-muted hover:text-aura-lime hover:bg-white/5 transition-all"
                    >
                      <User size={14} />
                      {t('profile')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* --- TICKER BAR --- */}
      {(location.pathname === '/home' || location.pathname === '/') && (
        <MarketTicker isDark={isDark} />
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className={cn(
        "flex-1 w-full transition-all duration-500",
        isFullBleedPage 
          ? "py-0 pb-24 lg:pb-8" 
          : (isDistractionFree ? "lg:max-w-7xl lg:mx-auto px-4 lg:px-8 py-4 pb-4" : "lg:max-w-7xl lg:mx-auto px-4 lg:px-8 py-8 pb-24 lg:pb-8")
      )}>
        <Outlet />
      </main>

      {showFooter && <Footer />}

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 h-20 w-full z-[100] flex items-center px-2 backdrop-blur-2xl border-t border-x-0 border-b-0 rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.65)]",
        isDark 
          ? "bg-[#0b0d14]/75 border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
          : "bg-white/85 border-[#a855f7]/15",
        (isDistractionFree || location.pathname === '/token' || location.pathname.startsWith('/token/')) && "hidden"
      )}>
        {/* SVG definitions for realistic icon linear gradients */}
        <svg className="absolute w-0 h-0" width="0" height="0">
          <defs>
            <linearGradient id="homeIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffb03a" />
              <stop offset="100%" stopColor="#ff7a00" />
            </linearGradient>
            <linearGradient id="fundIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="investIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="tokenIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="rewardIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="meIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative flex w-full h-full items-center justify-between">
          <BottomNavItem 
            icon={<Home />} 
            label={t('home')} 
            active={activeTab === 'home'} 
            onClick={() => handleNavigation('/home')} 
            gradientId="homeIconGrad"
            glowColor="#ff9f0a"
          />
          <BottomNavItem 
            icon={<PlusCircle />} 
            label={t('fund')} 
            active={activeTab === 'fund'} 
            onClick={() => handleNavigation('/fund')} 
            gradientId="fundIconGrad"
            glowColor="#10b981"
          />
          <BottomNavItem 
            icon={<TrendingUp />} 
            label={t('invest')} 
            active={activeTab === 'invest'} 
            onClick={() => handleNavigation('/invest')} 
            gradientId="investIconGrad"
            glowColor="#06b6d4"
          />
          <BottomNavItem 
            icon={<Coins />} 
            label="Token" 
            active={activeTab === 'token'} 
            onClick={() => handleNavigation('/token')} 
            gradientId="tokenIconGrad"
            glowColor="#f59e0b"
          />
          <BottomNavItem 
            icon={<Gift />} 
            label="Reward" 
            active={activeTab === 'rewards'} 
            onClick={() => handleNavigation('/rewards')} 
            gradientId="rewardIconGrad"
            glowColor="#a855f7"
          />
          <BottomNavItem 
            icon={null} 
            isProfile={true}
            profilePhoto={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`}
            label={t('me')} 
            active={activeTab === 'profile'} 
            onClick={() => handleNavigation('/profile')} 
            gradientId="meIconGrad"
            glowColor="#CCFF00"
          />
          
          {/* Animated Indicator Trail */}
          <motion.div 
            layoutId="mobile-nav-indicator"
            className="absolute bottom-1 h-0.5 rounded-full blur-[0.5px] pointer-events-none"
            initial={false}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            style={{ 
              width: `calc(${100 / 6}% - 12px)`,
              left: `calc(${((['home', 'fund', 'invest', 'token', 'rewards', 'profile'].indexOf(activeTab === 'dashboard' ? 'home' : activeTab) >= 0 ? ['home', 'fund', 'invest', 'token', 'rewards', 'profile'].indexOf(activeTab === 'dashboard' ? 'home' : activeTab) : 0) * (100 / 6))}% + 6px)`,
              backgroundColor: 
                activeTab === 'home' ? '#ff9f0a' :
                activeTab === 'fund' ? '#10b981' :
                activeTab === 'invest' ? '#06b6d4' :
                activeTab === 'token' ? '#f59e0b' :
                activeTab === 'rewards' ? '#a855f7' : '#CCFF00',
              boxShadow: 
                activeTab === 'home' ? '0 0 10px #ff9f0a' :
                activeTab === 'fund' ? '0 0 10px #10b981' :
                activeTab === 'invest' ? '0 0 10px #06b6d4' :
                activeTab === 'token' ? '0 0 10px #f59e0b' :
                activeTab === 'rewards' ? '0 0 10px #a855f7' : '0 0 10px rgb(204,255,0)'
            }}
          />
        </div>
      </nav>

      {/* Global Modals */}
      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
      />

      {/* Global Dynamic Adverts Overlay System */}
      <AnimatePresence>
        {activeLayoutAd && (
          <div 
            className={cn(
              "fixed z-[1100] p-4 pointer-events-none flex font-sans",
              activeLayoutAd.position === 'center' && "inset-0 items-center justify-center",
              activeLayoutAd.position === 'top-left' && "top-20 left-4 justify-start items-start",
              activeLayoutAd.position === 'top-right' && "top-20 right-4 justify-end items-start",
              activeLayoutAd.position === 'bottom-left' && "bottom-24 left-4 justify-start items-end lg:bottom-4",
              activeLayoutAd.position === 'bottom-right' && "bottom-24 right-4 justify-end items-end lg:bottom-4",
              activeLayoutAd.position === 'top-center' && "top-20 inset-x-0 justify-center items-start",
              activeLayoutAd.position === 'bottom-center' && "bottom-24 inset-x-0 justify-center items-end lg:bottom-4",
            )}
          >
            {/* Overlay backdrop only if center popup */}
            {activeLayoutAd.position === 'center' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
                onClick={() => handleDismissLayoutAd(activeLayoutAd)}
              />
            )}

            {/* Modal Body Container */}
            <motion.div
              initial={
                activeLayoutAd.popupType === 'bottom-slide' 
                  ? { y: 100, opacity: 0 } 
                  : activeLayoutAd.popupType === 'top-banner' 
                    ? { y: -100, opacity: 0 } 
                    : { scale: 0.9, opacity: 0, y: 15 }
              }
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={
                activeLayoutAd.popupType === 'bottom-slide' 
                  ? { y: 100, opacity: 0 } 
                  : activeLayoutAd.popupType === 'top-banner' 
                    ? { y: -100, opacity: 0 } 
                    : { scale: 0.95, opacity: 0, y: 10 }
              }
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              style={{
                width: activeLayoutAd.width || (activeLayoutAd.size === 'small' ? '290px' : activeLayoutAd.size === 'large' ? '460px' : '380px'),
                height: activeLayoutAd.height || 'auto',
                maxWidth: '92vw'
              }}
              className={cn(
                "relative rounded-[28px] p-6 text-center select-none shadow-[0_25px_60px_rgba(0,0,0,0.8)] border overflow-hidden pointer-events-auto",
                // styles mapping
                activeLayoutAd.styleTemplate === 'glass' && "bg-white/[0.04] backdrop-blur-3xl border-white/10 text-white",
                activeLayoutAd.styleTemplate === 'neon' && "bg-[#0b031c] border-purple-500 text-purple-100 shadow-[0_0_40px_rgba(168,85,247,0.3)]",
                activeLayoutAd.styleTemplate === 'minimal' && "bg-[#111215] border-white/15 text-gray-200",
                activeLayoutAd.styleTemplate === 'brutalist' && "bg-black border-4 border-white text-white font-mono rounded-none",
                activeLayoutAd.styleTemplate === 'warm' && "bg-gradient-to-tr from-[#130d07] to-[#1a100a] border-amber-600/35 text-amber-50",
              )}
            >
              {/* Style Decorations */}
              {activeLayoutAd.styleTemplate === 'neon' && (
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              )}
              {activeLayoutAd.styleTemplate === 'warm' && (
                <div className="absolute top-[-35%] left-[-35%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-3xl" />
              )}

              {/* Close Button Trigger */}
              <button
                onClick={() => handleDismissLayoutAd(activeLayoutAd)}
                className={cn(
                  "absolute top-4 right-4 p-1.5 rounded-full transition-all hover:bg-white/10",
                  activeLayoutAd.styleTemplate === 'brutalist' ? "border border-white bg-black rounded-none" : "bg-white/5 border border-white/5"
                )}
              >
                <X size={14} />
              </button>

              <div className="space-y-5 mt-3">
                {/* Image Banner */}
                {activeLayoutAd.imageUrl && (
                  <div className={cn("overflow-hidden mx-auto", activeLayoutAd.styleTemplate === 'brutalist' ? "border-2 border-white rounded-none w-full h-34" : "rounded-2xl w-full h-34 bg-white/5 border border-white/5")}>
                    <img 
                      referrerPolicy="no-referrer"
                      src={activeLayoutAd.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className={cn(
                    "font-serif tracking-tight font-black uppercase italic leading-tight text-lg",
                    activeLayoutAd.styleTemplate === 'neon' && "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 not-italic font-sans font-extrabold tracking-wide",
                    activeLayoutAd.styleTemplate === 'brutalist' && "font-mono not-italic tracking-normal text-left"
                  )}>
                    {activeLayoutAd.title}
                  </h4>
                  
                  {activeLayoutAd.styleTemplate === 'brutalist' ? (
                    <div className="w-full h-0.5 bg-white" />
                  ) : (
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-aura-lime/30 to-transparent mx-auto" />
                  )}

                  <p className={cn(
                    "text-xs leading-relaxed opacity-75 px-1 pt-2",
                    activeLayoutAd.styleTemplate === 'brutalist' && "font-mono text-left opacity-100 text-xs"
                  )}>
                    {activeLayoutAd.message}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const dest = activeLayoutAd.redirectLink;
                    handleDismissLayoutAd(activeLayoutAd);
                    if (dest) {
                      if (dest.startsWith('http')) {
                        window.open(dest, '_blank');
                      } else {
                        navigate(dest);
                      }
                    }
                  }}
                  className={cn(
                    "w-full py-4 text-[10px] uppercase font-black tracking-widest transition-all shadow-md active:scale-95 cursor-pointer",
                    activeLayoutAd.styleTemplate === 'glass' && "bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10",
                    activeLayoutAd.styleTemplate === 'neon' && "bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-md hover:brightness-110",
                    activeLayoutAd.styleTemplate === 'minimal' && "bg-white/10 text-white rounded-lg hover:bg-white/15",
                    activeLayoutAd.styleTemplate === 'brutalist' && "bg-white text-black border-2 border-white rounded-none hover:bg-black hover:text-white",
                    activeLayoutAd.styleTemplate === 'warm' && "bg-amber-600 text-white rounded-xl hover:bg-amber-500",
                  )}
                >
                  {activeLayoutAd.ctaText || "Continue"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR DRAWER --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" 
              onClick={() => setIsSidebarOpen(false)} 
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ willChange: 'transform' }}
              className={cn(
                "fixed inset-y-0 left-0 w-80 z-[201] shadow-2xl flex flex-col",
                isDark ? "bg-aura-black border-r border-white/10" : "bg-white border-r border-aura-line"
              )}
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-12 lg:h-14 w-auto object-contain" />
                    <span className="text-3xl font-black tracking-tighter uppercase leading-none">Wave</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto lg:overflow-hidden px-4 py-4 scrollbar-hide space-y-1">
                <SidebarItem 
                  icon={<Home size={20} />} 
                  label={t('home')} 
                  active={activeTab === 'home'}
                  onClick={() => handleNavigation('/home')}
                />
                <SidebarItem 
                  icon={<User size={20} />} 
                  label={t('profile')} 
                  active={activeTab === 'profile'}
                  onClick={() => handleNavigation('/profile')}
                />
                <SidebarItem 
                  icon={<LayoutDashboard size={20} />} 
                  label={t('dashboard')} 
                  active={activeTab === 'dashboard'}
                  onClick={() => handleNavigation('/dashboard')}
                />
                <SidebarItem 
                  icon={<PlusCircle size={20} />} 
                  label={t('fund')} 
                  active={activeTab.startsWith('fund')}
                  onClick={() => handleNavigation('/fund')}
                />
                <SidebarItem 
                  icon={<BarChart3 size={20} />} 
                  label={t('invest')} 
                  active={activeTab === 'invest'}
                  onClick={() => handleNavigation('/invest')}
                />
                <SidebarItem 
                  icon={<Gift size={20} />} 
                  label={t('reviews')} 
                  active={activeTab === 'rewards'}
                  onClick={() => handleNavigation('/rewards')}
                />
                
                <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
                  <SidebarItem 
                    icon={<Bell size={20} />} 
                    label={t('notifications')} 
                    active={activeTab === 'notifications'}
                    onClick={() => handleNavigation('/notifications')}
                  />
                  <SidebarItem 
                    icon={<MessageSquarePlus size={20} />} 
                    label={t('reviews')} 
                    active={activeTab === 'reviews'}
                    onClick={() => handleNavigation('/reviews')}
                  />
                  <SidebarItem 
                    icon={<Trophy size={20} />} 
                    label={t('recent_investments')} 
                    active={activeTab === 'top-investors'}
                    onClick={() => handleNavigation('/top-investors')}
                  />
                  <SidebarItem 
                    icon={<Users size={20} />} 
                    label={t('about_us')} 
                    active={activeTab === 'partners'}
                    onClick={() => handleNavigation('/partners')}
                  />
                  <SidebarItem 
                    icon={<HelpCircle size={20} />} 
                    label={t('help')} 
                    active={activeTab === 'help'}
                    onClick={() => handleNavigation('/help')}
                  />
                  <SidebarItem 
                    icon={<Info size={20} />} 
                    label="About" 
                    active={activeTab === 'about'}
                    onClick={() => handleNavigation('/about')}
                  />
                  <SidebarItem 
                    icon={<Zap size={20} />} 
                    label="How it Works" 
                    active={activeTab === 'how-it-works'}
                    onClick={() => handleNavigation('/how-it-works')}
                  />
                  <SidebarItem 
                    icon={<MessageCircleQuestion size={20} />} 
                    label="FAQ" 
                    active={activeTab === 'faq'}
                    onClick={() => handleNavigation('/faq')}
                  />
                  <SidebarItem 
                    icon={<Zap size={20} className="text-purple-400 group-hover:text-purple-300" />} 
                    label="TWN Portal" 
                    active={activeTab === 'token'}
                    onClick={() => handleNavigation('/token')}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- TELEGRAM COMMUNITY POPUP --- */}
      <AnimatePresence>
        {showTelegramPopup && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
            {/* Dim overlay with light blur only (no heavy blur) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
              onClick={handleCloseTelegram}
            />
            
            {/* Light slide up & fade-in container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ ease: "easeOut", duration: 0.35 }}
              className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto select-none overflow-visible z-10"
            >
              {/* Floating Close Button */}
              <button 
                onClick={handleCloseTelegram}
                className="absolute -top-12 right-2 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 p-2 rounded-full transition-all z-[1300] backdrop-blur-[2px] flex items-center justify-center cursor-pointer shadow-md"
              >
                <X size={16} />
              </button>
              
              <a 
                href="https://t.me/tavariwavenetwork" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={handleCloseTelegram}
                className="block outline-none"
              >
                <img 
                  src="https://i.imgur.com/Sgwxias.png" 
                  alt="Join Telegram Community"
                  className="w-full h-auto object-contain rounded-3xl cursor-pointer shadow-lg hover:shadow-purple-500/10 transition-shadow"
                  referrerPolicy="no-referrer"
                />
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ELITE INVITE FRIENDS MODAL --- */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <style>{`
              @keyframes floatMoney1 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-75px) translateX(-45px) scale(1) rotate(-30deg); opacity: 0; }
              }
              @keyframes floatMoney2 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-85px) translateX(45px) scale(1.1) rotate(25deg); opacity: 0; }
              }
              @keyframes floatMoney3 {
                0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-100px) translateX(-5px) scale(0.9) rotate(-15deg); opacity: 0; }
              }
              @keyframes floatMoney4 {
                0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-65px) translateX(25px) scale(0.85) rotate(15deg); opacity: 0; }
              }
            `}</style>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => closePopup('referral-invite')}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-[360px] bg-gradient-to-br from-[#1b1035]/95 via-[#0b0c14]/98 to-[#20092c]/95 border-2 border-purple-500 rounded-[30px] p-6 text-center overflow-visible shadow-[0_25px_60px_rgba(168,85,247,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] select-none"
            >
              {/* Premium Top-Left Brand Logo inside Popup */}
              <div className="absolute top-5 left-6 flex items-center gap-1.5 pointer-events-none select-none">
                <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-4.5 w-auto object-contain brightness-110" />
                <span className="text-[10px] font-serif font-black tracking-tighter uppercase italic leading-none text-white/90">Wave</span>
              </div>

              {/* Overlapping top realistic 3D box plus animated floaters extending outside boundaries */}
              <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-28 h-28 overflow-visible pointer-events-none z-20">
                <div className="absolute inset-2 bg-purple-500/25 rounded-full blur-2xl animate-pulse" />
                
                {/* Embedded Animated Floating Cash / Sparks */}
                <div className="absolute top-8 left-10 text-emerald-400 font-extrabold text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(52,211,153,0.5)] animate-[floatMoney1_3.5s_infinite_linear]">
                  $
                </div>
                <div className="absolute top-6 right-10 text-emerald-300 font-black text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(52,211,153,0.5)] animate-[floatMoney2_3s_infinite_linear_0.6s]">
                  $
                </div>
                <div className="absolute top-10 left-12 select-none pointer-events-none animate-[floatMoney3_4.2s_infinite_linear_1.2s]">
                  <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-[8px] px-1 py-0.5 rounded border border-emerald-400/20 text-white font-mono font-black shadow-lg">
                    $100
                  </div>
                </div>
                <div className="absolute top-8 right-12 text-pink-400 font-black text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(244,114,182,0.4)] animate-[floatMoney4_3.8s_infinite_linear_1.8s]">
                  ✦
                </div>
                <div className="absolute top-4 left-14 text-amber-300 font-extrabold text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.4)] animate-[floatMoney1_4.5s_infinite_linear_0.8s]">
                  ✦
                </div>

                {/* Highly Realistic 3D SVG Gift Box Design */}
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_8px_18px_rgba(168,85,247,0.45)]">
                  <defs>
                    <linearGradient id="goldRib" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFF2AC" />
                      <stop offset="35%" stopColor="#F5B21D" />
                      <stop offset="70%" stopColor="#9E6900" />
                      <stop offset="100%" stopColor="#FFF2AC" />
                    </linearGradient>
                    <linearGradient id="goldTop" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5B21D" />
                      <stop offset="50%" stopColor="#FFF2AC" />
                      <stop offset="100%" stopColor="#9E6900" />
                    </linearGradient>
                    <linearGradient id="boxWallL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="40%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#31108F" />
                    </linearGradient>
                    <linearGradient id="boxWallR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="40%" stopColor="#4338CA" />
                      <stop offset="100%" stopColor="#1E1B4B" />
                    </linearGradient>
                    <linearGradient id="lidGlass" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="40%" stopColor="#D946EF" />
                      <stop offset="100%" stopColor="#701A75" />
                    </linearGradient>
                  </defs>

                  {/* Box Main Body */}
                  <path d="M 15,48 L 50,70 L 50,95 L 15,73 Z" fill="url(#boxWallL)" />
                  <path d="M 85,48 L 50,70 L 50,95 L 85,73 Z" fill="url(#boxWallR)" />
                  
                  {/* Left Face Ribbon */}
                  <path d="M 29,56.5 L 29,81.5 L 35,85.2 L 35,60.2 Z" fill="url(#goldRib)" />
                  {/* Right Face Ribbon */}
                  <path d="M 71,56.5 L 71,81.5 L 65,85.2 L 65,60.2 Z" fill="url(#goldRib)" />

                  {/* Raised Lid Section */}
                  <path d="M 11,46 L 50,68 L 89,46" stroke="#000000" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" />
                  <path d="M 50,44 L 85,24 L 50,8 L 15,24 Z" fill="url(#lidGlass)" />
                  <path d="M 15,24 L 50,44 L 50,50 L 15,30 Z" fill="#9D174D" />
                  <path d="M 85,24 L 50,44 L 50,50 L 85,30 Z" fill="#701A75" />

                  {/* Lid Surface Ribbons */}
                  <polygon points="30,15.5 36,12 70,32 64,35.5" fill="url(#goldRib)" />
                  <polygon points="70,15.5 64,12 30,32 36,35.5" fill="url(#goldRib)" />
                  
                  {/* Lid Side Edge Ribbons */}
                  <polygon points="30,32.8 36,36 36,42 30,38.8" fill="url(#goldTop)" />
                  <polygon points="70,32.8 64,36 64,42 70,38.8" fill="url(#goldTop)" />

                  {/* Glorious Shiny Deluxe Bow Loops */}
                  <path d="M 50,18 C 30,1 21,24 50,18 Z" fill="url(#goldTop)" stroke="#F5B21D" strokeWidth="0.5" />
                  <path d="M 50,18 C 70,1 79,24 50,18 Z" fill="url(#goldTop)" stroke="#F5B21D" strokeWidth="0.5" />
                  {/* Ribbon tails hanging down gracefully */}
                  <path d="M 50,18 Q 39,29 36,42 Q 39,29 50,18 Z" fill="url(#goldTop)" />
                  <path d="M 50,18 Q 61,29 64,42 Q 61,29 50,18 Z" fill="url(#goldTop)" />
                  {/* Center glowing bead */}
                  <circle cx="50" cy="18" r="4.5" fill="#FFF2AC" />
                  <circle cx="48.5" cy="16.5" r="1.5" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Close button with soft transition */}
              <button 
                onClick={() => closePopup('referral-invite')}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-all p-1.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer hover:rotate-90 duration-300"
              >
                <X size={14} />
              </button>

              <div className="mt-11 space-y-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full text-[8px] font-bold text-purple-300 uppercase tracking-widest leading-none">
                  <Gift size={9} className="text-purple-400" /> Executive Program
                </span>
                
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Share the Wave
                </h3>
                
                <p className="text-[11px] text-white/60 leading-relaxed max-w-xs mx-auto">
                  Expand your quantum networking tier. Refer partners and both will receive a premium <span className="text-purple-400 font-extrabold">5% bonus</span> on their first active investment node!
                </p>

                {/* Referral Details Glass Box */}
                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-left space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Referral Code</span>
                    <span className="text-xs font-black text-white tracking-widest">{profile?.referral_code || '---'}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Invitation Link</span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-1.5 pl-2.5">
                      <span className="text-[9px] font-medium text-white/50 truncate flex-1">
                        {profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`}
                      </span>
                      <button 
                        onClick={handleCopyLink}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        {copiedLink ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modernized Luxury Share Grid */}
                <div className="mt-4">
                  <p className="text-[8px] font-bold uppercase text-white/40 tracking-widest mb-2.5">Instant Share Options</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Official WhatsApp style green gradient button */}
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Join Tavari Wave, the elite high-frequency quant node network! Use my invitation code "' + (profile?.referral_code || '') + '" and get an exclusive 5% bonus reward on your first active node:\n' + (profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gradient-to-b from-[#25D366] to-[#1EBE5A] hover:brightness-110 border border-emerald-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
                        <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.76.46 3.48 1.33 5L2 22l5.15-1.35c1.5.82 3.19 1.25 4.85 1.25 5.52 0 10-4.48 10-10S17.52 2 12.004 2zm3.96 13.9c-.21.58-.81 1.07-1.38 1.25-.57.18-1.31.29-3.7-.7a11.9 11.9 0 01-5-4.43c-.87-1.15-1.38-2.54-1.38-3.95 0-1.72.89-2.54 1.25-2.91.24-.25.54-.34.78.34.19.55.77 1.88.84 2.01.07.14.07.29-.02.48l-.51.64c-.16.19-.34.4-.14.73.53.88 1.15 1.57 1.95 2.21.75.6 1.48.96 1.87 1.15.34.16.54.1.73-.13.2-.23.83-.97 1.05-1.3s.44-.27.73-.16c.3.11 1.88.89 2.21 1.05.32.16.54.24.62.38.08.14.08.82-.13 1.4z" />
                      </svg>
                      WhatsApp
                    </a>
                    
                    {/* Official Facebook style blue gradient button */}
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gradient-to-b from-[#1877F2] to-[#1565C0] hover:brightness-110 border border-blue-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </a>
                    
                    {/* Custom Ultimate realistic Share gradient button */}
                    <button 
                      onClick={async () => {
                        const link = profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`;
                        const text = `Join Tavari Wave, the elite high-frequency quant node network! Use my invitation code "${profile?.referral_code || ''}" and get an exclusive 5% bonus reward on your first active node:`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: 'Tavari Wave',
                              text: text,
                              url: link,
                            });
                          } catch (e) {
                            handleCopyLink();
                          }
                        } else {
                          handleCopyLink();
                        }
                      }}
                      className="p-2.5 bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] hover:brightness-110 border border-purple-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-500/10 cursor-pointer active:scale-95"
                    >
                      <Share2 size={22} className="filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)] animate-pulse" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXQUISITE COGNITIVE INVESTMENT PROMOTION POPUP --- */}
      <AnimatePresence>
        {showInvestPromoModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <style>{`
              @keyframes floatCoin1 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-90px) translateX(-35px) scale(1) rotate(-45deg); opacity: 0; }
              }
              @keyframes floatCoin2 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-110px) translateX(40px) scale(1.1) rotate(45deg); opacity: 0; }
              }
              @keyframes floatROI {
                0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-120px) translateX(10px) scale(1); opacity: 0; }
              }
              @keyframes animGlow {
                0%, 100% { filter: drop-shadow(0 0 15px rgba(168,85,247,0.4)); }
                50% { filter: drop-shadow(0 0 30px rgba(236,72,153,0.6)); }
              }
            `}</style>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
              onClick={() => closePopup('investment-promo')}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 50 }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
              className="relative w-full max-w-[360px] bg-gradient-to-br from-[#12072b]/95 via-[#0b0c15]/98 to-[#1f0535]/95 border-2 border-purple-500/80 rounded-[30px] p-6 text-center overflow-visible shadow-[0_30px_70px_rgba(168,85,247,0.4),0_0_40px_rgba(236,72,153,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] select-none"
            >
              {/* Premium Top-Left Brand Logo inside Popup */}
              <div className="absolute top-5 left-6 flex items-center gap-1.5 pointer-events-none select-none">
                <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-4.5 w-auto object-contain brightness-110" />
                <span className="text-[10px] font-serif font-black tracking-tighter uppercase italic leading-none text-white/95">Wave</span>
              </div>

              {/* Overlapping top realistic 3D Vector Globe & Charts with Sparkline floaters */}
              <div className="absolute -top-[55px] left-1/2 -translate-x-1/2 w-28 h-28 overflow-visible pointer-events-none z-20">
                <div className="absolute inset-2 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 rounded-full blur-2xl opacity-40 animate-[animGlow_4s_infinite_ease-in-out]" />
                
                {/* Floating elements inside / around graphics boundary */}
                <div className="absolute top-8 left-6 text-amber-400 font-extrabold text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)] animate-[floatCoin1_3.8s_infinite_linear]">
                  $
                </div>
                <div className="absolute top-4 right-6 text-purple-300 font-black text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(168,85,247,0.5)] animate-[floatCoin2_3.2s_infinite_linear_0.5s]">
                  $
                </div>
                <div className="absolute top-10 left-10 select-none pointer-events-none animate-[floatROI_4.5s_infinite_linear_1.1s]">
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-400/20 text-white font-mono font-black shadow-lg">
                    +2.9% Daily
                  </div>
                </div>
                <div className="absolute top-12 right-12 text-pink-400 font-black text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(244,114,182,0.4)] animate-[floatCoin1_3.5s_infinite_linear_1.8s]">
                  ✦
                </div>

                {/* Highly Luxe Neon Fintech SVG Trend Chart Visualizer */}
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_8px_20px_rgba(236,72,153,0.4)]">
                  <defs>
                    <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="radialHolo" x1="0.5" y1="0.5" r="0.5">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Holographic background sphere */}
                  <circle cx="50" cy="50" r="32" fill="url(#radialHolo)" opacity="0.45" />

                  {/* Outer Orbit Ring with nodes */}
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#A855F7" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                  <circle cx="20" cy="50" r="2" fill="#EC4899" />
                  <circle cx="80" cy="50" r="2.5" fill="#3B82F6" />
                  <circle cx="50" cy="20" r="2" fill="#F5B21D" />

                  {/* Futuristic Core Sphere */}
                  <circle cx="50" cy="50" r="22" fill="#0c0e17" stroke="url(#glowGrad)" strokeWidth="2.5" />
                  
                  {/* Glowing neon graph pattern inside core */}
                  <path d="M 38,58 L 44,48 L 50,52 L 56,40 L 62,44" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Nodes on points */}
                  <circle cx="38" cy="58" r="1.5" fill="#22C55E" />
                  <circle cx="44" cy="48" r="1.5" fill="#22C55E" />
                  <circle cx="50" cy="52" r="1.5" fill="#22C55E" />
                  <circle cx="56" cy="40" r="1.5" fill="#22C55E" />
                  <circle cx="62" cy="44" r="1.5" fill="#22C55E" />

                  {/* Emerging upward green indicator arrow */}
                  <path d="M 62,44 L 62,38 L 56,38" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Digital interface rings */}
                  <circle cx="50" cy="50" r="15" fill="none" stroke="#EC4899" strokeWidth="0.5" strokeDasharray="10 5" opacity="0.8" />
                </svg>
              </div>

              {/* Close button with sweet transition */}
              <button 
                onClick={() => closePopup('investment-promo')}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-all p-1.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer hover:rotate-90 duration-300"
              >
                <X size={14} />
              </button>

              <div className="mt-12 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full text-[8.5px] font-black text-purple-300 uppercase tracking-widest leading-none">
                  <TrendingUp size={10} className="text-pink-400 animate-pulse" /> HIGH-YIELD QUANT NODE
                </span>
                
                <h3 className="text-base font-black text-white uppercase tracking-wide leading-tight max-w-[280px] mx-auto filter drop-shadow-md">
                  Start Your Investment Journey With WAVE Now
                </h3>
                
                <p className="text-[11px] text-white/70 leading-relaxed max-w-[260px] mx-auto font-medium">
                  Utilize artificial neural nodes to execute institutional arbitrage in real-time. <span className="text-purple-400 font-extrabold">Earn up to 2.9% daily returns</span> with secure high-frequency yield.
                </p>

                {/* Features list */}
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-2 mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Automated Yield Compounding</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Instant Profit Claim At Any Hour</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Insured Node Allocation Strategy</span>
                  </div>
                </div>

                {/* Ultimate Premium Call To Action */}
                <button 
                  onClick={() => {
                    closePopup('investment-promo');
                    navigate('/invest');
                  }}
                  className="w-full mt-3 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_24px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Invest Now <ArrowRightLeft size={10} className="ml-1" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PREMIUM REAL-TIME REFERRAL & ACTIVATION POPUPS --- */}
      {/* 1. MR. A REFERRAL REWARD POPUP */}
      <AnimatePresence>
        {showClaimToast && showClaimToast.type === 'referrer' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 md:right-6 max-w-[380px] w-[calc(100vw-32px)] z-[1200] rounded-2xl bg-[#090b10]/90 backdrop-blur-xl border border-purple-500/20 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.3)] p-5 select-none text-left overflow-hidden border-l-4 border-l-purple-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-80" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Trophy size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-semibold text-purple-400 tracking-wider">Referral Reward Active</span>
                  <button 
                    onClick={() => closePopup(`mr-a-reward-${showClaimToast.id}`)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                  Claim Referral Reward
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Your referral <span className="text-purple-300 font-extrabold">{showClaimToast.partner_name}</span> has activated an investment successfully. Claim your referral reward now.
                </p>
                <div className="mt-3.5">
                  <button 
                    onClick={() => {
                      closePopup(`mr-a-reward-${showClaimToast.id}`);
                      navigate('/rewards#referral-rewards');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block"
                  >
                    Claim Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MR. B INVESTMENT ACTIVATION POPUP */}
      <AnimatePresence>
        {mrBActivationPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 md:right-6 max-w-[380px] w-[calc(100vw-32px)] z-[1200] rounded-2xl bg-[#090b10]/95 backdrop-blur-xl border border-emerald-500/20 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.3)] p-5 select-none text-left overflow-hidden border-l-4 border-l-emerald-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Gift size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-semibold text-emerald-400 tracking-wider">Node Active</span>
                  <button 
                    onClick={() => setMrBActivationPopup(null)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                  Investment Plan Activated
                </h4>
                <div className="mt-1.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <p className="text-[10px] text-gray-400">
                    Plan: <span className="text-white font-semibold uppercase">{mrBActivationPopup.planName}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Amount: <span className="text-emerald-400 font-bold font-mono">${mrBActivationPopup.amount.toFixed(2)}</span>
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  You have successfully activated your investment plan. Claim your activation reward now.
                </p>
                <div className="mt-3.5">
                  <button 
                    onClick={() => {
                      setMrBActivationPopup(null);
                      navigate('/rewards#active-node-multipliers');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block"
                  >
                    Claim Reward
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
