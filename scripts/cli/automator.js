#!/usr/bin/env node
/**
 * CapCut 自动化引擎
 * 全自动剪辑，无需用户手动操作
 */

import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// ============ 配置 ============

const CONFIG = {
  // 剪映应用路径
  paths: {
    mac: '/Applications/CapCut.app',
    win: 'C:\\Program Files\\CapCut\\CapCut.exe',
  },
  // 启动等待时间 (ms)
  launchDelay: 3000,
  // 操作间隔 (ms)
  actionDelay: 500,
};

// ============ 键盘映射 ============

const KEYBOARD_SHORTCUTS = {
  // 文件操作
  new: { mac: 'n', win: 'n' },
  open: { mac: 'o', win: 'o' },
  save: { mac: 's', win: 's' },
  saveAs: { mac: 'shift+s', win: 'S' },
  export: { mac: 'e', win: 'e' },
  
  // 编辑操作
  undo: { mac: 'z', win: 'z' },
  redo: { mac: 'shift+z', win: 'Z' },
  cut: { mac: 'x', win: 'x' },
  copy: { mac: 'c', win: 'c' },
  paste: { mac: 'v', win: 'v' },
  delete: { mac: 'backspace', win: 'backspace' },
  selectAll: { mac: 'a', win: 'a' },
  
  // 播放控制
  play: { mac: 'space', win: 'space' },
  forward: { mac: 'right', win: 'right' },
  backward: { mac: 'left', win: 'left' },
  home: { mac: 'home', win: 'home' },
  end: { mac: 'end', win: 'end' },
  
  // 轨道操作
  addText: { mac: 't', win: 't' },
  addMedia: { mac: 'i', win: 'i' },
  split: { mac: 'b', win: 'b' },
  speed: { mac: 'r', win: 'r' },
  
  // 视图
  zoomIn: { mac: '=', win: '=' },
  zoomOut: { mac: '-', win: '-' },
  fullscreen: { mac: 'f', win: 'f' },
};

// ============ 工具函数 ============

function getPlatform() {
  const platform = process.platform;
  return platform === 'darwin' ? 'mac' : 'win';
}

function getShortcut(action) {
  const platform = getPlatform();
  return KEYBOARD_SHORTCUTS[action]?.[platform];
}

// 检查应用是否运行
function isAppRunning(appName) {
  const platform = getPlatform();
  try {
    if (platform === 'mac') {
      execSync(`pgrep -x "${appName}"`, { stdio: 'ignore' });
      return true;
    } else {
      execSync(`tasklist | findstr "${appName}"`, { stdio: 'ignore' });
      return true;
    }
  } catch (e) {
    return false;
  }
}

// 启动应用
function launchApp() {
  const platform = getPlatform();
  const appPath = platform === 'mac' ? CONFIG.paths.mac : CONFIG.paths.win;
  
  console.log(chalk.gray(`正在启动 ${platform === 'mac' ? 'CapCut' : '剪映'}...`));
  
  try {
    if (platform === 'mac') {
      execSync(`open -a CapCut`, { stdio: 'ignore' });
    } else {
      spawn(CONFIG.paths.win, [], { detached: true, stdio: 'ignore' });
    }
    console.log(chalk.green('✓ 应用已启动'));
  } catch (e) {
    throw new Error('启动失败，请确认已安装');
  }
}

// 等待应用启动
function waitForApp(appName, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (isAppRunning(appName)) {
      return true;
    }
    sleep(500);
  }
  return false;
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

// ============ 自动化执行器 ============

class CapCutAutomator {
  constructor() {
    this.platform = getPlatform();
    this.appName = this.platform === 'mac' ? 'CapCut' : 'CapCut.exe';
  }

  // 初始化
  async init() {
    // 检查是否已运行
    if (!isAppRunning(this.appName)) {
      launchApp();
      if (!waitForApp(this.appName)) {
        throw new Error('启动超时');
      }
    }
    
    // 激活应用
    this.activate();
    sleep(CONFIG.launchDelay);
  }

  // 激活应用
  activate() {
    const platform = this.platform;
    try {
      if (platform === 'mac') {
        execSync(`osascript -e 'tell application "CapCut" to activate'`, { stdio: 'ignore' });
      } else {
        execSync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::Activate();"`, { stdio: 'ignore' });
      }
    } catch (e) {
      // ignore
    }
  }

