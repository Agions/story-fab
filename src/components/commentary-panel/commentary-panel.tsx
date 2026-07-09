/**
 * CommentaryPanel — AI 影视解说模式主面板
 *
 * 重构说明：
 * - 组件已拆分为 CommentaryHeader / CommentaryTrackList / CommentaryEditor / CommentarySyncControls
 * - 业务逻辑提取到 useCommentary hook
 * - 本文件仅保留组合逻辑，控制在 250 行以内
 */

import React, { memo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { useCommentary } from './use-commentary';
import type { DirectorStatusResponse } from '@/types';
import CommentaryHeader from './commentary-header';
import CommentaryTrackList from './commentary-track-list';
import CommentarySyncControls from './commentary-sync-controls';

interface CommentaryPanelProps {
  videoPath: string;
  subtitles: string;
  durationSecs?: number;
  disabled?: boolean;
}

const CommentaryPanel: React.FC<CommentaryPanelProps> = memo(({
  videoPath,
  subtitles,
  durationSecs,
  disabled = false,
}) => {
  const commentary = useCommentary(videoPath, subtitles, durationSecs, disabled);

  return (
    <div>
      <CommentaryHeader
        currentState={commentary.currentState}
        progressPct={commentary.progressPct}
        isPipelineRunning={commentary.isPipelineRunning}
        pipelineProgress={commentary.pipelineProgress ?? undefined}
      />

      <CardContent>
        <CommentaryTrackList
          dispatch={commentary.dispatch}
          apiKey={commentary.state.apiKey}
          script={commentary.script}
          scripts={commentary.scripts}
          activeScriptStyle={commentary.activeScriptStyle ?? undefined}
          multiStyleMode={commentary.multiStyleMode}
          isGenerating={commentary.isGenerating}
          voices={commentary.voices}
          selectedVoice={commentary.selectedVoice}
          isPreviewing={commentary.isPreviewing}
          selectedStyle={commentary.state.selectedStyle}
          onGenerate={commentary.handleGenerateScript}
          onMultiGenerate={commentary.handleMultiStyleGenerate}
          onSegmentChange={commentary.handleSegmentChange}
          onSetApiKey={(v) => commentary.dispatch({ type: 'SET_API_KEY', payload: v })}
        />
        <CommentarySyncControls
          disabled={disabled}
          subtitles={subtitles}
          apiKey={commentary.state.apiKey}
          currentState={commentary.currentState}
          multiStyleMode={commentary.multiStyleMode}
          isGenerating={commentary.isGenerating}
          isPipelineRunning={commentary.isPipelineRunning}
          isPreviewing={commentary.isPreviewing}
          script={commentary.script}
          onGenerate={commentary.handleGenerateScript}
          onMultiGenerate={commentary.handleMultiStyleGenerate}
          onGeneratePlan={commentary.handleGeneratePlan}
          onToggleMultiStyle={commentary.toggleMultiStyleMode}
          onPreviewVoice={commentary.handlePreviewVoice}
          onRunPipeline={commentary.handleRunPipeline}
        />
      </CardContent>

      {/* Plan 确认弹窗 */}
      <Dialog open={commentary.state.planConfirmOpen} onOpenChange={(open) => commentary.dispatch({ type: 'SET_PLAN_CONFIRM_OPEN', payload: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI 导演计划已生成 ✨</DialogTitle>
          </DialogHeader>
          {commentary.directorStatus?.plan && (
        <div>
          <div>
            <span>解说角度</span>
            <span>{(commentary.directorStatus as DirectorStatusResponse).plan!.angle}</span>
          </div>
          <div>
            <span>目标时长</span>
            <span>{Math.round((commentary.directorStatus as DirectorStatusResponse).plan!.targetDurationSecs)} 秒</span>
          </div>
          <div>
            <span>推荐音色</span>
            <span>{(commentary.directorStatus as DirectorStatusResponse).plan!.recommendedVoice}</span>
          </div>
          <div>
            <span>置信度</span>
            <Badge variant={((commentary.directorStatus as DirectorStatusResponse).plan!.confidence as number) > 0.8 ? 'default' : 'secondary'}>
              {Math.round(((commentary.directorStatus as DirectorStatusResponse).plan!.confidence as number) * 100)}%
            </Badge>
          </div>
        </div>
      )}
          <DialogFooter>
            <Button variant="outline" onClick={() => commentary.dispatch({ type: 'SET_PLAN_CONFIRM_OPEN', payload: false })}>
              再改改
            </Button>
            <Button variant="default" onClick={commentary.handleApprovePlan}>
              <CheckCircle2 size={14} /> 确认并渲染
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

CommentaryPanel.displayName = 'CommentaryPanel';
export default memo(CommentaryPanel);
