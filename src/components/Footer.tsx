import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Globe, Twitter, Github, MessageSquare, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-20 border-t border-white/5 bg-[#050608] overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2" />
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img src="https://i.imgur.com/wU33xy3.png" alt="Wave Logo" className="h-12 lg:h-16 w-auto object-contain" />
              <span className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Wave</span>
            </div>
            <p className="text-aura-muted text-xs leading-relaxed max-w-xs font-medium">
              {t("Institutional-grade digital asset management platform powered by high-frequency algorithmic neural networks. Redefining the future of automated equity growth.")}
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Github, MessageSquare].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-aura-muted hover:text-primary hover:border-primary/30 transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t("Ecosystem")}</h4>
            <ul className="space-y-3">
              {[
                { name: 'Market Tickers', path: '/markets' },
                { name: 'TWN Token Portal', path: '/token' },
                { name: 'Strategic Nodes', path: '/nodes' },
                { name: 'Liquidity Pools', path: '/pools' },
                { name: 'FAQ', path: '/faq' },
                { name: 'About WAVE', path: '/about' },
                { name: 'How WAVE Works', path: '/how-it-works' },
                { name: 'Our Partners', path: '/partners' },
                { name: 'Investor Reviews', path: '/reviews' },
                { name: 'Neural Analytics', path: '/neural-analytics' }
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                    <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    {t(link.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t("Legal & Compliance")}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                  <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  {t("Terms of Service")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                  <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  {t("Privacy & Security")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                  <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  {t("Cookie Policy")}
                </Link>
              </li>
              <li>
                <Link to="/aml" className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                  <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  {t("AML Policy")}
                </Link>
              </li>
              <li>
                <Link to="/certification-compliance" className="text-aura-muted hover:text-primary text-xs transition-colors flex items-center gap-2 group">
                  <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  {t("Certification & Compliance")}
                </Link>
              </li>
            </ul>
          </div>

          {[Twitter, Github, MessageSquare].length > 0 && (
            /* Contact */
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t("Support Terminal")}</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Mail size={16} className="text-primary" />
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">{t("Global Inquiries")}</p>
                    <p className="text-xs text-white font-mono lowercase">tavariwavenetwork@support.com</p>
                    <p className="text-[10px] text-white/40 font-mono lowercase">tavariwavenetwork@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Globe size={16} className="text-primary" />
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">{t("Network Status")}</p>
                    <p className="text-xs text-emerald-500 font-mono uppercase tracking-tighter">{t("Systems Operational")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-medium text-white/20 tracking-wide">
            {t("© 2026 TAVARI WAVE NETWORK. LICENSED SECURE ARCHITECTURE.")}
          </p>
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-black text-primary italic uppercase tracking-[0.3em]">{t("Quantum-Ready Security")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
