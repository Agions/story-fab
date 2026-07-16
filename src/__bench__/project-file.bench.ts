/**
 * 项目文件操作性能基准
 *
 * Stage 8 PR-5.1。
 * 覆盖项目文件 normalize 路径性能（用户在打开/保存项目时频繁触发）。
 */
import { bench, describe } from 'vitest';
import { normalizeProjectFile } from '@/core/utils/project-file';

function makeProjectLike(scale: 'small' | 'large') {
  const scriptCount = scale === 'small' ? 5 : 50;
  return {
    id: 'proj-1',
    name: 'Benchmark Project',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-16T00:00:00Z',
    videoUrl: 'tauri://localhost/videos/test.mp4',
    videoPath: '/videos/test.mp4',
    scripts: Array.from({ length: scriptCount }, (_, i) => ({
      id: `script-${i}`,
      projectId: 'proj-1',
      content: Array.from({ length: 20 }, (_, j) => ({
        id: `seg-${i}-${j}`,
        startTime: j * 5,
        endTime: (j + 1) * 5,
        content: `段落 ${j} 的内容`.repeat(3),
      })),
      fullText: 'full text '.repeat(100),
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-07-16T00:00:00Z',
      modelUsed: 'gpt-4o',
    })),
  };
}

describe('project file normalize', () => {
  bench('normalizeProjectFile small (5 scripts)', () => {
    normalizeProjectFile(makeProjectLike('small'));
  });

  bench('normalizeProjectFile large (50 scripts)', () => {
    normalizeProjectFile(makeProjectLike('large'));
  });
});
