import type { Scene, ScriptSegment } from '@/core/types';

export interface SceneCommentaryAlignment {
  sceneId: string;
  segmentId: string;
  sceneStart: number;
  sceneEnd: number;
  segmentStart: number;
  segmentEnd: number;
  driftSeconds: number;
  confidence: number;
}

export interface OriginalOverlayPlanItem {
  sceneId: string;
  startTime: number;
  endTime: number;
  reason: 'motion' | 'emotion' | 'transition' | 'anchor';
}

export class SceneCommentaryAlignmentService {
  /**
   * 将解说段落与镜头段落做时间对齐，返回可用于 QA 的匹配结果。
   */
  align(scenes: Scene[], segments: ScriptSegment[]): SceneCommentaryAlignment[] {
    const safeScenes = [...scenes].sort((a, b) => a.startTime - b.startTime);
    const safeSegments = [...segments].sort((a, b) => a.startTime - b.startTime);

    return safeSegments.map((segment) => {
      const targetMid = (segment.startTime + segment.endTime) / 2;
      const bestScene =
        safeScenes.reduce<Scene | null>((best, scene) => {
          if (!best) {
            return scene;
          }
          const bestMid = (best.startTime + best.endTime) / 2;
          const sceneMid = (scene.startTime + scene.endTime) / 2;
          return Math.abs(sceneMid - targetMid) < Math.abs(bestMid - targetMid) ? scene : best;
        }, null) || safeScenes[0];

      const segmentDuration = Math.max(segment.endTime - segment.startTime, 0.001);
      const sceneDuration = Math.max(bestScene.endTime - bestScene.startTime, 0.001);
      const driftSeconds = Math.abs(targetMid - (bestScene.startTime + bestScene.endTime) / 2);
      const durationPenalty = Math.abs(segmentDuration - sceneDuration) / Math.max(segmentDuration, sceneDuration);
      const confidence = Math.max(0, Math.min(1, 1 - driftSeconds / 5 - durationPenalty * 0.4));

      return {
        sceneId: bestScene.id,
        segmentId: segment.id,
        sceneStart: bestScene.startTime,
        sceneEnd: bestScene.endTime,
        segmentStart: segment.startTime,
        segmentEnd: segment.endTime,
        driftSeconds,
        confidence,
      };
    });
  }

  /**
   * 自动生成“原画覆盖轨”建议，用于强化画面与解说一致性。
   */
  buildOriginalOverlayPlan(scenes: Scene[]): OriginalOverlayPlanItem[] {
    return scenes
      .filter((scene) => scene.endTime > scene.startTime)
      .map((scene, index) => {
        const motionScore = scene.features?.motionScore ?? 0;
        const reason: OriginalOverlayPlanItem['reason'] =
          motionScore > 0.7 ? 'motion' : scene.dominantEmotion ? 'emotion' : index % 3 === 0 ? 'anchor' : 'transition';

        return {
          sceneId: scene.id,
          startTime: scene.startTime,
          endTime: scene.endTime,
          reason,
        };
      });
  }
}

export const sceneCommentaryAlignmentService = new SceneCommentaryAlignmentService();
