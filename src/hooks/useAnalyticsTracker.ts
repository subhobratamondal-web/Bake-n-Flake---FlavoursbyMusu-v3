import { useEffect, useRef, useState, useCallback } from 'react';

export interface AnalyticsMetrics {
  sessionId: string;
  startTime: number;
  durationSeconds: number;
  menuItemClicks: Record<string, number>;
  sectionViews: Record<string, number>;
  totalInteractions: number;
}

const SESSION_STORAGE_KEY = 'bnf_analytics_session_id';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = 'SESS-' + Math.floor(100000 + Math.random() * 900000);
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function sendAnalyticsToGoogleSheet(metrics: AnalyticsMetrics) {
  const sortedClicks = Object.entries(metrics.menuItemClicks)
    .sort((a, b) => b[1] - a[1]);
  
  const mostClickedText = sortedClicks.length > 0 
    ? sortedClicks.slice(0, 5).map(([item, count]) => `${item} (${count}x)`).join(', ')
    : 'None clicked yet';

  const durationFormatted = `${Math.floor(metrics.durationSeconds / 60)}m ${metrics.durationSeconds % 60}s`;

  const payload = {
    sheetName: 'Analytics',
    sheetGid: '77889900',
    tabName: 'Analytics',
    orderId: metrics.sessionId,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    customerName: `Session #${metrics.sessionId} (${durationFormatted})`,
    customerPhone: `Interactions: ${metrics.totalInteractions}`,
    customerEmail: sortedClicks[0] ? sortedClicks[0][0] : 'None',
    items: `Most Clicked Menu Items: ${mostClickedText}`,
    subtotal: metrics.durationSeconds,
    total: metrics.totalInteractions,
    status: `Duration: ${durationFormatted}`,
    paymentMethod: 'Analytics Event',
    deliveryAddress: 'Website Session Tracker',
    notes: `Menu Clicks: ${JSON.stringify(metrics.menuItemClicks)} | Views: ${JSON.stringify(metrics.sectionViews)}`
  };

  fetch('/api/sync-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.warn('[Analytics Sync] Notice:', err));
}

export function useAnalyticsTracker() {
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const startTimeRef = useRef<number>(Date.now());
  const menuItemClicksRef = useRef<Record<string, number>>({});
  const sectionViewsRef = useRef<Record<string, number>>({});
  const totalInteractionsRef = useRef<number>(0);

  const getMetrics = useCallback((): AnalyticsMetrics => {
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    return {
      sessionId,
      startTime: startTimeRef.current,
      durationSeconds,
      menuItemClicks: { ...menuItemClicksRef.current },
      sectionViews: { ...sectionViewsRef.current },
      totalInteractions: totalInteractionsRef.current
    };
  }, [sessionId]);

  const trackMenuItemClick = useCallback((itemName: string) => {
    if (!itemName) return;
    menuItemClicksRef.current[itemName] = (menuItemClicksRef.current[itemName] || 0) + 1;
    totalInteractionsRef.current += 1;
    
    // Sync to Google Sheets when user interacts
    sendAnalyticsToGoogleSheet(getMetrics());
  }, [getMetrics]);

  const trackSectionView = useCallback((sectionName: string) => {
    if (!sectionName) return;
    sectionViewsRef.current[sectionName] = (sectionViewsRef.current[sectionName] || 0) + 1;
    totalInteractionsRef.current += 1;
  }, []);

  useEffect(() => {
    // Sync initial session start
    const initialTimer = setTimeout(() => {
      sendAnalyticsToGoogleSheet(getMetrics());
    }, 3000);

    // Periodically record average session duration and top items every 45s
    const periodicInterval = setInterval(() => {
      sendAnalyticsToGoogleSheet(getMetrics());
    }, 45000);

    // Flush analytics on page exit / unload or tab hide
    const handleUnloadOrHide = () => {
      sendAnalyticsToGoogleSheet(getMetrics());
    };

    window.addEventListener('beforeunload', handleUnloadOrHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnloadOrHide();
      }
    });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicInterval);
      window.removeEventListener('beforeunload', handleUnloadOrHide);
    };
  }, [getMetrics]);

  return {
    trackMenuItemClick,
    trackSectionView,
    getMetrics
  };
}
