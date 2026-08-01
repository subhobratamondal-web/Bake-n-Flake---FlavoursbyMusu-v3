import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  X, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  Sheet, 
  Mail,
  CheckSquare,
  Calendar as CalendarIcon,
  Send,
  LogOut, 
  ShieldCheck,
  FolderPlus,
  Clock,
  Sparkles,
  Cake,
  Bell,
  ShoppingBag,
  Phone,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppContext } from '../App';
import { 
  initAuth, 
  googleSignIn, 
  workspaceSignIn,
  logoutGoogle,
  auth,
  getAccessToken
} from '../lib/workspaceAuth';
import { User } from 'firebase/auth';
import { 
  listDriveFiles, 
  uploadTextFileToDrive, 
  uploadImageFileToDrive, 
  deleteDriveFile, 
  DriveFile 
} from '../utils/driveService';
import { 
  getSpreadsheetDetails, 
  getSheetValues, 
  appendSheetRows, 
  updateSheetRange, 
  createBakeryOrdersSheet, 
  addSheetTabToSpreadsheet,
  SpreadsheetInfo 
} from '../utils/sheetsService';
import {
  sendOrderConfirmationEmail,
  sendStatusUpdateEmail,
  sendGmailMessage
} from '../utils/gmailService';
import {
  getTaskLists,
  createGoogleTask,
  listGoogleTasks,
  TaskItem
} from '../utils/tasksService';
import {
  createCalendarEvent,
  listCalendarEvents
} from '../utils/calendarService';
import { CelebrationEvent, getStoredCelebrations } from './CelebrationsModal';
import { Order, OrderStatus, CartItem } from '../types';
import { generateWhatsAppStatusUpdateLink, TARGET_GOOGLE_SHEET_ID } from '../utils/googleSheetsSync';
import OptimizedImage from './OptimizedImage';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: Order[];
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export function parseSpreadsheetInput(input: string, fallbackSpreadsheetId = DEFAULT_SPREADSHEET_ID): {
  spreadsheetId: string;
  gid?: number;
} {
  if (!input || !input.trim()) {
    return { spreadsheetId: fallbackSpreadsheetId };
  }
  const str = input.trim();

  let spreadsheetId = '';
  let gid: number | undefined = undefined;

  // 1. Try to extract spreadsheet ID from URL /d/([a-zA-Z0-9_-]+)
  const urlMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    spreadsheetId = urlMatch[1];
  }

  // 2. Try to extract GID parameter gid=([0-9]+) or #gid=([0-9]+)
  const gidMatch = str.match(/[?#&]gid=([0-9]+)/) || str.match(/gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = parseInt(gidMatch[1], 10);
  }

  // 3. If str is purely numeric (e.g. "1527393898"), it's a GID!
  if (/^[0-9]+$/.test(str)) {
    gid = parseInt(str, 10);
  }

  // 4. If no spreadsheet ID extracted from URL, check if str itself looks like a valid spreadsheet ID
  if (!spreadsheetId) {
    if (str.length >= 20 && !/^[0-9]+$/.test(str)) {
      spreadsheetId = str;
    } else {
      spreadsheetId = fallbackSpreadsheetId;
    }
  }

  return { spreadsheetId, gid };
}

export function cleanSpreadsheetId(input: string): string {
  return parseSpreadsheetInput(input).spreadsheetId;
}

const DEFAULT_SPREADSHEET_ID = '1vZsYmZzxu653U4T6O-_S0i2dazAU_VJKBRYwdgAmXSw';

const UPCOMING_HOLIDAYS = [
  { name: 'Independence Day', date: '2026-08-15', desc: 'National celebration cakes & tricolor theme desserts' },
  { name: 'Raksha Bandhan', date: '2026-08-28', desc: 'Customized gift hampers & gourmet chocolate boxes' },
  { name: 'Durga Puja (Saptami)', date: '2026-10-18', desc: 'Festive Bengali sweets & special themed cakes' },
  { name: 'Durga Puja (Ashtami)', date: '2026-10-19', desc: 'Grand puja platters & traditional fusion desserts' },
  { name: 'Bijoya Dashami', date: '2026-10-21', desc: 'Gift boxes for relatives & sweet distribution' },
  { name: 'Diwali & Kali Puja', date: '2026-11-08', desc: 'Artisan mithai boxes & fusion dessert platters' },
  { name: 'Bhai Phonta', date: '2026-11-10', desc: 'Special cupcakes & personalized hampers for brothers' },
  { name: 'Christmas Eve & Day', date: '2026-12-25', desc: 'Traditional plum cakes & gingerbread houses' },
  { name: 'New Year Celebration', date: '2027-01-01', desc: 'Midnight celebration cakes & champagne cupcakes' },
  { name: "Valentine's Special", date: '2027-02-14', desc: 'Red velvet heart cakes & custom macarons' }
];

