import { describe, it, expect } from 'vitest';
import {
  preloadProjectsPage,
  preloadProjectEditPage,
  preloadProjectDetailPage,
  preloadVideoEditorPage,
  preloadAIVideoEditorPage,
  preloadSettingsPage,
} from '../route-preload';

describe('route-preload', () => {
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
      // Check that functions return promises (without executing them to avoid side effects)
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
  });
});
