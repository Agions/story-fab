/**
 * 智能转场推荐服务
 * 根据片段类型、时长、前后片段关系自动推荐最优转场特效
 */

import type { SmartVideoSegment } from '../../video/highlight.types';

// ============================================================
// Types
// ============================================================

export interface TransitionSuggestion {
  /** 推荐转场类型 */
  type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'glitch';
  /** 转场持续时间（秒），0 表示无转场 */
  duration: number;
  /** 推荐理由 */
  reason: string;
  /** 推荐置信度 0–1 */
  confidence: number;
}

// ============================================================
// 转场类型 × 片段类型 → 推荐映射表
// ============================================================

/**
 * 转场推荐策略矩阵
 * 键：(当前片段类型, 前一片段类型) → TransitionSuggestion
 *
 * 原则：
 * - scene change（场景切换）：视觉冲击优先 → dissolve / glitch
 * - action（动作片段）：节奏感优先 → wipe / slide
 * - dialogue（对话片段）：流畅过渡优先 → fade / dissolve
 * - silence / content（低能量）：快速过渡优先 → fade / none
 * - transition（本身就是转场）：无缝衔接 → none
 */
const TRANSITION_MAP: Record<string, TransitionSuggestion> = {
  // ── 当前: scene_change ─────────────────────────────────────
  'scene_change,dialogue':     { type: 'dissolve',  duration: 0.8, reason: '对话→场景切换，dissolve 保持叙事流畅感', confidence: 0.85 },
  'scene_change,action':        { type: 'glitch',    duration: 0.4, reason: '动作→场景切换，glitch 增强视觉冲击', confidence: 0.8  },
  'scene_change,transition':    { type: 'fade',      duration: 0.6, reason: '已有转场感，fade 让节奏更平滑',    confidence: 0.75 },
  'scene_change,content':      { type: 'dissolve',  duration: 0.7, reason: '内容→场景切换，dissolve 自然过渡',  confidence: 0.8  },
  'scene_change,silence':       { type: 'fade',      duration: 0.4, reason: '静音→场景切换，fade 快速衔接',      confidence: 0.7  },
  'scene_change,_first':        { type: 'fade',      duration: 0.5, reason: '视频开头淡入，自然引入',             confidence: 0.9  },

  // ── 当前: action ───────────────────────────────────────────
  'action,dialogue':           { type: 'wipe',      duration: 0.5, reason: '对话→动作，wipe 保持节奏冲击力',     confidence: 0.8  },
  'action,action':             { type: 'wipe',      duration: 0.4, reason: '动作→动作，wipe 切换增强节奏感',     confidence: 0.75 },
  'action,transition':         { type: 'slide',     duration: 0.4, reason: '转场→动作，slide 滑入加速节奏',      confidence: 0.7  },
  'action,content':            { type: 'wipe',      duration: 0.5, reason: '内容→动作，wipe 切换提升动感',       confidence: 0.8  },
  'action,silence':            { type: 'fade',      duration: 0.3, reason: '静音→动作，fade 快速过渡节省时间',   confidence: 0.65 },
  'action,_first':             { type: 'fade',      duration: 0.5, reason: '视频开头动作，淡入引入',             confidence: 0.8  },

  // ── 当前: dialogue ─────────────────────────────────────────
  'dialogue,dialogue':         { type: 'fade',      duration: 0.4, reason: '对话→对话，fade 自然衔接无割裂感',   confidence: 0.85 },
  'dialogue,action':           { type: 'dissolve',  duration: 0.6, reason: '动作→对话，dissolve 柔和过渡',       confidence: 0.8  },
  'dialogue,transition':       { type: 'fade',      duration: 0.4, reason: '转场→对话，fade 保持连贯性',        confidence: 0.75 },
  'dialogue,content':         { type: 'fade',      duration: 0.5, reason: '内容→对话，fade 平滑过渡',           confidence: 0.8  },
  'dialogue,silence':          { type: 'fade',      duration: 0.3, reason: '静音→对话，fade 快速衔接不拖沓',     confidence: 0.7  },
  'dialogue,_first':          { type: 'fade',      duration: 0.6, reason: '视频开头对话，淡入自然',               confidence: 0.85 },

  // ── 当前: transition ──────────────────────────────────────
  'transition,_any':           { type: 'none',      duration: 0,   reason: '本身已是转场片段，无需额外转场',     confidence: 0.95 },

  // ── 当前: content ─────────────────────────────────────────
  'content,dialogue':          { type: 'fade',      duration: 0.5, reason: '对话→内容，fade 自然过渡',            confidence: 0.8  },
  'content,action':            { type: 'slide',     duration: 0.4, reason: '动作→内容，slide 保持动感',            confidence: 0.75 },
  'content,transition':        { type: 'fade',      duration: 0.3, reason: '转场→内容，fade 快速衔接',           confidence: 0.7  },
  'content,content':           { type: 'none',      duration: 0,   reason: '同类内容直接切换，节省时间',          confidence: 0.6  },
  'content,silence':           { type: 'fade',      duration: 0.2, reason: '静音→内容，fade 快速过渡',           confidence: 0.6  },
  'content,_first':            { type: 'fade',      duration: 0.5, reason: '视频开头，淡入引入',                  confidence: 0.8  },

  // ── 当前: silence ─────────────────────────────────────────
  'silence,dialogue':          { type: 'fade',      duration: 0.3, reason: '对话→静音，fade 平滑过渡',            confidence: 0.75 },
  'silence,action':           { type: 'slide',     duration: 0.3, reason: '动作→静音，slide 保持节奏',            confidence: 0.7  },
  'silence,transition':        { type: 'fade',      duration: 0.2, reason: '转场→静音，fade 快速衔接',           confidence: 0.7  },
  'silence,content':           { type: 'fade',      duration: 0.2, reason: '内容→静音，fade 快速过渡',            confidence: 0.65 },
  'silence,silence':           { type: 'none',      duration: 0,   reason: '连续静音片段，直接跳转节省时间',     confidence: 0.9  },
  'silence,_first':            { type: 'fade',      duration: 0.3, reason: '视频开头静音，淡入引入',             confidence: 0.8  },
};

