"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  filterByDirector,
  filterByGenre,
  matchesMediaStateFilter,
  matchesTypeFilter,
  type StateFilter,
  type TypeFilter,
} from "@/lib/filters";
import { allGenreLabels, genreBucketCount } from "@/lib/genres";
import { collectMedia, filterMediaByQuery, filterSidebarLabels } from "@/lib/search";
import { CategoryChips } from "./CategoryChips";
import { LibraryShell } from "./LibraryShell";
import { MediaCard } from "./MediaCard";
import { MissingFilmCard } from "./MissingFilmCard";
import { useLibrary } from "./LibraryProvider";
import { MovieRouletteModal } from "./MovieRouletteModal";
import { getRoulettePool } from "@/lib/roulette";
import { WebSearchIcon } from "./icons/WebSearchIcon";
import type { FilmographyItem, MediaTitle } from "@/types/library";

function filterTitles(
  titles: MediaTitle[],
  stateFilter: StateFilter,
  typeFilter: TypeFilter,
  watched: Set<string>,
  favorites: Set<string>
) {
  return titles
    .filter((t) => matchesTypeFilter(t.type, typeFilter))
    .filter((t) => matchesMediaStateFilter(t, stateFilter, watched, favorites));
}

function SidebarButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex justify-between px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
        active ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]" : ""
      }`}
    >
      <span className="truncate pr-2">{label}</span>
      <span className="text-[0.72rem] text-[var(--muted)] shrink-0">{count}</span>
    </button>
  );
}

export function GenresView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [directorChip, setDirectorChip] = useState<string | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);

  const genres = useMemo(() => {
    if (!library) return [];
    return allGenreLabels(library.genres);
  }, [library]);

  const sidebarGenres = useMemo(() => filterSidebarLabels(genres, search), [genres, search]);

  const directors = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.directors)
      .filter((d) => d !== "Unknown")
      .sort((a, b) => library.directors[b].count - library.directors[a].count);
  }, [library]);

  const allCount = useMemo(() => (library ? collectMedia(library).length : 0), [library]);

  const titles = useMemo(() => {
    if (!library) return [];
    let list =
      selectedGenre === null
        ? collectMedia(library)
        : library.genres[selectedGenre]?.titles || [];
    list = filterByDirector(list, directorChip);
    list = filterTitles(list, stateFilter, typeFilter, watched, favorites);
    return filterMediaByQuery(list, search);
  }, [library, selectedGenre, directorChip, stateFilter, typeFilter, watched, favorites, search]);

  const roulettePool = useMemo(
    () =>
      library
        ? getRoulettePool(library, { genre: selectedGenre, stateFilter, watched, favorites })
        : [],
    [library, selectedGenre, stateFilter, watched, favorites]
  );

  if (!library) return null;

  const headerLabel = selectedGenre ?? "All";

  const rouletteScope = selectedGenre
    ? `Movies in ${selectedGenre} (${roulettePool.length})`
    : `All movies (${roulettePool.length})`;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search library… (Enter for TMDB)"
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      showTypeFilter
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="custom-scrollbar w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
          <SidebarButton
            label="All"
            count={allCount}
            active={selectedGenre === null}
            onClick={() => setSelectedGenre(null)}
          />
          {sidebarGenres.map((g) => (
            <SidebarButton
              key={g}
              label={g}
              count={genreBucketCount(library.genres, g)}
              active={selectedGenre === g}
              onClick={() => setSelectedGenre(g)}
            />
          ))}
          {search.trim() && sidebarGenres.length === 0 && (
            <p className="px-4 py-6 text-xs text-[var(--muted)]">No genres match &ldquo;{search.trim()}&rdquo;</p>
          )}
        </aside>
        <main className="custom-scrollbar flex-1 p-6 overflow-y-auto">
          <div
            className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-4 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] chip-scroll-bar"
            style={{ ["--scroll-fade" as string]: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
          >
            <CategoryChips
              label="Genres"
              options={sidebarGenres}
              active={selectedGenre}
              onChange={setSelectedGenre}
            />
            <CategoryChips
              label="Directors"
              options={directors}
              active={directorChip}
              onChange={setDirectorChip}
            />
          </div>
          <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <h2 className="text-xl font-semibold">{headerLabel}</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
              {titles.length}
            </span>
            <button
              type="button"
              onClick={() => {
                if (roulettePool.length === 0) {
                  window.alert("No movies in this selection.");
                  return;
                }
                setRouletteOpen(true);
              }}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--accent2-bright)] text-[var(--accent2-bright)] hover:bg-[rgba(61,158,106,0.12)]"
            >
              Roulette
            </button>
          </header>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
            {titles.map((t) => (
              <MediaCard key={t.id} title={t} />
            ))}
          </div>
        </main>
      </div>
      <MovieRouletteModal
        open={rouletteOpen}
        onClose={() => setRouletteOpen(false)}
        pool={roulettePool}
        scopeLabel={rouletteScope}
      />
    </LibraryShell>
  );
}

export function DirectorsView() {
  const searchParams = useSearchParams();
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null);
  const [genreChip, setGenreChip] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [filmography, setFilmography] = useState<{ owned: FilmographyItem[]; missing: FilmographyItem[] } | null>(
    null
  );
  const [filmLoading, setFilmLoading] = useState(false);

  const directors = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.directors).sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return library.directors[b].count - library.directors[a].count;
    });
  }, [library]);

  const sidebarDirectors = useMemo(() => filterSidebarLabels(directors, search), [directors, search]);

  const genres = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.genres).sort(
      (a, b) => library.genres[b].count - library.genres[a].count
    );
  }, [library]);

  const allCount = useMemo(() => (library ? collectMedia(library).length : 0), [library]);

  const titles = useMemo(() => {
    if (!library) return [];
    let list =
      selectedDirector === null
        ? collectMedia(library)
        : library.directors[selectedDirector]?.titles || [];
    list = filterByGenre(list, genreChip);
    list = filterTitles(list, stateFilter, typeFilter, watched, favorites);
    return filterMediaByQuery(list, search);
  }, [library, selectedDirector, genreChip, stateFilter, typeFilter, watched, favorites, search]);

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
    const d = searchParams.get("d");
    if (d) setSelectedDirector(d);
  }, [searchParams]);

  useEffect(() => {
    if (selectedDirector && selectedDirector !== "Unknown") {
      loadFilmography(selectedDirector);
    } else {
      setFilmography(null);
      setShowMissing(false);
    }
  }, [selectedDirector]);

  if (!library) return null;

  const missingCount = filmography?.missing.length ?? 0;
  const headerLabel = selectedDirector ?? "All";
  const directorChips = sidebarDirectors.filter((d) => d !== "Unknown");

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search library… (Enter for TMDB)"
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      showTypeFilter
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="custom-scrollbar w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
          <SidebarButton
            label="All"
            count={allCount}
            active={selectedDirector === null}
            onClick={() => {
              setSelectedDirector(null);
              setShowMissing(false);
            }}
          />
          {sidebarDirectors.map((d) => (
            <SidebarButton
              key={d}
              label={d}
              count={library.directors[d].count}
              active={selectedDirector === d}
              onClick={() => {
                setSelectedDirector(d);
                setShowMissing(false);
              }}
            />
          ))}
          {search.trim() && sidebarDirectors.length === 0 && (
            <p className="px-4 py-6 text-xs text-[var(--muted)]">No directors match &ldquo;{search.trim()}&rdquo;</p>
          )}
        </aside>

        <main className="custom-scrollbar flex-1 p-6 overflow-y-auto">
          <div
            className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-4 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] chip-scroll-bar"
            style={{ ["--scroll-fade" as string]: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
          >
            <CategoryChips
              label="Directors"
              options={directorChips}
              active={selectedDirector}
              onChange={(d) => {
                setSelectedDirector(d);
                setShowMissing(false);
              }}
            />
            <CategoryChips label="Genres" options={genres} active={genreChip} onChange={setGenreChip} />
          </div>

          {selectedDirector && selectedDirector !== "Unknown" && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
              {filmLoading && <span className="text-xs text-[var(--muted)]">Loading filmography…</span>}
              {filmography && (
                <>
                  <span className="text-xs text-[var(--muted)]">
                    {filmography.owned.length} in library · {missingCount} to discover
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
                      {showMissing ? "Hide missing films" : "Show missing films"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <section className="mb-10">
            <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
              <h2 className="text-xl font-semibold">{headerLabel}</h2>
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

          {showMissing && filmography && filmography.missing.length > 0 && (
            <section>
              <header className="flex items-center gap-2 mb-4 text-[var(--missing)] text-sm font-semibold">
                <WebSearchIcon size={16} className="text-[var(--accent2-bright)]" />
                Not in library ({filmography.missing.length})
              </header>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                {filmography.missing.map((item) => (
                  <MissingFilmCard key={item.tmdb_id} item={item} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
