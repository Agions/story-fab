#!/usr/bin/env node
/**
 * verify-no-tag.mjs
 *
 * StoryFab 项目级约束：本地严禁打 tag。
 *
 * 此脚本在以下时机被调用：
 *  1. pre-commit hook — 拦截本地 `git tag` 操作
 *  2. CI workflow     — 校验 push 不携带本地新建的 tag
 *
 * 校验策略：
 *  - 解析 git ref 列表，检测是否有本地新建的 tag 试图 push
 *  - 校验全局 git 账户与项目账户一致
 *
 * 退出码：
 *  - 0: 通过
 *  - 1: 检测到违规 (本地 tag / 账户不一致)
 *
 * @author Agions <1051736049@qq.com>
 */

import { execSync } from 'node:child_process';

const EXPECTED_NAME = 'Agions';
const EXPECTED_EMAIL = '1051736049@qq.com';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let failed = false;

function log(level, msg) {
  const prefix = { error: `${RED}✗${RESET}`, warn: `${YELLOW}⚠${RESET}`, ok: `${GREEN}✓${RESET}` }[level];
  console.log(`${prefix} ${msg}`);
}

function sh(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      // 关键：把 stderr 重定向到 /dev/null 而不是 inherit pipe
      // 避免 stderr 写入失败导致 execSync 抛异常
    }).trim();
  } catch (e) {
    return '';
  }
}

/**
 * 读取 git config 值 - 兼容 CI 环境的多个 fallback
 * 优先级: --local > --global > --system > env vars
 * 失败返回 ''
 */
function gitConfig(key) {
  const cmds = [
    `git config --local --get ${key}`,
    `git config --global --get ${key}`,
    `git config --system --get ${key}`,
  ];
  for (const cmd of cmds) {
    try {
      const result = execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'], // 忽略 stderr
      });
      const trimmed = result.trim();
      if (trimmed) return trimmed;
    } catch {
      // 继续下一个 fallback
    }
  }
  return '';
}

// ============================================================
// 1. 校验 git tag 操作
// ============================================================
const refLog = sh('git rev-parse --verify HEAD 2>/dev/null');
if (!refLog) {
  log('warn', 'verify-no-tag: HEAD 不存在 (可能是初始仓库)，跳过 tag 检查');
} else {
  // 检测当前操作是否为打 tag
  const args = process.argv.slice(2);
  if (args.includes('--check-command')) {
    // 模式 1: 检查 git 命令本身
    const cmd = args[args.indexOf('--check-command') + 1] || '';
    if (/\bgit\s+tag\b/.test(cmd) && !/\bgit\s+tag\s+-d\b/.test(cmd) && !/\bgit\s+tag\s+--delete\b/.test(cmd)) {
      log('error', `检测到本地 git tag 命令: "${cmd}"`);
      log('error', 'StoryFab 项目规定: 本地严禁打 tag，请使用 GitHub Release 流程');
      log('error', '如需删除已有 tag: git tag -d <tagname>');
      failed = true;
    }
  } else {
    // 模式 2: CI 模式下检查推送是否携带本地新建的 tag
    const localTags = sh('git tag --list').split('\n').filter(Boolean);
    const remoteTags = sh('git ls-remote --tags origin 2>/dev/null')
      .split('\n')
      .map((l) => l.split('/').pop())
      .filter(Boolean);

    const newLocalTags = localTags.filter((t) => !remoteTags.includes(t));
    if (newLocalTags.length > 0) {
      log('error', `检测到本地新建 tag 但未推送到远程: ${newLocalTags.join(', ')}`);
      log('error', '本地严禁打 tag，请先删除:');
      newLocalTags.forEach((t) => log('error', `  git tag -d ${t}`));
      failed = true;
    } else {
      log('ok', '无本地未推送的 tag');
    }
  }
}

// ============================================================
// 2. 校验全局 git 账户（兼容 CI 环境）
// ============================================================
// 使用 gitConfig() 兼容多个 config 源：local > global > system
// 在 CI 环境 (GitHub Actions) 下，runner 通常没有 --local 配置
// 也没有 --global 配置，必须在 workflow 中显式设置：
//   git config --global user.name "Agions"
//   git config --global user.email "1051736049@qq.com"
const localName = gitConfig('user.name');
const localEmail = gitConfig('user.email');

if (localName !== EXPECTED_NAME) {
  log('error', `git user.name 不匹配: 当前="${localName}", 期望="${EXPECTED_NAME}"`);
  log('error', `请执行: git config --global user.name "${EXPECTED_NAME}"`);
  failed = true;
} else {
  log('ok', `git user.name = "${localName}"`);
}

if (localEmail !== EXPECTED_EMAIL) {
  log('error', `git user.email 不匹配: 当前="${localEmail}", 期望="${EXPECTED_EMAIL}"`);
  log('error', `请执行: git config --global user.email "${EXPECTED_EMAIL}"`);
  failed = true;
} else {
  log('ok', `git user.email = "${localEmail}"`);
}

// ============================================================
// 3. 校验 AI byline 残留
// ============================================================
const lastCommitMsg = sh('git log -1 --pretty=%s');
if (/🤖|anthropic\.com|co-authored-by:\s*claude/i.test(lastCommitMsg)) {
  log('error', `最新 commit message 含 AI byline: "${lastCommitMsg}"`);
  failed = true;
} else {
  log('ok', '最新 commit message 无 AI byline');
}

const lastCommitAuthor = sh('git log -1 --pretty=%an <%ae>');
if (/hermes@agent\.local|claude@anthropic/i.test(lastCommitAuthor)) {
  log('error', `最新 commit author 含 AI 身份: "${lastCommitAuthor}"`);
  failed = true;
} else {
  log('ok', `最新 commit author 干净: "${lastCommitAuthor}"`);
}

// ============================================================
// 退出
// ============================================================
if (failed) {
  console.log(`\n${RED}✗ verify-no-tag 检查未通过${RESET}`);
  console.log(`${YELLOW}参考 ADR-006: 本地禁打 tag + 强制全局账户${RESET}`);
  process.exit(1);
}

console.log(`\n${GREEN}✓ verify-no-tag 全部通过${RESET}`);
process.exit(0);
