import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Shield, 
  TrendingUp, 
  Globe, 
  Zap,
  CheckCircle2,
  Lock,
  Eye,
  Award,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

const SectionHeader = ({ title, subtitle, icon: Icon, color = "primary" }: { title: string; subtitle?: string; icon: any; color?: string }) => (
  <div className="space-y-4 mb-12">
    <div className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
      color === "primary" ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
    )}>
      <Icon size={14} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
    </div>
    {subtitle && (
      <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-tight">
        {subtitle}
      </h2>
    )}
  </div>
);

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden">
      {/* Edge-to-Edge Premium Header Banner with Image Background */}
      <div className="w-full mb-16 relative overflow-hidden bg-[#050608]">
        <img 
          src="https://i.imgur.com/HNyJMEo.png" 
          alt="About Us Header" 
          className="w-full h-auto block select-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="px-6 pb-20 max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Tavari Wave Network</span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-aura-muted text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
          >
            WAVE is a modern digital investment and asset management platform founded by <span className="text-white">Anthony Willis</span>, created to provide individuals with access to professionally managed financial opportunities across global markets.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-aura-muted text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed opacity-80"
          >
            Built with a vision of combining innovation, accessibility, and institutional-grade financial management, WAVE empowers users to participate confidently in modern investment ecosystems through secure and structured investment solutions.
          </motion.p>
        </div>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <SectionHeader 
              title="Founder & Vision" 
              subtitle="Anthony Willis" 
              icon={Users}
            />
            <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
              <p>
                Anthony Willis founded WAVE with a clear and ambitious vision: 
                <span className="block text-white text-xl font-bold italic mt-4 mb-4">
                  "To simplify investing while maintaining the professional standards typically reserved for institutional investors."
                </span>
                With a deep interest in global financial markets and emerging digital assets, Anthony recognized early the growing demand for a platform capable of combining strategic trading, technology, and accessibility for everyday investors.
              </p>
              <p>
                His goal was to build a financial ecosystem where users could participate in professionally managed investment opportunities without requiring advanced trading knowledge or institutional capital.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[64px] border border-white/5 overflow-hidden flex items-center justify-center group">
              <Award size={120} className="text-white/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050608_70%)]" />
            </div>
            {/* Stats Overlay */}
            <div className="absolute -bottom-10 -right-10 bg-[#0A0B0E] border border-white/5 p-8 rounded-[32px] shadow-2xl backdrop-blur-xl">
               <p className="text-3xl font-black text-primary italic leading-none">24/7</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted mt-2">Active Monitoring</p>
            </div>
          </motion.div>
        </div>

        {/* The Early Foundation */}
        <div className="mb-32 p-12 bg-white/5 border border-white/5 rounded-[48px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 text-primary/5 -translate-y-4 translate-x-4">
             <TrendingUp size={160} />
           </div>
           <div className="relative z-10 max-w-3xl space-y-8">
              <SectionHeader title="History" subtitle="The Early Foundation" icon={TrendingUp} />
              <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
                <p>
                  The foundation of WAVE was heavily influenced by the transformation of global financial markets, especially the rise of digital assets alongside traditional instruments such as forex and commodities.
                </p>
                <p>
                  This strategic positioning enabled the platform to adopt a hybrid investment structure capable of leveraging both established and emerging financial opportunities across multiple sectors.
                </p>
                <p>
                  As financial technology evolved, WAVE continued refining its systems to align with modern market dynamics while maintaining stability, transparency, and long-term sustainability.
                </p>
              </div>
           </div>
        </div>

        {/* Philosophy Cards */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-aura-muted mb-4">Our Investment Philosophy</h3>
            <div className="flex items-center justify-center gap-4 text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
              <span>You Invest</span>
              <span className="text-primary">•</span>
              <span>We Manage</span>
              <span className="text-primary">•</span>
              <span>You Earn</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Sustainable performance", desc: "Long-term growth focus" },
              { icon: Zap, title: "Strategic diversification", desc: "Multi-market presence" },
              { icon: Eye, title: "Long-term value creation", desc: "Wealth accumulation" },
              { icon: Target, title: "Responsible capital management", desc: "Risk control first" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 transition-all duration-300"
              >
                <item.icon className="text-primary mb-6" size={32} />
                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">{item.title}</h4>
                <p className="text-xs font-bold text-aura-muted uppercase tracking-widest opacity-60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Markets We Operate In */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
           <div className="p-12 bg-[#0A0B0E] border border-white/5 rounded-[48px] space-y-8">
              <SectionHeader title="Markets" subtitle="Markets We Operate In" icon={Globe} />
              <p className="text-aura-muted font-medium leading-relaxed">
                WAVE maintains a diversified investment approach across several global financial sectors, including Foreign Exchange (Forex), Cryptocurrencies, Commodities, and Global Financial Instruments.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Forex', 'Crypto', 'Commodities', 'Global Stocks'].map((tag) => (
                  <div key={tag} className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 font-bold text-sm tracking-tight">
                    <CheckCircle2 size={16} className="text-primary" />
                    {tag}
                  </div>
                ))}
              </div>
           </div>

           <div className="p-12 bg-primary/5 border border-primary/20 rounded-[48px] space-y-8">
              <SectionHeader title="Security" subtitle="Security & Transparency" icon={Lock} />
              <p className="text-aura-muted font-medium leading-relaxed">
                Security and transparency remain fundamental pillars. Our infrastructure integrates secure authentication, encrypted data, and real-time dashboard monitoring.
              </p>
              <ul className="space-y-4">
                {[
                  "Secure authentication systems",
                  "Encrypted data processing",
                  "Real-time dashboard monitoring",
                  "Transparent investment tracking",
                  "Secure wallet management protocols"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-black uppercase tracking-widest italic">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
           </div>
        </div>

        {/* Experience & Strategic Execution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
           <div className="space-y-12">
              <SectionHeader title="Execution" subtitle="Experience & Strategic Execution" icon={Zap} />
              <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
                <p>Our team combines years of market experience across trading, analytics, and financial operations. We focus heavily on strategic trade execution and risk-controlled investment systems.</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    "Strategic trade execution",
                    "Risk-controlled investment systems",
                    "Continuous market monitoring",
                    "Adaptive financial strategies",
                    "Portfolio optimization techniques"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <CheckCircle2 size={14} className="text-primary" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           
           <div className="p-12 bg-white/5 border border-white/5 rounded-[48px] flex flex-col justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto border border-secondary/20">
                <Globe size={32} className="text-secondary" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Growing Global Community</h3>
              <p className="text-aura-muted font-medium leading-relaxed">
                WAVE continues expanding its presence across a growing international user base. Our commitment to transparency, operational reliability, and user satisfaction has positioned Tavari Wave Network as a trusted platform.
              </p>
           </div>
        </div>

        {/* Innovation & Future Growth */}
        <div className="mb-32 p-12 border border-white/10 rounded-[64px] bg-gradient-to-br from-[#0A0B0E] via-[#050608] to-[#0A0B0E]">
            <div className="max-w-3xl mx-auto text-center space-y-12">
               <SectionHeader title="Future" subtitle="Innovation & Future Growth" icon={Zap} color="secondary" />
               <p className="text-lg text-aura-muted font-medium leading-relaxed">
                 Under the leadership of Anthony Willis, WAVE remains focused on financial innovation, technological advancement, and strategic adaptability. As global financial markets continue evolving, we remain committed to integrating emerging technologies and refining operational strategies.
               </p>
            </div>
        </div>

        {/* Mission Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8 bg-gradient-to-t from-primary/20 to-transparent p-16 rounded-[64px] border-t border-primary/20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Our Mission</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-tight max-w-3xl mx-auto">
            To provide a secure, transparent, and efficient pathway <br />
            for financial growth in today’s evolving global economy.
          </h2>
          <p className="text-aura-muted font-medium max-w-2xl mx-auto">
            WAVE is committed to helping individuals access modern financial opportunities through professionally managed investment systems built on trust, security, and long-term sustainability.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
