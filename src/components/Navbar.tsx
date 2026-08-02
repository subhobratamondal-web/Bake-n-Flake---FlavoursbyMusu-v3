import React, { useState, useEffect, useContext, useRef } from 'react';
import { Menu, X, Sun, Moon, Globe, ShoppingBag, BookOpen, Image as ImageIcon, Phone, Send, ShoppingCart, User as UserIcon, Clock, Shield, ChevronDown, ChevronRight, Sparkles, Heart, HardDrive, Bell, LogOut } from 'lucide-react';
import { AppContext } from '../App';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import WeatherWidget from './WeatherWidget';

export default function Navbar() {
  const { 
    lang, setLang, t, theme, toggleTheme, galleryData, setOrderModalOpen,
    cart, user, orders, isAdminLoggedIn, wishlist, setIsWishlistOpen,
    setIsCartOpen, setIsAuthModalOpen, setIsOrderHistoryOpen,
    setIsWorkspaceOpen, requestNotifications, logoutUser
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

  const navItems = [
    { id: 'menu', icon: ShoppingBag },
    { id: 'story', icon: BookOpen },
    { id: 'gallery', icon: ImageIcon },
    { id: 'contact', icon: Phone },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "py-0" : "py-2"
    )}>
      <div className="w-full">
        <div className={cn(
          "flex items-center h-20 px-3 md:px-8 transition-all duration-500 relative",
          scrolled ? "glass-3d shadow-2xl shadow-pink-500/10 rounded-none border-x-0 w-full" : "max-w-7xl mx-auto px-4 md:px-12 bg-transparent"
        )}>
          {/* Mobile: Sidebar Trigger (Left) */}
          <div className="flex lg:hidden z-[115]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-white active:scale-95 transition-all shadow-sm border border-slate-200/80 dark:border-slate-700/80 touch-manipulation cursor-pointer select-none min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Brand Logo (Desktop: Left, Mobile: Center) */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 lg:static absolute left-1/2 -translate-x-1/2 lg:translate-x-0"
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
          <div className="hidden lg:flex items-center gap-4 flex-1 justify-end">
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

            <div className="flex items-center gap-2">
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

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                title={user?.isLoggedIn ? user.name : (lang === 'en' ? 'Login' : 'লগইন')}
              >
                <UserIcon size={16} className="text-pink-500" />
              </button>

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

              <button
                onClick={async () => {
                  if (requestNotifications) {
                    const granted = await requestNotifications();
                    if (granted) {
                      alert(lang === 'en' ? '✅ Push Notifications Enabled!' : '✅ পুশ নোটিফিকেশন চালু করা হয়েছে!');
                    }
                  }
                }}
                className="p-2.5 rounded-full bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-pink-600 dark:text-pink-300 transition-all border border-pink-200 dark:border-pink-800/40 flex items-center justify-center relative cursor-pointer"
                title={lang === 'en' ? 'Enable Order Status Alerts' : 'অর্ডার স্ট্যাটাস এলার্ট চালু করুন'}
              >
                <Bell size={16} className="text-pink-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-white dark:ring-slate-900" />
              </button>

              {isAdminLoggedIn && (
                <button
                  onClick={() => setIsWorkspaceOpen(true)}
                  title="Google Workspace Hub & Admin Portal"
                  className="p-2.5 rounded-full bg-amber-500 text-slate-900 border border-amber-300 shadow-md cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                >
                  <HardDrive size={16} />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-3d text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 text-xs font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-white/10"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>{lang === 'en' ? 'MORE' : 'আরও'}</span>
                <ChevronDown size={14} className={cn("transition-transform duration-300", moreDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {moreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 space-y-4"
                  >
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      {lang === 'en' ? 'Quick Controls' : 'কন্ট্রোল অপশন'}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {lang === 'en' ? 'Weather Theme:' : 'ওয়েদার থিম:'}
                      </span>
                      <WeatherWidget />
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={toggleTheme}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white transition-all border border-slate-200 dark:border-slate-700"
                      >
                        {theme === 'dark' ? <Sun size={18} className="text-amber-400 mb-1" /> : <Moon size={18} className="text-blue-500 mb-1" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {theme === 'dark' ? 'Light' : 'Dark'}
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

          {/* Mobile: Action Buttons (Right) */}
          <div className="flex lg:hidden items-center gap-1.5 flex-1 justify-end z-[115]">
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme();
              }}
              className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-white active:scale-95 transition-all shadow-sm border border-slate-200/80 dark:border-slate-700/80 touch-manipulation cursor-pointer select-none min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
              style={{ touchAction: 'manipulation' }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-pink-500" />}
            </button>

            {/* Logout Button with Proper Logout Icon */}
            {user?.isLoggedIn && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  logoutUser?.();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs active:scale-95 transition-all border border-red-500/30 flex items-center gap-1.5 touch-manipulation cursor-pointer select-none min-h-[38px] shrink-0"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut size={14} />
                <span className="text-[11px]">{t.nav.logout}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[190] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] sm:w-[350px] bg-white dark:bg-[#0c0d12] z-[200] lg:hidden shadow-2xl border-r border-slate-200 dark:border-white/10 overflow-y-auto"
            >
              <div className="p-5 pt-12 flex flex-col gap-4">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-serif text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">
                      {t.brand}
                    </span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-black tracking-widest uppercase">
                      {t.tag}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Account & Profile Options Section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
                    👤 {lang === 'en' ? 'Account & Orders' : 'অ্যাকাউন্ট ও অর্ডার'}
                  </span>

                  {/* 1. Login / Profile Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-2xl bg-pink-50/80 dark:bg-pink-950/30 border border-pink-200/60 dark:border-pink-800/40 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-slate-800 dark:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        <UserIcon size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-xs">
                          {user?.isLoggedIn 
                            ? (user.name || (lang === 'en' ? 'My Profile' : 'মাই প্রোফাইল')) 
                            : (lang === 'en' ? 'Login / Register' : 'লগইন / রেজিস্টার')}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {user?.isLoggedIn ? user.email : (lang === 'en' ? 'Manage your account' : 'অ্যাকাউন্ট ম্যানেজ করুন')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-pink-500" />
                  </button>

                  {/* 2. Cart / Add to Cart Option (Right after Login Tab) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-xs">
                          {lang === 'en' ? 'Cart / Added Items' : 'কার্ট (শপিং ব্যাগ)'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {lang === 'en' ? 'View cart & checkout' : 'কার্টের প্রোডাক্টস দেখুন'}
                        </span>
                      </div>
                    </div>
                    {cart.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-pink-600 text-white font-black text-[10px]">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>

                  {/* 2. Order History Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user || !user.isLoggedIn) {
                        setIsAuthModalOpen(true);
                      } else {
                        setIsOrderHistoryOpen(true);
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-xs">
                          {lang === 'en' ? 'Order History' : 'অর্ডার হিস্ট্রি'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {lang === 'en' ? 'Track recent orders' : 'পূর্ববর্তী অর্ডার তালিকা'}
                        </span>
                      </div>
                    </div>
                    {orders.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px]">
                        {orders.length}
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>

                  {/* 3. Wishlist Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsWishlistOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Heart size={16} className="fill-rose-500/30 text-rose-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-xs">
                          {lang === 'en' ? 'Wishlist' : 'উইশলিস্ট (পছন্দের তালিকা)'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {lang === 'en' ? 'Saved items' : 'সেভ করা কেক ও ডেজার্ট'}
                        </span>
                      </div>
                    </div>
                    {wishlist.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                        {wishlist.length}
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Mobile Admin Hub & Logout buttons if applicable */}
                {(isAdminLoggedIn || user?.isLoggedIn) && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {isAdminLoggedIn && (
                      <button
                        type="button"
                        onClick={() => { setIsWorkspaceOpen(true); setMobileMenuOpen(false); }}
                        className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <HardDrive size={16} />
                        <span>{lang === 'en' ? 'Admin Hub' : 'অ্যাডমিন হাব'}</span>
                      </button>
                    )}

                    {user?.isLoggedIn && (
                      <button
                        type="button"
                        onClick={() => { logoutUser(); setMobileMenuOpen(false); }}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-xs flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <LogOut size={16} />
                        <span>{lang === 'en' ? 'Logout' : 'লগআউট'}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

                {/* Navigation items */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1 mb-1">
                    📍 {lang === 'en' ? 'Navigation' : 'ন্যাভিগেশন'}
                  </span>
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="flex items-center gap-3.5 px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white hover:text-pink-600 text-left hover:bg-pink-50 dark:hover:bg-white/5 rounded-xl transition-all uppercase tracking-wider group touch-manipulation cursor-pointer"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <item.icon size={16} className="text-pink-500 group-hover:scale-110 transition-transform" />
                      {t.nav[item.id]}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

                {/* Quick Controls Section in Mobile Drawer */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
                    ⚙️ {lang === 'en' ? 'Quick Controls' : 'কন্ট্রোল অপশন'}
                  </span>

                  {/* Weather Theme Adjuster */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {lang === 'en' ? 'Weather Theme:' : 'ওয়েদার থিম:'}
                    </span>
                    <WeatherWidget />
                  </div>

                  {/* Theme & Language Toggle Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTheme()}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 touch-manipulation cursor-pointer"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-blue-500" />}
                      <span className="text-[11px]">
                        {theme === 'dark' ? (lang === 'en' ? 'Light' : 'লাইট') : (lang === 'en' ? 'Dark' : 'ডার্ক')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-pink-600 dark:text-pink-400 font-bold text-xs transition-all border border-pink-200 dark:border-pink-800/40 touch-manipulation cursor-pointer"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Globe size={15} />
                      <span className="text-[11px]">
                        {t.nav.langToggle}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
