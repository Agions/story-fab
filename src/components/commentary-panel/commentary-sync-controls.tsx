/**
 * CommentarySyncControls — 解说面板操作按钮区
 */

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, Play, Loader2, Zap } from 'lucide-react';
import type { CommentaryScriptOutput } from '@/types';

const CommentarySyncControls: React.FC<{
  disabled: boolean;
  subtitles: string;
  apiKey: string;
  currentState: string;
  multiStyleMode: boolean;
  isGenerating: boolean;
  isPipelineRunning: boolean;
  isPreviewing: boolean;
  script: CommentaryScriptOutput | null;
  onGenerate: () => void;
  onMultiGenerate: () => void;
  onGeneratePlan: () => void;
  onToggleMultiStyle: () => void;
  onPreviewVoice: () => void;
  onRunPipeline: () => void;
}> = ({
  disabled,
  subtitles,
  apiKey,
  currentState,
  multiStyleMode,
  isGenerating,
  isPipelineRunning,
  isPreviewing,
  script,
  onGenerate,
  onMultiGenerate,
  onGeneratePlan,
  onToggleMultiStyle,
  onPreviewVoice,
  onRunPipeline,
}) => {

  return (
    <>
      <Separator className="my-4" />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={multiStyleMode ? onMultiGenerate : onGenerate}
          disabled={disabled || isGenerating || !subtitles.trim() || !apiKey.trim()}
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {multiStyleMode ? '批量生成' : '生成脚本'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onGeneratePlan}
          disabled={disabled || isGenerating || currentState !== 'idle'}
        >
          <ChevronRight size={14} />
          AI 导演规划
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMultiStyle}
        >
          <Sparkles size={14} />
          {multiStyleMode ? '退出批量' : '多风格'}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onRunPipeline}
          disabled={disabled || isPipelineRunning || isGenerating || !subtitles.trim() || !apiKey.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isPipelineRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          一键生成解说+配音
        </Button>

        {script && !multiStyleMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviewVoice}
            disabled={isPreviewing}
          >
            {isPreviewing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            预览配音
          </Button>
        )}
      </div>
    </>
  );
};

export default CommentarySyncControls;
