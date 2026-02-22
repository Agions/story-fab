/**
 * 模型过滤 Hook
 * 处理模型搜索、分类过滤、提供商过滤逻辑
 */

import { useState, useMemo, useCallback } from 'react';
import type { AIModel, ModelProvider, ModelCategory } from '@/core/types';

interface UseModelFilterProps {
  models: AIModel[];
}

interface UseModelFilterReturn {
  // 过滤状态
  category: ModelCategory | 'all';
  provider: ModelProvider | 'all';
  searchQuery: string;
  
  // 过滤方法
  setCategory: (category: ModelCategory | 'all') => void;
  setProvider: (provider: ModelProvider | 'all') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  
  // 过滤结果
  filteredModels: AIModel[];
  hasResults: boolean;
}

export function useModelFilter({ models }: UseModelFilterProps): UseModelFilterReturn {
  const [category, setCategory] = useState<ModelCategory | 'all'>('all');
  const [provider, setProvider] = useState<ModelProvider | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤模型
  const filteredModels = useMemo(() => {
    let result = models;

    // 按分类过滤
    if (category !== 'all') {
      result = result.filter(m => m.category.includes(category));
    }

    // 按提供商过滤
    if (provider !== 'all') {
      result = result.filter(m => m.provider === provider);
    }

    // 按搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query)
      );
    }

    return result;
  }, [models, category, provider, searchQuery]);

  // 重置过滤器
  const resetFilters = useCallback(() => {
    setCategory('all');
    setProvider('all');
    setSearchQuery('');
  }, []);

  return {
    category,
    provider,
    searchQuery,
    setCategory,
    setProvider,
    setSearchQuery,
    resetFilters,
    filteredModels,
    hasResults: filteredModels.length > 0
  };
}
