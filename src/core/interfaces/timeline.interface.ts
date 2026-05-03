/**
 * Timeline Service Interface - 时间线服务接口
 * 
 * 定义时间线数据模型和操作契约
 */

import type {
  Timeline,
  TimelineTrack,
  TimelineClip,
  TimelineState,
  TimelineSelection,
  TimelineMarker,
  TimelineTool,
  ClipProperties,
  TrackType,
  EditorAction,
} from '../types/timeline';

// ============================================================
// 时间线状态接口
// ============================================================

export interface ITimelineState {
  /** 当前时间线 */
  timeline: Timeline;
  
  /** 当前播放位置 (ms) */
  playheadMs: number;
  
  /** 缩放级别 */
  zoom: number;
  
  /** 水平滚动位置 */
  scrollX: number;
  
  /** 吸附启用 */
  snapEnabled: boolean;
  
  /** 吸附阈值 (ms) */
  snapThreshold: number;
}

// ============================================================
// 时间线服务接口
// ============================================================

export interface ITimelineService {
  // 状态访问
  getState(): ITimelineState;
  getTracks(): TimelineTrack[];
  getTrack(trackId: string): TimelineTrack | undefined;
  getClip(clipId: string): TimelineClip | undefined;
  
  // 选择
  getSelection(): TimelineSelection;
  selectClip(clipId: string): void;
  selectTrack(trackId: string): void;
  clearSelection(): void;
  
  // 工具
  getCurrentTool(): TimelineTool;
  setCurrentTool(tool: TimelineTool): void;
  
  // 播放位置
  getPlayheadMs(): number;
  setPlayheadMs(ms: number): void;
  
  // 缩放和滚动
  getZoom(): number;
  setZoom(zoom: number): void;
  getScrollX(): number;
  setScrollX(scrollX: number): void;
  
  // 标记点
  getMarkers(): TimelineMarker[];
  addMarker(marker: Omit<TimelineMarker, 'id'>): string;
  removeMarker(markerId: string): void;
  
  // 片段属性
  getClipProperties(clipId: string): ClipProperties | undefined;
  updateClipProperties(clipId: string, props: Partial<ClipProperties>): void;
  
  // 吸附
  isSnapEnabled(): boolean;
  setSnapEnabled(enabled: boolean): void;
  setSnapThreshold(threshold: number): void;
  snapToEdge(positionMs: number, excludeClipId?: string): number;
}

// ============================================================
// 轨道类型
// ============================================================

export interface ITrackFactory {
  createTrack(type: TrackType, name?: string): TimelineTrack;
}

export interface IClipFactory {
  createClip(params: {
    trackId: string;
    sourceId: string;
    sourceStart: number;
    sourceEnd: number;
    startTime: number;
    endTime: number;
    name?: string;
  }): TimelineClip;
}
