import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from starlette.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_suite():
    print("=== RUNNING FASTAPI ENDPOINT INTEGRATION TESTS ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ GET /api/health passed:", res.json())

    # 2. List meetings
    res = client.get("/api/meetings")
    assert res.status_code == 200, f"List meetings failed: {res.text}"
    meetings = res.json()
    assert len(meetings) >= 4, f"Expected at least 4 seeded meetings, got {len(meetings)}"
    print(f"✓ GET /api/meetings passed: Found {len(meetings)} meetings")
    first_meeting_id = meetings[0]["id"]

    # 3. Get single meeting detail
    res = client.get(f"/api/meetings/{first_meeting_id}")
    assert res.status_code == 200, f"Get meeting failed: {res.text}"
    detail = res.json()
    assert detail["id"] == first_meeting_id
    assert len(detail["transcript_segments"]) > 0
    assert len(detail["action_items"]) > 0
    assert len(detail["topic_chapters"]) > 0
    print(f"✓ GET /api/meetings/{first_meeting_id} passed: {len(detail['transcript_segments'])} segments, {len(detail['action_items'])} action items")

    # 4. Filter and search meetings
    res = client.get("/api/meetings?search=Engineering")
    assert res.status_code == 200
    filtered = res.json()
    assert len(filtered) >= 1
    print(f"✓ GET /api/meetings?search=Engineering passed: Found {len(filtered)} matches")

    # 5. Transcript Upload & Auto-Parsing
    raw_transcript = (
        "[00:00] Alice: Welcome everyone to the quarterly design sync.\n"
        "[00:15] Bob: Thanks Alice! I think the audio seekbar is working smoothly.\n"
        "[00:30] Alice: Agreed. We need to finalize the dark mode toggle before Friday."
    )
    res = client.post(
        "/api/meetings/upload",
        data={"title": "Automated Upload Test Sync", "transcript_text": raw_transcript}
    )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    uploaded = res.json()
    assert uploaded["title"] == "Automated Upload Test Sync"
    assert len(uploaded["transcript_segments"]) == 3
    assert len(uploaded["participants"]) == 2
    assert len(uploaded["action_items"]) >= 1
    new_meeting_id = uploaded["id"]
    print(f"✓ POST /api/meetings/upload passed: Auto-parsed {len(uploaded['transcript_segments'])} segments and created meeting {new_meeting_id}")

    # 6. Action Items - Add, Toggle, Delete
    res = client.post(
        f"/api/meetings/{new_meeting_id}/action-items",
        json={"task": "Complete unit test verification", "assignee": "Alice", "due_date": "Tomorrow"}
    )
    assert res.status_code == 200
    action_item = res.json()
    action_id = action_item["id"]
    print(f"✓ POST /api/meetings/{new_meeting_id}/action-items passed: Created action item {action_id}")

    # Toggle complete
    res = client.patch(f"/api/action-items/{action_id}", json={"completed": True})
    assert res.status_code == 200
    assert res.json()["completed"] is True
    print("✓ PATCH /api/action-items/{id} passed: Marked task as completed")

    # 7. Highlights / Soundbites
    res = client.post(
        f"/api/meetings/{new_meeting_id}/highlights",
        json={"selected_text": "the audio seekbar is working smoothly", "note": "Positive feedback", "color": "purple"}
    )
    assert res.status_code == 200
    hl_id = res.json()["id"]
    print(f"✓ POST /api/meetings/{new_meeting_id}/highlights passed: Created highlight {hl_id}")

    # 8. Ask Fred AI Chat grounded in transcript
    res = client.post(
        f"/api/meetings/{new_meeting_id}/chat",
        json={"question": "What did Alice say about the dark mode toggle?"}
    )
    assert res.status_code == 200
    chat_reply = res.json()
    assert chat_reply["role"] == "assistant"
    print(f"✓ POST /api/meetings/{new_meeting_id}/chat passed: Fred replied -> '{chat_reply['content'][:80]}...'")

    # 9. Global Search Across All Meetings
    res = client.get("/api/search?q=seekbar")
    assert res.status_code == 200
    search_results = res.json()
    assert len(search_results) >= 1
    print(f"✓ GET /api/search?q=seekbar passed: Found {len(search_results)} search hits")

    # 10. Export Meeting (Markdown and TXT)
    res_md = client.get(f"/api/meetings/{new_meeting_id}/export?format=markdown")
    assert res_md.status_code == 200
    assert "# Automated Upload Test Sync" in res_md.text
    print("✓ GET /api/meetings/{id}/export?format=markdown passed")

    res_txt = client.get(f"/api/meetings/{new_meeting_id}/export?format=txt")
    assert res_txt.status_code == 200
    assert "MEETING TITLE: Automated Upload Test Sync" in res_txt.text
    print("✓ GET /api/meetings/{id}/export?format=txt passed")

    # 11. Delete Meeting
    res = client.delete(f"/api/meetings/{new_meeting_id}")
    assert res.status_code == 200
    # Verify it is deleted
    res_check = client.get(f"/api/meetings/{new_meeting_id}")
    assert res_check.status_code == 404
    print("✓ DELETE /api/meetings/{id} passed: Cascaded records cleaned up cleanly")

    print("\n🎉 ALL 11 API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    test_full_suite()

