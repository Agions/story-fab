# Export

StoryFab supports multiple aspect ratios, subtitle styles, and quality presets.

## Aspect Ratios

| Format | Resolution | Platform |
|---|---|---|
| **9:16** (Vertical) | 1080×1920 | TikTok, Instagram Reels, YouTube Shorts |
| **1:1** (Square) | 1080×1080 | Instagram Feed |
| **16:9** (Horizontal) | 1920×1080 | YouTube, Twitter/X, Facebook |

## Quality Presets

| Preset | CRF | FFmpeg Preset | Use Case |
|---|---|---|---|
| High | 18 | medium | Best quality, larger file |
| Medium | 23 | fast | Balanced (default) |
| Low | 28 | veryfast | Smaller file, acceptable quality |

## Subtitle Options

- **Burn-in** — Subtitles are hard-coded into the video (no toggle needed to see them)
- **Soft** — Subtitles as a separate track (can be toggled off in video players)
- **None** — No subtitles

## Export Flow

1. Select clips to export
2. Choose aspect ratio
3. Choose quality preset
4. Toggle subtitle burn-in (optional)
5. Click **Export**
6. Wait for FFmpeg render to complete
7. Find your clips in the output directory

## Output Format

- **Container**: MP4 (H.264 video + AAC audio)
- **Audio**: AAC 192kbps
- **Subtitles**: Hardsubbed via FFmpeg filter `subtitles=filename=...`

## Batch Export

You can select multiple clips and export them as a batch. Each clip is exported individually with its own output file.
