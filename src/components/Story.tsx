import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';
import { AppContext } from '../App';
import { cn } from '../lib/utils';
import { getOptimizedImageUrl } from '../utils/googleSheetsSync';
import { FULL_GALLERY_BACKUP } from '../constants/fullGalleryBackup';
import { OptimizedImage } from './OptimizedImage';

export default function Story() {
  const { t, galleryData } = useContext(AppContext);

  const storyImagesData = (galleryData['Story Section'] as string[])?.filter(url => url && url.length > 0);
  const rawStoryImages = (storyImagesData && storyImagesData.length > 0) ? storyImagesData : (FULL_GALLERY_BACKUP['Story Section'] as string[]) || [];
  
  // Ensure we have at least 3 images for a rich back and forth sliding animation
  const storyImages = rawStoryImages.length >= 3 
    ? rawStoryImages 
    : [...rawStoryImages, ...rawStoryImages, ...rawStoryImages].slice(0, 4);

  const totalImages = storyImages.length;
  const maxTranslatePercent = totalImages > 1 ? -((totalImages - 1) / totalImages) * 100 : 0;

  return (
    <section id="story" className="py-24 bg-transparent relative transition-colors duration-500 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Slider Container - Order 2 on mobile (below text), Order 1 on desktop (left column shifted down and aligned) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative w-full flex flex-col items-center justify-center lg:mt-12"
          >
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] md:max-w-[460px] lg:max-w-[500px] aspect-[15/17]">
                {/* Horizontal Ping-Pong Sliding Carousel Frame */}
                <div className="w-full h-full rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.35)] relative z-10 border-4 border-pink-500/20 dark:border-white/10 bg-slate-900/40 neon-border-pink">
                  <style>{`
                    @keyframes storyPingPongGpu {
                      0% { transform: translate3d(0%, 0, 0); }
                      50% { transform: translate3d(${maxTranslatePercent}%, 0, 0); }
                      100% { transform: translate3d(0%, 0, 0); }
                    }
                    .story-gpu-slider {
                      animation: storyPingPongGpu ${Math.max(16, totalImages * 7)}s ease-in-out infinite;
                      will-change: transform;
                      backface-visibility: hidden;
                      -webkit-backface-visibility: hidden;
                      transform: translateZ(0);
                      -webkit-transform: translateZ(0);
                    }
                  `}</style>
                  <div
                    className="flex h-full story-gpu-slider"
                    style={{ width: `${totalImages * 100}%` }}
                  >
                    {storyImages.map((src, idx) => (
                      <div 
                        key={idx} 
                        className="h-full relative overflow-hidden shrink-0" 
                        style={{ width: `${100 / totalImages}%` }}
                      >
                        <OptimizedImage 
                          src={src}
                          alt={`Our Story ${idx + 1}`} 
                          width={1000}
                          quality={85}
                          fallbackSrc="https://i.ibb.co/XkYN11bL/PROFILE.jpg"
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* OWNER Floating Accent for Story Slider */}
                <motion.a 
                  href="https://www.facebook.com/musu.khan99/"
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="absolute bottom-4 -right-4 md:bottom-8 md:-right-8 z-30 p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] glow-tag-pink flex items-center gap-3 md:gap-4 min-w-[120px] md:min-w-[170px] hover:scale-105 transition-transform"
                >
                  <div className="w-8 h-8 md:w-11 md:h-11 rounded-[0.8rem] md:rounded-[1.2rem] overflow-hidden border-2 border-white/40 shadow-lg shrink-0">
                    <img src="https://i.ibb.co/wrc3VVRg/PROFILE.jpg" alt="Musu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-white font-black text-[8px] md:text-sm uppercase leading-none tracking-widest">OWNER</span>
                     <span className="text-white/80 text-[8px] md:text-xs font-bold mt-0.5 md:mt-1 uppercase tracking-widest leading-none">~ Musu</span>
                  </div>
                </motion.a>
              </div>
              
              {/* Decorative Background Blob */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-400/20 dark:bg-pink-900/10 rounded-full blur-[100px] -z-0 animate-blob" />
              <div className="absolute top-0 -right-10 w-40 h-40 bg-rose-400/20 dark:bg-rose-900/10 rounded-full blur-[60px] -z-0 animate-blob" style={{ animationDelay: '2s' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2 w-full"
          >
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="inline-flex items-center justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 shadow-2xl shadow-pink-500/10 border border-pink-100 dark:border-white/10 group">
                 <Sparkles className="text-pink-500 transform group-hover:scale-110 transition-transform drop-shadow-[0_4px_4px_rgba(236,72,153,0.3)]" size={32} />
              </div>
            </div>
            <p className="text-pink-600 dark:text-pink-400 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs">
              {t.lang === 'en' ? 'Our Journey' : 'আমাদের যাত্রা'}
            </p>
            
            <h2 className="font-serif text-3xl md:text-6xl font-bold text-slate-900 dark:text-white mt-4 mb-8 tracking-tighter">
              {t.lang === 'en' ? 'Crafting Happiness Since 2019' : '২০১৯ থেকে সুখ তৈরি করছি'}
            </h2>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed font-medium">
              {t.story.desc}
            </p>

            <div className="grid grid-cols-2 gap-8">
              {[
                { val: t.story.stat1Val, label: t.story.stat1, icon: Heart },
                { val: t.story.stat2Val, label: t.story.stat2, icon: Sparkles }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-pink-100/50 dark:border-white/10"
                >
                  <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-4">
                     <stat.icon className="text-pink-500" size={24} />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.val}</div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
