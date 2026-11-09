export interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  email?: string;
  avatar_color?: string;
  talk_time_percentage?: number;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence_order: number;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  task: string;
  assignee?: string;
  due_date?: string;
  completed: boolean;
}

export interface TopicChapter {
  id: string;
  meeting_id: string;
  title: string;
  timestamp: number;
  summary?: string;
}

export interface HighlightNote {
  id: string;
  meeting_id: string;
  segment_id?: string;
  selected_text: string;
  note?: string;
  color: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  meeting_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  duration_seconds: number;
  audio_url?: string;
  summary_overview?: string;
  sentiment?: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  action_items_count: number;
  pending_action_items_count: number;
  transcript_preview?: string;
}

export interface MeetingDetail {
  id: string;
  title: string;
  date: string;
  duration_seconds: number;
  audio_url?: string;
  summary_overview?: string;
  bullet_points?: string;
  sentiment?: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  transcript_segments: TranscriptSegment[];
  action_items: ActionItem[];
  topic_chapters: TopicChapter[];
  highlights: HighlightNote[];
  chat_messages: ChatMessage[];
}

export interface GlobalSearchResult {
  meeting_id: string;
  meeting_title: string;
  date: string;
  match_type: 'title' | 'transcript' | 'action_item' | 'summary';
  snippet: string;
  timestamp?: number;
  speaker?: string;
}

