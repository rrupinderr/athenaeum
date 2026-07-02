"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";

import type { MediaTitle, SubtitleInfo } from "@/types/library";

import { CardHoverInfo } from "./CardHoverInfo";

import { CardPosterOverlay } from "./CardPosterOverlay";

import { DirectorFilmPeek } from "./DirectorFilmPeek";

import { deleteMedia, explorePath, playPath, useLibrary } from "./LibraryProvider";

import { SubtitleModal } from "./SubtitleModal";

import { isMultiPartMovie } from "@/lib/collection";
import { openWebSearch } from "@/lib/web-search";

import { isTvSeries, seriesProgress } from "@/lib/series";

import { useCastDiscover } from "./useCastDiscover";
import { useTmdbCredits } from "./useTmdbCredits";



function normalizeSubs(sub?: SubtitleInfo): SubtitleInfo {

  if (!sub) {

    return { has_local: false, has_embedded: false, files: [], languages: [], embedded_languages: [], source: "none" };

  }

  const hasLocal = sub.has_local ?? false;

  const hasEmbedded = sub.has_embedded ?? false;

  let source = sub.source;

  if (!source) {

    if (hasLocal && hasEmbedded) source = "both";

    else if (hasLocal) source = "external";

    else if (hasEmbedded) source = "embedded";

    else source = "none";

  }

  return {

    has_local: hasLocal,

    has_embedded: hasEmbedded,

    files: sub.files || [],

    languages: sub.languages || [],

    embedded_languages: sub.embedded_languages || [],

    source,

  };

}



function getSubtitles(title: MediaTitle, overrides: Record<string, SubtitleInfo>): SubtitleInfo {

  const base = normalizeSubs(title.subtitles);

  const patch = overrides[title.id];

  if (!patch) return base;

  const hasLocal = base.has_local || patch.has_local;

  const hasEmbedded = base.has_embedded || patch.has_embedded;

  let source: SubtitleInfo["source"] = "none";

  if (hasLocal && hasEmbedded) source = "both";

  else if (hasLocal) source = "external";

  else if (hasEmbedded) source = "embedded";

  return {

    has_local: hasLocal,

    has_embedded: hasEmbedded,

    files: patch.files.length ? patch.files : base.files,

    languages: patch.languages.length ? patch.languages : base.languages,

    embedded_languages: base.embedded_languages?.length ? base.embedded_languages : patch.embedded_languages,

    source,

  };

}



function cardBorderClass(allWatched: boolean, anyFavorite: boolean, isWatched: boolean, isFav: boolean): string {

  const watched = allWatched || isWatched;

  const fav = anyFavorite || isFav;

  if (watched && fav) return "card-watched card-favorite";

  if (watched) return "card-watched";

  if (fav) return "card-favorite";

  return "border-transparent hover:border-[var(--border)]";

}



