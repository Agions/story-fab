export interface ProjectFileLike<TScript = unknown, TVideo = { path?: string }> {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  videoUrl?: string;
  videoPath?: string;
  videos?: TVideo[];
  scripts?: TScript[];
}

export const resolveProjectVideoUrl = <TScript = unknown, TVideo extends { path?: string } = { path?: string }>(
  project: ProjectFileLike<TScript, TVideo>
): string | undefined => {
  if (project.videoUrl) return project.videoUrl;
  if (project.videoPath) return project.videoPath;
  if (Array.isArray(project.videos) && project.videos.length > 0) {
    return project.videos[0]?.path;
  }
  return undefined;
};

export const normalizeProjectFile = <
  TScript,
  TVideo extends { path?: string },
  TProject extends ProjectFileLike<TScript, TVideo>
>(
  project: TProject
): TProject & { updatedAt: string; scripts: TScript[]; videoUrl?: string } => {
  return {
    ...project,
    scripts: Array.isArray(project.scripts) ? project.scripts : [],
    videoUrl: resolveProjectVideoUrl(project),
    updatedAt: project.updatedAt || project.createdAt || new Date().toISOString(),
  };
};

export const findProjectByScriptId = <
  TScript extends { id: string },
  TVideo extends { path?: string },
  TProject extends ProjectFileLike<TScript, TVideo>
>(
  projects: TProject[],
  scriptId: string
): TProject | undefined => {
  return projects.find((project) => Array.isArray(project.scripts) && project.scripts.some((script) => script.id === scriptId));
};
