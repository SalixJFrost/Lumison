# 性能优化迁移指南

本指南帮助你将现有代码迁移到优化后的架构。

## 📋 迁移清单

- [ ] 1. 设置 Context API
- [ ] 2. 迁移到自定义 Hooks
- [ ] 3. 添加 Memoization
- [ ] 4. 拆分大型组件
- [ ] 5. 优化事件监听器
- [ ] 6. 测试和验证

---

## 🚀 步骤 1: 设置 Context API

### 1.1 在 App.tsx 中创建 Context 值

```typescript
// src/App.tsx
import { PlayerProvider } from './contexts/PlayerContext';

const App = () => {
  // ... 现有状态 ...

  // 创建 Context 值
  const playerContextValue = {
    isPlaying: playState === PlayState.PLAYING,
    currentTime,
    duration,
    isBuffering,
    volume,
    setVolume,
    speed: player.speed,
    preservesPitch: player.preservesPitch,
    setSpeed: handleSpeedChange,
    togglePreservesPitch: player.togglePreservesPitch,
    playMode,
    togglePlayMode: toggleMode,
    showVolumePopup,
    setShowVolumePopup,
    showSettingsPopup,
    setShowSettingsPopup,
  };

  return (
    <PlayerProvider value={playerContextValue}>
      {/* 现有组件 */}
    </PlayerProvider>
  );
};
```

### 1.2 在 Controls 中使用 Context

```typescript
// src/components/Controls.tsx
import { usePlayerContext } from '../contexts/PlayerContext';

const Controls = ({ 
  // 移除这些 props，从 Context 获取
  // volume, setVolume, speed, setSpeed, etc.
  
  // 保留这些 props（不适合放在 Context）
  onPlayPause,
  onNext,
  onPrev,
  title,
  artist,
  coverUrl,
  // ...
}) => {
  // 从 Context 获取状态
  const { 
    volume, 
    setVolume, 
    speed, 
    setSpeed,
    showVolumePopup,
    setShowVolumePopup,
  } = usePlayerContext();

  // 组件逻辑保持不变
};
```

### 1.3 更新 App.tsx 中的 Controls 调用

```typescript
// 移除不再需要的 props
<Controls
  isPlaying={playState === PlayState.PLAYING}
  onPlayPause={togglePlay}
  // volume={volume}  // ❌ 移除
  // onVolumeChange={setVolume}  // ❌ 移除
  // speed={player.speed}  // ❌ 移除
  // ... 移除其他可以从 Context 获取的 props
/>
```

---

## 🔧 步骤 2: 迁移到自定义 Hooks

### 2.1 替换 Click Outside 逻辑

