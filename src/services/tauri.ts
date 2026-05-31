/**
 * Services barrel — backward compatibility re-export.
 * All functions have been migrated to core/services/ domain modules.
 * This file re-exports from those modules to avoid breaking existing imports.
 * @deprecated Import directly from the new service modules instead.
 */

// Project file service
export {
  PROJECTS_CHANGED_EVENT,
  emitProjectsChanged,
  ensureAppDataDir,
  saveProjectToFile,
  loadProjectFromFile,
  loadProjectWithRetry,
  listProjects,
  deleteProject,
  normalizeListedProject,
  type ProjectFileData,
} from '@/core/services/project/projectFileService';

// Auth service
export { getApiKey, saveApiKey } from '@/core/services/auth/apiKeyService';

// Storage service
export { getAppData, saveAppData } from '@/core/services/storage/appDataService';

// Transcode/crop service
export { transcodeWithCrop, exportMultiFormat, type AspectRatio, type ExportQuality, type TranscodeCropOptions } from '@/core/services/export/transcodeCropService';

// File info service
export { getFileSizeBytes, getFileSizeMb, checkFFmpeg } from '@/core/services/file/fileInfoService';

// Script export — kept here (standalone utility)
export { exportScriptToFile } from '@/core/services/export/scriptExportService';

// URL utilities — kept here (standalone utility)
export { openExternalUrl } from '@/shared/utils/url';