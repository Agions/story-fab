/**
 * Services barrel — backward compatibility re-export.
 * @deprecated Import directly from @/core/services/* instead.
 */

// Project file service
export {
  PROJECTS_CHANGED_EVENT,
  saveProjectToFile,
  loadProjectWithRetry,
  listProjects,
  deleteProject,
} from '@/core/services/project/projectFileService';

// Auth service
export { getApiKey } from '@/core/services/auth/apiKeyService';

// Transcode/crop service
export { transcodeWithCrop } from '@/core/services/export/transcodeCropService';

// File info service
export { getFileSizeBytes, getFileSizeMb } from '@/core/services/file/fileInfoService';

// Script export — kept here (standalone utility)
export { exportScriptToFile } from '@/core/services/export/scriptExportService';
