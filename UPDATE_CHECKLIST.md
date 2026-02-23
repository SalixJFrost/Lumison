# 更新功能配置清单

## ✅ 已完成

- [x] UpdateService 服务实现
- [x] UpdateNotification UI 组件
- [x] App.tsx 集成更新检查
- [x] Tauri 配置启用更新器
- [x] GitHub Actions 生成签名文件
- [x] GitHub Actions 生成 latest.json
- [x] 依赖包已安装
- [x] 文档编写完成

## ⏳ 待完成（首次设置）

### 1. 生成签名密钥

```bash
# Windows
.\scripts\setup-updater.ps1

# macOS/Linux
chmod +x scripts/setup-updater.sh
./scripts/setup-updater.sh
```

### 2. 配置 GitHub Secrets

前往：https://github.com/SalixJFrost/Lumison/settings/secrets/actions

添加 Secrets：
- [ ] `TAURI_SIGNING_PRIVATE_KEY` - 私钥内容
- [ ] `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - 密钥密码（如果有）

### 3. （可选）配置公钥

如果脚本输出了公钥，添加到 `src-tauri/tauri.conf.json`：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 4. 测试发布

```bash
# 1. 更新版本号
# 编辑 package.json: "version": "1.0.3"
# 编辑 src-tauri/tauri.conf.json: "version": "1.0.3"

# 2. 提交并打标签
git add .
git commit -m "chore: bump version to 1.0.3"
git tag v1.0.3
git push origin main
git push origin v1.0.3

# 3. 等待 GitHub Actions 完成构建

# 4. 前往 Releases 页面发布
# https://github.com/SalixJFrost/Lumison/releases
```

## 📋 发布流程（后续使用）

每次发布新版本：

1. [ ] 更新 `package.json` 版本号
2. [ ] 更新 `src-tauri/tauri.conf.json` 版本号
3. [ ] 更新 CHANGELOG（如果有）
4. [ ] 提交更改：`git commit -m "chore: bump version to x.x.x"`
5. [ ] 创建标签：`git tag vx.x.x`
6. [ ] 推送：`git push origin main && git push origin vx.x.x`
7. [ ] 等待 GitHub Actions 完成
8. [ ] 检查 Draft Release
9. [ ] 编辑发布说明
10. [ ] 发布 Release

## 🔍 验证清单

发布后验证：

- [ ] `latest.json` 存在于 Release 中
- [ ] 所有平台的安装包都已上传
- [ ] 所有 `.sig` 签名文件都已上传
- [ ] Release 状态为 Published（不是 Draft）
- [ ] 安装旧版本并测试更新通知
- [ ] 测试下载和安装流程

## 📚 文档

- 详细设置指南：[docs/UPDATE_SETUP.md](docs/UPDATE_SETUP.md)
- 中文设置指南：[docs/UPDATE_SETUP.zh-CN.md](docs/UPDATE_SETUP.zh-CN.md)

## 🆘 遇到问题？

1. 查看 [docs/UPDATE_SETUP.zh-CN.md](docs/UPDATE_SETUP.zh-CN.md) 的故障排除部分
2. 检查 GitHub Actions 日志
3. 在 Issues 中搜索类似问题
4. 创建新 Issue 寻求帮助

---

**下一步：** 运行 `.\scripts\setup-updater.ps1`（Windows）或 `./scripts/setup-updater.sh`（macOS/Linux）开始设置
