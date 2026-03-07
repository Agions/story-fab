/**
 * 文件存储服务
 * 基于 Tauri 的文件存储管理
 * 用于项目数据的持久化存储
 */

// 条件导入 Tauri API - 仅在 Tauri 环境中可用
let invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
type DialogFilter = { name: string; extensions: string[] };
type OpenDialogOptions = { multiple?: boolean; filters?: DialogFilter[]; defaultPath?: string };
type SaveDialogOptions = { filters?: DialogFilter[]; defaultPath?: string };
type OpenDialogResult = string | string[] | null;
type SaveDialogResult = string | null;

let openDialog: ((options?: OpenDialogOptions) => Promise<OpenDialogResult>) | null = null;
let saveDialog: ((options?: SaveDialogOptions) => Promise<SaveDialogResult>) | null = null;

// 动态导入 Tauri API
const loadTauriApi = async () => {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const tauriApi = await import('@tauri-apps/api/core');
      const dialogApi = await import('@tauri-apps/plugin-dialog');
      invoke = tauriApi.invoke;
      openDialog = dialogApi.open;
      saveDialog = dialogApi.save;
      return true;
    } catch (e) {
      console.warn('Failed to load Tauri API:', e);
    }
  }
  return false;
};

// 在模块加载时尝试加载 Tauri API
loadTauriApi();

import { message } from 'antd';
import type { ProjectData } from '@/core/types';
import { storageService } from './storage.service';

// 项目文件目录
const PROJECT_DIRECTORY = 'ClipFlow';

/**
 * 错误处理工具函数
 */
const handleError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * 文件存储服务类
 */
