/**
 * Storage Service — App data read/write
 * Generic key-value storage via file system.
 */
import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { logger } from '@/shared/utils/logging';
import { getConfigDir } from '@/core/utils/config-dir';

export const getAppData = async <T>(key: string): Promise<T | null> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return null;
    const dataPath = `${configDir}${key}.json`;
    const dataExists = await exists(dataPath);
    if (!dataExists) return null;
    const dataContent = await readTextFile(dataPath);
    return JSON.parse(dataContent) as T;
  } catch (error) {
    logger.error(`获取应用数据(${key})失败:`, error);
    return null;
  }
};

export const saveAppData = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return false;
    const dataPath = `${configDir}${key}.json`;
    await writeTextFile(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error(`保存应用数据(${key})失败:`, error);
    return false;
  }
};