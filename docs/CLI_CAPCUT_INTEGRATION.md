# ClipFlow x CapCut 集成设计方案

## 1. 背景概述

### 1.1 目标
让用户通过自然语言控制剪映客户端，实现自动化视频剪辑。

### 1.2 技术现状

| 方式 | 可行性 | 说明 |
|------|--------|------|
| 官方 API | ❌ | 剪映无公开 API |
| URL Scheme | ⚠️ | 仅移动端支持 |
| 项目文件 | ✅ | .capcut 文件是 JSON |
| 键盘自动化 | ✅ | 可模拟快捷键 |
| AppleScript | ✅ | macOS 可用 |
| AutoHotkey | ✅ | Windows 可用 |

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     ClipFlow CLI                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │   Natural   │ → │   Intent    │ → │   Action       │   │
│  │   Parser    │   │   Router    │   │   Executor     │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
│                                              ↓              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │  Keyboard   │   │   Project   │   │   Deep Link    │   │
│  │  Simulator  │   │   Generator │   │   Handler      │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
              ┌─────────────────────────┐
              │    CapCut Client        │
              │  (Windows / macOS)      │
              └─────────────────────────┘
```

### 2.2 核心模块

#### NaturalLanguageParser
- 输入: 自然语言命令
- 输出: 结构化 Intent

#### IntentRouter
- 分类: timeline, export, effect, subtitle, etc.
- 映射到具体 Action

#### ActionExecutor
- 执行具体操作
- 支持平台: Windows (AutoHotkey), macOS (AppleScript)

## 3. 命令设计

### 3.1 支持的命令类型

| 类别 | 示例 | Action |
|------|------|--------|
| 轨道操作 | "在视频轨道添加一段素材" | AddClip |
| 剪辑 | "把第5秒到10秒的内容剪切" | TrimClip |
| 转场 | "添加淡入淡出转场" | AddTransition |
| 字幕 | "添加标题字幕" | AddSubtitle |
| 调色 | "调亮一点" | AdjustColor |
| 导出 | "导出为1080p MP4" | Export |
| 特效 | "添加模糊特效" | AddEffect |

### 3.2 命令格式

```bash
# 基础命令
clipflow capcut "在开头添加3秒黑场"

# 带参数
clipflow capcut "添加字幕: 欢迎观看" --style title

# 执行复杂操作
clipflow capcut "把视频调亮50%，添加淡入转场"
```

## 4. 实现方案

### 4.1 项目文件生成

.capcut 文件结构 (推测):
```json
{
  "version": "1.0",
  "tracks": [
    {
      "type": "video",
      "clips": [...]
    }
  ],
  "effects": [...],
  "subtitles": [...],
  "export": {...}
}
```

### 4.2 键盘自动化

Windows (AutoHotkey):
```ahk
; 剪切
Send ^x
; 导出
Send ^e
```

macOS (AppleScript):
```applescript
tell application "CapCut"
    activate
    keystroke "c" using command down
end tell
```

### 4.3 平台检测

```typescript
const platform = process.platform;
const isMac = platform === 'darwin';
const isWin = platform === 'win32';
```

## 5. 实施计划

### Phase 1: 基础功能
- [ ] 命令行框架
- [ ] 自然语言解析
- [ ] 意图识别

### Phase 2: 核心操作
- [ ] 键盘模拟
- [ ] 快捷键映射
- [ ] 项目文件生成

### Phase 3: 高级功能
- [ ] 复杂命令支持
- [ ] 批量操作
- [ ] 脚本录制/回放

## 6. API 设计

```typescript
interface CapCutCommand {
  raw: string;
  intent: Intent;
  entities: Entity[];
  confidence: number;
}

interface Intent {
  action: ActionType;
  target: TrackTarget;
  parameters: Record<string, any>;
}

type ActionType = 
  | 'add_clip'
  | 'trim'
  | 'add_transition'
  | 'add_subtitle'
  | 'add_effect'
  | 'adjust_color'
  | 'export';

interface Executor {
  execute(command: CapCutCommand): Promise<Result>;
}
```

## 7. 错误处理

| 错误码 | 说明 | 处理 |
|--------|------|------|
| E001 | 剪映未安装 | 提示安装 |
| E002 | 剪映未启动 | 自动启动 |
| E003 | 操作失败 | 回滚并提示 |
| E004 | 不支持的操作 | 建议替代方案 |

