# 自动更新设置指南

本文档说明如何为 Lumison 配置自动更新功能。

## 概述

Lumison 使用 Tauri 的内置更新器从 GitHub Releases 获取更新。更新过程包括：

1. 应用启动时自动检查更新
2. 发现新版本时显示通知
3. 用户点击"立即更新"后下载并安装
4. 安装完成后自动重启应用

## 配置步骤

### 1. 生成签名密钥

更新包需要签名以确保安全性。运行以下命令生成密钥对：

```bash
# 安装 Tauri CLI（如果还没有）
npm install -g @tauri-apps/cli

# 生成密钥对
tauri signer generate -w ~/.tauri/lumison.key
```

这会生成：
- 私钥：保存在 `~/.tauri/lumison.key`
- 公钥：显示在终端输出中

### 2. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 secrets：

**必需的 Secrets：**

- `TAURI_SIGNING_PRIVATE_KEY`
  - 值：私钥文件的完整内容（包括 `-----BEGIN PRIVATE KEY-----` 等）
  - 用途：签名更新包

- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
  - 值：生成密钥时设置的密码（如果有）
  - 用途：解密私钥

**可选的 Secrets（用于 macOS 代码签名）：**

- `APPLE_CERTIFICATE`：Apple 开发者证书（base64 编码）
- `APPLE_CERTIFICATE_PASSWORD`：证书密码
- `APPLE_ID`：Apple ID 邮箱
- `APPLE_PASSWORD`：应用专用密码
- `APPLE_TEAM_ID`：Apple 开发者团队 ID

### 3. 更新 Tauri 配置

公钥已经配置在 `src-tauri/tauri.conf.json` 中：

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

如果需要修改公钥，将生成的公钥添加到配置中：

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [...],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 4. 发布新版本

1. 更新版本号：
   ```bash
   # 在 package.json 和 src-tauri/tauri.conf.json 中更新版本号
   # 例如：1.0.2 -> 1.0.3
   ```

2. 提交更改并创建标签：
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.3"
   git tag v1.0.3
   git push origin main
   git push origin v1.0.3
   ```

3. GitHub Actions 会自动：
   - 构建所有平台的安装包
   - 生成签名文件
   - 创建 `latest.json` 更新清单
   - 创建 Draft Release

4. 在 GitHub Releases 页面：
   - 检查生成的 Release
   - 编辑发布说明
   - 点击 "Publish release"

### 5. 验证更新功能

1. 安装旧版本的应用
2. 发布新版本
3. 启动应用，等待 3 秒
4. 应该看到更新通知
5. 点击"立即更新"测试下载和安装

## 更新清单格式

`latest.json` 文件格式：

```json
{
  "version": "1.0.3",
  "notes": "See release notes for details",
  "pub_date": "2024-02-23T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE...",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.3/Lumison_1.0.3_x64-setup.nsis.zip"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.3/Lumison_1.0.3_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.3/Lumison_1.0.3_aarch64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "...",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.3/Lumison_1.0.3_amd64.AppImage.tar.gz"
    }
  }
}
```

## 故障排除

### 更新检查失败

1. 检查 `latest.json` 是否存在于 Release 中
2. 验证 URL 格式是否正确
3. 检查浏览器控制台的错误信息

### 签名验证失败

1. 确保公钥和私钥匹配
2. 检查 GitHub Secrets 中的私钥是否完整
3. 验证签名文件（.sig）是否正确生成

### 下载失败

1. 检查 Release 文件是否公开可访问
2. 验证文件名是否与 `latest.json` 中的 URL 匹配
3. 检查网络连接

## 安全注意事项

1. **私钥安全**：
   - 永远不要将私钥提交到代码仓库
   - 只在 GitHub Secrets 中存储私钥
   - 定期轮换密钥

2. **签名验证**：
   - 所有更新包必须签名
   - 应用会验证签名后才安装
   - 签名不匹配会拒绝更新

3. **HTTPS**：
   - 所有更新 URL 必须使用 HTTPS
   - GitHub Releases 默认使用 HTTPS

## 参考资料

- [Tauri Updater 文档](https://v2.tauri.app/plugin/updater/)
- [Tauri Signer 文档](https://v2.tauri.app/reference/cli/#signer)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
