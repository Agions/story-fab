# StoryFab Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure StoryFab's frontend codebase by moving files to their correct layers, removing dead code, rewriting README, and aligning brand assets with the design system.

**Architecture:** Four sequential phases: (A) file structure refactoring — move StoryFab workspace to pages/, migrate context to Zustand stores, rename CamelCase directories, consolidate pipeline types; (B) dead code removal — delete obsolete directories and fix circular imports; (C) README rewrite — fix references, add missing sections, upgrade diagrams; (D) brand alignment — expand theme palette, fix favicon, deduplicate logos.

**Tech Stack:** React 18, TypeScript 5, Zustand 5, Vite 6, Tailwind 4, Less, Vitest

## Global Constraints

- All file/directory renames follow kebab-case convention (entry point `src/main.tsx` is the sole exception)
- After each task, run `npx tsc --noEmit` and verify zero type errors before proceeding
- After each phase, run `npx vitest run` and verify zero test failures
- Git commit after each task with message format: `refactor(phase): <description>`
- Do NOT modify any Rust code in `src-tauri/`
- Preserve all existing functionality — this is a pure restructuring pass

---

## Phase A — File Structure Refactoring

### Task A1: Move StoryFab Workspace from components/ to pages/

**Files to move (38 files):**

Workspace files (`src/components/StoryFab/workspace/` → `src/pages/workspace/`):
- `src/components/StoryFab/workspace/workspace.tsx`
- `src/components/StoryFab/workspace/project-setup.tsx`
- `src/components/StoryFab/workspace/video-upload.tsx`
- `src/components/StoryFab/workspace/ai-visualizer.tsx`
- `src/components/StoryFab/workspace/script-writing.tsx`
- `src/components/StoryFab/workspace/video-composing.tsx`
- `src/components/StoryFab/workspace/clip-rippling.tsx`
- `src/components/StoryFab/workspace/step-list.tsx`
- `src/components/StoryFab/workspace/index.ts`
- `src/components/StoryFab/workspace/function-mode-map.ts`
- `src/components/StoryFab/workspace/compose-config.ts`
- `src/components/StoryFab/workspace/script-config.ts`
- `src/components/StoryFab/workspace/clip-rippling-config.ts`
- `src/components/StoryFab/workspace/use-clip-rippling.ts`
- `src/components/StoryFab/workspace/AIVisualizer.module.less`
- `src/components/StoryFab/workspace/ClipRippling.module.less`
- `src/components/StoryFab/workspace/ProjectSetup.module.less`
- `src/components/StoryFab/workspace/ScriptWriting.module.less`
- `src/components/StoryFab/workspace/VideoComposing.module.less`
- `src/components/StoryFab/workspace/VideoExport.module.less`
- `src/components/StoryFab/workspace/VideoUpload.module.less`
- `src/components/StoryFab/workspace/workspace.module.less`
- `src/components/StoryFab/workspace/config/analysis-tasks.tsx`
- `src/components/StoryFab/workspace/config/video-upload-config.ts`
- `src/components/StoryFab/workspace/hooks/use-script-generation.ts`
- `src/components/StoryFab/workspace/hooks/use-video-synthesize.ts`
- `src/components/StoryFab/workspace/components/commentary-style-selector.tsx`
- `src/components/StoryFab/workspace/components/complete-notice.tsx`
- `src/components/StoryFab/workspace/components/effect-settings-panel.tsx`
- `src/components/StoryFab/workspace/components/function-mode-selector.tsx`
- `src/components/StoryFab/workspace/components/generation-progress.tsx`
- `src/components/StoryFab/workspace/components/script-editor-panel.tsx`
- `src/components/StoryFab/workspace/components/script-stats-bar.tsx`
- `src/components/StoryFab/workspace/components/style-length-config.tsx`
- `src/components/StoryFab/workspace/components/subtitle-settings-panel.tsx`
- `src/components/StoryFab/workspace/components/synthesize-progress.tsx`
- `src/components/StoryFab/workspace/components/voice-settings-panel.tsx`
- `src/components/StoryFab/workspace/components/warning-alert.tsx`
- `src/components/StoryFab/workspace/Highlights/highlights.tsx`
- `src/components/StoryFab/workspace/Highlights/highlights.reducer.ts`
- `src/components/StoryFab/workspace/Highlights/highlights.reducer.test.ts`
- `src/components/StoryFab/workspace/Highlights/highlights.module.less`
- `src/components/StoryFab/workspace/VideoExport/export-complete-card.tsx`
- `src/components/StoryFab/workspace/VideoExport/export-config.ts`
- `src/components/StoryFab/workspace/VideoExport/exporting-panel.tsx`
- `src/components/StoryFab/workspace/VideoExport/index.ts`
- `src/components/StoryFab/workspace/VideoExport/no-synthesis-alert.tsx`
- `src/components/StoryFab/workspace/VideoExport/use-export-handlers.ts`
- `src/components/StoryFab/workspace/VideoExport/use-export-handlers.reducer.ts`
- `src/components/StoryFab/workspace/VideoExport/use-export-handlers.reducer.test.ts`
- `src/components/StoryFab/workspace/VideoExport/video-export.tsx`

