import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Search, 
  ChevronDown, 
  SlidersHorizontal, 
  ThumbsUp, 
  MoreHorizontal, 
  CheckCircle2,
  Calendar,
  Filter,
  ArrowRight,
  MessageSquarePlus,
  Loader2,
  X,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { REVIEWS, Review } from '../constants/landingData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';

// --- HELPERS ---
const CATEGORIES = ['All Investments', 'Growth Plan', 'Customer Support', 'Security', 'User Experience', 'High Returns', 'Transparency'];
const RATINGS = ['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
const TIME_FILTERS = ['All Time', 'Last 24 Hours', 'Last Week', 'Last Month', 'Last Year'];

const TAGS = ['Growth Plan', 'Customer Support', 'Security', 'Easy to Use', 'High Returns', 'Transparency'];

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  if (diff < 2592000000) return `${Math.floor(diff / 604800000)} weeks ago`;
  if (diff < 31536000000) return `${Math.floor(diff / 2592000000)} months ago`;
  return `${Math.floor(diff / 31536000000)} years ago`;
};

// Convert "X days ago" string to approximate timestamp for consistent dynamic updates
const parseTimeAgo = (timeStr: string): number => {
  const now = Date.now();
  const num = parseInt(timeStr) || 1;
  if (timeStr.includes('minute')) return now - num * 60000;
  if (timeStr.includes('hour')) return now - num * 3600000;
  if (timeStr.includes('day')) return now - num * 86400000;
  if (timeStr.includes('week')) return now - num * 604800000;
  if (timeStr.includes('month')) return now - num * 2592000000;
  if (timeStr.includes('year')) return now - num * 31536000000;
  return now - 86400000;
};

