/**
 * Timeline Operations - 时间线操作函数
 *
 * 设计原则:
 * 1. 所有操作基于统一的 tracks: TimelineTrack[] 数组
 * 2. 所有时间字段使用 startMs/endMs (毫秒)
 * 3. 所有函数返回新的 Timeline 对象 (不可变模式)
 * 4. 自动同步 legacy track arrays (videoTracks 等) 保持向后兼容
 *
 * @version 2.0 - 2026-05-03
 *
 * 模块拆分说明:
 * - timelineHelpers.ts: 辅助函数 (findTrackIndex, findClipInTracks, 等)
 * - trackOperations.ts: 轨道操作 (createEmptyTimeline, addTrack, removeTrack)
 * - clipOperations.ts: 片段操作 (addClip, removeClip, moveClip, trimClip, splitClip, copyClip)
 * - effectOperations.ts: 特效与转场 (addTransition, addEffect, adjustSpeed, adjustVolume)
 * - mediaOperations.ts: 文本与音频 (addText, addAudio)
 */

// Re-export helpers
export {
  findTrackIndex,
  findClipInTracks,
  updateClipInTrack,
  calculateDuration,
} from './timelineHelpers';

// Re-export track operations
export {
  createEmptyTimeline,
  findTrackByClipId,
  addTrack,
  removeTrack,
} from './trackOperations';

// Re-export clip operations
export {
  addClip,
  removeClip,
  moveClip,
  trimClip,
  splitClip,
  copyClip,
} from './clipOperations';

// Re-export effect operations
export {
  addTransition,
  addEffect,
  adjustSpeed,
  adjustVolume,
} from './effectOperations';

// Re-export media operations
export {
  addText,
  addAudio,
} from './mediaOperations';
