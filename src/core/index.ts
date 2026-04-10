/**
 * Core 模块统一导出
 * 
 * 新架构：
 * - core/interfaces/  — 接口定义（与实现解耦）
 * - core/tauri/       — Tauri 通信层
 * - core/pipeline/    — Pipeline Step 接口
 * - core/services/    — 服务实现（实现 interfaces/ 中的接口）
 */

// Interfaces
export * from './interfaces';

// Tauri Bridge
export { tauri, invoke, TauriBridgeError } from './tauri/TauriBridge';
export { TauriCommand } from './tauri/TauriBridge';

// Pipeline
export {
  type Step,
  type PipelineContext,
  type PipelineResult,
  type StepOptions,
  ChainPipeline,
  ConcurrentPipeline,
  StepExecutionError,
  createStep,
  reportProgress,
} from './pipeline/Step';
