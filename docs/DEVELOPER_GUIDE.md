# cut-deck 开发者指南

## 1. 开发环境搭建

### 1.1 前置依赖

```bash
# Node.js 18+
node --version  # >= 18.0.0

# Rust 1.75+
rustc --version  # >= 1.75.0
cargo --version

# FFmpeg（系统命令）
ffmpeg -version
ffprobe -version
```

### 1.2 克隆与安装

```bash
git clone https://github.com/Agions/cut-deck.git
cd cut-deck
npm install
```

### 1.3 启动开发服务器

```bash
# 前后端一起跑（Tauri dev window）
npm run tauri dev

# 仅前端（Vite dev server，Mock Rust 调用）
npm run dev
# 访问 http://localhost:1430
```

> 💡 首次运行 `npm run tauri dev` 会自动下载 Rust 工具链，请确保网络畅通。

### 1.4 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CUTDECK_FFMPEG_PATH` | 系统 PATH 中的 `ffmpeg` | FFmpeg 可执行文件路径 |
| `CUTDECK_FFPROBE_PATH` | 系统 PATH 中的 `ffprobe` | FFprobe 可执行文件路径 |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Edge TTS 路径 |
| `RUST_LOG` | `cutdeck=info,warn` | Rust 日志级别 |

---

## 2. 项目结构速查

```
cut-deck/
├── src/                         # React 前端（TypeScript）
├── src-tauri/                   # Rust 后端
├── docs/                        # 项目文档
├── scripts/                     # 构建脚本
├── public/                      # 静态资源
├── package.json
└── vite.config.ts
```

---

## 3. 前端开发

### 3.1 技术栈

- **React 18** + TypeScript 5
- **Vite 6** — 开发服务器 + 构建
- **Tailwind CSS 4** — 样式（OKLCH 色彩空间）
- **shadcn/ui** — 基础组件库
- **Zustand v5** — 状态管理

### 3.2 添加新组件

```bash
# 在 components/ 下按模块目录组织
src/components/
└── MyFeature/
    ├── index.tsx          # 入口
    ├── MyComponent.tsx     # 主组件
    ├── SubComponent.tsx    # 子组件
    ├── hooks/
    │   └── useMyFeature.ts
    └── types.ts
```

### 3.3 调用 Rust 命令

通过 `TauriBridge` 封装类调用 Rust IPC 命令：

```typescript
import { TauriBridge } from '@/core/tauri/TauriBridge';

// 定义输入/输出类型（参考 src-tauri/src/types.rs）
interface MyInput {
  videoPath: string;
  threshold: number;
}

// 调用
const result = await TauriBridge.invoke<MyOutput>('my_command', myInput);
```

### 3.4 状态管理

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyStore {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { name: 'my-store' }
  )
);
```

### 3.5 常用命令

```bash
# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint

# 运行测试
npm test

# 运行 Vitest（单元测试）
npm run test:unit

# Vite 构建（生产）
npm run build

