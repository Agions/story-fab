/**
 * Lazy Loading Components
 * Provides optimized loading for images, videos, and heavy components
 */

import React, { useState, useEffect, useRef, type ReactNode } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: ReactNode;
  errorPlaceholder?: ReactNode;
  loadingStrategy?: 'blur' | 'placeholder' | 'spinner';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy loading image component with multiple loading strategies
 *
 * @example
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   loadingStrategy="blur"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  errorPlaceholder,
  loadingStrategy = 'placeholder',
  onLoad,
  onError,
  className,
  style,
  threshold = 0.1,
  rootMargin = '100px',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.(new Error('Failed to load image'));
  };

  const renderPlaceholder = () => {
    if (placeholder) return placeholder;

    if (loadingStrategy === 'blur') {
      return (
        <div
          style={{
            ...style,
            backgroundColor: '#f0f0f0',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      );
    }

    if (loadingStrategy === 'spinner') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            ...style,
          }}
        >
          <span>Loading...</span>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: '#f0f0f0',
          minHeight: '100px',
          ...style,
        }}
      />
    );
  };

  if (hasError && errorPlaceholder) {
    return <>{errorPlaceholder}</>;
  }

  if (!isInView) {
    return <div ref={imgRef} style={{ ...style, minHeight: '100px' }} />;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {!isLoaded && renderPlaceholder()}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

interface LazyVideoProps {
  src: string;
  poster?: string;
  placeholder?: ReactNode;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lazy loading video component
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  placeholder,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  className,
  style,
}) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isInView) {
    return (
      <div
        ref={containerRef}
        style={{
          backgroundColor: '#000',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        {placeholder || <span>Click to load video</span>}
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={poster}
      autoPlay={autoPlay}
      controls={controls}
      loop={loop}
      muted={muted}
      className={className}
      style={style}
    />
  );
};

interface LazyComponentProps {
  children: ReactNode;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy load any component
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px',
}) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  if (!isInView) {
    return (
      <div ref={containerRef} style={{ minHeight: '100px' }}>
        {placeholder || <div>Loading...</div>}
      </div>
    );
  }

  return <div ref={containerRef}>{children}</div>;
};

export default LazyImage;
