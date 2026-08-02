import { GalleryData, Product, VideoItem } from '../types';

const SPREADSHEET_ID = '1vZsYmZzxu653U4T6O-_S0i2dazAU_VJKBRYwdgAmXSw';

export const CATEGORY_SHEET_NAMES = [
  'Tub Cakes (Tranding🔥 )', 'Tub Cakes (Tranding🔥)', 'Tub Cakes',
  'Chocolate Cakes', 'Butterscotch Cakes', 'Vanilla Cakes', 'Chocolate Truffle',
  'Pineapple Cakes', 'Mango Cakes', 'Strawberry Cakes', 'Red Velvet Cakes',
  'Fresh Fruit Cake', 'Forest Range', 'Oreo Cakes', 'Alcohol base Cake',
  'Coffee Mocha', 'Rasmalai Cake', 'Orange Cake', 'KitKat Cakes',
  'Birthday Cakes', 'Anniversary Cakes', "Teacher's Day", 'Customised Chocolates',
  "Father's Day Cake", "Mother's Day Cake", 'Christmas Cake', 'Baby Shower Cake',
  'Rice Ceremomy cakes', 'Fresh Flower Cake', 'Doll Cakes', 'Half Cakes',
  'Tier Cakes', 'Number Cakes', 'Kids Cakes', 'Fondant and Semi Fondant Cakes',
  'Glitter Cake', 'Customize Theme Cake', 'Cheesecakes', 'Photo Cakes',
  'Bento Cakes', 'Mousse', 'Jar and Glass Cakes', 'Pinata Cakes',
  'Cupcakes and Muffins', 'Pizza & Patties', 'Brownies', 'Combos'
];

export function convertImageUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  if (cleaned.includes('drive.google.com') || cleaned.includes('docs.google.com/uc')) {
    const fileIdMatch = cleaned.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleaned.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }
  return cleaned;
}

