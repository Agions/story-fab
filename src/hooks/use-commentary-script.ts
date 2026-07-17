/**
 * useCommentaryScript — Script generation and editing
 *
 * - script state, multiStyleMode/scripts/activeScriptStyle
 * - handleGenerateScript, handleMultiStyleGenerate, handleSegmentChange
 * - calibrateTimelineWithTTS as pure async function
 */

import { useState, useCallback } from 'react';
import { generateCommentaryScript, estimateTTSDuration } from '@/core/services/commentary';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/shared/utils/logging';
import type {
  CommentaryScriptOutput,
  ScriptStylePreset,
} from '@/types';

interface UseCommentaryScriptResult {
  script: CommentaryScriptOutput | null;
  scripts: Map<ScriptStylePreset, CommentaryScriptOutput>;
  activeScriptStyle: ScriptStylePreset | null;
  multiStyleMode: boolean;
  isGenerating: boolean;
  generate: (params: {
    sessionId: string;
    subtitles: string;
    apiKey: string;
    selectedStyle: ScriptStylePreset;
    durationSecs?: number;
  }) => Promise<void>;
  multiGenerate: (params: {
    sessionId: string;
    subtitles: string;
    apiKey: string;
    selectedStyles: ScriptStylePreset[];
    durationSecs?: number;
  }) => Promise<void>;
  setScript: (s: CommentaryScriptOutput | null) => void;
  setMultiStyleMode: (v: boolean) => void;
  setSelectedStyles: (styles: ScriptStylePreset[]) => void;
  setActiveScriptStyle: (style: ScriptStylePreset | null) => void;
  updateSegment: (index: number, text: string) => void;
  calibrate: (targetScript: CommentaryScriptOutput, voice: string) => Promise<CommentaryScriptOutput>;
}

/**
 * Pure async function: calibrate timeline with TTS duration estimates
 */
async function calibrateTimelineWithTTS(
  targetScript: CommentaryScriptOutput,
  voice: string,
): Promise<CommentaryScriptOutput> {
  try {
    const segmentsWithDuration = await Promise.all(
      targetScript.segments.map(async (seg) => {
        const duration = await estimateTTSDuration(seg.text, voice);
        return { ...seg, endTime: seg.startTime + duration };
      })
    );

    // Recalculate cumulative timing
    let cumulativeStart = 0;
    const calibrated = segmentsWithDuration.map((seg) => {
      const dur = seg.endTime - seg.startTime;
      const start = cumulativeStart;
      cumulativeStart += dur;
      return { ...seg, startTime: start, endTime: cumulativeStart };
    });

    const totalDuration = calibrated.reduce(
      (sum, seg) => sum + (seg.endTime - seg.startTime),
      0
    );

    return {
      ...targetScript,
      segments: calibrated,
      estimatedDurationSecs: totalDuration,
    };
  } catch (e) {
    logger.warn('[calibrateTimelineWithTTS] TTS duration calibration failed, using original:', e);
    return targetScript;
  }
}

export function useCommentaryScript(): UseCommentaryScriptResult {
  const [script, setScript] = useState<CommentaryScriptOutput | null>(null);
  const [multiStyleMode, setMultiStyleMode] = useState(false);
  const [_selectedStyles, setSelectedStyles] = useState<ScriptStylePreset[]>(['conversational']);
  const [scripts, setScripts] = useState<Map<ScriptStylePreset, CommentaryScriptOutput>>(new Map());
  const [activeScriptStyle, setActiveScriptStyle] = useState<ScriptStylePreset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (params: {
    sessionId: string;
    subtitles: string;
    apiKey: string;
    selectedStyle: ScriptStylePreset;
    durationSecs?: number;
  }) => {
    const { sessionId, subtitles, apiKey, selectedStyle, durationSecs } = params;

    if (!sessionId || !subtitles.trim()) {
      toast.error('请先导入字幕文件');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('请先填写 API Key');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCommentaryScript({
        subtitles,
        durationSecs,
        targetDurationSecs: durationSecs,
        style: selectedStyle,
        apiKey,
        provider: 'openai',
      });
      setScript(result);
      toast.success('解说脚本生成成功 🎉');
    } catch (e) {
      logger.error('[useCommentaryScript] 生成脚本失败:', e);
      toast.error(`生成失败: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const multiGenerate = useCallback(async (params: {
    sessionId: string;
    subtitles: string;
    apiKey: string;
    selectedStyles: ScriptStylePreset[];
    durationSecs?: number;
  }) => {
    const { sessionId, subtitles, apiKey, selectedStyles: styles, durationSecs } = params;

    if (!sessionId || !subtitles.trim()) {
      toast.error('请先导入字幕文件');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('请先填写 API Key');
      return;
    }
    if (styles.length === 0) {
      toast.error('请至少选择一个风格');
      return;
    }

    setIsGenerating(true);
    try {
      const newScripts = new Map<ScriptStylePreset, CommentaryScriptOutput>();
      for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        setActiveScriptStyle(style);

        const result = await generateCommentaryScript({
          subtitles,
          durationSecs,
          targetDurationSecs: durationSecs,
          style,
          apiKey,
          provider: 'openai',
        });
        newScripts.set(style, result);
      }
      setScripts(newScripts);
      setScript(newScripts.get(styles[0]) ?? null);
      setActiveScriptStyle(styles[0]);
      toast.success(`批量生成完成！共 ${newScripts.size} 个版本 🎉`);
    } catch (e) {
      logger.error('[useCommentaryScript] 批量生成失败:', e);
      toast.error(`生成失败: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const updateSegment = useCallback((index: number, text: string) => {
    // ScriptSegment uses `content` (not `text`) as the canonical field name —
    // spreading and overriding `text` would silently no-op.
    const applyContent = (seg: typeof text extends never ? never : { content?: string } & Record<string, unknown>, i: number) =>
      i === index ? { ...seg, content: text } : seg;

    // Multi-style mode: update corresponding style's script
    if (multiStyleMode && activeScriptStyle) {
      // Capture activeScriptStyle into a const so TS knows it's defined in closures
      const styleKey = activeScriptStyle;
      setScripts((prev) => {
        const next = new Map(prev);
        const current = next.get(styleKey);
        if (current) {
          next.set(styleKey, {
            ...current,
            segments: current.segments.map((seg, i) => applyContent(seg, i)),
          });
        }
        return next;
      });
      // Also update currently displayed script
      setScript((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          segments: prev.segments.map((seg, i) => applyContent(seg, i)),
        };
      });
    } else {
      // Single-style mode
      setScript((prev) => {
        if (!prev) return prev;
        const segments = prev.segments.map((seg, i) => applyContent(seg, i));
        return { ...prev, segments };
      });
    }
  }, [multiStyleMode, activeScriptStyle]);

  const calibrate = useCallback(calibrateTimelineWithTTS, []);

  return {
    script,
    scripts,
    activeScriptStyle,
    multiStyleMode,
    isGenerating,
    generate,
    multiGenerate,
    setScript,
    setMultiStyleMode,
    setSelectedStyles,
    setActiveScriptStyle,
    updateSegment,
    calibrate,
  };
}