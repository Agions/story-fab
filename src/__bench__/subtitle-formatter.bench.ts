/**
 * 字幕格式转换性能基准
 *
 * Stage 8 PR-5.1。
 * 覆盖 SRT/VTT/ASS 三种格式在不同条目数下的转换耗时。
 */
import { bench, describe } from 'vitest';
import { trackToSRT, trackToVTT, trackToASS, type SubtitleTrack } from '@/core/services/subtitle/subtitle-formatters';

function makeTrack(count: number): SubtitleTrack {
  const entries = Array.from({ length: count }, (_, i) => ({
    id: `e${i}`,
    startTime: i * 1000,
    endTime: i * 1000 + 800,
    text: `字幕条目 ${i} — 这是一段测试文本用于性能基准`,
  }));
  return { id: 'track-1', language: 'zh-CN', entries };
}

describe('subtitle format conversion', () => {
  const track100 = makeTrack(100);
  const track1000 = makeTrack(1000);

  bench('trackToSRT 100 entries', () => {
    trackToSRT(track100);
  });

  bench('trackToSRT 1000 entries', () => {
    trackToSRT(track1000);
  });

  bench('trackToVTT 100 entries', () => {
    trackToVTT(track100);
  });

  bench('trackToVTT 1000 entries', () => {
    trackToVTT(track1000);
  });

  bench('trackToASS 100 entries', () => {
    trackToASS(track100);
  });

  bench('trackToASS 1000 entries', () => {
    trackToASS(track1000);
  });
});
