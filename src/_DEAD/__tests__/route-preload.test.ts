/**
 * route-preload 单元测试
 *
 * 注意：这些测试 mock 了页面模块的动态导入，避免在并行 worker 环境下
 * 触发 jsdom teardown 后加载 React 组件的错误。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 所有页面模块（避免加载 React 组件到测试环境）
vi.mock('@/pages/Projects/index', () => ({}));
vi.mock('@/pages/ProjectEdit/index', () => ({}));
vi.mock('@/pages/ProjectDetail/index', () => ({}));
vi.mock('@/pages/VideoEditor/index', () => ({}));
vi.mock('@/pages/AIVideoEditor/index', () => ({}));
vi.mock('@/pages/Settings/index', () => ({}));

import {
  preloadProjectsPage,
  preloadProjectEditPage,
  preloadProjectDetailPage,
  preloadVideoEditorPage,
  preloadAIVideoEditorPage,
  preloadSettingsPage,
} from '../route-preload';

describe('route-preload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exports', () => {
    it('should export preloadProjectsPage', () => {
      expect(preloadProjectsPage).toBeDefined();
      expect(typeof preloadProjectsPage).toBe('function');
    });

    it('should export preloadProjectEditPage', () => {
      expect(preloadProjectEditPage).toBeDefined();
      expect(typeof preloadProjectEditPage).toBe('function');
    });

    it('should export preloadProjectDetailPage', () => {
      expect(preloadProjectDetailPage).toBeDefined();
      expect(typeof preloadProjectDetailPage).toBe('function');
    });

    it('should export preloadVideoEditorPage', () => {
      expect(preloadVideoEditorPage).toBeDefined();
      expect(typeof preloadVideoEditorPage).toBe('function');
    });

    it('should export preloadAIVideoEditorPage', () => {
      expect(preloadAIVideoEditorPage).toBeDefined();
      expect(typeof preloadAIVideoEditorPage).toBe('function');
    });

    it('should export preloadSettingsPage', () => {
      expect(preloadSettingsPage).toBeDefined();
      expect(typeof preloadSettingsPage).toBe('function');
    });
  });

  describe('function signatures', () => {
    it('all preload functions should return Promise', () => {
      const results = [
        preloadProjectsPage(),
        preloadProjectEditPage(),
        preloadProjectDetailPage(),
        preloadVideoEditorPage(),
        preloadAIVideoEditorPage(),
        preloadSettingsPage(),
      ];

      results.forEach((result) => {
        expect(result).toBeInstanceOf(Promise);
      });
    });

    it('should cache repeated calls to the same preload function', async () => {
      const first = preloadProjectsPage();
      const second = preloadProjectsPage();
      expect(first).toBe(second); // Same promise reference
    });
  });
});
