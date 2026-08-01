export interface SheetRowData {
  range?: string;
  values: (string | number)[][];
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: { sheetId: number; title: string }[];
  spreadsheetUrl?: string;
}

/**
 * Add a new subsheet (tab) to an existing Google Spreadsheet
 */
export async function addSheetTabToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: tabTitle,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create subsheet (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Get spreadsheet details and sheets list
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Bakery Spreadsheet',
    spreadsheetUrl: data.spreadsheetUrl,
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
    })),
  };
}

/**
 * Read values from a Google Sheet range
 */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range = 'A1:Z100'
): Promise<SheetRowData> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch sheet values (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    range: data.range,
    values: data.values || [],
  };
}

/**
 * Append new rows to a Google Sheet
 */
export async function appendSheetRows(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rows: (string | number)[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append rows to sheet (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Update a specific range in a Google Sheet
 * IMPORTANT: User MUST confirm this operation before calling!
 */
export async function updateSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rows: (string | number)[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update sheet range (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Create a new pre-formatted Google Sheet for Bakery Orders
 */
export async function createBakeryOrdersSheet(
  accessToken: string,
  sheetTitle = "Bake n' Flake - Live Orders & Inventory"
): Promise<SpreadsheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'Orders',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create new spreadsheet (${response.status}): ${errText}`);
  }

  const createdData = await response.json();
  const spreadsheetId = createdData.spreadsheetId;

  // Populate header row in the newly created spreadsheet
  const headers = [
    [
      'Timestamp',
      'Order ID',
      'Customer Name',
      'Phone',
      'Email',
      'Ordered Items',
      'Subtotal (₹)',
      'Total Paid (₹)',
      'Delivery Date',
      'Delivery Address',
      'Status',
      'Payment Method',
      'Special Notes / Custom Requirements'
    ],
  ];

  await updateSheetRange(accessToken, spreadsheetId, 'Orders!A1:M1', headers);

  return {
    spreadsheetId,
    title: sheetTitle,
    spreadsheetUrl: createdData.spreadsheetUrl,
    sheets: (createdData.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Orders',
    })),
  };
}