Type files (`src/components/StoryFab/types/` → `src/core/types/storyfab/`):
- `src/components/StoryFab/types/workflow.ts`
- `src/components/StoryFab/types/workflow.reducer.ts`
- `src/components/StoryFab/types/workflow.reducer.test.ts`

**Interfaces:**
- Consumes: existing StoryFab workspace component structure
- Produces: `src/pages/workspace/` and `src/core/types/storyfab/` as new module homes

- [ ] **Step 1: Create target directories**

```bash
mkdir -p src/pages/workspace/components
mkdir -p src/pages/workspace/config
mkdir -p src/pages/workspace/Highlights
mkdir -p src/pages/workspace/hooks
mkdir -p src/pages/workspace/VideoExport
mkdir -p src/core/types/storyfab
```

- [ ] **Step 2: Move workspace files**

```bash
# Move top-level workspace files
for f in src/components/StoryFab/workspace/{workspace,project-setup,video-upload,ai-visualizer,script-writing,video-composing,clip-rippling,step-list,index,function-mode-map,compose-config,script-config,clip-rippling-config,use-clip-rippling}.{ts,tsx,less}; do
  [ -f "$f" ] && mv "$f" src/pages/workspace/
done

# Move subdirectory files
cp -r src/components/StoryFab/workspace/config src/pages/workspace/
cp -r src/components/StoryFab/workspace/hooks src/pages/workspace/
cp -r src/components/StoryFab/workspace/components src/pages/workspace/
cp -r src/components/StoryFab/workspace/Highlights src/pages/workspace/
cp -r src/components/StoryFab/workspace/VideoExport src/pages/workspace/
```

- [ ] **Step 3: Move type files**

```bash
mv src/components/StoryFab/types/workflow.ts src/core/types/storyfab/
mv src/components/StoryFab/types/workflow.reducer.ts src/core/types/storyfab/
mv src/components/StoryFab/types/workflow.reducer.test.ts src/core/types/storyfab/
```

- [ ] **Step 4: Update imports in pages/AIVideoEditor/index.tsx**

Edit `src/pages/AIVideoEditor/index.tsx`:
```tsx
// Change:
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/components/StoryFab/workspace/function-mode-map';
// To:
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/pages/workspace/function-mode-map';
```

- [ ] **Step 5: Update barrel export in src/pages/workspace/index.ts**

Edit `src/pages/workspace/index.ts` (already moved) to ensure all re-exports use correct relative paths within the new location. Verify it exports: `Workspace`, `ProjectSetup`, `VideoUpload`, `AIVisualizer`, `ScriptWriting`, `VideoComposing`, `ClipRippling`, `VideoExport`, `StepList`, `Highlights`, `AIFunctionType`.

- [ ] **Step 6: Verify no remaining imports of old paths**

```bash
grep -rn "from.*StoryFab/workspace" src/ --include="*.ts" --include="*.tsx"
# Expected: zero results
```

- [ ] **Step 7: Delete old StoryFab directories**

```bash
rm -rf src/components/StoryFab/workspace
rm -rf src/components/StoryFab/types
```

- [ ] **Step 8: Run type check and tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/workspace/ src/core/types/storyfab/ src/pages/AIVideoEditor/index.tsx
git add -A src/components/StoryFab/
git commit -m "refactor(A1): move StoryFab workspace to pages/, types to core/"
```

---

### Task A2: Move workflow/ feature-blueprint to core/pipeline/

**Files:**
- Move: `src/workflow/feature-blueprint.ts` → `src/core/pipeline/types/workflow-modes.ts`
- Modify: `src/core/pipeline/steps/commentary/types.ts:12`
- Delete: `src/workflow/` (empty after move)

**Interfaces:**
- Consumes: `WorkflowMode` type from feature-blueprint.ts
- Produces: `src/core/pipeline/types/workflow-modes.ts` as new home for workflow mode definitions

- [ ] **Step 1: Create target directory**

```bash
mkdir -p src/core/pipeline/types
```

- [ ] **Step 2: Move file**

```bash
mv src/workflow/feature-blueprint.ts src/core/pipeline/types/workflow-modes.ts
```

- [ ] **Step 3: Update import in commentary/types.ts**

Edit `src/core/pipeline/steps/commentary/types.ts`:
```tsx
// Change:
import type { WorkflowMode } from '@/core/workflow/feature-blueprint';
// To:
import type { WorkflowMode } from '@/core/pipeline/types/workflow-modes';
```

- [ ] **Step 4: Verify no remaining imports**

```bash
grep -rn "from.*core/workflow" src/ --include="*.ts" --include="*.tsx"
# Expected: zero results
```

- [ ] **Step 5: Delete empty directory**

```bash
rmdir src/workflow/
```

- [ ] **Step 6: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/core/pipeline/types/workflow-modes.ts src/core/pipeline/steps/commentary/types.ts
git add -A src/workflow/
git commit -m "refactor(A2): move workflow modes to core/pipeline/types/"
```

