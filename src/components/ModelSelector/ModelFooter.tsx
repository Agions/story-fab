/**
 * 模型选择器底部组件
 * 展示配置和测试按钮
 */

import React from 'react';
import { Space, Divider } from 'antd';
import { Button } from '@/components/ui/button';
import {
  SettingOutlined,
  ThunderboltOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { MODEL_PROVIDERS } from '@/core/config/models.config';
import type { ModelProvider } from '@/core/types';
import styles from './index.module.less';

interface ModelFooterProps {
  provider?: ModelProvider;
  isConfigured?: boolean;
  isTesting?: boolean;
  onConfigure?: () => void;
  onTest?: () => void;
}

export const ModelFooter: React.FC<ModelFooterProps> = ({
  provider,
  isConfigured = false,
  isTesting = false,
  onConfigure,
  onTest
}) => {
  if (!provider) return null;

  const providerName = MODEL_PROVIDERS[provider]?.name || provider;

  return (
    <div className={styles.footer}>
      <Divider />
      <Space>
        {!isConfigured ? (
          <Button
            className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
            onClick={onConfigure}
          >
            <SettingOutlined className="mr-1" />
            配置 {providerName} API
          </Button>
        ) : (
          <Button
            onClick={onTest}
            disabled={isTesting}
          >
            {isTesting ? '测试中...' : '测试连接'}
          </Button>
        )}
      </Space>
    </div>
  );
};

export default ModelFooter;
