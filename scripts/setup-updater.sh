#!/bin/bash

# Lumison 更新器设置脚本
# 用于生成签名密钥和配置更新功能

set -e

echo "🔐 Lumison 更新器设置"
echo "===================="
echo ""

# 检查是否安装了 Tauri CLI
if ! command -v tauri &> /dev/null; then
    echo "❌ Tauri CLI 未安装"
    echo "正在安装 Tauri CLI..."
    npm install -g @tauri-apps/cli
    echo "✅ Tauri CLI 安装完成"
    echo ""
fi

# 创建密钥目录
KEYS_DIR="$HOME/.tauri"
mkdir -p "$KEYS_DIR"

KEY_FILE="$KEYS_DIR/lumison.key"

# 检查是否已存在密钥
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  密钥文件已存在: $KEY_FILE"
    read -p "是否要重新生成密钥？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "使用现有密钥"
        REGENERATE=false
    else
        REGENERATE=true
    fi
else
    REGENERATE=true
fi

# 生成密钥
if [ "$REGENERATE" = true ]; then
    echo "🔑 生成签名密钥..."
    echo ""
    
    # 提示输入密码
    echo "请设置密钥密码（可选，直接回车跳过）："
    tauri signer generate -w "$KEY_FILE"
    
    echo ""
    echo "✅ 密钥生成完成！"
    echo ""
fi

# 读取并显示密钥信息
echo "📋 密钥信息："
echo "============"
echo ""
echo "私钥位置: $KEY_FILE"
echo ""

# 提取公钥
echo "公钥（需要添加到 tauri.conf.json）："
echo "-----------------------------------"
tauri signer sign "$KEY_FILE" --private-key-path "$KEY_FILE" 2>&1 | grep -A 1 "Public key:" || true
echo ""

# 显示私钥内容（用于 GitHub Secrets）
echo "私钥内容（需要添加到 GitHub Secrets）："
echo "--------------------------------------"
echo "Secret 名称: TAURI_SIGNING_PRIVATE_KEY"
echo ""
echo "复制以下内容（包括 BEGIN 和 END 行）："
echo ""
cat "$KEY_FILE"
echo ""
echo ""

# 提示下一步
echo "📝 下一步操作："
echo "=============="
echo ""
echo "1. 复制上面的私钥内容"
echo "2. 前往 GitHub 仓库: https://github.com/SalixJFrost/Lumison/settings/secrets/actions"
echo "3. 点击 'New repository secret'"
echo "4. 名称: TAURI_SIGNING_PRIVATE_KEY"
echo "5. 值: 粘贴私钥内容"
echo "6. 如果设置了密码，添加另一个 secret:"
echo "   名称: TAURI_SIGNING_PRIVATE_KEY_PASSWORD"
echo "   值: 你的密码"
echo ""
echo "7. （可选）如果公钥显示在上面，复制并添加到 src-tauri/tauri.conf.json:"
echo '   "plugins": {'
echo '     "updater": {'
echo '       "pubkey": "YOUR_PUBLIC_KEY_HERE"'
echo '     }'
echo '   }'
echo ""
echo "✅ 设置完成后，推送带标签的提交即可触发构建："
echo "   git tag v1.0.3"
echo "   git push origin v1.0.3"
echo ""
echo "📖 详细文档: docs/UPDATE_SETUP.md"
