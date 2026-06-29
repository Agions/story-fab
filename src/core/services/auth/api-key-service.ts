/**
 * Auth Service — API Key management
 * Get/set/delete API keys from encrypted store via @tauri-apps/plugin-store.
 */
import { load } from '@tauri-apps/plugin-store';
import { logger } from '@/shared/utils/logging';

export const getApiKey = async (service: string): Promise<string> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: false });
    const value = await store.get<string>(service);
    return value ?? '';
  } catch (error) {
    logger.error(`获取${service}的API密钥失败:`, error);
    return '';
  }
};

export const setApiKey = async (service: string, key: string): Promise<void> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: false });
    await store.set(service, key);
    await store.save();
  } catch (error) {
    logger.error(`保存${service}的API密钥失败:`, error);
    throw error;
  }
};

export const deleteApiKey = async (service: string): Promise<void> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: false });
    await store.delete(service);
    await store.save();
  } catch (error) {
    logger.error(`删除${service}的API密钥失败:`, error);
    throw error;
  }
};

export const getAllApiKeys = async (): Promise<Record<string, string>> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: false });
    const entries = await store.entries();
    const result: Record<string, string> = {};
    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  } catch (error) {
    logger.error('获取所有API密钥失败:', error);
    return {};
  }
};