export class FileStorageService {
  /**
   * 保存项目到文件系统
   * @param project 项目数据
   * @returns 保存是否成功
   */
  async saveProject(project: ProjectData): Promise<boolean> {
    try {
      if (!project || !project.id) {
        message.error('无效的项目数据');
        return false;
      }

      // 清理项目数据，移除敏感信息
      const cleanProject = this.sanitizeProject(project);

      // 序列化项目数据
      const content = JSON.stringify(cleanProject, null, 2);

      // 尝试调用 Tauri 命令保存文件，如果失败则降级到本地存储
      if (invoke) {
        try {
          await invoke('save_project_file', {
            projectId: project.id,
            content,
          });
        } catch {
          console.warn('Tauri API unavailable, using localStorage fallback');
        }
      }

      // 始终更新本地缓存（用于快速访问）
      this.updateLocalCache(project);

      console.log('项目保存成功:', project.id);
      return true;
    } catch (error) {
      const errorMsg = handleError(error, '保存项目失败');
      console.error('保存项目失败:', errorMsg);
      message.error(`保存项目失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 从文件系统加载项目
   * @param id 项目ID
   * @returns 项目数据
   */
  async loadProject(id: string): Promise<ProjectData | null> {
    try {
      if (!id) {
        message.error('项目ID不能为空');
        return null;
      }

      // 先检查本地缓存
      const cachedProject = this.getFromLocalCache(id);
      if (cachedProject) {
        console.log('从本地缓存加载项目:', id);
        return cachedProject;
      }

      // 尝试调用 Tauri 命令加载文件
      if (invoke) {
        try {
          const content = await invoke('load_project_file', {
            projectId: id,
          });
          const project = JSON.parse(content as string) as ProjectData;
          // 更新本地缓存
          this.updateLocalCache(project);
          console.log('项目加载成功:', id);
          return project;
        } catch {
          console.warn('Tauri API unavailable, using localStorage fallback');
        }
      }

      // 降级到本地存储
      const localProject = storageService.projects.getById(id);
      if (localProject) {
        console.log('从本地存储加载项目:', id);
        return localProject;
      }

      return null;
    } catch (error) {
      const errorMsg = handleError(error, '加载项目失败');
      console.error('加载项目失败:', errorMsg);
      message.error(`加载项目失败: ${errorMsg}`);
      return null;
    }
  }

  /**
   * 从文件系统删除项目
   * @param id 项目ID
   * @returns 删除是否成功
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      if (!id) {
        message.error('项目ID不能为空');
        return false;
      }

      // 尝试调用 Tauri 命令删除文件
      if (invoke) {
        try {
          await invoke('delete_project_file', {
            projectId: id,
          });
        } catch {
          console.warn('Tauri API unavailable');
        }
      }

      // 清除本地缓存
      this.removeFromLocalCache(id);

      // 同时从 localStorage 中删除
      storageService.projects.delete(id);

      console.log('项目删除成功:', id);
      return true;
    } catch (error) {
      const errorMsg = handleError(error, '删除项目失败');
      console.error('删除项目失败:', errorMsg);
      message.error(`删除项目失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 列出所有项目
   * @returns 项目列表
   */
  async listProjects(): Promise<ProjectData[]> {
    try {
      // 尝试调用 Tauri 命令列出文件
      if (invoke) {
        try {
          const files = (await invoke('list_app_data_files', {
            directory: PROJECT_DIRECTORY,
          })) as string[];

          if (!files || !Array.isArray(files)) {
            return [];
          }

          // 过滤 JSON 文件并加载每个项目
          const jsonFiles = files.filter(file => file.endsWith('.json'));

          const projects: ProjectData[] = [];

          for (const file of jsonFiles) {
            try {
              const projectId = file.replace('.json', '');
              const project = await this.loadProject(projectId);
              if (project) {
                projects.push(project);
              }
            } catch (fileError) {
              console.error(`加载项目文件失败: ${file}`, fileError);
            }
          }

          // 按更新时间排序
          projects.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          return projects;
        } catch {
          console.warn('Tauri API unavailable, using localStorage fallback');
        }
      }

      // 降级到本地存储
      return storageService.projects.getAll();
    } catch (error) {
      const errorMsg = handleError(error, '获取项目列表失败');
      console.error('获取项目列表失败:', errorMsg);
      message.error(`获取项目列表失败: ${errorMsg}`);

      // 降级到本地存储
      return storageService.projects.getAll();
    }
  }

  /**
   * 导出项目到自定义位置
   * @param id 项目ID
   * @param customPath 可选的自定义路径
   * @returns 导出是否成功
   */
  async exportProject(id: string, customPath?: string): Promise<boolean> {
    try {
      if (!id) {
        message.error('项目ID不能为空');
        return false;
      }

      let exportPath = customPath;

      // 如果没有指定路径，弹出文件保存对话框
      if (!exportPath) {
        const project = await this.loadProject(id);
        if (!project) {
          message.error('项目不存在');
          return false;
        }

        // 尝试使用 Tauri 对话框
        if (saveDialog) {
          const selected = await saveDialog({
            defaultPath: `${project.name || id}.json`,
            filters: [
              { name: 'JSON 文件', extensions: ['json'] },
            ],
          });

          if (!selected) {
            console.log('用户取消导出');
            return false;
          }

          exportPath = selected as string;
        } else {
          // 降级到浏览器下载
          const content = JSON.stringify(project, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.name || id}.json`;
          a.click();
          URL.revokeObjectURL(url);
          console.log('项目导出成功(浏览器下载)');
          message.success('项目导出成功');
          return true;
        }
      }

      // 调用 Tauri 命令导出文件
      if (invoke) {
        try {
          await invoke('export_project_file', {
            projectId: id,
            exportPath,
          });
        } catch {
          console.warn('Tauri API export failed');
        }
      }

      console.log('项目导出成功:', exportPath);
      message.success('项目导出成功');
      return true;
    } catch (error) {
      const errorMsg = handleError(error, '导出项目失败');
      console.error('导出项目失败:', errorMsg);
      message.error(`导出项目失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 从自定义位置导入项目
   * @param customPath 可选的自定义路径
   * @returns 导入的项目数据
   */
  async importProject(customPath?: string): Promise<ProjectData | null> {
    try {
      let importPath = customPath;
      let project: ProjectData | null = null;

      // 如果没有指定路径，弹出文件选择对话框
      if (!importPath) {
        // 尝试使用 Tauri 对话框
        if (openDialog) {
          const selected = await openDialog({
            multiple: false,
            filters: [
              { name: 'JSON 文件', extensions: ['json'] },
            ],
          });

          if (!selected) {
            console.log('用户取消导入');
            return null;
          }

          importPath = Array.isArray(selected) ? selected[0] : selected;
        } else {
          // 降级到浏览器文件输入
          return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) {
                resolve(null);
                return;
              }
              try {
                const content = await file.text();
                project = JSON.parse(content) as ProjectData;
                // 生成新的项目ID和更新时间
                project.id = `imported_${Date.now()}`;
                project.createdAt = new Date().toISOString();
                project.updatedAt = new Date().toISOString();
                await this.saveProject(project);
                message.success('项目导入成功');
                resolve(project);
              } catch (err) {
                console.error('导入失败:', err);
                message.error('导入失败: 文件格式错误');
                resolve(null);
              }
            };
            input.click();
          });
        }
      }

      // 生成新的项目ID
      const newProjectId = `imported_${Date.now()}`;

      // 调用 Tauri 命令导入文件
      if (invoke) {
        try {
          const content = await invoke('import_project_file', {
            importPath,
            projectId: newProjectId,
          });
          project = JSON.parse(content as string) as ProjectData;
        } catch {
          console.warn('Tauri API import failed');
        }
      }

      if (!project) {
        message.error('导入失败');
        return null;
      }

      // 生成新的项目ID和更新时间
      project.id = newProjectId;
      project.createdAt = new Date().toISOString();
      project.updatedAt = new Date().toISOString();

      // 保存到应用数据目录
      await this.saveProject(project);

      console.log('项目导入成功:', project.id);
      message.success('项目导入成功');
      return project;
    } catch (error) {
      const errorMsg = handleError(error, '导入项目失败');
      console.error('导入项目失败:', errorMsg);
      message.error(`导入项目失败: ${errorMsg}`);
      return null;
    }
  }

  /**
   * 检查项目是否存在
   * @param id 项目ID
   * @returns 项目是否存在
   */
  async projectExists(id: string): Promise<boolean> {
    try {
      if (!id) return false;

      // 尝试使用 Tauri API
      if (invoke) {
        try {
          await invoke('load_project_file', {
            projectId: id,
          });
          return true;
        } catch {
          // Fall through to localStorage check
        }
      }

      // 降级到本地存储检查
      const project = storageService.projects.getById(id);
      return project !== null;
    } catch {
      return false;
    }
  }

  /**
   * 获取项目存储路径
   * @param id 项目ID
   * @returns 项目文件路径
   */
  async getProjectPath(id: string): Promise<string | null> {
    try {
      if (!id) return null;

      // 尝试使用 Tauri API
      if (invoke) {
        try {
          const appDataDir = (await invoke('check_app_data_directory')) as string;
          return `${appDataDir}/${PROJECT_DIRECTORY}/${id}.json`;
        } catch {
          console.warn('Tauri API unavailable');
        }
      }

      // 降级到浏览器本地存储路径
      return `localStorage://${PROJECT_DIRECTORY}/${id}.json`;
    } catch (error) {
      console.error('获取项目路径失败:', error);
      return null;
    }
  }

  /**
   * 清理项目数据，移除敏感信息
   */
  private sanitizeProject(project: ProjectData): ProjectData {
    type SensitiveProject = ProjectData & {
      apiKey?: string;
      aiModel?: {
        apiKey?: string;
        [key: string]: unknown;
      } | null;
    };
    const clean: SensitiveProject = { ...(project as SensitiveProject) };

    // 移除可能的敏感字段（如果存在）
    if ('apiKey' in clean) {
      delete clean.apiKey;
    }

    if ('aiModel' in clean && clean.aiModel) {
      const aiModel = { ...clean.aiModel };
      if (aiModel.apiKey) {
        aiModel.apiKey = undefined;
      }
      clean.aiModel = aiModel;
    }

    return clean as ProjectData;
  }

  /**
   * 从本地缓存获取项目
   */
  private getFromLocalCache(id: string): ProjectData | null {
    try {
      const cache = storageService.projects.getById(id);
      return cache;
    } catch {
      return null;
    }
  }

  /**
   * 更新本地缓存
   */
  private updateLocalCache(project: ProjectData): void {
    try {
      storageService.projects.save(project);
    } catch (error) {
      console.warn('更新本地缓存失败:', error);
    }
  }

  /**
   * 从本地缓存移除
   */
  private removeFromLocalCache(id: string): void {
    try {
      storageService.projects.delete(id);
    } catch (error) {
      console.warn('移除本地缓存失败:', error);
    }
  }
}

// 导出单例
export const fileStorageService = new FileStorageService();
export default fileStorageService;
