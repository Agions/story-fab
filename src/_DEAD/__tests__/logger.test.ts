import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger from '../logger';

describe('logger', () => {
  beforeEach(() => {
    logger.clear();
  });

  describe('log levels', () => {
    it('should export debug, info, warn, error functions', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should export getLogs function', () => {
      expect(typeof logger.getLogs).toBe('function');
    });

    it('should export clear function', () => {
      expect(typeof logger.clear).toBe('function');
    });
  });

  describe('getLogs', () => {
    it('should return empty array initially', () => {
      expect(logger.getLogs()).toEqual([]);
    });

    it('should return all logs without filter', () => {
      logger.info('test1');
      logger.warn('test2');
      logger.error('test3');
      expect(logger.getLogs().length).toBe(3);
    });

    it('should filter logs by level', () => {
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      const infoLogs = logger.getLogs('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].message).toBe('info message');
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      logger.info('test1');
      logger.info('test2');
      expect(logger.getLogs().length).toBe(2);
      
      logger.clear();
      expect(logger.getLogs().length).toBe(0);
    });
  });

  describe('log entry structure', () => {
    it('should create log entries with required fields', () => {
      logger.info('test message');
      const logs = logger.getLogs();
      
      expect(logs[0]).toHaveProperty('level', 'info');
      expect(logs[0]).toHaveProperty('message', 'test message');
      expect(logs[0]).toHaveProperty('timestamp');
      expect(typeof logs[0].timestamp).toBe('string');
    });

    it('should include context if provided', () => {
      logger.info('test', { key: 'value' });
      const logs = logger.getLogs();
      
      expect(logs[0]).toHaveProperty('context');
      expect(logs[0].context).toEqual({ key: 'value' });
    });
  });
});
