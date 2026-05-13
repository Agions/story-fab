# Script Generation

CutDeck uses AI to generate narration scripts for your clips, then synthesizes voice-over using **Edge TTS** — entirely offline.

## How It Works

1. CutDeck extracts the transcript segment for the selected clip
2. The AI service (configurable: OpenAI / Anthropic / DeepSeek / etc.) rewrites it as a concise, engaging narration
3. Edge TTS converts the script to natural speech
4. The voice-over is merged into the exported clip

## AI Providers

CutDeck supports multiple AI providers through a unified provider interface:

| Provider | Model | API Required |
|---|---|---|
| OpenAI | GPT-4o / GPT-4o-mini | Yes |
| Anthropic | Claude 3.5 Sonnet | Yes |
| DeepSeek | DeepSeek-V4 / DeepSeek-Chat | Yes |
| SiliconFlow | Compatible with OpenAI API | Yes |
| Custom | Any OpenAI-compatible API | Yes |

Set your API key and default provider in **Settings → AI → Provider**.

## Script Customization

After generation, you can:

- **Edit manually** — Tweak the script text directly
- **Regenerate** — Ask AI for a new version
- **Change tone** — Adjust from casual to formal
- **Adjust length** — Shorten or expand the narration

## Voice Settings

| Setting | Options |
|---|---|
| Voice | Any Edge TTS voice (e.g., `en-US-AriaNeural`) |
| Speed | 0.5x – 2.0x |
| Pitch | -50% – +50% |

## Disabling Script Generation

Script generation is optional. You can export clips with the original audio only, or with original audio + subtitle burn-in, without any voice-over.
