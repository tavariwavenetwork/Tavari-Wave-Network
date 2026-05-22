import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  CheckCheck,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: any;
}

export default function NotificationsPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(items);
      setLoading(false);
    }, (error) => {
      console.error("Notifications fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-aura-lime" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-400" size={18} />;
      case 'error': return <XCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-400" size={18} />;
    }
  };

  const parseDate = (date: any) => {
    if (!date) return new Date();
    if (typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-aura-lime/20 border-t-aura-lime rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
            <Bell className="text-aura-lime" size={32} />
            {t('notifications')}
          </h1>
          <p className="text-aura-muted text-sm mt-1 uppercase tracking-widest font-medium">
            Stay updated with your account activity
          </p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-aura-muted hover:text-white hover:bg-white/10 transition-all self-start"
          >
            <CheckCheck size={14} />
            {t('mark_all_read')}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-aura-muted" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">{t('no_notifications')}</h3>
            <p className="text-aura-muted text-xs uppercase tracking-widest">We'll alert you when something happens</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "relative group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300",
                  notification.read 
                    ? "bg-white/5 border-white/5 opacity-60" 
                    : "bg-aura-lime/5 border-aura-lime/20 shadow-[0_0_20px_rgba(212,255,0,0.05)]"
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                {!notification.read && (
                  <div className="absolute top-5 left-2 w-1.5 h-1.5 bg-aura-lime rounded-full shadow-[0_0_8px_rgba(212,255,0,0.8)]" />
                )}
                
                <div className={cn(
                  "p-2.5 rounded-xl border flex-shrink-0",
                  notification.read ? "bg-white/5 border-white/5" : "bg-aura-lime/10 border-aura-lime/10"
                )}>
                  {getTypeIcon(notification.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "text-sm font-bold uppercase tracking-tight truncate",
                      notification.read ? "text-white/70" : "text-white"
                    )}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-aura-muted uppercase tracking-widest whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full">
                      <Clock size={10} />
                      {notification.created_at ? formatDistanceToNow(parseDate(notification.created_at), { addSuffix: true }) : 'just now'}
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs leading-relaxed max-w-2xl",
                    notification.read ? "text-aura-muted" : "text-white/80"
                  )}>
                    {notification.message}
                  </p>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 text-aura-muted hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  {!notification.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-2 text-aura-muted hover:text-aura-lime transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
