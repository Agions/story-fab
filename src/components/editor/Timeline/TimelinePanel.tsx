/**
 * TimelinePanel — 主时间线面板
 * 组合: Toolbar + Ruler + Tracks + Scrubber
 * 状态: zoomLevel (pixelsPerSecond), currentTime, tracks[]
 */
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack } from './TimelineTrack';
import { TimelineScrubber } from './TimelineScrubber';
import { useInterval } from '@/hooks';
import type { ClipData } from './TimelineClip';

export interface TimelineTrackData {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  name: string;
  clips: ClipData[];
}

interface TimelinePanelProps {
  tracks: TimelineTrackData[];
  initialDuration?: number;
  initialPlayhead?: number;
  onPlayheadChange?: (time: number) => void;
  onClipSelect?: (clipId: string, trackId: string) => void;
  onClipUpdate?: (clipId: string, updates: Partial<ClipData>) => void;
}

const TRACK_NAMES = {
  video: '视频',
  audio: '音频',
  subtitle: '字幕',
};

const MIN_ZOOM = 10;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 50;

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  tracks: initialTracks,
  initialDuration = 120,
  initialPlayhead = 0,
  onPlayheadChange,
  onClipSelect,
}) => {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_ZOOM);
  const [currentTime, setCurrentTime] = useState(initialPlayhead);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const interval = useInterval();

  const duration = initialDuration;
  const totalWidth = duration * pixelsPerSecond;

  // 播放头计时
  useEffect(() => {
    if (isPlaying) {
      const id = interval.set(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 / 30;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }, 33);
      return () => interval.clear(id);
    }
    return undefined;
  }, [isPlaying, duration]);

  // Sync playhead to parent
  useEffect(() => {
    onPlayheadChange?.(currentTime);
  }, [currentTime, onPlayheadChange]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleZoomIn = useCallback(() => {
    setPixelsPerSecond((prev) => Math.min(prev * 1.25, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPixelsPerSecond((prev) => Math.max(prev / 1.25, MIN_ZOOM));
  }, []);

  const handleFitAll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const newPps = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (containerWidth - 40) / duration));
    setPixelsPerSecond(newPps);
    setScrollX(0);
  }, [duration]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const handleClipClick = useCallback((clipId: string, trackId: string) => {
    setSelectedClipId(clipId);
    onClipSelect?.(clipId, trackId);
  }, [onClipSelect]);

  const handleClipDragStart = useCallback((clipId: string, _e: React.PointerEvent) => {
    setSelectedClipId(clipId);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollX((e.currentTarget as HTMLElement).scrollLeft);
  }, []);

  const trackTotalHeight = useMemo(() => {
    return initialTracks.reduce((sum, t) => {
      const heights = { video: 64, audio: 48, subtitle: 40 };
      return sum + (heights[t.type] || 60);
    }, 0);
  }, [initialTracks]);

  const zoomPercent = Math.round((pixelsPerSecond / DEFAULT_ZOOM) * 100);

  return (
    <div className="flex flex-col bg-bg-secondary rounded-lg overflow-hidden select-none" style={{ height: '100%' }}>
      {/* Toolbar */}
      <TimelineToolbar
        zoomPercent={zoomPercent}
        isPlaying={isPlaying}
        currentTimecode={formatTimecode(currentTime)}
        totalTimecode={formatTimecode(duration)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitAll={handleFitAll}
        onPlayPause={handlePlayPause}
      />

      {/* Timeline body: ScrollArea wrapping ruler + tracks + scrubber */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="w-full h-full">
          <div
            ref={scrollContainerRef}
            className="relative overflow-x-auto overflow-y-hidden"
            onScroll={handleScroll}
            style={{ width: totalWidth, minWidth: '100%' }}
          >
            {/* Time Ruler */}
            <TimelineRuler
              duration={duration}
              pixelsPerSecond={pixelsPerSecond}
              scrollX={scrollX}
              width={totalWidth}
            />

            {/* Tracks container */}
            <div
              data-timeline-tracks
              className="relative"
              style={{ height: trackTotalHeight }}
            >
              {initialTracks.map((track) => (
                <TimelineTrack
                  key={track.id}
                  trackType={track.type}
                  trackName={track.name || TRACK_NAMES[track.type]}
                  clips={track.clips}
                  pixelsPerSecond={pixelsPerSecond}
                  selectedClipId={selectedClipId ?? undefined}
                  onClipClick={(clipId, e) => {
                    e.stopPropagation();
                    handleClipClick(clipId, track.id);
                  }}
                  onClipDragStart={handleClipDragStart}
                />
              ))}

              {/* Scrubber (playhead) */}
              <TimelineScrubber
                currentTime={currentTime}
                pixelsPerSecond={pixelsPerSecond}
                scrollX={scrollX}
                totalHeight={trackTotalHeight}
                onSeek={handleSeek}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TimelinePanel;
