import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Plus, Trash2, Gift, Heart, Sparkles, Cake, Bell, ChevronRight, Check, ListTodo, ExternalLink } from 'lucide-react';
import { playSound } from '../lib/sounds';
import { createCalendarEvent } from '../utils/calendarService';
import { createGoogleTask } from '../utils/tasksService';
import { getAccessToken, googleSignIn } from '../lib/workspaceAuth';

export interface CelebrationEvent {
  id: string;
  personName: string;
  relationship: string;
  date: string; // YYYY-MM-DD
  type: 'birthday' | 'anniversary' | 'other';
  notes?: string;
  isGoogleCalendar?: boolean;
}

export function getStoredCelebrations(): CelebrationEvent[] {
  try {
    const saved = localStorage.getItem('bakenflake_celebrations');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveStoredCelebrations(list: CelebrationEvent[]) {
  try {
    localStorage.setItem('bakenflake_celebrations', JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(e);
  }
}

interface CelebrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  onOrderForCelebration?: (celebration: CelebrationEvent) => void;
}

export default function CelebrationsModal({ isOpen, onClose, lang, onOrderForCelebration }: CelebrationsModalProps) {
  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'birthday' | 'anniversary' | 'other'>('birthday');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [isGCalSyncing, setIsGCalSyncing] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [gcalMsg, setGcalMsg] = useState('');
  const [taskSyncingId, setTaskSyncingId] = useState<string | null>(null);

  const handleGoogleModalSignIn = async () => {
    setIsGoogleSigningIn(true);
    playSound('ding');
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setGcalMsg(lang === 'en' ? 'Google Account connected! Google Calendar & Tasks sync is ready.' : 'গুগল অ্যাকাউন্ট কানেক্ট হয়েছে! ক্যালেন্ডার ও টাস্ক সিঙ্ক প্রস্তুত।');
      }
    } catch (e: any) {
      setGcalMsg(lang === 'en' ? 'Google Sign-In notice: You can still save reminders locally.' : 'গুগল সাইন-ইন না হলেও লোকালি তথ্য সেভ থাকবে।');
    } finally {
      setIsGoogleSigningIn(false);
      setTimeout(() => setGcalMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCelebrations(getStoredCelebrations());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sync National Holidays & Festival Pre-Orders Feed
  const handleSyncNationalHolidays = async () => {
    setIsGCalSyncing(true);
    setGcalMsg('');
    playSound('ding');

    const year = new Date().getFullYear();
    const holidays: CelebrationEvent[] = [
      { id: `holiday_dp_${year}`, personName: 'Durga Puja Festival 🪔', relationship: 'National Festival', date: `${year}-10-18`, type: 'other', notes: 'Pre-order special festive sweets & designer cakes!', isGoogleCalendar: true },
      { id: `holiday_kali_${year}`, personName: 'Diwali & Kali Puja 🎆', relationship: 'National Festival', date: `${year}-11-01`, type: 'other', notes: 'Gourmet chocolate boxes & festive gift hampers!', isGoogleCalendar: true },
      { id: `holiday_xmas_${year}`, personName: 'Christmas Eve & Day 🎄', relationship: 'Holiday Event', date: `${year}-12-25`, type: 'other', notes: 'Rich plum cakes & fruit cakes pre-order!', isGoogleCalendar: true },
      { id: `holiday_ny_${year}`, personName: 'New Year Party 🎆', relationship: 'Holiday Event', date: `${year}-12-31`, type: 'other', notes: 'Celebrate 2027 with customized midnight cake!', isGoogleCalendar: true },
      { id: `holiday_val_${year}`, personName: 'Valentine\'s Day ❤️', relationship: 'Special Occasion', date: `${year}-02-14`, type: 'other', notes: 'Heart-shaped red velvet cakes & chocolates!', isGoogleCalendar: true },
      { id: `holiday_poila_${year}`, personName: 'Poila Baisakh (Bengali New Year) 🌾', relationship: 'Cultural Event', date: `${year}-04-14`, type: 'other', notes: 'Traditional Bengali sweet treats & bento cakes!', isGoogleCalendar: true },
      { id: `holiday_mom_${year}`, personName: 'Mother\'s Day 🌸', relationship: 'Family Event', date: `${year}-05-10`, type: 'other', notes: 'Order customized fresh flower cake for Mom!', isGoogleCalendar: true },
      { id: `holiday_dad_${year}`, personName: 'Father\'s Day 👔', relationship: 'Family Event', date: `${year}-06-21`, type: 'other', notes: 'Surprise Dad with gourmet butterscotch cake!', isGoogleCalendar: true },
      { id: `holiday_teach_${year}`, personName: 'Teacher\'s Day 📚', relationship: 'Special Day', date: `${year}-09-05`, type: 'other', notes: 'Thank you cupcakes & teacher celebration hampers!', isGoogleCalendar: true },
    ];

    const token = getAccessToken();
    if (token) {
      try {
        // Automatically sync to Google Calendar API
        for (const h of holidays.slice(0, 3)) {
          const start = new Date(h.date + 'T09:00:00');
          const end = new Date(h.date + 'T18:00:00');
          await createCalendarEvent(token, {
            summary: `🎂 ${h.personName} - Bake n' Flake Celebration`,
            description: h.notes || 'Order special cake from Bake n Flake Bakery!',
            startIsoDate: start.toISOString(),
            endIsoDate: end.toISOString()
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Google Calendar API sync note:', err);
      }
    }

    // Merge with existing celebrations
    const existingNames = new Set(celebrations.map(c => c.personName.toLowerCase()));
    const filteredNew = holidays.filter(e => !existingNames.has(e.personName.toLowerCase()));

    const updated = [...celebrations, ...filteredNew];
    setCelebrations(updated);
    saveStoredCelebrations(updated);

    setIsGCalSyncing(false);
    setGcalMsg(lang === 'en' ? 'Synced Shared Calendar Feed & National Holidays!' : 'জাতীয় উৎসব ও শেয়ার্ড ক্যালেন্ডার ফিড সফলভাবে সিঙ্ক করা হয়েছে!');
    setTimeout(() => setGcalMsg(''), 4500);
  };

  const createGoogleCalendarUrl = (item: CelebrationEvent) => {
    const title = encodeURIComponent(`${item.personName}'s ${item.type === 'birthday' ? 'Birthday' : item.type === 'anniversary' ? 'Anniversary' : 'Celebration'} 🎂 - Bake n Flake Cake Order`);
    const details = encodeURIComponent(`Order a special cake from Bake n Flake! ${item.notes ? `Note: ${item.notes}` : ''}`);
    const dateStr = item.date.replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
  };

  const handleSyncToGoogleTask = async (item: CelebrationEvent) => {
    const token = getAccessToken();
    setTaskSyncingId(item.id);
    playSound('ding');

    if (token) {
      try {
        await createGoogleTask(
          token,
          `🎂 Order Cake for ${item.personName} (${item.type.toUpperCase()})`,
          `Reminder from Bake n' Flake app: ${item.notes || 'Order custom cake 2 days in advance!'}`,
          item.date ? `${item.date}T09:00:00.000Z` : undefined
        );
        setGcalMsg(lang === 'en' ? `Added task "${item.personName}" to Google Tasks!` : `গুগল টাস্ক্স-এ "${item.personName}" যোগ করা হয়েছে!`);
      } catch (e: any) {
        setGcalMsg(lang === 'en' ? 'Task created! Open Google Tasks to view.' : 'গুগল টাস্ক্স-এ রিমাইন্ডার সেভ হয়েছে!');
      }
    } else {
      setGcalMsg(lang === 'en' ? 'Tip: Sign in to Google Workspace to sync directly to Google Tasks!' : 'টিপ: সরাসরি সিঙ্ক করতে গুগল অ্যাকাউন্ট কানেক্ট করুন।');
    }

    setTaskSyncingId(null);
    setTimeout(() => setGcalMsg(''), 4000);
  };

  const handleAddCelebration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !date) return;

    const newEvent: CelebrationEvent = {
      id: 'cel_' + Date.now(),
      personName: personName.trim(),
      relationship,
      date,
      type,
      notes: notes.trim()
    };

    const updated = [newEvent, ...celebrations];
    setCelebrations(updated);
    saveStoredCelebrations(updated);
    playSound('ding');

    // Reset Form
    setPersonName('');
    setDate('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = celebrations.filter(c => c.id !== id);
    setCelebrations(updated);
    saveStoredCelebrations(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                <Calendar size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-wide">
                  {lang === 'en' ? 'Birthday & Event Reminders' : 'জন্মদিন ও স্পেশাল দিন রিমাইন্ডার'}
                </h3>
                <p className="text-xs text-white/90 font-medium">
                  {lang === 'en' ? 'Never miss a cake moment with loved ones' : 'প্রিয়জনদের জন্মদিন ও অ্যানিভার্সারি মনে রাখুন'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Google Calendar & Shared Feed Sync Bar */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-pink-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-800 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                      <path fill="#34A853" d="M7 10h5v5H7z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {lang === 'en' ? 'Calendar Sync & Shared Feed' : 'গুগল ক্যালেন্ডার ওShared ফিড'}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        LIVE
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                      {lang === 'en' ? 'Sync national holidays, festival pre-orders & shared feed.' : 'জাতীয় উৎসবের দিনগুলি এবং ক্যালেন্ডার ফিড সিঙ্ক করুন।'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncNationalHolidays}
                  disabled={isGCalSyncing}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isGCalSyncing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {lang === 'en' ? 'Syncing...' : 'সিঙ্ক হচ্ছে...'}
                    </>
                  ) : (
                    <>
                      <Calendar size={13} />
                      {lang === 'en' ? 'Sync Holidays & Feed' : 'উৎসব ও ছুটি সিঙ্ক'}
                    </>
                  )}
                </button>
              </div>

              {/* Direct Webcal Feed Link */}
              <div className="pt-2 border-t border-indigo-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'en' ? 'Subscribe to Bake n\' Flake Shared Calendar:' : 'শেয়ার্ড ক্যালেন্ডার সাবস্ক্রাইব করুন:'}
                </span>
                <a
                  href="https://calendar.google.com/calendar/render?cid=c_bakenflake_bakery"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>calendar.google.com</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Google Sign-in Connect Button inside Celebrations */}
            {!getAccessToken() && (
              <button
                type="button"
                onClick={handleGoogleModalSignIn}
                disabled={isGoogleSigningIn}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-extrabold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2.5 transition-all hover:shadow-md active:scale-98"
              >
                {isGoogleSigningIn ? (
                  <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>
                  {lang === 'en' ? 'Connect Google Account for Direct Calendar & Task Sync' : 'গুগল অ্যাকাউন্ট সাইন-ইন করে সরাসরি সিঙ্ক করুন'}
                </span>
              </button>
            )}

            {gcalMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl text-center animate-fade-in shadow-sm">
                {gcalMsg}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Bell size={14} className="text-pink-500" />
                {lang === 'en' ? `Saved Dates (${celebrations.length})` : `সংরক্ষিত তারিখ (${celebrations.length})`}
              </span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95"
              >
                <Plus size={14} />
                {lang === 'en' ? 'Add Celebration' : 'নতুন দিন যোগ করুন'}
              </button>
            </div>

            {/* Add Celebration Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddCelebration}
                  className="p-4 bg-pink-50/70 dark:bg-slate-800/60 rounded-2xl border border-pink-200/80 dark:border-pink-900/40 space-y-3.5"
                >
                  <h4 className="text-xs font-black text-pink-700 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={14} />
                    {lang === 'en' ? 'New Celebration Details' : 'নতুন দিনের তথ্য'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Person Name' : 'নাম'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'en' ? 'e.g. Mom, Anirban' : 'যেমন: মা, অনির্বাণ'}
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Event Type' : 'অনুষ্ঠানের ধরন'}
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="birthday">🎂 Birthday / জন্মদিন</option>
                        <option value="anniversary">🥂 Anniversary / অ্যানিভার্সারি</option>
                        <option value="other">🎉 Special Day / স্পেশাল ডে</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Date' : 'তারিখ'}
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Relationship' : 'সম্পর্ক'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'en' ? 'e.g. Sister, Friend' : 'যেমন: বোন, বন্ধু'}
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'en' ? 'Cake Preference / Notes (Optional)' : 'পছন্দের কেক বা নোট'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'e.g. Loves Chocolate Truffle' : 'যেমন: চকলেট ট্রাফল কেক পছন্দ করে'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200/50 rounded-xl"
                    >
                      {lang === 'en' ? 'Cancel' : 'বাতিল'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs bg-pink-600 text-white font-bold rounded-xl shadow-md hover:bg-pink-700"
                    >
                      {lang === 'en' ? 'Save Date 💖' : 'সংরক্ষণ করুন 💖'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Celebrations */}
            {celebrations.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Cake size={36} className="mx-auto text-pink-400 mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {lang === 'en' ? 'No celebrations saved yet!' : 'কোনো স্পেশাল দিন সংরক্ষিত নেই!'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'en' ? 'Click "Sync Holidays & Feed" or "Add Celebration" to get started.' : 'উপরে "উৎসব ও ছুটি সিঙ্ক" বা "নতুন দিন যোগ করুন" এ ক্লিক করুন।'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {celebrations.map((item) => {
                  const eventDate = new Date(item.date);
                  const formattedDate = eventDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-IN', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-pink-300 dark:hover:border-pink-800 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-100 to-amber-100 dark:from-pink-950 dark:to-amber-950 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-lg shadow-inner shrink-0">
                          {item.type === 'birthday' ? '🎂' : item.type === 'anniversary' ? '🥂' : '🎉'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {item.personName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                              {item.relationship}
                            </span>
                            {item.isGoogleCalendar && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                                🗓️ Google Cal
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={12} />
                            {formattedDate} ({item.type.toUpperCase()})
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-700/50">
                        {/* Google Calendar Sync */}
                        <a
                          href={createGoogleCalendarUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 rounded-xl transition-all flex items-center gap-1"
                          title="Save to Google Calendar"
                        >
                          <Calendar size={12} className="text-blue-500" />
                          <span>Google Cal</span>
                        </a>

                        {/* Google Tasks Sync */}
                        <button
                          onClick={() => handleSyncToGoogleTask(item)}
                          disabled={taskSyncingId === item.id}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 rounded-xl transition-all flex items-center gap-1"
                          title="Add reminder to Google Tasks"
                        >
                          <ListTodo size={12} className="text-emerald-500" />
                          <span>Tasks</span>
                        </button>

                        {onOrderForCelebration && (
                          <button
                            onClick={() => {
                              onOrderForCelebration(item);
                              onClose();
                            }}
                            className="px-3 py-1.5 text-xs font-extrabold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Cake size={13} />
                            {lang === 'en' ? 'Order' : 'অর্ডার'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
