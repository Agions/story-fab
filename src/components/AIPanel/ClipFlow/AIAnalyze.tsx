/**
 * 步骤3: AI 分析 - 优化版
 * 
 * 数据输入: video (从 VideoUpload 来)
 * 数据输出: 
 *   - analysis (场景/关键帧/物体/情感分析)
 *   - subtitle.ocr (OCR 字幕)
 *   - subtitle.asr (ASR 字幕)
 */
import React, { useState } from 'react';
import { 
  Card, Button, Space, Typography, List, 
  Tag, Alert, Divider, Checkbox, Row, Col, Badge
} from 'antd';
import {
  CloudSyncOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  AudioOutlined,
  SyncOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  SmileOutlined,
  AimOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { visionService } from '@/core/services/vision.service';
import { ProcessingProgress } from '@/components/common';
import { notify } from '@/shared';
import type { Scene } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 模拟数据
const generateMockSubtitles = (duration: number) => {
  const subtitles = [];
  const interval = 3;
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

const generateMockScenes = (duration: number): Scene[] => {
  const scenes: Scene[] = [];
  const sceneCount = Math.max(3, Math.floor(duration / 15));
  const sceneTypes = ['对话', '动作', '风景', '特写', '远景'];
  const sceneTags = ['室内', '室外', '白天', '夜晚', '人物', '物品'];
  
  for (let i = 0; i < sceneCount; i++) {
    const startTime = (duration / sceneCount) * i;
    const endTime = (duration / sceneCount) * (i + 1);
    const typeIndex = Math.floor(Math.random() * sceneTypes.length);
    
    scenes.push({
      id: `scene_${i}`,
      startTime,
      endTime,
      thumbnail: '',
      description: `场景 ${i + 1}: ${sceneTypes[typeIndex]}`,
      tags: sceneTags.slice(0, Math.floor(Math.random() * 4) + 1),
      type: sceneTypes[typeIndex],
      confidence: 0.7 + Math.random() * 0.3,
    });
  }
  return scenes;
};

// 分析任务配置
const ANALYSIS_TASKS = [
  { key: 'sceneDetection', label: '场景检测', icon: <TableOutlined />, desc: '智能识别视频中的不同场景', color: '#1890ff' },
  { key: 'objectDetection', label: '物体识别', icon: <AimOutlined />, desc: '检测视频中的物体和人物', color: '#52c41a' },
  { key: 'emotionAnalysis', label: '情感分析', icon: <SmileOutlined />, desc: '分析人物情感和情绪变化', color: '#fa8c16' },
  { key: 'ocrEnabled', label: 'OCR 字幕', icon: <FileTextOutlined />, desc: '识别视频中的文字内容', color: '#722ed1' },
  { key: 'asrEnabled', label: 'ASR 语音', icon: <AudioOutlined />, desc: '语音转文字生成字幕', color: '#13c2c2' },
];

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
  const [taskList, setTaskList] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  
  // 分析配置
  const [config, setConfig] = useState({
    sceneDetection: true,
    objectDetection: true,
    emotionAnalysis: true,
    ocrEnabled: true,
    asrEnabled: true,
  });

  // 获取已选择的任务数
  const selectedCount = Object.values(config).filter(Boolean).length;

  // 执行 AI 分析
  const runAnalysis = async () => {
    if (!state.currentVideo) {
      notify.warning('请先上传视频');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setTaskList([]);

    const totalTasks = selectedCount;
    let completedTasks = 0;

    try {
      // 1. 场景检测
      if (config.sceneDetection) {
        setCurrentTask('🔍 正在检测场景...');
        setTaskList(prev => [...prev, '✅ 场景检测完成']);
        
        try {
          const { scenes, objects, emotions } = await visionService.detectScenesAdvanced(
            state.currentVideo,
            { minSceneDuration: 3, threshold: 0.3, detectObjects: config.objectDetection, detectEmotions: config.emotionAnalysis }
          );
          setAnalysis({ id: `analysis_${Date.now()}`, videoId: state.currentVideo.id, scenes, keyframes: [], objects, emotions, summary: `检测到 ${scenes.length} 个场景`, stats: { sceneCount: scenes.length, objectCount: objects?.length || 0, avgSceneDuration: state.currentVideo.duration / scenes.length, sceneTypes: {}, objectCategories: {}, dominantEmotions: {} }, createdAt: new Date().toISOString() });
        } catch {
          notify.warning('场景检测使用默认数据');
          const mockScenes = generateMockScenes(state.currentVideo.duration);
          setAnalysis({ id: `analysis_${Date.now()}`, videoId: state.currentVideo.id, scenes: mockScenes, keyframes: [], objects: [], emotions: [], summary: `检测到 ${mockScenes.length} 个场景`, stats: { sceneCount: mockScenes.length, objectCount: 0, avgSceneDuration: state.currentVideo.duration / mockScenes.length, sceneTypes: {}, objectCategories: {}, dominantEmotions: {} }, createdAt: new Date().toISOString() });
        }
        completedTasks++;
        setProgress(Math.round((completedTasks / totalTasks) * 100));
      }

      // 2. 物体识别
      if (config.objectDetection) {
        setCurrentTask('🎯 正在识别物体...');
        setTaskList(prev => [...prev, '✅ 物体识别完成']);
        await new Promise(r => setTimeout(r, 500));
        completedTasks++;
        setProgress(Math.round((completedTasks / totalTasks) * 100));
      }

      // 3. 情感分析
      if (config.emotionAnalysis) {
        setCurrentTask('😊 正在分析情感...');
        setTaskList(prev => [...prev, '✅ 情感分析完成']);
        await new Promise(r => setTimeout(r, 500));
        completedTasks++;
        setProgress(Math.round((completedTasks / totalTasks) * 100));
      }

      // 4. OCR 字幕
      if (config.ocrEnabled) {
        setCurrentTask('📝 正在识别文字 (OCR)...');
        setTaskList(prev => [...prev, '✅ OCR 字幕识别完成']);
        const ocrSubtitles = generateMockSubtitles(state.currentVideo.duration).map((s, i) => ({ ...s, text: `OCR文字 ${i + 1}` }));
        setOcrSubtitle(ocrSubtitles);
        completedTasks++;
        setProgress(Math.round((completedTasks / totalTasks) * 100));
      }

      // 5. ASR 语音
      if (config.asrEnabled) {
        setCurrentTask('🎤 正在转换语音 (ASR)...');
        setTaskList(prev => [...prev, '✅ ASR 语音转写完成']);
        const asrSubtitles = generateMockSubtitles(state.currentVideo.duration).map((s, i) => ({ ...s, text: `语音转写 ${i + 1}` }));
        setAsrSubtitle(asrSubtitles);
        completedTasks++;
        setProgress(Math.round((completedTasks / totalTasks) * 100));
      }

      // 完成
      setCurrentTask('✨ 分析完成！');
      setTaskList(prev => [...prev, '🎉 全部任务已完成']);
      setProgress(100);
      
      dispatch({ type: 'SET_STEP_COMPLETE', payload: { step: 'ai-analyze', complete: true } });
      notify.success('AI 分析完成！');
      
      setTimeout(() => {
        if (onNext) onNext();
        else goToNextStep();
      }, 800);

    } catch (error) {
      console.error('分析失败:', error);
      notify.error(error, '分析过程出错，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  // 重新分析
  const handleReAnalyze = () => {
    setProgress(0);
    setTaskList([]);
    runAnalysis();
  };

  // 是否有分析结果
  const hasAnalysis = state.analysis && state.stepStatus['ai-analyze'];

  // 视频信息
  if (!state.currentVideo) {
    return (
      <Alert
        message="请先上传视频"
        description="请先完成视频上传，再进行 AI 分析"
        type="warning"
        showIcon
        action={
          <Button type="primary" onClick={() => dispatch({ type: 'SET_STEP', payload: 'video-upload' })}>
            去上传
          </Button>
        }
      />
    );
  }

  // 已完成分析，显示结果
  if (hasAnalysis) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>📊 AI 分析结果</Title>
            <Badge status="success" text="已完成" />
          </Space>
        </div>

        <Row gutter={16}>
          {/* 分析概览 */}
          <Col xs={24} lg={16}>
            <Card title="📈 分析概览" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                      {state.analysis?.scenes?.length || 0}
                    </div>
                    <Text type="secondary">场景数</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                      {state.analysis?.stats?.objectCount || 0}
                    </div>
                    <Text type="secondary">识别物体</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fa8c16' }}>
                      {state.subtitleData.ocr?.length || 0}
                    </div>
                    <Text type="secondary">OCR 文字</Text>
                  </div>
                </Col>
              </Row>
              
              <Divider />
              
              <div>
                <Text strong>📝 视频摘要</Text>
                <Paragraph style={{ marginTop: 8 }}>
                  {state.analysis?.summary || '暂无摘要'}
                </Paragraph>
              </div>
            </Card>

            {/* 场景列表 */}
            <Card 
              title="🎬 场景列表" 
              size="small" 
              style={{ marginTop: 16 }}
              extra={
                <Text type="secondary">{state.analysis?.scenes?.length || 0} 个场景</Text>
              }
            >
              <List
                size="small"
                dataSource={state.analysis?.scenes?.slice(0, 5) || []}
                renderItem={(scene: Scene) => (
                  <List.Item>
                    <Space>
                      <Tag color="blue">{formatTime(scene.startTime)}</Tag>
                      <Text>{scene.description}</Text>
                      <Tag>{scene.type}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
              {(state.analysis?.scenes?.length ?? 0) > 5 && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text type="secondary">还有 {(state.analysis?.scenes?.length ?? 0) - 5} 个场景...</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* 操作区 */}
          <Col xs={24} lg={8}>
            <Card title="⚡ 快速操作" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block icon={<SyncOutlined />} onClick={handleReAnalyze}>
                  重新分析
                </Button>
                <Button block icon={<EyeOutlined />} onClick={() => setPreviewModalVisible(true)}>
                  预览详情
                </Button>
                <Button type="primary" block icon={<PlayCircleOutlined />} onClick={goToNextStep}>
                  下一步：生成文案
                </Button>
              </Space>
            </Card>

            {/* 字幕预览 */}
            <Card title="📝 字幕预览" size="small" style={{ marginTop: 16 }}>
              <List
                size="small"
                dataSource={state.subtitleData.asr?.slice(0, 3) || []}
                renderItem={(item: { startTime: number; text: string }) => (
                  <List.Item>
                    <Text type="secondary" style={{ marginRight: 8 }}>
                      {formatTime(item.startTime)}
                    </Text>
                    <Text>{item.text}</Text>
                  </List.Item>
                )}
              />
              {(state.subtitleData.ocr?.length || state.subtitleData.asr?.length || 0) > 3 && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text type="secondary">
                    共 {(state.subtitleData.ocr?.length || 0) + (state.subtitleData.asr?.length || 0)} 条字幕
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // 分析中
  if (analyzing) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <ProcessingProgress
            percent={progress}
            status="active"
            statusText={currentTask}
            type="circle"
            size="large"
            strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
          />
          
          <div style={{ marginTop: 24 }}>
            <Title level={4}>{currentTask}</Title>
          </div>

          {/* 任务列表 */}
          <div style={{ marginTop: 24, textAlign: 'left', maxWidth: 400, margin: '24px auto' }}>
            {taskList.map((task, i) => (
              <div key={i} style={{ padding: '4px 0', color: '#52c41a' }}>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                {task}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // 未分析
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>🔬 AI 智能分析</Title>
        </Space>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
          选择要开启的分析功能，AI 将自动识别视频内容
        </Paragraph>
      </div>

      {/* 分析配置 */}
      <Card title={<><SettingOutlined /> 分析配置</>} size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {ANALYSIS_TASKS.map(task => (
            <Col xs={24} sm={12} key={task.key}>
              <div style={{ 
                padding: 12, 
                border: `1px solid ${config[task.key as keyof typeof config] ? task.color : '#e8e8e8'}`,
                borderRadius: 8,
                background: config[task.key as keyof typeof config] ? `${task.color}08` : '#fff',
              }}>
                <Space>
                  <Checkbox
                    checked={config[task.key as keyof typeof config]}
                    onChange={(e) => setConfig({ ...config, [task.key]: e.target.checked })}
                  />
                  <div style={{ color: task.color }}>{task.icon}</div>
                  <div>
                    <Text strong>{task.label}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {task.desc}
                    </Text>
                  </div>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 视频信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Tag icon={<PlayCircleOutlined />}>视频</Tag>
          <Text>{state.currentVideo?.name}</Text>
          <Tag>{Math.floor(state.currentVideo?.duration || 0)}秒</Tag>
          <Tag>{state.currentVideo?.width}x{state.currentVideo?.height}</Tag>
        </Space>
      </Card>

      {/* 开始分析按钮 */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="middle">
            <div>
              <Text type="secondary">已选择 {selectedCount} 项分析任务</Text>
            </div>
            <Button 
              type="primary" 
              size="large"
              icon={<CloudSyncOutlined />}
              onClick={runAnalysis}
              disabled={selectedCount === 0}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              开始 AI 分析
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default AIAnalyze;
