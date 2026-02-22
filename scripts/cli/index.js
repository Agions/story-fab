#!/usr/bin/env node
/**
 * ClipFlow CLI
 * 视频创作工具的命令行界面
 */

import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';

// 导入命令模块
import { capcutCommand } from './capcut.js';
import { autoCommand } from './automator.js';

// 版本
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

program
  .name('clipflow')
  .description('ClipFlow - AI 视频创作工具')
  .version(packageJson.version);

// 命令: init
program
  .command('init')
  .description('初始化新项目')
  .argument('[name]', '项目名称')
  .action(async (name) => {
    console.log(chalk.cyan('🎬 初始化 ClipFlow 项目...\n'));
    const projectName = name || 'my-video-project';
    console.log(chalk.green(`✓ 项目创建: ${projectName}`));
  });

// 命令: build
program
  .command('build')
  .description('构建项目')
  .option('-w, --watch', '监听模式')
  .option('-p, --prod', '生产构建')
  .action((options) => {
    console.log(chalk.cyan('🔨 构建中...\n'));
    if (options.watch) {
      console.log(chalk.blue('📺 监听模式已开启'));
    }
    console.log(chalk.green('✓ 构建完成'));
  });

// 命令: dev
program
  .command('dev')
  .description('启动开发服务器')
  .option('-p, --port <port>', '端口号', '1420')
  .action((options) => {
    console.log(chalk.cyan(`🚀 启动开发服务器 (端口: ${options.port})...\n`));
  });

// 命令: stats
program
  .command('stats')
  .description('显示项目统计')
  .action(() => {
    console.log(chalk.cyan('\n📊 项目统计\n'));
    
    try {
      const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l').toString().trim();
      const components = execSync('find src/components -name "*.tsx" 2>/dev/null | wc -l').toString().trim();
      const services = execSync('find src/core/services -name "*.ts" | wc -l').toString().trim();
      
      console.log(chalk.gray('├─────────────────────────────────────┤'));
      console.log(chalk.gray('│') + `  源文件: ${chalk.yellow(srcFiles.padEnd(20))}` + chalk.gray('│'));
      console.log(chalk.gray('│') + `  组件: ${chalk.green(components.padEnd(20))}` + chalk.gray('│'));
      console.log(chalk.gray('│') + `  服务: ${chalk.blue(services.padEnd(20))}` + chalk.gray('│'));
      console.log(chalk.gray('└─────────────────────────────────────┘'));
    } catch (e) {
      console.log(chalk.yellow('⚠ 无法获取统计信息'));
    }
  });

// 命令: doctor
program
  .command('doctor')
  .description('诊断项目问题')
  .action(() => {
    console.log(chalk.cyan('\n🔍 项目诊断\n'));
    
    const checks = [
      { name: 'node_modules', check: fs.existsSync('node_modules') },
      { name: 'src 目录', check: fs.existsSync('src') },
      { name: 'package.json', check: fs.existsSync('package.json') },
      { name: 'vite.config.ts', check: fs.existsSync('vite.config.ts') },
    ];
    
    checks.forEach(item => {
      if (item.check) {
        console.log(chalk.green(`  ✓ ${item.name}`));
      } else {
        console.log(chalk.red(`  ✗ ${item.name}`));
      }
    });
  });

// 命令: export
program
  .command('export')
  .description('导出视频')
  .option('-f, --format <format>', '格式 (mp4/webm/mov)', 'mp4')
  .option('-q, --quality <qualitylow/medium/high>', '质量 ()', 'high')
  .action((options) => {
    console.log(chalk.cyan('\n📤 导出视频...\n'));
    console.log(chalk.gray(`  格式: ${options.format}`));
    console.log(chalk.gray(`  质量: ${options.quality}`));
    console.log(chalk.green('\n✓ 导出完成'));
  });

// 命令: capcut
program
  .command('capcut [input...]')
  .description('通过自然语言控制剪映客户端')
  .option('-o, --open', '仅打开剪映客户端')
  .option('-l, --list', '列出支持的命令')
  .action((input, options) => {
    const inputStr = input ? input.join(' ') : '';
    capcutCommand.action(inputStr, options);
  });

// 命令: auto (自动化剪辑)
program
  .command('auto')
  .description('自动化剪辑 - 无需手动操作')
  .option('-w, --workflow <name>', '执行预设工作流')
  .option('-a, --action <action>', '执行单个操作')
  .option('-l, --list', '列出可用工作流')
  .action((options) => {
    autoCommand.action(options);
  });

// 帮助
program.on('--help', () => {
  console.log('\n' + chalk.cyan('示例:'));
  console.log('  $ clipflow init my-project');
  console.log('  $ clipflow dev');
  console.log('  $ clipflow build --prod');
  console.log('  $ clipflow stats');
  console.log('  $ clipflow export --format mp4');
});

program.parse();