export function getOptimizedImageUrl(url: string, width = 500, quality = 75): string {
  if (!url) return 'https://i.ibb.co/Xx2kxrrg/LOGO-1.png';
  let cleaned = convertImageUrl(url.trim());
  const lower = cleaned.toLowerCase();

  // Preserve GIFs, SVGs, Data URIs, and animated media so they never get broken, frozen, or converted to webp
  if (
    cleaned.startsWith('data:') ||
    lower.includes('.gif') ||
    lower.includes('ezgif') ||
    lower.includes('giphy') ||
    lower.includes('tenor') ||
    lower.includes('format=gif') ||
    lower.includes('.svg')
  ) {
    return cleaned;
  }

  // Google Drive CDN
  if (cleaned.includes('lh3.googleusercontent.com')) {
    if (!cleaned.includes('=w')) {
      return `${cleaned}=w${width}`;
    }
    return cleaned;
  }

  // Direct CDN links that are already optimized
  if (cleaned.includes('images.weserv.nl') || cleaned.includes('wsrv.nl')) {
    return cleaned;
  }

  // Fallback weserv proxy for raw external HTTP/HTTPS images
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(cleaned)}&w=${width}&q=${quality}&output=webp`;
  }

  return cleaned;
}

function getYoutubeThumbnail(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return '';
}

function formatEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.match(/\.(gif|GIF)($|\?)/)) return trimmed;
  const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&showinfo=0&controls=1`;
  }
  if (trimmed.includes('facebook.com')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&autoplay=1&mute=1`;
  }
  if (trimmed.includes('vimeo.com')) {
    const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
  }
  return trimmed;
}

async function fetchSheetRows(sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.includes('Rate exceeded') || text.startsWith('Rate exceeded') || text.toLowerCase().includes('doctype html')) {
      return [];
    }
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match || !match[1]) return [];
    try {
      const json = JSON.parse(match[1]);
      const table = json.table;
      if (!table || !table.rows) return [];

      return table.rows.map((row: any) => {
        const cells = row.c ? row.c.map((cell: any) => cell ? (cell.v !== null ? (typeof cell.v === 'object' ? cell.f || '' : String(cell.v)) : '') : '') : [];
        return cells.map((c: string) => c.trim());
      });
    } catch (e) {
      return [];
    }
  } catch (err) {
    return [];
  }
}

export async function fetchGalleryDataDirectFromSheets(): Promise<GalleryData | null> {
  try {
    const result: GalleryData = {
      items: [],
      'YouTube Video': [],
      'Facebook Video': [],
      'Story Section': [],
      'Hero Section': [],
      'Reviews': []
    };

    // 1. Fetch main structured sheets in parallel
    const [menuRows, ytRows, fbRows, storyRows, heroRows] = await Promise.all([
      fetchSheetRows('Menu Database'),
      fetchSheetRows('YouTube Video'),
      fetchSheetRows('Facebook Video'),
      fetchSheetRows('Story Section'),
      fetchSheetRows('Hero Section')
    ]);

    // Parse Menu Database
    if (menuRows && menuRows.length > 1) {
      const dataRows = menuRows.slice(1);
      dataRows.forEach((row, idx) => {
        const section = row[0] || 'Signature Menu';
        const nameEn = row[1] || '';
        const nameBn = (row[2] && !row[2].startsWith('http')) ? row[2] : nameEn;
        let img = '';
        for (let i = 3; i < row.length; i++) {
          if (row[i] && (row[i].startsWith('http') || row[i].includes('drive.google.com') || row[i].includes('ibb.co'))) {
            img = convertImageUrl(row[i]);
            break;
          }
        }
        if (nameEn) {
          result.items.push({ nameEn, nameBn, section, img });
        }
      });
    }

    // Parse YouTube Video
    if (ytRows && ytRows.length > 1) {
      const dataRows = ytRows.slice(1);
      dataRows.forEach((row, idx) => {
        const titleEn = row[0] || `Video ${idx + 1}`;
        const rawVid = row[1] || '';
        const fallbackImg = row[2] || '';
        const titleBn = (row[3] && !row[3].startsWith('http')) ? row[3] : titleEn;
        let finalImg = fallbackImg ? convertImageUrl(fallbackImg) : '';
        if (!finalImg) {
          finalImg = getYoutubeThumbnail(rawVid || fallbackImg);
        }
        if (!finalImg) {
          finalImg = 'https://i.ibb.co/XkYN11bL/PROFILE.jpg';
        }
        const isVideo = rawVid.includes('youtube.com') || rawVid.includes('youtu.be') || rawVid.includes('facebook.com') || rawVid.includes('vimeo.com') || rawVid.match(/\.mp4($|\?)/);
        if (titleEn || rawVid || fallbackImg) {
          (result['YouTube Video'] as VideoItem[]).push({
            vid: isVideo ? formatEmbedUrl(rawVid) : formatEmbedUrl(fallbackImg),
            nameEn: titleEn,
            nameBn: titleBn,
            url: isVideo ? rawVid : (fallbackImg || rawVid),
            img: finalImg
          });
        }
      });
    }

    // Parse Facebook Video
    if (fbRows && fbRows.length > 1) {
      const dataRows = fbRows.slice(1);
      dataRows.forEach((row, idx) => {
        const titleEn = row[0] || `Video ${idx + 1}`;
        const rawVid = row[1] || '';
        const fallbackImg = row[2] || '';
        const titleBn = (row[3] && !row[3].startsWith('http')) ? row[3] : titleEn;
        let finalImg = fallbackImg ? convertImageUrl(fallbackImg) : '';
        if (!finalImg) {
          finalImg = getYoutubeThumbnail(rawVid || fallbackImg);
        }
        if (!finalImg) {
          finalImg = 'https://i.ibb.co/XkYN11bL/PROFILE.jpg';
        }
        const isVideo = rawVid.includes('youtube.com') || rawVid.includes('youtu.be') || rawVid.includes('facebook.com') || rawVid.includes('vimeo.com') || rawVid.match(/\.mp4($|\?)/);
        if (titleEn || rawVid || fallbackImg) {
          (result['Facebook Video'] as VideoItem[]).push({
            vid: isVideo ? formatEmbedUrl(rawVid) : formatEmbedUrl(fallbackImg),
            nameEn: titleEn,
            nameBn: titleBn,
            url: isVideo ? rawVid : (fallbackImg || rawVid),
            img: finalImg
          });
        }
      });
    }

    // Parse Story Section
    if (storyRows && storyRows.length > 1) {
      const storyImages: string[] = [];
      storyRows.slice(1).forEach(row => {
        row.forEach(cell => {
          if (cell && (cell.startsWith('http://') || cell.startsWith('https://') || cell.includes('drive.google.com') || cell.includes('ibb.co'))) {
            const converted = convertImageUrl(cell);
            if (converted && !storyImages.includes(converted)) {
              storyImages.push(converted);
            }
          }
        });
      });
      result['Story Section'] = storyImages;
    }

    // Parse Hero Section
    if (heroRows && heroRows.length > 1) {
      const heroImages: string[] = [];
      heroRows.slice(1).forEach(row => {
        row.forEach(cell => {
          if (cell && (cell.startsWith('http://') || cell.startsWith('https://') || cell.includes('drive.google.com') || cell.includes('ibb.co'))) {
            const converted = convertImageUrl(cell);
            if (converted && !heroImages.includes(converted)) {
              heroImages.push(converted);
            }
          }
        });
      });
      result['Hero Section'] = heroImages;
    }

    // Parse Reviews Section (WEB REVIEWS or Reviews)
    const webReviewRows = await fetchSheetRows('WEB REVIEWS');
    const reviewRows = (webReviewRows && webReviewRows.length > 1) ? webReviewRows : await fetchSheetRows('Reviews');
    if (reviewRows && reviewRows.length > 1) {
      const parsedReviews = reviewRows.slice(1).map((row) => {
        // Col A (0): Timestamp, Col B (1): Name, Col C (2): Rating, Col D (3): Text En, Col E (4): Text Bn
        // Col F (5): Verified, Col G (6): Source/Email, Col H (7): Owner Reply En, Col I (8): Reply Date, Col J (9): Images
        const dateStr = row[0] || '';
        const nameEn = row[1] || row[0] || 'Anonymous';
        const nameBn = row[1] || nameEn;
        const rating = parseFloat(row[2]) || 5;
        const textEn = row[3] || '';
        const textBn = row[4] || textEn;
        const verifiedStr = row[5] || 'VERIFIED';
        const source = (row[6] || 'web').toLowerCase();
        const ownerReplyEn = row[7] || '';
        const ownerReplyBn = row[8] || ownerReplyEn;
        const imagesCell = row[9] || row[10] || '';
        
        const reviewImages = imagesCell ? imagesCell.split(',').map(s => convertImageUrl(s.trim())).filter(Boolean) : [];
        
        return {
          nameEn, nameBn, rating, textEn, textBn,
          date: new Date(dateStr || Date.now()),
          timeEn: dateStr || 'Verified Customer',
          timeBn: dateStr || 'ভেরিফাইড কাস্টমার',
          avatar: 'https://i.ibb.co/XkYN11bL/PROFILE.jpg',
          ownerReplyEn, ownerReplyBn, reviewImages,
          source: (source.includes('google') ? 'google' : source.includes('fb') || source.includes('facebook') ? 'facebook' : 'web') as 'google' | 'facebook' | 'web',
          recommends: true,
          verified: verifiedStr
        };
      }).filter(r => r.nameEn && (r.textEn || r.textBn));
      result['Reviews'] = parsedReviews;
    }

    // 2. Fetch category sub-sheets in parallel batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < CATEGORY_SHEET_NAMES.length; i += BATCH_SIZE) {
      const chunk = CATEGORY_SHEET_NAMES.slice(i, i + BATCH_SIZE);
      const categoryRowsList = await Promise.all(chunk.map(sheetName => fetchSheetRows(sheetName)));

      chunk.forEach((sheetName, index) => {
        const catRows = categoryRowsList[index];
        if (catRows && catRows.length > 0) {
          const catImages: string[] = [];
          catRows.forEach(row => {
            row.forEach(cell => {
              if (cell && (cell.startsWith('http://') || cell.startsWith('https://') || cell.includes('drive.google.com') || cell.includes('ibb.co'))) {
                const converted = convertImageUrl(cell);
                if (converted && !catImages.includes(converted)) {
                  catImages.push(converted);
                }
              }
            });
          });
          if (catImages.length > 0) {
            result[sheetName] = catImages;
            
            // Auto-restore missing menu items if they exist as category tabs but were removed from Menu Database
            if (result.items && !result.items.find(it => it.nameEn.toLowerCase() === sheetName.toLowerCase())) {
              let section = 'Signature Menu';
              if (sheetName.toLowerCase().includes('gift') || sheetName.toLowerCase().includes('day') || sheetName.toLowerCase().includes('anniversary') || sheetName.toLowerCase().includes('birthday')) {
                section = 'Thoughtful Gifting';
              } else if (sheetName.toLowerCase().includes('theme') || sheetName.toLowerCase().includes('photo') || sheetName.toLowerCase().includes('combo') || sheetName.toLowerCase().includes('pizza')) {
                section = 'Explore More';
              }
              
              result.items.push({
                nameEn: sheetName,
                nameBn: sheetName,
                section: section,
                img: catImages[0]
              });
            }
          }
        }
      });

      // Small delay between batches to avoid gviz rate limiting
      if (i + BATCH_SIZE < CATEGORY_SHEET_NAMES.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (result.items && result.items.length > 0) {
      const chocIdx = result.items.findIndex(it => it.nameEn && it.nameEn.toLowerCase().trim() === 'chocolate cakes');
      if (chocIdx > 0) {
        const [choc] = result.items.splice(chocIdx, 1);
        result.items.unshift(choc);
      } else if (chocIdx === -1) {
        result.items.unshift({
          nameEn: "Chocolate Cakes",
          nameBn: "চকলেট কেক",
          section: "Signature Menu",
          img: "https://i.ibb.co/S4MNP7Vf/Chocolate-Cakes.png"
        });
      }
    }

    return result;
  } catch (err) {
    console.error('Error in fetchGalleryDataDirectFromSheets:', err);
    return null;
  }
}

export const BAKERY_WHATSAPP_NUMBER = '919875563329';
export const TARGET_GOOGLE_SHEET_ID = '1vZsYmZzxu653U4T6O-_S0i2dazAU_VJKBRYwdgAmXSw';
export const DEFAULT_GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgCQLsDAJI1oLzWRzIb-Ascy_QiYiTSBAl-XF8bcvE0wd5nAg-WP0TJbsiuff5EW2ygg/exec';

import { getAccessToken } from '../lib/workspaceAuth';
import { getSheetValues, updateSheetRange, appendSheetRows } from './sheetsService';
import { uploadImageFileToDrive, makeFilePublic } from './driveService';

export async function sendOrderToGoogleSheet(order: any, isUpdate: boolean = false): Promise<boolean> {
  try {
    // Build human-readable items string for Google Sheet cell
    let itemsString = '';
    if (Array.isArray(order.items)) {
      itemsString = order.items.map((item: any, i: number) => {
        const name = item.productNameEn || item.nameEn || item.title || 'Cake Item';
        const weight = item.weight ? ` (${item.weight})` : '';
        const qty = item.quantity ? ` x${item.quantity}` : '';
        const note = item.customNote ? ` [Note: ${item.customNote}]` : '';
        return `${i + 1}. ${name}${weight}${qty}${note}`;
      }).join('\n');
    } else if (typeof order.items === 'string') {
      itemsString = order.items;
    } else {
      itemsString = JSON.stringify(order.items || '');
    }

    const orderIdVal = order.id || '#BNF-' + Math.floor(1000 + Math.random() * 9000);
    const rowValues = [
      order.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      orderIdVal,
      order.customerName || order.name || 'Valued Customer',
      order.customerPhone || order.phone || '',
      order.customerEmail || '',
      itemsString,
      order.subtotal || order.total || 0,
      order.total || order.price || 0,
      order.deliveryAddress || order.address || 'Kolkata',
      order.deliveryDate || '',
      order.status || 'Pending',
      order.paymentMethod || 'Cash on Delivery',
      order.notes || order.message || order.requirements || ''
    ];

    // Primary Attempt: If browser has OAuth token, use Google Sheets API directly with deduplication
    const token = getAccessToken();
    if (token) {
      try {
        const fetched = await getSheetValues(token, TARGET_GOOGLE_SHEET_ID, "'Order info'!A1:M300");
        const rows = fetched.values || [];
        
        let existingRowIndex = -1;
        const normOrderId = orderIdVal.trim().toLowerCase();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const cellB = row[1] ? String(row[1]).trim().toLowerCase() : '';
          if (cellB === normOrderId) {
            existingRowIndex = i + 1; // 1-indexed for Google Sheets
            break;
          }
        }

        if (existingRowIndex > 0) {
          // Update existing row in place
          await updateSheetRange(token, TARGET_GOOGLE_SHEET_ID, `'Order info'!A${existingRowIndex}:M${existingRowIndex}`, [rowValues]);
          console.log(`[Google Sheets API] Updated existing order row ${existingRowIndex} for ${orderIdVal}`);
          return true;
        } else {
          // Append as new single row
          await appendSheetRows(token, TARGET_GOOGLE_SHEET_ID, "'Order info'!A:M", [rowValues]);
          console.log(`[Google Sheets API] Appended new order row for ${orderIdVal}`);
          return true;
        }
      } catch (directErr) {
        console.warn('Direct OAuth Sheets API call notice, using proxy fallback:', directErr);
      }
    }

    const payload = {
      orderId: orderIdVal,
      timestamp: rowValues[0],
      customerName: rowValues[2],
      customerPhone: rowValues[3],
      customerEmail: rowValues[4],
      items: itemsString,
      subtotal: rowValues[6],
      total: rowValues[7],
      deliveryAddress: rowValues[8],
      deliveryDate: rowValues[9],
      status: rowValues[10],
      paymentMethod: rowValues[11],
      notes: rowValues[12],
      sheetName: 'order info',
      sheetGid: '1527393898',
      isUpdate: isUpdate
    };

    // Secondary: Send POST to backend server proxy API
    try {
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Backend proxy sync notice, trying direct webhook fallback:', err);
    }

    // Tertiary Fallback: Direct Apps Script webhook call if backend proxy fails
    const directScriptUrl = `${DEFAULT_GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent('order info')}&sheetGid=1527393898&gid=1527393898&sheet=${encodeURIComponent('order info')}&tab=${encodeURIComponent('order info')}`;
    await fetch(directScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Direct Apps Script sync notice:', err));

    return true;
  } catch (e) {
    console.error('Sheet sync error:', e);
    return false;
  }
}

export function generateWhatsAppOrderLink(order: any): string {
  const itemsList = order.items.map((item: any, i: number) => 
    `${i + 1}. *${item.productNameEn}* (${item.weight}) x${item.quantity}${item.customNote ? `\n   Note: "${item.customNote}"` : ''}`
  ).join('\n');

  const text = `🎂 *NEW ORDER - Bake n' Flake (~Flavours by Musu)* 🍰

*Order ID:* ${order.id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Delivery Address:* ${order.deliveryAddress}
*Preferred Delivery Date:* ${order.deliveryDate}

--------------------------
*ORDERED ITEMS:*
${itemsList}

--------------------------
*Payment Method:* ${order.paymentMethod}
*Total Estimated:* ₹${order.total}

Please confirm my order. Thank you!`;

  return `https://wa.me/${BAKERY_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppConfirmationLink(order: any): string {
  return generateWhatsAppStatusUpdateLink(order, order.status || 'Confirmed');
}

export function generateWhatsAppStatusUpdateLink(order: any, status: string): string {
  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let statusText = '';
  switch (status) {
    case 'Pending':
      statusText = `Hi *${order.customerName}*! 👋 We received your order *${order.id}* at *Bake n' Flake*. Status: *PENDING REVIEW* ⏳ We will confirm shortly!`;
      break;
    case 'Confirmed':
      statusText = `Hi *${order.customerName}*! 👋 Your order *${order.id}* at *Bake n' Flake ~ Flavours by Musu* has been *CONFIRMED*! 🎂✨\n\n*Order Details:*\n- Delivery Date: ${order.deliveryDate}\n- Address: ${order.deliveryAddress}\n- Total Amount: ₹${order.total}\n\nThank you for choosing Bake n' Flake! ❤️`;
      break;
    case 'Preparing':
      statusText = `Hi *${order.customerName}*! 👩‍🍳 Great news! We are now *PREPARING & BAKING* your cake for order *${order.id}*! Handcrafted with love and fresh ingredients! 🎂🧁✨`;
      break;
    case 'Out for Delivery':
      statusText = `Hi *${order.customerName}*! 🚚 Exciting news! Your order *${order.id}* is *OUT FOR DELIVERY* right now! Get ready for your delicious treats! 🎉🎂`;
      break;
    case 'Delivered':
      statusText = `Hi *${order.customerName}*! 🎉 Your order *${order.id}* has been successfully *DELIVERED*! We hope you love every single bite! ❤️✨\n\nPlease let us know your feedback in the app! ⭐️`;
      break;
    case 'Cancelled':
      statusText = `Hi *${order.customerName}*, regarding order *${order.id}*, it has been *CANCELLED*. Please message us if you have any questions or would like to re-order.`;
      break;
    default:
      statusText = `Hi *${order.customerName}*! Update for order *${order.id}*: Status is now *${status}*.`;
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(statusText)}`;
}

export function generateWhatsAppCustomerThanksLink(order: any): string {
  const text = `Hi Musu! 👋 Thank you so much! I received my order *${order.id}* from *Bake n' Flake*! 🎂✨\n\nIt was super fresh and delicious! ❤️🍰`;
  return `https://wa.me/${BAKERY_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export async function sendCustomerLoginToGoogleSheet(profile: {
  name: string;
  phone: string;
  email: string;
  address?: string;
  loginMethod?: string;
}) {
  try {
    let clientIp = 'Pending IP';
    let locationDetails = 'Kolkata, WB, India';

    // Fetch public IP and Geo details
    try {
      const geoRes = await fetch('https://ipapi.co/json/').then(res => res.json()).catch(() => null);
      if (geoRes && geoRes.ip) {
        clientIp = geoRes.ip;
        locationDetails = `${geoRes.city || ''}, ${geoRes.region || ''}, ${geoRes.country_name || ''} (Lat: ${geoRes.latitude || ''}, Lon: ${geoRes.longitude || ''})`;
      }
    } catch (e) {
      console.warn('IP Geo fetch note:', e);
    }

    const deviceAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser User';
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const payload = {
      orderId: 'USR-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: timestampStr,
      customerName: profile.name,
      customerPhone: profile.phone,
      customerEmail: profile.email,
      deliveryAddress: profile.address || 'Kolkata',
      notes: `Method: ${profile.loginMethod || 'App Login'} | IP: ${clientIp} | Location: ${locationDetails} | Device: ${deviceAgent}`,
      items: `CUSTOMER LOGIN LOG [${profile.loginMethod || 'App Login'}]`,
      subtotal: 0,
      total: 0,
      status: 'User Registered',
      paymentMethod: 'N/A',
      sheetName: 'User login',
      sheetGid: '2141183941',
      gid: '2141183941',
      tabName: 'User login'
    };

    // Primary: Send single POST request to backend server proxy API
    try {
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Login proxy sync notice, trying direct webhook fallback:', err);
    }

    // Fallback: Direct Google Apps Script Webhook
    const loginScriptUrl = `${DEFAULT_GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent('User login')}&sheetGid=2141183941&gid=2141183941&sheet=${encodeURIComponent('User login')}&tab=${encodeURIComponent('User login')}&action=user_login`;
    await fetch(loginScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Customer login webhook notice:', err));

    return true;
  } catch (err) {
    console.error('Customer login sheet recording error:', err);
    return false;
  }
}

export async function sendCustomerLogoutToGoogleSheet(profile?: {
  name?: string;
  phone?: string;
  email?: string;
} | null) {
  try {
    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const payload = {
      orderId: 'LOGOUT-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: timestampStr,
      customerName: profile?.name || 'User',
      customerPhone: profile?.phone || '',
      customerEmail: profile?.email || '',
      deliveryAddress: 'Kolkata',
      notes: `User Logged Out`,
      items: `CUSTOMER LOGOUT LOG`,
      subtotal: 0,
      total: 0,
      status: 'User Logged Out',
      paymentMethod: 'N/A',
      sheetName: 'User login',
      sheetGid: '2141183941',
      gid: '2141183941',
      tabName: 'User login'
    };

    try {
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Logout proxy sync notice, trying direct webhook fallback:', err);
    }

    const logoutScriptUrl = `${DEFAULT_GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent('User login')}&sheetGid=2141183941&gid=2141183941&sheet=${encodeURIComponent('User login')}&tab=${encodeURIComponent('User login')}&action=user_logout`;
    await fetch(logoutScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Logout webhook notice:', err));

    return true;
  } catch (err) {
    console.error('Logout sheet recording error:', err);
    return false;
  }
}

export async function submitReviewToGoogleSheet(review: {
  name: string;
  rating: number;
  text: string;
  source: 'web' | 'google' | 'facebook';
  photoUrls?: string[];
  files?: File[];
}) {
  try {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    let finalPhotoUrls = review.photoUrls || [];

    const token = getAccessToken();
    
    // Upload files to Drive if token is available
    if (token && review.files && review.files.length > 0) {
      try {
        const uploadPromises = review.files.map(file => 
          uploadImageFileToDrive(token, file, `review_${Date.now()}_${file.name}`)
        );
        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Make each file public
        for (const file of uploadedFiles) {
          if (file.id) {
            await makeFilePublic(token, file.id).catch(e => console.warn('Could not make file public:', e));
          }
        }

        const driveUrls = uploadedFiles.map(f => f.webViewLink).filter(Boolean) as string[];
        finalPhotoUrls = [...finalPhotoUrls, ...driveUrls];
      } catch (err) {
        console.warn('Failed to upload some images to Drive:', err);
      }
    }

    const rowValues = [
      review.name,
      review.name, // nameBn
      review.rating.toString(),
      review.text,
      review.text, // textBn
      timestamp,
      '', // avatar
      '', // ownerReplyEn
      '', // ownerReplyBn
      review.source,
      finalPhotoUrls.join(', ')
    ];

    if (token) {
      try {
        await appendSheetRows(token, TARGET_GOOGLE_SHEET_ID, "'Reviews'!A:K", [rowValues]);
        return true;
      } catch (err) {
        console.warn('OAuth submit review failed, using fallback:', err);
      }
    }

    const payload = {
      ...review,
      photoUrls: finalPhotoUrls,
      timestamp,
      verified: 'VERIFIED',
      sheetName: 'WEB REVIEWS',
      sheetGid: '96927725',
      gid: '96927725',
      action: 'submit_review'
    };

    const res = await fetch('/api/sync-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.error('Review submission error:', err);
    return false;
  }
}

