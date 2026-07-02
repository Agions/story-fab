import { invoke, TauriCommand } from '../invoke';

export const project = {
  /** 获取导出目录 */
  async getExportDir(): Promise<string> {
    return invoke(TauriCommand.GET_EXPORT_DIR, undefined);
  },

  /** 保存项目文件 */
  async saveProjectFile(projectId: string, content: string): Promise<boolean> {
    return invoke(TauriCommand.PROJECT_SAVE, { projectId, content });
  },

  /** 加载项目文件 */
  async loadProjectFile(projectId: string): Promise<string> {
    return invoke(TauriCommand.PROJECT_LOAD, { projectId });
  },

  /** 删除项目文件 */
  async deleteProjectFile(projectId: string): Promise<boolean> {
    return invoke(TauriCommand.PROJECT_DELETE, { projectId });
  },

  /** 列出项目文件 */
  async listProjectFiles(): Promise<Array<{ id: string; [key: string]: unknown }>> {
    return invoke(TauriCommand.PROJECT_LIST, undefined);
  },

  /** 列出应用数据文件 */
  async listAppDataFiles(directory: string): Promise<string[]> {
    return invoke(TauriCommand.LIST_APP_DATA_FILES, { directory });
  },

  /** 检查应用数据目录 */
  async checkAppDataDirectory(): Promise<string> {
    return invoke(TauriCommand.CHECK_APP_DATA_DIR, undefined);
  },
};

