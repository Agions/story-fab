/**
 * useCommentary — AI 解说模式面板自定义 Hook
 */

import { useCallback } from 'react';
import { useReducerHookFactory } from '@/shared/hooks/use-reducer-hook';
import {
  commentaryPanelReducer,
  initialCommentaryPanelState,
  type CommentaryPanelState,
  type CommentaryPanelAction,
} from './commentary-panel-reducer';
import { useCommentarySession } from '@/hooks/use-commentary-session';
import { useDirectorStatus } from '@/hooks/use-director-status';
import { useCommentaryScript } from '@/hooks/use-commentary-script';
import { useCommentaryVoice } from '@/hooks/use-commentary-voice';
import { useCommentaryPipeline } from '@/hooks/use-commentary-pipeline';
import { generateCommentaryPlan, approveCommentaryPlan, type ScriptStylePreset } from '@/core/services/commentary';
import { toast } from '@/components/ui/sonner';
import type { CommentaryScriptOutput, VoiceInfo, PipelineProgressEvent, PipelineErrorEvent, DirectorStatusResponse } from '@/types';

export interface UseCommentaryReturn {
  state: CommentaryPanelState;
  dispatch: React.Dispatch<CommentaryPanelAction>;
  sessionId: string | null;
  directorStatus: DirectorStatusResponse | null;
  currentState: string;
  progressPct: number;
  script: CommentaryScriptOutput | null;
  scripts: Map<ScriptStylePreset, CommentaryScriptOutput>;
  activeScriptStyle: ScriptStylePreset | null;
  multiStyleMode: boolean;
  isGenerating: boolean;
  voices: VoiceInfo[];
  selectedVoice: string;
  isPreviewing: boolean;
  isPipelineRunning: boolean;
  pipelineProgress: PipelineProgressEvent | null;
  pipelineError: PipelineErrorEvent | null;
  handleGenerateScript: () => Promise<void>;
  handleMultiStyleGenerate: () => Promise<void>;
  handleSegmentChange: (index: number, text: string) => void;
  handleGeneratePlan: () => Promise<void>;
  handleApprovePlan: () => Promise<void>;
  handlePreviewVoice: () => Promise<void>;
  toggleMultiStyleMode: () => void;
  handleRunPipeline: () => Promise<void>;
}

export function useCommentary(videoPath: string, subtitles: string, durationSecs?: number, disabled = false): UseCommentaryReturn {
  const { state, dispatch } = useReducerHookFactory(commentaryPanelReducer, initialCommentaryPanelState);
  const { apiKey, selectedStyle } = state;

  const { sessionId, directorStatus } = useCommentarySession(videoPath, selectedStyle, disabled);
  const { currentState, progressPct } = useDirectorStatus(sessionId);

  const {
    script,
    scripts,
    activeScriptStyle,
    multiStyleMode,
    isGenerating,
    generate,
    multiGenerate,
    setScript,
    setMultiStyleMode,
    updateSegment,
  } = useCommentaryScript();

  const {
    voices,
    selectedVoice,
    previewVoice,
    isPreviewing,
  } = useCommentaryVoice();

  const {
    run: runPipeline,
    progress: pipelineProgress,
    error: pipelineError,
    isRunning: isPipelineRunning,
  } = useCommentaryPipeline();

  const handleGenerateScript = useCallback(async () => {
    if (!sessionId) return;
    await generate({ sessionId, subtitles, apiKey, selectedStyle, durationSecs });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'script' });
  }, [sessionId, subtitles, apiKey, selectedStyle, durationSecs, generate, dispatch]);

  const handleMultiStyleGenerate = useCallback(async () => {
    if (!sessionId) return;
    await multiGenerate({ sessionId, subtitles, apiKey, selectedStyles: [selectedStyle], durationSecs });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'script' });
  }, [sessionId, subtitles, apiKey, selectedStyle, durationSecs, multiGenerate, dispatch]);

  const handleSegmentChange = useCallback((index: number, text: string) => {
    updateSegment(index, text);
  }, [updateSegment]);

  const handleGeneratePlan = useCallback(async () => {
    if (!sessionId) return;
    try {
      await generateCommentaryPlan(sessionId, selectedStyle, durationSecs);
      toast.success('AI 导演计划已生成 ✨');
      dispatch({ type: 'SET_PLAN_CONFIRM_OPEN', payload: true });
    } catch (e) {
      toast.error(`生成失败: ${e}`);
    }
  }, [sessionId, selectedStyle, durationSecs, dispatch]);

  const handleApprovePlan = useCallback(async () => {
    if (!sessionId) return;
    try {
      await approveCommentaryPlan(sessionId);
      dispatch({ type: 'SET_PLAN_CONFIRM_OPEN', payload: false });
      toast.success('渲染已启动，请耐心等待 🎬');
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'timeline' });
    } catch (e) {
      toast.error(`启动失败: ${e}`);
    }
  }, [sessionId, dispatch]);

  const handlePreviewVoice = useCallback(async () => {
    await previewVoice(script?.fullScript ?? '', selectedVoice);
  }, [script, selectedVoice, previewVoice]);

  const toggleMultiStyleMode = useCallback(() => {
    setMultiStyleMode(!multiStyleMode);
  }, [multiStyleMode, setMultiStyleMode]);

  const handleRunPipeline = useCallback(async () => {
    if (!videoPath || !subtitles.trim() || !apiKey.trim()) {
      toast.error('请先填写视频路径、字幕和 API Key');
      return;
    }

    const output = await runPipeline({
      videoPath,
      subtitles,
      style: selectedStyle,
      provider: 'openai',
      apiKey,
      voice: selectedVoice,
      speed: 1.0,
      format: 'mp3',
      autoApprove: true,
    });

    if (output) {
      setScript(output.script);
      toast.success(
        `流水线完成！脚本已生成，音频总时长 ${Math.round(output.totalAudioDurationSecs)} 秒 🎉`,
      );
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'script' });
    }
  }, [videoPath, subtitles, apiKey, selectedStyle, selectedVoice, runPipeline, setScript, dispatch]);

  return {
    state,
    dispatch,
    sessionId,
    directorStatus,
    currentState,
    progressPct,
    script,
    scripts,
    activeScriptStyle,
    multiStyleMode,
    isGenerating,
    voices,
    selectedVoice,
    isPreviewing,
    isPipelineRunning,
    pipelineProgress,
    pipelineError,
    handleGenerateScript,
    handleMultiStyleGenerate,
    handleSegmentChange,
    handleGeneratePlan,
    handleApprovePlan,
    handlePreviewVoice,
    toggleMultiStyleMode,
    handleRunPipeline,
  };
}
