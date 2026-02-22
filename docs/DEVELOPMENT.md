# Lumison 开发文档

开发者指南，包含技术实现、性能优化和桌面应用开发。

---

## 📖 目录

- [技术架构](#技术架构)
- [性能优化](#性能优化)
- [桌面应用](#桌面应用)
- [开发指南](#开发指南)

---

## 🏗️ 技术架构

### 前端技术栈

```
React 19 + TypeScript
├── UI Framework: React with Hooks
├── Styling: Tailwind CSS
├── Animation: React Spring
├── Build Tool: Vite
└── State: Context API
```

### 音频处理管道

```
Audio Source → Web Audio API → Spatial Audio Engine → Output
                    ↓
              Visualizer (Web Worker)
                    ↓
              Real-time Spectrum Analysis
```

### 渲染管道

```
Background: WebGL/Canvas (OffscreenCanvas + Web Worker)
Lyrics: Canvas with Physics Simulation
Controls: React Components with Hardware Acceleration
```

---

## ⚡ 性能优化

### 内存优化策略

#### 问题分析
Lumison 内存占用主要来源：
1. **多 Canvas 实例**（每行歌词一个）- 165-380MB
2. **高分辨率渲染**（4K 显示器）- 额外 3-4 倍内存
3. **图像缓存**（封面和背景）- 18-90MB
4. **音频处理**（空间音频 + 可视化器）- 10-23MB

#### 已实施优化

**1. 自适应 Canvas 分辨率**
```typescript
// src/config/performance.ts
export const getOptimalPixelRatio = (): number => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  if (deviceMemory < 4) return 1;
  if (deviceMemory < 8) return Math.min(devicePixelRatio, 1.5);
  return Math.min(devicePixelRatio, 2);
};
```

**2. 图像缓存限制**
```typescript
// 最多缓存 10 张图片，50MB 上限
memory: {
  maxImageCache: 10,
  maxImageMemory: 50,
}
```

**3. 自适应背景层数**
```typescript
// 根据设备内存调整层数（2-4层）
const layerCount = deviceMemory < 4 ? 2 : deviceMemory < 8 ? 3 : 4;
```

**4. 按需可视化器**
```typescript
// 默认关闭，用户手动启用
const [visualizerEnabled, setVisualizerEnabled] = useState(false);
{visualizerEnabled && <Visualizer />}
```

#### 性能目标

| 指标 | 目标 | 当前 |
|------|------|------|
| FPS | 60fps | 60fps |
| 音频延迟 | <50ms | ~30ms |
| 内存占用 | <300MB | ~250MB |
| 初始加载 | <2s | ~1.5s |

### 渲染优化

**1. 硬件加速**
```css
.hw-accelerate {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

**2. React 优化**
```typescript
// 使用 React.memo 防止不必要的重渲染
const LyricLine = React.memo(({ line, isActive }) => {
  // ...
}, (prev, next) => {
  return prev.line.id === next.line.id && 
         prev.isActive === next.isActive;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

**3. Web Worker 处理**
```typescript
// 将重计算移到 Worker
const worker = new Worker('./processor.worker.ts');
worker.postMessage({ type: 'process', data });
worker.onmessage = (e) => {
  const result = e.data;
};
```

### 网络优化

**1. 自适应质量**
```typescript
export const getConnectionQuality = (): 'fast' | 'medium' | 'slow' => {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    const effectiveType = conn?.effectiveType;
    
    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g') return 'medium';
    return 'slow';
  }
  return 'medium';
};
```

**2. DNS 预连接**
```typescript
const preconnectDomains = [
  'https://music.163.com',
  'https://api.github.com',
];

preconnectDomains.forEach(domain => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  document.head.appendChild(link);
});
```

---

## 🖥️ 桌面应用

### Tauri 集成

#### 配置文件
**src-tauri/tauri.conf.json**
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "tauri": {
    "windows": [{
      "title": "Lumison",
      "width": 1200,
      "height": 800,
      "decorations": false,
      "transparent": true
    }]
  }
}
```

#### 无边框窗口实现

**1. Tauri 配置**
```json
{
  "decorations": false,
  "transparent": true
}
```

**2. 拖拽区域**
```tsx
// TopBar.tsx
<div data-tauri-drag-region>
  <h1>Lumison</h1>
</div>
```

**3. CSS 样式**
```css
[data-tauri-drag-region] {
  -webkit-app-region: drag;
  app-region: drag;
  user-select: none;
}

button, input, select, textarea, a {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
```

**4. 窗口控制**
```typescript
import { Window } from "@tauri-apps/api/window";

const handleMinimize = async () => {
  const appWindow = Window.getCurrent();
  await appWindow.minimize();
};

const handleMaximize = async () => {
  const appWindow = Window.getCurrent();
  const maximized = await appWindow.isMaximized();
  if (maximized) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
};

const handleClose = async () => {
  const appWindow = Window.getCurrent();
  await appWindow.close();
};
```

### 开发和构建

**开发模式**
```bash
npm run tauri:dev
```

**生产构建**
```bash
npm run tauri:build
# 输出: src-tauri/target/release/lumison.exe
# 安装包: src-tauri/target/release/bundle/
```

---

## 🛠️ 开发指南

### 项目结构

```
Lumison/
├── src/
│   ├── components/     # React 组件
│   │   ├── background/ # 背景渲染
│   │   ├── controls/   # 播放控制
│   │   ├── lyrics/     # 歌词渲染
│   │   └── visualizer/ # 音频可视化
│   ├── hooks/          # 自定义 Hooks
│   ├── services/       # 业务逻辑
│   │   ├── audio/      # 音频处理
│   │   ├── lyrics/     # 歌词服务
│   │   └── music/      # 音乐服务
│   ├── contexts/       # React Context
│   ├── i18n/           # 国际化
│   ├── config/         # 配置文件
│   └── utils/          # 工具函数
├── src-tauri/          # Tauri 桌面应用
├── docs/               # 文档
└── public/             # 静态资源
```

### 添加新功能

**1. 创建组件**
```tsx
// src/components/NewFeature.tsx
import React from 'react';

interface NewFeatureProps {
  // props 定义
}

const NewFeature: React.FC<NewFeatureProps> = (props) => {
  return <div>New Feature</div>;
};

export default NewFeature;
```

**2. 添加 Hook**
```typescript
// src/hooks/useNewFeature.ts
import { useState, useEffect } from 'react';

export const useNewFeature = () => {
  const [state, setState] = useState();
  
  useEffect(() => {
    // 逻辑
  }, []);
  
  return { state };
};
```

**3. 添加翻译**
```typescript
// src/i18n/locales/en.ts
export default {
  newFeature: {
    title: 'New Feature',
    description: 'Description',
  },
};
```

### 性能监控

**开发环境**
```typescript
import { performanceMonitor } from './utils/performanceMonitor';

// 启动监控
performanceMonitor.start();

// 订阅指标
performanceMonitor.subscribe((metrics) => {
  console.log('FPS:', metrics.fps);
  console.log('Memory:', metrics.memoryUsage + '%');
});

// 检查性能问题
const issues = performanceMonitor.getRecommendations();
console.log('Issues:', issues);
```

**生产环境**
```typescript
// 定期上报
setInterval(() => {
  const metrics = performanceMonitor.getMetrics();
  analytics.track('performance', metrics);
}, 60000);
```

### 调试技巧

**1. React DevTools**
- 使用 Profiler 查看渲染性能
- 检查组件重渲染次数
- 分析 props 变化

**2. Chrome DevTools**
- Performance 面板录制性能
- Memory 面板检查内存泄漏
- Network 面板优化加载

**3. 性能监控**
```javascript
// 浏览器控制台
window.__performanceMonitor.printSummary()
```

### 代码规范

**TypeScript**
- 使用严格模式
- 避免 `any` 类型
- 定义接口和类型

**React**
- 使用函数组件和 Hooks
- 使用 React.memo 优化
- 避免内联函数

**CSS**
- 使用 Tailwind CSS
- 避免内联样式
- 使用 CSS 变量

### 测试

**单元测试**
```bash
npm run test
```

**集成测试**
```bash
npm run test:integration
```

**E2E 测试**
```bash
npm run test:e2e
```

---

## 🔧 技术实现细节

### Tailwind CSS 配置

**安装**
```bash
npm install -D tailwindcss postcss autoprefixer
```

**配置文件**
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**PostCSS 配置**
```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 语言切换器增强

**鼠标滚轮支持**
```typescript
const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault();
  if (e.deltaY > 0) {
    // 向下滚动 - 下一个语言
    const nextIndex = (currentIndex + 1) % languages.length;
    changeLanguage(languages[nextIndex].code);
  } else {
    // 向上滚动 - 上一个语言
    const prevIndex = (currentIndex - 1 + languages.length) % languages.length;
    changeLanguage(languages[prevIndex].code);
  }
};
```

### TypeScript 类型定义

**Tauri API 类型**
```typescript
// src/env.d.ts
interface Window {
  __TAURI__?: {
    invoke: (cmd: string, args?: any) => Promise<any>;
  };
  electronAPI?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}
```

---

## 📊 性能基准

### 内存占用对比

| 应用 | 内存占用 | 说明 |
|------|---------|------|
| 网易云 | 150-250MB | 原生应用 |
| Spotify | 200-300MB | Electron 应用 |
| Lumison（优化前） | 238-583MB | Web 技术 |
| Lumison（优化后） | 150-250MB | 与网易云相当 |

### 优化效果

| 优化项 | 内存减少 | 实施难度 |
|--------|---------|---------|
| 自适应分辨率 | 50-150MB | 低 |
| 图像缓存限制 | 20-50MB | 低 |
| 背景层数优化 | 10-20MB | 低 |
| 按需可视化器 | 5-10MB | 低 |
| 总计 | 85-230MB | - |

---

## 🚀 未来计划

### 短期（Q1 2026）
- [ ] PWA 支持
- [ ] 离线播放
- [ ] 播放列表导入/导出
- [ ] 歌词编辑器

### 中期（Q2-Q3 2026）
- [ ] macOS 和 Linux 桌面应用
- [ ] 云同步
- [ ] 社交功能
- [ ] 插件系统

### 长期（Q4 2026+）
- [ ] 移动应用（iOS/Android）
- [ ] 流媒体服务集成
- [ ] AI 推荐
- [ ] 协作播放列表

---

## 📝 贡献指南

### 提交 Pull Request

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 打开 Pull Request

### 代码审查

- 确保所有测试通过
- 遵循代码规范
- 添加必要的文档
- 更新 CHANGELOG

---

**最后更新**: 2026-02-22
