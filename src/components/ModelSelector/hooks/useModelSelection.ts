/**
 * 模型选择 Hook
 * 处理模型选择和测试连接逻辑
 */

import { useState, useCallback } from 'react';
import type { AIModel, ModelProvider } from '@/core/types';

interface UseModelSelectionProps {
  onSelect?: (modelId: string) => void;
  onConfigure?: (provider: ModelProvider) => void;
}

interface UseModelSelectionReturn {
  // 测试状态
  isTesting: boolean;
  
  // 处理方法
  handleSelect: (model: AIModel) => void;
  handleTest: (testFn: () => Promise<boolean>) => Promise<boolean>;
  handleConfigure: (provider: ModelProvider) => void;
}

export function useModelSelection({
  onSelect,
  onConfigure
}: UseModelSelectionProps): UseModelSelectionReturn {
  const [isTesting, setIsTesting] = useState(false);

  // 处理模型选择
  const handleSelect = useCallback((model: AIModel) => {
    onSelect?.(model.id);
  }, [onSelect]);

  // 处理测试连接
  const handleTest = useCallback(async (
    testFn: () => Promise<boolean>
  ): Promise<boolean> => {
    setIsTesting(true);
    try {
      const result = await testFn();
      return result;
    } finally {
      setIsTesting(false);
    }
  }, []);

  // 处理配置
  const handleConfigure = useCallback((provider: ModelProvider) => {
    onConfigure?.(provider);
  }, [onConfigure]);

  return {
    isTesting,
    handleSelect,
    handleTest,
    handleConfigure
  };
}
