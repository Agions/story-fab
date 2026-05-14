/**
 * Code Review Dashboard Generator
 * Reads ESLint/TS/Coverage reports and produces a quality summary.
 * Consumed by: .github/workflows/main.yml (reports job)
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'reports');

function safeParseJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

function countTsErrors(path) {
  try {
    if (!existsSync(path)) return 0;
    const content = readFileSync(path, 'utf-8');
    return (content.match(/error TS\d+/g) || []).length;
  } catch {
    return 0;
  }
}

function getCoverage() {
  const coverageFile = join(REPORTS_DIR, 'coverage', 'coverage-final.json');
  try {
    if (!existsSync(coverageFile)) return { percent: 0, status: 'warn' };
    const data = safeParseJson(coverageFile, {});
    let total = 0, covered = 0;
    for (const m of Object.values(data)) {
      if (typeof m === 'object' && 'covered' in m) {
        total += m.covered + m.missed;
        covered += m.covered;
      }
    }
    if (total === 0) return { percent: 0, status: 'warn' };
    const percent = Math.round((covered / total) * 100 * 10) / 10;
    const status = percent >= 30 ? 'pass' : 'fail';
    return { percent, status };
  } catch {
    return { percent: 0, status: 'warn' };
  }
}

function getEslint() {
  const reportPath = join(REPORTS_DIR, 'eslint-report.json');
  const report = safeParseJson(reportPath, []);
  let warnings = 0, errors = 0;
  for (const f of report) {
    warnings += f.warningCount ?? 0;
    errors += f.errorCount ?? 0;
  }
  let status = 'pass';
  if (errors > 0) status = 'fail';
  else if (warnings > 250) status = 'warn';
  return { warnings, errors, status };
}

function main() {
  const jsonMode = process.argv.includes('--json');

  const eslint = getEslint();
  const tscErrors = countTsErrors(join(REPORTS_DIR, 'tsc-report-src.txt'));
  const tsc = { errors: tscErrors, status: tscErrors > 0 ? 'fail' : 'pass' };
  const coverage = getCoverage();

  let overall = 'pass';
  if (eslint.status === 'fail' || tsc.status === 'fail' || coverage.status === 'fail') overall = 'fail';
  else if (eslint.status === 'warn' || coverage.status === 'warn') overall = 'warn';

  const dashboard = { timestamp: new Date().toISOString(), eslint, tsc, coverage, overall };

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
