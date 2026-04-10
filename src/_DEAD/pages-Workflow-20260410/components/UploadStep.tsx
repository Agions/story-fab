import React, { memo } from 'react';
import { Card, Alert, Divider, Typography, Row, Col, Space, Switch, Radio, Select } from 'antd';
import { RobotOutlined, ThunderboltOutlined, ClockCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import VideoUploader from '@/components/VideoUploader';
import type { VideoInfo } from '@/core/types';
import type { AIClipConfig } from '../hooks/useWorkflowPage';
import styles from '../index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface UploadStepProps {
  selectedFile: File | null;
  aiClipConfig: AIClipConfig;
  onFileSelect: (file: File) => void;
  onConfigChange: (config: Partial<AIClipConfig>) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({
  selectedFile,
  aiClipConfig,
  onFileSelect,
  onConfigChange,
}) => {
  const handleUpload = (video: VideoInfo) => {
    onFileSelect(video as unknown as File);
  };

  return (
    <Card title="上传视频" className={styles.stepCard}>
      <VideoUploader
        onUpload={handleUpload}
        accept="video/*"
        maxSize={1024 * 1024 * 1024}
      />
      {selectedFile && (
        <Alert
          message={`已选择: ${selectedFile.name}`}
          type="success"
          showIcon
          className={styles.fileInfo}
        />
      )}

      <Divider />

      <Title level={5}>
        <RobotOutlined /> AI 剪辑配置
      </Title>
      <Row gutter={[16, 16]} className={styles.aiClipConfig}>
        <Col span={12}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch
                  checked={aiClipConfig.enabled}
                  onChange={(v) => onConfigChange({ enabled: v })}
                />
                <Text strong>启用 AI 剪辑</Text>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                自动检测剪辑点、识别静音片段、优化视频节奏
              </Paragraph>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch
                  checked={aiClipConfig.autoClip}
                  onChange={(v) => onConfigChange({ autoClip: v })}
                  disabled={!aiClipConfig.enabled}
                />
                <Text strong>一键智能剪辑</Text>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                自动应用高置信度的剪辑建议
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      {aiClipConfig.enabled && (
        <Card size="small" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Space>
                <Switch
                  checked={aiClipConfig.detectSceneChange}
                  onChange={(v) => onConfigChange({ detectSceneChange: v })}
                  size="small"
                />
                <Text>场景检测</Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Switch
                  checked={aiClipConfig.detectSilence}
                  onChange={(v) => onConfigChange({ detectSilence: v })}
                  size="small"
                />
                <Text>静音检测</Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Switch
                  checked={aiClipConfig.removeSilence}
                  onChange={(v) => onConfigChange({ removeSilence: v })}
                  size="small"
                />
                <Text>自动移除静音</Text>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Text>剪辑风格</Text>
              <Radio.Group
                value={aiClipConfig.pacingStyle}
                onChange={(e) => onConfigChange({ pacingStyle: e.target.value })}
                size="small"
                style={{ marginTop: 8, display: 'flex' }}
              >
                <Radio.Button value="fast" style={{ flex: 1, textAlign: 'center' }}>
                  <ThunderboltOutlined /> 快速
                </Radio.Button>
                <Radio.Button value="normal" style={{ flex: 1, textAlign: 'center' }}>
                  <ClockCircleOutlined /> 标准
                </Radio.Button>
                <Radio.Button value="slow" style={{ flex: 1, textAlign: 'center' }}>
                  <VideoCameraOutlined /> 舒缓
                </Radio.Button>
              </Radio.Group>
            </Col>
            <Col span={12}>
              <Text>目标时长（可选）</Text>
              <Select
                value={aiClipConfig.targetDuration || 'original'}
                onChange={(v) =>
                  onConfigChange({
                    targetDuration: v === 'original' ? undefined : Number(v),
                  })
                }
                style={{ width: '100%', marginTop: 8 }}
                size="small"
              >
                <Option value="original">保持原时长</Option>
                <Option value={30}>30秒</Option>
                <Option value={60}>1分钟</Option>
                <Option value={120}>2分钟</Option>
                <Option value={180}>3分钟</Option>
              </Select>
            </Col>
          </Row>
        </Card>
      )}
    </Card>
  );
};

export default memo(UploadStep);
