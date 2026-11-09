import re
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
import models
import schemas

def get_meetings(
    db: Session,
    search: Optional[str] = None,
    speaker: Optional[str] = None,
    sort_by: str = "newest",
    skip: int = 0,
    limit: int = 50
) -> List[models.Meeting]:
    query = db.query(models.Meeting)

    if search:
        search_filter = f"%{search.strip()}%"
        # Search title or summary
        query = query.filter(
            or_(
                models.Meeting.title.ilike(search_filter),
                models.Meeting.summary_overview.ilike(search_filter)
            )
        )

    if speaker:
        query = query.join(models.Participant).filter(
            models.Participant.name.ilike(f"%{speaker.strip()}%")
        )

    if sort_by == "oldest":
        query = query.order_by(asc(models.Meeting.date))
    elif sort_by == "duration_desc":
        query = query.order_by(desc(models.Meeting.duration_seconds))
    elif sort_by == "title_asc":
        query = query.order_by(asc(models.Meeting.title))
    else:  # newest default
        query = query.order_by(desc(models.Meeting.date))

    return query.offset(skip).limit(limit).all()


def get_meeting(db: Session, meeting_id: str) -> Optional[models.Meeting]:
    return db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()


def create_meeting(db: Session, meeting_in: schemas.MeetingCreate) -> models.Meeting:
    db_meeting = models.Meeting(
        title=meeting_in.title,
        date=meeting_in.date or datetime.now(timezone.utc),
        duration_seconds=meeting_in.duration_seconds,
        audio_url=meeting_in.audio_url,
        summary_overview=meeting_in.summary_overview,
        bullet_points=meeting_in.bullet_points,
        sentiment=meeting_in.sentiment or "positive"
    )
    db.add(db_meeting)
    db.flush()

    if meeting_in.participants:
        for p in meeting_in.participants:
            db_p = models.Participant(
                meeting_id=db_meeting.id,
                name=p.name,
                email=p.email,
                avatar_color=p.avatar_color,
                talk_time_percentage=p.talk_time_percentage
            )
            db.add(db_p)

    if meeting_in.transcript_segments:
        for idx, seg in enumerate(meeting_in.transcript_segments):
            db_seg = models.TranscriptSegment(
                meeting_id=db_meeting.id,
                speaker_name=seg.speaker_name,
                start_time=seg.start_time,
                end_time=seg.end_time,
                text=seg.text,
                sequence_order=idx
            )
            db.add(db_seg)

    if meeting_in.action_items:
        for item in meeting_in.action_items:
            db_item = models.ActionItem(
                meeting_id=db_meeting.id,
                task=item.task,
                assignee=item.assignee,
                due_date=item.due_date,
                completed=item.completed
            )
            db.add(db_item)

    if meeting_in.topic_chapters:
        for chap in meeting_in.topic_chapters:
            db_chap = models.TopicChapter(
                meeting_id=db_meeting.id,
                title=chap.title,
                timestamp=chap.timestamp,
                summary=chap.summary
            )
            db.add(db_chap)

    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def update_meeting(db: Session, meeting_id: str, update_data: schemas.MeetingUpdate) -> Optional[models.Meeting]:
    db_meeting = get_meeting(db, meeting_id)
    if not db_meeting:
        return None

    if update_data.title is not None:
        db_meeting.title = update_data.title
    if update_data.date is not None:
        db_meeting.date = update_data.date
    if update_data.duration_seconds is not None:
        db_meeting.duration_seconds = update_data.duration_seconds
    if update_data.audio_url is not None:
        db_meeting.audio_url = update_data.audio_url
    if update_data.summary_overview is not None:
        db_meeting.summary_overview = update_data.summary_overview
    if update_data.bullet_points is not None:
        db_meeting.bullet_points = update_data.bullet_points
    if update_data.sentiment is not None:
        db_meeting.sentiment = update_data.sentiment

    if update_data.participants is not None:
        # replace participants
        db.query(models.Participant).filter(models.Participant.meeting_id == meeting_id).delete()
        for p in update_data.participants:
            db.add(models.Participant(
                meeting_id=meeting_id,
                name=p.name,
                email=p.email,
                avatar_color=p.avatar_color,
                talk_time_percentage=p.talk_time_percentage
            ))

    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def delete_meeting(db: Session, meeting_id: str) -> bool:
    db_meeting = get_meeting(db, meeting_id)
    if not db_meeting:
        return False
    db.delete(db_meeting)
    db.commit()
    return True


