# 快速性能优化指南 / Quick Performance Guide

## 🎯 核心优化 / Core Optimizations

### 1. 播放按钮动画 (Play Button Animation)

**使用硬件加速类:**
```tsx
<button className="hw-accelerate">
  <PlayIcon className="hw-accelerate" />
</button>
```

**添加性能提示:**
```tsx
style={{
  willChange: 'transform',
  transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
}}
```

### 2. Backdrop Filter 优化

**替换:**
```css
/* ❌ 不推荐 */
backdrop-filter: blur(100px);

/* ✅ 推荐 */
backdrop-filter: blur(20px); /* 桌面端 */
backdrop-filter: blur(12px); /* 移动端 */
```

**使用优化类:**
```tsx
<div className="backdrop-blur-optimized">
  {/* 内容 */}
</div>
```

### 3. 动态图层管理

**自动根据设备调整:**
```typescript
const deviceMemory = navigator.deviceMemory || 4;
const layerCount = deviceMemory < 4 ? 2 : 4;
```

### 4. 性能监控

**使用 Hook:**
```typescript
import { useWebViewOptimization } from './hooks/useWebViewOptimization';

const { currentFPS, isPerformanceGood } = useWebViewOptimization();
```

## 📋 检查清单 / Checklist

### 动画优化
- [ ] 使用 `transform` 和 `opacity` 而非 `left/top`
- [ ] 添加 `hw-accelerate` 类
- [ ] 设置合理的 `will-change`
- [ ] 使用 `cubic-bezier` 缓动函数

### 渲染优化
- [ ] 减少 backdrop-filter 强度
- [ ] 使用 CSS containment
- [ ] 启用被动事件监听
- [ ] 批量 DOM 更新

### 内存优化
- [ ] 限制图层数量
- [ ] 清理未使用的监听器
- [ ] 控制缓存大小
- [ ] 及时释放资源

## 🔧 常用优化类 / Utility Classes

```css
/* 硬件加速 */
.hw-accelerate {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 优化的 backdrop filter */
.backdrop-blur-optimized {
  backdrop-filter: blur(20px);
}

/* 防止布局抖动 */
.prevent-layout-thrashing {
  contain: layout style;
}

/* 简化绘制 */
.simple-paint {
  contain: paint;
}
```

## 🎨 动画最佳实践 / Animation Best Practices

### ✅ 推荐
```tsx
// 使用 transform
<div style={{ transform: 'translateX(100px)' }} />

// 使用 opacity
<div style={{ opacity: 0.5 }} />

// 使用 scale
<div style={{ transform: 'scale(1.1)' }} />
```

### ❌ 避免
```tsx
// 避免 left/top
<div style={{ left: '100px' }} />

// 避免 width/height 动画
<div style={{ width: '200px' }} />

// 避免 margin/padding 动画
<div style={{ margin: '20px' }} />
```

## 📱 移动端特殊优化 / Mobile Optimizations

```css
@media (max-width: 768px) {
  /* 减少 will-change 使用 */
  .hw-accelerate {
    will-change: auto;
  }
  
  /* 简化阴影 */
  .shadow-lg {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* 降低模糊强度 */
  .backdrop-blur-optimized {
    backdrop-filter: blur(12px);
  }
}
```

## 🚀 快速修复 / Quick Fixes

### 问题: 动画卡顿
```typescript
// 添加硬件加速
className="hw-accelerate"
style={{ willChange: 'transform' }}
```

### 问题: 内存占用高
```typescript
// 减少图层数量
const layerCount = deviceMemory < 4 ? 2 : 4;
```

### 问题: 滚动不流畅
```typescript
// 使用被动监听
window.addEventListener('scroll', handler, { passive: true });
```

## 📊 性能目标 / Performance Targets

| 指标 | 目标值 | 最低要求 |
|-----|-------|---------|
| FPS | 60 | 50 |
| 内存 | < 150MB | < 200MB |
| 首次渲染 | < 1s | < 2s |
| 交互响应 | < 100ms | < 200ms |

## 🔍 调试工具 / Debug Tools

### Chrome DevTools
```javascript
// 监控 FPS
performance.mark('start');
// ... 代码 ...
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

### React DevTools
```javascript
// 使用 Profiler
<Profiler id="Controls" onRender={callback}>
  <Controls />
</Profiler>
```

## 💡 提示 / Tips

1. **优先优化可见内容** - 首屏性能最重要
2. **使用 Chrome DevTools Performance** - 找出性能瓶颈
3. **测试真实设备** - 模拟器不能完全反映真实性能
4. **监控内存使用** - 防止内存泄漏
5. **渐进式优化** - 先优化影响最大的部分

## 📚 相关文档 / Related Docs

- [详细优化文档](./PERFORMANCE_OPTIMIZATION.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [性能配置](../src/config/performance.ts)

## 🆘 常见问题 / FAQ

**Q: 如何检查当前 FPS?**
```typescript
const { currentFPS } = useWebViewOptimization();
console.log('FPS:', currentFPS);
```

**Q: 如何禁用某些优化?**
```typescript
// 在 performance.ts 中修改
export const PERFORMANCE_CONFIG = {
  webview: {
    limitBackdropFilters: false, // 禁用 backdrop filter 限制
  },
};
```

**Q: 如何测试低端设备性能?**
```javascript
// Chrome DevTools > Performance > CPU throttling
// 选择 "4x slowdown" 或 "6x slowdown"
```
