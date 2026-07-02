import { videoAnalysis } from './methods/video-analysis';
import { highlightDetection } from './methods/highlight-detection';
import { renderTranscode } from './methods/render-transcode';
import { subtitleAsr } from './methods/subtitle-asr';
import { tts } from './methods/tts';
import { mixAudio } from './methods/mix-audio';
import { fileOperations } from './methods/file-operations';
import { project } from './methods/project';
import { aiScript } from './methods/ai-script';
import { commentary } from './methods/commentary';

// ─── Tauri API Surface ─────────────────────────────────────────────────────────
// Explicitly declared so TypeScript knows every method without relying on inference
export const tauri = {
  // FFmpeg / Video analysis
  checkFFmpeg: videoAnalysis.checkFFmpeg,
  analyzeVideo: videoAnalysis.analyzeVideo,
  runFFprobe: videoAnalysis.runFFprobe,
  getExportDir: project.getExportDir,

  // Highlight detection
  detectHighlights: highlightDetection.detectHighlights,
  detectZCRBursts: highlightDetection.detectZCRBursts,
  detectSmartSegments: highlightDetection.detectSmartSegments,

  // Render / Transcode
  transcodeWithCrop: renderTranscode.transcodeWithCrop,
  renderAutonomousCut: renderTranscode.renderAutonomousCut,
  generatePreview: renderTranscode.generatePreview,
  cutVideo: renderTranscode.cutVideo,
  exportVideo: renderTranscode.exportVideo,
  cancelExport: renderTranscode.cancelExport,

  // Subtitles / ASR
  extractSubtitles: subtitleAsr.extractSubtitles,
  burnInSubtitles: subtitleAsr.burnInSubtitles,
  transcribeAudio: subtitleAsr.transcribeAudio,

  // TTS
  synthesizeSpeech: tts.synthesizeSpeech,
  listTTSBackends: tts.listTTSBackends,
  checkTTSAvailable: tts.checkTTSAvailable,
  mixAudio: mixAudio.mixAudio,
  getAudioDuration: mixAudio.getAudioDuration,

  // File operations
  readTextFile: fileOperations.readTextFile,
  writeTextFile: fileOperations.writeTextFile,
  deleteFile: fileOperations.deleteFile,
  fileExists: fileOperations.fileExists,
  cleanTempFile: fileOperations.cleanTempFile,
  openFile: fileOperations.openFile,
  voiceDiscovery: fileOperations.voiceDiscovery,
  getFileSize: fileOperations.getFileSize,

  // Project
  saveProjectFile: project.saveProjectFile,
  loadProjectFile: project.loadProjectFile,
  deleteProjectFile: project.deleteProjectFile,
  listProjectFiles: project.listProjectFiles,
  listAppDataFiles: project.listAppDataFiles,
  checkAppDataDirectory: project.checkAppDataDirectory,

  // AI Script
  generateNarrationScript: aiScript.generateNarrationScript,
  analyzeVideoForNarration: aiScript.analyzeVideoForNarration,
  listAvailableModels: aiScript.listAvailableModels,

  // Commentary / Director
  createSession: commentary.createSession,
  getStatus: commentary.getStatus,
  startAnalysis: commentary.startAnalysis,
  generatePlan: commentary.generatePlan,
  approvePlan: commentary.approvePlan,
  revisePlan: commentary.revisePlan,
  completeRender: commentary.completeRender,
  destroySession: commentary.destroySession,
  generateScript: commentary.generateScript,
  synthesizeAudio: commentary.synthesizeAudio,
  estimateTTSDuration: commentary.estimateTTSDuration,
  listVoices: commentary.listVoices,
} as const;

export default tauri;

// Re-export types and invoke from invoke for barrel import from index
export { TauriCommand, TauriBridgeError, invoke, rawInvoke } from './invoke';
export type { BridgeOptions } from './invoke';