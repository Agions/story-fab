import React, { memo } from 'react';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Scissors, Settings, Save } from 'lucide-react';
import styles from './VideoEditor.module.less';

interface EditorControlsProps {
  processing: boolean;
  processProgress: number;
  hasSegments: boolean;
  onExport: () => void;
  onSettings: () => void;
  onSave: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({
  processing,
  processProgress,
  hasSegments,
  onExport,
  onSettings,
  onSave,
}) => {
  const getProgressText = (progress: number) => {
    if (progress < 30) return '准备片段...';
    if (progress < 70) return '处理视频中...';
    if (progress < 90) return '合成最终视频...';
    return '完成中...';
  };

  return (
    <div className={styles.editorControls}>
      <div className="flex items-center gap-2">
        <Button
          className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
          onClick={onExport}
          disabled={processing || !hasSegments}
        >
          <Scissors size={14} className="mr-1" />
          生成混剪视频
        </Button>

        <Button
          onClick={onSettings}
          disabled={processing}
        >
          <Settings size={14} className="mr-1" />
          导出设置
        </Button>

        <Button
          onClick={onSave}
          disabled={processing}
        >
          <Save size={14} className="mr-1" />
          保存片段时间
        </Button>
      </div>

      {processing && (
        <div className={styles.progressContainer}>
          <Progress value={processProgress}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          <span className={styles.progressText}>
            {getProgressText(processProgress)}
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(EditorControls);
