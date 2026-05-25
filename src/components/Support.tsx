import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircleQuestion, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';
import { useAuth, handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  id: string;
}

export default function Support() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    username: profile?.username || '',
    userId: profile?.public_id || '',
    email: profile?.email || '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: `Hello ${profile?.name || 'there'}! I'm Wave Assistance. How can I assist you with your institutional asset flow today?`, id: '1' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-popup chatbot after a short delay
    const timer = setTimeout(() => setIsChatOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.message.trim()) return;

    setIsSubmitting(true);
    const path = 'support_tickets';
    try {
      await addDoc(collection(db, path), {
        ...ticketForm,
        userId: user?.uid, // Actual internal UID
        publicId: profile?.public_id,
        status: 'open',
        created_at: serverTimestamp()
      });
      setIsSubmitted(true);
      toast.success("Ticket submitted successfully");
      setTimeout(() => {
        setIsSubmitted(false);
        setTicketForm(prev => ({ ...prev, message: '' }));
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: chatInput, id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}` };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, userName: profile?.name })
      });
      
      const data = await response.json();

      const botMessage: ChatMessage = { 
        role: 'bot', 
        text: data.text || "I apologize, I'm having trouble processing your request. Please try contacting our support team directly.", 
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(7)}` 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const botMessage: ChatMessage = { 
        role: 'bot', 
        text: "I encountered an error. Please contact our support team via WhatsApp or Telegram.", 
        id: `bot-err-${Date.now()}-${Math.random().toString(36).substring(7)}` 
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Support Hero Card - Matching Profile Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d] p-8 lg:p-12 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
              <MessageCircleQuestion size={40} className="text-white" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-2xl lg:text-4xl font-black tracking-tight uppercase italic font-serif">Support Center</h1>
              <p className="text-white/70 text-sm font-medium tracking-wide">Nexus Institutional Help & Asset Assistance</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[9px] font-bold uppercase tracking-widest text-green-400">
                  <Zap size={10} className="fill-green-400" /> AI Bot Active
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/80">
                  <Globe size={10} /> 24/7 Global Priority
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Contact info & Links */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6 order-2 xl:order-1">
          <section className="space-y-4">
            <div className="px-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tighter">
                <ShieldCheck size={18} className="text-blue-500" /> Instant Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <ContactCard 
                icon={
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.012-3.857c1.616.96 3.2 1.48 4.767 1.487 5.429.006 9.851-4.412 9.854-9.845.002-2.63-1.018-5.101-2.872-6.958a9.813 9.813 0 00-6.964-2.84c-5.434 0-9.855 4.414-9.858 9.848-.002 1.704.437 3.371 1.272 4.881l-1.014 3.702 3.815-.975zM17.48 14.65c-.3-.15-1.782-.88-2.05-.98-.268-.1-.463-.15-.657.15-.194.3-.75.98-.918 1.18-.168.19-.337.21-.637.06-1.551-.78-2.73-1.39-3.793-3.217-.282-.48.282-.44.808-1.493.085-.17.043-.32-.02-.47-.064-.15-.657-1.58-.9-2.17-.236-.57-.475-.49-.656-.5l-.56-.01c-.194 0-.51.07-.777.37-.266.3-1.02 1.001-1.02 2.44 0 1.44 1.047 2.83 1.193 3.03.145.2 2.06 3.15 4.99 4.42.697.3 1.24.48 1.666.62.7.22 1.34.19 1.84.11.56-.08 1.7-.69 1.94-1.35.24-.66.24-1.22.17-1.35-.07-.13-.27-.21-.57-.36z" />
                  </svg>
                }
                label="WhatsApp Support" 
                value="+1 (369) 218-0529" 
                href="https://wa.me/13692180529?text=Hello%20WAVE%20Support,%20I%20need%20assistance."
                brandColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
              />
              <ContactCard 
                icon={
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.74 7.59-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.15.13.1.16.24.18.33-.02.08-.01.21-.02.31z"/>
                  </svg>
                } 
                label="Telegram Channel" 
                value="@tavariwavenetwork" 
                href="https://t.me/tavariwavenetwork"
                brandColor="text-sky-450"
                bgColor="bg-sky-500/15"
              />
              <ContactCard 
                icon={
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.17 14.16c-.02.04-.1.14-.14.14-.14 0-.46-.08-1-.31-.9-.37-1.96-1.08-2.67-1.78l-.34-.34c-.81-.82-.67-.78-.11-1.34.1-.11.23-.25.35-.4.18-.21.15-.31.02-.45-.1-.1-.7-1.63-.94-2.18-.11-.27-.26-.14-.38-.13l-.53.01c-.19 0-.48.06-.72.33-.24.27-1.03.95-1.03 2.33s.96 2.71 1.09 2.91c.13.19 1.95 2.98 4.73 4.18.66.28 1.18.45 1.58.58.66.21 1.25.18 1.73.11.53-.08 1.62-.66 1.85-1.28.23-.62.23-1.15.16-1.28-.06-.11-.24-.19-.52-.33-.28-.13-1.63-.8-1.88-.89-.25-.09-.43-.14-.62.14-.19.28-.73.91-.89 1.1z"/>
                  </svg>
                } 
                label="Telegram Group Chat" 
                value="Join Community Group" 
                href="https://t.me/+6E7YBryMyr1kOGQ0"
                brandColor="text-teal-400"
                bgColor="bg-teal-500/10"
              />
              <ContactCard 
                icon={<Mail size={16} />} 
                label="Verified Email Support" 
                value="tavariwavenetwork@support.com" 
                href="mailto:tavariwavenetwork@support.com"
                brandColor="text-indigo-400"
                bgColor="bg-indigo-500/10"
              />
              <ContactCard 
                icon={<Mail size={16} />} 
                label="Backup Gmail Inquiries" 
                value="tavariwavenetwork@gmail.com" 
                href="mailto:tavariwavenetwork@gmail.com"
                brandColor="text-pink-400"
                bgColor="bg-pink-500/10"
              />
            </div>
          </section>

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-aura-lime text-slate-950 rounded-xl">
                 <Bot size={20} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest italic font-serif">Wave Assistance</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Always Online</p>
               </div>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               Our institutional AI is trained to handle queries regarding node performance, transaction delays, and security protocols.
             </p>
             <button 
               onClick={() => setIsChatOpen(true)}
               className="w-full py-4 bg-aura-lime text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-transform hover:scale-[1.02] active:scale-[0.98]"
             >
               Launch Chat Interface
             </button>
          </section>
        </div>

        {/* Ticket Form */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6 order-1 xl:order-2">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-sm backdrop-blur-sm">
             <div className="mb-8">
               <h2 className="text-2xl font-black text-white uppercase tracking-tight italic font-serif">Open Priority Ticket</h2>
               <p className="text-slate-400 text-sm mt-1">Our support team typically responds within 2-4 hours.</p>
             </div>

             <form onSubmit={handleTicketSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          readOnly
                          value={ticketForm.username}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 outline-none"
                        />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Account ID</label>
                     <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          readOnly
                          value={ticketForm.userId}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 outline-none"
                        />
                     </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Verified Email</label>
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="email"
                        readOnly
                        value={ticketForm.email}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 outline-none"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Message / Query Description</label>
                   <textarea 
                     required
                     placeholder="Describe your issue or query in detail..."
                     value={ticketForm.message}
                     onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                     rows={6}
                     className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-sm font-medium text-slate-200 outline-none focus:border-blue-500 transition-all resize-none"
                   />
                </div>

                <button 
                  disabled={isSubmitting || !ticketForm.message}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]",
                    isSubmitted 
                      ? "bg-green-500 text-white" 
                      : "bg-slate-950 text-white hover:bg-black disabled:opacity-50"
                  )}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> Processing Request</>
                  ) : isSubmitted ? (
                    <><CheckCircle2 size={18} /> Request Dispatched</>
                  ) : (
                    <><Send size={16} /> Dispatch Ticket</>
                  )}
                </button>
             </form>
          </section>
        </div>
      </div>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[2000] w-[350px] md:w-[400px] h-[500px] md:h-[600px] bg-[#0a0c10] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
             {/* Chat Header */}
             <div className="bg-slate-900 p-5 flex items-center justify-between text-white border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-aura-lime rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-aura-lime/20">
                     <Bot size={22} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-widest italic font-serif">Wave Assistance</h4>
                      <p className="text-[10px] text-aura-lime font-bold uppercase tracking-widest">Online & Ready</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
             </div>

             {/* Chat Messages */}
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-transparent">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%] space-y-1",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 text-xs font-medium leading-relaxed leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl shadow-md" 
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-t-2xl rounded-br-2xl shadow-sm"
                    )}>
                       {msg.text}
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      {msg.role === 'user' ? 'Me' : 'Wave Assistance'}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex flex-col items-start space-y-1 max-w-[85%]">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-t-2xl rounded-br-2xl">
                       <div className="flex gap-1">
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                       </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
             </div>

             {/* Chat Input */}
             <div className="p-4 bg-[#0a0c10] border-t border-white/10">
                <div className="relative">
                   <input 
                     type="text"
                     placeholder="Type your message..."
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-xs font-bold text-slate-200 outline-none focus:border-blue-500 transition-all"
                   />
                   <button 
                     onClick={handleSendMessage}
                     disabled={!chatInput.trim() || isTyping}
                     className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-aura-lime text-slate-950 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100"
                   >
                     <Send size={16} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactCard({ icon, label, value, href, brandColor = "text-blue-500", bgColor = "bg-blue-500/10" }: { icon: React.ReactNode, label: string, value: string, href: string, brandColor?: string, bgColor?: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", bgColor, brandColor)}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xs font-black text-slate-100 tracking-tight">{value}</p>
        </div>
      </div>
      <ExternalLink size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors" />
    </a>
  );
}
