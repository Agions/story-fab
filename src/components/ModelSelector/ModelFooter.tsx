/**
 * 模型选择器底部组件
 * 展示配置和测试按钮
 */

import React from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Settings, Zap, Loader2 } from 'lucide-react';
import { MODEL_PROVIDERS } from '../../core/config/aiModels.config';
import type { ModelProvider } from '@/core/types';
import styles from '@/components/ModelSelector/index.module.less';

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
      <Separator className="my-3" />
      <div className="flex items-center gap-2">
        {!isConfigured ? (
          <Button
            className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
            onClick={onConfigure}
          >
            <Settings size={14} className="mr-1" />
            配置 {providerName} API
          </Button>
        ) : (
          <Button
            onClick={onTest}
            disabled={isTesting}
          >
            {isTesting ? (
              <><Loader2 size={14} className="mr-1 animate-spin" />测试中...</>
            ) : (
              <><Zap size={14} className="mr-1" />测试连接</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModelFooter;