export function MediaCard({ title }: { title: MediaTitle }) {

  const router = useRouter();

  const {

    library,

    watched,

    favorites,

    toggleWatched,

    toggleFavorite,

    subtitleOverrides,

    setSubtitleOverride,

    refreshLibrary,

    toast,

  } = useLibrary();

  const { onCastClick } = useCastDiscover();

  const [subtitleOpen, setSubtitleOpen] = useState(false);

  const [hovered, setHovered] = useState(false);

  const [directorPeek, setDirectorPeek] = useState<string | null>(null);

  const credits = useTmdbCredits(title.tmdb_id ?? 0, title.type, hovered && !!title.tmdb_id);

  const hoverDirectors = title.directors?.length ? title.directors : credits?.directors;



  const tv = isTvSeries(title);

  const progress = tv ? seriesProgress(title, watched, favorites) : null;

  const isWatched = tv ? progress!.allWatched : watched.has(title.id);

  const isFav = tv ? progress!.anyFavorite : favorites.has(title.id);

  const subs = getSubtitles(title, subtitleOverrides);

  const videoPath = title.video_path || title.parts?.[0]?.path || title.episodes?.[0]?.path || title.canonical_path;

  const borderClass = cardBorderClass(

    progress?.allWatched ?? false,

    progress?.anyFavorite ?? false,

    watched.has(title.id),

    favorites.has(title.id)

  );

  const multiPart = isMultiPartMovie(title);

  async function handlePlay() {
    if (multiPart) {
      router.push(`/movies/${encodeURIComponent(title.id)}`);
      return;
    }

    const path = title.video_path || title.parts?.[0]?.path || title.episodes?.[0]?.path;

    if (!path) {

      toast("No video file found", "err");

      return;

    }

    const r = await playPath(path);

    if (r.ok) toast("Opening in VLC…");

    else toast(r.error || "Playback failed", "err");

  }



  async function handleDelete() {

    const label = title.match_title || title.title;

    const msg = tv

      ? `Delete "${label}" and its entire TV folder from disk? This cannot be undone.`

      : `Delete "${label}" and its folder from disk? This cannot be undone.`;

    if (!window.confirm(msg)) return;



    const episodePaths =
      title.episodes?.map((e) => e.path) || title.parts?.map((p) => p.path) || [];

    const r = await deleteMedia(title.id, episodePaths);

    if (!r.ok) {

      toast(r.error || "Delete failed", "err");

      return;

    }

    toast("Deleted from library");

    if (tv) router.push("/directors");

    await refreshLibrary();

  }



  function handleDirectorClick(name: string) {

    setDirectorPeek((prev) => (prev === name ? null : name));

  }



  const poster = (

    <div

      className="relative group/poster aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden"

      onMouseEnter={() => setHovered(true)}

      onMouseLeave={() => {

        if (!directorPeek) setHovered(false);

      }}

    >

      <CardPosterOverlay

        watched={isWatched}

        favorite={isFav}

        subtitles={subs}

        hideToggles={tv}

        tvProgress={tv && progress ? { watched: progress.watchedCount, total: progress.total } : undefined}

        onToggleWatched={tv ? undefined : () => toggleWatched(title.id)}

        onToggleFavorite={tv ? undefined : () => toggleFavorite(title.id)}

        onSubtitleClick={() => setSubtitleOpen(true)}

        onWebSearch={() => openWebSearch(title.title, title.year, title.type)}

        onExplore={() => explorePath(title.canonical_path)}

        onDelete={handleDelete}

      />

      {title.poster ? (

        // eslint-disable-next-line @next/next/no-img-element

        <img src={title.poster} alt="" className="w-full h-full object-cover" loading="lazy" />

      ) : (

        <span className="text-3xl opacity-30 text-[var(--muted)]">🎬</span>

      )}

      <CardHoverInfo

        directors={hoverDirectors}

        cast={credits?.cast}

        genres={title.genres}

        onDirectorClick={library ? handleDirectorClick : undefined}

        onCastClick={onCastClick}

        activeDirector={directorPeek}

        reserveToolbar

      />

      {directorPeek && library && (

        <DirectorFilmPeek

          director={directorPeek}

          currentId={title.id}

          library={library}

          onClose={() => {

            setDirectorPeek(null);

            setHovered(false);

          }}

        />

      )}

    </div>

  );



  const meta = (

    <div className="p-3">

      <h3 className="text-sm font-semibold leading-snug line-clamp-2">{title.title}</h3>

      <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1.5 flex-wrap">

        {title.year || "—"}

        {title.type === "tv" && <span className="chip-tv">TV</span>}

        {title.vote_average ? <span>· ★ {title.vote_average.toFixed(1)}</span> : null}

      </p>

    </div>

  );



  const subtitleModal = subtitleOpen && (

    <SubtitleModal

      title={title.title}

      titleId={title.id}

      videoPath={videoPath}

      subtitles={subs}

      onClose={() => setSubtitleOpen(false)}

      onDownloaded={(info, destPath) => {

        setSubtitleOverride(title.id, info);

        toast(`Saved: ${destPath.split("\\").pop() || "subtitle"}`);

      }}

    />

  );



  if (tv) {

    return (

      <>

        <Link

          href={`/tv/${encodeURIComponent(title.id)}`}

          className={`group card-hover block relative bg-[var(--surface)] rounded-xl overflow-hidden border ${borderClass}`}

          onClick={(e) => {

            if (directorPeek) e.preventDefault();

          }}

        >

          {poster}

          {meta}

        </Link>

        {subtitleModal}

      </>

    );

  }



  return (

    <>

      <article

        className={`group card-hover relative bg-[var(--surface)] rounded-xl overflow-hidden border cursor-pointer ${borderClass}`}

        onClick={() => {

          if (!directorPeek) handlePlay();

        }}

      >

        {poster}

        {meta}

      </article>

      {subtitleModal}

    </>

  );

}