const ReviewCard = React.memo(({ review, index }: { review: Review & { timestamp?: number }; index: number }) => {
  const [timeText, setTimeText] = useState(review.timestamp ? formatRelativeTime(review.timestamp) : review.timeAgo);

  useEffect(() => {
    if (!review.timestamp) return;
    const interval = setInterval(() => {
      setTimeText(formatRelativeTime(review.timestamp!));
    }, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [review.timestamp]);

  const tag = useMemo(() => {
    const hash = review.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TAGS[hash % TAGS.length];
  }, [review.id]);

  const initial = review.name.charAt(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.05 }}
      style={{ transform: 'translateZ(0)' }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-emerald-500/30 transition-all duration-300 group relative flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 overflow-hidden">
             <span className="text-emerald-500 font-bold">{initial}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">{review.name}</h4>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10">
                <CheckCircle2 size={10} />
                <span>Verified</span>
              </div>
            </div>
            <p className="text-[10px] text-aura-muted mt-0.5">{timeText}</p>
          </div>
        </div>
        <button className="text-aura-muted hover:text-white transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={cn(
              i < review.rating ? "text-emerald-500 fill-emerald-500" : "text-white/10 fill-white/10"
            )} 
          />
        ))}
      </div>

      <p className="text-sm text-aura-muted leading-relaxed mb-6 line-clamp-4">
        {review.text}
      </p>

      <div className="mt-auto">
        <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-4">
          {tag}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-aura-muted hover:text-emerald-500 transition-colors">
            <ThumbsUp size={12} />
            Helpful ({Math.floor(Math.random() * 50) + 1})
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function ReviewsPage() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [categoryFilter, setCategoryFilter] = useState('All Investments');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [limit, setLimit] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [customReviews, setCustomReviews] = useState<any[]>([]);
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prepare base reviews with mixed ratings
  const baseReviews = useMemo(() => {
    const cloned = [...REVIEWS];
    let twoStarCount = 0;
    let threeStarCount = 0;

    // Force ~20 2-stars and ~30 3-stars for the first bit of data to meet quota while maintaining randomness
    const modified = cloned.map((r, i) => {
      let rating = r.rating;
      if (twoStarCount < 20 && i % 15 === 0) {
        rating = 2;
        twoStarCount++;
      } else if (threeStarCount < 30 && i % 10 === 0) {
        rating = 3;
        threeStarCount++;
      }
      return { 
        ...r, 
        rating, 
        text: r.text.replace(/^["'“]|["'”]$/g, ''), // Remove quotes
        timestamp: parseTimeAgo(r.timeAgo) 
      };
    });

    return modified.sort(() => Math.random() - 0.5); // Randomly mixed by default
  }, []);

  const allReviews = useMemo(() => {
    const combined = [...customReviews, ...baseReviews];
    if (sortBy === 'Most Recent') {
      return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return combined;
  }, [customReviews, baseReviews, sortBy]);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(review => {
      const matchesSearch = review.name.toLowerCase().includes(search.toLowerCase()) || 
                           review.text.toLowerCase().includes(search.toLowerCase());
      
      const ratingValue = ratingFilter === 'All Ratings' ? null : parseInt(ratingFilter[0]);
      const matchesRating = !ratingValue || review.rating === ratingValue;
      
      // Since we don't have real category data, we'll just mock it for consistency
      const matchesCategory = categoryFilter === 'All Investments' || true; 
      
      return matchesSearch && matchesRating && matchesCategory;
    });
  }, [allReviews, search, ratingFilter, categoryFilter, timeFilter]);

  const displayedReviews = filteredReviews.slice(0, limit);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setLimit(prev => prev + 12);
      setIsLoadingMore(false);
    }, 800);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = allReviews.length;
    const avg = (allReviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1);
    
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        (dist as any)[r.rating]++;
      }
    });

    const distributionPercentages = {
      5: Math.round((dist[5] / total) * 100),
      4: Math.round((dist[4] / total) * 100),
      3: Math.round((dist[3] / total) * 100),
      2: Math.round((dist[2] / total) * 100),
      1: Math.round((dist[1] / total) * 100),
    };

    return { total, avg, distribution: distributionPercentages };
  }, [allReviews]);

  const handleAddReview = (newReview: any) => {
    setCustomReviews(prev => [newReview, ...prev]);
    setIsWriteModalOpen(false);
    setSortBy('Most Recent');
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white selection:bg-emerald-500 selection:text-white">
      {/* Premium Navbar */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[100] transition-all duration-500 h-20 px-6 lg:px-20 flex items-center justify-between backdrop-blur-md border-b",
        isScrolled ? "bg-[#050816]/90 border-primary/20 h-16" : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/welcome')}>
          <img src="https://i.imgur.com/wU33xy3.png" alt="Logo" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
          <span className="text-xl lg:text-2xl font-black uppercase tracking-tighter leading-none">Wave</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
           {['Home', 'About Us', 'Investments', 'Features', 'How It Works', 'Reviews', 'Blog', 'Contact'].map(item => (
             <button 
               key={item} 
               onClick={() => item === 'Home' ? navigate('/welcome') : item === 'Investments' ? navigate('/invest') : null}
               className={cn(
                 "text-[10px] font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors",
                 item === 'Reviews' ? "text-emerald-500" : "text-white/60"
               )}
             >
               {item}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/welcome')}
             className="text-[10px] font-bold uppercase tracking-widest hidden sm:block"
           >
             Log In
           </button>
           <button 
             onClick={() => navigate('/invest')}
             className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
           >
             Invest Now
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-20 px-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Star size={12} className="text-emerald-500 fill-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Trusted by Thousands</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">
              Real <span className="text-emerald-500">Reviews</span> from<br/>
              Real <span className="text-white/60">Investors</span>
            </h1>
            <p className="text-lg text-aura-muted font-medium max-w-lg">
              Discover what our users are saying about their experience with our investment platform.
            </p>
          </div>

          {/* Stats Card */}
          <div className="lg:justify-self-end w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative group">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
               <div className="text-center">
                 <p className="text-6xl font-black text-white">{stats.avg}</p>
                 <div className="flex items-center justify-center gap-0.5 my-3">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} size={18} className="text-emerald-500 fill-emerald-500" />
                   ))}
                 </div>
                 <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">Out of 5</p>
                 <p className="text-[10px] font-bold text-aura-muted/60 uppercase tracking-widest mt-1">Based on {stats.total} reviews</p>
               </div>
               
               <div className="flex-1 w-full space-y-3">
                 {[5, 4, 3, 2, 1].map((rating) => (
                   <div key={rating} className="flex items-center gap-3">
                     <span className="text-[10px] font-bold text-white/40 w-12">{rating} Stars</span>
                     <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(stats.distribution as any)[rating]}%` }}
                         transition={{ duration: 1, delay: 0.5 }}
                         className="h-full bg-emerald-500"
                       />
                     </div>
                     <span className="text-[10px] font-bold text-white/40 w-8">{(stats.distribution as any)[rating]}%</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-16 lg:top-20 z-50 px-6 py-6 border-y border-white/5 bg-[#050816]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-medium focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <FilterSelect value={ratingFilter} onChange={setRatingFilter} options={RATINGS} />
             <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES} />
             <FilterSelect value={timeFilter} onChange={setTimeFilter} options={TIME_FILTERS} />
             
             <button 
               onClick={() => setIsWriteModalOpen(true)}
               className="h-14 px-6 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 ml-auto lg:ml-0"
             >
               <MessageSquarePlus size={16} />
               Write a Review
             </button>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-xl font-bold">
            All <span className="text-emerald-500 italic">Reviews</span> ({filteredReviews.length})
          </h3>
          
          <div className="flex items-center gap-2 text-[10px] font-bold text-aura-muted uppercase tracking-widest cursor-pointer hover:text-white transition-colors group">
            Sort by: <span className="text-white group-hover:text-emerald-500">{sortBy}</span>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-[600px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {displayedReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {limit < filteredReviews.length && (
          <div className="flex justify-center mt-20">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  Loading...
                </>
              ) : (
                <>
                  <Calendar size={16} className="text-emerald-500" />
                  Load More Reviews
                </>
              )}
            </button>
          </div>
        )}

        {filteredReviews.length === 0 && (
          <div className="py-40 text-center space-y-4">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-aura-muted/20" />
             </div>
             <h4 className="text-2xl font-bold">No results found</h4>
             <p className="text-aura-muted text-sm max-w-xs mx-auto">
               Try adjusting your filters or search term to find what you're looking for.
             </p>
             <button 
                onClick={() => {
                  setSearch('');
                  setRatingFilter('All Ratings');
                  setCategoryFilter('All Investments');
                  setTimeFilter('All Time');
                }}
                className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest hover:underline pt-4"
             >
               Clear All Filters
             </button>
          </div>
        )}
      </section>

      <WriteReviewModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        onSubmit={handleAddReview}
        userName={profile?.fullName || user?.displayName || 'Investor'}
      />

      <Footer />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all whitespace-nowrap",
          isOpen ? "border-emerald-500/40 bg-white/[0.08]" : ""
        )}
      >
        <span className={cn(value.includes('All') ? "text-aura-muted" : "text-emerald-500")}>{value}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-56 bg-[#0c101d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[60] py-2"
          >
            {options.map((opt) => (
              <button 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors",
                  value === opt ? "text-emerald-500 bg-emerald-500/5" : "text-aura-muted hover:text-white hover:bg-white/5"
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WriteReviewModal({ isOpen, onClose, onSubmit, userName }: { isOpen: boolean, onClose: () => void, onSubmit: (r: any) => void, userName: string }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        id: `custom-${Date.now()}`,
        name: userName,
        rating,
        text: text.trim(),
        timestamp: Date.now(),
        verified: true,
        countryCode: 'US', // default
        countryName: 'USA'
      });
      setText('');
      setRating(5);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0c1122]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl z-[201] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="relative space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <MessageSquarePlus size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Share your <span className="text-emerald-500">experience</span></h2>
                <p className="text-aura-muted text-sm font-medium">Your feedback helps thousands of investors make better decisions.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your Name</label>
                  <input 
                    type="text" 
                    value={userName} 
                    disabled 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white/40 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center block">Rating</label>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="group transition-transform active:scale-95"
                      >
                        <Star 
                          size={32} 
                          className={cn(
                            "transition-all duration-300",
                            star <= rating ? "text-emerald-500 fill-emerald-500 scale-110" : "text-white/10 fill-white/10 hover:text-white/20"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Review</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us what you think..."
                    autoFocus
                    required
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !text.trim()}
                  className="w-full h-16 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
