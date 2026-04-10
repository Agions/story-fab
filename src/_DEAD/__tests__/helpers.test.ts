// @ts-ignore
import { describe, it, expect, vi, beforeEach, afterEach, fakeTimers } from 'vitest';
import {
  generateId,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  sleep,
  randomString,
  truncate,
  isValidUrl,
  getFileExtension,
  isValidFileType,
  unique,
  groupBy,
  sortBy,
  padZero,
  clamp,
  randomInt,
  shuffle,
  isSameDay,
  get,
  debounceWithCancel,
  throttleWithCancel,
} from '../helpers';

describe('helpers utils', () => {
  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate id with prefix', () => {
      const id = generateId('test-');
      expect(id.startsWith('test-')).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should only call function once for multiple calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not execute again within limit', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should execute again after limit', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('should clone object deeply', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should handle primitives', () => {
      expect(deepClone(1)).toBe(1);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null/undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty array/string', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty('')).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      vi.useFakeTimers();

      const promise = sleep(100);
      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('randomString', () => {
    it('should generate string of specified length', () => {
      const result = randomString(10);
      expect(result.length).toBe(10);
    });

    it('should generate different strings', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(randomString(8));
      }
      expect(results.size).toBe(100);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('test.txt')).toBe('txt');
      expect(getFileExtension('image.PNG')).toBe('png');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('test')).toBe('');
    });
  });

  describe('isValidFileType', () => {
    it('should validate file types', () => {
      expect(isValidFileType('test.txt', ['txt', 'md'])).toBe(true);
      expect(isValidFileType('test.TXT', ['txt', 'md'])).toBe(true);
      expect(isValidFileType('test.jpg', ['txt', 'md'])).toBe(false);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('groupBy', () => {
    it('should group array items by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];

      const grouped = groupBy(items, 'type');

      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort array by key', () => {
      const items = [
        { name: 'b', value: 2 },
        { name: 'a', value: 1 },
      ];

      const sorted = sortBy(items, 'name');

      expect(sorted[0].name).toBe('a');
    });

    it('should sort by multiple keys', () => {
      const items = [
        { name: 'a', value: 2 },
        { name: 'a', value: 1 },
        { name: 'b', value: 1 },
      ];

// @ts-ignore
      const sorted = sortBy(items, 'name', 'value');

      expect(sorted[0].value).toBe(1);
    });
  });

  describe('padZero', () => {
    it('should pad number with zeros', () => {
      expect(padZero(5)).toBe('05');
      expect(padZero(5, 3)).toBe('005');
      expect(padZero(15)).toBe('15');
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('randomInt', () => {
    it('should generate random integer in range', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 3);
        results.add(result);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(3);
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled.length).toBe(original.length);
      expect(new Set(shuffled).size).toBe(original.length);
    });

    it('should not mutate original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffle(original);

      expect(original).toEqual(originalCopy);
    });
  });

  describe('isSameDay', () => {
    it('should compare dates on same day', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-15T22:30:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('get', () => {
    it('should get nested property', () => {
      const obj = { a: { b: { c: 42 } } };

      expect(get(obj, 'a.b.c')).toBe(42);
    });

    it('should return default value for missing path', () => {
      const obj = { a: 1 };

      expect(get(obj, 'b.c', 'default')).toBe('default');
    });

    it('should return undefined for missing path without default', () => {
      const obj = { a: 1 };

      expect(get(obj, 'b.c')).toBeUndefined();
    });
  });

  describe('debounceWithCancel', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should cancel debounced function', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithCancel(fn, 100);

      debouncedFn();
      debouncedFn.cancel();

      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('throttleWithCancel', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should cancel throttled function', () => {
      const fn = vi.fn();
      const throttledFn = throttleWithCancel(fn, 100);

      throttledFn();
      throttledFn.cancel();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should flush throttled function', () => {
      const fn = vi.fn();
      const throttledFn = throttleWithCancel(fn, 100);

      throttledFn();
      throttledFn();

      vi.advanceTimersByTime(50);
      throttledFn.flush();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
