import { invoke, TauriCommand } from '../TauriBridge';

export const fileOperations = {
  /** 读取文本文件 */
  async readTextFile(path: string) {
    return invoke(TauriCommand.FILE_READ, { path }) as Promise<string>;
  },

  /** 写入文本文件 */
  async writeTextFile(path: string, content: string) {
    return invoke(TauriCommand.FILE_WRITE, { path, content }) as Promise<void>;
  },

  /** 删除文件 */
  async deleteFile(path: string) {
    return invoke(TauriCommand.FILE_DELETE, { path }) as Promise<void>;
  },

  /** 清理临时文件 */
  async cleanTempFile(path: string) {
    return invoke(TauriCommand.CLEAN_TEMP_FILE, { path }) as Promise<void>;
  },

  /** 用系统默认应用打开文件 */
  async openFile(path: string) {
    return invoke(TauriCommand.OPEN_FILE, { path }) as Promise<void>;
  },

  /** 获取文件大小（字节） */
  async getFileSize(path: string) {
    return invoke(TauriCommand.GET_FILE_SIZE, { path }) as Promise<number>;
  },

  /** 语音发现（枚举可用 TTS 引擎） */
  async voiceDiscovery() {
    return invoke(TauriCommand.VOICE_DISCOVERY, {});
  },
};