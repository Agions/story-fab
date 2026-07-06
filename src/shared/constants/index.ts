/**
 * 共享常量统一出口
 * 仅保留被实际引用的导出
 */

// 项目核心常量（仅保留有消费者的）
export {
  VIDEO_EXTENSIONS,
  MAX_FILE_SIZE,
  PROJECT_SAVE_BEHAVIOR_KEY,
  PROJECT_AUTO_SAVE_KEY,
  type ProjectSaveBehavior,
} from '@/shared/constants/constants';
