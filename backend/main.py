import os
import json
import re
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


# --- Ask Fred AI Chat Grounded in Transcript (Enhanced) ---

@app.post("/api/meetings/{meeting_id}/chat", response_model=schemas.ChatMessageResponse, tags=["AI Chat"])
def ask_fred_chat(meeting_id: str, chat_req: schemas.AskFredRequest, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user_q = chat_req.question.strip()
    crud.add_chat_message(db, meeting_id, schemas.ChatMessageCreate(role="user", content=user_q))

    q_lower = user_q.lower()
    answer = ""

    # Parse bullet points if present
    bullets_list = []
    if meeting.bullet_points:
        try:
            b_data = json.loads(meeting.bullet_points)
            if isinstance(b_data, list):
                bullets_list = b_data
        except Exception:
            bullets_list = [l.strip("- ") for l in meeting.bullet_points.splitlines() if l.strip()]

    # Case 1: Deadlines, Dates & Timeline Questions
    if any(k in q_lower for k in ["deadline", "due date", "due", "when is", "timeline", "schedule"]):
        if meeting.action_items:
            deadlines = [f"• **{a.task}**: Due **{a.due_date or 'TBD'}** (Assigned to: {a.assignee or 'Team'})" for a in meeting.action_items if a.due_date]
            if deadlines:
                answer = "Here are the key deadlines and commitments tracked for this meeting:\n\n" + "\n".join(deadlines)
            else:
                answer = f"The action items for '{meeting.title}' do not have explicit calendar deadlines, but the following tasks are pending:\n\n" + "\n".join([f"• {a.task} ({a.assignee or 'Unassigned'})" for a in meeting.action_items])
        else:
            answer = f"No formal deadlines were set during this discussion. The team agreed on general deliverables outlined in the meeting summary."

    # Case 2: Technical Decisions & Architecture
    elif any(k in q_lower for k in ["technical", "decision", "architecture", "stack", "tech", "infrastructure", "system", "code"]):
        # Check if engineering topics or specific technical transcript lines exist
        tech_keywords = ["queue", "database", "sqlite", "indexing", "fts", "api", "latency", "frontend", "backend", "next.js", "soc2", "compliance", "diarization", "crm", "salesforce", "hubspot", "refactor", "worker"]
        relevant_tech = [s for s in meeting.transcript_segments if any(tk in s.text.lower() for tk in tech_keywords)]
        
        tech_takeaways = [b for b in bullets_list if any(tk in b.lower() for tk in ["architect", "technical", "database", "api", "queue", "system", "index", "frontend", "backend", "soc2", "crm"])]

        if tech_takeaways:
            bullets_str = "\n".join([f"• {t}" for t in tech_takeaways])
            answer = f"Key technical decisions and architectural points for '{meeting.title}':\n\n{bullets_str}"
        elif relevant_tech:
            quotes = "\n".join([f"• **{s.speaker_name}**: \"{s.text}\"" for s in relevant_tech[:3]])
            answer = f"The following technical decisions were discussed:\n\n{quotes}"
        else:
            answer = f"During '{meeting.title}', the technical discussion centered on: {meeting.summary_overview}"

    # Case 3: Summary / Overview / Recap
    elif any(k in q_lower for k in ["summarize", "summary", "recap", "overview", "what happened", "brief", "key takeaway"]):
        overview = meeting.summary_overview or "The meeting covered project status and key milestones."
        if bullets_list:
            bullets_str = "\n".join([f"• {b}" for b in bullets_list])
            answer = f"**Executive Summary:**\n{overview}\n\n**Key Takeaways:**\n{bullets_str}"
        else:
            answer = f"**Meeting Overview:**\n{overview}"

    # Case 4: Action Items / Tasks / Next Steps
    elif any(k in q_lower for k in ["action item", "action", "task", "todo", "next step", "to do", "assigned"]):
        if meeting.action_items:
            items_str = "\n".join([
                f"• [{'x' if a.completed else ' '}] **{a.task}** — Assignee: *{a.assignee or 'Unassigned'}* (Due: {a.due_date or 'TBD'})"
                for a in meeting.action_items
            ])
            answer = f"Here is the status of all action items for this meeting:\n\n{items_str}"
        else:
            answer = "There are no pending action items recorded for this meeting."

    # Case 5: Participants / Who Spoke / Talk Time
    elif any(k in q_lower for k in ["who spoke", "participant", "attend", "who was", "speaker", "talk time"]):
        if meeting.participants:
            sorted_p = sorted(meeting.participants, key=lambda x: x.talk_time_percentage or 0, reverse=True)
            plist = "\n".join([f"• **{p.name}**: {p.talk_time_percentage or 0}% talk time ({p.email or 'N/A'})" for p in sorted_p])
            top_speaker = sorted_p[0]
            answer = f"The meeting participants and their talk-time breakdown:\n\n{plist}\n\n**{top_speaker.name}** had the highest share of speaking time ({top_speaker.talk_time_percentage}%)."
        else:
            answer = f"Participants for '{meeting.title}' were not explicitly recorded."

    # Case 6: Specific Speaker Questions (e.g. "What did David say?", "Liam's points", "What did Sarah mention?")
    else:
        matched_speaker = None
        for p in meeting.participants:
            first_name = p.name.split()[0].lower()
            if first_name in q_lower or p.name.lower() in q_lower:
                matched_speaker = p
                break

        if matched_speaker:
            spk_segments = [s for s in meeting.transcript_segments if matched_speaker.name.lower() in s.speaker_name.lower()]
            if spk_segments:
                quotes = "\n".join([f"• [{int(s.start_time//60):02d}:{int(s.start_time%60):02d}] \"{s.text}\"" for s in spk_segments[:4]])
                answer = f"Here is what **{matched_speaker.name}** contributed to the discussion ({matched_speaker.talk_time_percentage}% talk time):\n\n{quotes}"
            else:
                answer = f"**{matched_speaker.name}** attended the meeting but no specific statements were attributed to them."

        # Case 7: Semantic Keyword Search in Transcripts
        else:
            stop_words = {"what", "is", "the", "are", "about", "did", "they", "this", "that", "how", "why", "can", "you", "tell", "me", "there"}
            query_words = [w for w in re.findall(r'\b[a-z]{3,}\b', q_lower) if w not in stop_words]
            
            scored_segments = []
            for s in meeting.transcript_segments:
                s_lower = s.text.lower()
                matches = sum(1 for w in query_words if w in s_lower)
                if matches > 0:
                    scored_segments.append((matches, s))

            scored_segments.sort(key=lambda x: x[0], reverse=True)

            if scored_segments:
                top_segments = [item[1] for item in scored_segments[:3]]
                quotes = "\n".join([f"• **{s.speaker_name}** [{int(s.start_time//60):02d}:{int(s.start_time%60):02d}]: \"{s.text}\"" for s in top_segments])
                answer = f"Relevant excerpts from the transcript matching your query:\n\n{quotes}"
            else:
                # Case 8: Intelligent Chapter-Aware Context Fallback
                chap_titles = [f"• **{c.title}** ({int(c.timestamp//60):02d}:{int(c.timestamp%60):02d})" for c in meeting.topic_chapters]
                chaps_str = "\n".join(chap_titles) if chap_titles else "General Agenda"
                answer = (
                    f"Regarding your query about '{user_q}', the discussion in '{meeting.title}' covers:\n\n"
                    f"{meeting.summary_overview}\n\n"
                    f"**Meeting Agenda Chapters:**\n{chaps_str}\n\n"
                    f"You can also ask specific questions like: *\"What are the deadlines?\"*, *\"Who spoke the most?\"*, or *\"What did {meeting.participants[0].name.split()[0]} say?\"*."
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
