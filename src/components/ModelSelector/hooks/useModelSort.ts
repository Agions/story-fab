/**
 * 模型排序 Hook
 * 处理模型排序逻辑
 */

import { useState, useMemo, useCallback } from 'react';
import type { AIModel } from '@/core/types';

export type SortField = 'name' | 'contextWindow' | 'pricing' | 'recommended';
export type SortOrder = 'asc' | 'desc';

interface UseModelSortProps {
  models: AIModel[];
  defaultField?: SortField;
  defaultOrder?: SortOrder;
}

interface UseModelSortReturn {
  sortField: SortField;
  sortOrder: SortOrder;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSort: (field: SortField) => void;
  sortedModels: AIModel[];
}

export function useModelSort({
  models,
  defaultField = 'recommended',
  defaultOrder = 'desc'
}: UseModelSortProps): UseModelSortReturn {
  const [sortField, setSortField] = useState<SortField>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  // 排序模型
  const sortedModels = useMemo(() => {
    const sorted = [...models];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'contextWindow':
          comparison = (a.contextWindow || 0) - (b.contextWindow || 0);
          break;
        case 'pricing':
          const priceA = a.pricing?.input || 0;
          const priceB = b.pricing?.input || 0;
          comparison = priceA - priceB;
          break;
        case 'recommended':
          // 推荐模型排在前面
          const recA = a.isPro ? 2 : a.recommended ? 1 : 0;
          const recB = b.isPro ? 2 : b.recommended ? 1 : 0;
          comparison = recA - recB;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [models, sortField, sortOrder]);

  // 切换排序
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  return {
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    toggleSort,
    sortedModels
  };
}
