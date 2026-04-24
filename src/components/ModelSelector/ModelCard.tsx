/**
 * 模型卡片组件
 * 展示单个模型的详细信息
 */

import React, { useMemo } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { CheckCircle, Star, Bot, DollarSign } from 'lucide-react';
import { motion } from '../common/motion-shim';
import { MODEL_PROVIDERS } from '../../core/config/models.config';
import type { AIModel, ModelProvider } from '../../core/types';
import styles from './index.module.less';

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  isAvailable: boolean;
  isCompact?: boolean;
  showCost?: boolean;
  estimatedCost?: string | null;
  onSelect: (model: AIModel) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  isAvailable,
  isCompact = false,
  showCost = true,
  estimatedCost,
  onSelect
}) => {
  const getProviderName = (providerId: ModelProvider | undefined): string => {
    const config = MODEL_PROVIDERS[providerId ?? 'custom'];
    return config?.name || providerId || 'Unknown';
  };

  const getProviderIcon = (providerId: ModelProvider | undefined): string => {
    const config = MODEL_PROVIDERS[providerId ?? 'custom'];
    return config?.icon || '';
  };

  const handleClick = () => {
    if (isAvailable) onSelect(model);
  };

  const cardClassName = useMemo(() => {
    const classes = [styles.modelCard];
    if (isSelected) classes.push(styles.selected);
    if (!isAvailable) classes.push(styles.unavailable);
    return classes.join(' ');
  }, [isSelected, isAvailable]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={isAvailable ? { scale: 1.02 } : undefined}
      whileTap={isAvailable ? { scale: 0.98 } : undefined}
    >
      <Card
        className={cardClassName}
        onClick={handleClick}
        size="sm"
      >
        <div className={styles.cardHeader}>
          <div className={styles.modelInfo}>
            <Avatar className={styles.providerAvatar}>
              <AvatarImage src={getProviderIcon(model.provider)} alt={getProviderName(model.provider)} />
              <AvatarFallback>{getProviderName(model.provider).charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={styles.modelMeta}>
              <span className={`${styles.modelName} font-medium text-sm`}>
                {model.name}
                {isSelected && <CheckCircle size={14} className="ml-1 text-green-500 inline" />}
              </span>
              <span className={`${styles.providerName} text-xs text-muted-foreground`}>
                {getProviderName(model.provider)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {model.isPro && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
                    <Star size={14} className={styles.proIcon} />
                  </TooltipTrigger>
                  <TooltipContent>专业版模型</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isAvailable && (
              <Badge variant="secondary">未配置</Badge>
            )}
          </div>
        </div>

        {!isCompact && (
          <>
            <p className={`${styles.description} text-xs text-muted-foreground line-clamp-2`}>
              {model.description}
            </p>

            <div className={styles.features}>
              {model.features?.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <div className="flex gap-1 flex-wrap">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger render={<Badge variant="outline" className="text-xs cursor-default" />}>
                      <Bot size={10} className="mr-1" />
                      {(model.contextWindow ?? 4096 / 1000).toFixed(0)}K
                    </TooltipTrigger>
                    <TooltipContent>上下文: {(model.contextWindow ?? 4096 / 1000).toFixed(0)}K tokens</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {showCost && estimatedCost && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<Badge variant="outline" className="text-xs text-green-600 border-green-600 cursor-default" />}>
                        <DollarSign size={10} className="mr-1" />
                        {estimatedCost}
                      </TooltipTrigger>
                      <TooltipContent>预估成本（500字脚本）</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default ModelCard;
