import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Fingerprint, 
  Copy, 
  Check, 
  ShieldCheck,
  Share2,
  ChevronRight,
  ArrowLeft,
  Settings,
  Zap,
  Lock,
  Monitor,
  LogOut,
  Camera,
  Link as LinkIcon,
  BadgeCheck,
  X,
  Upload,
  Image as ImageIcon,
  UserCircle,
  LayoutDashboard,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { AnimatePresence } from 'motion/react';

export default function Profile() {
  const { profile, logout } = useAuth();
  const { openTransferModal } = useUI();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoMode, setPhotoMode] = useState<'options' | 'avatar' | 'camera'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MALE_AVATARS = [
    { id: 'm1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jack' },
    { id: 'm2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver' },
    { id: 'm3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=James' },
    { id: 'm4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Leo' },
    { id: 'm5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ryan' },
    { id: 'm6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex' },
    { id: 'm7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ben' },
    { id: 'm8', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chris' },
    { id: 'm9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Eric' },
    { id: 'm10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Dan' },
  ];

  const FEMALE_AVATARS = [
    { id: 'f1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
    { id: 'f2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Lily' },
    { id: 'f3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ada' },
    { id: 'f4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Eva' },
    { id: 'f5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mia' },
    { id: 'f6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chloe' },
    { id: 'f7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe' },
    { id: 'f8', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ruby' },
    { id: 'f9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ivy' },
    { id: 'f10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maya' },
  ];

  const updatePhotoURL = async (url: string) => {
    if (!profile?.uid) return;
    setIsUploading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { photoURL: url });
      toast.success("Profile photo updated successfully!");
      setShowPhotoModal(false);
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Failed to update profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.uid) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${profile.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updatePhotoURL(downloadURL);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhotoMode('camera');
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleSaveCaptured = async () => {
    if (!capturedImage || !profile?.uid) return;
    
    setIsUploading(true);
    try {
      // Convert dataUrl to blob
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      
      const storageRef = ref(storage, `avatars/${profile.uid}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      await updatePhotoURL(downloadURL);
      setCapturedImage(null);
    } catch (error) {
      console.error("Error saving captured photo:", error);
      toast.error("Failed to save photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code || ''}`;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Profile Header Card - Fixed Gradient design as requested */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#051937] via-[#004d7a] to-[#008793] p-8 lg:p-12 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white/20 p-1.5 overflow-hidden bg-white/10 backdrop-blur-sm shadow-2xl">
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <button 
                onClick={() => {
                  setPhotoMode('options');
                  setShowPhotoModal(true);
                }}
                className="absolute bottom-1 right-1 p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">{profile?.name}</h1>
                <BadgeCheck size={24} className="text-blue-400 fill-blue-400/20" />
              </div>
              <p className="text-white/60 text-sm font-medium tracking-wide">@{profile?.username}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-400 mt-2">
                <Check size={12} strokeWidth={3} /> Verified Account
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      </div>

      {/* Dashboard Action Buttons - Side-by-Side Mobile Layout */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 px-4 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95"
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button 
          onClick={openTransferModal}
          className="flex items-center justify-center gap-2 px-4 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-all shadow-xl shadow-primary/20 active:scale-95"
        >
          <ArrowRightLeft size={18} /> Transfer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start pt-2">
        {/* Main Info Columns */}
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8">
          
          {/* Account Information Section */}
          <section className="space-y-4">
            <div className="px-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-blue-500" /> Account Information
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">View and manage your personal account details</p>
            </div>
            
            <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm transition-colors">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <InfoRow 
                  icon={<User size={16} />} 
                  label="Full Name" 
                  value={profile?.name || 'N/A'} 
                />
                <InfoRow 
                  icon={<Fingerprint size={16} />} 
                  label="Username" 
                  value={`@${profile?.username}`} 
                />
                <InfoRow 
                  icon={<Mail size={16} />} 
                  label="Email Address" 
                  value={profile?.email || 'N/A'} 
                />
                <InfoRow 
                  icon={<Phone size={16} />} 
                  label="Phone Number" 
                  value={profile?.phone || 'Not provided'} 
                />
                <InfoRow 
                  icon={<ShieldCheck size={16} />} 
                  label="User ID" 
                  value={profile?.public_id || ''} 
                  onCopy={() => handleCopy(profile?.public_id || '', 'User ID')}
                  isCopied={copiedField === 'User ID'}
                />
                <InfoRow 
                  icon={<Share2 size={16} />} 
                  label="Referral Code" 
                  value={profile?.referral_code || 'N/A'} 
                  onCopy={() => handleCopy(profile?.referral_code || '', 'Referral Code')}
                  isCopied={copiedField === 'Referral Code'}
                />
                <InfoRow 
                  icon={<LinkIcon size={16} />} 
                  label="Referral Link" 
                  value={referralLink} 
                  onCopy={() => handleCopy(referralLink, 'Referral Link')}
                  isCopied={copiedField === 'Referral Link'}
                  truncate
                />
              </div>
            </div>
          </section>

          {/* Quick Actions for Mobile */}
          <div className="lg:hidden">
            <SettingsSidebar navigate={navigate} logout={logout} />
          </div>

          {/* Verification Banner */}
          <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-4 transition-colors">
            <div className="p-2.5 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
              <Check size={20} strokeWidth={3} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Your <span className="text-blue-500 font-bold">account is verified.</span> You have full access to all platform features.
            </p>
          </div>
        </div>

        {/* Sidebar Info Columns (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-12 xl:col-span-4 flex-col gap-8">
          <SettingsSidebar navigate={navigate} logout={logout} />
        </div>
      </div>

      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isUploading) {
                  stopCamera();
                  setShowPhotoModal(false);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-[#11141b] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black italic font-serif text-white">Profile Photo</h3>
                <button 
                  onClick={() => {
                    stopCamera();
                    setShowPhotoModal(false);
                  }}
                  className="p-2 text-aura-muted hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-aura-muted uppercase tracking-widest">Processing Node...</p>
                  </div>
                ) : photoMode === 'options' ? (
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setPhotoMode('avatar')}
                      className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Choose Avatar</h4>
                        <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1">Select from our premium 3D collection</p>
                      </div>
                    </button>

                    <button 
                      onClick={startCamera}
                      className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                        <Camera size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Take Photo</h4>
                        <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1">Use your device camera</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <Upload size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Upload Photo</h4>
                        <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1">Choose from your files</p>
                      </div>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : photoMode === 'avatar' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em]">Institutional Male</h4>
                        <span className="h-px bg-white/5 flex-1 mx-4" />
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        {MALE_AVATARS.map(avatar => (
                          <button 
                            key={avatar.id}
                            onClick={() => updatePhotoURL(avatar.url)}
                            className="aspect-square bg-white/5 rounded-xl border border-white/5 hover:border-primary transition-all overflow-hidden group p-1"
                          >
                            <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em]">Institutional Female</h4>
                        <span className="h-px bg-white/5 flex-1 mx-4" />
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        {FEMALE_AVATARS.map(avatar => (
                          <button 
                            key={avatar.id}
                            onClick={() => updatePhotoURL(avatar.url)}
                            className="aspect-square bg-white/5 rounded-xl border border-white/5 hover:border-secondary transition-all overflow-hidden group p-1"
                          >
                            <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setPhotoMode('options')}
                      className="w-full py-4 text-[10px] font-black text-aura-muted uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Back to options
                    </button>
                  </div>
                ) : photoMode === 'camera' ? (
                  <div className="space-y-6">
                    {capturedImage ? (
                      <div className="space-y-6">
                        <div className="aspect-square bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner">
                          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setCapturedImage(null)}
                            className="py-4 bg-white/5 text-aura-muted font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
                          >
                            Retake
                          </button>
                          <button 
                            onClick={handleSaveCaptured}
                            className="py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                          >
                            Apply Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner relative">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => {
                              stopCamera();
                              setPhotoMode('options');
                            }}
                            className="flex-1 py-4 bg-white/5 text-aura-muted font-black uppercase tracking-widest text-[10px] rounded-xl"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={capturePhoto}
                            className="flex-[2] py-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                          >
                            <Camera size={16} /> Capture
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSidebar({ navigate, logout }: { navigate: any, logout?: any }) {
  return (
    <div className="space-y-8 h-full">
      {/* Account Security Card */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" /> Account Security
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Keep your account safe and secure</p>
        </div>
        <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 transition-colors shadow-sm">
          <button 
            onClick={() => navigate('/settings')}
            className="w-full p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex items-center justify-between text-blue-500 group transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Go to Settings</span>
            </div>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Quick Actions Card */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={18} className="text-blue-500" /> Quick Actions
          </h3>
        </div>
        <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-colors shadow-sm">
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            <QuickAction label="Change Password" icon={<Lock size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Enable Two-Factor Auth" icon={<ShieldCheck size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Manage Devices" icon={<Monitor size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Logout" icon={<LogOut size={14} />} onClick={logout} isDanger />
          </ul>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value, 
  onCopy, 
  isCopied,
  truncate 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  onCopy?: () => void, 
  isCopied?: boolean,
  truncate?: boolean
}) {
  return (
    <div className="grid grid-cols-12 gap-3 p-5 items-center hover:bg-slate-500/5 transition-colors">
      <div className="col-span-1 text-blue-500 opacity-80">
        {icon}
      </div>
      <div className="col-span-4 md:col-span-3">
        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-none">{label}</p>
      </div>
      <div className="col-span-7 md:col-span-8 flex items-center justify-between gap-3 overflow-hidden">
        <p className={cn("text-xs font-bold text-slate-800 dark:text-slate-200", truncate ? "truncate" : "break-words")}>
          {value}
        </p>
        {onCopy && (
          <button 
            onClick={onCopy}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
          >
            {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAction({ label, icon, onClick, isDanger }: { label: string, icon?: React.ReactNode, onClick?: () => void, isDanger?: boolean }) {
  return (
    <li>
      <button 
        onClick={onClick}
        className={cn(
          "w-full px-6 py-4.5 flex items-center justify-between text-xs font-bold transition-all group",
          isDanger ? "text-red-500 hover:bg-red-500/10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-500/5"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="opacity-50">{icon}</span>}
          <span>{label}</span>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </button>
    </li>
  );
}


