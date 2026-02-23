# 自动更新设置指南

本文档说明如何为 Lumison 配置自动更新功能。

## 概述

Lumison 使用 Tauri 的内置更新器从 GitHub Releases 获取更新。更新过程包括：

1. 应用启动时自动检查更新
2. 发现新版本时显示通知
3. 用户点击"立即更新"后下载并安装
4. 安装完成后自动重启应用

## 快速开始

### 方法 1：使用设置脚本（推荐）

**Windows:**
```powershell
.\scripts\setup-updater.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/setup-updater.sh
./scripts/setup-updater.sh
```

脚本会自动：
- 安装 Tauri CLI（如果需要）
- 生成签名密钥对
- 显示需要添加到 GitHub Secrets 的内容

### 方法 2：手动设置

#### 1. 生成签名密钥

```bash
# 安装 Tauri CLI
npm install -g @tauri-apps/cli

# 生成密钥对
tauri signer generate -w ~/.tauri/lumison.key
```

#### 2. 配置 GitHub Secrets

前往 [GitHub Secrets 设置页面](https://github.com/SalixJFrost/Lumison/settings/secrets/actions)

添加以下 Secrets：

| Secret 名称 | 说明 | 必需 |
|------------|------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | 私钥文件的完整内容 | ✅ 是 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 密钥密码（如果设置了） | ⚠️ 可选 |

**macOS 代码签名（可选）：**

| Secret 名称 | 说明 |
|------------|------|
| `APPLE_CERTIFICATE` | Apple 开发者证书（base64） |
| `APPLE_CERTIFICATE_PASSWORD` | 证书密码 |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_PASSWORD` | 应用专用密码 |
| `APPLE_TEAM_ID` | Apple 开发者团队 ID |

#### 3. 发布新版本

```bash
# 1. 更新版本号
# 编辑 package.json 和 src-tauri/tauri.conf.json
# 例如：1.0.2 -> 1.0.3

# 2. 提交并打标签
git add .
git commit -m "chore: bump version to 1.0.3"
git tag v1.0.3

# 3. 推送
git push origin main
git push origin v1.0.3
```

#### 4. 发布 Release

1. GitHub Actions 会自动构建所有平台
2. 前往 [Releases 页面](https://github.com/SalixJFrost/Lumison/releases)
3. 找到自动创建的 Draft Release
4. 编辑发布说明
5. 点击 "Publish release"

## 工作原理

### 更新检查流程

```
应用启动
    ↓
等待 3 秒
    ↓
请求 latest.json
    ↓
比较版本号
    ↓
┌─────────────┐
│ 有新版本？   │
└─────────────┘
    ↓ 是        ↓ 否
显示通知      静默结束
    ↓
用户点击"立即更新"
    ↓
下载更新包
    ↓
验证签名
    ↓
安装更新
    ↓
重启应用
```

### 文件结构

发布后的 Release 包含：

```
Release v1.0.3/
├── latest.json                          # 更新清单
├── Lumison_1.0.3_x64-setup.nsis.zip    # Windows 安装包
├── Lumison_1.0.3_x64-setup.nsis.zip.sig # Windows 签名
├── Lumison_1.0.3_x64.app.tar.gz        # macOS Intel 包
├── Lumison_1.0.3_x64.app.tar.gz.sig    # macOS Intel 签名
├── Lumison_1.0.3_aarch64.app.tar.gz    # macOS Apple Silicon 包
├── Lumison_1.0.3_aarch64.app.tar.gz.sig # macOS Apple Silicon 签名
├── Lumison_1.0.3_amd64.AppImage.tar.gz # Linux 包
└── Lumison_1.0.3_amd64.AppImage.tar.gz.sig # Linux 签名
```

### latest.json 格式

```json
{
  "version": "1.0.3",
  "notes": "查看发布说明了解详情",
  "pub_date": "2024-02-23T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.3/Lumison_1.0.3_x64-setup.nsis.zip"
    },
    "darwin-x86_64": { ... },
    "darwin-aarch64": { ... },
    "linux-x86_64": { ... }
  }
}
```

## 配置说明

### Tauri 配置 (src-tauri/tauri.conf.json)

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/SalixJFrost/Lumison/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

**配置项说明：**

- `active`: 启用/禁用更新器
- `endpoints`: 更新清单 URL 列表
- `windows.installMode`: Windows 安装模式
  - `passive`: 静默安装（推荐）
  - `basicUi`: 显示基本 UI
  - `quiet`: 完全静默

### GitHub Actions 配置

工作流文件：`.github/workflows/build-release.yml`

**触发条件：**
- 推送标签（`v*`）
- 手动触发

**构建平台：**
- Windows (x64)
- macOS (Universal: Intel + Apple Silicon)
- Linux (x64)
- Android (APK + AAB)

## 故障排除

### 问题：更新检查失败

**可能原因：**
1. `latest.json` 不存在
2. 网络连接问题
3. URL 配置错误

**解决方法：**
```bash
# 检查 latest.json 是否存在
curl -I https://github.com/SalixJFrost/Lumison/releases/latest/download/latest.json

