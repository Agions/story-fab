/**
 * CapCut 文件关联模块
 * 支持从 CLI 直接在 CapCut 中打开文件
 */

import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// 支持的文件格式
const SUPPORTED_FORMATS = {
  video: ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.flv', '.wmv', '.m4v'],
  audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  project: ['.capcut', '.prproj', '.aep'],
};

// 获取平台
function getPlatform() {
  return process.platform === 'darwin' ? 'mac' : 'win';
}

// 检查文件是否存在
function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('文件不存在: ' + filePath);
  }
  return filePath;
}

// 获取文件类型
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  for (const [type, exts] of Object.entries(SUPPORTED_FORMATS)) {
    if (exts.includes(ext)) {
      return { type, ext };
    }
  }
  return { type: 'unknown', ext };
}

// 检查 CapCut 是否安装
function checkCapCutInstalled() {
  const platform = getPlatform();
  
  if (platform === 'mac') {
    return fs.existsSync('/Applications/CapCut.app');
  } else {
    const paths = [
      'C:\\Program Files\\CapCut\\CapCut.exe',
      process.env.LOCALAPPDATA + '\\Programs\\CapCut\\CapCut.exe',
    ];
    return paths.some(p => fs.existsSync(p));
  }
}

// 获取 CapCut 路径
function getCapCutPath() {
  const platform = getPlatform();
  
  if (platform === 'mac') {
    return '/Applications/CapCut.app';
  } else {
    const paths = [
      'C:\\Program Files\\CapCut\\CapCut.exe',
      process.env.LOCALAPPDATA + '\\Programs\\CapCut\\CapCut.exe',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
}

// 在 macOS 上通过 CapCut 打开文件
function openFileMac(filePath) {
  const absPath = path.resolve(filePath);
  
  // 使用 open 命令关联到 CapCut
  // CapCut 支持通过 URL scheme 打开文件
  const urlScheme = 'capcut://import?path=' + encodeURIComponent(absPath);
  
  try {
    // 尝试通过 URL scheme
    execSync('open "' + urlScheme + '"', { stdio: 'ignore' });
    return true;
  } catch (e) {
    // 回退: 直接用 CapCut 打开
    try {
      execSync('open -a CapCut "' + absPath + '"', { stdio: 'ignore' });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// 在 Windows 上通过 CapCut 打开文件
function openFileWin(filePath) {
  const absPath = path.resolve(filePath);
  const capcutPath = getCapCutPath();
  
  if (!capcutPath) {
    throw new Error('CapCut 未安装');
  }
  
  try {
    // 使用 start 命令打开文件关联到 CapCut
    execSync('start "" "' + capcutPath + '" "' + absPath + '"', { 
      stdio: 'ignore',
      shell: true 
    });
    return true;
  } catch (e) {
    return false;
  }
}

// 打开文件
function openFile(filePath) {
  const platform = getPlatform();
  
  if (platform === 'mac') {
    return openFileMac(filePath);
  } else {
    return openFileWin(filePath);
  }
}

// 打开 CapCut
function openCapCut() {
  const platform = getPlatform();
  
  if (platform === 'mac') {
    execSync('open -a CapCut', { stdio: 'ignore' });
  } else {
    const capcutPath = getCapCutPath();
    if (capcutPath) {
      spawn(capcutPath, [], { detached: true, stdio: 'ignore' });
    } else {
      throw new Error('CapCut 未安装');
    }
  }
}

// 列出最近的文件
function listRecentFiles() {
  const configPath = process.env.HOME + '/.clipflow/recent.json';
  
  try {
    if (fs.existsSync(configPath)) {
      const files = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return files.slice(0, 10); // 最近 10 个
    }
  } catch (e) {}
  
  return [];
}

// 保存最近文件
function saveRecentFile(filePath) {
  const configPath = process.env.HOME + '/.clipflow';
  const filesPath = configPath + '/recent.json';
  
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true });
  }
  
  let files = [];
  try {
    if (fs.existsSync(filesPath)) {
      files = JSON.parse(fs.readFileSync(filesPath, 'utf8'));
    }
  } catch (e) {}
  
  // 添加到开头，去重
  files = [filePath, ...files.filter(f => f !== filePath)].slice(0, 20);
  
  fs.writeFileSync(filesPath, JSON.stringify(files, null, 2));
}

// 命令导出
export const openCommand = {
  name: 'open',
  description: '在 CapCut 中打开文件',
  options: [
    { flags: '-c, --capcut', description: '仅打开 CapCut' },
    { flags: '-r, --recent', description: '显示最近打开的文件' },
  ],
  
  async action(filePath, options) {
    console.log(chalk.cyan('\n📂 CapCut File Opener\n'));
    
    // 检查 CapCut
    if (!checkCapCutInstalled()) {
      console.log(chalk.red('✗ CapCut 未安装'));
      console.log(chalk.gray('\n请从以下地址下载:'));
      console.log(chalk.blue('  https://www.capcut.cn'));
      return;
    }
    
    // 仅显示最近文件
    if (options.recent) {
      const recent = listRecentFiles();
      
      if (recent.length === 0) {
        console.log(chalk.gray('  暂无最近文件'));
      } else {
        console.log(chalk.cyan('\n📋 最近打开的文件:\n'));
        recent.forEach((file, i) => {
          const name = path.basename(file);
          const exist = fs.existsSync(file);
          console.log('  ' + (i + 1) + '. ' + (exist ? chalk.white(name) : chalk.red(name)));
          if (!exist) {
            console.log(chalk.gray('     文件不存在'));
          } else {
            console.log(chalk.gray('     ' + file));
          }
        });
      }
      return;
    }
    
    // 仅打开 CapCut
    if (options.capcut) {
      console.log(chalk.gray('正在打开 CapCut...'));
      openCapCut();
      console.log(chalk.green('✓ 已打开'));
      return;
    }
    
    // 打开文件
    if (!filePath) {
      console.log(chalk.yellow('⚠ 请指定要打开的文件'));
      console.log(chalk.gray('\n用法:'));
      console.log('  $ clipflow open <file>');
      console.log('  $ clipflow open --recent');
      console.log('  $ clipflow open --capcut');
      console.log(chalk.gray('\n支持格式:'));
      console.log('  视频: ' + SUPPORTED_FORMATS.video.join(', '));
      console.log('  音频: ' + SUPPORTED_FORMATS.audio.join(', '));
      console.log('  图片: ' + SUPPORTED_FORMATS.image.join(', '));
      return;
    }
    
    // 验证文件
    try {
      checkFile(filePath);
    } catch (e) {
      console.log(chalk.red('✗ ' + e.message));
      return;
    }
    
    const fileInfo = getFileType(filePath);
    
    if (fileInfo.type === 'unknown') {
      console.log(chalk.yellow('⚠ 不支持的文件格式: ' + fileInfo.ext));
      console.log(chalk.gray('\n支持格式:'));
      console.log('  视频: ' + SUPPORTED_FORMATS.video.join(', '));
      console.log('  音频: ' + SUPPORTED_FORMATS.audio.join(', '));
      console.log('  图片: ' + SUPPORTED_FORMATS.image.join(', '));
      return;
    }
    
    console.log(chalk.gray('  文件: ') + path.basename(filePath));
    console.log(chalk.gray('  类型: ') + fileInfo.type);
    console.log(chalk.gray('  路径: ') + filePath);
    console.log();
    
    // 打开文件
    console.log(chalk.gray('正在打开...'));
    
    try {
      const success = openFile(filePath);
      
      if (success) {
        // 保存到最近文件
        saveRecentFile(filePath);
        console.log(chalk.green('✓ 已在 CapCut 中打开'));
      } else {
        console.log(chalk.yellow('⚠ 使用默认方式打开'));
        openCapCut();
      }
    } catch (e) {
      console.log(chalk.red('✗ 打开失败: ' + e.message));
    }
  }
};

export default openCommand;
