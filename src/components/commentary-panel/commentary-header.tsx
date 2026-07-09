/**
 * CommentaryHeader — 解说面板头部（标题 + 状态徽章 + 进度条）
 */

import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

const STATE_LABELS: Record<string, string> = {
  idle: '就绪',
  analyzing: '分析中',
  planning: '规划中',
  ready: '待确认',
  rendering: '渲染中',
  done: '已完成',
};

const STATE_COLORS: Record<string, string> = {
  idle: 'bg-slate-400',
  analyzing: 'bg-blue-500 animate-pulse',
  planning: 'bg-amber-500 animate-pulse',
  ready: 'bg-emerald-500',
  rendering: 'bg-violet-500 animate-pulse',
  done: 'bg-emerald-600',
};

const CommentaryHeader: React.FC<{ currentState: string; progressPct: number; isPipelineRunning: boolean; pipelineProgress?: { percent: number; stage: string; message: string } }> = ({ currentState, progressPct, isPipelineRunning, pipelineProgress }) => {

  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-amber-500" />
        <CardTitle>AI 解说模式</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={STATE_COLORS[currentState] + ' text-white border-0'}>
          {STATE_LABELS[currentState]}
        </Badge>
      </div>

      {currentState !== 'idle' && currentState !== 'done' && (
        <div className="mt-2">
          <Progress value={progressPct * 100} />
          <span className="text-xs text-muted-foreground">{Math.round(progressPct * 100)}%</span>
        </div>
      )}

      {isPipelineRunning && pipelineProgress && (
        <div className="mt-2">
          <Progress value={pipelineProgress.percent} />
          <span className="text-xs text-muted-foreground">
            {pipelineProgress.stage}: {pipelineProgress.message} ({Math.round(pipelineProgress.percent)}%)
          </span>
        </div>
      )}
    </CardHeader>
  );
};

export default CommentaryHeader;
