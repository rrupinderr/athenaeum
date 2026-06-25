"use client";

import Link from "next/link";
import type { Book } from "@/types/library";

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BookCard({ book }: { book: Book }) {
  const href = book.readable_in_browser ? `/books/read/${encodeURIComponent(book.id)}` : "#";

  const inner = (
    <>
      <div className="aspect-[3/4] bg-gradient-to-br from-[#1a1a28] to-[#252538] flex items-center justify-center overflow-hidden">
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="text-center p-4">
            <span className="text-3xl font-bold text-[var(--accent2)] opacity-80">
              {initials(book.title)}
            </span>
            <span className="block text-[0.65rem] text-[var(--muted)] mt-2 tracking-widest">
              {book.format}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1">{book.format}</p>
      </div>
    </>
  );

  if (!book.readable_in_browser) {
    return (
      <article className="card-hover bg-[var(--surface)] rounded-xl overflow-hidden border border-transparent opacity-80">
        {inner}
        <p className="px-3 pb-3 text-[0.65rem] text-[var(--muted)]">In-browser reading not supported</p>
      </article>
    );
  }

  return (
    <Link
      href={href}
      className="card-hover block bg-[var(--surface)] rounded-xl overflow-hidden border border-transparent hover:border-[var(--border)]"
    >
      {inner}
    </Link>
  );
}
