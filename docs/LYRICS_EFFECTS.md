# 歌词效果系统

## 当前实现状态

### 已实现的效果

1. **渐变效果 (Gradient)** - 原 Blur
   - 当前播放的歌词使用渐变色填充
   - 从已播放部分（白色）到未播放部分（半透明）的平滑过渡
   - 实现位置：`LyricLine.ts` 中的 `drawActiveWords` 方法

2. **发光效果 (Glow)**
   - 短词（≤7字符）且时长>1.5秒时触发
   - 使用 Canvas shadowBlur 和 shadowColor 实现
   - 包含淡入淡出动画
   - 字符级别的波浪传播效果
   - 实现位置：`LyricLine.ts` 中的 `drawGlowAnimation` 方法

3. **阴影效果 (Shadow)**
   - 当前播放歌词添加轻微阴影
   - 增强文字的立体感和可读性
   - 实现位置：`LyricLine.ts` 中的 `drawFullLine` 方法

### 效果控制

- 效果开关位于 TopBar 设置面板中
- 通过 props 传递到 `LyricsView` 和 `LyricLine` 组件
- 支持实时切换，无需重新加载

## 技术实现细节

### 渐变效果
```typescript
const gradient = this.ctx.createLinearGradient(0, 0, w.width, 0);
const p = elapsed / duration;
gradient.addColorStop(Math.max(0, p), colors.active);
gradient.addColorStop(Math.min(1, p + 0.15), colors.inactive);
this.ctx.fillStyle = gradient;
```

### 发光效果
- 使用 Canvas Shadow API
- 配置参数：
  - `blur`: 4px
  - `intensity`: 1.3
  - `scaleBoost`: 1.3
- 波浪传播物理参数：
  - `speed`: 3.5 字符/秒
  - `decay`: 0.85
  - `wavelength`: 3.0 字符

### 阴影效果
```typescript
this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
this.ctx.shadowBlur = 8;
this.ctx.shadowOffsetY = 2;
```

## 改进建议

### 1. 增强现有效果

**渐变效果改进：**
- 添加彩色渐变选项（根据专辑封面主色调）
- 支持自定义渐变方向（水平/垂直/径向）
- 添加动画过渡效果

**发光效果改进：**
- 降低触发条件限制，让更多歌词可以使用
- 添加发光颜色自定义
- 支持不同的发光强度级别

**阴影效果改进：**
- 添加动态阴影（跟随音乐节奏）
- 支持彩色阴影
- 可调节阴影强度

### 2. 新效果建议

**霓虹灯效果 (Neon)：**
- 多层发光叠加
- 边缘高亮
- 适合深色主题

**粒子效果 (Particles)：**
- 歌词周围的微粒动画
- 跟随音乐节奏变化
- 使用 Canvas 或 WebGL 实现

**3D 透视效果 (Perspective)：**
- 轻微的 3D 倾斜
- 深度感
- 使用 CSS 3D Transform 或 Canvas transform

**波纹效果 (Ripple)：**
- 当前播放歌词产生波纹扩散
- 类似水波纹动画
- 可以与音频频谱联动

**打字机效果 (Typewriter)：**
- 字符逐个显示
- 适合慢歌
- 可配置显示速度

### 3. 性能优化

- 使用 OffscreenCanvas 进行离屏渲染
- 缓存不变的渲染结果
- 按需更新，避免每帧重绘
- 使用 requestAnimationFrame 优化动画

### 4. 用户体验

- 添加效果预览
- 支持效果组合
- 保存用户偏好设置
- 提供效果强度调节滑块

## 使用示例

```typescript
// 在 App.tsx 或父组件中
const [lyricsGradient, setLyricsGradient] = useState(true);
const [lyricsGlow, setLyricsGlow] = useState(true);
const [lyricsShadow, setLyricsShadow] = useState(true);

<LyricsView
  lyrics={lyrics}
  audioRef={audioRef}
  isPlaying={isPlaying}
  currentTime={currentTime}
  onSeekRequest={handleSeek}
  matchStatus={matchStatus}
  fontSize={lyricsFontSize}
  blur={lyricsGradient}  // 渐变效果
  glow={lyricsGlow}      // 发光效果
  shadow={lyricsShadow}  // 阴影效果
/>
```

## 注意事项

1. **性能影响**：发光效果使用 Canvas Shadow API，在低端设备上可能影响性能
2. **兼容性**：所有效果基于 Canvas 2D API，浏览器兼容性良好
3. **主题适配**：效果会根据当前主题（亮色/暗色）自动调整颜色
4. **移动端优化**：在移动设备上自动降低效果强度以保证流畅度

## 相关文件

- `src/components/LyricsView.tsx` - 歌词视图主组件
- `src/components/lyrics/LyricLine.ts` - 歌词行渲染类
- `src/components/TopBar.tsx` - 效果控制面板
- `src/i18n/locales/*.ts` - 多语言翻译
