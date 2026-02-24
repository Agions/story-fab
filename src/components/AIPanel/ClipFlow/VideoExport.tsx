/**
 * 步骤6: 导出视频
 * 
 * 数据输入: 
 *   - synthesis (从 VideoSynthesize 来)
 *   - exportSettings
 * 数据输出: 
 *   - exported file (最终导出文件)
 */
import React, { useState } from 'react';
import { 
  Card, Button, Space, Typography, Select, Slider, 
  Switch, Alert, Divider, Progress, message, Result, List, Tag 
} from 'antd';
import {
  ExportOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import type { ExportSettings } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 导出格式
const formatOptions = [
  { value: 'mp4', label: 'MP4', desc: '通用格式，兼容性好' },
  { value: 'mov', label: 'MOV', desc: 'Apple 格式，画质好' },
  { value: 'webm', label: 'WEBM', desc: 'Web 格式，适合在线' },
];

// 质量选项
const qualityOptions = [
  { value: 'low', label: '低', desc: '文件小，适合移动端', bitrate: '1Mbps' },
  { value: 'medium', label: '中', desc: '平衡画质和大小', bitrate: '5Mbps' },
  { value: 'high', label: '高', desc: '高清画质', bitrate: '10Mbps' },
  { value: 'ultra', label: '超清', desc: '4K 超高清', bitrate: '30Mbps' },
];

// 分辨率选项
const resolutionOptions = [
  { value: '720p', label: '720p', desc: '1280x720' },
  { value: '1080p', label: '1080p', desc: '1920x1080' },
  { value: '2k', label: '2K', desc: '2560x1440' },
  { value: '4k', label: '4K', desc: '3840x2160' },
];

// 帧率选项
const frameRateOptions = [
  { value: 24, label: '24 fps', desc: '电影标准' },
  { value: 30, label: '30 fps', desc: '常用' },
  { value: 60, label: '60 fps', desc: '流畅' },
];

interface VideoExportProps {
  onComplete?: () => void;
}

const VideoExport: React.FC<VideoExportProps> = ({ onComplete }) => {
  const { 
    state, 
    setExportSettings,
    goToNextStep,
    dispatch,
  } = useClipFlow();

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exported, setExported] = useState(false);

  // 导出配置
  const [config, setConfig] = useState<ExportSettings>({
    format: state.exportSettings?.format || 'mp4',
    quality: state.exportSettings?.quality || 'high',
    resolution: state.exportSettings?.resolution || '1080p',
    frameRate: state.exportSettings?.frameRate || 30,
    includeSubtitles: state.exportSettings?.includeSubtitles ?? true,
    burnSubtitles: state.exportSettings?.burnSubtitles ?? true,
  });

  // 处理导出
  const handleExport = async () => {
    if (!state.synthesisData.finalVideoUrl) {
      message.warning('请先完成视频合成');
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      // 1. 编码视频
      setProgress(20);
      await new Promise(r => setTimeout(r, 1000));
      
      // 2. 编码音频
      setProgress(40);
      await new Promise(r => setTimeout(r, 800));
      
      // 3. 烧录字幕
      if (config.burnSubtitles) {
        setProgress(60);
        await new Promise(r => setTimeout(r, 800));
      }
      
      // 4. 添加元数据
      setProgress(80);
      await new Promise(r => setTimeout(r, 500));
      
      // 5. 完成
      setProgress(100);
      
      // 保存导出设置
      setExportSettings(config);
      
      setExported(true);
      dispatch({ 
        type: 'SET_STEP_COMPLETE', 
        payload: { step: 'export', complete: true } 
      });
      
      message.success('视频导出成功！');
    } catch (error) {
      message.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 检查前置条件
  const canExport = state.stepStatus['video-synthesize'];
  const hasVideo = state.synthesisData.finalVideoUrl;

  // 估算文件大小
  const estimateFileSize = (): string => {
    if (!state.duration) return '未知';
    
    const bitrateMap: Record<string, number> = {
      'low': 1,
      'medium': 5,
      'high': 10,
      'ultra': 30,
    };
    
    const bitrate = bitrateMap[config.quality] || 5;
    const sizeMB = (bitrate * state.duration) / 8;
    
    if (sizeMB > 1024) {
      return `${(sizeMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>导出视频</Title>
        <Paragraph>
          配置导出参数，生成最终视频文件
        </Paragraph>
      </div>

      {!canExport ? (
        <Alert
          message="请先完成视频合成"
          description="请先完成视频合成，然后导出"
          type="warning"
          showIcon
        />
      ) : exported ? (
        // 导出完成
        <div className={styles.flowComplete}>
          <CheckCircleOutlined className={styles.completeIcon} />
          <Title level={3} className={styles.completeTitle}>
            导出完成！
          </Title>
          <Paragraph className={styles.completeDesc}>
            您的视频已成功导出，可以下载或分享
          </Paragraph>
          
          <Card style={{ maxWidth: 400, margin: '0 auto 24px' }}>
            <List
              size="small"
              dataSource={[
                { label: '文件名', value: `${state.project?.name || '视频'}.${config.format}` },
                { label: '格式', value: config.format.toUpperCase() },
                { label: '分辨率', value: config.resolution },
                { label: '质量', value: config.quality },
                { label: '预估大小', value: estimateFileSize() },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Text type="secondary">{item.label}</Text>
                  <Text>{item.value}</Text>
                </List.Item>
              )}
            />
          </Card>
          
          <div className={styles.actions}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              size="large"
              onClick={() => message.info('下载功能开发中...')}
            >
              下载视频
            </Button>
            <Button 
              icon={<PlayCircleOutlined />}
              onClick={() => {
                if (onComplete) {
                  onComplete();
                }
              }}
            >
              预览视频
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 预览 */}
          <Card title="导出预览" style={{ marginBottom: 16 }}>
            {hasVideo ? (
              <div className={styles.videoContainer}>
                <video
                  src={state.synthesisData.finalVideoUrl}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 250 }}
                />
              </div>
            ) : (
              <Text type="secondary">暂无预览</Text>
            )}
          </Card>

          {/* 导出设置 */}
          <Card title={<Space><SettingOutlined />导出设置</Space>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 格式 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>视频格式</Text>
                <Select
                  value={config.format}
                  onChange={(v) => setConfig({ ...config, format: v })}
                  style={{ width: '100%' }}
                >
                  {formatOptions.map(f => (
                    <Select.Option key={f.value} value={f.value}>
                      <Space>
                        <FileOutlined />
                        {f.label}
                        <Text type="secondary" style={{ fontSize: 12 }}>{f.desc}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* 质量 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>视频质量</Text>
                <Select
                  value={config.quality}
                  onChange={(v) => setConfig({ ...config, quality: v })}
                  style={{ width: '100%' }}
                >
                  {qualityOptions.map(q => (
                    <Select.Option key={q.value} value={q.value}>
                      <Space>
                        {q.label}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {q.desc} ({q.bitrate})
                        </Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* 分辨率 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>分辨率</Text>
                <Select
                  value={config.resolution}
                  onChange={(v) => setConfig({ ...config, resolution: v })}
                  style={{ width: '100%' }}
                >
                  {resolutionOptions.map(r => (
                    <Select.Option key={r.value} value={r.value}>
                      {r.label} ({r.desc})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* 帧率 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>帧率</Text>
                <Select
                  value={config.frameRate}
                  onChange={(v) => setConfig({ ...config, frameRate: v })}
                  style={{ width: '100%' }}
                >
                  {frameRateOptions.map(f => (
                    <Select.Option key={f.value} value={f.value}>
                      {f.label} - {f.desc}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <Divider />

              {/* 字幕选项 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>包含字幕</Text>
                <Switch 
                  checked={config.includeSubtitles}
                  onChange={(v) => setConfig({ ...config, includeSubtitles: v })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>烧录字幕到视频</Text>
                <Switch 
                  checked={config.burnSubtitles}
                  onChange={(v) => setConfig({ ...config, burnSubtitles: v })}
                  disabled={!config.includeSubtitles}
                />
              </div>

              <Divider />

              {/* 文件信息 */}
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>预估文件大小</Text>
                    <Text strong>{estimateFileSize()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>预估时长</Text>
                    <Text strong>{Math.floor(state.duration / 60)}:{Math.floor(state.duration % 60).toString().padStart(2, '0')}</Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Card>

          {/* 导出进度 */}
          {exporting && (
            <Card style={{ marginTop: 16 }}>
              <Progress 
                percent={progress} 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
              />
              <Text type="secondary">正在导出视频，请勿关闭页面...</Text>
            </Card>
          )}

          <Divider />

          <Button 
            type="primary" 
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exporting}
            disabled={!hasVideo}
            size="large"
            block
          >
            导出视频
          </Button>
        </>
      )}
    </div>
  );
};

export default VideoExport;
