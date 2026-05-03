/**
 * Clip Action Handlers - 剪辑相关动作处理器
 */

import { BaseActionHandler } from './base';
import type { EditorAction, Timeline, VideoClip } from '../../types/timeline';
import {
  addClip as addClipOp,
  removeClip as removeClipOp,
  moveClip as moveClipOp,
  trimClip as trimClipOp,
  splitClip as splitClipOp,
  copyClip as copyClipOp,
} from '../timelineOperations';

// ============================================================
// ADD_CLIP Handler
// ============================================================

export class AddClipHandler extends BaseActionHandler {
  readonly actionType = 'ADD_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADD_CLIP') return timeline;
    return addClipOp(timeline, action.trackId, action.clip, action.position);
  }
}

// ============================================================
// REMOVE_CLIP Handler
// ============================================================

export class RemoveClipHandler extends BaseActionHandler {
  readonly actionType = 'REMOVE_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'REMOVE_CLIP') return timeline;
    return removeClipOp(timeline, action.trackId, action.clipId);
  }
}

// ============================================================
// MOVE_CLIP Handler
// ============================================================

export class MoveClipHandler extends BaseActionHandler {
  readonly actionType = 'MOVE_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'MOVE_CLIP') return timeline;
    return moveClipOp(timeline, action.trackId, action.clipId, action.newPosition);
  }
}

// ============================================================
// TRIM_CLIP Handler
// ============================================================

export class TrimClipHandler extends BaseActionHandler {
  readonly actionType = 'TRIM_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'TRIM_CLIP') return timeline;
    return trimClipOp(timeline, action.clipId, action.startTime, action.endTime);
  }
}

// ============================================================
// SPLIT_CLIP Handler
// ============================================================

export class SplitClipHandler extends BaseActionHandler {
  readonly actionType = 'SPLIT_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'SPLIT_CLIP') return timeline;
    return splitClipOp(timeline, action.clipId, action.splitTime);
  }
}

// ============================================================
// COPY_CLIP Handler
// ============================================================

export class CopyClipHandler extends BaseActionHandler {
  readonly actionType = 'COPY_CLIP' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'COPY_CLIP') return timeline;
    return copyClipOp(timeline, action.clipId);
  }
}
