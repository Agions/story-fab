#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';

const TARGETS = [
  'src/core',
  'src/components/Settings',
  'src/pages/Settings.tsx',
  'src/components/AIModelSelector.tsx',
  'src/components/editor/AIAssistant.tsx',
  'src/constants/models.ts',
];

const toFiles = (target) => {
  try {
    const output = execSync(`rg --files ${target}`, { encoding: 'utf8' });
    return output.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    if (target.endsWith('.ts') || target.endsWith('.tsx')) {
      return [target];
    }
    return [];
  }
};

const files = TARGETS.flatMap(toFiles).filter((file, index, arr) => arr.indexOf(file) === index);
const lintableFiles = files.filter((file) => {
  try {
    return !readFileSync(file, 'utf8').includes('@ts-nocheck');
  } catch {
    return false;
  }
});

if (lintableFiles.length === 0) {
  console.log('[lint-core] no lintable files found');
  process.exit(0);
}

const result = spawnSync(
  'npx',
  ['eslint', ...lintableFiles, '--no-ignore', '--max-warnings', '0'],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
