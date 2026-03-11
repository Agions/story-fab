# ClipFlow 项目规划

## 项目概述

**ClipFlow** - AI 驱动的智能视频剪辑桌面应用

### 核心特性
- 🤖 AI 智能剪辑 - 自动识别精彩片段
- 📝 智能字幕 - 语音转文字 + 多语言翻译
- 🎵 自动配乐 - 根据视频情绪匹配背景音乐
- 🔒 本地运行 - 数据隐私安全
- 💻 桌面应用 - Tauri 构建

---

## 架构规划

### 技术栈
```
前端: React 18 + TypeScript + Ant Design 5
桌面: Tauri 2.x
状态管理: Zustand
样式: CSS Modules + Less
AI: 多模型支持 (OpenAI, Anthropic, Google, 国内模型)
```

### 项目结构
```
src/
├── components/     # 通用组件
├── pages/         # 页面组件
├── features/      # 功能模块
├── services/      # 业务服务
├── store/         # 状态管理
├── hooks/         # 自定义 Hooks
├── utils/         # 工具函数
├── constants/     # 常量定义
└── styles/       # 全局样式
```

---

## 功能模块

### 1. 核心剪辑
- [x] 项目管理
- [x] 视频上传
- [x] 视频预览
- [x] 时间轴编辑
- [ ] 视频导出

### 2. AI 功能
- [ ] 智能分析 (场景检测、关键帧)
- [ ] 脚本生成
- [ ] 去重优化
- [ ] 智能剪辑
- [ ] 字幕生成
- [ ] 自动配乐

### 3. 工作流
- [x] 多步骤创建流程
- [ ] 任务进度监控
- [ ] 日志展示

---

## UI/UX 设计

### 风格定位
**电影导演工作室风格** - Cinema Director Studio

### 色彩系统
| 名称 | 色值 | 用途 |
|------|------|------|
| Film Amber | #d4a574 | 主色调 |
| Ink Black | #0d0d0f | 背景 |
| Surface | #1c1c22 | 卡片 |

### 已优化页面
- [x] Layout 全局布局
- [x] Dashboard 项目管理
- [x] Home 首页
- [x] Settings 设置页
- [x] VideoEditor 视频编辑器
- [x] AIVideoEditor AI 剪辑页
- [x] Projects 项目列表
- [x] ProjectEdit 项目编辑
- [x] ProjectDetail 项目详情
- [x] Editor 基础编辑器
- [x] Workflow 工作流
- [x] ScriptDetail 脚本详情

### 设计资源
- frontend-design skill: 已安装
- ui-ux-pro-max skill: 已安装

---

## 部署策略

### 云端推送更新
- GitHub Actions 自动构建
- 发布到 GitHub Releases
- 支持 Tauri 自动更新

### 本地打包
```bash
npm run tauri build
```

---

## 待办事项

### 高优先级
- [ ] 完成视频导出功能
- [ ] AI 智能分析模块
- [ ] 脚本生成器优化
- [ ] 字幕提取功能

### 中优先级
- [ ] 性能优化
- [ ] 单元测试
- [ ] CI/CD 完善

### 低优先级
- [ ] 插件系统
- [ ] 主题自定义
- [ ] 更多 AI 模型支持

---

## 版本规划

### v1.0 (目标)
- 基础项目管理
- 视频上传/预览
- 简单剪辑功能
- 导出功能

### v1.1
- AI 智能分析
- 脚本生成
- 工作流优化

### v1.2
- 字幕生成
- 自动配乐
- 更多 AI 模型

---

*规划日期: 2026-03-11*
