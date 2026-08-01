export interface CalendarEventPayload {
  summary: string;
  description?: string;
  startIsoDate: string; // YYYY-MM-DD or full ISO
  endIsoDate?: string;
  location?: string;
}

/**
 * Creates an event in the user's primary Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventPayload
): Promise<any> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const isAllDay = !event.startIsoDate.includes('T');

  const startObj = isAllDay
    ? { date: event.startIsoDate.slice(0, 10) }
    : { dateTime: new Date(event.startIsoDate).toISOString() };

  const endVal = event.endIsoDate || event.startIsoDate;
  const endObj = isAllDay
    ? { date: endVal.slice(0, 10) }
    : { dateTime: new Date(endVal).toISOString() };

  const body = {
    summary: event.summary,
    description: event.description || "Created from Bake n' Flake Artisan Bakery App",
    location: event.location || "Bake n' Flake Bakery Counter",
    start: startObj,
    end: endObj,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 180 },  // 3 hours before
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar API Error (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Fetch upcoming calendar events from user's primary calendar
 */
export async function listCalendarEvents(
  accessToken: string,
  maxResults = 20
): Promise<any[]> {
  const nowIso = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowIso)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list calendar events (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Helper to push new user order deadlines as Google Calendar events so they automatically
 * appear in Google Calendar and the 'Upcoming Celebrations' view alongside existing reminders.
 */
export async function pushOrderDeadlineCalendarEvent(
  accessToken: string,
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    items: { productNameEn: string; quantity: number }[];
    total: number;
    deliveryAddress: string;
  }
): Promise<any> {
  const summary = `🎂 Order Delivery Deadline: #${order.id.slice(-6).toUpperCase()} (${order.customerName})`;
  const description = `Bake n' Flake Order Deadline for ${order.customerName}.\nPhone: ${order.customerPhone}\nItems: ${order.items.map(i => `${i.productNameEn} x${i.quantity}`).join(', ')}\nTotal: ₹${order.total}\nDelivery Address: ${order.deliveryAddress || 'Store Pickup'}`;

  return await createCalendarEvent(accessToken, {
    summary,
    description,
    startIsoDate: order.deliveryDate || new Date().toISOString().slice(0, 10),
    location: order.deliveryAddress || "Bake n' Flake Store"
  });
}

