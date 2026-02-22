import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useToast } from "./hooks/useToast";
import { PlayState, Song } from "./types";
import FluidBackground from "./components/FluidBackground";
import Controls from "./components/Controls";
import LyricsView from "./components/LyricsView";
import PlaylistPanel from "./components/PlaylistPanel";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import TopBar from "./components/TopBar";
import SearchModal from "./components/SearchModal";
import SpeedIndicator from "./components/SpeedIndicator";
import UpdateNotification from "./components/UpdateNotification";
import { usePlaylist } from "./hooks/usePlaylist";
import { usePlayer } from "./hooks/usePlayer";
import { keyboardRegistry } from "./services/ui/keyboardRegistry";
import MediaSessionController from "./components/MediaSessionController";
import { useTheme } from "./contexts/ThemeContext";
import { useI18n } from "./contexts/I18nContext";
import { logSupportedFormats } from "./services/utils";
import { usePerformanceOptimization, useOptimizedAudio } from "./hooks/usePerformanceOptimization";
import { UpdateService } from "./services/updateService";

const App: React.FC = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { t } = useI18n();
  
  // Performance monitoring
  const perfState = usePerformanceOptimization();
  
  // Log supported audio formats on app start
  useEffect(() => {
    logSupportedFormats();
  }, []);

  // Check for updates on app start (silent check)
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const updateInfo = await UpdateService.checkForUpdates();
        if (updateInfo.available && updateInfo.latestVersion) {
          // Wait 3 seconds before showing notification (don't interrupt startup)
          setTimeout(() => {
            setUpdateVersion(updateInfo.latestVersion!);
            setUpdateAvailable(true);
          }, 3000);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    checkUpdates();
  }, []);
  
  const playlist = usePlaylist();
  const player = usePlayer({
    queue: playlist.queue,
    originalQueue: playlist.originalQueue,
    updateSongInQueue: playlist.updateSongInQueue,
    setQueue: playlist.setQueue,
    setOriginalQueue: playlist.setOriginalQueue,
  });

  const {
    audioRef,
    currentSong,
    playState,
    currentTime,
    duration,
    playMode,
    matchStatus,
    accentColor,
    togglePlay,
    toggleMode,
    handleSeek,
    playNext,
    playPrev,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlaylistAddition,
    loadLyricsFile,
    playIndex,
    addSongAndPlay,
    handleAudioEnded,
    play,
    pause,
    resolvedAudioSrc,
    isBuffering,
  } = player;

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const speedIndicatorTimerRef = useRef<number | null>(null);

  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activePanel, setActivePanel] = useState<"controls" | "lyrics">(
    "controls",
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const mobileViewportRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });
  const [lyricsFontSize, setLyricsFontSize] = useState(46);
  const [lyricsBlur, setLyricsBlur] = useState(false);
  const [lyricsGlow, setLyricsGlow] = useState(false);
  const [lyricsShadow, setLyricsShadow] = useState(true);
  
  // Visualizer state - disabled by default to save memory
  const [visualizerEnabled, setVisualizerEnabled] = useState(false);

  // Update notification state
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');

  // Optimize audio element
  useOptimizedAudio(audioRef);

  // Adaptive quality based on performance
  const effectiveLyricsBlur = useMemo(() => {
    return perfState.shouldReduceEffects ? false : lyricsBlur;
  }, [perfState.shouldReduceEffects, lyricsBlur]);

  const effectiveLyricsGlow = useMemo(() => {
    return perfState.shouldReduceEffects ? false : lyricsGlow;
  }, [perfState.shouldReduceEffects, lyricsGlow]);

  // Speed change handler with indicator
  const handleSpeedChange = (newSpeed: number) => {
    player.setSpeed(newSpeed);
    
    // Show speed indicator
    setShowSpeedIndicator(true);
    
    // Clear existing timer
    if (speedIndicatorTimerRef.current) {
      window.clearTimeout(speedIndicatorTimerRef.current);
    }
    
    // Hide after 1.5 seconds
    speedIndicatorTimerRef.current = window.setTimeout(() => {
      setShowSpeedIndicator(false);
    }, 1500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (speedIndicatorTimerRef.current) {
        window.clearTimeout(speedIndicatorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 1024px)");
    const updateLayout = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileLayout(event.matches);
    };
    updateLayout(query);
    query.addEventListener("change", updateLayout);
    return () => query.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setActivePanel("controls");
      setTouchStartX(null);
      setDragOffsetX(0);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => {
      setPaneWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    window.visualViewport?.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      window.visualViewport?.removeEventListener("resize", updateWidth);
    };
  }, [isMobileLayout]);

  // Global Keyboard Registry Initialization
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyboardRegistry.handle(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Global Search Shortcut (Registered directly via useEffect for simplicity, or could use useKeyboardScope with high priority)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileChange = async (files: FileList) => {
    const wasEmpty = playlist.queue.length === 0;
    const addedSongs = await playlist.addLocalFiles(files);
    if (addedSongs.length > 0) {
      setTimeout(() => {
        handlePlaylistAddition(addedSongs, wasEmpty);
      }, 0);
    }
  };

  const handleImportUrl = async (input: string): Promise<boolean> => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const wasEmpty = playlist.queue.length === 0;
    const result = await playlist.importFromUrl(trimmed);
    if (!result.success) {
      toast.error(result.message ?? "Failed to load songs from URL");
      return false;
    }
    if (result.songs.length > 0) {
      setTimeout(() => {
        handlePlaylistAddition(result.songs, wasEmpty);
      }, 0);
      toast.success(`Successfully imported ${result.songs.length} songs`);
      return true;
    }
    return false;
  };

  const handleImportAndPlay = (song: Song) => {
    // Check if song already exists in queue (by neteaseId for cloud songs, or by id)
    const existingIndex = playlist.queue.findIndex((s) => {
      if (song.isNetease && s.isNetease) {
        return s.neteaseId === song.neteaseId;
      }
      return s.id === song.id;
    });

    if (existingIndex !== -1) {
      // Song already in queue, just play it
      playIndex(existingIndex);
    } else {
      // Add and play atomically - no race conditions!
      addSongAndPlay(song);
    }
  };

  const handleAddToQueue = (song: Song) => {
    playlist.setQueue((prev) => [...prev, song]);
    playlist.setOriginalQueue((prev) => [...prev, song]);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setDragOffsetX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const currentX = event.touches[0]?.clientX;
    if (currentX === undefined) return;
    const deltaX = currentX - touchStartX;
    const containerWidth = event.currentTarget.getBoundingClientRect().width;
    const limitedDelta = Math.max(
      Math.min(deltaX, containerWidth),
      -containerWidth,
    );
    setDragOffsetX(limitedDelta);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
      return;
    }
    const deltaX = endX - touchStartX;
    const threshold = 60;
    if (deltaX > threshold) {
      setActivePanel("controls");
    } else if (deltaX < -threshold) {
      setActivePanel("lyrics");
    }
    setTouchStartX(null);
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const handleTouchCancel = () => {
    if (isMobileLayout) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
    }
  };

  const toggleIndicator = () => {
    setActivePanel((prev) => (prev === "controls" ? "lyrics" : "controls"));
    setDragOffsetX(0);
    setIsDragging(false);
  };

  // Memoize controls section to prevent unnecessary re-renders
  const controlsSection = useMemo(() => (
    <div className="flex flex-col items-center justify-center w-full h-full z-30 relative p-4">
      <div className="relative flex flex-col items-center gap-8 w-full max-w-[360px]">
        <Controls
          isPlaying={playState === PlayState.PLAYING}
          onPlayPause={togglePlay}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          title={currentSong?.title || t("player.welcomeTitle")}
          artist={currentSong?.artist || t("player.selectSong")}
          audioRef={audioRef}
          onNext={playNext}
          onPrev={playPrev}
          playMode={playMode}
          onToggleMode={toggleMode}
          onTogglePlaylist={() => setShowPlaylist(true)}
          accentColor={accentColor}
          volume={volume}
          onVolumeChange={setVolume}
          speed={player.speed}
          preservesPitch={player.preservesPitch}
          onSpeedChange={handleSpeedChange}
          onTogglePreservesPitch={player.togglePreservesPitch}
          coverUrl={currentSong?.coverUrl}
          isBuffering={isBuffering}
          showVolumePopup={showVolumePopup}
          setShowVolumePopup={setShowVolumePopup}
          showSettingsPopup={showSettingsPopup}
          setShowSettingsPopup={setShowSettingsPopup}
          visualizerEnabled={visualizerEnabled}
        />

        {/* Floating Playlist Panel */}
        <PlaylistPanel
          isOpen={showPlaylist}
          onClose={() => setShowPlaylist(false)}
          queue={playlist.queue}
          currentSongId={currentSong?.id}
          onPlay={playIndex}
          onImport={handleImportUrl}
          onRemove={playlist.removeSongs}
          accentColor={accentColor}
          onFilesSelected={handleFileChange}
          onSearchClick={() => setShowSearch(true)}
        />
      </div>
    </div>
  ), [playState, togglePlay, currentTime, duration, handleSeek, currentSong?.title, currentSong?.artist, currentSong?.id, currentSong?.coverUrl, t, audioRef, playNext, playPrev, playMode, toggleMode, accentColor, volume, player.speed, player.preservesPitch, handleSpeedChange, player.togglePreservesPitch, isBuffering, showVolumePopup, showSettingsPopup, visualizerEnabled, showPlaylist, playlist.queue, playIndex, handleImportUrl, playlist.removeSongs, handleFileChange]);

  const lyricsVersion = currentSong?.lyrics ? currentSong.lyrics.length : 0;
  const lyricsKey = currentSong ? `${currentSong.id}-${lyricsVersion}` : "no-song";

  // Memoize lyrics section to prevent unnecessary re-renders
  const lyricsSection = useMemo(() => (
    <div className="w-full h-full relative z-20 flex flex-col justify-center px-4 lg:pl-4">
      <LyricsView
        key={lyricsKey}
        lyrics={currentSong?.lyrics || []}
        audioRef={audioRef}
        isPlaying={playState === PlayState.PLAYING}
        currentTime={currentTime}
        onSeekRequest={handleSeek}
        matchStatus={matchStatus}
        fontSize={lyricsFontSize}
        blur={effectiveLyricsBlur}
        glow={effectiveLyricsGlow}
        shadow={lyricsShadow}
      />
    </div>
  ), [lyricsKey, currentSong?.lyrics, audioRef, playState, currentTime, handleSeek, matchStatus, lyricsFontSize, effectiveLyricsBlur, effectiveLyricsGlow, lyricsShadow]);

  const fallbackWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const effectivePaneWidth = paneWidth || fallbackWidth;
  const baseOffset = activePanel === "lyrics" ? -effectivePaneWidth : 0;
  const mobileTranslate = baseOffset + dragOffsetX;

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden theme-transition bg-black">
      <FluidBackground
        key={isMobileLayout ? "mobile" : "desktop"}
        colors={currentSong?.colors || []}
        coverUrl={currentSong?.coverUrl}
        isPlaying={playState === PlayState.PLAYING}
        isMobileLayout={isMobileLayout}
        theme={theme}
      />

      <audio
        ref={audioRef}
        src={resolvedAudioSrc ?? currentSong?.fileUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <KeyboardShortcuts
        isPlaying={playState === PlayState.PLAYING}
        onPlayPause={togglePlay}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onVolumeChange={setVolume}
        onToggleMode={toggleMode}
        onTogglePlaylist={() => setShowPlaylist((prev) => !prev)}
        speed={player.speed}
        onSpeedChange={handleSpeedChange}
        onToggleVolumeDialog={() => setShowVolumePopup((prev) => !prev)}
        onToggleSpeedDialog={() => setShowSettingsPopup((prev) => !prev)}
      />

      <SpeedIndicator speed={player.speed} show={showSpeedIndicator} />

      {/* Update Notification */}
      {updateAvailable && (
        <UpdateNotification
          version={updateVersion}
          onClose={() => setUpdateAvailable(false)}
          onUpdate={() => {}}
        />
      )}

      <MediaSessionController
        currentSong={currentSong ?? null}
        playState={playState}
        currentTime={currentTime}
        duration={duration}
        playbackRate={player.speed}
        onPlay={play}
        onPause={pause}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
      />

      {/* Top Bar */}
      <TopBar
        lyricsFontSize={lyricsFontSize}
        onLyricsFontSizeChange={setLyricsFontSize}
        onImportUrl={handleImportUrl}
        lyricsBlur={lyricsBlur}
        onLyricsBlurChange={setLyricsBlur}
        lyricsGlow={lyricsGlow}
        onLyricsGlowChange={setLyricsGlow}
        lyricsShadow={lyricsShadow}
        onLyricsShadowChange={setLyricsShadow}
        onSearchClick={() => setShowSearch(true)}
        visualizerEnabled={visualizerEnabled}
        onVisualizerToggle={setVisualizerEnabled}
      />

      {/* Search Modal - Always rendered to preserve state, visibility handled internally */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        queue={playlist.queue}
        onPlayQueueIndex={playIndex}
        onImportAndPlay={handleImportAndPlay}
        onAddToQueue={handleAddToQueue}
        currentSong={currentSong}
        isPlaying={playState === PlayState.PLAYING}
        accentColor={accentColor}
      />

      {/* Main Content Split */}
      {isMobileLayout ? (
        <div className="flex-1 relative w-full h-full">
          <div
            ref={mobileViewportRef}
            className="w-full h-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div
              className={`flex h-full ${isDragging ? "transition-none" : "transition-transform duration-300"}`}
              style={{
                width: `${effectivePaneWidth * 2}px`,
                transform: `translateX(${mobileTranslate}px)`,
              }}
            >
              <div
                className="flex-none h-full"
                style={{ width: effectivePaneWidth }}
              >
                {controlsSection}
              </div>
              <div
                className="flex-none h-full"
                style={{ width: effectivePaneWidth }}
              >
                {lyricsSection}
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={toggleIndicator}
              className="relative flex h-4 w-28 items-center justify-center rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 transition-transform duration-200 active:scale-105"
              style={{
                transform: `translateX(${isDragging ? dragOffsetX * 0.04 : 0}px)`,
              }}
            >
              <span
                className={`absolute inset-0 rounded-full bg-white/25 backdrop-blur-[30px] transition-opacity duration-200 ${activePanel === "controls" ? "opacity-90" : "opacity-60"
                  }`}
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid lg:grid-cols-2 w-full h-full">
          {controlsSection}
          {lyricsSection}
        </div>
      )}
    </div>
  );
};

export default App;
