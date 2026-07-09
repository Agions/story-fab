# 命名与模块化规范（Naming & Modularization）

> StoryFab 前端命名约定。配套校验脚本：`scripts/check-naming.mjs`（仅报告、不阻塞 CI）。
> 本规范用于指导阶段化重构，逐步把存量代码收敛到统一风格。

---

## 1. 适用范围

- **前端**（`src/` 全部 TypeScript / TSX / Less 资源）：本规范全量适用。
- **Rust 后端**（`src-tauri/`，约 94 个 `.rs`）：**例外**，维持 `snake_case`，详见 §5。
- **样式目录**（`styles/`）：既有约定管理，不在文件名 kebab 范围内（校验脚本亦显式跳过）。

---

## 2. 文件名：统一 kebab-case（含角色后缀拍平）

文件名（去扩展名后）必须满足正则：

```
^[a-z][a-z0-9-]*$
```

即：**纯小写字母、数字、连字符**；不以连字符开头 / 结尾；无连续连字符。

### 2.1 角色后缀一律拍平为 kebab

带“角色点”的文件应把点替换为连字符，拍平为单个 kebab 词。这是本规范相对旧约定的核心变化——不再用 `name.role.ts`，而是 `name-role.ts`。

| 旧命名（不推荐）                | 新命名（目标）                  | 说明                         |
| ------------------------------- | ------------------------------- | ---------------------------- |
| `commentary-panel.reducer.ts`   | `commentary-panel-reducer.ts`   | Redux/useReducer reducer     |
| `commentary-panel.reducer.test.ts` | `commentary-panel-reducer-test.ts` | reducer 测试             |
| `subtitle.service.ts`           | `subtitle-service.ts`           | 服务类 / 服务单例            |
| `video.module.less`             | `video-module.less`             | CSS Module                   |
| `useFoo.test.ts`                | `use-foo-test.ts`               | 单元测试                     |
| `useFoo.test.tsx`               | `use-foo-test.tsx`              | 组件测试                     |

> 提示：`*.test.ts` / `*.test.tsx` 同时具备“测试”与“角色后缀”属性，统一归入 `role-suffix-flatten` 类别处理，避免与 §2.2 的普通文件违规重复计数。

### 2.2 完全例外（不报违规）

以下文件名不受 kebab 约束，校验脚本会跳过：

- `index.*`（各目录的 barrel / 入口）
- `*.d.ts`（类型声明文件）
- `main.tsx`、`App.tsx`（应用根入口）

---

## 3. 代码标识符

| 类别                          | 风格           | 示例                          |
| ----------------------------- | -------------- | ----------------------------- |
| 变量 / 函数                   | `camelCase`    | `extractSubtitles()`          |
| 类型（`type` / `interface`）  | `PascalCase`   | `SubtitleTrack`               |
| React 组件（导出的）          | `PascalCase`   | `VideoEditor`                 |
| 导出常量                       | `PascalCase`   | `TauriCommand`                |
| 枚举成员                      | `PascalCase`   | `Quality.High`                |

> 组件文件名用 kebab（`video-editor.tsx`），但其默认导出仍用 `PascalCase`（`export default function VideoEditor`），符合 React 惯例。

---

## 4. 目录名：kebab-case + 通用目录白名单

目录名同样要求 kebab-case，禁止 `PascalCase` / `camelCase` / 含下划线目录。

既有**通用目录**维持现状，其目录名豁免上报（内部仍会被扫描）：

```
ui  common  shared  core  stores  hooks  pages
components  providers  types  styles  test
```

**禁止目录名（升级为 error 级提示）**——语义模糊或临时性的命名，应改为具体语义：

```
util  utils  helper  helpers  misc  tmp  temp  new  old  v2
```

---

## 5. 显式例外：Rust 后端维持 snake_case

`src-tauri/` 下的 `.rs` 文件**不要求** kebab，维持 `snake_case`（如 `subtitle_extract.rs`、`auto_save.rs`）。

**技术硬约束：**

1. Rust 模块系统要求 `mod foo_bar;` 对应文件名 `foo_bar.rs`——连字符在标识符中非法，无法用 kebab 命名模块文件。
2. `snake_case` 是 Rust 生态的统一惯例（Crate / 官方风格指南），强行 kebab 会与工具链、文档、社区预期冲突。

