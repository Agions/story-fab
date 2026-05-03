import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger, { logger as loggerInstance } from './logging';

describe('logger', () => {
  beforeEach(() => {
    loggerInstance.clear();
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('getLogs', () => {
    it('should return all logs when no level specified', () => {
      logger.info('test message');
      const logs = loggerInstance.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test message');
    });

    it('should filter logs by level', () => {
      logger.info('info msg');
      logger.warn('warn msg');
      logger.error('error msg');

      const errorLogs = loggerInstance.getLogs('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('error msg');
    });

    it('should return empty array when no logs', () => {
      expect(loggerInstance.getLogs()).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      logger.info('msg1');
      logger.info('msg2');
      expect(loggerInstance.getLogs()).toHaveLength(2);

      loggerInstance.clear();
      expect(loggerInstance.getLogs()).toHaveLength(0);
    });
  });

  describe('log entry structure', () => {
    it('should create log entry with correct structure', () => {
      logger.info('test');
      const logs = loggerInstance.getLogs();
      expect(logs[0]).toHaveProperty('level', 'info');
      expect(logs[0]).toHaveProperty('message', 'test');
      expect(logs[0]).toHaveProperty('timestamp');
      expect(typeof logs[0].timestamp).toBe('string');
    });

    it('should include context when provided', () => {
      logger.info('test', { key: 'value' });
      const logs = loggerInstance.getLogs();
      expect(logs[0].context).toEqual({ key: 'value' });
    });
  });

  describe('max logs limit', () => {
    it('should not exceed MAX_LOGS limit of 1000', () => {
      for (let i = 0; i < 1005; i++) {
        logger.debug(`log ${i}`);
      }
      const logs = loggerInstance.getLogs('debug');
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });
});
