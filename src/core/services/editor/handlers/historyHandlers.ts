/**
 * History Action Handlers - 历史记录相关动作处理器
 * 
 * 注意: UNDO/REDO 是特殊的 action，它们不接受 timeline 参数，
 * 而是直接操作 history 状态。因此这类 handler 需要访问 EditorService
 * 的 history 实例。
 */

import { BaseActionHandler } from './base';
import type { EditorAction, Timeline } from '../../types/timeline';

// ============================================================
// UNDO Handler
// ============================================================

export class UndoHandler extends BaseActionHandler {
  readonly actionType = 'UNDO' as const;
  
  // UNDO handler 需要访问外部的 history 和 history 更新方法
  // 这里通过构造函数注入
  
  constructor(
    private getHistory: () => { past: Timeline[]; present: Timeline; future: Timeline[] },
    private setHistory: (h: { past: Timeline[]; present: Timeline; future: Timeline[] }) => void,
    private notify: () => void
  ) {
    super();
  }
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'UNDO') return timeline;
    
    const history = this.getHistory();
    if (history.past.length === 0) return timeline;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    const newHistory = {
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    };
    
    this.setHistory(newHistory);
    this.notify();
    
    return previous;
  }
}

// ============================================================
// REDO Handler
// ============================================================

export class RedoHandler extends BaseActionHandler {
  readonly actionType = 'REDO' as const;
  
  constructor(
    private getHistory: () => { past: Timeline[]; present: Timeline; future: Timeline[] },
    private setHistory: (h: { past: Timeline[]; present: Timeline; future: Timeline[] }) => void,
    private notify: () => void
  ) {
    super();
  }
  
  handle(timeline: Timeline, action: EditorAction): Timeline {
    if (action.type !== 'REDO') return timeline;
    
    const history = this.getHistory();
    if (history.future.length === 0) return timeline;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    const newHistory = {
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    };
    
    this.setHistory(newHistory);
    this.notify();
    
    return next;
  }
}
