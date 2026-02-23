import { useState, useEffect, useCallback, useRef } from "react";
import { Song } from "../types";
import { NeteaseTrackInfo } from "../services/music/lyricsService";
import { useQueueSearchProvider } from "./useQueueSearchProvider";
import {
  useNeteaseSearchProvider,
  NeteaseSearchProviderExtended,
} from "./useNeteaseSearchProvider";
import { useInternetArchiveSearch } from "./useInternetArchiveSearch";
import { StreamingTrack } from "../services/streaming/types";

export type SearchSource = "queue" | "netease" | "archive";
export type SearchResultItem = Song | NeteaseTrackInfo | StreamingTrack;

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  track: SearchResultItem;
  type: SearchSource;
}

interface UseSearchModalParams {
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  isOpen: boolean;
}

export const useSearchModal = ({
  queue,
  currentSong,
  isPlaying,
  isOpen,
}: UseSearchModalParams) => {
  // Search query state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchSource>("queue");

  // Navigation State
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Search Providers
  const queueProvider = useQueueSearchProvider({ queue });
  const neteaseProvider = useNeteaseSearchProvider();
  const archiveProvider = useInternetArchiveSearch();

  // Queue search results (real-time)
  const [queueResults, setQueueResults] = useState<{ s: Song; i: number }[]>(
    [],
  );

  // Offset for Netease pagination
  const [neteaseOffset, setNeteaseOffset] = useState(0);
  
  // Archive search state
  const [archiveHasSearched, setArchiveHasSearched] = useState(false);
  
  const LIMIT = 30;

  // Update queue results in real-time
  useEffect(() => {
    if (activeTab === "queue") {
      queueProvider.search(query).then((results) => {
        const mappedResults = (results as Song[]).map((s) => {
          const originalIndex = queue.findIndex((qs) => qs.id === s.id);
          return { s, i: originalIndex };
        });
        setQueueResults(mappedResults);
      });
    }
  }, [query, activeTab, queue]);

  // Auto-search for Netease when query changes (with debounce)
  useEffect(() => {
    if (activeTab === "netease" && query.trim().length > 0) {
      const timer = setTimeout(() => {
        performNeteaseSearch();
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    }
  }, [query, activeTab]);

  // Auto-search for Archive when query changes (with debounce)
  useEffect(() => {
    if (activeTab === "archive" && query.trim().length > 0) {
      const timer = setTimeout(() => {
        performArchiveSearch();
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    }
  }, [query, activeTab]);

  // Reset selected index when switching tabs or query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [activeTab, query]);

  // Reset context menu when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContextMenu(null);
    }
  }, [isOpen]);

  // --- Search Actions ---

  const performNeteaseSearch = useCallback(async () => {
    if (!query.trim()) return;
    setNeteaseOffset(0);
    setSelectedIndex(-1);
    await neteaseProvider.performSearch(query);
  }, [query, neteaseProvider]);

  const loadMoreNetease = useCallback(async () => {
    if (neteaseProvider.isLoading || !neteaseProvider.hasMore) return;
    const nextOffset = neteaseOffset + LIMIT;
    await neteaseProvider.loadMore(query, nextOffset, LIMIT);
    setNeteaseOffset(nextOffset);
  }, [neteaseProvider, neteaseOffset, query]);

  const performArchiveSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSelectedIndex(-1);
    setArchiveHasSearched(true);
    await archiveProvider.search(query, { limit: 20 });
  }, [query, archiveProvider]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (activeTab === "netease") {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100) {
          loadMoreNetease();
        }
      }
    },
    [activeTab, loadMoreNetease],
  );

  // --- Navigation ---

  const scrollToItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  const navigateDown = useCallback(() => {
    let listLength = 0;
    if (activeTab === "queue") {
      listLength = queueResults.length;
    } else if (activeTab === "netease") {
      listLength = neteaseProvider.results.length;
    } else if (activeTab === "archive") {
      listLength = archiveProvider.results.length;
    }
    
    if (listLength === 0) return;

    const next = Math.min(selectedIndex + 1, listLength - 1);
    setSelectedIndex(next);
    scrollToItem(next);
  }, [
    activeTab,
    selectedIndex,
    queueResults.length,
    neteaseProvider.results.length,
    archiveProvider.results.length,
    scrollToItem,
  ]);

  const navigateUp = useCallback(() => {
    const prev = Math.max(selectedIndex - 1, 0);
    setSelectedIndex(prev);
    scrollToItem(prev);
  }, [selectedIndex, scrollToItem]);

  const switchTab = useCallback(() => {
    setActiveTab((prev) => {
      if (prev === "queue") return "netease";
      if (prev === "netease") return "archive";
      return "queue";
    });
    setSelectedIndex(-1);
  }, []);

  // --- Context Menu ---

  const openContextMenu = useCallback(
    (e: React.MouseEvent, item: SearchResultItem, type: SearchSource) => {
      e.preventDefault();
      let x = e.clientX;
      let y = e.clientY;

      if (x + 200 > window.innerWidth) x -= 200;
      if (y + 100 > window.innerHeight) y -= 100;

      setContextMenu({
        visible: true,
        x,
        y,
        track: item,
        type,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // --- Now Playing Matcher ---
  const isNowPlaying = useCallback(
    (item: SearchResultItem) => {
      if (!currentSong) return false;
      if ("isNetease" in item && item.isNetease && currentSong.isNetease) {
        return item.neteaseId === currentSong.neteaseId;
      }
      return (
        item.title === currentSong.title && item.artist === currentSong.artist
      );
    },
    [currentSong],
  );

  // Determine what to show in results area
  const showNeteasePrompt =
    activeTab === "netease" &&
    !neteaseProvider.hasSearched &&
    query.trim().length > 0;

  const showNeteaseEmpty =
    activeTab === "netease" &&
    neteaseProvider.hasSearched &&
    neteaseProvider.results.length === 0 &&
    !neteaseProvider.isLoading;

  const showNeteaseLoading =
    activeTab === "netease" &&
    neteaseProvider.isLoading &&
    neteaseProvider.results.length === 0;

  const showNeteaseInitial =
    activeTab === "netease" &&
    !neteaseProvider.hasSearched &&
    query.trim().length === 0;

  const showArchivePrompt =
    activeTab === "archive" &&
    !archiveHasSearched &&
    query.trim().length > 0;

  const showArchiveEmpty =
    activeTab === "archive" &&
    archiveHasSearched &&
    archiveProvider.results.length === 0 &&
    !archiveProvider.isLoading;

  const showArchiveLoading =
    activeTab === "archive" &&
    archiveProvider.isLoading &&
    archiveProvider.results.length === 0;

  const showArchiveInitial =
    activeTab === "archive" &&
    !archiveHasSearched &&
    query.trim().length === 0;

  return {
    // State
    query,
    setQuery,
    activeTab,
    setActiveTab,
    selectedIndex,
    contextMenu,

    // Providers
    queueProvider,
    neteaseProvider,
    archiveProvider,

    // Results
    queueResults,

    // Refs
    itemRefs,

    // Actions
    performNeteaseSearch,
    performArchiveSearch,
    loadMoreNetease,
    handleScroll,

    // Navigation
    navigateDown,
    navigateUp,
    switchTab,
    scrollToItem,

    // Context Menu
    openContextMenu,
    closeContextMenu,

    // Helpers
    isNowPlaying,

    // Display flags
    showNeteasePrompt,
    showNeteaseEmpty,
    showNeteaseInitial,
    showNeteaseLoading,
    showArchivePrompt,
    showArchiveEmpty,
    showArchiveInitial,
    showArchiveLoading,

    // Constants
    LIMIT,
  };
};
