import type { LibraryData, MediaTitle } from "@/types/library";
import { collectMedia } from "@/lib/search";
import { isItemFavorite, isItemWatched, type StateFilter } from "@/lib/filters";

export interface RouletteOptions {
  genre?: string | null;
  stateFilter?: StateFilter;
  watched: Set<string>;
  favorites: Set<string>;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRoulettePool(library: LibraryData, options: RouletteOptions): MediaTitle[] {
  const { genre, stateFilter = "all", watched, favorites } = options;
  let pool: MediaTitle[];

  if (genre && library.genres[genre]) {
    pool = (library.genres[genre].titles || []).filter((t) => t.type === "movie");
  } else {
    const seen = new Set<string>();
    pool = [];
    for (const t of collectMedia(library)) {
      if (t.type !== "movie") continue;
      if (seen.has(t.folder_name)) continue;
      seen.add(t.folder_name);
      pool.push(t);
    }
  }

  if (stateFilter === "watched") {
    pool = pool.filter((t) => isItemWatched(t.id, watched, t.tmdb_id, t.type));
  } else if (stateFilter === "favorites") {
    pool = pool.filter((t) => isItemFavorite(t.id, favorites, t.tmdb_id, t.type));
  }

  return pool;
}

export function pickRandom(pool: MediaTitle[], count = 5): MediaTitle[] {
  if (pool.length === 0) return [];
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