---

### Task A3: Rename src/store/ to src/stores/

**Files to move (8 files):**
- `src/store/app-store.ts` → `src/stores/app-store.ts`
- `src/store/project-store.ts` → `src/stores/project-store.ts`
- `src/store/workspace-store.ts` → `src/stores/workspace-store.ts`
- `src/store/model-store.ts` → `src/stores/model-store.ts`
- `src/store/create-history.ts` → `src/stores/create-history.ts`
- `src/store/create-persisted-store.ts` → `src/stores/create-persisted-store.ts`
- `src/store/editor-types.ts` → `src/stores/editor-types.ts`
- `src/store/timeline-helpers.ts` → `src/stores/timeline-helpers.ts`
- `src/store/index.ts` → `src/stores/index.ts`
- Plus 3 test files

**Interfaces:**
- Consumes: existing `@/store` imports
- Produces: `@/stores` as new import root

- [ ] **Step 1: Move all store files**

```bash
mv src/store src/stores
```

- [ ] **Step 2: Update imports (5 files)**

Edit each of these files:

1. `src/context/settings-context.tsx` (will be moved in A4, but update now):
```tsx
import { useAppStore } from '@/store/app-store';
```
```tsx
import { useAppStore } from '@/stores/app-store';
```

2. `src/context/theme-context.tsx`:
```tsx
import { useAppStore } from '@/store/app-store';
```
```tsx
import { useAppStore } from '@/stores/app-store';
```

3. `src/pages/Settings/index.tsx`:
```tsx
import { useModelStore } from '@/store';
```
```tsx
import { useModelStore } from '@/stores';
```

4. `src/components/SubtitleExtractor/index.tsx`:
```tsx
import { useWorkspaceStore } from '@/store/workspace-store';
```
```tsx
import { useWorkspaceStore } from '@/stores/workspace-store';
```

5. `src/pages/ProjectDetail/index.tsx`:
```tsx
import { useModelStore } from '@/store';
```
```tsx
import { useModelStore } from '@/stores';
```

- [ ] **Step 3: Verify no remaining old-path imports**

```bash
grep -rn "from.*@/store\b" src/ --include="*.ts" --include="*.tsx" | grep -v "stores"
# Expected: zero results
```

- [ ] **Step 4: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/ src/context/settings-context.tsx src/context/theme-context.tsx src/pages/Settings/index.tsx src/components/SubtitleExtractor/index.tsx src/pages/ProjectDetail/index.tsx
git commit -m "refactor(A3): rename store/ to stores/"
```

---

### Task A4: Convert React Context to Zustand Stores

**Files to create (2 files):**
- `src/stores/settings-store.ts` (replaces `src/context/settings-context.tsx`)
- `src/stores/theme-store.ts` (replaces `src/context/theme-context.tsx`)

**Files to modify (7 files):**
- `src/providers/app-provider.tsx`
- `src/pages/Settings/index.tsx`
- `src/pages/Home/index.tsx`
- `src/pages/ProjectEdit/index.tsx`
- `src/pages/ProjectDetail/index.tsx`
- `src/pages/ScriptDetail/index.tsx`
- `src/components/StoryFab/workspace/project-setup.tsx`

**Files to delete (2 files):**
- `src/context/settings-context.tsx`
- `src/context/theme-context.tsx`
- `src/context/` (empty directory)

**Interfaces:**
- Consumes: existing Context consumers (`useSettings`, `useTheme`)
- Produces: `useSettingsStore`, `useThemeStore` with identical public API to minimize consumer changes

- [ ] **Step 1: Read existing context files**

Read `src/context/settings-context.tsx` and `src/context/theme-context.tsx` to understand the current API surface (state shape, setter functions, provider wrapping).

- [ ] **Step 2: Create settings-store.ts**

Write `src/stores/settings-store.ts` as a Zustand v5 persisted store that mirrors the `SettingsContextType` API. Key exports:
- `useSettingsStore` — the Zustand store hook
- State: `recentProjects`, `addRecentProject`, `compactMode`, `language`, `autoSave`
- Preserve the same function signatures as the original context to minimize consumer changes.

- [ ] **Step 3: Create theme-store.ts**

Write `src/stores/theme-store.ts` as a Zustand v5 store. Key exports:
- `useThemeStore` — the Zustand store hook
- State: `isDarkMode`, `toggleTheme`, `theme`
- Preserve the same function signatures.

- [ ] **Step 4: Update app-provider.tsx**

Edit `src/providers/app-provider.tsx`:
```tsx
// Remove:
import { ThemeProvider } from '@/context/theme-context';
import { SettingsProvider } from '@/context/settings-context';

