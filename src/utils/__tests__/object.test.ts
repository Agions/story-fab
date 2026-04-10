import { describe, it, expect } from 'vitest';
import {
  deepClone,
  merge,
  pick,
  omit,
  mapKeys,
  mapValues,
  filter,
  find,
  entries,
  fromEntries,
  isEmpty,
  get,
  set,
} from '../object';

describe('object utils', () => {
  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, 3];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should handle nested arrays in objects', () => {
      const obj = { arr: [1, [2, 3]] };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned.arr).not.toBe(obj.arr);
      expect(cloned.arr[1]).not.toBe(obj.arr[1]);
    });
  });

  describe('merge', () => {
    it('should merge two objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      expect(merge(target, source)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge multiple sources', () => {
      const target = { a: 1 };
// @ts-ignore
      expect(merge(target, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should deeply merge nested objects', () => {
      const target = { a: { x: 1 } };
      const source = { a: { y: 2 }, b: 3 };
// @ts-ignore
      expect(merge(target, source)).toEqual({ a: { x: 1, y: 2 }, b: 3 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1 };
// @ts-ignore
      expect(pick(obj, ['a', 'b'])).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys to omit', () => {
      const obj = { a: 1, b: 2 };
// @ts-ignore
      expect(omit(obj, ['c'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('mapKeys', () => {
    it('should map keys using provided function', () => {
      const obj = { a: 1, b: 2 };
      expect(mapKeys(obj, (k) => k.toUpperCase())).toEqual({ A: 1, B: 2 });
    });
  });

  describe('mapValues', () => {
    it('should map values using provided function', () => {
      const obj = { a: 1, b: 2 };
      expect(mapValues(obj, (v) => v * 2)).toEqual({ a: 2, b: 4 });
    });
  });

  describe('filter', () => {
    it('should filter object entries', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(filter(obj, (v) => v > 1)).toEqual({ b: 2, c: 3 });
    });
  });

  describe('find', () => {
    it('should find first matching value', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(find(obj, (v) => v > 1)).toBe(2);
    });

    it('should return undefined if no match', () => {
      const obj = { a: 1 };
      expect(find(obj, (v) => v > 1)).toBe(undefined);
    });
  });

  describe('entries', () => {
    it('should convert object to entries', () => {
      const obj = { a: 1, b: 2 };
      expect(entries(obj)).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('fromEntries', () => {
    it('should convert entries to object', () => {
      const entries: Array<[string, number]> = [['a', 1], ['b', 2]];
      expect(fromEntries(entries)).toEqual({ a: 1, b: 2 });
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('get', () => {
    it('should get nested value using dot notation', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(get(obj, 'a.b.c')).toBe(42);
    });

    it('should return default value for missing path', () => {
      const obj = { a: 1 };
      expect(get(obj, 'b', 'default')).toBe('default');
    });
  });

  describe('set', () => {
    it('should set nested value', () => {
      const obj: Record<string, unknown> = { a: { b: 1 } };
      set(obj, 'a.b', 42);
      expect((obj.a as Record<string, unknown>).b).toBe(42);
    });
  });
});
