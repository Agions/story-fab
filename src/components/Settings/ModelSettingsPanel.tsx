/**
 * 模型设置面板
 */
import React from 'react';
import { Card, Select, Typography, Space, Tag, Divider, Alert } from 'antd';
import { RobotOutlined, ThunderboltOutlined, DollarOutlined } from '@ant-design/icons';
import { AI_MODELS, PROVIDER_NAMES, ModelProvider } from '@/constants/models';

const { Text, Title } = Typography;
const { Option } = Select;

interface ModelSettingsPanelProps {
  defaultModel: string;
  onModelChange: (model: string) => void;
}

const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({ defaultModel, onModelChange }) => {
  const selectedModel = AI_MODELS.find(m => m.id === defaultModel);

  return (
    <Card title="AI 模型设置" extra={<RobotOutlined />}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text type="secondary">默认模型</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={defaultModel}
            onChange={onModelChange}
            placeholder="选择默认 AI 模型"
            showSearch
            optionFilterProp="children"
          >
            {AI_MODELS.map(model => (
              <Option key={model.id} value={model.id}>
                <Space>
                  <span>{model.name}</span>
                  <Tag color="blue">{PROVIDER_NAMES[model.provider]}</Tag>
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
                      最大 {selectedModel.maxTokens.toLocaleString()} tokens
                    </Tag>
                    <Tag icon={<DollarOutlined />} color="orange">
                      {PROVIDER_NAMES[selectedModel.provider]}
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
