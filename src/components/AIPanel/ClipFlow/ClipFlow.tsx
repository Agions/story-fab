/**
 * AI 剪辑流程组件
 * 完整流程：创建项目 -> 上传视频 -> AI分析 -> 生成文案 -> 视频合成 -> 导出
 * 
 * 三大核心功能：
 * 1. AI 视频解说 - 对视频内容进行专业解说
 * 2. AI 第一人称解说 - 以第一人称视角讲述  
 * 3. AI 混剪 - 自动识别精彩片段并添加旁白
 * 
 * 数据流转关系：
 * 1. 创建项目 → project (项目信息)
 * 2. 上传视频 → video (视频文件) + duration/width/height
 * 3. AI分析 → analysis (场景/关键帧/物体/情感) + subtitle (OCR/ASR字幕)
 * 4. 生成文案 → script (解说/第一人称/混剪文案) 基于 analysis + subtitle
 * 5. 视频合成 → synthesis (最终视频) 基于 video + script + voice
 * 6. 导出 → export (文件) 基于 synthesis + exportSettings
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Steps, Card, Button, Space, Result, Spin, message, 
  Alert, Progress, Typography, Divider, List, Tag 
} from 'antd';
import {
  PlusOutlined,
  VideoCameraOutlined,
  CloudSyncOutlined,
  FileTextOutlined,
  EditOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  RedoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useClipFlow, ClipFlowStep, ClipFlowState } from '../AIEditorContext';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;

// 流程步骤配置 - 体现三大核心功能
const stepConfig: Record<ClipFlowStep, {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}> = {
  'project-create': {
    title: '创建项目',
    description: '设置项目名称和基本配置',
    icon: <PlusOutlined />,
  },
  'video-upload': {
    title: '上传视频',
    description: '选择要剪辑的视频文件',
    icon: <VideoCameraOutlined />,
  },
  'ai-analyze': {
    title: 'AI 分析',
    description: '智能识别内容、生成字幕',
    icon: <CloudSyncOutlined />,
  },
  'script-generate': {
    title: '生成文案',
    description: '三大核心功能：解说/第一人称/混剪',
    icon: <FileTextOutlined />,
    tip: '🎯 选择：视频解说 | 第一人称 | AI混剪',
  },
  'video-synthesize': {
    title: '视频合成',
    description: '音画同步、添加特效',
    icon: <EditOutlined />,
  },
  'export': {
    title: '导出视频',
    description: '导出最终成片',
    icon: <ExportOutlined />,
  },
};

// 获取步骤索引
const getStepIndex = (step: ClipFlowStep): number => {
  const steps: ClipFlowStep[] = [
    'project-create',
    'video-upload', 
    'ai-analyze',
    'script-generate',
    'video-synthesize',
    'export',
  ];
  return steps.indexOf(step);
};

// 检查是否可以进入下一步
const canProceedToStep = (state: ClipFlowState, targetStep: ClipFlowStep): boolean => {
  const currentIndex = getStepIndex(state.currentStep);
  const targetIndex = getStepIndex(targetStep);
  
  // 只能前进到下一步
  if (targetIndex > currentIndex + 1) return false;
  
  // 检查前置步骤是否完成
  if (targetStep === 'video-upload') return state.stepStatus['project-create'];
  if (targetStep === 'ai-analyze') return state.stepStatus['video-upload'];
  if (targetStep === 'script-generate') return state.stepStatus['ai-analyze'];
  if (targetStep === 'video-synthesize') return state.stepStatus['script-generate'];
  if (targetStep === 'export') return state.stepStatus['video-synthesize'];
  
  return true;
};

interface ClipFlowProps {
  // 子组件渲染
  children?: React.ReactNode;
  // 是否显示顶部步骤条
  showSteps?: boolean;
  // 是否显示底部导航
  showNavigation?: boolean;
}

const ClipFlow: React.FC<ClipFlowProps> = ({
  children,
  showSteps = true,
  showNavigation = true,
}) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { 
    state, 
    setStep, 
    goToNextStep, 
    goToPrevStep,
    canProceed,
    completedSteps,
    totalSteps,
  } = useClipFlow();

  // 从 URL 同步项目 ID
  React.useEffect(() => {
    if (projectId) {
      // 如果有项目 ID，说明项目已创建
      // 这里可以添加加载项目的逻辑
    }
  }, [projectId]);

  // 步骤变化处理
  const handleStepClick = (step: ClipFlowStep) => {
    if (canProceedToStep(state, step)) {
      setStep(step);
    }
  };

  // 渲染步骤条
  const renderSteps = () => {
    const steps: ClipFlowStep[] = [
      'project-create',
      'video-upload',
      'ai-analyze', 
      'script-generate',
      'video-synthesize',
      'export',
    ];

    return (
      <div className={styles.stepsContainer}>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Space size="middle">
            <Tag color="blue" icon={<VideoCameraOutlined />}>视频解说</Tag>
            <Tag color="green" icon={<UserOutlined />}>第一人称</Tag>
            <Tag color="orange" icon={<EditOutlined />}>AI混剪</Tag>
          </Space>
        </div>
        <Steps
          current={getStepIndex(state.currentStep)}
          size="small"
          items={steps.map((step) => ({
            key: step,
            title: stepConfig[step].title,
            description: state.stepStatus[step] ? '已完成' : stepConfig[step].description,
            icon: state.stepStatus[step] 
              ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
              : stepConfig[step].icon,
          }))}
          onChange={(current) => {
            const targetStep = steps[current];
            if (canProceedToStep(state, targetStep)) {
              setStep(targetStep);
            }
          }}
          className={styles.steps}
        />
        {stepConfig[state.currentStep].tip && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary">{stepConfig[state.currentStep].tip}</Text>
          </div>
        )}
      </div>
    );
  };

  // 渲染导航按钮
  const renderNavigation = () => {
    const steps: ClipFlowStep[] = [
      'project-create',
      'video-upload',
      'ai-analyze',
      'script-generate',
      'video-synthesize',
      'export',
    ];
    const currentIndex = getStepIndex(state.currentStep);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === steps.length - 1;

    return (
      <div className={styles.navigation}>
        <Space>
          {!isFirst && (
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={goToPrevStep}
            >
              上一步
            </Button>
          )}
          
          {isLast ? (
            <Button 
              type="primary" 
              icon={<ExportOutlined />}
              disabled={!state.stepStatus['video-synthesize']}
            >
              完成导出
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<ArrowRightOutlined />}
              disabled={!canProceed()}
              onClick={goToNextStep}
            >
              下一步
            </Button>
          )}
        </Space>
        
        <div className={styles.progress}>
          <Text type="secondary">
            已完成 {completedSteps}/{totalSteps} 步
          </Text>
          <Progress 
            percent={Math.round((completedSteps / totalSteps) * 100)} 
            size="small"
            showInfo={false}
            strokeColor="#52c41a"
          />
        </div>
      </div>
    );
  };

  // 渲染当前步骤状态
  const renderStepStatus = () => {
    const { currentStep, stepStatus } = state;
    
    // 显示警告信息
    if (!stepStatus[currentStep] && currentStep !== 'project-create') {
      return (
        <Alert
          message="请先完成当前步骤"
          description={`请完成「${stepConfig[currentStep].title}」后再继续下一步`}
          type="warning"
          showIcon
          className={styles.alert}
        />
      );
    }
    
    return null;
  };

  return (
    <div className={styles.clipFlow}>
      {showSteps && renderSteps()}
      {renderStepStatus()}
      
      <div className={styles.content}>
        {children}
      </div>
      
      {showNavigation && renderNavigation()}
    </div>
  );
};

export default ClipFlow;