# 查看应用日志
# Windows: %APPDATA%\com.lumison.app\logs
# macOS: ~/Library/Logs/com.lumison.app
# Linux: ~/.local/share/com.lumison.app/logs
```

### 问题：签名验证失败

**可能原因：**
1. 公钥和私钥不匹配
2. 签名文件损坏
3. 私钥配置错误

**解决方法：**
1. 重新生成密钥对
2. 确保 GitHub Secrets 中的私钥完整
3. 检查签名文件是否正确生成

### 问题：下载失败

**可能原因：**
1. Release 未发布（仍是 Draft）
2. 文件名不匹配
3. 网络问题

**解决方法：**
1. 确保 Release 已发布（不是 Draft）
2. 检查 `latest.json` 中的 URL
3. 测试文件是否可访问

### 问题：安装失败

**Windows:**
- 检查是否有管理员权限
- 关闭杀毒软件重试
- 查看 Windows 事件查看器

**macOS:**
- 检查 Gatekeeper 设置
- 运行 `xattr -cr /Applications/Lumison.app`
- 查看系统日志

**Linux:**
- 检查文件权限
- 确保 AppImage 可执行
- 查看系统日志

## 测试更新功能

### 本地测试

1. 构建旧版本并安装
2. 发布新版本到 GitHub
3. 启动应用
4. 等待更新通知
5. 测试下载和安装

### 模拟更新服务器

```bash
# 创建测试 latest.json
cat > latest.json << EOF
{
  "version": "1.0.3",
  "notes": "测试更新",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "http://localhost:8000/Lumison_1.0.3_x64-setup.nsis.zip"
    }
  }
}
EOF

# 启动本地服务器
python -m http.server 8000

# 修改 tauri.conf.json 指向本地服务器
# "endpoints": ["http://localhost:8000/latest.json"]
```

## 安全最佳实践

### 1. 密钥管理

✅ **应该做：**
- 将私钥存储在 GitHub Secrets
- 使用强密码保护私钥
- 定期轮换密钥（每年一次）
- 备份私钥到安全位置

❌ **不应该做：**
- 将私钥提交到代码仓库
- 在公开场合分享私钥
- 使用弱密码或无密码
- 在多个项目间共享密钥

### 2. 发布流程

✅ **应该做：**
- 使用 Draft Release 预览
- 测试安装包后再发布
- 编写详细的发布说明
- 保留旧版本的 Release

❌ **不应该做：**
- 直接发布未测试的版本
- 删除旧版本的 Release
- 跳过版本号
- 在生产环境测试更新

### 3. 版本管理

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- `1.0.0` → `1.0.1`: 修复 bug（补丁版本）
- `1.0.0` → `1.1.0`: 新功能（次版本）
- `1.0.0` → `2.0.0`: 破坏性变更（主版本）

## 常见问题

### Q: 更新是强制的吗？

A: 不是。用户可以点击"稍后"按钮推迟更新。

### Q: 可以回滚到旧版本吗？

A: 可以。从 GitHub Releases 下载旧版本安装包手动安装。

### Q: 更新会保留用户数据吗？

A: 会。更新只替换应用程序文件，不会影响用户数据。

### Q: 支持增量更新吗？

A: 目前不支持。每次更新都会下载完整的安装包。

### Q: 可以自定义更新服务器吗？

A: 可以。修改 `tauri.conf.json` 中的 `endpoints` 配置。

### Q: 如何禁用自动更新？

A: 将 `tauri.conf.json` 中的 `active` 设为 `false`。

## 参考资料

### 官方文档

- [Tauri Updater 插件](https://v2.tauri.app/plugin/updater/)
- [Tauri Signer CLI](https://v2.tauri.app/reference/cli/#signer)
- [Tauri 构建配置](https://v2.tauri.app/reference/config/)

### 相关链接

- [GitHub Actions 文档](https://docs.github.com/cn/actions)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Lumison 发布页面](https://github.com/SalixJFrost/Lumison/releases)

## 获取帮助

遇到问题？

1. 查看 [Issues](https://github.com/SalixJFrost/Lumison/issues)
2. 搜索已有的问题
3. 创建新 Issue 并提供：
   - 操作系统和版本
   - 应用版本
   - 错误信息
   - 复现步骤

---

**提示：** 首次设置可能需要 10-15 分钟。设置完成后，后续发布只需推送标签即可。
