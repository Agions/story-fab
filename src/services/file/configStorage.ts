// Re-export config storage operations from tauri service as single source of truth
export {
  getApiKey,
  saveApiKey,
  getAppData,
  saveAppData,
} from '../tauri';
