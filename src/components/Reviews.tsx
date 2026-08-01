import React, { useContext, useState, useMemo } from 'react';
import { Star, Filter, Quote, Globe, Facebook, MessageSquare, ThumbsUp, CornerDownRight, CheckCircle2, Layout, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppContext } from '../App';
import { googleReviewsData, facebookReviewsData, webReviewsData } from '../constants/data';
import { cn } from '../lib/utils';

const GOOGLE_REVIEW_LINK = "https://g.page/r/CRgnjQFjh1wREBM/review";
const FACEBOOK_REVIEW_LINK = "https://www.facebook.com/flavoursbymusu/reviews";

interface ReviewSummaryChartProps {
  rating: number;
  totalReviews: string;
  lang: string;
  titleEn: string;
  titleBn: string;
  source: 'google' | 'facebook' | 'web';
}

function ReviewSummaryChart({ rating, totalReviews, lang, titleEn, titleBn, source }: ReviewSummaryChartProps) {
  // Mock distribution percentages for a nice UI
  const distributions = source === 'google' 
    ? [{ star: 5, pct: '92%' }, { star: 4, pct: '5%' }, { star: 3, pct: '2%' }, { star: 2, pct: '1%' }, { star: 1, pct: '0%' }]
    : source === 'facebook'
    ? [{ star: 5, pct: '98%' }, { star: 4, pct: '2%' }, { star: 3, pct: '0%' }, { star: 2, pct: '0%' }, { star: 1, pct: '0%' }]
    : [{ star: 5, pct: '95%' }, { star: 4, pct: '4%' }, { star: 3, pct: '1%' }, { star: 2, pct: '0%' }, { star: 1, pct: '0%' }];

  return (
    <div className="mb-10 p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'en' ? titleEn : titleBn}
            </h3>
            {source !== 'web' && (
              <a href={source === 'google' ? GOOGLE_REVIEW_LINK : FACEBOOK_REVIEW_LINK} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-pink-500 transition-colors" title="View Source">
                {source === 'google' ? <Globe size={16} /> : <Facebook size={16} />}
              </a>
            )}
            {source === 'web' && <Layout size={16} className="text-slate-400" />}
          </div>
          
          <div className="space-y-1.5 max-w-md mt-4">
            {distributions.map(row => (
              <div key={row.star} className="flex items-center gap-3 text-[10px] sm:text-xs">
                <span className="w-3 font-bold text-slate-600 dark:text-slate-400">{row.star}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: row.pct }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-amber-400 rounded-full" 
                  />
                </div>
                <span className="w-8 text-right text-slate-400 font-medium">{row.pct}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 pt-4 md:pt-0 md:pl-8">
          <div className="text-5xl font-black text-slate-900 dark:text-white">{rating.toFixed(1)}</div>
          <div className="flex gap-1 my-2">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= Math.round(rating) ? "currentColor" : "none"} className={i <= Math.round(rating) ? "text-amber-400" : "text-slate-300"} />)}
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {totalReviews}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { t, dynamicReviews, addDynamicReview, updateReviewReply, isAdminLoggedIn, setIsAdminLoggedIn } = useContext(AppContext);
  const [source, setSource] = useState<'google' | 'facebook' | 'web'>('web');
  const [filter, setFilter] = useState('relevant');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ name: string; text: string; rating: number; files: File[] }>({ name: '', text: '', rating: 5, files: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Owner Reply State
  const [replyingReview, setReplyingReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const rawReviews = useMemo(() => {
    // Filter dynamic reviews by source
    const filtered = dynamicReviews.filter(r => r.source === source || (!r.source && source === 'web'));
    
    if (source === 'web') {
      const combined = [...filtered, ...webReviewsData];
      const uniqueMap = new Map();
      combined.forEach(item => {
        const key = `${item.nameEn}_${item.textEn}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, item);
      });
      return Array.from(uniqueMap.values());
    }

    if (filtered.length > 0) return filtered;

    if (source === 'google') return googleReviewsData;
    if (source === 'facebook') return facebookReviewsData;
    return webReviewsData;
  }, [dynamicReviews, source]);

  const stats = useMemo(() => {
    if (rawReviews.length === 0) return { rating: 5, total: 0 };
    const total = rawReviews.length;
    const sum = rawReviews.reduce((acc, r) => acc + r.rating, 0);
    return { rating: sum / total, total };
  }, [rawReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.text) return;
    
    setIsSubmitting(true);
    const newReview = {
      nameEn: reviewForm.name,
      nameBn: reviewForm.name,
      rating: reviewForm.rating,
      textEn: reviewForm.text,
      textBn: reviewForm.text,
      timeEn: 'Just now',
      timeBn: 'এইমাত্র',
      source: 'web' as const,
      recommends: true,
      avatar: 'https://i.ibb.co/XkYN11bL/PROFILE.jpg',
      ownerReplyEn: '',
      ownerReplyBn: ''
    };

    if (addDynamicReview) {
      addDynamicReview(newReview);
    }
    setSource('web');
    setIsWriteReviewOpen(false);
    
    try {
      const { submitReviewToGoogleSheet } = await import('../utils/googleSheetsSync');
      await submitReviewToGoogleSheet({
        name: reviewForm.name,
        rating: reviewForm.rating,
        text: reviewForm.text,
        source: 'web',
        files: reviewForm.files
      });
      setReviewForm({ name: '', text: '', rating: 5, files: [] });
      alert(t.lang === 'en' ? 'Thank you! Your review has been published live!' : 'ধন্যবাদ! আপনার রিভিউটি সাথে সাথে লাইভ প্রকাশিত হয়েছে!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostOwnerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText) return;
    setIsSubmittingReply(true);
    try {
      if (updateReviewReply) {
        updateReviewReply(replyingReview.nameEn, replyText, replyText);
      }
      await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'owner_reply',
          sheetName: 'WEB REVIEWS',
          sheetGid: '96927725',
          gid: '96927725',
          reviewName: replyingReview.nameEn,
          reviewText: replyingReview.textEn || replyingReview.textBn || '',
          ownerReply: replyText
        })
      });
      setReplyingReview(null);
      setReplyText('');
      alert(t.lang === 'en' ? 'Owner reply posted & saved successfully!' : 'ওনার রিপ্লাই সফলভাবে গুগলশিটে সেভ এবং আপডেট করা হয়েছে!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const topicList = useMemo(() => {
    if (source === 'google') {
      return [
        { id: 'all', labelEn: 'All', labelBn: 'সব' },
        { id: 'price', labelEn: 'Price', labelBn: 'দাম' },
        { id: 'service', labelEn: 'Service', labelBn: 'সার্ভিস' },
        { id: 'birthday cake', labelEn: 'birthday cake (3)', labelBn: 'বার্থডে কেক (৩)' },
        { id: 'custom cakes', labelEn: 'custom cakes (4)', labelBn: 'কাস্টম কেক (৪)' },
        { id: 'dream cake', labelEn: 'dream cake (3)', labelBn: 'ড্রিম কেক (৩)' },
        { id: 'soft cake', labelEn: 'soft cake (2)', labelBn: 'সফট কেক (২)' }
      ];
    } else if (source === 'facebook') {
      return [
        { id: 'all', labelEn: 'All', labelBn: 'সব' },
        { id: 'custom cakes', labelEn: 'custom cakes', labelBn: 'কাস্টম কেক' },
        { id: 'birthday cake', labelEn: 'birthday cake', labelBn: 'বার্থডে কেক' },
        { id: 'service', labelEn: 'service', labelBn: 'সার্ভিস' },
        { id: 'christmas', labelEn: 'christmas', labelBn: 'ক্রিসমাস' },
        { id: 'chocolate cake', labelEn: 'chocolate cake', labelBn: 'চকোলেট কেক' }
      ];
    } else {
      return [
        { id: 'all', labelEn: 'All', labelBn: 'সব' },
        { id: 'service', labelEn: 'Service', labelBn: 'সার্ভিস' },
        { id: 'delivery', labelEn: 'Delivery', labelBn: 'ডেলিভারি' },
        { id: 'custom cakes', labelEn: 'Custom Cakes', labelBn: 'কাস্টম কেক' },
        { id: 'brownies', labelEn: 'Brownies', labelBn: 'ব্রাউনি' }
      ];
    }
  }, [source]);

  // Filter & Sort reviews
  const reviews = useMemo(() => {
    let result = [...rawReviews];

    // Filter by topic if selected
    if (selectedTopic !== 'all') {
      result = result.filter(r => 
        r.topics?.includes(selectedTopic) || 
        (r.textEn && r.textEn.toLowerCase().includes(selectedTopic.toLowerCase())) ||
        (r.textBn && r.textBn.toLowerCase().includes(selectedTopic.toLowerCase()))
      );
    }

    // Sort by filter
    return result.sort((a, b) => {
      const timeA = a.date ? a.date.getTime() : 0;
      const timeB = b.date ? b.date.getTime() : 0;
      
      if (filter === 'highest') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return timeB - timeA;
      }
      if (filter === 'lowest') {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return timeB - timeA;
      }
      if (filter === 'newest') {
        return timeB - timeA;
      }
      if (filter === 'relevant') {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        if (likesB !== likesA) return likesB - likesA;
        const hasOwnerReplyA = a.ownerReplyEn ? 1 : 0;
        const hasOwnerReplyB = b.ownerReplyEn ? 1 : 0;
        if (hasOwnerReplyB !== hasOwnerReplyA) return hasOwnerReplyB - hasOwnerReplyA;
        return timeB - timeA;
      }
      return 0;
    });
  }, [rawReviews, selectedTopic, filter]);

  const sortFilters = [
    { id: 'relevant', label: t.reviews.filter1 },
    { id: 'newest', label: t.reviews.filter2 },
    { id: 'highest', label: t.reviews.filter3 },
    { id: 'lowest', label: t.reviews.filter4 }
  ];

  return (
    <section id="reviews" className="py-24 bg-transparent relative transition-colors duration-500 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-white/5 shadow-2xl shadow-pink-500/10 border border-pink-100 dark:border-white/10 group">
             <MessageSquare className="text-pink-500 transform group-hover:scale-110 transition-transform drop-shadow-[0_4px_4px_rgba(236,72,153,0.3)]" size={32} />
          </div>
          <p className="text-pink-600 dark:text-pink-400 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs">
             {t.lang === 'en' ? 'Testimonials' : 'প্রশংসাপত্র'}
          </p>
          <h2 className="font-serif text-3xl md:text-7xl font-bold text-slate-900 dark:text-white mt-4 tracking-tighter">
            {t.lang === 'en' ? 'Our Beloved Community' : 'আমাদের প্রিয় সম্প্রদায়'}
          </h2>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300">
            <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#EA4335] text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-[#EA4335]/30 transition-all mb-6">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                 <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-3 h-3 object-contain" />
              </div>
              Review us on Google
            </a>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">4.9 on Google</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">(200+ REVIEWS)</div>
            <div className="flex gap-1 text-amber-400">
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300">
            <a href={FACEBOOK_REVIEW_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-[#1877F2]/30 transition-all mb-6">
              <Facebook size={16} fill="currentColor" />
              Review us on Facebook
            </a>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">100% on Facebook</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">(1K+ REVIEWS)</div>
            <div className="flex gap-1 text-amber-400">
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
              <Star size={24} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Reviews Main Container */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] border border-pink-100/50 dark:border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Platform Toggle Tabs */}
          <div className="flex p-2 gap-2 bg-slate-100/80 dark:bg-white/5 mx-4 sm:mx-8 mt-6 sm:mt-8 rounded-[2rem] overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setSource('google'); setSelectedTopic('all'); }}
              className={cn(
                "flex-1 min-w-[120px] py-3.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-full",
                source === 'google' 
                  ? "text-white bg-[#EA4335] shadow-lg" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm shrink-0">
                 <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-3.5 h-3.5 object-contain" />
              </div>
              <span>GOOGLE</span>
            </button>
            <button
              onClick={() => { setSource('facebook'); setSelectedTopic('all'); }}
              className={cn(
                "flex-1 min-w-[120px] py-3.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-full",
                source === 'facebook' 
                  ? "text-white bg-[#1877F2] shadow-lg" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm shrink-0">
                 <Facebook size={14} className="text-[#1877F2]" fill="currentColor" />
              </div>
              <span>FACEBOOK</span>
            </button>
            <button
              onClick={() => { setSource('web'); setSelectedTopic('all'); }}
              className={cn(
                "flex-1 min-w-[120px] py-3.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-full",
                source === 'web' 
                  ? "text-white bg-pink-600 shadow-lg" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm shrink-0 text-pink-600">
                 <Globe size={14} />
              </div>
              <span>🌐 REVIEW</span>
            </button>
          </div>

          <div className="p-4 sm:p-8 md:p-12">
            {/* Dynamic Review Summary Bar */}
            <ReviewSummaryChart 
              source={source}
              rating={stats.rating}
              totalReviews={source === 'google' ? (t.lang === 'en' ? `${stats.total}+ Google Reviews` : `${stats.total}+ গুগল রিভিউ`) : (source === 'facebook' ? (t.lang === 'en' ? `${stats.total}+ Recommendations` : `${stats.total}+ রেকমেন্ডেশন`) : (t.lang === 'en' ? `${stats.total}+ Web Reviews` : `${stats.total}+ ওয়েব রিভিউ`))}
              lang={t.lang}
              titleEn={source === 'google' ? 'Google review summary' : (source === 'facebook' ? 'Facebook review summary' : 'Web review summary')}
              titleBn={source === 'google' ? 'গুগল রিভিউ সারসংক্ষেপ' : (source === 'facebook' ? 'ফেসবুক রিভিউ সারসংক্ষেপ' : 'ওয়েব রিভিউ সারসংক্ষেপ')}
            />

            {source === 'web' && (
              <div className="flex justify-center mb-10">
                <button
                  onClick={() => setIsWriteReviewOpen(true)}
                  className="px-8 py-3 bg-pink-600 text-white rounded-full font-bold shadow-lg hover:bg-pink-700 transition-all hover:scale-105"
                >
                  {t.lang === 'en' ? 'Write a Review' : 'একটি রিভিউ লিখুন'}
                </button>
              </div>
            )}

            {/* Topic Tags / Chips Filter */}
            <div className="mb-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                {t.lang === 'en' ? 'Reviews Keyword Filter' : 'কীওয়ার্ড অনুযায়ী রিভিউ'}
              </span>
              <div className="flex flex-wrap gap-2">
                {topicList.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                      selectedTopic === topic.id
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-105"
                        : "bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-pink-400"
                    )}
                  >
                    {t.lang === 'en' ? topic.labelEn : topic.labelBn}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <Filter size={14} className="text-pink-500" />
                <span>{t.lang === 'en' ? 'Sort by' : 'বাছাই করুন'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortFilters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-bold transition-all border flex items-center gap-1.5",
                      filter === f.id 
                        ? "bg-pink-500 text-white border-pink-500 shadow-md" 
                        : "bg-white/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {reviews.map((review, i) => (
                  <motion.div 
                    key={review.nameEn + i}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:border-pink-300/60 transition-all flex flex-col group h-full shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {/* Initials Avatar */}
                          <div className={cn(
                            "w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center font-bold text-lg text-white",
                            source === 'google' ? "bg-[#EA4335]" : source === 'facebook' ? "bg-[#1877F2]" : "bg-pink-500"
                          )}>
                            {(t.lang === 'en' ? review.nameEn : review.nameBn).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                            {source === 'google' ? <Globe className="text-white" size={10} /> : (source === 'facebook' ? <Facebook className="text-white" size={10} fill="currentColor" /> : <Layout className="text-white" size={10} />)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                            {t.lang === 'en' ? review.nameEn : review.nameBn}
                            {review.recommends && (
                              <span className="font-normal text-slate-600 dark:text-slate-300 ml-1">
                                {t.lang === 'en' ? 'recommends Bake n\' Flake - FlavoursbyMusu.' : 'Bake n\' Flake - FlavoursbyMusu কে রেকমেন্ড করেছেন।'}
                              </span>
                            )}
                          </h4>
                          {(review.badgeEn || review.badgeBn) && (
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">
                              {t.lang === 'en' ? review.badgeEn : review.badgeBn}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, j) => (
                                <Star key={j} size={11} fill={j < review.rating ? "currentColor" : "none"} className={j < review.rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} />
                              ))}
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">
                              {t.lang === 'en' ? review.timeEn : review.timeBn}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed mb-4 flex-grow italic">
                      {(t.lang === 'en' ? review.textEn : review.textBn).split('\n').map((line, i) => (
                        <React.Fragment key={i}>{line}<br/></React.Fragment>
                      ))}
                    </p>

                    {/* Owner Response Box */}
                    {(review.ownerReplyEn || review.ownerReplyBn) && (
                      <div className="mb-6 p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-500/20 text-[10px]">
                        <div className="flex items-center justify-between gap-1.5 font-bold text-pink-600 dark:text-pink-400 mb-1">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight size={12} />
                            <span>Bake n' Flake ~ FlavoursbyMusu (owner)</span>
                          </div>
                          {isAdminLoggedIn && (
                            <button
                              onClick={() => {
                                setReplyingReview(review);
                                setReplyText(review.ownerReplyEn || review.ownerReplyBn || '');
                              }}
                              className="text-[9px] text-pink-600 underline hover:text-pink-700"
                            >
                              ✏️ {t.lang === 'en' ? 'Edit' : 'এডিট'}
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 pl-4">
                          {(t.lang === 'en' ? review.ownerReplyEn : review.ownerReplyBn)?.split('\n').map((line, i) => (
                            <React.Fragment key={i}>{line}<br/></React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between mt-auto">
                       <Quote className="text-pink-200 dark:text-pink-900/40" size={16} />
                       
                       <div className="flex items-center gap-2">
                         <button
                           onClick={() => {
                             if (!isAdminLoggedIn) {
                               const pwd = prompt(t.lang === 'en' ? 'Enter Owner Admin Password:' : 'ওনার অ্যাডমিন পাসওয়ার্ড দিন:');
                               if (pwd === 'Musu@123' || pwd === 'admin' || pwd === 'musu') {
                                 if (setIsAdminLoggedIn) setIsAdminLoggedIn(true);
                               } else if (pwd) {
                                 alert(t.lang === 'en' ? 'Incorrect Password!' : 'ভুল পাসওয়ার্ড!');
                                 return;
                               } else {
                                 return;
                               }
                             }
                             setReplyingReview(review);
                             setReplyText(review.ownerReplyEn || review.ownerReplyBn || '');
                           }}
                           className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 hover:bg-pink-200 transition-colors flex items-center gap-1"
                         >
                           💬 {review.ownerReplyEn || review.ownerReplyBn ? (t.lang === 'en' ? 'Edit Reply' : 'রিপ্লাই এডিট') : (t.lang === 'en' ? 'Reply as Owner' : 'ওনার রিপ্লাই দিন')}
                         </button>

                         <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/40 dark:border-emerald-500/20">
                            <CheckCircle2 size={10} />
                            <span>VERIFIED</span>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {source === 'web' && (
                <button
                  onClick={() => setIsWriteReviewOpen(true)}
                  className="px-8 py-3 bg-pink-600 text-white rounded-full font-bold shadow-lg hover:bg-pink-700 transition-all hover:scale-105 uppercase tracking-widest text-xs"
                >
                  {t.lang === 'en' ? 'Write a Review' : 'একটি রিভিউ লিখুন'}
                </button>
              )}
              <a 
                href={source === 'facebook' ? FACEBOOK_REVIEW_LINK : GOOGLE_REVIEW_LINK} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-block px-6 py-2 bg-[#0F172A] text-pink-400 font-bold text-sm rounded-full shadow-lg hover:-translate-y-1 transition-transform border border-[#0F172A]"
              >
                See More Authentic Reviews ⫸
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {isWriteReviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-white/10"
            >
              <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                {t.lang === 'en' ? 'Share Your Experience' : 'আপনার অভিজ্ঞতা শেয়ার করুন'}
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t.lang === 'en' ? 'Your Name' : 'আপনার নাম'}
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.name}
                    onChange={e => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t.lang === 'en' ? 'Rating' : 'রেটিং'}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          reviewForm.rating >= star ? "text-amber-400" : "text-slate-300"
                        )}
                      >
                        <Star size={24} fill={reviewForm.rating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t.lang === 'en' ? 'Your Review' : 'আপনার মন্তব্য'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.text}
                    onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t.lang === 'en' ? 'Add Photos' : 'ছবি যোগ করুন'}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setReviewForm(prev => ({ ...prev, files: [...prev.files, ...files] }));
                    }}
                    className="hidden"
                    id="review-photos"
                  />
                  <label
                    htmlFor="review-photos"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-pink-500 transition-colors"
                  >
                    <Layout size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {reviewForm.files.length > 0 
                        ? `${reviewForm.files.length} ${t.lang === 'en' ? 'files selected' : 'টি ফাইল সিলেক্ট করা হয়েছে'}`
                        : (t.lang === 'en' ? 'Click to upload photos' : 'ছবি আপলোড করতে ক্লিক করুন')}
                    </span>
                  </label>
                  {reviewForm.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {reviewForm.files.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsWriteReviewOpen(false)}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    {t.lang === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 rounded-xl font-bold bg-pink-600 text-white shadow-lg hover:bg-pink-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (t.lang === 'en' ? 'Submitting...' : 'জমা হচ্ছে...') : (t.lang === 'en' ? 'Submit' : 'জমা দিন')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Owner Reply Modal */}
        {replyingReview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>👑 {t.lang === 'en' ? 'Owner Feedback Reply' : 'ওনার ফিডব্যাক রিপ্লাই'}</span>
                </h3>
                <button
                  onClick={() => setReplyingReview(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 mb-4 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">{replyingReview.nameEn}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1 italic">"{replyingReview.textEn}"</p>
              </div>

              <form onSubmit={handlePostOwnerReply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t.lang === 'en' ? 'Your Official Owner Reply' : 'আপনার অফিসিয়াল ওনার রিপ্লাই'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={t.lang === 'en' ? 'Thank you so much for your kind words! We are glad you enjoyed...' : 'আপনাকে অনেক ধন্যবাদ আমাদের খাবার উপভোগ করার জন্য...'}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500 outline-none transition-all resize-none text-xs"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setReplyingReview(null)}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-xs"
                  >
                    {t.lang === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReply}
                    className="flex-1 py-3 px-6 rounded-xl font-bold bg-pink-600 text-white shadow-lg hover:bg-pink-700 transition-all disabled:opacity-50 text-xs"
                  >
                    {isSubmittingReply ? (t.lang === 'en' ? 'Saving...' : 'সেভ হচ্ছে...') : (t.lang === 'en' ? 'Post Reply' : 'রিপ্লাই পোস্ট করুন')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
