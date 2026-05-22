import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Wallet, 
  ArrowRight, 
  MessageSquare, 
  Globe, 
  Scale, 
  BarChart3,
  Mail,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  icon: any;
}

const faqs: FAQItem[] = [
  {
    id: 'how-it-works',
    question: 'How does WAVE work?',
    icon: Zap,
    answer: (
      <p>
        WAVE is a professionally managed asset management platform powered by Tavari Wave Network. Our expert trading teams leverage advanced quantitative strategies across Forex, cryptocurrency markets, and commodities. By pooling investor capital, we execute high-volume institutional-grade trades and distribute returns to investors according to their selected investment tier.
      </p>
    )
  },
  {
    id: 'investment-plans',
    question: 'What are the available investment plans?',
    icon: BarChart3,
    answer: (
      <div className="space-y-4">
        <p>We offer three specialized investment tiers designed for different financial goals and investment capacities:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Regular Plan</span> — Entry-level tier for new and growing investors
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Premium Plan</span> — Mid-level plan designed for accelerated wealth accumulation
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Elite Plan</span> — Institutional-grade tier tailored for high-net-worth investors
          </li>
        </ul>
        <p>Each plan includes unique investment thresholds, ROI structures, and strategic benefits.</p>
      </div>
    )
  },
  {
    id: 'deposit-process',
    question: 'How do I deposit funds and begin investing?',
    icon: Wallet,
    answer: (
      <p>
        Deposits can be initiated securely through your dashboard using our supported payment methods. After funding your account, you must manually navigate to the <span className="text-primary font-bold">Investments</span> section and activate your preferred investment plan. Returns are generated only from active investment deployments.
      </p>
    )
  },
  {
    id: 'withdrawal-process',
    question: 'What is the withdrawal process?',
    icon: ArrowRight,
    answer: (
      <p>
        Withdrawals are streamlined for speed and efficiency. Each investment tier features a minimum withdrawal threshold and a specific processing timeframe. Once your <span className="font-bold">Withdrawable Profit</span> balance reaches the required threshold, you can request a transfer directly to your registered wallet or bank account.
      </p>
    )
  },
  {
    id: 'security',
    question: 'Is my investment secure with WAVE?',
    icon: ShieldCheck,
    answer: (
      <div className="space-y-4">
        <p>Security remains a core foundation of Tavari Wave Network. We implement:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Multi-signature cold storage systems for digital assets</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Bank-grade SSL encryption for all transactions and communications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Advanced risk management frameworks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Internal reserve protocols designed to mitigate market volatility exposure</span>
          </li>
        </ul>
        <p>Our infrastructure is built to maintain institutional-grade protection standards.</p>
      </div>
    )
  },
  {
    id: 'multiple-plans',
    question: 'Can I maintain multiple active investment plans simultaneously?',
    icon: HelpCircle,
    answer: (
      <p>
        Yes. Investors are encouraged to diversify their portfolio allocations by operating multiple investment plans simultaneously. You may run any combination of Regular Plans, Premium Plans, and Elite Plans under a single verified account.
      </p>
    )
  },
  {
    id: 'deposit-timeframe',
    question: 'How long does it take for my deposit to reflect?',
    icon: Globe,
    answer: (
      <p>
        Digital asset deposits are typically confirmed within <span className="font-black text-primary italic">10–30 minutes</span>, depending on blockchain network congestion. Traditional bank transfers may require additional processing time based on banking schedules and verification windows. Your dashboard updates automatically once your transaction is verified successfully.
      </p>
    )
  },
  {
    id: 'forgot-to-activate',
    question: 'What happens if I forget to activate my investment after depositing?',
    icon: MessageSquare,
    answer: (
      <p>
        Funds deposited but not assigned to an active investment plan remain safely stored inside your <span className="font-bold">Wallet Balance</span>. However, ROI generation does not begin until funds are committed to an active investment cycle.
      </p>
    )
  },
  {
    id: 'contact-support',
    question: 'How do I contact professional support?',
    icon: Mail,
    answer: (
      <div className="space-y-4">
        <p>Our support infrastructure operates <span className="text-secondary font-black italic">24/7</span>. You can reach our dedicated support team through:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>The in-app <span className="font-bold">Support Portal</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>The dashboard support section</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>Direct email assistance</span>
          </li>
        </ul>
        <p>
          For priority technical assistance, contact:{' '}
          <a href="mailto:tavariwavenetwork@support.com" className="text-primary font-black italic underline hover:text-primary/80 transition-colors">
            tavariwavenetwork@support.com
          </a>
        </p>
      </div>
    )
  },
  {
    id: 'regulation',
    question: 'Is Tavari Wave Network regulated in Nigeria?',
    icon: Scale,
    answer: (
      <p>
        Yes. Tavari Wave Network operates in compliance with applicable Nigerian regulatory requirements and is duly registered with the Nigerian Corporate Affairs Commission (CAC), alongside adherence to relevant industry standards and operational compliance frameworks.
      </p>
    )
  }
];

