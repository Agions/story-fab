---
title: 配置参考
---

# 配置参考

## 环境变量

| 变量 | 用途 | 默认 |
| --- | --- | --- |
| `STORYFAB_CONFIG_DIR` | 覆盖配置目录 | 平台默认 |
| `STORYFAB_LOG_LEVEL` | 日志级别 (trace/debug/info/warn/error) | `info` |
| `STORYFAB_DISABLE_TELEMETRY` | 禁用任何外部请求 | `false` |
| `STORYFAB_FFMPEG_PATH` | 自定义 FFmpeg 路径 | 自动发现 |

## CLI 参数

```bash
story-fab [command] [options]
```

### 全局选项

| 选项 | 说明 |
| --- | --- |
| `--config-dir <path>` | 指定配置目录 |
| `--log-level <level>` | 日志级别 |
| `--no-sandbox` | 禁用 Chromium 沙箱（Linux 调试用） |
| `--version` | 打印版本 |
| `--help` | 显示帮助 |

### 子命令

```bash
story-fab dev                  # 启动开发模式
story-fab build <project>      # 命令行渲染项目
story-fab analyze <video>      # 命令行分析视频
story-fab config <action>      # 配置管理（get/set/list/reset）
```

## 配置项 schema

参考 `src/shared/constants/settings.ts` 中的 `AppSettings` 类型，所有字段均可通过 `story-fab config set <key> <value>` 修改。