# Script Generation

StoryFab uses AI to generate narration scripts for your video clips. In **Commentary Mode** (v3.0), this becomes a full narrative generation pipeline with style presets, coherence tracking, and quality control.

## Two Modes of Script Generation

### Clip Mode — Narration for Highlights（快速解说）

For Clip Mode, StoryFab generates short narration scripts for individual highlight segments.

**Workflow**:
1. AI analyzes the selected clip's transcript
2. Rewrites it as a concise, engaging narration
3. Edge TTS converts the script to natural speech
4. Voice-over is merged into the exported clip

### Commentary Mode — Full Narrative Generation（🆕 v3.0）

For Commentary Mode, StoryFab generates a complete narrative structure with multiple acts.

**Workflow**:
1. **Semantic Understanding** — LLM understands plot, characters, emotional tone
2. **Structure Planning** — AI Director plans intro / acts / outro
3. **Script Generation** — Generates commentary for each segment with coherence
4. **Quality Check** — Validates reading time, relevance, repetition
5. **TTS Synthesis** — Edge TTS generates voice-over
6. **Timeline Alignment** — Audio is aligned to video segments

---

## AI Providers

StoryFab supports multiple AI providers through a unified provider interface:

| Provider | Recommended Model | API Required |
|---|---|---|
| **DeepSeek** | V4-Pro（性价比最高）| Yes |
| **OpenAI** | GPT-5.5 | Yes |
| **Anthropic** | Claude Opus 4.7 | Yes |
| **Google** | Gemini 3.1 Pro | Yes |
| **阿里云** | Qwen3.6-Max | Yes |
| **月之暗面** | Kimi K2.6 | Yes |

Set your API key and default provider in **Settings → AI → Provider**.

---

## Commentary Style Presets（🆕）

Commentary Mode supports multiple style presets to match your content:

| Style | Description | Tone | Best For |
|-------|-------------|------|----------|
| **幽默版** | 诙谐有趣，添加网络梗 | fast | 喜剧/搞笑视频 |
| **接地气版** | 口语化，像和朋友聊天 | normal | 情感/生活类视频 |
| **震惊版** | 夸张震惊，制造悬念 | fast | 悬疑/复仇类短剧 |
| **感动版** | 温情脉脉，情感共鸣 | slow | 爱情/亲情类视频 |
| **专业版** | 客观冷静，纪录片风格 | normal | 纪录片/科教类 |

### Style Customization

You can customize:
- **Tone** — 语气（幽默/严肃/接地气/震惊/感动）
- **Pacing** — 语速（fast/normal/slow）
- **Opening Pattern** — 开场句式（如"没想到..."、"当...的时候..."）
- **Emphasis Keywords** — 强调词（重点突出）

---

## How Script Generation Works（🆕）

### 1. Context Building

For each segment, StoryFab builds a context that includes:

```typescript
interface SegmentContext {
  video: { title, duration, genre };
  segment: { start_ms, end_ms, plot_summary, characters, emotional_tone };
  narrative: { previous_script, characters_so_far, story_arc };
  constraints: { target_duration_ms, style };
}
```

### 2. Prompt Engineering

StoryFab uses structured prompts for different parts of the narrative:

**Intro Template** — Opening hook (first 3 seconds must grab attention)
**Act Template** — Main story segments with coherence
**Outro Template** — Cliffhanger and call-to-action

### 3. LLM Generation

The LLM generates JSON-structured output:

```json
{
  "script": "解说词正文...",
  "reading_time_ms": 15000,
  "emphasis_positions": [5, 23, 45],
  "keywords_to_highlight": ["关键", "精彩"]
}
```

### 4. Quality Check

Before finalizing, StoryFab validates:

| Check | Criteria | Action if Failed |
|-------|----------|-----------------|
| Duration | ±15% of target | Warning |
| Repetition | No repeated patterns | Warning |
| Relevance | Script matches plot | Error → Fallback |

### 5. Coherence Tracking

Across multiple segments, StoryFab maintains:
- **Previous Script** — Passed to LLM for context
- **Character Track** — Avoids re-introducing characters
- **Story Arc** — Maintains narrative flow

---

## Script Customization

After generation, you can:

- **Edit manually** — Tweak the script text directly
- **Regenerate** — Ask AI for a new version
- **Change style** — Switch between style presets
- **Adjust length** — Shorten or expand the narration
- **Add emphasis** — Mark keywords to be highlighted

---

## Voice Settings（🆕）

| Setting | Options | Default |
|---------|---------|---------|
| Voice | Any Edge TTS voice | zh-CN-XiaoxiaoNeural |
| Speed | 0.5x – 2.0x | 1.0x |
| Pitch | -50% – +50% | 0 |
| Volume | 0% – 100% | 100% |

### Voice Selection by Style

| Style | Recommended Voice |
|-------|------------------|
| 幽默版 | zh-CN-XiaoxiaoNeural（活泼女声）|
| 接地气版 | zh-CN-XiaoyouNeural（年轻女声）|
| 震惊版 | zh-CN-YunyangNeural（新闻男声）|
| 感动版 | zh-CN-XiaobaiNeural（温柔女声）|
| 专业版 | zh-CN-YunxiNeural（稳重男声）|

---

## Disabling Script Generation

Script generation is optional. You can export clips with:

- **Original audio only** — No narration
- **Subtitles only** — Burn-in text without voice
- **Full Commentary** — Narration + original + subtitles

In Commentary Mode, if TTS fails, StoryFab will:
1. Retry up to 2 times
2. If still failing, skip audio and export video-only with subtitles