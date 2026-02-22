# 部署说明

## ✅ 已完成的部署步骤

### 1. 桌面应用构建
- ✅ 可执行文件：`src-tauri\target\release\lumison.exe` (8MB)
- ✅ 已测试运行
- 可以直接分发此文件给用户使用

### 2. Web 版本部署
- ✅ 已构建到 `dist/` 目录
- ✅ 已推送到 `gh-pages` 分支

### 3. GitHub Pages 配置

请按以下步骤在 GitHub 上启用 Pages：

1. 访问仓库设置：https://github.com/SalixJFrost/Lumison/settings/pages
2. 在 "Source" 下拉菜单中选择 "Deploy from a branch"
3. 在 "Branch" 下拉菜单中选择 `gh-pages`
4. 文件夹选择 `/ (root)`
5. 点击 "Save"

几分钟后，你的应用将在以下地址可用：
**https://salixjfrost.github.io/Lumison/**

## 📦 安装包打包（可选）

如果需要生成 Windows 安装包（MSI/NSIS），可以在网络稳定时运行：

```powershell
npm run tauri:build
```

注意：首次打包会下载 NSIS/WiX 工具，需要稳定的网络连接。

## 🚀 发布流程

### 桌面应用发布
1. 将 `src-tauri\target\release\lumison.exe` 上传到 GitHub Releases
2. 或者等待安装包打包完成后，上传 `.msi` 或 `.exe` 安装程序

### Web 版本更新
每次更新后运行：
```powershell
npm run build
git checkout gh-pages
git rm -rf .
Copy-Item -Recurse -Force dist/* .
git add .
git commit -m "Update web version"
git push lumison gh-pages
git checkout main
```

## 📝 注意事项

- Web 版本不包含 Tauri 桌面功能
- 桌面版本提供完整功能体验
- 建议同时提供两个版本供用户选择
