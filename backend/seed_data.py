import json
from datetime import datetime, timedelta, timezone

def get_seed_data():
    now = datetime.now(timezone.utc)
    
    return [
        {
            "title": "Q4 Engineering Sprint Planning & Architecture Review",
            "date": now - timedelta(days=1, hours=2),
            "duration_seconds": 120,
            "audio_url": "/api/audio/sample.wav",
            "summary_overview": "The engineering team reviewed Q4 architectural milestones, focusing on transitioning the transcript processing pipeline to an asynchronous event-driven queue. The team discussed database indexing optimizations for sub-second global search and confirmed the rollout timeline for the Next.js 14 frontend migration.",
            "bullet_points": json.dumps([
                "Agreed to decouple transcription ingestion from the web thread using Redis/Celery queue.",
                "SQLite indexing strategy approved for sub-100ms full-text search across transcripts.",
                "Frontend team to finish the interactive audio seekbar integration with React 19.",
                "Target production release date locked for November 25th."
            ]),
            "sentiment": "positive",
            "participants": [
                {"name": "Sarah Connor", "email": "sarah.connor@fireflies-clone.io", "avatar_color": "#6366F1", "talk_time_percentage": 42.0},
                {"name": "David Miller", "email": "david.m@fireflies-clone.io", "avatar_color": "#10B981", "talk_time_percentage": 35.0},
                {"name": "Elena Rostova", "email": "elena.r@fireflies-clone.io", "avatar_color": "#F59E0B", "talk_time_percentage": 23.0}
            ],
            "topic_chapters": [
                {"title": "Sprint Retrospective & Velocity", "timestamp": 0.0, "summary": "Reviewing last sprint's completion rate and throughput bottlenecks."},
                {"title": "Pipeline Architecture Refactor", "timestamp": 35.0, "summary": "Transitioning to asynchronous workers for transcript chunking."},
                {"title": "Database Indexing & SQLite Performance", "timestamp": 72.0, "summary": "Full-text indexing benchmark results and query latency."},
                {"title": "Action Items & Timeline Alignment", "timestamp": 100.0, "summary": "Final assignment of tasks and deadline commitments."}
            ],
            "action_items": [
                {"task": "Benchmark SQLite FTS5 query latency against 100k segments", "assignee": "David Miller", "due_date": "Nov 15", "completed": True},
                {"task": "Implement bidirectional seekbar state sync in audio player component", "assignee": "Sarah Connor", "due_date": "Nov 18", "completed": False},
                {"task": "Prepare Docker Compose manifest for backend and frontend deployment", "assignee": "Elena Rostova", "due_date": "Nov 20", "completed": False}
            ],
            "transcript_segments": [
                {"speaker_name": "Sarah Connor", "start_time": 0.0, "end_time": 9.5, "text": "Good morning team. Let's kick off our Q4 sprint planning. Today our main agenda is the transcript pipeline architecture and search indexing.", "sequence_order": 0},
                {"speaker_name": "David Miller", "start_time": 10.0, "end_time": 22.0, "text": "Thanks Sarah. From the backend side, our current challenge is latency when uploading large meeting audio files. We need an asynchronous job worker so the user UI stays responsive.", "sequence_order": 1},
                {"speaker_name": "Elena Rostova", "start_time": 22.5, "end_time": 34.0, "text": "I agree. We can use a lightweight queue or background task pattern. The frontend can poll or receive a websocket update when processing finishes.", "sequence_order": 2},
                {"speaker_name": "Sarah Connor", "start_time": 35.0, "end_time": 46.5, "text": "That makes total sense. Next, let's talk about the interactive transcript view. Users want to click on any sentence and immediately seek the media player to that point.", "sequence_order": 3},
                {"speaker_name": "David Miller", "start_time": 47.0, "end_time": 60.0, "text": "Right, each segment has start_time and end_time timestamps. We can bind an onTimeUpdate listener on the audio element to highlight the current transcript block in real-time.", "sequence_order": 4},
                {"speaker_name": "Elena Rostova", "start_time": 60.5, "end_time": 71.0, "text": "And when the user selects text in the transcript, we should let them create a soundbite snippet or highlight with custom notes. Fireflies does this exceptionally well.", "sequence_order": 5},
                {"speaker_name": "Sarah Connor", "start_time": 72.0, "end_time": 84.0, "text": "Brilliant. Let's make sure the search bar highlights matching occurrences with a distinct yellow badge and auto-scrolls the active segment into view.", "sequence_order": 6},
                {"speaker_name": "David Miller", "start_time": 84.5, "end_time": 99.0, "text": "I'll take ownership of the database schema and query indexes. We'll ensure cascade deletes for meetings and their child records.", "sequence_order": 7},
                {"speaker_name": "Sarah Connor", "start_time": 100.0, "end_time": 120.0, "text": "Great! Let's wrap up. David has the database tasks, Elena has the API endpoints, and I'll finish the responsive Next.js layout. Thanks everyone!", "sequence_order": 8}
            ]
        },
        {
            "title": "Fireflies Product Design Sync: Realtime Soundbites & AI Summary",
            "date": now - timedelta(days=2, hours=5),
            "duration_seconds": 120,
            "audio_url": "/api/audio/sample.wav",
            "summary_overview": "Design and Product sync to critique the Fireflies clone layout. The team emphasized mimicking Fireflies' clean purple/indigo branding, collapsible navigation drawer, structured AI summary cards, and quick action buttons for exporting transcripts to Markdown and PDF.",
            "bullet_points": json.dumps([
                "Approved color palette using Violet-600 (#7C3AED) as primary brand color.",
                "AI summary panel structured into Overview, Key Takeaways, Chapters, and Action Items.",
                "Export dialog supports Markdown, PDF format, and plain text copying.",
                "Placeholder modals designed for 'Live Bot Call Join' and 'Google Calendar Integration'."
            ]),
            "sentiment": "positive",
            "participants": [
                {"name": "Maya Patel", "email": "maya.p@fireflies-clone.io", "avatar_color": "#EC4899", "talk_time_percentage": 50.0},
                {"name": "Alex Vance", "email": "alex.v@fireflies-clone.io", "avatar_color": "#3B82F6", "talk_time_percentage": 50.0}
            ],
            "topic_chapters": [
                {"title": "UI Visual Polish & Design System", "timestamp": 0.0, "summary": "Review of typography, spacing, and Fireflies brand aesthetics."},
                {"title": "AI Summary Tabs & Action Checklist", "timestamp": 40.0, "summary": "Designing clean tabs for Summary, Transcript, and Fred Q&A."},
                {"title": "Export Workflows & Modals", "timestamp": 85.0, "summary": "Specification for PDF, Markdown, and TXT exports."}
            ],
            "action_items": [
                {"task": "Design empty states with illustrative icons for meetings with no transcripts", "assignee": "Maya Patel", "due_date": "Nov 16", "completed": True},
                {"task": "Implement PDF and Markdown export utility with meeting metadata headers", "assignee": "Alex Vance", "due_date": "Nov 19", "completed": False}
            ],
            "transcript_segments": [
                {"speaker_name": "Maya Patel", "start_time": 0.0, "end_time": 14.0, "text": "Hey Alex! Thanks for jumping on. I wanted to review our visual parity with Fireflies.ai. We really want this clone to feel authentic and high quality.", "sequence_order": 0},
                {"speaker_name": "Alex Vance", "start_time": 14.5, "end_time": 28.0, "text": "Absolutely Maya. Fireflies uses a very specific purple and indigo palette with clean rounded cards, subtle border borders, and a well-organized side navigation.", "sequence_order": 1},
                {"speaker_name": "Maya Patel", "start_time": 28.5, "end_time": 45.0, "text": "Exactly. On the meeting detail view, we should have the audio player pinned at the top or bottom, with speed controls 0.75x, 1x, 1.25x, and 1.5x, plus skip buttons.", "sequence_order": 2},
                {"speaker_name": "Alex Vance", "start_time": 45.5, "end_time": 65.0, "text": "And on the right sidebar, let's have tabs for Summary, Action Items, and 'Ask Fred' which lets users ask natural language questions grounded in the meeting notes.", "sequence_order": 3},
                {"speaker_name": "Maya Patel", "start_time": 65.5, "end_time": 85.0, "text": "I love the Ask Fred idea! Evaluators will be super impressed seeing an interactive chat that answers questions directly based on the meeting transcript.", "sequence_order": 4},
                {"speaker_name": "Alex Vance", "start_time": 85.5, "end_time": 105.0, "text": "We should also allow users to toggle tasks as completed with a strike-through animation, and add new action items directly from the UI.", "sequence_order": 5},
                {"speaker_name": "Maya Patel", "start_time": 105.5, "end_time": 120.0, "text": "Fantastic. I'll finish up the Figma design specs and push the color tokens. Catch you later!", "sequence_order": 6}
            ]
        },
        {
            "title": "Customer Discovery: Enterprise AI Transcription Workflow",
            "date": now - timedelta(days=3, hours=1),
            "duration_seconds": 120,
            "audio_url": "/api/audio/sample.wav",
            "summary_overview": "Customer discovery interview with Acme Corp regarding enterprise transcription requirements. Topics discussed include SOC2 compliance, multi-speaker diarization accuracy, automatic action item assignments, and CRM integrations with Salesforce and HubSpot.",
            "bullet_points": json.dumps([
                "Acme Corp requires automatic speaker identification and speaker talk-time distribution.",
                "Action items must be editable and exportable to project management boards.",
                "High interest in global search across quarterly executive syncs.",
                "Requested bulk transcript file upload support for .vtt and .txt logs."
            ]),
            "sentiment": "positive",
            "participants": [
                {"name": "Liam Scott (Acme Corp)", "email": "liam@acmecorp.com", "avatar_color": "#06B6D4", "talk_time_percentage": 58.0},
                {"name": "Rachel Zane", "email": "rachel.z@fireflies-clone.io", "avatar_color": "#8B5CF6", "talk_time_percentage": 42.0}
            ],
            "topic_chapters": [
                {"title": "Customer Requirements & Pain Points", "timestamp": 0.0, "summary": "Understanding manual note-taking overhead at Acme Corp."},
                {"title": "Diarization & Speaker Analytics", "timestamp": 45.0, "summary": "Importance of knowing who spoke when and talk-time distribution."},
                {"title": "Integrations & Security Standards", "timestamp": 85.0, "summary": "Data encryption and third-party CRM syncing."}
            ],
            "action_items": [
                {"task": "Send enterprise security whitepaper and sample export files to Liam", "assignee": "Rachel Zane", "due_date": "Nov 14", "completed": True},
                {"task": "Schedule technical deep dive with Acme Corp IT infrastructure team", "assignee": "Rachel Zane", "due_date": "Nov 22", "completed": False}
            ],
            "transcript_segments": [
                {"speaker_name": "Rachel Zane", "start_time": 0.0, "end_time": 12.0, "text": "Hi Liam, thanks for taking the time today. Could you share how your team currently handles meeting notes and follow-ups?", "sequence_order": 0},
                {"speaker_name": "Liam Scott (Acme Corp)", "start_time": 12.5, "end_time": 30.0, "text": "Right now it is very manual. Product managers spend at least an hour after every meeting transcribing notes and chasing colleagues for action items.", "sequence_order": 1},
                {"speaker_name": "Rachel Zane", "start_time": 30.5, "end_time": 45.0, "text": "That's exactly what Fireflies solves. Our platform generates an instant executive summary, outlines topic chapters, and extracts action items with assignees.", "sequence_order": 2},
                {"speaker_name": "Liam Scott (Acme Corp)", "start_time": 45.5, "end_time": 68.0, "text": "What about speaker analytics? We often run sales calls and want to know what percentage of time the rep was speaking versus the prospect.", "sequence_order": 3},
                {"speaker_name": "Rachel Zane", "start_time": 68.5, "end_time": 85.0, "text": "Yes! Each participant profile calculates exact talk-time percentages and displays a clean visual bar so you can see conversation balance immediately.", "sequence_order": 4},
                {"speaker_name": "Liam Scott (Acme Corp)", "start_time": 85.5, "end_time": 105.0, "text": "That sounds ideal. Can we also search across all historical meetings using keywords like 'budget' or 'quarterly target'?", "sequence_order": 5},
                {"speaker_name": "Rachel Zane", "start_time": 105.5, "end_time": 120.0, "text": "Yes, our global search indexes every single transcript line and action item across your entire meeting repository.", "sequence_order": 6}
            ]
        },
        {
            "title": "Weekly 1-on-1: Engineering Leadership & Mentorship",
            "date": now - timedelta(days=5, hours=3),
            "duration_seconds": 120,
            "audio_url": "/api/audio/sample.wav",
            "summary_overview": "Bi-weekly 1-on-1 discussing leadership development, technical mentorship for junior developers, code review standards, and preparation for upcoming quarterly performance reviews.",
            "bullet_points": json.dumps([
                "Reviewed positive feedback on recent codebase modularization and API documentation.",
                "Discussed structuring weekly architecture brown-bag sessions for the team.",
                "Agreed to dedicate 20% of next quarter's capacity to test automation and CI/CD resilience."
            ]),
            "sentiment": "positive",
            "participants": [
                {"name": "Marcus Aurelius", "email": "marcus.a@fireflies-clone.io", "avatar_color": "#14B8A6", "talk_time_percentage": 52.0},
                {"name": "Jordan Lee", "email": "jordan.l@fireflies-clone.io", "avatar_color": "#F97316", "talk_time_percentage": 48.0}
            ],
            "topic_chapters": [
                {"title": "Check-in & Personal Well-being", "timestamp": 0.0, "summary": "Warm-up and workload balance check."},
                {"title": "Team Mentorship & Architecture Sessions", "timestamp": 40.0, "summary": "Promoting engineering best practices across junior engineers."},
                {"title": "Quarterly Objectives & Growth Areas", "timestamp": 85.0, "summary": "Setting clear goals for the next review cycle."}
            ],
            "action_items": [
                {"task": "Prepare outline for first architecture brown-bag on microservices", "assignee": "Jordan Lee", "due_date": "Nov 21", "completed": False},
                {"task": "Review and update engineering onboarding checklist in Notion", "assignee": "Marcus Aurelius", "due_date": "Nov 25", "completed": True}
            ],
            "transcript_segments": [
                {"speaker_name": "Marcus Aurelius", "start_time": 0.0, "end_time": 15.0, "text": "Hey Jordan, welcome to our weekly 1-on-1. How has your week been, and how is the workload feeling?", "sequence_order": 0},
                {"speaker_name": "Jordan Lee", "start_time": 15.5, "end_time": 35.0, "text": "Hey Marcus! Doing well. The recent fullstack feature push went smoothly, and we received great feedback on the clean API documentation.", "sequence_order": 1},
                {"speaker_name": "Marcus Aurelius", "start_time": 35.5, "end_time": 55.0, "text": "I noticed! Your code modularity and attention to error handling set a really good standard for the newer engineers on the team.", "sequence_order": 2},
                {"speaker_name": "Jordan Lee", "start_time": 55.5, "end_time": 78.0, "text": "Thank you! I'm thinking of hosting an informal weekly brown-bag session where we walk through system design patterns and clean code principles.", "sequence_order": 3},
                {"speaker_name": "Marcus Aurelius", "start_time": 78.5, "end_time": 100.0, "text": "That's a fantastic initiative. I will support you with the scheduling and budget for snacks. Let's make sure you don't overextend your primary deliverables.", "sequence_order": 4},
                {"speaker_name": "Jordan Lee", "start_time": 100.5, "end_time": 120.0, "text": "Understood. I will draft a quick 3-session outline and share it by Friday. Thanks Marcus!", "sequence_order": 5}
            ]
        }
    ]
