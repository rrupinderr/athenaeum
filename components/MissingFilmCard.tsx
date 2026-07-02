"use client";

import { useState } from "react";
import { isItemFavorite, isItemWatched } from "@/lib/filters";
import { resolveFilmographyStateId } from "@/lib/tmdb-match";
import { buildWebSearchUrl } from "@/lib/web-search";
import { CardHoverInfo } from "./CardHoverInfo";
import { CardMarkIcons, CardMarkToolbar } from "./CardMarkToolbar";
import type { FilmographyItem } from "@/types/library";
import { playPath, useLibrary } from "./LibraryProvider";
import { useDirectorNavigation } from "./useDirectorNavigation";
import { useCastDiscover } from "./useCastDiscover";
import { useTmdbCredits } from "./useTmdbCredits";

export function MissingFilmCard({ item }: { item: FilmographyItem }) {
  const { watched, favorites, toast } = useLibrary();
  const { onDirectorClick } = useDirectorNavigation();
  const { onCastClick } = useCastDiscover();
  const [hovered, setHovered] = useState(false);
  const credits = useTmdbCredits(item.tmdb_id, "movie", hovered);
  const stateId = resolveFilmographyStateId(item);
  const isWatched = isItemWatched(stateId, watched, item.tmdb_id, "movie");
  const isFav = isItemFavorite(stateId, favorites, item.tmdb_id, "movie");

  async function handleClick() {
    if (item.in_library && item.video_path) {
      const r = await playPath(item.video_path);
      if (r.ok) toast("Opening in VLC…");
      else toast(r.error || "Playback failed", "err");
      return;
    }
    window.open(buildWebSearchUrl(item.title, item.year, "movie"), "_blank", "noopener,noreferrer");
  }

  function openTmdb(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(item.tmdb_url, "_blank", "noopener,noreferrer");
  }

  const borderClass = item.in_library
    ? "border-[rgba(61,158,106,0.35)]"
    : isWatched
      ? "border-[var(--owned)]"
      : isFav
        ? "border-[var(--fav)]"
        : "border-dashed border-[var(--accent2-bright)] hover:border-[var(--accent2-bright)]";

  return (
    <article
      className={`card-hover group relative rounded-xl overflow-hidden border cursor-pointer bg-[var(--surface)] ${borderClass}`}
      onClick={handleClick}
      onContextMenu={openTmdb}
      aria-label={item.in_library ? `Play ${item.title}` : `Search 1337x for ${item.title}`}
    >
      <span
        className={`absolute top-2 left-2 z-10 badge-pill ${
          item.in_library ? "badge-watched" : "badge-cc-none"
        }`}
      >
        {item.in_library ? "In library" : "Not in library"}
      </span>

      <div
        className={`relative group/poster aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden ${
          !item.in_library ? "card-not-in-library" : ""
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster} alt="" className="w-full h-full object-cover poster-wrap" loading="lazy" />
        ) : (
          <span className="text-3xl opacity-30">🎬</span>
        )}
        <CardHoverInfo
          directors={credits?.directors}
          cast={credits?.cast}
          onDirectorClick={onDirectorClick}
          onCastClick={onCastClick}
          reserveToolbar
        />
        <CardMarkToolbar stateId={stateId} tmdbUrl={item.tmdb_url} onTmdbClick={openTmdb} />
        <CardMarkIcons stateId={stateId} />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1">{item.year || "—"}</p>
      </div>
    </article>
  );
}
