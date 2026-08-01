/**
 * Utility for managing browser push notifications using Web Notification API.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function sendOrderPushNotification(
  orderId: string,
  status: string,
  lang: 'en' | 'bn' = 'en'
): boolean {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') {
    const shortId = orderId.slice(-6).toUpperCase();
    
    let title = `🎂 Bake n' Flake Order #${shortId} Status: ${status}!`;
    let body = `Your cake order #${shortId} status has been updated to "${status}".`;

    if (status === 'Confirmed') {
      title = `✅ Order #${shortId} Confirmed! - Bake n' Flake`;
      body = lang === 'en' 
        ? `Great news! Your cake order #${shortId} has been confirmed by our master baker!`
        : `আপনার #${shortId} কেকের অর্ডারটি কনফার্ম করা হয়েছে!`;
    } else if (status === 'Delivered') {
      title = `🎉 Order #${shortId} Delivered! - Bake n' Flake`;
      body = lang === 'en'
        ? `Your freshly baked cake #${shortId} has been delivered! Enjoy every bite! 🍰`
        : `আপনার কেক #${shortId} সফলভাবে ডেলিভারি করা হয়েছে! মিষ্টি মুহূর্ত উপভোগ করুন! 🍰`;
    } else if (status === 'Out for Delivery') {
      title = `🚚 Order #${shortId} is Out for Delivery!`;
      body = lang === 'en'
        ? `Your order #${shortId} is on its way to your doorstep!`
        : `আপনার কেক #${shortId} আপনার ঠিকানার উদ্দেশ্যে রওনা দিয়েছে!`;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `bnf_order_${orderId}_${status}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
      };
      return true;
    } catch (err) {
      console.warn('Error displaying Notification API alert:', err);
      return false;
    }
  } else if (Notification.permission === 'default') {
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendOrderPushNotification(orderId, status, lang);
      }
    });
  }

  return false;
}
