/**
 * 模型设置面板
 */
import React from 'react';
import { Card, Select, Typography, Space, Tag, Divider, Alert } from 'antd';
import { RobotOutlined, ThunderboltOutlined, DollarOutlined } from '@ant-design/icons';
import { AI_MODELS, MODEL_VERIFICATION, MODEL_CATALOG_VERIFIED_AT } from '@/core/config/models.config';
import { PROVIDER_NAMES } from '@/constants/models';
import type { AIModel } from '@/core/types';

const { Text, Title } = Typography;
const { Option } = Select;

interface ModelSettingsPanelProps {
  defaultModel: string;
  availableModels: AIModel[];
  onModelChange: (model: string) => void;
}

const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({
  defaultModel,
  availableModels,
  onModelChange,
}) => {
  const selectedModel = availableModels.find(m => m.id === defaultModel) || availableModels[0];
  const isModelSelectable = availableModels.length > 0;

  return (
    <Card title="AI 模型设置" extra={<RobotOutlined />}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {!isModelSelectable && (
          <Alert
            type="warning"
            showIcon
            message="暂无可选模型"
            description="请先在 API 密钥管理中配置至少一个提供商的 API 密钥，模型列表将自动同步。"
          />
        )}
        <div>
          <Text type="secondary">默认模型（核验日期：{MODEL_CATALOG_VERIFIED_AT}）</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={selectedModel?.id}
            onChange={onModelChange}
            placeholder="选择默认 AI 模型"
            showSearch
            optionFilterProp="children"
            disabled={!isModelSelectable}
          >
            {availableModels.map(model => (
              <Option key={model.id} value={model.id}>
                <Space>
                  <span>{model.name}</span>
                  <Tag color="blue">{PROVIDER_NAMES[model.provider as keyof typeof PROVIDER_NAMES]}</Tag>
                  {MODEL_VERIFICATION[model.id]?.verified ? (
                    <Tag color="green">已核验</Tag>
                  ) : (
                    <Tag color="gold">需手动确认</Tag>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        {selectedModel && (
          <>
            <Divider />
            <Alert
              type="info"
              message={
                <Space direction="vertical" size="small">
                  <Text strong>{selectedModel.name}</Text>
                  <Text type="secondary">{selectedModel.description}</Text>
                  <Space>
                    <Tag icon={<ThunderboltOutlined />} color="green">
                      最大 {(selectedModel.tokenLimit ?? 4096).toLocaleString()} tokens
                    </Tag>
                    <Tag icon={<DollarOutlined />} color="orange">
                      {PROVIDER_NAMES[selectedModel.provider as keyof typeof PROVIDER_NAMES]}
                    </Tag>
                    <Tag color={MODEL_VERIFICATION[selectedModel.id]?.verified ? 'green' : 'gold'}>
                      核验日期 {MODEL_VERIFICATION[selectedModel.id]?.checkedAt || '待确认'}
                    </Tag>
                  </Space>
                </Space>
              }
            />
          </>
        )}
      </Space>
    </Card>
  );
};

export default ModelSettingsPanel;
