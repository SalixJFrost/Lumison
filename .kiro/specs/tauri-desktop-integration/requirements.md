# Requirements Document

## Introduction

本需求文档定义了将现有 Lumison 前端项目（声音驱动的生成式视觉艺术引擎）集成 Tauri 桌面应用框架的功能需求。项目目标是在不破坏现有 GitHub Pages 部署的前提下，为 Lumison 添加桌面应用能力，并为未来的系统级功能（系统音频捕获、多屏输出等）预留架构接口。

## Glossary

- **Lumison**: 声音驱动的生成式视觉艺术引擎，当前为纯前端 Web 应用
- **Tauri**: 使用 Rust 构建跨平台桌面应用的框架
- **Frontend_Assets**: 现有前端代码和资源（TypeScript + React + WebGL + Web Audio）
- **Tauri_Core**: Tauri 的 Rust 后端核心，位于 src-tauri 目录
- **Build_System**: 项目的构建配置系统（Vite + Tauri CLI）
- **Desktop_App**: 最终生成的可执行桌面应用程序
- **GitHub_Pages_Build**: 用于 GitHub Pages 部署的 Web 版本构建产物
- **System_Audio_Capture**: 捕获系统音频输出的功能（未来扩展）
- **Multi_Screen_Output**: 支持多显示器输出的功能（未来扩展）
- **Exhibition_Mode**: 艺术展览模式，全屏无 UI 显示（未来扩展）

## Requirements

### Requirement 1: Tauri 项目初始化与集成

**User Story:** 作为开发者，我希望在现有项目中集成 Tauri 框架，以便将 Lumison 打包为桌面应用，同时保持现有前端代码结构不变。

#### Acceptance Criteria

1. THE Build_System SHALL 在项目根目录创建 src-tauri 目录用于存放 Rust 代码
2. THE Build_System SHALL 保留现有的 src/、public/、index.html 等前端文件结构
3. THE Tauri_Core SHALL 包含最小化的 main.rs 文件，仅包含窗口创建和基础配置
4. THE Build_System SHALL 在 package.json 中添加 Tauri 相关的构建脚本（tauri dev、tauri build）
5. WHEN 执行 npm run tauri dev 时，THE Desktop_App SHALL 启动开发模式并显示应用窗口
6. THE Tauri_Core SHALL 使用 tauri.conf.json 配置文件管理应用元数据和窗口属性

### Requirement 2: 构建系统双模式支持

**User Story:** 作为开发者，我希望构建系统同时支持 Web 版本和桌面版本的构建，以便继续维护 GitHub Pages 部署，同时生成桌面应用。

#### Acceptance Criteria

1. WHEN 执行 npm run build 时，THE Build_System SHALL 生成用于 GitHub Pages 的 Web 版本（带 /Lumison/ base path）
2. WHEN 执行 npm run tauri build 时，THE Build_System SHALL 生成桌面应用可执行文件（Windows .exe）
3. THE Build_System SHALL 在 Tauri 构建模式下使用 base: '/' 路径配置
4. THE Build_System SHALL 在 Web 构建模式下保持现有的 base: '/Lumison/' 配置
5. THE GitHub_Pages_Build SHALL 不包含任何 Tauri 相关的运行时代码
6. THE Desktop_App SHALL 不依赖 GitHub Pages 的路径配置

### Requirement 3: 应用窗口配置

**User Story:** 作为用户，我希望桌面应用具有合适的窗口尺寸和外观，以便获得良好的视觉体验。

#### Acceptance Criteria

1. THE Desktop_App SHALL 以默认窗口尺寸 1280x800 像素启动
2. THE Desktop_App SHALL 允许用户调整窗口大小
3. THE Desktop_App SHALL 设置最小窗口尺寸为 800x600 像素
4. THE Desktop_App SHALL 使用应用标题 "Lumison - Visual Art Engine"
5. THE Desktop_App SHALL 在 Windows 任务栏显示自定义应用图标
6. THE Desktop_App SHALL 支持全屏模式切换（F11 快捷键）

### Requirement 4: 前端资源加载

**User Story:** 作为开发者，我希望桌面应用能正确加载所有前端资源，以便应用功能完整可用。

#### Acceptance Criteria

1. THE Desktop_App SHALL 正确加载 index.html 作为应用入口
2. THE Desktop_App SHALL 正确加载所有 JavaScript 模块（TypeScript 编译产物）
3. THE Desktop_App SHALL 正确加载所有 CSS 样式文件（包括 Tailwind CSS）
4. THE Desktop_App SHALL 正确加载 public 目录下的静态资源（图标、manifest.json）
5. THE Desktop_App SHALL 正确加载外部 CDN 资源（Google Fonts、jsmediatags、color-thief）
6. WHEN 前端资源加载失败时，THE Desktop_App SHALL 在控制台输出详细错误信息

