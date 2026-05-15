#!/usr/bin/env node
/**
 * Code Review Dashboard Generator
 * Reads ESLint/TS/Coverage reports and produces a quality summary JSON.
 * Consumed by: .github/workflows/main.yml (reports job)
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'reports');

interface Dashboard {
  timestamp: string;
  eslint: { warnings: number; errors: number; status: 'pass' | 'warn' | 'fail' };
  tsc: { errors: number; status: 'pass' | 'warn' | 'fail' };
  coverage: { percent: number; status: 'pass' | 'warn' | 'fail' };
  overall: 'pass' | 'warn' | 'fail';
}

function safeParseJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function countTsErrors(path: string): number {
  try {
    if (!existsSync(path)) return 0;
    const content = readFileSync(path, 'utf-8');
    return (content.match(/error TS\d+/g) || []).length;
  } catch {
    return 0;
  }
}

function getCoverage(): { percent: number; status: 'pass' | 'warn' | 'fail' } {
  const coverageFile = join(REPORTS_DIR, 'coverage', 'coverage-final.json');
  try {
    if (!existsSync(coverageFile)) return { percent: 0, status: 'warn' };
    const data = safeParseJson<Record<string, { covered: number; missed: number }>>(coverageFile, {});
    let total = 0, covered = 0;
    for (const m of Object.values(data)) {
      if (typeof m === 'object' && 'covered' in m) {
        total += m.covered + m.missed;
        covered += m.covered;
      }
    }
    if (total === 0) return { percent: 0, status: 'warn' };
    const percent = Math.round((covered / total) * 100 * 10) / 10;
    const status: 'pass' | 'warn' | 'fail' = percent >= 30 ? 'pass' : 'fail';
    return { percent, status };
  } catch {
    return { percent: 0, status: 'warn' };
  }
}

function getEslint(): { warnings: number; errors: number; status: 'pass' | 'warn' | 'fail' } {
  const reportPath = join(REPORTS_DIR, 'eslint-report.json');
  const report = safeParseJson<Array<{ warningCount: number; errorCount: number }>>(reportPath, []);
  let warnings = 0, errors = 0;
  for (const f of report) {
    warnings += f.warningCount ?? 0;
    errors += f.errorCount ?? 0;
  }
  const status: 'pass' | 'warn' | 'fail' = errors > 0 ? 'fail' : warnings > 250 ? 'warn' : 'pass';
  return { warnings, errors, status };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');

  const eslint = getEslint();
  const tscErrors = countTsErrors(join(REPORTS_DIR, 'tsc-report-src.txt'));
  const tsc = { errors: tscErrors, status: tscErrors > 0 ? 'fail' as const : 'pass' as const };
  const coverage = getCoverage();

  const overall: 'pass' | 'warn' | 'fail' =
    eslint.status === 'fail' || tsc.status === 'fail' || coverage.status === 'fail' ? 'fail' :
    eslint.status === 'warn' || coverage.status === 'warn' ? 'warn' : 'pass';

  const dashboard: Dashboard = {
    timestamp: new Date().toISOString(),
    eslint,
    tsc,
    coverage,
    overall,
  };

  if (jsonMode) {
    console.log(JSON.stringify(dashboard, null, 2));
  } else {
    console.log('=== Code Quality Dashboard ===');
    console.log(`ESLint  : ${eslint.warnings} warnings, ${eslint.errors} errors [${eslint.status}]`);
    console.log(`TSC     : ${tsc.errors} errors [${tsc.status}]`);
    console.log(`Coverage: ${coverage.percent}% [${coverage.status}]`);
    console.log(`Overall : [${overall}]`);
  }
}

main();
