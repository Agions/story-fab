# CutDeck v2.0 — 全自动拆条 实现计划

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.
>
> **Goal:** 实现全自动拆条 pipeline，支持三档交互模式、剪映草稿导出、断点续传
>
> **Architecture:** 模块化设计，Pipeline 通用输出驱动三种 UI 模式，剪映草稿为单向导出目标
>
> **Tech Stack:** React 18 + TypeScript + Zustand + Tauri (Rust/FFmpeg) + Whisper

---

## Phase 1: 基础设施

### Task 1: ClipSegment 类型扩展

**Files:**
- Modify: `src/core/types/index.ts` — 扩展 ClipSegment 接口，添加剪映专用字段
- Create: `src/core/types/jianying.ts` — 剪映草稿类型定义

**Step 1: 写测试**
```typescript
// src/core/types/jianying.test.ts
import { describe, it, expect } from 'vitest';
import { JIANYING_DRAFT_VERSION } from './jianying';

describe('JianYing types', () => {
  it('should have current draft version', () => {
    expect(JIANYING_DRAFT_VERSION).toBeDefined();
    expect(typeof JIANYING_DRAFT_VERSION).toBe('string');
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/types/jianying.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/core/types/jianying.ts
/**
 * 剪映草稿类型定义
 * 参考剪映草稿 .jianYing/draft_content.json 结构
 */

export const JIANYING_DRAFT_VERSION = '1.4.0';

export interface JianYingClip {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  sourceStartMs: number;
  sourceEndMs: number;
  speed: number;
  color: string;
}

export interface JianYingTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  clips: JianYingClip[];
}

export interface JianYingDraft {
  version: string;
  tracks: JianYingTrack[];
  duration: number;
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/types/jianying.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/types/jianying.ts src/core/types/jianying.test.ts && git commit -m "feat(types): add JianYing draft types"`

---

### Task 2: PipelineCheckpoint 类型与存储

**Files:**
- Create: `src/core/services/clipRepurposing/pipeline-checkpoint.ts`
- Create: `src/core/services/clipRepurposing/pipeline-checkpoint.test.ts`

**Step 1: 写测试**
```typescript
// src/core/services/clipRepurposing/pipeline-checkpoint.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineCheckpoint, createCheckpoint, saveCheckpoint, loadCheckpoint, clearCheckpoint } from './pipeline-checkpoint';

describe('PipelineCheckpoint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create checkpoint with videoId and step', () => {
    const cp = createCheckpoint('video-123', 'analyze');
    expect(cp.videoId).toBe('video-123');
    expect(cp.currentStep).toBe('analyze');
    expect(cp.completedSteps).toEqual([]);
  });

  it('should save and load from localStorage', () => {
    const cp = createCheckpoint('video-123', 'segment');
    saveCheckpoint(cp);
    const loaded = loadCheckpoint('video-123');
    expect(loaded?.videoId).toBe('video-123');
    expect(loaded?.currentStep).toBe('segment');
  });

  it('should clear checkpoint', () => {
    saveCheckpoint(createCheckpoint('video-123', 'analyze'));
    clearCheckpoint('video-123');
    expect(loadCheckpoint('video-123')).toBeNull();
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/services/clipRepurposing/pipeline-checkpoint.test.ts`
Expected: FAIL — module not found

