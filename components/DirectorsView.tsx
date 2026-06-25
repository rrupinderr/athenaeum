"use client";

import { useEffect, useMemo, useState } from "react";
import { matchesStateFilter, matchesTypeFilter, type StateFilter, type TypeFilter } from "@/lib/filters";
import { searchMedia, sidebarMatchCounts } from "@/lib/search";
import { GlobalSearchResults } from "./GlobalSearchResults";
import { LibraryShell } from "./LibraryShell";
import { MediaCard } from "./MediaCard";
import { MissingFilmCard } from "./MissingFilmCard";
import { useLibrary } from "./LibraryProvider";
import { WebSearchIcon } from "./icons/WebSearchIcon";
import type { FilmographyItem, MediaTitle } from "@/types/library";

function filterTitles(
  titles: MediaTitle[],
  search: string,
  stateFilter: StateFilter,
  typeFilter: TypeFilter,
  watched: Set<string>,
  favorites: Set<string>,
  globalMode: boolean
) {
  let list = titles;
  if (!globalMode) {
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
  }
  list = list.filter((t) => matchesTypeFilter(t.type, typeFilter));
  list = list.filter((t) => matchesStateFilter(t.id, stateFilter, watched, favorites));
  return list;
}

export function GenresView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const globalMode = search.trim().length >= 2;
  const genres = useMemo(() => {
    if (!library) return [];
    const keys = Object.keys(library.genres).sort((a, b) => library.genres[b].count - library.genres[a].count);
    if (!globalMode) return keys;
    const counts = sidebarMatchCounts(library, search, "genres");
    return keys.filter((k) => counts[k] > 0);
  }, [library, search, globalMode]);

  const active = selected || genres[0] || null;
  const globalHits = useMemo(() => (library && globalMode ? searchMedia(library, search) : []), [library, search, globalMode]);

  const filteredGlobalHits = useMemo(() => {
    return globalHits.filter((h) => {
      const t = h.item as MediaTitle;
      return matchesTypeFilter(t.type, typeFilter) && matchesStateFilter(t.id, stateFilter, watched, favorites);
    });
  }, [globalHits, typeFilter, stateFilter, watched, favorites]);

  const titles = useMemo(() => {
    if (!library || !active || globalMode) return [];
    return filterTitles(
      library.genres[active]?.titles || [],
      search,
      stateFilter,
      typeFilter,
      watched,
      favorites,
      false
    );
  }, [library, active, search, stateFilter, typeFilter, watched, favorites, globalMode]);

  if (!library) return null;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      showTypeFilter
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        {!globalMode && (
          <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelected(g)}
                className={`w-full flex justify-between px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                  active === g ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]" : ""
                }`}
              >
                <span>{g}</span>
                <span className="text-[0.72rem] text-[var(--muted)]">{library.genres[g].count}</span>
              </button>
            ))}
          </aside>
        )}
        <main className="flex-1 p-6">
          {globalMode ? (
            <GlobalSearchResults hits={filteredGlobalHits} query={search.trim()} mode="media" />
          ) : (
            active && (
              <>
                <header className="mb-4 pb-2 border-b border-[var(--border)]">
                  <h2 className="text-xl font-semibold">{active}</h2>
                </header>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                  {titles.map((t) => (
                    <MediaCard key={t.id} title={t} />
                  ))}
                </div>
              </>
            )
          )}
        </main>
      </div>
    </LibraryShell>
  );
}

export function DirectorsView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [filmography, setFilmography] = useState<{ owned: FilmographyItem[]; missing: FilmographyItem[] } | null>(null);
  const [filmLoading, setFilmLoading] = useState(false);

  const globalMode = search.trim().length >= 2;

  const directors = useMemo(() => {
    if (!library) return [];
    const keys = Object.keys(library.directors).sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return library.directors[b].count - library.directors[a].count;
    });
    if (!globalMode) return keys;
    const counts = sidebarMatchCounts(library, search, "directors");
    return keys.filter((k) => counts[k] > 0);
  }, [library, search, globalMode]);

  const active = selected || directors[0] || null;

  const globalHits = useMemo(() => (library && globalMode ? searchMedia(library, search) : []), [library, search, globalMode]);

  const filteredGlobalHits = useMemo(() => {
    return globalHits.filter((h) => {
      const t = h.item as MediaTitle;
      return matchesTypeFilter(t.type, typeFilter) && matchesStateFilter(t.id, stateFilter, watched, favorites);
    });
  }, [globalHits, typeFilter, stateFilter, watched, favorites]);

  const titles = useMemo(() => {
    if (!library || !active || globalMode) return [];
    return filterTitles(
      library.directors[active]?.titles || [],
      search,
      stateFilter,
      typeFilter,
      watched,
      favorites,
      false
    );
  }, [library, active, search, stateFilter, typeFilter, watched, favorites, globalMode]);

  async function loadFilmography(director: string) {
    if (director === "Unknown") {
      setFilmography(null);
      return;
    }
    setFilmLoading(true);
    setFilmography(null);
    try {
      const res = await fetch(`/api/director/filmography?director=${encodeURIComponent(director)}`);
      const data = await res.json();
      if (res.ok) setFilmography({ owned: data.owned || [], missing: data.missing || [] });
    } finally {
      setFilmLoading(false);
    }
  }

  useEffect(() => {
    if (active && active !== "Unknown" && !globalMode) loadFilmography(active);
  }, [active, globalMode]);

  if (!library) return null;

  const missingCount = filmography?.missing.length ?? 0;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      showTypeFilter
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        {!globalMode && (
          <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
            {directors.map((d) => {
              const count = globalMode
                ? sidebarMatchCounts(library, search, "directors")[d] ?? 0
                : library.directors[d].count;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelected(d);
                    setShowMissing(false);
                  }}
                  className={`w-full flex justify-between px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                    active === d ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]" : ""
                  }`}
                >
                  <span className="truncate pr-2">{d}</span>
                  <span className="text-[0.72rem] text-[var(--muted)] shrink-0">{count}</span>
                </button>
              );
            })}
          </aside>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {globalMode ? (
            <GlobalSearchResults hits={filteredGlobalHits} query={search.trim()} mode="media" />
          ) : (
            <>
              {active && active !== "Unknown" && (
                <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  {filmLoading && <span className="text-xs text-[var(--muted)]">Loading filmography…</span>}
                  {filmography && (
                    <>
                      <span className="text-xs text-[var(--muted)]">
                        {filmography.owned.length} in library · {missingCount} to discover on the web
                      </span>
                      {missingCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowMissing((v) => !v)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-medium ${
                            showMissing
                              ? "border-[var(--accent)] text-[var(--accent)] bg-[rgba(196,30,58,0.12)]"
                              : "border-[var(--accent2-bright)] text-[var(--accent2-bright)]"
                          }`}
                        >
                          {showMissing ? "Hide missing films" : "Show missing films & web search"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {active && (
                <section className="mb-10">
                  <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
                    <h2 className="text-xl font-semibold">{active}</h2>
                    <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
                      {titles.length}
                    </span>
                  </header>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                    {titles.map((t) => (
                      <MediaCard key={t.id} title={t} />
                    ))}
                  </div>
                </section>
              )}

              {showMissing && filmography && filmography.missing.length > 0 && (
                <section>
                  <header className="flex items-center gap-2 mb-4 text-[var(--missing)] text-sm font-semibold">
                    <WebSearchIcon size={16} className="text-[var(--accent2-bright)]" />
                    Not in library — click to search the web ({filmography.missing.length})
                  </header>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                    {filmography.missing.map((item) => (
                      <MissingFilmCard key={item.tmdb_id} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
