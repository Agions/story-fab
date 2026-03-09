/**
 * 优化的错误提示组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 错误提示靠近问题区域
 * - 清晰描述问题
 * - 可关闭
 * - 支持无障碍
 */

import React from 'react';
import { Alert } from 'antd';
import type { AlertProps } from 'antd';
import './ErrorMessage.less';

interface ErrorMessageProps extends AlertProps {
  /** 错误代码 */
  errorCode?: string;
  /** 可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否显示错误代码 */
  showCode?: boolean;
  /** 是否有恢复操作 */
  onRetry?: () => void;
}

/**
 * 优化的错误提示组件
 * - 错误提示靠近问题区域
 * - 清晰描述问题
 * - 支持重试操作
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  description,
  errorCode,
  showCode = true,
  onRetry,
  closable = true,
  onClose,
  type = 'error',
  ...props
}) => {
  // 构建完整的错误消息
  const fullMessage = message || '发生错误';
  
  // 构建描述
  const fullDescription = description ? (
    <div>
      <p>{description}</p>
      {showCode && errorCode && (
        <p className="error-code">
          错误代码: <code>{errorCode}</code>
        </p>
      )}
      {onRetry && (
        <button 
          onClick={onRetry}
          className="error-retry-btn"
          aria-label="重试"
        >
          重试
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <Alert
      message={fullMessage}
      description={fullDescription}
      type={type}
      closable={closable}
      onClose={onClose}
      showIcon
      role="alert"
      aria-live="assertive"
      {...props}
      className={`optimized-error-message ${props.className || ''}`}
    />
  );
};

/**
 * 紧凑错误消息 - 用于表单内
 */
export const InlineError: React.FC<{
  message: string;
  field?: string;
}> = ({ message, field }) => {
  return (
    <div 
      className="inline-error" 
      role="alert"
      aria-live="polite"
    >
      <span className="inline-error-icon">⚠️</span>
      <span className="inline-error-message">
        {field && <strong>{field}:</strong>} {message}
      </span>
    </div>
  );
};

export default ErrorMessage;
