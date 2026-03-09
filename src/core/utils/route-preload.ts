const onceCache = new Map<string, Promise<unknown>>();

const runOnce = (key: string, loader: () => Promise<unknown>): Promise<unknown> => {
  const cached = onceCache.get(key);
  if (cached) return cached;
  const task = loader().catch((error) => {
    onceCache.delete(key);
    throw error;
  });
  onceCache.set(key, task);
  return task;
};

export const preloadProjectsPage = (): Promise<unknown> =>
  runOnce('page:projects', () => import('@/pages/Projects/index'));

export const preloadProjectEditPage = (): Promise<unknown> =>
  runOnce('page:project-edit', () => import('@/pages/ProjectEdit/index'));

export const preloadProjectDetailPage = (): Promise<unknown> =>
  runOnce('page:project-detail', () => import('@/pages/ProjectDetail/index'));

export const preloadVideoEditorPage = (): Promise<unknown> =>
  runOnce('page:video-editor', () => import('@/pages/VideoEditor/index'));

export const preloadAIVideoEditorPage = (): Promise<unknown> =>
  runOnce('page:ai-video-editor', () => import('@/pages/AIVideoEditor/index'));

export const preloadSettingsPage = (): Promise<unknown> =>
  runOnce('page:settings', () => import('@/pages/Settings/index'));
