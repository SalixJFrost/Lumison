# Lumison 更新器设置脚本 (Windows PowerShell)
# 用于生成签名密钥和配置更新功能

$ErrorActionPreference = "Stop"

Write-Host "🔐 Lumison 更新器设置" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 Tauri CLI
$tauriInstalled = Get-Command tauri -ErrorAction SilentlyContinue
if (-not $tauriInstalled) {
    Write-Host "❌ Tauri CLI 未安装" -ForegroundColor Red
    Write-Host "正在安装 Tauri CLI..." -ForegroundColor Yellow
    npm install -g @tauri-apps/cli
    Write-Host "✅ Tauri CLI 安装完成" -ForegroundColor Green
    Write-Host ""
}

# 创建密钥目录
$keysDir = Join-Path $env:USERPROFILE ".tauri"
if (-not (Test-Path $keysDir)) {
    New-Item -ItemType Directory -Path $keysDir | Out-Null
}

$keyFile = Join-Path $keysDir "lumison.key"

# 检查是否已存在密钥
$regenerate = $true
if (Test-Path $keyFile) {
    Write-Host "⚠️  密钥文件已存在: $keyFile" -ForegroundColor Yellow
    $response = Read-Host "是否要重新生成密钥？(y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "使用现有密钥" -ForegroundColor Green
        $regenerate = $false
    }
}

# 生成密钥
if ($regenerate) {
    Write-Host "🔑 生成签名密钥..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "请设置密钥密码（可选，直接回车跳过）：" -ForegroundColor Yellow
    
    tauri signer generate -w $keyFile
    
    Write-Host ""
    Write-Host "✅ 密钥生成完成！" -ForegroundColor Green
    Write-Host ""
}

# 显示密钥信息
Write-Host "📋 密钥信息：" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan
Write-Host ""
Write-Host "私钥位置: $keyFile" -ForegroundColor White
Write-Host ""

# 显示私钥内容（用于 GitHub Secrets）
Write-Host "私钥内容（需要添加到 GitHub Secrets）：" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
Write-Host "Secret 名称: TAURI_SIGNING_PRIVATE_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "复制以下内容（包括 BEGIN 和 END 行）：" -ForegroundColor Yellow
Write-Host ""
Get-Content $keyFile | Write-Host -ForegroundColor White
Write-Host ""
Write-Host ""

# 提示下一步
Write-Host "📝 下一步操作：" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 复制上面的私钥内容" -ForegroundColor White
Write-Host "2. 前往 GitHub 仓库: https://github.com/SalixJFrost/Lumison/settings/secrets/actions" -ForegroundColor White
Write-Host "3. 点击 'New repository secret'" -ForegroundColor White
Write-Host "4. 名称: TAURI_SIGNING_PRIVATE_KEY" -ForegroundColor Yellow
Write-Host "5. 值: 粘贴私钥内容" -ForegroundColor White
Write-Host "6. 如果设置了密码，添加另一个 secret:" -ForegroundColor White
Write-Host "   名称: TAURI_SIGNING_PRIVATE_KEY_PASSWORD" -ForegroundColor Yellow
Write-Host "   值: 你的密码" -ForegroundColor White
Write-Host ""
Write-Host "7. （可选）如果需要，复制公钥并添加到 src-tauri/tauri.conf.json:" -ForegroundColor White
Write-Host '   "plugins": {' -ForegroundColor Gray
Write-Host '     "updater": {' -ForegroundColor Gray
Write-Host '       "pubkey": "YOUR_PUBLIC_KEY_HERE"' -ForegroundColor Gray
Write-Host '     }' -ForegroundColor Gray
Write-Host '   }' -ForegroundColor Gray
Write-Host ""
Write-Host "✅ 设置完成后，推送带标签的提交即可触发构建：" -ForegroundColor Green
Write-Host "   git tag v1.0.3" -ForegroundColor Yellow
Write-Host "   git push origin v1.0.3" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 详细文档: docs/UPDATE_SETUP.md" -ForegroundColor Cyan
