"use client";

import Link from "next/link";
import type { Book } from "@/types/library";
import { CardHoverInfo } from "./CardHoverInfo";
import { CardPosterOverlay } from "./CardPosterOverlay";
import { explorePath, useLibrary } from "./LibraryProvider";

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function cardBorderClass(isWatched: boolean, isFav: boolean): string {
  if (isWatched && isFav) return "card-watched card-favorite";
  if (isWatched) return "card-watched";
  if (isFav) return "card-favorite";
  return "border-transparent hover:border-[var(--border)]";
}

export function BookCard({ book }: { book: Book }) {
  const { watched, favorites, toggleWatched, toggleFavorite, bookProgress } = useLibrary();
  const isWatched = watched.has(book.id);
  const isFav = favorites.has(book.id);
  const progress = bookProgress[book.id];
  const pct = progress?.percent;
  const href = book.readable_in_browser ? `/books/read/${encodeURIComponent(book.id)}` : "#";
  const borderClass = cardBorderClass(isWatched, isFav);

  const poster = (
    <div className="relative group/poster aspect-[3/4] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden">
      <CardPosterOverlay
        watched={isWatched}
        favorite={isFav}
        readProgress={pct}
        onToggleWatched={() => toggleWatched(book.id)}
        onToggleFavorite={() => toggleFavorite(book.id)}
        onExplore={() => explorePath(book.folder_path)}
      />
      {book.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="text-center p-4">
          <span className="text-3xl font-bold text-[var(--accent2-bright)] opacity-80">{initials(book.title)}</span>
          <span className="block text-[0.65rem] text-[var(--muted)] mt-2 tracking-widest">{book.format}</span>
        </div>
      )}
      {book.author && <CardHoverInfo directors={[book.author]} />}
    </div>
  );

  const meta = (
    <div className="p-3">
      <h3 className="text-sm font-semibold leading-snug line-clamp-2">{book.title}</h3>
      <p className="text-xs text-[var(--muted)] mt-1">
        {book.format}
        {progress?.cfi && !pct ? " · Resume" : ""}
      </p>
    </div>
  );

  if (!book.readable_in_browser) {
    return (
      <article
        className={`group card-hover relative bg-[var(--surface)] rounded-xl overflow-hidden border opacity-80 ${borderClass}`}
      >
        {poster}
        {meta}
        <p className="px-3 pb-3 text-[0.65rem] text-[var(--muted)]">In-browser reading not supported</p>
      </article>
    );
  }

  return (
    <Link href={href} className={`group card-hover block relative bg-[var(--surface)] rounded-xl overflow-hidden border ${borderClass}`}>
      {poster}
      {meta}
    </Link>
  );
}
