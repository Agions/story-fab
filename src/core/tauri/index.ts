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
import { videoOperations } from './methods/video-operations';

// ─── Tauri API Surface ─────────────────────────────────────────────────────────
// Explicitly declared so TypeScript knows every method without relying on inference
export const tauri = {
  // FFmpeg / Video analysis
  checkFFmpeg: videoAnalysis.checkFFmpeg,
  analyzeVideo: videoAnalysis.analyzeVideo,
  runFfprobe: videoAnalysis.runFfprobe,

  // Highlight detection
  detectHighlights: highlightDetection.detectHighlights,
  detectZCRBursts: highlightDetection.detectZCRBursts,
  detectSmartSegments: highlightDetection.detectSmartSegments,

  // Render / Transcode
  transcodeWithCrop: renderTranscode.transcodeWithCrop,
  autonomousRender: renderTranscode.autonomousRender,
  generatePreview: renderTranscode.generatePreview,
  cutVideo: renderTranscode.cutVideo,
  exportVideo: renderTranscode.exportVideo,
  extractSubtitle: subtitleAsr.extractSubtitle,
  burnSubtitle: subtitleAsr.burnSubtitle,
  transcribeAudio: subtitleAsr.transcribeAudio,
  listWhisperModels: subtitleAsr.listWhisperModels,
  checkFasterWhisper: subtitleAsr.checkFasterWhisper,
  downloadWhisperModel: subtitleAsr.downloadWhisperModel,
  getWhisperLanguages: subtitleAsr.getWhisperLanguages,

  // TTS
  synthesizeSpeech: tts.synthesizeSpeech,
  listTTSBackends: tts.listTTSBackends,
  checkTTSAvailable: tts.checkTTSAvailable,
  mixAudio: mixAudio,

  // File operations
  readTextFile: fileOperations.readTextFile,
  writeTextFile: fileOperations.writeTextFile,
  deleteFile: fileOperations.deleteFile,
  cleanTempFile: fileOperations.cleanTempFile,
  openFile: fileOperations.openFile,
  getFileSize: fileOperations.getFileSize,
  voiceDiscovery: fileOperations.voiceDiscovery,

  // Project
  getExportDir: project.getExportDir,
  saveProject: project.saveProject,
  loadProject: project.loadProject,
  deleteProject: project.deleteProject,
  listProjects: project.listProjects,
  listAppDataFiles: project.listAppDataFiles,
  checkAppDataDir: project.checkAppDataDir,

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
  cancelExport: commentary.cancelExport,

  // Video operations (from VideoAnalyzer direct invoke)
  extractKeyFrames: videoOperations.extractKeyFrames,
  generateThumbnail: videoOperations.generateThumbnail,
} as const;

export default tauri;

// Re-export types and invoke from invoke for barrel import from index
export { TauriCommand, TauriBridgeError, invoke, rawInvoke } from './invoke';
export type { BridgeOptions } from './invoke';