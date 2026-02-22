/**
 * 视频剪辑服务
 * 整合所有剪辑功能，提供统一的剪辑工作流
 */

import type {
  VideoClip,
  VideoTrack,
  AudioTrack,
  TextTrack,
  EffectTrack,
  Timeline,
  ExportSettings,
  VideoSegment,
  ScriptSegment
} from '@/core/types';

// 剪辑配置
export interface EditorConfig {
  // 轨道配置
  maxVideoTracks: number;
  maxAudioTracks: number;
  maxTextTracks: number;
  maxEffectTracks: number;

  // 性能配置
  previewQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
  autoSaveInterval: number; // 秒

  // 导出配置
  defaultExportSettings: ExportSettings;
}

// 默认配置
const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  maxVideoTracks: 4,
  maxAudioTracks: 4,
  maxTextTracks: 2,
  maxEffectTracks: 2,
  previewQuality: 'medium',
  autoSave: true,
  autoSaveInterval: 30,
  defaultExportSettings: {
    format: 'mp4',
    resolution: '1080p',
    quality: 'high',
    fps: 30,
    bitrate: '8M'
  }
};

// 剪辑操作类型
export type EditorAction =
  | { type: 'ADD_CLIP'; trackId: string; clip: VideoClip; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startTime: number; endTime: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitTime: number }
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; type: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, any> }
  | { type: 'ADD_TEXT'; trackId: string; text: any; position: number }
  | { type: 'ADD_AUDIO'; trackId: string; audio: any; position: number }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// 剪辑历史记录
interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}

