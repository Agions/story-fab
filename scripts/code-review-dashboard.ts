#!/usr/bin/env ts-node
/**
 * Code review dashboard – quality reports generator.
 * Outputs JSON summary to stdout.
 */
import { execSync } from 'child_process';

interface Report {
  eslint: { errors: number; warnings: number };
  tsc: { errors: number };
  coverage: { pct: number };
}

async function main() {
  const report: Report = { eslint: { errors: 0, warnings: 0 }, tsc: { errors: 0 }, coverage: { pct: 0 } };

  try {
    const eslintRaw = execSync('pnpm exec eslint src --format json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const eslintData = JSON.parse(eslintRaw);
    report.eslint.errors = eslintData.errorCount ?? 0;
    report.eslint.warnings = eslintData.warningCount ?? 0;
  } catch { /* ignore */ }

  try {
    execSync('pnpm run type-check', { stdio: ['ignore', 'pipe', 'pipe'] });
    report.tsc.errors = 0;
  } catch {
    report.tsc.errors = 1;
  }

  try {
    const { execSync: py } = require('child_process');
    const cov = py('python3 scripts/compute-coverage.py', { encoding: 'utf-8' });
    report.coverage.pct = parseFloat(cov.trim()) || 0;
  } catch { /* ignore */ }

  const isJson = process.argv.includes('--json');
  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Code Quality Dashboard');
    console.log(`  ESLint: ${report.eslint.errors} errors, ${report.eslint.warnings} warnings`);
    console.log(`  TypeScript: ${report.tsc.errors} errors`);
    console.log(`  Coverage: ${report.coverage.pct}%`);
  }
}

main().catch(() => process.exit(0));
