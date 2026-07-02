import type { Book, MediaTitle } from "@/types/library";
import { seriesProgress } from "@/lib/series";
import { tmdbStateId } from "@/lib/tmdb-match";

export type StateFilter = "all" | "watched" | "favorites";
export type TypeFilter = "all" | "movie" | "tv";

export function matchesMediaStateFilter(
  title: MediaTitle,
  filter: StateFilter,
  watched: Set<string>,
  favorites: Set<string>
): boolean {
  if (filter === "all") return true;
  if (title.type === "tv" && title.episodes && title.episodes.length > 0) {
    const p = seriesProgress(title, watched, favorites);
    if (filter === "watched") return p.anyWatched;
    if (filter === "favorites") return p.anyFavorite;
    return true;
  }
  return matchesStateFilter(title.id, filter, watched, favorites, title.tmdb_id, title.type);
}

export function matchesStateFilter(
  id: string,
  filter: StateFilter,
  watched: Set<string>,
  favorites: Set<string>,
  tmdbId?: number | null,
  mediaType?: "movie" | "tv"
): boolean {
  if (filter === "all") return true;
  const tmdbKey =
    tmdbId != null && mediaType ? tmdbStateId(mediaType, tmdbId) : null;
  if (filter === "watched") {
    return watched.has(id) || (tmdbKey != null && watched.has(tmdbKey));
  }
  if (filter === "favorites") {
    return favorites.has(id) || (tmdbKey != null && favorites.has(tmdbKey));
  }
  return true;
}

export function matchesTypeFilter(type: "movie" | "tv", filter: TypeFilter): boolean {
  if (filter === "all") return true;
  return type === filter;
}

export function filterByDirector(titles: MediaTitle[], director: string | null): MediaTitle[] {
  if (!director) return titles;
  return titles.filter((t) => t.directors?.includes(director));
}

export function filterByGenre(titles: MediaTitle[], genre: string | null): MediaTitle[] {
  if (!genre) return titles;
  return titles.filter((t) => t.genres?.includes(genre) || t.primary_genre === genre);
}

export function filterByAuthor(books: Book[], author: string | null): Book[] {
  if (!author) return books;
  return books.filter((b) => b.author === author);
}

export function filterByFormat(books: Book[], format: string | null): Book[] {
  if (!format) return books;
  return books.filter((b) => b.format.toUpperCase() === format.toUpperCase());
}

export function isItemWatched(
  id: string,
  watched: Set<string>,
  tmdbId?: number | null,
  mediaType?: "movie" | "tv"
): boolean {
  if (watched.has(id)) return true;
  if (tmdbId != null && mediaType) return watched.has(tmdbStateId(mediaType, tmdbId));
  return false;
}

export function isItemFavorite(
  id: string,
  favorites: Set<string>,
  tmdbId?: number | null,
  mediaType?: "movie" | "tv"
): boolean {
  if (favorites.has(id)) return true;
  if (tmdbId != null && mediaType) return favorites.has(tmdbStateId(mediaType, tmdbId));
  return false;
}
