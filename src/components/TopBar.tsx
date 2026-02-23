import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { InfoIcon, FullscreenIcon, SettingsIcon, ThemeIcon, MinimizeIcon, MaximizeIcon, RestoreIcon, CloseIcon, LabIcon } from "./Icons";
import AboutDialog from "./AboutDialog";
import ImportMusicDialog from "./ImportMusicDialog";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { Window } from "@tauri-apps/api/window";

interface TopBarProps {
  disabled?: boolean;
  lyricsFontSize: number;
  onLyricsFontSizeChange: (size: number) => void;
  onImportUrl: (url: string) => Promise<boolean>;
  lyricsBlur: boolean;
  onLyricsBlurChange: (enabled: boolean) => void;
  lyricsGlow: boolean;
  onLyricsGlowChange: (enabled: boolean) => void;
  lyricsShadow: boolean;
  onLyricsShadowChange: (enabled: boolean) => void;
  onSearchClick?: () => void;
  visualizerEnabled: boolean;
  onVisualizerToggle: (enabled: boolean) => void;
  gaplessEnabled: boolean;
  onGaplessToggle: (enabled: boolean) => void;
  viewMode?: 'default' | 'album';
  onViewModeChange?: (mode: 'default' | 'album') => void;
  currentSong?: {
    title: string;
    artist: string;
    coverUrl?: string;
  } | null;
}

// 常量提取到组件外部
const TOPBAR_HIDE_DELAY = 20000; // 延长到20秒，让TopBar显示更久
const SLIDER_CONFIG = {
  min: 24,
  max: 80,
  step: 2,
} as const;

