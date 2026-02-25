/**
 * 步骤4: 生成文案 - 优化版
 * 
 * 三大核心功能：
 * 1. AI 视频解说 - 对视频内容进行专业解说
 * 2. AI 第一人称解说 - 以第一人称视角讲述
 * 3. AI 混剪 - 自动识别精彩片段并添加旁白
 */
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, Button, Space, Typography, Input, Alert, Divider, Select, message, Empty, Badge, Tabs, Tooltip, Progress, Tag, Row, Col
} from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  CopyOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  ScissorOutlined,
  StarOutlined,
  SettingOutlined,
  FullscreenOutlined,
  SaveOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { aiService } from '@/core/services';
import type { ScriptData, ScriptSegment, ScriptMetadata, AIModel, AIModelSettings } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 核心功能类型
export type AIFunctionType = 'video-narration' | 'first-person' | 'remix';

// 功能配置 - 优化版
const FUNCTION_CONFIG: Record<AIFunctionType, {
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  features: string[];
  example: string;
}> = {
  'video-narration': {
    title: 'AI 视频解说',
    icon: <VideoCameraOutlined />,
    description: '对视频内容进行专业解说，适合教程、评测、科普类内容',
    color: '#1890ff',
    features: ['智能总结要点', '专业术语解释', '逻辑连贯', '多种语气可选'],
    example: '欢迎观看本期内容！今天我们来聊聊...',
  },
  'first-person': {
    title: 'AI 第一人称',
    icon: <UserOutlined />,
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#52c41a',
    features: ['真实互动感', '情感充沛', '口语化表达', '粉丝粘性高'],
    example: '嘿，朋友们！我是XXX，今天带大家一起...',
  },
  'remix': {
    title: 'AI 混剪',
    icon: <ScissorOutlined />,
    description: '自动识别精彩片段，生成节奏感强的混剪视频',
    color: '#fa8c16',
    features: ['智能片段选取', '节奏感强', '高潮迭起', '自动配音'],
    example: '【开场】就在刚才，发生了这一幕...',
  },
};

// 文案风格配置
const scriptStyles = [
  { value: 'formal', label: '正式', desc: '专业、严谨', icon: '👔' },
  { value: 'casual', label: '轻松', desc: '活泼、亲切', icon: '😊' },
  { value: 'humor', label: '幽默', desc: '搞笑、诙谐', icon: '😄' },
  { value: 'emotional', label: '情感', desc: '深情、感人', icon: '💝' },
];

// 文案长度配置
const scriptLengths = [
  { value: 'short', label: '短视频', desc: '30秒以内', wordCount: 80, time: '~30s' },
  { value: 'medium', label: '中视频', desc: '1-3分钟', wordCount: 300, time: '1-3min' },
  { value: 'long', label: '长视频', desc: '3-10分钟', wordCount: 800, time: '3-10min' },
];

