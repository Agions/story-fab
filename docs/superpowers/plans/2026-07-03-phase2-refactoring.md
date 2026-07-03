# StoryFab Phase-2 Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate dead code, standardize naming, remove type duplication, reduce reducer boilerplate by ~87%, and simplify the StoryFab state layer across the StoryFab Tauri + React codebase.

**Architecture:** Six sequential phases — (1) dead-code removal, (2) type-name standardization, (3) file consolidation, (4) type dedup, (5) reducer-hook factory + migrations, (6) directory rename. Each phase produces a working, test-passing state. No phase depends on later phases.

**Tech Stack:** TypeScript 5.7, React 18, Zustand 5, Vitest 4, Tauri 2

## Global Constraints

- All renames must be project-wide (no stale references).
- After every task: `npm run test:run && npx tsc --noEmit` must pass.
- Commit after each task; commit message format: `refactor(<scope>): <description>`.
- Do NOT change runtime behavior — only structure, naming, and elimination.
- Do NOT remove `__resetTrackHistoryForTest` (used by `timeline-store.test.ts`).

---

## File Structure After Refactoring

```
src/
  core/types/storyfab/
    workflow.ts          ← merged (workflow.reducer.ts content folded in)
  shared/hooks/
    useReducerHook.ts    ← NEW: factory + hooks utility
    useReducerHook.test.ts ← NEW
  hooks/
    use-project-detail.ts      ← migrated to factory
    use-script-detail.ts       ← migrated to factory
  components/
    common/keyboard-shortcuts-help/  ← renamed from KeyboardShortcutsHelp
  pages/workspace/context/
    storyfab-provider.tsx   ← simplified (no Context wrapper)
  types/
    project.ts              ← DetailProject type added
  shared/types/
    index.ts                ← dead re-export removed
```

---

### Phase 1: Dead Code Removal

### Task 1: Remove `rawInvoke` from tauri bridge

**Files:**
- Modify: `src/core/tauri/invoke.ts:203-208`
- Modify: `src/core/tauri/index.ts:87`

**Interfaces:**
- Consumes: `TauriCommandName`, `TauriCommandOutput`, `executeWithRetry` (internal)
- Produces: `invoke`, `TauriCommand`, `TauriBridgeError`, `BridgeOptions` (unchanged)

- [ ] **Step 1: Delete `rawInvoke` function from `invoke.ts`**

Remove the entire `rawInvoke` function (lines 202–208):

```ts
// DELETE these lines:
/** Raw invoke without TauriCommand restriction — for commentary/Rust-only commands */
export async function rawInvoke<C extends TauriCommandName>(
  command: C,
  args?: Record<string, unknown>,
): Promise<TauriCommandOutput<C>> {
  return executeWithRetry(command, normalizeArgs(args), 0, undefined);
}
```

- [ ] **Step 2: Remove `rawInvoke` from re-export in `index.ts`**

In `src/core/tauri/index.ts`, change line 87 from:

```ts
export { TauriCommand, TauriBridgeError, invoke, rawInvoke } from './invoke';
```

to:

```ts
export { TauriCommand, TauriBridgeError, invoke } from './invoke';
```

- [ ] **Step 3: Verify no references remain**

Run: `grep -rn "rawInvoke" src/`
Expected: no matches

- [ ] **Step 4: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/tauri/invoke.ts src/core/tauri/index.ts
git commit -m "refactor(tauri): remove dead rawInvoke function"
```

---

### Task 2: Remove dead `notify.loading` and `notify.destroy`

**Files:**
- Modify: `src/shared/utils/notify.ts`

**Interfaces:**
- Consumes: nothing (self-contained)
- Produces: `notify` object with `success`, `error`, `warning`, `info` only

- [ ] **Step 1: Delete `notify.loading` and `notify.destroy` from `notify.ts`**

Remove the `loading` method (lines 63–65) and `destroy` method (lines 67–70):

```ts
// DELETE these lines:
  loading: (content: string, key: string) => {
    emitToast({ type: 'loading', content, duration: 0, key });
  },

  destroy: (_key?: string) => {
    // For destroy without key, we'd need a more complex system
    // For now, individual toasts handle their own removal via duration
  },
```

- [ ] **Step 2: Verify no callers remain**

Run: `grep -rn "notify\.loading\|notify\.destroy" src/`
Expected: no matches

- [ ] **Step 3: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/shared/utils/notify.ts
git commit -m "refactor(notify): remove dead loading and destroy methods"
```

---

### Task 3: Delete duplicate `storyfab-context.tsx` barrel

**Files:**
- Delete: `src/pages/workspace/context/storyfab-context.tsx`

**Interfaces:**
- Consumes: nothing (this file is a pure barrel re-export)
- Produces: nothing (its exports are already in `index.tsx`)

- [ ] **Step 1: Delete `storyfab-context.tsx`**

```bash
rm src/pages/workspace/context/storyfab-context.tsx
```

- [ ] **Step 2: Verify no imports reference it**

Run: `grep -rn "storyfab-context" src/`
Expected: no matches

