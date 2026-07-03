---
title: 键盘快捷键
---

# 键盘快捷键

> 部分快捷键通过 Tauri 全局插件实现（`global-shortcut`），部分通过组件级 keydown handler 实现；下表为完整快捷键蓝图，部分条目待迁移到全局注册。

## 全局

| 快捷键 | 功能 |
| --- | --- |
| Cmd/Ctrl + O | 打开项目 |
| Cmd/Ctrl + N | 新建项目 |
| Cmd/Ctrl + S | 保存 |
| Cmd/Ctrl + Shift + S | 另存为 |
| Cmd/Ctrl + W | 关闭当前项目 |
| Cmd/Ctrl + Z | 撤销（Timeline 内已实现无修饰键 `z`） |
| Cmd/Ctrl + Shift + Z | 重做（Timeline 内已实现 `Shift+Z` / `y`） |
| Cmd/Ctrl + , | 打开设置 |

## 播放控制

| 快捷键 | 功能 |
| --- | --- |
| 空格 | 播放 / 暂停 |
| J / K / L | 逐帧后退 / 暂停 / 前进 |
| ← / → | 5 秒后退 / 前进 |
| Shift + ← / → | 1 秒后退 / 前进 |
| Home / End | 跳到开始 / 结束 |
| I / O | 设置入点 / 出点 |

## 时间线编辑

| 快捷键 | 功能 |
| --- | --- |
| Cmd/Ctrl + X / C / V | 剪切 / 复制 / 粘贴 |
| Delete | 删除选中片段 |
| Cmd/Ctrl + D | 复制片段 |
| Cmd/Ctrl + G | 分组 |
| Cmd/Ctrl + Shift + G | 取消分组 |

## 字幕

| 快捷键 | 功能 |
| --- | --- |
| F | 切换全屏预览 |
| Enter | 编辑下一条字幕 |
| Esc | 退出字幕编辑 |

## AI 工作流

| 快捷键 | 功能 |
| --- | --- |
| Cmd/Ctrl + R | 重新分析 |
| Cmd/Ctrl + Enter | 应用 AI 建议 |