export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

/**
 * List or search files in user's Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery?: string,
  pageSize = 30
): Promise<DriveFile[]> {
  let q = 'trashed = false';
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,modifiedTime,size,thumbnailLink,iconLink)&q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Upload text/JSON/CSV file directly to Google Drive
 */
export async function uploadTextFileToDrive(
  accessToken: string,
  filename: string,
  content: string,
  mimeType = 'application/json'
): Promise<DriveFile> {
  const metadata = {
    name: filename,
    mimeType: mimeType,
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload file to Google Drive (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Upload an image file or blob directly to Google Drive
 */
export async function uploadImageFileToDrive(
  accessToken: string,
  file: File | Blob,
  filename: string
): Promise<DriveFile> {
  const metadata = {
    name: filename,
    mimeType: file.type || 'image/png',
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload image to Google Drive (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Delete a file from Google Drive
 * IMPORTANT: User MUST confirm this action before calling this function!
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to delete file from Google Drive (${response.status}): ${errText}`);
  }

  return true;
}
