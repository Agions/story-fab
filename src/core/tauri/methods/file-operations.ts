import { invoke, TauriCommand } from '../invoke';

export const fileOperations = {
  /** 读取文本文件 */
  async readTextFile(path: string): Promise<string> {
    return invoke(TauriCommand.FILE_READ, { path }) as Promise<string>;
  },

  /** 写入文本文件 */
  async writeTextFile(path: string, content: string): Promise<void> {
    await invoke(TauriCommand.FILE_WRITE, { path, content });
  },

  /** 删除文件 */
  async deleteFile(path: string): Promise<boolean> {
    return invoke(TauriCommand.FILE_DELETE, { path }) as Promise<boolean>;
  },

  /** 检查文件是否存在 */
  async fileExists(path: string): Promise<boolean> {
    return invoke(TauriCommand.FILE_EXISTS, { path }) as Promise<boolean>;
  },

  /** 清理临时文件 */
  async cleanTempFile(path: string): Promise<void> {
    await invoke(TauriCommand.CLEAN_TEMP_FILE, { path });
  },

  /** 打开文件 */
  async openFile(path: string): Promise<void> {
    await invoke(TauriCommand.OPEN_FILE, { path });
  },

  /** 语音发现（edge-tts 无发现 API，恒返回空列表） */
  async voiceDiscovery(): Promise<Array<{ name: string; locale: string; gender: string }>> {
    const { voices } = await invoke(TauriCommand.VOICE_DISCOVERY, undefined);
    return voices;
  },

  /** 获取文件大小 */
  async getFileSize(path: string): Promise<number> {
    return invoke(TauriCommand.GET_FILE_SIZE, { path }) as Promise<number>;
  },
};
