import os
import json
import subprocess
import wave

meetings_data = [
    {
        "filename": "meeting_1.wav",
        "segments": [
            ("Samantha", "Good morning team. Let us kick off our Q4 sprint planning. Today our main agenda is the transcript pipeline architecture and search indexing."),
            ("Daniel", "Thanks Sarah. From the backend side, our current challenge is latency when uploading large meeting audio files. We need an asynchronous job worker so the user UI stays responsive."),
            ("Karen", "I agree. We can use a lightweight queue or background task pattern. The frontend can poll or receive a websocket update when processing finishes."),
            ("Samantha", "That makes total sense. Next, let us talk about the interactive transcript view. Users want to click on any sentence and immediately seek the media player to that point."),
            ("Daniel", "Right, each segment has start time and end time timestamps. We can bind an onTimeUpdate listener on the audio element to highlight the current transcript block in real-time."),
            ("Karen", "And when the user selects text in the transcript, we should let them create a soundbite snippet or highlight with custom notes. Fireflies does this exceptionally well."),
            ("Samantha", "Brilliant. Let us make sure the search bar highlights matching occurrences with a distinct yellow badge and auto scrolls the active segment into view."),
            ("Daniel", "I will take ownership of the database schema and query indexes. We will ensure cascade deletes for meetings and their child records."),
            ("Samantha", "Great! Let us wrap up. David has the database tasks, Elena has the API endpoints, and I will finish the responsive Next.js layout. Thanks everyone!")
        ]
    },
    {
        "filename": "meeting_2.wav",
        "segments": [
            ("Samantha", "Hey Alex! Thanks for jumping on. I wanted to review our visual parity with Fireflies.ai. We really want this clone to feel authentic and high quality."),
            ("Alex", "Absolutely Maya. Fireflies uses a very specific purple and indigo palette with clean rounded cards, subtle border borders, and a well-organized side navigation."),
            ("Samantha", "Exactly. On the meeting detail view, we should have the audio player pinned at the top or bottom, with speed controls 0.75x, 1x, 1.25x, and 1.5x, plus skip buttons."),
            ("Alex", "And on the right sidebar, let us have tabs for Summary, Action Items, and Ask Fred which lets users ask natural language questions grounded in the meeting notes."),
            ("Samantha", "I love the Ask Fred idea! Evaluators will be super impressed seeing an interactive chat that answers questions directly based on the meeting transcript."),
            ("Alex", "We should also allow users to toggle tasks as completed with a strike-through animation, and add new action items directly from the UI."),
            ("Samantha", "Fantastic. I will finish up the Figma design specs and push the color tokens. Catch you later!")
        ]
    },
    {
        "filename": "meeting_3.wav",
        "segments": [
            ("Samantha", "Hi Liam, thanks for taking the time today. Could you share how your team currently handles meeting notes and follow-ups?"),
            ("Daniel", "Right now it is very manual. Product managers spend at least an hour after every meeting transcribing notes and chasing colleagues for action items."),
            ("Samantha", "That is exactly what Fireflies solves. Our platform generates an instant executive summary, outlines topic chapters, and extracts action items with assignees."),
            ("Daniel", "What about speaker analytics? We often run sales calls and want to know what percentage of time the rep was speaking versus the prospect."),
            ("Samantha", "Yes! Each participant profile calculates exact talk-time percentages and displays a clean visual bar so you can see conversation balance immediately."),
            ("Daniel", "That sounds ideal. Can we also search across all historical meetings using keywords like budget or quarterly target?"),
            ("Samantha", "Yes, our global search indexes every single transcript line and action item across your entire meeting repository.")
        ]
    },
    {
        "filename": "meeting_4.wav",
        "segments": [
            ("Daniel", "Hey Jordan, welcome to our weekly 1-on-1. How has your week been, and how is the workload feeling?"),
            ("Alex", "Hey Marcus! Doing well. The recent fullstack feature push went smoothly, and we received great feedback on the clean API documentation."),
            ("Daniel", "I noticed! Your code modularity and attention to error handling set a really good standard for the newer engineers on the team."),
            ("Alex", "Thank you! I am thinking of hosting an informal weekly brown-bag session where we walk through system design patterns and clean code principles."),
            ("Daniel", "That is a fantastic initiative. I will support you with the scheduling and budget for snacks. Let us make sure you do not overextend your primary deliverables."),
            ("Alex", "Understood. I will draft a quick three-session outline and share it by Friday. Thanks Marcus!")
        ]
    }
]

out_dir = "backend/sample_audio"
os.makedirs(out_dir, exist_ok=True)

timing_manifest = {}

for m in meetings_data:
    fname = m["filename"]
    print(f"\n--- Generating {fname} ---")
    temp_wavs = []
    seg_timings = []
    curr_t = 0.0
    
    for i, (voice, text) in enumerate(m["segments"]):
        aiff_path = f"{out_dir}/part_{i}.aiff"
        wav_path = f"{out_dir}/part_{i}.wav"
        
        res = subprocess.run(["say", "-v", voice, "-o", aiff_path, text], capture_output=True)
        if res.returncode != 0:
            subprocess.run(["say", "-o", aiff_path, text])
            
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", aiff_path, wav_path])
        
        with wave.open(wav_path, "rb") as w:
            dur = w.getnframes() / 16000.0
            
        seg_timings.append({
            "start_time": round(curr_t, 1),
            "end_time": round(curr_t + dur, 1),
            "duration": round(dur, 1)
        })
        curr_t += dur + 0.8
        temp_wavs.append(wav_path)
        if os.path.exists(aiff_path):
            os.remove(aiff_path)
            
    final_path = f"{out_dir}/{fname}"
    silence = b'\x00\x00' * int(16000 * 0.8)
    
    with wave.open(final_path, "wb") as outfile:
        outfile.setnchannels(1)
        outfile.setsampwidth(2)
        outfile.setframerate(16000)
        for wp in temp_wavs:
            with wave.open(wp, "rb") as infile:
                outfile.writeframes(infile.readframes(infile.getnframes()))
                outfile.writeframes(silence)
            os.remove(wp)
            
    timing_manifest[fname] = {
        "total_duration": int(curr_t),
        "segments": seg_timings
    }
    print(f"✓ Created {final_path} (Duration: {int(curr_t)}s, {len(seg_timings)} segments)")

# Also copy meeting_1.wav to sample.wav as default fallback
import shutil
shutil.copy(f"{out_dir}/meeting_1.wav", f"{out_dir}/sample.wav")

with open(f"{out_dir}/timings.json", "w") as f:
    json.dump(timing_manifest, f, indent=2)

print("\nAll audio files generated successfully!")
