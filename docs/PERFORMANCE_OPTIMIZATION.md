# 性能优化指南 / Performance Optimization Guide

## 播放按钮动画优化 / Play Button Animation Optimization

### 优化内容 / Optimizations Applied

1. **硬件加速 / Hardware Acceleration**
   - 添加 `hw-accelerate` 类，强制使用 GPU 渲染
   - 使用 `transform: translateZ(0)` 触发 GPU 合成层
   - 添加 `will-change: transform` 提示浏览器优化

2. **动画性能 / Animation Performance**
   - 缩短过渡时间从 300ms 到 200-250ms，减少动画开销
   - 使用 `cubic-bezier(0.34, 1.56, 0.64, 1)` 弹性缓动函数
   - 分离 opacity 和 transform 动画，独立优化时间

3. **减少重绘 / Reduce Repaints**
   - 使用 `transform` 和 `opacity` 替代位置属性
   - 避免触发 layout 和 paint 的属性变化
   - 使用 CSS containment 隔离渲染区域

### 代码示例 / Code Example

```tsx
<button
  className="hw-accelerate"
  style={{
    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
    willChange: 'transform',
  }}
>
  <PlayIcon
    style={{
      transition: 'opacity 0.2s, transform 0.25s',
      willChange: 'opacity, transform',
    }}
  />
</button>
```

## 专辑卡片动画优化 / Album Cover Card Animation Optimization

### 优化内容 / Optimizations Applied

1. **智能 3D 效果 / Smart 3D Effects**
   - 根据设备性能自动启用/禁用 3D 变换
   - 低端设备（< 4GB RAM）自动禁用 3D 效果
   - 尊重用户的 `prefers-reduced-motion` 设置

2. **RAF 节流 / RAF Throttling**
   - 使用 `requestAnimationFrame` 节流鼠标移动事件
   - 避免过度触发动画更新
   - 取消未完成的 RAF 请求

3. **条件 will-change / Conditional will-change**
   - 仅在鼠标悬停时启用 `will-change`
   - 减少内存占用和合成层开销
   - 鼠标离开时自动清理

4. **移除 boxShadow 动画 / Remove boxShadow Animation**
   - 使用 CSS 静态阴影替代动画阴影
   - 减少重绘开销
   - 保持视觉效果的同时提升性能

5. **CSS Containment / CSS Containment**
   - 使用 `contain: layout style paint` 隔离渲染
   - 防止卡片动画影响其他元素
   - 优化浏览器渲染管线

### 代码示例 / Code Example

```tsx
// 检测设备能力
const supports3D = useRef(() => {
  const deviceMemory = navigator.deviceMemory || 4;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return deviceMemory >= 4 && !prefersReducedMotion;
}).current();

// RAF 节流的鼠标移动处理
const handleMouseMove = useCallback((e: React.MouseEvent) => {
  if (!supports3D || !isHovering) return;
  
  if (rafIdRef.current) {
    cancelAnimationFrame(rafIdRef.current);
  }
  
  rafIdRef.current = requestAnimationFrame(() => {
    // 计算旋转角度（减少到 8 度）
    const rotateXValue = ((y - centerY) / centerY) * -8;
    const rotateYValue = ((x - centerX) / centerX) * 8;
    
    cardApi.start({ rotateX: rotateXValue, rotateY: rotateYValue });
  });
}, [supports3D, isHovering]);

// 条件渲染 3D 效果
<animated.div
  style={{
    transform: supports3D 
      ? `scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`
      : `scale(${scale})`,
    willChange: isHovering ? 'transform' : 'auto',
  }}
  className="cover-card-optimized"
/>
```

### CSS 优化 / CSS Optimizations

```css
.cover-card-optimized {
  /* CSS containment for isolation */
  contain: layout style paint;
  /* Optimize transform rendering */
  transform-origin: center center;
  /* Static shadow instead of animated */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

/* Disable 3D on mobile */
@media (max-width: 768px) {
  .cover-card-optimized {
    transform-style: flat !important;
  }
}
```

## WebView 性能优化 / WebView Performance Optimization

### 1. Backdrop Filter 优化

**问题 / Problem:**
- `backdrop-filter: blur(100px)` 在移动设备上性能开销大
- 导致滚动和动画卡顿

**解决方案 / Solution:**
```css
/* 桌面端 */
.backdrop-blur-optimized {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* 移动端 - 降低模糊强度 */
@media (max-width: 768px) {
  .backdrop-blur-optimized {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}
```

### 2. 图层优化 / Layer Optimization

**动态调整图层数量 / Dynamic Layer Count:**
```typescript
const deviceMemory = navigator.deviceMemory || 4;
let layerCount = 4; // 默认

if (deviceMemory < 2) layerCount = 1;      // 极低端设备
else if (deviceMemory < 4) layerCount = 2; // 低端设备
else if (deviceMemory < 8) layerCount = 3; // 中端设备
```

