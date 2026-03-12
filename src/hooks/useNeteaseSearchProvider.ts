import { useState, useCallback } from "react";
import { SearchProvider } from "./useSearchProvider";
import {
    searchNetEase,
    NeteaseTrackInfo,
} from "../services/music/lyricsService";
import { dedupeSearchResults } from "../utils/searchResultLookup";

const LIMIT = 30;

interface NeteaseSearchProviderExtended extends SearchProvider {
    performSearch: (query: string) => Promise<void>;
    hasSearched: boolean;
    results: NeteaseTrackInfo[];
}

export const useNeteaseSearchProvider = (): NeteaseSearchProviderExtended => {
    const [results, setResults] = useState<NeteaseTrackInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchPage = useCallback(
        async (
            query: string,
            offset: number,
            limit: number,
            errorLabel: string,
        ): Promise<NeteaseTrackInfo[] | null> => {
            try {
                return await searchNetEase(query, { limit, offset });
            } catch (e) {
                console.error(errorLabel, e);
                return null;
            }
        },
        [],
    );

    const performSearch = useCallback(async (query: string) => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            setResults([]);
            setHasSearched(false);
            setHasMore(true);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setResults([]);
        setHasMore(true);

        const searchResults = await fetchPage(
            normalizedQuery,
            0,
            LIMIT,
            "Netease search failed:",
        );

        if (!searchResults) {
            setHasMore(false);
            setIsLoading(false);
            return;
        }

        setResults(dedupeSearchResults(searchResults));
        setHasMore(searchResults.length >= LIMIT);
        setIsLoading(false);
    }, [fetchPage]);

    const loadMore = useCallback(
        async (
            query: string,
            offset: number,
            limit: number,
        ): Promise<NeteaseTrackInfo[]> => {
            if (isLoading || !hasMore) return [];

            setIsLoading(true);
            const searchResults = await fetchPage(query, offset, limit, "Load more failed:");

            if (!searchResults) {
                setHasMore(false);
                setIsLoading(false);
                return [];
            }

            if (searchResults.length === 0) {
                setHasMore(false);
            } else {
                setResults((prev) => dedupeSearchResults([...prev, ...searchResults]));
            }

            setIsLoading(false);
            return searchResults;
        },
        [fetchPage, isLoading, hasMore],
    );

    return {
        id: "netease",
        label: "Netease", // Not used in UI, translated directly in SearchModal
        requiresExplicitSearch: true,
        isLoading,
        hasMore,
        hasSearched,
        results,

        search: async (): Promise<NeteaseTrackInfo[]> => {
            // For explicit search providers, this returns current results
            // Actual search is triggered by performSearch
            return results;
        },

        loadMore,
        performSearch,
    };
};
