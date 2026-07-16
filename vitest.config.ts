/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'src/test/**/fixtures/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: ['node_modules', 'src/test', '**/*.d.ts', '**/*.config.*', '**/vite-env.d.ts'],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        // Stage 8 PR-5.4：从 5% 提升到 15%。
        // 真实覆盖率 ~19%（远低于 README 声明的 98% — 数据漂移）：
        //   Statements  : 18.64% (1564/8389)
        //   Branches    : 15.95% ( 782/4900)
        //   Functions   : 20.23% ( 491/2426)
        //   Lines      : 19.43% (1467/7550)
        // TODO(Stage 9)：分批提升到 30% → 50% → 80%，每次都加新单测。
        // 65 test files / 459 source files = 1:7 比例偏低，需补单元测试而非仅提门槛。
        lines: 15,
        functions: 15,
        branches: 12,
        statements: 15,
      },
    },
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/store': path.resolve(__dirname, './src/stores'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/shared/constants': path.resolve(__dirname, './src/shared/constants'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
});
