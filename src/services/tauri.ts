import { tauri } from '../core/tauri/TauriBridge';
import { save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, BaseDirectory, mkdir, exists } from '@tauri-apps/plugin-fs';
import { load } from '@tauri-apps/plugin-store';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { normalizeProjectId, buildProjectIdCandidates } from '../core/utils/project-id';
import { logger } from '../shared/utils/logging';
import { formatTime } from '../shared/utils/formatting';
import { getConfigDir } from './file/fileOperations';

const errMsg = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

type ProjectFileData = {
  aiModel?: {
    apiKey?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ExportScriptSegment = {
  startTime: number;
  endTime: number;
  content: string;
};

type ExportScriptData = {
  projectName: string;
  createdAt: string;
  segments: ExportScriptSegment[];
};

export const PROJECTS_CHANGED_EVENT = 'StoryFab:projects:changed';

const emitProjectsChanged = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeListedProject = (value: unknown): ProjectFileData | null => {
  if (!isRecord(value)) return null;

  const rawId = typeof value.id === 'string' ? value.id : '';
  const fallbackId = typeof value.projectId === 'string' ? value.projectId : '';
  const normalizedId = normalizeProjectId(rawId || fallbackId);
  if (!normalizedId) return null;

  const merged: ProjectFileData = {
    ...value,
    id: normalizedId,
  };

  if (typeof merged.name !== 'string' || !merged.name.trim()) {
    merged.name = `项目 ${normalizedId.slice(0, 8)}`;
  }
  if (typeof merged.updatedAt !== 'string') {
    merged.updatedAt = typeof merged.createdAt === 'string'
      ? merged.createdAt
      : new Date().toISOString();
  }

  return merged;
};

// 确保应用数据目录
export const ensureAppDataDir = async (): Promise<void> => {
  const appDir = 'story-fab';

  // 优先使用 Rust 函数检查目录
  try {
    const dirPath = await tauri.checkAppDataDir();
    logger.info('Rust目录检查成功', { dirPath });
    return;
  } catch (rustError) {
    logger.warn('Rust目录检查失败，回退到前端检查', { rustError });
  }

  // 前端检查
  const dirExists = await exists(appDir, { baseDir: BaseDirectory.AppData }).catch((e) => {
    logger.error('检查目录是否存在时出错', { e });
    throw new Error(`检查目录出错: ${errMsg(e)}`);
  });

  if (dirExists) return;

  // 创建目录
  logger.info('应用数据目录不存在，创建目录', { appDir });
  await mkdir(appDir, { baseDir: BaseDirectory.AppData, recursive: true }).catch((e) => {
    logger.error('创建目录失败', { e });
    throw new Error(`创建目录失败: ${errMsg(e)}`);
  });

  // 验证目录是否创建成功
  const checkExists = await exists(appDir, { baseDir: BaseDirectory.AppData });
  if (!checkExists) {
    throw new Error('无法创建应用数据目录，请检查权限');
  }
  logger.info('应用数据目录创建成功');
};

// 保存项目数据到文件
export const saveProjectToFile = async (projectId: string, project: object): Promise<void> => {
  const normalizedProjectId = normalizeProjectId(projectId || '');
  if (!project || !normalizedProjectId) {
    throw new Error('无效的项目数据');
  }

  // 确保目录存在
  await ensureAppDataDir().catch((err) => {
    throw new Error(`应用数据目录错误: ${err.message || '未知错误'}`);
  });

  // 准备项目数据（移除可能导致循环引用的字段）
  const cleanProject = { ...(project as ProjectFileData) };
  if (cleanProject.aiModel?.apiKey) {
    cleanProject.aiModel = { ...cleanProject.aiModel, apiKey: undefined };
  }

  const projectData = JSON.stringify(cleanProject, null, 2);
  if (!projectData) throw new Error('项目数据序列化为空');

  const projectPath = `story-fab/${normalizedProjectId}.json`;

  // 优先使用 Rust 函数写入
  try {
    await tauri.saveProject(normalizedProjectId, projectData);
    emitProjectsChanged();
    logger.info('文件写入成功 (通过Rust函数)', { projectPath });
    return;
  } catch (rustErr) {
    logger.warn('通过Rust保存文件失败，尝试使用JS API保存', { rustErr });
  }

  // JS API 备选方案
  await writeTextFile(projectPath, projectData, { baseDir: BaseDirectory.AppData })
    .catch(async () => {
      // 备用路径
      const configDir = await getConfigDir();
      const backupPath = `${configDir}${normalizedProjectId}.json`;
      await writeTextFile(backupPath, projectData);
      emitProjectsChanged();
      logger.info('使用备用路径保存成功', { backupPath });
      return;
    });

  emitProjectsChanged();
  logger.info('项目文件保存成功', { projectPath });
};

// 读取项目数据
export const loadProjectFromFile = async <T = ProjectFileData>(projectId: string): Promise<T> => {
  const candidates = buildProjectIdCandidates(projectId);
  if (!candidates.length) {
    throw new Error('项目ID不能为空');
  }

  let lastError: unknown = null;

  for (const candidateId of candidates) {
    try {
      // 优先使用 Rust 命令读取，避免前端 fs 插件权限/路径配置差异导致失败
      try {
        const content = await tauri.loadProject(candidateId);
        return JSON.parse(content) as T;
      } catch (rustError) {
        lastError = rustError;
        logger.warn(`通过 Rust 加载项目失败(${candidateId})，尝试使用 JS API 兜底:`, rustError);
      }

      const projectPath = `story-fab/${candidateId}.json`;
      const existsFile = await exists(projectPath, { baseDir: BaseDirectory.AppData });
      if (!existsFile) {
        lastError = new Error(`项目文件不存在: ${candidateId}.json`);
        continue;
      }

      const content = await readTextFile(projectPath, { baseDir: BaseDirectory.AppData });
      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error;
    }
  }

  // 兼容历史版本：尝试从旧配置目录加载（曾作为备份路径写入）
  try {
    const configDir = await getConfigDir();
    for (const candidateId of candidates) {
      const legacyPaths = [
        `${configDir}${candidateId}.json`,
        `${configDir}story-fab/${candidateId}.json`,
      ];

      for (const legacyPath of legacyPaths) {
        try {
          const found = await exists(legacyPath);
          if (!found) continue;
          const content = await readTextFile(legacyPath);
          return JSON.parse(content) as T;
        } catch (legacyError) {
          lastError = legacyError;
        }
      }
    }
  } catch (legacyRootError) {
    lastError = legacyRootError;
  }

  logger.error('读取项目文件失败', { lastError });
  throw (lastError || new Error(`读取项目失败: ${projectId}`));
};

/**
 * 带轻量重试的项目读取，缓解插件初始化/瞬时 IO 波动导致的偶发失败。
 */
export const loadProjectWithRetry = async <T = ProjectFileData>(
  projectId: string,
  options?: { retries?: number; retryDelayMs?: number }
): Promise<T> => {
  const retries = Math.max(0, options?.retries ?? 2);
  const retryDelayMs = Math.max(100, options?.retryDelayMs ?? 220);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await loadProjectFromFile<T>(projectId);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
    }
  }

  throw (lastError || new Error(`读取项目失败: ${projectId}`));
};

