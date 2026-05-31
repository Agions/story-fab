/**
 * CommentaryPanel — AI 影视解说模式主面板
 *
 * 集成到 StoryFab 工作流，提供：
 * - Step 3 模式切换（Clip Mode / Commentary Mode）
 * - AI Director Agent 状态展示
 * - 解说脚本编辑
 * - 风格预设选择
 * - 配音预览
 *
 * 设计规范：
 * - 浅色猫爪主题 + 玻璃态毛玻璃效果
 * - 状态指示：圆形气泡 + 脉冲动画
 * - 五种风格预设：幽默 / 严肃 / 接地气 / 悬疑 / 温情
 */

import React, { useState, useCallback, memo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import {
  Sparkles,
  Play,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mic,
  Volume2,
  Loader2,
} from 'lucide-react';
import {
  generateCommentaryPlan,
  approveCommentaryPlan,
  type ScriptStylePreset,
} from '@/core/services/commentary';
import { useDirectorStatus } from '@/hooks/useDirectorStatus';
import { useCommentarySession } from '@/hooks/useCommentarySession';
import { useCommentaryScript } from '@/hooks/useCommentaryScript';
import { useCommentaryVoice } from '@/hooks/useCommentaryVoice';
import styles from './CommentaryPanel.module.less';
import CommentaryScriptEditor from './CommentaryScriptEditor';
import CommentaryStyleSelector from './CommentaryStyleSelector';
import CommentaryVoiceSelector from './CommentaryVoiceSelector';
import CommentaryTimeline from './CommentaryTimeline';

// ─── 状态映射 ───────────────────────────────────────────────────────────

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

const _STYLE_PRESET_LABELS: Record<ScriptStylePreset, string> = {
  humorous: '幽默风趣',
  serious: '严肃正式',
  conversational: '接地气',
  suspense: '悬疑紧张',
  warm: '温情治愈',
};

interface CommentaryPanelProps {
  videoPath: string;
  subtitles: string;
  durationSecs?: number;
  disabled?: boolean;
}

// ─── 主组件 ─────────────────────────────────────────────────────────────

const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  videoPath,
  subtitles,
  durationSecs,
  disabled = false,
}) => {
  // ── UI 状态 ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'script' | 'style' | 'voice' | 'timeline'>('script');
  const [planConfirmOpen, setPlanConfirmOpen] = useState(false);
  const [_reviseOpen, _setReviseOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // ── 风格选择状态 ──────────────────────────────────────────────────────
  const [selectedStyle, setSelectedStyle] = useState<ScriptStylePreset>('conversational');

  // ── Hooks ────────────────────────────────────────────────────────────
  const { sessionId, directorStatus, isReady } = useCommentarySession(
    videoPath,
    selectedStyle,
    disabled,
  );

  const { currentState, progressPct } = useDirectorStatus(sessionId);

  const {
    script,
    scripts,
    activeScriptStyle,
    multiStyleMode,
    isGenerating,
    generate,
    multiGenerate,
    setMultiStyleMode,
    setSelectedStyles,
    setActiveScriptStyle,
    updateSegment,
  } = useCommentaryScript();

  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    isPreviewing,
    stopPreview,
  } = useCommentaryVoice();

  // ── 脚本生成 ──────────────────────────────────────────────────────────
  const handleGenerateScript = useCallback(async () => {
    if (!sessionId) return;
    await generate({ sessionId, subtitles, apiKey, selectedStyle, durationSecs });
    setActiveTab('script');
  }, [sessionId, subtitles, apiKey, selectedStyle, durationSecs, generate, setActiveTab]);

  const handleMultiStyleGenerate = useCallback(async () => {
    if (!sessionId) return;
    await multiGenerate({ sessionId, subtitles, apiKey, selectedStyles: [selectedStyle], durationSecs });
    setActiveTab('script');
  }, [sessionId, subtitles, apiKey, selectedStyle, durationSecs, multiGenerate, setActiveTab]);

  const handleSegmentChange = useCallback((index: number, text: string) => {
    updateSegment(index, text);
  }, [updateSegment]);

  // ── Director Plan ────────────────────────────────────────────────────
  const handleGeneratePlan = useCallback(async () => {
    if (!sessionId) return;
    try {
      await generateCommentaryPlan(sessionId, selectedStyle, durationSecs);
      toast.success('AI 导演计划已生成 ✨');
      setPlanConfirmOpen(true);
    } catch (e) {
      toast.error(`生成失败: ${e}`);
    }
  }, [sessionId, selectedStyle, durationSecs]);

  const handleApprovePlan = useCallback(async () => {
    if (!sessionId) return;
    try {
      await approveCommentaryPlan(sessionId);
      setPlanConfirmOpen(false);
      toast.success('渲染已启动，请耐心等待 🎬');
      setActiveTab('timeline');
    } catch (e) {
      toast.error(`启动失败: ${e}`);
    }
  }, [sessionId]);

  // ── 预览 ─────────────────────────────────────────────────────────────
  const handlePreviewVoice = useCallback(async () => {
    await previewVoice(script?.fullScript ?? '', selectedVoice);
  }, [script, selectedVoice, previewVoice]);

  // ── 批量模式切换 ──────────────────────────────────────────────────────
  const toggleMultiStyleMode = useCallback(() => {
    setMultiStyleMode((prev) => {
      if (!prev) setSelectedStyles([selectedStyle]);
      return !prev;
    });
  }, [setMultiStyleMode, setSelectedStyles, selectedStyle]);

  // ── 渲染 ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.commentaryPanel}>
      <CardHeader className={styles.header}>
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" />
          <CardTitle>AI 解说模式</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={STATE_COLORS[currentState] + ' text-white border-0'}>
            {STATE_LABELS[currentState]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={styles.content}>
        {/* 进度条 */}
        {currentState !== 'idle' && currentState !== 'done' && (
          <div className={styles.progressWrapper}>
            <Progress value={progressPct * 100} className={styles.progressBar} />
            <span className={styles.progressLabel}>{Math.round(progressPct * 100)}%</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="script"><FileText size={14} /> 脚本</TabsTrigger>
            <TabsTrigger value="style"><Sparkles size={14} /> 风格</TabsTrigger>
            <TabsTrigger value="voice"><Mic size={14} /> 音色</TabsTrigger>
            <TabsTrigger value="timeline"><Volume2 size={14} /> 时间线</TabsTrigger>
          </TabsList>

          {/* 脚本编辑 */}
          <TabsContent value="script" className={styles.tabContent}>
            {multiStyleMode && scripts.size > 0 && activeScriptStyle ? (
              <div className={styles.multiScriptTabs}>
                <div className={styles.multiScriptStyleTabs}>
                  {Array.from(scripts.entries()).map(([style]) => (
                    <button
                      key={style}
                      className={`${styles.multiScriptStyleTab} ${activeScriptStyle === style ? styles.multiScriptStyleTabActive : ''}`}
                      onClick={() => setActiveScriptStyle(style)}
                    >
                      {_STYLE_PRESET_LABELS[style]}
                    </button>
                  ))}
                </div>
                <CommentaryScriptEditor
                  script={scripts.get(activeScriptStyle) ?? null}
                  isGenerating={isGenerating}
                  onGenerate={() => {}}
                  apiKey={apiKey}
                  onApiKeyChange={setApiKey}
                  onSegmentChange={handleSegmentChange}
                />
              </div>
            ) : (
              <CommentaryScriptEditor
                script={script}
                isGenerating={isGenerating}
                onGenerate={handleGenerateScript}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                onSegmentChange={handleSegmentChange}
              />
            )}
          </TabsContent>

          {/* 风格选择 */}
          <TabsContent value="style" className={styles.tabContent}>
            <CommentaryStyleSelector
              selected={multiStyleMode ? [selectedStyle] : selectedStyle}
              onChange={(s: ScriptStylePreset | ScriptStylePreset[]) => {
                if (multiStyleMode) {
                  setSelectedStyles(s as ScriptStylePreset[]);
                } else {
                  setSelectedStyle(s as ScriptStylePreset);
                }
              }}
              multiSelect={multiStyleMode}
            />
          </TabsContent>

          {/* 音色选择 */}
          <TabsContent value="voice" className={styles.tabContent}>
            <CommentaryVoiceSelector
              voices={voices}
              selected={selectedVoice}
              onChange={setSelectedVoice}
              onPreview={handlePreviewVoice}
              isPreviewing={isPreviewing}
            />
          </TabsContent>

          {/* 时间线 */}
          <TabsContent value="timeline" className={styles.tabContent}>
            {script ? (
              <CommentaryTimeline
                segments={script.segments}
                voice={selectedVoice}
              />
            ) : (
              <div className={styles.emptyState}>
                <FileText size={48} className="text-muted-foreground" />
                <p>先生成解说脚本</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 操作栏 */}
        <Separator className="my-4" />

        <div className={styles.actionBar}>
          <Button
            variant="default"
            size="sm"
            onClick={multiStyleMode ? handleMultiStyleGenerate : handleGenerateScript}
            disabled={disabled || isGenerating || !subtitles.trim() || !apiKey.trim()}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {multiStyleMode ? `批量生成 (1)` : '生成脚本'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleGeneratePlan}
            disabled={disabled || isGenerating || currentState !== 'idle'}
          >
            <ChevronRight size={14} />
            AI 导演规划
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleMultiStyleMode}
          >
            <Sparkles size={14} />
            {multiStyleMode ? '退出批量' : '多风格'}
          </Button>

          {script && !multiStyleMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewVoice}
              disabled={isPreviewing}
            >
              {isPreviewing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              预览配音
            </Button>
          )}
        </div>
      </CardContent>

      {/* Plan 确认弹窗 */}
      <Dialog open={planConfirmOpen} onOpenChange={setPlanConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI 导演计划已生成 ✨</DialogTitle>
          </DialogHeader>
          {directorStatus?.plan && (
            <div className={styles.planDetails}>
              <div className={styles.planItem}>
                <span className={styles.planLabel}>解说角度</span>
                <span>{directorStatus.plan.angle}</span>
              </div>
              <div className={styles.planItem}>
                <span className={styles.planLabel}>目标时长</span>
                <span>{Math.round(directorStatus.plan.targetDurationSecs)} 秒</span>
              </div>
              <div className={styles.planItem}>
                <span className={styles.planLabel}>推荐音色</span>
                <span>{directorStatus.plan.recommendedVoice}</span>
              </div>
              <div className={styles.planItem}>
                <span className={styles.planLabel}>置信度</span>
                <Badge variant={directorStatus.plan.confidence > 0.8 ? 'default' : 'secondary'}>
                  {Math.round(directorStatus.plan.confidence * 100)}%
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanConfirmOpen(false)}>
              再改改
            </Button>
            <Button variant="default" onClick={handleApprovePlan}>
              <CheckCircle2 size={14} /> 确认并渲染
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(CommentaryPanel);