import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
import models
import schemas
import crud
from seed_data import get_seed_data

def init_db(reset: bool = True):
    print("Initializing database...")
    if reset:
        print("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
    
    print("Creating tables according to schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_count = db.query(models.Meeting).count()
        if existing_count > 0 and not reset:
            print(f"Database already contains {existing_count} meetings. Skipping seed.")
            return

        print("Seeding sample meetings...")
        raw_meetings = get_seed_data()
        for m_data in raw_meetings:
            meeting_in = schemas.MeetingCreate(
                title=m_data["title"],
                date=m_data["date"],
                duration_seconds=m_data["duration_seconds"],
                audio_url=m_data.get("audio_url"),
                summary_overview=m_data.get("summary_overview"),
                bullet_points=m_data.get("bullet_points"),
                sentiment=m_data.get("sentiment", "positive"),
                participants=[schemas.ParticipantCreate(**p) for p in m_data.get("participants", [])],
                transcript_segments=[schemas.TranscriptSegmentCreate(**s) for s in m_data.get("transcript_segments", [])],
                action_items=[schemas.ActionItemCreate(**a) for a in m_data.get("action_items", [])],
                topic_chapters=[schemas.TopicChapterCreate(**c) for c in m_data.get("topic_chapters", [])]
            )
            created = crud.create_meeting(db, meeting_in)
            print(f" -> Created meeting: '{created.title}' (ID: {created.id}) with {len(created.transcript_segments)} segments")

            # Add sample highlights & chat messages to the first meeting for showcase
            if created.title.startswith("Q4 Engineering"):
                crud.add_highlight(db, created.id, schemas.HighlightNoteCreate(
                    selected_text="SQLite indexing strategy approved for sub-100ms full-text search across transcripts.",
                    note="High priority technical architecture decision.",
                    color="purple"
                ))
                crud.add_chat_message(db, created.id, schemas.ChatMessageCreate(
                    role="user",
                    content="What did David Miller say about the database indexing strategy?"
                ))
                crud.add_chat_message(db, created.id, schemas.ChatMessageCreate(
                    role="assistant",
                    content="David Miller mentioned that he will take ownership of the database schema and query indexes, ensuring cascade deletes and optimizing SQLite queries for sub-100ms search latency."
                ))

        print("Successfully seeded all sample meetings!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db(reset=True)

