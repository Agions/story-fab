# Stage 2 — DRY Consolidation: Implementation Spec

> **Scope**: Read-only investigation + file-level change spec for Stage 2 (DRY consolidation) of the StoryFab refactor.
> **Stack**: Tauri 2 + React 18 + TypeScript + Tailwind v4; state = zustand (store slices) + many local `useReducer` state machines; Tauri calls centralized in `src/core/tauri/` (`tauri` object + `invoke.ts` constants + `methods/*.ts` facades).
> **Baseline**: Stage 1 complete (dead-code deletion, net −392 LoC, vitest 41 files / 738 cases green, tsc 0 errors). This spec assumes that baseline holds.
> **Rule**: Do NOT modify source during this stage's *investigation*; the diffs below are instructions for the Engineer, not applied edits.

---

## 0. Method & confidence

I grepped/Read the actual current tree (not the diagnosis narrative) for:
- `*.reducer.ts` (all 17) + `createReducer` / `createSlice` / `reducerFactory` / `defineReducer` / `genericUpdateReducer` usages.
- Every `invoke(` call outside `src/core/tauri/` (covering both `invoke(` and `invoke<...>(` forms — the first sweep missed generic-form calls, corrected here).
- Raw command-name string literals and `TauriCommand` import sources (A1).
- Formatter re-exports / alias pass-throughs (R1).
- Test files that assert raw command strings or hand-rolled action shapes (coupling risks).

All file:line references below are verified against the current working tree.

---

## 1. Workstream R1 — Formatter single-entry (delete pass-through layer)

### 1.1 Stage-1 model already fixed ✅
The diagnosis's model was `analysis-report-service.formatDuration` (a method that just forwarded to `formatDurationChinese`).
- `src/core/services/ai/vision/analysis-report-service.ts:13` imports `formatDurationChinese` **directly**; `:110` calls it directly. There is **no remaining wrapper**. The test `analysis-report-service.test.ts` already locks the inlined behavior. **No R1 work needed here.**

### 1.2 Pass-through / re-export layers found

| # | File:line | Exports | Nature | Canonical source |
|---|-----------|---------|--------|-----------------|
| P1 | `src/core/video/formatters.ts:11` | `export { formatDuration, formatFileSize } from '../../shared/utils/formatting';` | 2-hop re-export pass-through | `src/shared/utils/formatting.ts` |
| P2 | `src/shared/utils/project-utils.ts:43` | `export { formatFileSize as formatProjectSize, formatDuration as formatProjectDuration } from './formatting';` | rename alias pass-through | `src/shared/utils/formatting.ts` |

Everything else in those two files is genuine (video-specific `formatResolution`/`formatBitrate` in `formatters.ts`; `filterProjects`/`sortProjects`/`updateProject`/`getStatusColor` in `project-utils.ts`).

### 1.3 Call sites that must be repointed (the 2-hop path)

`formatDuration` is currently reachable via **three** entry points. To achieve a single entry (`@/shared/utils/formatting`, the canonical), delete the `@/core/video` indirection and repoint its importers:

| File:line | Current import | Action |
|------------|---------------|--------|
| `src/components/video-selector/video-selector.tsx:11` | `import { videoProcessor, VideoMetadata, formatDuration, formatResolution } from '@/core/video';` | **Split**: move `formatDuration` → `@/shared/utils/formatting`; keep `formatResolution` on `@/core/video`. |
| `src/components/commentary-panel/commentary-script-editor.tsx:20` | `import { formatDuration } from '@/core/video';` | Repoint `formatDuration` → `@/shared/utils/formatting`. |
| `src/components/commentary-panel/commentary-timeline.tsx:13` | `import { formatDuration } from '@/core/video';` | Repoint. |
| `src/components/script-editor/segment-table.tsx:6` | `import { formatDuration } from '@/core/video';` | Repoint. |
| `src/components/script-editor/original-editor.tsx:13` | `import { formatDuration } from '@/core/video';` | Repoint. |
| `src/components/script-editor/workflow-editor.tsx:16` | `import { formatDuration } from '@/core/video';` | Repoint. |

