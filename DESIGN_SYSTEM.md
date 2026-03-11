# ClipFlow X 设计规范 (2026)

## 🎬 电影导演工作室风格 - Cinema Director Studio

基于 frontend-design 技能打造的专业视频剪辑应用 UI。

---

## 设计理念

**核心风格**: 温暖的电影胶片质感 + 现代赛博工业元素

### 为什么选择这个风格？

1. **契合产品本质** - 视频剪辑是"光影的艺术"，温暖琥珀色呼应电影胶片
2. **差异化** - 告别通用的紫色/蓝色 AI 风格
3. **专业感** - 深色工作间降低视觉疲劳，适合长时间使用

---

## 色彩系统

### 主色 - 电影胶片调色板

| 名称 | 色值 | 用途 |
|------|------|------|
| **Film Amber** | `#d4a574` | 主色调、按钮高亮、选中态 |
| **Film Amber Light** | `#e8c9a8` | 悬停效果、渐变 |
| **Film Amber Glow** | `rgba(212,165,116,0.35)` | 发光效果 |

### 背景层次

| 名称 | 色值 | 用途 |
|------|------|------|
| **Void** | `#08080a` | 页面底色 |
| **Primary** | `#0d0d0f` | 主要背景 |
| **Elevated** | `#141418` | 卡片、弹窗 |
| **Surface** | `#1c1c22` | 输入框、次级元素 |
| **Card** | `rgba(28,28,34,0.7)` | 毛玻璃卡片 |

### 功能色

| 用途 | 色值 |
|------|------|
| 成功 | `#10b981` |
| 警告 | `#f59e0b` |
| 错误 | `#ef4444` |
| 信息 | `#06b6d4` |

---

## 字体系统

### 字体族

```css
--font-display: 'Outfit', sans-serif;     /* 标题 */
--font-body: 'DM Sans', sans-serif;       /* 正文 */
--font-mono: 'JetBrains Mono', monospace;  /* 代码 */
```

### 字号规范

| 级别 | 字号 | 行高 | 用途 |
|------|------|------|------|
| xs | 11px | 1.4 | 辅助信息 |
| sm | 13px | 1.5 | 次要文字 |
| base | 15px | 1.6 | 正文 |
| lg | 18px | 1.4 | 副标题 |
| xl | 22px | 1.3 | 标题 |
| 2xl | 28px | 1.2 | 大标题 |
| 3xl | 36px | 1.1 | Hero |

---

## 间距系统

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

---

## 视觉效果

### 背景纹理

```css
/* 微妙噪点纹理叠加 */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,...noise...");
  pointer-events: none;
  z-index: -1;
}

/* 渐变氛围 */
background: 
  radial-gradient(ellipse 80% 50% at 20% 0%, rgba(212, 165, 116, 0.06) 0%, transparent 50%),
  radial-gradient(ellipse 60% 40% at 80% 100%, rgba(123, 44, 191, 0.04) 0%, transparent 50%);
```

### 发光效果

```css
/* 琥珀色发光 */
box-shadow: 0 0 30px rgba(212, 165, 116, 0.35);

/* 按钮悬停 */
box-shadow: 0 0 40px rgba(212, 165, 116, 0.35), 0 4px 12px rgba(212, 165, 116, 0.4);
```

### 动画曲线

```css
/* 流畅的退出动画 */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

/* 过渡时长 */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

---

## 组件规范

### 按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #d4a574 0%, #c49464 100%);
  color: #0d0d0f;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  box-shadow: 0 0 30px rgba(212, 165, 116, 0.35);
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 0 40px rgba(212, 165, 116, 0.5);
}
```

### 卡片

```css
.card {
  background: rgba(28, 28, 34, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover {
  border-color: rgba(212, 165, 116, 0.3);
  box-shadow: 0 0 30px rgba(212, 165, 116, 0.2);
  transform: translateY(-2px);
}
```

### 输入框

```css
.ant-input {
  background: #1c1c22 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  color: #f8f8f2 !important;
}

.ant-input:focus {
  border-color: #d4a574 !important;
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.35) !important;
}
```

---

## 菜单选中态

```css
.ant-menu-item-selected {
  background: linear-gradient(90deg, rgba(212, 165, 116, 0.15) 0%, transparent 100%) !important;
  border-left: 2px solid #d4a574 !important;
}

.ant-menu-item-selected .anticon {
  color: #d4a574;
  filter: drop-shadow(0 0 6px rgba(212, 165, 116, 0.5));
}
```

---

## 页面进入动画

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## Z-Index 层级

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-overlay: 30;
--z-modal: 40;
--z-toast: 50;
--z-tooltip: 60;
```

---

## 已优化页面

| 页面 | 状态 | 说明 |
|------|------|------|
| 全局样式 | ✅ | cinema-theme.css |
| Layout | ✅ | 侧边栏 + 头部 |
| Dashboard | ✅ | 项目管理 |
| Home | ✅ | 首页 |
| Settings | ✅ | 设置页 |
| VideoEditor | 🔄 | 待优化 |
| AIVideoEditor | 🔄 | 待优化 |

---

## 下一步优化建议

1. **VideoEditor 页面** - 视频播放器暗色主题 + 时间轴样式
2. **AIVideoEditor** - AI 剪辑面板重新设计
3. **首页 Hero** - 更强的视觉冲击
4. **暗色模式切换** - 平滑过渡动画
5. **加载状态** - 骨架屏 + shimmer 动画

---

*设计规范版本: 1.0*
*最后更新: 2026-03-11*
