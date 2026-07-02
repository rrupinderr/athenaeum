import type { LibraryData, MediaTitle, TmdbSearchResult } from "@/types/library";
import type { TypeFilter } from "@/lib/filters";
import { isItemWatched, matchesTypeFilter } from "@/lib/filters";
import { nameSimilarity } from "@/lib/tmdb-person";
import { matchTmdbResult } from "@/lib/tmdb-match";
import { collectMedia, type SearchHit } from "@/lib/search";
import { isTvSeries, seriesProgress } from "@/lib/series";

export interface PersonLibraryStats {
  total: number;
  watched: number;
}

export function isMediaWatched(
  title: MediaTitle,
  watched: Set<string>,
  favorites: Set<string>
): boolean {
  if (title.type === "tv" && isTvSeries(title)) {
    return seriesProgress(title, watched, favorites).anyWatched;
  }
  return isItemWatched(title.id, watched, title.tmdb_id, title.type);
}

export function personLibraryStats(
  titles: MediaTitle[],
  watched: Set<string>,
  favorites: Set<string>
): PersonLibraryStats {
  let watchedCount = 0;
  for (const t of titles) {
    if (isMediaWatched(t, watched, favorites)) watchedCount++;
  }
  return { total: titles.length, watched: watchedCount };
}

export function sortMediaWatchedFirst(
  titles: MediaTitle[],
  watched: Set<string>,
  favorites: Set<string>
): MediaTitle[] {
  return [...titles].sort((a, b) => {
    const wa = isMediaWatched(a, watched, favorites) ? 1 : 0;
    const wb = isMediaWatched(b, watched, favorites) ? 1 : 0;
    if (wb !== wa) return wb - wa;
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });
}

export function sortSearchHitsWatchedFirst(
  hits: SearchHit[],
  watched: Set<string>,
  favorites: Set<string>
): SearchHit[] {
  return [...hits].sort((a, b) => {
    const ta = a.item as MediaTitle;
    const tb = b.item as MediaTitle;
    const wa = isMediaWatched(ta, watched, favorites) ? 1 : 0;
    const wb = isMediaWatched(tb, watched, favorites) ? 1 : 0;
    if (wb !== wa) return wb - wa;
    const ya = ta.year ?? 0;
    const yb = tb.year ?? 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });
}

function filterByType(titles: MediaTitle[], typeFilter: TypeFilter): MediaTitle[] {
  if (typeFilter === "all") return titles;
  return titles.filter((t) => matchesTypeFilter(t.type, typeFilter));
}

function dedupeTitles(titles: MediaTitle[]): MediaTitle[] {
  const seen = new Set<string>();
  const out: MediaTitle[] = [];
  for (const t of titles) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

/** Library titles whose director bucket or directors[] field matches the query. */
export function findLibraryByDirectorQuery(
  library: LibraryData,
  query: string,
  typeFilter: TypeFilter = "all"
): MediaTitle[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const out: MediaTitle[] = [];
  const qLower = q.toLowerCase();

  for (const key of Object.keys(library.directors)) {
    if (key === "Unknown") continue;
    const keyLower = key.toLowerCase();
    if (
      keyLower.includes(qLower) ||
      qLower.includes(keyLower) ||
      nameSimilarity(q, key) >= 0.6
    ) {
      out.push(...(library.directors[key].titles || []));
    }
  }

  for (const t of collectMedia(library)) {
    if (t.directors?.some((d) => d.toLowerCase().includes(qLower) || nameSimilarity(q, d) >= 0.6)) {
      out.push(t);
    }
  }

  return dedupeTitles(filterByType(out, typeFilter)).sort((a, b) => a.title.localeCompare(b.title));
}

/** Library titles that match any TMDB search result (by id or title). */
export function findLibraryByTmdbResults(
  library: LibraryData,
  results: TmdbSearchResult[],
  typeFilter: TypeFilter = "all"
): MediaTitle[] {
  const out: MediaTitle[] = [];
  for (const r of results) {
    const local = matchTmdbResult(r, library);
    if (local) out.push(local);
  }
  return dedupeTitles(filterByType(out, typeFilter)).sort((a, b) => a.title.localeCompare(b.title));
}

/** Union of director-index matches and TMDB result matches for a resolved person. */
export function findLibraryForPerson(
  library: LibraryData,
  personName: string,
  tmdbResults: TmdbSearchResult[],
  typeFilter: TypeFilter = "all"
): MediaTitle[] {
  const byDirector = findLibraryByDirectorQuery(library, personName, typeFilter);
  const byTmdb = findLibraryByTmdbResults(library, tmdbResults, typeFilter);
  return dedupeTitles([...byDirector, ...byTmdb]).sort((a, b) => a.title.localeCompare(b.title));
}

export function mediaTitlesToSearchHits(titles: MediaTitle[]): SearchHit[] {
  return titles.map((t) => ({
    id: t.id,
    kind: t.type,
    title: t.title,
    year: t.year,
    context: t.directors?.length ? t.directors.join(", ") : t.primary_genre || t.type,
    item: t,
  }));
}

export function mergeSearchHits(...groups: SearchHit[][]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      out.push(hit);
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}
