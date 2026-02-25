/**
 * 图片懒加载组件
 * 使用 IntersectionObserver 实现
 */
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
}

export function LazyImage({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+',
  threshold = 0.1,
  alt = '',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      onLoad={handleLoad}
      style={{
        ...props.style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      {...props}
    />
  );
}

/**
 * 延迟渲染组件
 * 只在需要时渲染子组件
 */
interface LazyRenderProps {
  children: React.ReactNode;
  when: boolean;
}

export function LazyRender({ children, when }: LazyRenderProps) {
  const [shouldRender, setShouldRender] = useState(when);

  useEffect(() => {
    if (when && !shouldRender) {
      setShouldRender(true);
    }
  }, [when, shouldRender]);

  if (!shouldRender) return null;

  return <>{children}</>;
}

/**
 * 虚拟列表项
 * 用于大数据列表
 */
interface VirtualListItemProps<T> {
  item: T;
  index: number;
  style: React.CSSProperties;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualListItem<T>({ item, index, style, renderItem }: VirtualListItemProps<T>) {
  return (
    <div style={style}>
      {renderItem(item, index)}
    </div>
  );
}

export default { LazyImage, LazyRender, VirtualListItem };
