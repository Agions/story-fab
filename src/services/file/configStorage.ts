import { readTextFile, writeTextFile, exists } from '@tauri-apps/api/fs';
import { message } from 'antd';
import { getConfigDir } from './fileOperations';

/**
 * 获取API密钥
 * @param service 服务名称，如'openai'
 */
export const getApiKey = async (service: string): Promise<string> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return '';

    const configPath = `${configDir}api_keys.json`;
    const configExists = await exists(configPath);

    if (!configExists) {
      await writeTextFile(configPath, JSON.stringify({}));
      return '';
    }

    const configContent = await readTextFile(configPath);
    const config = JSON.parse(configContent) as Record<string, string>;

    return config[service] || '';
  } catch (error) {
    console.error(`获取${service}的API密钥失败:`, error);
    return '';
  }
};

/**
 * 保存API密钥
 * @param service 服务名称，如'openai'
 * @param apiKey 密钥
 */
export const saveApiKey = async (service: string, apiKey: string): Promise<boolean> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return false;

    const configPath = `${configDir}api_keys.json`;
    const configExists = await exists(configPath);

    let config: Record<string, string> = {};
    if (configExists) {
      const configContent = await readTextFile(configPath);
      config = JSON.parse(configContent) as Record<string, string>;
    }

    config[service] = apiKey;

    await writeTextFile(configPath, JSON.stringify(config, null, 2));
    message.success(`${service}的API密钥已保存`);
    return true;
  } catch (error) {
    console.error(`保存${service}的API密钥失败:`, error);
    message.error(`保存API密钥失败: ${error}`);
    return false;
  }
};

/**
 * 获取应用数据
 * @param key 数据键名
 */
export const getAppData = async <T>(key: string): Promise<T | null> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return null;

    const dataPath = `${configDir}${key}.json`;
    const dataExists = await exists(dataPath);

    if (!dataExists) {
      return null;
    }

    const dataContent = await readTextFile(dataPath);
    return JSON.parse(dataContent) as T;
  } catch (error) {
    console.error(`获取应用数据(${key})失败:`, error);
    return null;
  }
};

/**
 * 保存应用数据
 * @param key 数据键名
 * @param data 要保存的数据
 */
export const saveAppData = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return false;

    const dataPath = `${configDir}${key}.json`;
    await writeTextFile(dataPath, JSON.stringify(data, null, 2));

    return true;
  } catch (error) {
    console.error(`保存应用数据(${key})失败:`, error);
    message.error(`保存数据失败: ${error}`);
    return false;
  }
};
