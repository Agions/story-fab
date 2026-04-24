/**
 * 模型过滤器组件
 * 处理分类、提供商和搜索过滤
 */

import React from 'react';
import { Input } from '../ui/input';
import { Bot, Edit3, Code2, FlaskConical, Video } from 'lucide-react';
import { MODEL_PROVIDERS } from '../../core/config/models.config';
import type { ModelCategory, ModelProvider } from '../../core/types';
import styles from './index.module.less';

const CATEGORY_OPTIONS = [
  { label: '全部', value: 'all', icon: <Bot size={14} /> },
  { label: '文本', value: 'text', icon: <Edit3 size={14} /> },
  { label: '代码', value: 'code', icon: <Code2 size={14} /> },
  { label: '图像', value: 'image', icon: <FlaskConical size={14} /> },
  { label: '视频', value: 'video', icon: <Video size={14} /> },
];

interface ModelFilterProps {
  category: ModelCategory | 'all';
  provider: ModelProvider | 'all';
  searchQuery: string;
  onCategoryChange: (category: ModelCategory | 'all') => void;
  onProviderChange: (provider: ModelProvider | 'all') => void;
  onSearchChange: (query: string) => void;
}

export const ModelFilter: React.FC<ModelFilterProps> = ({
  category,
  provider,
  searchQuery,
  onCategoryChange,
  onProviderChange,
  onSearchChange
}) => {
  const providerOptions = [
    { label: '全部', value: 'all' },
    ...Object.entries(MODEL_PROVIDERS).map(([key, config]) => ({
      label: config.name,
      value: key,
    })),
  ];

  return (
    <div className={styles.filters}>
      <div className="mb-3">
        <Input
          placeholder="搜索模型..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className="flex flex-col gap-2">
        {/* Category Segmented */}
        <div className="flex overflow-x-auto gap-1 p-1 bg-muted rounded-lg">
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onCategoryChange(opt.value as ModelCategory)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                category === opt.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
        {/* Provider Segmented */}
        <div className="flex overflow-x-auto gap-1 p-1 bg-muted rounded-lg">
          {providerOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onProviderChange(opt.value as ModelProvider)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                provider === opt.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelFilter;
