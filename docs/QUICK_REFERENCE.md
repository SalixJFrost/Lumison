# 性能优化快速参考

## 🚀 快速开始

### 1. 使用 Context API
```typescript
// App.tsx
import { PlayerProvider } from './contexts/PlayerContext';

const playerValue = {
  volume, setVolume,
  speed, setSpeed,
  // ...
};

<PlayerProvider value={playerValue}>
  <YourComponents />
</PlayerProvider>

// 在组件中
import { usePlayerContext } from '../contexts/PlayerContext';
const { volume, setVolume } = usePlayerContext();
```

### 2. 点击外部检测
```typescript
import { useClickOutside } from '../hooks/useClickOutside';

const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => setShowPopup(false), showPopup);
```

### 3. 防抖
```typescript
import { useDebounce } from '../hooks/useDebounce';

const debouncedValue = useDebounce(value, 300);
```

### 4. 缓存昂贵计算
```typescript
import { memoize, memoizeAsync } from '../utils/memoize';

// 同步
const cached = memoize(expensiveFunc);

// 异步
const cachedAsync = memoizeAsync(asyncFunc, 5 * 60 * 1000);
```

### 5. 性能监控
```typescript
import { measureTime, performanceMonitor } from '../utils/performance';

// 测量函数
const result = measureTime('myFunc', () => calculate());

// 监控组件
performanceMonitor.startMonitoring('MyComponent');
```

---

## 📊 性能检查清单

### 组件优化
- [ ] 使用 `React.memo` 包裹纯组件
- [ ] 使用 `useMemo` 缓存计算结果
- [ ] 使用 `useCallback` 缓存函数
- [ ] 避免在 render 中创建新对象/数组
- [ ] 拆分大型组件（> 300 行）

### 状态管理
- [ ] 使用 Context 减少 props drilling
- [ ] 状态尽可能放在最近的父组件
- [ ] 避免全局状态存储 UI 状态
- [ ] 使用 reducer 管理复杂状态

### 事件处理
- [ ] 使用 `useClickOutside` 替代手动监听
- [ ] 滚动/触摸事件使用 `passive: true`
- [ ] 确保所有监听器都有清理函数
- [ ] 避免在 useEffect 中重复注册

### 缓存策略
- [ ] 颜色提取使用 `memoizeAsync`
- [ ] 歌词搜索使用 `memoizeAsync`
- [ ] 图片使用 `SmartImage` 组件
- [ ] API 请求添加缓存

---

## 🎯 常用代码片段

### React.memo
```typescript
const MyComponent = memo(({ prop1, prop2 }) => {
  return <div>{prop1} {prop2}</div>;
});
```

### useMemo
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### useCallback
```typescript
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 动画配置
```typescript
import { getAnimationConfig } from '../config/performance';

const config = getAnimationConfig('default');
// { tension: 300, friction: 28 }
```

---

## 🔍 调试工具

### 浏览器控制台
```javascript
// 查看性能摘要
window.__performanceMonitor.printSummary()

// 检测性能问题
window.__detectPerformanceIssues()

// 查看内存使用
window.__performanceMonitor.getMemoryUsage()
```

### React DevTools
1. 打开 Profiler 标签
2. 点击录制
3. 执行操作
4. 停止录制
5. 分析结果

---

## ⚡ 性能目标

| 指标 | 目标 |
|------|------|
| 首次渲染 | < 1s |
| 切歌响应 | < 100ms |
| 进度条更新 | 60fps |
| 内存占用 | < 100MB |

---

## 📚 文档链接

- [完整优化指南](./PERFORMANCE_OPTIMIZATION.md)
- [迁移指南](./MIGRATION_GUIDE.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
