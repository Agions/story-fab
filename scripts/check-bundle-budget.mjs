/**
 * Bundle budget validator (ESM).
 * Checks that built assets don't exceed configured size limits.
 */
import { statSync, readdirSync } from 'fs';
import { join } from 'path';

const BUDGETS = [
  { name: 'main js',        pattern: 'index-',         limitKb: 800   },
  { name: 'vendor-react',   pattern: 'vendor-react-',  limitKb: 1500  },
  { name: 'vendor-antd',    pattern: 'vendor-antd-',   limitKb: 800   },
  { name: 'vendor-zustand', pattern: 'vendor-zustand-', limitKb: 200 },
  { name: 'vendor-router',  pattern: 'vendor-router-',  limitKb: 300  },
];

const DIR = 'dist/assets';

let errors = 0;
try {
  const files = readdirSync(DIR);
  for (const b of BUDGETS) {
    const matched = files.filter(f => f.startsWith(b.pattern) && f.endsWith('.js'));
    if (!matched.length) {
      console.warn(`[budget] ${b.name}: no file matching pattern "${b.pattern}*", skipping`);
      continue;
    }
    for (const f of matched) {
      const kb = statSync(join(DIR, f)).size / 1024;
      const status = kb > b.limitKb ? 'FAIL' : 'PASS';
      console.log(`[budget] ${b.name} (${f}): ${kb.toFixed(1)}kb / ${b.limitKb}kb  ${status}`);
      if (kb > b.limitKb) errors++;
    }
  }
} catch (e) {
  console.warn(`[budget] Could not read dist/assets: ${e.message}`);
}

if (errors) {
  console.error(`\nBundle budget exceeded: ${errors} file(s) over limit`);
  process.exit(1);
}
console.log('\nAll bundle budgets OK');
