# ClipFlow API 文档

## 概述

ClipFlow 提供完整的前端服务层 API，涵盖视频处理、AI 脚本生成、唯一性保障等核心功能。

---

## 服务层架构

```
前端组件 → 服务层 (services/) → 外部 API
                ↓
         visionService (AI分析)
                ↓
         aiService (文案生成)
                ↓
         voiceSynthesisService (语音合成)
                ↓
         视频合成 (audioVideoSync + videoEffect + export)
```

---

## 核心服务

### 1. AI Service

多模型 AI 调度服务，负责脚本生成。

```typescript
// 导入
import { aiService } from '@/core/services';

// 方法
aiService.generateScript(params: ScriptGenerateParams): Promise<ScriptData>
aiService.deduplicate(script: string, options?: DedupOptions): Promise<DedupResult>
aiService.checkUniqueness(script: string): Promise<UniquenessReport>
```

#### 参数类型

```typescript
interface ScriptGenerateParams {
  template: ScriptTemplate;      // 脚本模板
  videoAnalysis: VideoAnalysis;  // 视频分析结果
  style: ScriptStyle;            // 风格 (专业/轻松/幽默/情感/技术/营销/叙事)
  tone: Tone;                   // 语气
  length: Length;               // 长度 (短/中/长)
}

interface ScriptTemplate {
  id: string;
  name: string;
  structure: TemplateSection[];
}

interface TemplateSection {
  type: 'opening' | 'body' | 'transition' | 'closing' | 'cta';
  wordCount: number;
  prompts: string[];
}
```

---

### 2. Video Service

视频处理服务，负责分析、剪辑和导出。

```typescript
// 导入
import { videoService } from '@/core/services';

// 方法
videoService.upload(file: File): Promise<VideoInfo>
videoService.analyze(videoId: string): Promise<VideoAnalysis>
videoService.detectScenes(videoPath: string): Promise<Scene[]>
videoService.extractKeyFrames(videoPath: string): Promise<string[]>
videoService.export(timeline: TimelineData, settings: ExportSettings): Promise<string>
```

#### 参数类型

```typescript
interface VideoInfo {
  id: string;
  name: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
  format: string;
}

interface VideoAnalysis {
  videoId: string;
  scenes: Scene[];
  keyFrames: string[];
  summary: string;
  ocr?: OCRResult[];
  asr?: ASRResult[];
}

interface Scene {
  startTime: number;
  endTime: number;
  thumbnail: string;
  colorHistogram: number[];
  label?: string;
}

interface TimelineData {
  videoTrack: VideoClip[];
  audioTrack: AudioClip[];
  subtitleTrack: Subtitle[];
  transitions: Transition[];
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeSubtitles: boolean;
  subtitlePosition: 'bottom' | 'top';
}
```

---

### 3. Vision Service

视觉识别服务，负责 OCR、ASR 和场景检测。

```typescript
// 导入
import { visionService } from '@/core/services';

// 方法
visionService.ocr(imagePath: string): Promise<OCRResult>
visionService.asr(videoPath: string): Promise<ASRResult>
visionService.detectScenes(videoPath: string): Promise<Scene[]>
visionService.detectObjects(videoPath: string): Promise<ObjectDetectionResult>
```

---

### 4. Uniqueness Service

唯一性保障服务。

```typescript
// 导入
import { uniquenessService } from '@/core/services';

// 方法
uniquenessService.generateFingerprint(text: string): string
uniquenessService.checkSimilarity(text1: string, text2: string): number
uniquenessService.deduplicate(script: string, options?: DedupOptions): Promise<DedupResult>
uniquenessService.applyVariant(script: string, variantType: DedupVariant): Promise<string>
```

#### 去重变体类型

```typescript
type DedupVariant = 
  | 'conservative'  // 保守型
  | 'balanced'      // 平衡型
  | 'aggressive'   // 激进型
  | 'creative'     // 创意型
  | 'academic'     // 学术型
  | 'colloquial'   // 口语型
  | 'poetic'       // 诗意型
  | 'technical';   // 技术型
```

---

### 5. Cost Service

成本追踪服务。

```typescript
// 导入
import { costService } from '@/core/services';

// 方法
costService.trackToken(model: string, inputTokens: number, outputTokens: number): void
costService.getCostSummary(): CostSummary
costService.getModelUsage(): ModelUsage[]
```

#### 返回类型

```typescript
interface CostSummary {
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, number>;
  byDay: Record<string, number>;
}

interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestCount: number;
}
```

---

### 6. Workflow Service

工作流调度服务。

```typescript
// 导入
import { workflowService } from '@/core/services';

// 方法
workflowService.createProject(name: string): Promise<Project>
workflowService.executeStep(step: WorkflowStep, data: StepData): Promise<StepResult>
workflowService.validateStep(step: WorkflowStep, data: StepData): ValidationResult
workflowService.getProgress(): WorkflowProgress
```

---

## 状态管理 (Zustand Stores)

### 1. Workflow Store

```typescript
interface WorkflowState {
  currentStep: number;
  project: Project | null;
  videoInfo: VideoInfo | null;
  analysis: VideoAnalysis | null;
  script: ScriptData | null;
  timeline: TimelineData | null;
  
  // Actions
  setStep: (step: number) => void;
  setProject: (project: Project) => void;
  setVideoInfo: (info: VideoInfo) => void;
  setAnalysis: (analysis: VideoAnalysis) => void;
  setScript: (script: ScriptData) => void;
  setTimeline: (timeline: TimelineData) => void;
  reset: () => void;
}
```

### 2. Model Store

```typescript
interface ModelState {
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;
  
  // Actions
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
}
```

---

## Hooks

### useWorkflow

```typescript
const { 
  currentStep, 
  canProceed, 
  nextStep, 
  prevStep,
  data 
} = useWorkflow();
```

### useModel

```typescript
const {
  provider,
  model,
  isConfigured,
  setProvider,
  setModel
} = useModel();
```

### useVideo

```typescript
const {
  videoInfo,
  analysis,
  upload,
  analyze,
  exportVideo
} = useVideo();
```

---

## 错误处理

所有服务方法遵循统一的错误处理规范：

```typescript
interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

// 错误码
const ErrorCodes = {
  VIDEO_UPLOAD_FAILED: 'VIDEO_UPLOAD_FAILED',
  VIDEO_ANALYSIS_FAILED: 'VIDEO_ANALYSIS_FAILED',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  DEDUP_FAILED: 'DEDUP_FAILED',
  UNIQUE_CHECK_FAILED: 'UNIQUE_CHECK_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  API_KEY_MISSING: 'API_KEY_MISSING',
  NETWORK_ERROR: 'NETWORK_ERROR'
};
```
