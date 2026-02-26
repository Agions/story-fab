import { invoke } from '@tauri-apps/api/tauri';
import { readTextFile, writeTextFile, BaseDirectory, exists } from '@tauri-apps/api/fs';
import { message } from 'antd';
import { getConfigDir, writeFile, fileExists } from './fileOperations';

const APP_DIR = 'ClipFlow';

/**
 * 确保应用数据目录存在
 */
export const ensureAppDataDir = async (): Promise<void> => {
  try {
    // 先尝试使用Rust函数检查目录
    try {
      const dirPath = await invoke('check_app_data_directory');
      console.log('Rust目录检查成功:', dirPath);
      return;
    } catch (rustError) {
      console.warn('Rust目录检查失败，回退到前端检查:', rustError);
    }

    // 前端备用检查
    const dirExists = await exists(APP_DIR, { dir: BaseDirectory.AppData });

    if (!dirExists) {
      console.log('应用数据目录不存在，创建目录:', APP_DIR);
      await invoke('create_app_data_directory');
      console.log('应用数据目录创建成功');
    }
  } catch (error) {
    console.error('创建应用数据目录失败:', error);
    message.error('创建应用数据目录失败，请检查权限设置');
    throw error;
  }
};

/**
 * 保存项目数据到文件
 * @param projectId 项目ID
 * @param project 项目数据
 */
export const saveProjectToFile = async (
  projectId: string,
  project: any
): Promise<void> => {
  if (!project || !projectId) {
    throw new Error('无效的项目数据');
  }

  try {
    await ensureAppDataDir();

    // 清理项目数据（移除敏感信息）
    const cleanProject = { ...project };
    if (cleanProject.aiModel?.apiKey) {
      cleanProject.aiModel = { ...cleanProject.aiModel, apiKey: undefined };
    }

    const projectData = JSON.stringify(cleanProject, null, 2);

    // 尝试使用Rust函数保存
    try {
      await invoke('save_project_file', {
        projectId,
        content: projectData,
      });
      console.log('文件写入成功 (通过Rust函数)');
      return;
    } catch (rustErr) {
      console.warn('通过Rust保存文件失败，尝试使用JS API:', rustErr);
    }

    // 使用JS API作为备选
    const projectPath = `${APP_DIR}/${projectId}.json`;
    await writeTextFile(projectPath, projectData, { dir: BaseDirectory.AppData });

    console.log('项目文件保存成功:', projectPath);
  } catch (error) {
    console.error('保存项目文件失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error(`保存项目文件失败: ${errorMessage}`);
    throw error;
  }
};

/**
 * 读取项目数据
 * @param projectId 项目ID
 */
export const loadProjectFromFile = async (projectId: string): Promise<any> => {
  try {
    const projectPath = `${APP_DIR}/${projectId}.json`;
    const fileExists = await exists(projectPath, { dir: BaseDirectory.AppData });

    if (!fileExists) {
      throw new Error('项目文件不存在');
    }

    const content = await readTextFile(projectPath, { dir: BaseDirectory.AppData });
    return JSON.parse(content);
  } catch (error) {
    console.error('读取项目文件失败:', error);
    throw error;
  }
};

/**
 * 列出所有项目
 */
export const listProjects = async (): Promise<any[]> => {
  try {
    // 尝试使用Rust函数
    try {
      const projects = await invoke('list_project_files');
      console.log('通过Rust函数获取项目列表成功');
      return projects as any[];
    } catch (rustError) {
      console.warn('通过Rust获取项目列表失败:', rustError);
    }

    await ensureAppDataDir();

    // 调用Rust端列出文件
    const files = await invoke('list_app_data_files', { directory: APP_DIR });

    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }

    // 加载每个项目文件
    const projectsPromises = (files as string[])
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        try {
          const projectId = file.replace('.json', '');
          return await loadProjectFromFile(projectId);
        } catch (error) {
          console.error(`加载项目 ${file} 失败:`, error);
          return null;
        }
      });

    const projects = await Promise.all(projectsPromises);
    return projects.filter((project) => project !== null) as any[];
  } catch (error) {
    console.error('列出项目失败:', error);
    throw error;
  }
};

/**
 * 删除项目
 * @param projectId 项目ID
 */
export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    await ensureAppDataDir();
    const projectPath = `${APP_DIR}/${projectId}.json`;

    await invoke('delete_file', { path: projectPath });
    console.log('项目删除成功:', projectId);
    return true;
  } catch (error) {
    console.error('删除项目出错:', error);
    throw error;
  }
};

/**
 * 导出脚本到文本文件
 * @param script 脚本数据
 * @param filename 文件名
 */
export const exportScriptToFile = async (
  script: any,
  filename: string
): Promise<void> => {
  try {
    const { saveFile } = await import('./fileOperations');
    const savePath = await saveFile({
      defaultPath: filename,
      filters: [{ name: '文本文件', extensions: ['txt'] }],
    });

    if (!savePath) return;

    let content = '';
    content += `项目: ${script.projectName}\n`;
    content += `创建时间: ${new Date(script.createdAt).toLocaleString()}\n\n`;

    script.segments.forEach((segment: any) => {
      content += `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]\n`;
      content += `${segment.content}\n\n`;
    });

    await writeFile(savePath, content);
    message.success('脚本已导出');
  } catch (error) {
    console.error('导出脚本失败:', error);
    message.error('导出脚本失败');
    throw error;
  }
};

// 格式化时间
const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};
