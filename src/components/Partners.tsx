import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3, 
  CheckCircle2,
  ExternalLink,
  Cpu,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

const PARTNERS = [
  {
    name: "Binance",
    category: "Crypto Exchange",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=032",
    established: "2017",
    partneredSince: "2018",
    description: "Binance is the world's leading cryptocurrency exchange by trading volume, providing a robust ecosystem for digital asset trading, decentralized finance (DeFi), and blockchain innovation.",
    highlights: ["Deepest global liquidity pools", "Advanced API integrations", "Institutional-grade security infrastructure"]
  },
  {
    name: "TradingView",
    category: "Financial Charting & Analysis",
    logo: "https://cryptologos.cc/logos/polymath-poly-logo.svg?v=032", // Placeholder for TradingView style
    established: "2011",
    partneredSince: "2012",
    description: "TradingView is a globally renowned charting platform and social network used by millions of traders and investors to spot opportunities across global markets.",
    highlights: ["Advanced technical analysis tools", "Real-time global market data", "Custom Pine Script indicators"]
  },
  {
    name: "Headway",
    category: "Forex Broker",
    logo: "https://cryptologos.cc/logos/huobi-token-ht-logo.svg?v=032",
    established: "2023",
    partneredSince: "2024",
    description: "Headway is an innovative international broker offering seamless access to global financial markets with a focus on transparency, low latency, and client-centric conditions.",
    highlights: ["Ultra-fast execution speeds", "Diverse asset classes", "Robust regulatory compliance"]
  },
  {
    name: "Exness",
    category: "Multi-Asset Broker",
    logo: "https://cryptologos.cc/logos/quant-qnt-logo.svg?v=032",
    established: "2008",
    partneredSince: "2009",
    description: "Exness is a premier multi-asset broker known for its scientific approach to trading, offering some of the most stable and reliable trading conditions in the industry.",
    highlights: ["Proprietary algorithmic pricing", "Instant automated withdrawals", "Transparent historical tick data"]
  },
  {
    name: "OANDA",
    category: "Forex Broker & Data Provider",
    logo: "https://cryptologos.cc/logos/ocean-protocol-ocean-logo.svg?v=032",
    established: "1996",
    partneredSince: "1997",
    description: "OANDA is a trusted global leader in online multi-asset trading services, currency data, and analytics, serving retail and corporate clients worldwide.",
    highlights: ["Institutional-grade execution", "Award-winning trading platforms", "Precise currency data APIs"]
  },
  {
    name: "Coinbase",
    category: "Crypto Exchange",
    logo: "https://cryptologos.cc/logos/coinbase-coin-base-logo.svg?v=032",
    established: "2012",
    partneredSince: "2013",
    description: "Coinbase is a secure, publicly traded platform that makes it easy to buy, sell, and store cryptocurrency, serving as a primary gateway for institutional adoption.",
    highlights: ["Strict regulatory compliance", "Coinbase Prime for institutions", "Secure cold storage infrastructure"]
  },
  {
    name: "KuCoin",
    category: "Crypto Exchange",
    logo: "https://cryptologos.cc/logos/kucoin-token-kcs-logo.svg?v=032",
    established: "2017",
    partneredSince: "2018",
    description: "Known as the \"People's Exchange,\" KuCoin is a global cryptocurrency exchange that provides a wide array of digital assets, advanced trading features, and community-driven growth.",
    highlights: ["Extensive altcoin selection", "High-performance matching engine", "Robust security protocols"]
  },
  {
    name: "OKX",
    category: "Crypto Exchange & Web3",
    logo: "https://cryptologos.cc/logos/okb-okb-logo.svg?v=032",
    established: "2017",
    partneredSince: "2018",
    description: "OKX is a leading global cryptocurrency spot and derivatives exchange and Web3 ecosystem, offering advanced financial services to traders globally.",
    highlights: ["Comprehensive derivatives market", "Advanced Web3 wallet integration", "Deep cross-pair liquidity"]
  },
  {
    name: "IC Markets",
    category: "Forex CFD Provider",
    logo: "https://cryptologos.cc/logos/icon-icx-logo.svg?v=032",
    established: "2007",
    partneredSince: "2008",
    description: "IC Markets is one of the world's largest True ECN forex brokers, providing trading solutions for active day traders and scalpers as well as novices.",
    highlights: ["Raw spread connectivity", "Enterprise-grade hardware", "Minimal latency routing"]
  },
  {
    name: "OctaFX",
    category: "Forex Broker",
    logo: "https://cryptologos.cc/logos/octo-token-octo-logo.svg?v=032",
    established: "2011",
    partneredSince: "2012",
    description: "OctaFX is a globally recognized forex broker providing state-of-the-art trading platforms, tight spreads, and a commitment to helping traders achieve goals.",
    highlights: ["No-dealing desk execution", "Comprehensive educational resources", "Localized global support"]
  }
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-[#050608] text-white pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary"
          >
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Ecosystem</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none"
          >
            Our <span className="text-primary">Partners</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-aura-muted text-base md:text-lg max-w-2xl mx-auto font-medium"
          >
            We collaborate with the world's leading financial institutions, exchanges, and technology providers to deliver unparalleled liquidity, security, and execution speed.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNERS.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group bg-[#0A0B0E] border border-white/5 rounded-[32px] p-8 hover:border-primary/30 transition-all duration-500 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-6 relative z-10 h-full flex flex-col">
                {/* Logo & Category */}
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center p-3 border border-white/10 group-hover:scale-110 transition-transform">
                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain brightness-100 contrast-125" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic tracking-tight uppercase leading-none mb-1">{partner.name}</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{partner.category}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div>
                    <p className="text-[8px] font-bold text-aura-muted uppercase tracking-widest mb-1">Established</p>
                    <p className="text-xs font-black text-white">{partner.established}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-aura-muted uppercase tracking-widest mb-1">TWN Partner since</p>
                    <p className="text-xs font-black text-white">{partner.partneredSince}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-aura-muted font-medium leading-relaxed flex-1">
                  {partner.description}
                </p>

                {/* Highlights */}
                <div className="space-y-3 pt-4">
                  <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] opacity-40">Key Highlights</p>
                  <ul className="space-y-2">
                    {partner.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-[10px] font-bold text-white/80">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-12 bg-[#0A0B0E] border border-white/5 rounded-[48px] text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-sm md:text-base font-bold text-aura-muted leading-relaxed italic">
              "We trade with No-Dealing Desk (NDD) brokers: Straight Through Processing (STP). STP brokers route their clients' orders directly to liquidity providers and we also are solidified by our liquidity pool on <a href="https://www.binance.com/en/swap/pool" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://www.binance.com/en/swap/pool</a> web3 built on coinbase, kucoin.com and okx.com"
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Partners;
