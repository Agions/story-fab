import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VideoProcessingError,
  normalizeVideoError,
} from './BaseVideoProcessor';

describe('VideoProcessingError', () => {
  it('should create error with operation and message', () => {
    const error = new VideoProcessingError('分析', '视频路径不能为空');
    expect(error.operation).toBe('分析');
    expect(error.message).toBe('视频路径不能为空');
    expect(error.name).toBe('VideoProcessingError');
  });

  it('should default isRetryable to false', () => {
    const error = new VideoProcessingError('剪辑', '测试');
    expect(error.isRetryable).toBe(false);
  });

  it('should accept isRetryable as third parameter', () => {
    const error = new VideoProcessingError('分析', '网络超时', true);
    expect(error.isRetryable).toBe(true);
  });

  it('should be instance of Error', () => {
    const error = new VideoProcessingError('剪辑', '测试');
    expect(error instanceof Error).toBe(true);
  });
});

describe('normalizeVideoError', () => {
  it('should recognize FFmpeg not installed', () => {
    const error = normalizeVideoError(new Error('未安装FFmpeg'), '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).operation).toBe('分析');
    expect((error as VideoProcessingError).message).toContain('未检测到 FFmpeg');
  });

  it('should recognize ffmpeg in error message', () => {
    const error = normalizeVideoError(new Error('ffmpeg not found'), '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('未检测到 FFmpeg');
  });

  it('should recognize ffprobe error', () => {
    const error = normalizeVideoError(new Error('ffprobe failed'), '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('无法执行 ffprobe');
  });

  it('should recognize JSON parse error', () => {
    const error = normalizeVideoError(new Error('解析JSON失败'), '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('无法解析视频元数据');
  });

  it('should recognize video stream not found', () => {
    const error = normalizeVideoError(new Error('未找到视频流'), '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('无法识别视频流');
  });

  it('should recognize empty path error', () => {
    const error = normalizeVideoError(new Error('路径不能为空'), '剪辑');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toBe('视频路径无效。');
  });

  it('should recognize permission error', () => {
    const error = normalizeVideoError(new Error('权限不足'), '导出');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('文件权限不足');
  });

  it('should recognize disk space error', () => {
    const error = normalizeVideoError(new Error('空间不足'), '导出');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).message).toContain('磁盘空间不足');
  });

  it('should recognize timeout as retryable', () => {
    const error = normalizeVideoError(new Error('timeout'), '上传');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).isRetryable).toBe(true);
  });

  it('should recognize ECONNREFUSED as retryable', () => {
    const error = normalizeVideoError(new Error('ECONNREFUSED'), '上传');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect((error as VideoProcessingError).isRetryable).toBe(true);
  });

  it('should wrap non-Error values as VideoProcessingError', () => {
    const error = normalizeVideoError('some string error', '分析');
    expect(error).toBeInstanceOf(VideoProcessingError);
    expect(error.message).toContain('some string error');
  });

  it('should preserve operation name in fallback', () => {
    const error = normalizeVideoError(new Error('unknown error'), '剪辑');
    expect((error as VideoProcessingError).operation).toBe('剪辑');
  });
});
