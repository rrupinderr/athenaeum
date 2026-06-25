"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Book } from "@/types/library";

const EpubReaderClient = dynamic(() => import("./EpubReaderClient"), { ssr: false });

export function BookReaderPage({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((lib) => {
        for (const key of Object.keys(lib.books?.authors || {})) {
          const found = lib.books.authors[key].books?.find((b: Book) => b.id === bookId);
          if (found) {
            setBook(found);
            return;
          }
        }
        setError("Book not found");
      })
      .catch(() => setError("Failed to load book"));
  }, [bookId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-300">{error}</p>
        <Link href="/books" className="text-[var(--accent2)] text-sm">
          ← Back to books
        </Link>
      </div>
    );
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading…</div>;
  }

  const fileUrl = `/api/books/file?id=${encodeURIComponent(book.id)}`;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <Link href="/books" className="text-sm text-[var(--accent2)]">
          ← Library
        </Link>
        <div className="min-w-0">
          <h1 className="font-semibold truncate">{book.title}</h1>
          <p className="text-xs text-[var(--muted)]">{book.author} · {book.format}</p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {book.format === "EPUB" && <EpubReaderClient bookId={book.id} url={fileUrl} title={book.title} />}
        {book.format === "PDF" && (
          <iframe src={fileUrl} title={book.title} className="w-full h-[calc(100vh-56px)] border-0 bg-white" />
        )}
        {!book.readable_in_browser && (
          <div className="p-8 text-center text-[var(--muted)]">
            This format can&apos;t be read in-browser.
          </div>
        )}
      </div>
    </div>
  );
}
