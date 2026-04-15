/**
 * 图片优化工具函数
 */

/**
 * 生成响应式图片 srcset
 * 支持多种分辨率
 */
export const generateSrcSet = (
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string => {
  // 如果是外部 URL 或已包含宽度参数，直接返回
  if (baseUrl.startsWith('http') || baseUrl.includes('&w=') || baseUrl.includes('?w=')) {
    return baseUrl;
  }

  // 移除已有的查询参数
  const urlWithoutQuery = baseUrl.split('?')[0];
  const ext = urlWithoutQuery.split('.').pop()?.toLowerCase() || '';

  // 支持的图片格式
  const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  if (!supportedExts.includes(ext)) {
    return baseUrl;
  }

  // 对于 GIF 不生成 srcset (不支持)
  if (ext === 'gif') {
    return baseUrl;
  }

  // 生成 srcset
  // 假设存在图片服务器支持参数调整宽度 (如 ?w=320)
  const srcSet = widths
    .map((w) => {
      const separator = urlWithoutQuery.includes('?') ? '&' : '?';
      return `${urlWithoutQuery}${separator}w=${w} ${w}w`;
    })
    .join(', ');

  return srcSet;
};

/**
 * 检查图片 URL 是否可以转换为 WebP
 * 注意：这只返回建议，实际转换需要在构建时或通过图片 CDN 完成
 */
export const canConvertToWebP = (url: string): boolean => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png'].includes(ext) && !url.includes('webp');
};

/**
 * 获取图片优化的建议尺寸
 */
export const getSuggestedSizes = (
  context: 'thumbnail' | 'preview' | 'full' = 'preview'
): number[] => {
  switch (context) {
    case 'thumbnail':
      return [160, 320];
    case 'preview':
      return [480, 720, 960];
    case 'full':
      return [1280, 1920, 2560];
    default:
      return [320, 640, 960, 1280];
  }
};

/**
 * 预加载图片
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 检查图片是否在视口内 (用于更精细的懒加载控制)
 */
export const isInViewport = (element: HTMLElement, threshold = 0): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= windowHeight * (1 + threshold) && rect.bottom >= 0;
};
