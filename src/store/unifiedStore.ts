/**
 * 状态管理 - 统一 Store
 * 使用 Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// App Store - 全局应用状态
// ============================================
interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;
  
  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  logout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      theme: 'light',
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'clipflow-app' }
  )
);

// ============================================
// Project Store - 项目状态
// ============================================
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      loading: false,
      
      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project] 
      })),
      updateProject: (id, data) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        )
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      })),
      setCurrentProject: (project) => set({ currentProject: project }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'clipflow-projects' }
  )
);

// ============================================
// Editor Store - 编辑器状态
// ============================================
interface EditorState {
  // 当前编辑状态
  video: VideoData | null;
  script: ScriptData | null;
  voice: VoiceData | null;
  
  // UI 状态
  activePanel: 'video' | 'script' | 'subtitle' | 'voice';
  previewPlaying: boolean;
  currentTime: number;
  
  // Actions
  setVideo: (video: VideoData | null) => void;
  setScript: (script: ScriptData | null) => void;
  setVoice: (voice: VoiceData | null) => void;
  setActivePanel: (panel: EditorState['activePanel']) => void;
  setPreviewPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  reset: () => void;
}

interface VideoData {
  id: string;
  url: string;
  duration: number;
}

interface ScriptData {
  id: string;
  content: string;
}

interface VoiceData {
  id: string;
  url: string;
}

const initialEditorState: Pick<EditorState, 'video' | 'script' | 'voice' | 'activePanel' | 'previewPlaying' | 'currentTime'> = {
  video: null,
  script: null,
  voice: null,
  activePanel: 'video',
  previewPlaying: false,
  currentTime: 0,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialEditorState,
      
      setVideo: (video) => set({ video }),
      setScript: (script) => set({ script }),
      setVoice: (voice) => set({ voice }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      reset: () => set(initialEditorState),
    }),
    { name: 'clipflow-editor' }
  )
);

export default useAppStore;