// Add (no provider wrapping needed for Zustand — stores are self-contained):
// (no imports needed here)
```

Remove the `<ThemeProvider>` and `<SettingsProvider>` wrapper components from the JSX. The stores initialize themselves.

- [ ] **Step 5: Update all consumer imports**

For each consumer file, replace context imports with store imports:

1. `src/pages/Settings/index.tsx`:
```tsx
// Remove:
import { useTheme } from '@/context/theme-context';
// Add:
import { useThemeStore } from '@/stores/theme-store';
// And change:
const { isDarkMode, toggleTheme } = useTheme();
// To:
const { isDarkMode, toggleTheme } = useThemeStore();
```

2. `src/pages/Home/index.tsx`:
```tsx
import { useSettings } from '@/context/settings-context';
```
```tsx
import { useSettingsStore } from '@/stores/settings-store';
```
And update hook call: `const { addRecentProject } = useSettings();` → `const { addRecentProject } = useSettingsStore();`

3. `src/pages/ProjectEdit/index.tsx`: same pattern

4. `src/pages/ProjectDetail/index.tsx`: same pattern

5. `src/pages/ScriptDetail/index.tsx`: same pattern

6. `src/components/StoryFab/workspace/project-setup.tsx`:
```tsx
import { useSettings } from '@/context/settings-context';
```
```tsx
import { useSettingsStore } from '@/stores/settings-store';
```
And update hook call accordingly.

- [ ] **Step 6: Delete old context files**

```bash
rm src/context/settings-context.tsx
rm src/context/theme-context.tsx
rmdir src/context/
```

- [ ] **Step 7: Verify no remaining context imports**

```bash
grep -rn "from.*@/context" src/ --include="*.ts" --include="*.tsx"
# Expected: zero results
```

- [ ] **Step 8: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 9: Commit**

```bash
git add src/stores/settings-store.ts src/stores/theme-store.ts src/providers/app-provider.tsx src/pages/Settings/index.tsx src/pages/Home/index.tsx src/pages/ProjectEdit/index.tsx src/pages/ProjectDetail/index.tsx src/pages/ScriptDetail/index.tsx src/components/StoryFab/workspace/project-setup.tsx
git add -A src/context/
git commit -m "refactor(A4): convert React Context to Zustand stores"
```

---

### Task A5: Rename CamelCase Component Directories (14 dirs)

**Directories to rename:**

| Current | New |
|---------|-----|
| `src/components/AIClip/` | `src/components/ai-clip/` |
| `src/components/CommentaryPanel/` | `src/components/commentary-panel/` |
| `src/components/Layout/` | `src/components/layout/` |
| `src/components/ScriptEditor/` | `src/components/script-editor/` |
| `src/components/Settings/` | `src/components/settings/` |
| `src/components/ShortcutOverlay/` | `src/components/shortcut-overlay/` |
| `src/components/SubtitleExtractor/` | `src/components/subtitle-extractor/` |
| `src/components/Timeline/` | `src/components/timeline/` |
| `src/components/VideoAnalyzer/` | `src/components/video-analyzer/` |
| `src/components/VideoEditor/` | `src/components/video-editor/` |
| `src/components/VideoInfo/` | `src/components/video-info/` |
| `src/components/VideoPlayer/` | `src/components/video-player/` |
| `src/components/VideoProcessingController/` | `src/components/video-processing-controller/` |
| `src/components/VideoSelector/` | `src/components/video-selector/` |

**LESS module files to rename (19 files):**

| Current | New |
|---------|-----|
| `src/components/AIClip/AIClip.module.less` | `src/components/ai-clip/ai-clip.module.less` |
| `src/components/CommentaryPanel/CommentaryPanel.module.less` | `src/components/commentary-panel/commentary-panel.module.less` |
| `src/components/Layout/layout.module.less` | `src/components/layout/layout.module.less` (unchanged) |
| `src/components/ScriptEditor/ScriptEditor.module.less` | `src/components/script-editor/script-editor.module.less` |
| `src/components/ShortcutOverlay/ShortcutOverlay.module.less` | `src/components/shortcut-overlay/shortcut-overlay.module.less` |
| `src/components/SubtitleExtractor/index.module.less` | `src/components/subtitle-extractor/index.module.less` |
| `src/components/Timeline/Timeline.module.less` | `src/components/timeline/timeline.module.less` |
| `src/components/VideoAnalyzer/VideoAnalyzer.module.less` | `src/components/video-analyzer/video-analyzer.module.less` |
| `src/components/VideoEditor/VideoEditor.module.less` | `src/components/video-editor/video-editor.module.less` |
| `src/components/VideoPlayer/VideoPlayer.module.less` | `src/components/video-player/video-player.module.less` |
| `src/components/VideoProcessingController/VideoProcessingController.module.less` | `src/components/video-processing-controller/video-processing-controller.module.less` |
| `src/components/VideoSelector/VideoSelector.module.less` | `src/components/video-selector/video-selector.module.less` |
| `src/components/StoryFab/workspace/AIVisualizer.module.less` | `src/pages/workspace/ai-visualizer.module.less` |
| `src/components/StoryFab/workspace/ClipRippling.module.less` | `src/pages/workspace/clip-rippling.module.less` |
| `src/components/StoryFab/workspace/ProjectSetup.module.less` | `src/pages/workspace/project-setup.module.less` |
| `src/components/StoryFab/workspace/ScriptWriting.module.less` | `src/pages/workspace/script-writing.module.less` |
| `src/components/StoryFab/workspace/VideoComposing.module.less` | `src/pages/workspace/video-composing.module.less` |
| `src/components/StoryFab/workspace/VideoExport.module.less` | `src/pages/workspace/video-export.module.less` |
| `src/components/StoryFab/workspace/VideoUpload.module.less` | `src/pages/workspace/video-upload.module.less` |

**Interfaces:**
- Consumes: existing import paths across ~30 files
- Produces: kebab-case import paths that match project convention

- [ ] **Step 1: Rename all 14 component directories**

```bash
# Using git mv to preserve history
git mv src/components/AIClip src/components/ai-clip
git mv src/components/CommentaryPanel src/components/commentary-panel
git mv src/components/Layout src/components/layout
git mv src/components/ScriptEditor src/components/script-editor
git mv src/components/Settings src/components/settings
git mv src/components/ShortcutOverlay src/components/shortcut-overlay
git mv src/components/SubtitleExtractor src/components/subtitle-extractor
git mv src/components/Timeline src/components/timeline
git mv src/components/VideoAnalyzer src/components/video-analyzer
git mv src/components/VideoEditor src/components/video-editor
git mv src/components/VideoInfo src/components/video-info
git mv src/components/VideoPlayer src/components/video-player
git mv src/components/VideoProcessingController src/components/video-processing-controller
git mv src/components/VideoSelector src/components/video-selector
```

- [ ] **Step 2: Rename LESS module files within moved dirs**

```bash
# AIClip
git mv src/components/ai-clip/AIClip.module.less src/components/ai-clip/ai-clip.module.less

