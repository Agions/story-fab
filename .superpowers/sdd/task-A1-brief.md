# Task A1 Brief: Move StoryFab Workspace from components/ to pages/

## Where this fits

This is the first and largest structural task in Phase A. It moves the entire StoryFab workspace (the AI video editor workflow) from `components/` to `pages/`, and moves its type definitions from `components/StoryFab/types/` to `core/types/storyfab/`. This establishes the correct architectural boundary: pages contain route-level UI, components contains reusable widgets.

## What to do

### Step 1: Create target directories

```bash
mkdir -p src/pages/workspace/components
mkdir -p src/pages/workspace/config
mkdir -p src/pages/workspace/Highlights
mkdir -p src/pages/workspace/hooks
mkdir -p src/pages/workspace/VideoExport
mkdir -p src/core/types/storyfab
```

### Step 2: Move workspace files (src/components/StoryFab/workspace/ → src/pages/workspace/)

Move top-level workspace files:
```
src/components/StoryFab/workspace/workspace.tsx
src/components/StoryFab/workspace/project-setup.tsx
src/components/StoryFab/workspace/video-upload.tsx
src/components/StoryFab/workspace/ai-visualizer.tsx
src/components/StoryFab/workspace/script-writing.tsx
src/components/StoryFab/workspace/video-composing.tsx
src/components/StoryFab/workspace/clip-rippling.tsx
src/components/StoryFab/workspace/step-list.tsx
src/components/StoryFab/workspace/index.ts
src/components/StoryFab/workspace/function-mode-map.ts
src/components/StoryFab/workspace/compose-config.ts
src/components/StoryFab/workspace/script-config.ts
src/components/StoryFab/workspace/clip-rippling-config.ts
src/components/StoryFab/workspace/use-clip-rippling.ts
src/components/StoryFab/workspace/AIVisualizer.module.less
src/components/StoryFab/workspace/ClipRippling.module.less
src/components/StoryFab/workspace/ProjectSetup.module.less
src/components/StoryFab/workspace/ScriptWriting.module.less
src/components/StoryFab/workspace/VideoComposing.module.less
src/components/StoryFab/workspace/VideoExport.module.less
src/components/StoryFab/workspace/VideoUpload.module.less
src/components/StoryFab/workspace/workspace.module.less
```

Move subdirectory files (use cp -r):
```
src/components/StoryFab/workspace/config/ → src/pages/workspace/config/
src/components/StoryFab/workspace/hooks/ → src/pages/workspace/hooks/
src/components/StoryFab/workspace/components/ → src/pages/workspace/components/
src/components/StoryFab/workspace/Highlights/ → src/pages/workspace/Highlights/
src/components/StoryFab/workspace/VideoExport/ → src/pages/workspace/VideoExport/
```

### Step 3: Move type files (src/components/StoryFab/types/ → src/core/types/storyfab/)

```
src/components/StoryFab/types/workflow.ts
src/components/StoryFab/types/workflow.reducer.ts
src/components/StoryFab/types/workflow.reducer.test.ts
```

### Step 4: Update imports that reference old paths

Update `src/pages/AIVideoEditor/index.tsx`:
```tsx
// Change:
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/components/StoryFab/workspace/function-mode-map';
// To:
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/pages/workspace/function-mode-map';
```

After moving all files, search for any remaining imports:
```bash
grep -rn "from.*StoryFab/workspace" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*StoryFab/types" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*StoryFab'" src/ --include="*.ts" --include="*.tsx"
```
All must return zero results.

### Step 5: Delete old directories

```bash
rm -rf src/components/StoryFab/workspace
rm -rf src/components/StoryFab/types
```

### Step 6: Verify

```bash
npx tsc --noEmit
npx vitest run
```

Both must pass with zero errors.

### Step 7: Commit

```bash
git add -A
git commit -m "refactor(A1): move StoryFab workspace to pages/, types to core/"
```

## Exact files to move

Top-level workspace files (14 .ts/.tsx + 8 .module.less):
- src/components/StoryFab/workspace/workspace.tsx
- src/components/StoryFab/workspace/project-setup.tsx
- src/components/StoryFab/workspace/video-upload.tsx
- src/components/StoryFab/workspace/ai-visualizer.tsx
- src/components/StoryFab/workspace/script-writing.tsx
- src/components/StoryFab/workspace/video-composing.tsx
- src/components/StoryFab/workspace/clip-rippling.tsx
- src/components/StoryFab/workspace/step-list.tsx
- src/components/StoryFab/workspace/index.ts
- src/components/StoryFab/workspace/function-mode-map.ts
- src/components/StoryFab/workspace/compose-config.ts
- src/components/StoryFab/workspace/script-config.ts
- src/components/StoryFab/workspace/clip-rippling-config.ts
- src/components/StoryFab/workspace/use-clip-rippling.ts
- src/components/StoryFab/workspace/AIVisualizer.module.less
- src/components/StoryFab/workspace/ClipRippling.module.less
- src/components/StoryFab/workspace/ProjectSetup.module.less
- src/components/StoryFab/workspace/ScriptWriting.module.less
- src/components/StoryFab/workspace/VideoComposing.module.less
- src/components/StoryFab/workspace/VideoExport.module.less
- src/components/StoryFab/workspace/VideoUpload.module.less
- src/components/StoryFab/workspace/workspace.module.less

Subdirectories to copy:
- src/components/StoryFab/workspace/config/
- src/components/StoryFab/workspace/hooks/
- src/components/StoryFab/workspace/components/
- src/components/StoryFab/workspace/Highlights/
- src/components/StoryFab/workspace/VideoExport/

Type files (3):
- src/components/StoryFab/types/workflow.ts
- src/components/StoryFab/types/workflow.reducer.ts
- src/components/StoryFab/types/workflow.reducer.test.ts

## Import update rule

After moving, grep for ALL of these patterns and ensure zero results:
1. `from '@/components/StoryFab/workspace`
2. `from '@/components/StoryFab/types`
3. `from '@/components/StoryFab'` (with trailing quote)

The only file that needs updating is `src/pages/AIVideoEditor/index.tsx` line 17:
```tsx
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/components/StoryFab/workspace/function-mode-map';
```
Change to:
```tsx
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/pages/workspace/function-mode-map';
```

## Global constraints

- Use `git mv` for tracked files
- After each phase, run `npx tsc --noEmit` and `npx vitest run`
- Git commit message: `refactor(A1): move StoryFab workspace to pages/, types to core/`
