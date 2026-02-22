/**
 * 模型选择器底部组件
 * 展示配置和测试按钮
 */

import React from 'react';
import { Space, Button, Divider } from 'antd';
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
            type="primary"
            icon={<SettingOutlined />}
            onClick={onConfigure}
          >
            配置 {providerName} API
          </Button>
        ) : (
          <Button
            icon={isTesting ? <LoadingOutlined /> : <ThunderboltOutlined />}
            onClick={onTest}
            loading={isTesting}
          >
            测试连接
          </Button>
        )}
      </Space>
    </div>
  );
};

export default ModelFooter;