// 生成模拟文案
const generateMockScript = (
  functionType: AIFunctionType, 
  style: string, 
  length: string
): ScriptData => {
  const templates: Record<AIFunctionType, { title: string; content: string }> = {
    'video-narration': {
      title: 'AI 视频解说文案',
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

说实话，当我第一眼看到这个的时候，我的内心是...
你们看，这个地方真的超级有意思！我当时在现场的时候...
哦对了，忘记说了，这里还有个彩蛋...

怎么样？是不是很有意思？喜欢的话一键三连支持一下！
我会继续给大家带来更多有趣的内容，拜拜~`,
    },
    'remix': {
      title: 'AI混剪旁白',
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
  const lengthConfig = scriptLengths.find(l => l.value === length);
  
  const metadata: ScriptMetadata = {
    style,
    tone: style,
    length: length as 'short' | 'medium' | 'long',
    targetAudience: '通用',
    language: 'zh-CN',
    wordCount: lengthConfig?.wordCount || 300,
    estimatedDuration: lengthConfig?.wordCount ? lengthConfig.wordCount / 3 : 100,
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
  const [activeTab, setActiveTab] = useState('config');
  
  // 文案配置
  const [config, setConfig] = useState({
    functionType: 'video-narration' as AIFunctionType,
    style: 'casual',
    length: 'medium',
  });

  // 获取当前功能配置
  const currentFunction = FUNCTION_CONFIG[config.functionType];

  // 处理生成文案
  const handleGenerate = useCallback(async (functionType: AIFunctionType) => {
    setGenerating(true);
    setGeneratingType(functionType);
    setProgress(0);

    try {
      const topic = state.analysis?.summary || '视频内容解说';
      
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
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000,
      };
      
      const styleMap: Record<AIFunctionType, string> = {
        'video-narration': config.style,
        'first-person': 'casual',
        'remix': 'humor',
      };
      
      // 模拟进度
      setProgress(10);
      
      try {
        setProgress(30);
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
        
        setProgress(80);
        if (functionType === 'video-narration' || functionType === 'first-person') {
          setNarrationScript(scriptData);
        } else {
          setRemixScript(scriptData);
        }
        
        setProgress(100);
        message.success(`${FUNCTION_CONFIG[functionType].title}生成成功！`);
      } catch (apiError) {
        console.error('AI API 调用失败:', apiError);
        setProgress(50);
        message.warning('AI 服务暂不可用，使用智能模板生成');
        
        const mockScript = generateMockScript(functionType, config.style, config.length);
        setProgress(80);
        
        if (functionType === 'video-narration' || functionType === 'first-person') {
          setNarrationScript(mockScript);
        } else {
          setRemixScript(mockScript);
        }
        
        setProgress(100);
        message.success('文案生成成功（智能模板）');
      }
    } catch (error) {
      console.error('文案生成失败:', error);
      message.error('文案生成失败，请重试');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGeneratingType(null);
        setProgress(0);
      }, 500);
    }
  }, [config.style, config.length, state.analysis, state.subtitleData.asr, state.currentVideo, setNarrationScript, setRemixScript]);

  // 处理编辑文案
  const handleEditScript = (newContent: string) => {
    const script = config.functionType === 'remix' ? state.scriptData.remix : state.scriptData.narration;
    
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
      message.success('文案已保存');
    }
  };

  // 获取当前脚本
  const getCurrentScript = (): ScriptData | null => {
    if (config.functionType === 'remix') {
      return state.scriptData.remix;
    }
    return state.scriptData.narration;
  };

  const currentScript = getCurrentScript();
  const canProceed = state.stepStatus['ai-analyze'];

  // 复制文案
  const handleCopy = () => {
    if (currentScript?.content) {
      navigator.clipboard.writeText(currentScript.content);
      message.success('文案已复制到剪贴板');
    }
  };

  return (
    <div className={styles.stepContent}>
      {/* 头部 */}
      <div className={styles.stepTitle}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>📝 生成文案</Title>
          <Tag color={currentFunction.color}>{currentFunction.title}</Tag>
        </Space>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
          选择功能模式，AI 自动生成对应风格的文案
        </Paragraph>
      </div>

      {!canProceed ? (
        <Alert
          message="⚠️ 请先完成 AI 分析"
          description="请先完成视频的 AI 分析步骤，然后生成文案"
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => dispatch({ type: 'SET_STEP', payload: 'ai-analyze' })}>
              去分析
            </Button>
          }
        />
      ) : (
        <Row gutter={24}>
          {/* 左侧：功能选择和配置 */}
          <Col xs={24} lg={10}>
            <Card 
              title={<><SettingOutlined /> 功能配置</>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 三大核心功能选择 */}
                {(Object.entries(FUNCTION_CONFIG) as [AIFunctionType, typeof FUNCTION_CONFIG[AIFunctionType]][]).map(([key, func]) => {
                  const isActive = config.functionType === key;
                  const hasContent = key === 'video-narration' ? !!state.scriptData.narration : 
                                    key === 'first-person' ? false : !!state.scriptData.remix;
                  
                  return (
                    <div
                      key={key}
                      onClick={() => setConfig({ ...config, functionType: key })}
                      style={{
                        padding: '14px 16px',
                        border: `2px solid ${isActive ? func.color : '#e8e8e8'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isActive ? `${func.color}08` : '#fff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Space>
                        <div style={{ fontSize: 22, color: func.color }}>
                          {func.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Space>
                            <Text strong>{func.title}</Text>
                            {hasContent && <Badge status="success" text="已生成" />}
                          </Space>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                            {func.description}
                          </Text>
                        </div>
                        {isActive && <CheckCircleOutlined style={{ color: func.color, fontSize: 18 }} />}
                      </Space>
                    </div>
                  );
                })}
              </Space>
            </Card>

            {/* 配置选项 */}
            <Card size="small" title={<><SettingOutlined /> 文案设置</>}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>语气风格</Text>
                  <Select
                    value={config.style}
                    onChange={(v) => setConfig({ ...config, style: v })}
                    style={{ width: '100%' }}
                  >
                    {scriptStyles.map(s => (
                      <Select.Option key={s.value} value={s.value}>
                        <Space>{s.icon} {s.label} <Text type="secondary" style={{ fontSize: 12 }}>({s.desc})</Text></Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>文案长度</Text>
                  <Select
                    value={config.length}
                    onChange={(v) => setConfig({ ...config, length: v })}
                    style={{ width: '100%' }}
                  >
                    {scriptLengths.map(l => (
                      <Select.Option key={l.value} value={l.value}>
                        <Space>{l.label} <Text type="secondary" style={{ fontSize: 12 }}>({l.time})</Text></Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              {/* 功能特点展示 */}
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>功能特点</Text>
                <Space wrap>
                  {currentFunction.features.map((f, i) => (
                    <Tag key={i} color={currentFunction.color} style={{ marginBottom: 4 }}>✓ {f}</Tag>
                  ))}
                </Space>
              </div>

              {/* 示例 */}
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>文案示例</Text>
                <div style={{ 
                  padding: 12, 
                  background: '#f5f5f5', 
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  "{currentFunction.example}..."
                </div>
              </div>
            </Card>
          </Col>

          {/* 右侧：文案编辑和预览 */}
          <Col xs={24} lg={14}>
            <Card
              title={<Space><FileTextOutlined /> 文案编辑</>}
              extra={
                <Space>
                  <Tooltip title="复制文案">
                    <Button icon={<CopyOutlined />} size="small" onClick={handleCopy} disabled={!currentScript}>
                      复制
                    </Button>
                  </Tooltip>
                  <Tooltip title="预览效果">
                    <Button icon={<FullscreenOutlined />} size="small">
                      预览
                    </Button>
                  </Tooltip>
                </Space>
              }
            >
              {/* 生成按钮区域 */}
              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  <Button 
                    type="primary"
                    icon={<SyncOutlined spin={generating} />}
                    loading={generating}
                    onClick={() => handleGenerate(config.functionType)}
                    size="large"
                    style={{ 
                      background: currentFunction.color,
                      borderColor: currentFunction.color,
                    }}
                  >
                    {currentScript ? '重新生成' : `生成${currentFunction.title}`}
                  </Button>
                  
                  {currentScript && (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      已生成 {currentScript.metadata?.wordCount || 0} 字
                    </Tag>
                  )}
                </Space>

                {/* 进度条 */}
                {generating && (
                  <div style={{ marginTop: 12 }}>
                    <Progress percent={progress} status="active" strokeColor={currentFunction.color} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      正在生成{currentFunction.title}...
                    </Text>
                  </div>
                )}
              </div>

              {/* 文案编辑区 */}
              <TextArea
                value={currentScript?.content || ''}
                onChange={(e) => handleEditScript(e.target.value)}
                placeholder={`点击上方"生成${currentFunction.title}"按钮，AI 将自动生成文案...\n\n或者在此手动编辑文案内容`}
                rows={12}
                style={{ 
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
                disabled={!currentScript && !generating}
              />

              {/* 统计信息 */}
              {currentScript && (
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <Text type="secondary">
                    <HistoryOutlined /> 字数: {currentScript.content?.length || 0}
                  </Text>
                  <Text type="secondary">
                    <PlayCircleOutlined /> 预计时长: ~{Math.ceil((currentScript.content?.length || 0) / 3)}秒
                  </Text>
                  <Text type="secondary">
                    <StarOutlined /> 风格: {currentScript.metadata?.style || config.style}
                  </Text>
                </div>
              )}

              {/* 空状态 */}
              {!currentScript && !generating && (
                <Empty 
                  description="点击上方按钮生成文案" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: 32 }}
                />
              )}
            </Card>

            {/* 三个功能总览 */}
            <Card 
              size="small" 
              title="三大核心功能"
              style={{ marginTop: 16 }}
              styles={{ body: { padding: '12px' } }}
            >
              <Row gutter={8}>
                {(Object.entries(FUNCTION_CONFIG) as [AIFunctionType, typeof FUNCTION_CONFIG[AIFunctionType]][]).map(([key, func]) => {
                  const hasContent = key === 'video-narration' ? !!state.scriptData.narration : 
                                    key === 'first-person' ? false : !!state.scriptData.remix;
                  return (
                    <Col span={8} key={key}>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '8px',
                        borderRadius: 8,
                        background: config.functionType === key ? `${func.color}15` : 'transparent',
                      }}>
                        <div style={{ fontSize: 20, color: func.color }}>{func.icon}</div>
                        <Text strong style={{ fontSize: 12 }}>{func.title}</Text>
                        {hasContent && <Badge status="success" />}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ScriptGenerate;
