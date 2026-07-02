import type { Episode, LibraryData, MediaTitle } from "@/types/library";

export function episodeId(seriesId: string, episodePath: string): string {
  return `${seriesId}::${episodePath}`;
}

export function findSeriesById(library: LibraryData, id: string): MediaTitle | null {
  for (const bucket of [library.directors, library.genres]) {
    for (const key of Object.keys(bucket)) {
      const found = bucket[key].titles?.find((t) => t.id === id && t.type === "tv");
      if (found) return found;
    }
  }
  return null;
}

export interface SeriesProgress {
  watchedCount: number;
  total: number;
  allWatched: boolean;
  anyWatched: boolean;
  anyFavorite: boolean;
}

export function seriesProgress(
  title: MediaTitle,
  watched: Set<string>,
  favorites: Set<string>
): SeriesProgress {
  const episodes = title.episodes || [];
  const total = episodes.length;
  let watchedCount = 0;
  let anyFavorite = favorites.has(title.id);

  for (const ep of episodes) {
    const eid = episodeId(title.id, ep.path);
    if (watched.has(eid)) watchedCount++;
    if (favorites.has(eid)) anyFavorite = true;
  }

  if (watched.has(title.id)) {
    watchedCount = total;
  }

  return {
    watchedCount,
    total,
    allWatched: total > 0 && watchedCount >= total,
    anyWatched: watchedCount > 0 || watched.has(title.id),
    anyFavorite,
  };
}

export function isTvSeries(title: MediaTitle): boolean {
  return title.type === "tv" && (title.episodes?.length ?? 0) >= 1;
}