### Requirement 5: Web API 兼容性

**User Story:** 作为开发者，我希望桌面应用支持现有前端使用的所有 Web API，以便无需修改前端代码即可运行。

#### Acceptance Criteria

1. THE Desktop_App SHALL 支持 Web Audio API 的所有功能（音频播放、分析、空间音频）
2. THE Desktop_App SHALL 支持 WebGL 渲染（流体背景效果）
3. THE Desktop_App SHALL 支持 Canvas API（可视化器）
4. THE Desktop_App SHALL 支持 File API（本地文件拖放和导入）
5. THE Desktop_App SHALL 支持 Fetch API（网络音乐搜索和流媒体）
6. THE Desktop_App SHALL 支持 LocalStorage API（用户设置持久化）

### Requirement 6: 开发者工具与调试

**User Story:** 作为开发者，我希望在开发模式下能够使用调试工具，以便快速定位和解决问题。

#### Acceptance Criteria

1. WHEN 运行 npm run tauri dev 时，THE Desktop_App SHALL 自动打开开发者工具（DevTools）
2. THE Desktop_App SHALL 在开发模式下支持热重载（HMR）
3. THE Desktop_App SHALL 在控制台显示 Rust 后端的日志输出
4. THE Desktop_App SHALL 在控制台显示前端的日志输出
5. WHEN 前端代码修改时，THE Desktop_App SHALL 自动刷新页面内容
6. THE Desktop_App SHALL 在生产构建中禁用开发者工具

### Requirement 7: 架构扩展接口预留

**User Story:** 作为开发者，我希望 Tauri 后端预留清晰的架构接口，以便未来添加系统级功能（系统音频捕获、多屏输出等）。

#### Acceptance Criteria

1. THE Tauri_Core SHALL 在 main.rs 中预留 Tauri Command 注册区域（带注释说明）
2. THE Tauri_Core SHALL 在 tauri.conf.json 中预留权限配置区域（audio、fs、window 等）
3. THE Tauri_Core SHALL 在代码注释中说明 System_Audio_Capture 的集成位置
4. THE Tauri_Core SHALL 在代码注释中说明 Multi_Screen_Output 的集成位置
5. THE Tauri_Core SHALL 在代码注释中说明 Exhibition_Mode 的实现方式
6. THE Tauri_Core SHALL 使用模块化结构，便于未来添加新的 Rust 模块

### Requirement 8: 依赖管理与版本控制

**User Story:** 作为开发者，我希望项目依赖清晰且版本稳定，以便团队协作和长期维护。

#### Acceptance Criteria

1. THE Build_System SHALL 在 package.json 中添加 @tauri-apps/cli 作为开发依赖
2. THE Build_System SHALL 在 package.json 中添加 @tauri-apps/api 作为运行时依赖
3. THE Tauri_Core SHALL 在 Cargo.toml 中声明 tauri 和 serde 依赖
4. THE Tauri_Core SHALL 使用稳定版本的 Tauri（2.x 或最新稳定版）
5. THE Build_System SHALL 在 .gitignore 中排除 src-tauri/target 目录
6. THE Build_System SHALL 保持现有前端依赖不变（React 19、Vite 6 等）

### Requirement 9: 构建产物与分发

**User Story:** 作为开发者，我希望构建系统生成可分发的桌面应用安装包，以便用户安装和使用。

#### Acceptance Criteria

1. WHEN 执行 npm run tauri build 时，THE Build_System SHALL 生成 Windows 可执行文件（.exe）
2. THE Build_System SHALL 在 src-tauri/target/release 目录输出构建产物
3. THE Desktop_App SHALL 包含所有必需的运行时依赖（无需额外安装）
4. THE Desktop_App SHALL 文件大小小于 50MB（优化后）
5. THE Desktop_App SHALL 在 Windows 10/11 上正常运行
6. THE Build_System SHALL 生成应用图标并嵌入到可执行文件中

### Requirement 10: 文档与开发指南

**User Story:** 作为开发者，我希望有清晰的文档说明 Tauri 集成的使用方法，以便团队成员快速上手。

#### Acceptance Criteria

1. THE Build_System SHALL 在 README.md 中添加桌面应用开发和构建的说明
2. THE Build_System SHALL 创建 docs/TAURI_INTEGRATION.md 文档，说明架构设计
3. THE Build_System SHALL 在文档中说明如何添加新的 Tauri Command
4. THE Build_System SHALL 在文档中说明如何配置应用权限
5. THE Build_System SHALL 在文档中说明未来扩展功能的实现路径
6. THE Build_System SHALL 在文档中说明 Web 版本和桌面版本的差异