# CommentaryPanel
git mv src/components/commentary-panel/CommentaryPanel.module.less src/components/commentary-panel/commentary-panel.module.less

# ScriptEditor
git mv src/components/script-editor/ScriptEditor.module.less src/components/script-editor/script-editor.module.less

# ShortcutOverlay
git mv src/components/shortcut-overlay/ShortcutOverlay.module.less src/components/shortcut-overlay/shortcut-overlay.module.less

# SubtitleExtractor
git mv src/components/subtitle-extractor/index.module.less src/components/subtitle-extractor/index.module.less

# Timeline
git mv src/components/timeline/Timeline.module.less src/components/timeline/timeline.module.less

# VideoAnalyzer
git mv src/components/video-analyzer/VideoAnalyzer.module.less src/components/video-analyzer/video-analyzer.module.less

# VideoEditor
git mv src/components/video-editor/VideoEditor.module.less src/components/video-editor/video-editor.module.less

# VideoPlayer
git mv src/components/video-player/VideoPlayer.module.less src/components/video-player/video-player.module.less

# VideoProcessingController
git mv src/components/video-processing-controller/VideoProcessingController.module.less src/components/video-processing-controller/video-processing-controller.module.less

# VideoSelector
git mv src/components/video-selector/VideoSelector.module.less src/components/video-selector/video-selector.module.less

# Workspace (from StoryFab)
git mv src/pages/workspace/AIVisualizer.module.less src/pages/workspace/ai-visualizer.module.less
git mv src/pages/workspace/ClipRippling.module.less src/pages/workspace/clip-rippling.module.less
git mv src/pages/workspace/ProjectSetup.module.less src/pages/workspace/project-setup.module.less
git mv src/pages/workspace/ScriptWriting.module.less src/pages/workspace/script-writing.module.less
git mv src/pages/workspace/VideoComposing.module.less src/pages/workspace/video-composing.module.less
git mv src/pages/workspace/VideoExport.module.less src/pages/workspace/video-export.module.less
git mv src/pages/workspace/VideoUpload.module.less src/pages/workspace/video-upload.module.less
```

- [ ] **Step 3: Bulk-update all import paths using sed**

```bash
# Define the 14 find-and-replace pairs
sed -i '' \
  "s|from '@/components/AIClip/|from '@/components/ai-clip/|g;
   s|from '@/components/CommentaryPanel/|from '@/components/commentary-panel/|g;
   s|from '@/components/Layout/|from '@/components/layout/|g;
   s|from '@/components/ScriptEditor/|from '@/components/script-editor/|g;
   s|from '@/components/Settings/|from '@/components/settings/|g;
   s|from '@/components/ShortcutOverlay/|from '@/components/shortcut-overlay/|g;
   s|from '@/components/SubtitleExtractor/|from '@/components/subtitle-extractor/|g;
   s|from '@/components/Timeline/|from '@/components/timeline/|g;
   s|from '@/components/VideoAnalyzer/|from '@/components/video-analyzer/|g;
   s|from '@/components/VideoEditor/|from '@/components/video-editor/|g;
   s|from '@/components/VideoInfo/|from '@/components/video-info/|g;
   s|from '@/components/VideoPlayer/|from '@/components/video-player/|g;
   s|from '@/components/VideoProcessingController/|from '@/components/video-processing-controller/|g;
   s|from '@/components/VideoSelector/|from '@/components/video-selector/|g" \
  src/**/*.{ts,tsx}
