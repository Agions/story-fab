/**
 * Action Handlers Index - 动作处理器导出
 * 
 * 策略模式：所有动作处理器在此集中注册和管理
 */

// Base
export { BaseActionHandler } from './base';

// Clip handlers
export {
  AddClipHandler,
  RemoveClipHandler,
  MoveClipHandler,
  TrimClipHandler,
  SplitClipHandler,
  CopyClipHandler,
} from './clipHandlers';

// Effect handlers
export {
  AddTransitionHandler,
  AddEffectHandler,
  AdjustSpeedHandler,
  AdjustVolumeHandler,
} from './effectHandlers';

// Track handlers
export {
  AddTextHandler,
  AddAudioHandler,
} from './trackHandlers';

// History handlers
export {
  UndoHandler,
  RedoHandler,
} from './historyHandlers';
