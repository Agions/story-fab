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

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/shared/utils/logging';
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
  createCommentarySession,
  getCommentaryStatus,
  generateCommentaryPlan,
  approveCommentaryPlan,
  destroyCommentarySession,
  generateCommentaryScript,
  synthesizeCommentaryAudio,
  estimateTTSDuration,
  listCommentaryVoices,
  type DirectorStatusResponse,
  type DirectorState,
  type ScriptStylePreset,
  type VoiceInfo,
  type CommentaryScriptOutput,
} from '@/core/services/commentary';
import styles from './CommentaryPanel.module.less';
import CommentaryScriptEditor from './CommentaryScriptEditor';
import CommentaryStyleSelector from './CommentaryStyleSelector';
import CommentaryVoiceSelector from './CommentaryVoiceSelector';
import CommentaryTimeline from './CommentaryTimeline';

interface CommentaryPanelProps {
  /** 视频路径 */
  videoPath: string;
  /** 字幕内容 */
  subtitles: string;
  /** 视频时长（秒） */
  durationSecs?: number;
  /** 是否可用 */
  disabled?: boolean;
}

// ─── 状态映射 ───────────────────────────────────────────────────────────

const STATE_LABELS: Record<DirectorState, string> = {
  idle: '就绪',
  analyzing: '分析中',
  planning: '规划中',
  ready: '待确认',
  rendering: '渲染中',
  done: '已完成',
};

