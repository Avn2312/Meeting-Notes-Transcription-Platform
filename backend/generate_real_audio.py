import os
import subprocess
import wave

# Transcript text segments with speaker voices
segments = [
    ("Samantha", "Good morning team. Let's kick off our Q4 sprint planning. Today our main agenda is the transcript pipeline architecture and search indexing."),
    ("Daniel", "Thanks Sarah. From the backend side, our current challenge is latency when uploading large meeting audio files. We need an asynchronous job worker so the user UI stays responsive."),
    ("Karen", "I agree. We can use a lightweight queue or background task pattern. The frontend can poll or receive a websocket update when processing finishes."),
    ("Samantha", "That makes total sense. Next, let's talk about the interactive transcript view. Users want to click on any sentence and immediately seek the media player to that point."),
    ("Daniel", "Right, each segment has start time and end time timestamps. We can bind an onTimeUpdate listener on the audio element to highlight the current transcript block in real-time."),
    ("Karen", "And when the user selects text in the transcript, we should let them create a soundbite snippet or highlight with custom notes. Fireflies does this exceptionally well."),
    ("Samantha", "Brilliant. Let's make sure the search bar highlights matching occurrences with a distinct yellow badge and auto scrolls the active segment into view."),
    ("Daniel", "I'll take ownership of the database schema and query indexes. We'll ensure cascade deletes for meetings and their child records."),
    ("Samantha", "Great! Let's wrap up. David has the database tasks, Elena has the API endpoints, and I'll finish the responsive Next.js layout. Thanks everyone!")
]

temp_files = []
os.makedirs("backend/sample_audio", exist_ok=True)

print("Synthesizing real speech audio tracks...")
for i, (voice, text) in enumerate(segments):
    aiff_path = f"backend/sample_audio/part_{i}.aiff"
    wav_path = f"backend/sample_audio/part_{i}.wav"
    
    # Try using voice, fallback to default if voice not installed
    res = subprocess.run(["say", "-v", voice, "-o", aiff_path, text], capture_output=True)
    if res.returncode != 0:
        subprocess.run(["say", "-o", aiff_path, text])
    
    # Convert to 16kHz 16-bit Mono WAV
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", aiff_path, wav_path])
    temp_files.append(wav_path)
    if os.path.exists(aiff_path):
        os.remove(aiff_path)

print(f"Generated {len(temp_files)} speech parts. Stitching into sample.wav with pauses...")

# Combine wav files with 0.8s pause between speakers
output_wav_path = "backend/sample_audio/sample.wav"
silence_frames = b'\x00\x00' * int(16000 * 0.8) # 0.8 sec silence

with wave.open(output_wav_path, 'wb') as outfile:
    outfile.setnchannels(1)
    outfile.setsampwidth(2)
    outfile.setframerate(16000)
    
    for wav_file in temp_files:
        with wave.open(wav_file, 'rb') as infile:
            data = infile.readframes(infile.getnframes())
            outfile.writeframes(data)
            outfile.writeframes(silence_frames)
        os.remove(wav_file)

with wave.open(output_wav_path, 'rb') as check:
    total_sec = check.getnframes() / check.getframerate()
    print(f"Successfully created real meeting speech audio: {output_wav_path} (Duration: {total_sec:.1f}s)")

