import { VideoSegment } from '@/services/videoService';
import type { ScriptData, Scene, ScriptSegment } from '@/core/types';

// 原始 Props 接口
export interface ScriptEditorOriginalProps {
  videoPath: string;
  initialSegments?: VideoSegment[];
  onSave: (segments: VideoSegment[]) => void;
  onExport?: (format: string) => void;
}

// Workflow 页面使用的 Props 接口
export interface ScriptEditorWorkflowProps {
  script?: ScriptData;
  scenes?: Scene[];
  onSave: (script: ScriptData) => void;
  metadata?: any;
  onScriptUpdate?: (script: ScriptData) => void;
}

export type ScriptEditorProps = ScriptEditorOriginalProps | ScriptEditorWorkflowProps;

// 类型守卫函数
export function isWorkflowProps(props: ScriptEditorProps): props is ScriptEditorWorkflowProps {
  return 'script' in props;
}

// 片段类型选项
export const segmentTypeOptions = [
  { value: 'narration', label: '旁白' },
  { value: 'dialogue', label: '对白' },
  { value: 'action', label: '动作' },
  { value: 'transition', label: '转场' },
];

// 获取类型中文名
export const getTypeLabel = (type: string): string => {
  const option = segmentTypeOptions.find(opt => opt.value === type);
  return option?.label || type;
};
