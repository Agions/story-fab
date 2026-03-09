/**
 * 优化的输入框组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 标签关联 (form-labels)
 * - 错误提示靠近输入框
 * - 键盘导航支持
 * - 触摸目标足够大
 */

import React, { useState } from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';
import './OptimizedInput.less';

interface OptimizedInputProps extends AntInputProps {
  /** 标签文本 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 是否必填 */
  required?: boolean;
  /** 输入框前缀 */
  prefix?: React.ReactNode;
  /** 输入框后缀 */
  suffix?: React.ReactNode;
}

/**
 * 优化的输入框组件
 * - 标签使用 label + for 关联
 * - 错误提示靠近输入框
 * - 最小触摸高度 44px
 */
export const OptimizedInput: React.FC<OptimizedInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  id,
  prefix,
  suffix,
  style,
  ...props
}) => {
  const [inputId] = useState(() => id || `input-${Math.random().toString(36).substr(2, 9)}`);
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    props.onBlur?.(e);
  };

  // 输入框容器样式
  const wrapperStyle: React.CSSProperties = {
    ...style,
  };

  // 标签样式
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
    color: error ? '#ff4d4f' : '#374151',
  };

  // 输入框样式 - 确保最小高度 44px
  const inputStyle: React.CSSProperties = {
    minHeight: '44px',
    borderColor: error ? '#ff4d4f' : focused ? '#6366f1' : '#d1d5db',
    borderRadius: '8px',
    transition: 'border-color 200ms ease',
  };

  // 错误提示样式 - 靠近输入框
  const errorStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: '#ff4d4f',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  // 帮助文本样式
  const helperStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  };

  return (
    <div className="optimized-input-wrapper" style={wrapperStyle}>
      {label && (
        <label 
          htmlFor={inputId} 
          style={labelStyle}
          className={required ? 'required' : ''}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}

      <AntInput
        id={inputId}
        {...props}
        prefix={prefix}
        suffix={suffix}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyle}
        // 无障碍
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
      />

      {/* 错误提示 - 靠近输入框 */}
      {error && (
        <div 
          id={`${inputId}-error`} 
          style={errorStyle}
          role="alert"
        >
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* 帮助文本 */}
      {helperText && !error && (
        <div 
          id={`${inputId}-helper`}
          style={helperStyle}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

export default OptimizedInput;
