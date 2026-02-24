/**
 * 步骤3: AI 分析
 * 
 * 数据输入: video (从 VideoUpload 来)
 * 数据输出: 
 *   - analysis (场景/关键帧/物体/情感分析)
 *   - subtitle.ocr (OCR 字幕 - 视频中文字识别)
 *   - subtitle.asr (语音字幕 - 语音转文字)
 * 流转到: ScriptGenerate
 */
import React, { useState, useCallback } from 'react';
import { 
  Card, Button, Space, Typography, Progress, List, 
  Tag, Alert, Divider, Switch, Tabs, Empty, Spin, message 
} from 'antd';
import {
  CloudSyncOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { visionService } from '@/core/services';
import { ProcessingProgress, PreviewModal } from '@/components/common';
import type { VideoAnalysis, Scene, Keyframe } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// 模拟生成字幕数据
const generateMockSubtitles = (duration: number) => {
  const subtitles = [];
  const interval = 3; // 每3秒一句话
  
  for (let t = 0; t < duration; t += interval) {
    subtitles.push({
      startTime: t,
      endTime: Math.min(t + interval, duration),
      text: `这是第 ${Math.floor(t / interval) + 1} 句演示文本...`,
      speaker: Math.random() > 0.5 ? 'Speaker A' : 'Speaker B',
    });
  }
  
  return subtitles;
};

// 模拟生成场景数据
const generateMockScenes = (duration: number): Scene[] => {
  const scenes: Scene[] = [];
  const sceneCount = Math.max(3, Math.floor(duration / 15)); // 每15秒一个场景
  
  for (let i = 0; i < sceneCount; i++) {
    const startTime = (duration / sceneCount) * i;
    const endTime = (duration / sceneCount) * (i + 1);
    
    scenes.push({
      id: `scene_${i}`,
      startTime,
      endTime,
      thumbnail: '', // 可以后续生成
      description: `场景 ${i + 1}`,
      tags: ['室内', '对话'].slice(0, Math.floor(Math.random() * 3) + 1),
      type: ['对话', '动作', '风景'][Math.floor(Math.random() * 3)],
      confidence: 0.7 + Math.random() * 0.3,
    });
  }
  
  return scenes;
};

interface AIAnalyzeProps {
  onNext?: () => void;
}

const AIAnalyze: React.FC<AIAnalyzeProps> = ({ onNext }) => {
  const { 
    state, 
    setAnalysis, 
    setOcrSubtitle, 
    setAsrSubtitle,
    goToNextStep,
    dispatch 
  } = useClipFlow();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  
  // 分析配置
  const [config, setConfig] = useState({
    ocrEnabled: true,      // OCR 字幕
    asrEnabled: true,       // 语音字幕
    sceneDetection: true,   // 场景检测
    objectDetection: true,  // 物体检测
    emotionAnalysis: true,  // 情感分析
  });

  // 执行 AI 分析 (对接 visionService)
  const runAnalysis = async () => {
    if (!state.currentVideo) {
      message.warning('请先上传视频');
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    try {
      // 1. 场景检测 (30%)
      if (config.sceneDetection) {
        setCurrentTask('正在检测场景...');
        
        try {
          // 调用 visionService 进行高级场景检测
          const { scenes, objects, emotions } = await visionService.detectScenesAdvanced(
            state.currentVideo,
            {
              minSceneDuration: 3,
              threshold: 0.3,
              detectObjects: config.objectDetection,
              detectEmotions: config.emotionAnalysis,
            }
          );
          
          setProgress(30);
          
          // 生成分析报告
          const analysis: VideoAnalysis = await visionService.generateAnalysisReport(
            state.currentVideo,
            scenes,
            objects,
            emotions
          );
          
          setAnalysis(analysis);
        } catch (error) {
          console.error('场景检测失败:', error);
          // 降级使用模拟数据
          message.warning('场景检测服务暂不可用，使用默认数据');
          const mockScenes = generateMockScenes(state.currentVideo.duration);
          const analysis: VideoAnalysis = {
            id: `analysis_${Date.now()}`,
            videoId: state.currentVideo.id,
            scenes: mockScenes,
            keyframes: [],
            objects: [],
            emotions: [],
            summary: `检测到 ${mockScenes.length} 个场景片段`,
            stats: {
              sceneCount: mockScenes.length,
              objectCount: 0,
              avgSceneDuration: state.currentVideo.duration / mockScenes.length,
              sceneTypes: { '对话': 5, '动作': 3, '风景': 2 },
              objectCategories: {},
              dominantEmotions: { 'neutral': 0.6, 'happy': 0.3, 'sad': 0.1 },
            },
            createdAt: new Date().toISOString(),
          };
          setAnalysis(analysis);
        }
      }

      // 2. OCR 字幕 (50%)
      if (config.ocrEnabled) {
        setCurrentTask('正在识别字幕文字 (OCR)...');
        
        try {
          // TODO: 调用 OCR 服务
          // const ocrResult = await ocrService.recognizeText(state.currentVideo.path);
          // 这里暂时使用模拟数据
          await new Promise(r => setTimeout(r, 800));
          
          const ocrSubtitles = generateMockSubtitles(state.currentVideo.duration).map((s, i) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            text: `OCR识别文字 ${i + 1}`,
          }));
          
          setOcrSubtitle(ocrSubtitles);
          setProgress(50);
        } catch (error) {
          console.error('OCR识别失败:', error);
          message.warning('OCR服务暂不可用');
          setProgress(50);
        }
      }

      // 3. ASR 语音字幕 (80%)
      if (config.asrEnabled) {
        setCurrentTask('正在转换语音为文字 (ASR)...');
        
        try {
          // TODO: 调用 ASR 服务
          // const asrResult = await asrService.recognizeSpeech(state.currentVideo.path);
          // 这里暂时使用模拟数据
          await new Promise(r => setTimeout(r, 800));
          
          const asrSubtitles = generateMockSubtitles(state.currentVideo.duration).map((s, i) => ({
            ...s,
            text: `语音识别文字 ${i + 1}`,
          }));
          
          setAsrSubtitle(asrSubtitles);
          setProgress(80);
        } catch (error) {
          console.error('ASR识别失败:', error);
          message.warning('ASR服务暂不可用');
          setProgress(80);
        }
      }

      // 4. 完成
      setCurrentTask('分析完成');
      setProgress(100);
      
      dispatch({ 
        type: 'SET_STEP_COMPLETE', 
        payload: { step: 'ai-analyze', complete: true } 
      });
      
      message.success('AI 分析完成');
      
      // 跳转到下一步
      if (onNext) {
        onNext();
      } else {
        setTimeout(() => goToNextStep(), 500);
      }
    } catch (error) {
      console.error('AI分析过程出错:', error);
      message.error('分析过程出错，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  // 如果已有分析结果，显示结果
  const hasAnalysis = state.analysis || state.subtitleData.ocr || state.subtitleData.asr;

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>AI 视频分析</Title>
        <Paragraph>
          智能识别视频内容，生成字幕和分析结果
        </Paragraph>
      </div>

      {/* 分析配置 */}
      <Card title="分析选项" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <FileTextOutlined />
              <Text>OCR 字幕识别</Text>
            </Space>
            <Switch 
              checked={config.ocrEnabled} 
              onChange={(v) => setConfig({ ...config, ocrEnabled: v })}
              disabled={analyzing}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <AudioOutlined />
              <Text>语音字幕识别 (ASR)</Text>
            </Space>
            <Switch 
              checked={config.asrEnabled} 
              onChange={(v) => setConfig({ ...config, asrEnabled: v })}
              disabled={analyzing}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <PlayCircleOutlined />
              <Text>场景检测</Text>
            </Space>
            <Switch 
              checked={config.sceneDetection} 
              onChange={(v) => setConfig({ ...config, sceneDetection: v })}
              disabled={analyzing}
            />
          </div>
        </Space>
      </Card>

      {/* 分析进度或结果 */}
      {analyzing ? (
        <Card>
          <div className={styles.analysisProgress}>
            <ProcessingProgress
              percent={progress}
              statusText={currentTask}
              status="active"
              type="circle"
              size="large"
              showIcon={false}
              extra={
                <Title level={5} style={{ marginTop: 16, marginBottom: 0 }}>
                  {currentTask}
                </Title>
              }
            />
          </div>
        </Card>
      ) : hasAnalysis ? (
        <Card>
          <Alert
            message="分析已完成"
            description="AI 已完成视频分析，您可以选择重新分析或继续下一步"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 分析统计 */}
          {state.analysis && (
            <div style={{ marginBottom: 16 }}>
              <Divider orientation="left">分析结果</Divider>
              <Space wrap>
                <Tag color="blue">
                  场景数: {state.analysis.stats?.sceneCount || 0}
                </Tag>
                <Tag color="green">
                  平均场景时长: {state.analysis.stats?.avgSceneDuration.toFixed(1)}s
                </Tag>
              </Space>
              
              <List
                size="small"
                dataSource={state.analysis.scenes.slice(0, 5)}
                renderItem={(scene) => (
                  <List.Item>
                    <Tag>{formatTime(scene.startTime)} - {formatTime(scene.endTime)}</Tag>
                    <Text>{scene.description}</Text>
                    <Tag color={scene.type === '对话' ? 'purple' : scene.type === '动作' ? 'red' : 'green'}>
                      {scene.type}
                    </Tag>
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 字幕统计 */}
          {(state.subtitleData.ocr || state.subtitleData.asr) && (
            <div>
              <Divider orientation="left">字幕数据</Divider>
              <Space wrap>
                {state.subtitleData.ocr && (
                  <Tag icon={<FileTextOutlined />} color="orange">
                    OCR 字幕: {state.subtitleData.ocr.length} 条
                  </Tag>
                )}
                {state.subtitleData.asr && (
                  <Tag icon={<AudioOutlined />} color="cyan">
                    语音字幕: {state.subtitleData.asr.length} 条
                  </Tag>
                )}
              </Space>
            </div>
          )}

          <Divider />

          <Space>
            <Button 
              icon={<SyncOutlined />}
              onClick={runAnalysis}
              loading={analyzing}
            >
              重新分析
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => setPreviewModalVisible(true)}
            >
              预览分析结果
            </Button>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={goToNextStep}
            >
              下一步：生成文案
            </Button>
          </Space>
        </Card>
      ) : state.stepStatus['video-upload'] ? (
        <Card>
          <Empty 
            description="尚未分析视频" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              icon={<CloudSyncOutlined />}
              onClick={runAnalysis}
              loading={analyzing}
              size="large"
            >
              开始 AI 分析
            </Button>
          </Empty>
        </Card>
      ) : (
        <Alert
          message="请先上传视频"
          description="请先完成视频上传，然后进行 AI 分析"
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};

export default AIAnalyze;
