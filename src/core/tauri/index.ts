import { videoAnalysis } from './methods/videoAnalysis';
import { highlightDetection } from './methods/highlightDetection';
import { renderTranscode } from './methods/renderTranscode';
import { subtitleAsr } from './methods/subtitleAsr';
import { tts } from './methods/tts';
import { fileOperations } from './methods/fileOperations';
import { project } from './methods/project';
import { aiScript } from './methods/aiScript';

export const tauri = {
  ...videoAnalysis,
  ...highlightDetection,
  ...renderTranscode,
  ...subtitleAsr,
  ...tts,
  ...fileOperations,
  ...project,
  ...aiScript,
};

export default tauri;

// Re-export types and invoke from TauriBridge for barrel import from index
export { TauriCommand, TauriBridgeError, invoke } from './TauriBridge';
export type { BridgeOptions } from './TauriBridge';