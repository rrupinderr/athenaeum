"use client";

import { useState } from "react";
import type { MediaTitle, TmdbSearchResult } from "@/types/library";
import { isMultiPartMovie, playPathForTitle } from "@/lib/collection";
import { isItemFavorite, isItemWatched } from "@/lib/filters";
import { resolveStateId } from "@/lib/tmdb-match";
import { build1337xSearchUrl } from "@/lib/web-search";
import { CardHoverInfo } from "./CardHoverInfo";
import { CardMarkIcons, CardMarkToolbar } from "./CardMarkToolbar";
import { MediaCard } from "./MediaCard";
import { playPath, useLibrary } from "./LibraryProvider";
import { useDirectorNavigation } from "./useDirectorNavigation";
import { useCastDiscover } from "./useCastDiscover";
import { useTmdbCredits } from "./useTmdbCredits";

export function TmdbResultCard({
  result,
  localTitle,
}: {
  result: TmdbSearchResult;
  localTitle: MediaTitle | null;
}) {
  const { watched, favorites, toast } = useLibrary();
  const { onDirectorClick } = useDirectorNavigation();
  const { onCastClick } = useCastDiscover();
  const [hovered, setHovered] = useState(false);
  const credits = useTmdbCredits(result.tmdb_id, result.type, hovered);
  const owned = localTitle != null;
  const stateId = resolveStateId(localTitle, result);
  const isWatched = isItemWatched(stateId, watched, result.tmdb_id, result.type);
  const isFav = isItemFavorite(stateId, favorites, result.tmdb_id, result.type);
  const tmdbUrl = `https://www.themoviedb.org/${result.type}/${result.tmdb_id}`;

  async function handleClick() {
    if (owned && localTitle) {
      if (isMultiPartMovie(localTitle)) {
        window.location.href = `/movies/${encodeURIComponent(localTitle.id)}`;
        return;
      }
      const path = playPathForTitle(localTitle);
      if (path) {
        const r = await playPath(path);
        if (r.ok) toast("Opening in VLC…");
        else toast(r.error || "Playback failed", "err");
      }
      return;
    }
    window.open(build1337xSearchUrl(result.title, result.year), "_blank", "noopener,noreferrer");
  }

  function openTmdb(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(tmdbUrl, "_blank", "noopener,noreferrer");
  }

  const borderClass = owned
    ? "border-[rgba(61,158,106,0.45)]"
    : isWatched
      ? "border-[var(--owned)]"
      : isFav
        ? "border-[var(--fav)]"
        : "border-dashed border-[var(--accent2-bright)]";

  return (
    <article
      className={`card-hover group relative rounded-xl overflow-hidden border cursor-pointer bg-[var(--surface)] ${borderClass}`}
      onClick={handleClick}
      aria-label={owned ? `Play ${result.title}` : `Search 1337x for ${result.title}`}
    >
      <span
        className={`absolute top-2 left-2 z-10 badge-pill ${owned ? "badge-watched" : "badge-cc-none"}`}
      >
        {owned ? "In library" : "Discover"}
      </span>

      <div
        className={`relative group/poster aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden ${
          !owned ? "card-not-in-library" : ""
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {result.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.poster} alt="" className="w-full h-full object-cover poster-wrap" loading="lazy" />
        ) : (
          <span className="text-3xl opacity-30">{result.type === "tv" ? "📺" : "🎬"}</span>
        )}
        <CardHoverInfo
          directors={credits?.directors}
          cast={credits?.cast}
          onDirectorClick={onDirectorClick}
          onCastClick={onCastClick}
          reserveToolbar
        />
        <CardMarkToolbar stateId={stateId} tmdbUrl={tmdbUrl} onTmdbClick={openTmdb} />
        <CardMarkIcons stateId={stateId} />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{result.title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          {result.year || "—"}
          {result.vote_average != null && (
            <span className="ml-2 text-[var(--accent2-bright)]">★ {result.vote_average.toFixed(1)}</span>
          )}
        </p>
      </div>
    </article>
  );
}

export function TmdbOwnedCard({ title }: { title: MediaTitle }) {
  return <MediaCard title={title} />;
}
