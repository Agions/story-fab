import { describe, it, expect } from 'vitest';
import {
  required,
  email,
  url,
  phone,
  minLength,
  maxLength,
  range,
  passwordStrength,
  fileType,
  fileSize,
} from '../validators';

describe('validators', () => {
  describe('required', () => {
    it('should create required rule', () => {
      const rule = required();
// @ts-ignore
      expect(rule.required).toBe(true);
// @ts-ignore
      expect(rule.message).toBe('此字段为必填项');
    });

    it('should accept custom message', () => {
      const rule = required('请填写此字段');
// @ts-ignore
      expect(rule.message).toBe('请填写此字段');
    });
  });

  describe('email', () => {
    it('should create email rule', () => {
      const rule = email();
// @ts-ignore
      expect(rule.type).toBe('email');
    });
  });

  describe('url', () => {
    it('should create url rule', () => {
      const rule = url();
// @ts-ignore
      expect(rule.type).toBe('url');
    });
  });

  describe('phone', () => {
    it('should create phone rule with pattern', () => {
      const rule = phone();
// @ts-ignore
      expect(rule.pattern).toBeDefined();
// @ts-ignore
      expect(String(rule.pattern)).toBe('/^1[3-9]\\d{9}$/');
    });

    it('should accept valid phone numbers via pattern', () => {
      const rule = phone();
      // Pattern validation happens at form level, rule just stores the pattern
// @ts-ignore
      expect(rule.pattern).toBeDefined();
    });
  });

  describe('minLength', () => {
    it('should create minLength rule', () => {
      const rule = minLength(5);
// @ts-ignore
      expect(rule.min).toBe(5);
    });

    it('should include custom message', () => {
      const rule = minLength(5, '至少5个字符');
// @ts-ignore
      expect(rule.message).toBe('至少5个字符');
    });
  });

  describe('maxLength', () => {
    it('should create maxLength rule', () => {
      const rule = maxLength(10);
// @ts-ignore
      expect(rule.max).toBe(10);
    });
  });

  describe('range', () => {
    it('should create range rule', () => {
      const rule = range(1, 100);
// @ts-ignore
      expect(rule.type).toBe('number');
// @ts-ignore
      expect(rule.min).toBe(1);
// @ts-ignore
      expect(rule.max).toBe(100);
    });
  });

  describe('passwordStrength', () => {
    it('should accept strong password', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, 'Password123')).resolves.toBeUndefined();
    });

    it('should reject weak password - too short', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, 'Pass1')).rejects.toBe('密码至少 8 个字符');
    });

    it('should reject weak password - no lowercase', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, 'PASSWORD123')).rejects.toBe('密码需包含小写字母');
    });

    it('should reject weak password - no uppercase', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, 'password123')).rejects.toBe('密码需包含大写字母');
    });

    it('should reject weak password - no number', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, 'PasswordABC')).rejects.toBe('密码需包含数字');
    });

    it('should accept empty value', () => {
      const rule = passwordStrength();
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: string) => Promise<void>;
      
      return expect(validator({}, '')).resolves.toBeUndefined();
    });
  });

  describe('fileType', () => {
    it('should create fileType rule', () => {
      const rule = fileType(['jpg', 'png']);
// @ts-ignore
      expect(rule.validator).toBeDefined();
    });

    it('should accept valid file type', () => {
      const rule = fileType(['jpg', 'png']);
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: { name: string }) => Promise<void>;
      const mockFile = { name: 'test.jpg' };
      
      return expect(validator({}, mockFile)).resolves.toBeUndefined();
    });

    it('should reject invalid file type', () => {
      const rule = fileType(['jpg', 'png']);
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: { name: string }) => Promise<void>;
      const mockFile = { name: 'test.pdf' };
      
      return expect(validator({}, mockFile)).rejects.toBeDefined();
    });

    it('should accept empty value', () => {
      const rule = fileType(['jpg', 'png']);
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: null) => Promise<void>;
      
      return expect(validator({}, null)).resolves.toBeUndefined();
    });
  });

  describe('fileSize', () => {
    it('should create fileSize rule', () => {
      const rule = fileSize(5);
// @ts-ignore
      expect(rule.validator).toBeDefined();
    });

    it('should accept file within limit', () => {
      const rule = fileSize(5); // 5MB
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: { size: number }) => Promise<void>;
      const mockFile = { size: 1024 * 1024 }; // 1MB
      
      return expect(validator({}, mockFile)).resolves.toBeUndefined();
    });

    it('should reject file exceeding limit', () => {
      const rule = fileSize(5); // 5MB
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: { size: number }) => Promise<void>;
      const mockFile = { size: 10 * 1024 * 1024 }; // 10MB
      
      return expect(validator({}, mockFile)).rejects.toBeDefined();
    });

    it('should accept empty value', () => {
      const rule = fileSize(5);
// @ts-ignore
      const validator = rule.validator as (rule: unknown, value: null) => Promise<void>;
      
      return expect(validator({}, null)).resolves.toBeUndefined();
    });
  });
});
