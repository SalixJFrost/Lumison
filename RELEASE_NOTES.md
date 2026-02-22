# Lumison v1.0.1 Release Notes

## 🎉 新功能

### 歌词系统优化
- ✅ 添加歌词源黑名单机制（失败的源会被临时禁用 5 分钟）
- ✅ 修复 Lyrics.ovh API 参数顺序问题
- ✅ 优化第三方歌词 API（现支持 7 个源）
- ✅ 移除不稳定的歌词源（LyricWiki、Genius）
- ✅ 减少控制台错误信息，提升性能

### 多平台构建支持
- ✅ 支持 Windows（NSIS + MSI 安装包）
- ✅ 支持 macOS（Universal DMG，支持 Intel + Apple Silicon）
- ✅ 支持 Linux（AppImage + deb）
- ✅ 支持 Android（APK + AAB）
- ✅ 添加自动化构建工作流（GitHub Actions）
- ✅ 提供本地构建脚本（build.ps1 和 build.sh）

## 📚 文档更新
- 新增 `docs/BUILD.md` - 详细的多平台构建指南
- 更新 `docs/LYRICS_SYSTEM.md` - 歌词系统文档
- 更新 `README.md` - 添加构建说明

## 🐛 Bug 修复
- 修复歌词搜索时的重复代码问题
- 修复 CORS 和混合内容安全问题
- 优化内嵌歌词提取性能（添加超时机制）

## 🔧 技术改进
- 并行搜索策略：网易云音乐 + 7 个第三方 API 同时搜索
- 黑名单机制：失败的源 5 分钟内不再尝试
- 所有外部请求强制使用 HTTPS
- 简化 CORS 代理配置

## 📦 下载

### Windows
- **NSIS 安装包**（推荐）: `Lumison_1.0.1_x64-setup.exe`
- **MSI 安装包**（企业版）: `Lumison_1.0.1_x64_en-US.msi`

### macOS
- **Universal DMG**（Intel + Apple Silicon）: `Lumison_1.0.1_universal.dmg`

### Linux
- **AppImage**: `lumison_1.0.1_amd64.AppImage`
- **Debian 包**: `lumison_1.0.1_amd64.deb`

### Android
- **APK**（直接安装）: `lumison_1.0.1_universal.apk`
- **AAB**（Google Play）: `lumison_1.0.1_universal.aab`

### Web 版本
访问: https://salixjfrost.github.io/Lumison/

## 🙏 致谢

感谢所有贡献者和用户的支持！

## 📝 完整更新日志

查看所有提交: https://github.com/SalixJFrost/Lumison/compare/v1.0.0...v1.0.1

---

**安装说明**: 请参阅 [docs/BUILD.md](docs/BUILD.md) 了解详细的安装和构建说明。

**问题反馈**: 如遇到问题，请在 [GitHub Issues](https://github.com/SalixJFrost/Lumison/issues) 提交。
