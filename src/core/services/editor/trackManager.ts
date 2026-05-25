/**
 * @deprecated trackManager 已合并到 trackOperations.ts
 * 此文件保留以防仍有旧引用
 */

// Re-export for backward compatibility — signature matches what EditorService expects
// Note: createTrack(timeline, options) returns Timeline, but EditorService expects {trackId}
// This mismatch is a pre-existing architectural issue; trackManager re-exports as-is
export { createTrack } from './trackOperations';
