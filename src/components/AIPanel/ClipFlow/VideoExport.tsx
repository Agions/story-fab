/**
 * 步骤6: 导出视频 - 优化版
 */
import React, { useState } from 'react';
import { 
  Card, Button, Space, Typography, Select, Slider, 
  Switch, Alert, Divider, Progress, message, Result, List, Tag, Row, Col, Radio, Tooltip, Badge
} from 'antd';
import {
  ExportOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  FileOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import type { ExportSettings } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 导出格式
const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4', desc: '通用格式，兼容性最好', icon: '🎬' },
  { value: 'mov', label: 'MOV', desc: 'Apple 格式，画质优秀', icon: '🍎' },
  { value: 'webm', label: 'WEBM', desc: 'Web 格式，适合在线播放', icon: '🌐' },
  { value: 'avi', label: 'AVI', desc: '老旧格式，体积较大', icon: '📼' },
];

// 质量选项
const QUALITY_OPTIONS = [
  { value: 'low', label: '流畅', desc: '文件小，省流量', bitrate: '1-2Mbps', size: '~10MB/min' },
  { value: 'medium', label: '标清', desc: '平衡画质和大小', bitrate: '3-5Mbps', size: '~30MB/min' },
  { value: 'high', label: '高清', desc: '清晰画质', bitrate: '8-12Mbps', size: '~60MB/min' },
  { value: 'ultra', label: '超清', desc: '4K 超高清', bitrate: '25-35Mbps', size: '~200MB/min' },
];

// 分辨率选项
const RESOLUTION_OPTIONS = [
  { value: '480p', label: '480p', desc: '854x480', ratio: '16:9' },
  { value: '720p', label: '720p HD', desc: '1280x720', ratio: '16:9' },
  { value: '1080p', label: '1080p Full HD', desc: '1920x1080', ratio: '16:9' },
  { value: '1440p', label: '2K QHD', desc: '2560x1440', ratio: '16:9' },
  { value: '2160p', label: '4K UHD', desc: '3840x2160', ratio: '16:9' },
];

// 帧率选项
const FPS_OPTIONS = [
  { value: 24, label: '24 fps', desc: '电影感', icon: '🎬' },
  { value: 30, label: '30 fps', desc: '标准', icon: '📺' },
  { value: 60, label: '60 fps', desc: '流畅', icon: '⚡' },
];

interface VideoExportProps {
  onComplete?: () => void;
}

