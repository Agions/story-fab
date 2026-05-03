/**
 * Action Handler Base - 动作处理器基类
 * 
 * 策略模式基类，所有具体动作处理器继承此类
 */

import type { IActionHandler } from '../../../interfaces/editor.interface';
import type { EditorAction, Timeline } from '../../../types/timeline';

export abstract class BaseActionHandler implements IActionHandler {
  abstract readonly actionType: EditorAction['type'];
  
  handle(timeline: Timeline, _action: EditorAction): Timeline {
    throw new Error(`Handler ${this.actionType} must implement handle()`);
  }
  
  canHandle(action: EditorAction): boolean {
    return action.type === this.actionType;
  }
}
