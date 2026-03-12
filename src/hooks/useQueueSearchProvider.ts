import { useMemo } from "react";
import { Song } from "../types";
import { SearchProvider } from "./useSearchProvider";

interface UseQueueSearchProviderParams {
  queue: Song[];
}

export const useQueueSearchProvider = ({
  queue,
}: UseQueueSearchProviderParams): SearchProvider => {
  const indexedQueue = useMemo(
    () =>
      queue.map((song) => ({
        song,
        searchableText: `${song.title} ${song.artist}`.toLowerCase(),
      })),
    [queue],
  );

  const provider: SearchProvider = useMemo(
    () => ({
      id: "queue",
      label: "Queue", // Not used in UI, translated directly in SearchModal
      requiresExplicitSearch: false,
      isLoading: false,
      hasMore: false,

      search: async (query: string): Promise<Song[]> => {
        // Real-time filtering - no need for explicit search
        if (!query.trim()) {
          return queue;
        }

        const lower = query.toLowerCase();
        return indexedQueue
          .filter(({ searchableText }) => searchableText.includes(lower))
          .map(({ song }) => song);
      },
    }),
    [indexedQueue, queue]
  );

  return provider;
};