```

- [ ] **Step 4: Bulk-update LESS import paths**

```bash
# Update style imports in .tsx files that reference renamed LESS files
find src -name "*.tsx" -exec sed -i '' \
  "s|from '@/components/AIClip/AIClip.module.less'|from '@/components/ai-clip/ai-clip.module.less'|g;
   s|from '@/components/CommentaryPanel/CommentaryPanel.module.less'|from '@/components/commentary-panel/commentary-panel.module.less'|g;
   s|from '@/components/ScriptEditor/ScriptEditor.module.less'|from '@/components/script-editor/script-editor.module.less'|g;
   s|from '@/components/ShortcutOverlay/ShortcutOverlay.module.less'|from '@/components/shortcut-overlay/shortcut-overlay.module.less'|g;
   s|from '@/components/SubtitleExtractor/index.module.less'|from '@/components/subtitle-extractor/index.module.less'|g;
   s|from '@/components/Timeline/Timeline.module.less'|from '@/components/timeline/timeline.module.less'|g;
   s|from '@/components/VideoAnalyzer/VideoAnalyzer.module.less'|from '@/components/video-analyzer/video-analyzer.module.less'|g;
   s|from '@/components/VideoEditor/VideoEditor.module.less'|from '@/components/video-editor/video-editor.module.less'|g;
   s|from '@/components/VideoPlayer/VideoPlayer.module.less'|from '@/components/video-player/video-player.module.less'|g;
   s|from '@/components/VideoProcessingController/VideoProcessingController.module.less'|from '@/components/video-processing-controller/video-processing-controller.module.less'|g;
   s|from '@/components/VideoSelector/VideoSelector.module.less'|from '@/components/video-selector/video-selector.module.less'|g" {} \;
```

- [ ] **Step 5: Manually verify no remaining old paths**

```bash
grep -rn "from '@/components/AIClip/" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/components/CommentaryPanel/" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/components/Layout/" src/ --include="*.ts" --include="*.tsx"
# ... repeat for all 14 directories
# Expected: zero results for all
```

- [ ] **Step 6: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add -A src/components/
git commit -m "refactor(A5): rename 14 CamelCase component dirs to kebab-case"
```

---

### Task A6: Fix Circular Import in shared/utils/index.ts

**Files to modify:**
- `src/shared/utils/index.ts`

**Interfaces:**
- Consumes: `@/shared/utils` self-reference via `@/shared`
- Produces: clean barrel that re-exports without circular path

- [ ] **Step 1: Read the problematic barrel**

Read `src/shared/utils/index.ts`. Note the `export * from '@/shared'` pattern which creates a circular reference through the parent `src/shared/index.ts` barrel.

- [ ] **Step 2: Replace circular barrel with direct re-exports**

Edit `src/shared/utils/index.ts`:
```ts
// BEFORE (circular):
// export * from '@/shared';

// AFTER (direct, no circular path):
export { notify } from './notify';
export { formatTime, formatDuration, formatDate, formatDateTime, formatRelativeTime, clamp, formatTimecodeMs, formatTimecode, formatTimecodeSimple, now, nowISO, MS_PER_SECOND } from './formatting';
export { readNumberField, resolveProjectVideoPath, extractProjectMediaMetrics, pickPreferredSizeMb, type RawProjectRecord } from './project-metrics';
```

Remove the `import { AppError } from '@/shared/errors'` and `import { notify } from './notify'` lines at the top since we're now directly re-exporting.

Also remove the `debounce`, `generateId`, `delay`, `retry`, `detectFileType`, `isValidEmail`, `isValidURL`, `safeJSONParse`, `computeHash`, `downloadFile`, `readFileAsDataURL`, `readFileAsText`, `copyToClipboard`, `readFromClipboard`, `showSuccess`, `showError`, `showWarning`, `showInfo`, `concurrentMap` functions that were defined inline in this barrel file and re-export them from a new `src/shared/utils/common.ts` file.

- [ ] **Step 3: Create common.ts for inline utilities**

Write `src/shared/utils/common.ts` containing the inline utility functions that were previously in `index.ts`: `debounce`, `generateId`, `delay`, `retry`, `detectFileType`, `isValidEmail`, `isValidURL`, `safeJSONParse`, `computeHash`, `downloadFile`, `readFileAsDataURL`, `readFileAsText`, `copyToClipboard`, `readFromClipboard`, `showSuccess`, `showError`, `showWarning`, `showInfo`, `concurrentMap`.

- [ ] **Step 4: Update src/shared/utils/index.ts to re-export from common.ts**

```ts
export * from './common';
export * from './formatting';
export * from './notify';
export * from './project-metrics';
```

- [ ] **Step 5: Update src/shared/index.ts to avoid self-reference**

