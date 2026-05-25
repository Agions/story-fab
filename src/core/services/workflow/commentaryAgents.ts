import type { Scene, ScriptSegment, VideoAnalysis } from '@/core/types';
import type { WorkflowMode } from '../../workflow/featureBlueprint';
import { sceneCommentaryAlignmentService } from '../ai/sceneCommentaryService';

export type CommentaryAgentRole =
  | 'director-agent'
  | 'visual-analyst-agent'
  | 'narration-writer-agent'
  | 'timing-aligner-agent'
  | 'overlay-planner-agent';

export interface CommentaryAgentTask {
  id: string;
  role: CommentaryAgentRole;
  goal: string;
  inputs: string[];
  outputs: string[];
}

export interface CommentaryOrchestrationResult {
  tasks: CommentaryAgentTask[];
  alignedSegments: ScriptSegment[];
  overlayPlan: ReturnType<typeof sceneCommentaryAlignmentService.buildOriginalOverlayPlan>;
  alignmentSummary: {
    averageConfidence: number;
    maxDriftSeconds: number;
  };
}

// ─── Mode-specific guidance for narration writer ────────────────────────────────
const NARRATION_GUIDANCE: Record<WorkflowMode, string> = {
  'ai-commentary':
    '【对白层】从原字幕提取角色对话，保留说话人特征和语气词。' +
    '【旁白层】在对话之间插入过渡旁白，补充画面信息，平衡信息密度。',

  'ai-first-person':
    '【对白层】以第一人称"我"贯穿，解说主观感受和内心想法。' +
    '【旁白层】用"看到…""听到…"引导，将视觉冲击转化为个人叙事。',

  'ai-mixclip':
    '【对白层】极短（≤4秒），高能动词开头，制造节奏感。' +
    '【旁白层】仅在片段切换处提供1-2句背景交代，保持快节奏。',

  'ai-repurposing':
    '【对白层】从原字幕提炼金句和高光台词，保持原始感染力。' +
    '【旁白层】在情绪峰值处用短旁白放大冲击感，避免信息过载。',
};

const createAgentTasks = (mode: WorkflowMode): CommentaryAgentTask[] => {
  const modeGoalMap: Record<WorkflowMode, string> = {
    'ai-commentary': '确保专业解说与镜头信息密切对应，优先准确性和信息密度。',
    'ai-first-person': '构建第一人称叙事连贯性，保证主观镜头与口吻一致。',
    'ai-mixclip': '强化混剪节奏感，确保高能片段与极短旁白（≤4秒）节拍同步，制造流畅的视觉跳跃。',
    'ai-repurposing': '突出精彩片段的冲击感，从原字幕提炼高光金句，在情绪峰值处注入短旁白放大感染力。',
  };

  const narrativeGuidance = NARRATION_GUIDANCE[mode];

  return [
    {
      id: 'task-director',
      role: 'director-agent',
      goal: `制定镜头节奏策略。${modeGoalMap[mode]}`,
      inputs: ['视频时长', '镜头分布', '目标模式'],
      outputs: ['节奏计划', '段落优先级'],
    },
    {
      id: 'task-visual',
      role: 'visual-analyst-agent',
      goal: '解析场景语义与情绪峰值，提供可讲述画面锚点。识别高能片段（motionScore > 0.7）和情绪转折点作为解说注入点。',
      inputs: ['场景列表', '标签', '情绪信息'],
      outputs: ['场景摘要', '关键镜头锚点'],
    },
    {
      id: 'task-narration',
      role: 'narration-writer-agent',
      goal: `生成分层解说草稿。\n${narrativeGuidance}\n保持语言风格一致，注入情绪锚点（感叹词、节奏停顿）。`,
      inputs: ['段落模板', '模式约束', '场景摘要', '情绪锚点'],
      outputs: ['分段文案（对白层）', '分段文案（旁白层）', '语气一致性标记'],
    },
    {
      id: 'task-align',
      role: 'timing-aligner-agent',
      goal: '将文案段落时间映射到镜头段落，降低漂移（目标 < 1秒）。对白优先贴合原声，旁白可小幅偏移至视觉锚点。',
      inputs: ['场景时间轴', '文案段落（对白/旁白分层）'],
      outputs: ['对齐后段落', '漂移评估'],
    },
    {
      id: 'task-overlay',
      role: 'overlay-planner-agent',
      goal: '生成自动原画覆盖建议，增强画面与解说一致性。高能片段建议保留原画，情绪峰值处可用原画叠加。',
      inputs: ['对齐结果', '场景强度', '情绪锚点'],
      outputs: ['原画覆盖计划'],
    },
  ];
};