Notes:
- `formatFileSize` is **never** imported from `@/core/video` (grep empty) → removing P1's `formatFileSize` re-export is zero-impact.
- `formatProjectSize` / `formatProjectDuration` (P2) have **zero usages** (grep empty) → they are dead pass-throughs; safe to delete.
- The other two entry points are already canonical and need **no change**: `@/shared/utils/formatting` (direct) and `@/shared` barrel (`video-info/index.tsx:4`, `video-upload.tsx:15` import `formatDuration` from `@/shared` — leave as-is).

### 1.4 R1 deliverable (diffs for Engineer)
- **Edit** `src/core/video/formatters.ts`: delete line 11 (the `formatDuration, formatFileSize` re-export). Keep `formatResolution`, `formatBitrate`.
- **Edit** `src/shared/utils/project-utils.ts`: delete line 43 (the `formatProjectSize`/`formatProjectDuration` alias re-export) — or keep if you want named domain access, but that defeats single-entry; recommend delete.
- **Edit** the 6 files in §1.3 to import `formatDuration` from `@/shared/utils/formatting`.

---

## 2. Workstream R2 / D5 — Reducer factory unification

### 2.1 Full enumerated list of all 17 reducer files

| # | File | Current pattern | Status |
|---|------|----------------|--------|
| 1 | `src/components/video-player/video-player.reducer.ts` | `createReducer` (handler map, payload-wrapper) | ✅ factory (canonical model) |
| 2 | `src/components/video-editor/hooks/use-video-editor-page.reducer.ts` | `genericUpdateReducer<…>` | ✅ factory (bag-of-setters) |
| 3 | `src/hooks/use-video-processing.reducer.ts` | `genericUpdateReducer<…>` | ✅ factory |
| 4 | `src/hooks/use-script-editor.reducer.ts` (OriginalEditor) | `genericUpdateReducer<…>` | ✅ factory |
| 5 | `src/pages/workspace/export/video-export/use-export-handlers.reducer.ts` | `genericUpdateReducer<…>` | ✅ factory |
| 6 | `src/pages/project-edit/hooks/use-project-edit-state.reducer.ts` | hand-rolled `set`/`update` + bespoke `makeSetter`/`createProjectEditSetters` | ⚠️ hand-rolled variant of generic-update |
| 7 | `src/components/video-selector/video-selector.reducer.ts` | hand-rolled `switch` (flat-field) | ❌ hand-rolled |
| 8 | `src/components/commentary-panel/commentary-script-editor.reducer.ts` (2 reducers) | hand-rolled `switch` (flat-field) | ❌ hand-rolled |
| 9 | `src/components/commentary-panel/commentary-panel.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 10 | `src/components/script-editor/workflow-editor.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 11 | `src/hooks/use-script-detail.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 12 | `src/hooks/use-project-detail.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 13 | `src/pages/workspace/assemble/highlights/highlights.reducer.ts` | hand-rolled `switch` (composite actions) | ❌ hand-rolled |
| 14 | `src/pages/workspace/assemble/ai-visualizer.reducer.ts` | hand-rolled `switch` (118 LoC, logic) | ❌ hand-rolled |
| 15 | `src/pages/workspace/assemble/clip-rippling.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 16 | `src/pages/workspace/edit-step/video-upload.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |
| 17 | `src/hooks/use-subtitle-extraction.reducer.ts` | hand-rolled `switch` | ❌ hand-rolled |

**Tally**: 1 on `createReducer`, 4 on `genericUpdateReducer`, 1 hand-rolled generic-update variant, **11 hand-rolled `switch`**.

### 2.2 The "half-finished" D5 state = two competing factory helpers