Read `src/shared/index.ts` and ensure it does not `export * from './utils'` in a way that re-introduces circularity. It should be a clean barrel.

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/utils/index.ts src/shared/utils/common.ts
git commit -m "refactor(A6): fix circular import in shared/utils/index.ts"
```

---

### Task A7: Rename cssmodule.d.ts → css-modules.d.ts

**Files to rename:**
- `src/types/cssmodule.d.ts` → `src/types/css-modules.d.ts`

- [ ] **Step 1: Rename file**

```bash
git mv src/types/cssmodule.d.ts src/types/css-modules.d.ts
```

- [ ] **Step 2: Verify tsconfig picks up new name**

The tsconfig path `"@/types/*": ["./src/types/*"]` uses a glob pattern, so both `cssmodule.d.ts` and `css-modules.d.ts` match. No import updates needed in .ts/.tsx files since no file directly imports this declaration file.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/types/css-modules.d.ts
git commit -m "refactor(A7): rename cssmodule.d.ts to css-modules.d.ts"
```

---

## Phase B — Dead Code Removal

### Task B1: Delete Empty and Obsolete Directories

**Directories to delete (after their contents have been moved in Phase A):**

| Directory | Condition |
|-----------|-----------|
| `src/components/StoryFab/` | After A4 deletes context/ and A1 deletes workspace/ and types/ |
| `src/workflow/` | After A2 moves feature-blueprint.ts |
| `src/context/` | After A4 migrates both context files to stores/ |

- [ ] **Step 1: Verify directories are empty**

```bash
find src/components/StoryFab/ -type f
find src/workflow/ -type f
find src/context/ -type f
# Expected: zero files in all three
```

- [ ] **Step 2: Delete directories**

```bash
rm -rf src/components/StoryFab/
rm -rf src/workflow/
rm -rf src/context/
```

- [ ] **Step 3: Verify no dangling imports**

```bash
grep -rn "from.*StoryFab/" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*core/workflow" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*@/context" src/ --include="*.ts" --include="*.tsx"
# Expected: zero results for all
```

- [ ] **Step 4: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(B1): delete empty StoryFab/, workflow/, context/ dirs"
```

---

### Task B2: Clean Up Unused Exports and Barrels

**Files to review:**
- `src/shared/index.ts`
- `src/core/errors/index.ts`
- `src/core/services/index.ts`
- `src/store/index.ts` (now `src/stores/index.ts`)

- [ ] **Step 1: Audit each barrel for unused re-exports**

For each barrel file, grep the codebase for imports of each named export. If an export has zero importers outside the barrel itself, remove it.

Example for `src/shared/index.ts`:
```bash
# Check each export
grep -rn "from.*@/shared" src/ --include="*.ts" --include="*.tsx" | grep -v "shared/index.ts"
```

- [ ] **Step 2: Remove confirmed-unused exports**

Edit each barrel file to remove re-exports that have no external consumers. Keep the file structure intact — only prune leaf exports.

- [ ] **Step 3: Type check + tests**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/index.ts src/core/errors/index.ts src/core/services/index.ts src/stores/index.ts
git commit -m "chore(B2): remove unused barrel exports"
```

---

## Phase C — README Rewrite

### Task C1: Rewrite README.md

**Files to modify:**
- `README.md`

**Interfaces:**
- Consumes: current README content, docs/ structure
- Produces: rewritten README with fixed references, new sections, Mermaid diagrams

- [ ] **Step 1: Read current README and docs structure**

Read `README.md`, `docs/guide/*.md`, `docs/dev/*.md`, `docs/reference/*.md`, `CHANGELOG.md` to understand current content and links.

- [ ] **Step 2: Rewrite README.md**

Write a new `README.md` that:

1. **Fixes the CLAUDE.md reference** in the contributing section:
   - Change `参考 CLAUDE.md` → `参考 [AI服务开发指南](docs/dev/ai-services.md)`

2. **Adds a Code of Conduct section** after Contributing:
   ```markdown
   ## 📜 行为准则
   
   本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。
   请保持尊重、包容的交流态度。
   ```

3. **Adds a Security Policy section** after Code of Conduct:
   ```markdown
   ## 🔒 安全策略
   
   发现安全漏洞？请发送邮件至 `agions@qq.com`，而非公开 Issue。
   我们会在 48 小时内响应。
   ```

4. **Upgrades the ASCII architecture diagram to Mermaid**:
   ```markdown
   ```mermaid
   graph TB
     subgraph Frontend["前端层 — React 18 + TypeScript 5 + Vite 6"]
       F1[Zustand Stores]
       F2[shadcn/ui]
       F3[MultiTrackTimeline]
     end
     subgraph IPC["Tauri 2 IPC — 61 个命令"]
       I1[invoke.ts]
     end
     subgraph Backend["Rust 后端 — tokio + 1.77+"]
       B1[ffmpeg-sidecar]
       B2[whisper-rs]
       B3[llm-providers]
       B4[tts-providers]
       B5[commentary engine]
     end
     F1 --> I1
     F2 --> I1
     F3 --> I1
     I1 --> B1
     I1 --> B2
     I1 --> B3
     I1 --> B4
     I1 --> B5
   ```
   ```

