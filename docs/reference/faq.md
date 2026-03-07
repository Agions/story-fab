# 常见问题

## 1. 编辑页出现“加载项目失败”

建议检查：

- 项目 ID 是否正确
- 项目文件是否存在于 AppData 目录
- 是否误把 `.json` 文件名当作项目 ID 传入

## 2. 编辑页感觉一直在刷新

建议检查：

- 自动保存是否开启
- 开发环境是否受 StrictMode 双执行影响
- 是否有页面级状态在静默保存时被反复写入

## 3. 项目列表加载失败

建议检查：

- Tauri 后端命令是否已注册：`list_project_files`
- 前后端命令名是否一致
- AppData 目录权限是否正常

## 4. 打包 DMG 失败

可执行：

```bash
npm run tauri:build:dmg
```

该命令会在官方 DMG 脚本失败时自动兜底转换。

## 5. FFmpeg 未检测到

请先本地安装 FFmpeg，并确保命令行可访问：

```bash
ffmpeg -version
```
