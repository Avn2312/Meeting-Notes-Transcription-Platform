from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# --- Participants ---
class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None
    avatar_color: Optional[str] = "#6366F1"
    talk_time_percentage: Optional[float] = 0.0

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantResponse(ParticipantBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)


# --- Transcript Segments ---
class TranscriptSegmentBase(BaseModel):
    speaker_name: str
    start_time: float
    end_time: float
    text: str
    sequence_order: int = 0

class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass

class TranscriptSegmentResponse(TranscriptSegmentBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)


# --- Action Items ---
class ActionItemBase(BaseModel):
    task: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    completed: bool = False

class ActionItemCreate(ActionItemBase):
    pass

class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None

class ActionItemResponse(ActionItemBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)


# --- Topic Chapters ---
class TopicChapterBase(BaseModel):
    title: str
    timestamp: float
    summary: Optional[str] = None

class TopicChapterCreate(TopicChapterBase):
    pass

class TopicChapterResponse(TopicChapterBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)


# --- Highlight Notes ---
class HighlightNoteBase(BaseModel):
    selected_text: str
    note: Optional[str] = None
    color: str = "purple"
    segment_id: Optional[str] = None

class HighlightNoteCreate(HighlightNoteBase):
    pass

class HighlightNoteResponse(HighlightNoteBase):
    id: str
    meeting_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Chat Messages (Ask Fred) ---
class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: str
    meeting_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Meeting Schemas ---
class MeetingBase(BaseModel):
    title: str
    date: Optional[datetime] = None
    duration_seconds: int = 0
    audio_url: Optional[str] = None
    summary_overview: Optional[str] = None
    bullet_points: Optional[str] = None  # JSON string or bullet points
    sentiment: Optional[str] = "positive"

class MeetingCreate(MeetingBase):
    participants: Optional[List[ParticipantCreate]] = None
    transcript_segments: Optional[List[TranscriptSegmentCreate]] = None
    action_items: Optional[List[ActionItemCreate]] = None
    topic_chapters: Optional[List[TopicChapterCreate]] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    audio_url: Optional[str] = None
    summary_overview: Optional[str] = None
    bullet_points: Optional[str] = None
    sentiment: Optional[str] = None
    participants: Optional[List[ParticipantCreate]] = None

class MeetingListItemResponse(BaseModel):
    id: str
    title: str
    date: datetime
    duration_seconds: int
    audio_url: Optional[str] = None
    summary_overview: Optional[str] = None
    sentiment: Optional[str] = "positive"
    created_at: datetime
    updated_at: datetime
    participants: List[ParticipantResponse] = []
    action_items_count: int = 0
    pending_action_items_count: int = 0
    transcript_preview: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MeetingDetailResponse(BaseModel):
    id: str
    title: str
    date: datetime
    duration_seconds: int
    audio_url: Optional[str] = None
    summary_overview: Optional[str] = None
    bullet_points: Optional[str] = None
    sentiment: Optional[str] = "positive"
    created_at: datetime
    updated_at: datetime
    participants: List[ParticipantResponse] = []
    transcript_segments: List[TranscriptSegmentResponse] = []
    action_items: List[ActionItemResponse] = []
    topic_chapters: List[TopicChapterResponse] = []
    highlights: List[HighlightNoteResponse] = []
    chat_messages: List[ChatMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Ingestion / Parsing Schema ---
class TranscriptUploadRequest(BaseModel):
    title: str
    transcript_text: str  # raw text or vtt or json
    participants: Optional[List[str]] = None
    generate_ai_summary: bool = True


# --- Ask Fred Question Request ---
class AskFredRequest(BaseModel):
    question: str


# --- Global Search Item ---
class GlobalSearchResult(BaseModel):
    meeting_id: str
    meeting_title: str
    date: datetime
    match_type: str  # "title", "transcript", "action_item", "summary"
    snippet: str
    timestamp: Optional[float] = None
    speaker: Optional[str] = None
