/**
 * CommentaryAgentProgress — 多 agent 进度面板
 *
 * 显示 5 个 commentary agent (director / visual / narration / timing / overlay) 各自的进度状态
 * 配合 runCommentaryPipeline() 的 onProgress 回调使用
 *
 * 用途：替换 ScriptWriting.tsx 中"无进度反馈"的 orchestrateCommentaryAgents() 调用
 */

import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { COMMENTARY_STEP_NAMES, COMMENTARY_PROGRESS_WEIGHTS } from '@/core/pipeline/steps';
import type { CommentaryStepName } from '@/core/pipeline/steps';
import { cn } from '@/shared/utils/cn';

// ============================================================
// 类型
// ============================================================

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentProgressItem {
  name: CommentaryStepName;
  displayName: string;
  status: AgentStatus;
  /** 0-1 局部进度 (本步骤内) */
  progress: number;
  /** 当前消息 */
  message?: string;
  /** 步骤耗时 (ms) */
  durationMs?: number;
}

export interface CommentaryAgentProgressProps {
  /** 5 个 agent 的当前状态 */
  agents: AgentProgressItem[];
  /** 全局进度 0-1 */
  globalProgress?: number;
  /** 总耗时 (ms) */
  totalDurationMs?: number;
  /** 自定义 className */
  className?: string;
}

// ============================================================
// 步骤元信息
// ============================================================

const AGENT_DISPLAY_NAMES: Record<CommentaryStepName, string> = {
  'commentary-director': '导演 Agent',
  'commentary-visual': '视觉分析 Agent',
  'commentary-narration': '文案生成 Agent',
  'commentary-timing': '时间对齐 Agent',
  'commentary-overlay': '原画覆盖 Agent',
};

const AGENT_DESCRIPTIONS: Record<CommentaryStepName, string> = {
  'commentary-director': '制定镜头节奏策略',
  'commentary-visual': '解析场景与情绪峰值',
  'commentary-narration': '生成分层解说草稿',
  'commentary-timing': '映射文案到镜头',
  'commentary-overlay': '生成原画覆盖建议',
};

// ============================================================
// 状态图标
// ============================================================

const StatusIcon: React.FC<{ status: AgentStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="已完成" />;
    case 'running':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-label="进行中" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" aria-label="失败" />;
    case 'pending':
    default:
      return <Circle className="h-5 w-5 text-gray-300" aria-label="等待中" />;
  }
};

// ============================================================
// 单个 Agent 行
// ============================================================

const AgentRow: React.FC<{ agent: AgentProgressItem; weight: number }> = ({
  agent,
  weight,
}) => {
  const { name, status, progress, message } = agent;
  const displayName = AGENT_DISPLAY_NAMES[name] ?? name;
  const description = AGENT_DESCRIPTIONS[name];

  // 进度条宽度 = (本步权重) * (本步进度)
  const barWidth = weight * 100 * progress;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card p-3 transition-colors',
        status === 'running' && 'border-blue-500/50 bg-blue-50/30',
        status === 'completed' && 'border-green-500/30 bg-green-50/20',
        status === 'failed' && 'border-red-500/50 bg-red-50/30'
      )}
      data-testid={`agent-row-${name}`}
    >
      <StatusIcon status={status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-medium text-sm">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {Math.round(progress * 100)}% · 权重 {Math.round(weight * 100)}%
          </div>
        </div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>

        {/* 进度条 */}
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              status === 'failed'
                ? 'bg-red-500'
                : status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
            )}
            style={{ width: `${barWidth}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {message && status === 'running' && (
          <div className="mt-1 text-xs text-blue-600 truncate">{message}</div>
        )}

        {agent.durationMs !== undefined && status === 'completed' && (
          <div className="mt-1 text-xs text-green-600">
            耗时 {agent.durationMs}ms
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 主组件
// ============================================================

/**
 * CommentaryAgentProgress — 多 agent 进度面板
 */
export const CommentaryAgentProgress: React.FC<CommentaryAgentProgressProps> = ({
  agents,
  globalProgress,
  totalDurationMs,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)} data-testid="commentary-agent-progress">
      {/* 全局进度 */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">整体进度</span>
          <span className="text-muted-foreground">
            {globalProgress !== undefined ? Math.round(globalProgress * 100) : 0}%
            {totalDurationMs !== undefined && totalDurationMs > 0 && (
              <span className="ml-2 text-xs">({totalDurationMs}ms)</span>
            )}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(globalProgress ?? 0) * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round((globalProgress ?? 0) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* 5 个 Agent 行 */}
      <div className="space-y-2">
        {COMMENTARY_STEP_NAMES.map((stepName) => {
          const agent = agents.find((a) => a.name === stepName) ?? {
            name: stepName,
            displayName: AGENT_DISPLAY_NAMES[stepName] ?? stepName,
            status: 'pending' as AgentStatus,
            progress: 0,
          };
          const weight = COMMENTARY_PROGRESS_WEIGHTS[
            stepName.replace('commentary-', '') as keyof typeof COMMENTARY_PROGRESS_WEIGHTS
          ] ?? 0;
          return <AgentRow key={stepName} agent={agent} weight={weight} />;
        })}
      </div>
    </div>
  );
};

// ============================================================
// Hook: 从 runCommentaryPipeline 的 onProgress 提取 agent 状态
// ============================================================

/**
 * 初始化 5 个 agent 状态 (全部 pending)
 */
export const initAgentProgress = (): AgentProgressItem[] => {
  return COMMENTARY_STEP_NAMES.map((name) => ({
    name,
    displayName: AGENT_DISPLAY_NAMES[name] ?? name,
    status: 'pending' as AgentStatus,
    progress: 0,
  }));
};

/**
 * 根据 runCommentaryPipeline 的 onProgress 回调更新 agent 状态
 *
 * 用法：
 *   const [agents, setAgents] = useState(initAgentProgress());
 *   await runCommentaryPipeline(state, {
 *     onProgress: (stage, _progress, message) => updateAgentProgress(setAgents, stage, message)
 *   });
 */
export const updateAgentProgress = (
  setAgents: React.Dispatch<React.SetStateAction<AgentProgressItem[]>>,
  stage: string,
  message?: string
): void => {
  setAgents((prev) =>
    prev.map((agent) => {
      if (agent.name !== stage) return agent;
      return {
        ...agent,
        status: 'running',
        message,
      };
    })
  );
};

/**
 * 标记某个 agent 为完成
 */
export const completeAgent = (
  setAgents: React.Dispatch<React.SetStateAction<AgentProgressItem[]>>,
  stage: string,
  durationMs?: number
): void => {
  setAgents((prev) =>
    prev.map((agent) => {
      if (agent.name !== stage) return agent;
      return {
        ...agent,
        status: 'completed',
        progress: 1,
        message: undefined,
        durationMs,
      };
    })
  );
};

/**
 * 标记某个 agent 为失败
 */
export const failAgent = (
  setAgents: React.Dispatch<React.SetStateAction<AgentProgressItem[]>>,
  stage: string
): void => {
  setAgents((prev) =>
    prev.map((agent) => {
      if (agent.name !== stage) return agent;
      return { ...agent, status: 'failed' };
    })
  );
};

export default CommentaryAgentProgress;
