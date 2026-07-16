/**
 * VideoInfo 构造辅助 — 从视频路径生成最小化 VideoInfo
 * 抽取 subtitle-service.ts 与 asr-service.ts 中重复的构造模板
 */
import type { VideoInfo } from './media';

export function createMinimalVideoInfo(videoPath: string): VideoInfo {
  return {
    id: crypto.randomUUID(),
    path: videoPath,
    name: videoPath.split('/').pop() || 'video',
    duration: 0,
    size: 0,
    format: '',
    fps: 0,
    width: 0,
    height: 0,
  };
}
