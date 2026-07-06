/** @see docs/architecture-audit-2026.md P3 step⑥ — edit-step 包 */

export { default as ProjectSetup } from './project-setup';
export { default as VideoUpload } from './video-upload';
export { default as ScriptWriting } from './script-writing';
export { default as StepList } from './step-list';

export { FUNCTION_CONFIG } from './function-config';
export {
  SCRIPT_STYLES,
  COMMENTARY_STYLES,
  SCRIPT_LENGTHS,
  type ScriptGenerateProps,
} from './script-config';
export {
  videoUploadReducer,
  initialVideoUploadState,
  type VideoUploadState,
} from './video-upload.reducer';
