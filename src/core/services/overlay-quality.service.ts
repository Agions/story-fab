export interface OverlayWindow {
  start: number;
  end: number;
  reason?: string;
}

export interface SubtitleWindow {
  start: number;
  end: number;
}

export interface OverlayQualityReport {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  overlapRatio: number;
  denseOverlayRatio: number;
  suggestions: string[];
}

function overlapDuration(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

export class OverlayQualityService {
  evaluate(
    overlays: OverlayWindow[],
    subtitles: SubtitleWindow[],
    duration: number
  ): OverlayQualityReport {
    const totalDuration = Math.max(duration, 0.001);
    const overlayTotal = overlays.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0);
    const subtitleTotal = subtitles.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0);

    let overlapTotal = 0;
    for (const overlay of overlays) {
      for (const subtitle of subtitles) {
        overlapTotal += overlapDuration(overlay.start, overlay.end, subtitle.start, subtitle.end);
      }
    }

    const overlapRatio = Math.min(1, overlapTotal / totalDuration);
    const denseOverlayRatio = Math.min(1, overlayTotal / totalDuration);

    let score = 100;
    score -= overlapRatio * 55;
    score -= denseOverlayRatio > 0.45 ? (denseOverlayRatio - 0.45) * 60 : 0;
    score -= subtitleTotal / totalDuration > 0.85 ? 8 : 0;
    score = Math.max(0, Math.round(score));

    const suggestions: string[] = [];
    if (overlapRatio > 0.28) {
      suggestions.push('原画与字幕重叠较多，建议降低原画时段覆盖或切换到上方 PIP。');
    }
    if (denseOverlayRatio > 0.55) {
      suggestions.push('原画轨过于密集，建议减少 anchor/motion 片段叠加时长。');
    }
    if (suggestions.length === 0) {
      suggestions.push('当前原画轨遮挡风险可控，可直接导出。');
    }

    const riskLevel: OverlayQualityReport['riskLevel'] =
      score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      score,
      riskLevel,
      overlapRatio: Number(overlapRatio.toFixed(3)),
      denseOverlayRatio: Number(denseOverlayRatio.toFixed(3)),
      suggestions,
    };
  }
}

export const overlayQualityService = new OverlayQualityService();
