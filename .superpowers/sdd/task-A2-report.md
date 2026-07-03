# Task A2 Report: Move workflow modes to core/pipeline/types/

**Status:** Completed

**Commit:** `bc3b205` — `refactor(A2): move workflow modes to core/pipeline/types/`

## What was done

- Created `src/core/pipeline/types/` directory
- Moved `src/workflow/feature-blueprint.ts` → `src/core/pipeline/types/workflow-modes.ts` (git mv)
- Updated import in `src/core/pipeline/steps/commentary/types.ts` to use new path
- Verified zero imports of `core/workflow` remain
- Type check: 0 errors
- Tests: 697 passed

## Concerns

- None
