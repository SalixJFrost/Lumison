import { LyricLine } from "../../types";

const LYRICS_CACHE_HIT_TTL_MS = 30 * 60 * 1000;
const LYRICS_CACHE_MISS_TTL_MS = 5 * 60 * 1000;

interface CachedLyricsMatchEntry {
    lyrics: LyricLine[] | null;
    expiresAt: number;
}

const resolvedLyricsMatches = new Map<string, CachedLyricsMatchEntry>();
const pendingLyricsMatches = new Map<string, Promise<LyricLine[] | null>>();

const normalizeCacheSegment = (value: string) => value.trim().toLowerCase();

const readResolvedLyricsMatch = (cacheKey: string) => {
    const entry = resolvedLyricsMatches.get(cacheKey);
    if (!entry) {
        return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
        resolvedLyricsMatches.delete(cacheKey);
        return undefined;
    }

    return entry.lyrics;
};

const writeResolvedLyricsMatch = (
    cacheKey: string,
    lyrics: LyricLine[] | null,
) => {
    resolvedLyricsMatches.set(cacheKey, {
        lyrics,
        expiresAt:
            Date.now() + (lyrics ? LYRICS_CACHE_HIT_TTL_MS : LYRICS_CACHE_MISS_TTL_MS),
    });
};

export const createNeteaseLyricsCacheKey = (songId: string) =>
    `netease:${normalizeCacheSegment(songId)}`;

export const createSearchLyricsCacheKey = (title: string, artist: string) =>
    `search:${normalizeCacheSegment(title)}::${normalizeCacheSegment(artist)}`;

export const getCachedMatchedLyrics = async <T>(
    cacheKey: string,
    loader: () => Promise<T | null>,
    parser: (payload: T) => LyricLine[],
) => {
    const cachedLyrics = readResolvedLyricsMatch(cacheKey);
    if (cachedLyrics !== undefined) {
        return cachedLyrics;
    }

    const pendingMatch = pendingLyricsMatches.get(cacheKey);
    if (pendingMatch) {
        return pendingMatch;
    }

    const promise = (async () => {
        try {
            const payload = await loader();
            const parsedLyrics = payload ? parser(payload) : null;
            writeResolvedLyricsMatch(cacheKey, parsedLyrics);
            return parsedLyrics;
        } finally {
            pendingLyricsMatches.delete(cacheKey);
        }
    })();

    pendingLyricsMatches.set(cacheKey, promise);
    return promise;
};

export const seedCachedMatchedLyrics = (
    cacheKey: string,
    lyrics: LyricLine[] | null,
) => {
    writeResolvedLyricsMatch(cacheKey, lyrics);
};