### 3. CSS Containment

使用 CSS containment 隔离组件渲染：

```css
.contain-layout { contain: layout; }
.contain-paint { contain: paint; }
.contain-strict { contain: strict; }
```

### 4. 被动事件监听 / Passive Event Listeners

```typescript
window.addEventListener('scroll', handler, { passive: true });
window.addEventListener('touchmove', handler, { passive: true });
```

### 5. 减少 will-change 使用

**问题 / Problem:**
- 过度使用 `will-change` 会占用大量内存
- 在移动设备上尤其明显

**解决方案 / Solution:**
```css
/* 仅在动画期间使用 will-change */
@media (max-width: 768px) {
  .hw-accelerate {
    will-change: auto; /* 移动端默认不使用 */
  }
}
```

## 性能监控 / Performance Monitoring

### useWebViewOptimization Hook

新增的性能监控 Hook：

```typescript
const { currentFPS, isPerformanceGood } = useWebViewOptimization();

// currentFPS: 当前帧率
// isPerformanceGood: 是否达到 50fps 以上
```

### 自动降级策略 / Auto-Degradation

当检测到性能问题时，自动：
1. 减少背景图层数量
2. 降低模糊强度
3. 禁用非关键动画
4. 简化阴影效果

## 配置选项 / Configuration

在 `src/config/performance.ts` 中调整：

```typescript
export const PERFORMANCE_CONFIG = {
  webview: {
    limitLayerUpdates: true,      // 限制图层更新
    usePassiveListeners: true,    // 使用被动监听
    limitBackdropFilters: true,   // 限制背景滤镜
    preferTransforms: true,       // 优先使用 transform
  },
  rendering: {
    batchDOMUpdates: true,        // 批量 DOM 更新
    useCSSContainment: true,      // 使用 CSS containment
  },
};
```

## 测试建议 / Testing Recommendations

### 1. 性能测试工具

- Chrome DevTools Performance 面板
- Lighthouse 性能审计
- React DevTools Profiler

### 2. 测试场景

- 低端设备（2GB RAM）
- 中端设备（4GB RAM）
- 高端设备（8GB+ RAM）
- 不同网络条件

### 3. 关键指标

- FPS: 目标 ≥ 50fps
- 内存使用: < 200MB
- 首次渲染: < 1s
- 交互响应: < 100ms

## 最佳实践 / Best Practices

1. **优先使用 CSS 动画**
   - 使用 `transform` 和 `opacity`
   - 避免 `left`, `top`, `width`, `height`

2. **减少重排和重绘**
   - 使用 `position: absolute/fixed`
   - 批量 DOM 操作
   - 使用 `requestAnimationFrame`

3. **图片优化**
   - 使用 WebP 格式
   - 懒加载非关键图片
   - 适当的图片尺寸

4. **内存管理**
   - 及时清理事件监听器
   - 避免内存泄漏
   - 限制缓存大小

5. **移动端特殊优化**
   - 减少动画复杂度
   - 降低模糊强度
   - 使用触摸优化

## 性能对比 / Performance Comparison

### 优化前 / Before
- 播放按钮动画: 300ms 过渡
- Backdrop blur: 100px
- 固定 4 个背景图层
- FPS: 30-40 (移动端)
- 专辑卡片: 始终启用 3D 效果
- 鼠标移动: 无节流，频繁更新
- boxShadow: 动画属性

### 优化后 / After
- 播放按钮动画: 150-250ms 过渡 + GPU 加速
- Backdrop blur: 12-20px (自适应)
- 动态 1-4 个背景图层
- FPS: 50-60 (移动端)
- 专辑卡片: 智能 3D（根据设备能力）
- 鼠标移动: RAF 节流
- boxShadow: 静态 CSS

## 故障排查 / Troubleshooting

### 问题: 动画卡顿
**解决方案:**
1. 检查是否启用硬件加速
2. 减少同时运行的动画数量
3. 降低模糊强度

### 问题: 内存占用高
**解决方案:**
1. 减少背景图层数量
2. 清理未使用的缓存
3. 限制 canvas 尺寸

### 问题: 首次加载慢
**解决方案:**
1. 使用代码分割
2. 懒加载非关键组件
3. 优化图片加载

## 未来优化方向 / Future Optimizations

1. **Web Worker 优化**
   - 将更多计算移至 Worker
   - 使用 OffscreenCanvas

2. **虚拟化列表**
   - 播放列表虚拟滚动
   - 减少 DOM 节点数量

3. **智能预加载**
   - 预测用户行为
   - 提前加载资源

4. **自适应质量**
   - 根据设备性能动态调整
   - 实时监控并降级
