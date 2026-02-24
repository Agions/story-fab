/**
 * 步骤4: 生成文案
 * 
 * 三大核心功能：
 * 1. AI 视频解说 - 对视频内容进行专业解说
 * 2. AI 第一人称解说 - 以第一人称视角讲述
 * 3. AI 混剪 - 自动识别精彩片段并添加旁白
 * 
 * 数据输入: 
 *   - analysis (从 AIAnalyze 来)
 *   - subtitle (OCR/ASR 字幕)
 * 数据输出: 
 *   - script.narration (解说文案)
 *   - script.firstPerson (第一人称文案)
 *   - script.remix (混剪文案)
 * 流转到: VideoSynthesize
 */
import React, { useState, useCallback } from 'react';
import { 
  Card, Button, Space, Typography, List, Tag, 
  Tabs, Input, Alert, Divider, Select, Radio, message, Empty, Progress, Badge 
} from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  SoundOutlined,
  CopyOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { aiService } from '@/core/services';
import { ProcessingProgress, PreviewModal } from '@/components/common';
import type { ScriptData, ScriptSegment, ScriptMetadata, AIModel, AIModelSettings } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 核心功能类型
export type AIFunctionType = 'video-narration' | 'first-person' | 'remix';

// 功能配置
const FUNCTION_CONFIG: Record<AIFunctionType, {
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  'video-narration': {
    title: '视频解说',
    icon: <VideoCameraOutlined />,
    description: '对视频内容进行专业解说，适合教程、评测等内容',
    color: '#1890ff',
  },
  'first-person': {
    title: '第一人称',
    icon: <UserOutlined />,
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#52c41a',
  },
  'remix': {
    title: 'AI 混剪',
    icon: <EditOutlined />,
    description: '自动识别精彩片段，生成节奏感强的混剪视频',
    color: '#fa8c16',
  },
};

// 文案风格
const scriptStyles = [
  { value: 'formal', label: '正式', desc: '专业、严谨的语气' },
  { value: 'casual', label: '轻松', desc: '活泼、亲切的语气' },
  { value: 'humor', label: '幽默', desc: '搞笑、诙谐的语气' },
  { value: 'emotional', label: '情感', desc: '深情、感人的语气' },
];

// 文案长度
const scriptLengths = [
  { value: 'short', label: '短', desc: '30秒以内', wordCount: 80 },
  { value: 'medium', label: '中', desc: '1-3分钟', wordCount: 300 },
  { value: 'long', label: '长', desc: '3-10分钟', wordCount: 800 },
];

