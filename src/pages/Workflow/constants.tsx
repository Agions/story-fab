import {
  EyeOutlined,
  FileTextOutlined,
  EditOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  ScissorOutlined,
  UploadOutlined,
  UserOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import type { WorkflowStep } from '@/core/services/workflow';
import type { WorkflowMode } from '@/core/workflow/featureBlueprint';
import { WORKFLOW_MODE_DEFINITIONS } from '@/core/workflow/featureBlueprint';

const BASE_WORKFLOW_STEPS: Array<{
  key: WorkflowStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'upload',
    title: '上传视频',
    description: '选择要处理的视频文件',
    icon: <UploadOutlined />,
  },
  {
    key: 'analyze',
    title: '视频分析',
    description: 'AI 智能分析视频内容',
    icon: <EyeOutlined />,
  },
  {
    key: 'template-select',
    title: '选择模板',
    description: '选择解说脚本模板',
    icon: <FileTextOutlined />,
  },
  {
    key: 'script-generate',
    title: '生成脚本',
    description: 'AI 自动生成解说词',
    icon: <FileTextOutlined />,
  },
  {
    key: 'script-dedup',
    title: '原创性检测',
    description: '检测并优化重复内容',
    icon: <FileTextOutlined />,
  },
  {
    key: 'script-edit',
    title: '编辑脚本',
    description: '修改和完善解说词',
    icon: <EditOutlined />,
  },
  {
    key: 'ai-clip',
    title: 'AI 剪辑',
    description: '智能剪辑点检测与优化',
    icon: <ScissorOutlined />,
  },
  {
    key: 'timeline-edit',
    title: '时间轴',
    description: '调整视频和音频',
    icon: <VideoCameraOutlined />,
  },
  {
    key: 'preview',
    title: '预览',
    description: '预览最终效果',
    icon: <PlayCircleOutlined />,
  },
  {
    key: 'export',
    title: '导出',
    description: '导出最终视频',
    icon: <DownloadOutlined />,
  },
];

export const WORKFLOW_MODE_OPTIONS: Array<{
  value: WorkflowMode;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'ai-commentary', label: 'AI 解说', icon: <AudioOutlined /> },
  { value: 'ai-mixclip', label: 'AI 混剪', icon: <ScissorOutlined /> },
  { value: 'ai-first-person', label: '第一人称', icon: <UserOutlined /> },
];

export const getWorkflowSteps = (mode: WorkflowMode) => {
  const modeConfig = WORKFLOW_MODE_DEFINITIONS[mode];
  const allowedStepKeys = new Set(modeConfig.steps);
  return BASE_WORKFLOW_STEPS.filter((step) => allowedStepKeys.has(step.key));
};
