# StoryFab 品牌设计系统

## 品牌标识

### Logo 变体

#### 主要 Logo（水平布局）
![Logo Horizontal](assets/logo-horizontal-enhanced.svg)
- **用途**：网站头部、文档页眉、营销材料
- **最小尺寸**：宽度 200px
- **文件**：`assets/logo-horizontal-enhanced.svg`

#### Icon（图标）
![Logo Icon](assets/logo-icon.svg)
- **用途**：应用图标、Favicon、社交媒体头像
- **最小尺寸**：64×64px
- **文件**：`assets/logo-icon.svg`

#### 品牌 Monogram（SF标志）
- **用途**：紧凑空间、水印、品牌标记
- **设计元素**：胶片横条 + SF字母组合 + 播放指示点

### 色彩系统

#### 主色调
| 名称 | 色值 | 用途 |
|------|------|------|
| **品牌渐变** | `#7C3AED → #EC4899 → #F59E0B` | 主要强调、CTA按钮、active状态 |
| **深色背景** | `#0B0F1F` | 主背景、卡片背景 |
| **次背景** | `#1A1F3A` | 次级背景、hover状态 |

#### 功能色
| 名称 | 色值 | 用途 |
|------|------|------|
| **成功色** | `#10B981` | 成功状态、隐私保障 |
| **信息色** | `#3B82F6` | 提示信息 |
| **警告色** | `#F59E0B` | 注意提示 |
| **错误色** | `#EF4444` | 错误状态 |

#### 文本色
| 名称 | 色值 | 用途 |
|------|------|------|
| **主文本** | `#F8FAFC` | 主要文字 |
| **次文本** | `#94A3B8` | 辅助文字、说明文字 |
| **禁用文本** | `#64748B` | 禁用状态 |

#### 渐变应用
```css
/* 品牌渐变 */
background: linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%);

/* 柔和渐变 */
background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);

/* 暗色背景 */
background: linear-gradient(135deg, #0B0F1F 0%, #1A1F3A 100%);
```

---

## 功能图标

### 核心特性图标

| 图标 | 文件名 | 描述 | 适用场景 |
|------|--------|------|----------|
| 🎬 视频剪辑 | `video-mode.svg` | 视频 + 播放按钮 | 剪辑模式、视频编辑 |
| 🤖 AI Agent | `ai-agent.svg` | 电路图案 + 连接点 | AI功能、智能分析 |
| 🗣️ TTS配音 | `tts-voice.svg` | 声波图形 | 配音、音频处理 |
| 📤 导出 | `export.svg` | 箭头向上 + 格式标签 | 导出、分享功能 |
| 🔒 隐私保护 | `privacy.svg` | 盾牌 + 勾选 | 隐私、安全、本地处理 |

