# Lumison Release Guide

## 自动更新系统说明

Lumison 使用 Tauri 的自动更新功能，客户端会在启动时静默检查更新。

## 发布新版本流程

### 1. 更新版本号

编辑 `src-tauri/tauri.conf.json`：

```json
{
  "version": "1.0.1"  // 递增版本号
}
```

同时更新 `src-tauri/Cargo.toml`：

```toml
[package]
version = "1.0.1"
```

### 2. 设置签名环境变量

在构建前设置环境变量（使用密码 `superadmin`）：

**PowerShell:**
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = "~\.tauri\lumison.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "superadmin"
```

**Bash:**
```bash
export TAURI_SIGNING_PRIVATE_KEY_PATH="~/.tauri/lumison.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="superadmin"
```

### 3. 构建发布版本

```bash
npm run tauri:build
```

这会生成：
- `src-tauri/target/release/bundle/msi/Lumison_x.x.x_x64_en-US.msi`
- `src-tauri/target/release/bundle/msi/Lumison_x.x.x_x64_en-US.msi.zip`
- `src-tauri/target/release/bundle/msi/Lumison_x.x.x_x64_en-US.msi.zip.sig`
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.exe`
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.nsis.zip`
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.nsis.zip.sig`

### 4. 创建 GitHub Release

1. 前往 https://github.com/SalixJFrost/Lumison/releases/new
2. 创建新标签：`v1.0.1`
3. 填写发布说明
4. 上传以下文件：
   - `Lumison_x.x.x_x64_en-US.msi.zip`
   - `Lumison_x.x.x_x64_en-US.msi.zip.sig`
   - `Lumison_x.x.x_x64-setup.nsis.zip`
   - `Lumison_x.x.x_x64-setup.nsis.zip.sig`
   - `latest.json` (自动生成在 `src-tauri/target/release/` 目录)

5. 发布 Release

### 5. 客户端更新流程

客户端会自动：
1. 启动时检查更新（3秒后）
2. 发现新版本后在右下角显示通知
3. 用户点击"Update Now"开始下载
4. 下载完成后自动安装并重启

## 更新配置

更新配置在 `src-tauri/tauri.conf.json`：

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/SalixJFrost/Lumison/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFNUVDOThFQTEzQ0M5OTgKUldTWXlUeWhqc2xlbm5MblFlMzZmZGtrWktJcTJOQm5YaVJXbnBkbjVmdk9DUCtyVGY2QlFHMFEK"
    }
  }
}
```

## 安全注意事项

⚠️ **重要：私钥安全**

- 私钥文件：`~/.tauri/lumison.key`
- 密码：`superadmin`
- **绝对不要**将私钥提交到 Git
- **绝对不要**公开私钥密码（仅用于本地构建）

## 测试更新

在开发环境测试更新：

1. 构建当前版本并安装
2. 递增版本号
3. 重新构建并发布到 GitHub
4. 启动已安装的应用
5. 等待更新通知出现

## 故障排除

### 更新检查失败

- 检查网络连接
- 确认 GitHub Release 已发布
- 验证 `latest.json` 文件存在

### 签名验证失败

- 确认使用了正确的私钥
- 检查环境变量是否正确设置
- 验证公钥在 `tauri.conf.json` 中正确配置

### 更新下载失败

- 检查文件大小限制
- 确认 GitHub Release 文件可访问
- 查看控制台错误日志
