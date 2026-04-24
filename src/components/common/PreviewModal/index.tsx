/**
 * 结果预览组件
 * 支持文案预览 (Text) 和 语音预览 (Audio player)
 * Dialog 形式展示
 */
import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import {
  FileText,
  Mic,
  Play,
  Pause,
  Copy,
  Check,
  X,
  Download,
  File,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { formatDuration, notify } from '../../../shared';
import styles from './PreviewModal.module.less';

// 文案数据类型
export interface ScriptPreview {
  id: string;
  title: string;
  content: string;
  metadata?: {
    wordCount: number;
    estimatedDuration: number;
    style?: string;
    tone?: string;
  };
}

// 语音数据类型
export interface AudioPreview {
  id: string;
  audioUrl: string;
  duration?: number;
  voiceName?: string;
}

export interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  scriptPreview?: ScriptPreview | null;
  audioPreview?: AudioPreview | null;
  videoPreview?: string | null;
  title?: string;
  width?: number | string;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  scriptPreview,
  audioPreview,
  videoPreview,
  title = '预览结果',
  okText = '确定',
  cancelText = '关闭',
  onOk,
}) => {
  const [activeTab, setActiveTab] = useState<string>('script');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyScript = async () => {
    if (scriptPreview?.content) {
      try {
        await navigator.clipboard.writeText(scriptPreview.content);
        setCopied(true);
        notify.success('已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        notify.error(error, '复制失败');
      }
    }
  };

  const handleTogglePlay = () => {
    if (!audioPreview?.audioUrl) return;

    if (!audioRef) {
      const audio = new Audio(audioPreview.audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioRef(audio);
    }

    if (isPlaying) {
      audioRef?.pause();
    } else {
      audioRef?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const hasContent = scriptPreview || audioPreview || videoPreview;

  const tabItems: { key: string; label: React.ReactNode; content: React.ReactNode }[] = [];

  if (scriptPreview) {
    tabItems.push({
      key: 'script',
      label: (
        <div className="flex items-center gap-1">
          <FileText size={16} />
          文案预览
          {scriptPreview.metadata?.wordCount && (
            <Badge variant="secondary">{scriptPreview.metadata.wordCount} 字</Badge>
          )}
        </div>
      ),
      content: (
        <div className={styles.tabContent}>
          <Card className={styles.infoCard}>
            <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {scriptPreview.metadata?.wordCount && (
                <span>字数: {scriptPreview.metadata.wordCount}</span>
              )}
              {scriptPreview.metadata?.estimatedDuration && (
                <span>
                  预计时长: {Math.ceil(scriptPreview.metadata.estimatedDuration)}秒
                </span>
              )}
              {scriptPreview.metadata?.style && (
                <Badge variant="outline">风格: {scriptPreview.metadata.style}</Badge>
              )}
              {scriptPreview.metadata?.tone && (
                <Badge variant="secondary">语气: {scriptPreview.metadata.tone}</Badge>
              )}
            </CardContent>
          </Card>

          <div className={styles.scriptContent}>
            <div className={styles.scriptHeader}>
              <h5 className="m-0 font-medium">{scriptPreview.title}</h5>
              <Button
                variant={copied ? "outline" : "ghost"}
                size="sm"
                onClick={handleCopyScript}
              >
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <div className={styles.scriptText}>
              {scriptPreview.content}
            </div>
          </div>
        </div>
      ),
    });
  }

  if (audioPreview) {
    tabItems.push({
      key: 'audio',
      label: (
        <div className="flex items-center gap-1">
          <Mic size={16} />
          语音预览
        </div>
      ),
      content: (
        <div className={styles.tabContent}>
          <Card className={styles.audioCard}>
            <div className={styles.audioPlayer}>
              <Button
                variant="default"
                size="lg"
                onClick={handleTogglePlay}
                className={styles.playButton}
              >
                {isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} />
                )}
              </Button>
              <div className={styles.audioInfo}>
                <span className="font-semibold">配音预览</span>
                {audioPreview.voiceName && (
                  <span className="text-muted-foreground"> - {audioPreview.voiceName}</span>
                )}
                {audioPreview.duration && (
                  <div className={styles.audioDuration}>
                    <span className="text-muted-foreground text-sm">
                      {formatDuration(audioPreview.duration)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.waveform}>
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className={styles.waveBar}
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    opacity: isPlaying ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </Card>

          <div className={styles.audioActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = audioPreview.audioUrl;
                link.download = '';
                link.click();
              }}
            >
              <Download size={14} className="mr-1" />
              下载音频
            </Button>
          </div>
        </div>
      ),
    });
  }

  if (videoPreview) {
    tabItems.push({
      key: 'video',
      label: (
        <div className="flex items-center gap-1">
          <Play size={16} />
          视频预览
        </div>
      ),
      content: (
        <div className={styles.tabContent}>
          <Card className={styles.videoCard}>
            <video
              src={videoPreview}
              controls
              style={{ maxWidth: '100%', maxHeight: 400 }}
            />
          </Card>
        </div>
      ),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <File size={48} className="mb-3 opacity-30" />
            <p className="text-sm">暂无预览内容</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabItems.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabItems.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          {onOk && (
            <Button variant="default" onClick={onOk}>
              {okText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal;