# Tauri 构建（桌面应用）
npm run tauri build
```

---

## 4. Rust 后端开发

### 4.1 添加新命令

**步骤 1**：在 `src-tauri/src/commands/` 下创建文件，例如 `hello.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HelloInput {
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HelloOutput {
    pub message: String,
}

#[tauri::command]
pub fn greet(input: HelloInput) -> HelloOutput {
    HelloOutput {
        message: format!("Hello, {}!", input.name),
    }
}
```

**步骤 2**：在 `commands/mod.rs` 中注册：

```rust
pub mod hello;
```

**步骤 3**：在 `lib.rs` 中 re-export 并注册到 `invoke_handler`：

```rust
pub use commands::hello::greet;
// ...
pub use commands::hello::{greet, HelloInput, HelloOutput};
// 在 generate_handler! 中添加 greet,
```

### 4.2 添加新算法模块

**步骤 1**：在 `src-tauri/src/` 下创建 `my_algorithm.rs`：

```rust
//! 我的算法模块 — 简短描述
use serde::{Deserialize, Serialize};

pub struct MyAlgo;

impl MyAlgo {
    pub fn process(&self, data: &[u8]) -> Result<Vec<f32>, String> {
        // 实现
    }
}
```

**步骤 2**：在 `lib.rs` 中注册：

```rust
pub mod my_algorithm;
```

### 4.3 编译与调试

```bash
# 检查 Rust 代码（不触发完整构建）
cd src-tauri && cargo check

# 运行 Rust 测试
cargo test

# 详细构建输出
cargo build -vv

# 仅构建 Tauri 应用（无前端）
cargo build --release
```

### 4.4 常见 Rust 编译错误

| 错误 | 解决方法 |
|------|----------|
| `unused imports` | 删除未使用的 `use` 语句 |
| `dead_code` | 给暂时不用的代码加 `#[allow(dead_code)]` 或删除 |
| `type mismatch` | 检查 `#[serde(rename_all = "camelCase")]` 是否匹配 TS 字段 |
| `tokio await in non-async fn` | 确保函数签名是 `async fn` |

---

## 5. 测试

### 5.1 前端测试（Vitest）

```bash
# 运行所有测试
npm test

# 监听模式（文件变化时重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

测试文件规范：

```typescript
// 放在待测文件同目录下
myFeature.test.ts

// 使用 Vitest
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFeature';

describe('myFunction', () => {
  it('should return correct result', () => {
    expect(myFunction(1, 2)).toBe(3);
  });
});
```

### 5.2 Rust 测试

```bash
cd src-tauri
cargo test
cargo test -- --nocapture    # 打印输出
cargo test my_module         # 运行特定模块测试
```

---

## 6. 调试

### 6.1 前端调试

- **React DevTools**：浏览器扩展
- **Vite source maps**：浏览器 DevTools 直接看 TSX 源码
- **Zustand DevTools**：`zustand/middleware` 的 `devtools`

### 6.2 Rust 日志

Rust 后端使用 `tracing` 记录日志：

```rust
tracing::info!("处理视频: {:?}", video_path);
tracing::warn!("FFmpeg 未安装，使用模拟数据");
tracing::error!("导出失败: {}", err);
```

日志输出到：
- **开发模式**：`stderr`
- **发布模式**：Tauri 日志文件

### 6.3 FFmpeg 调试

```bash
# 手动测试 FFmpeg 命令
ffmpeg -i input.mp4 -ss 0 -to 10 -c copy output.mp4

# 查看详细日志
ffmpeg -i input.mp4 -v debug output.mp4 2>&1 | less

# 检查 FFmpeg 是否安装
npm run tauri dev -- -f "Check FFmpeg"
```

---

## 7. 构建与发布

### 7.1 构建桌面应用

```bash
# 完整构建（前端 + Rust）
npm run tauri build

# 仅 Rust 后端（用于快速迭代）
cd src-tauri && cargo build --release
```

产物位置：

| 平台 | 路径 |
|------|------|
| Windows | `src-tauri/target/release/bundle/nsis/*.exe` |
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` |
| Linux | `src-tauri/target/release/bundle/deb/*.deb` |

### 7.2 版本管理

```bash
# 更新版本（三处需同步）
1. src-tauri/Cargo.toml       [package.version]
2. package.json                [dependencies.@agions/cutdeck-tauri]
3. docs/CHANGELOG.md          [## [Unreleased] → ## vX.Y.Z]
```

---

## 8. 代码规范

### 8.1 Commit 规范

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
refactor: 重构（无功能变化）
chore: 构建/工具变化
test: 测试
```

示例：

```bash
git commit -m "feat(clip-pipeline): 新增 AI 导演计划命令"
git commit -m "fix(render): 修复 cancel_export 在极端并发下竞态"
git commit -m "docs: 新增 ARCHITECTURE.md 深度架构文档"
```

### 8.2 Rust 规范

- 使用 `#[derive(Debug, Clone, Serialize, Deserialize)]` 时搭配 `#[serde(rename_all = "camelCase")]`
- 错误返回 `Result<T, String>` 而非 `panic!`
- 使用 `tracing` 而非 `println!` 记录日志
- 避免 `unwrap()`，使用 `?` 或 `unwrap_or_else`

### 8.3 TypeScript 规范

- 严格模式：所有类型显式标注
- 接口优于类型别名（`interface` vs `type`）
- 使用 `@/` 路径别名引用同项目模块
- React 组件：函数组件 + Hooks，不使用 class 组件

---

## 9. 常见问题

### Q: `npm run tauri dev` 启动失败？

```bash
# 1. 确认 Rust 环境
rustc --version  # >= 1.75

# 2. 安装 Tauri CLI
npm install -D @tauri-apps/cli

# 3. 安装前端依赖
npm install

# 4. 重新运行
npm run tauri dev
```

### Q: Whisper 字幕功能不工作？

确认 `faster-whisper` 已安装：

```bash
pip install faster-whisper
# 或
pip3 install faster-whisper
```

未安装时应用会降级为模拟数据，不影响其他功能。

### Q: FFmpeg 找不到？

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows: 下载 ffmpeg.exe 并加入 PATH
# 或设置环境变量
# set CUTDECK_FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
```

### Q: 桌面应用签名/公证（macOS）？

首次在 macOS 运行 cut-deck 时，右键点击应用图标选择"打开"。如遇系统拦截：

```bash
sudo xattr -rd com.apple.quarantine "/Applications/cut-deck.app"
```