- [ ] **Step 3: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(context): remove duplicate storyfab-context barrel"
```

---

### Phase 2: Type Name Standardization

### Task 4: Rename storyfab types to PascalCase in `workflow.ts` and `index.ts`

**Files:**
- Modify: `src/core/types/storyfab/workflow.ts`
- Modify: `src/core/types/storyfab/index.ts`

**Interfaces:**
- Consumes: nothing (this is the type definition layer)
- Produces: PascalCase type exports (`StoryFabState`, `StoryFabStep`, etc.)

- [ ] **Step 1: Rename all type exports in `workflow.ts`**

Replace all 5 type export names (keeping values identical):

| Old Name | New Name |
|----------|----------|
| `storyfabFeatureType` | `StoryFabFeatureType` |
| `storyfabStep` | `StoryFabStep` |
| `storyfabMode` | `StoryFabMode` |
| `storyfabState` | `StoryFabState` |
| `storyfabAction` | `StoryFabAction` |

Also rename the interface `storyfabState` to `StoryFabState` (line 34) and the type `storyfabAction` to `StoryFabAction` (line 87).

Concrete edits in `workflow.ts`:
- Line 10: `export type storyfabFeatureType` → `export type StoryFabFeatureType`
- Line 12: `export type storyfabStep` → `export type StoryFabStep`
- Line 24: `export type storyfabMode` → `export type StoryFabMode`
- Line 26: `export interface SemanticSegment` → unchanged (already PascalCase)
- Line 34: `export interface storyfabState` → `export interface StoryFabState`
- Line 35: `mode: storyfabMode;` → `mode: StoryFabMode;`
- Line 36: `currentStep: storyfabStep;` → `currentStep: StoryFabStep;`
- Lines 37–48: `stepStatus` property keys use `StoryFabStep` values (string literal keys unchanged)
- Line 49: `selectedFeature: storyfabFeatureType;` → `selectedFeature: StoryFabFeatureType;`
- Line 87: `export type storyfabAction` → `export type StoryFabAction`
- Lines 88–113: Each `payload` type uses the new PascalCase names

- [ ] **Step 2: Update re-exports in `index.ts`**

In `src/core/types/storyfab/index.ts`, update the re-export block:

```ts
export type {
  StoryFabFeatureType,
  StoryFabStep,
  StoryFabState,
  StoryFabAction,
  StoryFabMode,
  SemanticSegment,
} from './workflow';
```

- [ ] **Step 3: Run type-check (expect failures)**

Run: `npx tsc --noEmit`
Expected: FAIL — many files still reference old type names (this confirms we found all references)

- [ ] **Step 4: Commit**

```bash
git add src/core/types/storyfab/workflow.ts src/core/types/storyfab/index.ts
git commit -m "refactor(types): rename storyfab types to PascalCase in workflow.ts"
```

---

### Task 5: Update all references to renamed storyfab types

**Files:**
- Modify: `src/core/types/storyfab/workflow.reducer.ts`
- Modify: `src/core/types/storyfab/workflow.reducer.test.ts`
- Modify: `src/stores/storyfab-store.ts`
- Modify: `src/pages/workspace/context/storyfab-provider.tsx`
- Modify: `src/pages/workspace/clip-rippling.tsx`
- Modify: `src/pages/workspace/ai-visualizer.tsx`
- Modify: `src/pages/workspace/VideoExport/video-export.tsx`
- Modify: `src/pages/workspace/video-composing.tsx`
- Modify: `src/pages/workspace/workspace.tsx`
- Modify: `src/pages/workspace/project-setup.tsx`
- Modify: `src/pages/workspace/video-upload.tsx`
- Modify: `src/pages/workspace/script-writing.tsx`

**Interfaces:**
- Consumes: `StoryFabState`, `StoryFabStep`, `StoryFabAction`, `StoryFabMode`, `StoryFabFeatureType` (from Task 4)
- Produces: All references updated to PascalCase

- [ ] **Step 1: Fix `workflow.reducer.ts`**

In `src/core/types/storyfab/workflow.reducer.ts`:
- Line 5: `import type { storyfabState, storyfabAction } from './workflow';` → `import type { StoryFabState, StoryFabAction } from './workflow';`
- Line 6: `import { initialState, getStepsForMode } from './workflow';` → unchanged
- Line 9: `export function storyFabReducer(state: storyfabState, action: storyfabAction)` → `export function storyFabReducer(state: StoryFabState, action: StoryFabAction)`

- [ ] **Step 2: Fix `workflow.reducer.test.ts`**

In `src/core/types/storyfab/workflow.reducer.test.ts`:
- Line 8: `import type { storyfabState } from './workflow';` → `import type { StoryFabState } from './workflow';`
- Line 11: `const makeState = (overrides?: Partial<storyfabState>)` → `const makeState = (overrides?: Partial<StoryFabState>)`
- All `storyfabState['project']` → `StoryFabState['project']` (lines 54, 62, 73, 83, 91, 101, 193)

- [ ] **Step 3: Fix `storyfab-store.ts`**

In `src/stores/storyfab-store.ts`:
- Lines 8–14: Change all 5 imported type names:

```ts
import type {
  StoryFabState,
  StoryFabStep,
  StoryFabFeatureType,
  StoryFabMode,
  StoryFabAction,
} from '@/core/types/storyfab';
```

- Line 25: `state: storyfabState;` → `state: StoryFabState;`
- Lines 27–48: All action parameter/return types use PascalCase names
- Line 59: `set((s) => ({ state: storyFabReducer(s.state, action) }))` → `set((s) => ({ state: storyFabReducer(s.state, action) }))` (reducer function name unchanged)

- [ ] **Step 4: Fix `storyfab-provider.tsx`**

In `src/pages/workspace/context/storyfab-provider.tsx`:
- No type changes needed — this file imports `useStoryFabStore` (the store), not the raw types directly.

- [ ] **Step 5: Fix workspace page files**

Each file imports `useStoryFab` or `useStoryFabStore` from the provider, which returns `{ state, dispatch, ... }`. The `state` property type is `StoryFabState` but consumers destructure it, so no direct type name references exist. Verify with:

Run: `grep -rn "storyfabState\|storyfabStep\|storyfabAction\|storyfabMode\|storyfabFeatureType" src/pages/workspace/`
Expected: no matches after fixing store.ts

- [ ] **Step 6: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/core/types/storyfab/workflow.reducer.ts \
      src/core/types/storyfab/workflow.reducer.test.ts \
      src/stores/storyfab-store.ts \
      src/pages/workspace/clip-rippling.tsx \
      src/pages/workspace/ai-visualizer.tsx \
      src/pages/workspace/VideoExport/video-export.tsx \
      src/pages/workspace/video-composing.tsx \
      src/pages/workspace/workspace.tsx \
      src/pages/workspace/project-setup.tsx \
      src/pages/workspace/video-upload.tsx \
      src/pages/workspace/script-writing.tsx
git commit -m "refactor(types): update all references to PascalCase storyfab types"
```

