import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False, index=True)
    date = Column(DateTime, default=utc_now, nullable=False, index=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    audio_url = Column(String, nullable=True)
    summary_overview = Column(Text, nullable=True)
    bullet_points = Column(Text, nullable=True)  # JSON-encoded array of key takeaway strings
    sentiment = Column(String, default="positive", nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships with cascade delete
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan", order_by="Participant.name")
    transcript_segments = relationship("TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.sequence_order")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan", order_by="ActionItem.id")
    topic_chapters = relationship("TopicChapter", back_populates="meeting", cascade="all, delete-orphan", order_by="TopicChapter.timestamp")
    highlights = relationship("HighlightNote", back_populates="meeting", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="meeting", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    avatar_color = Column(String, default="#6366F1", nullable=True)
    talk_time_percentage = Column(Float, default=0.0, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_name = Column(String, nullable=False, index=True)
    start_time = Column(Float, nullable=False, index=True)  # in seconds
    end_time = Column(Float, nullable=False)               # in seconds
    text = Column(Text, nullable=False)
    sequence_order = Column(Integer, nullable=False, default=0)

    meeting = relationship("Meeting", back_populates="transcript_segments")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    task = Column(Text, nullable=False)
    assignee = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)

    meeting = relationship("Meeting", back_populates="action_items")


class TopicChapter(Base):
    __tablename__ = "topic_chapters"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    timestamp = Column(Float, nullable=False)  # in seconds
    summary = Column(Text, nullable=True)

    meeting = relationship("Meeting", back_populates="topic_chapters")


class HighlightNote(Base):
    __tablename__ = "highlight_notes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(String, nullable=True)
    selected_text = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    color = Column(String, default="purple", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    meeting = relationship("Meeting", back_populates="highlights")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    meeting = relationship("Meeting", back_populates="chat_messages")

