# P0 + P1 Refactor Design — Stabilize & Structural DRY

- **Date:** 2026-07-01
- **Branch:** `feature/refactoring-phase-1`
- **Scope this pass:** P0 (fix-green baseline) + P1 (structural de-duplication / dead-code removal)
- **Out of scope (future specs):** P2 global naming convention rename, P3 architecture layering / minimalism

## Context & Baseline (measured)

Tauri + React + TypeScript app, ~44K lines (`src/core` 15.6K, `src/components` 22K, `src/pages` 3.5K).

The tree is **currently broken**: `tsc --noEmit` reports **64 type errors**, all downstream of the uncommitted Phase 3 work (Tauri `invoke` generic typing) in the working tree. We must not layer new refactoring on a red build — every change would be indistinguishable from pre-existing breakage.

Confirmed structural problems:
- `src/pipeline/` — **empty** (0 files). Dead.
- `src/services/` — 8-file legacy shim, only self-reference in its own doc comment. Dead.
- Three type homes: `src/types` (119 imports, live), `src/core/types` (1 file `timeline.ts`), `src/shared/types` (via `src/shared`, 31 imports).
- `src/core/pipeline/` — **live** (3 importers). Keep.
- No dead-code tooling installed.

## Decisions

1. **Fix-green first**, then refactor. (User-approved.)
2. **Scope = P0 + P1 only.** (User-approved.)
3. **Single type root = `src/types`.** Merge `core/types` + `shared/types` into it. (User-approved — minimal churn vs. 119 existing `@/types` imports.)

## P0 — Stabilize (target: 64 → 0 TS errors, tests green)

Root cause: Phase 3 tightened `command-types.ts` into a typed command registry, but:
- `TauriCommandName` union is **missing entries** present in the `TauriCommand` constant: `list_whisper_models`, `check_faster_whisper`, `download_whisper_model`, `get_whisper_supported_languages`, `extract_key_frames`, `generate_thumbnail` (and any others found).
- Several `methods/*.ts` retain **stale return-type `as` casts** that no longer match the registry's declared output types (tts, video-analysis, subtitle-asr, tauri-video-processor).
- `src/core/video/index.ts` re-exports a non-existent `videoProcessor`.
- `src/pages/ProjectEdit/hooks/use-video-analysis.ts` has null-safety gaps (`VideoMetadata | null`).

### Tasks
1. Make `TauriCommandName` correspond **1:1** with the `TauriCommand` constant values (single source of truth). Add every missing command entry + its input/output types in `command-types.ts`.
2. Fix stale return-type assertions in `methods/*.ts` so declared output matches actual returns.
3. Fix `core/video/index.ts` export and `use-video-analysis.ts` null handling.
4. Install `knip` as devDependency; add `"deadcode": "knip"` script for objective dead-code detection.
5. **Gate:** `tsc --noEmit` = 0 errors, `test:run` green, `lint` within budget, `verify:all` passes. Commit clean baseline.

## P1 — Structural DRY / Dead-code

### Tasks
1. **Delete dead dirs:** `src/services/` and `src/pipeline/`. Confirm zero external references with `knip` + grep, then `git rm`. Remove the `@/services/*` path alias from `tsconfig.json`.
2. **Unify type home into `src/types`:**
   - Move `src/core/types/timeline.ts` content into `src/types/timeline.ts` (already exists — merge/reconcile).
   - Move `src/shared/types/*` into `src/types`, re-point the 31 `shared` imports.
   - Delete emptied `core/types` and `shared/types`; keep `src/shared/{utils,constants}` (still live) unless knip flags them.
   - Remove now-unused path aliases.
3. Run `knip` to sweep remaining zero-reference exports/files; remove what it confirms dead.
4. **Gate after each step:** `tsc` + `test:run` stay green. Small, reviewable commits.

## Execution — Agent Team

- **P0:** parallelizable. Dispatch subagents by cohesive cluster — (a) tauri command registry + methods, (b) core/services return-type fixes, (c) video/index + hooks null-safety — then reconcile and run the gate.
- **P1:** structural moves touch many cross-file imports; run **serially** (one change → gate → commit) to keep blast radius controlled.

## Verification Gates (every step)

```
npx tsc --noEmit        # must be 0 errors
npx vitest run          # must pass
npm run lint            # within --max-warnings budget
npm run verify:all      # antd + naming checks
npm run deadcode        # knip (informational in P0, enforced in P1)
```

## Risks

- Missing registry entries may reveal commands that don't exist on the Rust side — verify each against `src-tauri` command handlers, don't invent names.
- Merging type homes can create duplicate-symbol collisions — reconcile by content, not blind concatenation.
- `knip` may false-positive on Tauri/dynamic entrypoints — treat its output as a candidate list, verify before deleting.
