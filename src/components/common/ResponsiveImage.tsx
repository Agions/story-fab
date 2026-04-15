import React, { useState } from 'react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 基础图片 URL */
  src: string;
  /** 响应式图片配置 */
  sizes?: string;
  /** 低质量占位图 URL (可选) */
  placeholderSrc?: string;
  /** 是否启用懒加载 (默认true) */
  lazy?: boolean;
}

/**
 * 响应式图片组件
 * - 自动添加 loading="lazy" 和 decoding="async"
 * - 支持 srcset 和 sizes 属性
 * - 可选低质量占位图
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  srcSet,
  sizes = '100vw',
  alt,
  placeholderSrc,
  lazy = true,
  className,
  style,
  onClick,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setIsError(true);

  // 如果有占位图且未加载完成，显示占位图
  const showPlaceholder = placeholderSrc && !isLoaded && !isError;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {/* 占位图 */}
      {showPlaceholder && (
        <img
          src={placeholderSrc}
          alt={alt}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(8px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* 主图 */}
      {!isError && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          decoding={lazy ? 'async' : 'sync'}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          {...rest}
        />
      )}

      {/* 加载失败占位 */}
      {isError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            color: '#999',
            fontSize: '14px',
          }}
        >
          图片加载失败
        </div>
      )}
    </div>
  );
};

export default ResponsiveImage;
