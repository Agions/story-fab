/**
 * 模型推荐组件
 * 展示任务相关的推荐模型
 */

import React from 'react';
import { Button } from '../ui/button';
import { Star } from 'lucide-react';
import type { AIModel } from '../../core/types';
import styles from './index.module.less';

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
      <span className={`${styles.sectionTitle} text-xs text-muted-foreground flex items-center gap-1 mb-2`}>
        <Star size={12} className="inline" /> 推荐模型
      </span>
      <div className="flex flex-wrap gap-2">
        {models.map((model, idx) => (
          <Button
            key={model.id}
            variant={currentModelId === model.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(idx)}
          >
            {idx === 0 && <Star size={12} className="mr-1" />}
            {model.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ModelRecommendations;
