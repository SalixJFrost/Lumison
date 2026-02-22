import { useCallback, useState } from "react";
import { Song } from "../types";
import {
  extractColors,
  parseAudioMetadata,
  parseNeteaseLink,
} from "../services/utils";
import { parseLyrics } from "../services/lyrics";
import {
  fetchNeteasePlaylist,
  fetchNeteaseSong,
  getNeteaseAudioUrl,
} from "../services/music/lyricsService";
import {
  fetchAudioFromUrl,
} from "../services/music/audioStreamService";
import { audioResourceCache } from "../services/cache";
import { extractEmbeddedLyrics, findMatchingLRCFile, loadLRCFile, getLyricsPriority } from "../services/lyrics/id3Parser";

export interface ImportResult {
  success: boolean;
  message?: string;
  songs: Song[];
}

export const usePlaylist = () => {
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);

  const updateSongInQueue = useCallback(
    (id: string, updates: Partial<Song>) => {
      setQueue((prev) =>
        prev.map((song) => (song.id === id ? { ...song, ...updates } : song)),
      );
      setOriginalQueue((prev) =>
        prev.map((song) => (song.id === id ? { ...song, ...updates } : song)),
      );
    },
    [],
  );

  const appendSongs = useCallback((songs: Song[]) => {
    if (songs.length === 0) return;
    setOriginalQueue((prev) => [...prev, ...songs]);
    setQueue((prev) => [...prev, ...songs]);
  }, []);

  const removeSongs = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setQueue((prev) => {
      prev.forEach((song) => {
        if (ids.includes(song.id) && song.fileUrl && !song.fileUrl.startsWith("blob:")) {
          audioResourceCache.delete(song.fileUrl);
        }
      });
      return prev.filter((song) => !ids.includes(song.id));
    });
    setOriginalQueue((prev) => prev.filter((song) => !ids.includes(song.id)));
  }, []);

  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList =
        files instanceof FileList ? Array.from(files) : Array.from(files);

      // Separate audio and lyrics files
      const audioFiles: File[] = [];
      const lyricsFiles: File[] = [];

      fileList.forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "lrc" || ext === "txt") {
          lyricsFiles.push(file);
        } else {
          audioFiles.push(file);
        }
      });

      const newSongs: Song[] = [];

      // Build lyrics map: extract song title from filename (part after first "-")
      // Remove Netease IDs like (12345678) from title
      const lyricsMap = new Map<string, File>();
      lyricsFiles.forEach((file) => {
        const basename = file.name.replace(/\.[^/.]+$/, "");
        const firstDashIndex = basename.indexOf("-");

        // If has "-", use part after first dash as title, otherwise use full basename
        let title = firstDashIndex > 0 && firstDashIndex < basename.length - 1
          ? basename.substring(firstDashIndex + 1).trim()
          : basename;

        // Remove Netease ID pattern like (12345678) or [12345678]
        title = title.replace(/[\(\[]?\d{7,9}[\)\]]?/g, "").trim();

        lyricsMap.set(title.toLowerCase(), file);
      });

      // Process audio files
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        const url = URL.createObjectURL(file);
        const basename = file.name.replace(/\.[^/.]+$/, "");
        let title = basename;
        let artist = "Unknown Artist";
        let coverUrl: string | undefined;
        let colors: string[] | undefined;
        let lrcFileLyrics: { time: number; text: string }[] = [];
        let embeddedLyrics: { time: number; text: string }[] = [];

        const nameParts = title.split("-");
        if (nameParts.length > 1) {
          artist = nameParts[0].trim();
          title = nameParts[1].trim();
        }

        try {
          // 1. Extract basic metadata
          const metadata = await parseAudioMetadata(file);
          if (metadata.title) title = metadata.title;
          if (metadata.artist) artist = metadata.artist;
          if (metadata.picture) {
            coverUrl = metadata.picture;
            colors = await extractColors(coverUrl);
          }

          // 2. Try to find matching LRC file (highest priority)
          const matchedLRCFile = findMatchingLRCFile(file, lyricsFiles);
          if (matchedLRCFile) {
            lrcFileLyrics = await loadLRCFile(matchedLRCFile);
            if (lrcFileLyrics.length > 0) {
              console.log(`✓ Found matching LRC file: ${matchedLRCFile.name}`);
            }
          }

          // 3. Extract embedded lyrics from ID3/FLAC tags
          const { lyrics: id3Lyrics, source: id3Source } = await extractEmbeddedLyrics(file);
          if (id3Lyrics.length > 0) {
            embeddedLyrics = id3Lyrics;
            console.log(`✓ Found ${id3Source} embedded lyrics`);
          }

          // 4. Determine lyrics priority
          const { lyrics: finalLyrics, source: lyricsSource } = getLyricsPriority({
            lrcFile: lrcFileLyrics,
            embedded: embeddedLyrics,
          });

          // Log lyrics source
          if (finalLyrics.length > 0) {
            console.log(`📝 Using ${lyricsSource} lyrics for: ${title}`);
          } else {
            console.log(`⚠️ No local lyrics found for: ${title}, will try online`);
          }

          newSongs.push({
            id: `local-${Date.now()}-${i}`,
            title,
            artist,
            fileUrl: url,
            coverUrl,
            // Use local lyrics if available, otherwise leave empty for online fetch
            lyrics: finalLyrics,
            colors: colors && colors.length > 0 ? colors : undefined,
            // Only fetch online if no local lyrics found
            needsLyricsMatch: finalLyrics.length === 0,
            // Store all sources as fallback
            localLyrics: lrcFileLyrics.length > 0 ? lrcFileLyrics : embeddedLyrics,
          });
        } catch (err) {
          console.warn("Local metadata extraction failed", err);
          
          // Fallback: create song without lyrics
          newSongs.push({
            id: `local-${Date.now()}-${i}`,
            title,
            artist,
            fileUrl: url,
            coverUrl,
            lyrics: [],
            colors: colors && colors.length > 0 ? colors : undefined,
            needsLyricsMatch: true,
          });
        }
      }

      appendSongs(newSongs);
      return newSongs;
    },
    [appendSongs],
  );

  const importFromUrl = useCallback(
    async (input: string): Promise<ImportResult> => {
      // Try Netease first
      const neteaseLink = parseNeteaseLink(input);
      if (neteaseLink) {
        const newSongs: Song[] = [];
        try {
          if (neteaseLink.type === "playlist") {
            const songs = await fetchNeteasePlaylist(neteaseLink.id);
            songs.forEach((song) => {
              newSongs.push({
                ...song,
                fileUrl: getNeteaseAudioUrl(song.id),
                lyrics: [],
                colors: [],
                needsLyricsMatch: true,
              });
            });
          } else {
            const song = await fetchNeteaseSong(neteaseLink.id);
            if (song) {
              newSongs.push({
                ...song,
                fileUrl: getNeteaseAudioUrl(song.id),
                lyrics: [],
                colors: [],
                needsLyricsMatch: true,
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch Netease music", err);
          return {
            success: false,
            message: "Failed to load songs from Netease URL",
            songs: [],
          };
        }

        appendSongs(newSongs);
        if (newSongs.length === 0) {
          return {
            success: false,
            message: "Failed to load songs from Netease URL",
            songs: [],
          };
        }

        return { success: true, songs: newSongs };
      }

      // Try Audio Stream (Internet Archive or Self-hosted)
      try {
        const { track, error } = await fetchAudioFromUrl(input);
        
        if (track) {
          const colors = track.coverUrl ? await extractColors(track.coverUrl) : [];
          
          const newSong: Song = {
            id: track.id,
            title: track.title,
            artist: track.artist || 'Unknown Artist',
            fileUrl: track.audioUrl,
            coverUrl: track.coverUrl,
            lyrics: [],
            colors,
            needsLyricsMatch: true,
            isAudioStream: true,
            audioStreamSource: track.source,
          };
          
          appendSongs([newSong]);
          return { success: true, songs: [newSong] };
        }
        
        if (error) {
          return {
            success: false,
            message: error.message,
            songs: [],
          };
        }
      } catch (err) {
        console.error("Failed to fetch audio stream", err);
      }

      // No valid link found
      return {
        success: false,
        message:
          "Invalid URL. Supported: Netease Cloud Music, Internet Archive, or direct audio file URLs",
        songs: [],
      };
    },
    [appendSongs],
  );

  return {
    queue,
    originalQueue,
    updateSongInQueue,
    removeSongs,
    addLocalFiles,
    importFromUrl,
    setQueue,
    setOriginalQueue,
  };
};