5. **Preserves all existing sections** (Why StoryFab, Quick Start, Work Modes, Features, Docs, Dev Commands, Contributing, Roadmap, License, Acknowledgements) with updated numbers reflecting the new structure.

- [ ] **Step 3: Verify all markdown links resolve**

```bash
grep -oP '(\[.*?\]\(.*?\))' README.md | grep "^\[" | grep "docs/" | while read link; do
  path=$(echo "$link" | grep -oP '(?<=\().*?(?=\))')
  [ -f "$path" ] && echo "OK: $path" || echo "BROKEN: $path"
done
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(C1): rewrite README — fix refs, add sections, Mermaid diagrams"
```

---

## Phase D — Logo/Brand Redesign

### Task D1: Expand theme/colors.ts Brand Palette

**Files to modify:**
- `src/theme/colors.ts`

**Interfaces:**
- Consumes: existing `colors` object
- Produces: `colors.brand` token group with Logo-derived colors

- [ ] **Step 1: Read current theme/colors.ts**

Read `src/theme/colors.ts` to understand the existing color token structure.

- [ ] **Step 2: Add brand token group**

Edit `src/theme/colors.ts` to add a `brand` section:

```ts
brand: {
  // Logo-derived brand colors
  purple:      '#7C3AED',
  pink:        '#EC4899',
  amber:       '#F59E0B',
  gold:        '#d4a574',
  darkBg:      '#0B0F1F',
  darkBgLight: '#1A1F3A',
} as const,
```

Insert this after the existing `glowSuccess` entry and before the closing `} as const;`.

- [ ] **Step 3: Verify type-check passes**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/theme/colors.ts
git commit -m "feat(D1): expand theme palette with brand tokens from Logo"
```

---

### Task D2: Fix index.html Favicon References

**Files to modify:**
- `index.html`

**Interfaces:**
- Consumes: existing favicon/link tags
- Produces: valid favicon references that resolve to actual files

- [ ] **Step 1: Read index.html head**

Read the `<head>` section of `index.html` to see current favicon and logo references.

- [ ] **Step 2: Fix favicon link**

Change the non-existent `/favicon.svg` reference to the existing `/logo-icon.svg`:

```html
<!-- BEFORE -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="alternate icon" type="image/png" href="/favicon.svg" />

<!-- AFTER -->
<link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
<link rel="alternate icon" type="image/png" href="/logo-icon.svg" />
```

- [ ] **Step 3: Verify logo-icon.svg exists**

```bash
ls -la assets/logo-icon.svg
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix(D2): point favicon to existing logo-icon.svg"
```

---

### Task D3: Deduplicate Logo Assets

**Files to modify:**
- `assets/logo-horizontal-enhanced.svg` → merge into `assets/logo-horizontal.svg`, then delete

**Files to keep:**
- `assets/logo-icon.svg` (favicon/app icon)
- `assets/logo-mark.svg` (high-quality mark)
- `assets/logo-horizontal.svg` (primary horizontal logo, after merging enhanced content)

**Interfaces:**
- Consumes: existing 4 SVG files
- Produces: 3 SVG files with no content duplication

- [ ] **Step 1: Read both horizontal logos**

Read `assets/logo-horizontal.svg` and `assets/logo-horizontal-enhanced.svg` to identify unique content in the enhanced version.

- [ ] **Step 2: Merge enhanced content into primary**

If `logo-horizontal-enhanced.svg` contains unique elements (e.g., the drop shadow filter `logoShadow`), incorporate those into `logo-horizontal.svg` by:
1. Adding the `<filter id="logoShadow">` definition to `logo-horizontal.svg`'s `<defs>`
2. Applying `filter="url(#logoShadow)"` to the icon's background rect

- [ ] **Step 3: Delete the redundant file**

```bash
git rm assets/logo-horizontal-enhanced.svg
```

- [ ] **Step 4: Commit**

```bash
git add assets/logo-horizontal.svg
git commit -m "chore(D3): merge logo-horizontal-enhanced into logo-horizontal, delete redundant"
```

---

## Verification Checklist (After All Phases)

Run these commands and confirm zero errors:

```bash
# Type check
npx tsc --noEmit

# Tests
npx vitest run

# Lint
npm run lint

# No broken doc links in README
grep -oP '(\[.*?\]\(.*?\))' README.md | grep "^\[" | grep "docs/" | while read link; do
  path=$(echo "$link" | grep -oP '(?<=\().*?(?=\))')
  [ -f "$path" ] && echo "OK: $path" || echo "BROKEN: $path"
done

# No old-path imports remaining
grep -rn "from.*@/store\b" src/ --include="*.ts" --include="*.tsx" | grep -v "stores"
grep -rn "from.*@/context" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*core/workflow" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*StoryFab/" src/ --include="*.ts" --include="*.tsx"
```

## Final Git State

After all phases, the working tree should show:
- ~50+ files moved/renamed (Phase A)
- ~3 empty directories deleted (Phase B)
- 1 README.md rewritten (Phase C)
- 1 theme/colors.ts expanded + 1 index.html fixed + 1 logo merged (Phase D)
- 0 type errors, 0 test failures
