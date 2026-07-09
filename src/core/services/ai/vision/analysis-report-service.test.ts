/**
 * 视频分析报告服务回归基线测试
 * 目的：在「阶段1（D6 把 formatDuration 这层无意义包装内联）」动工之前，
 *      锁住「公开方法 generateReport 摘要里对时长的格式化输出」保持不变。
 *
 * 说明：formatDuration 是私有方法，内部直接调用 formatDurationChinese。
 *      D6 计划把这一层包装内联（即改为直接调用 formatDurationChinese），
 *      输出应当完全等价。因此这里通过唯一用到它的公开方法 generateReport
 *      来断言 summary 中时长片段 == formatDurationChinese(seconds)，
 *      这样无论 D6 是否内联，输出都不变。
 */

import { describe, it, expect } from 'vitest';
import { analysisReportService } from './analysis-report-service';
import { formatDurationChinese } from '@/shared/utils/formatting';
import type { VideoInfo, Scene, ObjectDetection, EmotionAnalysis } from '@/types';

function buildVideoInfo(duration: number): VideoInfo {
  return {
    id: 'v1',
    name: 'clip.mp4',
    path: '/videos/clip.mp4',
    duration,
    width: 1920,
    height: 1080,
    size: 0,
    fps: 30,
    format: 'mp4',
  };
}

function buildScene(type: Scene['type']): Scene {
  return {
    id: 's1',
    startTime: 0,
    endTime: 5,
    type,
    score: 0.9,
    description: '场景描述',
    thumbnail: '',
  };
}

describe('generateReport — formatDuration (D6 内联锁)', () => {
  const cases = [
    { seconds: 0, note: '0 秒边界' },
    { seconds: 65, note: '1 分 5 秒' },
    { seconds: 120, note: '2 分 0 秒' },
    { seconds: 3661, note: '1 小时 1 分 1 秒' },
  ];

  it.each(cases)(
    'summary 中时长片段等于 formatDurationChinese($seconds) — $note',
    async ({ seconds }) => {
      const videoInfo = buildVideoInfo(seconds);
      const scenes: Scene[] = [buildScene('intro')];
      const objects: ObjectDetection[] = [
        { id: 'o1', label: 'person', confidence: 0.9, bbox: [0, 0, 1, 1], category: 'person' },
      ];
      const emotions: EmotionAnalysis[] = [{ dominant: 'positive', timestamp: 0 }];

      const report = await analysisReportService.generateReport(
        videoInfo,
        scenes,
        objects,
        emotions,
      );

      const expected = formatDurationChinese(seconds);
      expect(report.summary).toContain(expected);
      expect(report.summary.startsWith(`视频时长 ${expected}`)).toBe(true);

      // 结构健全性（确保 D6 改动未破坏整体报告）
      expect(report.scenes).toHaveLength(1);
      expect(report.objects).toHaveLength(1);
      expect(report.stats!.sceneCount).toBe(1);
    },
  );
});

describe('generateSceneDescription (公开方法附加覆盖)', () => {
  it('拼接场景类型名、物体类别与情感基调', () => {
    const scene = buildScene('product');
    const objects: ObjectDetection[] = [
      { id: 'o1', label: 'phone', confidence: 0.9, bbox: [0, 0, 1, 1], category: '手机' },
    ];
    const emotion: EmotionAnalysis = { dominant: 'positive', timestamp: 0 };

    const desc = analysisReportService.generateSceneDescription(scene, objects, emotion);

    expect(desc).toContain('产品展示');
    expect(desc).toContain('手机');
    expect(desc).toContain('积极');
  });
});
