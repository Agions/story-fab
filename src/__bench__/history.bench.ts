/**
 * createHistory undo/redo 性能基准
 *
 * Stage 8 PR-5.1。
 * 模拟编辑器中时间线操作的 undo/redo 流程。
 */
import { bench, describe } from 'vitest';
import { createHistory } from '@/stores/create-history';
import type { TimelineTrack } from '@/types';

function makeTracks(count: number): TimelineTrack[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `track-${i}`,
    type: 'video' as const,
    name: `Track ${i}`,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 60,
  }));
}

describe('createHistory undo/redo', () => {
  bench('20-step undo/redo cycle on 10 tracks', () => {
    const hist = createHistory<TimelineTrack[]>({ maxSize: 19 });
    const tracks = makeTracks(10);

    for (let i = 0; i < 20; i++) {
      hist.save(tracks);
      tracks[0] = { ...tracks[0], name: `Track ${i}` };
    }
    // undo 10 times
    for (let i = 0; i < 10; i++) {
      hist.undo(tracks);
    }
    // redo 10 times
    for (let i = 0; i < 10; i++) {
      hist.redo(tracks);
    }
  });

  bench('50-step save (no undo) on 10 tracks', () => {
    const hist = createHistory<TimelineTrack[]>({ maxSize: 49 });
    const tracks = makeTracks(10);

    for (let i = 0; i < 50; i++) {
      hist.save(tracks);
    }
  });
});
