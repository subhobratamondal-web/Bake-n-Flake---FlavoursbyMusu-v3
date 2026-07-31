import React, { useState, useEffect, useContext, useRef } from 'react';
import { Menu, X, Sun, Moon, Globe, ShoppingBag, BookOpen, Image as ImageIcon, Phone, Send, ShoppingCart, User as UserIcon, Clock, Shield, ChevronDown, Sparkles, Heart, HardDrive } from 'lucide-react';
import { AppContext } from '../App';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import WeatherWidget from './WeatherWidget';

export default function Navbar() {
  const { 
    lang, setLang, t, theme, toggleTheme, galleryData, setOrderModalOpen,
    cart, user, orders, isAdminLoggedIn, wishlist, setIsWishlistOpen,
    setIsCartOpen, setIsAuthModalOpen, setIsOrderHistoryOpen, setIsOwnerPortalOpen,
    setIsWorkspaceOpen
  } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const headerLogoItem = galleryData['Header']?.[1];
  const logoUrl = (headerLogoItem 
    ? (typeof headerLogoItem === 'string' ? headerLogoItem : (headerLogoItem as any).img) || "https://i.ibb.co/Xx2kxrrg/LOGO-1.png"
    : "https://i.ibb.co/Xx2kxrrg/LOGO-1.png") || "https://i.ibb.co/Xx2kxrrg/LOGO-1.png";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'menu', icon: ShoppingBag },
    { id: 'story', icon: BookOpen },
    { id: 'gallery', icon: ImageIcon },
    { id: 'contact', icon: Phone }
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "py-0" : "py-2"
    )}>
      <div className="w-full">
        <div className={cn(
          "flex justify-between items-center h-20 px-3 md:px-8 transition-all duration-500",
          scrolled ? "glass-3d shadow-2xl shadow-pink-500/10 rounded-none border-x-0 w-full" : "max-w-7xl mx-auto px-4 md:px-12 bg-transparent"
        )}>
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-pink-200 shadow-md transform transition-transform group-hover:scale-110 group-hover:rotate-6">
              <img src={logoUrl || "https://i.ibb.co/Xx2kxrrg/LOGO-1.png"} alt="Logo" className="w-full h-full object-cover scale-150" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight group-hover:text-pink-600 transition-colors">
                {t.brand}
              </span>
              <span className="text-[9px] md:text-[10px] text-pink-600 dark:text-pink-400 font-black tracking-widest uppercase mt-0.5">
                {t.tag}
              </span>
            </div>
          </div>

          {/* Desktop Navbar Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Section Nav links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all uppercase tracking-wider hover:bg-pink-50 dark:hover:bg-white/5 rounded-full group"
                >
                  <item.icon size={13} className="group-hover:scale-110 transition-transform" />
                  {t.nav[item.id]}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

            {/* Header Action Buttons: Cart, Wishlist, Login, Orders, Admin (Icon Only) */}
            <div className="flex items-center gap-2">
              {/* Cart Header Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all relative flex items-center justify-center"
                title={lang === 'en' ? 'Cart' : 'কার্ট'}
              >
                <ShoppingCart size={16} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border border-slate-900">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Wishlist Header Button */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 transition-all border border-rose-200 dark:border-rose-800/40 relative flex items-center justify-center"
                title={lang === 'en' ? 'Wishlist' : 'উইশলিস্ট'}
              >
                <Heart size={16} className="fill-rose-500 text-rose-500" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-extrabold border border-slate-900">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Account / Login Header Button */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                title={user?.isLoggedIn ? user.name : (lang === 'en' ? 'Login' : 'লগইন')}
              >
                <UserIcon size={16} className="text-pink-500" />
              </button>

              {/* My Orders Header Button */}
              {(() => {
                const activeOrderCount = (user && user.isLoggedIn) ? orders.length : 0;
                return (
                  <button
                    onClick={() => {
                      if (!user || !user.isLoggedIn) {
                        setIsAuthModalOpen(true);
                      } else {
                        setIsOrderHistoryOpen(true);
                      }
                    }}
                    className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-all border border-amber-200 dark:border-amber-800/50 relative flex items-center justify-center shadow-sm"
                    title={lang === 'en' ? `Orders (${activeOrderCount})` : `অর্ডার (${activeOrderCount})`}
                  >
                    <Clock size={16} className="text-amber-500 dark:text-amber-400" />
                    {activeOrderCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-extrabold border border-white dark:border-slate-900">
                        {activeOrderCount}
                      </span>
                    )}
                  </button>
                );
              })()}

              {/* Owner Admin Shield Button */}
              {(() => {
                const cleanPhone = (user?.phone || '').replace(/\D/g, '');
                const isAdmin = user?.isLoggedIn && (cleanPhone.endsWith('8584017701') || cleanPhone.endsWith('9875563329'));
                return (
                  <button
                    onClick={isAdmin ? () => setIsOwnerPortalOpen(true) : undefined}
                    title={isAdmin ? "Owner Admin Portal" : undefined}
                    className={`p-1 rounded-full transition-all border flex items-center justify-center shrink-0 ${
                      isAdmin 
                        ? 'bg-amber-500 text-slate-900 border-amber-300 shadow-md cursor-pointer hover:scale-105 active:scale-95' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-default opacity-80 pointer-events-none'
                    }`}
                  >
                    <img 
                      src="https://i.ibb.co/wrc3VVRg/PROFILE.jpg" 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-amber-300 shadow-sm shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })()}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

            {/* MORE Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-3d text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 text-xs font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-white/10"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>{lang === 'en' ? 'MORE' : 'আরও'}</span>
                <ChevronDown size={14} className={cn("transition-transform duration-300", moreDropdownOpen && "rotate-180")} />
              </button>

              {/* MORE Dropdown Menu Popup */}
              <AnimatePresence>
                {moreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 space-y-4"
                  >
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      {lang === 'en' ? 'Quick Controls & Atmosphere' : 'কন্ট্রোল ও থিম অপশন'}
                    </div>

                    {/* Weather Widget */}
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {lang === 'en' ? 'Weather Theme:' : 'ওয়েদার থিম:'}
                      </span>
                      <WeatherWidget />
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Google Workspace Hub Trigger */}
                    <button
                      onClick={() => {
                        setIsWorkspaceOpen(true);
                        setMoreDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span>{lang === 'en' ? 'Google Drive & Sheets' : 'গুগল ড্রাইভ ও শিট'}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                        HUB
                      </span>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Dark/Light Mode & Language Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={toggleTheme}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white transition-all border border-slate-200 dark:border-slate-700"
                      >
                        {theme === 'dark' ? <Sun size={18} className="text-amber-400 mb-1" /> : <Moon size={18} className="text-blue-500 mb-1" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {theme === 'dark' ? (lang === 'en' ? 'Light Mode' : 'লাইট মোড') : (lang === 'en' ? 'Dark Mode' : 'ডার্ক মোড')}
                        </span>
                      </button>

                      <button
                        onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-pink-600 dark:text-pink-400 font-bold transition-all border border-pink-200 dark:border-pink-800/40"
                      >
                        <Globe size={18} className="mb-1" />
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">
                          {t.nav.langToggle}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30 flex items-center justify-center relative"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 glass-3d text-slate-800 dark:text-white rounded-2xl active:scale-90 transition-transform"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-[90] lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] sm:w-[350px] bg-white dark:bg-[#0a0a0a] z-[110] lg:hidden shadow-2xl border-l border-white/10 overflow-y-auto"
            >
              <div className="p-6 pt-20 flex flex-col gap-4">
                <div className="flex flex-col gap-1 mb-2">
                   <span className="font-serif text-2xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">
                    {t.brand}
                  </span>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-black tracking-widest uppercase">
                    {t.tag}
                  </span>
                </div>

                {/* Primary Quick Actions for Mobile */}
                <div className="grid grid-cols-2 gap-2 my-2">
                  <button
                    onClick={() => { setIsCartOpen(true); setMobileMenuOpen(false); }}
                    className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 font-bold text-xs flex items-center justify-center gap-2 border border-pink-200 dark:border-pink-800/40"
                  >
                    <ShoppingCart size={16} />
                    {lang === 'en' ? 'Cart' : 'কার্ট'} ({cart.length})
                  </button>

                  <button
                    onClick={() => { setIsWishlistOpen(true); setMobileMenuOpen(false); }}
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800/40"
                  >
                    <Heart size={16} className="fill-rose-500 text-rose-500" />
                    {lang === 'en' ? 'Wishlist' : 'উইশলিস্ট'} ({wishlist.length})
                  </button>

                  <button
                    onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <UserIcon size={16} className="text-pink-500" />
                    {user?.isLoggedIn ? user.name : (lang === 'en' ? 'Account' : 'অ্যাকাউন্ট')}
                  </button>

                  <button
                    onClick={() => { setIsOrderHistoryOpen(true); setMobileMenuOpen(false); }}
                    className="p-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Clock size={16} className="text-amber-400" />
                    {lang === 'en' ? 'My Orders' : 'আমার অর্ডার'} ({orders.length})
                  </button>

                  {(() => {
                    const cleanPhone = (user?.phone || '').replace(/\D/g, '');
                    const isAdmin = user?.isLoggedIn && (cleanPhone.endsWith('8584017701') || cleanPhone.endsWith('9875563329'));
                    return (
                      <button
                        onClick={isAdmin ? () => { setIsOwnerPortalOpen(true); setMobileMenuOpen(false); } : undefined}
                        className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border ${
                          isAdmin 
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 cursor-pointer shadow-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-default opacity-50'
                        }`}
                      >
                        <img 
                          src="https://i.ibb.co/wrc3VVRg/PROFILE.jpg" 
                          alt="Musu (Owner)" 
                          className="w-6 h-6 rounded-full object-cover border border-amber-400 shadow-sm shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <span>{lang === 'en' ? 'Owner Portal' : 'মালিক পোর্টাল'}</span>
                      </button>
                    );
                  })()}
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />

                {/* Nav Links */}
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-4 px-4 py-3 text-xs font-black text-slate-800 dark:text-white hover:text-pink-600 text-left hover:bg-pink-50 dark:hover:bg-white/5 rounded-xl transition-all uppercase tracking-wider group"
                  >
                    <item.icon size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
                    {t.nav[item.id]}
                  </button>
                ))}
                
                <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
                
                {/* Weather & Settings Dropdown Controls */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {lang === 'en' ? 'MORE OPTIONS' : 'আরও অপশন'}
                  </span>
                  
                  <div className="flex justify-center">
                    <WeatherWidget />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button onClick={toggleTheme} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700">
                      {theme === 'dark' ? <Sun size={18} className="text-amber-400 mb-1" /> : <Moon size={18} className="text-blue-500 mb-1" />}
                      <span className="text-[10px] uppercase">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <button
                      onClick={() => { setLang(lang === 'en' ? 'bn' : 'en'); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-black uppercase text-xs border border-pink-200 dark:border-pink-800/40"
                    >
                      <Globe size={18} className="mb-1" />
                      {t.nav.langToggle}
                    </button>
                  </div>

                  <button
                    onClick={() => { setIsWorkspaceOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md mt-2"
                  >
                    <HardDrive size={16} />
                    <span>{lang === 'en' ? 'Google Drive & Sheets' : 'গুগল ড্রাইভ ও শিট'}</span>
                  </button>
                </div>

                <button
                  onClick={() => { setOrderModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-pink-500/20 active:scale-95 transition-all mt-2"
                >
                  <Send size={18} />
                  Direct Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

