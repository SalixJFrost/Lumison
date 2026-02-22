import React, { useRef, useState } from "react";
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  const activateTopBar = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsTopBarActive(true);
    hideTimeoutRef.current = setTimeout(() => {
      setIsTopBarActive(false);
      hideTimeoutRef.current = null;
    }, 2500);
  };

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") {
      return;
    }

    const wasActive = isTopBarActive;

    if (!wasActive) {
      event.preventDefault();
      event.stopPropagation();
    }

    activateTopBar();
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Close settings popup when clicking outside
  React.useEffect(() => {
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
  }, []);

  const baseTransitionClasses = "transition-all duration-500 ease-out";
  const mobileActiveClasses = isTopBarActive
    ? "opacity-100 translate-y-0 pointer-events-auto"
    : "opacity-0 -translate-y-2 pointer-events-none";
  const hoverSupportClasses = "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto";

  return (
    <div
      className="fixed top-0 left-0 w-full h-14 z-[60] group"
      onPointerDownCapture={handlePointerDownCapture}
    >
      {/* Blur Background Layer (Animate in) */}
      <div
        className={`absolute inset-0 bg-white/5 backdrop-blur-2xl border-b border-white/10 transition-all duration-500 ${isTopBarActive ? "opacity-100" : "opacity-0"} group-hover:opacity-100`}
      ></div>

      {/* Content (Animate in) */}
      <div className="relative z-10 w-full h-full px-6 flex justify-between items-center pointer-events-auto">
        {/* Logo / Title */}
        <div className={`flex items-center gap-3 ${baseTransitionClasses} ${mobileActiveClasses} ${hoverSupportClasses}`}>
          <h1 className="text-white/90 font-bold tracking-wider text-sm uppercase drop-shadow-md">
            Lumison
          </h1>
        </div>

        {/* Actions (iOS 18 Style Glass Buttons) */}
        <div
          className={`flex gap-3 ${baseTransitionClasses} delay-75 ${mobileActiveClasses} ${hoverSupportClasses}`}
        >
          {/* Settings Button */}
          <div className="relative" ref={settingsContainerRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-sm ${
                isSettingsOpen ? "text-white bg-white/20" : "text-white/80 hover:bg-white/20 hover:text-white"
              }`}
              title={t("topBar.settings")}
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
                      <label className="text-white/70 text-xs">{t("lyrics.fontSize")}</label>
                      <span className="text-white/90 text-xs font-mono">{lyricsFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="80"
                      step="2"
                      value={lyricsFontSize}
                      onChange={(e) => onLyricsFontSizeChange(Number(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Lyrics Effects */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs">{t("lyrics.effects")}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLyricsBlurChange(!lyricsBlur)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          lyricsBlur
                            ? 'bg-white/20 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t("lyrics.blur")}
                      </button>
                      <button
                        onClick={() => onLyricsGlowChange(!lyricsGlow)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          lyricsGlow
                            ? 'bg-white/20 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t("lyrics.glow")}
                      </button>
                      <button
                        onClick={() => onLyricsShadowChange(!lyricsShadow)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          lyricsShadow
                            ? 'bg-white/20 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t("lyrics.shadow")}
                      </button>
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

                  {/* About Button */}
                  <button
                    onClick={() => {
                      setIsAboutOpen(true);
                      setIsSettingsOpen(false);
                    }}
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
