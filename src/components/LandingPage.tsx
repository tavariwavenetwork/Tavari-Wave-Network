import React, { useState, useEffect } from 'react';
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
  serverTimestamp 
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

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setNewsletterLoading(true);
    try {
      await setDoc(doc(collection(db, 'newsletter_subscribers')), {
        email: newsletterEmail.trim().toLowerCase(),
        created_at: new Date()
      });
      toast.success("Thank you! You are now subscribed to platform insights.");
      setNewsletterEmail('');
    } catch (err: any) {
      console.error("Newsletter submission error:", err);
      toast.error("Subscription could not be processed at this time.");
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
    if (ref) {
      setReferralCode(ref.toUpperCase());
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
          total_invested: 0,
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
          total_invested: 0,
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

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-primary selection:text-white overflow-hidden relative">
      {/* Welcome Landing Full Width Header Photo */}
      <div 
        className="w-full relative z-[101] overflow-hidden border-b border-white/5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Invisible spacer matching the aspect ratio of the first slide to dynamically reserve height */}
        <img 
          src={carouselImages[0]} 
          alt="Spacer" 
          className="w-full h-auto block select-none pointer-events-none opacity-0"
          referrerPolicy="no-referrer"
        />
        
        {carouselImages.map((src, index) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <img 
              src={src} 
              alt={`Welcome Header Slide ${index + 1}`} 
              className="w-full h-full object-cover block select-none"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-secondary/10 blur-[100px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[120] transition-all duration-500 flex items-center justify-between px-6 lg:px-20 backdrop-blur-md border-b",
        isScrolled 
          ? "h-14 bg-[#050608]/85 border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
          : "h-20 lg:h-24 bg-[#050608]/35 border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
      )}>
        <div className={cn("flex items-center gap-4 transition-all duration-500", isScrolled ? "scale-90" : "scale-100")}>
          <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-11 w-auto lg:h-14 object-contain" />
          {!isScrolled && (
            <span className="text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-none">Wave</span>
          )}
        </div>

        {/* Center Nav Items */}
        <div className="hidden lg:flex items-center gap-8">
           {['About Us', 'How It Works', 'Reviews', 'Blog', 'Contact'].map(item => (
             <button 
               key={item} 
               onClick={() => {
                 if (item === 'Reviews') navigate('/reviews');
                 if (item === 'About Us') navigate('/about');
                 if (item === 'How It Works') navigate('/how-it-works');
               }}
               className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors"
             >
               {item}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
            className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
          >
            Sign In
          </button>
          {!isScrolled && (
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-all text-xs"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_25px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)] hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signup'); }}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all hover:scale-[1.02]"
            >
              Sign Up
            </button>
          </div>
        </motion.div>
      </main>

      {/* Start Guide Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl lg:text-5xl font-black uppercase italic tracking-tight font-serif mb-12 max-w-4xl mx-auto leading-tight">
          Simple Steps to Start Your Journey to Financial Freedom
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-primary group-hover:scale-110 transition-transform duration-500">
              <User size={28} />
            </div>
            <h4 className="relative z-10 text-xl font-bold tracking-tight text-white uppercase font-sans">
              Create Account
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[11px]">
              Simple onboarding to get started
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-secondary/30 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-secondary group-hover:scale-110 transition-transform duration-500">
              <Compass size={28} />
            </div>
            <h4 className="relative z-10 text-xl font-bold tracking-tight text-white uppercase font-sans">
              Choose a Plan
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[11px]">
              Select a suitable growth path
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-primary group-hover:scale-110 transition-transform duration-500">
              <Shield size={28} />
            </div>
            <h4 className="relative z-10 text-xl font-bold tracking-tight text-white uppercase font-sans">
              Fund & Start
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[11px]">
              Add funds and activate your journey
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-secondary/30 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-secondary group-hover:scale-110 transition-transform duration-500">
              <Zap size={28} />
            </div>
            <h4 className="relative z-10 text-xl font-bold tracking-tight text-white uppercase font-sans">
              Activate Your Nodes
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[11px]">
              Enable your earning system
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Statistics Highlight Card */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-xl p-8 lg:p-16 shadow-2xl">
          {/* Subtle brand glow effects */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/5 text-center">
            {/* Stat 1 */}
            <div className="space-y-3 flex flex-col justify-center items-center">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic font-serif leading-none">
                $26M+
              </span>
              <p className="text-sm lg:text-base font-bold text-white uppercase tracking-wider text-[10px] px-4">
                Proven payouts delivered globally
              </p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent italic font-serif leading-none">
                90%
              </span>
              <p className="text-sm lg:text-base font-bold text-white uppercase tracking-wider text-[10px] px-4">
                Users achieve up to $955K+ returns
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent italic font-serif leading-none">
                155,000+
              </span>
              <p className="text-sm lg:text-base font-bold text-white uppercase tracking-wider text-[10px] px-4">
                Trusted by users worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

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
                   <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="w-20 h-20 lg:w-24 lg:h-24 object-contain mb-6" />
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
                       <button 
                         className="w-full py-3.5 bg-[#1877F2] text-white rounded-xl flex items-center justify-center gap-3 font-semibold text-sm hover:bg-[#1877F2]/90 transition-all shadow-sm"
                       >
                         <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                         {authMode === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook'}
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
                            country={'us'}
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
        <h2 className="text-3xl lg:text-5xl font-black uppercase italic tracking-tight font-serif mb-4">
          What Our Users Are Saying
        </h2>
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
                className="w-80 flex-shrink-0 p-8 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all duration-300 flex flex-col justify-between text-left h-48 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm shadow-inner">
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{rev.name}</h4>
                    <span className="text-[9px] text-aura-muted font-bold tracking-widest uppercase mt-0.5 block">
                      {rev.countryName}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/70 leading-relaxed italic line-clamp-3">
                  {rev.text}
                </p>

                <div className="flex gap-1 text-yellow-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter Subscription Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="p-8 lg:p-16 rounded-[40px] bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl relative">
          {/* Neon background blur */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="space-y-4 max-w-xl text-center lg:text-left relative z-10">
            <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-tight italic font-serif text-white">
              Stay updated with Tavaaril Waves Network
            </h2>
            <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.25em] leading-relaxed">
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
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-medium transition-all outline-none focus:border-secondary/30 focus:bg-white/[0.04] text-white placeholder:text-white/20"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={newsletterLoading}
              className="px-8 py-4.5 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
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
  isPasswordVisible
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
  isPasswordVisible?: boolean
}) {
  const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
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
            "w-full bg-white/[0.03] border border-white/5 rounded-xl py-4 transition-all outline-none focus:border-secondary/30 focus:bg-white/[0.05] text-base md:text-sm font-medium text-white placeholder:text-white/20",
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
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
