/**
 * 日志服务
 * 统一的日志记录
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

/**
 * 日志服务
 */
class Logger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableRemote: false,
  };

  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (level < this.config.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.config.enableConsole) {
      const prefix = `[${LogLevel[level]}]`;
      const color = this.getColor(level);
      console.log(`${color}%s%s%c`, prefix, message, 'color: inherit', ...(context ? [context] : []));
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // cyan
      case LogLevel.INFO: return '\x1b[32m'; // green
      case LogLevel.WARN: return '\x1b[33m'; // yellow
      case LogLevel.ERROR: return '\x1b[31m'; // red
      default: return '';
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(l => l.level === level);
    }
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
export default logger;
