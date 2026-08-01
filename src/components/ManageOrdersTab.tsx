import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Search, CheckCircle2, MessageSquare, Phone, MapPin, ExternalLink, Lock, FileSpreadsheet, KeyRound, AlertCircle, Copy, Check, Edit3, Plus, Trash2, Save } from 'lucide-react';
import { Order, OrderStatus, CartItem } from '../types';
import { generateWhatsAppStatusUpdateLink, TARGET_GOOGLE_SHEET_ID } from '../utils/googleSheetsSync';
import { AppContext } from '../App';
import { sendStatusUpdateEmail, sendEmailViaAppsScript } from '../utils/gmailService';
import { getAccessToken } from '../lib/workspaceAuth';
import OptimizedImage from './OptimizedImage';

interface ManageOrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  lang: 'en' | 'bn';
}

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function ManageOrdersTab({
  orders,
  onUpdateStatus,
  onUpdateOrder,
  lang
}: ManageOrdersTabProps) {
  const { isAdminLoggedIn, setIsAdminLoggedIn, user, setIsWorkspaceOpen } = useContext(AppContext);
  const cleanPhone = (user?.phone || '').replace(/\D/g, '');
  const isAuthorizedAdmin = user?.isLoggedIn && (
    cleanPhone.endsWith('8584017701') || 
    cleanPhone.endsWith('9875563329') ||
    user?.email === 'subhobratamondal@gmail.com' ||
    user?.email === 'khanmegha99@gmail.com'
  );
  
  const [userIdInput, setUserIdInput] = useState('');
  const [userIdError, setUserIdError] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Edit State for Pending Orders
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editItems, setEditItems] = useState<{ id: string; productNameEn: string; productNameBn: string; weight: string; quantity: number; price: number; img: string }[]>([]);

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id);
    const items = order.items.map(it => ({
      id: it.id || 'it_' + Math.random().toString(36).substring(2, 6),
      productNameEn: it.productNameEn,
      productNameBn: it.productNameBn || it.productNameEn,
      weight: it.weight || '1 Pound',
      quantity: it.quantity || 1,
      price: it.price || 450,
      img: it.img || ''
    }));
    setEditItems(items);
    const calcSum = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    setEditTotal(order.total || calcSum);
  };

  const updateItemsAndTotal = (newItems: typeof editItems) => {
    setEditItems(newItems);
    const calcSum = newItems.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    setEditTotal(calcSum);
  };

  const handleSaveEdit = (order: Order, overrideStatus?: OrderStatus) => {
    const finalItems = editItems as CartItem[];
    const computedTotal = editItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    const finalTotal = editTotal > 0 ? editTotal : computedTotal;

    const updatedOrder: Order = {
      ...order,
      items: finalItems,
      total: finalTotal,
      subtotal: finalTotal,
      status: overrideStatus || order.status
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }
    setEditingOrderId(null);
  };

  const [emailNotice, setEmailNotice] = useState<string>('');

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (editingOrderId === order.id) {
      handleSaveEdit(order, newStatus);
    } else {
      onUpdateStatus(order.id, newStatus);
    }

    // Attempt automated email notification
    if (order.customerEmail && order.customerEmail.includes('@')) {
      sendEmailViaAppsScript(order, newStatus).catch(err => {
        console.warn('Apps script email notice:', err);
      });
      setEmailNotice(lang === 'en' ? `Status updated & confirmation email sent to ${order.customerEmail}` : `অর্ডার স্ট্যাটাস আপডেট ও ${order.customerEmail}-এ ইমেইল পাঠানো হয়েছে!`);
      setTimeout(() => setEmailNotice(''), 4000);

      const token = getAccessToken();
      if (token) {
        try {
          await sendStatusUpdateEmail(token, order, newStatus);
        } catch (err) {
          console.warn('Gmail API send note:', err);
        }
      }
    }
  };

  if (!isAuthorizedAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-lg">
          <Lock size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
            {lang === 'en' 
              ? 'Only authorized admins can access this tab. Please login with an admin account.' 
              : 'শুধুমাত্র অনুমোদিত অ্যাডমিনরা এই ট্যাবটি অ্যাক্সেস করতে পারবেন। অনুগ্রহ করে অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।'}
          </p>
        </div>
      </div>
    );
  }

  const handleUserIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userIdInput.trim() === 'bnfmusu') {
      setIsAdminLoggedIn(true);
      setUserIdError(false);
      setUserIdInput('');
    } else {
      setUserIdError(true);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const appScriptCode = `// Bake n' Flake (~Flavours by Musu) Google Apps Script Order Sync
function doPost(e) { return handleRequest(e); }
function doGet(e) { return handleRequest(e); }
function handleRequest(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("order info") || ss.getSheetByName("Orders") || ss.getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    var targetOrderId = String(data.orderId || data.id || "").trim();
    var rowValues = [
      data.timestamp || new Date().toLocaleString(), targetOrderId, data.customerName, data.customerPhone, data.customerEmail,
      JSON.stringify(data.items), data.subtotal, data.total, data.deliveryDate, data.deliveryAddress, data.status, data.paymentMethod, data.notes
    ];
    // Sync logic...
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) { return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON); }
}`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header Info */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {lang === 'en' ? 'Manage Customer Orders' : 'গ্রাহকের অর্ডার পরিচালনা করুন'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Status, Price & WhatsApp updates' : 'অর্ডার স্ট্যাটাস, দাম ও হোয়াটসঅ্যাপ আপডেট'}
            </p>
          </div>
        </div>
      </div>

      {!isAdminLoggedIn ? (
        <div className="p-8 md:p-12 text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 text-pink-500 border border-pink-500/30 flex items-center justify-center mx-auto">
            <Shield size={32} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'en' ? 'Owner Access Verification' : 'মালিক এক্সেস যাচাইকরণ'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en' ? 'Enter User ID to access admin portal' : 'অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার ইউজার আইডি লিখুন'}
            </p>
          </div>
          <form onSubmit={handleUserIdSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="password"
                required
                value={userIdInput}
                onChange={(e) => { setUserIdInput(e.target.value); setUserIdError(false); }}
                placeholder={lang === 'en' ? 'Enter Owner User ID' : 'ইউজার আইডি দিন'}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
              />
            </div>
            {userIdError && (
              <div className="text-xs text-rose-500 font-bold mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                {lang === 'en' ? 'Invalid User ID!' : 'ভুল ইউজার আইডি!'}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bold shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all"
            >
              {lang === 'en' ? 'Unlock Portal' : 'পোর্টাল আনলক করুন'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Sync Stats Banner */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 px-6 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'en' ? 'Google Sheet Sync ID:' : 'গুগল শিট সিঙ্ক আইডি:'}</span>
              <code className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-[11px] font-mono">{TARGET_GOOGLE_SHEET_ID}</code>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://docs.google.com/spreadsheets/d/${TARGET_GOOGLE_SHEET_ID}/edit`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                <ExternalLink size={14} />
                {lang === 'en' ? 'Open Sheet' : 'গুগল শিট'}
              </a>
              <button onClick={() => setShowScriptModal(true)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-200 text-xs font-bold transition-all">
                {lang === 'en' ? 'Sync Script' : 'সিঙ্ক স্ক্রিপ্ট'}
              </button>
            </div>
          </div>

          {/* Email Notice */}
          {emailNotice && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {emailNotice}
            </motion.div>
          )}

          {/* Search & Filter */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search ID / Name / Phone...' : 'খুজুন...'}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              <button onClick={() => setFilterStatus('All')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'All' ? 'bg-pink-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}>All ({orders.length})</button>
              {ALL_STATUSES.map(st => (
                <button key={st} onClick={() => setFilterStatus(st)} className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === st ? 'bg-pink-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}>
                  {st} ({orders.filter(o => o.status === st).length})
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-slate-900/50">
            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">{lang === 'en' ? 'No orders match.' : 'কোন অর্ডার মেলেনি।'}</div>
            ) : (
              filteredOrders.map(order => {
                const isDelivered = order.status === 'Delivered';
                const waLink = generateWhatsAppStatusUpdateLink(order, order.status);
                const isEditing = editingOrderId === order.id;

                return (
                  <div key={order.id} className={`p-5 rounded-2xl border shadow-sm transition-all space-y-4 ${isDelivered ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-pink-600">{order.id}</span>
                          <span className="text-[10px] text-slate-400">• {new Date(order.timestamp).toLocaleString()}</span>
                          {isDelivered && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1"><Lock size={10} /> Delivered</span>}
                        </div>
                        <div className="text-sm font-bold mt-1 flex items-center gap-2">
                          {order.customerName}
                          <a href={`tel:${order.customerPhone}`} className="text-xs text-slate-500 hover:text-pink-500 flex items-center gap-1">
                            <Phone size={12} /> {order.customerPhone}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'Pending' && !isEditing && (
                          <button onClick={() => startEditing(order)} className="py-1.5 px-2.5 rounded-xl bg-amber-500 text-slate-900 font-bold text-xs flex items-center gap-1 shadow-sm"><Edit3 size={14} /> Edit</button>
                        )}
                        <select
                          value={order.status}
                          disabled={isDelivered}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                          className="text-xs font-bold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none"
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <a href={waLink} target="_blank" rel="noreferrer" className="py-1.5 px-3 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"><MessageSquare size={14} /> Send Update</a>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border-2 border-amber-400/50 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2"><Edit3 size={14} /> Edit Order Details</span>
                          <span className="text-[10px] text-amber-600">{lang === 'en' ? '(Price & Items can only be edited while Pending)' : '(অর্ডার পেন্ডিং থাকাকালীন এডিট সম্ভব)'}</span>
                        </div>
                        <div className="space-y-2">
                          {editItems.map((it, idx) => (
                            <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <input type="text" value={it.productNameEn} onChange={(e) => setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, productNameEn: e.target.value } : item))} className="col-span-4 px-2 py-1 text-xs border rounded bg-transparent" />
                              <input type="text" value={it.weight} onChange={(e) => setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, weight: e.target.value } : item))} className="col-span-3 px-2 py-1 text-xs border rounded bg-transparent" />
                              <input type="number" value={it.quantity} onChange={(e) => updateItemsAndTotal(editItems.map((item, i) => i === idx ? { ...item, quantity: parseInt(e.target.value) || 1 } : item))} className="col-span-2 px-1 py-1 text-xs border rounded bg-transparent text-center" />
                              <input type="number" value={it.price} onChange={(e) => updateItemsAndTotal(editItems.map((item, i) => i === idx ? { ...item, price: parseFloat(e.target.value) || 0 } : item))} className="col-span-2 px-1 py-1 text-xs border rounded bg-transparent text-center font-bold text-pink-600" />
                              <button onClick={() => updateItemsAndTotal(editItems.filter((_, i) => i !== idx))} className="col-span-1 text-rose-500 hover:bg-rose-50 rounded p-1"><Trash2 size={13} /></button>
                            </div>
                          ))}
                          <button onClick={() => updateItemsAndTotal([...editItems, { id: 'it_'+Date.now(), productNameEn: 'New Item', productNameBn: '', weight: '1 Pound', quantity: 1, price: 450, img: '' }])} className="text-[10px] font-bold flex items-center gap-1 text-slate-500 px-2 py-1 border rounded-lg hover:bg-slate-50"><Plus size={12} /> Add Item</button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Total (₹):</span>
                            <input type="number" value={editTotal} onChange={(e) => setEditTotal(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border-2 border-pink-500 rounded-lg font-black text-pink-600 text-sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingOrderId(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold">Cancel</button>
                            <button onClick={() => handleSaveEdit(order)} className="px-4 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-500/20">Save</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-400 font-bold block mb-1">Delivery Address & Date:</span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{order.deliveryAddress}</p>
                            <p className="text-pink-600 font-black mt-1">{order.deliveryDate} • {order.paymentMethod}</p>
                          </div>
                          {order.customerEmail && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Email Address:</span>
                              <span className="text-slate-600 dark:text-slate-400 font-semibold">{order.customerEmail}</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 font-bold block mb-2 uppercase tracking-tighter">Order Items</span>
                          <div className="space-y-2">
                            {order.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <OptimizedImage src={it.img || 'https://i.ibb.co/Xx2kxrrg/LOGO-1.png'} alt={it.productNameEn} width={40} height={40} containerClassName="w-10 h-10 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700" className="object-cover" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{it.productNameEn}</span>
                                    <span className="text-[10px] text-slate-400">{it.weight} x{it.quantity}</span>
                                  </div>
                                </div>
                                <span className="font-black text-pink-600">₹{(it.price || 450) * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-black text-sm">
                            <span className="text-slate-400 uppercase tracking-widest text-[10px]">Total Bill:</span>
                            <span className="text-pink-600 text-base">₹{order.total}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Script Modal */}
      <AnimatePresence>
        {showScriptModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 text-white rounded-3xl p-6 max-w-xl w-full border border-slate-700 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2"><FileSpreadsheet className="text-emerald-400" size={20} /> Apps Script Code</h4>
                <button onClick={() => setShowScriptModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-[11px] text-slate-400">Deploy as Web App to enable sync.</p>
              <div className="relative">
                <pre className="p-4 bg-black/60 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-60 border border-slate-800">{appScriptCode}</pre>
                <button
                  onClick={() => { navigator.clipboard.writeText(appScriptCode); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-bold flex items-center gap-1"
                >
                  {copiedScript ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedScript ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button onClick={() => setShowScriptModal(false)} className="w-full py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 font-bold text-xs transition-colors">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
