/**
 * 模型卡片组件
 * 展示单个模型的详细信息
 */

import React, { useMemo } from 'react';
import { Card, Typography, Tag, Space, Tooltip, Avatar } from 'antd';
import {
  CheckCircleFilled,
  StarOutlined,
  RobotOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { MODEL_PROVIDERS } from '@/core/config/models.config';
import type { AIModel, ModelProvider } from '@/core/types';
import styles from './index.module.less';

const { Text, Paragraph } = Typography;

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
  // 获取提供商图标
  const getProviderIcon = (providerId: ModelProvider): string => {
    const config = MODEL_PROVIDERS[providerId];
    return config?.icon || '';
  };

  // 获取提供商名称
  const getProviderName = (providerId: ModelProvider): string => {
    const config = MODEL_PROVIDERS[providerId];
    return config?.name || providerId;
  };

  // 处理点击
  const handleClick = () => {
    if (isAvailable) {
      onSelect(model);
    }
  };

  // 卡片类名
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
        size="small"
        hoverable={isAvailable}
      >
        <div className={styles.cardHeader}>
          <div className={styles.modelInfo}>
            <Avatar
              src={getProviderIcon(model.provider)}
              size={isCompact ? 32 : 40}
              className={styles.providerAvatar}
            />
            <div className={styles.modelMeta}>
              <Text strong className={styles.modelName}>
                {model.name}
                {isSelected && <CheckCircleFilled className={styles.checkIcon} />}
              </Text>
              <Text type="secondary" className={styles.providerName}>
                {getProviderName(model.provider)}
              </Text>
            </div>
          </div>
          <Space>
            {model.isPro && (
              <Tooltip title="专业版模型">
                <StarOutlined className={styles.proIcon} />
              </Tooltip>
            )}
            {!isAvailable && (
              <Tag color="default" size="small">未配置</Tag>
            )}
          </Space>
        </div>

        {!isCompact && (
          <>
            <Paragraph className={styles.description} ellipsis={{ rows: 2 }}>
              {model.description}
            </Paragraph>

            <div className={styles.features}>
              {model.features?.slice(0, 3).map((feature, idx) => (
                <Tag key={idx} className={styles.featureTag}>
                  {feature}
                </Tag>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <Space size="small">
                <Tooltip title={`上下文: ${(model.contextWindow / 1000).toFixed(0)}K tokens`}>
                  <Tag icon={<RobotOutlined />} size="small">
                    {(model.contextWindow / 1000).toFixed(0)}K
                  </Tag>
                </Tooltip>
                {showCost && estimatedCost && (
                  <Tooltip title="预估成本（500字脚本）">
                    <Tag icon={<DollarOutlined />} color="green">
                      {estimatedCost}
                    </Tag>
                  </Tooltip>
                )}
              </Space>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default ModelCard;