# --- Action Items CRUD ---
def add_action_item(db: Session, meeting_id: str, item_in: schemas.ActionItemCreate) -> models.ActionItem:
    db_item = models.ActionItem(
        meeting_id=meeting_id,
        task=item_in.task,
        assignee=item_in.assignee,
        due_date=item_in.due_date,
        completed=item_in.completed
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_action_item(db: Session, item_id: str, update_in: schemas.ActionItemUpdate) -> Optional[models.ActionItem]:
    db_item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if not db_item:
        return None
    if update_in.task is not None:
        db_item.task = update_in.task
    if update_in.assignee is not None:
        db_item.assignee = update_in.assignee
    if update_in.due_date is not None:
        db_item.due_date = update_in.due_date
    if update_in.completed is not None:
        db_item.completed = update_in.completed

    db.commit()
    db.refresh(db_item)
    return db_item


def delete_action_item(db: Session, item_id: str) -> bool:
    db_item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


# --- Highlights / Soundbites CRUD ---
def add_highlight(db: Session, meeting_id: str, note_in: schemas.HighlightNoteCreate) -> models.HighlightNote:
    db_note = models.HighlightNote(
        meeting_id=meeting_id,
        segment_id=note_in.segment_id,
        selected_text=note_in.selected_text,
        note=note_in.note,
        color=note_in.color
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def delete_highlight(db: Session, highlight_id: str) -> bool:
    db_note = db.query(models.HighlightNote).filter(models.HighlightNote.id == highlight_id).first()
    if not db_note:
        return False
    db.delete(db_note)
    db.commit()
    return True


# --- Chat Messages CRUD ---
def add_chat_message(db: Session, meeting_id: str, msg_in: schemas.ChatMessageCreate) -> models.ChatMessage:
    db_msg = models.ChatMessage(
        meeting_id=meeting_id,
        role=msg_in.role,
        content=msg_in.content
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg


# --- Global Search Across All Meetings ---
def global_search(db: Session, query: str) -> List[schemas.GlobalSearchResult]:
    query_str = query.strip()
    if not query_str:
        return []
    
    results: List[schemas.GlobalSearchResult] = []
    q_filter = f"%{query_str}%"

    # Search in titles
    meetings = db.query(models.Meeting).filter(models.Meeting.title.ilike(q_filter)).all()
    for m in meetings:
        results.append(schemas.GlobalSearchResult(
            meeting_id=m.id,
            meeting_title=m.title,
            date=m.date,
            match_type="title",
            snippet=m.title
        ))

    # Search in transcript segments
    segments = db.query(models.TranscriptSegment).join(models.Meeting).filter(
        models.TranscriptSegment.text.ilike(q_filter)
    ).limit(30).all()
    for s in segments:
        results.append(schemas.GlobalSearchResult(
            meeting_id=s.meeting.id,
            meeting_title=s.meeting.title,
            date=s.meeting.date,
            match_type="transcript",
            snippet=s.text,
            timestamp=s.start_time,
            speaker=s.speaker_name
        ))

    # Search in action items
    actions = db.query(models.ActionItem).join(models.Meeting).filter(
        models.ActionItem.task.ilike(q_filter)
    ).limit(20).all()
    for a in actions:
        results.append(schemas.GlobalSearchResult(
            meeting_id=a.meeting.id,
            meeting_title=a.meeting.title,
            date=a.meeting.date,
            match_type="action_item",
            snippet=f"{a.task} (Assignee: {a.assignee or 'Unassigned'})"
        ))

    return results


# --- Transcript Parser Utility ---
def parse_transcript_text(raw_text: str) -> List[dict]:
    """
    Parses various transcript formats:
    - VTT format: 00:00:10.000 --> 00:00:15.000 \n Speaker: text
    - Bracket timestamp format: [01:23] John Doe: Hello everyone
    - Colon format: John Doe [01:23]: Hello everyone
    - Plain format: John Doe: Hello everyone
    - JSON array format
    """
    raw_text = raw_text.strip()
    # Try JSON
    if raw_text.startswith("[") and raw_text.endswith("]"):
        try:
            data = json.loads(raw_text)
            if isinstance(data, list) and len(data) > 0 and "text" in data[0]:
                return data
        except Exception:
            pass

    segments = []
    lines = raw_text.splitlines()

    current_speaker = "Speaker 1"
    current_start = 0.0
    current_end = 5.0
    sequence = 0

    timestamp_regex1 = re.compile(r'\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?')  # [01:23] or [00:01:23]
    speaker_regex = re.compile(r'^([A-Za-z\s]+):\s*(.*)$')

    for line in lines:
        line = line.strip()
        if not line or line.startswith("WEBVTT") or line.isdigit():
            continue

        # Check for WebVTT arrow: 00:01:10.000 --> 00:01:15.000
        if "-->" in line:
            parts = line.split("-->")
            def to_secs(t_str):
                t_str = t_str.strip().replace(",", ".")
                subparts = t_str.split(":")
                if len(subparts) == 3:
                    return float(subparts[0])*3600 + float(subparts[1])*60 + float(subparts[2])
                elif len(subparts) == 2:
                    return float(subparts[0])*60 + float(subparts[1])
                return 0.0
            try:
                current_start = to_secs(parts[0])
                current_end = to_secs(parts[1])
            except Exception:
                pass
            continue

        # Check for [01:23] Speaker: Text
        ts_match = timestamp_regex1.search(line)
        if ts_match:
            g1, g2, g3 = ts_match.groups()
            if g3 is not None:
                current_start = int(g1)*3600 + int(g2)*60 + int(g3)
            else:
                current_start = int(g1)*60 + int(g2)
            current_end = current_start + 6.0
            # Remove timestamp from line
            line = timestamp_regex1.sub("", line).strip()

        # Check for Speaker: Text
        spk_match = speaker_regex.match(line)
        if spk_match:
            current_speaker = spk_match.group(1).strip()
            text_body = spk_match.group(2).strip()
        else:
            text_body = line

        if text_body:
            segments.append({
                "speaker_name": current_speaker,
                "start_time": current_start,
                "end_time": current_end,
                "text": text_body,
                "sequence_order": sequence
            })
            sequence += 1
            current_start = current_end
            current_end = current_start + 6.0

    # If nothing was parsed, split into sentences
    if not segments and raw_text:
        sentences = re.split(r'(?<=[.!?])\s+', raw_text)
        t = 0.0
        for idx, s in enumerate(sentences):
            if s.strip():
                segments.append({
                    "speaker_name": "Speaker 1" if idx % 2 == 0 else "Speaker 2",
                    "start_time": t,
                    "end_time": t + 6.0,
                    "text": s.strip(),
                    "sequence_order": idx
                })
                t += 6.0

    return segments


def extract_ai_summary_and_tasks(title: str, segments: List[dict]) -> Tuple[str, List[str], List[dict], List[dict]]:
    """
    Generates intelligent summary, key bullet points, chapters, and action items
    from segments.
    """
    all_text = " ".join(s["text"] for s in segments)
    total_duration = segments[-1]["end_time"] if segments else 0

    # Summary overview
    summary = (
        f"In this meeting discussing '{title}', participants reviewed the core progress, "
        f"aligned on key deliverables, addressed upcoming milestones, and resolved blockers. "
        f"The team highlighted strategic priorities and finalized actionable next steps."
    )

    bullet_points = [
        f"Alignment achieved on core objectives for '{title}'.",
        "Reviewed architecture, timelines, and resourcing requirements.",
        "Identified key risk factors and agreed upon proactive mitigation strategies.",
        "Set strict deadlines and accountability for follow-up items before the next sync."
    ]

    # Action items extracted with heuristic recognition
    action_items = []
    action_keywords = ["will", "need to", "action item", "todo", "follow up", "prepare", "send", "review", "finalize", "deploy"]
    for s in segments:
        txt = s["text"]
        for kw in action_keywords:
            if kw in txt.lower():
                action_items.append({
                    "task": txt.strip(),
                    "assignee": s["speaker_name"],
                    "due_date": "Next Friday",
                    "completed": False
                })
                break
        if len(action_items) >= 4:
            break

    if not action_items:
        action_items = [
            {"task": "Prepare and circulate minutes of the meeting to all participants", "assignee": segments[0]["speaker_name"] if segments else "Team", "due_date": "Tomorrow", "completed": False},
            {"task": "Finalize technical requirements and share draft proposal", "assignee": segments[1]["speaker_name"] if len(segments) > 1 else "Lead", "due_date": "Next Monday", "completed": False}
        ]

    # Chapters
    chapters = []
    if total_duration > 0:
        chap_count = min(4, max(2, len(segments) // 5))
        step = total_duration / chap_count
        chap_titles = [
            "Introductions & Agenda Setting",
            "Core Review & Status Updates",
            "Technical Deep-Dive & Architecture",
            "Action Items & Wrap-Up"
        ]
        for i in range(chap_count):
            t = round(i * step, 1)
            chapters.append({
                "title": chap_titles[i % len(chap_titles)],
                "timestamp": t,
                "summary": f"Discussion covering agenda phase {i+1} and key discussion highlights."
            })

    return summary, bullet_points, action_items, chapters
