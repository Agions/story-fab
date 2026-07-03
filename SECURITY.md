# 安全策略

## 版本支持

| 版本 | 支持状态 |
|------|----------|
| 2.x | ✅ 当前版本，积极维护 |
| 1.x | ❌ 已停止支持 |

## 报告安全漏洞

**请勿通过公开 Issue 报告安全漏洞！**

如果你发现安全漏洞，请通过以下方式报告：

- **邮箱**：`agions@qq.com`
- **主题**：`[SECURITY] StoryFab 安全漏洞报告`

我们会在 **48 小时内** 响应，并在 **7 天内** 提供修复方案。

## 安全最佳实践

### 使用 StoryFab 时

1. **保持更新**
   - 始终使用最新版本
   - 关注 [GitHub Releases](https://github.com/Agions/story-fab/releases)
   - 启用自动更新（如果可用）

2. **API 密钥安全**
   - 不要在公共场所输入 API 密钥
   - 定期轮换 API 密钥
   - 使用最小权限原则

3. **本地数据保护**
   - 虽然所有处理都在本地完成，但仍建议：
   - 定期备份项目数据
   - 使用系统级加密
   - 设置强密码保护设备

4. **网络连接**
   - TTS 功能需要联网，使用可信网络
   - 避免使用公共 WiFi 进行敏感操作
   - 使用 VPN 增加安全性

### 开发时

1. **依赖管理**
   ```bash
   # 定期检查依赖漏洞
   npm audit
   npm audit fix
   ```

2. **敏感信息**
   - 永远不要提交 API 密钥、密码到代码库
   - 使用 `.env.local` 存储敏感配置
   - 确保 `.gitignore` 包含敏感文件

3. **代码审查**
   - 所有代码变更必须经过审查
   - 特别关注：
     - 文件系统操作
     - 网络请求
     - 用户输入处理
     - 第三方依赖

## 已知安全考虑

### 本地处理

StoryFab 设计为本地优先应用，所有视频处理都在本地完成：

- ✅ 视频文件不上传云端
- ✅ 字幕数据保留在本地
- ✅ 脚本内容不发送到远程服务器
- ✅ Whisper 模型完全离线运行

### 网络请求

以下功能需要网络连接：

- **TTS 配音**：Edge TTS / Azure TTS 需要网络
- **LLM 服务**：OpenAI / Claude / 国产 LLM 需要网络
- **更新检查**：检查新版本需要网络

### 数据存储

- 项目数据存储在用户目录
- 配置文件使用 JSON 格式
- 临时文件在应用退出时清理

## 漏洞披露政策

我们遵循 [Coordinated Disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure) 原则：

1. 报告漏洞后，我们会在 48 小时内确认
2. 我们会与您合作了解漏洞细节
3. 我们会在 7 天内提供修复方案
4. 修复发布后，我们会公开致谢（如果同意）

## 安全更新

安全更新会通过以下渠道发布：

- [GitHub Security Advisories](https://github.com/Agions/story-fab/security/advisories)
- [GitHub Releases](https://github.com/Agions/story-fab/releases)
- CHANGELOG.md

## 联系方式

- **安全邮箱**：`agions@qq.com`
- **GitHub**：[@Agions](https://github.com/Agions)
- **项目**：[StoryFab](https://github.com/Agions/story-fab)

## 致谢

感谢以下安全研究人员：

<!-- 安全研究人员列表将在此更新 -->

我们感谢所有负责任地披露安全漏洞的研究人员。
