import React, { useState, useEffect } from 'react';
import { broadcastActivity } from '../lib/activity_logger';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  collection, 
  where, 
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { 
  getDeviceFingerprint, 
  checkDeviceStatus, 
  registerDevice, 
  generateOTP, 
  sendOTP, 
  verifyOTP,
  logAudit 
} from '../lib/auth_security';
import { EditableText } from './Editable';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  X, 
  Menu,
  Mail, 
  Lock, 
  User, 
  Phone, 
  UserPlus, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronLeft,
  Shield,
  Star,
  Compass,
  Zap
} from 'lucide-react';
import { REVIEWS } from '../constants/landingData';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';

// --- HELPERS ---
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePublicId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const Realistic3DIcon = ({ type }: { type: 'user' | 'plan' | 'fund' | 'node' }) => {
  if (type === 'user') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(124,58,237,0.35)] hover:rotate-6 transition-all duration-500">
        {/* 3D Gold & Glass Shield */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold3d-grad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="30%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="purple3d-grad2" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6D28D9" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#DDD6FE" />
            </linearGradient>
            <radialGradient id="specular-light" cx="30" cy="30" r="30" fx="30" fy="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="35" ry="8" fill="#000000" fillOpacity="0.4" />
          <circle cx="50" cy="46" r="34" stroke="url(#purple3d-grad2)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
          <circle cx="50" cy="32" r="16" fill="url(#gold3d-grad1)" />
          <circle cx="45" cy="27" r="16" fill="url(#specular-light)" />
          <path d="M22 68 C22 56, 32 48, 50 48 C68 48, 78 56, 78 68 L74 74 L26 74 Z" fill="url(#gold3d-grad1)" />
          <path d="M22 68 C22 56, 32 48, 50 48 C68 48, 78 56, 78 68 L74 74 L26 74 Z" fill="url(#specular-light)" opacity="0.4" />
          <path d="M15 46 L50 15 L85 46 L50 82 Z" fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.25" style={{ backdropFilter: 'blur(4px)' }} />
          <path d="M15 46 L50 15 L50 82 Z" fill="#FFFFFF" fillOpacity="0.08" />
        </svg>
      </div>
    );
  }

  if (type === 'plan') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(14,165,233,0.35)] hover:-rotate-6 transition-all duration-500">
        {/* 3D Cyan & Emerald Glass Ledger Stack */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cyan3d-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="emerald3d-grad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="glass-reflection" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="38" ry="7" fill="#000000" fillOpacity="0.5" />
          <path d="M20 62 L50 74 L80 62 L50 50 Z" fill="url(#emerald3d-grad)" />
          <path d="M20 62 L50 74 L50 80 L20 68 Z" fill="#047857" />
          <path d="M50 74 L80 62 L80 68 L50 80 Z" fill="#065F46" />
          <line x1="50" y1="36" x2="50" y2="60" stroke="#0E1E2F" strokeWidth="5" />
          <line x1="50" y1="36" x2="50" y2="60" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="2 2" className="animate-pulse" />
          <path d="M22 34 L50 16 L78 34 L50 52 Z" fill="url(#cyan3d-grad)" fillOpacity="0.85" />
          <path d="M22 34 L50 16 L50 52 Z" fill="url(#glass-reflection)" fillOpacity="0.4" />
          <ellipse cx="50" cy="34" rx="42" ry="12" stroke="#10B981" strokeWidth="2" strokeDasharray="6 12" />
        </svg>
      </div>
    );
  }

  if (type === 'fund') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.35)] hover:scale-110 transition-all duration-500">
        {/* 3D Glossy Gold Coin Chest / Vault Node */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold-bright" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="gold-dark" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="36" ry="8" fill="#000000" fillOpacity="0.5" />
          <path d="M22 64 C22 58, 42 58, 42 64 L42 76 C42 82, 22 82, 22 76 Z" fill="url(#gold-dark)" />
          <ellipse cx="32" cy="64" rx="10" ry="4" fill="url(#gold-bright)" />
          <path d="M58 58 C58 52, 78 52, 78 58 L78 70 C78 76, 58 76, 58 70 Z" fill="url(#gold-dark)" />
          <ellipse cx="68" cy="58" rx="10" ry="4" fill="url(#gold-bright)" />
          <circle cx="50" cy="46" r="22" fill="url(#gold-bright)" />
          <circle cx="50" cy="46" r="14" fill="#111827" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="50" cy="46" r="6" fill="url(#gold-dark)" />
          <path d="M50 36 L50 56 M40 46 L60 46" stroke="url(#gold-bright)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(168,85,247,0.35)] hover:rotate-12 transition-all duration-500">
      {/* 3D Core Fusion Node */}
      <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="purple-core" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          <linearGradient id="neon-glow" x1="0" y1="90" x2="100" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="88" rx="40" ry="8" fill="#000000" fillOpacity="0.5" />
        <ellipse cx="50" cy="46" rx="42" ry="18" stroke="url(#neon-glow)" strokeWidth="3" opacity="0.6" strokeDasharray="30 15" transform="rotate(-15 50 46)" />
        <ellipse cx="50" cy="46" rx="42" ry="18" stroke="url(#neon-glow)" strokeWidth="2" opacity="0.4" strokeDasharray="30 15" transform="rotate(35 50 46)" />
        <circle cx="50" cy="46" r="20" fill="url(#purple-core)" />
        <circle cx="43" cy="39" r="6" fill="#FFFFFF" fillOpacity="0.6" filter="blur(1px)" />
        <circle cx="16" cy="24" r="5" fill="#A855F7" />
        <line x1="50" y1="46" x2="16" y2="24" stroke="#A855F7" strokeWidth="2.5" opacity="0.7" />
        <circle cx="84" cy="24" r="5" fill="#EC4899" />
        <line x1="50" y1="46" x2="84" y2="24" stroke="#EC4899" strokeWidth="2.5" opacity="0.7" />
        <circle cx="50" cy="80" r="5" fill="#3B82F6" />
        <line x1="50" y1="46" x2="50" y2="80" stroke="#3B82F6" strokeWidth="2.5" opacity="0.7" />
      </svg>
    </div>
  );
};

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderLanguageSelector = () => (
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
            className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#11141b]/95 shadow-2xl z-[150] overflow-hidden backdrop-blur-xl"
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
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
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
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [detectedCountry, setDetectedCountry] = useState('us');
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_code) {
          setDetectedCountry(data.country_code.toLowerCase());
          return;
        }
      } catch (err) {
        console.warn("ipapi.co failed, trying fallback country detection:", err);
      }

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          if (tz.includes('Europe/London')) { setDetectedCountry('gb'); return; }
          if (tz.includes('Africa/Lagos')) { setDetectedCountry('ng'); return; }
          if (tz.includes('Africa/Nairobi')) { setDetectedCountry('ke'); return; }
          if (tz.includes('Africa/Johannesburg')) { setDetectedCountry('za'); return; }
          if (tz.includes('Asia/Kolkata')) { setDetectedCountry('in'); return; }
          if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles')) { setDetectedCountry('us'); return; }
        }
      } catch (e) {
        console.warn("Fallback timezone detection failed:", e);
      }

      // Default language check
      try {
        const lang = window.navigator.language || '';
        if (lang.includes('GB') || lang.includes('gb')) setDetectedCountry('gb');
        else if (lang.includes('NG') || lang.includes('ng')) setDetectedCountry('ng');
        else if (lang.includes('KE') || lang.includes('ke')) setDetectedCountry('ke');
        else if (lang.includes('IN') || lang.includes('in')) setDetectedCountry('in');
      } catch (e) {
        console.warn("Language detection failed:", e);
      }
    };
    detectCountry();
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hero carousel slider state
  const carouselImages = [
    "https://i.imgur.com/XOcTzj3.png",
    "https://i.imgur.com/n5lZDsk.png",
    "https://i.imgur.com/0N02qUY.png"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, carouselImages.length]);

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Newsletter subscription states & handlers
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [showNewsletterSuccessModal, setShowNewsletterSuccessModal] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailStr = newsletterEmail.trim();
    if (!emailStr) {
      toast.error("Please enter your email address.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setNewsletterLoading(true);
    const cleanEmail = emailStr.toLowerCase().trim();
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Subscription could not be processed at this time.");
      }

      setNewsletterEmail('');
      setShowNewsletterSuccessModal(true);
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      toast.error(err.message || "Subscription could not be processed at this time.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Signup Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Signin Fields
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  
  // Security States
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [tempUser, setTempUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const isSignupPath = window.location.pathname === '/signup';
    
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
    
    if (ref || isSignupPath) {
      setAuthMode('signup');
      setIsModalOpen(true);
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      // Validate Referral Code if provided
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast.error("The referral code you entered does not exist.");
          setLoading(false);
          return;
        }
      }

      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Send Verification (With Robust Retry)
      let emailSent = false;
      let emailAttempts = 0;
      while (!emailSent && emailAttempts < 2) {
        try {
          await sendEmailVerification(firebaseUser);
          emailSent = true;
        } catch (verifyError: any) {
          emailAttempts++;
          console.warn(`Verification email attempt ${emailAttempts} failed:`, verifyError);
          if (emailAttempts >= 2) {
            throw new Error("Failed to send verification email. Please check your internet connection or try again later.");
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // 3. Cache signup data for post-verification profile creation
      try {
        const pendingData = {
          fullName,
          username,
          phone,
          referralCode,
          email,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`pending_signup_${firebaseUser.uid}`, JSON.stringify(pendingData));
      } catch (cacheError) {
        console.error("Critical: Failed to cache signup data", cacheError);
      }
      
      // 4. Sign out to enforce verification on next login
      await auth.signOut();

      // 5. Trigger Success View
      setSigninEmail(email);
      setSigninPassword(password);
      setVerificationSent(true);
      toast.success("Verification email sent!");
      
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Account already exists. Please sign in.");
        setAuthMode('signin');
        setSigninEmail(email);
      } else if (error.message.includes('permission')) {
        toast.error("Referral validation failed due to security protocols. Please refresh and try again.");
      } else {
        toast.error(error.message || "An error occurred during signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // STEP 1: Authenticate user in Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, signinEmail, signinPassword);
      let firebaseUser = userCredential.user;

      // STEP 2: Reload auth state and check email verification first
      await firebaseUser.reload();
      firebaseUser = auth.currentUser || firebaseUser;

      const isCipherUser = firebaseUser.email === 'support@tavariwave.network' || 
                       firebaseUser.email === 'contact.cga.usa@gmail.com' || 
                       firebaseUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

      if (!firebaseUser.emailVerified && !isCipherUser) {
        toast.error("Please verify your email before signing in.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Force token refresh so Firestore rules recognize new authentication state
      await firebaseUser.getIdToken(true);

      // STEP 3: Safe, non-blocking profile retrieval
      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      } catch (err: any) {
        console.warn("Soft-caught Firestore permission/fetch error in handleSignin:", err);
      }

      // STEP 4: Device Fingerprint & Security Verification
      const deviceId = getDeviceFingerprint();
      const trustedDevicesKey = `trusted_devices_${firebaseUser.uid}`;
      const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
      const isNewDevice = !trustedDevices.includes(deviceId);

      // Extract transaction PIN (stored in profile as transfer_pin)
      const profileData = userDoc?.exists() ? userDoc.data() : null;
      const userPin = profileData?.transfer_pin;

      if (isNewDevice && userPin && !isCipherUser) {
        // Unknown device and user has a Transaction PIN -> Prompt for PIN
        setTempUser(firebaseUser);
        setRequiresOtp(true); // Reuse verification panel for Enter PIN
        setLoading(false);
        toast.info("New device detected. Verification required.");
        logAudit(firebaseUser.uid, 'mfa_triggered_pin', { deviceId }).catch(() => {});
        return;
      }

      // STEP 5: Create user profile if it doesn't exist (first-time login)
      if (!userDoc || !userDoc.exists()) {
        console.log("User document missing. Creating fallback profile...");
        const cachedDataStr = localStorage.getItem(`pending_signup_${firebaseUser.uid}`);
        let pendingData = null;
        if (cachedDataStr) {
          try { pendingData = JSON.parse(cachedDataStr); } catch (e) {}
        }
        
        let referrerId: string | null = null;
        let referrerCodeValue: string | null = null;
        
        if (pendingData?.referralCode?.trim()) {
          const cleanRef = pendingData.referralCode.trim().toUpperCase();
          const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
          try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              referrerId = querySnapshot.docs[0].id;
              referrerCodeValue = cleanRef;
            }
          } catch (e) {
            console.warn("Failed querying referral code silently:", e);
          }
        }

        const userRefCode = isCipherUser ? 'CIPHER' : generateReferralCode();
        const newUserProfile = {
          uid: firebaseUser.uid,
          name: isCipherUser ? 'Cipher' : (pendingData?.fullName || firebaseUser.displayName || 'Nexus User'),
          username: isCipherUser ? 'cipher_root' : (pendingData?.username || firebaseUser.email?.split('@')[0] || 'user'),
          email: firebaseUser.email || '',
          phone: pendingData?.phone || '',
          public_id: generatePublicId(),
          referral_code: userRefCode,
          referral_link: `${window.location.origin}/signup?ref=${userRefCode}`,
          referred_by: referrerId,
          referrer_uid: referrerId,
          referrer_code: referrerCodeValue,
          referrals_count: 0,
          active_referrals: 0,
          referral_earnings: 0,
          role: isCipherUser ? 'cipher' : 'user',
          funding_balance: 0,
          available_balance: 0,
          total_earnings: 0,
          total_invested: 5, // $5 signup bonus directly into Assets Balance
          email_verified: true,
          suspended: false,
          banned: false,
          roi_disabled: false,
          withdrawals_frozen: false,
          transfers_frozen: false,
          created_at: new Date().toISOString(),
          roi_cycle_start: new Date().toISOString(),
          last_rebook: new Date().toISOString()
        };

        if (referrerId) {
          try {
            await updateDoc(doc(db, 'users', referrerId), {
              referrals_count: increment(1)
            });
          } catch (e) {
            console.error("Failed to increment referrals_count", e);
          }
        }

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);
          
          broadcastActivity(
            newUserProfile.name || "New Partner",
            "Registered",
            undefined,
            true,
            "👤"
          );
          
          // Generate an idempotent signup bonus transaction record
          const txId = `signup-bonus-${firebaseUser.uid}`;
          await setDoc(doc(db, 'transactions', txId), {
            user_id: firebaseUser.uid,
            type: 'signup_bonus',
            amount: 5,
            created_at: new Date().toISOString(),
            status: 'approved',
            description: "Congratulations, you have just received a $5 signup bonus into your assets balance."
          });
        } catch (setErr) {
          console.warn("Grace-failed setting profile on sign-in, AuthContext will auto-heal:", setErr);
        }
        if (cachedDataStr) localStorage.removeItem(`pending_signup_${firebaseUser.uid}`);
      }

      // Register device and store locally as trusted
      try {
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
      } catch (e) {}

      // Register in Firestore silently
      registerDevice(firebaseUser.uid, deviceId).catch(() => {});
      logAudit(firebaseUser.uid, 'login_success').catch(() => {});

      if (isCipherUser) {
        toast.success("Cipher Terminal Accessed");
        navigate('/cipher');
      } else {
        toast.success("Identity Verified. Welcome back!");
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      console.error("Sign-in process error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error("Invalid login credentials.");
      } else {
        toast.error(error.message || "An unexpected error occurred during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    setLoading(true);
    try {
      let storedPin: string | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', tempUser.uid));
        if (userDoc.exists()) {
          storedPin = userDoc.data().transfer_pin || null;
        }
      } catch (err) {
        console.error("Failed fetching PIN on device verify:", err);
      }

      if (!storedPin) {
        // Fallback: If no PIN found on server, allow login immediately (requirement)
        toast.success("Verified. Welcome back!");
        const deviceId = getDeviceFingerprint();
        const trustedDevicesKey = `trusted_devices_${tempUser.uid}`;
        const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
        await registerDevice(tempUser.uid, deviceId).catch(() => {});
        navigate('/home', { replace: true });
        return;
      }

      if (userOtp === storedPin) {
        toast.success("PIN Verified. Access granted.");
        await logAudit(tempUser.uid, 'mfa_success_pin').catch(() => {});
        
        const deviceId = getDeviceFingerprint();
        const trustedDevicesKey = `trusted_devices_${tempUser.uid}`;
        const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
        
        await registerDevice(tempUser.uid, deviceId).catch(() => {});
        navigate('/home', { replace: true });
      } else {
        toast.error("Invalid transaction PIN.");
        await logAudit(tempUser.uid, 'mfa_failed_pin', { reason: 'invalid_pin' }).catch(() => {});
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Validate Referral Code if provided first
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast.error("The referral code you entered does not exist.");
          setLoading(false);
          return;
        }
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Force refreshing the user authentication token immediately.
      // This is crucial because it updates the token claims (like email_verified) in the client state synchronously,
      // which allows Firestore security rules to immediately recognize the Google user authentication and permissions.
      await user.getIdToken(true);

      const isCipher = user.email === 'support@tavariwave.network' || user.email === 'contact.cga.usa@gmail.com' || user.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err: any) {
        console.warn("Soft-caught Firestore permission/fetch error in handleGoogleAuth:", err);
      }

      // Device Fingerprint & Security Verification matching the email/password sign-in flow
      const deviceId = getDeviceFingerprint();
      const trustedDevicesKey = `trusted_devices_${user.uid}`;
      const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
      const isNewDevice = !trustedDevices.includes(deviceId);

      const profileData = userDoc?.exists() ? userDoc.data() : null;
      const userPin = profileData?.transfer_pin;

      if (isNewDevice && userPin && !isCipher) {
        setTempUser(user);
        setRequiresOtp(true);
        setLoading(false);
        toast.info("New device detected. Verification required.");
        logAudit(user.uid, 'mfa_triggered_pin', { deviceId }).catch(() => {});
        return;
      }

      if (!userDoc || !userDoc.exists()) {
        console.log("Creating new Google user profile...");
        // Initial setup for Google user with referral support
        let referrerId: string | null = null;
        let referrerCodeValue: string | null = null;
        
        if (referralCode?.trim()) {
          const cleanRef = referralCode.trim().toUpperCase();
          const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
          try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              referrerId = querySnapshot.docs[0].id;
              referrerCodeValue = cleanRef;
            }
          } catch (e) {
            console.warn("Failed querying referral code silently:", e);
          }
        }

        const userRefCode = isCipher ? 'CIPHER' : generateReferralCode();
        const newUserProfile = {
          uid: user.uid,
          name: isCipher ? 'Cipher' : (user.displayName || 'Nexus User'),
          username: isCipher ? 'cipher_root' : (user.email?.split('@')[0] || 'user'),
          email: user.email || '',
          phone: '',
          public_id: generatePublicId(),
          referral_code: userRefCode,
          referral_link: `${window.location.origin}/signup?ref=${userRefCode}`,
          referred_by: referrerId,
          referrer_uid: referrerId,
          referrer_code: referrerCodeValue,
          referrals_count: 0,
          active_referrals: 0,
          referral_earnings: 0,
          role: isCipher ? 'cipher' : 'user',
          funding_balance: 0,
          available_balance: 0,
          total_earnings: 0,
          total_invested: 5, // $5 signup bonus directly into Assets Balance
          email_verified: true,
          suspended: false,
          banned: false,
          roi_disabled: false,
          withdrawals_frozen: false,
          transfers_frozen: false,
          created_at: new Date().toISOString(),
          roi_cycle_start: new Date().toISOString(),
          last_rebook: new Date().toISOString()
        };

        if (referrerId) {
          try {
            await updateDoc(doc(db, 'users', referrerId), {
              referrals_count: increment(1)
            });
          } catch (e) {
            console.error("Failed to increment referrals_count", e);
          }
        }

        try {
          await setDoc(doc(db, 'users', user.uid), newUserProfile);

          broadcastActivity(
            newUserProfile.name || "New Partner",
            "Registered",
            undefined,
            true,
            "👤"
          );

          // Generate an idempotent signup bonus transaction record
          const txId = `signup-bonus-${user.uid}`;
          await setDoc(doc(db, 'transactions', txId), {
            user_id: user.uid,
            type: 'signup_bonus',
            amount: 5,
            created_at: new Date().toISOString(),
            status: 'approved',
            description: "Congratulations, you have just received a $5 signup bonus into your assets balance."
          });
        } catch (setErr) {
          console.warn("Grace-failed setting profile on Google sign-in, AuthContext will auto-heal:", setErr);
        }
      }

      // Register device and store locally as trusted
      try {
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
      } catch (e) {}

      // Register device & log audit trail in Firestore
      registerDevice(user.uid, deviceId).catch(() => {});
      logAudit(user.uid, 'login_success').catch(() => {});
      
      toast.success(isCipher ? "Cipher Terminal Accessed" : "Welcome back!");
      navigate(isCipher ? '/cipher' : '/home');
    } catch (error: any) {
      console.error("Google auth error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in popup is closed before completion.");
      } else {
        toast.error(error.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="relative min-h-[100dvh] w-full text-white overflow-hidden bg-black flex flex-col justify-between select-none">
        {/* Fixed Full-screen Background Image with exact centering and cover style scaling */}
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-black overflow-hidden select-none">
          <img 
            src="https://i.imgur.com/tpelb01.png"
            className="w-full h-full object-cover object-center select-none"
            referrerPolicy="no-referrer"
            loading="eager"
            alt="Mobile Background"
            style={{ willChange: 'transform' }}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between min-h-[100dvh] w-full">
          {/* Top spacer (artwork/logo safe area - no overlap) */}
          <div className={`flex-none pointer-events-none transition-all duration-300 ${authMode === 'signup' ? 'h-[17vh] min-h-[125px]' : 'h-[14vh] min-h-[100px]'}`} />

          {/* Central black area content */}
          <div className="flex-1 flex flex-col justify-center px-8 w-full max-w-[400px] mx-auto overflow-y-auto scrollbar-hide py-2 md:py-4">
            
            {verificationSent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold uppercase tracking-wide">Verify Your Email</h3>
                  <p className="text-aura-muted text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Your account has been created successfully.<br/>
                    Please check your inbox or spam folder to verify your email before signing in.
                  </p>
                </div>
                <button 
                  onClick={() => { 
                    setVerificationSent(false); 
                    setAuthMode('signin'); 
                  }}
                  className="w-full py-3 bg-primary text-white font-black uppercase tracking-wider text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  OK <ArrowRight size={14} />
                </button>
              </div>
            ) : requiresOtp ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                  <Lock size={24} className="text-primary animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold uppercase tracking-wide">Confirm Device</h3>
                  <p className="text-aura-muted text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                    Unrecognized device. Enter your Transaction PIN to authorize.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-center">
                    <input 
                      type="password" 
                      maxLength={8}
                      placeholder="••••"
                      value={userOtp}
                      onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full max-w-[180px] bg-white/[0.04] border border-white/10 rounded-2xl py-3 text-center text-xl font-black tracking-[0.4em] text-primary focus:border-primary focus:bg-white/[0.08] outline-none transition-all placeholder:text-white/10 font-mono"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      disabled={loading || userOtp.length < 4}
                      className="w-full py-3 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Authenticating...' : 'Authorize Device'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setRequiresOtp(false);
                        setTempUser(null);
                        setUserOtp('');
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-aura-muted hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Social Button - Visible on both Sign-In and Sign-Up modes */}
                <div>
                  <button 
                    disabled={loading}
                    onClick={handleGoogleAuth}
                    className="w-full py-2.5 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-semibold text-xs hover:bg-white/90 active:scale-98 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google logo" />
                    {authMode === 'signup' ? 'Sign Up with Google' : 'Sign In with Google'}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center gap-3">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest leading-none">or</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                {/* Form fields */}
                <form 
                  onSubmit={(e) => {
                    // Pre-fill username on mobile if signing up
                    if (authMode === 'signup' && !username) {
                      setUsername(email.split('@')[0] || 'user');
                    }
                    if (authMode === 'signup') {
                      handleSignup(e);
                    } else {
                      handleSignin(e);
                    }
                  }} 
                  className="space-y-2"
                >
                  {authMode === 'signup' && (
                    <AuthInput icon={<User size={15} />} label="Full Name" placeholder="Full Name" value={fullName} onChange={setFullName} required compact={true} />
                  )}

                  <AuthInput 
                    icon={<Mail size={15} />} 
                    label="Email Address" 
                    placeholder="Email Address" 
                    type="email" 
                    value={authMode === 'signup' ? email : signinEmail} 
                    onChange={authMode === 'signup' ? setEmail : setSigninEmail} 
                    required 
                    compact={true}
                  />

                  {authMode === 'signup' && (
                    <div className="space-y-1.5 is-compact">
                      <PhoneInput
                        country={detectedCountry}
                        value={phone}
                        onChange={(val) => setPhone(val)}
                        containerClass="nexus-phone-container"
                        inputClass="nexus-phone-input"
                        buttonClass="nexus-phone-button"
                        dropdownClass="nexus-phone-dropdown"
                        placeholder="Phone Number"
                        enableSearch={true}
                        disableSearchIcon={true}
                        searchPlaceholder="Search country..."
                      />
                    </div>
                  )}

                  <AuthInput 
                    icon={<Lock size={15} />} 
                    label="Password" 
                    placeholder="Password" 
                    type="password" 
                    value={authMode === 'signup' ? password : signinPassword} 
                    onChange={authMode === 'signup' ? setPassword : setSigninPassword} 
                    required 
                    showPasswordToggle={true}
                    isPasswordVisible={authMode === 'signup' ? showPassword : showSigninPassword}
                    onTogglePassword={() => authMode === 'signup' ? setShowPassword(!showPassword) : setShowSigninPassword(!showSigninPassword)}
                    compact={true}
                  />

                  {authMode === 'signup' && (
                    <AuthInput 
                      icon={<Lock size={15} />} 
                      label="Confirm Password" 
                      placeholder="Confirm Password" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={setConfirmPassword} 
                      required 
                      showPasswordToggle={true}
                      isPasswordVisible={showConfirmPassword}
                      onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                      compact={true}
                    />
                  )}

                  {authMode === 'signup' && (
                    <AuthInput icon={<TrendingUp size={15} />} label="Referral Code" placeholder="Referral Code (Optional)" value={referralCode} onChange={setReferralCode} compact={true} />
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:scale-[1.01] transition-all disabled:opacity-50 mt-2 text-xs"
                  >
                    {loading ? 'Processing...' : authMode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </button>
                </form>

                {/* Switch Link / Switch Button */}
                <p className="text-center text-xs font-semibold text-aura-muted pt-1 pb-0 flex-none leading-normal">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                    className="text-secondary font-bold hover:text-accent transition-colors"
                  >
                    {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Bottom spacer (bottom graphic safe area - no overlap) */}
          <div className="flex-none h-[14vh] min-h-[80px] pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-primary selection:text-white overflow-hidden relative">
      {/* Premium Visual Enhancements: Ambient Glow Blobs */}
      <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[55%] right-[-15%] w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[15%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-0" />

      {/* Welcome Landing Full Width Header Photo */}
      <div 
        className="w-full relative z-[101] overflow-hidden bg-[#050608] mt-20 lg:mt-24"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050608]/70 via-[#050608]/20 to-transparent z-25 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050608] to-transparent z-25 pointer-events-none" />
        
        <div className="relative w-full aspect-[21/9] sm:aspect-[2.39/1] min-h-[160px] sm:min-h-[280px] lg:min-h-[380px] overflow-hidden">
          {carouselImages.map((src, index) => (
            <div
              key={src}
              className={cn(
                "absolute inset-0 transition-all duration-1000 ease-in-out",
                currentSlide === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"
              )}
            >
              <img 
                src={src} 
                alt={`Welcome Header Slide ${index + 1}`} 
                className="w-full h-full object-cover object-top block select-none"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-secondary/10 blur-[100px] rounded-full" />
      </div>

       {/* Nav */}
      <nav className={cn(
        "fixed z-[120] transition-all duration-500 flex items-center justify-between",
        // Mobile style: floating glassmorphic pill
        "top-3.5 inset-x-3.5 h-12 rounded-2xl bg-[#050608]/70 border border-white/10 shadow-[0_8px_32px_rgba(124,58,237,0.12),0_1px_2px_rgba(255,255,255,0.05)] px-3 text-white backdrop-blur-xl lg:hidden",
        // Desktop style: traditional header matching the scrolling theme
        "lg:top-0 lg:inset-x-0 lg:fixed lg:rounded-none lg:px-20 lg:text-white lg:border-b lg:backdrop-blur-md",
        isScrolled 
          ? "lg:h-14 lg:bg-[#050608]/85 lg:border-primary/20 lg:shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
          : "lg:h-24 lg:bg-[#050608]/35 lg:border-transparent lg:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
      )}>
        <div className={cn("flex items-center gap-1.5 transition-all duration-500", isScrolled ? "scale-90" : "scale-100")}>
          <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" loading="lazy" decoding="async" className="h-7 w-auto lg:h-14 object-contain" />
          <span className="text-sm lg:text-3xl font-black uppercase tracking-tighter leading-none">Wave</span>
        </div>

        {/* Center Nav Items */}
        <div className="hidden lg:flex items-center gap-8">
           {['About Us', 'How It Works', 'Reviews', 'Blog', 'Help'].map(item => (
             <button 
               key={item} 
               onClick={() => {
                 if (item === 'Reviews') navigate('/reviews');
                 if (item === 'About Us') navigate('/about');
                 if (item === 'How It Works') navigate('/how-it-works');
                 if (item === 'Blog') navigate('/blog');
                 if (item === 'Help') navigate('/help');
               }}
               className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors"
             >
               {t(item)}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Buttons Layout - Compact & Premium */}
          <div className="flex lg:hidden items-center gap-1.5">
            {renderLanguageSelector()}
            {/* 1. Sign In */}
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="px-2 py-1.5 border border-white/10 hover:border-primary/50 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
            >
              {t('Sign In')}
            </button>

            {/* 2. Get Started */}
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              {t('Get Started')}
            </button>

            {/* 3. Dropdown/Hamburger menu (extreme right) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 px-1.5 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* Desktop Only Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {renderLanguageSelector()}
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              {t('Sign In')}
            </button>
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-all text-xs"
            >
              {t('Get Started')}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[66px] lg:hidden inset-x-3.5 z-[110] bg-[#050608]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {['About Us', 'How It Works', 'Reviews', 'Blog', 'Help'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (item === 'About Us') navigate('/about');
                    if (item === 'How It Works') navigate('/how-it-works');
                    if (item === 'Reviews') navigate('/reviews');
                    if (item === 'Blog') navigate('/blog');
                    if (item === 'Help') navigate('/help');
                  }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/75 hover:text-primary transition-all flex items-center justify-between"
                >
                  <span>{t(item)}</span>
                  <ArrowRight size={10} className="text-primary" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 lg:pt-32 pb-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl space-y-8"
        >
          <p className="max-w-xl mx-auto text-aura-muted text-sm lg:text-lg leading-relaxed font-medium uppercase tracking-[0.05em]">
            <EditableText configKey="heroSubtitle" defaultText="Precision trading and high-yield asset orchestration for the modern institutional grade investor." />
          </p>
          <div className="flex flex-row items-center justify-center gap-4 pt-8 w-full max-w-md mx-auto">
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="flex-1 h-14 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl shadow-[0_4px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_35px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Get Started <ArrowRight size={14} className="shrink-0" />
            </button>
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="flex-1 h-14 bg-[#050608]/50 hover:bg-[#050608]/80 border border-[#ffffff15] hover:border-secondary/40 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl shadow-lg hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(14,165,233,0.15)] active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </main>

      {/* Start Guide Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 text-center">
        {/* Premium Header Typography Redesign */}
        <div className="relative inline-block mb-12 max-w-3xl mx-auto text-center">
          <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-primary/15 to-secondary/15 opacity-70 pointer-events-none rounded-full" />
          <div className="relative flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" />
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100 uppercase select-none leading-snug">
              {t("Simple Steps to Start Your Journey to Financial Freedom")}
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-1.5" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-primary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-500">
              <Realistic3DIcon type="user" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Create Account")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Simple onboarding to get started")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-secondary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-secondary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all duration-500">
              <Realistic3DIcon type="plan" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Choose a Plan")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Select a suitable growth path")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-primary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-500">
              <Realistic3DIcon type="fund" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Fund & Start")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Add funds and activate your journey")}
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-secondary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-secondary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all duration-500">
              <Realistic3DIcon type="node" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Activate Your Nodes")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Enable your earning system")}
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Statistics Highlight Card */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent backdrop-blur-2xl p-8 lg:p-16 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
          {/* Subtle brand glow effects */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/8 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            {/* Stat 1 */}
            <div className="space-y-3 flex flex-col justify-center items-center">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-secondary italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(124,58,237,0.2)]">
                $26M+
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Proven payouts delivered globally
              </p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-teal-400 to-accent italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(14,165,233,0.2)]">
                90%
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Users achieve up to $955K+ returns
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-400 to-accent italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(124,58,237,0.2)]">
                155,000+
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Trusted by users worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Success Modal */}
      <AnimatePresence>
        {showNewsletterSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewsletterSuccessModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0c0f14] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-8 text-center space-y-6">
                <button 
                  onClick={() => setShowNewsletterSuccessModal(false)}
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-aura-muted hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={14} />
                </button>

                <div className="pt-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={32} className="text-primary" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white italic font-serif">
                    Welcome to Wave Press
                  </h3>
                  <p className="text-xs text-aura-muted leading-relaxed font-sans px-2">
                    Thank you for subscribing to our newsletter. Stay updated with Wave via email.
                  </p>
                </div>

                <button 
                  onClick={() => setShowNewsletterSuccessModal(false)}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  Continue Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0c0f14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 left-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-aura-muted hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Logo & Header */}
                <div className="flex flex-col items-center text-center mt-6 mb-8">
                   <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" loading="lazy" decoding="async" className="w-20 h-20 lg:w-24 lg:h-24 object-contain mb-6" />
                   <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                     {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                   </h2>
                   <p className="text-aura-muted text-sm font-medium">
                     {authMode === 'signup' ? 'Join us and start your journey' : 'Sign in to continue your journey'}
                   </p>
                </div>

                {verificationSent ? (
                  <div className="text-center space-y-6 py-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </motion.div>
                    <div className="space-y-4 px-4">
                      <h3 className="text-2xl font-black italic font-serif">Verify Your Email</h3>
                      <p className="text-aura-muted text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Your account has been created successfully.<br/>
                        Please check your inbox or spam folder to verify your email before signing in.
                      </p>
                    </div>
                    <button 
                      onClick={() => { 
                        setVerificationSent(false); 
                        setAuthMode('signin'); 
                      }}
                      className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      OK <ArrowRight size={16} />
                    </button>
                  </div>
                ) : requiresOtp ? (
                  <div className="text-center space-y-8 py-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Lock size={32} className="text-primary animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Confirm Device</h3>
                      <p className="text-aura-muted text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                        We've detected a sign-in attempt from an unrecognized device. For your protection, enter your Transaction PIN to authorize this device.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="flex justify-center">
                        <input 
                          type="password" 
                          maxLength={8}
                          placeholder="••••"
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full max-w-[240px] bg-white/5 border border-white/10 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.4em] text-primary focus:border-primary focus:bg-white/10 outline-none transition-all placeholder:text-white/10 font-mono"
                          required
                          autoFocus
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <button 
                          disabled={loading || userOtp.length < 4}
                          className="w-full py-4.5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                          {loading ? 'Authenticating...' : (
                            <>Authorize Device <CheckCircle2 size={16} /></>
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            setRequiresOtp(false);
                            setTempUser(null);
                            setUserOtp('');
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-aura-muted hover:text-white transition-colors"
                        >
                          Cancel session
                        </button>
                      </div>
                    </form>

                    <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-aura-muted uppercase tracking-[0.2em]">
                       <Shield className="w-3 h-3 text-primary" />
                       Fortified Endpoint Active
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Social Buttons */}
                    <div className="space-y-3">
                       <button 
                         disabled={loading}
                         onClick={handleGoogleAuth}
                         className="w-full py-3.5 bg-white text-black rounded-xl flex items-center justify-center gap-3 font-semibold text-sm hover:bg-white/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google logo" />
                         {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                       </button>
                    </div>

                    <div className="relative flex items-center gap-4">
                       <div className="h-px bg-white/5 flex-1"></div>
                       <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">or</span>
                       <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <form onSubmit={authMode === 'signup' ? handleSignup : handleSignin} className="space-y-4">
                      {authMode === 'signup' && (
                        <>
                          <AuthInput icon={<User size={18} />} label="Full Name" placeholder="Full Name" value={fullName} onChange={setFullName} required />
                          <AuthInput icon={<UserPlus size={18} />} label="Username" placeholder="Username" value={username} onChange={setUsername} required />
                        </>
                      )}

                      <AuthInput 
                        icon={<Mail size={18} />} 
                        label="Email Address" 
                        placeholder={authMode === 'signup' ? 'Email Address' : 'Email or Username'} 
                        type="email" 
                        value={authMode === 'signup' ? email : signinEmail} 
                        onChange={authMode === 'signup' ? setEmail : setSigninEmail} 
                        required 
                      />

                      {authMode === 'signup' && (
                        <div className="space-y-2">
                          <PhoneInput
                            country={detectedCountry}
                            value={phone}
                            onChange={(val) => setPhone(val)}
                            containerClass="nexus-phone-container"
                            inputClass="nexus-phone-input"
                            buttonClass="nexus-phone-button"
                            dropdownClass="nexus-phone-dropdown"
                            placeholder="Phone Number"
                            enableSearch={true}
                            disableSearchIcon={true}
                            searchPlaceholder="Search country..."
                          />
                        </div>
                      )}

                      <div className="space-y-4">
                        <AuthInput 
                          icon={<Lock size={18} />} 
                          label="Password" 
                          placeholder="Password" 
                          type="password" 
                          value={authMode === 'signup' ? password : signinPassword} 
                          onChange={authMode === 'signup' ? setPassword : setSigninPassword} 
                          required 
                          showPasswordToggle={true}
                          isPasswordVisible={authMode === 'signup' ? showPassword : showSigninPassword}
                          onTogglePassword={() => authMode === 'signup' ? setShowPassword(!showPassword) : setShowSigninPassword(!showSigninPassword)}
                        />
                        {authMode === 'signup' && (
                          <AuthInput 
                            icon={<Lock size={18} />} 
                            label="Confirm Password" 
                            placeholder="Confirm Password" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={setConfirmPassword} 
                            required 
                            showPasswordToggle={true}
                            isPasswordVisible={showConfirmPassword}
                            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                          />
                        )}
                      </div>

                      {authMode === 'signin' && (
                        <div className="flex justify-end">
                           <button type="button" className="text-xs font-bold text-secondary hover:text-accent transition-colors">Forgot Password?</button>
                        </div>
                      )}

                      {authMode === 'signup' && (
                         <AuthInput icon={<TrendingUp size={18} />} label="Referral Code (Optional)" placeholder="Referral Code (Optional)" value={referralCode} onChange={setReferralCode} />
                      )}

                      <button 
                        disabled={loading}
                        className="w-full py-4.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-[1.01] transition-all disabled:opacity-50 mt-4 text-base"
                      >
                        {loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </button>
                    </form>

                    <p className="text-center text-sm font-medium text-aura-muted">
                      {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"} {' '}
                      <button 
                        onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                        className="text-secondary font-bold hover:text-accent transition-colors"
                      >
                        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Testimonials Ticker Section */}
      <section className="relative z-10 py-16 text-center overflow-hidden">
        {/* Premium Header Typography Redesign */}
        <div className="relative inline-block mb-10 max-w-3xl mx-auto text-center">
          <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-secondary/15 to-accent/15 opacity-70 pointer-events-none rounded-full" />
          <div className="relative flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-secondary/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-secondary/70 animate-pulse" />
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-secondary/50" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100 uppercase select-none leading-snug">
              What Our Users Are Saying
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-secondary/50 to-transparent mt-1.5" />
          </div>
        </div>

        <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mb-12">
          Global consensus from verified nodes & traders worldwide.
        </p>

        <div className="relative w-full overflow-hidden py-4">
          {/* Shadow overlays on edge for elegant fade effect */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050608] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050608] to-transparent z-10 pointer-events-none" />

          <motion.div 
            className="flex gap-6 w-max"
            animate={{ x: [0, -3440] }} 
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 50,
              ease: "linear"
            }}
          >
            {[...REVIEWS.slice(0, 10), ...REVIEWS.slice(0, 10)].map((rev, index) => (
              <div 
                key={`${rev.id}-${index}`} 
                className="w-80 flex-shrink-0 p-8 rounded-3xl bg-white/[0.02]/70 backdrop-blur-xl border border-white/10 hover:border-primary/30 hover:-translate-y-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] duration-300 transition-all flex flex-col justify-between text-left h-48 space-y-4 relative overflow-hidden group"
              >
                {/* Subtle visual accent in card background */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none rounded-bl-2xl" />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center font-black text-primary text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {rev.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-tight truncate">{rev.name}</h4>
                    <span className="text-[8px] text-aura-muted font-bold tracking-widest uppercase mt-0.5 block truncate">
                      {rev.countryName}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/85 leading-relaxed italic line-clamp-3">
                  "{rev.text}"
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1 text-yellow-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[7px] text-white/20 font-mono tracking-widest uppercase">Verified Node</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter Subscription Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="p-8 lg:p-16 rounded-[40px] bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.55)] relative backdrop-blur-xl">
          {/* Neon background blur */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="space-y-4 max-w-xl text-center lg:text-left relative z-10">
            {/* Premium Header Typography Redesign */}
            <div className="relative inline-block text-center lg:text-left">
              <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-primary/10 to-secondary/10 opacity-70 pointer-events-none rounded-full" />
              <div className="relative flex flex-col items-center lg:items-start gap-2">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="h-1 w-1 rounded-full bg-secondary/80 animate-ping" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-black">Platform Broadcast</span>
                </div>
                <h2 className="text-xl lg:text-3xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 uppercase select-none leading-snug">
                  Stay updated with Tavari Wave Network
                </h2>
                <div className="h-[1px] w-20 bg-gradient-to-r from-secondary/40 to-transparent mt-0.5" />
              </div>
            </div>

            <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.25em] leading-relaxed block pl-0.5 pt-1">
              Subscribe to get latest updates and platform insights
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative w-full max-w-md flex flex-col sm:flex-row gap-4 z-10">
            <div className="relative flex-1 group">
              <Mail className="absolute inset-y-0 left-4 flex h-full items-center text-white/25 group-focus-within:text-secondary transition-colors" size={18} />
              <input 
                type="email"
                placeholder="Enter email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-white/[0.02]/30 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-medium transition-all outline-none focus:border-secondary/40 focus:bg-white/[0.04] text-white placeholder:text-white/25 shadow-inner"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={newsletterLoading}
              className="px-8 py-4.5 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:-scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {newsletterLoading ? 'Subscribing...' : 'Subscribe Now'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AuthInput({  
  icon, 
  label, 
  placeholder, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  inputMode, 
  pattern,
  showPasswordToggle,
  onTogglePassword,
  isPasswordVisible,
  compact = false
}: { 
  icon?: React.ReactNode, 
  label: string, 
  placeholder: string, 
  type?: string, 
  value: string, 
  onChange: (v: string) => void, 
  required?: boolean, 
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'], 
  pattern?: string,
  showPasswordToggle?: boolean,
  onTogglePassword?: () => void,
  isPasswordVisible?: boolean,
  compact?: boolean
}) {
  const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className={cn("space-y-2", compact && "space-y-0.5")}>
      <div className="relative group">
        {icon && <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-secondary transition-colors">{icon}</div>}
        <input 
          type={inputType}
          inputMode={inputMode}
          pattern={pattern}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cn(
            "w-full bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl transition-all outline-none focus:border-white/20 focus:bg-white/[0.06] text-white placeholder:text-white/30",
            compact ? "py-2 px-4 text-xs font-semibold" : "py-4 text-base md:text-sm font-medium",
            icon ? "pl-12" : "pl-4",
            showPasswordToggle ? "pr-12" : "pr-4"
          )}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white transition-colors focus:outline-none"
          >
            {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