因此本项目的命名目标**仅覆盖前端**；Rust 文件名、模块名、命令名（`generate_handler!` 注册名，如 `subtitle_extract`）一律 `snake_case`。前端调用这些命令时通过 `TauriCommand` 常量表间接引用（见 §7），不直接书写裸字符串。

---

## 6. 分层与依赖方向

前端采用分层架构，依赖方向**单向向下**：

```
core（底座）
  ↑
stores / shared
  ↑
hooks / components / pages / providers
```

约定：

- **`core` 是底座**：`types`、`errors`、`config`、`tauri`、`utils`、`pipeline`、`services`、`video`。`core` 不得反向依赖上层（`stores` / `components` / `pages` 等）。
- **`shared`**：跨层复用的纯工具（如 `logging`），不依赖具体业务。
- **`stores`**：状态层，可被 `hooks` / `components` / `pages` 依赖，但不得依赖具体组件。
- **`providers` / `hooks` / `components` / `pages`**：UI 与编排层，可依赖 `core` / `stores` / `shared`，不得被 `core` 依赖。

> 重构目标：消除 `core` 对上层的反向引用（若存在），保持底座纯净。

---

## 7. Tauri 命令桥接约定（唯一入口）

所有前端 ↔ Rust 通信**必须**经由唯一桥接入口 `src/core/tauri`，禁止在业务代码里散落裸 `invoke()` 或裸字符串命令名。

目录结构：

```
src/core/tauri/
├── command-types.ts   # TauriCommandName / TauriCommandOutput 类型
├── invoke.ts          # TauriCommand 常量表 + TauriBridgeError + 带重试的 invoke()
├── methods/           # 按域封装（video-analysis / subtitle-asr / tts / ...）
│   └── subtitle-asr.ts
└── index.ts           # 聚合为 tauri 对象（默认导出）
```

约定细则：

1. **常量表**：`invoke.ts` 中的 `TauriCommand` 枚举所有 Rust 命令名（`snake_case` 字符串常量），前后端以此对齐，杜绝裸字符串。
2. **统一错误**：所有桥接失败抛出 `TauriBridgeError`（携带 `command`、是否 `retryable`、原始 `cause`），便于统一上报与重试决策。
3. **重试**：`invoke()` 支持 `BridgeOptions.retries` 与 `AbortSignal`，指数退避后封装为 `TauriBridgeError`。
4. **按域封装**：`methods/*` 把原始命令包装成语义化方法（如 `subtitleAsr.extractSubtitles(...)`），处理参数整形与返回类型断言。
5. **聚合出口**：`index.ts` 把各 `methods/*` 聚合为 `tauri` 对象（驼峰方法名）并默认导出。业务代码统一 `import { tauri } from '@/core/tauri'` 后调用 `tauri.subtitleAsr.transcribeAudio(...)`。
6. **禁止**：业务代码不得 `import { invoke } from '@tauri-apps/api/core'` 后直接 `invoke('export_video', ...)`——这类裸调用绕过常量表、重试与统一错误，是已知的架构坏味（见 `docs/ARCHITECTURE.md`）。

---

## 8. 校验脚本使用

```bash
# 运行命名校验（仅报告，退出码恒为 0）
node scripts/check-naming.mjs

# 语法检查
node --check scripts/check-naming.mjs
```

脚本输出三类分组清单（文件命名违规 / 目录命名违规 / 角色后缀拍平）及各类计数汇总。重构期间以该清单作为待办 backlog，逐步收敛。

---

## 9. 迁移建议（存量代码）

- **角色后缀拍平**：`*.reducer.ts` → `*-reducer.ts`、`*.service.ts` → `*-service.ts`、`*.module.less` → `*-module.less`、`*.test.ts(x)` → `*-test.ts(x)`。需同步修改所有 `import` 路径与 `vitest` 配置（如 `include` 模式）。
- **目录 kebab**：`Highlights/` 等 PascalCase 目录重命名为 `highlights/`，同步更新引用。
- **禁止目录**：`util/` / `misc/` 等按语义拆分重命名。
- 改名建议配合 IDE 的“重命名/移动”重构，确保导入路径一致；每完成一批即跑一次校验确认计数下降。
