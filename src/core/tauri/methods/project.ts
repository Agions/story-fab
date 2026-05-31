import { invoke, TauriCommand } from '../TauriBridge';

export const project = {
  /** 获取导出目录 */
  async getExportDir() {
    return invoke(TauriCommand.GET_EXPORT_DIR, {}) as Promise<string>;
  },

  /** 保存项目文件 */
  async saveProject(projectId: string, content: string) {
    return invoke(TauriCommand.PROJECT_SAVE, { projectId, content }) as Promise<void>;
  },

  /** 加载项目文件 */
  async loadProject(projectId: string) {
    return invoke(TauriCommand.PROJECT_LOAD, { projectId }) as Promise<string>;
  },

  /** 删除项目文件 */
  async deleteProject(projectId: string) {
    return invoke(TauriCommand.PROJECT_DELETE, { projectId }) as Promise<void>;
  },

  /** 列出所有项目 */
  async listProjects() {
    return invoke(TauriCommand.PROJECT_LIST, {}) as Promise<unknown[]>;
  },

  /** 列出应用数据目录中的文件 */
  async listAppDataFiles(directory: string) {
    return invoke(TauriCommand.LIST_APP_DATA_FILES, { directory }) as Promise<string[]>;
  },

  /** 检查应用数据目录是否存在 */
  async checkAppDataDir() {
    return invoke(TauriCommand.CHECK_APP_DATA_DIR, {}) as Promise<string>;
  },
};