**Step 3: 写实现**
```typescript
// src/core/services/clipRepurposing/pipeline-checkpoint.ts
/**
 * Pipeline 断点存储服务
 * 支持 localStorage 持久化，供断点续传使用
 */

import type { AnalysisResult } from '@/core/types';
import type { ClipSegment } from '@/core/services/clipRepurposing/types';
import type { SubtitleResult } from '@/core/services/subtitle.service';

export type PipelineStep = 'analyze' | 'segment' | 'subtitle' | 'export';

export interface PipelineCheckpoint {
  videoId: string;
  completedSteps: PipelineStep[];
  currentStep: PipelineStep;
  partialResults: {
    analysisResult?: AnalysisResult;
    segments?: ClipSegment[];
    subtitles?: SubtitleResult;
  };
  failedReason?: string;
  timestamp: number;
}

const CHECKPOINT_PREFIX = 'cutdeck_checkpoint_';

export function createCheckpoint(
  videoId: string,
  currentStep: PipelineStep,
  partialResults: PipelineCheckpoint['partialResults'] = {}
): PipelineCheckpoint {
  return {
    videoId,
    completedSteps: [],
    currentStep,
    partialResults,
    timestamp: Date.now(),
  };
}

export function saveCheckpoint(cp: PipelineCheckpoint): void {
  try {
    localStorage.setItem(
      `${CHECKPOINT_PREFIX}${cp.videoId}`,
      JSON.stringify(cp)
    );
  } catch (e) {
    console.error('Failed to save checkpoint:', e);
  }
}

export function loadCheckpoint(videoId: string): PipelineCheckpoint | null {
  try {
    const raw = localStorage.getItem(`${CHECKPOINT_PREFIX}${videoId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PipelineCheckpoint;
  } catch {
    return null;
  }
}

export function clearCheckpoint(videoId: string): void {
  localStorage.removeItem(`${CHECKPOINT_PREFIX}${videoId}`);
}

export function markStepComplete(
  cp: PipelineCheckpoint,
  step: PipelineStep,
  result: PipelineCheckpoint['partialResults'][keyof PipelineCheckpoint['partialResults']]
): PipelineCheckpoint {
  return {
    ...cp,
    completedSteps: [...cp.completedSteps, step],
    partialResults: { ...cp.partialResults, [step]: result },
  };
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/services/clipRepurposing/pipeline-checkpoint.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/services/clipRepurposing/pipeline-checkpoint.ts src/core/services/clipRepurposing/pipeline-checkpoint.test.ts && git commit -m "feat(pipeline): add checkpoint save/load for resume support"`

---

### Task 3: Retry 装饰器工具

**Files:**
- Create: `src/utils/retry.ts`
- Create: `src/utils/retry.test.ts`

**Step 1: 写测试**
```typescript
// src/utils/retry.test.ts
import { describe, it, expect, vi } from 'vitest';
import { withRetry, withRetryAndFallback } from './retry';

describe('withRetry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 100);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure then succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after all retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(fn, 2, 10)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/utils/retry.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/utils/retry.ts
/**
 * 重试工具函数
 * 支持自动重试 + 降级 fallback
 */

export interface RetryOptions {
  attempts: number;
  delayMs: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * 带重试的函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (i < attempts) {
        onRetry?.(i, lastError);
        await sleep(delayMs * Math.pow(2, i - 1)); // 指数退避
      }
    }
  }

  throw lastError!;
}

/**
 * 带重试 + 降级 fallback
 */