const VideoExport: React.FC<VideoExportProps> = ({ onComplete }) => {
  const { state, setExportSettings, goToNextStep, dispatch } = useClipFlow();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 导出配置
  const [config, setConfig] = useState<ExportSettings>({
    format: state.exportSettings?.format || 'mp4',
    quality: state.exportSettings?.quality || 'high',
    resolution: state.exportSettings?.resolution || '1080p',
    frameRate: state.exportSettings?.frameRate || 30,
    includeSubtitles: state.exportSettings?.includeSubtitles ?? true,
    burnSubtitles: state.exportSettings?.burnSubtitles ?? true,
  });

  // 预估文件大小
  const estimateFileSize = () => {
    if (!state.currentVideo?.duration) return '0 MB';
    const bitrateMap: Record<string, number> = { low: 1.5, medium: 4, high: 10, ultra: 30 };
    const bitrate = bitrateMap[config.quality] || 5;
    const sizeMB = (bitrate * state.currentVideo.duration) / 8;
    return sizeMB > 1000 ? `${(sizeMB / 1000).toFixed(1)} GB` : `${sizeMB.toFixed(1)} MB`;
  };

  // 处理导出
  const handleExport = async () => {
    if (!state.synthesisData?.finalVideoUrl) {
      message.warning('请先完成视频合成');
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      // 模拟导出过程
      setProgress(10); await new Promise(r => setTimeout(r, 500));
      setProgress(30); await new Promise(r => setTimeout(r, 800));
      setProgress(50); await new Promise(r => setTimeout(r, 600));
      setProgress(70); await new Promise(r => setTimeout(r, 700));
      setProgress(90); await new Promise(r => setTimeout(r, 500));
      setProgress(100);

      // 保存设置
      setExportSettings(config);
      setExported(true);
      message.success('视频导出成功！');

    } catch {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 检查前置条件
  const hasSynthesis = !!state.synthesisData?.finalVideoUrl;

  if (!hasSynthesis) {
    return (
      <Alert
        message="请先完成视频合成"
        description="请先完成视频合成步骤"
        type="warning"
        showIcon
        action={
          <Button type="primary" onClick={() => dispatch({ type: 'SET_STEP', payload: 'video-synthesize' })}>
            去合成
          </Button>
        }
      />
    );
  }

  // 导出完成
  if (exported) {
    return (
      <Card>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="🎉 视频导出成功！"
          subTitle={
            <Space direction="vertical">
              <Text>文件格式: {config.format.toUpperCase()}</Text>
              <Text>分辨率: {config.resolution}</Text>
              <Text>预估大小: {estimateFileSize()}</Text>
            </Space>
          }
          extra={[
            <Button key="preview" icon={<PlayCircleOutlined />}>预览</Button>,
            <Button key="download" type="primary" icon={<DownloadOutlined />}>下载视频</Button>,
            <Button key="share" icon={<ExportOutlined />}>分享</Button>,
          ]}
        />
      </Card>
    );
  }

  // 导出中
  if (exporting) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Progress 
            type="circle" 
            percent={progress} 
            status="active"
            strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
          />
          <div style={{ marginTop: 24 }}>
            <Title level={4}>
              {progress < 30 ? '🎬 视频编码中...' : 
               progress < 60 ? '🔊 音频编码中...' : 
               progress < 90 ? '💾 生成文件...' : 
               '✨ 导出完成！'}
            </Title>
          </div>
          <Text type="secondary">请耐心等待...</Text>
        </div>
      </Card>
    );
  }

  // 配置界面
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>📤 导出设置</Title>
          <Tag icon={<VideoCameraOutlined />}>{config.format.toUpperCase()}</Tag>
          <Tag>{config.resolution}</Tag>
          <Tag>{config.frameRate}fps</Tag>
        </Space>
      </div>

      <Row gutter={16}>
        {/* 左侧：设置 */}
        <Col xs={24} lg={14}>
          {/* 格式选择 */}
          <Card title="🎬 输出格式" size="small" style={{ marginBottom: 16 }}>
            <Radio.Group 
              value={config.format}
              onChange={(e) => setConfig({ ...config, format: e.target.value })}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {FORMAT_OPTIONS.map(fmt => (
                  <Radio key={fmt.value} value={fmt.value} style={{ width: '100%', marginRight: 0, padding: '10px', border: `1px solid ${config.format === fmt.value ? '#1890ff' : '#e8e8e8'}`, borderRadius: 8 }}>
                    <Space>
                      <span style={{ fontSize: 18 }}>{fmt.icon}</span>
                      <div>
                        <Text strong>{fmt.label}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{fmt.desc}</Text>
                      </div>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Card>

          {/* 质量和分辨率 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 分辨率 */}
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>📐 分辨率</Text>
                <Radio.Group 
                  value={config.resolution}
                  onChange={(e) => setConfig({ ...config, resolution: e.target.value })}
                >
                  <Space wrap>
                    {RESOLUTION_OPTIONS.map(res => (
                      <Radio.Button key={res.value} value={res.value}>
                        {res.label}
                      </Radio.Button>
                    ))}
                  </Space>
                </Radio.Group>
              </div>

              {/* 帧率 */}
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>⚡ 帧率</Text>
                <Radio.Group 
                  value={config.frameRate}
                  onChange={(e) => setConfig({ ...config, frameRate: e.target.value })}
                >
                  <Space>
                    {FPS_OPTIONS.map(fps => (
                      <Radio key={fps.value} value={fps.value}>
                        {fps.label} <Text type="secondary" style={{ fontSize: 12 }}>({fps.desc})</Text>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>

              {/* 质量 */}
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>🎯 质量</Text>
                <Radio.Group 
                  value={config.quality}
                  onChange={(e) => setConfig({ ...config, quality: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <Row gutter={[8, 8]}>
                    {QUALITY_OPTIONS.map(q => (
                      <Col span={12} key={q.value}>
                        <div 
                          style={{ 
                            padding: 12, 
                            border: `2px solid ${config.quality === q.value ? '#1890ff' : '#e8e8e8'}`,
                            borderRadius: 8,
                            background: config.quality === q.value ? '#e6f7ff' : '#fff',
                            cursor: 'pointer'
                          }}
                          onClick={() => setConfig({ ...config, quality: q.value })}
                        >
                          <Text strong>{q.label}</Text>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{q.desc}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{q.bitrate}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </div>
            </Space>
          </Card>

          {/* 字幕选项 */}
          <Card title="📝 字幕选项" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Switch 
                  checked={config.includeSubtitles}
                  onChange={(v) => setConfig({ ...config, includeSubtitles: v })}
                />
                <Text style={{ marginLeft: 8 }}>包含字幕文件</Text>
              </div>
              <div>
                <Switch 
                  checked={config.burnSubtitles}
                  onChange={(v) => setConfig({ ...config, burnSubtitles: v })}
                />
                <Text style={{ marginLeft: 8 }}>烧录字幕到视频</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  (烧录后字幕将永久显示在画面上)
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 右侧：预览 */}
        <Col xs={24} lg={10}>
          {/* 导出信息 */}
          <Card title="📋 导出信息" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">原始视频</Text>
                <Text>{state.currentVideo?.name || '-'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">时长</Text>
                <Text>{Math.floor(state.currentVideo?.duration || 0)} 秒</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">格式</Text>
                <Tag>{config.format.toUpperCase()}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">分辨率</Text>
                <Tag>{config.resolution}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">帧率</Text>
                <Text>{config.frameRate} fps</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>预估大小</Text>
                <Badge count={estimateFileSize()} style={{ backgroundColor: '#1890ff' }} />
              </div>
            </Space>
          </Card>

          {/* 快捷导出 */}
          <Card title="⚡ 快速导出" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                一键导出 (MP4/1080p/高清)
              </Button>
              <Button block icon={<ExportOutlined />} onClick={handleExport}>
                自定义导出
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VideoExport;
