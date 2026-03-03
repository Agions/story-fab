/// <reference types="vitest" />

import '@testing-library/jest-dom';

declare module 'vitest' {
  export interface TestContext {
    // Add custom test context properties if needed
  }
}
