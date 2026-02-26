import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile, exists, createDir } from '@tauri-apps/api/fs';
import { message } from 'antd';
import { appConfigDir } from '@tauri-apps/api/path';

/**
 * 选择文件
 * @param filters 文件过滤器
 */
export const selectFile = async (
  filters?: { name: string; extensions: string[] }[]
): Promise<string | null> => {
  try {
    const selected = await open({
      multiple: false,
      filters: filters || [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv'] }],
    });

    if (selected === null) {
      return null;
    }

    return Array.isArray(selected) ? selected[0] : selected;
  } catch (error) {
    console.error('选择文件失败:', error);
    message.error('选择文件失败');
    return null;
  }
};

/**
 * 保存文件
 * @param content 文件内容
 * @param defaultPath 默认保存路径
 * @param filters 文件过滤器
 */
export const saveFile = async (
  content: string,
  defaultPath?: string,
  filters?: { name: string; extensions: string[] }[]
): Promise<boolean> => {
  try {
    const savePath = await save({
      defaultPath,
      filters: filters || [{ name: '文本文件', extensions: ['txt'] }],
    });

    if (savePath === null) {
      return false;
    }

    await writeTextFile(savePath, content);
    message.success('文件保存成功');
    return true;
  } catch (error) {
    console.error('保存文件失败:', error);
    message.error('保存文件失败');
    return false;
  }
};

/**
 * 获取应用配置目录
 */
export const getConfigDir = async (): Promise<string> => {
  try {
    const configDir = await appConfigDir();
    const configExists = await exists(configDir);
    if (!configExists) {
      await createDir(configDir, { recursive: true });
    }
    return configDir;
  } catch (error) {
    console.error('获取配置目录失败:', error);
    return '';
  }
};

/**
 * 读取文本文件
 * @param path 文件路径
 */
export const readFile = async (path: string): Promise<string> => {
  return await readTextFile(path);
};

/**
 * 写入文本文件
 * @param path 文件路径
 * @param content 文件内容
 */
export const writeFile = async (path: string, content: string): Promise<void> => {
  await writeTextFile(path, content);
};

/**
 * 检查文件是否存在
 * @param path 文件路径
 */
export const fileExists = async (path: string): Promise<boolean> => {
  return await exists(path);
};

/**
 * 删除文件
 * @param path 文件路径
 */
export const deleteFile = async (path: string): Promise<void> => {
  await invoke('delete_file', { path });
};
