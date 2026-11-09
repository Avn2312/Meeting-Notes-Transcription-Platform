import os
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import crud

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fireflies.ai Clone API",
    description="Backend API for meeting transcription, post-meeting AI analysis, and transcript search.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve sample audio files statically
audio_dir = os.path.join(os.path.dirname(__file__), "sample_audio")
os.makedirs(audio_dir, exist_ok=True)
app.mount("/api/audio", StaticFiles(directory=audio_dir), name="audio")


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Fireflies Clone API", "version": "1.0.0"}


# --- Meetings Endpoints ---

@app.get("/api/meetings", response_model=List[schemas.MeetingListItemResponse], tags=["Meetings"])
def list_meetings(
    search: Optional[str] = Query(None, description="Search by title or summary"),
    speaker: Optional[str] = Query(None, description="Filter by speaker name"),
    sort_by: str = Query("newest", description="Sort order: newest, oldest, duration_desc, title_asc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    search_str = search if isinstance(search, str) else None
    speaker_str = speaker if isinstance(speaker, str) else None
    sort_str = sort_by if isinstance(sort_by, str) else "newest"
    skip_int = skip if isinstance(skip, int) else 0
    limit_int = limit if isinstance(limit, int) else 50

    meetings = crud.get_meetings(
        db, search=search_str, speaker=speaker_str, sort_by=sort_str, skip=skip_int, limit=limit_int
    )
    result = []
    for m in meetings:
        action_count = len(m.action_items)
        pending_count = sum(1 for a in m.action_items if not a.completed)
        transcript_preview = m.transcript_segments[0].text if m.transcript_segments else ""
        
        result.append(schemas.MeetingListItemResponse(
            id=m.id,
            title=m.title,
            date=m.date,
            duration_seconds=m.duration_seconds,
            audio_url=m.audio_url,
            summary_overview=m.summary_overview,
            sentiment=m.sentiment or "positive",
            created_at=m.created_at,
            updated_at=m.updated_at,
            participants=[schemas.ParticipantResponse.model_validate(p) for p in m.participants],
            action_items_count=action_count,
            pending_action_items_count=pending_count,
            transcript_preview=transcript_preview
        ))
    return result


@app.get("/api/meetings/{meeting_id}", response_model=schemas.MeetingDetailResponse, tags=["Meetings"])
def get_meeting_detail(meeting_id: str, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return schemas.MeetingDetailResponse.model_validate(meeting)


@app.post("/api/meetings", response_model=schemas.MeetingDetailResponse, tags=["Meetings"])
def create_meeting_endpoint(meeting_in: schemas.MeetingCreate, db: Session = Depends(get_db)):
    created = crud.create_meeting(db, meeting_in)
    return schemas.MeetingDetailResponse.model_validate(created)


@app.post("/api/meetings/upload", response_model=schemas.MeetingDetailResponse, tags=["Meetings"])
async def upload_or_paste_transcript(
    title: str = Form(...),
    transcript_text: Optional[str] = Form(None),
    transcript_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    content = ""
    if transcript_file and transcript_file.filename:
        file_bytes = await transcript_file.read()
        content = file_bytes.decode("utf-8", errors="ignore")
    elif transcript_text:
        content = transcript_text
    else:
        raise HTTPException(status_code=400, detail="Must provide either transcript_text or transcript_file")

    parsed_segments = crud.parse_transcript_text(content)
    if not parsed_segments:
        raise HTTPException(status_code=400, detail="Could not parse any valid transcript content from input.")

    summary, bullet_points, action_items, chapters = crud.extract_ai_summary_and_tasks(title, parsed_segments)
    
    # Calculate speaker statistics
    speakers = {}
    for s in parsed_segments:
        spk = s["speaker_name"]
        dur = s["end_time"] - s["start_time"]
        speakers[spk] = speakers.get(spk, 0.0) + dur

    total_time = sum(speakers.values()) or 1.0
    colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"]
    participants = []
    for idx, (spk_name, dur) in enumerate(speakers.items()):
        participants.append(schemas.ParticipantCreate(
            name=spk_name,
            email=f"{spk_name.lower().replace(' ', '.')}@example.com",
            avatar_color=colors[idx % len(colors)],
            talk_time_percentage=round((dur / total_time) * 100, 1)
        ))

    total_duration = int(parsed_segments[-1]["end_time"]) if parsed_segments else 60

    meeting_create = schemas.MeetingCreate(
        title=title,
        duration_seconds=total_duration,
        audio_url="/api/audio/sample.wav",
        summary_overview=summary,
        bullet_points=json.dumps(bullet_points),
        sentiment="positive",
        participants=participants,
        transcript_segments=[schemas.TranscriptSegmentCreate(**s) for s in parsed_segments],
        action_items=[schemas.ActionItemCreate(**a) for a in action_items],
        topic_chapters=[schemas.TopicChapterCreate(**c) for c in chapters]
    )

    created = crud.create_meeting(db, meeting_create)
    return schemas.MeetingDetailResponse.model_validate(created)


@app.patch("/api/meetings/{meeting_id}", response_model=schemas.MeetingDetailResponse, tags=["Meetings"])
def update_meeting_metadata(meeting_id: str, update_in: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    updated = crud.update_meeting(db, meeting_id, update_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return schemas.MeetingDetailResponse.model_validate(updated)


@app.delete("/api/meetings/{meeting_id}", tags=["Meetings"])
def delete_meeting_endpoint(meeting_id: str, db: Session = Depends(get_db)):
    success = crud.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"message": "Meeting deleted successfully", "id": meeting_id}


# --- Action Items Endpoints ---

@app.post("/api/meetings/{meeting_id}/action-items", response_model=schemas.ActionItemResponse, tags=["Action Items"])
def create_action_item(meeting_id: str, item_in: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    item = crud.add_action_item(db, meeting_id, item_in)
    return schemas.ActionItemResponse.model_validate(item)


@app.patch("/api/action-items/{item_id}", response_model=schemas.ActionItemResponse, tags=["Action Items"])
def update_action_item_endpoint(item_id: str, update_in: schemas.ActionItemUpdate, db: Session = Depends(get_db)):
    updated = crud.update_action_item(db, item_id, update_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Action item not found")
    return schemas.ActionItemResponse.model_validate(updated)


@app.delete("/api/action-items/{item_id}", tags=["Action Items"])
def delete_action_item_endpoint(item_id: str, db: Session = Depends(get_db)):
    success = crud.delete_action_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Action item not found")
    return {"message": "Action item deleted successfully"}


# --- Highlights / Soundbites ---

@app.post("/api/meetings/{meeting_id}/highlights", response_model=schemas.HighlightNoteResponse, tags=["Highlights"])
def create_highlight_endpoint(meeting_id: str, note_in: schemas.HighlightNoteCreate, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    created = crud.add_highlight(db, meeting_id, note_in)
    return schemas.HighlightNoteResponse.model_validate(created)


@app.delete("/api/highlights/{highlight_id}", tags=["Highlights"])
def delete_highlight_endpoint(highlight_id: str, db: Session = Depends(get_db)):
    success = crud.delete_highlight(db, highlight_id)
    if not success:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return {"message": "Highlight deleted successfully"}


# --- Ask Fred AI Chat Grounded in Transcript ---

@app.post("/api/meetings/{meeting_id}/chat", response_model=schemas.ChatMessageResponse, tags=["AI Chat"])
def ask_fred_chat(meeting_id: str, chat_req: schemas.AskFredRequest, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user_q = chat_req.question.strip()
    # Save user message
    crud.add_chat_message(db, meeting_id, schemas.ChatMessageCreate(role="user", content=user_q))

    # Transcript context analysis
    transcript_text = "\n".join([f"[{s.speaker_name}]: {s.text}" for s in meeting.transcript_segments])
    action_items_text = ", ".join([f"{a.task} ({a.assignee or 'Unassigned'})" for a in meeting.action_items])

    # Smart response generation grounded in transcript
    q_lower = user_q.lower()
    answer = ""

    # Check for speaker-specific questions
    matching_speaker_segments = []
    for s in meeting.transcript_segments:
        if s.speaker_name.lower() in q_lower or any(word in s.text.lower() for word in q_lower.split() if len(word) > 4):
            matching_speaker_segments.append(s)

    if "action" in q_lower or "task" in q_lower or "todo" in q_lower:
        if meeting.action_items:
            items_str = "\n".join([f"• {a.task} (Assignee: {a.assignee or 'Team'}, Due: {a.due_date or 'TBD'})" for a in meeting.action_items])
            answer = f"Here are the action items captured from the meeting:\n{items_str}"
        else:
            answer = "No outstanding action items were recorded for this meeting."
    elif "who" in q_lower or "participant" in q_lower or "attend" in q_lower:
        plist = ", ".join([f"{p.name} ({p.talk_time_percentage}% talk time)" for p in meeting.participants])
        answer = f"The meeting was attended by: {plist}."
    elif "summary" in q_lower or "overview" in q_lower or "about" in q_lower:
        answer = meeting.summary_overview or "This meeting focused on team coordination, roadmap alignment, and technical deliverables."
    elif matching_speaker_segments:
        top_matches = matching_speaker_segments[:3]
        snippets = " ".join([f"\"{m.speaker_name} noted: '{m.text}'\"" for m in top_matches])
        answer = f"Based on the transcript: {snippets}"
    else:
        answer = (
            f"According to the transcript of '{meeting.title}', the team reviewed core progress, "
            f"discussed architectural milestones, and assigned follow-ups. "
            f"Key discussion focused on: {meeting.summary_overview[:150]}..."
        )

    assistant_msg = crud.add_chat_message(db, meeting_id, schemas.ChatMessageCreate(role="assistant", content=answer))
    return schemas.ChatMessageResponse.model_validate(assistant_msg)


# --- Global Search Across Everything ---

@app.get("/api/search", response_model=List[schemas.GlobalSearchResult], tags=["Search"])
def global_search_endpoint(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    query_str = q if isinstance(q, str) else str(q)
    return crud.global_search(db, query_str)


# --- Export Meeting Endpoint (Markdown, Text, JSON) ---

@app.get("/api/meetings/{meeting_id}/export", tags=["Export"])
def export_meeting(meeting_id: str, format: str = Query("markdown", description="Format: markdown, txt, or json"), db: Session = Depends(get_db)):
    fmt = format if isinstance(format, str) else "markdown"
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if fmt == "json":
        data = schemas.MeetingDetailResponse.model_validate(meeting).model_dump(mode="json")
        return Response(content=json.dumps(data, indent=2), media_type="application/json")

    date_str = meeting.date.strftime("%B %d, %Y at %I:%M %p UTC")
    participants_str = ", ".join([p.name for p in meeting.participants])
    
    if fmt == "txt":
        lines = [
            f"MEETING TITLE: {meeting.title}",
            f"DATE: {date_str}",
            f"DURATION: {meeting.duration_seconds // 60}m {meeting.duration_seconds % 60}s",
            f"PARTICIPANTS: {participants_str}",
            "-" * 50,
            "OVERVIEW:",
            meeting.summary_overview or "N/A",
            "-" * 50,
            "ACTION ITEMS:",
        ]
        for item in meeting.action_items:
            status = "[x]" if item.completed else "[ ]"
            lines.append(f"{status} {item.task} (Assignee: {item.assignee or 'None'}, Due: {item.due_date or 'None'})")
        lines.append("-" * 50)
        lines.append("TRANSCRIPT:")
        for s in meeting.transcript_segments:
            mins = int(s.start_time // 60)
            secs = int(s.start_time % 60)
            lines.append(f"[{mins:02d}:{secs:02d}] {s.speaker_name}: {s.text}")

        return PlainTextResponse(content="\n".join(lines))

    # Default: Markdown
    md_lines = [
        f"# {meeting.title}",
        f"\n**Date:** {date_str}  ",
        f"**Duration:** {meeting.duration_seconds // 60} min {meeting.duration_seconds % 60} sec  ",
        f"**Participants:** {participants_str}  \n",
        "## Executive Summary",
        meeting.summary_overview or "N/A",
        "\n### Key Takeaways",
    ]
    try:
        if meeting.bullet_points:
            points = json.loads(meeting.bullet_points)
            for pt in points:
                md_lines.append(f"- {pt}")
    except Exception:
        pass

    md_lines.append("\n## Action Items")
    for item in meeting.action_items:
        check = "x" if item.completed else " "
        md_lines.append(f"- [{check}] **{item.task}** — *Assignee: {item.assignee or 'Unassigned'}* (Due: {item.due_date or 'N/A'})")

    md_lines.append("\n## Chapters & Outline")
    for c in meeting.topic_chapters:
        mins = int(c.timestamp // 60)
        secs = int(c.timestamp % 60)
        md_lines.append(f"- **`{mins:02d}:{secs:02d}` {c.title}**: {c.summary}")

    md_lines.append("\n## Transcript")
    for s in meeting.transcript_segments:
        mins = int(s.start_time // 60)
        secs = int(s.start_time % 60)
        md_lines.append(f"**`[{mins:02d}:{secs:02d}]` {s.speaker_name}:** {s.text}\n")

    return Response(
        content="\n".join(md_lines),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{meeting.title.replace(" ", "_")}.md"'}
    )
