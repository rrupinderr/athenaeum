"use client";

import { useMemo, useState } from "react";
import { filterByFormat, matchesStateFilter, type StateFilter } from "@/lib/filters";
import { collectBooks, searchBooks, sidebarMatchCounts } from "@/lib/search";
import { BookCard } from "./BookCard";
import { CategoryChips } from "./CategoryChips";
import { GlobalSearchResults } from "./GlobalSearchResults";
import { LibraryShell } from "./LibraryShell";
import { useLibrary } from "./LibraryProvider";
import type { Book } from "@/types/library";

const FORMATS = ["EPUB", "PDF"];

export function BooksView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [formatChip, setFormatChip] = useState<string | null>(null);

  const globalMode = search.trim().length >= 2;

  const authors = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.books.authors).sort((a, b) => a.localeCompare(b));
  }, [library]);

  const sidebarAuthors = useMemo(() => {
    if (!globalMode) return authors;
    const counts = sidebarMatchCounts(library!, search, "books");
    return authors.filter((a) => counts[a] > 0);
  }, [library, authors, search, globalMode]);

  const allCount = useMemo(() => (library ? collectBooks(library).length : 0), [library]);

  const globalHits = useMemo(
    () => (library && globalMode ? searchBooks(library, search) : []),
    [library, search, globalMode]
  );

  const filteredGlobalHits = useMemo(() => {
    return globalHits.filter((h) => matchesStateFilter(h.id, stateFilter, watched, favorites));
  }, [globalHits, stateFilter, watched, favorites]);

  const filteredBooks: Book[] = useMemo(() => {
    if (!library || globalMode) return [];
    let list = selectedAuthor === null ? collectBooks(library) : library.books.authors[selectedAuthor]?.books || [];
    list = filterByFormat(list, formatChip);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    return list.filter((b) => matchesStateFilter(b.id, stateFilter, watched, favorites));
  }, [
    library,
    selectedAuthor,
    formatChip,
    search,
    stateFilter,
    watched,
    favorites,
    globalMode,
  ]);

  if (!library) return null;

  const headerLabel = selectedAuthor ?? "All";

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        {!globalMode && (
          <aside className="custom-scrollbar w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
            <button
              type="button"
              onClick={() => setSelectedAuthor(null)}
              className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                selectedAuthor === null
                  ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]"
                  : ""
              }`}
            >
              <span className="truncate pr-2">All</span>
              <span className="text-[0.72rem] text-[var(--muted)] bg-[var(--surface3)] px-2 py-0.5 rounded-full shrink-0">
                {allCount}
              </span>
            </button>
            {sidebarAuthors.map((author) => (
              <button
                key={author}
                type="button"
                onClick={() => setSelectedAuthor(author)}
                className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                  selectedAuthor === author
                    ? "bg-[var(--surface2)] border-l-[3px] border-l-[var(--accent)] pl-[13px]"
                    : ""
                }`}
              >
                <span className="truncate pr-2">{author}</span>
                <span className="text-[0.72rem] text-[var(--muted)] bg-[var(--surface3)] px-2 py-0.5 rounded-full shrink-0">
                  {library.books.authors[author].count}
                </span>
              </button>
            ))}
          </aside>
        )}

        <main className="custom-scrollbar flex-1 p-6 overflow-y-auto">
          <p className="text-xs text-[var(--muted)] mb-4">
            {library.stats.books} books · {Object.keys(library.books.authors).length} authors
          </p>
          {globalMode ? (
            <GlobalSearchResults hits={filteredGlobalHits} query={search.trim()} mode="books" />
          ) : (
            <>
              <div
                className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-4 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] chip-scroll-bar"
                style={{ ["--scroll-fade" as string]: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
              >
                <CategoryChips
                  label="Authors"
                  options={authors}
                  active={selectedAuthor}
                  onChange={setSelectedAuthor}
                />
                <CategoryChips label="Format" options={FORMATS} active={formatChip} onChange={setFormatChip} />
              </div>
              <section>
                <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
                  <h2 className="text-xl font-semibold">{headerLabel}</h2>
                  <span className="text-xs text-[var(--muted)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
                    {filteredBooks.length}
                  </span>
                </header>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
                  {filteredBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
