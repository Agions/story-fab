/**
 * 模型过滤器组件
 * 处理分类、提供商和搜索过滤
 */

import React from 'react';
import { Input, Segmented, Row, Col } from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  CodeOutlined,
  ExperimentOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { MODEL_PROVIDERS } from '@/core/config/models.config';
import type { ModelCategory, ModelProvider } from '@/core/types';
import styles from './index.module.less';

// 分类选项
const CATEGORY_OPTIONS = [
  { label: '全部', value: 'all', icon: <RobotOutlined /> },
  { label: '文本', value: 'text', icon: <EditOutlined /> },
  { label: '代码', value: 'code', icon: <CodeOutlined /> },
  { label: '图像', value: 'image', icon: <ExperimentOutlined /> },
  { label: '视频', value: 'video', icon: <VideoCameraOutlined /> }
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
  // 提供商选项
  const providerOptions = [
    { label: '全部', value: 'all' },
    ...Object.entries(MODEL_PROVIDERS).map(([key, config]) => ({
      label: config.name,
      value: key
    }))
  ];

  return (
    <div className={styles.filters}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input.Search
            placeholder="搜索模型..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            allowClear
            className={styles.searchInput}
          />
        </Col>
        <Col span={12}>
          <Segmented
            options={CATEGORY_OPTIONS.map(opt => ({
              label: opt.label,
              value: opt.value,
              icon: opt.icon
            }))}
            value={category}
            onChange={val => onCategoryChange(val as ModelCategory)}
            block
          />
        </Col>
        <Col span={12}>
          <Segmented
            options={providerOptions}
            value={provider}
            onChange={val => onProviderChange(val as ModelProvider)}
            block
          />
        </Col>
      </Row>
    </div>
  );
};

export default ModelFilter;
