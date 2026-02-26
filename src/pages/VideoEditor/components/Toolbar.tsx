import React, { memo } from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
  UploadOutlined,
  UndoOutlined,
  RedoOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import styles from '../VideoEditor.module.less';

interface ToolbarProps {
  loading: boolean;
  analyzing: boolean;
  isSaving: boolean;
  isExporting: boolean;
  hasVideo: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onLoadVideo: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddSegment: () => void;
  onSmartClip: () => void;
  onSave: () => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  loading,
  analyzing,
  isSaving,
  isExporting,
  hasVideo,
  canUndo,
  canRedo,
  onLoadVideo,
  onUndo,
  onRedo,
  onAddSegment,
  onSmartClip,
  onSave,
  onExport,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.leftTools}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={onLoadVideo}
          loading={loading}
        >
          加载视频
        </Button>

        <Tooltip title="撤销">
          <Button
            icon={<UndoOutlined />}
            disabled={!canUndo}
            onClick={onUndo}
          />
        </Tooltip>

        <Tooltip title="重做">
          <Button
            icon={<RedoOutlined />}
            disabled={!canRedo}
            onClick={onRedo}
          />
        </Tooltip>

        <Tooltip title="添加片段">
          <Button
            icon={<PlusOutlined />}
            onClick={onAddSegment}
            disabled={!hasVideo}
          />
        </Tooltip>

        <Tooltip title="智能剪辑">
          <Button
            icon={<RobotOutlined />}
            onClick={onSmartClip}
            disabled={!hasVideo || analyzing}
            loading={analyzing}
          >
            智能剪辑
          </Button>
        </Tooltip>
      </div>

      <div className={styles.rightTools}>
        <Button
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={isSaving}
          disabled={!hasVideo}
        >
          保存
        </Button>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
          loading={isExporting}
          disabled={!hasVideo}
        >
          导出
        </Button>
      </div>
    </div>
  );
};

export default memo(Toolbar);
