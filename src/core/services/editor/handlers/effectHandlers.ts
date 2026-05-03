/**
 * Effect Action Handlers - 特效相关动作处理器
 */

import { BaseActionHandler } from './base';
import type { EditorAction, Timeline } from '../../../types/timeline';
import {
  addTransition as addTransitionOp,
  addEffect as addEffectOp,
  adjustSpeed as adjustSpeedOp,
  adjustVolume as adjustVolumeOp,
} from '../timelineOperations';

// ============================================================
// ADD_TRANSITION Handler
// ============================================================

export class AddTransitionHandler extends BaseActionHandler {
  readonly actionType = 'ADD_TRANSITION' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADD_TRANSITION') return timeline;
    return addTransitionOp(
      timeline,
      action.fromClipId,
      action.toClipId,
      action.transitionType,
      action.duration
    );
  }
}

// ============================================================
// ADD_EFFECT Handler
// ============================================================

export class AddEffectHandler extends BaseActionHandler {
  readonly actionType = 'ADD_EFFECT' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADD_EFFECT') return timeline;
    return addEffectOp(timeline, action.clipId, action.effect, action.params);
  }
}

// ============================================================
// ADJUST_SPEED Handler
// ============================================================

export class AdjustSpeedHandler extends BaseActionHandler {
  readonly actionType = 'ADJUST_SPEED' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADJUST_SPEED') return timeline;
    return adjustSpeedOp(timeline, action.clipId, action.speed);
  }
}

// ============================================================
// ADJUST_VOLUME Handler
// ============================================================

export class AdjustVolumeHandler extends BaseActionHandler {
  readonly actionType = 'ADJUST_VOLUME' as const;
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'ADJUST_VOLUME') return timeline;
    return adjustVolumeOp(timeline, action.trackId, action.volume);
  }
}
