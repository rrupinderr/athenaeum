"use client";

import { useEffect, useMemo, useState } from "react";
import { LibraryShell } from "./LibraryShell";
import { MediaCard } from "./MediaCard";
import { MissingFilmCard } from "./MissingFilmCard";
import { useLibrary } from "./LibraryProvider";
import type { FilmographyItem, MediaTitle } from "@/types/library";

function filterTitles(
  titles: MediaTitle[],
  search: string,
  stateFilter: "all" | "watched" | "favorites",
  watched: Set<string>,
  favorites: Set<string>
) {
  let list = titles;
  const q = search.trim().toLowerCase();
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
  if (stateFilter === "watched") list = list.filter((t) => watched.has(t.id));
  if (stateFilter === "favorites") list = list.filter((t) => favorites.has(t.id));
  return list;
}

export function GenresView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | "watched" | "favorites">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const genres = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.genres).sort((a, b) => library.genres[b].count - library.genres[a].count);
  }, [library]);

  const active = selected || genres[0] || null;

  const titles = useMemo(() => {
    if (!library || !active) return [];
    return filterTitles(
      library.genres[active]?.titles || [],
      search,
      stateFilter,
      watched,
      favorites
    );
  }, [library, active, search, stateFilter, watched, favorites]);

  if (!library) return null;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(20,20,28,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
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
        <main className="flex-1 p-6">
          <p className="text-xs text-[var(--muted)] mb-4">
            {library.stats.titles} titles · {library.stats.movies} movies · {library.stats.tv} TV
          </p>
          {active && (
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
          )}
        </main>
      </div>
    </LibraryShell>
  );
}

export function DirectorsView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | "watched" | "favorites">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [filmography, setFilmography] = useState<{
    owned: FilmographyItem[];
    missing: FilmographyItem[];
  } | null>(null);
  const [filmLoading, setFilmLoading] = useState(false);

  const directors = useMemo(() => {
    if (!library) return [];
    const keys = Object.keys(library.directors);
    const sorted = keys.sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return library.directors[b].count - library.directors[a].count;
    });
    return sorted;
  }, [library]);

  const active = selected || directors[0] || null;

  const titles = useMemo(() => {
    if (!library || !active) return [];
    return filterTitles(
      library.directors[active]?.titles || [],
      search,
      stateFilter,
      watched,
      favorites
    );
  }, [library, active, search, stateFilter, watched, favorites]);

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

  function selectDirector(name: string) {
    setSelected(name);
    setShowMissing(false);
    loadFilmography(name);
  }

  useEffect(() => {
    if (active && active !== "Unknown") loadFilmography(active);
  }, [active]);

  if (!library) return null;

  const ownedCount = filmography?.owned.length ?? 0;
  const missingCount = filmography?.missing.length ?? 0;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(20,20,28,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
          {directors.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => selectDirector(d)}
              className={`w-full flex justify-between px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                active === d ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]" : ""
              }`}
            >
              <span className="truncate pr-2">{d}</span>
              <span className="text-[0.72rem] text-[var(--muted)] shrink-0">{library.directors[d].count}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <p className="text-xs text-[var(--muted)] mb-4">
            {library.stats.directors} directors · generated {new Date(library.generated_at).toLocaleString()}
          </p>

          {active && active !== "Unknown" && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {filmLoading && <span className="text-xs text-[var(--muted)]">Loading filmography…</span>}
              {filmography && (
                <>
                  <span className="text-xs text-[var(--muted)]">
                    {ownedCount} in library · {missingCount} to discover
                  </span>
                  {missingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMissing((v) => !v)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        showMissing ? "border-[var(--accent2)] text-[var(--accent2)]" : "border-[var(--border)]"
                      }`}
                    >
                      {showMissing ? "Hide missing" : "Show missing films"}
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
                <span className="w-2 h-2 rounded-full bg-current" />
                Not in library ({filmography.missing.length})
              </header>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                {filmography.missing.map((item) => (
                  <MissingFilmCard key={item.tmdb_id} item={item} />
                ))}
              </div>
            </section>
          )}

          {showMissing && filmography && filmography.owned.length > 0 && (
            <section className="mt-10">
              <header className="flex items-center gap-2 mb-4 text-[var(--owned)] text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-current" />
                In library via filmography ({filmography.owned.length})
              </header>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                {filmography.owned.map((item) => (
                  <MissingFilmCard key={`owned-${item.tmdb_id}`} item={item} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
