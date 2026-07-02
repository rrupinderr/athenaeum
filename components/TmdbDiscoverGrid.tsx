"use client";

import type { MediaTitle, TmdbSearchResult } from "@/types/library";
import { isItemFavorite, isItemWatched, type StateFilter, type TypeFilter } from "@/lib/filters";
import {
  findLibraryForPerson,
  personLibraryStats,
  sortMediaWatchedFirst,
} from "@/lib/person-library";
import { matchTmdbResult, resolveStateId } from "@/lib/tmdb-match";
import { useLibrary } from "./LibraryProvider";
import { TmdbOwnedCard, TmdbResultCard } from "./TmdbResultCard";
import type { TmdbDiscoverSearchState } from "./useTmdbDiscoverSearch";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-[var(--border)] animate-pulse">
          <div className="aspect-[2/3] bg-[var(--surface2)]" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-[var(--surface2)] rounded w-3/4" />
            <div className="h-2 bg-[var(--surface2)] rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function dedupeLocals(locals: MediaTitle[]): MediaTitle[] {
  const seen = new Set<string>();
  const out: MediaTitle[] = [];
  for (const t of locals) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

export function TmdbDiscoverGrid({
  query,
  typeFilter = "all",
  stateFilter = "all",
  compact = false,
  discoverFirst = false,
  hideOwned = false,
  search,
}: {
  query: string;
  typeFilter?: TypeFilter;
  stateFilter?: StateFilter;
  compact?: boolean;
  discoverFirst?: boolean;
  hideOwned?: boolean;
  search: TmdbDiscoverSearchState;
}) {
  const { library, watched, favorites } = useLibrary();
  const {
    results,
    searchedAs,
    personMatch,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
  } = search;

  if (!library) return null;

  const owned: { result: TmdbSearchResult; local: MediaTitle }[] = [];
  const ownedLocalOnly: MediaTitle[] = [];
  const discover: TmdbSearchResult[] = [];
  const seenOwned = new Set<string>();

  for (const r of results) {
    const local = matchTmdbResult(r, library);
    if (local && !seenOwned.has(local.id)) {
      seenOwned.add(local.id);
      owned.push({ result: r, local });
    } else if (!local) {
      discover.push(r);
    }
  }

  if (personMatch) {
    const personLibrary = findLibraryForPerson(library, personMatch.name, results, typeFilter);
    for (const local of personLibrary) {
      if (seenOwned.has(local.id)) continue;
      seenOwned.add(local.id);
      ownedLocalOnly.push(local);
    }
  }

  const filterResult = (r: TmdbSearchResult, localId?: string) => {
    const id = localId || resolveStateId(null, r);
    if (stateFilter === "watched") return isItemWatched(id, watched, r.tmdb_id, r.type);
    if (stateFilter === "favorites") return isItemFavorite(id, favorites, r.tmdb_id, r.type);
    return true;
  };

  const filterLocal = (local: MediaTitle) => {
    if (stateFilter === "watched") return isItemWatched(local.id, watched, local.tmdb_id, local.type);
    if (stateFilter === "favorites") return isItemFavorite(local.id, favorites, local.tmdb_id, local.type);
    return true;
  };

  const ownedFiltered = owned.filter(({ result, local }) => filterResult(result, local.id));
  const ownedLocalFiltered = ownedLocalOnly.filter(filterLocal);
  const discoverFiltered = discover.filter((r) => filterResult(r));

  const personLibraryTitles = personMatch
    ? findLibraryForPerson(library, personMatch.name, results, typeFilter)
    : [];
  const libraryStats = personLibraryStats(personLibraryTitles, watched, favorites);

  const sortedOwnedLocals = sortMediaWatchedFirst(
    dedupeLocals([...ownedFiltered.map(({ local }) => local), ...ownedLocalFiltered]),
    watched,
    favorites
  );

  const totalResults = total ?? results.length;
  const showingCount = results.length;

  if (query.trim().length < 2) return null;

  const ownedSection =
    !hideOwned && !loading && sortedOwnedLocals.length > 0 ? (
      <section className={discoverFirst ? "mt-8" : "mb-8"}>
        <header className="flex items-baseline gap-2 mb-4">
          <h3 className="text-sm font-semibold text-[var(--owned)]">In your library</h3>
          <span className="text-xs text-[var(--muted)]">{sortedOwnedLocals.length}</span>
        </header>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
          {sortedOwnedLocals.map((local) => (
            <TmdbOwnedCard key={local.id} title={local} />
          ))}
        </div>
      </section>
    ) : null;

  const discoverSection =
    !loading && discoverFiltered.length > 0 ? (
      <section>
        <header className="flex items-baseline gap-2 mb-4">
          <h3 className="text-sm font-semibold text-[var(--accent2-bright)]">Not in library</h3>
          <span className="text-xs text-[var(--muted)]">{discoverFiltered.length}</span>
        </header>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
          {discoverFiltered.map((r) => (
            <TmdbResultCard key={`${r.type}-${r.tmdb_id}`} result={r} localTitle={null} />
          ))}
        </div>
      </section>
    ) : null;

  const loadMoreSection =
    personMatch && hasMore && !loading ? (
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--muted)]">
          Showing {showingCount} of {totalResults} titles
        </p>
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--accent2-bright)] text-[var(--accent2-bright)] hover:bg-[rgba(61,158,106,0.12)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      </div>
    ) : null;

  return (
    <div className={compact ? "" : discoverFirst ? "" : "mt-8"}>
      {!compact && (
        <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold">Discover on TMDB</h2>
          <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
            {query.trim()}
          </span>
          {searchedAs && (
            <span className="text-xs text-[var(--accent2-bright)]">matched as “{searchedAs}”</span>
          )}
        </header>
      )}
      {compact && searchedAs && (
        <p className="text-xs text-[var(--accent2-bright)] mb-3">Matched using “{searchedAs}”</p>
      )}

      {personMatch && !loading && (
        <p className="text-sm text-[var(--accent2-bright)] mb-4 px-3 py-2 rounded-lg bg-[rgba(61,158,106,0.08)] border border-[rgba(61,158,106,0.25)]">
          Showing films for <strong>{personMatch.name}</strong> (actor / director)
          {libraryStats.total > 0 && (
            <>
              {" "}
              · <strong>{libraryStats.watched} of {libraryStats.total}</strong> watched in library
            </>
          )}
          {totalResults > 0 && (
            <>
              {" "}
              · showing {showingCount} of {totalResults} titles
            </>
          )}
        </p>
      )}

      {loading && <SkeletonGrid />}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!loading && !error && results.length === 0 && sortedOwnedLocals.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No TMDB results for &ldquo;{query.trim()}&rdquo;</p>
      )}

      {discoverFirst ? (
        <>
          {discoverSection}
          {ownedSection}
        </>
      ) : (
        <>
          {ownedSection}
          {discoverSection}
        </>
      )}

      {loadMoreSection}
    </div>
  );
}
