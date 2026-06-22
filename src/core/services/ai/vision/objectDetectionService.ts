/**
 * 物体检测服务
 * 职责：视频中的物体识别和分类
 */

import type { VideoInfo, Scene, ObjectDetection } from '@/core/types';
import { OBJECT_CATEGORIES } from '../types';

// ============================================
// 物体检测服务
// ============================================

class ObjectDetectionService {
  /**
   * 检测场景中的物体
   * @param scenes 场景列表
   * @param videoInfo 视频信息
   * @returns 物体检测结果列表
   * @deprecated 🔴 BETA — 当前使用 Math.random() 生成假检测结果
   */
  async detectObjectsInScenes(
    scenes: Scene[],
    _videoInfo: VideoInfo
  ): Promise<ObjectDetection[]> {
    const objects: ObjectDetection[] = [];

    for (const scene of scenes) {
      // 模拟物体检测
      const numObjects = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numObjects; i++) {
        const category = OBJECT_CATEGORIES[Math.floor(Math.random() * OBJECT_CATEGORIES.length)];

        objects.push({
          id: `obj_${scene.id}_${i}`,
          sceneId: scene.id,
          category,
          label: `${category} ${i + 1}`,
          confidence: Math.random() * 0.3 + 0.7,
          bbox: [
            Math.random() * 0.6,
            Math.random() * 0.6,
            Math.random() * 0.3 + 0.1,
            Math.random() * 0.3 + 0.1,
          ] as [number, number, number, number],
        });
      }
    }

    return objects;
  }

  /**
   * 按场景分组物体
   * @param objects 物体列表
   * @returns Map<sceneId, ObjectDetection[]>
   */
  groupObjectsByScene(objects: ObjectDetection[]): Map<string, ObjectDetection[]> {
    const objectMap = new Map<string, ObjectDetection[]>();

    for (const obj of objects) {
      if (obj.sceneId == null) continue;
      const list = objectMap.get(obj.sceneId) ?? [];
      list.push(obj);
      objectMap.set(obj.sceneId, list);
    }

    return objectMap;
  }

  /**
   * 获取物体类别统计
   * @param objects 物体列表
   * @returns 类别计数
   */
  getObjectCategoryStats(objects: ObjectDetection[]): Record<string, number> {
    return objects.reduce((countsByCategory, obj) => {
      const key = Array.isArray(obj.category) ? obj.category[0] : obj.category;
      countsByCategory[key || 'unknown'] = (countsByCategory[key || 'unknown'] || 0) + 1;
      return countsByCategory;
    }, {} as Record<string, number>);
  }
}

// 导出单例
export const objectDetectionService = new ObjectDetectionService();