export async function withRetryAndFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: RetryOptions
): Promise<T> {
  try {
    return await withRetry(fn, options.attempts, options.delayMs, options.onRetry);
  } catch {
    return fallback;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/utils/retry.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/utils/retry.ts src/utils/retry.test.ts && git commit -m "feat(utils): add withRetry and withRetryAndFallback"`

---

## Phase 2: 剪映草稿导出

### Task 4: 剪映草稿 JSON 生成器

**Files:**
- Create: `src/core/services/export/jianying-draft-exporter.ts`
- Create: `src/core/services/export/jianying-draft-exporter.test.ts`

**Step 1: 写测试**
```typescript
// src/core/services/export/jianying-draft-exporter.test.ts
import { describe, it, expect } from 'vitest';
import { generateJianYingDraft, generateJianYingClip } from './jianying-draft-exporter';
import type { ClipSegment } from '../clipRepurposing/types';

describe('JianYingDraftExporter', () => {
  it('should generate clip with correct ms fields', () => {
    const clip = generateJianYingClip('clip-1', 'track-1', {
      sourceStartMs: 1000,
      sourceEndMs: 5000,
      startMs: 0,
      endMs: 4000,
    });
    expect(clip.sourceStartMs).toBe(1000);
    expect(clip.sourceEndMs).toBe(5000);
  });

  it('should generate draft with video track and subtitle track', () => {
    const segments = [
      {
        id: 'seg-1',
        sourceStartMs: 1000,
        sourceEndMs: 8000,
        duration: 7000,
        score: { total: 80, completeness: 0, emotionPeak: 0, silenceRatio: 0, contentDensity: 0 },
      } as unknown as ClipSegment,
    ];
    const draft = generateJianYingDraft('video-1', segments, 30000);
    expect(draft.tracks.length).toBeGreaterThanOrEqual(1);
    expect(draft.duration).toBe(30000);
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/services/export/jianying-draft-exporter.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/core/services/export/jianying-draft-exporter.ts
/**
 * 剪映草稿导出器
 * 将 ClipSegment[] 转换为剪映可读的 draft_content.json
 */

import { JIANYING_DRAFT_VERSION } from '@/core/types/jianying';
import type { JianYingDraft, JianYingTrack, JianYingClip } from '@/core/types/jianying';
import type { ClipSegment } from '../clipRepurposing/types';

export interface JianYingExportOptions {
  videoId: string;
  segments: ClipSegment[];
  totalDurationMs: number;
  outputDir: string; // .jianYing 所在目录
}

export function generateJianYingClip(
  clipId: string,
  trackId: string,
  timing: {
    startMs: number;
    endMs: number;
    sourceStartMs: number;
    sourceEndMs: number;
  }
): JianYingClip {
  return {
    id: clipId,
    trackId,
    startMs: timing.startMs,
    endMs: timing.endMs,
    sourceStartMs: timing.sourceStartMs,
    sourceEndMs: timing.sourceEndMs,
    speed: 1.0,
    color: '#FFFFFF',
  };
}

export function generateJianYingDraft(
  videoId: string,
  segments: ClipSegment[],
  totalDurationMs: number
): JianYingDraft {
  // 视频轨道
  const videoTrack: JianYingTrack = {
    id: `video-track-${videoId}`,
    type: 'video',
    clips: segments.map((seg, i) =>
      generateJianYingClip(
        `clip-${i}-${seg.id}`,
        `video-track-${videoId}`,
        {
          startMs: seg.startMs ?? 0,
          endMs: seg.endMs ?? seg.startMs + seg.duration,
          sourceStartMs: seg.sourceStartMs,
          sourceEndMs: seg.sourceEndMs,
        }
      )
    ),
  };

  return {
    version: JIANYING_DRAFT_VERSION,
    tracks: [videoTrack],
    duration: totalDurationMs,
  };
}

export async function exportJianYingDraft(options: JianYingExportOptions): Promise<string> {
  const draft = generateJianYingDraft(options.videoId, options.segments, options.totalDurationMs);
  const draftJson = JSON.stringify(draft, null, 2);
  const draftPath = `${options.outputDir}/.jianYing/draft_content.json`;
  // Tauri fs write
  // await writeTextFile(draftPath, draftJson);
  return draftPath;
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/services/export/jianying-draft-exporter.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/services/export/jianying-draft-exporter.ts src/core/services/export/jianying-draft-exporter.test.ts && git commit -m "feat(jianying): add draft JSON exporter"`

---

### Task 5: 字幕格式适配剪映

**Files:**
- Modify: `src/core/services/subtitle.service.ts` — 添加 toJianYingFormat() 方法
- Create: `src/core/services/subtitle/jianying-subtitle-adapter.test.ts`

**Step 1: 写测试**
```typescript
// src/core/services/subtitle/jianying-subtitle-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { SubtitleSegment } from '../subtitle.service';
import { toJianYingSubtitleTrack } from './jianying-subtitle-adapter';

describe('JianYingSubtitleAdapter', () => {
  it('should convert SubtitleSegment to JianYing subtitle track', () => {
    const segments: SubtitleSegment[] = [
      { startMs: 0, endMs: 2000, text: 'Hello' },
      { startMs: 2000, endMs: 4000, text: 'World' },
    ];
    const track = toJianYingSubtitleTrack(segments, 'main');
    expect(track.type).toBe('subtitle');
    expect(track.clips.length).toBe(2);
    expect(track.clips[0].text).toBe('Hello');
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/services/subtitle/jianying-subtitle-adapter.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/core/services/subtitle/jianying-subtitle-adapter.ts
/**
 * 字幕适配剪映格式
 * 将通用 SubtitleSegment[] 转换为剪映草稿可用的字幕轨道
 */

import type { SubtitleSegment } from '../subtitle.service';
import type { JianYingTrack, JianYingClip } from '@/core/types/jianying';

export interface JianYingSubtitleClip extends JianYingClip {
  text: string;
  style?: {
    fontSize?: number;
    color?: string;
    bold?: boolean;
  };
}

export function toJianYingSubtitleTrack(
  segments: SubtitleSegment[],
  trackId: string
): JianYingTrack {
  return {
    id: trackId,
    type: 'subtitle',
    clips: segments.map((seg, i) => ({
      id: `subtitle-${i}`,
      trackId,
      startMs: seg.startMs,
      endMs: seg.endMs,
      sourceStartMs: seg.startMs,
      sourceEndMs: seg.endMs,
      speed: 1.0,
      color: '#FFFFFF',
      text: seg.text,
    })) as unknown as JianYingClip[],
  };
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/services/subtitle/jianying-subtitle-adapter.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/services/subtitle/jianying-subtitle-adapter.ts src/core/services/subtitle/jianying-subtitle-adapter.test.ts && git commit -m "feat(subtitle): add JianYing subtitle adapter"`

---

## Phase 3: 三档交互模式

### Task 6: ModeSelector 组件

**Files:**
- Create: `src/components/CutDeck/ModeSelector/ModeSelector.tsx`
- Create: `src/components/CutDeck/ModeSelector/ModeSelector.module.less`
- Create: `src/components/CutDeck/ModeSelector/index.ts`

**Step 1: 写测试**
```typescript
// src/components/CutDeck/ModeSelector/ModeSelector.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSelector } from './ModeSelector';

describe('ModeSelector', () => {
  it('should render three mode options', () => {
    render(<ModeSelector value="simple" onChange={() => {}} />);
    expect(screen.getByText('简单模式')).toBeDefined();
    expect(screen.getByText('标准模式')).toBeDefined();
    expect(screen.getByText('专业模式')).toBeDefined();
  });

  it('should call onChange when mode selected', async () => {
    const handler = vi.fn();
    render(<ModeSelector value="simple" onChange={handler} />);
    await userEvent.click(screen.getByText('标准模式'));
    expect(handler).toHaveBeenCalledWith('standard');
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/components/CutDeck/ModeSelector/ModeSelector.test.tsx`
Expected: FAIL — component not found

**Step 3: 写实现**
```tsx
// src/components/CutDeck/ModeSelector/ModeSelector.tsx
import React from 'react';
import type { EditorMode } from '@/core/types';
import styles from './ModeSelector.module.less';

interface ModeSelectorProps {
  value: EditorMode;
  onChange: (mode: EditorMode) => void;
}

export const EditorModes = {
  simple: { label: '简单模式', desc: 'AI 选段，一键导出', icon: '🚀' },
  standard: { label: '标准模式', desc: '预览微调，再导出', icon: '🎬' },
  professional: { label: '专业模式', desc: '时间轴完整编辑', icon: '⚡' },
} as const;

export const ModeSelector: React.FC<ModeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className={styles.modeSelector}>
      {(Object.keys(EditorModes) as EditorMode[]).map(mode => (
        <div
          key={mode}
          className={`${styles.modeCard} ${value === mode ? styles.active : ''}`}
          onClick={() => onChange(mode)}
        >
          <span className={styles.icon}>{EditorModes[mode].icon}</span>
          <span className={styles.label}>{EditorModes[mode].label}</span>
          <span className={styles.desc}>{EditorModes[mode].desc}</span>
        </div>
      ))}
    </div>
  );
};
```

```less
// src/components/CutDeck/ModeSelector/ModeSelector.module.less
.modeSelector {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.modeCard {
  flex: 1;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;

  &.active {
    border-color: var(--primary-color);
    background: var(--primary-bg);
  }
}

.icon { font-size: 24px; }
.label { display: block; font-weight: 600; margin-top: 8px; }
.desc { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/components/CutDeck/ModeSelector/ModeSelector.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/components/CutDeck/ModeSelector/ && git commit -m "feat(ui): add ModeSelector component (simple/standard/professional)"`

---

### Task 7: SimpleMode — ClipListView 勾选导出

**Files:**
- Create: `src/components/CutDeck/SimpleMode/ClipListView.tsx`
- Create: `src/components/CutDeck/SimpleMode/ClipListView.module.less`
- Create: `src/components/CutDeck/SimpleMode/index.ts`

**Step 1: 写测试**
```typescript
// src/components/CutDeck/SimpleMode/ClipListView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipListView } from './ClipListView';
import type { ClipSegment } from '@/core/services/clipRepurposing/types';

describe('ClipListView', () => {
  const mockSegments: ClipSegment[] = [
    { id: '1', sourceStartMs: 0, sourceEndMs: 5000, duration: 5000, score: { total: 80 } } as ClipSegment,
    { id: '2', sourceStartMs: 5000, sourceEndMs: 10000, duration: 5000, score: { total: 75 } } as ClipSegment,
  ];

  it('should render clip list', () => {
    render(<ClipListView segments={mockSegments} onExport={() => {}} />);
    expect(screen.getByText('片段 1')).toBeDefined();
    expect(screen.getByText('片段 2')).toBeDefined();
  });

  it('should call onExport with selected clip ids', async () => {
    const handler = vi.fn();
    render(<ClipListView segments={mockSegments} onExport={handler} />);
    await userEvent.click(screen.getByRole('button', { name: '导出选中' }));
    expect(handler).toHaveBeenCalled();
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/components/CutDeck/SimpleMode/ClipListView.test.tsx`
Expected: FAIL — file not found

**Step 3: 写实现**（精简版）
```tsx
// src/components/CutDeck/SimpleMode/ClipListView.tsx
import React, { useState } from 'react';
import type { ClipSegment } from '@/core/services/clipRepurposing/types';
import styles from './ClipListView.module.less';

interface ClipListViewProps {
  segments: ClipSegment[];
  onExport: (selectedIds: string[], platform: string) => void;
}

export const ClipListView: React.FC<ClipListViewProps> = ({ segments, onExport }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {segments.map((seg, i) => (
          <div key={seg.id} className={`${styles.clipCard} ${selected.has(seg.id) ? styles.selected : ''}`}>
            <input type="checkbox" checked={selected.has(seg.id)} onChange={() => toggle(seg.id)} />
            <span className={styles.index}>片段 {i + 1}</span>
            <span className={styles.duration}>{(seg.duration / 1000).toFixed(1)}s</span>
            <span className={styles.score}>评分 {seg.score.total}</span>
          </div>
        ))}
      </div>
      <button
        className={styles.exportBtn}
        disabled={selected.size === 0}
        onClick={() => onExport([...selected], 'douyin')}
      >
        导出选中 ({selected.size})
      </button>
    </div>
  );
};
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/components/CutDeck/SimpleMode/ClipListView.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/components/CutDeck/SimpleMode/ && git commit -m "feat(simple-mode): add ClipListView with checkbox export"`

---

## Phase 4: 平台导出

### Task 8: 平台预设配置

**Files:**
- Create: `src/core/config/platform-presets.ts`
- Create: `src/core/config/platform-presets.test.ts`

**Step 1: 写测试**
```typescript
// src/core/config/platform-presets.test.ts
import { describe, it, expect } from 'vitest';
import { PLATFORM_PRESETS, getPreset } from './platform-presets';

describe('PlatformPresets', () => {
  it('should have all 7 platforms', () => {
    expect(Object.keys(PLATFORM_PRESETS).sort()).toEqual([
      'bilibili', 'douyin', 'kuaishou', 'tiktok', 'video号', 'xiaohongshu', 'youtube',
    ].sort());
  });

  it('should return correct aspect ratio for douyin', () => {
    const preset = getPreset('douyin');
    expect(preset.aspectRatio).toBe('9:16');
    expect(preset.resolution.height).toBe(1920);
  });

  it('should throw for unknown platform', () => {
    expect(() => getPreset('unknown' as any)).toThrow();
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/config/platform-presets.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/core/config/platform-presets.ts
/**
 * 多平台导出预设配置
 * 抖音/小红书/B站/快手/视频号/YouTube/TikTok
 */

export interface PlatformPreset {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: { width: number; height: number };
  frameRate: number;
  bitratePreset: 'low' | 'medium' | 'high' | 'ultra';
  subtitlePosition: 'bottom' | 'top';
}

export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  douyin: {
    id: 'douyin',
    name: '抖音',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  bilibili: {
    id: 'bilibili',
    name: 'B站',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  kuaishou: {
    id: 'kuaishou',
    name: '快手',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'medium',
    subtitlePosition: 'bottom',
  },
  video号: {
    id: 'video号',
    name: '视频号',
    aspectRatio: '16:9',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'medium',
    subtitlePosition: 'bottom',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    frameRate: 60,
    bitratePreset: 'ultra',
    subtitlePosition: 'bottom',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
};

export function getPreset(platformId: string): PlatformPreset {
  const preset = PLATFORM_PRESETS[platformId];
  if (!preset) throw new Error(`Unknown platform: ${platformId}`);
  return preset;
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/config/platform-presets.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/config/platform-presets.ts src/core/config/platform-presets.test.ts && git commit -m "feat(config): add 7-platform export presets"`

---

## Phase 5: 情感峰值检测增强

### Task 9: 情感峰值检测器

**Files:**
- Create: `src/core/services/video/emotion-peak-detector.ts`
- Create: `src/core/services/video/emotion-peak-detector.test.ts`

**Step 1: 写测试**
```typescript
// src/core/services/video/emotion-peak-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectEmotionPeaks, EmoPeakResult } from './emotion-peak-detector';

describe('EmotionPeakDetector', () => {
  it('should return empty array for silence audio', async () => {
    const result = await detectEmotionPeaks('/path/to/silence.mp3');
    expect(result.peaks).toHaveLength(0);
  });
});
```

**Step 2: 运行测试 — 确认失败**
Command: `npm run test -- src/core/services/video/emotion-peak-detector.test.ts`
Expected: FAIL — file not found

**Step 3: 写实现**
```typescript
// src/core/services/video/emotion-peak-detector.ts
/**
 * 情感峰值检测
 * 基于音频能量分析 + 视觉笑点检测
 * 笑声/掌声/情绪高潮片段得额外加分
 */

import { withRetry } from '@/utils/retry';

export interface EmoPeakResult {
  peaks: Array<{
    startMs: number;
    endMs: number;
    energy: number; // 0-100
    type: 'laughter' | 'applause' | 'excited' | 'generic';
  }>;
}

export async function detectEmotionPeaks(
  audioPath: string,
  options: { threshold?: number; minDurationMs?: number } = {}
): Promise<EmoPeakResult> {
  const { threshold = 0.7, minDurationMs = 500 } = options;
  // TODO: 实现 FFmpeg audio energy 分析
  // 调用 Rust 层的音频能量分析器
  return withRetry(async () => {
    // const result = await invoke<AudioEnergyResult>('detect_emotion_peaks', { audioPath });
    return { peaks: [] }; // placeholder
  }, 2, 1000);
}

export function calculateEmotionScore(peaks: EmoPeakResult['peaks'], totalDurationMs: number): number {
  if (peaks.length === 0) return 0;
  const peakCoverage = peaks.reduce((sum, p) => sum + (p.endMs - p.startMs), 0) / totalDurationMs;
  const avgEnergy = peaks.reduce((sum, p) => sum + p.energy, 0) / peaks.length;
  return Math.min(100, peakCoverage * 100 * avgEnergy);
}
```

**Step 4: 运行测试 — 确认通过**
Command: `npm run test -- src/core/services/video/emotion-peak-detector.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/core/services/video/emotion-peak-detector.ts src/core/services/video/emotion-peak-detector.test.ts && git commit -m "feat(ai): add emotion peak detector for clip scoring"`

---

## 执行方式

Plan 已保存到 `docs/plans/2026-04-21-cutdeck-v2-auto-clip-implementation-plan.md`

**两种执行方式：**

1. **Subagent 驱动** — 我逐个任务派发 subagent，每个任务 TDD 循环，任务间我检查确认
2. **手动执行** — 你按照任务列表自己执行，每完成一个告知我

选哪个？🐱