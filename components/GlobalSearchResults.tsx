"use client";

import type { SearchHit } from "@/lib/search";
import type { StateFilter, TypeFilter } from "@/lib/filters";
import type { PersonLibraryStats } from "@/lib/person-library";
import { buildWebSearchUrl } from "@/lib/web-search";
import { WebSearchIcon } from "./icons/WebSearchIcon";
import { MediaCard } from "./MediaCard";
import { BookCard } from "./BookCard";
import { TmdbDiscoverGrid } from "./TmdbDiscoverGrid";
import type { TmdbDiscoverSearchState } from "./useTmdbDiscoverSearch";

function LibraryHitsGrid({ hits }: { hits: SearchHit[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
      {hits.map((h) =>
        h.kind === "book" ? (
          <BookCard key={h.id} book={h.item as import("@/types/library").Book} />
        ) : (
          <MediaCard key={h.id} title={h.item as import("@/types/library").MediaTitle} />
        )
      )}
    </div>
  );
}

function libraryHeaderLabel(
  hits: SearchHit[],
  query: string,
  personStats: PersonLibraryStats | null | undefined
): string {
  if (personStats && personStats.total > 0) {
    return `${personStats.total} in library · ${personStats.watched} watched`;
  }
  return `${hits.length} for "${query}"`;
}

export function GlobalSearchResults({
  hits,
  query,
  mode,
  typeFilter = "all",
  stateFilter = "all",
  tmdbSearch,
  personStats,
}: {
  hits: SearchHit[];
  query: string;
  mode: "media" | "books";
  typeFilter?: TypeFilter;
  stateFilter?: StateFilter;
  tmdbSearch?: TmdbDiscoverSearchState;
  personStats?: PersonLibraryStats | null;
}) {
  if (mode === "books") {
    if (hits.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-[var(--muted)] mb-4">No matches in your library for &ldquo;{query}&rdquo;</p>
          <a
            href={buildWebSearchUrl(query, null, "book")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--accent2-bright)] text-[var(--accent2-bright)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-sm transition-colors"
          >
            <WebSearchIcon size={16} />
            Search the web for &ldquo;{query}&rdquo;
          </a>
        </div>
      );
    }

    return (
      <section>
        <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold">Search results</h2>
          <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
            {hits.length} for &ldquo;{query}&rdquo;
          </span>
        </header>
        <LibraryHitsGrid hits={hits} />
      </section>
    );
  }

  if (!tmdbSearch) return null;

  return (
    <div>
      <TmdbDiscoverGrid
        query={query}
        typeFilter={typeFilter}
        stateFilter={stateFilter}
        discoverFirst
        hideOwned={hits.length > 0}
        compact
        search={tmdbSearch}
      />

      {hits.length > 0 ? (
        <section className="mt-8">
          <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <h2 className="text-xl font-semibold">In your library</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
              {libraryHeaderLabel(hits, query, personStats)}
            </span>
          </header>
          <LibraryHitsGrid hits={hits} />
        </section>
      ) : null}
    </div>
  );
}

export function SearchContextChip({ context }: { context: string }) {
  return (
    <span className="text-[0.65rem] text-[var(--muted)] truncate block mt-0.5">{context}</span>
  );
}
