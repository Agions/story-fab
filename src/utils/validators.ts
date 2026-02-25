/**
 * 表单验证工具
 */
import type { Rule } from 'antd/es/form';

/**
 * 必填验证
 */
export const required = (message = '此字段为必填项'): Rule => ({
  required: true,
  message,
});

/**
 * 邮箱验证
 */
export const email = (message = '请输入正确的邮箱格式'): Rule => ({
  type: 'email',
  message,
});

/**
 * URL 验证
 */
export const url = (message = '请输入正确的 URL'): Rule => ({
  type: 'url',
  message,
});

/**
 * 手机号验证
 */
export const phone = (message = '请输入正确的手机号'): Rule => ({
  pattern: /^1[3-9]\d{9}$/,
  message,
});

/**
 * 最小长度验证
 */
export const minLength = (min: number, message?: string): Rule => ({
  min,
  message: message || `最少 ${min} 个字符`,
});

/**
 * 最大长度验证
 */
export const maxLength = (max: number, message?: string): Rule => ({
  max,
  message: message || `最多 ${max} 个字符`,
});

/**
 * 数字范围验证
 */
export const range = (min: number, max: number, message?: string): Rule => ({
  type: 'number',
  min,
  max,
  message: message || `数值必须在 ${min} - ${max} 之间`,
});

/**
 * 自定义验证
 */
export const validator = (
  validator: (value: any) => Promise<void>,
  message = '验证失败'
): Rule => ({
  validator: async (_, value) => {
    if (value) {
      await validator(value);
    }
  },
  message,
});

/**
 * 密码强度验证
 */
export const passwordStrength = (): Rule => ({
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    if (value.length < 8) {
      return Promise.reject('密码至少 8 个字符');
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject('密码需包含小写字母');
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject('密码需包含大写字母');
    }
    if (!/\d/.test(value)) {
      return Promise.reject('密码需包含数字');
    }
    return Promise.resolve();
  },
});

/**
 * 确认密码验证
 */
export const confirmPassword = (getFieldValue: (name: string) => any, field: string): Rule => ({
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    if (value !== getFieldValue(field)) {
      return Promise.reject('两次输入的密码不一致');
    }
    return Promise.resolve();
  },
});

/**
 * 文件类型验证
 */
export const fileType = (types: string[], message?: string): Rule => ({
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    const fileType = value.name.split('.').pop()?.toLowerCase();
    if (!types.includes(fileType || '')) {
      return Promise.reject(message || `只支持 ${types.join(', ')} 格式`);
    }
    return Promise.resolve();
  },
});

/**
 * 文件大小验证
 */
export const fileSize = (maxMB: number, message?: string): Rule => ({
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    const sizeMB = value.size / 1024 / 1024;
    if (sizeMB > maxMB) {
      return Promise.reject(message || `文件大小不能超过 ${maxMB}MB`);
    }
    return Promise.resolve();
  },
});
