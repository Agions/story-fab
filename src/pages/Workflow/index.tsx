/**
 * 解说混剪工作流页面
 * 集成视觉识别、脚本生成、视频混剪的完整流程
 */

import React, { useState, useCallback } from 'react';
import {
  Steps,
  Card,
  Button,
  Progress,
  Alert,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Radio,
  message,
  Switch,
  Divider
} from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  EditOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ScissorOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useWorkflow, useModel, useAIClip } from '@/core/hooks';
import { scriptTemplateService } from '@/core/services';
import VideoUploader from '@/components/VideoUploader';
import ModelSelector from '@/components/ModelSelector';
import ScriptEditor from '@/components/ScriptEditor';
import VideoTimeline from '@/components/VideoTimeline';
import ExportPanel from '@/components/ExportPanel';
import AIClipAssistant from '@/components/AIClipAssistant';
import type { WorkflowStep, ScriptTemplate, AIModel } from '@/core/types';

import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

// 工作流步骤配置
const WORKFLOW_STEPS: Array<{
  key: WorkflowStep | 'ai-clip';
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'upload',
    title: '上传视频',
    description: '选择要处理的视频文件',
    icon: <UploadOutlined />
  },
  {
    key: 'analyze',
    title: '视频分析',
    description: 'AI 智能分析视频内容',
    icon: <EyeOutlined />
  },
  {
    key: 'template-select',
    title: '选择模板',
    description: '选择解说脚本模板',
    icon: <FileTextOutlined />
  },
  {
    key: 'script-generate',
    title: '生成脚本',
    description: 'AI 自动生成解说词',
    icon: <FileTextOutlined />
  },
  {
    key: 'script-dedup',
    title: '原创性检测',
    description: '检测并优化重复内容',
    icon: <FileTextOutlined />
  },
  {
    key: 'script-edit',
    title: '编辑脚本',
    description: '修改和完善解说词',
    icon: <EditOutlined />
  },
  {
    key: 'ai-clip',
    title: 'AI 剪辑',
    description: '智能剪辑点检测与优化',
    icon: <ScissorOutlined />
  },
  {
    key: 'timeline-edit',
    title: '时间轴',
    description: '调整视频和音频',
    icon: <VideoCameraOutlined />
  },
  {
    key: 'preview',
    title: '预览',
    description: '预览最终效果',
    icon: <PlayCircleOutlined />
  },
  {
    key: 'export',
    title: '导出',
    description: '导出最终视频',
    icon: <DownloadOutlined />
  }
];

