# ClipFlow CLI

专业的视频创作命令行工具

## 安装

```bash
# 全局安装
npm install -g clip-flow

# 或使用 npx
npx clip-flow [command]
```

## 命令

### 初始化项目

```bash
clipflow init [name]
clipflow init my-video --template blank
```

选项:
- `-t, --template <template>` - 项目模板
- `-f, --force` - 覆盖已存在的项目

### 开发服务器

```bash
clipflow dev
clipflow dev --port 3000
clipflow dev --host 0.0.0.0
```

选项:
- `-p, --port <port>` - 端口号 (默认: 1420)
- `--host <host>` - 主机地址 (默认: localhost)

### 构建

```bash
clipflow build
clipflow build --prod
clipflow build --analyze
```

选项:
- `-w, --watch` - 监听模式
- `-p, --prod` - 生产构建
- `--analyze` - 分析包体积

### 项目统计

```bash
clipflow stats
clipflow stats --json
```

选项:
- `-v, --verbose` - 详细统计
- `--json` - JSON 格式输出

### 诊断

```bash
clipflow doctor
clipflow doctor --fix
```

选项:
- `-f, --fix` - 自动修复问题

### 配置管理

```bash
# 获取配置
clipflow config get theme

# 设置配置
clipflow config set theme dark

# 列出所有配置
clipflow config list
```

### 视频导出

```bash
clipflow export -i input.mp4
clipflow export -i input.mp4 -f mp4 -q high -r 1080p
```

选项:
- `-i, --input <file>` - 输入文件 (必需)
- `-o, --output <file>` - 输出文件
- `-f, --format <format>` - 格式 (mp4/webm/mov)
- `-q, --quality <quality>` - 质量 (low/medium/high)
- `-r, --resolution <resolution>` - 分辨率 (720p/1080p/4k)

### CapCut 集成

```bash
# 自然语言控制
clipflow capcut "添加字幕: 你好世界"
clipflow capcut "导出为1080p mp4"

# 查看支持的命令
clipflow capcut --list
```

### 自动化工作流

```bash
# 列出工作流
clipflow auto --list

# 执行工作流
clipflow auto --workflow basic_clip
clipflow auto --workflow quick_edit
```

### 在 CapCut 中打开文件

```bash
# 打开文件
clipflow open video.mp4

# 仅打开 CapCut
clipflow open --capcut

# 最近文件
clipflow open --recent
```

## 配置文件

配置文件位于: `~/.clipflow/config.json`

```json
{
  "theme": "dark",
  "autoSave": true,
  "exportPath": "~/Videos",
  "defaultFormat": "mp4",
  "defaultQuality": "high"
}
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| CLIPFLOW_HOME | 配置目录 | ~/.clipflow |
| CLIPFLOW_PORT | 开发端口 | 1420 |

## 常见问题

### Q: 如何更新 CLI?
```bash
npm update -g clip-flow
```

### Q: 如何查看版本?
```bash
clipflow --version
```

### Q: 如何获取帮助?
```bash
clipflow --help
clipflow [command] --help
```
