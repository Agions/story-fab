/**
 * story-fab Dashboard 类型定义
 * Project / ProjectStatus 从 @/core/types 统一导出，避免重复定义。
 */
import type { Project, ProjectStatus } from '@/core/types';

export type { Project, ProjectStatus };

export interface DashboardStats {
  totalProjects: number;
  totalDuration: number;
  totalSize: number;
}
