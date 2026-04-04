/**
 * IStepExecutor - 步骤执行器接口
 *
 * 每个步骤（upload / analyze / script-generate …）都实现此接口。
 * WorkflowEngine 通过 execute(ctx) 调用，无需了解内部细节。
 *
 * 关键语义：
 * - execute() 正常返回 → 步骤成功
 * - 抛出 RetryRequest → WorkflowEngine 增加 attempt 后重试
 * - 抛出 SkipRequest → 步骤被跳过，继续下一步
 * - 抛出其他 Error → 立即标记失败
 */
import type { StepContext } from './WorkflowEngine';
import type { WorkflowData } from './types';

export interface StepResult {
  data?: Partial<WorkflowData>;
}

export interface IStepExecutor {
  /** 步骤标识 */
  readonly step: string;

  /**
   * 执行步骤。
   * - 返回时表示成功，ctx.updateData() 已在内部调用
   * - 抛出 RetryRequest → 重试
   * - 抛出 SkipRequest → 跳过
   * - 抛出其他 Error → 失败
   */
  execute(ctx: StepContext): Promise<void>;
}
