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
} from '@/core/services/project/project-file-service';

// Auth service
export { getApiKey } from '@/core/services/auth/apiKeyService';

// Transcode/crop service
export { transcodeWithCrop } from '@/core/services/export/transcode-crop-service';

// File info service
export { getFileSizeBytes, getFileSizeMb } from '@/core/services/file/file-info-service';

// Script export — kept here (standalone utility)
export { exportScriptToFile } from '@/core/services/export/script-export-service';
