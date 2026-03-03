import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
  formatFileSize,
  truncateText,
  formatFriendlyDuration,
  formatNumber,
  formatPercent,
} from '../format';

describe('format utils', () => {
  describe('formatDate', () => {
    it('should format date object correctly', () => {
      const date = new Date('2024-01-15T12:00:00');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should format date string correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
    });

    it('should handle ISO date string', () => {
      expect(formatDate('2024-01-15T00:00:00.000Z')).toBe('2024-01-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime object correctly', () => {
      const date = new Date('2024-01-15T14:30:45');
      expect(formatDateTime(date)).toBe('2024-01-15 14:30:45');
    });

    it('should format datetime string correctly', () => {
      expect(formatDateTime('2024-01-15T14:30:45')).toBe('2024-01-15 14:30:45');
    });
  });

  describe('formatTime', () => {
    it('should format seconds to mm:ss', () => {
      expect(formatTime(65)).toBe('01:05');
    });

    it('should handle zero seconds', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('should handle negative seconds', () => {
      expect(formatTime(-10)).toBe('00:00');
    });

    it('should handle NaN', () => {
      expect(formatTime(NaN)).toBe('00:00');
    });

    it('should format large values', () => {
      expect(formatTime(3600)).toBe('60:00');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to hh:mm:ss', () => {
      expect(formatDuration(3661)).toBe('01:01:01');
    });

    it('should omit hours when zero', () => {
      expect(formatDuration(125)).toBe('02:05');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('should handle negative values', () => {
      expect(formatDuration(-10)).toBe('00:00:00');
    });

    it('should handle NaN', () => {
      expect(formatDuration(NaN)).toBe('00:00:00');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('formatFriendlyDuration', () => {
    it('should format hours and minutes', () => {
      expect(formatFriendlyDuration(7200)).toBe('2小时');
    });

    it('should format minutes and seconds', () => {
      expect(formatFriendlyDuration(90)).toBe('1分钟30秒');
    });

    it('should format only seconds when less than a minute', () => {
      expect(formatFriendlyDuration(45)).toBe('45秒');
    });

    it('should format zero', () => {
      expect(formatFriendlyDuration(0)).toBe('0秒');
    });

    it('should handle negative values', () => {
      expect(formatFriendlyDuration(-10)).toBe('0秒');
    });

    it('should handle NaN', () => {
      expect(formatFriendlyDuration(NaN)).toBe('0秒');
    });
  });

  describe('formatNumber', () => {
    it('should add thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should format large numbers', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage', () => {
      expect(formatPercent(0.5)).toBe('50%');
    });

    it('should format with decimals', () => {
      expect(formatPercent(0.333, 2)).toBe('33.30%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0%');
    });

    it('should handle NaN', () => {
      expect(formatPercent(NaN)).toBe('0%');
    });

    it('should handle 100%', () => {
      expect(formatPercent(1)).toBe('100%');
    });
  });
});
