# 发布 Release 指南

## 快速发布流程

### 1. 更新版本号

编辑以下文件中的版本号：
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

### 2. 提交并推送

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to x.x.x"
git push lumison main
```

### 3. 创建并推送 tag

```bash
git tag vx.x.x
git push lumison vx.x.x
```

### 4. 等待自动构建

GitHub Actions 会自动：
1. 检测到新 tag
2. 构建所有平台（Windows、macOS、Linux、Android）
3. 创建 Draft Release
4. 上传所有安装包

查看构建状态：https://github.com/SalixJFrost/Lumison/actions

### 5. 发布 Release

1. 访问 https://github.com/SalixJFrost/Lumison/releases
2. 找到自动创建的草稿
3. 编辑 Release 说明
4. 点击 "Publish release"

## 常见问题

### 构建失败怎么办？

1. 查看 GitHub Actions 日志找到错误
2. 修复问题并提交
3. 删除旧 tag：
   ```bash
   git tag -d vx.x.x
   git push lumison :refs/tags/vx.x.x
   ```
4. 重新创建 tag：
   ```bash
   git tag vx.x.x
   git push lumison vx.x.x
   ```

### 如何更新已存在的 tag？

```bash
# 删除本地 tag
git tag -d vx.x.x

# 创建新 tag
git tag vx.x.x

# 强制推送
git push lumison vx.x.x --force
```

### 如何取消发布？

1. 删除 GitHub 上的 Release（如果已发布）
2. 删除 tag：
   ```bash
   git tag -d vx.x.x
   git push lumison :refs/tags/vx.x.x
   ```

## 手动构建（可选）

如果需要在本地构建：

### Windows
```powershell
.\build.ps1 windows
```

### macOS
```bash
./build.sh macos
```

### Linux
```bash
./build.sh linux
```

### Android
```bash
./build.sh android
```

## 构建配置

### Tauri 配置文件

`src-tauri/tauri.conf.json` 中的关键配置：

```json
{
  "version": "1.0.1",
  "bundle": {
    "active": true,
    "targets": "all",
    "createUpdaterArtifacts": "v1Compatible"
  }
}
```

### GitHub Actions 工作流

`.github/workflows/build-release.yml` 定义了自动构建流程：

- **触发条件**: 推送 `v*` tag 或手动触发
- **构建平台**: Windows、macOS、Linux、Android
- **产物**: 自动上传到 GitHub Release

## 版本号规范

遵循语义化版本（Semantic Versioning）：

- **主版本号**（Major）: 不兼容的 API 修改
- **次版本号**（Minor）: 向下兼容的功能性新增
- **修订号**（Patch）: 向下兼容的问题修正

示例：
- `1.0.0` → `1.0.1` (Bug 修复)
- `1.0.1` → `1.1.0` (新功能)
- `1.1.0` → `2.0.0` (重大更新)

## 自动更新

应用内置自动更新功能：
- 启动时静默检查更新
- 发现新版本时显示通知
- 用户可选择立即更新或稍后

更新配置在 `src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/SalixJFrost/Lumison/releases/latest/download/latest.json"
      ]
    }
  }
}
```

## 检查清单

发布前确认：

- [ ] 版本号已更新（3 个文件）
- [ ] 代码已提交并推送
- [ ] Tag 已创建并推送
- [ ] GitHub Actions 构建成功
- [ ] 所有平台的安装包已生成
- [ ] Release 说明已编写
- [ ] 测试安装包可以正常安装和运行

## 相关文档

- [构建指南](BUILD.md) - 详细的构建说明
- [开发指南](DEVELOPMENT.md) - 开发环境配置
- [用户指南](GUIDE.md) - 用户使用说明
