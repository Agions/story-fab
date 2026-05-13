# AI Analysis

CutDeck uses two local AI models to analyze your video: **Whisper** for transcription and a **highlight detector** for clip discovery.

## Transcription (Whisper)

CutDeck runs [OpenAI Whisper](https://github.com/openai/whisper) entirely locally. No audio is ever sent to the cloud.

### Supported Models

| Model | Size | Speed | Accuracy |
|---|---|---|---|
| `tiny` | ~75 MB | 10x realtime | Baseline |
| `base` | ~140 MB | 7x realtime | Good |
| `small` | ~470 MB | 4x realtime | Very Good |
| `medium` | ~1.5 GB | 2x realtime | Excellent |

The default model is `base`. You can change it in **Settings → AI → Whisper Model**.

### How Transcription Works

1. Audio is extracted from the video file via FFmpeg
2. Audio is split into 30-second chunks
3. Each chunk is fed to Whisper for transcription with timestamps
4. Results are merged into a continuous subtitle track (SRT format)

## Highlight Detection

After transcription, CutDeck analyzes the audio energy, visual scene changes, and speech activity to score each segment.

### Scoring Factors

- **Audio Energy** — Loud, dynamic audio segments score higher (e.g., exclamation, applause, music peaks)
- **Scene Change** — Sharp visual transitions often indicate topic changes or key moments
- **Speech Activity** — Segments with clear speech (not silence) are preferred
- **Pause Detection** — Natural breakpoints in speech are used as clip boundaries

### Tuning Detection Parameters

In **Settings → AI → Highlight Detection**, you can tune:

| Parameter | Range | Default | Effect |
|---|---|---|---|
| Min clip duration | 5–60s | 15s | Longer = fewer, more substantial clips |
| Max clips | 3–20 | 10 | Upper limit on clips per video |
| Sensitivity | Low / Medium / High | Medium | Higher = more clips detected |

## Subtitle Generation

Transcription automatically produces SRT subtitle files. Subtitles are:

- Word-level accurate
- Time-synced to the audio
- Stored locally in the project folder

You can also import existing subtitle files (`.srt`, `.ass`, `.vtt`).