---

### Phase 3: File Consolidation

### Task 6: Merge `workflow.reducer.ts` into `workflow.ts`

**Files:**
- Modify: `src/core/types/storyfab/workflow.ts`
- Delete: `src/core/types/storyfab/workflow.reducer.ts`
- Modify: `src/core/types/storyfab/index.ts`
- Modify: `src/core/types/storyfab/workflow.reducer.test.ts`

**Interfaces:**
- Consumes: `StoryFabState`, `StoryFabAction` (from Tasks 4–5)
- Produces: Single `workflow.ts` containing types + reducer + helpers

- [ ] **Step 1: Append reducer code to `workflow.ts`**

In `src/core/types/storyfab/workflow.ts`, after the `getTotalSteps` function (line 220), append:

```ts
// ─── Reducer ──────────────────────────────────────────────────────────────────

export function storyFabReducer(
  state: StoryFabState,
  action: StoryFabAction,
): StoryFabState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        currentStep: 'project-create',
        stepStatus: { ...initialState.stepStatus },
        semanticSegments: [],
        directorPhase: 'pending',
        commentaryPlan: null,
      };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_STEP_COMPLETE':
      return {
        ...state,
        stepStatus: {
          ...state.stepStatus,
          [action.payload.step]: action.payload.complete,
        },
      };

    case 'SET_FEATURE':
      return { ...state, selectedFeature: action.payload };

    case 'SET_PROJECT':
      return {
        ...state,
        project: action.payload ? structuredClone(action.payload) : null,
        stepStatus: action.payload
          ? { ...state.stepStatus, 'project-create': true }
          : state.stepStatus,
        currentStep: action.payload ? 'video-upload' : state.currentStep,
      };

    case 'SET_VIDEO':
      return {
        ...state,
        currentVideo: action.payload ? structuredClone(action.payload) : null,
        duration: action.payload?.duration || 0,
        stepStatus: action.payload
          ? { ...state.stepStatus, 'video-upload': true }
          : state.stepStatus,
      };

    case 'SET_ANALYSIS':
      return {
        ...state,
        analysis: action.payload ? structuredClone(action.payload) : null,
        stepStatus: action.payload
          ? { ...state.stepStatus, 'ai-analyze': true }
          : state.stepStatus,
      };

    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload.isAnalyzing,
        analysisProgress: action.payload.progress ?? state.analysisProgress,
      };

    case 'SET_OCR_SUBTITLE':
      return { ...state, subtitleData: { ...state.subtitleData, ocr: action.payload } };

    case 'SET_ASR_SUBTITLE':
      return { ...state, subtitleData: { ...state.subtitleData, asr: action.payload } };

    case 'SET_SUBTITLE_PROGRESS':
      return {
        ...state,
        isGeneratingSubtitle: action.payload.isGenerating,
        subtitleProgress: action.payload.progress ?? state.subtitleProgress,
      };

    case 'SET_NARRATION_SCRIPT':
      return { ...state, scriptData: { ...state.scriptData, narration: action.payload } };

    case 'SET_REMIX_SCRIPT':
      return { ...state, scriptData: { ...state.scriptData, remix: action.payload } };

    case 'SET_SCRIPT_PROGRESS':
      return {
        ...state,
        isGeneratingScript: action.payload.isGenerating,
        scriptProgress: action.payload.progress ?? state.scriptProgress,
      };

    case 'SET_VOICE':
      return {
        ...state,
        voiceData: {
          audioUrl: action.payload.audioUrl,
          voiceSettings: action.payload.settings
            ? { ...state.voiceData.voiceSettings, ...action.payload.settings }
            : state.voiceData.voiceSettings,
        },
      };

    case 'SET_VOICE_PROGRESS':
      return {
        ...state,
        isSynthesizingVoice: action.payload.isSynthesizing,
        voiceProgress: action.payload.progress ?? state.voiceProgress,
      };

    case 'SET_SYNTHESIS':
      return {
        ...state,
        synthesisData: {
          finalVideoUrl: action.payload.finalVideoUrl,
          settings: action.payload.settings
            ? { ...state.synthesisData.settings, ...action.payload.settings }
            : state.synthesisData.settings,
        },
      };

    case 'SET_SYNTHESIS_PROGRESS':
      return {
        ...state,
        isSynthesizing: action.payload.isSynthesizing,
        synthesisProgress: action.payload.progress ?? state.synthesisProgress,
      };

    case 'SET_EXPORT_SETTINGS':
      return { ...state, exportSettings: action.payload };

    case 'SET_EXPORT_PROGRESS':
      return {
        ...state,
        isExporting: action.payload.isExporting,
        exportProgress: action.payload.progress ?? state.exportProgress,
        stepStatus:
          action.payload.isExporting === false && state.exportSettings
            ? { ...state.stepStatus, 'video-export': true }
            : state.stepStatus,
      };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };

    case 'SET_DURATION':
      return { ...state, duration: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET':
      return { ...initialState };

    case 'RESET_STEP': {
      const steps = getStepsForMode(state.mode);
      const resetIndex = steps.indexOf(action.payload);
      const newStepStatus = { ...initialState.stepStatus };
      for (let i = resetIndex; i < steps.length; i++) {
        newStepStatus[steps[i]] = false;
      }
      return {
        ...state,
        currentStep: action.payload,
        stepStatus: newStepStatus,
        currentVideo: null,
        analysis: null,
        subtitleData: { ocr: null, asr: null },
        scriptData: { narration: null, remix: null },
        voiceData: { audioUrl: null, voiceSettings: state.voiceData.voiceSettings },
        synthesisData: { finalVideoUrl: null, settings: state.synthesisData.settings },
        exportSettings: null,
        error: null,
      };
    }

    default:
      return state;
  }
}
```

