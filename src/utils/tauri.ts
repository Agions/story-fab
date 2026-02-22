/**
 * Tauri工具函数
 * 提供与Tauri API相关的工具函数
 */
import { readTextFile, writeTextFile, exists } from '@tauri-apps/api/fs';
import { open } from '@tauri-apps/api/dialog';

/**
 * 选择文件
 * @param {Object} options 选项
 * @param {string[]} options.extensions 文件扩展名列表 例如 ['mp4', 'avi']
 * @param {string} options.title 对话框标题
 * @returns {Promise<string>} 选择的文件路径，如果用户取消则返回空字符串
 */
export const selectFile = async (options: {
  extensions?: string[];
  title?: string;
}): Promise<string> => {
  try {
    const selected = await open({
      multiple: false,
      filters: options.extensions
        ? [{ name: '视频文件', extensions: options.extensions }]
        : undefined,
      title: options.title || '选择文件',
    });

    return selected as string || '';
  } catch (error) {
    console.error('选择文件时出错:', error);
    return '';
  }
};

/**
 * 读取文本文件内容
 * @param {string} path 文件路径
 * @returns {Promise<string>} 文件内容
 */
export const readTextFileUtil = async (path: string): Promise<string> => {
  try {
    return await readTextFile(path);
  } catch (error) {
    console.error('读取文件时出错:', error);
    throw error;
  }
};

/**
 * 写入文本文件
 * @param {string} path 文件路径
 * @param {string} contents 文件内容
 */
export const writeTextFileUtil = async (path: string, contents: string): Promise<void> => {
  try {
    await writeTextFile(path, contents);
  } catch (error) {
    console.error('写入文件时出错:', error);
    throw error;
  }
};

/**
 * 检查文件是否存在
 * @param {string} path 文件路径
 * @returns {Promise<boolean>} 文件是否存在
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    return await exists(path);
  } catch (error) {
    console.error('检查文件是否存在时出错:', error);
    return false;
  }
};