export const WorkflowPage: React.FC = () => {
  // 工作流状态
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    state,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error,
    currentStep,
    progress,
    data,
    start,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    analyze,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectTemplate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateScript,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dedupScript,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ensureUniqueness,
    editScript,
    editTimeline,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    preview,
    export: exportVideo,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep
  } = useWorkflow({
    onStepChange: (step) => {
      message.info(`进入步骤: ${WORKFLOW_STEPS.find(s => s.key === step)?.title}`);
    },
    onError: (err) => {
      message.error(err);
    },
    onComplete: () => {
      message.success('工作流完成！');
    }
  });

  // AI 剪辑 Hook - 保留用于未来扩展
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    isAnalyzing: _isClipAnalyzing,
    result: _clipResult,
    analyze: _analyzeClip,
    smartClip: _smartClip
  } = useAIClip();

  // 本地状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [scriptParams, setScriptParams] = useState({
    style: 'professional',
    tone: 'friendly',
    length: 'medium' as const,
    targetAudience: 'general',
    language: 'zh' as const
  });

  // AI 剪辑配置
  const [aiClipConfig, setAiClipConfig] = useState({
    enabled: true,
    autoClip: false,
    detectSceneChange: true,
    detectSilence: true,
    removeSilence: true,
    targetDuration: undefined as number | undefined,
    pacingStyle: 'normal' as 'fast' | 'normal' | 'slow'
  });

  // 模型列表
  const { allModels: models } = useModel();

  // 模板列表
  const templates = scriptTemplateService.getAllTemplates();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const categories = scriptTemplateService.getCategories();

  // 获取当前步骤索引
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);

  // 开始工作流
  const handleStart = useCallback(async () => {
    if (!selectedFile || !selectedModel) {
      message.error('请选择视频文件和 AI 模型');
      return;
    }

    try {
      await start('project_' + Date.now(), selectedFile, {
        autoAnalyze: true,
        autoGenerateScript: true,
        preferredTemplate: selectedTemplate?.id,
        model: selectedModel,
        scriptParams,
        aiClipConfig: aiClipConfig.enabled ? aiClipConfig : undefined
      });
    } catch (err) {
      // 错误已在回调中处理
    }
  }, [selectedFile, selectedModel, selectedTemplate, scriptParams, aiClipConfig, start]);

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <Card title="上传视频" className={styles.stepCard}>
            <VideoUploader
              onUpload={(video: import('@/core/types').VideoInfo) => {
                // VideoInfo 转换为 File 类型（这里使用视频路径作为 File 的模拟）
                // 实际使用时可能需要调整
                setSelectedFile(video as unknown as File);
              }}
              accept="video/*"
              maxSize={1024 * 1024 * 1024} // 1GB
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
                        onChange={v => setAiClipConfig(c => ({ ...c, enabled: v }))}
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
                        onChange={v => setAiClipConfig(c => ({ ...c, autoClip: v }))}
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
                        onChange={v => setAiClipConfig(c => ({ ...c, detectSceneChange: v }))}
                        size="small"
                      />
                      <Text>场景检测</Text>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Switch
                        checked={aiClipConfig.detectSilence}
                        onChange={v => setAiClipConfig(c => ({ ...c, detectSilence: v }))}
                        size="small"
                      />
                      <Text>静音检测</Text>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Switch
                        checked={aiClipConfig.removeSilence}
                        onChange={v => setAiClipConfig(c => ({ ...c, removeSilence: v }))}
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
                      onChange={e => setAiClipConfig(c => ({ ...c, pacingStyle: e.target.value }))}
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
                      onChange={v => setAiClipConfig(c => ({ ...c, targetDuration: v === 'original' ? undefined : Number(v) }))}
                      style={{ width: '100%', marginTop: 8 }}
                      size="small"
                    >
                      <Select.Option value="original">保持原时长</Select.Option>
                      <Select.Option value={30}>30秒</Select.Option>
                      <Select.Option value={60}>1分钟</Select.Option>
                      <Select.Option value={120}>2分钟</Select.Option>
                      <Select.Option value={180}>3分钟</Select.Option>
                    </Select>
                  </Col>
                </Row>
              </Card>
            )}
          </Card>
        );

      case 'analyze':
        return (
          <Card title="视频分析" className={styles.stepCard}>
            {data.videoAnalysis ? (
              <div className={styles.analysisResult}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card size="small" title="场景检测">
                      <Text strong>{data.videoAnalysis.scenes.length}</Text>
                      <Text> 个场景</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="物体识别">
                      <Text strong>{data.videoAnalysis.objects?.length || 0}</Text>
                      <Text> 个物体</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="情感分析">
                      <Text strong>{data.videoAnalysis.emotions?.length || 0}</Text>
                      <Text> 个片段</Text>
                    </Card>
                  </Col>
                </Row>
                <div className={styles.analysisSummary}>
                  <Title level={5}>分析摘要</Title>
                  <Paragraph>{data.videoAnalysis.summary}</Paragraph>
                </div>
              </div>
            ) : (
              <div className={styles.loadingArea}>
                <Progress percent={progress} status="active" />
                <Text>正在分析视频内容...</Text>
              </div>
            )}
          </Card>
        );

      case 'template-select':
        return (
          <Card title="选择解说模板" className={styles.stepCard}>
            <Row gutter={[16, 16]}>
              {templates.map(template => (
                <Col span={8} key={template.id}>
                  <Card
                    hoverable
                    className={`${styles.templateCard} ${
                      selectedTemplate?.id === template.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                    title={template.name}
                  >
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {template.description}
                    </Paragraph>
                    <Space wrap>
                      {template.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </Space>
                    {template.recommended && (
                      <div className={styles.recommendedBadge}>推荐</div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        );

      case 'script-generate':
        return (
          <Card title="生成脚本" className={styles.stepCard}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <ModelSelector
                onSelect={(modelId: string) => {
                  const model = models.find((m: AIModel) => m.id === modelId);
                  setSelectedModel(model || null);
                }}
                taskType="script"
              />

              <Card size="small" title="脚本参数">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className={styles.paramItem}>
                      <Text>风格</Text>
                      <Select
                        value={scriptParams.style}
                        onChange={v => setScriptParams(p => ({ ...p, style: v }))}
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
                        onChange={v => setScriptParams(p => ({ ...p, tone: v }))}
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
                        onChange={e => setScriptParams(p => ({ ...p, length: e.target.value }))}
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
                        onChange={e => setScriptParams(p => ({ ...p, language: e.target.value }))}
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

      case 'script-dedup':
        return (
          <Card title="原创性检测" className={styles.stepCard}>
            {data.originalityReport ? (
              <div className={styles.dedupResult}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card size="small" title="原创性分数">
                      <div className={styles.scoreDisplay}>
                        <Text className={
                          data.originalityReport.score >= 80 ? styles.scoreHigh :
                          data.originalityReport.score >= 60 ? styles.scoreMedium :
                          styles.scoreLow
                        }>
                          {data.originalityReport.score}分
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="重复段落">
                      <Text strong>{data.originalityReport.duplicates.length}</Text>
                      <Text> 处</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="建议">
                      <Text strong>{data.originalityReport.suggestions.length}</Text>
                      <Text> 条</Text>
                    </Card>
                  </Col>
                </Row>

                {data.originalityReport.duplicates.length > 0 && (
                  <div className={styles.duplicateList}>
                    <Title level={5}>重复内容</Title>
                    {data.originalityReport.duplicates.map((dup, index) => (
                      <Alert
                        key={dup.id}
                        message={`重复 #${index + 1} - ${dup.type === 'exact' ? '完全重复' : dup.type === 'similar' ? '相似内容' : '模板套话'}`}
                        description={
                          <div>
                            <Paragraph ellipsis={{ rows: 2 }}>
                              <Text type="secondary">原文：</Text>
                              {dup.target.content}
                            </Paragraph>
                            <Text type="warning">{dup.suggestion}</Text>
                          </div>
                        }
                        type={dup.type === 'exact' ? 'error' : dup.type === 'similar' ? 'warning' : 'info'}
                        showIcon
                        className={styles.duplicateAlert}
                      />
                    ))}
                  </div>
                )}

                {data.originalityReport.suggestions.length > 0 && (
                  <div className={styles.suggestionList}>
                    <Title level={5}>优化建议</Title>
                    <ul>
                      {data.originalityReport.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 唯一性报告 */}
                {data.uniquenessReport && (
                  <div className={styles.uniquenessReport}>
                    <Title level={5}>唯一性检测</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card size="small">
                          <div className={styles.uniquenessStatus}>
                            <Text>唯一性状态：</Text>
                            <Text strong className={
                              data.uniquenessReport.check.isUnique ? styles.unique : styles.notUnique
                            }>
                              {data.uniquenessReport.check.isUnique ? '✅ 唯一' : '⚠️ 需优化'}
                            </Text>
                          </div>
                          <div className={styles.similarityScore}>
                            <Text>历史相似度：</Text>
                            <Text strong>{(data.uniquenessReport.check.similarity * 100).toFixed(1)}%</Text>
                          </div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" title="历史记录">
                          <div>
                            <Text>总脚本数：</Text>
                            <Text strong>{data.uniquenessReport.history.totalScripts}</Text>
                          </div>
                          <div>
                            <Text>近7天：</Text>
                            <Text strong>{data.uniquenessReport.history.recentScripts}</Text>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    {data.uniquenessReport.check.suggestions.length > 0 && (
                      <Alert
                        message="唯一性建议"
                        description={
                          <ul>
                            {data.uniquenessReport.check.suggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        }
                        type={data.uniquenessReport.check.isUnique ? 'success' : 'warning'}
                        showIcon
                        className={styles.uniquenessAlert}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.loadingArea}>
                <Progress percent={progress} status="active" />
                <Text>正在检测原创性...</Text>
              </div>
            )}
          </Card>
        );

      case 'script-edit':
        return (
          <Card title="编辑脚本" className={styles.stepCard}>
            {data.uniqueScript && (
              <ScriptEditor
                script={data.uniqueScript}
                onSave={editScript}
                scenes={data.videoAnalysis?.scenes}
              />
            )}
          </Card>
        );

      case 'ai-clip':
        return (
          <Card title="AI 智能剪辑" className={styles.stepCard}>
            {data.videoInfo ? (
              <AIClipAssistant
                videoInfo={data.videoInfo}
                onAnalysisComplete={(result) => {
                  console.log('AI 剪辑分析完成:', result);
                }}
                onApplySuggestions={(segments) => {
                  console.log('应用剪辑建议:', segments);
                }}
              />
            ) : (
              <Alert message="请先上传视频" type="warning" />
            )}
          </Card>
        );

      case 'timeline-edit':
        return (
          <Card title="时间轴编辑" className={styles.stepCard}>
            {data.timeline && data.videoInfo && (
              <VideoTimeline
                timeline={data.timeline}
                videoInfo={data.videoInfo}
                script={data.editedScript || data.generatedScript}
                onSave={() => editTimeline(true)}
              />
            )}
          </Card>
        );

      case 'preview':
        return (
          <Card title="预览" className={styles.stepCard}>
            <div className={styles.previewArea}>
              <video
                controls
                className={styles.previewVideo}
                poster={data.videoInfo?.thumbnail}
              >
                <source src={data.videoInfo?.path} />
              </video>
              <div className={styles.previewInfo}>
                <Title level={5}>{data.generatedScript?.title}</Title>
                <Paragraph>
                  预计时长: {Math.round(data.videoInfo?.duration || 0)}秒
                </Paragraph>
              </div>
            </div>
          </Card>
        );

      case 'export':
        return (
          <Card title="导出视频" className={styles.stepCard}>
            <ExportPanel onExport={exportVideo} />
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.workflowPage}>
      <Title level={2}>解说混剪工作流</Title>
      <Paragraph type="secondary">
        一站式视频解说创作工具，从视频分析到最终导出
      </Paragraph>

      {/* 步骤条 */}
      <Card className={styles.stepsCard}>
        <Steps
          current={currentStepIndex}
          direction="horizontal"
          size="small"
        >
          {WORKFLOW_STEPS.map(step => (
            <Step
              key={step.key}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>
      </Card>

      {/* 错误提示 */}
      {hasError && (
        <Alert
          message="工作流出错"
          description={error}
          type="error"
          showIcon
          closable
          className={styles.errorAlert}
        />
      )}

      {/* 进度条 */}
      {isRunning && (
        <Card className={styles.progressCard}>
          <Progress
            percent={Math.round(progress)}
            status={hasError ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068'
            }}
          />
          <Text type="secondary">
            当前步骤: {WORKFLOW_STEPS.find(s => s.key === currentStep)?.title}
          </Text>
        </Card>
      )}

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 操作按钮 */}
      <Card className={styles.actionCard}>
        <Space>
          {currentStep === 'upload' && (
            <Button
              type="primary"
              size="large"
              onClick={handleStart}
              disabled={!selectedFile || !selectedModel}
            >
              开始创作
            </Button>
          )}

          {isRunning && (
            <>
              <Button
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={isPaused ? resume : pause}
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button danger onClick={cancel}>
                取消
              </Button>
            </>
          )}

          {isCompleted && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={reset}
            >
              开始新项目
            </Button>
          )}

          {/* 步骤导航 */}
          {currentStepIndex > 0 && currentStepIndex < WORKFLOW_STEPS.length - 1 && !isRunning && (
            <>
              <Button onClick={() => jumpToStep(WORKFLOW_STEPS[currentStepIndex - 1].key)}>
                上一步
              </Button>
              <Button
                type="primary"
                onClick={() => jumpToStep(WORKFLOW_STEPS[currentStepIndex + 1].key)}
              >
                下一步
              </Button>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default WorkflowPage;
