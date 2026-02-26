import type { Timeline, VideoTrack, AudioTrack, TextTrack, EffectTrack } from '@/core/types';
import type { EditorConfig } from './types';

export function createTrack(
  timeline: Timeline,
  type: 'video' | 'audio' | 'text' | 'effect',
  config: EditorConfig
): { timeline: Timeline; trackId: string } {
  const id = `${type}_${Date.now()}`;
  const track = {
    id,
    name: `${type} Track`,
    clips: [],
    visible: true,
    locked: false,
    volume: type === 'audio' ? 1 : undefined
  };

  let updatedTimeline = timeline;

  switch (type) {
    case 'video':
      if (timeline.videoTracks.length < config.maxVideoTracks) {
        updatedTimeline = { ...timeline, videoTracks: [...timeline.videoTracks, track as VideoTrack] };
      }
      break;
    case 'audio':
      if (timeline.audioTracks.length < config.maxAudioTracks) {
        updatedTimeline = { ...timeline, audioTracks: [...timeline.audioTracks, track as AudioTrack] };
      }
      break;
    case 'text':
      if (timeline.textTracks.length < config.maxTextTracks) {
        updatedTimeline = { ...timeline, textTracks: [...timeline.textTracks, track as TextTrack] };
      }
      break;
    case 'effect':
      if (timeline.effectTracks.length < config.maxEffectTracks) {
        updatedTimeline = { ...timeline, effectTracks: [...timeline.effectTracks, track as EffectTrack] };
      }
      break;
  }

  return { timeline: updatedTimeline, trackId: id };
}

export function generateTimelineFromScript(
  scriptSegments: any[],
  videoSegments: any[],
  createTrackFn: (type: 'video' | 'text') => string,
  addClipFn: (trackId: string, clip: any, position: number) => void,
  addTextFn: (trackId: string, text: any, position: number) => void
): Timeline {
  const videoTrackId = createTrackFn('video');
  const textTrackId = createTrackFn('text');

  let currentTime = 0;

  for (let i = 0; i < Math.min(scriptSegments.length, videoSegments.length); i++) {
    const script = scriptSegments[i];
    const video = videoSegments[i];

    const videoClip = {
      id: `clip_${i}`,
      sourceId: video.id,
      sourceStart: video.startTime,
      sourceEnd: video.endTime,
      startTime: currentTime,
      endTime: currentTime + (video.endTime - video.startTime),
      effects: []
    };

    addClipFn(videoTrackId, videoClip, currentTime);

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

    addTextFn(textTrackId, textItem, currentTime);
    currentTime += video.endTime - video.startTime;
  }

  return {
    id: `timeline_${Date.now()}`,
    duration: currentTime,
    videoTracks: [],
    audioTracks: [],
    textTracks: [],
    effectTracks: [],
    markers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