export default function WorkspaceModal({ isOpen, onClose, orders = [], onUpdateStatus, onUpdateOrder }: WorkspaceModalProps) {
  const { lang, galleryData, user, setIsAdminLoggedIn } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState<'orders' | 'drive' | 'sheets' | 'gmail' | 'tasks' | 'calendar'>('orders');
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive States
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheets States
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [sheetDetails, setSheetDetails] = useState<SpreadsheetInfo | null>(null);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState('Orders');
  const [sheetRows, setSheetRows] = useState<(string | number)[][]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [newSubsheetTitle, setNewSubsheetTitle] = useState('');
  const [showAddSubsheet, setShowAddSubsheet] = useState(false);

  // Gmail States
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('Welcome to Bake n\' Flake Artisan Bakery!');
  const [testEmailBody, setTestEmailBody] = useState('<p>Hello! Thank you for subscribing to Bake n\' Flake. Enjoy fresh handcrafted treats every day!</p>');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Tasks States
  const [tasksList, setTasksList] = useState<TaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Calendar States
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [customCalTitle, setCustomCalTitle] = useState('');
  const [customCalDate, setCustomCalDate] = useState('');
  const [customCalDesc, setCustomCalDesc] = useState('');

  // Confirmation Modal State (Mandatory for destructive/mutating ops)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete_file' | 'update_sheet_row' | 'sync_orders' | 'send_test_email' | 'sync_order_task' | 'add_calendar_event';
    targetId?: string;
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'delete_file',
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Order Management States
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editItems, setEditItems] = useState<{ id: string; productNameEn: string; productNameBn: string; weight: string; quantity: number; price: number; img: string }[]>([]);
  const [emailNotice, setEmailNotice] = useState<string>('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initialize Auth Listener & Auto-connect for Admin & Google Workspace Sync
  useEffect(() => {
    const activeTok = getAccessToken();
    if (activeTok) {
      setToken(activeTok);
    }
    const unsubscribe = initAuth(
      (gUser, cachedToken) => {
        setGoogleUser(gUser);
        const tok = cachedToken || getAccessToken();
        if (tok) {
          setToken(tok);
        }
      },
      () => {
        const tok = getAccessToken();
        if (tok) {
          setToken(tok);
          if (auth.currentUser) setGoogleUser(auth.currentUser);
        } else if (user?.role === 'admin') {
          if (auth.currentUser) {
            setGoogleUser(auth.currentUser);
          }
        }
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Auto-connect and sync token when Workspace Modal opens
  useEffect(() => {
    if (isOpen) {
      const realToken = getAccessToken();
      if (realToken) {
        setToken(realToken);
      }
      if (user?.role === 'admin' && !googleUser) {
        if (auth.currentUser) {
          setGoogleUser(auth.currentUser);
        } else {
          const mockAdminUser = {
            displayName: user.name || 'Bake n\' Flake Owner',
            email: user.email || 'subhobratamondal@gmail.com',
            photoURL: 'https://i.ibb.co/Xx2kxrrg/LOGO-1.png'
          } as any;
          setGoogleUser(mockAdminUser);
        }
      }
    }
  }, [isOpen, user, googleUser]);

  // Sync default user email when googleUser updates
  useEffect(() => {
    if (googleUser?.email && !testEmailTo) {
      setTestEmailTo(googleUser.email);
    }
  }, [googleUser]);

  // Fetch data when active tab changes or modal opens
  useEffect(() => {
    const activeTok = token || getAccessToken();
    if (isOpen && activeTok && activeTok !== 'admin_active_session') {
      if (activeTab === 'drive') fetchDriveFiles();
      else if (activeTab === 'sheets') fetchSheetData();
      else if (activeTab === 'tasks') fetchTasksData();
      else if (activeTab === 'calendar') fetchCalendarData();
    }
  }, [isOpen, token, activeTab]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await workspaceSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
        showNotification(lang === 'en' ? 'Signed in with Workspace permissions!' : 'গুগল ওয়ার্কস্পেস পারমিশনসহ সাইন-ইন সফল হয়েছে!');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setToken(null);
    setDriveFiles([]);
    setSheetRows([]);
    setSheetDetails(null);
    setTasksList([]);
    setCalendarEvents([]);
    showNotification(lang === 'en' ? 'Signed out of Google' : 'গুগল সেশন শেষ হয়েছে');
  };

  // --- ORDER MANAGEMENT OPERATIONS ---
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

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (editingOrderId === order.id) {
      handleSaveEdit(order, newStatus);
    } else {
      if (onUpdateStatus) onUpdateStatus(order.id, newStatus);
    }

    if (order.customerEmail && order.customerEmail.includes('@')) {
      const activeToken = getAccessToken();
      if (activeToken) {
        try {
          await sendStatusUpdateEmail(activeToken, order, newStatus);
          setEmailNotice(lang === 'en' ? `Status updated & confirmation email sent to ${order.customerEmail}` : `অর্ডার স্ট্যাটাস আপডেট ও ${order.customerEmail}-এ ইমেইল পাঠানো হয়েছে!`);
          setTimeout(() => setEmailNotice(''), 4000);
        } catch (err) {
          console.warn('Gmail API error:', err);
        }
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerPhone.includes(orderSearchQuery);
    return matchesStatus && matchesSearch;
  });

  // --- DRIVE OPERATIONS ---
  const fetchDriveFiles = async () => {
    if (!token || token === 'admin_active_session') return;
    setLoadingDrive(true);
    try {
      const files = await listDriveFiles(token, driveSearch);
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Error fetching drive files:', err?.message || err);
      if (err?.message?.includes('401') || err?.message?.includes('UNAUTHENTICATED')) {
        setToken(null);
      }
      showNotification('Sign in with Google Workspace to sync Google Drive files.');
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;
    const file = files[0];

    setUploadingFile(true);
    try {
      let uploaded: DriveFile;
      if (file.type.startsWith('image/')) {
        uploaded = await uploadImageFileToDrive(token, file, `[Bakery] ${file.name}`);
      } else {
        const text = await file.text();
        uploaded = await uploadTextFileToDrive(token, file.name, text, file.type || 'text/plain');
      }
      showNotification(lang === 'en' ? `Uploaded "${uploaded.name}" to Google Drive!` : `ড্রাইভে "${uploaded.name}" আপলোড হয়েছে!`);
      fetchDriveFiles();
    } catch (err: any) {
      showNotification(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportOrdersToDrive = async () => {
    if (!token) return;
    setUploadingFile(true);
    try {
      const filename = `Bakery_Orders_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const jsonContent = JSON.stringify(orders, null, 2);
      await uploadTextFileToDrive(token, filename, jsonContent, 'application/json');
      showNotification(lang === 'en' ? `Exported ${orders.length} orders to Google Drive!` : `ড্রাইভে ${orders.length}টি অর্ডার ব্যাকআপ হয়েছে!`);
      fetchDriveFiles();
    } catch (err: any) {
      showNotification(`Export failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleExportGalleryToDrive = async () => {
    if (!token) return;
    setUploadingFile(true);
    try {
      const filename = `Bakery_Gallery_Config_${new Date().toISOString().slice(0, 10)}.json`;
      const jsonContent = JSON.stringify(galleryData, null, 2);
      await uploadTextFileToDrive(token, filename, jsonContent, 'application/json');
      showNotification(lang === 'en' ? 'Exported Gallery Config to Google Drive!' : 'গ্যালারি ডেটা ড্রাইভে সেভ করা হয়েছে!');
      fetchDriveFiles();
    } catch (err: any) {
      showNotification(`Export failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const promptDeleteDriveFile = (file: DriveFile) => {
    setConfirmModal({
      isOpen: true,
      title: lang === 'en' ? 'Delete Google Drive File?' : 'গুগল ড্রাইভের ফাইল মুছবেন?',
      description: `Are you sure you want to permanently delete "${file.name}" from your Google Drive? This action cannot be undone.`,
      actionType: 'delete_file',
      targetId: file.id,
    });
  };

  // --- SHEETS OPERATIONS ---
  const fetchSheetData = async (targetTab?: string, customSpreadsheetInput?: string) => {
    if (!token || token === 'admin_active_session') return;
    setLoadingSheet(true);
    setSheetRows([]); // Clear previous rows so stale data is never shown
    try {
      const { spreadsheetId: activeId, gid } = parseSpreadsheetInput(customSpreadsheetInput || spreadsheetId);
      if (!activeId) {
        showNotification(lang === 'en' ? 'Please enter a valid Google Spreadsheet ID.' : 'সঠিক গুগল শিট আইডি প্রদান করুন');
        setLoadingSheet(false);
        return;
      }

      // If user pasted a URL or clean ID, normalize input state if needed
      if (customSpreadsheetInput && customSpreadsheetInput.includes('/d/')) {
        setSpreadsheetId(activeId);
      }

      const details = await getSpreadsheetDetails(token, activeId);
      setSheetDetails(details);

      let targetTitle = targetTab || selectedSheetTitle;

      // If a numeric GID was provided in URL or input, find matching sheet title
      if (gid !== undefined && details.sheets && details.sheets.length > 0) {
        const gidMatched = details.sheets.find(s => s.sheetId === gid);
        if (gidMatched) {
          targetTitle = gidMatched.title;
        }
      }

      // Verify targetTitle in sheets list
      if (details.sheets && details.sheets.length > 0) {
        const found = details.sheets.find(s => s.title.toLowerCase() === targetTitle.toLowerCase());
        if (found) {
          targetTitle = found.title; // exact title casing from Google Sheet
        } else if (gid === undefined && !targetTab) {
          targetTitle = details.sheets[0].title;
        }
      }

      setSelectedSheetTitle(targetTitle);

      const safeRange = `'${targetTitle.replace(/'/g, "''")}'!A1:M100`;
      const rowsData = await getSheetValues(token, activeId, safeRange);
      setSheetRows(rowsData.values || []);
    } catch (err: any) {
      console.warn('Error fetching sheet:', err?.message || err);
      if (err?.message?.includes('401') || err?.message?.includes('UNAUTHENTICATED')) {
        setToken(null);
      }
      showNotification(lang === 'en' ? 'Failed to load Google Sheet data. Check Spreadsheet ID and permissions.' : 'গুগল শিট ডাটা লোড করতে ব্যর্থ। ID ও পারমিশন চেক করুন।');
      setSheetRows([]);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleSelectSubsheet = async (sheetTitle: string) => {
    setSelectedSheetTitle(sheetTitle);
    if (!token || token === 'admin_active_session') return;
    setLoadingSheet(true);
    setSheetRows([]); // Clear previous rows so stale data is never shown
    try {
      const activeId = cleanSpreadsheetId(spreadsheetId);
      const safeRange = `'${sheetTitle.replace(/'/g, "''")}'!A1:M100`;
      const rowsData = await getSheetValues(token, activeId, safeRange);
      setSheetRows(rowsData.values || []);
    } catch (err: any) {
      console.warn(`Error loading subsheet '${sheetTitle}':`, err);
      showNotification(lang === 'en' ? `Failed to load '${sheetTitle}': ${err.message || err}` : `'${sheetTitle}' সাবশিট লোড করা যায়নি`);
      setSheetRows([]);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleAddSubsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSubsheetTitle.trim()) return;
    const activeId = cleanSpreadsheetId(spreadsheetId);
    setLoadingSheet(true);
    try {
      const titleToCreate = newSubsheetTitle.trim();
      await addSheetTabToSpreadsheet(token, activeId, titleToCreate);
      showNotification(lang === 'en' ? `Subsheet '${titleToCreate}' created successfully!` : `'${titleToCreate}' সাবশিট সফলভাবে তৈরি হয়েছে!`);
      setNewSubsheetTitle('');
      setShowAddSubsheet(false);
      await fetchSheetData(titleToCreate, activeId);
    } catch (err: any) {
      showNotification(`Failed to add subsheet: ${err.message}`);
      setLoadingSheet(false);
    }
  };

  const handleCreateNewOrdersSheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    try {
      const newSheet = await createBakeryOrdersSheet(token, `Bake n' Flake - Orders & Inventory (${new Date().toLocaleDateString()})`);
      setSpreadsheetId(newSheet.spreadsheetId);
      setSheetDetails(newSheet);
      setSelectedSheetTitle('Orders');
      showNotification(lang === 'en' ? 'Created new Bakery Orders Sheet in your Drive!' : 'নতুন গুগ্‌ল শিট তৈরি হয়েছে!');
    } catch (err: any) {
      showNotification(`Creation failed: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const promptSyncAppOrdersToSheet = () => {
    if (orders.length === 0) {
      showNotification(lang === 'en' ? 'No local app orders available to sync.' : 'কোনো নতুন অর্ডার পাওয়া যায়নি');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: lang === 'en' ? 'Sync App Orders to Google Sheet?' : 'অ্যাপের অর্ডারগুলি গুগল শিটে যুক্ত করবেন?',
      description: `This will append ${orders.length} active order(s) from the app into row entries in '${selectedSheetTitle}' in Google Sheets.`,
      actionType: 'sync_orders',
    });
  };

  const promptUpdateRowStatus = (rowIndex: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Delivered' : 'Pending';
    setConfirmModal({
      isOpen: true,
      title: lang === 'en' ? 'Update Order Status in Google Sheet?' : 'স্ট্যাটাস আপডেট করবেন?',
      description: `Are you sure you want to update Row ${rowIndex + 1} status to "${nextStatus}" in Google Sheets?`,
      actionType: 'update_sheet_row',
      payload: { rowIndex, nextStatus },
    });
  };

  // --- GMAIL OPERATIONS ---
  const promptSendTestEmail = () => {
    if (!testEmailTo || !testEmailTo.includes('@')) {
      showNotification('Please enter a valid recipient email address.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Send Gmail Email via Google Workspace?',
      description: `Confirm sending email "${testEmailSubject}" to ${testEmailTo} directly using your authorized Gmail account?`,
      actionType: 'send_test_email',
    });
  };

  const handleSendOrderConfirmationGmail = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !token) return;
    setIsSendingEmail(true);
    try {
      await sendOrderConfirmationEmail(token, targetOrder);
      showNotification(`Confirmation email sent to ${targetOrder.customerEmail} via Gmail API!`);
    } catch (err: any) {
      showNotification(`Gmail error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendStatusUpdateGmail = async (orderId: string, status: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !token) return;
    setIsSendingEmail(true);
    try {
      await sendStatusUpdateEmail(token, targetOrder, status);
      showNotification(`Status update email (${status}) sent to ${targetOrder.customerEmail}!`);
    } catch (err: any) {
      showNotification(`Gmail error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // --- GOOGLE TASKS OPERATIONS ---
  const fetchTasksData = async () => {
    if (!token || token === 'admin_active_session') return;
    setLoadingTasks(true);
    try {
      const items = await listGoogleTasks(token);
      setTasksList(items);
    } catch (err: any) {
      console.warn('Error fetching tasks:', err?.message || err);
      if (err?.message?.includes('401') || err?.message?.includes('UNAUTHENTICATED')) {
        setToken(null);
      }
      showNotification('Sign in with Google Workspace to sync Google Tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !token) return;
    try {
      await createGoogleTask(token, newTaskTitle, "Added from Bake n' Flake App", newTaskDueDate);
      showNotification('Task created in Google Tasks!');
      setNewTaskTitle('');
      setNewTaskDueDate('');
      fetchTasksData();
    } catch (err: any) {
      showNotification(`Failed to create task: ${err.message}`);
    }
  };

  const promptSyncOrderDeadlineTask = (order: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Sync Order Deadline to Google Tasks?',
      description: `Create a task in Google Tasks for Order #${order.id} (${order.customerName}) due on ${order.deliveryDate || 'Scheduled Date'}?`,
      actionType: 'sync_order_task',
      payload: order,
    });
  };

  // --- GOOGLE CALENDAR OPERATIONS ---
  const fetchCalendarData = async () => {
    if (!token || token === 'admin_active_session') return;
    setLoadingCalendar(true);
    try {
      const events = await listCalendarEvents(token);
      setCalendarEvents(events);
    } catch (err: any) {
      console.warn('Error fetching calendar events:', err?.message || err);
      if (err?.message?.includes('401') || err?.message?.includes('UNAUTHENTICATED')) {
        setToken(null);
      }
      showNotification('Sign in with Google Workspace to sync Google Calendar events.');
    } finally {
      setLoadingCalendar(false);
    }
  };

  const promptAddHolidayToCalendar = (holiday: { name: string; date: string; desc: string }) => {
    setConfirmModal({
      isOpen: true,
      title: `Add ${holiday.name} to Google Calendar?`,
      description: `This will schedule "${holiday.name}" on ${holiday.date} in your Google Calendar with reminders for bakery special pre-orders.`,
      actionType: 'add_calendar_event',
      payload: {
        summary: `🎂 ${holiday.name} - Bake n' Flake Special`,
        description: holiday.desc,
        startIsoDate: holiday.date,
      },
    });
  };

  const handleAddCustomCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCalTitle.trim() || !customCalDate || !token) return;
    try {
      await createCalendarEvent(token, {
        summary: customCalTitle,
        description: customCalDesc || "Added from Bake n' Flake Bakery App",
        startIsoDate: customCalDate,
      });
      showNotification('Event added to Google Calendar!');
      setCustomCalTitle('');
      setCustomCalDate('');
      setCustomCalDesc('');
      fetchCalendarData();
    } catch (err: any) {
      showNotification(`Calendar error: ${err.message}`);
    }
  };

  // --- CONFIRMATION MODAL EXECUTION ---
  const handleExecuteConfirmedAction = async () => {
    if (!token) return;
    const { actionType, targetId, payload } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      if (actionType === 'delete_file' && targetId) {
        await deleteDriveFile(token, targetId);
        showNotification(lang === 'en' ? 'File deleted successfully from Google Drive.' : 'ফাইলটি গুগল ড্রাইভ থেকে মোছা হয়েছে');
        fetchDriveFiles();
      } else if (actionType === 'sync_orders') {
        const activeId = cleanSpreadsheetId(spreadsheetId);
        const safeSheetName = selectedSheetTitle.replace(/'/g, "''");

        // 1. Fetch current rows of selected subsheet to detect existing Order IDs
        let currentRows: (string | number)[][] = [];
        try {
          const fetched = await getSheetValues(token, activeId, `'${safeSheetName}'!A1:M300`);
          currentRows = fetched.values || [];
        } catch (err) {
          console.warn('Notice fetching current rows before sync:', err);
          currentRows = sheetRows;
        }

        // Map existing Order IDs to their row indices (1-indexed for Google Sheets)
        const existingOrderRowMap = new Map<string, number>();
        currentRows.forEach((row, idx) => {
          const rowNum = idx + 1;
          // Column B (index 1) is Order ID
          if (row[1] !== undefined && row[1] !== null) {
            const idVal = String(row[1]).trim().toLowerCase();
            if (idVal.length > 0) {
              existingOrderRowMap.set(idVal, rowNum);
            }
          }
          // Also scan cells specifically for Order ID patterns (#bnf-... or order-...)
          row.forEach(cell => {
            if (cell && typeof cell === 'string') {
              const trimmed = cell.trim().toLowerCase();
              if (trimmed.startsWith('#bnf-') || trimmed.startsWith('order-')) {
                existingOrderRowMap.set(trimmed, rowNum);
              }
            }
          });
        });

        const newOrdersToAppend: typeof orders = [];
        let updatedCount = 0;

        for (const o of orders) {
          const normId = o.id.trim().toLowerCase();
          const existingRowIdx = existingOrderRowMap.get(normId);

          const rowValues = [
            new Date(o.timestamp).toLocaleString('en-IN'),
            o.id,
            o.customerName || 'Customer',
            o.customerPhone || '',
            o.customerEmail || '',
            o.items.map(i => `${i.productNameEn} (x${i.quantity})`).join(', '),
            o.subtotal || o.total,
            o.total,
            o.deliveryDate || '',
            o.deliveryAddress || '',
            o.status,
            o.paymentMethod || 'Cash on Delivery',
            o.notes || ''
          ];

          if (existingRowIdx) {
            // Update existing row if order is already present
            try {
              const cellRange = `'${safeSheetName}'!A${existingRowIdx}:M${existingRowIdx}`;
              await updateSheetRange(token, activeId, cellRange, [rowValues]);
              updatedCount++;
            } catch (uErr) {
              console.warn(`Failed to update existing row ${existingRowIdx}:`, uErr);
            }
          } else {
            // New order to append
            newOrdersToAppend.push(o);
          }
        }

        // Append new orders if any
        if (newOrdersToAppend.length > 0) {
          const rowsToAppend = newOrdersToAppend.map(o => [
            new Date(o.timestamp).toLocaleString('en-IN'),
            o.id,
            o.customerName || 'Customer',
            o.customerPhone || '',
            o.customerEmail || '',
            o.items.map(i => `${i.productNameEn} (x${i.quantity})`).join(', '),
            o.subtotal || o.total,
            o.total,
            o.deliveryDate || '',
            o.deliveryAddress || '',
            o.status,
            o.paymentMethod || 'Cash on Delivery',
            o.notes || ''
          ]);
          await appendSheetRows(token, activeId, `'${safeSheetName}'!A:M`, rowsToAppend);
        }

        // Show friendly status message
        if (newOrdersToAppend.length > 0 && updatedCount > 0) {
          showNotification(
            lang === 'en'
              ? `Synced ${newOrdersToAppend.length} new order(s) and updated ${updatedCount} existing record(s) in '${selectedSheetTitle}'!`
              : `'${selectedSheetTitle}' সাবশিটে ${newOrdersToAppend.length}টি নতুন অর্ডার যোগ ও ${updatedCount}টি রিকর্ড আপডেট হয়েছে (কোনো ডুপ্লিকেট হয়নি)!`
          );
        } else if (newOrdersToAppend.length > 0) {
          showNotification(
            lang === 'en'
              ? `Synced ${newOrdersToAppend.length} new order(s) to '${selectedSheetTitle}' (Duplicates skipped)!`
              : `'${selectedSheetTitle}' সাবশিটে ${newOrdersToAppend.length}টি নতুন অর্ডার যোগ করা হয়েছে!`
          );
        } else if (updatedCount > 0) {
          showNotification(
            lang === 'en'
              ? `Updated ${updatedCount} existing order record(s) in '${selectedSheetTitle}'. No duplicate rows added.`
              : `'${selectedSheetTitle}' সাবশিটে ${updatedCount}টি অর্ডার রেকর্ড আপ-টু-ডেট করা হয়েছে। ডুপ্লিকেট তৈরি হয়নি।`
          );
        } else {
          showNotification(
            lang === 'en'
              ? `All ${orders.length} order(s) are already synced in '${selectedSheetTitle}'. No duplicates created.`
              : `সকল ${orders.length}টি অর্ডার ইতিমধ্যে '${selectedSheetTitle}' সাবশিটে সঠিক রয়েছে। ডুপ্লিকেট তৈরি হয়নি।`
          );
        }

        fetchSheetData(selectedSheetTitle, activeId);
      } else if (actionType === 'update_sheet_row' && payload) {
        const activeId = cleanSpreadsheetId(spreadsheetId);
        const { rowIndex, nextStatus } = payload;
        const cellRange = `'${selectedSheetTitle}'!K${rowIndex + 1}`;
        await updateSheetRange(token, activeId, cellRange, [[nextStatus]]);
        showNotification(lang === 'en' ? `Updated status to "${nextStatus}" in Google Sheet!` : 'স্ট্যাটাস পরিবর্তন হয়েছে!');
        fetchSheetData(selectedSheetTitle, activeId);
      } else if (actionType === 'send_test_email') {
        setIsSendingEmail(true);
        await sendGmailMessage(token, testEmailTo, testEmailSubject, testEmailBody);
        showNotification(`Email sent successfully to ${testEmailTo} via Gmail!`);
        setIsSendingEmail(false);
      } else if (actionType === 'sync_order_task' && payload) {
        const order = payload;
        await createGoogleTask(
          token,
          `🎂 Order #${order.id.slice(-6).toUpperCase()} Deadline - ${order.customerName}`,
          `Customer Phone: ${order.customerPhone || 'N/A'}\nItems: ${order.items.map((i: any) => i.productNameEn).join(', ')}\nAddress: ${order.deliveryAddress || 'Pickup'}`,
          order.deliveryDate
        );
        showNotification(`Created task for Order #${order.id} in Google Tasks!`);
        fetchTasksData();
      } else if (actionType === 'add_calendar_event' && payload) {
        await createCalendarEvent(token, payload);
        showNotification(`Added "${payload.summary}" to Google Calendar!`);
        fetchCalendarData();
      }
    } catch (err: any) {
      showNotification(`Operation failed: ${err.message}`);
    }
  };

  // if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-5xl bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Top Bar Header */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/20">
                <HardDrive size={22} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-800 dark:text-white flex items-center gap-2">
                  Google Workspace Hub
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    5 Services Enabled
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'en' 
                    ? 'Drive, Sheets, Gmail, Tasks & Calendar Workspace Integrations' 
                    : 'গুগল ড্রাইভ, শিট, জিমেইল, টাস্কস ও ক্যালেন্ডার হাব'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md shrink-0">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                {notification}
              </span>
              <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Google Auth Status Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {googleUser && token ? (
                <div className="flex items-center gap-3">
                  {googleUser.photoURL ? (
                    <img 
                      src={googleUser.photoURL} 
                      alt={googleUser.displayName || 'Google User'} 
                      className="w-11 h-11 rounded-full border-2 border-emerald-400 shadow-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                      {googleUser.displayName?.[0] || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {googleUser.displayName || 'Connected User'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck size={12} /> Connected
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      {googleUser.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-white block">
                    {lang === 'en' ? 'Connect Your Google Account' : 'আপনার গুগল অ্যাকাউন্ট লিংক করুন'}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'en' 
                      ? 'Sign in to access Drive, Sheets, Gmail, Tasks, and Calendar features.' 
                      : 'ড্রাইভ, শিট, জিমেইল, টাস্কস ও ক্যালেন্ডার অনুমোদনের জন্য সাইন ইন করুন'}
                  </p>
                </div>
              )}

              {googleUser && token ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition-colors text-xs font-bold flex items-center gap-2 border border-slate-300 dark:border-slate-700 shrink-0"
                >
                  <LogOut size={14} />
                  {lang === 'en' ? 'Disconnect' : 'ডিসকানেক্ট'}
                </button>
              ) : (
                /* Google Styled Button */
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dadce0',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1f1f1f'
                  }}
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px', display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
                {authError}
              </div>
            )}

            {/* Navigation Tabs Bar */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 no-scrollbar">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShoppingBag size={16} />
                Manage Orders
              </button>

              <button
                onClick={() => setActiveTab('drive')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'drive'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HardDrive size={16} />
                Drive
              </button>

              <button
                onClick={() => setActiveTab('sheets')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'sheets'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sheet size={16} />
                Sheets
              </button>

              <button
                onClick={() => setActiveTab('gmail')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'gmail'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Mail size={16} />
                Gmail
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckSquare size={16} />
                Google Tasks
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CalendarIcon size={16} />
                Calendar
              </button>
            </div>

            {/* TAB: ORDERS (Integrated Admin Portal) */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Email Notification Notice */}
                {emailNotice && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl text-center shadow-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{emailNotice}</span>
                  </div>
                )}

                {/* Controls Bar */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder={lang === 'en' ? 'Search Order ID / Customer Name / Phone...' : 'অর্ডার আইডি / নাম / মোবাইল খুজুন...'}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
                    <button
                      type="button"
                      onClick={() => setFilterStatus('All')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        filterStatus === 'All' 
                          ? 'bg-pink-500 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      All ({orders.length})
                    </button>
                    {ALL_STATUSES.map((st) => {
                      const count = orders.filter((o) => o.status === st).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFilterStatus(st)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            filterStatus === st 
                              ? 'bg-pink-500 text-white shadow-md' 
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {st} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      {lang === 'en' ? 'No orders match your filter.' : 'কোন অর্ডার মেলেনি।'}
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const isDeliveredLocked = order.status === 'Delivered';
                      const waStatusLink = generateWhatsAppStatusUpdateLink(order, order.status);

                      return (
                        <div 
                          key={order.id}
                          className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-4 ${
                            isDeliveredLocked 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {/* Top Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-pink-600 dark:text-pink-400">
                                  {order.id}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  • {new Date(order.timestamp).toLocaleString()}
                                </span>
                                {isDeliveredLocked && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                                    <ShieldCheck size={10} /> {lang === 'en' ? 'Delivered & Locked' : 'ডেলিভার্ড ও লকড'}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-bold text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                {order.customerName}
                                <a 
                                  href={`tel:${order.customerPhone}`} 
                                  className="text-xs text-slate-500 hover:text-pink-500 font-normal flex items-center gap-1"
                                >
                                  <Phone size={12} /> {order.customerPhone}
                                </a>
                              </div>
                            </div>

                            {/* Status Select & Dynamic WhatsApp Message */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Edit Button for Pending Orders */}
                              {order.status === 'Pending' && editingOrderId !== order.id && (
                                <button
                                  type="button"
                                  onClick={() => startEditing(order)}
                                  className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                                  title="Edit Items & Final Price"
                                >
                                  <RefreshCw size={14} />
                                  {lang === 'en' ? 'Edit Details' : 'ডাটা এডিট করুন'}
                                </button>
                              )}

                              {/* Status Select (Disabled if Delivered) */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-slate-400 pl-2">Status:</span>
                                <select
                                  value={order.status}
                                  disabled={isDeliveredLocked}
                                  onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                                  className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                                    isDeliveredLocked 
                                      ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed' 
                                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-600'
                                  }`}
                                >
                                  {ALL_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>

                              {/* WhatsApp Link Button */}
                              <a
                                href={waStatusLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                              >
                                <MessageSquare size={14} />
                                {lang === 'en' ? `WhatsApp (${order.status})` : `হোয়াটসঅ্যাপ মেসেজ (${order.status})`}
                              </a>
                            </div>
                          </div>

                          {/* Order Details OR Edit Form */}
                          {editingOrderId === order.id && order.status === 'Pending' ? (
                            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border-2 border-amber-400/60 space-y-3 text-xs">
                              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800/60 pb-2">
                                <span className="flex items-center gap-1.5">
                                  <RefreshCw size={15} />
                                  {lang === 'en' ? 'Edit Pending Order Items & Price' : 'পেন্ডিং অর্ডারের দাম ও আইটেম এডিট করুন'}
                                </span>
                              </div>

                              {/* Items Edit List */}
                              <div className="space-y-2">
                                {editItems.map((item, idx) => (
                                  <div key={item.id || idx} className="grid grid-cols-12 gap-1.5 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-slate-700">
                                    <input
                                      type="text"
                                      value={item.productNameEn}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, productNameEn: val, productNameBn: val } : it));
                                      }}
                                      className="col-span-4 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                                    />
                                    <input
                                      type="text"
                                      value={item.weight}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, weight: val } : it));
                                      }}
                                      className="col-span-3 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        updateItemsAndTotal(editItems.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                      }}
                                      className="col-span-2 px-1 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-center font-bold"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.price}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        updateItemsAndTotal(editItems.map((it, i) => i === idx ? { ...it, price: val } : it));
                                      }}
                                      className="col-span-2 px-1 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-center font-bold text-pink-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateItemsAndTotal(editItems.filter((_, i) => i !== idx))}
                                      className="col-span-1 p-1 hover:bg-rose-100 text-rose-500 rounded-lg"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => updateItemsAndTotal([
                                    ...editItems,
                                    { id: 'it_' + Date.now(), productNameEn: 'Custom Item', productNameBn: 'কাস্টম আইটেম', weight: '1 Pound', quantity: 1, price: 450, img: '' }
                                  ])}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Plus size={12} />
                                  Add Item
                                </button>
                              </div>

                              {/* Final Total Price */}
                              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="font-bold text-slate-800 dark:text-white">
                                    Total (₹):
                                  </label>
                                  <input
                                    type="number"
                                    value={editTotal}
                                    onChange={(e) => setEditTotal(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border-2 border-pink-500 rounded-xl text-sm font-black text-pink-600 focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrderId(null)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(order)}
                                    className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Standard Order Details */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                  <MapPin size={12} /> Address & Date:
                                </div>
                                <p className="text-slate-700 dark:text-slate-200 font-medium">
                                  {order.deliveryAddress}
                                </p>
                                <p className="text-pink-600 dark:text-pink-400 font-bold mt-1">
                                  Date: {order.deliveryDate} ({order.paymentMethod})
                                </p>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                                <div className="text-slate-400 font-semibold mb-1">Items:</div>
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300 font-medium py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <OptimizedImage
                                        src={it.img || 'https://i.ibb.co/Xx2kxrrg/LOGO-1.png'}
                                        alt={it.productNameEn || 'Cake Item'}
                                        width={80}
                                        quality={70}
                                        containerClassName="w-8 h-8 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700"
                                        className="w-full h-full object-cover"
                                      />
                                      <span className="truncate">• {it.productNameEn} ({it.weight}) x{it.quantity}</span>
                                    </div>
                                    <span className="font-bold text-pink-600 dark:text-pink-400 shrink-0">₹{(it.price || 450) * it.quantity}</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white mt-1">
                                  <span>Total:</span>
                                  <span className="text-pink-600 dark:text-pink-400">₹{order.total}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search Drive files..."
                      value={driveSearch}
                      onChange={(e) => setDriveSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles()}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!token || uploadingFile}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <Upload size={14} />
                      {uploadingFile ? 'Uploading...' : 'Upload File'}
                    </button>

                    <button
                      onClick={handleExportOrdersToDrive}
                      disabled={!token || uploadingFile}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    >
                      <Download size={14} className="text-amber-500" />
                      Backup Orders
                    </button>

                    <button
                      onClick={fetchDriveFiles}
                      disabled={!token || loadingDrive}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <RefreshCw size={14} className={loadingDrive ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {!token ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <HardDrive size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 block">Sign in with Google to view Drive files</span>
                  </div>
                ) : loadingDrive ? (
                  <div className="text-center py-12">
                    <RefreshCw size={24} className="animate-spin mx-auto text-emerald-500 mb-2" />
                    <span className="text-xs text-slate-500">Fetching Drive files...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {driveFiles.map((file) => (
                      <div key={file.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={18} className="text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <button onClick={() => promptDeleteDriveFile(file)} className="p-1 text-slate-400 hover:text-rose-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Drive File'}</span>
                          {file.webViewLink && (
                            <a href={file.webViewLink} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold flex items-center gap-1">
                              Open Drive <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SHEETS */}
            {activeTab === 'sheets' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[280px] space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
                          Target Google Spreadsheet ID or URL
                        </label>
                        {sheetDetails?.spreadsheetUrl && (
                          <a
                            href={sheetDetails.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Open in Google Sheets
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Spreadsheet ID or full Google Sheet URL..."
                          value={spreadsheetId}
                          onChange={(e) => setSpreadsheetId(e.target.value)}
                          onBlur={() => {
                            const parsed = parseSpreadsheetInput(spreadsheetId);
                            if (parsed.spreadsheetId && parsed.spreadsheetId !== spreadsheetId && !/^[0-9]+$/.test(spreadsheetId.trim())) {
                              setSpreadsheetId(parsed.spreadsheetId);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <button
                          onClick={() => fetchSheetData(undefined, spreadsheetId)}
                          disabled={!token || loadingSheet}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                        >
                          <RefreshCw size={14} className={loadingSheet ? 'animate-spin' : ''} />
                          Load Sheet
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                      <button
                        onClick={handleCreateNewOrdersSheet}
                        disabled={!token || isCreatingSheet}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        <FolderPlus size={14} />
                        {isCreatingSheet ? 'Creating...' : 'New Orders Sheet'}
                      </button>
                      <button
                        onClick={promptSyncAppOrdersToSheet}
                        disabled={!token || orders.length === 0}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        <Plus size={14} />
                        Sync ({orders.length}) Orders to '{selectedSheetTitle}'
                      </button>
                    </div>
                  </div>

                  {/* Subsheets (Tabs) Selection Bar */}
                  {sheetDetails && sheetDetails.sheets && sheetDetails.sheets.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sheet size={14} className="text-emerald-500" />
                          Subsheet Tabs ({sheetDetails.sheets.length}):
                        </span>
                        <button
                          onClick={() => setShowAddSubsheet(!showAddSubsheet)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Subsheet Tab
                        </button>
                      </div>

                      {showAddSubsheet && (
                        <form onSubmit={handleAddSubsheet} className="flex gap-2 py-1">
                          <input
                            type="text"
                            placeholder="Subsheet title (e.g. Orders, Analytics, Sales)..."
                            value={newSubsheetTitle}
                            onChange={(e) => setNewSubsheetTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                          />
                          <button
                            type="submit"
                            disabled={!newSubsheetTitle.trim() || loadingSheet}
                            className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddSubsheet(false)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                          >
                            Cancel
                          </button>
                        </form>
                      )}

                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {sheetDetails.sheets.map((s) => {
                          const isActive = selectedSheetTitle.toLowerCase() === s.title.toLowerCase();
                          return (
                            <button
                              key={s.sheetId}
                              onClick={() => handleSelectSubsheet(s.title)}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 border ${
                                isActive
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                              }`}
                            >
                              <Sheet size={13} className={isActive ? 'text-white' : 'text-slate-400'} />
                              <span>{s.title}</span>
                              {isActive && <CheckCircle2 size={12} className="text-white ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!token ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Sheet size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 block">Sign in with Google to view Sheets</span>
                  </div>
                ) : loadingSheet ? (
                  <div className="text-center py-12">
                    <RefreshCw size={24} className="animate-spin mx-auto text-emerald-500 mb-2" />
                    <span className="text-xs text-slate-500">Loading '{selectedSheetTitle}' Google Sheet data...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="p-3 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Sheet size={14} className="text-emerald-500" />
                        Viewing Subsheet: <span className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedSheetTitle}</span> ({sheetRows.length > 0 ? sheetRows.length - 1 : 0} rows)
                      </span>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold uppercase">
                          <th className="p-3 border-r border-slate-200 dark:border-slate-800">Row #</th>
                          {sheetRows[0]?.map((header, colIdx) => (
                            <th key={colIdx} className="p-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{header}</th>
                          ))}
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {sheetRows.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400 font-bold">{rowIdx + 2}</td>
                            {row.map((cell, colIdx) => (
                              <td key={colIdx} className="p-3 border-r border-slate-200 dark:border-slate-800 max-w-[180px] truncate">{String(cell)}</td>
                            ))}
                            <td className="p-3">
                              <button onClick={() => promptUpdateRowStatus(rowIdx + 1, String(row[10] || 'Pending'))} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all">
                                Toggle Status
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GMAIL */}
            {activeTab === 'gmail' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-slate-900 dark:to-slate-900/80 border border-red-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <Mail size={18} />
                    Gmail Email Sender & Order Notifications
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                        placeholder="customer@gmail.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Email Subject</label>
                      <input
                        type="text"
                        value={testEmailSubject}
                        onChange={(e) => setTestEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">HTML Message Content</label>
                    <textarea
                      rows={3}
                      value={testEmailBody}
                      onChange={(e) => setTestEmailBody(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={promptSendTestEmail}
                      disabled={!token || isSendingEmail}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50"
                    >
                      <Send size={14} />
                      {isSendingEmail ? 'Sending Gmail...' : 'Send Email via Gmail API'}
                    </button>
                  </div>
                </div>

                {/* Direct Order Quick Dispatch Panel */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Orders - Quick Gmail Dispatch ({orders.length})
                  </h4>
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No active customer orders in app memory.</p>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((o) => (
                        <div key={o.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">#{o.id} - {o.customerName}</span>
                            <p className="text-[11px] text-slate-500">{o.customerEmail} • Total: ₹{o.total} • Status: {o.status}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendOrderConfirmationGmail(o.id)}
                              disabled={!token || isSendingEmail}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"
                            >
                              Send Receipt Email
                            </button>
                            <button
                              onClick={() => handleSendStatusUpdateGmail(o.id, 'Ready for Pickup')}
                              disabled={!token || isSendingEmail}
                              className="px-2.5 py-1.5 bg-amber-500 text-slate-900 text-[11px] font-bold rounded-lg shadow-sm"
                            >
                              Send Pickup Alert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TASKS */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/80 border border-blue-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    <CheckSquare size={18} />
                    Create Custom Task in Google Tasks
                  </div>

                  <form onSubmit={handleCreateCustomTask} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Task Title (e.g. Prepare Wedding Cake Frosting)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      required
                      className="sm:col-span-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <div className="sm:col-span-3 flex justify-end">
                      <button type="submit" disabled={!token} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md">
                        + Add to Google Tasks
                      </button>
                    </div>
                  </form>
                </div>

                {/* Orders Sync to Tasks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sync Order Deadlines to Google Tasks
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {orders.map((o) => (
                      <div key={o.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">Order #{o.id}</span>
                          <p className="text-[11px] text-slate-500">Due: {o.deliveryDate || 'Scheduled'}</p>
                        </div>
                        <button
                          onClick={() => promptSyncOrderDeadlineTask(o)}
                          disabled={!token}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-xl"
                        >
                          Sync Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fetched Task List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Google Tasks List ({tasksList.length})</h4>
                    <button onClick={fetchTasksData} disabled={!token || loadingTasks} className="p-1 text-slate-400 hover:text-slate-600">
                      <RefreshCw size={14} className={loadingTasks ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {tasksList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks found in primary task list.</p>
                  ) : (
                    <div className="space-y-2">
                      {tasksList.map((t) => (
                        <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{t.title}</span>
                            {t.due && <p className="text-[10px] text-slate-500">Due: {new Date(t.due).toLocaleDateString()}</p>}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Google Task</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                {/* Upcoming Festive Occasions Quick Add */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900/80 border border-amber-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <Sparkles size={18} />
                    Upcoming National Festivals & Bakery Pre-order Reminders
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {UPCOMING_HOLIDAYS.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{h.name}</span>
                          <p className="text-[10px] text-amber-600 font-bold">{h.date}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{h.desc}</p>
                        </div>
                        <button
                          onClick={() => promptAddHolidayToCalendar(h)}
                          disabled={!token}
                          className="px-2.5 py-1.5 bg-amber-500 text-slate-900 text-[11px] font-bold rounded-xl shrink-0"
                        >
                          + Calendar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Event Creator */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Add Custom Celebration to Google Calendar</h4>
                  <form onSubmit={handleAddCustomCalendarEvent} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Event Title (e.g. Mom's 50th Birthday)"
                      value={customCalTitle}
                      onChange={(e) => setCustomCalTitle(e.target.value)}
                      required
                      className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <input
                      type="date"
                      value={customCalDate}
                      onChange={(e) => setCustomCalDate(e.target.value)}
                      required
                      className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button type="submit" disabled={!token} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md">
                      Add Event to Calendar
                    </button>
                  </form>
                </div>

                {/* Primary Calendar Events List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Primary Google Calendar Events ({calendarEvents.length})</h4>
                    <button onClick={fetchCalendarData} disabled={!token || loadingCalendar} className="p-1 text-slate-400 hover:text-slate-600">
                      <RefreshCw size={14} className={loadingCalendar ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {calendarEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No upcoming events retrieved.</p>
                  ) : (
                    <div className="space-y-2">
                      {calendarEvents.map((ev: any) => (
                        <div key={ev.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{ev.summary}</span>
                            <p className="text-[10px] text-slate-500">{ev.start?.dateTime || ev.start?.date}</p>
                          </div>
                          {ev.htmlLink && (
                            <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              View <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold">
              Close Hub
            </button>
          </div>
        </motion.div>

        {/* User Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle size={28} />
                <h4 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {confirmModal.description}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteConfirmedAction}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    )}
  </AnimatePresence>
);
}
