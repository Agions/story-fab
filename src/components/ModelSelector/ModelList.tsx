/**
 * 模型列表组件
 * 展示过滤后的模型列表
 */

import React from 'react';
import { Spin, Empty } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { ModelCard } from './ModelCard';
import type { AIModel } from '@/core/types';
import styles from './index.module.less';

interface ModelListProps {
  models: AIModel[];
  selectedModelId?: string;
  availableModelIds: string[];
  isLoading?: boolean;
  isCompact?: boolean;
  showCost?: boolean;
  getModelCost: (model: AIModel) => string | null;
  onSelect: (model: AIModel) => void;
}

export const ModelList: React.FC<ModelListProps> = ({
  models,
  selectedModelId,
  availableModelIds,
  isLoading = false,
  isCompact = false,
  showCost = true,
  getModelCost,
  onSelect
}) => {
  return (
    <Spin spinning={isLoading} tip="加载中...">
      <AnimatePresence mode="popLayout">
        {models.length > 0 ? (
          <div className={isCompact ? styles.compactGrid : styles.modelGrid}>
            {models.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                isAvailable={availableModelIds.includes(model.id)}
                isCompact={isCompact}
                showCost={showCost}
                estimatedCost={getModelCost(model)}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <Empty
            description="没有找到匹配的模型"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </AnimatePresence>
    </Spin>
  );
};

export default ModelList;
