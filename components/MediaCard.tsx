"use client";

import { useState } from "react";
import type { MediaTitle, SubtitleInfo } from "@/types/library";
import { WebSearchIcon } from "./icons/WebSearchIcon";
import { explorePath, playPath, useLibrary } from "./LibraryProvider";
import { EpisodeModal } from "./EpisodeModal";
import { SubtitleModal } from "./SubtitleModal";
import { StatusBadges } from "./StatusBadges";
import { openWebSearch } from "@/lib/web-search";

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

export function MediaCard({ title }: { title: MediaTitle }) {
  const { watched, favorites, toggleWatched, toggleFavorite, subtitleOverrides, setSubtitleOverride, toast } =
    useLibrary();
  const [episodeOpen, setEpisodeOpen] = useState(false);
  const [subtitleOpen, setSubtitleOpen] = useState(false);

  const isWatched = watched.has(title.id);
  const isFav = favorites.has(title.id);
  const subs = getSubtitles(title, subtitleOverrides);
  const videoPath = title.video_path || title.episodes?.[0]?.path || title.canonical_path;

  async function handlePlay() {
    if (title.type === "tv" && title.episodes && title.episodes.length > 1) {
      setEpisodeOpen(true);
      return;
    }
    const path = title.video_path || title.episodes?.[0]?.path;
    if (!path) {
      toast("No video file found", "err");
      return;
    }
    const r = await playPath(path);
    if (r.ok) toast("Opening in VLC…");
    else toast(r.error || "Playback failed", "err");
  }

  return (
    <>
      <article
        className={`group card-hover relative bg-[var(--surface)] rounded-xl overflow-hidden border cursor-pointer ${
          isFav ? "border-[rgba(224,69,106,0.4)]" : "border-transparent hover:border-[var(--border)]"
        }`}
        onClick={handlePlay}
      >
        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className={`w-7 h-7 rounded-lg border text-xs bg-[rgba(7,11,20,0.9)] ${
              isWatched ? "text-[var(--owned)] border-[rgba(61,158,106,0.45)]" : "text-[var(--muted)] border-white/10"
            }`}
            title="Mark watched"
            onClick={(e) => {
              e.stopPropagation();
              toggleWatched(title.id);
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
              toggleFavorite(title.id);
            }}
          >
            ★
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-lg border text-xs bg-[rgba(7,11,20,0.9)] text-[var(--accent2-bright)] border-white/10 hover:text-[var(--accent)] flex items-center justify-center"
            title="Search the web"
            onClick={(e) => {
              e.stopPropagation();
              openWebSearch(title.title, title.year, title.type);
            }}
          >
            <WebSearchIcon size={14} />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-lg border text-xs bg-[rgba(7,11,20,0.9)] text-[var(--muted)] border-white/10"
            title="Open folder"
            onClick={(e) => {
              e.stopPropagation();
              explorePath(title.canonical_path);
            }}
          >
            📁
          </button>
        </div>

        <StatusBadges
          watched={isWatched}
          favorite={isFav}
          subtitles={subs}
          onSubtitleClick={() => setSubtitleOpen(true)}
        />

        <div className="aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden">
          {title.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={title.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-3xl opacity-30 text-[var(--muted)]">🎬</span>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{title.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1.5 flex-wrap">
            {title.year || "—"}
            {title.type === "tv" && <span className="chip-tv">TV</span>}
            {title.vote_average ? <span>· ★ {title.vote_average.toFixed(1)}</span> : null}
          </p>
        </div>
      </article>

      {episodeOpen && title.episodes && (
        <EpisodeModal title={title.title} episodes={title.episodes} onClose={() => setEpisodeOpen(false)} />
      )}

      {subtitleOpen && (
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
      )}
    </>
  );
}
