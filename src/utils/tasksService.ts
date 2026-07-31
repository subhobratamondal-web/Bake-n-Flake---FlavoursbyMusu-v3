export interface TaskList {
  id: string;
  title: string;
}

export interface TaskItem {
  id?: string;
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
  status?: string;
}

/**
 * Fetch default or user's task lists from Google Tasks API
 */
export async function getTaskLists(accessToken: string): Promise<TaskList[]> {
  const url = 'https://tasks.googleapis.com/tasks/v1/users/@default/lists';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Tasks API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new Task item in the user's primary or selected Google Task list
 */
export async function createGoogleTask(
  accessToken: string,
  title: string,
  notes?: string,
  dueDateIso?: string,
  taskListId = '@default'
): Promise<TaskItem> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`;

  const body: any = {
    title,
    notes,
  };

  if (dueDateIso) {
    // Format to RFC 3339 e.g. 2026-08-05T00:00:00.000Z
    try {
      const date = new Date(dueDateIso);
      if (!isNaN(date.getTime())) {
        body.due = date.toISOString();
      }
    } catch (e) {
      console.warn('Invalid date string for task due date:', dueDateIso);
    }
  }

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
    throw new Error(`Failed to create task in Google Tasks (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * List tasks in a task list
 */
export async function listGoogleTasks(
  accessToken: string,
  taskListId = '@default'
): Promise<TaskItem[]> {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&maxResults=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list tasks from Google Tasks (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.items || [];
}
