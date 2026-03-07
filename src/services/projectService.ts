import { invoke } from '@tauri-apps/api/core';
import { message } from 'antd';

/**
 * 保存项目文件
 * @param projectId 项目ID
 * @param content 项目内容
 */
export const saveProjectFile = async (projectId: string, content: string): Promise<boolean> => {
  try {
    if (!projectId) {
      throw new Error('项目ID不能为空');
    }

    await invoke('save_project_file', { 
      projectId, 
      content 
    });
    
    return true;
  } catch (error) {
    console.error('保存项目失败:', error);
    message.error('保存项目失败，请重试');
    return false;
  }
};

/**
 * 加载项目文件
 * @param projectId 项目ID
 */
export const loadProjectFile = async <T = Record<string, unknown>>(projectId: string): Promise<T> => {
  try {
    if (!projectId) {
      throw new Error('项目ID不能为空');
    }

    const content = await invoke<string>('load_project_file', { 
      projectId 
    });
    
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('加载项目失败:', error);
    message.error('加载项目失败，请重试');
    throw error;
  }
};

/**
 * 删除项目文件
 * @param projectId 项目ID
 */
export const deleteProjectFile = async (projectId: string): Promise<boolean> => {
  try {
    if (!projectId) {
      throw new Error('项目ID不能为空');
    }

    await invoke('delete_project_file', { 
      projectId 
    });
    
    return true;
  } catch (error) {
    console.error('删除项目失败:', error);
    message.error('删除项目失败，请重试');
    return false;
  }
};

/**
 * 获取项目列表
 */
export const getProjectList = async <T = Record<string, unknown>>(): Promise<T[]> => {
  try {
    const files = await invoke<string[]>('list_app_data_files', { 
      directory: 'ClipFlow' 
    });
    
    const projects: T[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const projectId = file.replace('.json', '');
          const project = await loadProjectFile<T>(projectId);
          projects.push(project);
        } catch (e) {
          console.error('加载项目失败:', e);
        }
      }
    }
    
    return projects;
  } catch (error) {
    console.error('获取项目列表失败:', error);
    message.error('获取项目列表失败，请重试');
    return [];
  }
}; 
