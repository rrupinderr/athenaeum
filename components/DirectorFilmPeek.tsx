"use client";

import Link from "next/link";
import type { LibraryData, MediaTitle } from "@/types/library";
import { isTvSeries } from "@/lib/series";

export function DirectorFilmPeek({
  director,
  currentId,
  library,
  onClose,
}: {
  director: string;
  currentId: string;
  library: LibraryData;
  onClose: () => void;
}) {
  const bucket = library.directors[director];
  const titles = (bucket?.titles || []).filter((t) => t.id !== currentId).slice(0, 8);

  if (!titles.length) {
    return (
      <div
        className="director-film-peek absolute inset-x-0 bottom-0 z-[25] px-2.5 py-2 bg-black/95 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[0.62rem] text-white/70 mb-1">No other titles by {director} in library.</p>
        <Link
          href={`/directors?d=${encodeURIComponent(director)}`}
          className="text-[0.62rem] text-[var(--accent2-bright)] hover:underline"
          onClick={onClose}
        >
          Open director view →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="director-film-peek absolute inset-x-0 bottom-0 z-[25] px-2 py-2.5 bg-black/95 border-t border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[0.58rem] uppercase tracking-wide text-white/55 truncate">
          More by {director}
        </p>
        <Link
          href={`/directors?d=${encodeURIComponent(director)}`}
          className="text-[0.58rem] text-[var(--accent2-bright)] hover:underline shrink-0"
          onClick={onClose}
        >
          View all
        </Link>
      </div>
      <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
        {titles.map((t) => (
          <PeekTile key={t.id} title={t} onNavigate={onClose} />
        ))}
      </div>
    </div>
  );
}

function PeekTile({ title, onNavigate }: { title: MediaTitle; onNavigate: () => void }) {
  const href = isTvSeries(title) ? `/tv/${encodeURIComponent(title.id)}` : null;
  const inner = (
    <>
      <div className="w-11 h-[4.125rem] rounded overflow-hidden bg-[var(--surface2)] shrink-0">
        {title.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={title.poster} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm opacity-40">🎬</div>
        )}
      </div>
      <p className="text-[0.55rem] text-white/85 line-clamp-2 leading-tight mt-1">{title.title}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="w-11 shrink-0 hover:opacity-90" onClick={onNavigate}>
        {inner}
      </Link>
    );
  }

  return <div className="w-11 shrink-0">{inner}</div>;
}
