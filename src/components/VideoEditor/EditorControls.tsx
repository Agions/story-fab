import React, { memo } from 'react';
import { Button, Space, Progress, Typography } from 'antd';
import { ScissorOutlined, SettingOutlined, SaveOutlined } from '@ant-design/icons';
import styles from './VideoEditor.module.less';

const { Text } = Typography;

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
      <Space>
        <Button
          type="primary"
          icon={<ScissorOutlined />}
          onClick={onExport}
          disabled={processing || !hasSegments}
        >
          生成混剪视频
        </Button>

        <Button
          icon={<SettingOutlined />}
          onClick={onSettings}
          disabled={processing}
        >
          导出设置
        </Button>

        <Button
          icon={<SaveOutlined />}
          onClick={onSave}
          disabled={processing}
        >
          保存片段时间
        </Button>
      </Space>

      {processing && (
        <div className={styles.progressContainer}>
          <Progress percent={processProgress} status="active" style={{ width: 200 }} />
          <Text className={styles.progressText}>
            {getProgressText(processProgress)}
          </Text>
        </div>
      )}
    </div>
  );
};

export default memo(EditorControls);
