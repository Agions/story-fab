/**
 * EmptyState - 无轨道时的占位提示
 */
import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onAddVideoTrack,
  onAddAudioTrack,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
      }}
    >
      <p>暂无轨道</p>
      <Space>
        <Button icon={<PlusOutlined />} onClick={onAddVideoTrack}>
          添加视频轨道
        </Button>
        <Button icon={<PlusOutlined />} onClick={onAddAudioTrack}>
          添加音频轨道
        </Button>
      </Space>
    </div>
  );
};

export default EmptyState;