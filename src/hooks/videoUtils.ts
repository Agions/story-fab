/**
 * 视频处理工具函数
 *
 * 【优化思路】从 useVideo.ts (366行) 提取纯工具函数，
 * 与 React 状态解耦，便于独立测试和复用。
 */

import type { VideoInfo, Scene, Keyframe } from '@/core/types';

// =============================================================================
// 常量
// =============================================================================

/** 支持的视频格式 */
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];

/** 最大文件大小 (2GB) */
export const MAX_VIDEO_FILE_SIZE = 2 * 1024 * 1024 * 1024;

/** 默认帧率 */
const DEFAULT_FPS = 30;

/** 场景默认时长（秒） */
const SCENE_DURATION_SECONDS = 30;

/** 关键帧默认间隔（秒） */
const KEYFRAME_INTERVAL_SECONDS = 5;

/** 场景默认评分 */
const DEFAULT_SCENE_SCORE = 0.8;

// =============================================================================
// 视频元数据读取
// =============================================================================

/**
 * 从 File 对象读取视频元数据
 * 使用 HTMLVideoElement 获取时长、分辨率等信息
 */
export function readVideoMetadata(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      const info: VideoInfo = {
        id: crypto.randomUUID(),
        path: url,
        name: file.name,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: DEFAULT_FPS,
        format: file.name.split('.').pop()?.toLowerCase() || 'mp4',
        size: file.size,
        createdAt: new Date().toISOString()
      };

      resolve(info);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取视频文件'));
    };

    video.src = url;
  });
}

// =============================================================================
// 缩略图生成
// =============================================================================

/**
 * 从视频 URL 生成指定时间戳的缩略图
 * 使用 Canvas 绘制视频帧并导出为 JPEG Data URL
 */
export function generateVideoThumbnail(videoUrl: string, timestamp: number = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = timestamp;
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } else {
        reject(new Error('无法创建画布上下文'));
      }
    };

    video.onerror = () => {
      reject(new Error('无法加载视频'));
    };

    video.src = videoUrl;
  });
}

// =============================================================================
// 模拟数据生成（开发/演示用）
// =============================================================================

/**
 * 生成模拟场景数据
 * 按固定时长将视频切分为多个场景
 */
export function generateMockScenes(duration: number): Scene[] {
  const scenes: Scene[] = [];
  const sceneCount = Math.floor(duration / SCENE_DURATION_SECONDS);

  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      id: crypto.randomUUID(),
      startTime: i * SCENE_DURATION_SECONDS,
      endTime: Math.min((i + 1) * SCENE_DURATION_SECONDS, duration),
      type: 'action',
      score: DEFAULT_SCENE_SCORE,
      thumbnail: '',
      description: `场景 ${i + 1}`,
      tags: ['场景', `片段${i + 1}`]
    });
  }

  return scenes;
}

/**
 * 生成模拟关键帧数据
 * 按固定间隔生成关键帧列表
 */
export function generateMockKeyframes(duration: number): Keyframe[] {
  if (duration <= 0) return [];
  const count = Math.floor(duration / KEYFRAME_INTERVAL_SECONDS);
  return Array.from({ length: count }, (_, i) => {
    const t = i * KEYFRAME_INTERVAL_SECONDS;
    return {
      id: `mock_keyframe_${t}s`,
      timestamp: t,
      imageUrl: `mock://frame/${t}`,
      description: `场景帧 at ${t}s`
    };
  });
}
