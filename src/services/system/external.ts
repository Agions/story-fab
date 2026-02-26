import { open as openExternal } from '@tauri-apps/api/shell';
import { message } from 'antd';

/**
 * 打开外部URL
 * @param url 要打开的URL
 * @returns 是否成功打开
 */
export const openExternalUrl = async (url: string): Promise<boolean> => {
  try {
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

/**
 * 检查FFmpeg是否已安装
 * @returns FFmpeg安装状态和版本信息
 */
export const checkFFmpeg = async (): Promise<{ installed: boolean; version?: string }> => {
  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    const result = await invoke<{ installed: boolean; version?: string }>('check_ffmpeg');
    return result;
  } catch (error) {
    console.error('检查FFmpeg失败:', error);
    return { installed: false };
  }
};