**之前：**
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      volumeContainerRef.current &&
      !volumeContainerRef.current.contains(event.target as Node)
    ) {
      setShowVolumePopup(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**之后：**
```typescript
import { useClickOutside } from '../hooks/useClickOutside';

useClickOutside(volumeContainerRef, () => setShowVolumePopup(false), showVolumePopup);
```

### 2.2 添加 Debounce

**搜索输入：**
```typescript
import { useDebounce } from '../hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  // 使用 debouncedSearchTerm 进行搜索
  performSearch(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### 2.3 优化动画帧

**之前：**
```typescript
useEffect(() => {
  let animationFrameId: number;
  
  const animate = () => {
    // 动画逻辑
    animationFrameId = requestAnimationFrame(animate);
  };
  
  animationFrameId = requestAnimationFrame(animate);
  
  return () => cancelAnimationFrame(animationFrameId);
}, [dependencies]);
```

**之后：**
```typescript
import { useAnimationFrame } from '../hooks/useAnimationFrame';

useAnimationFrame((deltaTime) => {
  // 动画逻辑
}, isPlaying);
```

---

## 💾 步骤 3: 添加 Memoization

### 3.1 缓存颜色提取

**在 usePlayer.ts 中：**
```typescript
import { memoizeAsync } from '../utils/memoize';
import { getCacheConfig } from '../config/performance';

// 创建缓存版本
const extractColorsWithCache = memoizeAsync(
  extractColors,
  getCacheConfig('colorExtraction').ttl,
  getCacheConfig('colorExtraction').maxSize
);

// 使用缓存版本
useEffect(() => {
  if (currentSong?.coverUrl) {
    extractColorsWithCache(currentSong.coverUrl).then(setAccentColor);
  }
}, [currentSong?.coverUrl]);
```

### 3.2 缓存歌词搜索

```typescript
import { memoizeAsync } from '../utils/memoize';

const searchLyricsWithCache = memoizeAsync(
  searchAndMatchLyrics,
  getCacheConfig('lyrics').ttl,
  getCacheConfig('lyrics').maxSize
);
```

### 3.3 使用 useMemo 缓存计算

```typescript
import { useMemo } from 'react';

// 缓存昂贵的计算
const processedLyrics = useMemo(() => {
  return lyrics.map(line => ({
    ...line,
    // 昂贵的处理
  }));
}, [lyrics]);

// 缓存过滤结果
const filteredQueue = useMemo(() => {
  return queue.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [queue, searchTerm]);
```

### 3.4 使用 useCallback 缓存函数

```typescript
import { useCallback } from 'react';

// 缓存事件处理器
const handleVolumeChange = useCallback((newVolume: number) => {
  setVolume(newVolume);
  // 其他逻辑
}, [setVolume]);

// 传递给子组件
<VolumeControl onVolumeChange={handleVolumeChange} />
```

---

## 🔨 步骤 4: 拆分大型组件

### 4.1 识别可拆分的部分

Controls.tsx (1000+ 行) 可以拆分为：

```
src/components/controls/
├── index.tsx              # 主组件（组合所有子组件）
├── CoverCard.tsx          # ✅ 已创建
├── ProgressBar.tsx        # ✅ 已创建
├── SongInfo.tsx           # 歌曲信息
├── PlaybackControls.tsx   # 播放按钮
├── VolumeControl.tsx      # 音量控制
├── SpeedControl.tsx       # 速度控制
└── SettingsPopup.tsx      # 设置弹窗
```

### 4.2 创建子组件

**示例：SongInfo.tsx**
```typescript
import React, { memo } from 'react';

interface SongInfoProps {
  title: string;
  artist: string;
}

const SongInfo: React.FC<SongInfoProps> = memo(({ title, artist }) => {
  return (
    <div className="text-center mb-2 px-4 select-text cursor-text">
      <h2 className="text-3xl font-bold tracking-tight drop-shadow-md line-clamp-1 theme-text-primary">
        {title}
      </h2>
      <p className="text-xl font-medium line-clamp-1 theme-text-secondary">
        {artist}
      </p>
    </div>
  );
});

SongInfo.displayName = 'SongInfo';

export default SongInfo;
```

### 4.3 在主组件中组合

```typescript
// src/components/controls/index.tsx
import CoverCard from './CoverCard';
import SongInfo from './SongInfo';
import ProgressBar from './ProgressBar';
import PlaybackControls from './PlaybackControls';

const Controls = ({ ... }) => {
  return (
    <div className="...">
      <CoverCard coverUrl={coverUrl} isPlaying={isPlaying} />
      <SongInfo title={title} artist={artist} />
      <ProgressBar {...progressProps} />
      <PlaybackControls {...controlProps} />
    </div>
  );
};
```

---

## 🎯 步骤 5: 优化事件监听器

### 5.1 使用 Passive Listeners

```typescript
// 滚动和触摸事件使用 passive
element.addEventListener('wheel', handler, { passive: true });
element.addEventListener('touchstart', handler, { passive: true });
```

### 5.2 使用 Capture Phase

```typescript
// Click outside 使用 capture
document.addEventListener('mousedown', handler, true);
```

### 5.3 确保清理

```typescript
useEffect(() => {
  const handler = () => { /* ... */ };
  
  window.addEventListener('resize', handler);
  
  // ✅ 必须清理
  return () => {
    window.removeEventListener('resize', handler);
  };
}, [dependencies]);
```

### 5.4 避免重复注册

**之前：**
```typescript
// ❌ 每次 showPopup 变化都重新注册
useEffect(() => {
  if (showPopup) {
    window.addEventListener('wheel', handler);
    return () => window.removeEventListener('wheel', handler);
  }
}, [showPopup]);
```

**之后：**
```typescript
// ✅ 只注册一次，在 handler 中检查状态
useEffect(() => {
  const handler = (e: WheelEvent) => {
    if (!showPopup) return;
    // 处理逻辑
  };
  
  window.addEventListener('wheel', handler);
  return () => window.removeEventListener('wheel', handler);
}, []); // 空依赖数组
```

---

## ✅ 步骤 6: 测试和验证

### 6.1 功能测试

- [ ] 播放/暂停正常工作
- [ ] 音量控制正常
- [ ] 速度调整正常
- [ ] 进度条拖动正常
- [ ] 切歌正常
- [ ] 搜索功能正常
- [ ] 播放列表正常

### 6.2 性能测试

使用 React DevTools Profiler：

1. 打开 Profiler
2. 开始录制
3. 执行操作（播放、切歌、调整音量等）
4. 停止录制
5. 分析结果

**关注指标：**
- Render count（渲染次数）
- Render duration（渲染时长）
- 是否有不必要的重渲染

### 6.3 内存测试

使用 Chrome DevTools Memory Profiler：

1. 打开 Memory 标签
2. 拍摄堆快照
3. 执行操作（播放多首歌曲）
4. 再次拍摄堆快照
5. 比较差异

**检查：**
- 是否有内存泄漏
- 事件监听器是否正确清理
- 缓存大小是否合理

---

## 📊 预期改进

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 重渲染次数 | 100% | 60% | -40% |
| 颜色提取时间 | 100-500ms | <1ms | -99% |
| 内存占用 | 150MB | 100MB | -33% |
| 首次渲染 | 1.5s | 1s | -33% |

---

## 🐛 常见问题

### Q: 迁移后组件不工作了？
A: 检查是否正确包裹了 `PlayerProvider`，以及 Context 值是否正确传递。

### Q: 性能没有明显改善？
A: 使用 Profiler 确认优化是否生效。可能需要进一步优化特定组件。

### Q: 如何回滚？
A: 保留原始文件的备份。如果需要回滚，恢复备份文件即可。

---

## 📚 下一步

完成迁移后：

1. 监控生产环境性能
2. 收集用户反馈
3. 识别新的优化机会
4. 持续改进

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 `docs/PERFORMANCE_OPTIMIZATION.md`
2. 检查控制台错误
3. 使用 React DevTools 调试
4. 查看示例代码

**最后更新：** 2024-02-22
