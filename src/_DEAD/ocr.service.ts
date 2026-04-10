/**
 * OCR (光学字符识别) 服务
 * 支持 Tesseract.js (浏览器端) 和阿里云 OCR
 */

import { BaseService } from './base.service';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResponse {
  results: OCRResult[];
  language: string;
  fullText: string;
}

export interface OCROptions {
  language?: 'eng' | 'chi_sim' | 'chi_tra' | 'jpn' | 'kor';
 PSM?: number;  // Page Segmentation Mode
  OEM?: number;  // OCR Engine Mode
}

export interface OCRProviderConfig {
  provider: 'browser' | 'aliyun';
  apiKey?: string;
  apiSecret?: string;
}

// Tesseract.js Worker 类型
interface TesseractWorker {
  recognize: (image: string | Blob | File) => Promise<{
    data: {
      text: string;
      confidence: number;
      words: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>;
    };
  }>;
  terminate: () => Promise<void>;
}

// Tesseract.js 类型声明
declare global {
  interface Window {
    Tesseract: {
      createWorker: (lang: string, options?: object) => Promise<TesseractWorker>;
    };
  }
}

export class OCRService extends BaseService {
  private ocrConfig: OCRProviderConfig | null = null;
  private tesseractWorker: TesseractWorker | null = null;
  private isLoading = false;

  constructor() {
    super('OCRService', { timeout: 60000, retries: 1 });
  }

  /**
   * 配置 OCR 服务
   */
  configure(config: OCRProviderConfig): void {
    this.ocrConfig = config;
    logger.info('OCR 服务已配置', { provider: config.provider });
  }

  /**
   * 获取当前配置
   */
  getConfig(): OCRProviderConfig | null {
    return this.ocrConfig;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    if (!this.ocrConfig) return false;
    if (this.ocrConfig.provider === 'browser') {
      return typeof window !== 'undefined' && !!(window as any).Tesseract;
    }
    if (this.ocrConfig.provider === 'aliyun') {
      return !!this.ocrConfig.apiKey && !!this.ocrConfig.apiSecret;
    }
    return false;
  }

  /**
   * 初始化 Tesseract Worker (浏览器端)
   */
  private async initTesseractWorker(options: OCROptions = {}): Promise<any> {
    if (this.tesseractWorker) {
      return this.tesseractWorker;
    }

    if (this.isLoading) {
      // 等待加载完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.initTesseractWorker(options);
    }

    this.isLoading = true;

    try {
      // 动态加载 Tesseract.js
      if (!window.Tesseract) {
        await this.loadTesseractJS();
      }

      const lang = options.language || 'chi_sim';
      this.tesseractWorker = await window.Tesseract.createWorker(lang, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            logger.debug('OCR 进度', { progress: Math.round(m.progress * 100) });
          }
        },
        ...options,
      });

      return this.tesseractWorker;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 加载 Tesseract.js
   */
  private loadTesseractJS(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('无法加载 Tesseract.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * 识别图像中的文字
   */
  async recognize(
    image: string | Blob | File,
    options: OCROptions = {}
  ): Promise<OCRResponse> {
    const provider = this.ocrConfig?.provider || 'browser';

    switch (provider) {
      case 'browser':
        return this.recognizeWithBrowser(image, options);
      case 'aliyun':
        return this.recognizeWithAliyun(image, options);
      default:
        throw new Error(`不支持的 OCR 提供商: ${provider}`);
    }
  }

  /**
   * 使用 Tesseract.js (浏览器端)
   */
  private async recognizeWithBrowser(
    image: string | Blob | File,
    options: OCROptions
  ): Promise<OCRResponse> {
    try {
      const worker = await this.initTesseractWorker(options);
      
      const result = await worker.recognize(image);
      
      const results: OCRResult[] = [];
      
      if (result.data.words) {
        for (const word of result.data.words) {
          results.push({
            id: uuidv4(),
            text: word.text,
            confidence: word.confidence,
            boundingBox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            },
          });
        }
      }

      return {
        results,
        language: options.language || 'chi_sim',
        fullText: result.data.text,
      };
    } catch (error) {
      logger.error('Tesseract OCR 失败:', error);
      throw error;
    }
  }

  /**
   * 使用阿里云 OCR
   */
  private async recognizeWithAliyun(
    image: string | Blob | File,
    options: OCROptions
  ): Promise<OCRResponse> {
    const { apiKey, apiSecret } = this.ocrConfig!;

    // 将图像转换为 base64
    const base64Image = await this.blobToBase64(image as Blob);

    // 阿里云 OCR API
    const apiUrl = 'https://ocrapi.cn-hangzhou.aliyuncs.com/api/v2/ocr/character';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `APPCODE ${apiKey}`,
        },
        body: JSON.stringify({
          image: base64Image,
          configure: {
            language: options.language === 'eng' ? 'auto' : 'zh-CN',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`阿里云 OCR 错误: ${response.status}`);
      }

      const data = await response.json();
      
      // 解析阿里云响应格式
      const results: OCRResult[] = [];
      if (data.data?.words_result) {
        for (const item of data.data.words_result) {
          results.push({
            id: uuidv4(),
            text: item.words,
            confidence: item.probability?.average || 0.9,
            boundingBox: item.rect,
          });
        }
      }

      return {
        results,
        language: options.language || 'zh-CN',
        fullText: results.map(r => r.text).join(''),
      };
    } catch (error) {
      logger.error('阿里云 OCR 失败:', error);
      throw error;
    }
  }

  /**
   * 从视频帧识别字幕
   */
  async recognizeFromVideoFrame(
    videoFrame: string | Blob | File,
    options: OCROptions = {}
  ): Promise<OCRResponse> {
    logger.info('从视频帧识别文字...');
    return this.recognize(videoFrame, {
      language: options.language || 'chi_sim',
      ...options,
    });
  }

  /**
   * 批量识别多个图像
   */
  async recognizeBatch(
    images: Array<string | Blob | File>,
    options: OCROptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<OCRResponse[]> {
    const results: OCRResponse[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const result = await this.recognize(images[i], options);
      results.push(result);
      onProgress?.(i + 1, images.length);
    }
    
    return results;
  }

  /**
   * 将 Blob 转换为 Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 终止 Tesseract Worker
   */
  async terminate(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

export const ocrService = new OCRService();
export default ocrService;