const FAQAccordion = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => {
  const Icon = item.icon;

  return (
    <div 
      className={cn(
        "group relative border border-white/5 bg-[#0A0B0E] rounded-[32px] overflow-hidden transition-all duration-500",
        isOpen ? "shadow-[0_20px_50px_rgba(139,92,246,0.1)] border-primary/20" : "hover:border-white/10"
      )}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-8 text-left"
      >
        <div className="flex items-center gap-6">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
            isOpen ? "bg-primary text-white rotate-12 scale-110 shadow-lg shadow-primary/20" : "bg-white/5 text-aura-muted group-hover:bg-white/10 group-hover:text-white"
          )}>
            <Icon size={20} />
          </div>
          <span className={cn(
            "text-lg font-bold tracking-tight transition-colors duration-300",
            isOpen ? "text-white" : "text-white/70 group-hover:text-white"
          )}>
            {item.question}
          </span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-white text-black rotate-180 border-white" : "text-white/30"
        )}>
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="pl-8 md:pl-[104px] pr-8 md:pr-16 pb-10 text-aura-muted text-sm md:text-base leading-relaxed font-medium">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden">
      {/* Edge-to-Edge Premium Header Banner with Image Background */}
      <div className="w-full mb-16 relative overflow-hidden bg-[#050608]">
        <img 
          src="https://i.imgur.com/8GLvK0L.png" 
          alt="FAQ Header" 
          className="w-full h-auto block select-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="px-6 pb-20 w-full max-w-7xl mx-auto relative z-10 md:px-10">
        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-3xl mx-auto mb-20"
        >
          <div className="absolute inset-y-0 left-6 flex items-center text-aura-muted">
            <Search size={22} />
          </div>
          <input 
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-white/5 rounded-[32px] py-7 pl-16 pr-8 text-white text-lg focus:border-primary/50 outline-none transition-all duration-300 placeholder:text-white/20 font-medium shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* FAQ Grid */}
        <div className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="w-full"
              >
                <FAQAccordion 
                  item={faq} 
                  isOpen={openId === faq.id}
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredFaqs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-aura-muted font-black uppercase tracking-widest text-xs">No matching questions found</p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 p-12 bg-gradient-to-br from-[#0A0B0E] to-[#050608] border border-white/5 rounded-[48px] text-center space-y-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 text-primary/5 -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-700">
            <MessageSquare size={120} />
          </div>
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Additional Information</h2>
            <p className="text-aura-muted text-sm font-medium max-w-xl mx-auto leading-relaxed">
              If you require further assistance regarding investments, withdrawals, security, account verification, or technical support, please contact our support team through the official support channels.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 relative z-10">
            <a 
              href="mailto:tavariwavenetwork@support.com"
              className="flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 transition-all shadow-xl"
            >
              <Mail size={16} />
              Contact Professional Support
            </a>
            <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl italic">
              <Globe size={16} className="text-primary" />
              24/7 Support Active
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
