# Task A2 Brief: Move workflow/ feature-blueprint to core/pipeline/

## Where this fits

This is the second task in Phase A. It moves the isolated `src/workflow/feature-blueprint.ts` file (which defines `WorkflowMode` type) into the pipeline domain where it logically belongs: `src/core/pipeline/types/workflow-modes.ts`. After this move, the now-empty `src/workflow/` directory will be deleted in Task B1.

## What to do

### Step 1: Create target directory

```bash
mkdir -p src/core/pipeline/types
```

### Step 2: Move file

```bash
git mv src/workflow/feature-blueprint.ts src/core/pipeline/types/workflow-modes.ts
```

### Step 3: Update import

Edit `src/core/pipeline/steps/commentary/types.ts`:
```tsx
// Change:
import type { WorkflowMode } from '@/core/workflow/feature-blueprint';
// To:
import type { WorkflowMode } from '@/core/pipeline/types/workflow-modes';
```

### Step 4: Verify no remaining imports

```bash
grep -rn "from.*core/workflow" src/ --include="*.ts" --include="*.tsx"
# Expected: zero results
```

### Step 5: Type check + tests

```bash
npx tsc --noEmit
npx vitest run
```

Both must pass with zero errors.

### Step 6: Commit

```bash
git add -A
git commit -m "refactor(A2): move workflow modes to core/pipeline/types/"
```

## Global constraints

- Use `git mv` for tracked files
- After each phase, run `npx tsc --noEmit` and `npx vitest run`
- Git commit message: `refactor(A2): move workflow modes to core/pipeline/types/`
