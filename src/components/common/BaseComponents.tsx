/**
 * 通用 UI 组件
 */
import React from 'react';
import { Spin, Empty, Button, Space, Typography, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
}

export function Loading({ tip = '加载中...', size = 'default' }: LoadingProps) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'small' ? 24 : 36 }} spin />} />
      <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>{tip}</Text>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title = '暂无数据', description, action }: EmptyStateProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space direction="vertical" align="center">
          <Text strong>{title}</Text>
          {description && <Text type="secondary">{description}</Text>}
        </Space>
      }
    >
      {action}
    </Empty>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = '出错了', 
  message = '请稍后重试',
  onRetry 
}: ErrorStateProps) {
  return (
    <Card>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction="vertical" align="center">
            <Text type="danger" strong>{title}</Text>
            <Text type="secondary">{message}</Text>
          </Space>
        }
      >
        {onRetry && (
          <Button type="primary" onClick={onRetry}>
            重试
          </Button>
        )}
      </Empty>
    </Card>
  );
}

interface ResultCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

export function ResultCard({ icon, title, description, extra }: ResultCardProps) {
  return (
    <Card>
      <Space direction="vertical" align="center" style={{ width: '100%', padding: 24 }}>
        {icon && <div style={{ fontSize: 48 }}>{icon}</div>}
        <Text strong style={{ fontSize: 16 }}>{title}</Text>
        {description && <Text type="secondary">{description}</Text>}
        {extra && <div style={{ marginTop: 16 }}>{extra}</div>}
      </Space>
    </Card>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

// 简化的确认对话框组件占位
export function ConfirmModal({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  loading = false
}: ConfirmModalProps) {
  // 使用 Ant Design Modal 替代
  return null;
}

export default {
  Loading,
  EmptyState,
  ErrorState,
  ResultCard,
  ConfirmModal,
};
