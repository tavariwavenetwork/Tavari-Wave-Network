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
  Headset
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
}

function BottomNavItem({ icon, label, active, onClick, gradientId, glowColor }: NavItemProps) {
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
        {React.isValidElement(icon)
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
  const { isTransferModalOpen, openTransferModal, closeTransferModal, isDistractionFree } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showTelegramPopup, setShowTelegramPopup] = useState(false);

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
          setShowTelegramPopup(true);
        }
      }, randomTimeMs);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCloseTelegram = () => {
    if (user) {
      const nowLocalDate = [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getDate()).padStart(2, '0')].join('-');
      localStorage.setItem(`telegramPopupClosedDate_${user.uid}`, nowLocalDate);
    }
    setShowTelegramPopup(false);
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
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-aura-muted hover:text-aura-lime transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
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
        "lg:hidden fixed bottom-4 left-4 right-4 h-20 z-[100] flex items-center px-2 backdrop-blur-2xl border rounded-[24px] shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_15px_rgba(168,85,247,0.04),0_0_20px_rgba(204,255,0,0.03)]",
        isDark 
          ? "bg-[#0b0d14]/75 border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
          : "bg-white/85 border-[#a855f7]/15",
        isDistractionFree && "hidden"
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
            icon={
              <div className={cn(
                "w-6 h-6 rounded-full overflow-hidden border-2 transition-all duration-300 relative",
                activeTab === 'profile' ? "border-[#CCFF00] scale-105 shadow-[0_0_12px_rgba(204,255,0,0.5)]" : "border-white/10"
              )}>
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} 
                  alt="Me" 
                  className="w-full h-full object-cover" 
                />
              </div>
            } 
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
    </div>
  );
}
