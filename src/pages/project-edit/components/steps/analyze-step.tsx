/**
 * AnalyzeStep — 分析视频步骤
 */
import React from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Loader2, PenLine } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import VideoSelector from '@/components/video-selector/video-selector';
import styles from '@/pages/project-edit/index.module.less';

interface AnalyzeStepProps {
  videoPath: string;
  keyFrames: string[];
  scriptSegmentsCount: number;
  loading: boolean;
  onVideoSelect: (path: string) => void;
  onVideoRemove: () => void;
  onAnalyze: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const AnalyzeStep: React.FC<AnalyzeStepProps> = ({
  videoPath,
  keyFrames,
  scriptSegmentsCount,
  loading,
  onVideoSelect,
  onVideoRemove,
  onAnalyze,
  onPrev,
  onNext,
}) => (
  <Card className={styles.stepCard}>
    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><PenLine size={18} /> 分析视频内容</h3>
    <p className="text-sm text-muted-foreground mb-4">分析视频获取关键帧和内容信息，生成脚本草稿。</p>

    <div className={cn('min-h-[200px]', loading && 'opacity-50')}>
      {loading && <div className="flex items-center gap-2 mb-4"><Loader2 className="animate-spin" size={16} /><span className="text-sm">正在分析视频...</span></div>}
      <div className={styles.analyzeContent}>
        <VideoSelector
          initialVideoPath={videoPath}
          onVideoSelect={onVideoSelect}
          onVideoRemove={onVideoRemove}
          loading={false}
        />

        {keyFrames.length > 0 && (
          <div className={styles.keyFrames}>
            <h4 className="text-base font-medium mb-2">已提取 {keyFrames.length} 个关键帧</h4>
            <div className={styles.keyFramesList}>
              {keyFrames.map((frame, index) => (
                <img
                  key={index}
                  src={frame}
                  alt={`关键帧 ${index + 1}`}
                  className={styles.keyFrameImage}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    <div className={cn(styles.stepActions, 'flex items-center gap-2')}>
      <Button variant="outline" onClick={onPrev}>上一步</Button>
      {scriptSegmentsCount > 0 ? (
        <Button className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white" onClick={onNext}>下一步</Button>
      ) : (
        <Button className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white" onClick={onAnalyze} disabled={loading}>
          {loading ? '分析中...' : '分析视频'}
        </Button>
      )}
    </div>
  </Card>
);
