import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile, BaseDirectory, createDir, exists } from '@tauri-apps/api/fs';
import { message } from 'antd';
import { appConfigDir } from '@tauri-apps/api/path';
import { open as openExternal } from '@tauri-apps/api/shell';

// 确保应用数据目录
export const ensureAppDataDir = async (): Promise<void> => {
  try {
    const appDir = 'ClipFlow';
    
    // 先尝试使用Rust函数检查目录
    try {
      const dirPath = await invoke('check_app_data_directory');
      console.log('Rust目录检查成功:', dirPath);
      return;
    } catch (rustError) {
      console.warn('Rust目录检查失败，回退到前端检查:', rustError);
    }
    
    // 前端备用检查
    let dirExists = false;
    try {
      dirExists = await exists(appDir, { dir: BaseDirectory.AppData });
    } catch (existsError) {
      console.error('检查目录是否存在时出错:', existsError);
      throw new Error(`检查目录出错: ${existsError instanceof Error ? existsError.message : '未知错误'}`);
    }
    
    if (!dirExists) {
      console.log('应用数据目录不存在，创建目录:', appDir);
      try {
        await createDir(appDir, { dir: BaseDirectory.AppData, recursive: true });
      } catch (createError) {
        console.error('创建目录失败:', createError);
        throw new Error(`创建目录失败: ${createError instanceof Error ? createError.message : '未知错误'}`);
      }
      
      // 验证目录是否创建成功
      try {
        const checkExists = await exists(appDir, { dir: BaseDirectory.AppData });
        if (!checkExists) {
          throw new Error('无法创建应用数据目录，请检查权限');
        }
      } catch (verifyError) {
        console.error('验证目录是否创建成功时出错:', verifyError);
        throw new Error(`验证目录出错: ${verifyError instanceof Error ? verifyError.message : '未知错误'}`);
      }
      console.log('应用数据目录创建成功');
    }
    
    return;
  } catch (error) {
    console.error('创建应用数据目录失败:', error);
    message.error('创建应用数据目录失败，请检查权限设置');
    throw error;
  }
};

// 保存项目数据到文件
export const saveProjectToFile = async (projectId: string, project: any): Promise<void> => {
  if (!project || !projectId) {
    console.error('保存项目文件失败: 项目数据无效');
    throw new Error('无效的项目数据');
  }

  try {
    // 确保目录存在
    await ensureAppDataDir().catch(err => {
      console.error('确保应用数据目录存在时出错:', err);
      throw new Error(`应用数据目录错误: ${err.message || '未知错误'}`);
    });
    
    const projectPath = `ClipFlow/${projectId}.json`;
    console.log('正在保存项目文件:', projectPath);
    
    // 准备项目数据
    let projectData: string;
    try {
      // 移除可能导致循环引用的字段
      const cleanProject = { ...project };
      if (cleanProject.aiModel && cleanProject.aiModel.apiKey) {
        // 创建新对象避免修改原始对象
        cleanProject.aiModel = { 
          ...cleanProject.aiModel,
          apiKey: undefined // 不保存API密钥到项目文件中
        };
      }
      
      projectData = JSON.stringify(cleanProject, null, 2);
      if (!projectData) {
        throw new Error('项目数据序列化为空');
      }
    } catch (err) {
      console.error('序列化项目数据失败:', err);
      throw new Error('无法序列化项目数据');
    }
    
    // 使用Rust函数直接写入文件，提供更好的错误处理
    try {
      await invoke('save_project_file', {
        projectId: projectId,
        content: projectData
      });
      console.log('文件写入成功 (通过Rust函数)');
      return;
    } catch (rustErr: any) {
      console.warn('通过Rust保存文件失败，尝试使用JS API保存:', rustErr);
      // 继续使用JS API作为备选方案
    }
    
    // 检查文件是否已存在
    const fileExists = await exists(projectPath, { dir: BaseDirectory.AppData })
      .catch(err => {
        console.error('检查文件是否存在时出错:', err);
        return false;
      });
      
    console.log(`项目文件${fileExists ? '已存在' : '不存在'}，准备${fileExists ? '更新' : '新建'}`);
    
    // 执行写入
    try {
      await writeTextFile(
        projectPath,
        projectData,
        { dir: BaseDirectory.AppData }
      );
      console.log('文件写入完成');
    } catch (writeErr: any) {
      console.error('文件写入失败:', writeErr);
      
      // 尝试备用方法保存
      try {
        const configDir = await getConfigDir();
        const backupPath = `${configDir}${projectId}.json`;
        await writeTextFile(backupPath, projectData);
        console.log('使用备用路径保存成功:', backupPath);
        return;
      } catch (backupErr) {
        console.error('备用保存也失败:', backupErr);
        throw new Error(`文件写入失败: ${writeErr?.message || '未知错误'}`);
      }
    }
    
    // 验证文件是否写入成功
    try {
      const verifyExists = await exists(projectPath, { dir: BaseDirectory.AppData });
      if (!verifyExists) {
        throw new Error('文件似乎已写入但无法验证其存在');
      }
      console.log('验证文件存在: 成功');
    } catch (verifyErr: any) {
      console.error('验证文件存在时出错:', verifyErr);
      throw new Error(`无法验证文件是否保存成功: ${verifyErr?.message || '未知错误'}`);
    }
    
    console.log('项目文件保存成功:', projectPath);
    return;
  } catch (error) {
    console.error('保存项目文件失败:', error);
    // 传递更明确的错误信息
    const errorMessage = error instanceof Error 
      ? error.message
      : '未知错误';
    message.error(`保存项目文件失败: ${errorMessage}`);
    throw error;
  }
};

