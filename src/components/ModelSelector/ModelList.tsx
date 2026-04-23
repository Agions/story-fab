/**
 * 模型列表组件
 * 展示过滤后的模型列表
 */

import React from 'react';
import { AnimatePresence } from '@/components/common/motion-shim';
import { ModelCard } from './ModelCard';
import { Loader2 } from 'lucide-react';
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="sync">
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
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-30">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          没有找到匹配的模型
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModelList;
