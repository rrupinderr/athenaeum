"use client";

import { useMemo, useState } from "react";
import { BookCard } from "./BookCard";
import { LibraryShell } from "./LibraryShell";
import { useLibrary } from "./LibraryProvider";
import type { Book } from "@/types/library";

export function BooksView() {
  const { library } = useLibrary();
  const [search, setSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const authors = useMemo(() => {
    if (!library) return [];
    return Object.keys(library.books.authors).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [library]);

  const filteredAuthors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter((a) => a.toLowerCase().includes(q));
  }, [authors, search]);

  const activeAuthor = selectedAuthor || filteredAuthors[0] || null;

  const books: Book[] = useMemo(() => {
    if (!library || !activeAuthor) return [];
    return library.books.authors[activeAuthor]?.books || [];
  }, [library, activeAuthor]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, search]);

  if (!library) return null;

  return (
    <LibraryShell search={search} onSearchChange={setSearch}>
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[rgba(20,20,28,0.6)] overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14">
          {filteredAuthors.map((author) => (
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
              <span className="text-[0.72rem] text-[var(--muted)] bg-[#242433] px-2 py-0.5 rounded-full shrink-0">
                {library.books.authors[author].count}
              </span>
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <p className="text-xs text-[var(--muted)] mb-4">
            {library.stats.books} books · {library.books.authors && Object.keys(library.books.authors).length} authors
          </p>
          {activeAuthor && (
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
          )}
        </main>
      </div>
    </LibraryShell>
  );
}
