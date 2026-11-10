import sys
import os
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models
import schemas
import crud
import main

def test_backend_end_to_end():
    print("=== RUNNING FASTAPI END-TO-END VERIFICATION ===")
    db = SessionLocal()

    try:
        # 1. Verify health check
        health = main.health_check()
        assert health["status"] == "ok"
        print("✓ Health check endpoint verified:", health)

        # 2. List meetings
        meetings = main.list_meetings(db=db)
        assert len(meetings) >= 4
        print(f"✓ List meetings verified: Found {len(meetings)} meetings")
        first_m = meetings[0]

        # 3. Get single meeting detail
        detail = main.get_meeting_detail(first_m.id, db=db)
        assert detail.id == first_m.id
        assert len(detail.transcript_segments) > 0
        assert len(detail.action_items) > 0
        assert len(detail.topic_chapters) > 0
        print(f"✓ Detail view verified: {len(detail.transcript_segments)} segments, {len(detail.action_items)} action items")

        # 4. Search and filter
        filtered = main.list_meetings(search="Engineering", db=db)
        assert len(filtered) >= 1
        print(f"✓ Search filter verified: Found {len(filtered)} matches for 'Engineering'")

        # 5. Ingestion & Auto-parsing
        raw_transcript = (
            "[00:00] Alice: Welcome everyone to the quarterly design sync.\n"
            "[00:15] Bob: Thanks Alice! I think the audio seekbar is working smoothly.\n"
            "[00:30] Alice: Agreed. We will finalize the dark mode toggle before Friday."
        )
        parsed = crud.parse_transcript_text(raw_transcript)
        assert len(parsed) == 3
        assert parsed[0]["speaker_name"] == "Alice"
        assert parsed[1]["start_time"] == 15.0
        print(f"✓ Transcript parser verified: Parsed {len(parsed)} timed segments")

        summary, bullets, actions, chapters = crud.extract_ai_summary_and_tasks("Design Sync", parsed)
        assert len(summary) > 20
        assert len(bullets) >= 2
        assert len(actions) >= 1
        print(f"✓ AI summary extraction verified: Generated summary and {len(actions)} tasks")

        # Create meeting from parsed
        new_meeting_in = schemas.MeetingCreate(
            title="Design Sync & Audio Player Review",
            duration_seconds=45,
            audio_url="/api/audio/sample.wav",
            summary_overview=summary,
            bullet_points=json.dumps(bullets),
            sentiment="positive",
            participants=[
                schemas.ParticipantCreate(name="Alice", talk_time_percentage=50.0),
                schemas.ParticipantCreate(name="Bob", talk_time_percentage=50.0)
            ],
            transcript_segments=[schemas.TranscriptSegmentCreate(**s) for s in parsed],
            action_items=[schemas.ActionItemCreate(**a) for a in actions],
            topic_chapters=[schemas.TopicChapterCreate(**c) for c in chapters]
        )
        created_meeting = crud.create_meeting(db, new_meeting_in)
        new_id = created_meeting.id
        print(f"✓ Meeting creation verified: Created meeting ID {new_id}")

        # 5b. Verify Meeting Metadata Update (Title and Participants)
        updated_meeting = main.update_meeting_metadata(
            new_id,
            schemas.MeetingUpdate(
                title="Design Sync & Audio Review (Updated)",
                participants=[
                    schemas.ParticipantCreate(name="Alice Johnson", talk_time_percentage=60.0),
                    schemas.ParticipantCreate(name="Bob Smith", talk_time_percentage=40.0)
                ]
            ),
            db=db
        )
        assert updated_meeting.title == "Design Sync & Audio Review (Updated)"
        assert len(updated_meeting.participants) == 2
        assert updated_meeting.participants[0].name in ["Alice Johnson", "Bob Smith"]
        print(f"✓ Meeting metadata update (Title & Participants) verified")

        # 6. Action Items CRUD
        new_item = main.create_action_item(
            new_id,
            schemas.ActionItemCreate(task="Test action item creation", assignee="Alice"),
            db=db
        )
        assert new_item.task == "Test action item creation"
        print(f"✓ Action item creation verified: {new_item.id}")

        updated_item = main.update_action_item_endpoint(
            new_item.id,
            schemas.ActionItemUpdate(completed=True),
            db=db
        )
        assert updated_item.completed is True
        print(f"✓ Action item update (completed=True) verified")

        # 7. Highlights / Soundbites CRUD
        new_hl = main.create_highlight_endpoint(
            new_id,
            schemas.HighlightNoteCreate(selected_text="audio seekbar is working smoothly", note="Important feedback"),
            db=db
        )
        assert new_hl.id is not None
        print(f"✓ Highlight / Soundbite creation verified: {new_hl.id}")

        # 8. Ask Fred AI chat
        chat_res = main.ask_fred_chat(
            new_id,
            schemas.AskFredRequest(question="What did Alice say about the dark mode toggle?"),
            db=db
        )
        assert chat_res.role == "assistant"
        assert len(chat_res.content) > 10
        print(f"✓ Ask Fred AI Q&A verified: Answered -> '{chat_res.content[:80]}...'")

        # 9. Global Search
        search_res = main.global_search_endpoint(q="seekbar", db=db)
        assert len(search_res) >= 1
        print(f"✓ Global search across meetings verified: Found {len(search_res)} occurrences")

        # 10. Export formats
        md_export = main.export_meeting(new_id, format="markdown", db=db)
        assert b"Design Sync" in md_export.body
        txt_export = main.export_meeting(new_id, format="txt", db=db)
        assert "MEETING TITLE" in txt_export.body.decode()
        json_export = main.export_meeting(new_id, format="json", db=db)
        assert b"transcript_segments" in json_export.body
        print("✓ Multi-format Export verified: Markdown, Plain Text, and JSON generated successfully")

        # 11. Delete meeting cascade
        main.delete_meeting_endpoint(new_id, db=db)
        del_check = crud.get_meeting(db, new_id)
        assert del_check is None
        print("✓ Cascaded delete verified: Meeting and all associated records deleted")

        print("\n🎉 ALL 11 BACKEND FEATURES VERIFIED AND PASSING 100%! 🎉\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_backend_end_to_end()

