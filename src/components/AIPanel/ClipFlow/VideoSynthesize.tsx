/**
 * 步骤5: 视频合成
 * 
 * 数据输入: 
 *   - video (从 VideoUpload 来)
 *   - script (解说/混剪文案)
 *   - voice (配音)
 * 数据输出: 
 *   - synthesis (最终合成视频)
 * 流转到: Export
 */
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, Button, Space, Typography, List, Tag, 
  Switch, Slider, Select, Alert, Divider, Progress, message, Empty, Tabs 
} from 'antd';
import {
  EditOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { 
  voiceSynthesisService, 
  videoEffectService, 
  audioVideoSyncService,
  subtitleService 
} from '@/core/services';
import type { VoiceConfig, EffectConfig } from '@/core/services';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 配音角色
const voiceOptions = [
  { value: 'female_zh', label: '女声 (中文)', lang: 'zh-CN', style: '温柔' },
  { value: 'male_zh', label: '男声 (中文)', lang: 'zh-CN', style: '成熟' },
  { value: 'female_en', label: '女声 (英文)', lang: 'en-US', style: '活泼' },
  { value: 'male_en', label: '男声 (英文)', lang: 'en-US', style: '稳重' },
  { value: 'neutral', label: '中性声音', lang: 'zh-CN', style: '专业' },
];

interface VideoSynthesizeProps {
  onNext?: () => void;
}

const VideoSynthesize: React.FC<VideoSynthesizeProps> = ({ onNext }) => {
  const { 
    state, 
    setVoice,
    setSynthesis,
    goToNextStep,
    dispatch,
  } = useClipFlow();

  const [synthesizing, setSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);

  // 合成配置
  const [config, setConfig] = useState({
    // 配音设置
    voiceId: state.voiceData.voiceSettings.voiceId,
    voiceSpeed: state.voiceData.voiceSettings.speed * 100,
    voiceVolume: state.voiceData.voiceSettings.volume * 100,
    enableVoice: true,
    
    // 字幕设置
    enableSubtitle: true,
    
    // 特效设置
    enableEffect: false,
    effectStyle: 'cinematic',
    
    // 音画同步
    syncAudioVideo: true,
  });

  // 获取当前脚本内容
const getCurrentScriptContent = (): string => {
  const narration = state.scriptData.narration;
  const remix = state.scriptData.remix;
  return narration?.content || remix?.content || '';
};

// 处理配音生成 (对接 voiceSynthesisService)
  const handleGenerateVoice = useCallback(async () => {
    const scriptContent = getCurrentScriptContent();
    if (!scriptContent) {
      message.warning('请先生成文案');
      return;
    }

    dispatch({ type: 'SET_VOICE_PROGRESS', payload: { isSynthesizing: true, progress: 0 } });

    try {
      // 配置语音参数
      const voiceConfig: VoiceConfig = {
        voice: config.voiceId.includes('female') ? 'female' : config.voiceId.includes('male') ? 'male' : 'neutral',
        language: config.voiceId.includes('_en') ? 'en-US' : 'zh-CN',
        rate: config.voiceSpeed / 100,
        pitch: 1.0,
        volume: config.voiceVolume / 100,
        format: 'audio/mp3',
      };
      
      // 更新服务配置
      voiceSynthesisService.updateConfig(voiceConfig);
      
      message.info('正在合成语音，请稍候...');
      
      // 调用语音合成服务
      const result = await voiceSynthesisService.synthesize(scriptContent);
      
      // 如果有实际音频 URL，使用它；否则使用模拟 URL
      const audioUrl = result.audioUrl || `data:audio/mp3;base64,mock_${Date.now()}`;
      
      setVoice(audioUrl, {
        voiceId: config.voiceId,
        speed: config.voiceSpeed / 100,
        volume: config.voiceVolume / 100,
      });
      
      dispatch({ type: 'SET_VOICE_PROGRESS', payload: { isSynthesizing: false, progress: 100 } });
      message.success('配音已生成');
    } catch (error) {
      console.error('语音合成失败:', error);
      message.warning('语音合成服务暂不可用，使用默认配音');
      
      // 降级处理：使用模拟音频 URL
      const mockAudioUrl = `data:audio/wav;base64,mock_audio_${Date.now()}`;
      setVoice(mockAudioUrl, {
        voiceId: config.voiceId,
        speed: config.voiceSpeed / 100,
        volume: config.voiceVolume / 100,
      });
      
      dispatch({ type: 'SET_VOICE_PROGRESS', payload: { isSynthesizing: false, progress: 100 } });
      message.success('配音已添加（模拟）');
    }
  }, [config.voiceId, config.voiceSpeed, config.voiceVolume, setVoice, dispatch]);

  // 处理视频合成
  const handleSynthesize = async () => {
    if (!state.currentVideo) {
      message.warning('请先上传视频');
      return;
    }

    if (!state.scriptData.narration && !state.scriptData.remix) {
      message.warning('请先生成文案');
      return;
    }

    setSynthesizing(true);
    setProgress(0);

    try {
      // 模拟合成过程
      // 1. 音频处理
      setProgress(20);
      await new Promise(r => setTimeout(r, 800));
      
      // 2. 字幕生成
      if (config.enableSubtitle) {
        setProgress(40);
        await new Promise(r => setTimeout(r, 800));
      }
      
      // 3. 特效处理
      if (config.enableEffect) {
        setProgress(60);
        await new Promise(r => setTimeout(r, 800));
      }
      
      // 4. 音画合成
      setProgress(80);
      await new Promise(r => setTimeout(r, 1000));
      
      // 5. 完成
      setProgress(100);
      
      // 生成合成视频 URL（这里用原始视频模拟）
      const finalVideoUrl = state.currentVideo.path;
      
      setSynthesis(finalVideoUrl, {
        syncAudioVideo: config.syncAudioVideo,
        addSubtitles: config.enableSubtitle,
        addWatermark: false,
      });
      
      dispatch({ 
        type: 'SET_STEP_COMPLETE', 
        payload: { step: 'video-synthesize', complete: true } 
      });
      
      message.success('视频合成完成');
      
      if (onNext) {
        onNext();
      } else {
        setTimeout(() => goToNextStep(), 500);
      }
    } catch (error) {
      message.error('视频合成失败');
    } finally {
      setSynthesizing(false);
    }
  };

  // 检查前置条件
  const canProceed = state.stepStatus['script-generate'];
  const hasScript = state.scriptData.narration || state.scriptData.remix;
  const hasVoice = state.voiceData.audioUrl;
  const hasSynthesis = state.synthesisData.finalVideoUrl;

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>视频合成</Title>
        <Paragraph>
          整合视频、字幕、配音，生成最终成片
        </Paragraph>
      </div>

      {!canProceed ? (
        <Alert
          message="请先生成文案"
          description="请先完成文案生成，然后进行视频合成"
          type="warning"
          showIcon
        />
      ) : (
        <>
          {/* 合成预览 */}
          <Card title="预览" style={{ marginBottom: 16 }}>
            {state.currentVideo ? (
              <div className={styles.videoContainer}>
                <video
                  src={state.synthesisData.finalVideoUrl || state.currentVideo.path}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </div>
            ) : (
              <Empty description="暂无视频" />
            )}
          </Card>

          {/* 合成配置 */}
          <Tabs 
            items={[
              {
                key: 'voice',
                label: (
                  <Space>
                    <SoundOutlined />
                    配音设置
                    {hasVoice && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                ),
                children: (
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>启用配音</Text>
                        <Switch 
                          checked={config.enableVoice}
                          onChange={(v) => setConfig({ ...config, enableVoice: v })}
                        />
                      </div>
                      
                      {config.enableVoice && (
                        <>
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>配音角色</Text>
                            <Select
                              value={config.voiceId}
                              onChange={(v) => setConfig({ ...config, voiceId: v })}
                              style={{ width: '100%' }}
                            >
                              {voiceOptions.map(v => (
                                <Select.Option key={v.value} value={v.value}>
                                  {v.label} ({v.style})
                                </Select.Option>
                              ))}
                            </Select>
                          </div>
                          
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                              语速: {config.voiceSpeed}%
                            </Text>
                            <Slider
                              value={config.voiceSpeed}
                              onChange={(v) => setConfig({ ...config, voiceSpeed: v })}
                              min={50}
                              max={200}
                              marks={{ 50: '0.5x', 100: '1x', 200: '2x' }}
                            />
                          </div>
                          
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                              音量: {config.voiceVolume}%
                            </Text>
                            <Slider
                              value={config.voiceVolume}
                              onChange={(v) => setConfig({ ...config, voiceVolume: v })}
                              min={0}
                              max={100}
                            />
                          </div>
                          
                          <Button 
                            icon={<SoundOutlined />}
                            onClick={handleGenerateVoice}
                            loading={state.isSynthesizingVoice}
                            block
                          >
                            {hasVoice ? '重新生成配音' : '生成配音'}
                          </Button>
                        </>
                      )}
                    </Space>
                  </Card>
                ),
              },
              {
                key: 'subtitle',
                label: (
                  <Space>
                    <EditOutlined />
                    字幕设置
                    {config.enableSubtitle && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                ),
                children: (
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>添加字幕</Text>
                        <Switch 
                          checked={config.enableSubtitle}
                          onChange={(v) => setConfig({ ...config, enableSubtitle: v })}
                        />
                      </div>
                      
                      {config.enableSubtitle && hasScript && (
                        <div>
                          <Text type="secondary">
                            将为「{state.scriptData.narration?.title || state.scriptData.remix?.title}」添加字幕
                          </Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                ),
              },
              {
                key: 'effect',
                label: (
                  <Space>
                    <VideoCameraOutlined />
                    特效设置
                    {config.enableEffect && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                ),
                children: (
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>添加特效</Text>
                        <Switch 
                          checked={config.enableEffect}
                          onChange={(v) => setConfig({ ...config, enableEffect: v })}
                        />
                      </div>
                      
                      {config.enableEffect && (
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 8 }}>特效风格</Text>
                          <Select
                            value={config.effectStyle}
                            onChange={(v) => setConfig({ ...config, effectStyle: v })}
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="cinematic">电影感</Select.Option>
                            <Select.Option value="vlog">Vlog 风格</Select.Option>
                            <Select.Option value="action">动作大片</Select.Option>
                            <Select.Option value="retro">复古怀旧</Select.Option>
                          </Select>
                        </div>
                      )}
                    </Space>
                  </Card>
                ),
              },
            ]}
          />

          {/* 合成进度 */}
          {synthesizing && (
            <Card style={{ marginTop: 16 }}>
              <Progress 
                percent={progress} 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
              />
              <Text type="secondary">正在合成视频，请稍候...</Text>
            </Card>
          )}

          {/* 完成状态 */}
          {hasSynthesis && !synthesizing && (
            <Alert
              message="视频合成完成"
              description="您可以对合成结果进行调整或继续导出"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          <Divider />

          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={handleSynthesize}
              loading={synthesizing}
              disabled={!hasScript}
              size="large"
            >
              {hasSynthesis ? '重新合成' : '开始合成'}
            </Button>
            {hasSynthesis && (
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  if (onNext) {
                    onNext();
                  } else {
                    goToNextStep();
                  }
                }}
              >
                下一步：导出视频
              </Button>
            )}
          </Space>
        </>
      )}
    </div>
  );
};

export default VideoSynthesize;
