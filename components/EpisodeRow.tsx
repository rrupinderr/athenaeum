"use client";

import type { Episode } from "@/types/library";
import { episodeId } from "@/lib/series";
import { playPath, useLibrary } from "./LibraryProvider";

export function EpisodeRow({
  seriesId,
  episode,
}: {
  seriesId: string;
  episode: Episode;
}) {
  const { watched, favorites, toggleWatched, toggleFavorite, toast } = useLibrary();
  const eid = episodeId(seriesId, episode.path);
  const isWatched = watched.has(eid);
  const isFav = favorites.has(eid);
  const filename = episode.path.split(/[/\\]/).pop() || episode.path;

  async function play() {
    const r = await playPath(episode.path);
    if (r.ok) toast(`Playing ${episode.label}`);
    else toast(r.error || "Playback failed", "err");
  }

  return (
    <li className="episode-row flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]/50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{episode.label}</p>
        <p className="text-xs text-[var(--muted)] truncate">{filename}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={play}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)] transition-colors"
        >
          Play
        </button>
        <button
          type="button"
          title={isWatched ? "Mark unwatched" : "Mark watched"}
          aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
          onClick={() => toggleWatched(eid)}
          className={`badge-icon ${isWatched ? "badge-watched" : ""}`}
        >
          ✓
        </button>
        <button
          type="button"
          title={isFav ? "Remove favorite" : "Add favorite"}
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
          onClick={() => toggleFavorite(eid)}
          className={`badge-icon ${isFav ? "badge-fav" : ""}`}
        >
          ★
        </button>
      </div>
    </li>
  );
}
