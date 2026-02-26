import type { Timeline, VideoClip, VideoTrack } from '@/core/types';

export function createEmptyTimeline(): Timeline {
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

export function addClip(
  timeline: Timeline,
  trackId: string,
  clip: VideoClip,
  position: number
): Timeline {
  const track = timeline.videoTracks.find((t) => t.id === trackId);
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
    videoTracks: timeline.videoTracks.map((t) =>
      t.id === trackId ? updatedTrack : t
    ),
    duration: Math.max(timeline.duration, newClip.endTime),
    updatedAt: new Date().toISOString()
  };
}

export function removeClip(timeline: Timeline, trackId: string, clipId: string): Timeline {
  const track = timeline.videoTracks.find((t) => t.id === trackId);
  if (!track) return timeline;

  const updatedTrack = {
    ...track,
    clips: track.clips.filter((c) => c.id !== clipId)
  };

  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((t) =>
      t.id === trackId ? updatedTrack : t
    ),
    updatedAt: new Date().toISOString()
  };
}

export function moveClip(
  timeline: Timeline,
  trackId: string,
  clipId: string,
  newPosition: number
): Timeline {
  const track = timeline.videoTracks.find((t) => t.id === trackId);
  if (!track) return timeline;

  const clip = track.clips.find((c) => c.id === clipId);
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
      .filter((c) => c.id !== clipId)
      .concat(updatedClip)
      .sort((a, b) => a.startTime - b.startTime)
  };

  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((t) =>
      t.id === trackId ? updatedTrack : t
    ),
    updatedAt: new Date().toISOString()
  };
}

export function trimClip(
  timeline: Timeline,
  clipId: string,
  startTime: number,
  endTime: number
): Timeline {
  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, startTime, endTime } : clip
      )
    })),
    updatedAt: new Date().toISOString()
  };
}

export function splitClip(timeline: Timeline, clipId: string, splitTime: number): Timeline {
  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((track) => {
      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
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

export function addTransition(
  timeline: Timeline,
  fromClipId: string,
  toClipId: string,
  type: string,
  duration: number
): Timeline {
  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((track) => ({
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

export function addEffect(
  timeline: Timeline,
  clipId: string,
  effect: string,
  params: Record<string, any>
): Timeline {
  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId
          ? { ...clip, effects: [...(clip.effects || []), { type: effect, params }] }
          : clip
      )
    })),
    updatedAt: new Date().toISOString()
  };
}

export function addText(
  timeline: Timeline,
  trackId: string,
  text: any,
  position: number
): Timeline {
  const track = timeline.textTracks.find((t) => t.id === trackId);
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
    textTracks: timeline.textTracks.map((t) =>
      t.id === trackId ? updatedTrack : t
    ),
    updatedAt: new Date().toISOString()
  };
}

export function addAudio(
  timeline: Timeline,
  trackId: string,
  audio: any,
  position: number
): Timeline {
  const track = timeline.audioTracks.find((t) => t.id === trackId);
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
    audioTracks: timeline.audioTracks.map((t) =>
      t.id === trackId ? updatedTrack : t
    ),
    updatedAt: new Date().toISOString()
  };
}

export function adjustSpeed(timeline: Timeline, clipId: string, speed: number): Timeline {
  return {
    ...timeline,
    videoTracks: timeline.videoTracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, speed } : clip
      )
    })),
    updatedAt: new Date().toISOString()
  };
}

export function adjustVolume(timeline: Timeline, trackId: string, volume: number): Timeline {
  return {
    ...timeline,
    audioTracks: timeline.audioTracks.map((track) =>
      track.id === trackId ? { ...track, volume } : track
    ),
    updatedAt: new Date().toISOString()
  };
}