- **Factory A — `createReducer`** in `src/shared/hooks/create-reducer.ts`:
  - Signature (existing, do **not** invent a new API):
    ```ts
    createReducer<S, HM extends HandlerMap<S>>(
      _module: string,
      handlers: HM,
      initialState: S,
    ): [reducer, initialState, actionTypes]
    ```
  - Handlers shape: `{ ACTION_TYPE: (state: S, payload: any) => S }`. **It passes `action.payload` to the handler** (verify: `create-reducer.ts:62-69`). Default branch returns `state` unchanged.
  - 1 user (`video-player`).
- **Factory B — `genericUpdateReducer` + `createAutoSetters`** in `src/shared/hooks/useAutoSetters.ts`:
  - Single action `{ type: 'update'; key: K; updater: Updater<unknown> }`; `createAutoSetters(dispatch, initialState)` yields one `setter(key)` per state field supporting both direct value and `(prev)=>next` updater.
  - 4 users (rows 2–5 above).

The diagnosis's "half-finished reducer abstraction" = this fragmentation plus the bespoke `use-project-edit-state` hand-roll.

### 2.3 Canonical factory recommendation

**Keep TWO canonical factories deliberately and eliminate the hand-rolled category (0 remaining):**

- **`createReducer`** = canonical for **named-action state machines** (semantic actions, possibly with transform logic). Target: the 11 hand-rolled `switch` reducers → `createReducer`.
- **`genericUpdateReducer` + `createAutoSetters`** = canonical for **bag-of-independent-setters** page/form state (the §A2 "N `useState` → 1 reducer" pattern). Keep the 4 current users; the 1 outlier (`use-project-edit-state`) converges onto it.

**Why not literally ONE factory (explicit trade-off):** forcing the 4 `genericUpdateReducer` reducers into per-field handler maps would *increase* code (≈14 trivial `s => ({...s, k: v})` handlers each) and force rewriting their `createAutoSetters`-based consumers — negative DRY value. Two well-scoped factories is the correct consolidation; the real defect was the **hand-rolled** boilerplate, which drops to zero.
*If the team lead insists on a single factory*, the cost is: convert the 4 `genericUpdateReducer` users + `use-project-edit-state` into `createReducer` handler maps and rewrite their `createAutoSetters` consumers (larger diff, same runtime behavior). Default recommendation = two factories.*

### 2.4 Migration mechanics (CRITICAL — read before editing)

`createReducer` dispatches handlers with **`action.payload`**. Every hand-rolled reducer in §2.1 uses **flat-field** actions (`{ type: 'SET_X'; x: T }`), and so do their **consumer dispatch sites** and **`*.reducer.test.ts` files**. Therefore each migration is **three coordinated edits**:

1. **Reducer file**: replace the `switch` with a handler map; export via tuple destructuring:
   ```ts
   const handlers = {
     SET_X: (s: S, v: T) => ({ ...s, x: v }),
     RESET: () => initialXState,   // return the SAME reference for reference-equality tests
   };
   export const [xReducer] =
     createReducer<S, typeof handlers>('MOD', handlers, initialXState);
   ```
2. **Action type**: change the exported `XxxAction` union from flat-field to payload-wrapper (`{ type: 'SET_X'; payload: T } | { type: 'RESET' }`).
3. **Every dispatch site** in the consumer (`.tsx`/`.ts`) and **every literal** in the `*.reducer.test.ts`: convert `dispatch({ type: 'SET_X', x: v })` → `dispatch({ type: 'SET_X', payload: v })`.