**设计原则**：
- 统一圆角容器 (rx="12")
- 深色背景 (#0B0F1F)
- 品牌渐变主元素
- 单色强调点

---

## 字体规范

### 系统字体栈
```css
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 字重要求
| 层级 | 字重 | 用途 |
|------|------|------|
| **Display** | 700 (Bold) | 标题、H1 |
| **Heading** | 600 (Semibold) | H2-H4 |
| **Body** | 400 (Regular) | 正文 |
| **Caption** | 400 (Regular) | 说明文字 |

### 字号比例
```
H1: 42px / 2.25rem (2.625rem line-height)
H2: 32px / 2rem (2.5rem line-height)
H3: 24px / 1.5rem (2rem line-height)
H4: 20px / 1.25rem (1.75rem line-height)
Body: 16px / 1rem (1.75rem line-height)
Small: 14px / 0.875rem (1.5rem line-height)
```

---

## 间距与布局

### 8px 网格系统
所有间距基于 8px 基础单位：
- `4px` = 0.5 单位（细微间距）
- `8px` = 1 单位（元素内间距）
- `16px` = 2 单位（相关元素间距）
- `24px` = 3 单位（分组间距）
- `32px` = 4 单位（节间距）
- `48px` = 6 单位（主要区块间距）
- `64px` = 8 单位（页面级间距）

### 圆角规范
| 类型 | 半径 | 应用 |
|------|------|------|
| **卡片圆角** | `8px` | 普通卡片 |
| **按钮圆角** | `6px` | 按钮、标签 |
| **大型圆角** | `16px` | 图像、展示卡片 |
| **超大型圆角** | `48px` | Logo背景、模态框 |

---

## UI 组件模式

### 按钮样式

#### 主按钮（CTA）
```html
<button class="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500
               text-white px-6 py-3 rounded-lg font-semibold
               hover:shadow-lg hover:shadow-purple-500/30
               transition-all duration-200">
  立即开始
</button>
```

#### 次按钮
```html
<button class="border border-purple-500/30 text-purple-400
               px-6 py-3 rounded-lg font-medium
               hover:bg-purple-500/10 transition-colors">
  了解更多
</button>
```

### 卡片样式

#### 特性卡片
```html
<div class="bg-gradient-to-br from-[#0B0F1F] to-[#1A1F3A]
            rounded-2xl p-6 border border-purple-500/10
            hover:border-purple-500/30 transition-all">
  <!-- Card content -->
</div>
```

### 渐变边框
```html
<div class="relative">
  <div class="absolute inset-0 bg-gradient-to-r
              from-purple-600 via-pink-500 to-amber-500
              rounded-xl opacity-20"></div>
  <div class="relative bg-[#0B0F1F] rounded-xl">
    <!-- Content -->
  </div>
</div>
```

---

## 使用指南

### Logo 使用规则

✅ **推荐使用**：
- 保持 Logo 的原始比例
- 在深色背景上使用白色版本
- 提供足够的留白空间（至少 16px）

❌ **禁止使用**：
- 拉伸或压缩 Logo
- 更改品牌渐变色
- 添加额外效果（阴影、滤镜等）
- 在低分辨率下使用

### 图标使用规则

✅ **推荐使用**：
- 在统一尺寸的网格中展示（建议 64×64 或 128×128）
- 保持深色背景容器
- 与文字标签配对使用

❌ **禁止使用**：
- 单独使用图标元素（破坏一致性）
- 更改配色方案
- 在亮色背景上直接使用

---

## 文档站特殊样式

### VitePress 自定义

#### Hero 区域增强
```markdown
hero:
  name: StoryFab
  text: AI 影视解说创作工坊
  tagline: 本地优先 · 全链路本地处理
  image:
    src: /logo.svg
    alt: StoryFab
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 查看演示
      link: https://github.com/Agions/story-fab
```

#### 特性徽章
```markdown
::: tip 💡 提示
使用 Director Agent 可以在5步内自动生成完整解说视频。
:::

::: info ℹ️ 信息
支持 Windows、macOS 和 Linux 三大平台。
:::

::: warning ⚠️ 注意
首次启动需要联网下载 FFmpeg 和 Whisper 二进制文件。
:::

::: danger 🔒 隐私
所有视频处理在本地完成，原始素材永不上传云端。
:::
```

### 代码块样式

#### 带标题的代码块
```markdown
```bash
# 安装依赖
npm install

# 启动开发模式
npm run tauri -- dev
```
```

#### 行号高亮
```markdown
```ts{4,6-8}
interface VideoMeta {
  id: string;
  path: string;
  duration: number;  // 高亮行
  resolution: {
    width: number;
    height: number;
  };
}
```
```

---

## 动画与交互

### 过渡效果

#### 颜色过渡
```css
transition: all 0.2s ease-in-out;
```

#### 悬停效果
```css
.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(124, 58, 237, 0.2);
}
```

### 微交互

#### 加载状态
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(124, 58, 237, 0);
  }
}

.loading {
  animation: pulse-glow 2s infinite;
}
```

---

## 资源文件结构

```
assets/
├── logo-icon.svg              # 应用图标（256×256）
├── logo-horizontal.svg        # 水平Logo（旧版）
├── logo-horizontal-enhanced.svg # 增强版水平Logo ✨NEW
├── logo-mark.svg              # 品牌标记（旧版）

docs/public/
├── logo.svg                   # VitePress站点Logo
├── favicon.svg                # 浏览器图标
├── icons/                     # 功能图标 ✨NEW
│   ├── video-mode.svg         # 剪辑模式
│   ├── ai-agent.svg           # AI Agent
│   ├── tts-voice.svg          # TTS配音
│   ├── export.svg             # 导出
│   └── privacy.svg            # 隐私保护
```

---

## 设计灵感

### 核心设计理念

**"专业 · 智能 · 安全"**

- **专业**：通过精细的排版、一致的间距和清晰的视觉层次来体现
- **智能**：使用渐变色彩和动态元素暗示 AI 驱动的创新
- **安全**：深色主题传达隐私保护和技术可靠性的感觉

### 视觉隐喻

- **胶片横条** = 视频创作的核心
- **SF 字母组合** = 品牌识别
- **播放三角形** = 行动与导出
- **渐变色彩** = AI 的多维能力
- **电路图案** = 技术深度与智能

---

## 维护与更新

**版本**: 1.0.0
**最后更新**: 2026-07-01
**维护者**: StoryFab Team

如需更新品牌资产，请：
1. 保持设计语言的一致性
2. 更新本文档
3. 通知所有团队成员
4. 在 CHANGELOG 中记录变更
