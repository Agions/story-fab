# AI Analysis

StoryFab uses multiple AI models to analyze your video: **Whisper** for transcription, **SmartSegmenter** for scene understanding, and in Commentary Mode, **LLM** for semantic understanding.

## Transcription (Whisper)

StoryFab runs [OpenAI Whisper](https://github.com/openai/whisper) entirely locally. No audio is ever sent to the cloud.

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

## Smart Segmentation（智能分段）

After transcription, StoryFab analyzes the audio energy, visual scene changes, and speech activity to segment the video into meaningful chunks.

### Scoring Factors

- **Audio Energy** — Loud, dynamic audio segments score higher (e.g., exclamation, applause, music peaks)
- **Scene Change** — Sharp visual transitions often indicate topic changes or key moments
- **Speech Activity** — Segments with clear speech (not silence) are preferred
- **Pause Detection** — Natural breakpoints in speech are used as clip boundaries

### Speed Derivation

Each segment gets a suggested playback speed based on its energy profile:

| Energy Ratio（vs 平均） | Suggested Speed | Description |
|---|---|---|
| > 1.1x | 1x | High energy — keep original pacing |
| 0.85–1.1x | 2x | Normal energy — mild acceleration |
| 0.5–0.85x | 4x | Low energy — skip dead time |
| < 0.5x | 6x | Near silence — maximum compression |

### Tuning Detection Parameters

In **Settings → AI → Highlight Detection**, you can tune:

| Parameter | Range | Default | Effect |
|---|---|---|---|
| Min clip duration | 5–60s | 15s | Longer = fewer, more substantial clips |
| Max clips | 3–20 | 10 | Upper limit on clips per video |
| Sensitivity | Low / Medium / High | Medium | Higher = more clips detected |

## Semantic Segmentation（语义分段）🆕

> Available in **Commentary Mode** only

In Commentary Mode, after Smart Segmentation, StoryFab uses an LLM to add semantic understanding to each segment.

### What It Does

1. **Plot Understanding** — LLM reads each segment's audio/transcript and summarizes what happens
2. **Character Tracking** — Identifies which characters appear in each segment
3. **Emotional Tone** — Classifies the scene's emotional tone (happy/sad/tense/comedic/surprising)
4. **Commentary Potential** — Scores each segment on how compelling it would be as narration content

### Semantic Segment Output

```typescript
interface SemanticSegment {
  start_ms: number;
  end_ms: number;
  segment_type: string;        // "dialogue" | "action" | "transition" | "silence" | "content"
  plot_summary: string;        // 一两句话总结剧情
  characters: string[];        // 出现的人物
  emotional_tone: string;      // "happy" | "sad" | "tense" | "calm" | "comedic"
  commentary_tone: string;     // 建议的解说语气
  highlight_potential: number; // 0.0-1.0，作为解说的潜力
}
```

### Example

| Segment | Plot Summary | Characters | Emotional Tone | Commentary Tone |
|---------|-------------|------------|----------------|-----------------|
| 0:15–0:32 | 男主角刚进门就被女主撞到 | 王霸天, 林小雨 | tense | 震惊版 |
| 0:32–1:05 | 两人互相道歉，发现是误会 | 王霸天, 林小雨 | comedic | 幽默版 |
| 1:05–1:20 | 女主注意到男主的服装 | 王霸天, 林小雨 | calm | 接地气版 |

## Subtitle Generation

Transcription automatically produces SRT subtitle files. Subtitles are:

- Word-level accurate
- Time-synced to the audio
- Stored locally in the project folder

You can also import existing subtitle files (`.srt`, `.ass`, `.vtt`).