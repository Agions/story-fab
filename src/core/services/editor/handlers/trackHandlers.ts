/**
 * Track Action Handlers - 轨道相关动作处理器
 */

import { BaseActionHandler } from './base';
import type { EditorAction, Timeline } from '../../../types/timeline';
import {
  addText as addTextOp,
  addAudio as addAudioOp,
} from '../timelineOperations';

// ============================================================
// ADD_TEXT Handler
// ============================================================

export class AddTextHandler extends BaseActionHandler {
  readonly actionType = 'ADD_TEXT' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADD_TEXT') return timeline;
    return addTextOp(timeline, action.trackId, action.text, action.position);
  }
}

// ============================================================
// ADD_AUDIO Handler
// ============================================================

export class AddAudioHandler extends BaseActionHandler {
  readonly actionType = 'ADD_AUDIO' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADD_AUDIO') return timeline;
    return addAudioOp(timeline, action.trackId, action.audio, action.position);
  }
}
