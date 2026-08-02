import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, MapPin, CheckCircle, ShieldCheck, LogOut, Crown, ShoppingBag, Sparkles, Save, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { googleSignIn, workspaceSignIn } from '../lib/workspaceAuth';
import { sendCustomerLoginToGoogleSheet } from '../utils/googleSheetsSync';
import { playSound } from '../lib/sounds';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (profile: Omit<UserProfile, 'id' | 'isLoggedIn'>) => void;
  onLogout: () => void;
  lang: 'en' | 'bn';
}

export default function AuthModal({ isOpen, onClose, user, onLogin, onLogout, lang }: AuthModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [submitted, setSubmitted] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Sync form state strictly with user profile or reset completely when logged out
  useEffect(() => {
    if (user && user.isLoggedIn) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setErrorMsg('');
      setIsEditingProfile(false);
    }
  }, [user, isOpen]);

  const handleLogoutAction = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setErrorMsg('');
    setIsEditingProfile(false);
    onLogout();
  };

  const handleCustomerGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    playSound('ding');
    try {
      const isAdminEmail = email.trim().toLowerCase() === 'subhobratamondal@gmail.com' || email.trim().toLowerCase() === 'khanmegha99@gmail.com';
      
      const res = isAdminEmail ? await workspaceSignIn() : await googleSignIn();
      if (res && res.user) {
        const gName = res.user.displayName || name.trim() || 'Valued Customer';
        const gEmail = res.user.email || email.trim();
        const gPhone = phone.trim();
        const gAddress = address.trim();

        setName(gName);
        setEmail(gEmail);

        // Strict Admin Check based strictly on authentic logged-in email or user-typed phone
        const isAdminUser = 
          (gEmail && (gEmail.toLowerCase() === 'subhobratamondal@gmail.com' || gEmail.toLowerCase() === 'khanmegha99@gmail.com')) || 
          (gPhone && (gPhone === '9875563329' || gPhone === '8584017701'));

        const profileData = {
          name: gName,
          phone: gPhone,
          email: gEmail,
          address: gAddress,
          role: (isAdminUser ? 'admin' : 'customer') as 'admin' | 'customer'
        };

        onLogin(profileData);
        sendCustomerLoginToGoogleSheet({
          ...profileData,
          loginMethod: 'Google OAuth Sign-In'
        });

        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(lang === 'en' ? 'Google Sign-In failed. Please fill details below.' : 'গুগল সাইন-ইন সম্ভব হয়নি। নিচের ফর্মে তথ্য দিন।');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(lang === 'en' ? 'Please fill in Name, Phone, and Email.' : 'অনুগ্রহ করে নাম, ফোন এবং ইমেইল প্রদান করুন।');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    const isAdminUser = 
      trimmedEmail === 'subhobratamondal@gmail.com' || 
      trimmedEmail === 'khanmegha99@gmail.com' || 
      trimmedPhone === '9875563329' || 
      trimmedPhone === '8584017701';

    const profileData = {
      name: name.trim(),
      phone: trimmedPhone,
      email: email.trim(),
      address: address.trim(),
      role: (isAdminUser ? 'admin' : 'customer') as 'admin' | 'customer'
    };

    onLogin(profileData);
    sendCustomerLoginToGoogleSheet({
      ...profileData,
      loginMethod: 'Manual Form Registration'
    });
    setSubmitted(true);
    setIsEditingProfile(false);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-6 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {user?.isLoggedIn 
                    ? (lang === 'en' ? 'My Account' : 'আমার অ্যাকাউন্ট') 
                    : (lang === 'en' ? 'Customer Sign In / Sign Up' : 'কাস্টমার লগইন / সাইন আপ')}
                </h3>
                <p className="text-xs text-white/80">
                  {lang === 'en' ? 'Bake n\' Flake ~ Flavours by Musu' : 'বেক অ্যান্ড ফ্লেক ~ ফ্লেভার্স বাই মুসু'}
                </p>
              </div>
            </div>
          </div>

          {user?.isLoggedIn ? (
            /* Logged in View with Edit/Remove Data Options */
            <div className="p-6 space-y-5">
              <div className="p-4 bg-pink-50 dark:bg-pink-950/30 rounded-2xl border border-pink-100 dark:border-pink-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <ShieldCheck size={12} /> {user.role === 'admin' ? (lang === 'en' ? 'Owner Logged In' : 'মালিকের অ্যাকাউন্ট') : (lang === 'en' ? 'Customer Logged In' : 'লগইন করা আছে')}
                  </span>
                  <button
                    onClick={handleLogoutAction}
                    className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 hover:underline px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
                  >
                    <LogOut size={13} /> {lang === 'en' ? 'Log Out' : 'লগ আউট (সকল ডাটা মুছুন)'}
                  </button>
                </div>

                {!isEditingProfile ? (
                  <>
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200 pt-1">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-pink-500 shrink-0" />
                        <span className="font-bold">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-pink-500 shrink-0" />
                        <span>{user.phone || (lang === 'en' ? 'No phone added' : 'ফোন নম্বর যোগ করা নেই')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-pink-500 shrink-0" />
                        <span>{user.email || (lang === 'en' ? 'No email added' : 'ইমেল যোগ করা নেই')}</span>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-pink-200/50 dark:border-pink-900/30">
                        <MapPin size={16} className="text-pink-500 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed">{user.address || (lang === 'en' ? 'No address added' : 'ঠিকানা যোগ করা নেই')}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Save size={14} />
                        {lang === 'en' ? 'Edit / Add Profile Info' : 'তথ্য পরিবর্তন বা যোগ করুন'}
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {lang === 'en' ? 'Full Name' : 'আপনার নাম'}
                      </label>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {lang === 'en' ? 'WhatsApp Phone' : 'মোবাইল নম্বর'}
                      </label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {lang === 'en' ? 'Email Address' : 'ইমেল ঠিকানা'}
                      </label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {lang === 'en' ? 'Address' : 'ডেলিভারি ঠিকানা'}
                      </label>
                      <textarea 
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs"
                      >
                        {lang === 'en' ? 'Save Changes' : 'ডাটা সেভ করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddress('');
                          setPhone('');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                        title={lang === 'en' ? 'Clear optional phone & address' : 'ফোন ও ঠিকানা মুছুন'}
                      >
                        <Trash2 size={13} />
                        {lang === 'en' ? 'Clear Extra' : 'মুছুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs"
                      >
                        {lang === 'en' ? 'Cancel' : 'বাতিল'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
                </button>
              </div>
            </div>
          ) : (
            /* Customer Login Form */
            <div className="p-6 space-y-4">
              {submitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle size={48} className="text-emerald-500 mx-auto animate-bounce" />
                  <p className="font-bold text-slate-800 dark:text-white">
                    {lang === 'en' ? 'Welcome Back!' : 'স্বাগতম!'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleCustomerGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-95"
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    )}
                    <span>
                      {lang === 'en' ? 'Continue with Google' : 'গুগল দিয়ে সাইন ইন করুন'}
                    </span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {lang === 'en' ? 'OR MANUAL FORM' : 'অথবা তথ্য দিন'}
                    </span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl text-center">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {lang === 'en' ? 'Full Name *' : 'আপনার নাম *'}
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input 
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={lang === 'en' ? 'e.g. Rahul Roy' : 'যেমন: রাহুল রায়'}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {lang === 'en' ? 'WhatsApp Phone Number *' : 'হোয়াটসঅ্যাপ মোবাইল নম্বর *'}
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input 
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={lang === 'en' ? 'e.g. 9876543210' : 'যেমন: ৯৮৭৬৫৪৩২১০'}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {lang === 'en' ? 'Email Address *' : 'ইমেল ঠিকানা *'}
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input 
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {lang === 'en' ? 'Delivery Address' : 'ডেলিভারি ঠিকানা'}
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <textarea 
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={lang === 'en' ? 'Full Street / Landmark / City' : 'সম্পূর্ণ ঠিকানা / ল্যান্ডমার্ক / শহর'}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bold shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all"
                    >
                      {lang === 'en' ? 'Save & Continue' : 'সংরক্ষণ করুন ও এগিয়ে যান'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
}


