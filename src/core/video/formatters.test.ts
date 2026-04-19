import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatResolution,
  formatBitrate,
  formatFileSize,
} from './formatters';

describe('video formatters', () => {
  describe('formatDuration', () => {
    it('should format 0 seconds', () => {
      expect(formatDuration(0)).toBe('00:00');
    });

    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('00:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('02:05');
    });

    it('should format hours', () => {
      expect(formatDuration(3661)).toBe('01:01:01');
    });

    it('should pad single digits', () => {
      expect(formatDuration(61)).toBe('01:01');
    });
  });

  describe('formatResolution', () => {
    it('should format 4K UHD', () => {
      expect(formatResolution(3840, 2160)).toBe('3840x2160 (4K UHD)');
    });

    it('should format 2K QHD', () => {
      expect(formatResolution(2560, 1440)).toBe('2560x1440 (2K QHD)');
    });

    it('should format 1080p', () => {
      expect(formatResolution(1920, 1080)).toBe('1920x1080 (1080p)');
    });

    it('should format 720p', () => {
      expect(formatResolution(1280, 720)).toBe('1280x720 (720p)');
    });

    it('should format 480p', () => {
      expect(formatResolution(720, 480)).toBe('720x480 (480p)');
    });

    it('should return raw resolution for unknown dimensions', () => {
      expect(formatResolution(1024, 768)).toBe('1024x768');
    });
  });

  describe('formatBitrate', () => {
    it('should format bps', () => {
      expect(formatBitrate(500)).toBe('500 bps');
    });

    it('should format Kbps', () => {
      expect(formatBitrate(1500)).toBe('2 Kbps');
      expect(formatBitrate(256000)).toBe('256 Kbps');
    });

    it('should format Mbps', () => {
      expect(formatBitrate(1_000_000)).toBe('1.0 Mbps');
      expect(formatBitrate(5_000_000)).toBe('5.0 Mbps');
      expect(formatBitrate(10_500_000)).toBe('10.5 Mbps');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format KB', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format MB', () => {
      expect(formatFileSize(1_048_576)).toBe('1.00 MB');
      expect(formatFileSize(5_242_880)).toBe('5.00 MB');
    });

    it('should format GB', () => {
      expect(formatFileSize(1_073_741_824)).toBe('1.00 GB');
      expect(formatFileSize(2_147_483_648)).toBe('2.00 GB');
    });
  });
});