class EditorService {
  private config: EditorConfig;
  private history: EditorHistory;
  private listeners: Set<(timeline: Timeline) => void> = new Set();
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<EditorConfig> = {}) {
    this.config = { ...DEFAULT_EDITOR_CONFIG, ...config };
    this.history = {
      past: [],
      present: this.createEmptyTimeline(),
      future: []
    };

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 创建空时间轴
   */
  private createEmptyTimeline(): Timeline {
    return {
      id: `timeline_${Date.now()}`,
      duration: 0,
      videoTracks: [],
      audioTracks: [],
      textTracks: [],
      effectTracks: [],
      markers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取当前时间轴
   */
  getTimeline(): Timeline {
    return this.history.present;
  }

  /**
   * 订阅时间轴变化
   */
  subscribe(listener: (timeline: Timeline) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知订阅者
   */
  private notify(): void {
    this.listeners.forEach(listener => listener(this.history.present));
  }

  /**
   * 执行操作
   */
  dispatch(action: EditorAction): void {
    const newTimeline = this.applyAction(this.history.present, action);

    this.history = {
      past: [...this.history.past, this.history.present],
      present: newTimeline,
      future: []
    };

    this.notify();
  }

  /**
   * 应用操作
   */
  private applyAction(timeline: Timeline, action: EditorAction): Timeline {
    switch (action.type) {
      case 'ADD_CLIP':
        return this.addClip(timeline, action.trackId, action.clip, action.position);

      case 'REMOVE_CLIP':
        return this.removeClip(timeline, action.trackId, action.clipId);

      case 'MOVE_CLIP':
        return this.moveClip(timeline, action.trackId, action.clipId, action.newPosition);

      case 'TRIM_CLIP':
        return this.trimClip(timeline, action.clipId, action.startTime, action.endTime);

      case 'SPLIT_CLIP':
        return this.splitClip(timeline, action.clipId, action.splitTime);

      case 'ADD_TRANSITION':
        return this.addTransition(timeline, action.fromClipId, action.toClipId, action.type, action.duration);

      case 'ADD_EFFECT':
        return this.addEffect(timeline, action.clipId, action.effect, action.params);

      case 'ADD_TEXT':
        return this.addText(timeline, action.trackId, action.text, action.position);

      case 'ADD_AUDIO':
        return this.addAudio(timeline, action.trackId, action.audio, action.position);

      case 'ADJUST_SPEED':
        return this.adjustSpeed(timeline, action.clipId, action.speed);

      case 'ADJUST_VOLUME':
        return this.adjustVolume(timeline, action.trackId, action.volume);

      case 'UNDO':
        return this.undo();

      case 'REDO':
        return this.redo();

      default:
        return timeline;
    }
  }

  /**
   * 添加片段
   */
  private addClip(
    timeline: Timeline,
    trackId: string,
    clip: VideoClip,
    position: number
  ): Timeline {
    const track = timeline.videoTracks.find(t => t.id === trackId);
    if (!track) return timeline;

    const newClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      startTime: position,
      endTime: position + (clip.endTime - clip.startTime)
    };

    const updatedTrack = {
      ...track,
      clips: [...track.clips, newClip].sort((a, b) => a.startTime - b.startTime)
    };

    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(t =>
        t.id === trackId ? updatedTrack : t
      ),
      duration: Math.max(timeline.duration, newClip.endTime),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 移除片段
   */
  private removeClip(timeline: Timeline, trackId: string, clipId: string): Timeline {
    const track = timeline.videoTracks.find(t => t.id === trackId);
    if (!track) return timeline;

    const updatedTrack = {
      ...track,
      clips: track.clips.filter(c => c.id !== clipId)
    };

    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(t =>
        t.id === trackId ? updatedTrack : t
      ),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 移动片段
   */
  private moveClip(
    timeline: Timeline,
    trackId: string,
    clipId: string,
    newPosition: number
  ): Timeline {
    const track = timeline.videoTracks.find(t => t.id === trackId);
    if (!track) return timeline;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return timeline;

    const duration = clip.endTime - clip.startTime;
    const updatedClip = {
      ...clip,
      startTime: newPosition,
      endTime: newPosition + duration
    };

    const updatedTrack = {
      ...track,
      clips: track.clips
        .filter(c => c.id !== clipId)
        .concat(updatedClip)
        .sort((a, b) => a.startTime - b.startTime)
    };

    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(t =>
        t.id === trackId ? updatedTrack : t
      ),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 裁剪片段
   */
  private trimClip(
    timeline: Timeline,
    clipId: string,
    startTime: number,
    endTime: number
  ): Timeline {
    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, startTime, endTime }
            : clip
        )
      })),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 分割片段
   */
  private splitClip(timeline: Timeline, clipId: string, splitTime: number): Timeline {
    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(track => {
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex === -1) return track;

        const clip = track.clips[clipIndex];
        if (splitTime <= clip.startTime || splitTime >= clip.endTime) return track;

        const firstPart = {
          ...clip,
          id: `${clip.id}_1`,
          endTime: splitTime
        };

        const secondPart = {
          ...clip,
          id: `${clip.id}_2`,
          startTime: splitTime
        };

        const newClips = [...track.clips];
        newClips.splice(clipIndex, 1, firstPart, secondPart);

        return { ...track, clips: newClips };
      }),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 添加转场
   */
  private addTransition(
    timeline: Timeline,
    fromClipId: string,
    toClipId: string,
    type: string,
    duration: number
  ): Timeline {
    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(track => ({
        ...track,
        transitions: [
          ...(track.transitions || []),
          {
            id: `transition_${Date.now()}`,
            fromClipId,
            toClipId,
            type,
            duration
          }
        ]
      })),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 添加效果
   */
  private addEffect(
    timeline: Timeline,
    clipId: string,
    effect: string,
    params: Record<string, any>
  ): Timeline {
    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? {
                ...clip,
                effects: [...(clip.effects || []), { type: effect, params }]
              }
            : clip
        )
      })),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 添加文字
   */
  private addText(
    timeline: Timeline,
    trackId: string,
    text: any,
    position: number
  ): Timeline {
    const track = timeline.textTracks.find(t => t.id === trackId);
    if (!track) return timeline;

    const newText = {
      ...text,
      id: `text_${Date.now()}`,
      startTime: position,
      endTime: position + (text.duration || 5)
    };

    const updatedTrack = {
      ...track,
      items: [...track.items, newText].sort((a, b) => a.startTime - b.startTime)
    };

    return {
      ...timeline,
      textTracks: timeline.textTracks.map(t =>
        t.id === trackId ? updatedTrack : t
      ),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 添加音频
   */
  private addAudio(
    timeline: Timeline,
    trackId: string,
    audio: any,
    position: number
  ): Timeline {
    const track = timeline.audioTracks.find(t => t.id === trackId);
    if (!track) return timeline;

    const newAudio = {
      ...audio,
      id: `audio_${Date.now()}`,
      startTime: position,
      endTime: position + (audio.duration || 5)
    };

    const updatedTrack = {
      ...track,
      clips: [...track.clips, newAudio].sort((a, b) => a.startTime - b.startTime)
    };

    return {
      ...timeline,
      audioTracks: timeline.audioTracks.map(t =>
        t.id === trackId ? updatedTrack : t
      ),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 调整速度
   */
  private adjustSpeed(timeline: Timeline, clipId: string, speed: number): Timeline {
    return {
      ...timeline,
      videoTracks: timeline.videoTracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, speed } : clip
        )
      })),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 调整音量
   */
  private adjustVolume(timeline: Timeline, trackId: string, volume: number): Timeline {
    return {
      ...timeline,
      audioTracks: timeline.audioTracks.map(track =>
        track.id === trackId ? { ...track, volume } : track
      ),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 撤销
   */
  undo(): Timeline {
    if (this.history.past.length === 0) return this.history.present;

    const previous = this.history.past[this.history.past.length - 1];
    const newPast = this.history.past.slice(0, -1);

    this.history = {
      past: newPast,
      present: previous,
      future: [this.history.present, ...this.history.future]
    };

    this.notify();
    return this.history.present;
  }

  /**
   * 重做
   */
  redo(): Timeline {
    if (this.history.future.length === 0) return this.history.present;

    const next = this.history.future[0];
    const newFuture = this.history.future.slice(1);

    this.history = {
      past: [...this.history.past, this.history.present],
      present: next,
      future: newFuture
    };

    this.notify();
    return this.history.present;
  }

  /**
   * 能否撤销
   */
  canUndo(): boolean {
    return this.history.past.length > 0;
  }

  /**
   * 能否重做
   */
  canRedo(): boolean {
    return this.history.future.length > 0;
  }

  /**
   * 创建轨道
   */
  createTrack(type: 'video' | 'audio' | 'text' | 'effect'): string {
    const id = `${type}_${Date.now()}`;
    const track = {
      id,
      name: `${type} Track`,
      clips: [],
      visible: true,
      locked: false,
      volume: type === 'audio' ? 1 : undefined
    };

    const timeline = this.history.present;

    switch (type) {
      case 'video':
        if (timeline.videoTracks.length < this.config.maxVideoTracks) {
          timeline.videoTracks.push(track as VideoTrack);
        }
        break;
      case 'audio':
        if (timeline.audioTracks.length < this.config.maxAudioTracks) {
          timeline.audioTracks.push(track as AudioTrack);
        }
        break;
      case 'text':
        if (timeline.textTracks.length < this.config.maxTextTracks) {
          timeline.textTracks.push(track as TextTrack);
        }
        break;
      case 'effect':
        if (timeline.effectTracks.length < this.config.maxEffectTracks) {
          timeline.effectTracks.push(track as EffectTrack);
        }
        break;
    }

    this.notify();
    return id;
  }

  /**
   * 从脚本生成时间轴
   */
  generateTimelineFromScript(
    scriptSegments: ScriptSegment[],
    videoSegments: VideoSegment[]
  ): Timeline {
    const timeline = this.createEmptyTimeline();

    // 创建视频轨道
    const videoTrackId = this.createTrack('video');

    // 创建文字轨道
    const textTrackId = this.createTrack('text');

    // 匹配脚本片段和视频片段
    let currentTime = 0;

    for (let i = 0; i < Math.min(scriptSegments.length, videoSegments.length); i++) {
      const script = scriptSegments[i];
      const video = videoSegments[i];

      // 添加视频片段
      const videoClip: VideoClip = {
        id: `clip_${i}`,
        sourceId: video.id,
        sourceStart: video.startTime,
        sourceEnd: video.endTime,
        startTime: currentTime,
        endTime: currentTime + (video.endTime - video.startTime),
        effects: []
      };

      timeline.videoTracks[0].clips.push(videoClip);

      // 添加字幕
      const textItem = {
        id: `text_${i}`,
        content: script.content,
        startTime: currentTime,
        endTime: currentTime + (video.endTime - video.startTime),
        style: {
          fontSize: 24,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          position: 'bottom'
        }
      };

      timeline.textTracks[0].items.push(textItem);

      currentTime += video.endTime - video.startTime;
    }

    timeline.duration = currentTime;
    this.history.present = timeline;
    this.notify();

    return timeline;
  }

  /**
   * 导出时间轴
   */
  async exportTimeline(settings?: Partial<ExportSettings>): Promise<Blob> {
    const exportSettings = { ...this.config.defaultExportSettings, ...settings };

    // 这里应该调用 FFmpeg 或其他导出服务
    // 目前返回模拟数据
    return new Blob(['export data'], { type: 'video/mp4' });
  }

  /**
   * 获取导出预览
   */
  getExportPreview(): {
    duration: number;
    resolution: string;
    estimatedSize: string;
  } {
    const timeline = this.history.present;
    const settings = this.config.defaultExportSettings;

    // 估算文件大小
    const duration = timeline.duration;
    const bitrate = parseInt(settings.bitrate) * 1024 * 1024; // bits per second
    const estimatedBytes = (duration * bitrate) / 8;
    const estimatedSize = this.formatBytes(estimatedBytes);

    return {
      duration,
      resolution: settings.resolution,
      estimatedSize
    };
  }

  /**
   * 格式化字节
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 开始自动保存
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveToStorage();
    }, this.config.autoSaveInterval * 1000);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'reelforge_timeline',
        JSON.stringify(this.history.present)
      );
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage(): boolean {
    try {
      const data = localStorage.getItem('reelforge_timeline');
      if (data) {
        this.history.present = JSON.parse(data);
        this.notify();
        return true;
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
    return false;
  }

  /**
   * 清空时间轴
   */
  clear(): void {
    this.history = {
      past: [],
      present: this.createEmptyTimeline(),
      future: []
    };
    this.notify();
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopAutoSave();
    this.listeners.clear();
  }
}

// 导出单例
export const editorService = new EditorService();
export default EditorService;

// 导出类型
export type { EditorConfig, EditorAction, EditorHistory };
