/**
 * 项目类型定义
 * Project types
 */

import type { ID, Timestamp, VideoFile } from './index';

/** 项目状态 */
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'archived';

/** 项目 */
export interface Project {
  id: ID;
  name: string;
  description?: string;
  status: ProjectStatus;
  thumbnail?: string;
  videos: VideoFile[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
