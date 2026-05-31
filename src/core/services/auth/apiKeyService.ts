/**
 * Auth Service — API Key management
 * Get/set API keys from encrypted store via @tauri-apps/plugin-store.
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

export const saveApiKey = async (service: string, apiKey: string): Promise<boolean> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: true });
    await store.set(service, apiKey);
    await store.save();
    return true;
  } catch (error) {
    logger.error(`保存${service}的API密钥失败:`, error);
    return false;
  }
};