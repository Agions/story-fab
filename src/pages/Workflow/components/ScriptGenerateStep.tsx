import React, { memo } from 'react';
import { Card, Row, Col, Space, Select, Radio, Progress, Typography } from 'antd';
import ModelSelector from '@/components/ModelSelector';
import type { AIModel } from '@/core/types';
import type { ScriptParams } from '../hooks/useWorkflowPage';
import styles from '../index.module.less';

const { Text } = Typography;
const { Option } = Select;

interface ScriptGenerateStepProps {
  models: AIModel[];
  selectedModel: AIModel | null;
  scriptParams: ScriptParams;
  isRunning: boolean;
  progress: number;
  onModelSelect: (modelId: string) => void;
  onParamsChange: (params: Partial<ScriptParams>) => void;
}

const ScriptGenerateStep: React.FC<ScriptGenerateStepProps> = ({
  models,
  selectedModel,
  scriptParams,
  isRunning,
  progress,
  onModelSelect,
  onParamsChange,
}) => {
  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
  };

  return (
    <Card title="生成脚本" className={styles.stepCard}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <ModelSelector onSelect={handleModelSelect} taskType="script" />

        <Card size="small" title="脚本参数">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className={styles.paramItem}>
                <Text>风格</Text>
                <Select
                  value={scriptParams.style}
                  onChange={(v) => onParamsChange({ style: v })}
                  style={{ width: '100%' }}
                >
                  <Option value="professional">专业</Option>
                  <Option value="casual">轻松</Option>
                  <Option value="humorous">幽默</Option>
                  <Option value="emotional">情感</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.paramItem}>
                <Text>语气</Text>
                <Select
                  value={scriptParams.tone}
                  onChange={(v) => onParamsChange({ tone: v })}
                  style={{ width: '100%' }}
                >
                  <Option value="friendly">友好</Option>
                  <Option value="authoritative">权威</Option>
                  <Option value="enthusiastic">热情</Option>
                  <Option value="calm">平静</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.paramItem}>
                <Text>时长</Text>
                <Radio.Group
                  value={scriptParams.length}
                  onChange={(e) => onParamsChange({ length: e.target.value })}
                >
                  <Radio.Button value="short">简短</Radio.Button>
                  <Radio.Button value="medium">适中</Radio.Button>
                  <Radio.Button value="long">详细</Radio.Button>
                </Radio.Group>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.paramItem}>
                <Text>语言</Text>
                <Radio.Group
                  value={scriptParams.language}
                  onChange={(e) => onParamsChange({ language: e.target.value })}
                >
                  <Radio.Button value="zh">中文</Radio.Button>
                  <Radio.Button value="en">English</Radio.Button>
                </Radio.Group>
              </div>
            </Col>
          </Row>
        </Card>

        {isRunning && (
          <div className={styles.loadingArea}>
            <Progress percent={progress} status="active" />
            <Text>正在生成解说脚本...</Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default memo(ScriptGenerateStep);
