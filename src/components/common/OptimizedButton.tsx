/**
 * 优化后的按钮组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 无障碍支持 (aria-label, keyboard)
 * - 触摸目标 >= 44x44px
 * - 加载状态禁用
 * - 动画过渡 150-300ms
 */

import React, { useState } from 'react';
import { Button as AntButton, Spin } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import './OptimizedButton.less';

interface OptimizedButtonProps extends AntButtonProps {
  /** 加载状态 */
  loading?: boolean;
  /** 简化模式 */
  simplified?: boolean;
  /** 点击回调 */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * 优化按钮组件
 * - 最小触摸目标 44x44px
 * - 加载时禁用点击
 * - 支持 keyboard 导航
 * - 过渡动画 200ms
 */
export const OptimizedButton: React.FC<OptimizedButtonProps> = ({
  loading = false,
  disabled = false,
  children,
  onClick,
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // 处理点击事件
  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }

    // 如果有异步操作，显示加载状态
    if (onClick) {
      setIsLoading(true);
      try {
        await onClick(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 确保触摸目标足够大 (最小 44x44px)
  const buttonStyle: React.CSSProperties = {
    minHeight: '44px',
    minWidth: '44px',
    transition: 'all 200ms ease-in-out',
    ...style,
  };

  return (
    <AntButton
      {...props}
      disabled={disabled || loading || isLoading}
      onClick={handleClick}
      style={buttonStyle}
      // 无障碍支持
      aria-label={props['aria-label'] || props.title}
      aria-busy={loading || isLoading}
      // 确保键盘可聚焦
      tabIndex={disabled ? -1 : 0}
    >
      {(loading || isLoading) ? (
        <Spin size="small" aria-hidden="true" />
      ) : null}
      {children}
    </AntButton>
  );
};

export default OptimizedButton;
