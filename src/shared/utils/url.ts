/**
 * URL utilities — open external URLs with security checks.
 */
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { logger } from '@/shared/utils/logging';

const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const isSafeUrl = (url: string): boolean => {
  try {
    const lower = url.toLowerCase();
    if (BLOCKED_PROTOCOLS.some(p => lower.startsWith(p))) return false;
    const urlObj = new URL(url);
    return ALLOWED_PROTOCOLS.includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const openExternalUrl = async (url: string): Promise<boolean> => {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
  if (!isSafeUrl(withProtocol)) {
    logger.error('openExternalUrl: blocked unsafe URL', { url: withProtocol });
    return false;
  }
  try {
    logger.info(`正在打开外部链接: ${withProtocol}`);
    await openExternal(withProtocol);
    return true;
  } catch (error) {
    logger.error('打开外部链接失败:', error);
    try {
      window.open(withProtocol, '_blank', 'noopener,noreferrer');
      logger.info('通过window.open打开链接');
      return true;
    } catch (windowError) {
      logger.error('无法打开链接:', windowError);
      return false;
    }
  }
};