const allocateSegmentsToScenes = (
  scenes: Scene[],
  segments: ScriptSegment[],
  mode: WorkflowMode
): ScriptSegment[] => {
  if (!segments.length) return [];
  if (!scenes.length) return segments;

  const sortedScenes = [...scenes]
    .filter((scene) => scene.endTime > scene.startTime)
    .sort((a, b) => a.startTime - b.startTime);
  if (!sortedScenes.length) return segments;

  const sceneCount = sortedScenes.length;
  const totalDuration = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  if (totalDuration <= 0) return segments;

  // ── Build cumulative timeline from segments ───────────────────────────────
  // cumulativeEnd[i] = end time of segment i relative to video start
  const cumulativeEnd: number[] = [];
  let acc = 0;
  for (const seg of segments) {
    acc += seg.endTime - seg.startTime;
    cumulativeEnd.push(acc);
  }
  const videoEnd = acc;

  return segments.map((segment, index) => {
    // Proportional position in total video: [0, 1]
    const segMid = segment.startTime + (segment.endTime - segment.startTime) / 2;
    const videoPosition = videoEnd > 0 ? segMid / videoEnd : index / segments.length;

    // Map to scene timeline
    const sceneIndex = Math.min(
      sceneCount - 1,
      Math.floor(videoPosition * sceneCount)
    );
    const scene = sortedScenes[sceneIndex];
    const sceneDuration = Math.max(scene.endTime - scene.startTime, 0.1);
    const segDuration = segment.endTime - segment.startTime;

    if (mode === 'ai-mixclip') {
      // Focus on scene center, sized to segment
      const focusDuration = Math.min(sceneDuration, Math.max(segDuration, sceneDuration * 0.6));
      const center = (scene.startTime + scene.endTime) / 2;
      return {
        ...segment,
        startTime: Math.max(0, center - focusDuration / 2),
        endTime: center + focusDuration / 2,
      };
    }

    // Precise proportional mapping: fit segment within scene proportionally
    const clampedDuration = Math.min(segDuration, sceneDuration);
    return {
      ...segment,
      startTime: scene.startTime,
      endTime: scene.startTime + clampedDuration,
    };
  });
};

export function orchestrateCommentaryAgents(input: {
  mode: WorkflowMode;
  analysis: VideoAnalysis;
  segments: ScriptSegment[];
}): CommentaryOrchestrationResult {
  const tasks = createAgentTasks(input.mode);
  const scenes = input.analysis.scenes ?? [];
  const alignedSegments = allocateSegmentsToScenes(scenes, input.segments, input.mode);
  const alignmentItems = sceneCommentaryAlignmentService.align(scenes, alignedSegments);
  const overlayPlan = sceneCommentaryAlignmentService.buildOriginalOverlayPlan(scenes);
  const averageConfidence =
    alignmentItems.reduce((sum, item) => sum + item.confidence, 0) / Math.max(alignmentItems.length, 1);
  const maxDriftSeconds = alignmentItems.reduce((max, item) => Math.max(max, item.driftSeconds), 0);

  return {
    tasks,
    alignedSegments,
    overlayPlan,
    alignmentSummary: {
      averageConfidence: Number(averageConfidence.toFixed(4)),
      maxDriftSeconds: Number(maxDriftSeconds.toFixed(4)),
    },
  };
}

