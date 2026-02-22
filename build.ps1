# Lumison 构建脚本 (Windows PowerShell)
# 用法: .\build.ps1 [windows|macos|linux|android|all]

param(
    [Parameter(Position=0)]
    [ValidateSet('windows', 'macos', 'linux', 'android', 'all', 'help')]
    [string]$Platform = 'help'
)

function Show-Help {
    Write-Host "Lumison 构建脚本" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法: .\build.ps1 [platform]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "可用平台:" -ForegroundColor Green
    Write-Host "  windows  - 构建 Windows 安装包 (NSIS + MSI)"
    Write-Host "  macos    - 构建 macOS 安装包 (DMG) [仅在 macOS 上可用]"
    Write-Host "  linux    - 构建 Linux 安装包 (AppImage + deb) [仅在 Linux 上可用]"
    Write-Host "  android  - 构建 Android 安装包 (APK + AAB)"
    Write-Host "  all      - 构建当前平台的所有可用格式"
    Write-Host "  help     - 显示此帮助信息"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\build.ps1 windows"
    Write-Host "  .\build.ps1 android"
    Write-Host ""
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Build-Windows {
    Write-Host "🔨 构建 Windows 安装包..." -ForegroundColor Cyan
    
    if (-not (Test-Command "cargo")) {
        Write-Host "❌ 错误: 未找到 Rust。请先安装 Rust: https://rustup.rs/" -ForegroundColor Red
        exit 1
    }
    
    npm run tauri:build:windows
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Windows 构建完成!" -ForegroundColor Green
        Write-Host "📦 安装包位置:" -ForegroundColor Yellow
        Write-Host "   - src-tauri\target\release\bundle\nsis\*.exe"
        Write-Host "   - src-tauri\target\release\bundle\msi\*.msi"
    } else {
        Write-Host "❌ Windows 构建失败" -ForegroundColor Red
        exit 1
    }
}

function Build-MacOS {
    Write-Host "🔨 构建 macOS 安装包..." -ForegroundColor Cyan
    
    if ($IsMacOS -or $IsLinux) {
        npm run tauri:build:macos
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ macOS 构建完成!" -ForegroundColor Green
            Write-Host "📦 安装包位置:" -ForegroundColor Yellow
            Write-Host "   - src-tauri/target/release/bundle/dmg/*.dmg"
        } else {
            Write-Host "❌ macOS 构建失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ 错误: macOS 构建只能在 macOS 系统上进行" -ForegroundColor Red
        exit 1
    }
}

function Build-Linux {
    Write-Host "🔨 构建 Linux 安装包..." -ForegroundColor Cyan
    
    if ($IsLinux) {
        npm run tauri:build:linux
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Linux 构建完成!" -ForegroundColor Green
            Write-Host "📦 安装包位置:" -ForegroundColor Yellow
            Write-Host "   - src-tauri/target/release/bundle/appimage/*.AppImage"
            Write-Host "   - src-tauri/target/release/bundle/deb/*.deb"
        } else {
            Write-Host "❌ Linux 构建失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ 错误: Linux 构建只能在 Linux 系统上进行" -ForegroundColor Red
        exit 1
    }
}

function Build-Android {
    Write-Host "🔨 构建 Android 安装包..." -ForegroundColor Cyan
    
    if (-not (Test-Command "java")) {
        Write-Host "❌ 错误: 未找到 Java。请先安装 JDK 17+" -ForegroundColor Red
        exit 1
    }
    
    # 检查是否已初始化
    if (-not (Test-Path "src-tauri\gen\android")) {
        Write-Host "📱 首次构建，正在初始化 Android 项目..." -ForegroundColor Yellow
        npm run tauri:android:init
    }
    
    Write-Host "📱 构建 APK..." -ForegroundColor Yellow
    npm run tauri:build:android:apk
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Android APK 构建完成!" -ForegroundColor Green
        
        Write-Host "📱 构建 AAB..." -ForegroundColor Yellow
        npm run tauri:build:android:aab
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Android AAB 构建完成!" -ForegroundColor Green
            Write-Host "📦 安装包位置:" -ForegroundColor Yellow
            Write-Host "   - src-tauri\gen\android\app\build\outputs\apk\**\*.apk"
            Write-Host "   - src-tauri\gen\android\app\build\outputs\bundle\**\*.aab"
        } else {
            Write-Host "❌ Android AAB 构建失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Android APK 构建失败" -ForegroundColor Red
        exit 1
    }
}

function Build-All {
    Write-Host "🔨 构建所有可用平台..." -ForegroundColor Cyan
    
    if ($IsWindows) {
        Build-Windows
    } elseif ($IsMacOS) {
        Build-MacOS
    } elseif ($IsLinux) {
        Build-Linux
    }
    
    # Android 可以在所有平台构建
    $response = Read-Host "是否也构建 Android 版本? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Build-Android
    }
}

# 主逻辑
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Lumison 构建工具 v1.0.0           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ 错误: 未找到 Node.js。请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}

# 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
}

# 执行构建
switch ($Platform) {
    'windows' { Build-Windows }
    'macos' { Build-MacOS }
    'linux' { Build-Linux }
    'android' { Build-Android }
    'all' { Build-All }
    'help' { Show-Help }
    default { Show-Help }
}

Write-Host ""
Write-Host "✨ 完成!" -ForegroundColor Green
Write-Host ""
