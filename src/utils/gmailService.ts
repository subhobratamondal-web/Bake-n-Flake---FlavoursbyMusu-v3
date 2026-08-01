import { Order } from '../types';
import { DEFAULT_GOOGLE_APPS_SCRIPT_URL } from './googleSheetsSync';

/**
 * Utility function to send branded status update email via Google Apps Script Web App endpoint.
 * Triggers an email from 'bakenflake.com' (display name "Bake n' Flake (bakenflake.com)")
 * to the customer using the owner's Gmail address as sender.
 */
export async function sendEmailViaAppsScript(
  order: Order,
  newStatus: string
): Promise<boolean> {
  const customerEmail = order.customerEmail;
  if (!customerEmail || !customerEmail.includes('@')) {
    console.warn('[Apps Script Email] Valid customer email required for order:', order.id);
    return false;
  }

  const payload = {
    action: 'send_status_email',
    sheetName: 'order info',
    sheetGid: '1527393898',
    senderDisplayName: "Bake n' Flake (bakenflake.com)",
    fromEmail: "subhobratamondal@gmail.com",
    from: "subhobratamondal@gmail.com",
    toEmail: customerEmail,
    to: customerEmail,
    customerName: order.customerName,
    orderId: order.id,
    newStatus: newStatus,
    status: newStatus,
    items: order.items.map(item => ({
      productName: item.productNameEn,
      quantity: item.quantity,
      price: item.price
    })),
    subtotal: order.subtotal || order.total,
    total: order.total,
    deliveryDate: order.deliveryDate || 'As scheduled',
    deliveryAddress: order.deliveryAddress,
    notes: order.notes || '',
    subject: `🍰 Bake n' Flake (bakenflake.com) Order #${order.id.slice(-6).toUpperCase()} Status Update: ${newStatus}`
  };

  try {
    const targetScriptUrl = `${DEFAULT_GOOGLE_APPS_SCRIPT_URL}?action=send_status_email&sheetName=${encodeURIComponent('order info')}&sheetGid=1527393898`;
    const response = await fetch(targetScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('[Apps Script Email] Status update email trigger completed:', response.status);
    return true;
  } catch (err: any) {
    console.warn('[Apps Script Email] Webhook trigger notice:', err?.message || err);
    return false;
  }
}

/**
 * Encodes a string to RFC 4648 base64url format required by Gmail API.
 */
function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Gmail API v1 messages.send
 */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<any> {
  const mimeMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    bodyHtml
  ].join('\r\n');

  const raw = encodeBase64Url(mimeMessage);

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API Error (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Constructs and sends a stylized order confirmation email to the customer
 */
export async function sendOrderConfirmationEmail(
  accessToken: string,
  order: Order
): Promise<any> {
  const to = order.customerEmail;
  if (!to || !to.includes('@')) {
    throw new Error('Valid customer email address is required.');
  }

  const subject = `🎂 Order Confirmed! Bake n' Flake Order #${order.id.slice(-6).toUpperCase()}`;

  const itemsList = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-weight: bold; color: #334155;">${item.productNameEn}</td>
        <td style="padding: 10px; text-align: center; color: #64748b;">x${item.quantity}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #059669;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 30px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Bake n' Flake</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Order Confirmation & Receipt</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello <strong>${order.customerName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Thank you for placing your order with Bake n' Flake! We've received your request and our master bakers are preparing your items with fresh ingredients.</p>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Order ID:</td>
              <td style="font-weight: bold; color: #0f172a; text-align: right;">#${order.id}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Delivery Date:</td>
              <td style="font-weight: bold; color: #0f172a; text-align: right;">${order.deliveryDate || 'Standard Schedule'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Payment Method:</td>
              <td style="font-weight: bold; color: #0f172a; text-align: right;">${order.paymentMethod || 'Cash on Delivery'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Status:</td>
              <td style="font-weight: bold; color: #059669; text-align: right;">${order.status}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-bottom: 12px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; text-align: left;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="margin-top: 16px; text-align: right; font-size: 18px; font-weight: bold; color: #0f172a;">
          Total Paid: <span style="color: #059669;">₹${order.total}</span>
        </div>

        ${
          order.notes
            ? `<div style="margin-top: 20px; padding: 12px; background: #fffbebf1; border-left: 4px solid #f59e0b; font-size: 13px; color: #92400e; border-radius: 4px;">
                <strong>Custom Note:</strong> ${order.notes}
               </div>`
            : ''
        }

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          Bake n' Flake Artisan Bakery • Freshly Baked Everyday<br/>
          Questions? Call us at +91 85840 17701
        </div>
      </div>
    </div>
  `;

  return await sendGmailMessage(accessToken, to, subject, html);
}

/**
 * Sends status update notification email (e.g. 'Ready for Pickup', 'Out for Delivery', 'Delivered')
 */
export async function sendStatusUpdateEmail(
  accessToken: string,
  order: Order,
  newStatus: string
): Promise<any> {
  const to = order.customerEmail;
  if (!to || !to.includes('@')) {
    throw new Error('Valid customer email address is required.');
  }

  const subject = `🔔 Order Update: #${order.id.slice(-6).toUpperCase()} is now ${newStatus}!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
      <h2 style="color: #059669; margin-top: 0;">Order Status Updated!</h2>
      <p style="font-size: 14px; color: #334155;">Hi <strong>${order.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">Your order <strong>#${order.id}</strong> status has been updated to:</p>
      
      <div style="padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; text-align: center; margin: 16px 0;">
        <span style="font-size: 20px; font-weight: bold; color: #047857;">${newStatus}</span>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Delivery Date: ${order.deliveryDate || 'As scheduled'}<br/>
        Address: ${order.deliveryAddress || 'Pick-up at counter'}
      </p>

      <p style="font-size: 13px; color: #475569; margin-top: 20px;">
        Thank you for choosing Bake n' Flake!
      </p>
    </div>
  `;

  return await sendGmailMessage(accessToken, to, subject, html);
}
