/**
 * 模型选择器头部组件
 * 展示标题和当前选择状态
 */

import React from 'react';
import { Typography, Space, Badge } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import type { AIModel } from '@/core/types';
import styles from './index.module.less';

const { Title, Text } = Typography;

interface ModelHeaderProps {
  selectedModel?: AIModel;
  isConfigured?: boolean;
}

export const ModelHeader: React.FC<ModelHeaderProps> = ({
  selectedModel,
  isConfigured = false
}) => {
  return (
    <div className={styles.header}>
      <Title level={4} className={styles.title}>
        <RobotOutlined /> 选择 AI 模型
      </Title>
      {selectedModel && (
        <Space>
          <Text type="secondary">
            当前: <Text strong>{selectedModel.name}</Text>
          </Text>
          {isConfigured ? (
            <Badge status="success" text="已配置" />
          ) : (
            <Badge status="warning" text="未配置" />
          )}
        </Space>
      )}
    </div>
  );
};

export default ModelHeader;