// 读取项目数据
export const loadProjectFromFile = async (projectId: string): Promise<any> => {
  try {
    const projectPath = `ClipFlow/${projectId}.json`;
    const existsFile = await exists(projectPath, { dir: BaseDirectory.AppData });
    
    if (!existsFile) {
      throw new Error('项目文件不存在');
    }
    
    const content = await readTextFile(projectPath, { dir: BaseDirectory.AppData });
    return JSON.parse(content);
  } catch (error) {
    console.error('读取项目文件失败:', error);
    throw error;
  }
};

// 导出脚本到文本文件
export const exportScriptToFile = async (script: any, filename: string): Promise<void> => {
  try {
    const savePath = await save({
      defaultPath: filename,
      filters: [{
        name: '文本文件',
        extensions: ['txt']
      }]
    });
    
    if (!savePath) return;
    
    let content = '';
    
    // 构建脚本内容
    content += `项目: ${script.projectName}\n`;
    content += `创建时间: ${new Date(script.createdAt).toLocaleString()}\n\n`;
    
    // 添加脚本内容
    script.segments.forEach((segment: any) => {
      content += `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]\n`;
      content += `${segment.content}\n\n`;
    });
    
    await writeTextFile(savePath, content);
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

/**
 * 获取应用配置目录
 */
export const getConfigDir = async (): Promise<string> => {
  try {
    const configDir = await appConfigDir();
    // 确保目录存在
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
 * 选择文件
 * @param filters 文件过滤器
 */
export const selectFile = async (filters?: { name: string, extensions: string[] }[]): Promise<string | null> => {
  try {
    const selected = await open({
      multiple: false,
      filters: filters || [
        { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv'] }
      ]
    });
    
    if (selected === null) {
      return null;
    }
    
    // Tauri的open函数在选择单个文件时可能返回字符串或数组
    return Array.isArray(selected) ? selected[0] : selected;
  } catch (error) {
    console.error('选择文件失败:', error);
    message.error('选择文件失败');
    return null;
  }
};

/**
 * 保存文件
 * @param defaultPath 默认保存路径
 * @param filters 文件过滤器
 */
export const saveFile = async (
  content: string,
  defaultPath?: string,
  filters?: { name: string, extensions: string[] }[]
): Promise<boolean> => {
  try {
    const savePath = await save({
      defaultPath,
      filters: filters || [
        { name: '文本文件', extensions: ['txt'] }
      ]
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

/**
 * 打开外部URL
 * @param url 要打开的URL
 * @returns 是否成功打开
 */
export const openExternalUrl = async (url: string): Promise<boolean> => {
  try {
    // 确保URL有效
    let validUrl = url.trim();
    
    // 添加https前缀如果缺少协议
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }
    
    console.log(`正在打开外部链接: ${validUrl}`);
    await openExternal(validUrl);
    return true;
  } catch (error) {
    console.error('打开外部链接失败:', error);
    
    // 降级处理：尝试使用window.open
    try {
      let validUrl = url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      
      window.open(validUrl, '_blank', 'noopener,noreferrer');
      console.log('通过window.open打开链接');
      return true;
    } catch (windowError) {
      console.error('无法打开链接:', windowError);
      message.error('无法打开链接，请手动复制并访问: ' + url);
      return false;
    }
  }
};

// 列出所有项目
export const listProjects = async (): Promise<any[]> => {
  try {
    // 尝试使用 Rust 函数列出项目
    try {
      const projects = await invoke('list_project_files');
      console.log('通过 Rust 函数获取项目列表成功:', projects);
      return projects as any[];
    } catch (rustError) {
      console.warn('通过 Rust 获取项目列表失败，使用 JS API 替代:', rustError);
    }
    
    // 确保应用数据目录存在
    await ensureAppDataDir();
    
    // 通过 Tauri API 获取所有 .json 文件
    const appDir = 'ClipFlow';
    
    // 这里需要实现列出目录文件的逻辑，但 @tauri-apps/api/fs 没有直接的 readDir 函数
    // 使用 invoke 调用 Rust 端的自定义函数
    const files = await invoke('list_app_data_files', { directory: appDir });
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }
    
    // 加载每个项目文件
    const projectsPromises = (files as string[])
      .filter(file => file.endsWith('.json'))
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
    
    // 过滤出成功加载的项目
    return projects.filter(project => project !== null) as any[];
  } catch (error) {
    console.error('列出项目失败:', error);
    throw error;
  }
};

// 删除项目
export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const projectsDir = await ensureAppDataDir();
    const projectPath = `${projectsDir}/${projectId}.json`;
    
    await invoke('delete_file', { path: projectPath });
    
    // 验证文件是否已删除
    try {
      await invoke('read_text_file', { path: projectPath });
      console.error('项目文件删除失败:', projectPath);
      return false;
    } catch (error) {
      // 如果文件无法读取，说明已成功删除
      console.log('项目删除成功:', projectId);
      return true;
    }
  } catch (error) {
    console.error('删除项目出错:', error);
    throw error;
  }
};

/**
 * 检查FFmpeg是否已安装
 * @returns {Promise<{installed: boolean, version?: string}>} FFmpeg安装状态和版本信息
 */
export async function checkFFmpeg(): Promise<{installed: boolean, version?: string}> {
  try {
    const result = await invoke<{installed: boolean, version?: string}>('check_ffmpeg');
    return result;
  } catch (error) {
    console.error('检查FFmpeg失败:', error);
    return { installed: false };
  }
} 