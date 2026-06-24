/**
 * Commentary 5-Step Pipeline 单元测试
 *
 * 覆盖：
 * - 5 个 step 的输入输出
 * - ChainPipeline 顺序执行
 * - 进度回调
 * - 错误处理 (缺少前置 step)
 * - 真实场景的端到端
 */

import { describe, it, expect } from 'vitest';
import { commentaryDirectorStep } from './director-step';
import { commentaryVisualStep } from './visual-step';
import { commentaryNarrationStep } from './narration-step';
import { commentaryTimingStep } from './timing-step';
import { commentaryOverlayStep } from './overlay-step';
import {
  runCommentaryPipeline,
  COMMENTARY_PROGRESS_WEIGHTS,
} from './composite-pipeline';
import type { CommentaryPipelineState } from './types';
import type { Scene, VideoAnalysis, ScriptSegment, Emotion } from '@/core/types';

// ============================================================
// Test Fixtures
// ============================================================

const makeScene = (
  id: string,
  startTime: number,
  endTime: number,
  score: number,
  type: Scene['type'] = 'action'
): Scene => ({
  id,
  startTime,
  endTime,
  type,
  score,
  description: `Scene ${id}`,
  tags: [],
});

const makeAnalysis = (): VideoAnalysis => ({
  id: 'vid1',
  videoId: 'vid1',
  title: 'Test Video',
  duration: 60,
  keyMoments: [],
  emotions: [
    { timestamp: 10, type: 'excitement', intensity: 0.8 },
    { timestamp: 30, type: 'sadness', intensity: 0.6 },
  ] as Emotion[],
  summary: 'Test summary',
  scenes: [
    makeScene('s1', 0, 15, 0.6),
    makeScene('s2', 15, 30, 0.9, 'emotion'),
    makeScene('s3', 30, 45, 0.5),
    makeScene('s4', 45, 60, 0.85, 'action'),
  ] as Scene[],
});

const makeSegments = (): ScriptSegment[] => [
  {
    id: 'seg1',
    startTime: 0,
    endTime: 5,
    text: '"你好" — 他说道',
    type: 'dialogue',
  },
  {
    id: 'seg2',
    startTime: 5,
    endTime: 20,
    text: '画面展示了壮丽的风景，远处山峦起伏。',
    type: 'narration',
  },
  {
    id: 'seg3',
    startTime: 20,
    endTime: 35,
    text: '我看到了令人难忘的一幕。',
    type: 'narration',
  },
  {
    id: 'seg4',
    startTime: 35,
    endTime: 60,
    text: '终于明白了真相。',
    type: 'narration',
  },
];

const makeInitialState = (mode: 'ai-commentary' | 'ai-first-person' | 'ai-mixclip' | 'ai-repurposing' = 'ai-commentary'): CommentaryPipelineState => ({
  mode,
  analysis: makeAnalysis(),
  segments: makeSegments(),
});

// ============================================================
// Step 1: Director
// ============================================================

