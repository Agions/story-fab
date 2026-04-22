import React, { memo } from 'react';
import { Tooltip } from 'antd';
import { Button } from '@/components/ui/button';
import {
  UploadOutlined,
  UndoOutlined,
  RedoOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import styles from '../index.module.less';

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
    <div className={styles.toolbar} role="toolbar" aria-label="视频编辑器工具栏">
      <div className={styles.leftTools}>
        <Button
          className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
          onClick={onLoadVideo}
          disabled={loading}
          aria-label="加载视频"
        >
          <UploadOutlined className="mr-1" />
          {loading ? '加载中...' : '加载视频'}
        </Button>

        <Tooltip title="撤销 (Ctrl+Z)">
          <Button
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="撤销"
            aria-disabled={!canUndo}
          >
            <UndoOutlined />
          </Button>
        </Tooltip>

        <Tooltip title="重做 (Ctrl+Y)">
          <Button
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="重做"
            aria-disabled={!canRedo}
          >
            <RedoOutlined />
          </Button>
        </Tooltip>

        <Tooltip title="添加片段">
          <Button
            variant="outline"
            onClick={onAddSegment}
            disabled={!hasVideo}
            aria-label="添加片段"
          >
            <PlusOutlined className="mr-1" />
            添加片段
          </Button>
        </Tooltip>

        <Tooltip title="智能剪辑">
          <Button
            variant="outline"
            onClick={onSmartClip}
            disabled={!hasVideo || analyzing}
          >
            {analyzing ? (
              <>
                <RobotOutlined className="mr-1" />
                剪辑中...
              </>
            ) : (
              <>
                <RobotOutlined className="mr-1" />
                智能剪辑
              </>
            )}
          </Button>
        </Tooltip>
      </div>

      <div className={styles.rightTools}>
        <Button
          variant="ghost"
          onClick={onSave}
          disabled={!hasVideo || loading || analyzing || isSaving || isExporting}
          aria-label="保存项目"
        >
          <SaveOutlined className="mr-1" />
          保存
        </Button>

        <Button
          className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
          onClick={onExport}
          disabled={!hasVideo || loading || analyzing || isSaving || isExporting}
          aria-label="导出视频"
        >
          <DownloadOutlined className="mr-1" />
          导出
        </Button>
      </div>
    </div>
  );
};

export default memo(Toolbar);