/** 默认推荐：用于未匹配到规则的情况 */
const DEFAULT_SUGGESTION: TransitionSuggestion = {
  type: 'fade',
  duration: 0.5,
  reason: '默认淡入淡出转场，适用大多数场景',
  confidence: 0.5,
};

// ============================================================
// 辅助函数
// ============================================================

/** 归一化片段类型字符串（兼容 Rust 传来的 snake_case 和 TS 中的其他格式） */
function normalizeType(t: string | undefined): string {
  if (!t) return 'content';
  const map: Record<string, string> = {
    dialogue: 'dialogue',
    action: 'action',
    transition: 'transition',
    silence: 'silence',
    content: 'content',
    scene: 'scene_change',
    'scene-change': 'scene_change',
    'ai-suggested': 'content',
    'zcr-burst': 'action',
    'keyframe': 'content',
    manual: 'content',
  };
  return map[t.toLowerCase()] ?? t;
}

/** 从映射表查找推荐 */
function lookup(prev: string, curr: string): TransitionSuggestion {
  return TRANSITION_MAP[`${curr},${prev}`] ?? TRANSITION_MAP[`${curr},_any`] ?? DEFAULT_SUGGESTION;
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 根据当前片段和前一片段推荐转场
 *
 * @param segment 当前片段
 * @param prevSegment 前一片段（可选；不传表示当前片段是视频第一段）
 * @param nextSegment 下一片段（用于判断片尾是否需要淡出）
 */
export function getSuggestedTransition(
  segment: SmartVideoSegment,
  prevSegment?: SmartVideoSegment,
  nextSegment?: SmartVideoSegment,
): TransitionSuggestion {
  const curr = normalizeType(segment.segmentType);

  // 片尾检测：如果下一片段不存在，当前片段是最后一个 → 建议淡出
  if (!nextSegment) {
    if (curr === 'silence') {
      return { type: 'fade', duration: 0.5, reason: '片尾静音，淡出结束', confidence: 0.9 };
    }
    return { type: 'fade', duration: 0.8, reason: '片尾淡出，自然收尾', confidence: 0.85 };
  }

  const prev = prevSegment ? normalizeType(prevSegment.segmentType) : '_first';

  // 规则匹配
  const suggestion = lookup(prev, curr);

  // 时长微调：超短片段（< 3s）缩短转场，避免喧宾夺主
  if (segment.durationMs < 3000 && suggestion.duration > 0) {
    return { ...suggestion, duration: suggestion.duration * 0.5, reason: `${suggestion.reason}（片段过短，缩短转场）` };
  }

  // 长片段（> 20s）可以适当延长转场，增强节奏感
  if (segment.durationMs > 20000 && suggestion.duration > 0) {
    return { ...suggestion, duration: suggestion.duration * 1.3, reason: `${suggestion.reason}（片段较长，延长转场增强节奏）` };
  }

  return suggestion;
}

/**
 * 获取某片段类型的默认转场预设（用于 UI 初始化）
 */
export function getDefaultTransitionForType(
  segmentType: string,
): Pick<TransitionSuggestion, 'type' | 'duration'> {
  const suggestion = getSuggestedTransition({ segmentType } as SmartVideoSegment);
  return { type: suggestion.type, duration: suggestion.duration };
}
