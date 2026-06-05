/**
 * Tauri 系统目录工具 (core 层)
 *
 * 提供给 core 模块使用的系统路径工具，不依赖 src/services shim。
 * src/services/file/fileOperations.ts 的同名函数保留作为向后兼容 shim。
 */
import { appConfigDir } from '@tauri-apps/api/path';
import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { logger } from '../../shared/utils/logging';

/**
 * 获取应用配置目录路径
 * 不存在则自动创建
 */
export const getConfigDir = async (): Promise<string> => {
  try {
    const configDir = await appConfigDir();
    const configExists = await exists(configDir);
    if (!configExists) {
      await mkdir(configDir, { recursive: true });
    }
    return configDir;
  } catch (error) {
    logger.error('获取配置目录失败:', { error });
    return '';
  }
};