- [ ] **Step 2: Update `index.ts` re-export**

Change the reducer import in `src/core/types/storyfab/index.ts` from:

```ts
export { storyFabReducer } from './workflow.reducer';
```

to:

```ts
export { storyFabReducer } from './workflow';
```

- [ ] **Step 3: Update test file import**

In `src/core/types/storyfab/workflow.reducer.test.ts`, change:

```ts
import { storyFabReducer } from './workflow.reducer';
```

to:

```ts
import { storyFabReducer } from './workflow';
```

- [ ] **Step 4: Delete old reducer file**

```bash
rm src/core/types/storyfab/workflow.reducer.ts
```

- [ ] **Step 5: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/core/types/storyfab/workflow.ts \
      src/core/types/storyfab/index.ts \
      src/core/types/storyfab/workflow.reducer.test.ts
git rm src/core/types/storyfab/workflow.reducer.ts
git commit -m "refactor(types): merge workflow.reducer.ts into workflow.ts"
```

---

### Phase 4: Type Dedup

### Task 7: Merge duplicate `ProjectDetailProject` and `ScriptDetailProject`

**Files:**
- Modify: `src/types/project.ts`
- Modify: `src/hooks/use-project-detail.reducer.ts`
- Modify: `src/hooks/use-script-detail.reducer.ts`
- Modify: `src/hooks/use-project-detail.ts`
- Modify: `src/hooks/use-script-detail.ts`
- Modify: `src/hooks/use-project-detail.reducer.test.ts`
- Modify: `src/hooks/use-script-detail.reducer.test.ts`

**Interfaces:**
- Consumes: nothing (creates the new unified type)
- Produces: `DetailProject` type exported from `src/types/project.ts`

- [ ] **Step 1: Add unified `DetailProject` type to `src/types/project.ts`**

At the end of `src/types/project.ts`, append:

```ts
// ─── Detail-page project type (unified) ─────────────────────────────────────────
// Replaces the duplicated ProjectDetailProject / ScriptDetailProject
// interfaces previously defined in hooks/*.reducer.ts

export interface DetailProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt: string;
  videoPath?: string;
  videos?: Array<{ path?: string }>;
  videoUrl?: string;
}
```

- [ ] **Step 2: Update `use-project-detail.reducer.ts`**

Replace the `ProjectDetailProject` interface (lines 14–24) with:

```ts
export { type DetailProject } from '@/types';
```

And update the state interface line 7:

```ts
project: (DetailProject & { scripts?: AIScriptDraft[]; analysis?: VideoAnalysis; extractedSubtitles?: unknown }) | null;
```

- [ ] **Step 3: Update `use-script-detail.reducer.ts`**

Replace the `ScriptDetailProject` interface (lines 16–27) with:

```ts
export { type DetailProject } from '@/types';
```

- [ ] **Step 4: Update `use-project-detail.ts` re-export**

Change line 88:

```ts
export type { ProjectDetailState, ProjectDetailProject };
```

to:

```ts
export type { ProjectDetailState };
```

- [ ] **Step 5: Update `use-script-detail.ts` re-export**

Change line 103:

```ts
export type { ScriptDetailState, ScriptDetailProject };
```

to:

```ts
export type { ScriptDetailState };
```

- [ ] **Step 6: Update test files**

In `use-project-detail.reducer.test.ts`:
- Line 6: Remove `type ProjectDetailProject` from import
- Line 17: Change `const mockProject: ProjectDetailProject &` → `const mockProject: DetailProject &`
- Add `import { type DetailProject } from '@/types';` at top

In `use-script-detail.reducer.test.ts`:
- Remove `ScriptDetailProject` import
- Use `DetailProject` from `@/types` for mock data

- [ ] **Step 7: Clean `shared/types/index.ts` dead re-export**

In `src/shared/types/index.ts`, remove line 95:

```ts
export type { Project, ProjectStatus } from '@/types';
```

(This duplicates the `src/types/index.ts` barrel; consumers should import from `@/types` directly.)

- [ ] **Step 8: Run type-check and tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/types/project.ts \
      src/hooks/use-project-detail.reducer.ts \
      src/hooks/use-script-detail.reducer.ts \
      src/hooks/use-project-detail.ts \
      src/hooks/use-script-detail.ts \
      src/hooks/use-project-detail.reducer.test.ts \
      src/hooks/use-script-detail.reducer.test.ts \
      src/shared/types/index.ts
git commit -m "refactor(types): merge duplicate ProjectDetailProject and ScriptDetailProject"
```

---

### Phase 5: Reducer Hook Factory + Migration

### Task 8: Create `createReducerHook` factory with tests

**Files:**
- Create: `src/shared/hooks/useReducerHook.ts`
- Create: `src/shared/hooks/useReducerHook.test.ts`