`createReducerHook(xReducer, initialXState)` wiring in the consumer is **unchanged** (the tuple's first element is the reducer; `initialXState` stays a separate const).

### 2.5 Ordered migration steps (by risk / shared deps)

- **Phase A — pure setters, low risk (no transform logic):** `video-selector` (7), `commentary-panel` (9), `workflow-editor` (10), `use-script-detail` (11), `use-project-detail` (12). Validates the approach end-to-end.
- **Phase B — composite / logic actions (preserve handler bodies):** `highlights` (13), `commentary-script-editor` (8, two reducers), `ai-visualizer` (14), `clip-rippling` (15), `video-upload` (16), `use-subtitle-extraction` (17). Handler bodies contain real logic (array ops, multi-field transitions) — move each `case` body verbatim into its handler.
- **Phase C — generic-update outlier:** `use-project-edit-state` (6) → replace bespoke `projectEditReducer` + `makeSetter` + `createProjectEditSetters` with `genericUpdateReducer<ProjectEditState>` + `createAutoSetters`. Delete the `set` action branch (only `update` is supported by `genericUpdateReducer`).

### 2.6 Before / after (representative: `video-selector.reducer.ts`)

**Before** (flat-field `switch`, lines 37-57):
```ts
export function videoSelectorReducer(state, action): VideoSelectorState {
  switch (action.type) {
    case 'SET_VIDEO_PATH':   return { ...state, videoPath: action.videoPath };
    case 'SET_VIDEO_SRC':    return { ...state, videoSrc: action.videoSrc };
    case 'SET_METADATA':    return { ...state, metadata: action.metadata };
    case 'SET_IS_ANALYZING':return { ...state, isAnalyzing: action.isAnalyzing };
    case 'SET_IS_DRAGGING': return { ...state, isDragging: action.isDragging };
    case 'RESET':            return initialVideoSelectorState;
    default:                 return state;
  }
}
```
**After** (`createReducer`, payload-wrapper):
```ts
import { createReducer } from '@/shared/hooks/create-reducer';

const handlers = {
  SET_VIDEO_PATH:    (s: VideoSelectorState, v: string | null) => ({ ...s, videoPath: v }),
  SET_VIDEO_SRC:     (s: VideoSelectorState, v: string | null) => ({ ...s, videoSrc: v }),
  SET_METADATA:     (s: VideoSelectorState, v: VideoMetadata | null) => ({ ...s, metadata: v }),
  SET_IS_ANALYZING: (s: VideoSelectorState, v: boolean) => ({ ...s, isAnalyzing: v }),
  SET_IS_DRAGGING:  (s: VideoSelectorState, v: boolean) => ({ ...s, isDragging: v }),
  RESET:            () => initialVideoSelectorState,
};
export const [videoSelectorReducer] =
  createReducer<VideoSelectorState, typeof handlers>('VIDEO_SELECTOR', handlers, initialVideoSelectorState);
```
Consumer (`video-selector.tsx:76` etc.) becomes `dispatch({ type: 'SET_VIDEO_PATH', payload: filePath })`; test literals (e.g. `video-selector.reducer.test.ts:42-45`) become `{ type: 'SET_VIDEO_PATH', payload: '/videos/new.mp4' }`.

### 2.7 Explicit "do NOT unify" exceptions

- **Keep on `genericUpdateReducer` (do NOT convert to `createReducer`)**: `use-video-editor-page` (2), `use-video-processing` (3), `use-script-editor`/OriginalEditor (4), `use-export-handlers` (5). Converting them destroys the `createAutoSetters` ergonomic API their consumers rely on.
- **`use-project-edit-state` (6): do NOT put on `createReducer`** — it is a generic key/value bag; converge to `genericUpdateReducer` + `createAutoSetters` (Phase C).
- **`video-player` (1): already canonical — no change.**
- **No reducer is "too different" to fit `createReducer` technically** (handlers can hold arbitrary logic). Exceptions to *caution*, not to *migration*: `ai-visualizer` (14), `clip-rippling` (15), `use-subtitle-extraction` (17) have non-trivial handler logic — migrate mechanically, preserve logic, and keep/extend their `*.reducer.test.ts`.

---

## 3. Workstream R3 / A1 — Collapse raw `invoke` into the `tauri` object

### 3.1 Complete external raw-`invoke` list (10 sites, 4 files)

All are outside `src/core/tauri/` (the legitimate centralization point). "Form" notes whether the call already uses the `TauriCommand` constant (centralized invoke, but bypasses the `tauri` facade) or a raw string / dynamic low-level import.

| # | File:line | Command | Current form | Target `tauri` facade | Notes |
|---|-----------|---------|--------------|----------------------|-------|
| 1 | `src/core/video/tauri-video-processor.ts:26` | `check_ffmpeg` | `invoke(TauriCommand.CHECK_FFMPEG, undefined)` | `tauri.checkFFmpeg()` | returns `{installed, version?}` — mapping preserved. |
| 2 | `…tauri-video-processor.ts:38` | `analyze_video` | `invoke(TauriCommand.ANALYZE_VIDEO, {path})` | `tauri.analyzeVideo(path)` | **Verify** `VideoMetadata` (core/video) field parity with `VideoMetadataResult` (`src/types/media.ts:48-55`: duration/width/height/fps/codec/bitrate). Mapping `return {duration:info.duration,…}` stays valid if names match. |
| 3 | `…tauri-video-processor.ts:91` | `cut_video` | `invoke(TauriCommand.CUT_VIDEO, {inputPath, outputPath, segments})` | `tauri.cutVideo(inputPath, outputPath, segments)` | `doCut` sets up `listen('processing-progress')` **before** the invoke — keep that listener; only swap the invoke. |
| 4 | `…tauri-video-processor.ts:102` | `generate_preview` | `invoke(TauriCommand.GENERATE_PREVIEW, {inputPath, segment})` | `tauri.generatePreview(inputPath, segment)` | segment shape `{start,end}` matches. |
| 5 | `…tauri-video-processor.ts:116` | `export_video` | `invoke(TauriCommand.EXPORT_VIDEO, {…})` | `tauri.exportVideo(input)` | returns `{outputPath,duration,fileSize}`; processor uses `.outputPath`. |
| 6 | `…tauri-video-processor.ts:126` | `cancel_export` | `invoke(TauriCommand.CANCEL_EXPORT, {exportId})` | `tauri.cancelExport(exportId)` | |
| 7 | `src/core/services/subtitle/subtitle-service.ts:355` | `translate_text` | `invoke(TauriCommand.TRANSLATE_TEXT, {text, fromLang:'en', toLang})` | `tauri.translateText(text, 'en', langCode)` | **No facade exists yet** — add `translateText` (see §3.3). **Keep** the surrounding `try/catch` + `AppError` wrapping in the service; the facade only returns a string / throws `TauriBridgeError`. |
| 8 | `src/core/services/subtitle/subtitle-service.ts:423` | `export_video` | `const { invoke } = await import('@tauri-apps/api/core'); invoke<…>('export_video', {…})` | `tauri.exportVideo({…})` | **Raw string literal + dynamic low-level import** (worst violation). Keep the `executeRequest` wrapper; loses lazy `import()` (acceptable). |
| 9 | `src/core/services/subtitle/whisper-service.ts:70` | `transcribe_audio` | `const { invoke } = await import('@tauri-apps/api/core'); invoke<…>('transcribe_audio', {audioPath, modelSize, language})` | `tauri.transcribeAudio({ audioPath, modelSize, language })` | **Raw string + dynamic import.** See gotcha G4 (test coupling). Call with the **object** arg shape, NOT positional. |
| 10 | `src/core/services/export/export-service.ts:84` | `export_video` | `invoke(TauriCommand.EXPORT_VIDEO, {…})` | `tauri.exportVideo(input)` | **Keep** the `this.executeRequest(...)` wrapper (10-min timeout + retry + logging); only replace the inner `invoke`. |
| 11 | `src/core/services/export/export-service.ts:123` | `cancel_export` | `invoke(TauriCommand.CANCEL_EXPORT, {exportId})` | `tauri.cancelExport(this.currentExportId!)` | **Keep** the surrounding `try/catch` that swallows+warns; the facade throws on error. |

After repointing, the now-unused `invoke` / `TauriCommand` imports in these service files must be removed (unused-import lint/tsc).

### 3.2 A1 — duplicated command-name string / constant list

- **Only TWO raw command-name string literals exist outside `invoke.ts`**: `subtitle-service.ts:423` `'export_video'` and `whisper-service.ts:70` `'transcribe_audio'`. Both are eliminated by routing through the `tauri` facade (which internally references `TauriCommand`).
- The `TauriCommand` constant object is defined **only** in `src/core/tauri/invoke.ts`; every other file imports it (no duplicated constant object anywhere). So A1 is **effectively already satisfied** at the constant level — the actionable A1 item is simply "always go through `tauri.X()`", which is exactly the R3 repointing above.
- **Consolidation target**: command names live once in `src/core/tauri/invoke.ts` (`TauriCommand` + `TauriCommandName` in `command-types.ts`); all callers route via the `tauri` object's typed methods.

### 3.3 Facade additions needed (the only new code in Stage 2)

Add ONE missing facade method:
- **`src/core/tauri/methods/subtitle-asr.ts`**: add
  ```ts
  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    return invoke(TauriCommand.TRANSLATE_TEXT, { text, fromLang, toLang }) as Promise<string>;
  }
  ```
- **`src/core/tauri/index.ts`**: add `translateText: subtitleAsr.translateText,` to the `tauri` object (it is already re-exported). No change to `command-types.ts` (`TRANSLATE_TEXT` constant already present).

---

## 4. Risks / gotchas (naive DRY change → runtime break)

- **G1 — `createReducer` is payload-wrapper, hand-rolled reducers are flat-field.** Every consumer dispatch site AND every `*.reducer.test.ts` literal must switch to `{type, payload}`. A missed site compiles fine (action type may widen) but sends `payload: undefined` at runtime. **Mechanical, high-volume, easy to miss.**
- **G2 — `video-selector.reducer.test.ts:184,196,198` asserts `RESET` returns `initialVideoSelectorState` by reference** (`toBe`). Implement `RESET` as `() => initialVideoSelectorState`, not a spread, or that test breaks.
- **G3 — `use-project-edit-state.reducer.test.ts:36,42,109` asserts the `{type:'set', key, value}` action** (and the bespoke `makeSetter`). On Phase-C migration to `genericUpdateReducer`+`createAutoSetters`, `set` no longer exists → these tests must be rewritten to `{type:'update', key, updater}` (or to `createAutoSetters`).
- **G4 — `whisper-service.test.ts:38,56` mocks `@tauri-apps/api/core` `invoke` and asserts `('transcribe_audio', {audioPath, modelSize, language})`.** The `tauri.transcribeAudio` facade internally re-invokes that same low-level `invoke`, and its arg object is `{audioPath, modelSize, language}` — so the test **stays green** *only if* you call `tauri.transcribeAudio({ audioPath, modelSize, language })` (object form). Calling it positionally (`tauri.transcribeAudio(audioPath, modelSize, language)`) would feed the string into `options` and break both runtime and the test. **Do not alter the test or the arg shape.**
- **G5 — `subtitle-service.ts:423` and `whisper-service.ts:70` use dynamic `import('@tauri-apps/api/core')`.** Repointing to `tauri.*` makes them static imports (the `tauri` facade statically imports `invoke`). Behavior unchanged; only the lazy-load boundary moves. Acceptable, but note it if bundle/startup profiling is sensitive.
- **G6 — `export-service.ts` preserves two wrappers.** `exportVideo` keeps `this.executeRequest(...)` (timeout/retry/logging); `cancelExport` keeps its `try/catch` that swallows+warns. Dropping either changes error semantics (Rust invocation would surface as a thrown `TauriBridgeError` instead of a logged warning).
- **G7 — `tauri-video-processor.ts:38` return-type parity.** `tauri.analyzeVideo` returns `VideoMetadataResult` (raw Rust shape); the processor currently maps to `VideoMetadata`. The 6 field names coincide, so the mapping is preserved — but confirm `VideoMetadata` (core/video) carries exactly those 6 fields before deleting the mapping.
- **G8 — unused imports.** After repointing R3 sites, `invoke` / `TauriCommand` imports in `tauri-video-processor.ts`, `subtitle-service.ts`, `export-service.ts` become unused → remove or tsc/unused-lint fails.

---

## 5. Unified task list for the Engineer

Ordered, with file paths, dependency order, priority, and a per-task **Definition of Done (DoD)**. Granularity: one task per logical unit so the change cannot be ambiguously interpreted.

| ID | Task | Files (create/modify) | Depends on | Pri | Definition of Done |
|----|------|------------------------|-----------|-----|-------------------|
| **T-R1** | Formatter single-entry | `src/core/video/formatters.ts` (del L11), `src/shared/utils/project-utils.ts` (del L43), and repoint imports in: `video-selector.tsx:11`, `commentary-script-editor.tsx:20`, `commentary-timeline.tsx:13`, `segment-table.tsx:6`, `original-editor.tsx:13`, `workflow-editor.tsx:16` | — | P1 | `tsc --noEmit` clean; `shared/utils/formatting.test.ts`, `core/video/formatters.test.ts`, `analysis-report-service.test.ts` pass; `grep -rn "from '@/core/video'" src` shows **no** `formatDuration`/`formatFileSize` import remaining. |
| **T-R3a** | Add `translateText` facade | `src/core/tauri/methods/subtitle-asr.ts` (add method), `src/core/tauri/index.ts` (wire `translateText`) | — | P1 | `tsc` clean; `tauri.translateText` is callable and typed; `command-types.ts` already has `TRANSLATE_TEXT`. |
| **T-R3b** | Repoint `tauri-video-processor.ts` (6 sites) | `src/core/video/tauri-video-processor.ts` (L26,38,91,102,116,126) | T-R3a (no) | P1 | All 6 switched to `tauri.*`; `doCut` listener kept; `analyzeVideo` field mapping verified (G7); unused `invoke`/`TauriCommand` import removed; `tauri-video-processor` covered by existing video tests / `tsc`. |
| **T-R3c** | Repoint subtitle + whisper services | `src/core/services/subtitle/subtitle-service.ts` (L355→`tauri.translateText`, L423→`tauri.exportVideo`), `src/core/services/subtitle/whisper-service.ts` (L70→`tauri.transcribeAudio` object-form) | T-R3a | P1 | Both repointed; `subtitle-service` `AppError`+`executeRequest` wrappers kept; `whisper-service.test.ts` **still green** (G4); unused imports removed. |
| **T-R3d** | Repoint `export-service.ts` (2 sites) | `src/core/services/export/export-service.ts` (L84→`tauri.exportVideo` inside `executeRequest`; L123→`tauri.cancelExport` inside `try/catch`) | — | P1 | Both repointed; timeout/retry wrapper + cancel swallow preserved (G6); unused imports removed; `export-service` tests pass. |
| **T-R2a** | Migrate 5 pure-setter reducers → `createReducer` | Reducers + tests + consumers: `video-selector.reducer.ts` + `video-selector.reducer.test.ts` + `video-selector.tsx`; `commentary-panel.reducer.ts` + `.test.ts` + `commentary-panel.tsx`; `workflow-editor.reducer.ts` + `.test.ts` + `workflow-editor.tsx`; `use-script-detail.reducer.ts` + `.test.ts` + `use-script-detail.ts`; `use-project-detail.reducer.ts` + `.test.ts` + `use-project-detail.ts` | — | P0 | Each reducer uses `createReducer`; `XxxAction` is payload-wrapper; **all** dispatch literals in consumers + test literals converted to `{type, payload}` (G1); `tsc` clean; the 5 `*.reducer.test.ts` pass. |
| **T-R2b** | Migrate 6 logic reducers → `createReducer` | `highlights.reducer.ts`+`.test.ts`+`highlights/highlights.tsx`; `commentary-script-editor.reducer.ts` (both reducers)+`.test.ts`+`commentary-script-editor.tsx`; `ai-visualizer.reducer.ts`+`.test.ts`+`ai-visualizer.tsx`; `clip-rippling.reducer.ts`+`.test.ts`+`use-clip-rippling.ts`; `video-upload.reducer.ts`+`.test.ts`+`video-upload.tsx`; `use-subtitle-extraction.reducer.ts`+`.test.ts`+`use-subtitle-extraction.ts` | — | P0 | Handler maps preserve original logic verbatim; `RESET`-style actions keep reference equality where tests assert it (G2); all dispatch + test literals payload-wrapper (G1); `tsc` clean; the 6 `*.reducer.test.ts` pass. |
| **T-R2c** | Converge `use-project-edit-state` → `genericUpdateReducer` | `src/pages/project-edit/hooks/use-project-edit-state.reducer.ts` (del `projectEditReducer`/`makeSetter`/`createProjectEditSetters`; use `genericUpdateReducer<ProjectEditState>` + `createAutoSetters`), `use-project-edit-state.reducer.test.ts` (rewrite to `{type:'update', key, updater}`), `use-project-edit-state.ts` (consumer) | — | P1 | No hand-rolled reducer remains; `ProjectEditSetters` surface replaced by `createAutoSetters` return (named by state key); test rewritten (G3); `tsc` clean; `use-project-edit-state.reducer.test.ts` passes. |
| **T-FINAL** | Full Stage-2 regression | none (verification only) | T-R1, T-R3a..d, T-R2a..c | P0 | `npx tsc --noEmit` → 0 errors; `npx vitest run` → 41 files / 738 cases green (match Stage-1 baseline); `whisper-service.test.ts` + all `*.reducer.test.ts` green; manual smoke of one video-selector + one ProjectEdit flow to confirm dispatch behavior. |

**Dependency graph**: T-R1, T-R3a, T-R3b, T-R3d, T-R2a, T-R2b, T-R2c are mutually independent. T-R3c depends on T-R3a (needs `tauri.translateText`). T-FINAL depends on all. Recommended execution order: T-R3a → T-R3c, T-R3b, T-R3d, T-R1, T-R2a, T-R2b, T-R2c (any order among the non-R3a ones) → T-FINAL.

---

## 6. Dependency package list

**No new packages.** All changes reuse the existing `tauri` object (`src/core/tauri/index.ts`) and the two existing factories (`createReducer` in `src/shared/hooks/create-reducer.ts`, `genericUpdateReducer`/`createAutoSetters` in `src/shared/hooks/useAutoSetters.ts`). The only new *code* is one facade method (`translateText`) composed entirely from the already-imported `invoke` + `TauriCommand`.

---

## 7. Anything unclear / assumptions

- **Assumption**: the Stage-1 baseline (tsc 0 errors, 738 green cases) is intact; this spec was written against the current tree, which reflects that baseline.
- **Assumption**: `VideoMetadata` (core/video) and `VideoMetadataResult` (`src/types/media.ts:48`) share the 6 fields duration/width/height/fps/codec/bitrate (G7). If `VideoMetadata` carries extra/missing fields, the `doAnalyze` mapping in `tauri-video-processor.ts` needs a one-line adjustment.
- **Open decision for team lead**: literal "one canonical factory" vs the recommended "two deliberately-scoped factories" (§2.3). I recommend two; say the word and T-R2a/T-R2b/T-R2c expand to also absorb the 4 `genericUpdateReducer` users.
- **Not in scope (flagged, not fixed)**: `src/core/video/formatters.ts` keeps `formatResolution`/`formatBitrate` (video-specific, not pass-throughs). `formatDuration`/`formatFileSize` remain exported from `@/shared` and `@/shared/utils/formatting` (canonical). The `useAutoSetters` factory is left as-is (it is already DRY).
