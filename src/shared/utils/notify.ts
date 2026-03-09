import { message } from 'antd';

export const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    const text = error.message.trim();
    return text || fallback;
  }
  if (typeof error === 'string') {
    const text = error.trim();
    return text || fallback;
  }
  return fallback;
};

export const notify = {
  success: (content: string, key?: string) => message.success(key ? { content, key } : content),
  error: (error: unknown, fallback: string, key?: string) =>
    message.error(key ? { content: toErrorMessage(error, fallback), key } : toErrorMessage(error, fallback)),
  warning: (content: string, key?: string) => message.warning(key ? { content, key } : content),
  info: (content: string, key?: string) => message.info(key ? { content, key } : content),
  loading: (content: string, key: string) => message.loading({ content, key }),
};

