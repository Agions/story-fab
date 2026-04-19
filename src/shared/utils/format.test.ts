import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatDuration,
  formatFriendlyDuration,
  formatFileSize,
  formatDate,
  formatDateTime,
  formatDateCustom,
  formatNumber,
  formatPercent,
  truncateText,
  capitalize,
} from './format';

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format seconds only', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('should format hours with padding', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('should handle NaN', () => {
    expect(formatTime(NaN)).toBe('00:00');
  });

  it('should handle negative values', () => {
    expect(formatTime(-10)).toBe('00:00');
  });
});

describe('formatDuration', () => {
  it('should format 0 seconds', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('should format seconds only without leading zero padding', () => {
    expect(formatDuration(5)).toBe('00:05');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('02:05');
  });

  it('should format hours', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('should handle NaN', () => {
    expect(formatDuration(NaN)).toBe('00:00');
  });
});

describe('formatFriendlyDuration', () => {
  it('should format 0 seconds', () => {
    expect(formatFriendlyDuration(0)).toBe('0秒');
  });

  it('should format seconds only', () => {
    expect(formatFriendlyDuration(45)).toBe('45秒');
  });

  it('should format minutes', () => {
    expect(formatFriendlyDuration(90)).toBe('1分钟30秒');
  });

  it('should format hours and minutes', () => {
    expect(formatFriendlyDuration(3661)).toBe('1小时1分钟');
  });

  it('should format hours only', () => {
    expect(formatFriendlyDuration(7200)).toBe('2小时');
  });

  it('should handle NaN', () => {
    expect(formatFriendlyDuration(NaN)).toBe('0秒');
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });
});

describe('formatDate', () => {
  it('should format Date object', () => {
    const date = new Date('2026-04-19');
    expect(formatDate(date)).toBe('2026-04-19');
  });

  it('should format date string', () => {
    expect(formatDate('2026-04-19')).toBe('2026-04-19');
  });

  it('should pad single digit month and day', () => {
    const date = new Date('2026-01-05');
    expect(formatDate(date)).toBe('2026-01-05');
  });
});

describe('formatDateTime', () => {
  it('should format full datetime', () => {
    const date = new Date('2026-04-19T14:30:45');
    expect(formatDateTime(date)).toBe('2026-04-19 14:30:45');
  });

  it('should pad single digit values', () => {
    const date = new Date('2026-01-05T08:05:03');
    expect(formatDateTime(date)).toBe('2026-01-05 08:05:03');
  });
});

describe('formatDateCustom', () => {
  it('should use default format YYYY-MM-DD HH:mm', () => {
    const date = new Date('2026-04-19T14:30:00');
    expect(formatDateCustom(date)).toBe('2026-04-19 14:30');
  });

  it('should support custom format', () => {
    const date = new Date('2026-04-19T14:30:45');
    expect(formatDateCustom(date, 'YYYY/MM/DD')).toBe('2026/04/19');
    expect(formatDateCustom(date, 'HH:mm:ss')).toBe('14:30:45');
  });
});

describe('formatNumber', () => {
  it('should format with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });
});

describe('formatPercent', () => {
  it('should format as percentage', () => {
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(0.123)).toBe('12%');
  });

  it('should respect decimal places', () => {
    expect(formatPercent(0.123, 1)).toBe('12.3%');
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('should handle NaN', () => {
    expect(formatPercent(NaN)).toBe('0%');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should truncate with default suffix', () => {
    expect(truncateText('hello world', 8)).toBe('hello...');
  });

  it('should truncate with custom suffix', () => {
    // maxLength=8, suffix='…' (1 char) → 保留 7 chars + suffix = 8 chars total
    expect(truncateText('hello world', 8, '…')).toBe('hello w…');
  });

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should only capitalize first letter', () => {
    expect(capitalize('hello WORLD')).toBe('Hello WORLD');
  });

  it('should handle single character', () => {
    expect(capitalize('a')).toBe('A');
  });
});
