import type { LibraryData, MediaTitle, TmdbSearchResult } from "@/types/library";
import { collectMedia } from "@/lib/search";

export function tmdbStateId(type: "movie" | "tv", tmdbId: number): string {
  return `tmdb:${type}:${tmdbId}`;
}

export function buildTmdbIndex(library: LibraryData): Map<number, MediaTitle> {
  const map = new Map<number, MediaTitle>();
  for (const t of collectMedia(library)) {
    if (t.tmdb_id != null && !map.has(t.tmdb_id)) {
      map.set(t.tmdb_id, t);
    }
  }
  return map;
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchTmdbResult(
  result: TmdbSearchResult,
  library: LibraryData
): MediaTitle | null {
  const index = buildTmdbIndex(library);
  const byId = index.get(result.tmdb_id);
  if (byId) return byId;

  const nt = normalizeTitle(result.title);
  const year = result.year;
  for (const t of collectMedia(library)) {
    if (normalizeTitle(t.title) !== nt) continue;
    if (year != null && t.year != null && t.year !== year) continue;
    if (t.type === result.type) return t;
  }
  return null;
}

export function resolveStateId(
  localTitle: MediaTitle | null,
  result: TmdbSearchResult
): string {
  if (localTitle) return localTitle.id;
  return tmdbStateId(result.type, result.tmdb_id);
}

export function resolveFilmographyStateId(item: {
  tmdb_id: number;
  local_id?: string;
  in_library?: boolean;
}): string {
  if (item.in_library && item.local_id) return item.local_id;
  return tmdbStateId("movie", item.tmdb_id);
}
