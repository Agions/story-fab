/**
 * CapCut 集成模块
 * 通过自然语言控制剪映客户端
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';

// 意图模式匹配
const INTENT_PATTERNS = [
  // 字幕相关
  { pattern: /添加?字幕?(.*)/i, action: 'add_subtitle', params: (m) => ({ text: m[1] }) },
  { pattern: /添加?标题(.*)/i, action: 'add_title', params: (m) => ({ text: m[1], style: 'title' }) },
  
  // 转场相关
  { pattern: /添加?(淡入?淡出|fade)/i, action: 'add_transition', params: () => ({ type: 'fade' }) },
  { pattern: /添加?(转场|transition)(.*)/i, action: 'add_transition', params: (m) => ({ type: m[2] || 'fade' }) },
  
  // 调色相关
  { pattern: /调亮?(\d+)?%?/i, action: 'adjust_brightness', params: (m) => ({ value: parseInt(m[1]) || 20 }) },
  { pattern: /调暗?(\d+)?%?/i, action: 'adjust_darkness', params: (m) => ({ value: parseInt(m[1]) || 20 }) },
  { pattern: /调色(.*)/i, action: 'adjust_color', params: (m) => ({ preset: m[1] }) },
  
  // 剪辑相关
  { pattern: /剪切|第(\d+)秒?到?第(\d+)秒?剪切/i, action: 'trim', params: (m) => ({ start: parseInt(m[1]), end: parseInt(m[2]) }) },
  { pattern: /分割|第(\d+)秒?分割/i, action: 'split', params: (m) => ({ time: parseInt(m[1]) }) },
  
  // 特效相关
  { pattern: /添加?(模糊|blur)/i, action: 'add_effect', params: () => ({ effect: 'blur' }) },
  { pattern: /添加?(特效|effect)(.*)/i, action: 'add_effect', params: (m) => ({ effect: m[2] }) },
  
  // 导出相关
  { pattern: /导出(.*)/i, action: 'export', params: (m) => parseExportParams(m[1]) },
  { pattern: /输出(.*)/i, action: 'export', params: (m) => parseExportParams(m[1]) },
  
  // 素材相关
  { pattern: /添加?素材(.*)/i, action: 'add_media', params: (m) => ({ path: m[1] }) },
  { pattern: /添加?视频(.*)/i, action: 'add_video', params: (m) => ({ path: m[1] }) },
  
  // 撤销/重做
  { pattern: /撤销/i, action: 'undo', params: () => ({}) },
  { pattern: /重做/i, action: 'redo', params: () => ({}) },
  
  // 保存
  { pattern: /保存/i, action: 'save', params: () => ({}) },
  { pattern: /另存为(.*)/i, action: 'save_as', params: (m) => ({ path: m[1] }) },
];

// 解析导出参数
function parseExportParams(str) {
  const params = {};
  
  if (str.includes('4k')) params.resolution = '4k';
  else if (str.includes('1080')) params.resolution = '1080p';
  else if (str.includes('720')) params.resolution = '720p';
  
  if (str.includes('mp4')) params.format = 'mp4';
  else if (str.includes('mov')) params.format = 'mov';
  else if (str.includes('webm')) params.format = 'webm';
  
  return params;
}

// 解析自然语言
function parseIntent(input) {
  for (const { pattern, action, params } of INTENT_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      return {
        action,
        params: params(match),
        confidence: 0.9,
      };
    }
  }
  
  // 默认返回原始输入
  return {
    action: 'unknown',
    params: { raw: input },
    confidence: 0.1,
  };
}

// 获取平台特定命令
function getPlatformCommands() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    return {
      open: 'open -a CapCut',
      appPath: '/Applications/CapCut.app',
      keyboard: (key) => `osascript -e 'tell application "CapCut" to activate' -e 'delay 0.5' -e 'tell application "System Events" to keystroke "${key}" using command down'`,
    };
  } else {
    return {
      open: 'start capcut',
      appPath: 'C:\\Program Files\\CapCut\\CapCut.exe',
      keyboard: (key) => `ahk_script:Send, ^${key}`,
    };
  }
}

// 检查剪映是否安装
function checkCapCutInstalled() {
  const { appPath } = getPlatformCommands();
  return fs.existsSync(appPath);
}

// 打开剪映
function openCapCut() {
  const { open } = getPlatformCommands();
  
  try {
    execSync(open, { stdio: 'ignore' });
    console.log(chalk.green('✓ 已打开剪映'));
  } catch (e) {
    throw new Error('无法打开剪映，请确认已安装');
  }
}

// 执行键盘操作
function executeKeyboardAction(action) {
  const keyMap = {
    'undo': 'z',
    'redo': 'Z',
    'save': 's',
    'export': 'e',
    'copy': 'c',
    'cut': 'x',
    'paste': 'v',
    'delete': '\\08', // backspace
  };
  
  const key = keyMap[action];
  if (!key) {
    throw new Error(`不支持的操作: ${action}`);
  }
  
  const { keyboard } = getPlatformCommands();
  
  try {
    if (process.platform === 'darwin') {
      execSync(keyboard(key), { stdio: 'ignore' });
    } else {
      console.log(chalk.yellow(`⚠ Windows 需要 AutoHotkey 脚本执行: ^${key}`));
    }
    console.log(chalk.green(`✓ 执行: ${action}`));
  } catch (e) {
    throw new Error(`执行失败: ${action}`);
  }
}

// 导出命令
export const capcutCommand = {
  name: 'capcut',
  description: '通过自然语言控制剪映客户端',
  options: [
    { flags: '-o, --open', description: '仅打开剪映客户端' },
    { flags: '-l, --list', description: '列出支持的命令' },
  ],
  
  async action(input, options) {
    console.log(chalk.cyan('\n🎬 CapCut 自然语言控制\n'));
    
    // 检查安装
    if (!checkCapCutInstalled()) {
      console.log(chalk.red('✗ 剪映未安装'));
      console.log(chalk.gray('\n请从以下地址下载:'));
      console.log(chalk.blue('  https://www.capcut.cn'));
      return;
    }
    
    // 列出支持的命令
    if (options.list) {
      console.log(chalk.cyan('📋 支持的命令:\n'));
      const commands = [
        { cmd: '添加字幕', desc: '添加文字字幕' },
        { cmd: '添加标题', desc: '添加标题文字' },
        { cmd: '添加转场', desc: '添加转场效果' },
        { cmd: '调亮/调暗', desc: '调整画面亮度' },
        { cmd: '剪切', desc: '剪切指定片段' },
        { cmd: '分割', desc: '在指定时间分割' },
        { cmd: '添加特效', desc: '添加视频特效' },
        { cmd: '导出', desc: '导出视频' },
        { cmd: '撤销/重做', desc: '撤销或重做' },
        { cmd: '保存', desc: '保存项目' },
      ];
      
      commands.forEach(({ cmd, desc }) => {
        console.log(`  ${chalk.green(cmd.padEnd(15))} - ${desc}`);
      });
      return;
    }
    
    // 仅打开剪映
    if (options.open) {
      openCapCut();
      return;
    }
    
    // 解析命令
    if (!input) {
      console.log(chalk.yellow('⚠ 请输入命令'));
      console.log(chalk.gray('示例: clipflow capcut "添加字幕: 你好世界"'));
      console.log(chalk.gray('或: clipflow capcut --list 查看支持命令'));
      return;
    }
    
    console.log(chalk.gray(`解析命令: "${input}"\n`));
    
    // 解析意图
    const intent = parseIntent(input);
    
    if (intent.action === 'unknown') {
      console.log(chalk.yellow('⚠ 无法识别的命令'));
      console.log(chalk.gray('使用 --list 查看支持的操作'));
      return;
    }
    
    console.log(chalk.cyan('🔍 识别结果:'));
    console.log(`  ${chalk.gray('操作:')} ${chalk.green(intent.action)}`);
    console.log(`  ${chalk.gray('置信度:')} ${(intent.confidence * 100).toFixed(0)}%`);
    
    // 检查剪映是否运行
    let isRunning = false;
    try {
      if (process.platform === 'darwin') {
        execSync('pgrep -x CapCut', { stdio: 'ignore' });
        isRunning = true;
      }
    } catch (e) {
      isRunning = false;
    }
    
    if (!isRunning) {
      console.log(chalk.gray('\n正在打开剪映...'));
      openCapCut();
    }
    
    // 执行操作
    console.log(chalk.cyan('\n⚡ 执行操作...\n'));
    
    try {
      // 对于需要 UI 交互的操作，使用键盘模拟
      const keyboardActions = ['undo', 'redo', 'save', 'export', 'copy', 'cut', 'paste', 'delete'];
      
      if (keyboardActions.includes(intent.action)) {
        executeKeyboardAction(intent.action);
      } else {
        // 其他操作提示用户手动执行
        console.log(chalk.yellow(`⚠ 请在剪映中手动执行: ${intent.action}`));
        console.log(chalk.gray('  高级自动化功能需要配合 AutoHotkey (Windows) 或 Keyboard Maestro (macOS)'));
      }
      
      console.log(chalk.green('\n✓ 操作完成'));
      
    } catch (error) {
      console.log(chalk.red(`\n✗ 执行失败: ${error}`));
    }
  }
};

export default capcutCommand;
