/**
 * 模型推荐组件
 * 展示任务相关的推荐模型
 */

import React from 'react';
import { Typography, Space } from 'antd';
import { Button } from '@/components/ui/button';
import { StarOutlined } from '@ant-design/icons';
import type { AIModel } from '@/core/types';
import styles from './index.module.less';

const { Text } = Typography;

interface ModelRecommendationsProps {
  models: AIModel[];
  currentModelId?: string;
  onSelect: (index: number) => void;
}

export const ModelRecommendations: React.FC<ModelRecommendationsProps> = ({
  models,
  currentModelId,
  onSelect
}) => {
  if (models.length === 0) return null;

  return (
    <div className={styles.recommendations}>
      <Text type="secondary" className={styles.sectionTitle}>
        <StarOutlined /> 推荐模型
      </Text>
      <Space wrap>
        {models.map((model, idx) => (
          <Button
            key={model.id}
            variant={currentModelId === model.id ? 'default' : 'outline'}
            onClick={() => onSelect(idx)}
          >
            {idx === 0 && <StarOutlined className="mr-1" />}
            {model.name}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default ModelRecommendations;
