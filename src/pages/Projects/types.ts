export type ProjectUIStatus = 'draft' | 'processing' | 'completed';

export type ProjectView = {
  id: string;
  name: string;
  description?: string;
  status: ProjectUIStatus;
  createdAt: string;
  updatedAt: string;
  scripts?: unknown[];
  videos?: unknown[];
  videoPath?: string;
};

export type ProjectUIStats = {
  scriptCount: number;
  videoCount: number;
  status: ProjectUIStatus;
  progress: number;
};
