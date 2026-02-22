import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { InfoIcon, FullscreenIcon, SettingsIcon, ThemeIcon } from "./Icons";
import AboutDialog from "./AboutDialog";
import ImportMusicDialog from "./ImportMusicDialog";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";

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
}

// 常量提取到组件外部
const TOPBAR_HIDE_DELAY = 5000;
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
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTopBarActive, setIsTopBarActive] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);

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
    hideTimeoutRef.current = setTimeout(() => {
      setIsTopBarActive(false);
      hideTimeoutRef.current = null;
    }, TOPBAR_HIDE_DELAY);
  }, []);

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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
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

  // 使用 useMemo 缓存样式类
  const transitionClasses = useMemo(() => ({
    base: "transition-all duration-500 ease-out",
    mobileActive: isTopBarActive
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 -translate-y-2 pointer-events-none",
    hoverSupport: "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
  }), [isTopBarActive]);

  // 歌词效果按钮配置 - 移除无效果，添加新效果
  const lyricsEffects = useMemo(() => [
    { key: 'gradient', active: lyricsBlur, onChange: onLyricsBlurChange, label: t("lyrics.gradient") || "渐变" },
    { key: 'glow', active: lyricsGlow, onChange: onLyricsGlowChange, label: t("lyrics.glow") },
    { key: 'shadow', active: lyricsShadow, onChange: onLyricsShadowChange, label: t("lyrics.shadow") },
  ], [lyricsBlur, lyricsGlow, lyricsShadow, onLyricsBlurChange, onLyricsGlowChange, onLyricsShadowChange, t]);

  return (
    <div
      className="fixed top-0 left-0 w-full h-14 z-[60] group"
      onPointerDownCapture={handlePointerDownCapture}
    >
      {/* Blur Background Layer */}
      <div
        className={`absolute inset-0 bg-white/5 backdrop-blur-2xl border-b border-white/10 transition-all duration-500 ${
          isTopBarActive ? "opacity-100" : "opacity-0"
        } group-hover:opacity-100`}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full px-6 flex justify-between items-center pointer-events-auto">
        {/* Logo */}
        <div className={`flex items-center gap-3 ${transitionClasses.base} ${transitionClasses.mobileActive} ${transitionClasses.hoverSupport}`}>
          <h1 className="text-white/90 font-bold tracking-wider text-sm uppercase drop-shadow-md">
            Lumison
          </h1>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 ${transitionClasses.base} delay-75 ${transitionClasses.mobileActive} ${transitionClasses.hoverSupport}`}>
          {/* Settings Button */}
          <div className="relative" ref={settingsContainerRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-sm ${
                isSettingsOpen ? "text-white bg-white/20" : "text-white/80 hover:bg-white/20 hover:text-white"
              }`}
              title={t("topBar.settings")}
              aria-label={t("topBar.settings")}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Settings Popup */}
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl bg-black/40 backdrop-blur-2xl saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-50">
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

                  {/* Lyrics Effects */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs">{t("lyrics.effects")}</label>
                    <div className="flex gap-2">
                      {lyricsEffects.map(({ key, active, onChange, label }) => (
                        <button
                          key={key}
                          onClick={() => onChange(!active)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'bg-white/20 text-white border border-white/20'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                          aria-pressed={active}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Button */}
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <span className="text-sm">{theme === 'dark' ? t("theme.light") : t("theme.dark")}</span>
                    <ThemeIcon className="w-4 h-4" />
                  </button>

                  {/* Language Switcher */}
                  <LanguageSwitcher variant="settings" />

                  {/* About Button */}
                  <button
                    onClick={handleAboutClick}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <span className="text-sm">{t("topBar.about")}</span>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all shadow-sm"
            title={isFullscreen ? t("topBar.exitFullscreen") : t("topBar.enterFullscreen")}
            aria-label={isFullscreen ? t("topBar.exitFullscreen") : t("topBar.enterFullscreen")}
          >
            <FullscreenIcon className="w-5 h-5" isFullscreen={isFullscreen} />
          </button>
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
