import { describe, it, expect } from 'vitest';
import {
  debounce,
  throttle,
  deepClone,
  generateId,
  detectFileType,
  isValidEmail,
  isValidURL,
  safeJSONParse,
  readNumberField,
  resolveProjectVideoPath,
  extractProjectMediaMetrics,
  pickPreferredSizeMb,
} from '../index';

describe('shared utils', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      let count = 0;
      const fn = debounce(() => { count++; }, 100);
      
      fn();
      fn();
      fn();
      
      expect(count).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(count).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', async () => {
      let count = 0;
      const fn = throttle(() => { count++; }, 50);
      
      fn();
      fn();
      fn();
      expect(count).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deepClone', () => {
    it('should clone primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, 3];
      expect(deepClone(arr)).toEqual(arr);
      expect(deepClone(arr)).not.toBe(arr);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone Date objects', () => {
      const date = new Date('2026-01-01');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('generateId', () => {
    it('should generate unique id', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should accept prefix', () => {
      const id = generateId('test');
      expect(id.startsWith('test_')).toBe(true);
    });
  });

  describe('detectFileType', () => {
    it('should detect video files', () => {
      expect(detectFileType('video.mp4')).toBe('video');
      expect(detectFileType('video.mov')).toBe('video');
      expect(detectFileType('video.avi')).toBe('video');
    });

    it('should detect audio files', () => {
      expect(detectFileType('audio.mp3')).toBe('audio');
      expect(detectFileType('audio.wav')).toBe('audio');
    });

    it('should detect image files', () => {
      expect(detectFileType('image.jpg')).toBe('image');
      expect(detectFileType('image.png')).toBe('image');
    });

    it('should detect subtitle files', () => {
      expect(detectFileType('sub.srt')).toBe('subtitle');
      expect(detectFileType('sub.vtt')).toBe('subtitle');
    });

    it('should return unknown for unrecognized files', () => {
      expect(detectFileType('file.xyz')).toBe('unknown');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('safeJSONParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJSONParse('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    });

    it('should return default value for invalid JSON', () => {
      expect(safeJSONParse('invalid', { a: 0 })).toEqual({ a: 0 });
    });
  });

  describe('readNumberField', () => {
    it('should read numbers', () => {
      expect(readNumberField(42)).toBe(42);
    });

    it('should parse string numbers', () => {
      expect(readNumberField('42')).toBe(42);
      expect(readNumberField('3.14')).toBe(3.14);
    });

    it('should return fallback for invalid input', () => {
      expect(readNumberField(null, 99)).toBe(99);
      expect(readNumberField(undefined, 99)).toBe(99);
      expect(readNumberField('invalid', 99)).toBe(99);
    });
  });

  describe('resolveProjectVideoPath', () => {
    it('should return videoPath if present', () => {
      const project = { videoPath: '/path/to/video.mp4' };
      expect(resolveProjectVideoPath(project)).toBe('/path/to/video.mp4');
    });

    it('should fall back to first video in videos array', () => {
      const project = { videos: [{ path: '/path/to/video.mp4' }] };
      expect(resolveProjectVideoPath(project)).toBe('/path/to/video.mp4');
    });

    it('should return empty string if no video path', () => {
      const project = {};
      expect(resolveProjectVideoPath(project)).toBe('');
    });
  });

  describe('extractProjectMediaMetrics', () => {
    it('should extract duration and size', () => {
      const project = {
        metadata: { duration: 120, bitrate: 5000000 },
        sizeMb: 75,
      };
      const result = extractProjectMediaMetrics(project);
      expect(result.durationSec).toBe(120);
      expect(result.explicitSizeMb).toBe(75);
    });

    it('should estimate size from bitrate and duration', () => {
      const project = {
        metadata: { duration: 8, bitrate: 1000000 },
      };
      const result = extractProjectMediaMetrics(project);
      // 1Mbps * 8sec / 8 / 1024 / 1024 ≈ 0.9537MB
      expect(result.estimatedSizeMb).toBeCloseTo(0.95, 1);
    });
  });

  describe('pickPreferredSizeMb', () => {
    it('should prefer exact size', () => {
      expect(pickPreferredSizeMb(100, 75, 50)).toBe(100);
    });

    it('should fall back to explicit size', () => {
      expect(pickPreferredSizeMb(0, 75, 50)).toBe(75);
    });

    it('should use estimated size as last resort', () => {
      expect(pickPreferredSizeMb(0, 0, 50)).toBe(50);
    });
  });
});