**Interfaces:**
- Consumes: nothing (standalone utility)
- Produces: `createReducerHook<S, A>(reducer, initialState)` → `UseReducerHookResult<S, A>`

- [ ] **Step 1: Create `src/shared/hooks/useReducerHook.ts`**

```ts
import { useCallback, useMemo, useReducer } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UseReducerHookResult<S, A> {
  state: S;
  dispatch: React.Dispatch<A>;
}

// ─── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a reusable reducer hook that wraps useReducer with useCallback dispatch
 * and useMemo memoization, eliminating ~20 lines of boilerplate per hook.
 *
 * @example
 * ```ts
 * const { state, dispatch } = createReducerHook(reducer, initialState);
 * const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', loading }), [dispatch]);
 * ```
 */
export function createReducerHook<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
): UseReducerHookResult<S, A> {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stableDispatch = useCallback((action: A) => dispatch(action), []);

  const memoizedState = useMemo(() => state, [state]);

  return { state: memoizedState, dispatch: stableDispatch };
}
```

- [ ] **Step 2: Create `src/shared/hooks/useReducerHook.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createReducerHook } from './useReducerHook';

// ─── Test reducer ──────────────────────────────────────────────────────────────

type State = { count: number; name: string };
type Action = { type: 'INC' } | { type: 'SET_NAME'; name: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INC': return { ...state, count: state.count + 1 };
    case 'SET_NAME': return { ...state, name: action.name };
    default: return state;
  }
};

const initial: State = { count: 0, name: '' };

describe('createReducerHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => createReducerHook(reducer, initial));
    expect(result.current.state).toEqual(initial);
  });

  it('dispatches actions and updates state', () => {
    const { result } = renderHook(() => createReducerHook(reducer, initial));
    act(() => result.current.dispatch({ type: 'INC' }));
    expect(result.current.state.count).toBe(1);
  });

  it('memoizes state reference across renders', () => {
    const { result, rerender } = renderHook(() => createReducerHook(reducer, initial));
    const firstRef = result.current.state;
    rerender();
    expect(result.current.state).toBe(firstRef);
  });

  it('dispatch reference is stable', () => {
    const { result, rerender } = renderHook(() => createReducerHook(reducer, initial));
    const firstDispatch = result.current.dispatch;
    rerender();
    expect(result.current.dispatch).toBe(firstDispatch);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run -- useReducerHook`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add src/shared/hooks/useReducerHook.ts src/shared/hooks/useReducerHook.test.ts
git commit -m "refactor(hooks): add createReducerHook factory with tests"
```

---

### Task 9: Migrate `useProjectDetail` to factory

**Files:**
- Modify: `src/hooks/use-project-detail.ts`
- Modify: `src/hooks/use-project-detail.reducer.ts`

**Interfaces:**
- Consumes: `createReducerHook`, `projectDetailReducer`, `initialProjectDetailState`
- Produces: `useProjectDetail` using factory pattern

- [ ] **Step 1: Rewrite `use-project-detail.ts` with factory**

Replace the entire file content:

```ts
import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import {
  projectDetailReducer,
  initialProjectDetailState,
  type ProjectDetailState,
} from './use-project-detail.reducer';