const STATE_COLORS: Record<DirectorState, string> = {
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

// ─── 主组件 ─────────────────────────────────────────────────────────────

const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  videoPath,
  subtitles,
  durationSecs,
  disabled = false,
}) => {
  // 状态
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [directorStatus, setDirectorStatus] = useState<DirectorStatusResponse | null>(null);
  const [script, setScript] = useState<CommentaryScriptOutput | null>(null);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'script' | 'style' | 'voice' | 'timeline'>('script');

  // 选中的音色
  const [selectedVoice, setSelectedVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [selectedStyle, setSelectedStyle] = useState<ScriptStylePreset>('conversational');

  // 多风格批量生成
  const [multiStyleMode, setMultiStyleMode] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<ScriptStylePreset[]>(['conversational']);
  const [scripts, setScripts] = useState<Map<ScriptStylePreset, CommentaryScriptOutput>>(new Map());
  const [activeScriptStyle, setActiveScriptStyle] = useState<ScriptStylePreset | null>(null);

  // 弹窗
  const [planConfirmOpen, setPlanConfirmOpen] = useState(false);
  const [_reviseOpen, _setReviseOpen] = useState(false);

  // 加载状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // API Key（从环境变量或配置获取）
  const [apiKey, setApiKey] = useState('');

  // ─── 副作用 ───────────────────────────────────────────────────────────

  // 创建会话
  useEffect(() => {
    if (!videoPath || disabled) return;

    const init = async () => {
      try {
        const sid = await createCommentarySession(videoPath, selectedStyle);
        setSessionId(sid);
        sessionIdRef.current = sid;
      } catch (e) {
        logger.error('[CommentaryPanel] 创建会话失败:', e);
      }
    };

    init();

    return () => {
      const sid = sessionIdRef.current;
      if (sid) {
        destroyCommentarySession(sid).catch(logger.error);
      }
    };
  }, [videoPath, disabled, selectedStyle]);

  // 加载音色列表
  useEffect(() => {
    listCommentaryVoices()
      .then(setVoices)
      .catch(logger.error);
  }, []);

  // 轮询状态
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const status = await getCommentaryStatus(sessionId);
        setDirectorStatus(status);
      } catch (e) {
        logger.error('[CommentaryPanel] 轮询状态失败:', e);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // ─── 操作 ────────────────────────────────────────────────────────────

  /** 生成解说脚本 */
  const handleGenerateScript = useCallback(async () => {
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
      setActiveTab('script');
    } catch (e) {
      logger.error('[CommentaryPanel] 生成脚本失败:', e);
      toast.error(`生成失败: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, subtitles, apiKey, selectedStyle, durationSecs]);

  /** 段落文本变更（增量编辑） */
  const handleSegmentChange = useCallback((index: number, text: string) => {
    // 多风格模式：更新对应风格的 script
    if (multiStyleMode && activeScriptStyle) {
      setScripts(prev => {
        const next = new Map(prev);
        const current = next.get(activeScriptStyle!);
        if (current) {
          next.set(activeScriptStyle!, {
            ...current,
            segments: current.segments.map((seg, i) =>
              i === index ? { ...seg, text } : seg
            ),
          });
        }
        return next;
      });
      // 同时更新当前显示的 script
      setScript(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          segments: prev.segments.map((seg, i) =>
            i === index ? { ...seg, text } : seg
          ),
        };
      });
    } else {
      // 单风格模式
      setScript((prev) => {
        if (!prev) return prev;
        const segments = prev.segments.map((seg, i) =>
          i === index ? { ...seg, text } : seg
        );
        return { ...prev, segments };
      });
    }
  }, [multiStyleMode, activeScriptStyle]);

  /** 用真实 TTS 时长校准时间轴 */
  const calibrateTimelineWithTTS = useCallback(async (
    targetScript: CommentaryScriptOutput,
    voice: string,
  ): Promise<CommentaryScriptOutput> => {
    try {
      const segmentsWithDuration = await Promise.all(
        targetScript.segments.map(async (seg) => {
          const duration = await estimateTTSDuration(seg.text, voice);
          return { ...seg, endTime: seg.startTime + duration };
        })
      );
      // 重新计算每段的 startTime 和 endTime
      let cumulativeStart = 0;
      const calibrated = segmentsWithDuration.map(seg => {
        const dur = seg.endTime - seg.startTime;
        const start = cumulativeStart;
        cumulativeStart += dur;
        return { ...seg, startTime: start, endTime: cumulativeStart };
      });
      const totalDuration = calibrated.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0);
      return {
        ...targetScript,
        segments: calibrated,
        estimatedDurationSecs: totalDuration,
      };
    } catch (e) {
      logger.warn('[CommentaryPanel] TTS 时长校准失败，使用原始估算:', e);
      return targetScript;
    }
  }, []);

  /** 批量生成多风格脚本 */
  const handleMultiStyleGenerate = useCallback(async () => {
    if (!sessionId || !subtitles.trim()) {
      toast.error('请先导入字幕文件');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('请先填写 API Key');
      return;
    }
    if (selectedStyles.length === 0) {
      toast.error('请至少选择一个风格');
      return;
    }

    setIsGenerating(true);
    try {
      const newScripts = new Map<ScriptStylePreset, CommentaryScriptOutput>();
      for (let i = 0; i < selectedStyles.length; i++) {
        const style = selectedStyles[i];
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
      setScript(newScripts.get(selectedStyles[0]) ?? null);
      setActiveScriptStyle(selectedStyles[0]);
      toast.success(`批量生成完成！共 ${newScripts.size} 个版本 🎉`);
      setActiveTab('script');
    } catch (e) {
      logger.error('[CommentaryPanel] 批量生成失败:', e);
      toast.error(`生成失败: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, subtitles, apiKey, selectedStyles, durationSecs]);

  /** 生成 Director Plan */
  const handleGeneratePlan = useCallback(async () => {
    if (!sessionId) return;

    setIsGenerating(true);
    try {
      await generateCommentaryPlan(sessionId, selectedStyle, durationSecs);
      toast.success('AI 导演计划已生成 ✨');
      setPlanConfirmOpen(true);
    } catch (e) {
      logger.error('[CommentaryPanel] 生成 Plan 失败:', e);
      toast.error(`生成失败: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, selectedStyle, durationSecs]);

  /** 确认 Plan 并渲染 */
  const handleApprovePlan = useCallback(async () => {
    if (!sessionId) return;

    try {
      await approveCommentaryPlan(sessionId);
      setPlanConfirmOpen(false);
      toast.success('渲染已启动，请耐心等待 🎬');
      setActiveTab('timeline');
    } catch (e) {
      logger.error('[CommentaryPanel] 确认 Plan 失败:', e);
      toast.error(`启动失败: ${e}`);
    }
  }, [sessionId]);

  /** 合成配音预览 */
  const handlePreviewVoice = useCallback(async () => {
    if (!script?.fullScript) return;

    setIsSynthesizing(true);
    try {
      const result = await synthesizeCommentaryAudio(
        script.fullScript.slice(0, 200), // 只合成前 200 字预览
        selectedVoice,
      );
      // 播放音频（通过 Audio 元素）
      const audio = new Audio(`file://${result.audioPath}`);
      audio.play();
      toast.success('配音预览已播放 🔊');
    } catch (e) {
      logger.error('[CommentaryPanel] 配音预览失败:', e);
      toast.error(`预览失败: ${e}`);
    } finally {
      setIsSynthesizing(false);
    }
  }, [script, selectedVoice]);

  // ─── 渲染 ────────────────────────────────────────────────────────────

  const currentState = directorStatus?.state ?? 'idle';
  const progressPct = directorStatus?.progressPct ?? 0;

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
            <TabsTrigger value="script">
              <FileText size={14} /> 脚本
            </TabsTrigger>
            <TabsTrigger value="style">
              <Sparkles size={14} /> 风格
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic size={14} /> 音色
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Volume2 size={14} /> 时间线
            </TabsTrigger>
          </TabsList>

          {/* 脚本编辑 */}
          <TabsContent value="script" className={styles.tabContent}>
            {multiStyleMode && scripts.size > 0 && activeScriptStyle ? (
              <div className={styles.multiScriptTabs}>
                <div className={styles.multiScriptStyleTabs}>
                  {Array.from(scripts.entries()).map(([style, _s]) => (
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
              selected={multiStyleMode ? selectedStyles : selectedStyle}
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
              isPreviewing={isSynthesizing}
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
            {multiStyleMode ? `批量生成 (${selectedStyles.length})` : '生成脚本'}
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
            onClick={() => {
              setMultiStyleMode(prev => !prev);
              if (!multiStyleMode) {
                setSelectedStyles([selectedStyle]);
              }
            }}
          >
            <Sparkles size={14} />
            {multiStyleMode ? '退出批量' : '多风格'}
          </Button>

          {script && !multiStyleMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewVoice}
              disabled={isSynthesizing}
            >
              {isSynthesizing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
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