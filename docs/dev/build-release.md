---
title: 构建与发布
description: StoryFab 开发构建、生产构建、CI/CD 发布
---

# 构建与发布

## 开发模式

```bash
npm install
npm run tauri -- dev         # Vite + Tauri 热重载
npm run dev               # 仅 Vite 前端
```

## 生产构建

### 当前平台

```bash
npm run tauri -- build
```

### 跨平台

```bash
npm run tauri -- build --target x86_64-pc-windows-msvc   # Windows
npm run tauri -- build --target aarch64-apple-darwin     # macOS Apple Silicon
npm run tauri -- build --target x86_64-apple-darwin      # macOS Intel
npm run tauri -- build --target x86_64-unknown-linux-gnu # Linux
```

## CI/CD

GitHub Actions 工作流位于 `.github/workflows/`：

| 文件 | 用途 |
| --- | --- |
| `main.yml` | 主 CI（type-check + lint + test + verify:all） |
| `release.yml` | 多平台构建与发布 |
| `deploy-docs.yml` | 文档站部署 |

## Release 流程

1. 更新 `package.json` 版本号
2. 更新 `src-tauri/Cargo.toml` 版本号
3. 更新 `docs/CHANGELOG.md`
4. 推送 tag（**仅从 main 分支**）：
   ```bash
   git tag v2.1.0   # 仅从 main
   git push origin v2.1.0
   ```
5. CI 自动构建三平台安装包
6. 草稿 Release 由 maintainer 发布

## 签名

| 平台 | 状态 |
| --- | --- |
| macOS | 未签名（个人证书年费 $99） |
| Windows | 未签名（企业证书年费 $400+） |
| Linux | 不需要 |

后续版本接入签名，详见 [Issues · enhancement](https://github.com/Agions/story-fab/issues?q=is%3Aopen+label%3Aenhancement)。

## Bundle 检查

CI 用 `tauri-action` 自动构建，所有产物上传到 Release：

- `StoryFab_*_x64-setup.exe`
- `StoryFab_*_aarch64.dmg` / `StoryFab_*_x64.dmg`
- `StoryFab_*_amd64.AppImage` / `StoryFab_*_amd64.deb`

## 验证

```bash
npm run test             # 单元测试
npm run test:coverage    # 覆盖率
npm run build            # 前端构建
npm run build:ci         # 前端构建 + bundle 预算
```

## 文档站

```bash
npm run docs:dev         # 本地开发
npm run docs:build       # 构建静态站
npm run docs:preview     # 预览
```

自动部署到 `https://agions.github.io/story-fab/`。