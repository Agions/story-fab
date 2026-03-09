/**
 * 优化的加载状态组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 骨架屏加载
 * - 减少内容跳动 (content-jumping)
 * - 支持 prefers-reduced-motion
 */

import React from 'react';
import './LoadingState.less';

interface LoadingStateProps {
  /** 加载类型 */
  type?: 'skeleton' | 'spinner' | 'progress';
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  borderRadius?: number;
  /** 是否活跃 (动画) */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 骨架屏加载组件
 * - 固定占位空间，减少内容跳动
 * - 支持动画 (可关闭以支持 prefers-reduced-motion)
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'skeleton',
  width = '100%',
  height = '20px',
  borderRadius = 4,
  active = true,
  className = '',
}) => {
  // 检查用户是否偏好减少动画
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
  };

  // 骨架屏
  if (type === 'skeleton') {
    return (
      <div
        className={`loading-skeleton ${active && !prefersReducedMotion ? 'active' : ''} ${className}`}
        style={baseStyle}
        role="status"
        aria-label="加载中"
      />
    );
  }

  // 加载中
  if (type === 'spinner') {
    return (
      <div
        className={`loading-spinner ${className}`}
        style={baseStyle}
        role="status"
        aria-label="加载中"
      >
        <div className="spinner-circle" />
      </div>
    );
  }

  // 进度条
  if (type === 'progress') {
    return (
      <div
        className={`loading-progress ${className}`}
        style={baseStyle}
        role="progressbar"
        aria-valuenow={0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className="progress-bar" 
          style={{ 
            animation: prefersReducedMotion ? 'none' : undefined 
          }} 
        />
      </div>
    );
  }

  return null;
};

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC<{
  title?: boolean;
  description?: boolean;
  avatar?: boolean;
  actions?: number;
  className?: string;
}> = ({
  title = true,
  description = true,
  avatar = false,
  actions = 0,
  className = '',
}) => {
  return (
    <div className={`card-skeleton ${className}`}>
      {avatar && (
        <div className="skeleton-avatar">
          <LoadingState type="skeleton" width={40} height={40} borderRadius={20} />
        </div>
      )}
      {title && (
        <LoadingState type="skeleton" width="60%" height={20} style={{ marginBottom: 8 }} />
      )}
      {description && (
        <LoadingState type="skeleton" width="100%" height={14} style={{ marginBottom: 6 }} />
      )}
      {description && (
        <LoadingState type="skeleton" width="80%" height={14} />
      )}
      {actions > 0 && (
        <div className="skeleton-actions">
          {Array.from({ length: actions }).map((_, i) => (
            <LoadingState 
              key={i}
              type="skeleton" 
              width={60} 
              height={32} 
              borderRadius={4}
              style={{ marginRight: 8 }} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className = '' }) => {
  return (
    <div className={`list-skeleton ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} avatar description={false} />
      ))}
    </div>
  );
};

export default LoadingState;
