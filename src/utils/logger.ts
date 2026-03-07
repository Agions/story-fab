type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;

const shouldLog = (level: LogLevel): boolean => {
  if (isDev) return true;
  return level === 'warn' || level === 'error';
};

const write = (level: LogLevel, ...args: unknown[]) => {
  if (!shouldLog(level)) return;
  if (level === 'debug') {
    console.log(...args);
    return;
  }
  console[level](...args);
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', ...args),
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
};