  // 发送按键
  sendKey(key, modifiers = []) {
    const platform = this.platform;
    
    try {
      if (platform === 'mac') {
        let cmd = `osascript -e 'tell application "CapCut" to activate' -e 'delay 0.3' -e 'tell application "System Events"`;
        
        if (modifiers.includes('cmd') || modifiers.includes('command')) {
          cmd += ` to keystroke "${key}" using command down`;
        } else if (modifiers.includes('shift')) {
          cmd += ` to keystroke "${key}" using shift down`;
        } else if (modifiers.includes('alt')) {
          cmd += ` to keystroke "${key}" using option down`;
        } else {
          cmd += ` to keystroke "${key}"`;
        }
        
        cmd += "'";
        execSync(cmd, { stdio: 'ignore' });
      } else {
        // Windows 使用 PowerShell 发送按键
        let keyCode = key;
        const modifierStr = modifiers.join('+');
        
        const psScript = `
          Add-Type -AssemblyName System.Windows.Forms
          Start-Sleep -Milliseconds 300
          SendKeys "^${key}"
        `;
        execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { stdio: 'ignore' });
      }
      
      sleep(CONFIG.actionDelay);
    } catch (e) {
      console.log(chalk.yellow(`⚠ 按键失败: ${key}`));
    }
  }

  // 执行操作
  async execute(action, params = {}) {
    console.log(chalk.cyan(`\n⚡ 执行: ${action}`));
    
    switch (action) {
      case 'new_project':
        this.sendKey('n', ['cmd']);
        break;
        
      case 'add_video':
        this.sendKey('i', ['cmd']);
        await this.waitForDialog();
        break;
        
      case 'add_text':
        this.sendKey('t', ['cmd']);
        await this.waitForDialog();
        break;
        
      case 'split':
        this.sendKey('b', ['cmd']);
        break;
        
      case 'cut':
        this.sendKey('x', ['cmd']);
        break;
        
      case 'copy':
        this.sendKey('c', ['cmd']);
        break;
        
      case 'paste':
        this.sendKey('v', ['cmd']);
        break;
        
      case 'delete':
        this.sendKey('backspace');
        break;
        
      case 'undo':
        this.sendKey('z', ['cmd']);
        break;
        
      case 'redo':
        this.sendKey('z', ['cmd', 'shift']);
        break;
        
      case 'save':
        this.sendKey('s', ['cmd']);
        break;
        
      case 'export':
        this.sendKey('e', ['cmd']);
        await this.waitForDialog();
        break;
        
      case 'play':
        this.sendKey('space');
        break;
        
      case 'forward':
        this.sendKey('right');
        break;
        
      case 'backward':
        this.sendKey('left');
        break;
        
      case 'go_home':
        this.sendKey('home');
        break;
        
      case 'go_end':
        this.sendKey('end');
        break;
        
      case 'zoom_in':
        this.sendKey('=', ['cmd']);
        break;
        
      case 'zoom_out':
        this.sendKey('-', ['cmd']);
        break;
        
      default:
        console.log(chalk.yellow(`⚠ 未知操作: ${action}`));
    }
    
    console.log(chalk.green('✓ 完成'));
  }

  // 等待对话框
  async waitForDialog() {
    sleep(1000);
  }

  // 执行复合操作
  async runWorkflow(workflow) {
    console.log(chalk.cyan(`\n🎬 开始执行工作流: ${workflow.name}\n`));
    
    for (const step of workflow.steps) {
      console.log(chalk.gray(`  [${step.order}] ${step.description}`));
      await this.execute(step.action, step.params);
    }
    
    console.log(chalk.green('\n✓ 工作流执行完成'));
  }
}

// ============ 预设工作流 ============

const WORKFLOWS = {
  // 基础剪辑工作流
  basic_clip: {
    name: '基础剪辑',
    steps: [
      { order: 1, action: 'new_project', description: '创建新项目', params: {} },
      { order: 2, action: 'add_video', description: '添加视频', params: {} },
      { order: 3, action: 'split', description: '分割片段', params: {} },
      { order: 4, action: 'cut', description: '剪切不需要的内容', params: {} },
      { order: 5, action: 'save', description: '保存项目', params: {} },
    ],
  },

  // 添加字幕工作流
  add_subtitle: {
    name: '添加字幕',
    steps: [
      { order: 1, action: 'add_text', description: '添加文字', params: {} },
      // 后续需要用户输入文字
    ],
  },

  // 导出工作流
  export_video: {
    name: '导出视频',
    steps: [
      { order: 1, action: 'export', description: '打开导出面板', params: {} },
    ],
  },

  // 快速成片
  quick_edit: {
    name: '快速成片',
    steps: [
      { order: 1, action: 'new_project', description: '新建项目', params: {} },
      { order: 2, action: 'add_video', description: '添加素材', params: {} },
      { order: 3, action: 'play', description: '预览', params: {} },
      { order: 4, action: 'save', description: '保存', params: {} },
    ],
  },
};

// ============ CLI 接口 ============

export const autoCommand = {
  name: 'auto',
  description: '自动化剪辑 - 无需手动操作',
  options: [
    { flags: '-w, --workflow <name>', description: '执行预设工作流' },
    { flags: '-a, --action <action>', description: '执行单个操作' },
    { flags: '-l, --list', description: '列出可用工作流' },
  ],
  
  async action(options) {
    console.log(chalk.cyan.bold('\n🎬 CapCut 自动化引擎\n'));
    
    // 列出工作流
    if (options.list) {
      console.log(chalk.cyan('📋 可用的自动化工作流:\n'));
      
      Object.entries(WORKFLOWS).forEach(([key, wf]) => {
        console.log(`  ${chalk.green(key.padEnd(20))} - ${wf.name}`);
        console.log(chalk.gray(`    步骤: ${wf.steps.length} 个`));
        console.log();
      });
      return;
    }
    
    try {
      const automator = new CapCutAutomator();
      await automator.init();
      
      // 执行工作流
      if (options.workflow) {
        const wf = WORKFLOWS[options.workflow];
        if (!wf) {
          console.log(chalk.red(`✗ 未找到工作流: ${options.workflow}`));
          console.log(chalk.gray('使用 --list 查看可用工作流'));
          return;
        }
        await automator.runWorkflow(wf);
      }
      // 执行单个操作
      else if (options.action) {
        await automator.execute(options.action);
      }
      else {
        console.log(chalk.yellow('⚠ 请指定操作'));
        console.log(chalk.gray('  --workflow <name>  执行工作流'));
        console.log(chalk.gray('  --action <action>  执行单个操作'));
        console.log(chalk.gray('  --list           列出工作流'));
      }
      
    } catch (error) {
      console.log(chalk.red(`\n✗ 错误: ${error.message}`));
    }
  }
};

export default autoCommand;
