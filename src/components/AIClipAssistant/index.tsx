/**
 * AI 剪辑助手组件
 * 提供智能剪辑点检测、自动剪辑建议、批量处理界面
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Steps,
  Progress,
  Alert,
  Space,
  Typography,
  Row,
  Col,
  Slider,
  Switch,
  Select,
  Radio,
  Tabs,
  List,
  Tag,
  Tooltip,
  Badge,
  Divider,
  Empty,
  Spin,
  message,
  Collapse
} from 'antd';
import {
  ScissorOutlined,
  RobotOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
  ExperimentOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import {
  aiClipService,
  type CutPoint,
  type ClipSuggestion,
  type ClipSegment,
  type AIClipConfig,
  type ClipAnalysisResult
} from '@/core/services/aiClip.service';
import type { VideoInfo } from '@/core/types';

import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

interface AIClipAssistantProps {
  videoInfo: VideoInfo;
  onAnalysisComplete?: (result: ClipAnalysisResult) => void;
  onApplySuggestions?: (segments: ClipSegment[]) => void;
}

// 剪辑步骤
const CLIP_STEPS = [
  { title: '配置', icon: <SettingOutlined /> },
  { title: '分析', icon: <EyeOutlined /> },
  { title: '建议', icon: <RobotOutlined /> },
  { title: '预览', icon: <PlayCircleOutlined /> }
];

export const AIClipAssistant: React.FC<AIClipAssistantProps> = ({
  videoInfo,
  onAnalysisComplete,
  onApplySuggestions
}) => {
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(0);

  // 分析状态
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ClipAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 配置
  const [config, setConfig] = useState<AIClipConfig>({
    detectSceneChange: true,
    detectSilence: true,
    detectKeyframes: true,
    detectEmotion: true,
    sceneThreshold: 0.3,
    silenceThreshold: -40,
    minSilenceDuration: 0.5,
    keyframeInterval: 5,
    removeSilence: true,
    trimDeadTime: true,
    autoTransition: true,
    transitionType: 'fade',
    aiOptimize: true,
    targetDuration: undefined,
    pacingStyle: 'normal'
  });

  // 选中的建议
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  // 预览状态
  const [previewSegments, setPreviewSegments] = useState<ClipSegment[]>([]);

  // 开始分析
  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const result = await aiClipService.analyzeVideo(videoInfo, config);

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisResult(result);

      // 自动选中高置信度的建议
      const autoSelected = new Set(
        result.suggestions
          .filter(s => s.autoApplicable && s.confidence > 0.8)
          .map(s => s.id)
      );
      setSelectedSuggestions(autoSelected);

      onAnalysisComplete?.(result);

      message.success('视频分析完成！');
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
      message.error('视频分析失败');
    } finally {
      setAnalyzing(false);
    }
  }, [videoInfo, config, onAnalysisComplete]);

  // 一键智能剪辑
  const handleSmartClip = useCallback(async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await aiClipService.smartClip(
        videoInfo,
        config.targetDuration,
        config.pacingStyle
      );

      setAnalysisResult(result);
      setPreviewSegments(result.segments);
      onAnalysisComplete?.(result);

      message.success('智能剪辑完成！');
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : '剪辑失败');
      message.error('智能剪辑失败');
    } finally {
      setAnalyzing(false);
    }
  }, [videoInfo, config, onAnalysisComplete]);

  // 应用选中的建议
  const handleApplySuggestions = useCallback(async () => {
    if (!analysisResult) return;

    const selectedIds = Array.from(selectedSuggestions);
    const segments = await aiClipService.applySuggestions(
      videoInfo,
      analysisResult.suggestions,
      selectedIds
    );

    setPreviewSegments(segments);
    onApplySuggestions?.(segments);

    message.success(`已应用 ${selectedIds.length} 条建议`);
    setCurrentStep(3);
  }, [analysisResult, selectedSuggestions, videoInfo, onApplySuggestions]);

  // 切换建议选中状态
  const toggleSuggestion = useCallback((id: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 渲染配置步骤
  const renderConfigStep = () => (
    <Card className={styles.configCard}>
      <Title level={5}>剪辑检测配置</Title>
      <Row gutter={[24, 16]}>
        <Col span={8}>
          <div className={styles.configItem}>
            <Space>
              <Switch
                checked={config.detectSceneChange}
                onChange={v => setConfig(c => ({ ...c, detectSceneChange: v }))}
              />
              <Text>场景切换检测</Text>
            </Space>
            <Paragraph type="secondary" className={styles.configDesc}>
              自动识别视频中的场景变化
            </Paragraph>
          </div>
        </Col>
        <Col span={8}>
          <div className={styles.configItem}>
            <Space>
              <Switch
                checked={config.detectSilence}
                onChange={v => setConfig(c => ({ ...c, detectSilence: v }))}
              />
              <Text>静音检测</Text>
            </Space>
            <Paragraph type="secondary" className={styles.configDesc}>
              识别并标记静音片段
            </Paragraph>
          </div>
        </Col>
        <Col span={8}>
          <div className={styles.configItem}>
            <Space>
              <Switch
                checked={config.detectKeyframes}
                onChange={v => setConfig(c => ({ ...c, detectKeyframes: v }))}
              />
              <Text>关键帧检测</Text>
            </Space>
            <Paragraph type="secondary" className={styles.configDesc}>
              提取重要的视觉关键帧
            </Paragraph>
          </div>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>剪辑优化配置</Title>
      <Row gutter={[24, 16]}>
        <Col span={12}>
          <div className={styles.configItem}>
            <Text>剪辑风格</Text>
            <Radio.Group
              value={config.pacingStyle}
              onChange={e => setConfig(c => ({ ...c, pacingStyle: e.target.value }))}
              className={styles.radioGroup}
            >
              <Radio.Button value="fast">
                <ThunderboltOutlined /> 快速
              </Radio.Button>
              <Radio.Button value="normal">
                <ClockCircleOutlined /> 标准
              </Radio.Button>
              <Radio.Button value="slow">
                <VideoCameraOutlined /> 舒缓
              </Radio.Button>
            </Radio.Group>
          </div>
        </Col>
        <Col span={12}>
          <div className={styles.configItem}>
            <Text>转场效果</Text>
            <Select
              value={config.transitionType}
              onChange={v => setConfig(c => ({ ...c, transitionType: v }))}
              style={{ width: '100%' }}
            >
              <Option value="fade">淡入淡出</Option>
              <Option value="cut">直接切换</Option>
              <Option value="dissolve">溶解</Option>
              <Option value="slide">滑动</Option>
            </Select>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <div className={styles.configItem}>
            <Space>
              <Switch
                checked={config.removeSilence}
                onChange={v => setConfig(c => ({ ...c, removeSilence: v }))}
              />
              <Text>自动移除静音</Text>
            </Space>
          </div>
        </Col>
        <Col span={12}>
          <div className={styles.configItem}>
            <Space>
              <Switch
                checked={config.autoTransition}
                onChange={v => setConfig(c => ({ ...c, autoTransition: v }))}
              />
              <Text>自动添加转场</Text>
            </Space>
          </div>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>目标时长（可选）</Title>
      <Row>
        <Col span={24}>
          <div className={styles.configItem}>
            <Slider
              min={10}
              max={Math.min(300, videoInfo.duration)}
              value={config.targetDuration || videoInfo.duration}
              onChange={v => setConfig(c => ({ ...c, targetDuration: v }))}
              marks={{
                30: '30s',
                60: '1min',
                120: '2min',
                180: '3min'
              }}
            />
            <Text type="secondary">
              当前视频时长: {Math.round(videoInfo.duration)}秒
              {config.targetDuration && ` → 目标: ${config.targetDuration}秒`}
            </Text>
          </div>
        </Col>
      </Row>

      <div className={styles.actionButtons}>
        <Space>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleAnalyze}
            loading={analyzing}
            size="large"
          >
            开始分析
          </Button>
          <Button
            icon={<ExperimentOutlined />}
            onClick={handleSmartClip}
            loading={analyzing}
            size="large"
          >
            一键智能剪辑
          </Button>
        </Space>
      </div>
    </Card>
  );

  // 渲染分析步骤
  const renderAnalyzeStep = () => (
    <Card className={styles.analyzeCard}>
      {analyzing ? (
        <div className={styles.analyzingState}>
          <Spin size="large" />
          <Title level={5}>正在分析视频...</Title>
          <Progress percent={Math.round(analysisProgress)} status="active" />
          <Text type="secondary">
            {analysisProgress < 30 && '正在检测场景切换...'}
            {analysisProgress >= 30 && analysisProgress < 60 && '正在分析音频和静音片段...'}
            {analysisProgress >= 60 && analysisProgress < 90 && '正在提取关键帧...'}
            {analysisProgress >= 90 && '正在生成剪辑建议...'}
          </Text>
        </div>
      ) : analysisResult ? (
        <div className={styles.analysisResult}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card size="small" className={styles.statCard}>
                <div className={styles.statValue}>{analysisResult.cutPoints.length}</div>
                <div className={styles.statLabel}>检测到剪辑点</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className={styles.statCard}>
                <div className={styles.statValue}>{analysisResult.silenceSegments.length}</div>
                <div className={styles.statLabel}>静音片段</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className={styles.statCard}>
                <div className={styles.statValue}>{analysisResult.keyframeTimestamps.length}</div>
                <div className={styles.statLabel}>关键帧</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className={styles.statCard}>
                <div className={styles.statValue}>
                  {Math.round(analysisResult.estimatedFinalDuration)}s
                </div>
                <div className={styles.statLabel}>预估最终时长</div>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>剪辑点分布</Title>
          <div className={styles.timelineVisualization}>
            <div className={styles.timelineBar}>
              {analysisResult.cutPoints.map(cp => (
                <Tooltip
                  key={cp.id}
                  title={`${cp.description} (${cp.confidence > 0.8 ? '高' : cp.confidence > 0.5 ? '中' : '低'}置信度)`}
                >
                  <div
                    className={`${styles.cutPoint} ${styles[cp.type]}`}
                    style={{
                      left: `${(cp.timestamp / analysisResult.duration) * 100}%`
                    }}
                  />
                </Tooltip>
              ))}
            </div>
            <div className={styles.timelineLabels}>
              <Text type="secondary">0s</Text>
              <Text type="secondary">{Math.round(analysisResult.duration / 2)}s</Text>
              <Text type="secondary">{Math.round(analysisResult.duration)}s</Text>
            </div>
          </div>

          <div className={styles.legend}>
            <Space>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.scene}`} />
                场景切换
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.silence}`} />
                静音
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.keyframe}`} />
                关键帧
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.emotion}`} />
                情感变化
              </span>
            </Space>
          </div>
        </div>
      ) : (
        <Empty description="请先开始分析" />
      )}
    </Card>
  );

  // 渲染建议步骤
  const renderSuggestionsStep = () => (
    <Card className={styles.suggestionsCard}>
      {analysisResult?.suggestions.length ? (
        <>
          <div className={styles.suggestionsHeader}>
            <Text>
              共 {analysisResult.suggestions.length} 条建议，
              已选中 {selectedSuggestions.size} 条
            </Text>
            <Space>
              <Button
                size="small"
                onClick={() => setSelectedSuggestions(new Set())}
              >
                取消全选
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedSuggestions(
                  new Set(analysisResult.suggestions.map(s => s.id))
                )}
              >
                全选
              </Button>
            </Space>
          </div>

          <List
            className={styles.suggestionsList}
            dataSource={analysisResult.suggestions}
            renderItem={suggestion => (
              <List.Item
                className={`${styles.suggestionItem} ${
                  selectedSuggestions.has(suggestion.id) ? styles.selected : ''
                }`}
                onClick={() => toggleSuggestion(suggestion.id)}
                actions={[
                  <Badge
                    key="confidence"
                    count={`${Math.round(suggestion.confidence * 100)}%`}
                    style={{
                      backgroundColor: suggestion.confidence > 0.8 ? '#52c41a' :
                                       suggestion.confidence > 0.5 ? '#faad14' : '#ff4d4f'
                    }}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className={styles.suggestionIcon}>
                      {suggestion.type === 'trim' && <ScissorOutlined />}
                      {suggestion.type === 'merge' && <MergeCellsOutlined />}
                      {suggestion.type === 'cut' && <DeleteOutlined />}
                      {suggestion.type === 'effect' && <ExperimentOutlined />}
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{suggestion.description}</Text>
                      {suggestion.autoApplicable && (
                        <Tag color="green" size="small">可自动应用</Tag>
                      )}
                    </Space>
                  }
                  description={suggestion.reason}
                />
              </List.Item>
            )}
          />

          <div className={styles.actionButtons}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApplySuggestions}
              disabled={selectedSuggestions.size === 0}
              size="large"
            >
              应用选中的建议 ({selectedSuggestions.size})
            </Button>
          </div>
        </>
      ) : (
        <Empty description="暂无剪辑建议" />
      )}
    </Card>
  );

  // 渲染预览步骤
  const renderPreviewStep = () => (
    <Card className={styles.previewCard}>
      {previewSegments.length > 0 ? (
        <>
          <div className={styles.previewStats}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="原始时长"
                  value={`${Math.round(videoInfo.duration)}秒`}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="剪辑后时长"
                  value={`${Math.round(
                    previewSegments.reduce((sum, s) => sum + s.duration, 0)
                  )}秒`}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="片段数量"
                  value={previewSegments.length}
                />
              </Col>
            </Row>
          </div>

          <Divider />

          <Title level={5}>剪辑片段预览</Title>
          <div className={styles.segmentsPreview}>
            {previewSegments.map((segment, index) => (
              <Card
                key={segment.id}
                size="small"
                className={styles.segmentCard}
                title={
                  <Space>
                    <Text strong>片段 {index + 1}</Text>
                    <Tag color={segment.type === 'silence' ? 'red' : 'blue'}>
                      {segment.type === 'silence' ? '静音' : '视频'}
                    </Tag>
                  </Space>
                }
              >
                <div className={styles.segmentTime}>
                  <ClockCircleOutlined /> {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </div>
                <div className={styles.segmentDuration}>
                  时长: {segment.duration.toFixed(1)}秒
                </div>
                {segment.thumbnail && (
                  <img
                    src={segment.thumbnail}
                    alt={`片段 ${index + 1}`}
                    className={styles.segmentThumbnail}
                  />
                )}
              </Card>
            ))}
          </div>

          <div className={styles.actionButtons}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setCurrentStep(0)}
              >
                重新配置
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
              >
                导出剪辑方案
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <Empty description="暂无预览内容，请先应用建议" />
      )}
    </Card>
  );

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderConfigStep();
      case 1:
        return renderAnalyzeStep();
      case 2:
        return renderSuggestionsStep();
      case 3:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  return (
    <div className={styles.aiClipAssistant}>
      <Card className={styles.headerCard}>
        <Title level={4}>
          <RobotOutlined /> AI 智能剪辑助手
        </Title>
        <Paragraph type="secondary">
          自动检测剪辑点、识别静音片段、提取关键帧，并生成智能剪辑建议
        </Paragraph>
      </Card>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          className={styles.errorAlert}
        />
      )}

      <Steps
        current={currentStep}
        className={styles.steps}
        onChange={setCurrentStep}
      >
        {CLIP_STEPS.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            icon={step.icon}
            disabled={index > currentStep + 1}
          />
        ))}
      </Steps>

      <div className={styles.stepContent}>
        {renderStepContent()}
      </div>
    </div>
  );
};

// 统计组件
const Statistic: React.FC<{ title: string; value: string | number }> = ({
  title,
  value
}) => (
  <div className={styles.statistic}>
    <div className={styles.statisticValue}>{value}</div>
    <div className={styles.statisticTitle}>{title}</div>
  </div>
);

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default AIClipAssistant;
