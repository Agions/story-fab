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
            <CommentaryScriptEditor
              script={script}
              isGenerating={isGenerating}
              onGenerate={handleGenerateScript}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
            />
          </TabsContent>

          {/* 风格选择 */}
          <TabsContent value="style" className={styles.tabContent}>
            <CommentaryStyleSelector
              selected={selectedStyle}
              onChange={setSelectedStyle}
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
            onClick={handleGenerateScript}
            disabled={disabled || isGenerating || !subtitles.trim() || !apiKey.trim()}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            生成脚本
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

          {script && (
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