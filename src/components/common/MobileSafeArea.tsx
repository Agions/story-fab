/**
 * 移动端安全区域组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 适配刘海屏
 * - 适配底部 Home  indicator
 * - 确保触摸目标足够大
 * - 响应式断点
 */

import React from 'react';
import './MobileSafeArea.less';

interface MobileSafeAreaProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 是否启用顶部安全区域 */
  top?: boolean;
  /** 是否启用底部安全区域 */
  bottom?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 移动端安全区域组件
 * - 适配刘海屏 (env(safe-area-inset-top))
 * - 适配底部 Home indicator (env(safe-area-inset-bottom))
 * - 响应式断点
 */
export const MobileSafeArea: React.FC<MobileSafeAreaProps> = ({
  children,
  top = true,
  bottom = true,
  style,
  className = '',
}) => {
  // 检测是否为移动设备
  const isMobile = typeof window !== 'undefined' && 
    window.matchMedia('(max-width: 768px)').matches;

  // 检测是否为 iOS
  const isIOS = typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  // 样式
  const safeAreaStyle: React.CSSProperties = {
    ...(top && isIOS && isMobile ? { paddingTop: 'env(safe-area-inset-top)' } : {}),
    ...(bottom && isMobile ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}),
    ...style,
  };

  return (
    <div 
      className={`mobile-safe-area ${className}`}
      style={safeAreaStyle}
      // 通知屏幕阅读器
      role="region"
      aria-label={isMobile ? '移动端内容区域' : '内容区域'}
    >
      {children}
    </div>
  );
};

/**
 * 底部安全区域 - 常用于固定底部按钮
 */
export const MobileBottomSafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className = '' }) => {
  const isMobile = typeof window !== 'undefined' && 
    window.matchMedia('(max-width: 768px)').matches;

  const bottomStyle: React.CSSProperties = {
    paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
    ...style,
  };

  return (
    <div 
      className={`mobile-bottom-safe-area ${className}`}
      style={bottomStyle}
    >
      {children}
    </div>
  );
};

/**
 * 顶部安全区域 - 常用于固定顶部导航
 */
export const MobileTopSafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className = '' }) => {
  const isMobile = typeof window !== 'undefined' && 
    window.matchMedia('(max-width: 768px)').matches;

  const topStyle: React.CSSProperties = {
    paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : '12px',
    ...style,
  };

  return (
    <div 
      className={`mobile-top-safe-area ${className}`}
      style={topStyle}
    >
      {children}
    </div>
  );
};

export default MobileSafeArea;
