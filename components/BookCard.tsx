"use client";

import Link from "next/link";
import type { Book } from "@/types/library";
import { useLibrary } from "./LibraryProvider";

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BookCard({ book }: { book: Book }) {
  const { watched, favorites, toggleWatched, toggleFavorite, bookProgress } = useLibrary();
  const isWatched = watched.has(book.id);
  const isFav = favorites.has(book.id);
  const progress = bookProgress[book.id];
  const pct = progress?.percent;
  const href = book.readable_in_browser ? `/books/read/${encodeURIComponent(book.id)}` : "#";

  const badges = (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
      <div className="flex gap-1 flex-wrap justify-end pointer-events-auto">
        {isWatched && (
          <span className="badge-pill badge-watched" title="Read">
            ✓ Read
          </span>
        )}
        {isFav && (
          <span className="badge-pill badge-fav" title="Favorite">
            ★ Fav
          </span>
        )}
        {pct != null && pct > 0 && (
          <span className="badge-pill badge-cc-embed" title="Reading progress">
            {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );

  const actions = (
    <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        className={`w-7 h-7 rounded-lg border text-xs bg-[rgba(7,11,20,0.9)] ${
          isWatched ? "text-[var(--owned)] border-[rgba(61,158,106,0.45)]" : "text-[var(--muted)] border-white/10"
        }`}
        title="Mark read"
        onClick={(e) => {
          e.stopPropagation();
          toggleWatched(book.id);
        }}
      >
        ✓
      </button>
      <button
        type="button"
        className={`w-7 h-7 rounded-lg border text-xs bg-[rgba(7,11,20,0.9)] ${
          isFav ? "text-[var(--fav)] border-[rgba(224,69,106,0.45)]" : "text-[var(--muted)] border-white/10"
        }`}
        title="Favorite"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(book.id);
        }}
      >
        ★
      </button>
    </div>
  );

  const inner = (
    <>
      {badges}
      {actions}
      <div className="aspect-[3/4] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden">
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="text-center p-4">
            <span className="text-3xl font-bold text-[var(--accent2-bright)] opacity-80">{initials(book.title)}</span>
            <span className="block text-[0.65rem] text-[var(--muted)] mt-2 tracking-widest">{book.format}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          {book.format}
          {progress?.cfi && !pct ? " · Resume" : ""}
        </p>
      </div>
    </>
  );

  if (!book.readable_in_browser) {
    return (
      <article className="group card-hover relative bg-[var(--surface)] rounded-xl overflow-hidden border border-transparent opacity-80">
        {inner}
        <p className="px-3 pb-3 text-[0.65rem] text-[var(--muted)]">In-browser reading not supported</p>
      </article>
    );
  }

  return (
    <Link
      href={href}
      className={`group card-hover block relative bg-[var(--surface)] rounded-xl overflow-hidden border hover:border-[var(--border)] ${
        isFav ? "border-[rgba(224,69,106,0.4)]" : "border-transparent"
      }`}
    >
      {inner}
    </Link>
  );
}