const TopBar: React.FC<TopBarProps> = ({
  disabled,
  lyricsFontSize,
  onLyricsFontSizeChange,
  onImportUrl,
  lyricsBlur,
  onLyricsBlurChange,
  lyricsGlow,
  onLyricsGlowChange,
  lyricsShadow,
  onLyricsShadowChange,
  onSearchClick,
  visualizerEnabled,
  onVisualizerToggle,
  gaplessEnabled,
  onGaplessToggle,
  viewMode = 'default',
  onViewModeChange,
  currentSong,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTopBarActive, setIsTopBarActive] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const labContainerRef = useRef<HTMLDivElement>(null);

  // 分享音乐功能
  const handleShare = useCallback(async () => {
    if (!currentSong) {
      alert(t('share.noSong') || '没有正在播放的音乐');
      return;
    }

    const shareText = `🎵 ${currentSong.title}\n🎤 ${currentSong.artist}\n\n正在使用 Lumison 播放`;
    
    // 检查是否支持 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentSong.title,
          text: shareText,
        });
      } catch (error) {
        // 用户取消分享或分享失败
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // 降级方案：复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareText);
        alert(t('share.copied') || '已复制到剪贴板');
      } catch (error) {
        console.error('Failed to copy:', error);
        alert(t('share.failed') || '分享失败');
      }
    }
  }, [currentSong, t]);

  // 使用 useCallback 优化函数
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
        });
    } else {
      document.exitFullscreen?.()
        .then(() => setIsFullscreen(false));
    }
  }, []);

  const activateTopBar = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsTopBarActive(true);
    
    // 在全屏模式或专辑模式下设置自动隐藏
    if (isFullscreen || viewMode === 'album') {
      hideTimeoutRef.current = setTimeout(() => {
        setIsTopBarActive(false);
        hideTimeoutRef.current = null;
      }, TOPBAR_HIDE_DELAY);
    }
  }, [isFullscreen, viewMode]);

  const handleSearchClick = useCallback(() => {
    onSearchClick?.();
  }, [onSearchClick]);

  const handleMinimize = useCallback(async () => {
    try {
      // For Tauri - use Window.getCurrent()
      const appWindow = Window.getCurrent();
      await appWindow.minimize();
    } catch (error) {
      // Fallback for Electron
      if (window.electronAPI?.minimize) {
        window.electronAPI.minimize();
      }
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      // For Tauri
      const appWindow = Window.getCurrent();
      const maximized = await appWindow.isMaximized();
      if (maximized) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    } catch (error) {
      // Fallback for Electron
      if (window.electronAPI?.maximize) {
        window.electronAPI.maximize();
        setIsMaximized(!isMaximized);
      } else {
        // Fallback to fullscreen API
        toggleFullscreen();
      }
    }
  }, [isMaximized, toggleFullscreen]);

  const handleClose = useCallback(async () => {
    try {
      // For Tauri
      const appWindow = Window.getCurrent();
      await appWindow.close();
    } catch (error) {
      // Fallback for Electron
      if (window.electronAPI?.close) {
        window.electronAPI.close();
      } else {
        // Fallback for web
        window.close();
      }
    }
  }, []);

  // 监听鼠标移动，当鼠标在顶部区域时显示TopBar
  useEffect(() => {
    if (!isFullscreen && viewMode !== 'album') return;

    const handleMouseMove = (e: MouseEvent) => {
      // 当鼠标在顶部100px区域时显示TopBar
      if (e.clientY < 100) {
        activateTopBar();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen, viewMode, activateTopBar]);

  const handlePointerDownCapture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") {
      return;
    }

    const wasActive = isTopBarActive;

    if (!wasActive) {
      event.preventDefault();
      event.stopPropagation();
    }

    activateTopBar();
  }, [isTopBarActive, activateTopBar]);

  const handleAboutClick = useCallback(() => {
    setIsAboutOpen(true);
    setIsSettingsOpen(false);
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    try {
      const { UpdateService } = await import('../services/updateService');
      const updateInfo = await UpdateService.checkForUpdates();
      
      if (updateInfo.available) {
        // 显示更新通知
        alert(`发现新版本 ${updateInfo.latestVersion}\n\n${updateInfo.body || ''}`);
      } else {
        alert('当前已是最新版本');
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      alert('检查更新失败，请稍后重试');
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // 进入全屏时，TopBar 默认显示
      // 退出全屏时，TopBar 常驻显示
      if (!isNowFullscreen) {
        setIsTopBarActive(true);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // View mode change listener - hide TopBar when entering album mode
  useEffect(() => {
    if (viewMode === 'album') {
      // 进入专辑模式时，立即隐藏TopBar
      setIsTopBarActive(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    } else {
      // 退出专辑模式时，显示TopBar
      setIsTopBarActive(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
  }, [viewMode]);

  // Check if window is maximized on mount (for Tauri)
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const appWindow = Window.getCurrent();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        // Not in Tauri environment
        console.debug('Not in Tauri environment');
      }
    };
    checkMaximized();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Close settings popup when clicking outside
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

  // Close lab popup when clicking outside
  useEffect(() => {
    if (!isLabOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        labContainerRef.current &&
        !labContainerRef.current.contains(event.target as Node)
      ) {
        setIsLabOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLabOpen]);

  // 使用 useMemo 缓存样式类
  const transitionClasses = useMemo(() => {
    // 非全屏且非专辑模式：始终显示
    // 全屏模式或专辑模式：根据 isTopBarActive 状态显示/隐藏
    const shouldShow = (!isFullscreen && viewMode !== 'album') || isTopBarActive;
    
    return {
      base: "transition-all duration-500 ease-out",
      mobileActive: shouldShow
        ? "opacity-100 translate-y-0 pointer-events-auto"
        : "opacity-0 -translate-y-2 pointer-events-none",
      hoverSupport: "", // 移除 group-hover，完全依赖定时器控制
    };
  }, [isTopBarActive, isFullscreen, viewMode]);

  // 歌词效果按钮配置 - 移除无效果，添加新效果
  const lyricsEffects = useMemo(() => [
    { key: 'gradient', active: lyricsBlur, onChange: onLyricsBlurChange, label: t("lyrics.gradient") || "渐变" },
    { key: 'glow', active: lyricsGlow, onChange: onLyricsGlowChange, label: t("lyrics.glow") },
    { key: 'shadow', active: lyricsShadow, onChange: onLyricsShadowChange, label: t("lyrics.shadow") },
  ], [lyricsBlur, lyricsGlow, lyricsShadow, onLyricsBlurChange, onLyricsGlowChange, onLyricsShadowChange, t]);
  
  // 可视化器切换按钮
  const visualizerToggle = useMemo(() => ({
    key: 'visualizer',
    active: visualizerEnabled,
    onChange: onVisualizerToggle,
    label: t("visualizer.toggle") || "可视化器",
  }), [visualizerEnabled, onVisualizerToggle, t]);

  return (
    <div
      className="fixed top-0 left-0 w-full h-14 z-[60] group"
      onPointerDownCapture={handlePointerDownCapture}
      onMouseEnter={activateTopBar}
    >
      {/* Blur Background Layer */}
      <div
        className={`absolute inset-0 bg-white/5 backdrop-blur-2xl transition-all duration-500 ${
          (!isFullscreen && viewMode !== 'album') || isTopBarActive ? "opacity-100" : "opacity-0"
        }`}
        data-tauri-drag-region
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full px-6 flex justify-between items-center pointer-events-auto">
        {/* Left Section: Share + Logo */}
        <div 
          className={`flex items-center gap-3 ${transitionClasses.base} ${transitionClasses.mobileActive} ${transitionClasses.hoverSupport}`}
          data-tauri-drag-region
        >
          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={!currentSong}
            onPointerDown={(e) => e.stopPropagation()}
            className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 ease-out shadow-sm hover:scale-110 active:scale-95 ${
              currentSong
                ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            title={t('share.title') || '分享音乐'}
            aria-label={t('share.title') || '分享音乐'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Logo */}
          <h1 className="text-white/90 font-bold tracking-wider text-sm uppercase drop-shadow-md select-none">
            Lumison
          </h1>
        </div>

        {/* Search Bar */}
        <div 
          className={`flex-1 max-w-xl mx-8 ${transitionClasses.base} ${transitionClasses.mobileActive} ${transitionClasses.hoverSupport}`}
          data-tauri-drag-region
        >
          <button
            onClick={handleSearchClick}
            className="w-full h-9 px-4 rounded-full bg-white/10 backdrop-blur-xl flex items-center gap-3 text-white/60 hover:bg-white/15 hover:text-white/80 transition-all duration-300 ease-out shadow-sm group/search pointer-events-auto hover:scale-[1.02] active:scale-[0.98]"
            aria-label={t("search.placeholder")}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm truncate">{t("search.placeholder")}</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs text-white/50 font-mono group-hover/search:bg-white/15 group-hover/search:text-white/60 transition-all">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Actions */}
        <div className={`flex gap-2 ${transitionClasses.base} delay-75 ${transitionClasses.mobileActive} ${transitionClasses.hoverSupport}`}>
          {/* Settings Button */}
          <div className="relative" ref={settingsContainerRef} onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center transition-all duration-300 ease-out shadow-sm hover:scale-110 active:scale-95 ${
                isSettingsOpen ? "text-white bg-white/20 scale-110" : "text-white/80 hover:bg-white/20 hover:text-white"
              }`}
              title={t("topBar.settings")}
              aria-label={t("topBar.settings")}
            >
              <SettingsIcon className={`w-5 h-5 transition-transform duration-500 ease-out ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Settings Popup */}
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl bg-black/40 backdrop-blur-2xl saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 space-y-6">
                  <h3 className="text-white font-semibold mb-4 text-sm">{t("topBar.settings")}</h3>
                  
                  {/* Lyrics Font Size */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="lyrics-font-size" className="text-white/70 text-xs">
                        {t("lyrics.fontSize")}
                      </label>
                      <span className="text-white/90 text-xs font-mono">{lyricsFontSize}px</span>
                    </div>
                    <input
                      id="lyrics-font-size"
                      type="range"
                      min={SLIDER_CONFIG.min}
                      max={SLIDER_CONFIG.max}
                      step={SLIDER_CONFIG.step}
                      value={lyricsFontSize}
                      onChange={(e) => onLyricsFontSizeChange(Number(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Theme Button */}
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-sm">{theme === 'dark' ? t("theme.light") : t("theme.dark")}</span>
                    <ThemeIcon className="w-4 h-4 transition-transform duration-500 hover:rotate-180" />
                  </button>

                  {/* View Mode Toggle */}
                  {onViewModeChange && (
                    <div className="space-y-2">
                      <label className="text-white/70 text-xs">{t("viewMode.label") || "视图模式"}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewModeChange('default')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
                            viewMode === 'default'
                              ? 'bg-white/20 text-white border border-white/20 shadow-lg'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {t("viewMode.default") || "默认"}
                        </button>
                        <button
                          onClick={() => onViewModeChange('album')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
                            viewMode === 'album'
                              ? 'bg-white/20 text-white border border-white/20 shadow-lg'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {t("viewMode.album") || "专辑"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Language Switcher */}
                  <LanguageSwitcher variant="settings" />

                  {/* Check Update Button */}
                  <button
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm">{t("topBar.checkUpdate") || "检查更新"}</span>
                    {isCheckingUpdate ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>

                  {/* About Button */}
                  <button
                    onClick={handleAboutClick}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-sm">{t("topBar.about")}</span>
                    <InfoIcon className="w-4 h-4 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lab Button */}
          <div className="relative" ref={labContainerRef} onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsLabOpen(!isLabOpen)}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center transition-all duration-300 ease-out shadow-sm hover:scale-110 active:scale-95 ${
                isLabOpen ? "text-white bg-white/20 scale-110" : "text-white/80 hover:bg-white/20 hover:text-white"
              }`}
              title={t("topBar.lab")}
              aria-label={t("topBar.lab")}
            >
              <LabIcon className={`w-5 h-5 transition-transform duration-500 ease-out ${isLabOpen ? 'rotate-12' : ''}`} />
            </button>

            {/* Lab Popup */}
            {isLabOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl bg-black/40 backdrop-blur-2xl saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 space-y-6">
                  <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
                    <LabIcon className="w-4 h-4" />
                    {t("topBar.lab")}
                  </h3>
                  
                  {/* Lyrics Effects */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs">{t("lyrics.effects")}</label>
                    <div className="flex gap-2">
                      {lyricsEffects.map(({ key, active, onChange, label }) => (
                        <button
                          key={key}
                          onClick={() => onChange(!active)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
                            active
                              ? 'bg-white/20 text-white border border-white/20 shadow-lg'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                          aria-pressed={active}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visualizer Toggle */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs">{t("visualizer.label") || "音频可视化"}</label>
                    <button
                      onClick={() => visualizerToggle.onChange(!visualizerToggle.active)}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${
                        visualizerToggle.active
                          ? 'bg-white/20 text-white border border-white/20 shadow-lg'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-pressed={visualizerToggle.active}
                    >
                      <div className="flex items-center justify-between">
                        <span>{visualizerToggle.label}</span>
                        <span className="text-xs opacity-60">
                          {visualizerToggle.active ? '✓' : '○'}
                        </span>
                      </div>
                      {!visualizerToggle.active && (
                        <div className="text-xs opacity-50 mt-1 text-left">
                          {t("visualizer.memoryHint") || "关闭可节省 5-10MB 内存"}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Audio Transitions */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs">{t("audioTransition.label") || "音频过渡"}</label>
                    <div className="space-y-2">
                      {/* Gapless Playback */}
                      <button
                        onClick={() => onGaplessToggle(!gaplessEnabled)}
                        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${
                          gaplessEnabled
                            ? 'bg-white/20 text-white border border-white/20 shadow-lg'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        aria-pressed={gaplessEnabled}
                      >
                        <div className="flex items-center justify-between">
                          <span>{t("audioTransition.gapless") || "无缝切换"}</span>
                          <span className="text-xs opacity-60">
                            {gaplessEnabled ? '✓' : '○'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 ease-out shadow-sm hover:scale-110 active:scale-95"
            title={isFullscreen ? t("topBar.exitFullscreen") : t("topBar.enterFullscreen")}
            aria-label={isFullscreen ? t("topBar.exitFullscreen") : t("topBar.enterFullscreen")}
          >
            <FullscreenIcon className="w-5 h-5 transition-transform duration-300" isFullscreen={isFullscreen} />
          </button>

          {/* Window Controls */}
          <div className="flex gap-2 ml-2" onPointerDown={(e) => e.stopPropagation()}>
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:bg-white/15 hover:text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95"
              title="Minimize"
              aria-label="Minimize"
            >
              <MinimizeIcon className="w-4 h-4 transition-transform duration-200" />
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={handleMaximize}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:bg-white/15 hover:text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95"
              title={isMaximized ? "Restore" : "Maximize"}
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <RestoreIcon className="w-4 h-4 transition-all duration-300" />
              ) : (
                <MaximizeIcon className="w-4 h-4 transition-all duration-300" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:bg-red-500/80 hover:text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95"
              title="Close"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>

      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ImportMusicDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={onImportUrl}
      />
    </div>
  );
};

export default TopBar;
