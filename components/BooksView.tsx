"use client";

import { useMemo, useState } from "react";
import { matchesStateFilter, type StateFilter } from "@/lib/filters";
import { searchBooks, sidebarMatchCounts } from "@/lib/search";
import { BookCard } from "./BookCard";
import { GlobalSearchResults } from "./GlobalSearchResults";
import { LibraryShell } from "./LibraryShell";
import { useLibrary } from "./LibraryProvider";
import type { Book } from "@/types/library";

export function BooksView() {
  const { library, watched, favorites } = useLibrary();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const globalMode = search.trim().length >= 2;

  const authors = useMemo(() => {
    if (!library) return [];
    const keys = Object.keys(library.books.authors).sort((a, b) => a.localeCompare(b));
    if (!globalMode) return keys;
    const counts = sidebarMatchCounts(library, search, "books");
    return keys.filter((k) => counts[k] > 0);
  }, [library, search, globalMode]);

  const activeAuthor = selectedAuthor || authors[0] || null;

  const globalHits = useMemo(
    () => (library && globalMode ? searchBooks(library, search) : []),
    [library, search, globalMode]
  );

  const filteredGlobalHits = useMemo(() => {
    return globalHits.filter((h) => matchesStateFilter(h.id, stateFilter, watched, favorites));
  }, [globalHits, stateFilter, watched, favorites]);

  const books: Book[] = useMemo(() => {
    if (!library || !activeAuthor || globalMode) return [];
    return library.books.authors[activeAuthor]?.books || [];
  }, [library, activeAuthor, globalMode]);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (!globalMode) {
      const q = search.trim().toLowerCase();
      if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    }
    return list.filter((b) => matchesStateFilter(b.id, stateFilter, watched, favorites));
  }, [books, search, stateFilter, watched, favorites, globalMode]);

  if (!library) return null;

  return (
    <LibraryShell
      search={search}
      onSearchChange={setSearch}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
    >
      <div className="flex min-h-[calc(100vh-56px)]">
        {!globalMode && (
          <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(13,21,38,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
            {authors.map((author) => (
              <button
                key={author}
                type="button"
                onClick={() => setSelectedAuthor(author)}
                className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm border-b border-[var(--border)]/60 hover:bg-[var(--surface2)] ${
                  activeAuthor === author
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

        <main className="flex-1 p-6 overflow-y-auto">
          <p className="text-xs text-[var(--muted)] mb-4">
            {library.stats.books} books · {Object.keys(library.books.authors).length} authors
          </p>
          {globalMode ? (
            <GlobalSearchResults hits={filteredGlobalHits} query={search.trim()} mode="books" />
          ) : (
            activeAuthor && (
              <section>
                <header className="flex items-baseline gap-2 mb-4 pb-2 border-b border-[var(--border)]">
                  <h2 className="text-xl font-semibold">{activeAuthor}</h2>
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
            )
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