// 导出脚本到文本文件
export const exportScriptToFile = async (script: ExportScriptData, filename: string): Promise<void> => {
  try {
    const savePath = await save({
      defaultPath: filename,
      filters: [{
        name: '文本文件',
        extensions: ['txt']
      }]
    });
    
    if (!savePath) return;
    
    let content = '';
    
    // 构建脚本内容
    content += `项目: ${script.projectName}\n`;
    content += `创建时间: ${new Date(script.createdAt).toLocaleString()}\n\n`;
    
    // 添加脚本内容
    script.segments.forEach((segment) => {
      content += `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]\n`;
      content += `${segment.content}\n\n`;
    });
    
    await writeTextFile(savePath, content);
  } catch (error) {
    logger.error('导出脚本失败:', error);
    throw error;
  }
};

/**
 * 获取API密钥
 * @param service 服务名称，如'openai'
 */
export const getApiKey = async (service: string): Promise<string> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: false });
    const value = await store.get<string>(service);
    return value ?? '';
  } catch (error) {
    logger.error(`获取${service}的API密钥失败:`, error);
    return '';
  }
};

/**
 * 保存API密钥到加密存储
 * @param service 服务名称，如'openai'
 * @param apiKey 密钥
 */
export const saveApiKey = async (service: string, apiKey: string): Promise<boolean> => {
  try {
    const store = await load('api_keys.json', { defaults: {}, autoSave: true });
    await store.set(service, apiKey);
    await store.save();
    return true;
  } catch (error) {
    logger.error(`保存${service}的API密钥失败:`, error);
    return false;
  }
};

/**
 * 获取API密钥
 * @param key 数据键名
 */
export const getAppData = async <T>(key: string): Promise<T | null> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return null;
    
    const dataPath = `${configDir}${key}.json`;
    const dataExists = await exists(dataPath);
    
    if (!dataExists) {
      return null;
    }
    
    const dataContent = await readTextFile(dataPath);
    return JSON.parse(dataContent) as T;
  } catch (error) {
    logger.error(`获取应用数据(${key})失败:`, error);
    return null;
  }
};

/**
 * 保存应用数据
 * @param key 数据键名
 * @param data 要保存的数据
 */
export const saveAppData = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    const configDir = await getConfigDir();
    if (!configDir) return false;
    
    const dataPath = `${configDir}${key}.json`;
    await writeTextFile(dataPath, JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    logger.error(`保存应用数据(${key})失败:`, error);
    return false;
  }
};

