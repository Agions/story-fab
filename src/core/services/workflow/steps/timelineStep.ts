import type { VideoInfo, VideoAnalysis, ScriptData, Scene } from '@/core/types';
import type { TimelineData } from '../types';

export async function executeTimelineStep(
  videoInfo: VideoInfo,
  videoAnalysis: VideoAnalysis,
  editedScript: ScriptData,
  autoMatch: boolean = true
): Promise<TimelineData> {
  if (autoMatch) {
    return autoMatchTimeline(videoInfo, videoAnalysis, editedScript);
  }

  // 创建空时间轴
  return {
    tracks: [
      { id: 'video-track-1', type: 'video', clips: [] },
      { id: 'audio-track-1', type: 'audio', clips: [] },
      { id: 'subtitle-track-1', type: 'subtitle', clips: [] },
    ],
    duration: videoInfo.duration,
  };
}

function autoMatchTimeline(
  videoInfo: VideoInfo,
  analysis: VideoAnalysis,
  script: ScriptData
): TimelineData {
  const videoClips: TimelineData['tracks'][0]['clips'] = [];
  const subtitleClips: TimelineData['tracks'][0]['clips'] = [];

  let currentTime = 0;
  const segmentDuration = videoInfo.duration / script.segments.length;

  script.segments.forEach((segment, index) => {
    const matchedScene = findBestMatchingScene(
      segment,
      analysis.scenes,
      index / script.segments.length
    );

    const startTime = currentTime;
    const endTime = currentTime + segmentDuration;

    videoClips.push({
      id: `video-clip-${index}`,
      startTime,
      endTime,
      sourceStart: matchedScene?.startTime || 0,
      sourceEnd: matchedScene?.endTime || videoInfo.duration,
      sourceId: videoInfo.id,
      scriptSegmentId: segment.id,
      transition: index > 0 ? 'fade' : undefined,
    });

    subtitleClips.push({
      id: `subtitle-clip-${index}`,
      startTime,
      endTime,
      sourceStart: 0,
      sourceEnd: segment.content.length,
      sourceId: segment.id,
      scriptSegmentId: segment.id,
    });

    currentTime = endTime;
  });

  return {
    tracks: [
      { id: 'video-track-1', type: 'video', clips: videoClips },
      { id: 'audio-track-1', type: 'audio', clips: [] },
      { id: 'subtitle-track-1', type: 'subtitle', clips: subtitleClips },
    ],
    duration: videoInfo.duration,
  };
}

function findBestMatchingScene(
  segment: any,
  scenes: Scene[],
  position: number
): Scene | null {
  const targetTime = position * Math.max(...scenes.map((s) => s.endTime));

  return scenes.reduce((best, scene) => {
    const sceneTime = (scene.startTime + scene.endTime) / 2;
    const bestTime = best ? (best.startTime + best.endTime) / 2 : 0;
    return Math.abs(sceneTime - targetTime) < Math.abs(bestTime - targetTime)
      ? scene
      : best;
  }, null as Scene | null);
}
