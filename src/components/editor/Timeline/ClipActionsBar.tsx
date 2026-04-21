/**
 * ClipActionsBar - 操作栏显示当前选中的片段信息及操作按钮
 */
import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import {
  CopyOutlined,
  PartitionOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Clip, TimelineClip, Transition } from './types';
import { TRANSITION_TYPES } from './constants';
import { formatTime } from './utils';

interface ClipActionsBarProps {
  selectedClip: TimelineClip | null;
  onCopyClip: () => void;
  onPasteClip: () => void;
  onDeleteClip: () => void;
  onKeyframeClick: () => void;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
}

const ClipActionsBar: React.FC<ClipActionsBarProps> = ({
  selectedClip,
  onCopyClip,
  onPasteClip,
  onDeleteClip,
  onKeyframeClick,
  onClipUpdate,
}) => {
  if (!selectedClip) return null;

  return (
    <div
      className="clip-actions-bar"
      style={{
        height: 48,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space>
        <span style={{ fontWeight: 500 }}>已选中:</span>
        <span>{selectedClip.name}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>
          {formatTime(selectedClip.startTime)} - {formatTime(selectedClip.endTime)}
        </span>
      </Space>

      <Space>
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={onCopyClip}
        >
          复制
        </Button>
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={onPasteClip}
        >
          粘贴
        </Button>
        <Dropdown
          menu={{
            items: TRANSITION_TYPES.map(t => ({
              key: t.value,
              label: t.label,
              onClick: () => {
                if (selectedClip) {
                  onClipUpdate(selectedClip.id, {
                    transitions: {
                      ...selectedClip.transitions,
                      out: { type: t.value as Transition['type'], duration: 0.5 },
                    },
                  } as Partial<Clip>);
                }
              },
            })),
          }}
        >
          <Button size="small" icon={<PartitionOutlined />}>
            转场
          </Button>
        </Dropdown>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={onDeleteClip}
        >
          删除
        </Button>
        <Button
          size="small"
          onClick={onKeyframeClick}
        >
          关键帧
        </Button>
      </Space>
    </div>
  );
};

export default ClipActionsBar;