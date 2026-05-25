# 构建与发布

## 开发构建

```bash
# 安装依赖
npm install

# 开发模式运行（热重载）
npm run dev

# 类型检查
npm run type-check

# Lint 检查
npm run lint
```

## 生产构建

### 仅前端构建

```bash
npm run build
```

产物输出到 `dist/`。

### 完整 Tauri 应用

```bash
# 为当前平台构建 Tauri 应用
npm run tauri build

# 指定平台（Linux）
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

产物输出到 `src-tauri/target/release/bundle/`。

## 发布流水线（CI/CD）

发布通过 GitHub Actions 全自动触发。每次匹配 `v*` 的 tag 推送都会：

1. **Rust 检查** — `cargo check`（Rust 1.88.0）
2. **TypeScript 检查** — `npm run type-check`
3. **前端构建** — `npm run build`
4. **Tauri 构建** — 全平台构建（Windows、macOS x64 + ARM、Linux）
5. **创建 Release** — 上传 `.exe`、`.dmg`、`.deb` 安装包

### 触发发布

```bash
# 创建版本标签
git tag v2.0.0
git push origin v2.0.0
```

GitHub Actions 会自动构建并创建 GitHub Release。

## 版本管理

|| 文件 | 版本字段 |
|---|---|
| `package.json` | `version` |
| `src-tauri/Cargo.toml` | `version` |
| `src-tauri/tauri.conf.json` | `version` |

三者必须保持同步。使用 `scripts/bump-version.mjs` 一次更新全部。

## 代码签名

### macOS

代码签名和公证在 `.github/workflows/release.yml` 中配置，需要：

- `CODESIGN_CERT` — 代码签名证书（GitHub Actions secret）
- `APPLE_SIGNING_IDENTITY` — 证书名称（如 `Developer ID Application: Your Name (TEAMID)`）

### Windows

Windows 代码签名配置：

- `CUTDECK_CERT_PATH` — `.pfx` 证书路径
- `CUTDECK_CERT_PASSWORD` — 证书密码

## 故障排除

### FFmpeg 未找到

确保 FFmpeg 在系统 PATH 中，或设置 `CUTDECK_FFMPEG_PATH` 环境变量。

### Rust 编译失败

确保已安装 Rust 1.80+：

```bash
rustup update
rustc --version  # 应为 1.80.0+
```
