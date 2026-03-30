---
title: 安全设计
description: StoryForge 的安全机制、API 密钥管理和数据保护措施。
---

# 安全设计

StoryForge 在设计之初就将安全作为核心考量，保护用户的敏感数据和隐私。

---

## API 密钥安全

### 存储层级

StoryForge 采用多层级密钥存储策略：

```
优先 → OS Keychain (系统级安全存储)
        ├── macOS:        Keychain Services
        ├── Windows:       Credential Manager
        └── Linux:        Secret Service API

降级 → 环境变量 (.env 文件，仅本地存储)
```

### 安全最佳实践

::: warning ⚠️ 重要
- **永远不要**将 API Key 提交到 Git 仓库
- `.env` 文件已加入 `.gitignore`，请勿移除
- 生产环境建议使用环境变量而非硬编码
:::

```bash
# 安全检查：确认 .env 不会被提交
git check-ignore .env
# 应该输出: .env

# 如果没有输出，手动添加
echo ".env" >> .gitignore
```

### 密钥访问控制

- API Key 仅在客户端本地使用，不会发送给第三方服务器
- 所有 AI 请求直接与 AI 服务商通信
- 不经过任何中转服务器

---

## 文件操作安全

### 路径安全

StoryForge 对所有文件路径进行严格验证：

| 检查项 | 说明 |
|--------|------|
| 路径穿越检测 | 禁止 `..` 等路径遍历攻击 |
| 危险路径禁止 | 禁止访问系统敏感目录 |
| 扩展名白名单 | 仅允许操作视频/音频/图片等合法文件类型 |
| 文件大小限制 | 单文件最大 50GB（可配置） |

---

## 命令执行安全

### FFmpeg 白名单

StoryForge 仅允许执行经过白名单验证的 FFmpeg 命令：

```typescript
// 允许的命令
const ALLOWED_COMMANDS = ['ffmpeg', 'ffprobe']

// 危险命令关键词检测
const BLOCKED_PATTERNS = [
  'rm -rf',
  '| sh',
  '; sh',
  '&& sh',
]
```

---

## 数据隐私

### 本地处理优先

- 🎬 视频内容仅在本地处理
- 🤖 AI 分析时，视频片段会上传到 AI 服务商（使用他们的隐私政策）
- 📝 生成的字幕和脚本保存在本地

### 网络请求安全

- ✅ 所有 AI API 请求使用 HTTPS
- ✅ 验证服务器证书
- ✅ 不发送敏感系统信息到第三方

---

## 漏洞报告

如果你发现安全漏洞，请通过以下方式私下报告：

| 方式 | 说明 |
|------|------|
| GitHub Security Advisory | [报告安全漏洞](https://github.com/Agions/StoryForge/security/advisories/new) |

**请不要**在公开的 GitHub Issues 中报告安全问题。

---

## 相关文档

- 🔧 [配置参考](./ai-config.md) — API Key 配置详解
- 🤖 [AI 模型配置](./ai-config.md) — AI 服务集成
- 📐 [架构概览](./architecture.md) — 系统架构
