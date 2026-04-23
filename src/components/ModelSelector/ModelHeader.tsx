/**
 * 模型选择器头部组件
 * 展示标题和当前选择状态
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import type { AIModel } from '@/core/types';
import styles from './index.module.less';

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
      <h4 className={styles.title}>
        <Bot size={16} className="inline mr-1" /> 选择 AI 模型
      </h4>
      {selectedModel && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            当前: <span className="font-medium text-foreground">{selectedModel.name}</span>
          </span>
          {isConfigured ? (
            <Badge variant="default" className="text-xs bg-green-600/20 text-green-600 border-green-600/40">已配置</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">未配置</Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelHeader;