interface UseProjectDetailResult {
  state: ProjectDetailState;
  setActiveStep: (step: string) => void;
  setProject: (project: ProjectDetailState['project']) => void;
  updateProject: (project: NonNullable<ProjectDetailState['project']>) => void;
  setActiveScript: (script: AIScriptDraft | null) => void;
  updateActiveScript: (script: AIScriptDraft) => void;
  updateActiveScriptFromSegments: (segments: ScriptSegment[], activeScript: AIScriptDraft) => void;
  setAiLoading: (loading: boolean) => void;
  setDrawerVisible: (visible: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
}

export function useProjectDetail(): UseProjectDetailResult {
  const { state, dispatch } = createReducerHook(
    projectDetailReducer,
    initialProjectDetailState,
  );

  const setActiveStep = useCallback(
    (step: string) => dispatch({ type: 'SET_ACTIVE_STEP', step }),
    [dispatch],
  );
  const setProject = useCallback(
    (project: ProjectDetailState['project']) =>
      dispatch({ type: 'SET_PROJECT', project }),
    [dispatch],
  );
  const updateProject = useCallback(
    (project: NonNullable<ProjectDetailState['project']>) =>
      dispatch({ type: 'UPDATE_PROJECT', project }),
    [dispatch],
  );
  const setActiveScript = useCallback(
    (script: AIScriptDraft | null) =>
      dispatch({ type: 'SET_ACTIVE_SCRIPT', script }),
    [dispatch],
  );
  const updateActiveScript = useCallback(
    (script: AIScriptDraft) => dispatch({ type: 'UPDATE_ACTIVE_SCRIPT', script }),
    [dispatch],
  );
  const updateActiveScriptFromSegments = useCallback(
    (segments: ScriptSegment[], activeScript: AIScriptDraft) =>
      dispatch({ type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS', segments, activeScript }),
    [dispatch],
  );
  const setAiLoading = useCallback(
    (loading: boolean) => dispatch({ type: 'SET_AI_LOADING', loading }),
    [dispatch],
  );
  const setDrawerVisible = useCallback(
    (visible: boolean) => dispatch({ type: 'SET_DRAWER_VISIBLE', visible }),
    [dispatch],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM_OPEN', open }),
    [dispatch],
  );

  return useMemo(
    () => ({
      state,
      setActiveStep,
      setProject,
      updateProject,
      setActiveScript,
      updateActiveScript,
      updateActiveScriptFromSegments,
      setAiLoading,
      setDrawerVisible,
      setDeleteConfirmOpen,
    }),
    [
      state,
      setActiveStep,
      setProject,
      updateProject,
      setActiveScript,
      updateActiveScript,
      updateActiveScriptFromSegments,
      setAiLoading,
      setDrawerVisible,
      setDeleteConfirmOpen,
    ],
  );
}

export type { ProjectDetailState };
export { initialProjectDetailState };
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- use-project-detail`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-project-detail.ts src/hooks/use-project-detail.reducer.ts
git commit -m "refactor(hooks): migrate useProjectDetail to createReducerHook"
```

---

### Task 10: Migrate `useScriptDetail` to factory

**Files:**
- Modify: `src/hooks/use-script-detail.ts`
- Modify: `src/hooks/use-script-detail.reducer.ts`

- [ ] **Step 1: Rewrite `use-script-detail.ts` with factory**

Replace the entire file content:

```ts
import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import type { Script, ScriptSegment } from '@/core/services/ai/script-service';
import {
  scriptDetailReducer,
  initialScriptDetailState,
  type ScriptDetailState,
} from './use-script-detail.reducer';

interface UseScriptDetailResult {
  state: ScriptDetailState;
  setLoading: (loading: boolean) => void;
  setProject: (project: ScriptDetailState['project']) => void;
  setScript: (script: Script | null) => void;
  setSegments: (segments: ScriptSegment[]) => void;
  setLoadError: (loadError: string) => void;
  incrementReloadToken: () => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  resetForLoad: () => void;
  resetForReload: () => void;
}

export function useScriptDetail(): UseScriptDetailResult {
  const { state, dispatch } = createReducerHook(
    scriptDetailReducer,
    initialScriptDetailState,
  );

  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: 'SET_LOADING', loading }),
    [dispatch],
  );
  const setProject = useCallback(
    (project: ScriptDetailState['project'] | null) =>
      dispatch({ type: 'SET_PROJECT', project }),
    [dispatch],
  );
  const setScript = useCallback(
    (script: Script | null) => dispatch({ type: 'SET_SCRIPT', script }),
    [dispatch],
  );
  const setSegments = useCallback(
    (segments: ScriptSegment[]) => dispatch({ type: 'SET_SEGMENTS', segments }),
    [dispatch],
  );
  const setLoadError = useCallback(
    (loadError: string) => dispatch({ type: 'SET_LOAD_ERROR', loadError }),
    [dispatch],
  );
  const incrementReloadToken = useCallback(
    () => dispatch({ type: 'INCREMENT_RELOAD_TOKEN' }),
    [dispatch],
  );
  const setIsSaving = useCallback(
    (isSaving: boolean) => dispatch({ type: 'SET_IS_SAVING', isSaving }),
    [dispatch],
  );
  const setIsExporting = useCallback(
    (isExporting: boolean) => dispatch({ type: 'SET_IS_EXPORTING', isExporting }),
    [dispatch],
  );
  const setIsDeleting = useCallback(
    (isDeleting: boolean) => dispatch({ type: 'SET_IS_DELETING', isDeleting }),
    [dispatch],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM_OPEN', open }),
    [dispatch],
  );
  const resetForLoad = useCallback(() => dispatch({ type: 'RESET_FOR_LOAD' }), [dispatch]);
  const resetForReload = useCallback(
    () => dispatch({ type: 'RESET_FOR_RELOAD' }),
    [dispatch],
  );

  return useMemo(
    () => ({
      state,
      setLoading,
      setProject,
      setScript,
      setSegments,
      setLoadError,
      incrementReloadToken,
      setIsSaving,
      setIsExporting,
      setIsDeleting,
      setDeleteConfirmOpen,
      resetForLoad,
      resetForReload,
    }),
    [
      state,
      setLoading,
      setProject,
      setScript,
      setSegments,
      setLoadError,
      incrementReloadToken,
      setIsSaving,
      setIsExporting,
      setIsDeleting,
      setDeleteConfirmOpen,
      resetForLoad,
      resetForReload,
    ],
  );
}

export type { ScriptDetailState };
export { initialScriptDetailState };
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- use-script-detail`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-script-detail.ts src/hooks/use-script-detail.reducer.ts
git commit -m "refactor(hooks): migrate useScriptDetail to createReducerHook"
```

---

### Task 11: Migrate `commentary-panel.tsx` to factory

**Files:**
- Modify: `src/components/commentary-panel/commentary-panel.tsx`

- [ ] **Step 1: Rewrite the hook section of `commentary-panel.tsx`**

Replace the `useReducer` block (lines using `useReducer(commentaryPanelReducer, initialCommentaryPanelState)` and the 4 `useCallback` wrappers) with:

```ts
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import { commentaryPanelReducer, initialCommentaryPanelState } from './commentary-panel.reducer';

const { state, dispatch } = createReducerHook(
  commentaryPanelReducer,
  initialCommentaryPanelState,
);

const setActiveTab = useCallback(
  (activeTab: CommentaryTab) => dispatch({ type: 'SET_ACTIVE_TAB', activeTab }),
  [dispatch],
);
const setPlanConfirmOpen = useCallback(
  (planConfirmOpen: boolean) => dispatch({ type: 'SET_PLAN_CONFIRM_OPEN', planConfirmOpen }),
  [dispatch],
);
const setApiKey = useCallback(
  (apiKey: string) => dispatch({ type: 'SET_API_KEY', apiKey }),
  [dispatch],
);
const setSelectedStyle = useCallback(
  (selectedStyle: ScriptStylePreset) => dispatch({ type: 'SET_SELECTED_STYLE', selectedStyle }),
  [dispatch],
);
```

Remove the old `const [state, dispatch] = useReducer(...)` and the manual `useCallback` wrapping.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- commentary-panel`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/commentary-panel/commentary-panel.tsx
git commit -m "refactor(component): migrate commentary-panel to createReducerHook"
```

---

### Task 12: Migrate `video-selector.tsx` to factory

**Files:**
- Modify: `src/components/video-selector/video-selector.tsx`

- [ ] **Step 1: Rewrite the hook section**

Replace the `useReducer` + manual `useCallback` dispatch wrappers with `createReducerHook(videoSelectorReducer, initialVideoSelectorState)` and `useCallback` wrappers using `dispatch` from the factory.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- video-selector`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/video-selector/video-selector.tsx
git commit -m "refactor(component): migrate video-selector to createReducerHook"
```

---

### Task 13: Migrate `video-player.tsx` to factory

**Files:**
- Modify: `src/components/video-player/video-player.tsx`

- [ ] **Step 1: Rewrite the hook section**

Same pattern: replace `useReducer(videoPlayerReducer, initialVideoPlayerState)` + manual wrappers with `createReducerHook`.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- video-player`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/video-player/video-player.tsx
git commit -m "refactor(component): migrate video-player to createReducerHook"
```

---

### Task 14: Migrate `video-processing-controller.ts` to factory

**Files:**
- Modify: `src/components/video-processing-controller/hooks/use-video-processing-controller.ts`

- [ ] **Step 1: Rewrite the hook section**

Replace `useReducer(vpcReducer, initialVpcState)` + manual wrappers with `createReducerHook(vpcReducer, initialVpcState)`.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- useVideoProcessingController`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/video-processing-controller/hooks/use-video-processing-controller.ts
git commit -m "refactor(hooks): migrate video-processing-controller to createReducerHook"
```

---

### Task 15: Migrate `subtitle-extractor.ts` to factory

**Files:**
- Modify: `src/components/subtitle-extractor/use-subtitle-extractor.ts`

- [ ] **Step 1: Rewrite the hook section**

Replace `useReducer(subtitleExtractorReducer, initialSubtitleExtractorState)` + manual wrappers with `createReducerHook`.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- useSubtitleExtractor`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/subtitle-extractor/use-subtitle-extractor.ts
git commit -m "refactor(hooks): migrate subtitle-extractor to createReducerHook"
```

---

### Task 16: Migrate `use-project-edit-state.ts` to factory

**Files:**
- Modify: `src/pages/ProjectEdit/hooks/use-project-edit-state.ts`
- Modify: `src/pages/ProjectEdit/hooks/use-project-edit-state.reducer.ts`

- [ ] **Step 1: Rewrite `use-project-edit-state.ts` with factory**

Replace `useReducer(projectEditReducer, initialProjectEditState)` + manual wrappers with `createReducerHook(projectEditReducer, initialProjectEditState)`.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- use-project-edit-state`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProjectEdit/hooks/use-project-edit-state.ts \
      src/pages/ProjectEdit/hooks/use-project-edit-state.reducer.ts
git commit -m "refactor(hooks): migrate useProjectEditState to createReducerHook"
```

---

### Task 17: Migrate `use-original-editor.ts` and `workflow-editor.tsx` to factory

**Files:**
- Modify: `src/components/script-editor/hooks/use-original-editor.ts`
- Modify: `src/components/script-editor/workflow-editor.tsx`

- [ ] **Step 1: Migrate `use-original-editor.ts`**

Replace `useReducer(originalEditorReducer, initialOriginalEditorState)` + manual wrappers with `createReducerHook`.

- [ ] **Step 2: Migrate `workflow-editor.tsx`**

Replace `useReducer(workflowEditorReducer, initialWorkflowEditorState)` + manual wrappers with `createReducerHook`.

- [ ] **Step 3: Run tests**

Run: `npm run test:run -- useOriginalEditor workflow-editor`
Expected: PASS

- [ ] **Step 4: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/script-editor/hooks/use-original-editor.ts \
      src/components/script-editor/workflow-editor.tsx
git commit -m "refactor(component): migrate script-editor hooks to createReducerHook"
```

---

### Task 18: Migrate remaining page-level hooks to factory

**Files:**
- Modify: `src/pages/workspace/use-clip-rippling.ts`
- Modify: `src/pages/workspace/ai-visualizer.tsx`
- Modify: `src/pages/workspace/video-upload.tsx`
- Modify: `src/pages/workspace/Highlights/highlights.tsx`
- Modify: `src/pages/workspace/VideoExport/use-export-handlers.ts`

- [ ] **Step 1: Migrate `use-clip-rippling.ts`**

Replace `useReducer` + manual wrappers with `createReducerHook`.

- [ ] **Step 2: Migrate `ai-visualizer.tsx`**

Replace `useReducer` + manual wrappers with `createReducerHook`.

- [ ] **Step 3: Migrate `video-upload.tsx`**

Replace `useReducer` + manual wrappers with `createReducerHook`.

- [ ] **Step 4: Migrate `highlights.tsx`**

Replace `useReducer` + manual wrappers with `createReducerHook`.

- [ ] **Step 5: Migrate `use-export-handlers.ts`**

Replace `useReducer` + manual wrappers with `createReducerHook`.

- [ ] **Step 6: Run tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 7: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/pages/workspace/use-clip-rippling.ts \
      src/pages/workspace/ai-visualizer.tsx \
      src/pages/workspace/video-upload.tsx \
      src/pages/workspace/Highlights/highlights.tsx \
      src/pages/workspace/VideoExport/use-export-handlers.ts
git commit -m "refactor(hooks): migrate remaining workspace hooks to createReducerHook"
```

---

### Phase 6: Directory Rename & Final Cleanup

### Task 19: Rename `KeyboardShortcutsHelp` directory to `keyboard-shortcuts-help`

**Files:**
- Rename: `src/components/common/KeyboardShortcutsHelp/` → `src/components/common/keyboard-shortcuts-help/`
- Modify: `src/components/layout/layout.tsx` (import path)

- [ ] **Step 1: Rename directory**

```bash
mv src/components/common/KeyboardShortcutsHelp \
   src/components/common/keyboard-shortcuts-help
```

- [ ] **Step 2: Update import in `layout.tsx`**

Change the import from:
```ts
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
```
to:
```ts
import KeyboardShortcutsHelp from '@/components/common/keyboard-shortcuts-help';
```

- [ ] **Step 3: Verify no stale references**

Run: `grep -rn "KeyboardShortcutsHelp" src/`
Expected: 1 match (the import in layout.tsx, now using kebab-case path)

- [ ] **Step 4: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(naming): rename KeyboardShortcutsHelp to keyboard-shortcuts-help"
```

---

### Task 20: Simplify `StoryFabProvider` — remove redundant Context wrapper

**Files:**
- Modify: `src/pages/workspace/context/storyfab-provider.tsx`

**Interfaces:**
- Consumes: `useStoryFabStore`
- Produces: Simplified provider (no Context layer)

- [ ] **Step 1: Simplify `StoryFabProvider`**

Replace the entire file content:

```ts
import React, { ReactNode, useRef, useCallback } from 'react';
import { useStoryFabStore } from '@/stores/storyfab-store';

// Re-export the store for direct usage
export { useStoryFabStore } from '@/stores/storyfab-store';

// Context retained for backward compatibility (deprecated — use useStoryFabStore directly)
export const StoryFabContext = React.createContext<ReturnType<typeof useStoryFabStore> | undefined>(undefined);

interface StoryFabProviderProps {
  children: ReactNode;
}

export const StoryFabProvider: React.FC<StoryFabProviderProps> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Compatibility hook — same API as old useStoryFab
 * Wraps the Zustand store with blob-URL cleanup.
 */
export const useStoryFab = () => {
  const store = useStoryFabStore();
  const state = store.state;

  const videoBlobUrlRef = useRef<string | null>(null);

  const revokeVideoBlobUrl = useCallback(() => {
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }
  }, []);

  return {
    state,
    dispatch: store.dispatch,
    setMode: store.setMode,
    setStep: store.setStep,
    setFeature: store.setFeature,
    setProject: store.setProject,
    setVideo: store.setVideo,
    setPlaying: store.setPlaying,
    setCurrentTime: store.setCurrentTime,
    setAnalysis: store.setAnalysis,
    setOcrSubtitle: store.setOcrSubtitle,
    setAsrSubtitle: store.setAsrSubtitle,
    setNarrationScript: store.setNarrationScript,
    setRemixScript: store.setRemixScript,
    setVoice: store.setVoice,
    setSynthesis: store.setSynthesis,
    setExportSettings: store.setExportSettings,
    setDuration: store.setDuration,
    updateVideo: store.updateVideo,
    revokeVideoBlobUrl,
    goToNextStep: store.goToNextStep,
    goToPrevStep: store.goToPrevStep,
    reset: store.reset,
    resetStep: store.resetStep,
    canProceed: store.canProceed,
    completedSteps: store.completedSteps,
    totalSteps: store.totalSteps,
  };
};

export type StoryFabContextType = ReturnType<typeof useStoryFab>;
```

Key change: `StoryFabProvider` no longer wraps children in `StoryFabContext.Provider`. It just returns `{children}` directly. The Context object is retained for any direct `useContext(StoryFabContext)` calls (none currently found, but safe to keep).

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/workspace/context/storyfab-provider.tsx
git commit -m "refactor(context): simplify StoryFabProvider, remove Context wrapper"
```

---

### Task 21: Final cleanup — remove unused `AppError` import in `shared/utils/index.ts`

**Files:**
- Modify: `src/shared/utils/index.ts`

- [ ] **Step 1: Fix redundant `AppError` import**

In `src/shared/utils/index.ts`, the `retry` function uses `AppError` from `@/shared/errors`. Verify this import is used and correct. The current file already imports it inline:

```ts
import { AppError } from '@/shared/errors';
```

This is correct and used by `retry`. No change needed — verify it compiles.

- [ ] **Step 2: Final full verification**

Run: `npm run test:run && npx tsc --noEmit`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/index.ts
git commit -m "refactor: final cleanup verification"
```

---

## Execution Summary

| Phase | Tasks | Estimated Impact |
|-------|-------|-----------------|
| 1. Dead Code | 3 | -~50 lines dead code |
| 2. Type Names | 2 | 5 type names standardized |
| 3. File Merge | 1 | -1 file (workflow.reducer.ts → workflow.ts) |
| 4. Type Dedup | 1 | -2 duplicate interfaces |
| 5. Hook Factory | 11 | -~350 lines reducer boilerplate |
| 6. Rename + Cleanup | 2 | 1 directory renamed, Context simplified |
| **Total** | **20** | **~400 LOC removed, 0 behavior changes** |

## Verification Checklist (run after all tasks)

- [ ] `npm run test:run` — all tests pass
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm run lint` — zero warnings
- [ ] `npm run build` — production build succeeds
- [ ] `grep -rn "storyfabState\|storyfabStep\|storyfabAction\|rawInvoke\|notify\.loading\|notify\.destroy\|storyfab-context" src/` — zero matches
- [ ] `grep -rn "ProjectDetailProject\|ScriptDetailProject" src/` — zero matches
- [ ] App launches and workspace loads correctly in Tauri dev mode
