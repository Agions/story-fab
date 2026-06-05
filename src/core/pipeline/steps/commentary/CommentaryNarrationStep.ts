/**
 * CommentaryNarrationStep — narration-writer-agent
 *
 * 职责：生成分层解说草稿（对白层 + 旁白层）
 * 输入：state + directorPlan + visualAnalysis
 * 输出：state + draftScript
 *
 * Step 3/5
 * 进度范围：[0.40, 0.65]
 */

import { createStep, reportProgress } from '../../Step';
import { logger } from '../../../../shared/utils/logging';
import {
  type CommentaryNarrationInput,
  type CommentaryNarrationOutput,
  type DraftScript,
} from './types';
import type { ScriptSegment } from '@/core/types';

// ============================================================
// Step Metadata
// ============================================================

const STEP_META = {
  name: 'commentary-narration',
  description: '生成分层解说草稿 (narration-writer-agent)',
  estimatedDuration: 3,
};

// ============================================================
// 模式相关引导
// ============================================================

const MODE_TONE: Record<string, string> = {
  'ai-commentary': '客观专业',
  'ai-first-person': '主观沉浸',
  'ai-mixclip': '快节奏冲击',
  'ai-repurposing': '金句提炼',
};

const MODE_DIALOGUE_MAX: Record<string, number> = {
  'ai-commentary': 12,
  'ai-first-person': 12,
  'ai-mixclip': 4, // 极短
  'ai-repurposing': 8,
};

// ============================================================
// 辅助
// ============================================================

/**
 * 拆分对白层和旁白层
 * 启发式规则：
 * - 有 type=dialogue 显式标记的 → dialogue
 * - 有 voice 字段的 → 视为已有配音的旁白
 * - 其他 → narration
 */
const splitDialogueVsNarration = (
  segments: ScriptSegment[],
  mode: string
): { dialogue: ScriptSegment[]; narration: ScriptSegment[] } => {
  const maxDialogue = MODE_DIALOGUE_MAX[mode] ?? 12;
  const dialogue: ScriptSegment[] = [];
  const narration: ScriptSegment[] = [];

  for (const seg of segments) {
    const isDialogue = seg.type === 'dialogue' || (seg.text ?? seg.content ?? '').includes('"');
    if (isDialogue && seg.endTime - seg.startTime <= maxDialogue) {
      dialogue.push(seg);
    } else {
      narration.push(seg);
    }
  }

  return { dialogue, narration };
};

/**
 * 计算语气一致性 (简单启发式)
 * 真实场景用 embedding similarity
 * 这里用模式匹配看是否包含情绪关键词
 */
const computeToneConsistency = (segments: ScriptSegment[], mode: string): number => {
  if (segments.length === 0) return 1.0;
  const expectedTone = MODE_TONE[mode] ?? '客观专业';

  const toneKeywords: Record<string, string[]> = {
    '客观专业': ['分析', '可见', '表现', '呈现', '展示', '原因'],
    '主观沉浸': ['我', '我们', '感觉', '看到', '听到'],
    '快节奏冲击': ['爆', '炸', '燃', '冲', '爆裂'],
    '金句提炼': ['原来', '其实', '真相', '秘密', '终于'],
  };

  const keywords = toneKeywords[expectedTone] ?? [];
  if (keywords.length === 0) return 0.8;

  let matchCount = 0;
  for (const seg of segments) {
    const text = seg.text ?? seg.content ?? '';
    if (keywords.some((kw) => text.includes(kw))) matchCount++;
  }

  return Math.min(1, matchCount / segments.length + 0.3);
};

// ============================================================
// Step Implementation
// ============================================================

export const commentaryNarrationStep: import('../../Step').Step<
  CommentaryNarrationInput,
  CommentaryNarrationOutput
> = createStep(STEP_META, async (input, _ctx, options) => {
  const { state } = input;
  const { mode, segments } = state;

  reportProgress(options?.onProgress, STEP_META.name, 0.2, 'narration 拆分对白/旁白层...');

  const { dialogue, narration } = splitDialogueVsNarration(segments, mode);

  reportProgress(options?.onProgress, STEP_META.name, 0.6, 'narration 评估语气一致性...');

  const toneConsistency = computeToneConsistency(narration, mode);

  reportProgress(options?.onProgress, STEP_META.name, 0.9, 'narration 草稿组装...');

  const fullText = [...dialogue, ...narration]
    .map((s) => s.text ?? s.content ?? '')
    .filter(Boolean)
    .join('\n');

  const draftScript: DraftScript = {
    dialogueSegments: dialogue,
    narrationSegments: narration,
    toneConsistency,
    fullText,
  };

  logger.debug(`[${STEP_META.name}] narration 完成`, {
    dialogue: dialogue.length,
    narration: narration.length,
    toneConsistency: toneConsistency.toFixed(3),
  });

  return {
    state: {
      ...state,
      directorPlan: state.directorPlan!,
      visualAnalysis: state.visualAnalysis!,
      draftScript,
    },
  };
});

export default commentaryNarrationStep;