/**
/**
 * Opens a URL externally with security checks
 * @returns 是否成功打开
 */
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const isSafeUrl = (url: string): boolean => {
  try {
    const lower = url.toLowerCase();
    if (BLOCKED_PROTOCOLS.some(p => lower.startsWith(p))) return false;
    const urlObj = new URL(url);
    return ALLOWED_PROTOCOLS.includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const openExternalUrl = async (url: string): Promise<boolean> => {
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Ensure https prefix
  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  // Security check: reject dangerous protocols
  if (!isSafeUrl(withProtocol)) {
    logger.error('openExternalUrl: blocked unsafe URL', { url: withProtocol });
    return false;
  }

  try {
    logger.info(`正在打开外部链接: ${withProtocol}`);
    await openExternal(withProtocol);
    return true;
  } catch (error) {
    logger.error('打开外部链接失败:', error);
    // Fallback: try window.open (still protected by the protocol check above)
    try {
      window.open(withProtocol, '_blank', 'noopener,noreferrer');
      logger.info('通过window.open打开链接');
      return true;
    } catch (windowError) {
      logger.error('无法打开链接:', windowError);
      return false;
    }
  }
};

// 列出所有项目
export const listProjects = async (): Promise<ProjectFileData[]> => {
  try {
    // 尝试使用 Rust 函数列出项目
    try {
      const projects = await tauri.listProjects();
      const normalized = (Array.isArray(projects) ? projects : [])
        .map(normalizeListedProject)
        .filter((item): item is ProjectFileData => item !== null);
      if (normalized.length > 0) {
        logger.info('[listProjects] Rust 项目列表获取成功', { count: normalized.length });
        return normalized;
      }
      logger.warn('[listProjects] Rust 项目列表为空，切换到文件扫描兜底');
    } catch (rustError) {
      logger.warn('[listProjects] Rust 获取失败，切换到 JS API 兜底:', rustError);
    }

    // 确保应用数据目录存在
    await ensureAppDataDir();
    const appDir = 'story-fab';
      const files = await tauri.listAppDataFiles(appDir) as string[];

    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }

    const projects = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          try {
            const projectId = file.replace('.json', '');
            return await loadProjectFromFile(projectId);
          } catch (error) {
            logger.error(`[listProjects] 加载项目 ${file} 失败:`, error);
            return null;
          }
        })
    );

    return projects
      .map(normalizeListedProject)
      .filter((project): project is ProjectFileData => project !== null);
  } catch (error) {
    logger.error('[listProjects] 列出项目失败:', error);
    throw error;
  }
};

// 删除项目
export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const normalizedProjectId = normalizeProjectId(projectId || '');
    if (!normalizedProjectId) return false;
    await tauri.deleteProject(normalizedProjectId);
    emitProjectsChanged();
    logger.info('项目删除成功', { projectId });
    return true;
  } catch (error) {
    logger.error('删除项目出错', { error });
    return false;
  }
};

/**
 * 获取文件字节大小
 */
export const getFileSizeBytes = async (path: string): Promise<number> => {
  if (!path?.trim()) {
    return 0;
  }
  try {
    const bytes = await tauri.getFileSize(path);
    return Number.isFinite(bytes) ? bytes : 0;
  } catch (error) {
    logger.warn('获取文件大小失败', { path, error });
    return 0;
  }
};

export const getFileSizeMb = async (path: string): Promise<number> => {
  const bytes = await getFileSizeBytes(path);
  return bytes / (1024 * 1024);
};

/**
 * 检查FFmpeg是否已安装
 * @returns {Promise<{installed: boolean, version?: string}>} FFmpeg安装状态和版本信息
 */
export async function checkFFmpeg(): Promise<{installed: boolean, version?: string}> {
  try {
    const result = await tauri.checkFFmpeg();
    return result;
  } catch (error) {
    logger.error('检查FFmpeg失败:', error);
    return { installed: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 多格式裁切导出
// ─────────────────────────────────────────────────────────────────────────────

export type AspectRatio = '9:16' | '1:1' | '16:9';
export type ExportQuality = 'low' | 'medium' | 'high';

export interface TranscodeCropOptions {
  inputPath: string;
  outputPath: string;
  aspect: AspectRatio;
  startTime?: number;
  endTime?: number;
  quality?: ExportQuality;
}

export async function transcodeWithCrop(
  options: TranscodeCropOptions
): Promise<string> {
  const { inputPath, outputPath, aspect, startTime, endTime, quality = 'high' } = options;

  if (!inputPath || !outputPath) {
    throw new Error('输入路径和输出路径不能为空');
  }

  if (!['9:16', '1:1', '16:9'].includes(aspect)) {
    throw new Error('不支持的宽高比，仅支持 9:16、1:1、16:9');
  }

  return tauri.transcodeWithCrop({
    inputPath,
    outputPath,
    aspect,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
    quality,
  });
}

export async function exportMultiFormat(
  inputPath: string,
  outputDir: string,
  aspect: AspectRatio,
  startTime?: number,
  endTime?: number
): Promise<{ success: boolean; outputPath: string; aspect: AspectRatio }> {
  const filename = `${Date.now()}_${aspect.replace(':', 'x')}.mp4`;
  const outputPath = `${outputDir}/${filename}`;

  try {
    await transcodeWithCrop({ inputPath, outputPath, aspect, startTime, endTime });
    return { success: true, outputPath, aspect };
  } catch (error) {
    logger.error(`多格式导出失败 (${aspect}):`, error);
    return { success: false, outputPath, aspect };
  }
} 
