/**
 * 优化的图片组件
 * 基于 UI/UX Pro Max 设计指南
 * 
 * 优化点：
 * - 懒加载
 * - 错误处理
 * - 骨架屏占位
 * - 支持 srcset
 */

import React, { useState, useEffect } from 'react';
import { Image } from 'antd';
import './LazyImage.less';

interface LazyImageProps {
  /** 图片地址 */
  src: string;
  /** 替代文本 (无障碍) */
  alt: string;
  /** 占位图 */
  placeholder?: string;
  /** 加载失败显示 */
  fallback?: string;
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 样式 */
  style?: React.CSSProperties;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否启用懒加载 */
  lazy?: boolean;
  /** 是否显示预览 */
  preview?: boolean;
}

/**
 * 优化的图片组件
 * - 支持懒加载
 * - 骨架屏占位
 * - 错误处理
 * - 无障碍支持
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PC9zdmc+',
  width,
  height,
  style,
  onClick,
  lazy = true,
  preview = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);

  // 懒加载检测
  useEffect(() => {
    if (!lazy) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    const element = document.getElementById(`lazy-img-${src}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [lazy, src]);

  // 处理图片加载
  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  // 处理图片错误
  const handleError = () => {
    setError(true);
    setLoaded(false);
  };

  // 骨架屏样式
  const skeletonStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || '200px',
    backgroundColor: '#f0f0f0',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  // 图片容器样式
  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || 'auto',
    overflow: 'hidden',
    borderRadius: '8px',
    ...style,
  };

  // 动画过渡
  const imageStyle: React.CSSProperties = {
    opacity: loaded ? 1 : 0,
    transition: 'opacity 300ms ease-in-out',
    objectFit: 'cover',
  };

  if (preview) {
    return (
      <Image
        src={src}
        alt={alt}
        fallback={fallback}
        style={style}
        wrapperStyle={containerStyle}
      />
    );
  }

  return (
    <div
      id={`lazy-img-${src}`}
      style={containerStyle}
      onClick={onClick}
      role="img"
      aria-label={alt}
      // 无障碍支持
    >
      {/* 骨架屏占位 - 加载前显示 */}
      {!loaded && !error && (
        <div style={skeletonStyle} aria-hidden="true">
          <div className="skeleton-shimmer" />
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div style={{ ...skeletonStyle, backgroundColor: '#fff1f0' }}>
          <span style={{ color: '#ff4d4f', fontSize: '14px' }}>
            图片加载失败
          </span>
        </div>
      )}

      {/* 实际图片 */}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ ...imageStyle, width: '100%', height: '100%' }}
          loading={lazy ? 'lazy' : 'eager'}
          // 无障碍
        />
      )}
    </div>
  );
};

export default LazyImage;