// 生成模拟文案
const generateMockScript = (
  functionType: AIFunctionType, 
  style: string, 
  length: string
): ScriptData => {
  const lengthConfig = scriptLengths.find(l => l.value === length) || scriptLengths[1];
  
  const templates: Record<AIFunctionType, { title: string; content: string }> = {
    'video-narration': {
      title: '视频解说文案',
      content: `【视频解说】

开场白：
欢迎观看本期内容！今天我们来聊聊${style === 'formal' ? '专业领域' : '大家感兴趣的话题'}。

正文部分：
首先，让我们看一下这个画面。这是本次内容的核心要点之一...
${style === 'casual' ? '哎，等等！这里有个细节值得关注...' : '值得注意的是...'}
接着往下看，第二个重点来了...

总结：
好了，以上就是本期内容的全部讲解。希望对你有所帮助！

结尾：
如果觉得有帮助，记得点赞关注哦！我们下期再见！`,
    },
    'first-person': {
      title: '第一人称解说',
      content: `【第一人称视角】

嘿，朋友们！我是XXX，今天带大家一起看看这个...

说实话，当我第一眼看到这个的时候，我的内心是崩溃的...
你们看，这个地方真的超级有意思！我当时在现场的时候...
哦对了，忘记说了，这里还有个彩蛋...

怎么样？是不是很有意思？喜欢的话一键三连支持一下！
我会继续给大家带来更多有趣的内容，拜拜~`,
    },
    'remix': {
      title: 'AI混剪文案',
      content: `【AI混剪旁白】

【开场 - 悬念营造】
就在刚才，发生了这一幕...
没有人能想到，接下来会发生什么...

【高潮1 - 精彩瞬间】
看！就是这个画面！太燃了！
这一帧，绝对是名场面...

【高潮2 - 节奏剪辑】
紧接着，剧情发生了反转！
每一秒都是精华，每一帧都不容错过...

【结尾 - 意犹未尽】
最后，让我们回顾一下这些精彩瞬间...
这就是本期混剪的全部内容，下期更精彩！`,
    },
  };

  const template = templates[functionType];
  
  const metadata: ScriptMetadata = {
    style,
    tone: style,
    length: length as 'short' | 'medium' | 'long',
    targetAudience: '通用',
    language: 'zh-CN',
    wordCount: template.content.length,
    estimatedDuration: template.content.length / 3,
    generatedBy: 'AI',
    generatedAt: new Date().toISOString(),
    template: functionType,
  };

  // 生成片段
  const segments: ScriptSegment[] = template.content.split('\n\n').map((text, i) => ({
    id: `segment_${i}`,
    startTime: i * 30,
    endTime: (i + 1) * 30,
    content: text,
    type: functionType === 'remix' ? 'action' : 'narration',
  }));

  return {
    id: `script_${Date.now()}`,
    title: template.title,
    content: template.content,
    segments,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

interface ScriptGenerateProps {
  onNext?: () => void;
}

const ScriptGenerate: React.FC<ScriptGenerateProps> = ({ onNext }) => {
  const { 
    state, 
    setNarrationScript, 
    setRemixScript,
    goToNextStep,
    dispatch,
  } = useClipFlow();

  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<AIFunctionType | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  
  // 文案配置
  const [config, setConfig] = useState({
    functionType: 'video-narration' as AIFunctionType,
    style: 'casual',
    length: 'medium',
  });

  // 处理生成文案 (对接 aiService)
  const handleGenerate = useCallback(async (functionType: AIFunctionType) => {
    setGenerating(true);
    setGeneratingType(functionType);
    setProgress(0);

    try {
      // 构建 AI 生成参数
      const scriptType = functionType === 'remix' ? '混剪' : functionType === 'first-person' ? '第一人称解说' : '视频解说';
      const topic = state.analysis?.summary 
        ? `${state.analysis.summary.slice(0, 50)}...` 
        : state.subtitleData.asr?.[0]?.text 
          ? `${state.subtitleData.asr[0].text.slice(0, 30)}...`
          : '视频内容解说';
      
      // 从上下文获取模型配置
      // TODO: 从设置中获取实际配置的模型
      const model: AIModel = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        category: ['text'],
        description: 'OpenAI GPT-4',
        features: [],
        tokenLimit: 128000,
        contextWindow: 128000,
      };
      
      const settings: AIModelSettings = {
        enabled: true,
        apiKey: '', // 从环境变量或设置中获取
        temperature: 0.7,
        maxTokens: 2000,
      };
      
      // 根据功能类型选择风格
      const styleMap: Record<AIFunctionType, string> = {
        'video-narration': config.style,
        'first-person': 'casual',
        'remix': 'humor',
      };
      
      // 模拟进度更新
      setProgress(20);
      
      try {
        // 调用 aiService 生成文案
        setProgress(40);
        const scriptData = await aiService.generateScript(
          model,
          settings,
          {
            topic,
            style: styleMap[functionType],
            tone: config.style,
            length: config.length,
            audience: '通用',
            language: 'zh-CN',
            keywords: state.analysis?.scenes?.map(s => s.type).filter(Boolean) || [],
            videoDuration: state.currentVideo?.duration,
          }
        );
        
        // 根据功能类型保存
        setProgress(80);
        if (functionType === 'video-narration' || functionType === 'first-person') {
          setNarrationScript(scriptData);
        } else {
          setRemixScript(scriptData);
        }
        
        setProgress(100);
        message.success(`${FUNCTION_CONFIG[functionType].title}文案生成成功`);
      } catch (apiError) {
        console.error('AI API 调用失败:', apiError);
        setProgress(60);
        message.warning('AI 服务暂不可用，使用默认模板生成');
        
        // 降级使用模拟数据
        const mockScript = generateMockScript(functionType, config.style, config.length);
        setProgress(80);
        
        if (functionType === 'video-narration' || functionType === 'first-person') {
          setNarrationScript(mockScript);
        } else {
          setRemixScript(mockScript);
        }
        
        setProgress(100);
        message.success(`${FUNCTION_CONFIG[functionType].title}文案生成成功（本地模板）`);
      }
    } catch (error) {
      console.error('文案生成失败:', error);
      message.error('文案生成失败');
    } finally {
      setGenerating(false);
      setGeneratingType(null);
    }
  }, [config.style, config.length, state.analysis, state.subtitleData.asr, state.currentVideo, setNarrationScript, setRemixScript]);

  // 处理编辑文案
  const handleEditScript = (newContent: string) => {
    const script = config.functionType === 'remix' 
      ? state.scriptData.remix 
      : state.scriptData.narration;
    
    if (script) {
      const updatedScript: ScriptData = {
        ...script,
        content: newContent,
        updatedAt: new Date().toISOString(),
      };
      
      if (config.functionType === 'remix') {
        setRemixScript(updatedScript);
      } else {
        setNarrationScript(updatedScript);
      }
    }
  };

  // 获取当前功能类型对应的脚本
  const getCurrentScript = (): ScriptData | null => {
    if (config.functionType === 'remix') {
      return state.scriptData.remix;
    }
    return state.scriptData.narration;
  };

  // 检查是否已有生成的内容
  const hasVideoNarration = !!state.scriptData.narration;
  const hasFirstPerson = false; // 第一人称复用 narration
  const hasRemix = !!state.scriptData.remix;

  // 检查前置条件
  const canProceed = state.stepStatus['ai-analyze'];

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>生成文案</Title>
        <Paragraph>
          选择功能模式，AI 自动生成对应风格的文案
        </Paragraph>
      </div>

      {!canProceed ? (
        <Alert
          message="请先完成 AI 分析"
          description="请先完成视频的 AI 分析，然后生成文案"
          type="warning"
          showIcon
        />
      ) : (
        <>
          {/* 三大核心功能选择 */}
          <Card title="🎯 选择核心功能" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {Object.entries(FUNCTION_CONFIG).map(([key, func]) => {
                const isActive = config.functionType === key;
                const hasContent = key === 'video-narration' ? hasVideoNarration : 
                                  key === 'first-person' ? hasFirstPerson : hasRemix;
                
                return (
                  <div
                    key={key}
                    onClick={() => setConfig({ ...config, functionType: key as AIFunctionType })}
                    style={{
                      padding: '16px 20px',
                      border: `2px solid ${isActive ? func.color : '#d9d9d9'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isActive ? `${func.color}10` : '#fff',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Space>
                      <div style={{ 
                        fontSize: 24, 
                        color: func.color,
                      }}>
                        {func.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Space>
                          <Text strong style={{ fontSize: 16 }}>{func.title}</Text>
                          {hasContent && <Badge status="success" text="已生成" />}
                        </Space>
                        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                          {func.description}
                        </Text>
                      </div>
                      {isActive && <CheckCircleOutlined style={{ color: func.color, fontSize: 20 }} />}
                    </Space>
                  </div>
                );
              })}
            </Space>
          </Card>

          {/* 文案配置 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>语气风格</Text>
                <Select
                  value={config.style}
                  onChange={(v) => setConfig({ ...config, style: v })}
                  style={{ width: 140 }}
                >
                  {scriptStyles.map(s => (
                    <Select.Option key={s.value} value={s.value}>
                      {s.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>文案长度</Text>
                <Select
                  value={config.length}
                  onChange={(v) => setConfig({ ...config, length: v })}
                  style={{ width: 140 }}
                >
                  {scriptLengths.map(l => (
                    <Select.Option key={l.value} value={l.value}>
                      {l.label} ({l.desc})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Space>
          </Card>

          {/* 文案编辑区 */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 生成按钮 */}
              <Space>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  loading={generating && generatingType === config.functionType}
                  onClick={() => handleGenerate(config.functionType)}
                  size="large"
                  style={{ 
                    background: FUNCTION_CONFIG[config.functionType].color,
                    borderColor: FUNCTION_CONFIG[config.functionType].color,
                  }}
                >
                  生成{FUNCTION_CONFIG[config.functionType].title}文案
                </Button>
                
                {getCurrentScript() && (
                  <Button 
                    icon={<SyncOutlined />}
                    loading={generating}
                    onClick={() => handleGenerate(config.functionType)}
                  >
                    重新生成
                  </Button>
                )}
              </Space>

              {/* 文案内容 */}
              {generating ? (
                <Card>
                  <ProcessingProgress
                    percent={progress}
                    statusText={`正在生成${FUNCTION_CONFIG[config.functionType].title}文案...`}
                    status="active"
                    type="circle"
                    size="large"
                    strokeColor={FUNCTION_CONFIG[config.functionType].color}
                  />
                </Card>
              ) : getCurrentScript() ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text type="secondary">
                        字数：{getCurrentScript()?.metadata.wordCount}
                      </Text>
                      <Text type="secondary">|</Text>
                      <Text type="secondary">
                        预计时长：{Math.ceil(getCurrentScript()?.metadata.estimatedDuration || 0)}秒
                      </Text>
                    </Space>
                    <Space>
                      <Button 
                        icon={<FileTextOutlined />}
                        onClick={() => setPreviewModalVisible(true)}
                      >
                        预览
                      </Button>
                      <Button 
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(getCurrentScript()?.content || '');
                          message.success('已复制到剪贴板');
                        }}
                      >
                        复制
                      </Button>
                    </Space>
                  </div>
                  
                  <TextArea
                    value={getCurrentScript()?.content}
                    onChange={(e) => handleEditScript(e.target.value)}
                    rows={15}
                    style={{ fontFamily: 'inherit', lineHeight: 1.8 }}
                    placeholder="在这里编辑文案..."
                  />
                </>
              ) : (
                <Empty 
                  description="点击上方按钮生成文案"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
              
              <Divider />
              
              {/* 下一步 */}
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    dispatch({ 
                      type: 'SET_STEP_COMPLETE', 
                      payload: { step: 'script-generate', complete: true } 
                    });
                    if (onNext) {
                      onNext();
                    } else {
                      goToNextStep();
                    }
                  }}
                  disabled={!getCurrentScript()}
                >
                  下一步：视频合成
                </Button>
              </Space>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScriptGenerate;
