/**
 * 共享类型定义（精简至实际使用的导出）
 *
 * 仅保留被消费者引用的类型，其余已迁移至 @/types 或各模块自行定义。
 */

// ─── 项目 UI 类型 ───

export type ProjectUIStatus = 'draft' | 'processing' | 'completed';

export type ProjectView = {
  id: string;
  name: string;
  description?: string;
  status: ProjectUIStatus;
  createdAt: string;
  updatedAt: string;
  scripts?: unknown[];
  videos?: unknown[];
  videoPath?: string;
};

export type ProjectUIStats = {
  scriptCount: number;
  videoCount: number;
  status: ProjectUIStatus;
  progress: number;
};