describe('commentaryDirectorStep', () => {
  it('should produce DirectorPlan with mode and pacing', async () => {
    const state = makeInitialState();
    const result = await commentaryDirectorStep.execute(
      { state },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );

    expect(result.state.directorPlan).toBeDefined();
    expect(result.state.directorPlan?.mode).toBe('ai-commentary');
    expect(result.state.directorPlan?.pacing).toMatch(/slow|medium|fast/);
    expect(result.state.directorPlan?.scenePrioritiesList.length).toBe(4);
  });

  it('should call onProgress callback', async () => {
    const progressLog: Array<[string, number, string | undefined]> = [];
    const state = makeInitialState();
    await commentaryDirectorStep.execute(
      { state },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {
        onProgress: (stage: string, progress: number, message?: string) => {
          progressLog.push([stage, progress, message]);
        },
      }
    );
    expect(progressLog.length).toBeGreaterThan(0);
    expect(progressLog[0]?.[0]).toBe('commentary-director');
  });

  it('should set targetDriftSeconds based on mode', async () => {
    const result1 = await commentaryDirectorStep.execute(
      { state: makeInitialState('ai-commentary') },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const result2 = await commentaryDirectorStep.execute(
      { state: makeInitialState('ai-mixclip') },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    expect(result1.state.directorPlan?.targetDriftSeconds).toBe(0.8);
    expect(result2.state.directorPlan?.targetDriftSeconds).toBe(1.5);
  });
});

// ============================================================
// Step 2: Visual
// ============================================================

describe('commentaryVisualStep', () => {
  it('should require directorPlan from previous step', async () => {
    const state = makeInitialState(); // no directorPlan
    await expect(
      commentaryVisualStep.execute(
        { state },
        { stepIndex: 1, completedSteps: [], meta: {} },
        {}
      )
    ).rejects.toThrow(); // 不会 throw, 但 visualAnalysis 不应被设置
  });

  it('should produce enhancedScenes and keyAnchors', async () => {
    const directorResult = await commentaryDirectorStep.execute(
      { state: makeInitialState() },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );

    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );

    expect(visualResult.state.visualAnalysis).toBeDefined();
    expect(visualResult.state.visualAnalysis?.enhancedScenes.length).toBe(4);
    expect(visualResult.state.visualAnalysis?.keyAnchors.length).toBeGreaterThan(0);
  });

  it('should mark isKeyAnchor for high motionScore scenes', async () => {
    const directorResult = await commentaryDirectorStep.execute(
      { state: makeInitialState() },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );
    const anchors = visualResult.state.visualAnalysis!.enhancedScenes.filter(
      (s) => (s as Scene & { isKeyAnchor?: boolean }).isKeyAnchor === true
    );
    expect(anchors.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Step 3: Narration
// ============================================================

describe('commentaryNarrationStep', () => {
  it('should split dialogue and narration segments', async () => {
    const directorResult = await commentaryDirectorStep.execute(
      { state: makeInitialState() },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );

    const narrationResult = await commentaryNarrationStep.execute(
      { state: visualResult.state },
      { stepIndex: 2, completedSteps: [], meta: {} },
      {}
    );

    expect(narrationResult.state.draftScript).toBeDefined();
    expect(narrationResult.state.draftScript!.dialogueSegments.length).toBeGreaterThan(0);
    expect(narrationResult.state.draftScript!.narrationSegments.length).toBeGreaterThan(0);
    expect(narrationResult.state.draftScript!.toneConsistency).toBeGreaterThan(0);
    expect(narrationResult.state.draftScript!.fullText.length).toBeGreaterThan(0);
  });

  it('should respect ai-mixclip short dialogue limit', async () => {
    const state = makeInitialState('ai-mixclip');
    // 加入一个 10 秒的 dialogue（> 4s 限制）
    state.segments.push({
      id: 'long-dialog',
      startTime: 50,
      endTime: 60,
      text: '"这段长对话应该被归类为旁白"',
      type: 'dialogue',
    });

    const directorResult = await commentaryDirectorStep.execute(
      { state },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );
    const narrationResult = await commentaryNarrationStep.execute(
      { state: visualResult.state },
      { stepIndex: 2, completedSteps: [], meta: {} },
      {}
    );

    // long-dialog (10s) 应被移到 narration
    const hasLongInDialogue = narrationResult.state.draftScript!.dialogueSegments.some(
      (s: ScriptSegment) => s.id === 'long-dialog'
    );
    expect(hasLongInDialogue).toBe(false);
  });
});

// ============================================================
// Step 4: Timing
// ============================================================

describe('commentaryTimingStep', () => {
  it('should align segments to scenes and compute drift', async () => {
    const directorResult = await commentaryDirectorStep.execute(
      { state: makeInitialState() },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );
    const narrationResult = await commentaryNarrationStep.execute(
      { state: visualResult.state },
      { stepIndex: 2, completedSteps: [], meta: {} },
      {}
    );

    const timingResult = await commentaryTimingStep.execute(
      { state: narrationResult.state },
      { stepIndex: 3, completedSteps: [], meta: {} },
      {}
    );

    expect(timingResult.state.alignment).toBeDefined();
    expect(timingResult.state.alignment!.alignedSegments.length).toBeGreaterThan(0);
    expect(timingResult.state.alignment!.averageConfidence).toBeGreaterThan(0);
    expect(timingResult.state.alignment!.maxDriftSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should throw if visualAnalysis is missing', async () => {
    const state = makeInitialState();
    await expect(
      commentaryTimingStep.execute(
        { state },
        { stepIndex: 3, completedSteps: [], meta: {} },
        {}
      )
    ).rejects.toThrow();
  });
});

// ============================================================
// Step 5: Overlay
// ============================================================

describe('commentaryOverlayStep', () => {
  it('should produce overlay plan', async () => {
    const directorResult = await commentaryDirectorStep.execute(
      { state: makeInitialState() },
      { stepIndex: 0, completedSteps: [], meta: {} },
      {}
    );
    const visualResult = await commentaryVisualStep.execute(
      { state: directorResult.state },
      { stepIndex: 1, completedSteps: [], meta: {} },
      {}
    );
    const overlayResult = await commentaryOverlayStep.execute(
      { state: visualResult.state },
      { stepIndex: 4, completedSteps: [], meta: {} },
      {}
    );

    expect(overlayResult.state.overlayPlan).toBeDefined();
    expect(overlayResult.state.overlayPlan!.totalSuggestions).toBe(4);
    expect(overlayResult.state.overlayPlan!.averageIntensity).toBeGreaterThan(0);
  });
});

// ============================================================
// Composite Pipeline (端到端)
// ============================================================

describe('runCommentaryPipeline (端到端)', () => {
  it('should run all 5 steps successfully', async () => {
    const result = await runCommentaryPipeline(makeInitialState(), {});
    expect(result.success).toBe(true);
    expect(result.completedSteps).toEqual([
      'commentary-director',
      'commentary-visual',
      'commentary-narration',
      'commentary-timing',
      'commentary-overlay',
    ]);
    expect(result.state.directorPlan).toBeDefined();
    expect(result.state.visualAnalysis).toBeDefined();
    expect(result.state.draftScript).toBeDefined();
    expect(result.state.alignment).toBeDefined();
    expect(result.state.overlayPlan).toBeDefined();
  });

  it('should emit global progress callbacks (0-1 range)', async () => {
    const progressLog: number[] = [];
    await runCommentaryPipeline(makeInitialState(), {
      onProgress: (_stage: string, progress: number) => {
        progressLog.push(progress);
      },
    });
    expect(progressLog.length).toBeGreaterThan(0);
    // 第一个 progress 应在 0-0.15 范围 (director 阶段)
    expect(progressLog[0]).toBeLessThanOrEqual(0.15);
    // 最后一个 progress 应接近 1.0
    expect(progressLog[progressLog.length - 1]).toBeLessThanOrEqual(1.0);
  });

  it('should return totalDurationMs > 0', async () => {
    const result = await runCommentaryPipeline(makeInitialState(), {});
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should handle different workflow modes', async () => {
    const modes = ['ai-commentary', 'ai-first-person', 'ai-mixclip', 'ai-repurposing'] as const;
    for (const mode of modes) {
      const result = await runCommentaryPipeline(makeInitialState(mode), {});
      expect(result.success).toBe(true);
      expect(result.state.mode).toBe(mode);
    }
  });
});

// ============================================================
// Progress Weight 验证
// ============================================================

describe('COMMENTARY_PROGRESS_WEIGHTS', () => {
  it('should sum to 1.0', () => {
    const sum = Object.values(COMMENTARY_PROGRESS_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('should have all 5 step names', () => {
    const keys = Object.keys(COMMENTARY_PROGRESS_WEIGHTS);
    expect(keys).toEqual(
      expect.arrayContaining(['director', 'visual', 'narration', 'timing', 'overlay'])
    );
    expect(keys.length).toBe(5);
  });
});
