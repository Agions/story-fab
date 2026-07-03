---
title: 'API 参考'
description: 'StoryFab 核心 API 接口文档'
---

# API 参考

本文档提供 StoryFab 核心 API 接口的详细说明。

## 📑 目录

- [Tauri Commands](#tauri-commands)
- [Hooks API](#hooks-api)
- [Services API](#services-api)
- [Stores API](#stores-api)

---

## 🔧 Tauri Commands

Tauri Commands 是前端与 Rust 后端通信的接口，共 61 个命令。

### 视频处理

#### `analyze_video`

分析视频文件，提取元数据和关键帧。

```typescript
interface AnalyzeVideoInput {
  video_path: string
}

interface AnalyzeVideoOutput {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
  key_frames: Array<{
    timestamp: number
    score: number
  }>
}
```

**示例：**
```typescript
const result = await invoke<AnalyzeVideoOutput>('analyze_video', {
  video_path: '/path/to/video.mp4'
})
```

#### `render_autonomous_cut`

渲染视频片段，支持转场效果。

```typescript
interface RenderAutonomousCutInput {
  input_path: string
  output_path: string
  segments: Array<{
    start: number
    end: number
  }>
  transition?: 'fade' | 'dissolve' | 'none'
  transition_duration?: number
}

interface RenderAutonomousCutOutput {
  output_path: string
  duration: number
  file_size: number
}
```

### AI 服务

#### `generate_script`

生成 AI 解说脚本。

```typescript
interface GenerateScriptInput {
  video_id: string
  subtitles: string
  style: 'humorous' | 'serious' | 'conversational' | 'suspense' | 'warm'
  api_key?: string
  model?: string
}

interface GenerateScriptOutput {
  script_id: string
  content: Array<{
    id: string
    startTime: number
    endTime: number
    content: string
  }>
  fullText: string
}
```

#### `synthesize_speech`

文本转语音合成。

```typescript
interface SynthesizeSpeechInput {
  text: string
  voice_id: string
  speed?: number
  volume?: number
}

interface SynthesizeSpeechOutput {
  audio_path: string
  duration: number
}
```

#### `transcribe_audio`

音频转字幕（Whisper）。

```typescript
interface TranscribeAudioInput {
  audio_path: string
  model_size?: 'tiny' | 'base' | 'small' | 'medium' | 'large-v2' | 'large-v3'
  language?: string
}

interface TranscribeAudioOutput {
  subtitles: Array<{
    id: string
    startTime: number
    endTime: number
    text: string
  }>
}
```

---

## 🎣 Hooks API

### `useProjectDetail`

项目详情状态管理。

```typescript
interface UseProjectDetailResult {
  state: ProjectDetailState
  setActiveStep: (step: string) => void
  setProject: (project: ProjectDetailState['project']) => void
  updateProject: (project: NonNullable<ProjectDetailState['project']>) => void
  setActiveScript: (script: AIScriptDraft | null) => void
  updateActiveScript: (script: AIScriptDraft) => void
  updateActiveScriptFromSegments: (segments: ScriptSegment[], activeScript: AIScriptDraft) => void
  setAiLoading: (loading: boolean) => void
  setDrawerVisible: (visible: boolean) => void
  setDeleteConfirmOpen: (open: boolean) => void
}
```

**使用示例：**
```typescript
const { state, setProject, updateProject } = useProjectDetail()

// 设置项目
setProject({
  id: 'proj-1',
  name: 'My Project',
  // ...
})

// 更新项目
updateProject({
  ...state.project!,
  name: 'Updated Name'
})
```

### `useVideoProcessing`

视频处理状态管理。

```typescript
interface UseVideoProcessingResult {
  // State
  videoQuality: QualityValue
  exportFormat: FormatValue
  transitionType: TransitionValue
  transitionDuration: number
  audioProcess: AudioProcessValue
  audioVolume: number
  useSubtitles: boolean
  processingBatch: boolean
  currentBatchItem: number
  batchProgress: number
  batchItems: BatchItem[]
  customSettings: CustomQualitySettings
  activePanels: string[]

  // Setters
  setVideoQuality: (value: QualityValue) => void
  setExportFormat: (value: FormatValue) => void
  setTransitionType: (value: TransitionValue) => void
  setTransitionDuration: (value: number) => void
  setAudioProcess: (value: AudioProcessValue) => void
  setAudioVolume: (value: number) => void
  setUseSubtitles: (value: boolean) => void

  // Operations
  addBatchItem: () => void
  removeBatchItem: (id: string) => void
  updateCustomSettings: (patch: Partial<CustomQualitySettings>) => void
  processVideo: (segments: VideoSegment[], itemName?: string, itemVideoPath?: string) => Promise<string>
  startBatchProcessing: () => Promise<void>
  handleProcessCurrentVideo: () => Promise<void>
  handleAudioVolumeChange: (value: number | readonly number[]) => void
  togglePanel: (key: string) => void
}
```

### `useSubtitleExtraction`

字幕提取状态管理。

```typescript
interface UseSubtitleExtractionResult {
  state: SubtitleExtractorState
  setFormat: (format: SubtitleFormat) => void
  setTranslate: (translate: boolean) => void
  setIsExtracting: (isExtracting: boolean) => void
  setProgress: (progress: number) => void
  incrementProgress: (delta: number, cap: number) => void
  setExtractedSubtitles: (subtitles: SubtitleSegment[]) => void
  updateSubtitleText: (id: string, text: string) => void
  setEditingId: (editingId: string | null) => void
  setEditingText: (editingText: string) => void
  setActiveSubId: (activeSubId: string | null) => void
  setVideoDuration: (videoDuration: number) => void
  startEdit: (sub: SubtitleSegment) => void
  cancelEdit: () => void
  resetForExtract: () => void
}
```

### `useScriptEditor`

脚本编辑器状态管理。

```typescript
interface UseScriptEditorResult {
  // State
  segments: ScriptSegment[]
  editingIndex: number | null
  formValues: SegmentFormValues
  formError: string
  previewVisible: boolean
  previewSrc: string
  previewLoading: boolean
  aiModalVisible: boolean
  exportMenuOpen: boolean
  deleteConfirmOpen: boolean
  deleteTargetIndex: number | null
  totalDuration: number

  // Setters
  setSegments: (segments: ScriptSegment[]) => void
  setFormValues: (values: Partial<SegmentFormValues>) => void
  setFormError: (error: string) => void
  setPreviewVisible: (visible: boolean) => void
  setPreviewSrc: (src: string) => void
  setPreviewLoading: (loading: boolean) => void
  setAiModalVisible: (visible: boolean) => void
  setExportMenuOpen: (open: boolean) => void
  setDeleteConfirmOpen: (open: boolean) => void
  setDeleteTargetIndex: (index: number | null) => void

  // Operations
  setFieldValue: (field: keyof SegmentFormValues, value: any) => void
  validateForm: () => boolean
  handleAddSegment: () => void
  handleEditSegment: (index: number) => void
  handleSaveSegment: () => void
  handleCancelEdit: () => void
  handleDeleteSegment: (index: number) => void
  confirmDelete: () => void
  handlePreviewSegment: (index: number) => Promise<void>
  handleSave: () => void
  handleAIImprove: () => Promise<void>
  handleExportClick: ({ key }: { key: string }) => void
  exportMenuItems: Array<{ key: string; label: string }>
}
```

### `useVideoKeyboardShortcuts`

视频播放器键盘快捷键。

```typescript
interface UseVideoKeyboardShortcutsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onTogglePlay: () => void
  onToggleFullscreen: () => void
  onSeek: (seconds: number) => void
  onVolumeChange: (delta: number) => void
  onToggleMute: () => void
  disabled?: boolean
}
```

**快捷键映射：**

| 按键 | 功能 |
|------|------|
| `Space` / `k` / `K` | 播放/暂停 |
| `ArrowLeft` | 后退 5 秒 |
| `ArrowRight` | 前进 5 秒 |
| `j` / `J` | 后退 10 秒 |
| `l` / `L` | 前进 10 秒 |
| `ArrowUp` | 音量 +10% |
| `ArrowDown` | 音量 -10% |
| `m` / `M` | 静音切换 |
| `f` / `F` | 全屏切换 |

---

## 🎯 Services API

### `videoProcessor`

视频处理服务。

```typescript
class VideoProcessor {
  // 分析视频
  async analyze(videoPath: string): Promise<VideoMetadata>

  // 预览视频片段
  async preview(videoPath: string, segment: SimpleVideoSegment): Promise<string>

  // 渲染视频
  async render(inputPath: string, outputPath: string, segments: VideoSegment[]): Promise<void>
}
```

### `subtitleService`

字幕处理服务。

```typescript
class SubtitleService {
  // 提取字幕
  async extract(videoPath: string, format: SubtitleFormat): Promise<SubtitleSegment[]>

  // 翻译字幕
  async translate(subtitles: SubtitleSegment[], targetLang: string): Promise<SubtitleSegment[]>

  // 导出字幕
  async export(subtitles: SubtitleSegment[], format: SubtitleFormat): Promise<string>
}
```

### `commentaryService`

解说生成服务。

```typescript
class CommentaryService {
  // 生成解说计划
  async generatePlan(sessionId: string, style: ScriptStylePreset): Promise<CommentaryPlan>

  // 批准计划并开始渲染
  async approvePlan(sessionId: string): Promise<void>

  // 生成脚本
  async generateScript(params: GenerateScriptParams): Promise<AIScriptDraft>
}
```

---

## 🗄️ Stores API

### `useProjectStore`

项目全局状态。

```typescript
interface ProjectStore {
  // State
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  // Actions
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (project: Omit<Project, 'id'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}
```

### `useThemeStore`

主题状态管理。

```typescript
interface ThemeState {
  theme: 'light' | 'dark' | 'auto'
  isDarkMode: boolean
  setTheme: (theme: ThemeState['theme']) => void
  toggleTheme: () => void
}
```

---

## 📝 类型定义

### `Project`

```typescript
interface Project {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration: number
  size: number
  status: ProjectStatus
  tags: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}
```

### `ScriptSegment`

```typescript
interface ScriptSegment {
  id: string
  startTime: number
  endTime: number
  content?: string
  type?: 'narration' | 'dialogue' | 'sound_effect'
}
```

### `VideoMetadata`

```typescript
interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
}
```

---

## 🔗 相关资源

- [Tauri 命令完整列表](docs/developer/tauri-commands.md)
- [Hooks 实现细节](docs/developer/architecture.md)
- [Services 架构](docs/developer/ai-services.md)
