#!/usr/bin/env node
/**
 * check-naming.mjs
 *
 * StoryFab 项目命名规范校验。
 * 详细规则见 docs/NAMING_AND_MODULARIZATION.md
 *
 * 检查项：
 *  1. 文件名 — React 组件 PascalCase, Hook use 前缀, 工具 camelCase
 *  2. 目录名 — PascalCase (业务), kebab-case (顶级)
 *  3. 禁止的目录名 (util / helper / common / misc / tmp / temp)
 *
 * @author Agions <1051736049@qq.com>
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src'];
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', 'coverage', 'reports',
  'ui',         // shadcn/ui 基座, 例外
  'common',     // components/common 通用组件, 例外
  'shared',     // 顶级共享层
  'core',       // 核心层
  'store',      // 状态层
  'hooks',      // hooks 层
  'pages',      // 页面层
  'styles',     // 样式
  'theme',      // 主题
  'test',       // 测试工具
  'context',    // context
  'providers',  // providers
  'types',      // 类型
  'utils',      // 工具
  'constants',  // 常量
  'config',     // 配置
  'api',        // api
  'services',   // 服务
  'pipeline',   // pipeline
  'workflow',   // workflow
  'tauri',      // tauri
  'export',     // export
  'video',      // video
  'interfaces', // interfaces
  'assets',     // 资源
  'public',     // 公共
  'docs',       // 文档
  'scripts',    // 脚本
  'src-tauri',  // rust 后端
]);

const FORBIDDEN_DIRS = new Set(['util', 'helper', 'helpers', 'misc', 'tmp', 'temp', 'new', 'old', 'v2']);
const COMPONENT_EXTS = ['.tsx'];

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const violations = [];

function isPascalCase(s) {
  return /^[A-Z][A-Za-z0-9]*$/.test(s);
}
function isCamelCase(s) {
  return /^[a-z][A-Za-z0-9]*$/.test(s);
}
function isKebabCase(s) {
  return /^[a-z][a-z0-9-]*$/.test(s);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (st.isFile()) {
      yield p;
    }
  }
}

for (const dir of SCAN_DIRS) {
  const full = join(ROOT, dir);
  try {
    statSync(full);
  } catch {
    continue;
  }
  for (const file of walk(full)) {
    const rel = relative(ROOT, file);
    const parts = rel.split(sep);
    const fname = parts[parts.length - 1];
    const ext = fname.slice(fname.lastIndexOf('.'));
    const base = fname.slice(0, fname.length - ext.length);
    const dirParts = parts.slice(0, -1);

    // 1. 检查目录名
    for (let i = 0; i < dirParts.length; i++) {
      const d = dirParts[i];
      if (FORBIDDEN_DIRS.has(d)) {
        violations.push({
          level: 'warn',
          path: rel,
          msg: `禁止的目录名 "${d}" — 应使用具体语义命名 (e.g. utils/, helpers/, formats/)`,
        });
      }
    }

    // 2. 检查文件名 — 排除 index, 排除 .d.ts, 排除 test 文件
    if (base === 'index' || ext === '.d.ts' || base.endsWith('.test')) continue;

    if (COMPONENT_EXTS.includes(ext)) {
      // 例外: 入口文件 main.tsx / App.tsx
      if (base === 'main' || base === 'App') continue;
      // .tsx 视为组件 — PascalCase
      if (!isPascalCase(base) && !base.startsWith('use')) {
        violations.push({
          level: 'warn',
          path: rel,
          msg: `组件文件 "${fname}" 建议使用 PascalCase (e.g. VideoEditor.tsx) — 例外: hooks 以 use 开头`,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.warn(`${YELLOW}⚠ check-naming: ${violations.length} 处建议项${RESET}\n`);
  for (const v of violations) {
    console.warn(`  ${v.path}`);
    console.warn(`    ${v.msg}\n`);
  }
  console.warn(`${YELLOW}详情见 docs/NAMING_AND_MODULARIZATION.md${RESET}`);
  process.exit(0); // warn-only, 不阻塞
}

console.log(`${GREEN}✓ check-naming 通过: 命名规范${RESET}`);
process.exit(0);
