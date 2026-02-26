/**
 * AI 剪辑助手组件
 * 提供智能剪辑点检测、自动剪辑建议、批量处理界面
 */

import React from 'react';
import { Card, Steps, Alert, Typography } from 'antd';
import {
  SettingOutlined,
  EyeOutlined,
  RobotOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useAIClipAssistant } from './hooks/useAIClipAssistant';
import { ConfigStep, AnalyzeStep, SuggestionsStep, PreviewStep } from './components';
import type { AIClipAssistantProps } from './types';
import styles from './index.module.less';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

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
  const {
    currentStep,
    setCurrentStep,
    analyzing,
    analysisProgress,
    analysisResult,
    error,
    selectedSuggestions,
    previewSegments,
    config,
    updateConfig,
    handleAnalyze,
    handleSmartClip,
    handleApplySuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    deselectAllSuggestions
  } = useAIClipAssistant(videoInfo, onAnalysisComplete, onApplySuggestions);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ConfigStep
            videoInfo={videoInfo}
            config={config}
            analyzing={analyzing}
            onConfigChange={updateConfig}
            onAnalyze={handleAnalyze}
            onSmartClip={handleSmartClip}
          />
        );
      case 1:
        return (
          <AnalyzeStep
            analyzing={analyzing}
            analysisProgress={analysisProgress}
            analysisResult={analysisResult}
          />
        );
      case 2:
        return (
          <SuggestionsStep
            analysisResult={analysisResult}
            selectedSuggestions={selectedSuggestions}
            onToggleSuggestion={toggleSuggestion}
            onSelectAll={selectAllSuggestions}
            onDeselectAll={deselectAllSuggestions}
            onApply={handleApplySuggestions}
          />
        );
      case 3:
        return (
          <PreviewStep
            videoInfo={videoInfo}
            previewSegments={previewSegments}
            onReset={() => setCurrentStep(0)}
          />
        );
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

      <div className={styles.stepContent}>{renderStepContent()}</div>
    </div>
  );
};

export default AIClipAssistant;
