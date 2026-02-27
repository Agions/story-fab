import React from 'react';
import { Card, Button, Space, Typography, List, Badge, Tag, Empty } from 'antd';
import {
  ScissorOutlined,
  MergeCellsOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ClipAnalysisResult } from '@/core/services/aiClip.service';
import styles from '../index.module.less';

const { Text } = Typography;

interface SuggestionsStepProps {
  analysisResult: ClipAnalysisResult | null;
  selectedSuggestions: Set<string>;
  onToggleSuggestion: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApply: () => void;
}

const SuggestionsStep: React.FC<SuggestionsStepProps> = ({
  analysisResult,
  selectedSuggestions,
  onToggleSuggestion,
  onSelectAll,
  onDeselectAll,
  onApply
}) => {
  if (!analysisResult?.suggestions.length) {
    return (
      <Card className={styles.suggestionsCard}>
        <Empty description="暂无剪辑建议" />
      </Card>
    );
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trim':
        return <ScissorOutlined />;
      case 'merge':
        return <MergeCellsOutlined />;
      case 'cut':
        return <DeleteOutlined />;
      case 'effect':
        return <ExperimentOutlined />;
      default:
        return null;
    }
  };

  return (
    <Card className={styles.suggestionsCard}>
      <div className={styles.suggestionsHeader}>
        <Text>
          共 {analysisResult.suggestions.length} 条建议，已选中 {selectedSuggestions.size} 条
        </Text>
        <Space>
          <Button size="small" onClick={onDeselectAll}>
            取消全选
          </Button>
          <Button size="small" onClick={onSelectAll}>
            全选
          </Button>
        </Space>
      </div>

      <List
        className={styles.suggestionsList}
        dataSource={analysisResult.suggestions}
        renderItem={(suggestion) => (
          <List.Item
            className={`${styles.suggestionItem} ${
              selectedSuggestions.has(suggestion.id) ? styles.selected : ''
            }`}
            onClick={() => onToggleSuggestion(suggestion.id)}
            actions={[
              <Badge
                key="confidence"
                count={`${Math.round(suggestion.confidence * 100)}%`}
                style={{
                  backgroundColor:
                    suggestion.confidence > 0.8
                      ? '#52c41a'
                      : suggestion.confidence > 0.5
                      ? '#faad14'
                      : '#ff4d4f'
                }}
              />
            ]}
          >
            <List.Item.Meta
              avatar={
                <div className={styles.suggestionIcon}>
                  {getSuggestionIcon(suggestion.type)}
                </div>
              }
              title={
                <Space>
                  <Text strong>{suggestion.description}</Text>
                  {suggestion.autoApplicable && (
                    <Tag color="green" size="small">
                      可自动应用
                    </Tag>
                  )}
                </Space>
              }
              description={suggestion.reason}
            />
          </List.Item>
        )}
      />

      <div className={styles.actionButtons}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={onApply}
          disabled={selectedSuggestions.size === 0}
          size="large"
        >
          应用选中的建议 ({selectedSuggestions.size})
        </Button>
      </div>
    </Card>
  );
};

export default SuggestionsStep;
