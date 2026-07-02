"use client";

import { useMemo } from "react";
import type { StateFilter, TypeFilter } from "@/lib/filters";
import { matchesMediaStateFilter } from "@/lib/filters";
import {
  findLibraryByDirectorQuery,
  findLibraryForPerson,
  mediaTitlesToSearchHits,
  mergeSearchHits,
  personLibraryStats,
  sortMediaWatchedFirst,
  sortSearchHitsWatchedFirst,
  type PersonLibraryStats,
} from "@/lib/person-library";
import { searchMedia } from "@/lib/search";
import { GlobalSearchResults } from "./GlobalSearchResults";
import { useLibrary } from "./LibraryProvider";
import { useTmdbDiscoverSearch } from "./useTmdbDiscoverSearch";

export function DiscoverPanel({
  query,
  typeFilter,
  stateFilter,
  onClose,
}: {
  query: string;
  typeFilter?: TypeFilter;
  stateFilter?: StateFilter;
  onClose: () => void;
}) {
  const { library, watched, favorites } = useLibrary();
  const resolvedTypeFilter = typeFilter || "all";
  const resolvedStateFilter = stateFilter || "all";
  const tmdbSearch = useTmdbDiscoverSearch(query, resolvedTypeFilter);

  const { libraryHits, personStats } = useMemo((): {
    libraryHits: ReturnType<typeof mergeSearchHits>;
    personStats: PersonLibraryStats | null;
  } => {
    if (!library || query.trim().length < 2) {
      return { libraryHits: [], personStats: null };
    }

    const textHits = searchMedia(library, query);
    let personTitles = mergeSearchHits(textHits).map((h) => h.item as import("@/types/library").MediaTitle);

    if (tmdbSearch.personMatch) {
      personTitles = findLibraryForPerson(
        library,
        tmdbSearch.personMatch.name,
        tmdbSearch.results,
        resolvedTypeFilter
      );
    } else if (!tmdbSearch.loading) {
      const directorTitles = findLibraryByDirectorQuery(library, query, resolvedTypeFilter);
      const merged = mergeSearchHits(textHits, mediaTitlesToSearchHits(directorTitles));
      personTitles = merged.map((h) => h.item as import("@/types/library").MediaTitle);
    } else {
      personTitles = textHits.map((h) => h.item as import("@/types/library").MediaTitle);
    }

    const stats =
      tmdbSearch.personMatch || (!tmdbSearch.loading && personTitles.length > 0)
        ? personLibraryStats(personTitles, watched, favorites)
        : null;

    const sortedTitles = sortMediaWatchedFirst(personTitles, watched, favorites);
    let hits = mediaTitlesToSearchHits(sortedTitles);
    hits = sortSearchHitsWatchedFirst(hits, watched, favorites);

    hits = hits.filter((h) => {
      if (h.kind === "book") return false;
      const t = h.item as import("@/types/library").MediaTitle;
      return matchesMediaStateFilter(t, resolvedStateFilter, watched, favorites);
    });

    return { libraryHits: hits, personStats: stats };
  }, [
    library,
    query,
    resolvedTypeFilter,
    resolvedStateFilter,
    watched,
    favorites,
    tmdbSearch.personMatch,
    tmdbSearch.results,
    tmdbSearch.loading,
  ]);

  return (
    <section
      id="discover-panel"
      className="custom-scrollbar border-b border-[var(--border)] bg-[var(--surface)]"
    >
      <header className="sticky top-14 z-20 flex items-center justify-between px-6 py-3 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Discover on TMDB</h2>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
        >
          Close
        </button>
      </header>

      <div className="p-6">
        <GlobalSearchResults
          hits={libraryHits}
          query={query}
          mode="media"
          typeFilter={resolvedTypeFilter}
          stateFilter={resolvedStateFilter}
          tmdbSearch={tmdbSearch}
          personStats={personStats}
        />
      </div>
    </section>
  );
}
