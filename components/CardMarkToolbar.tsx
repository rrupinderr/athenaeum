"use client";

import { useLibrary } from "./LibraryProvider";

export function CardMarkToolbar({
  stateId,
  tmdbUrl,
  onTmdbClick,
}: {
  stateId: string;
  tmdbUrl?: string;
  onTmdbClick?: (e: React.MouseEvent) => void;
}) {
  const { watched, favorites, toggleWatched, toggleFavorite } = useLibrary();
  const isWatched = watched.has(stateId);
  const isFav = favorites.has(stateId);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-1.5 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={isWatched ? "Mark unwatched" : "Mark watched"}
        aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
        onClick={() => toggleWatched(stateId)}
        className={`w-7 h-7 rounded-full text-xs font-bold border flex items-center justify-center ${
          isWatched
            ? "bg-[rgba(61,158,106,0.25)] border-[var(--owned)] text-[var(--owned)]"
            : "bg-black/60 border-white/20 text-white/80 hover:border-[var(--owned)]"
        }`}
      >
        ✓
      </button>
      <button
        type="button"
        title={isFav ? "Remove favorite" : "Add favorite"}
        aria-label={isFav ? "Remove favorite" : "Add favorite"}
        onClick={() => toggleFavorite(stateId)}
        className={`w-7 h-7 rounded-full text-xs font-bold border flex items-center justify-center ${
          isFav
            ? "bg-[rgba(224,69,106,0.25)] border-[var(--fav)] text-[var(--fav)]"
            : "bg-black/60 border-white/20 text-white/80 hover:border-[var(--fav)]"
        }`}
      >
        ★
      </button>
      {tmdbUrl && (
        <button
          type="button"
          title="Open on TMDB"
          aria-label="Open on TMDB"
          onClick={onTmdbClick}
          className="w-7 h-7 rounded-full text-[0.6rem] font-bold border bg-black/60 border-white/20 text-white/80 hover:border-[var(--accent2-bright)]"
        >
          TMDB
        </button>
      )}
    </div>
  );
}

export function CardMarkIcons({ stateId }: { stateId: string }) {
  const { watched, favorites } = useLibrary();
  const isWatched = watched.has(stateId);
  const isFav = favorites.has(stateId);
  if (!isWatched && !isFav) return null;

  return (
    <div className="absolute bottom-2 right-2 z-10 flex gap-1 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
      {isWatched && (
        <span className="w-5 h-5 rounded-full bg-black/70 border border-[var(--owned)] text-[var(--owned)] text-[0.55rem] font-bold flex items-center justify-center">
          ✓
        </span>
      )}
      {isFav && (
        <span className="w-5 h-5 rounded-full bg-black/70 border border-[var(--fav)] text-[var(--fav)] text-[0.55rem] font-bold flex items-center justify-center">
          ★
        </span>
      )}
    </div>
  );
}
