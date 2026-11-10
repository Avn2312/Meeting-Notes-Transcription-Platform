import {
  MeetingListItem,
  MeetingDetail,
  ActionItem,
  HighlightNote,
  ChatMessage,
  GlobalSearchResult
} from '@/types/meeting';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchMeetings(params?: {
  search?: string;
  speaker?: string;
  sort_by?: string;
}): Promise<MeetingListItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.speaker) query.append('speaker', params.speaker);
  if (params?.sort_by) query.append('sort_by', params.sort_by);

  const res = await fetch(`${BASE_URL}/api/meetings?${query.toString()}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
}

export async function fetchMeeting(id: string): Promise<MeetingDetail> {
  const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch meeting: ${id}`);
  return res.json();
}

export async function uploadTranscript(formData: FormData): Promise<MeetingDetail> {
  const res = await fetch(`${BASE_URL}/api/meetings/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload transcript' }));
    throw new Error(err.detail || 'Failed to upload transcript');
  }
  return res.json();
}

export async function updateMeetingMetadata(
  id: string,
  data: {
    title?: string;
    participants?: {
      name: string;
      email?: string;
      avatar_color?: string;
      talk_time_percentage?: number;
    }[];
  }
): Promise<MeetingDetail> {
  const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update meeting');
  return res.json();
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete meeting');
}

export async function addActionItem(
  meetingId: string,
  data: { task: string; assignee?: string; due_date?: string }
): Promise<ActionItem> {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add action item');
  return res.json();
}

export async function updateActionItem(
  itemId: string,
  data: { completed?: boolean; task?: string; assignee?: string }
): Promise<ActionItem> {
  const res = await fetch(`${BASE_URL}/api/action-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update action item');
  return res.json();
}

export async function deleteActionItem(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/action-items/${itemId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete action item');
}

export async function addHighlight(
  meetingId: string,
  data: { selected_text: string; note?: string; color?: string; segment_id?: string }
): Promise<HighlightNote> {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/highlights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add highlight');
  return res.json();
}

export async function deleteHighlight(highlightId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/highlights/${highlightId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete highlight');
}

export async function askFred(meetingId: string, question: string): Promise<ChatMessage> {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw new Error('Failed to query Fred');
  return res.json();
}

export async function searchGlobal(query: string): Promise<GlobalSearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export function getExportUrl(meetingId: string, format: 'markdown' | 'txt' | 'json'): string {
  return `${BASE_URL}/api/meetings/${meetingId}/export?format=${format}`;
}

